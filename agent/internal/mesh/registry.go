package mesh

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"strings"
	"time"
)

// Manifest types a pushed image can have (BuildKit pushes OCI indexes).
const manifestTypes = "application/vnd.oci.image.index.v1+json, application/vnd.oci.image.manifest.v1+json, " +
	"application/vnd.docker.distribution.manifest.list.v2+json, application/vnd.docker.distribution.manifest.v2+json"

// DeleteTags removes these repo:tag images from the built-in registry
// (`registry.delete`), then garbage-collects to free their space. A digest
// still used by a tag that isn't being deleted is left alone, so rollbacks to
// kept releases keep working.
func (m *Mesh) DeleteTags(ctx context.Context, tags []string) (map[string]any, error) {
	m.mu.Lock()
	reg := m.registry
	m.mu.Unlock()
	if reg == nil {
		return map[string]any{"skipped": "this server doesn't run the registry"}, nil
	}
	client := &registryClient{
		base: "http://" + reg.Listen, user: reg.Username, password: reg.Password,
		http: &http.Client{Timeout: 30 * time.Second},
	}

	doomed := map[string][]string{} // repo → tags
	for _, tag := range tags {
		repo, name, ok := strings.Cut(tag, ":")
		if ok && repo != "" && name != "" {
			doomed[repo] = append(doomed[repo], name)
		}
	}

	deleted := 0
	for repo, names := range doomed {
		all, err := client.tags(ctx, repo)
		if err != nil {
			return nil, err
		}
		digests := map[string]string{}
		for _, tag := range all {
			if digests[tag], err = client.digest(ctx, repo, tag); err != nil {
				return nil, err
			}
		}
		inUse := map[string]bool{}
		for _, tag := range all {
			if !contains(names, tag) {
				inUse[digests[tag]] = true
			}
		}
		for _, tag := range names {
			d := digests[tag]
			if d == "" || inUse[d] {
				continue // already gone, or shared with a kept tag
			}
			if err := client.deleteManifest(ctx, repo, d); err != nil {
				return nil, err
			}
			inUse[d] = true // another doomed tag may share it: delete once
			deleted++
		}
	}

	if deleted > 0 {
		collect := m.collect
		if collect == nil {
			collect = func(ctx context.Context) error { return garbageCollect(ctx, reg.Image) }
		}
		if err := collect(ctx); err != nil {
			return nil, err
		}
	}
	return map[string]any{"deleted": deleted}, nil
}

// garbageCollect frees deleted images' blobs with the registry stopped.
// Collecting while it serves is unsafe: a push in flight (a redeploy right
// after a failed deploy) can lose blobs it relies on, leaving an image whose
// layers can't be pulled ("unexpected EOF"). Stopped, an overlapping push
// fails plainly instead, and the restart also drops the registry's in-memory
// record of which blobs exist.
func garbageCollect(ctx context.Context, image string) error {
	if _, err := run(ctx, "docker", "stop", "-t", "10", registryName); err != nil {
		return err
	}
	// Always serve again, even if collecting fails.
	defer func() { _, _ = run(context.Background(), "docker", "start", registryName) }()
	_, err := run(ctx, "docker", "run", "--rm",
		"-v", "huruf-registry-data:/var/lib/registry",
		"--entrypoint", "registry",
		image, "garbage-collect", "--delete-untagged", "/etc/docker/registry/config.yml")
	return err
}

func contains(list []string, s string) bool {
	for _, x := range list {
		if x == s {
			return true
		}
	}
	return false
}

// registryClient speaks the registry HTTP API over the mesh, with basic auth.
type registryClient struct {
	base, user, password string
	http                 *http.Client
}

func (c *registryClient) do(ctx context.Context, method, path string, accept string) (*http.Response, error) {
	req, err := http.NewRequestWithContext(ctx, method, c.base+path, nil)
	if err != nil {
		return nil, err
	}
	req.SetBasicAuth(c.user, c.password)
	if accept != "" {
		req.Header.Set("Accept", accept)
	}
	return c.http.Do(req)
}

// tags lists a repository's tags; a repository that doesn't exist has none.
func (c *registryClient) tags(ctx context.Context, repo string) ([]string, error) {
	resp, err := c.do(ctx, http.MethodGet, "/v2/"+repo+"/tags/list", "")
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	if resp.StatusCode == http.StatusNotFound {
		return nil, nil
	}
	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("listing %s: HTTP %d", repo, resp.StatusCode)
	}
	var body struct{ Tags []string }
	return body.Tags, json.NewDecoder(resp.Body).Decode(&body)
}

func (c *registryClient) digest(ctx context.Context, repo, tag string) (string, error) {
	resp, err := c.do(ctx, http.MethodHead, "/v2/"+repo+"/manifests/"+tag, manifestTypes)
	if err != nil {
		return "", err
	}
	resp.Body.Close()
	if resp.StatusCode == http.StatusNotFound {
		return "", nil
	}
	if resp.StatusCode != http.StatusOK {
		return "", fmt.Errorf("reading %s:%s: HTTP %d", repo, tag, resp.StatusCode)
	}
	return resp.Header.Get("Docker-Content-Digest"), nil
}

func (c *registryClient) deleteManifest(ctx context.Context, repo, digest string) error {
	resp, err := c.do(ctx, http.MethodDelete, "/v2/"+repo+"/manifests/"+digest, "")
	if err != nil {
		return err
	}
	resp.Body.Close()
	if resp.StatusCode != http.StatusAccepted && resp.StatusCode != http.StatusNotFound {
		return fmt.Errorf("deleting %s@%s: HTTP %d", repo, digest, resp.StatusCode)
	}
	return nil
}

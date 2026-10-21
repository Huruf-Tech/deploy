// Package transport sends signed requests to the control plane (PLAN §4.1).
package transport

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"
	"time"

	"github.com/Huruf-Tech/huruf-deploy/agent/internal/identity"
	"github.com/Huruf-Tech/huruf-deploy/agent/internal/protocol"
)

type Client struct {
	baseURL  string
	identity *identity.Identity
	http     *http.Client
}

func New(baseURL string, id *identity.Identity) *Client {
	return &Client{
		baseURL:  strings.TrimRight(baseURL, "/"),
		identity: id,
		http:     &http.Client{Timeout: 30 * time.Second},
	}
}

// Post signs and sends `request` as JSON. It returns the HTTP status; on 2xx
// and on 403/429 (which carry pacing information) the body is decoded into `response`.
func (c *Client) Post(ctx context.Context, path string, request, response any) (int, error) {
	body, err := json.Marshal(request)
	if err != nil {
		return 0, err
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, c.baseURL+path, bytes.NewReader(body))
	if err != nil {
		return 0, err
	}
	ts, signature := c.identity.SignRequest(http.MethodPost, path, time.Now(), body)
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set(protocol.HeaderKey, c.identity.Fingerprint())
	req.Header.Set(protocol.HeaderTimestamp, ts)
	req.Header.Set(protocol.HeaderSignature, signature)
	req.Header.Set(protocol.HeaderProtocol, fmt.Sprint(protocol.Version))

	res, err := c.http.Do(req)
	if err != nil {
		return 0, err
	}
	defer res.Body.Close()

	data, err := io.ReadAll(io.LimitReader(res.Body, 4<<20))
	if err != nil {
		return res.StatusCode, err
	}

	ok := res.StatusCode < 300 || res.StatusCode == http.StatusForbidden ||
		res.StatusCode == http.StatusTooManyRequests
	if !ok {
		return res.StatusCode, fmt.Errorf("%s: HTTP %d: %s", path, res.StatusCode, strings.TrimSpace(string(data)))
	}
	if response != nil && len(data) > 0 {
		if err := json.Unmarshal(data, response); err != nil {
			return res.StatusCode, fmt.Errorf("%s: invalid response: %w", path, err)
		}
	}
	return res.StatusCode, nil
}

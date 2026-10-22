import { keyring } from "@/lib/services.ts";
import {
  cloneUrl,
  installationToken,
  integrationInTenant,
  readRepoFile,
  resolveCommit,
} from "@/lib/github/integrations.ts";
import type { TProject } from "@/schemas/applications/project.ts";
import type { TBuildRunPayload } from "@/schemas/protocol/agent.ts";
import type { WithId } from "mongodb";

type TProjectDoc = WithId<TProject>;
export type TCommit = { sha: string; message?: string; author?: string };

/** Where code comes from (PLAN §23.3): one class per kind of source. */
export interface SourceProvider {
  /** The commit to build, or undefined when the builder resolves it (or nothing is built). */
  commit(project: TProjectDoc, ref?: string): Promise<TCommit | undefined>;
  /** What the builder clones, credentials included (sealed to it). */
  repo(project: TProjectDoc, ref: string): Promise<TBuildRunPayload["repo"]>;
  /** A file at a commit, for compose sources; unsupported sources throw. */
  readFile(project: TProjectDoc, sha: string, path: string): Promise<string>;
}

class GitHubSource implements SourceProvider {
  private integration(project: TProjectDoc) {
    if (project.source.type !== "github") {
      throw new Error("Not a GitHub source");
    }
    return integrationInTenant(project.source.gitIntegration, project.tenant);
  }

  async commit(project: TProjectDoc, ref?: string) {
    const source = project.source as Extract<
      TProject["source"],
      { type: "github" }
    >;
    return await resolveCommit(
      await this.integration(project),
      source.installation,
      source.repo,
      ref ?? source.branch,
    );
  }

  async repo(project: TProjectDoc, ref: string) {
    const source = project.source as Extract<
      TProject["source"],
      { type: "github" }
    >;
    // An installation token lasts an hour: long enough to clone.
    const token = await installationToken(
      await this.integration(project),
      source.installation,
    );
    return { url: cloneUrl(source.repo), token, ref };
  }

  async readFile(project: TProjectDoc, sha: string, path: string) {
    const source = project.source as Extract<
      TProject["source"],
      { type: "github" }
    >;
    return await readRepoFile(
      await this.integration(project),
      source.installation,
      source.repo,
      sha,
      path,
    );
  }
}

/** Any Git host: HTTPS for public repos, SSH with the project's deploy key otherwise. */
class GitSource implements SourceProvider {
  // The control plane can't run git; the builder resolves the branch and reports the commit.
  commit() {
    return Promise.resolve(undefined);
  }

  async repo(project: TProjectDoc, ref: string) {
    const source = project.source as Extract<
      TProject["source"],
      { type: "git" }
    >;
    const sshKey = project.deployKeyEnc
      ? await keyring.decrypt(
        { kind: "tenant", ref: project.tenant },
        project.deployKeyEnc,
        `deployKey:${project._id}`,
      )
      : undefined;
    return { url: source.url, ref, ...(sshKey ? { sshKey } : {}) };
  }

  readFile(): Promise<string> {
    throw new Error("Compose files are read from GitHub sources only");
  }
}

class NoSource implements SourceProvider {
  commit() {
    return Promise.resolve(undefined);
  }
  repo(): Promise<TBuildRunPayload["repo"]> {
    throw new Error("This project has nothing to build");
  }
  readFile(): Promise<string> {
    throw new Error("This project has no repository");
  }
}

const providers: Record<TProject["source"]["type"], SourceProvider> = {
  github: new GitHubSource(),
  git: new GitSource(),
  image: new NoSource(),
  template: new NoSource(),
};

export const sourceOf = (project: TProjectDoc) =>
  providers[project.source.type];

/** The branch (or SHA) a deploy builds when none is given. */
export const defaultRef = (project: TProject) =>
  project.source.type === "github" || project.source.type === "git"
    ? project.source.branch
    : undefined;

import { globToRegExp } from "@std/path/posix";

/** What a GitHub push event carries that deploys read (PLAN §17). */
export type TPushEvent = {
  ref?: string;
  before?: string;
  after?: string;
  created?: boolean;
  deleted?: boolean;
  forced?: boolean;
  repository?: { full_name?: string };
  head_commit?: { message?: string; author?: { name?: string } } | null;
  commits?: {
    added?: string[];
    modified?: string[];
    removed?: string[];
  }[];
};

/** GitHub lists at most this many commits in a push event. */
const MAX_COMMITS = 2048;

/**
 * Every file the push changed, or undefined when GitHub's list may not be
 * all of them: a new branch, a force push, no commits listed, or the list
 * cut at its limit. Undefined deploys every project (never a missed deploy).
 */
export function changedFiles(push: TPushEvent): string[] | undefined {
  const commits = push.commits;
  if (
    !commits?.length || commits.length >= MAX_COMMITS || push.created ||
    push.forced
  ) return undefined;
  const files = new Set<string>();
  for (const c of commits) {
    if (!c.added || !c.modified || !c.removed) return undefined;
    for (const f of [...c.added, ...c.modified, ...c.removed]) files.add(f);
  }
  return [...files];
}

const GLOB = /[*?[{]/;

/**
 * A project's watched path, from the repository root: a glob (`apps/web/**`,
 * `*.md`), else a folder or file (`packages/ui` covers everything in it).
 */
export function matcher(pattern: string) {
  const p = pattern.trim().replace(/^(\.\/|\/)+/, "");
  if (GLOB.test(p)) {
    const re = globToRegExp(p, { extended: true, globstar: true });
    return (file: string) => re.test(file);
  }
  const dir = p.replace(/\/+$/, "");
  return (file: string) => file === dir || file.startsWith(`${dir}/`);
}

/** Whether any changed file is under one of the watched paths. */
export function touches(files: string[], patterns: string[]) {
  const matchers = patterns.map(matcher);
  return files.some((f) => matchers.some((m) => m(f)));
}

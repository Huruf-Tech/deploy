/**
 * Builds and releases the agent (PLAN §21.2).
 *
 *   deno task agent:build                       build agent/dist as version "dev"
 *   deno task agent:release [--minor|--major]   next version: build, then a GitHub release
 *       [--repo owner/name] [--dry-run]
 *
 * A release is tagged `agent-vX.Y.Z` (the installer's `--version` reads that
 * tag), marked Latest (the default AGENT_DOWNLOAD_BASE reads Latest), and
 * carries the two binaries and SHA256SUMS. The version comes from the newest
 * `agent-v*` release on GitHub, so nothing local has to be kept in sync.
 * Needs Docker, and for releases the GitHub CLI (`gh auth login`); the repo
 * must be public, since servers download without a token.
 */
import { parseArgs } from "@std/cli/parse-args";
import { join } from "@std/path/join";

const DEFAULT_REPO = "Huruf-Tech/huruf-deploy";
const DIST = join(Deno.cwd(), "agent", "dist");
const FILES = [
  "huruf-deploy-agent-linux-amd64",
  "huruf-deploy-agent-linux-arm64",
  "SHA256SUMS",
];

/** Runs a command; its output is returned, or shown when `inherit`. */
async function run(
  cmd: string,
  args: string[],
  opts: { inherit?: boolean; allowFail?: boolean } = {},
) {
  const result = await new Deno.Command(cmd, {
    args,
    stdout: opts.inherit ? "inherit" : "piped",
    stderr: opts.inherit ? "inherit" : "piped",
  }).output();
  const { code } = result;
  // Inherited streams can't be read back (the getters throw).
  const text = (pick: () => Uint8Array) =>
    opts.inherit ? "" : new TextDecoder().decode(pick()).trim();
  const out = text(() => result.stdout);
  if (code !== 0 && !opts.allowFail) {
    const err = text(() => result.stderr);
    throw new Error(
      `${cmd} ${args[0]} failed (exit ${code})${err ? `: ${err}` : ""}`,
    );
  }
  return { code, out };
}

/** Both architectures in one Go container, versioned through ldflags. */
export async function build(version: string) {
  console.log(`Building agent ${version}…`);
  const script =
    `for ARCH in amd64 arm64; do CGO_ENABLED=0 GOOS=linux GOARCH=$ARCH go build -trimpath -ldflags '-s -w -X main.version=${version}' -o dist/huruf-deploy-agent-linux-$ARCH ./cmd/huruf-deploy-agent || exit 1; done; cd dist && sha256sum huruf-deploy-agent-linux-* > SHA256SUMS`;
  await run("docker", [
    "run",
    "--rm",
    "-v",
    `${join(Deno.cwd(), "agent")}:/src`,
    "-v",
    "huruf-go-cache:/root/.cache",
    "-w",
    "/src",
    "golang:1.24",
    "sh",
    "-c",
    script,
  ], { inherit: true });
  console.log(await Deno.readTextFile(join(DIST, "SHA256SUMS")));
}

type TVersion = [number, number, number];

const parse = (tag: string): TVersion | null => {
  const m = tag.match(/^agent-v(\d+)\.(\d+)\.(\d+)$/);
  return m ? [Number(m[1]), Number(m[2]), Number(m[3])] : null;
};

/** The highest agent-vX.Y.Z release in the repo, or 0.0.0 for the first one. */
async function latestVersion(repo: string): Promise<TVersion> {
  const { out } = await run("gh", [
    "release",
    "list",
    "--repo",
    repo,
    "--limit",
    "200",
    "--json",
    "tagName",
  ]);
  const versions = (JSON.parse(out || "[]") as { tagName: string }[])
    .map(({ tagName }) => parse(tagName))
    .filter((v): v is TVersion => v !== null);
  return versions.sort((a, b) =>
    b[0] - a[0] || b[1] - a[1] || b[2] - a[2]
  )[0] ??
    [0, 0, 0];
}

export const bump = (
  [major, minor, patch]: TVersion,
  part: "major" | "minor" | "patch",
): string =>
  part === "major"
    ? `${major + 1}.0.0`
    : part === "minor"
    ? `${major}.${minor + 1}.0`
    : `${major}.${minor}.${patch + 1}`;

/** The repo this checkout pushes to, as owner/name. */
async function originRepo() {
  const { out } = await run("git", ["remote", "get-url", "origin"], {
    allowFail: true,
  });
  return out.match(/github\.com[:/](.+?)(?:\.git)?$/)?.[1];
}

/**
 * Releasing from this repo tags the current commit: it must be committed and
 * pushed, so the release points at code anyone can see.
 */
async function sourceCommit() {
  if ((await run("git", ["status", "--porcelain"])).out) {
    throw new Error("Commit or stash your changes first");
  }
  const head = (await run("git", ["rev-parse", "HEAD"])).out;
  const pushed = await run("git", [
    "branch",
    "-r",
    "--contains",
    head,
  ], { allowFail: true });
  if (!pushed.out) throw new Error("Push this commit first");
  return head;
}

async function release(args: {
  repo: string;
  part: "major" | "minor" | "patch";
  dryRun: boolean;
}) {
  await run("gh", ["auth", "status"]).catch(() => {
    throw new Error("Log in to GitHub first: gh auth login");
  });
  const fromSource = args.repo === await originRepo();
  const target = fromSource ? await sourceCommit() : undefined;

  const current = await latestVersion(args.repo);
  const version = bump(current, args.part);
  const tag = `agent-v${version}`;
  console.log(
    `${args.repo}: ${current.join(".")} → ${version}${
      target ? ` at ${target.slice(0, 7)}` : ""
    }`,
  );

  await build(version);
  if (args.dryRun) {
    console.log(`Dry run: ${tag} built, not released.`);
    return;
  }

  await run("gh", [
    "release",
    "create",
    tag,
    ...FILES.map((f) => join(DIST, f)),
    "--repo",
    args.repo,
    "--title",
    `Agent ${version}`,
    "--notes",
    `Huruf Deploy agent ${version}. Servers offer "Update agent" within about 5 minutes.`,
    "--latest",
    ...(target ? ["--target", target] : []),
  ], { inherit: true });
  console.log(
    `Released ${tag}: https://github.com/${args.repo}/releases/tag/${tag}`,
  );
}

if (import.meta.main) {
  const flags = parseArgs(Deno.args, {
    boolean: ["major", "minor", "dry-run"],
    string: ["repo"],
  });
  const [command] = flags._;
  try {
    if (command === "build") await build("dev");
    else if (command === "release") {
      await release({
        repo: flags.repo ?? Deno.env.get("AGENT_RELEASE_REPO") ?? DEFAULT_REPO,
        part: flags.major ? "major" : flags.minor ? "minor" : "patch",
        dryRun: flags["dry-run"],
      });
    } else {
      console.error(
        "usage: scripts/agent.ts build | release [--minor|--major] [--repo owner/name] [--dry-run]",
      );
      Deno.exit(2);
    }
  } catch (error) {
    console.error((error as Error).message);
    Deno.exit(1);
  }
}

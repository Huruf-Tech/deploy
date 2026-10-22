import { createSign } from "node:crypto";

export class GitHubError extends Error {
  constructor(readonly status: number, message: string) {
    super(message);
  }
}

const base64url = (data: string | Uint8Array) =>
  btoa(
    typeof data === "string" ? data : String.fromCharCode(...data),
  ).replace(/=+$/, "").replace(/\+/g, "-").replace(/\//g, "_");

/**
 * A 9-minute RS256 JWT that authenticates as the GitHub App. node:crypto reads
 * the PKCS#1 PEM GitHub issues, which WebCrypto cannot import directly.
 */
export function appJwt(appId: number, privateKeyPem: string) {
  const now = Math.floor(Date.now() / 1000);
  const header = base64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  // Backdated a minute for clock drift, as GitHub recommends.
  const payload = base64url(
    JSON.stringify({ iat: now - 60, exp: now + 540, iss: String(appId) }),
  );
  const signature = createSign("RSA-SHA256")
    .update(`${header}.${payload}`)
    .sign(privateKeyPem);
  return `${header}.${payload}.${base64url(new Uint8Array(signature))}`;
}

/** Minimal GitHub REST client: one request shape, a timeout, typed errors. */
export class GitHubApi {
  /** Overridden by tests to point at a fake GitHub. */
  baseUrl = "https://api.github.com";

  async call<T>(
    path: string,
    opts: { method?: string; auth?: string; body?: unknown } = {},
  ): Promise<{ data: T; headers: Headers }> {
    const res = await fetch(`${this.baseUrl}${path}`, {
      method: opts.method ?? "GET",
      headers: {
        accept: "application/vnd.github+json",
        "x-github-api-version": "2022-11-28",
        "user-agent": "huruf-deploy",
        ...(opts.auth ? { authorization: `Bearer ${opts.auth}` } : {}),
        ...(opts.body ? { "content-type": "application/json" } : {}),
      },
      body: opts.body ? JSON.stringify(opts.body) : undefined,
      signal: AbortSignal.timeout(15_000),
    });

    const text = await res.text();
    if (!res.ok) {
      let message = text;
      try {
        message = JSON.parse(text).message ?? text;
      } catch {
        // Not JSON: keep the raw text.
      }
      throw new GitHubError(res.status, `GitHub: ${message}`);
    }
    return {
      data: (text ? JSON.parse(text) : null) as T,
      headers: res.headers,
    };
  }
}

/** True when GitHub's Link header says there is another page. */
export const hasNextPage = (headers: Headers) =>
  /rel="next"/.test(headers.get("link") ?? "");

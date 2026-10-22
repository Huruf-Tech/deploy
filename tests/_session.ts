import { assertEquals } from "@std/assert";
import { ObjectId } from "mongodb";
import handler from "@/serve.base.ts";
import { Env } from "@/core/utils/env.ts";
import { mongodb } from "@/database.ts";

export type TCall = (
  method: string,
  path: string,
  body?: unknown,
  headers?: Record<string, string>,
) => Promise<{
  status: number;
  // deno-lint-ignore no-explicit-any
  json: any;
  headers: Headers;
}>;

/**
 * A signed-up user with their own tenant, calling the real handler in process.
 * `call` sends the session cookie and tenant header; `headers` override them
 * (`{ cookie: "" }` calls without a session, `"x-tenant-id"` switches tenant). `cleanup` removes the user, the
 * tenant and their keys.
 */
export async function testSession(name: string) {
  const origin = Env.getSync("BASE_URL");
  let cookie = "";
  let tenant = "";

  const call: TCall = async (method, path, body, headers = {}) => {
    const res = await handler(
      new Request(`http://localhost${path}`, {
        method,
        // Empty values drop a default header.
        headers: Object.fromEntries(
          Object.entries({
            "content-type": "application/json",
            origin,
            "x-tenant-id": tenant,
            cookie,
            ...headers,
          }).filter(([, value]) => value),
        ),
        body: body ? JSON.stringify(body) : undefined,
        redirect: "manual",
      }),
    );
    const set = res.headers.getSetCookie();
    if (set.length) cookie = set.map((c) => c.split(";")[0]).join("; ");
    const text = await res.text();
    let json;
    try {
      json = JSON.parse(text);
    } catch {
      json = text;
    }
    return { status: res.status, json, headers: res.headers };
  };

  const email = `${name}-${Date.now()}@example.com`;
  const signup = await call("POST", "/auth/api/sign-up/email", {
    email,
    password: "Passw0rd!long",
    name,
  });
  assertEquals(signup.status, 200, JSON.stringify(signup.json));
  const user = new ObjectId(signup.json.user.id);
  tenant = (await call("POST", "/tenants/api", { name })).json.tenantId;
  const tenantId = new ObjectId(tenant);

  const cleanup = async () => {
    const db = mongodb.db();
    await Promise.all([
      db.collection("keyring").deleteMany({
        "owner.ref": { $in: [user, tenantId] },
      }),
      db.collection("tenantUsage").deleteMany({ tenant: tenantId }),
      db.collection("tenantMembers").deleteMany({ tenant: tenantId }),
      db.collection("tenants").deleteMany({ _id: tenantId }),
      db.collection("apiKeys").deleteMany({ createdBy: user }),
      db.collection("sessions").deleteMany({ userId: user }),
      db.collection("accounts").deleteMany({ userId: user }),
      db.collection("users").deleteMany({ _id: user }),
    ]);
  };

  return { call, email, user, tenant, tenantId, cleanup };
}

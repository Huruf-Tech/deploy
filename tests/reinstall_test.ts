import { assertEquals, assertRejects } from "@std/assert";
import { ObjectId } from "mongodb";
import handler from "@/serve.base.ts";
import { mongodb } from "@/database.ts";
import { acceptServer } from "@/lib/agents/servers.ts";
import { serverModel } from "@/schemas/infrastructure/server.ts";
import { createState, SimAgent } from "@/tools/agent-sim/agent.ts";
import { testSession } from "./_session.ts";

// A machine installed again registers with a new key next to its old,
// never-accepted entry. Accepting either entry with the code the new agent
// printed accepts the new registration and retires the old one.
Deno.test({
  name: "servers: a reinstalled machine is accepted by its new code",
  sanitizeOps: false,
  sanitizeResources: false,
  fn: async () => {
    const session = await testSession("reinstall");
    const { tenant, tenantId, user } = session;
    const hostname = `box-${Date.now().toString(36)}`;
    const register = async () => {
      const agent = new SimAgent(await createState(hostname), {
        baseUrl: "http://localhost",
        tenant,
        send: (req) => Promise.resolve(handler(req)),
      });
      const { json } = await agent.hello();
      return {
        id: new ObjectId(json.server),
        code: json.pairingCode as string,
      };
    };
    const ids: ObjectId[] = [];
    try {
      const old = await register();
      const fresh = await register();
      ids.push(old.id, fresh.id);

      // The old entry with the old agent's code: still a mismatch elsewhere.
      await assertRejects(() =>
        acceptServer({
          server: old.id,
          tenant: tenantId,
          user: { _id: user, emailVerified: true },
          pairingCode: "ZZZZZZ",
        })
      );

      const accepted = await acceptServer({
        server: old.id, // the card clicked: the stale one
        tenant: tenantId,
        user: { _id: user, emailVerified: true },
        pairingCode: fresh.code, // what the terminal printed
      });
      assertEquals(accepted.server.equals(fresh.id), true);
      assertEquals(accepted.superseded, 1);
      const [a, b] = await Promise.all([
        serverModel.findOne({ _id: old.id }),
        serverModel.findOne({ _id: fresh.id }),
      ]);
      assertEquals(a?.status, "rejected");
      assertEquals(b?.status, "active");
    } finally {
      await serverModel.deleteMany({ _id: { $in: ids } });
      await mongodb.db().collection("serverLeases").deleteMany({
        _id: { $in: ids },
      });
      await session.cleanup();
    }
  },
});

import type { ObjectId } from "mongodb";
import { Logger } from "@/core/utils/logger.ts";
import { readTextSetting } from "@/lib/core/settings.ts";
import { serverModel } from "@/schemas/infrastructure/server.ts";

const MONTH_MS = 30 * 86_400_000;
/** Lookups per call, side by side, so a market page waits 3 s at most. */
const PER_CALL = 5;

/**
 * The country of a machine's public address (PLAN §30.3), looked up by the
 * control plane, never typed by the owner. `GEOIP_URL` names the service
 * (`{ip}` replaced; it answers a two-letter code); `off` turns it off. Kept
 * on the server and looked up again when its address changes or monthly.
 */
export async function regionsOf(
  machines: {
    _id: ObjectId;
    inventory?: { publicIp?: string };
    region?: { country?: string; ip: string; at: Date };
  }[],
) {
  const url = await readTextSetting(
    "GEOIP_URL",
    "https://ipinfo.io/{ip}/country",
  );
  const out = new Map<string, string>();
  const stale: { _id: ObjectId; ip: string }[] = [];
  for (const m of machines) {
    const ip = m.inventory?.publicIp;
    if (m.region?.country) out.set(String(m._id), m.region.country);
    const fresh = m.region && m.region.ip === ip &&
      Date.now() - m.region.at.getTime() < MONTH_MS;
    if (!fresh && ip && url !== "off" && stale.length < PER_CALL) {
      stale.push({ _id: m._id, ip });
    }
  }
  await Promise.all(stale.map(async ({ _id, ip }) => {
    try {
      const res = await fetch(url.replace("{ip}", encodeURIComponent(ip)), {
        signal: AbortSignal.timeout(3_000),
      });
      const country = (await res.text()).trim().toUpperCase();
      if (!res.ok || !/^[A-Z]{2}$/.test(country)) throw new Error(country);
      await serverModel.updateOne({ _id }, {
        $set: { region: { country, ip, at: new Date() } },
      });
      out.set(String(_id), country);
    } catch (error) {
      Logger.warn(`[region] ${ip}: ${error}`);
      // Not looked up again for a month: an unknown country, not a slow page.
      // An earlier country stays.
      await serverModel.updateOne({ _id }, {
        $set: { "region.ip": ip, "region.at": new Date() },
      });
    }
  }));
  return out;
}

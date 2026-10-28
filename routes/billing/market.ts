import z from "zod";
import { Router } from "@/core/http/router.ts";
import { queryAsJson } from "@/core/http/utils.ts";
import { Response } from "@/core/http/response.ts";
import { $objectId } from "@/core/utils/createCRUD.ts";
import { withTenant } from "@/plugins/Huruf-Tech/thunder-core/utils/withTenant.ts";
import { rentals } from "@/lib/services.ts";
import { listMachines } from "@/lib/market/market.ts";

const $flag = z.enum(["true", "false"]).optional().transform((v) =>
  v === "true"
);

const $sizes = z.object({
  cpus: z.number(),
  memMb: z.number(),
  diskGb: z.number(),
});

/**
 * The market (PLAN §30.4): machines for rent with their measured facts,
 * region, prices and renters' rating, and a size's price on one of them.
 */
export default new Router("/api", function market(router) {
  router.get("/machines", function machines() {
    const $query = z.object({
      country: z.string().length(2).optional(),
      source: z.enum(["official", "community"]).optional(),
      dedicated: $flag,
      newArrivals: $flag,
      tier: z.enum(["Basic", "Standard", "Performance"]).optional(),
      disk: z.enum(["NVMe", "SSD", "HDD"]).optional(),
      minRating: z.coerce.number().min(0).max(100).optional(),
      maxRttMs: z.coerce.number().min(0).optional(),
      minUptime: z.coerce.number().min(0).max(100).optional(),
      minVcpu: z.coerce.number().min(0).optional(),
      minMemMb: z.coerce.number().min(0).optional(),
      minDiskGb: z.coerce.number().min(0).optional(),
      sort: z.enum(["price", "rating", "uptime", "latency"]).optional(),
    });
    const $return = z.array(z.object({
      _id: z.string(),
      name: z.string(),
      official: z.boolean().describe("Huruf's own machine"),
      owner: z.string().optional().describe("The owner's workspace"),
      yours: z.boolean(),
      newArrival: z.boolean().describe("Measured for less than 6 months"),
      measuredDays: z.number(),
      country: z.string().optional(),
      free: $sizes,
      total: $sizes,
      prices: z.object({
        hourly: z.object({
          vcpu: z.number(),
          memGb: z.number(),
          diskGb: z.number(),
          whole: z.number().optional(),
          trafficGb: z.number(),
        }).describe("Cents per hour; traffic: cents per GB over"),
        monthly: z.object({
          vcpu: z.number(),
          memGb: z.number(),
          diskGb: z.number(),
          whole: z.number().optional(),
        }).describe("Cents per month (730 hours)"),
        trafficGb: z.number(),
      }),
      trafficPerVcpuGb: z.number(),
      overheadMb: z.number().describe(
        "Added to every partition, at the memory price",
      ),
      autoAccept: z.boolean(),
      rating: z.number().optional(),
      tier: z.enum(["Basic", "Standard", "Performance"]).optional(),
      disk: z.enum(["NVMe", "SSD", "HDD"]).optional(),
      rttMs: z.number().optional(),
      uptime30d: z.number().optional(),
      uptime90d: z.number().optional(),
      steal: z.number().optional(),
      virtualization: z.string().optional(),
      dedicated: z.boolean().describe("Can be rented whole now"),
      family: z.enum([
        "General purpose",
        "Compute optimized",
        "Memory optimized",
      ]).describe("From memory per vCPU"),
      burstable: z.boolean().describe("Its host takes CPU from it at times"),
      renters: z.object({ stars: z.number(), count: z.number() }).optional(),
    }));

    return {
      shape: () => ({ query: $query, return: $return }),
      handler: async (req) => {
        const filters = $query.parse(queryAsJson(req));
        const { tenant } = await withTenant(req);
        return Response.json(await listMachines(tenant._id, filters));
      },
    };
  });

  router.get("/quote", function quote() {
    const $query = z.object({
      machine: $objectId,
      /** A resize of this rental: its own size counts as free, on any machine it's on. */
      rental: $objectId.optional(),
      whole: $flag,
      vcpu: z.coerce.number().optional(),
      memMb: z.coerce.number().int().optional(),
      diskGb: z.coerce.number().int().optional(),
    });
    const $return = z.object({
      price: z.number().describe("Cents per month"),
      hourly: z.number().describe("Cents per hour"),
      trafficGb: z.number().describe("Included per month"),
      trafficRatePerGb: z.number(),
      overheadMb: z.number(),
      fits: z.boolean(),
      resources: z.object({
        vcpu: z.number(),
        memMb: z.number(),
        diskGb: z.number(),
      }),
    });

    return {
      shape: () => ({ query: $query, return: $return }),
      handler: async (req) => {
        const { machine, rental, ...choice } = $query.parse(queryAsJson(req));
        const { tenant } = await withTenant(req);
        const q = rental
          ? await rentals.quoteResize(tenant._id, rental, choice)
          : await rentals.quote(machine, choice);
        return Response.json({
          price: q.price,
          hourly: q.hourly,
          trafficGb: q.trafficGb,
          trafficRatePerGb: q.trafficRatePerGb,
          overheadMb: q.overheadMb,
          fits: q.fits,
          resources: q.resources,
        });
      },
    };
  });
}).group("Billing");

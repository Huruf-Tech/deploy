import z from "zod";
import { mongodb } from "@/database.ts";

/**
 * A class of rentable capacity (PLAN §26.8): what customers get ("Shared
 * CPU", "Dedicated CPU") and its rate card. Machines for rent and server
 * plans (sizes) belong to one class (PLAN §28). Rates are cents per month.
 */
export const $serverClassInput = z.object({
  name: z.string().min(1).max(50).meta({ canFilter: true }),
  description: z.string().max(300).optional(),
  /** The instance family, for admins only (e.g. t3, c7i). */
  family: z.string().max(30).optional(),
  rates: z.object({
    vcpu: z.number().int().min(0),
    memGb: z.number().int().min(0),
    diskGb: z.number().int().min(0),
    /** Per GB of traffic beyond the included allowance. */
    trafficGb: z.number().int().min(0),
    /** Per rental, whatever its size. */
    fixed: z.number().int().min(0),
  }),
  includedTrafficPerVcpu: z.number().int().min(0).default(100),
  /** Rented vCPUs may add up to this many times the machine's (memory and disk never overcommit). */
  cpuOvercommit: z.number().min(1).max(8).default(1),
  /** The largest custom request. */
  maxPerRental: z.object({
    vcpu: z.number().min(0.5),
    memMb: z.number().int().min(512),
    diskGb: z.number().int().min(5),
  }).default({ vcpu: 4, memMb: 8_192, diskGb: 160 }),
  active: z.boolean().default(true).meta({ canFilter: true }),
  sortOrder: z.number().int().default(0),
});

export const $serverClassUpdate = $serverClassInput.extend({
  includedTrafficPerVcpu: z.number().int().min(0),
  cpuOvercommit: z.number().min(1).max(8),
  maxPerRental: $serverClassInput.shape.maxPerRental.unwrap(),
  active: z.boolean(),
  sortOrder: z.number().int(),
}).partial();

export const $serverClass = $serverClassInput.extend({
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().default(() => new Date()),
});

export type TServerClass = z.output<typeof $serverClass>;

export const serverClassModel = mongodb.db().collection<TServerClass>(
  "serverClasses",
);

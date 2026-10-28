import type z from "zod";
import type { $rentPrices } from "@/schemas/infrastructure/server.ts";

export type TRentPrices = z.output<typeof $rentPrices>;
export type TResources = { vcpu: number; memMb: number; diskGb: number };

/** A month, in hours (PLAN §30.3): every month costs the same. */
export const HOURS_PER_MONTH = 730;

/**
 * Cents per hour for a partition on a machine (PLAN §30.3); the partition's
 * overhead is paid at the memory rate. The whole machine has its own price
 * when the owner set one, else the sum of what it's made of.
 */
export const hourlyOf = (
  p: TRentPrices,
  r: TResources,
  overheadMb: number,
  whole = false,
) =>
  whole && p.whole !== undefined
    ? p.whole
    : r.vcpu * p.vcpu + ((r.memMb + overheadMb) / 1024) * p.memGb +
      r.diskGb * p.diskGb;

/** The monthly charge, whole cents rounded up. */
export const monthlyOf = (hourly: number) =>
  Math.ceil(hourly * HOURS_PER_MONTH - 1e-9);

/** Downtime given back, by the hour of the monthly price, to the minute. */
export const refundFor = (monthly: number, downMs: number) =>
  Math.min(
    monthly,
    Math.round(
      monthly * Math.floor(downMs / 60_000) / (HOURS_PER_MONTH * 60),
    ),
  );

/** Huruf's part and the owner's, of what a period kept after refunds. */
export const shareOf = (net: number, commission: number) => {
  const cut = Math.round((net * commission) / 100);
  return { commission: cut, share: net - cut };
};

/**
 * What a matured month adds to its machine's security (PLAN §30.7): at most
 * half the owner's share, up to the cap.
 */
export const securityFill = (share: number, security: number, cap: number) =>
  Math.max(0, Math.min(Math.floor(share / 2), cap - security));

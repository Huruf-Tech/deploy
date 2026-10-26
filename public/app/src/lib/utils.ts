import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** The server's message from a failed SDK call: a plain string, or the first validation message. */
export function errorMessage(error: unknown): string | null {
  const data = (error as { response?: { data?: unknown } }).response?.data
  if (typeof data === "string" && data) return data
  const body = data as {
    message?: string
    messages?: { message?: string }[]
  } | null
  // A bare Error (no response) is ours, e.g. the bank's reason from Stripe.
  if (!data && error instanceof Error && !("response" in error)) {
    return error.message
  }
  return body?.messages?.[0]?.message ?? body?.message ?? null
}

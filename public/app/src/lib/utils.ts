import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** The server's message from a failed SDK call: a plain string, or the first validation message. */
export function errorMessage(error: unknown): string | null {
  const data = (error as { response?: { data?: unknown } }).response?.data
  if (typeof data === "string" && data) return data
  const messages = (data as { messages?: { message?: string }[] })?.messages
  return messages?.[0]?.message ?? null
}

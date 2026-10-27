import { Response } from "@/core/http/response.ts";

// deno-lint-ignore no-explicit-any
type TErrorClass = new (...args: any[]) => Error;

/**
 * Runs `fn`, turning the given kinds of error (a template's, a reference's…)
 * into a 400 with their message. Works for sync and async `fn`.
 */
export function asBadRequest<T>(fn: () => T, ...kinds: TErrorClass[]): T {
  const map = (error: unknown): never => {
    if (kinds.some((kind) => error instanceof kind)) {
      throw Response.badRequest((error as Error).message);
    }
    throw error;
  };
  try {
    const result = fn();
    return (result instanceof Promise ? result.catch(map) : result) as T;
  } catch (error) {
    return map(error);
  }
}

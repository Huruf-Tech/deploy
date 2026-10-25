import type { ObjectId } from "mongodb";
import type { LanguageModel } from "ai";
import { createAnthropic } from "@ai-sdk/anthropic";
import { createOpenAI } from "@ai-sdk/openai";
import { Response } from "@/core/http/response.ts";
import { entitlements } from "@/lib/services.ts";
import { readTextSetting } from "@/lib/core/settings.ts";
import { rateCounterModel } from "@/schemas/limits/rateCounter.ts";

/**
 * The AI assistant's model (PLAN Phase 12): `AI_MODEL` is `provider/model`,
 * e.g. `anthropic/claude-sonnet-5-5` or `openai/<model id>`, and `AI_SECRET` is
 * that provider's API key. With `AI_BASE_URL`, `openai/<model>` talks to any
 * OpenAI-compatible endpoint (OpenRouter, Groq, Ollama…) through its chat
 * completions API. Tests set `aiOptions.model`.
 */
export const aiOptions: { model?: LanguageModel } = {};

export const DEFAULT_AI_MODEL = "anthropic/claude-sonnet-5-5";

const PROVIDERS: Record<
  string,
  (apiKey: string, model: string, baseURL?: string) => LanguageModel
> = {
  anthropic: (apiKey, model, baseURL) =>
    createAnthropic({ apiKey, baseURL })(model),
  openai: (apiKey, model, baseURL) =>
    baseURL
      ? createOpenAI({ apiKey, baseURL }).chat(model)
      : createOpenAI({ apiKey })(model),
};

/** The configured model, or a 400 saying what the platform admin must set. */
export async function aiModel(): Promise<LanguageModel> {
  if (aiOptions.model) return aiOptions.model;
  const spec = await readTextSetting("AI_MODEL", DEFAULT_AI_MODEL);
  const secret = await readTextSetting("AI_SECRET", "");
  const slash = spec.indexOf("/");
  const provider = PROVIDERS[spec.slice(0, slash)];
  if (!secret || slash < 1 || !provider) {
    throw Response.badRequest(
      `The AI assistant isn't set up: the platform admin needs AI_SECRET and AI_MODEL (${
        Object.keys(PROVIDERS).join(" or ")
      }/<model>).`,
    );
  }
  const baseURL = await readTextSetting("AI_BASE_URL", "");
  return provider(secret, spec.slice(slash + 1), baseURL || undefined);
}

const monthKey = (tenant: ObjectId, now = new Date()) =>
  `ai:${tenant}:${now.toISOString().slice(0, 7)}`;

const nextMonth = (now = new Date()) =>
  new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 2));

/** What the tenant's plan allows, and what it used this month. */
export async function aiAllowance(tenant: ObjectId) {
  const { features, limits } = await entitlements.resolve(tenant);
  const used = (await rateCounterModel.findOne({ _id: monthKey(tenant) }))
    ?.count ?? 0;
  return {
    enabled: !!features.aiAssistant,
    limit: limits.aiRequestsPerMonth ?? 0,
    used,
  };
}

/**
 * Counts one call before it's made, and refunds it if the call fails, so a
 * provider error never uses up the tenant's month.
 */
export async function withAiQuota<T>(tenant: ObjectId, fn: () => Promise<T>) {
  const { enabled, limit } = await aiAllowance(tenant);
  if (!enabled) {
    throw Response.forbidden("Your plan doesn't include the AI assistant");
  }
  const key = monthKey(tenant);
  const counter = await rateCounterModel.findOneAndUpdate(
    { _id: key },
    { $inc: { count: 1 }, $setOnInsert: { expiresAt: nextMonth() } },
    { upsert: true, returnDocument: "after" },
  );
  const refund = () =>
    rateCounterModel.updateOne({ _id: key }, { $inc: { count: -1 } });
  if ((counter?.count ?? 1) > limit) {
    await refund();
    throw Response.forbidden(
      `Your plan allows ${limit} AI requests a month; this month's are used`,
    );
  }
  try {
    return await fn();
  } catch (error) {
    await refund();
    throw error;
  }
}

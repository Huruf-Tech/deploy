import handlebars from "handlebars";
import type {
  TTemplateContent,
  TTemplateInput,
} from "@/schemas/build/template.ts";

/** An isolated instance: no helpers registered elsewhere leak into templates. */
const engine = handlebars.create();

export class TemplateError extends Error {}

/** The file each kind renders to; the agent receives only these (PLAN §9.1). */
export const OUTPUT_FILE = { app: "Dockerfile", service: "compose.yaml" };

/** Throws TemplateError on Handlebars syntax errors, so a broken version is never saved. */
export function assertValidSource(source: string) {
  try {
    engine.parse(source);
  } catch (error) {
    throw new TemplateError(
      `Template syntax: ${(error as Error).message.split("\n")[0]}`,
    );
  }
}

const generatePassword = () =>
  btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(24))))
    .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

/**
 * Validates and coerces the user's values against the version's inputs.
 * Empty `generate` inputs get a fresh value, reported in `generated`.
 */
export function resolveInputs(
  inputs: TTemplateInput[],
  given: Record<string, unknown>,
) {
  const values: Record<string, string | number | boolean> = {};
  const generated: string[] = [];
  const problems: string[] = [];

  for (const input of inputs) {
    let value = given[input.key] ?? input.default;
    if (value === undefined || value === "") {
      if (input.generate === "password") {
        values[input.key] = generatePassword();
        generated.push(input.key);
      } else {
        if (input.required) problems.push(`${input.label} is required`);
        // Declared but empty: present, so strict mode allows `{{#if inputs.X}}`.
        values[input.key] = "";
      }
      continue;
    }

    switch (input.type) {
      case "number":
        value = Number(value);
        if (!Number.isFinite(value)) {
          problems.push(`${input.label} must be a number`);
        }
        break;
      case "boolean":
        value = value === true || value === "true";
        break;
      case "select":
        if (!input.options?.includes(String(value))) {
          problems.push(`${input.label} must be one of the listed options`);
        }
        value = String(value);
        break;
      default:
        value = String(value);
    }
    values[input.key] = value as string | number | boolean;
  }

  if (problems.length) throw new TemplateError(problems.join("; "));
  return { values, generated };
}

/**
 * Renders a version into its output file. Handlebars runs without HTML
 * escaping (these are Dockerfiles and YAML, where `&&` must stay `&&`) and in
 * strict mode, so a typo'd `{{inputs.X}}` fails instead of rendering empty.
 * Templates see `inputs.*` and `build.cacheKey` (PLAN §9.2).
 */
export function renderContent(
  kind: "app" | "service",
  content: Pick<TTemplateContent, "dockerfile" | "compose" | "inputs">,
  given: Record<string, unknown>,
  build: { cacheKey: string },
) {
  const source = kind === "app" ? content.dockerfile : content.compose;
  if (!source) {
    throw new TemplateError(
      kind === "app"
        ? "This version has no Dockerfile"
        : "This version has no compose file",
    );
  }

  const { values, generated } = resolveInputs(content.inputs, given);
  try {
    const output = engine.compile(source, { noEscape: true, strict: true })({
      inputs: values,
      build,
    });
    return { files: { [OUTPUT_FILE[kind]]: output }, generated };
  } catch (error) {
    throw new TemplateError((error as Error).message.split("\n")[0]);
  }
}

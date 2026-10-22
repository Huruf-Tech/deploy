import { parse } from "@std/yaml";

/**
 * Compose files become the same per-service runtime spec as apps (PLAN §9.1),
 * so services get the same reconciler, health checks and DNS. Parsed here,
 * on the control plane, with the standard YAML module: unsupported keys are
 * reported when the template is rendered, before anything reaches a server.
 */

export class ComposeError extends Error {}

export type TComposeService = {
  name: string;
  image: string;
  env: Record<string, string>;
  command?: string[];
  port?: number;
  healthcheckCommand?: string;
  volumes: Array<{ name: string; mountPath: string }>;
};

// Read and used, or deliberately ignored (we manage restarts, names and order).
const SERVICE_KEYS = new Set([
  "image",
  "command",
  "environment",
  "volumes",
  "healthcheck",
  "ports",
  "expose",
  "restart",
  "container_name",
  "depends_on",
  "labels",
]);
const TOP_KEYS = new Set(["services", "volumes", "version", "name"]);

type TRaw = Record<string, unknown>;

/** Splits a command string like a shell would (quotes, no expansion). */
export function splitCommand(command: string) {
  const parts: string[] = [];
  let current = "";
  let quote: string | null = null;
  let started = false;
  for (const char of command) {
    if (quote) {
      if (char === quote) quote = null;
      else current += char;
    } else if (char === '"' || char === "'") {
      quote = char;
      started = true;
    } else if (/\s/.test(char)) {
      if (started || current) parts.push(current);
      current = "";
      started = false;
    } else {
      current += char;
    }
  }
  if (quote) throw new ComposeError(`Unclosed quote in: ${command}`);
  if (started || current) parts.push(current);
  return parts;
}

const shellQuote = (arg: string) =>
  /^[\w@%+=:,./-]+$/.test(arg) ? arg : `'${arg.replaceAll("'", `'\\''`)}'`;

const healthCommand = (test: unknown): string | undefined => {
  if (typeof test === "string") return test;
  if (!Array.isArray(test) || !test.length) return undefined;
  const [kind, ...rest] = test.map(String);
  if (kind === "NONE") return undefined;
  if (kind === "CMD-SHELL") return rest.join(" ");
  if (kind === "CMD") return rest.map(shellQuote).join(" ");
  throw new ComposeError(`Unsupported healthcheck test: ${test.join(" ")}`);
};

const containerPort = (spec: unknown): number | undefined => {
  const value = String(
    typeof spec === "object" && spec ? (spec as TRaw).target : spec,
  ).split("/")[0];
  const port = Number(value.split(":").at(-1));
  return Number.isInteger(port) && port > 0 && port < 65_536 ? port : undefined;
};

/**
 * Turns a compose document into services. Named volumes become per-project
 * Docker volumes (`volumePrefix` + name); bind mounts aren't allowed.
 */
export function parseCompose(
  text: string,
  volumePrefix: string,
): TComposeService[] {
  let doc: TRaw;
  try {
    doc = parse(text) as TRaw;
  } catch (error) {
    throw new ComposeError(
      `Invalid YAML: ${(error as Error).message.split("\n")[0]}`,
    );
  }
  if (!doc || typeof doc !== "object" || !doc.services) {
    throw new ComposeError("The compose file has no services");
  }
  const unsupported = Object.keys(doc).filter((key) => !TOP_KEYS.has(key));
  const declared = new Set(Object.keys((doc.volumes as TRaw) ?? {}));

  const services = Object.entries(doc.services as Record<string, TRaw>).map(
    ([name, raw]) => {
      if (!/^[a-z0-9][a-z0-9-]*$/.test(name)) {
        throw new ComposeError(
          `Service name ${name}: use lowercase letters, digits and dashes`,
        );
      }
      for (const key of Object.keys(raw ?? {})) {
        if (!SERVICE_KEYS.has(key)) unsupported.push(`services.${name}.${key}`);
      }
      if (typeof raw?.image !== "string" || !raw.image) {
        throw new ComposeError(
          `Service ${name} needs an image (building from compose isn't supported)`,
        );
      }

      const env: Record<string, string> = {};
      if (Array.isArray(raw.environment)) {
        for (const item of raw.environment.map(String)) {
          const [key, ...value] = item.split("=");
          env[key] = value.join("=");
        }
      } else {
        for (
          const [key, value] of Object.entries((raw.environment as TRaw) ?? {})
        ) {
          env[key] = value === null || value === undefined ? "" : String(value);
        }
      }

      const volumes = ((raw.volumes as unknown[]) ?? []).map((spec) => {
        const [source, target] = typeof spec === "string"
          ? spec.split(":")
          : [(spec as TRaw).source, (spec as TRaw).target].map(String);
        if (!declared.has(source)) {
          throw new ComposeError(
            `Volume ${source} in ${name}: only named volumes declared under \`volumes:\` are supported`,
          );
        }
        return { name: `${volumePrefix}${source}`, mountPath: target };
      });

      const command = raw.command === undefined
        ? undefined
        : Array.isArray(raw.command)
        ? raw.command.map(String)
        : splitCommand(String(raw.command));
      const ports = [
        ...((raw.ports as unknown[]) ?? []),
        ...((raw.expose as unknown[]) ?? []),
      ];
      const healthcheck = raw.healthcheck as TRaw | undefined;

      return {
        name,
        image: raw.image,
        env,
        command,
        port: ports.map(containerPort).find(Boolean),
        healthcheckCommand: healthcheck?.disable
          ? undefined
          : healthCommand(healthcheck?.test),
        volumes,
      };
    },
  );

  if (unsupported.length) {
    throw new ComposeError(
      `Unsupported compose keys: ${unsupported.join(", ")}`,
    );
  }
  if (!services.length) {
    throw new ComposeError("The compose file has no services");
  }
  return services;
}

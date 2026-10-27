/**
 * Generates the agent protocol artifacts from the zod schemas (PLAN §21.2):
 * - protocol/agent.schema.json   JSON Schemas, for any agent implementation
 * - agent/internal/protocol/types.gen.go   Go types for the Go agent
 *
 * Run with `deno task generate:protocol`; CI fails when the output is stale.
 */
import z from "zod";
import * as protocol from "@/schemas/protocol/agent.ts";

type TJsonSchema = {
  type?: string;
  properties?: Record<string, TJsonSchema>;
  required?: string[];
  items?: TJsonSchema;
  additionalProperties?: TJsonSchema | boolean;
  enum?: unknown[];
  const?: unknown;
  oneOf?: TJsonSchema[];
  anyOf?: TJsonSchema[];
  description?: string;
};

/** Requests are what agents send (schema input); responses what they read (output). */
const MESSAGES: Array<[string, z.ZodType, "input" | "output"]> = [
  ["HelloRequest", protocol.$helloRequest, "input"],
  ["HelloResponse", protocol.$helloResponse, "output"],
  ["AgentConfigResponse", protocol.$agentConfigResponse, "output"],
  ["PollRequest", protocol.$pollRequest, "input"],
  ["PollResponse", protocol.$pollResponse, "output"],
  ["PollRefusal", protocol.$pollRefusal, "output"],
  ["CommandResultEvent", protocol.$commandResultEvent, "input"],
  ["StreamChunkEvent", protocol.$streamChunkEvent, "input"],
  ["EventsResponse", protocol.$eventsResponse, "output"],
  ["StreamOpenPayload", protocol.$streamOpenPayload, "output"],
  ["StreamClosePayload", protocol.$streamClosePayload, "output"],
  ["MetricsSample", protocol.$metricsSample, "input"],
  ["EventsRequest", protocol.$eventsRequest, "input"],
  ["SealedPayload", protocol.$sealedPayload, "output"],
  ["BuildRunPayload", protocol.$buildRunPayload, "output"],
  ["CacheClearPayload", protocol.$cacheClearPayload, "output"],
  ["DesiredSpec", protocol.$desiredSpec, "output"],
  ["WorkloadStatusEvent", protocol.$workloadStatusEvent, "input"],
  ["MeshStatusEvent", protocol.$meshStatusEvent, "input"],
  ["AlertEvent", protocol.$alertEvent, "input"],
  ["AutoscaleEvent", protocol.$autoscaleEvent, "input"],
  ["CapacityReport", protocol.$capacityReport, "input"],
  ["AgentUpdatePayload", protocol.$agentUpdatePayload, "output"],
  ["RegistryDeletePayload", protocol.$registryDeletePayload, "output"],
  ["HostCleanupPayload", protocol.$hostCleanupPayload, "output"],
  ["PoolEnsurePayload", protocol.$poolEnsurePayload, "output"],
  ["PartitionCreatePayload", protocol.$partitionCreatePayload, "output"],
  ["PartitionResizePayload", protocol.$partitionResizePayload, "output"],
  ["PartitionNamePayload", protocol.$partitionNamePayload, "output"],
  ["PartitionSendPayload", protocol.$partitionSendPayload, "output"],
  ["PartitionReceivePayload", protocol.$partitionReceivePayload, "output"],
];

const schemas = Object.fromEntries(
  MESSAGES.map(([name, schema, io]) => [
    name,
    z.toJSONSchema(schema, { io, unrepresentable: "any" }) as TJsonSchema,
  ]),
);

const pascal = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const structs = new Map<string, string>();

/** Schemas reused across messages get one shared Go type instead of a copy per message. */
const SHARED: Array<[string, z.ZodType]> = [
  ["AgentConfig", protocol.$agentConfig],
  ["Inventory", protocol.$inventory],
  ["ResourceSummary", protocol.$resourceSummary],
  ["PartitionSize", protocol.$partitionSize],
  ["PartitionUsage", protocol.$partitionUsage],
  ["PortForward", protocol.$portForward],
  ["Command", protocol.$command],
  ["TerminalInput", protocol.$terminalInput],
  ["Workload", protocol.$workload],
  ["WorkloadRelease", protocol.$workloadRelease],
  ["Healthcheck", protocol.$healthcheck],
  ["RegistryAuth", protocol.$registryAuth],
  ["MeshSpec", protocol.$meshSpec],
  ["Autoscale", protocol.$autoscale],
  ["AlertSpec", protocol.$alertSpec],
  ["Footprint", protocol.$footprint],
];
const shape = (schema: TJsonSchema) =>
  JSON.stringify(
    schema,
    (key, value) =>
      key === "$schema" || key === "description" ? undefined : value,
  );
const sharedNames = new Map<string, string>();
for (const [name, schema] of SHARED) {
  for (const io of ["input", "output"] as const) {
    const json = z.toJSONSchema(schema, { io, unrepresentable: "any" });
    sharedNames.set(shape(json as TJsonSchema), name);
  }
}

const goType = (schema: TJsonSchema, contextName: string): string => {
  const name = sharedNames.get(shape(schema)) ?? contextName;
  const union = schema.oneOf ?? schema.anyOf;
  if (union) return "any"; // a tagged union: send one of the generated variant structs
  if (schema.const !== undefined) return "string";

  switch (schema.type) {
    case "string":
      return "string";
    case "integer":
      return "int64";
    case "number":
      return "float64";
    case "boolean":
      return "bool";
    case "array":
      return `[]${goType(schema.items ?? {}, name + "Item")}`;
    case "object": {
      if (!schema.properties) {
        const value = typeof schema.additionalProperties === "object"
          ? goType(schema.additionalProperties, name + "Value")
          : "any";
        return `map[string]${value}`;
      }
      defineStruct(name, schema);
      return name;
    }
    default:
      return "any";
  }
};

const defineStruct = (name: string, schema: TJsonSchema) => {
  if (structs.has(name)) return;
  structs.set(name, ""); // reserve, so recursion terminates

  const required = new Set(schema.required ?? []);
  const fields = Object.entries(schema.properties ?? {}).map(([key, prop]) => {
    let type = goType(prop, name + pascal(key));
    const optional = !required.has(key);
    // Optional numbers, booleans and structs are pointers so "absent" differs from zero.
    if (optional && /^(int64|float64|bool|[A-Z]\w*)$/.test(type)) {
      type = `*${type}`;
    }
    const tag = `\`json:"${key}${optional ? ",omitempty" : ""}"\``;
    const doc = prop.description ? `\t// ${prop.description}\n` : "";
    const values = prop.enum ? `\t// One of: ${prop.enum.join(", ")}\n` : "";
    const constant = prop.const !== undefined
      ? `\t// Always "${prop.const}"\n`
      : "";
    return `${doc}${values}${constant}\t${pascal(key)} ${type} ${tag}`;
  });

  // Blank lines between fields keep the output gofmt-stable without column alignment.
  structs.set(name, `type ${name} struct {\n${fields.join("\n\n")}\n}`);
};

for (const [name] of MESSAGES) defineStruct(name, schemas[name]);

const header = Object.entries(protocol.AGENT_HEADERS)
  .map(([key, value]) => `const Header${pascal(key)} = "${value}"`)
  .join("\n\n");

const go =
  `// Code generated by scripts/generateProtocol.ts from schemas/protocol/agent.ts. DO NOT EDIT.

package protocol

const Version = ${protocol.PROTOCOL_VERSION}

${header}

${[...structs.values()].join("\n\n")}
`;

const json = JSON.stringify(
  {
    version: protocol.PROTOCOL_VERSION,
    headers: protocol.AGENT_HEADERS,
    schemas,
  },
  null,
  2,
) + "\n";

await Deno.mkdir("protocol", { recursive: true });
await Deno.mkdir("agent/internal/protocol", { recursive: true });
await Deno.writeTextFile("protocol/agent.schema.json", json);
await Deno.writeTextFile("agent/internal/protocol/types.gen.go", go);

console.log(
  "Protocol generated: protocol/agent.schema.json, agent/internal/protocol/types.gen.go",
);

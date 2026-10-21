import { encodeBase64Url } from "@std/encoding/base64url";
import { canonicalRequest, fingerprintOf, sign } from "@/lib/agents/signing.ts";
import {
  AGENT_HEADERS,
  PROTOCOL_VERSION,
  type TAgentConfig,
  type TAgentEvent,
  type TCommand,
  type THelloResponse,
} from "@/schemas/protocol/agent.ts";

/**
 * A simulated agent speaking the real protocol (PLAN §21.3): real Ed25519
 * signatures, cursors and idempotent command handling. Used by
 * `deno task dev:agents`, the load tests and the protocol tests.
 */

export type TSend = (request: Request) => Promise<Response>;

type TState = {
  hostname: string;
  signPrivateKey: JsonWebKey;
  signPublicKey: string;
  boxPublicKey: string;
  commandCursor: number;
  /** Completed command seqs, bounded (PLAN §20.4: last 10k). */
  done: number[];
};

const exportRaw = async (key: CryptoKey) =>
  encodeBase64Url(await crypto.subtle.exportKey("raw", key));

export const createState = async (hostname: string): Promise<TState> => {
  const signKeys = await crypto.subtle.generateKey("Ed25519", true, [
    "sign",
    "verify",
  ]) as CryptoKeyPair;
  const boxKeys = await crypto.subtle.generateKey({ name: "X25519" }, true, [
    "deriveBits",
  ]) as CryptoKeyPair;

  return {
    hostname,
    signPrivateKey: await crypto.subtle.exportKey("jwk", signKeys.privateKey),
    signPublicKey: await exportRaw(signKeys.publicKey),
    boxPublicKey: await exportRaw(boxKeys.publicKey),
    commandCursor: 0,
    done: [],
  };
};

/** One burst of output per stream kind, so the UI and tests have something to show. */
const simulatedStream = (payload: Record<string, unknown>): TAgentEvent[] => {
  const session = String(payload.session);
  const chunk = (seq: number, data: string, done?: boolean): TAgentEvent => ({
    id: `stream-${session}-${seq}`,
    type: "stream.chunk",
    data: { session, seq, data, done },
  });

  switch (payload.kind) {
    case "metrics":
      return [chunk(
        1,
        JSON.stringify([{
          t: Date.now(),
          cpu: 0.12,
          memUsed: 2 * 2 ** 30,
          memTotal: 8 * 2 ** 30,
          diskUsed: 20 * 2 ** 30,
          diskTotal: 80 * 2 ** 30,
          netRx: 1_000,
          netTx: 500,
          containers: [{
            id: "sim1",
            name: "huruf-edge",
            image: "caddy:2-alpine",
            state: "running",
            cpu: 0.01,
            mem: 30 * 2 ** 20,
          }],
        }]),
      )];
    case "exec":
      return [chunk(1, "simulated exec output\n", true)];
    default:
      return [
        chunk(1, `${new Date().toISOString()} simulated log line 1\n`),
        chunk(2, `${new Date().toISOString()} simulated log line 2\n`),
      ];
  }
};

export class SimAgent {
  private privateKey?: CryptoKey;
  private fingerprint?: string;
  readonly executed: number[] = [];
  /** Simulated terminals: session -> last input seq applied, last output seq. */
  readonly terminals = new Map<string, { input: number; output: number }>();
  /** Decided by the control plane; set by hello, refreshed on version change. */
  config?: TAgentConfig;
  configVersion?: string;

  constructor(
    readonly state: TState,
    private readonly opts: {
      baseUrl: string;
      tenant: string;
      joinToken?: string;
      send?: TSend;
      onStateChange?: (state: TState) => void | Promise<void>;
    },
  ) {}

  private async request(path: string, payload: unknown) {
    this.privateKey ??= await crypto.subtle.importKey(
      "jwk",
      this.state.signPrivateKey,
      "Ed25519",
      false,
      ["sign"],
    );
    this.fingerprint ??= await fingerprintOf(this.state.signPublicKey);

    const body = JSON.stringify(payload);
    const timestamp = Date.now().toString();
    const signature = await sign(
      this.privateKey,
      await canonicalRequest("POST", path, timestamp, body),
    );

    const response = await (this.opts.send ?? fetch)(
      new Request(new URL(path, this.opts.baseUrl), {
        method: "POST",
        headers: {
          "content-type": "application/json",
          [AGENT_HEADERS.key]: this.fingerprint,
          [AGENT_HEADERS.timestamp]: timestamp,
          [AGENT_HEADERS.signature]: signature,
          [AGENT_HEADERS.protocol]: String(PROTOCOL_VERSION),
        },
        body,
      }),
    );

    return {
      status: response.status,
      json: await response.json().catch(() => ({})) as Record<string, unknown>,
    };
  }

  async hello() {
    const response = await this.request("/agents/api/hello", {
      tenant: this.opts.tenant,
      joinToken: this.opts.joinToken,
      signPublicKey: this.state.signPublicKey,
      boxPublicKey: this.state.boxPublicKey,
      inventory: {
        hostname: this.state.hostname,
        os: "Ubuntu 24.04 (simulated)",
        arch: "amd64",
        cpuCores: 4,
        memory: 8 * 2 ** 30,
        disk: 80 * 2 ** 30,
        agentVersion: "sim-0.1.0",
      },
    }) as { status: number; json: THelloResponse };

    if (response.status === 200) {
      this.config = response.json.config;
      this.configVersion = response.json.version;
    }
    return response;
  }

  /** Refetches the control plane's runtime config (poll intervals, jitter, ...). */
  async refreshConfig() {
    const { status, json } = await this.request("/agents/api/config", {});
    if (status === 200) {
      this.config = json.config as TAgentConfig;
      this.configVersion = json.version as string;
    }
  }

  /** One poll. `cursor` overrides the stored cursor (tests replay lost responses). */
  async poll(opts: { cursor?: number; summary?: boolean } = {}) {
    const response = await this.request("/agents/api/poll", {
      commandCursor: opts.cursor ?? this.state.commandCursor,
      appliedVersion: 0,
      summary: opts.summary
        ? {
          cpu: Math.round(Math.random() * 30) / 100,
          memFree: 6 * 2 ** 30,
          diskFree: 60 * 2 ** 30,
        }
        : undefined,
      streams: this.terminals.size
        ? Object.fromEntries(
          [...this.terminals].map(([session, t]) => [session, t.input]),
        )
        : undefined,
    });

    const version = response.json.configVersion;
    if (version && version !== this.configVersion) await this.refreshConfig();

    const commands = (response.json.commands ?? []) as TCommand[];
    const events: TAgentEvent[] = this.echoTerminalInput(
      (response.json.streamInput ?? {}) as Record<
        string,
        { seq: number; data?: string }[]
      >,
    );

    for (const command of commands) {
      // Durably record receipt before acking it on the next poll.
      this.state.commandCursor = Math.max(
        this.state.commandCursor,
        command.seq,
      );
      if (this.state.done.includes(command.seq)) continue;

      this.executed.push(command.seq);
      this.state.done = [...this.state.done, command.seq].slice(-10_000);
      events.push({
        id: `cmd-${command.seq}`,
        type: "command.result",
        data: {
          seq: command.seq,
          ok: true,
          result: command.type === "docker.ensure"
            ? {
              dockerVersion: "27.0.0-sim",
              checks: [{ name: "os", ok: true, detail: "simulated" }],
            }
            : { pong: Date.now() },
        },
      });
      if (
        command.type === "stream.open" && command.payload.kind === "terminal"
      ) {
        this.terminals.set(String(command.payload.session), {
          input: 0,
          output: 0,
        });
      } else if (command.type === "stream.open") {
        events.push(...simulatedStream(command.payload));
      }
    }

    if (commands.length) await this.opts.onStateChange?.(this.state);
    if (events.length) await this.sendEvents(events);

    return response;
  }

  /** A simulated terminal echoes its input, once per seq, like a shell would. */
  private echoTerminalInput(
    input: Record<string, { seq: number; data?: string }[]>,
  ): TAgentEvent[] {
    const events: TAgentEvent[] = [];
    for (const [session, items] of Object.entries(input)) {
      const terminal = this.terminals.get(session);
      if (!terminal) continue;
      for (const item of items) {
        if (item.seq <= terminal.input) continue;
        terminal.input = item.seq;
        if (!item.data) continue;
        terminal.output++;
        events.push({
          id: `term-${session}-${terminal.output}`,
          type: "stream.chunk",
          data: { session, seq: terminal.output, data: item.data },
        });
      }
    }
    return events;
  }

  sendEvents(events: TAgentEvent[]) {
    return this.request("/agents/api/events", { events });
  }
}

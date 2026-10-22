import { assertEquals, assertThrows } from "@std/assert";
import {
  ComposeError,
  parseCompose,
  splitCommand,
} from "@/lib/deploy/compose.ts";

Deno.test("compose: services become runtime specs", () => {
  const [db] = parseCompose(
    `services:
  db:
    image: postgres:17-alpine
    environment:
      POSTGRES_PASSWORD: "s3cret"
      EMPTY:
    command: postgres -c 'max_connections=200'
    ports: ["5432:5432"]
    volumes: [data:/var/lib/postgresql/data]
    healthcheck:
      test: ["CMD", "pg_isready", "-U", "app user"]
    restart: unless-stopped
volumes:
  data:
`,
    "huruf-p1-",
  );
  assertEquals(db, {
    name: "db",
    image: "postgres:17-alpine",
    env: { POSTGRES_PASSWORD: "s3cret", EMPTY: "" },
    command: ["postgres", "-c", "max_connections=200"],
    port: 5432,
    healthcheckCommand: "pg_isready -U 'app user'",
    volumes: [{ name: "huruf-p1-data", mountPath: "/var/lib/postgresql/data" }],
  });
});

Deno.test("compose: unsupported features are reported up front", () => {
  assertThrows(
    () => parseCompose("services:\n  web:\n    build: .\n", "x-"),
    ComposeError,
    "needs an image",
  );
  assertThrows(
    () =>
      parseCompose(
        "services:\n  web:\n    image: nginx\n    privileged: true\nnetworks: {}\n",
        "x-",
      ),
    ComposeError,
    "Unsupported compose keys: networks, services.web.privileged",
  );
  assertThrows(
    () =>
      parseCompose(
        "services:\n  web:\n    image: nginx\n    volumes: ['./html:/usr/share/nginx/html']\n",
        "x-",
      ),
    ComposeError,
    "only named volumes",
  );
});

Deno.test("compose: commands split like a shell", () => {
  assertEquals(splitCommand(`server /data --console-address ":9001" ''`), [
    "server",
    "/data",
    "--console-address",
    ":9001",
    "",
  ]);
});

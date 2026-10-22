/**
 * Seed system templates (PLAN §9.1). Data only: `scripts/seedTemplates.ts`
 * upserts them by slug and adds a version when the content changes. Templates
 * see `inputs.*` and `build.cacheKey` (a per-project BuildKit cache id).
 * Guidelines: multi-stage builds, lockfile before source, caches hold only
 * package-manager download stores. Build-stage variables come as the
 * `huruf-env` secret: `RUN --mount=type=secret,id=huruf-env . /run/secrets/huruf-env && …`
 * (never ARG/ENV, which would keep them in the image).
 */

const nodeVersion = {
  key: "nodeVersion",
  label: "Node.js version",
  type: "string",
  default: "24",
  required: true,
};
const denoVersion = {
  key: "denoVersion",
  label: "Deno image tag",
  description:
    "A denoland/deno tag; pin a version (e.g. 2.5.6) for repeatable builds.",
  type: "string",
  default: "latest",
  required: true,
};
const port = (value: number) => ({
  key: "port",
  label: "Port the app listens on",
  type: "number",
  default: value,
  required: true,
});
const password = (key: string, label: string) => ({
  key,
  label,
  description:
    "Leave empty to generate one; it is stored as a secret variable.",
  type: "secret",
  generate: "password",
});

export const systemTemplates = [
  {
    meta: {
      slug: "thunder",
      name: "Thunder",
      kind: "app",
      icon: "bolt",
      description:
        "A Thunder (Deno + MongoDB) backend, served with deno serve.",
    },
    content: {
      inputs: [denoVersion, port(8000)],
      defaults: { port: 8000, healthcheckPath: "/" },
      dockerfile: `# syntax=docker/dockerfile:1
FROM denoland/deno:{{inputs.denoVersion}}
WORKDIR /app

# Dependencies first: this layer is reused until deno.json or the lockfile changes.
COPY deno.json deno.lock* ./
RUN deno install

COPY . .
RUN deno cache serve.ts

ENV ENV_TYPE=production
EXPOSE {{inputs.port}}
CMD ["deno", "serve", "-A", "--port={{inputs.port}}", "serve.ts"]
`,
    },
  },
  {
    meta: {
      slug: "react-vite",
      name: "React (Vite, static)",
      kind: "app",
      icon: "brand-react",
      description:
        "Builds a Vite app and serves the static output with Caddy, with SPA routing.",
    },
    content: {
      inputs: [
        nodeVersion,
        {
          key: "buildCommand",
          label: "Build command",
          type: "string",
          default: "npm run build",
          required: true,
        },
        {
          key: "outputDir",
          label: "Output directory",
          type: "string",
          default: "dist",
          required: true,
        },
      ],
      defaults: { port: 80, healthcheckPath: "/" },
      cachePaths: ["/root/.npm"],
      dockerfile: `# syntax=docker/dockerfile:1
FROM node:{{inputs.nodeVersion}}-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN --mount=type=cache,id={{build.cacheKey}}-npm,target=/root/.npm npm ci
COPY . .
RUN --mount=type=secret,id=huruf-env . /run/secrets/huruf-env && {{inputs.buildCommand}}

FROM caddy:2-alpine
COPY --from=build /app/{{inputs.outputDir}} /srv
COPY <<'EOF' /etc/caddy/Caddyfile
:80 {
	root * /srv
	encode gzip
	try_files {path} /index.html
	file_server
}
EOF
EXPOSE 80
`,
    },
  },
  {
    meta: {
      slug: "nextjs",
      name: "Next.js",
      kind: "app",
      icon: "brand-nextjs",
      description: "Builds and runs a Next.js app with next start.",
    },
    content: {
      inputs: [nodeVersion, port(3000)],
      defaults: { port: 3000, healthcheckPath: "/" },
      cachePaths: ["/root/.npm"],
      dockerfile: `# syntax=docker/dockerfile:1
FROM node:{{inputs.nodeVersion}}-alpine AS build
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
COPY package.json package-lock.json ./
RUN --mount=type=cache,id={{build.cacheKey}}-npm,target=/root/.npm npm ci
COPY . .
RUN --mount=type=secret,id=huruf-env . /run/secrets/huruf-env && npm run build && npm prune --omit=dev

FROM node:{{inputs.nodeVersion}}-alpine
WORKDIR /app
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 PORT={{inputs.port}}
COPY --from=build /app ./
EXPOSE {{inputs.port}}
CMD ["npm", "start"]
`,
    },
  },
  {
    meta: {
      slug: "node",
      name: "Node.js",
      kind: "app",
      icon: "brand-nodejs",
      description:
        "Any Node.js server: optional build step, then your start command.",
    },
    content: {
      inputs: [
        nodeVersion,
        port(3000),
        {
          key: "buildCommand",
          label: "Build command",
          description: "Optional, e.g. npm run build.",
          type: "string",
        },
        {
          key: "startCommand",
          label: "Start command",
          type: "string",
          default: "npm start",
          required: true,
        },
      ],
      defaults: { port: 3000, healthcheckPath: "/" },
      cachePaths: ["/root/.npm"],
      dockerfile: `# syntax=docker/dockerfile:1
FROM node:{{inputs.nodeVersion}}-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN --mount=type=cache,id={{build.cacheKey}}-npm,target=/root/.npm npm ci
COPY . .
{{#if inputs.buildCommand}}
RUN --mount=type=secret,id=huruf-env . /run/secrets/huruf-env && {{inputs.buildCommand}}
{{/if}}
RUN npm prune --omit=dev

FROM node:{{inputs.nodeVersion}}-alpine
WORKDIR /app
ENV NODE_ENV=production PORT={{inputs.port}}
COPY --from=build /app ./
EXPOSE {{inputs.port}}
CMD {{inputs.startCommand}}
`,
    },
  },
  {
    meta: {
      slug: "deno",
      name: "Deno",
      kind: "app",
      icon: "brand-deno",
      description:
        "Any Deno server, run from an entrypoint with explicit permissions.",
    },
    content: {
      inputs: [
        denoVersion,
        port(8000),
        {
          key: "entrypoint",
          label: "Entrypoint",
          type: "string",
          default: "main.ts",
          required: true,
        },
        {
          key: "permissions",
          label: "Permissions",
          type: "string",
          default: "--allow-net --allow-env --allow-read",
          required: true,
        },
      ],
      defaults: { port: 8000, healthcheckPath: "/" },
      dockerfile: `# syntax=docker/dockerfile:1
FROM denoland/deno:{{inputs.denoVersion}}
WORKDIR /app
COPY deno.json* deno.lock* ./
RUN if [ -f deno.json ]; then deno install; fi
COPY . .
RUN deno cache {{inputs.entrypoint}}
ENV PORT={{inputs.port}}
EXPOSE {{inputs.port}}
CMD deno run {{inputs.permissions}} {{inputs.entrypoint}}
`,
    },
  },
  {
    meta: {
      slug: "postgres",
      name: "PostgreSQL",
      kind: "service",
      icon: "database",
      description: "PostgreSQL with a persistent volume and a readiness check.",
    },
    content: {
      inputs: [
        {
          key: "version",
          label: "Version",
          type: "select",
          options: ["17", "16", "15"],
          default: "17",
          required: true,
        },
        {
          key: "user",
          label: "User",
          type: "string",
          default: "app",
          required: true,
        },
        {
          key: "database",
          label: "Database",
          type: "string",
          default: "app",
          required: true,
        },
        password("password", "Password"),
      ],
      defaults: { port: 5432 },
      compose: `services:
  postgres:
    image: postgres:{{inputs.version}}-alpine
    environment:
      POSTGRES_USER: "{{inputs.user}}"
      POSTGRES_PASSWORD: "{{inputs.password}}"
      POSTGRES_DB: "{{inputs.database}}"
    volumes:
      - data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U {{inputs.user}} -d {{inputs.database}}"]
      interval: 10s
      timeout: 5s
      retries: 5
volumes:
  data:
`,
    },
  },
  {
    meta: {
      slug: "mongodb",
      name: "MongoDB",
      kind: "service",
      icon: "leaf",
      description: "MongoDB with a root user and a persistent volume.",
    },
    content: {
      inputs: [
        {
          key: "version",
          label: "Version",
          type: "select",
          options: ["8.0", "7.0"],
          default: "8.0",
          required: true,
        },
        {
          key: "user",
          label: "Root user",
          type: "string",
          default: "admin",
          required: true,
        },
        password("password", "Root password"),
      ],
      defaults: { port: 27017 },
      compose: `services:
  mongodb:
    image: mongo:{{inputs.version}}
    environment:
      MONGO_INITDB_ROOT_USERNAME: "{{inputs.user}}"
      MONGO_INITDB_ROOT_PASSWORD: "{{inputs.password}}"
    volumes:
      - data:/data/db
    healthcheck:
      test: ["CMD", "mongosh", "--quiet", "--eval", "db.adminCommand('ping')"]
      interval: 10s
      timeout: 5s
      retries: 5
volumes:
  data:
`,
    },
  },
  {
    meta: {
      slug: "redis",
      name: "Redis",
      kind: "service",
      icon: "stack-2",
      description: "Redis with a password and append-only persistence.",
    },
    content: {
      inputs: [
        {
          key: "version",
          label: "Version",
          type: "select",
          options: ["8", "7"],
          default: "8",
          required: true,
        },
        password("password", "Password"),
      ],
      defaults: { port: 6379 },
      compose: `services:
  redis:
    image: redis:{{inputs.version}}-alpine
    command: ["redis-server", "--requirepass", "{{inputs.password}}", "--appendonly", "yes"]
    volumes:
      - data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "--no-auth-warning", "-a", "{{inputs.password}}", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5
volumes:
  data:
`,
    },
  },
  {
    meta: {
      slug: "mysql",
      name: "MySQL",
      kind: "service",
      icon: "database",
      description:
        "MySQL with an app user, a persistent volume and a readiness check.",
    },
    content: {
      inputs: [
        {
          key: "version",
          label: "Version",
          type: "select",
          options: ["8.4", "8.0"],
          default: "8.4",
          required: true,
        },
        {
          key: "user",
          label: "User",
          type: "string",
          default: "app",
          required: true,
        },
        {
          key: "database",
          label: "Database",
          type: "string",
          default: "app",
          required: true,
        },
        password("password", "Password"),
        password("rootPassword", "Root password"),
      ],
      defaults: { port: 3306 },
      compose: `services:
  mysql:
    image: mysql:{{inputs.version}}
    environment:
      MYSQL_ROOT_PASSWORD: "{{inputs.rootPassword}}"
      MYSQL_DATABASE: "{{inputs.database}}"
      MYSQL_USER: "{{inputs.user}}"
      MYSQL_PASSWORD: "{{inputs.password}}"
    volumes:
      - data:/var/lib/mysql
    healthcheck:
      test: ["CMD-SHELL", "mysqladmin ping -h 127.0.0.1 -u root -p\\"$$MYSQL_ROOT_PASSWORD\\""]
      interval: 10s
      timeout: 5s
      retries: 5
volumes:
  data:
`,
    },
  },
  {
    meta: {
      slug: "minio",
      name: "MinIO",
      kind: "service",
      icon: "bucket",
      description:
        "S3-compatible object storage with its web console on port 9001.",
    },
    content: {
      inputs: [
        {
          key: "user",
          label: "Root user",
          type: "string",
          default: "admin",
          required: true,
        },
        password("password", "Root password"),
      ],
      defaults: { port: 9000 },
      compose: `services:
  minio:
    image: minio/minio:latest
    command: ["server", "/data", "--console-address", ":9001"]
    environment:
      MINIO_ROOT_USER: "{{inputs.user}}"
      MINIO_ROOT_PASSWORD: "{{inputs.password}}"
    volumes:
      - data:/data
    healthcheck:
      test: ["CMD", "mc", "ready", "local"]
      interval: 10s
      timeout: 5s
      retries: 5
volumes:
  data:
`,
    },
  },
];

# syntax=docker/dockerfile:1
FROM denoland/deno:2.9.5
WORKDIR /app

# Dependencies first: this layer is reused until deno.json or the lockfile changes.
COPY deno.json deno.lock* ./
RUN deno install

COPY . .

ENV ENV_TYPE=production
EXPOSE 8000
CMD ["deno", "serve", "-A", "--port=8000", "serve.ts"]

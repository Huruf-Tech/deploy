# Huruf Deploy control plane: the API, the dashboard (public/app/www, built
# and committed) and the agent installer.
#
#   docker build -t huruf-deploy .
#   docker run -p 8000:8000 --env-file .env.production huruf-deploy
#
# Settings come from the environment, never from the image: DATABASE_URL (a
# replica set), SECRET_KEY, DEPLOY_MASTER_KEY, BASE_URL,
# BETTER_AUTH_TRUSTED_ORIGIN, SMTP_*, PLATFORM_TENANT… Run setup once against
# the database (indexes, permissions, Free plan, templates):
#
#   docker run --rm --env-file .env.production huruf-deploy deno task setup:prod
FROM denoland/deno:2.9.5

WORKDIR /app
ENV ENV_TYPE=production \
    DENO_NO_UPDATE_CHECK=1

COPY . .

# Routes and hooks (the app's and each plugin's) are discovered at startup and
# imported dynamically, so they're cached here explicitly, with the setup
# scripts; the lockfile keeps every dependency exactly as tested. The
# non-root `deno` user owns the cache.
RUN deno install --frozen --entrypoint serve.ts \
      $(find routes hooks scripts plugins/*/*/routes plugins/*/*/hooks \
        -name '*.ts' -not -name '*_test.ts') \
 && chown -R deno:deno /app /deno-dir

USER deno
EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD ["deno", "eval", "const r = await fetch('http://127.0.0.1:8000/'); Deno.exit(r.status < 500 ? 0 : 1)"]

CMD ["deno", "serve", "-A", "--port=8000", "serve.ts"]

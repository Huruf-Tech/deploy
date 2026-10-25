# Turning on custom domains (Phase 11)

Custom domains need ports **80** (Let's Encrypt's HTTP challenge, redirects) and **443** (visitors) to reach Traefik, and port **7000** (agents' tunnels) to reach frps. If nginx already serves the control plane on 80/443, pick one of the two setups below.

Settings for both (the `envs` collection, or `.env` next to the Compose file):

| Setting | Value |
|---|---|
| `COMPOSE_PROFILES` | `ingress` (in the `.env` Compose reads) |
| `INGRESS_CONFIG_TOKEN` | a long random string |
| `ACME_EMAIL` | an address for Let's Encrypt notices |
| `INGRESS_HOSTNAME` / `INGRESS_IPV4` | what users point their domains at (CNAME target / A record) |
| `INGRESS_TUNNEL_ADDRS` | `<this host's public IP>:7000` |

Open port 7000 in the security group. Port 8000 no longer needs to be public once a proxy is in front.

## A. Traefik replaces nginx (the chosen setup)

Traefik then also serves the dashboard, with its own Let's Encrypt certificate (TLS-ALPN, renewed by Traefik).

1. Check that nginx serves nothing else on this host: `sudo nginx -T | grep -E 'server_name|listen'`.
2. Set `INGRESS_SERVE_PLATFORM=true`.
3. `sudo systemctl disable --now nginx`, then redeploy with the `ingress` profile. The dashboard is unreachable for the few seconds between the two.
4. Check `https://deploy.huruftech.com`.

To undo it: remove the profile, then run `sudo systemctl enable --now nginx`.

## B. nginx stays in front (fallback)

nginx keeps the dashboard and its certificates, and hands every other hostname to Traefik **without decrypting it** (TLS passthrough by SNI), so Traefik's certificates are used.

Leave `INGRESS_SERVE_PLATFORM` unset, and move Traefik to local ports in the `.env` Compose reads:

```
INGRESS_HTTP_PORT=127.0.0.1:8080
INGRESS_HTTPS_PORT=127.0.0.1:8443
```

**Port 443**: nginx's `stream` module (Ubuntu: `apt install libnginx-mod-stream`). Put this at the **top level** of `/etc/nginx/nginx.conf`, not inside `http {}` or `conf.d/`:

```nginx
stream {
    map $ssl_preread_server_name $huruf_https {
        deploy.huruftech.com 127.0.0.1:4443;  # nginx's own dashboard server
        default              127.0.0.1:8443;  # Traefik: custom domains
    }
    server {
        listen 443;
        listen [::]:443;
        ssl_preread on;
        proxy_protocol on;  # passes the visitor's IP on
        proxy_pass $huruf_https;
    }
}
```

The dashboard's existing `server` block moves from `listen 443 ssl` to the internal port, and reads the visitor's IP from the PROXY header:

```nginx
listen 127.0.0.1:4443 ssl proxy_protocol;
set_real_ip_from 127.0.0.1;
real_ip_header proxy_protocol;
```

**Port 80**: hostnames nginx doesn't know go to Traefik (Let's Encrypt's challenges, redirects). Add this to `http {}`. If another server block is already `default_server` on 80, that one must give up the flag.

```nginx
server {
    listen 80 default_server;
    listen [::]:80 default_server;
    location / {
        proxy_pass http://127.0.0.1:8080;
        proxy_set_header Host $host;
    }
}
```

Then `sudo nginx -t && sudo systemctl reload nginx`, and redeploy with the `ingress` profile.

## Checking it

- `curl -I http://<a custom domain>/` should answer `301` to `https://` from Traefik.
- `docker logs <frps container>` should show `new proxy [...] success` per server once agents are updated.
- In the dashboard, a domain goes from **Checking DNS** to **Getting a certificate** to **Live**.

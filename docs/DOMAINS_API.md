# Customer domains through the API

For an app on Huruf Deploy that lets its own customers bring a domain (a
storefront, a site builder). The app adds each customer's domain to its
project through the API. Huruf Deploy checks it, issues and renews its
certificate, and routes it to the app.

## Once, for your platform

1. **Verify your own domain** on the project (Domains tab), e.g.
   `elvorro.site`. Any name at or under it then counts as yours.
2. **Create the name customers point at**, in that domain's DNS:
   `ingress.elvorro.site` → CNAME → the platform's ingress hostname (shown
   next to any domain's records), DNS only (no Cloudflare proxy).
3. **Ask the platform admin** to raise your workspace's domain limit
   (`DOMAIN_LIMITS`, e.g. `<workspace id>=500`). Plans allow a few.
4. **Create an API key** (Developer → API keys) with the scope `domainApi` for
   your workspace. It can list, add, check and remove domains, nothing else.

Every request sends `X-Api-Key: <secret>` and `X-Tenant-Id: <workspace id>`.

## Per customer domain

The customer creates one record at their DNS provider:

```
shop.customer.com   CNAME   ingress.elvorro.site
```

That CNAME is the ownership proof: only the domain's owner can point it at
your name. No TXT record is needed.

| Step | Request | Body / query |
| --- | --- | --- |
| Add | `POST /domains/api` | `{ "project": "<project id>", "hostname": "shop.customer.com" }` → `{ "_id" }` |
| Check (after the customer saved the record) | `POST /domains/api/<id>/check` | Rechecked every minute for 30 minutes |
| Status | `GET /domains/api?project=<project id>` | Each domain's `status`, `error`, `checks.detail` |
| Remove | `DELETE /domains/api/<id>` | Frees one place in the limit |

`status`: `pending` (waiting for Check) → `checking` → `issuing` (ordering its
certificate) → `verifying` → `active`. `failed` comes with `error` saying what
to fix. A domain whose record is already in place when it's added skips to
`issuing`.

Errors are `400` with a message (a bad name, already added, in use by another
account) or `403` when the limit is reached.

## In your app

Requests arrive with the customer's domain as `Host`. Look up which store owns
that hostname and serve it.

## Limits

- **The apex** (`customer.com` without `www`): most DNS providers refuse a
  CNAME there. Ask customers to use `www.customer.com`, or an A record to the
  platform's ingress IP (with the TXT record from the domain's `records`
  instead of the CNAME proof).
- Let's Encrypt allows 3 orders an hour per domain here; a domain that keeps
  failing gives up after 5 tries. Check it again once the record is fixed.

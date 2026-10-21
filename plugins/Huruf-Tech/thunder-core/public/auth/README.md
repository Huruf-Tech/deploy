# Huruf OAuth

The hosted sign-in, consent and account-management UI for the Thunder backend.
It's a React single-page app built on [Better Auth](https://better-auth.com)
(sessions, passkeys, 2FA, magic links, multi-session) and the Thunder SDK
(OAuth clients, API keys, tenants).

## Features

- **Sign in**: email + password, magic link, passkeys (including browser
  autofill), social providers, and 2-step verification with TOTP or backup codes.
- **Sign up and recovery**: password policy enforcement, email verification with
  resend, and password reset.
- **OAuth consent**: client details, readable scopes, and a deny flow that
  follows RFC 6749 (`access_denied` is only sent back to a registered
  `redirect_uri`).
- **Account**: profile and photo, password change, passkey management, 2FA
  setup and backup codes, connected social accounts, and active devices with
  remote sign-out.
- **Developers**: OAuth apps (public or confidential, with secret rotation)
  and API keys (scopes, per-tenant grants, expiry, usage).
- **Members**: tenant invitations and roles (shown when `?tenant=` is present).
- Multi-account switching, light/dark/system themes, English and Arabic (RTL).

Everything is driven by the backend: branding (`/auth/branding`) sets the name,
logo and theme colors, and capabilities (`/auth/api/capabilities`) toggle
sign-in methods and features.

## Getting started

```bash
npm install
npm run dev        # http://localhost:5173
```

| Script            | What it does                                          |
| ----------------- | ----------------------------------------------------- |
| `npm run dev`     | Vite dev server                                       |
| `npm run build`   | Type-check and build to `www/` (served under `/auth`) |
| `npm run preview` | Serve the production build                            |
| `npm run lint`    | ESLint                                                |
| `npm run fmt`     | Prettier                                              |

### Environment

| Variable          | Description                                                                          |
| ----------------- | ------------------------------------------------------------------------------------ |
| `VITE_API_ORIGIN` | Thunder backend origin. Leave empty in production when the app is served by the API. |

`.env.development` points at the shared dev backend. Nothing else is needed.
Never commit secrets: every `VITE_*` value ends up in the public bundle.

### Feature flags

UI features can be switched off per deployment. Each one is **on by default**;
set it to `false` (or `0`, `off`, `no`) in the relevant `.env.*` file and
rebuild. See [`.env.example`](.env.example) for a template.

| Variable                         | Controls                                                    |
| -------------------------------- | ----------------------------------------------------------- |
| `VITE_ENABLE_OAUTH_APPS`         | Developers → OAuth apps                                     |
| `VITE_ENABLE_API_KEYS`           | Developers → API keys (section hidden when both are off)    |
| `VITE_ENABLE_MEMBERS`            | Members & invitations (needs `?tenant=`)                    |
| `VITE_ENABLE_CONNECTED_ACCOUNTS` | Security → Connected accounts                               |
| `VITE_ENABLE_DEVICE_SESSIONS`    | Security → Your devices                                     |
| `VITE_ENABLE_PROFILE_EDITING`    | Editing name, gender, birthday and photo (read-only if off) |
| `VITE_ENABLE_THEME_SWITCHER`     | Theme toggle in the header                                  |
| `VITE_ENABLE_LANGUAGE_SWITCHER`  | Language picker in the header                               |

Flags only hide the UI; the backend's permissions remain the source of truth.
Sign-in methods (passkeys, magic link, 2FA, social providers, sign-up) are
controlled by the backend's capabilities, not by these flags. Add a new flag
in `src/lib/features.ts` and `src/vite-env.d.ts`.

## Branding

Nothing project-specific is hardcoded. Every brand surface (header, page
titles, favicon, brand panel, consent screen, footer, authenticator-app issuer)
comes from `useAppBranding()`, which reads `GET /auth/branding/` from the
backend:

```jsonc
{
  "name": "Acme Cloud", // required
  "description": "Shown on the brand panel",
  "logo": "https://…/logo.png", // header, consent screen and favicon
  "icon": "https://…/icon.png", // used only when `logo` is missing
  "homepageURL": "https://acme.example",
  "termsURL": "https://acme.example/terms", // legal links appear only when set
  "privacyURL": "https://acme.example/privacy",
  "supportEmail": "support@acme.example",
  "hidePoweredBy": true,
  "heroImage": "https://…/hero.jpg", // sign-in panel background; hides the floating card
  "heroTitle": "Ship faster with Acme Cloud.", // sign-in panel headline
  "theme": {
    "--primary": "oklch(0.55 0.24 293)",
    "--primary-foreground": "oklch(1 0 0)",
  },
}
```

`heroTitle` defaults to "One account for everything {name}." The sign-in panel
uses the theme's `--primary` color (gray when none is set) and, when
`heroImage` is set, shows that image instead of the floating "Verified" card.
A hero image that fails to load falls back to the default panel.

The logo is used everywhere, favicon included. When the backend sends no
`logo`/`icon`, or the image fails to load, the Huruf logo is shown instead.
The Huruf name is only a fallback while branding loads or if the endpoint
fails.

## Query parameters

The app is configured through query parameters, which are carried across every
page so a flow never loses its context:

| Parameter                                                          | Purpose                                                                                   |
| ------------------------------------------------------------------ | ----------------------------------------------------------------------------------------- |
| `client_id`, `redirect_uri`, `scope`, `state`, `code_challenge`, … | OAuth authorization request; resumed after sign-in                                        |
| `redirect`                                                         | Where to go after sign-in (http/https only)                                               |
| `returnUri`                                                        | Shows a "Back to app" button in the account area                                          |
| `tab`, `view`                                                      | Deep link to an account section (`home`, `personal`, `security`, `developers`, `members`) |
| `tenant`                                                           | Enables the Members section for that tenant                                               |
| `theme`                                                            | `light`, `dark` or `system` (persisted)                                                   |
| `lng`                                                              | `en` or `ar` (persisted)                                                                  |

## Project structure

```
src/
  router.tsx            routes (lazy-loaded per page)
  App.tsx               providers: SWR, theme, direction, loading, confirm dialog
  lib/                  api, auth client, SDK setup, navigation and utilities
  hooks/                data hooks (branding, capabilities, account data, pagination)
  contexts/             Theme, Loading (top progress bar), Confirm (imperative dialog)
  components/
    ui/                 design-system primitives (shadcn / coss)
    layout/             AuthLayout (split screen), AccountLayout (sidebar)
    form/               PasswordInput, PasswordStrength, OtpInput
  pages/
    Login/ Signup / ChangePassword / Consent / Logout / NotFound
    Account/            Overview, PersonalInfo, Security/, Developers/, Members/
  locales/              translations (English strings are the keys)
```

## Conventions

- **Translations:** wrap user-facing strings in `t("English text")` and add the
  Arabic entry to `src/locales/ar/translation.json`. Strings with `{{count}}`
  need plural forms (`_one`, `_other` in English; `_zero` … `_other` in Arabic).
- **Theming:** use semantic tokens (`bg-card`, `text-muted-foreground`,
  `bg-primary`, …), never raw colors, so tenant themes and dark mode keep working.
- **Navigation:** use `withSearch()` from `lib/navigation` so in-app links keep
  the OAuth parameters.
- **Destructive actions:** confirm them with `useConfirm()`.
- **Commits:** follow Conventional Commits. Enable the hooks with
  `npm run register:hooks`.

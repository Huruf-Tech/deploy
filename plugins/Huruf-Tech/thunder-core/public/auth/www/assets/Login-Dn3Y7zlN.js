import {
  Et as e,
  K as t,
  _ as n,
  a as r,
  dt as i,
  n as a,
  st as o,
  ut as s,
  wt as c,
  xt as l,
  y as u,
} from "./useAppBranding-GcljM9XV.js";
import { E as d, T as f, r as p, t as m } from "./AuthLayout-B7RMIG_n.js";
import {
  a as h,
  i as g,
  n as _,
  o as v,
  r as y,
  t as b,
} from "./OtpInput-Bje10j5L.js";
import {
  a as x,
  i as S,
  n as C,
  r as w,
  t as T,
} from "./PasswordInput-DKq4dsX4.js";
import { t as E } from "./mail-check-CpZB-loQ.js";
import { t as ee } from "./mail-D1PhSive.js";
import {
  C as D,
  D as O,
  E as k,
  Hr as A,
  S as j,
  b as M,
  l as N,
  o as P,
  w as F,
  x as I,
  y as L,
} from "./index-CvWHA45R.js";
import { t as R } from "./auth-DO2_vqL6.js";
import { n as z, t as B } from "./navigation-Dd1cx1bO.js";
import { r as V, t as H } from "./index.esm-DYQrnkVj.js";
import { a as U, n as W, t as G } from "./SocialButtons-D3G1TVGi.js";
import { t as K } from "./useOnLogin-BBimfqRd.js";
var q = r(`clipboard-paste`, [
    [`path`, { d: `M11 14h10`, key: `1w8e9d` }],
    [`path`, { d: `M16 4h2a2 2 0 0 1 2 2v1.344`, key: `1e62lh` }],
    [`path`, { d: `m17 18 4-4-4-4`, key: `z2g111` }],
    [
      `path`,
      {
        d: `M8 4H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 1.793-1.113`,
        key: `bjbb7m`,
      },
    ],
    [
      `rect`,
      { x: `8`, y: `2`, width: `8`, height: `4`, rx: `1`, key: `ublpy` },
    ],
  ]),
  J = e(c(), 1),
  Y = t();
function X({ onTwoFactor: e }) {
  let { t } = o(),
    r = K(),
    [i] = l(),
    [a, c] = J.useState(),
    {
      control: u,
      register: d,
      handleSubmit: f,
      formState: p,
    } = V({
      defaultValues: {
        email: i.get(`email`) ?? ``,
        password: ``,
        rememberMe: !0,
      },
    });
  return (0, Y.jsx)(`form`, {
    onSubmit: f(async (n) => {
      c(void 0);
      let { data: i, error: a } = await R.signIn.email(n);
      if (a) {
        a.status === 403
          ? c(n.email)
          : A.error(a.message ?? t(`Invalid email or password`));
        return;
      }
      i.twoFactorRedirect ? e() : r();
    }),
    noValidate: !0,
    children: (0, Y.jsxs)(j, {
      className: `gap-5`,
      children: [
        a && (0, Y.jsx)(Z, { email: a }),
        (0, Y.jsxs)(L, {
          children: [
            (0, Y.jsx)(D, { htmlFor: `email`, children: t(`Email`) }),
            (0, Y.jsx)(N, {
              id: `email`,
              type: `email`,
              placeholder: `you@example.com`,
              autoComplete: `username webauthn`,
              "aria-invalid": !!p.errors.email || void 0,
              ...d(`email`, {
                validate: (e) => n(e) || t(`Please provide a valid email!`),
              }),
            }),
            (0, Y.jsx)(I, { children: p.errors.email?.message }),
          ],
        }),
        (0, Y.jsxs)(L, {
          children: [
            (0, Y.jsxs)(`div`, {
              className: `flex items-center justify-between`,
              children: [
                (0, Y.jsx)(D, { htmlFor: `password`, children: t(`Password`) }),
                (0, Y.jsx)(s, {
                  to: z(`/reset-password`, { omit: B }),
                  viewTransition: !0,
                  className: `text-sm text-muted-foreground hover:text-foreground`,
                  children: t(`Forgot password?`),
                }),
              ],
            }),
            (0, Y.jsx)(T, {
              id: `password`,
              autoComplete: `current-password webauthn`,
              "aria-invalid": !!p.errors.password || void 0,
              ...d(`password`, { required: t(`Password is required!`) }),
            }),
            (0, Y.jsx)(I, { children: p.errors.password?.message }),
          ],
        }),
        (0, Y.jsx)(H, {
          name: `rememberMe`,
          control: u,
          render: ({ field: e }) =>
            (0, Y.jsxs)(L, {
              orientation: `horizontal`,
              children: [
                (0, Y.jsx)(_, {
                  id: `rememberMe`,
                  checked: e.value,
                  onCheckedChange: e.onChange,
                }),
                (0, Y.jsx)(k, {
                  htmlFor: `rememberMe`,
                  className: `font-normal`,
                  children: t(`Keep me signed in`),
                }),
              ],
            }),
        }),
        (0, Y.jsxs)(O, {
          type: `submit`,
          size: `lg`,
          disabled: p.isSubmitting,
          children: [p.isSubmitting && (0, Y.jsx)(P, {}), t(`Sign in`)],
        }),
      ],
    }),
  });
}
function Z({ email: e }) {
  let { t } = o(),
    { state: n, resend: r } = U();
  return (0, Y.jsxs)(y, {
    variant: `warning`,
    children: [
      (0, Y.jsx)(v, {}),
      (0, Y.jsx)(h, { children: t(`Verify your email to continue`) }),
      (0, Y.jsxs)(g, {
        children: [
          n === `sent`
            ? t(`We sent a new verification link to {{email}}.`, { email: e })
            : t(`Check your inbox for the verification link.`),
          n !== `sent` &&
            (0, Y.jsxs)(O, {
              variant: `link`,
              size: `sm`,
              className: `h-auto p-0 text-foreground`,
              onClick: () => r(e),
              disabled: n === `sending`,
              children: [
                n === `sending` && (0, Y.jsx)(P, {}),
                t(`Resend verification email`),
              ],
            }),
        ],
      }),
    ],
  });
}
function Q() {
  let { t: e } = o(),
    [t] = l(),
    [r, i] = J.useState(),
    {
      register: a,
      handleSubmit: s,
      formState: c,
    } = V({ defaultValues: { email: t.get(`email`) ?? `` } });
  return r
    ? (0, Y.jsxs)(`div`, {
        className: `flex flex-col items-center gap-4 rounded-xl border bg-card p-6 text-center animate-in fade-in zoom-in-95`,
        children: [
          (0, Y.jsx)(`div`, {
            className: `flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary`,
            children: (0, Y.jsx)(E, { className: `size-5` }),
          }),
          (0, Y.jsxs)(`div`, {
            className: `flex flex-col gap-1`,
            children: [
              (0, Y.jsx)(`h2`, {
                className: `font-semibold`,
                children: e(`Check your inbox`),
              }),
              (0, Y.jsx)(`p`, {
                className: `text-sm text-muted-foreground`,
                children: e(
                  `We sent a sign-in link to {{email}}. It expires shortly.`,
                  { email: r },
                ),
              }),
            ],
          }),
          (0, Y.jsx)(O, {
            variant: `ghost`,
            size: `sm`,
            onClick: () => i(void 0),
            children: e(`Use a different email`),
          }),
        ],
      })
    : (0, Y.jsx)(`form`, {
        onSubmit: s(async ({ email: e }) => {
          let { error: t } = await R.signIn.magicLink({
            email: e,
            callbackURL: u(z(`/account`, { omit: B })),
            errorCallbackURL: u(z(`/login`, { omit: B })),
          });
          t ? A.error(t.message) : i(e);
        }),
        noValidate: !0,
        children: (0, Y.jsxs)(j, {
          className: `gap-5`,
          children: [
            (0, Y.jsxs)(L, {
              children: [
                (0, Y.jsx)(D, { htmlFor: `magic-email`, children: e(`Email`) }),
                (0, Y.jsx)(N, {
                  id: `magic-email`,
                  type: `email`,
                  placeholder: `you@example.com`,
                  autoComplete: `email`,
                  "aria-invalid": !!c.errors.email || void 0,
                  ...a(`email`, {
                    validate: (t) => n(t) || e(`Please provide a valid email!`),
                  }),
                }),
                (0, Y.jsx)(I, { children: c.errors.email?.message }),
              ],
            }),
            (0, Y.jsxs)(O, {
              type: `submit`,
              size: `lg`,
              disabled: c.isSubmitting,
              children: [
                c.isSubmitting && (0, Y.jsx)(P, {}),
                e(`Email me a sign-in link`),
              ],
            }),
          ],
        }),
      });
}
function $({ onCancel: e }) {
  let { t } = o(),
    [n, r] = J.useState(!1);
  return (0, Y.jsxs)(`div`, {
    className: `flex flex-col gap-5`,
    children: [
      n ? (0, Y.jsx)(ne, {}) : (0, Y.jsx)(te, {}),
      (0, Y.jsxs)(`div`, {
        className: `flex items-center justify-between gap-3 border-t pt-4`,
        children: [
          (0, Y.jsx)(O, {
            variant: `link`,
            size: `sm`,
            className: `px-0`,
            onClick: e,
            children: t(`Back to sign in`),
          }),
          (0, Y.jsx)(O, {
            variant: `link`,
            size: `sm`,
            className: `px-0`,
            onClick: () => r((e) => !e),
            children: t(n ? `Use authenticator app` : `Use a backup code`),
          }),
        ],
      }),
    ],
  });
}
function te() {
  let { t: e } = o(),
    t = K(),
    [n, r] = J.useState(``),
    [i, a] = J.useState(!1),
    [s, c] = J.useState(!1),
    [l, u] = J.useState(!1),
    d = async (n) => {
      if (n.length !== 6 || s) return;
      c(!0);
      let { error: a } = await R.twoFactor.verifyTotp({
        code: n,
        trustDevice: i,
      });
      if ((c(!1), a)) {
        (u(!0), r(``), A.error(a.message ?? e(`Invalid code`)));
        return;
      }
      t();
    };
  return (0, Y.jsx)(`form`, {
    onSubmit: (e) => {
      (e.preventDefault(), d(n));
    },
    children: (0, Y.jsxs)(j, {
      className: `gap-5`,
      children: [
        (0, Y.jsx)(b, {
          value: n,
          invalid: l,
          disabled: s,
          onChange: (e) => {
            (u(!1), r(e));
          },
          onComplete: d,
        }),
        (0, Y.jsxs)(L, {
          orientation: `horizontal`,
          className: `justify-center`,
          children: [
            (0, Y.jsx)(_, {
              id: `trustDevice`,
              checked: i,
              onCheckedChange: a,
            }),
            (0, Y.jsx)(k, {
              htmlFor: `trustDevice`,
              className: `font-normal`,
              children: e(`Trust this device for 30 days`),
            }),
          ],
        }),
        (0, Y.jsxs)(O, {
          type: `submit`,
          size: `lg`,
          disabled: s || n.length !== 6,
          children: [s && (0, Y.jsx)(P, {}), e(`Verify`)],
        }),
      ],
    }),
  });
}
function ne() {
  let { t: e } = o(),
    t = K(),
    {
      register: n,
      handleSubmit: r,
      setValue: i,
      formState: a,
    } = V({ defaultValues: { code: `` } });
  return (0, Y.jsx)(`form`, {
    onSubmit: r(async ({ code: n }) => {
      let { error: r } = await R.twoFactor.verifyBackupCode({
        code: n.trim(),
        disableSession: !1,
      });
      if (r) {
        A.error(r.message ?? e(`Invalid backup code`));
        return;
      }
      t();
    }),
    noValidate: !0,
    children: (0, Y.jsxs)(j, {
      className: `gap-5`,
      children: [
        (0, Y.jsxs)(L, {
          children: [
            (0, Y.jsx)(D, {
              htmlFor: `backup-code`,
              children: e(`Backup code`),
            }),
            (0, Y.jsxs)(C, {
              children: [
                (0, Y.jsx)(x, {
                  id: `backup-code`,
                  autoComplete: `off`,
                  autoFocus: !0,
                  placeholder: `XXXXX-XXXXX`,
                  className: `font-mono`,
                  "aria-invalid": !!a.errors.code || void 0,
                  ...n(`code`, { required: e(`Backup code is required!`) }),
                }),
                (0, Y.jsx)(w, {
                  align: `inline-end`,
                  children: (0, Y.jsxs)(S, {
                    "aria-label": e(`Paste`),
                    onClick: async () => {
                      try {
                        i(
                          `code`,
                          (await navigator.clipboard.readText()).trim(),
                          { shouldValidate: !0 },
                        );
                      } catch {
                        A.error(e(`Clipboard access was denied`));
                      }
                    },
                    children: [(0, Y.jsx)(q, {}), e(`Paste`)],
                  }),
                }),
              ],
            }),
            (0, Y.jsx)(I, { children: a.errors.code?.message }),
            (0, Y.jsx)(M, {
              children: e(`Each backup code can only be used once.`),
            }),
          ],
        }),
        (0, Y.jsxs)(O, {
          type: `submit`,
          size: `lg`,
          disabled: a.isSubmitting,
          children: [a.isSubmitting && (0, Y.jsx)(P, {}), e(`Verify`)],
        }),
      ],
    }),
  });
}
var re = new Set([`AUTH_CANCELLED`, `ERROR_CEREMONY_ABORTED`]);
function ie() {
  let { t: e } = o(),
    { appName: t } = a(),
    { has: n, isLoading: r } = p(),
    [c] = l(),
    { data: u, isPending: d } = R.useSession(),
    h = W(),
    g = n(`email`),
    _ = n(`magicLink`),
    [v, y] = J.useState(`password`),
    b = v === `password` && !g && _ ? `magicLink` : v,
    x = c.get(`error`);
  if (
    (J.useEffect(() => {
      x &&
        A.error(e(`Sign in failed`), {
          description: x.replaceAll(`_`, ` `).toLowerCase(),
        });
    }, [x, e]),
    !d && u && !c.has(`addAccount`))
  )
    return (0, Y.jsx)(i, { to: z(`/account`, { omit: B }), replace: !0 });
  if (b === `twoFactor`)
    return (0, Y.jsx)(m, {
      title: e(`Two-step verification`),
      heading: e(`Two-step verification`),
      description: e(
        `Enter the 6-digit code from your authenticator app to finish signing in.`,
      ),
      children: (0, Y.jsx)($, { onCancel: () => y(`password`) }),
    });
  let S = g || _;
  return (0, Y.jsx)(m, {
    title: e(`Sign in`),
    heading: c.has(`addAccount`) ? e(`Add another account`) : e(`Welcome back`),
    description: e(`Sign in to continue to {{name}}`, { name: t }),
    footer:
      n(`signup`) &&
      (0, Y.jsxs)(Y.Fragment, {
        children: [
          e(`Don't have an account?`),
          ` `,
          (0, Y.jsx)(s, {
            to: z(`/signup`, { omit: B }),
            viewTransition: !0,
            className: `font-medium text-foreground underline-offset-4 hover:underline`,
            children: e(`Create one`),
          }),
        ],
      }),
    children: (0, Y.jsxs)(`div`, {
      className: `flex flex-col gap-5`,
      children: [
        (0, Y.jsx)(G, {}),
        n(`passkey`) && (0, Y.jsx)(ae, {}),
        S &&
          (h.length > 0 || n(`passkey`)) &&
          (0, Y.jsx)(F, { children: e(`or`) }),
        b === `magicLink`
          ? (0, Y.jsx)(Q, {})
          : g
            ? (0, Y.jsx)(X, { onTwoFactor: () => y(`twoFactor`) })
            : null,
        g &&
          _ &&
          (0, Y.jsxs)(O, {
            variant: `ghost`,
            className: `text-muted-foreground`,
            onClick: () => y(b === `magicLink` ? `password` : `magicLink`),
            children: [
              b === `magicLink` ? (0, Y.jsx)(f, {}) : (0, Y.jsx)(ee, {}),
              e(
                b === `magicLink`
                  ? `Sign in with password instead`
                  : `Email me a sign-in link instead`,
              ),
            ],
          }),
        !r &&
          !S &&
          h.length === 0 &&
          !n(`passkey`) &&
          (0, Y.jsx)(`p`, {
            className: `rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground`,
            children: e(`No sign-in methods are enabled for this app.`),
          }),
        (0, Y.jsx)(oe, {}),
      ],
    }),
  });
}
function ae() {
  let { t: e } = o(),
    t = K(),
    [n, r] = J.useState(!1);
  return (
    J.useEffect(() => {
      let e = !1;
      return (
        (async () => {
          if (
            !(await window.PublicKeyCredential?.isConditionalMediationAvailable?.()) ||
            e
          )
            return;
          let { error: n } = await R.signIn.passkey({ autoFill: !0 });
          !n && !e && t();
        })().catch(() => {}),
        () => {
          e = !0;
        }
      );
    }, [t]),
    (0, Y.jsxs)(O, {
      variant: `outline`,
      size: `lg`,
      onClick: async () => {
        r(!0);
        let { error: e } = await R.signIn.passkey();
        if ((r(!1), e)) {
          re.has(e.code ?? ``) || A.error(e.message);
          return;
        }
        t();
      },
      disabled: n,
      children: [
        n ? (0, Y.jsx)(P, {}) : (0, Y.jsx)(d, {}),
        e(`Sign in with a passkey`),
      ],
    })
  );
}
function oe() {
  let { t: e } = o(),
    { app: t } = a();
  if (!t?.termsURL && !t?.privacyURL) return null;
  let n = (e, t) =>
    (0, Y.jsx)(`a`, {
      href: e,
      target: `_blank`,
      rel: `noreferrer`,
      className: `text-foreground underline underline-offset-4`,
      children: t,
    });
  return (0, Y.jsxs)(`p`, {
    className: `text-center text-xs text-balance text-muted-foreground`,
    children: [
      e(`By continuing, you agree to the`),
      ` `,
      t.termsURL && n(t.termsURL, e(`Terms of Service`)),
      t.termsURL &&
        t.privacyURL &&
        (0, Y.jsxs)(Y.Fragment, { children: [` `, e(`and`), ` `] }),
      t.privacyURL && n(t.privacyURL, e(`Privacy Policy`)),
      `.`,
    ],
  });
}
export { ie as default };

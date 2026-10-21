import {
  Et as e,
  K as t,
  _ as n,
  st as r,
  ut as i,
  wt as a,
  xt as o,
  y as s,
} from "./useAppBranding-GcljM9XV.js";
import { t as c } from "./AuthLayout-B7RMIG_n.js";
import { t as l } from "./arrow-left-DYUggq6L.js";
import { t as u } from "./mail-check-CpZB-loQ.js";
import {
  C as d,
  D as f,
  Hr as p,
  S as m,
  l as h,
  o as g,
  x as _,
  y as v,
} from "./index-CvWHA45R.js";
import { t as y } from "./auth-DO2_vqL6.js";
import { n as b, t as x } from "./navigation-Dd1cx1bO.js";
import { r as S } from "./index.esm-DYQrnkVj.js";
var C = e(a(), 1),
  w = t();
function T() {
  let { t: e } = r(),
    [t] = o(),
    [a, T] = C.useState(),
    {
      register: E,
      handleSubmit: D,
      formState: O,
    } = S({ defaultValues: { email: t.get(`email`) ?? `` } }),
    k = async ({ email: e }) => {
      let { error: t } = await y.requestPasswordReset({
        email: e,
        redirectTo: s(b(`/change-password`, { omit: x })),
      });
      if (t) {
        p.error(t.message);
        return;
      }
      T(e);
    },
    A = (0, w.jsxs)(i, {
      to: b(`/login`, { omit: x }),
      viewTransition: !0,
      className: `inline-flex items-center gap-1.5 font-medium text-foreground underline-offset-4 hover:underline`,
      children: [
        (0, w.jsx)(l, { className: `size-4 rtl:rotate-180` }),
        e(`Back to sign in`),
      ],
    });
  return a
    ? (0, w.jsx)(c, {
        title: e(`Reset password`),
        footer: A,
        children: (0, w.jsxs)(`div`, {
          className: `flex flex-col items-center gap-4 text-center`,
          children: [
            (0, w.jsx)(`div`, {
              className: `flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary`,
              children: (0, w.jsx)(u, { className: `size-6` }),
            }),
            (0, w.jsxs)(`div`, {
              className: `flex flex-col gap-1.5`,
              children: [
                (0, w.jsx)(`h1`, {
                  className: `text-2xl font-semibold`,
                  children: e(`Check your inbox`),
                }),
                (0, w.jsx)(`p`, {
                  className: `text-sm text-muted-foreground`,
                  children: e(
                    `If an account exists for {{email}}, you'll get an email with a link to reset your password.`,
                    { email: a },
                  ),
                }),
              ],
            }),
            (0, w.jsx)(f, {
              variant: `ghost`,
              size: `sm`,
              onClick: () => T(void 0),
              children: e(`Use a different email`),
            }),
          ],
        }),
      })
    : (0, w.jsx)(c, {
        title: e(`Reset password`),
        heading: e(`Forgot your password?`),
        description: e(
          `Enter the email you use to sign in and we'll send you a reset link.`,
        ),
        footer: A,
        children: (0, w.jsx)(`form`, {
          onSubmit: D(k),
          noValidate: !0,
          children: (0, w.jsxs)(m, {
            className: `gap-5`,
            children: [
              (0, w.jsxs)(v, {
                children: [
                  (0, w.jsx)(d, { htmlFor: `email`, children: e(`Email`) }),
                  (0, w.jsx)(h, {
                    id: `email`,
                    type: `email`,
                    autoComplete: `email`,
                    placeholder: `you@example.com`,
                    autoFocus: !0,
                    "aria-invalid": !!O.errors.email || void 0,
                    ...E(`email`, {
                      validate: (t) =>
                        n(t) || e(`Please provide a valid email!`),
                    }),
                  }),
                  (0, w.jsx)(_, { children: O.errors.email?.message }),
                ],
              }),
              (0, w.jsxs)(f, {
                type: `submit`,
                size: `lg`,
                disabled: O.isSubmitting,
                children: [
                  O.isSubmitting && (0, w.jsx)(g, {}),
                  e(`Send reset link`),
                ],
              }),
            ],
          }),
        }),
      });
}
export { T as default };

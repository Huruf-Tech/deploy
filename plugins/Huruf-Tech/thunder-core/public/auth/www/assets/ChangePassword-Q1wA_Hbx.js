import {
  Et as e,
  K as t,
  st as n,
  ut as r,
  wt as i,
  xt as a,
} from "./useAppBranding-GcljM9XV.js";
import { t as o } from "./AuthLayout-B7RMIG_n.js";
import { t as s } from "./StatusMessage-CDiXpIRA.js";
import { t as c } from "./PasswordInput-DKq4dsX4.js";
import { n as l, t as u } from "./PasswordStrength-2dmuRzKw.js";
import {
  C as d,
  D as f,
  Hr as p,
  S as m,
  o as h,
  x as g,
  y as _,
} from "./index-CvWHA45R.js";
import { t as v } from "./auth-DO2_vqL6.js";
import { n as y, t as b } from "./navigation-Dd1cx1bO.js";
import { r as x } from "./index.esm-DYQrnkVj.js";
var S = e(i(), 1),
  C = t();
function w() {
  let { t: e } = n(),
    [t] = a(),
    i = t.get(`token`),
    w = t.get(`error`),
    [T, E] = S.useState(!1),
    {
      register: D,
      handleSubmit: O,
      formState: k,
      watch: A,
    } = x({ defaultValues: { password: ``, confirmPassword: `` } }),
    j = A(`password`),
    M = async (e) => {
      let { error: t } = await v.resetPassword({
        newPassword: e.password,
        token: i,
      });
      if (t) {
        p.error(t.message);
        return;
      }
      E(!0);
    },
    N = y(`/login`, { omit: b });
  return !i || w
    ? (0, C.jsx)(o, {
        title: e(`Reset password`),
        children: (0, C.jsx)(s, {
          tone: `error`,
          title: e(`This link is invalid or has expired`),
          description: e(
            `Password reset links can only be used once and expire after a while. Request a new one to continue.`,
          ),
          action: (0, C.jsx)(f, {
            size: `lg`,
            render: (0, C.jsx)(r, { to: y(`/reset-password`, { omit: b }) }),
            children: e(`Request a new link`),
          }),
        }),
      })
    : T
      ? (0, C.jsx)(o, {
          title: e(`Password updated`),
          children: (0, C.jsx)(s, {
            tone: `success`,
            title: e(`Password updated`),
            description: e(
              `Your password has been changed. You can now sign in with your new password.`,
            ),
            action: (0, C.jsx)(f, {
              size: `lg`,
              render: (0, C.jsx)(r, { to: N }),
              children: e(`Continue to sign in`),
            }),
          }),
        })
      : (0, C.jsx)(o, {
          title: e(`Set a new password`),
          heading: e(`Set a new password`),
          description: e(
            `Choose a strong password you don't use anywhere else.`,
          ),
          children: (0, C.jsx)(`form`, {
            onSubmit: O(M),
            noValidate: !0,
            children: (0, C.jsxs)(m, {
              className: `gap-5`,
              children: [
                (0, C.jsxs)(_, {
                  children: [
                    (0, C.jsx)(d, {
                      htmlFor: `password`,
                      children: e(`New password`),
                    }),
                    (0, C.jsx)(c, {
                      id: `password`,
                      autoComplete: `new-password`,
                      autoFocus: !0,
                      "aria-invalid": !!k.errors.password || void 0,
                      ...D(`password`, { validate: l(e) }),
                    }),
                    (0, C.jsx)(g, { children: k.errors.password?.message }),
                    (0, C.jsx)(u, { password: j }),
                  ],
                }),
                (0, C.jsxs)(_, {
                  children: [
                    (0, C.jsx)(d, {
                      htmlFor: `confirmPassword`,
                      children: e(`Confirm password`),
                    }),
                    (0, C.jsx)(c, {
                      id: `confirmPassword`,
                      autoComplete: `new-password`,
                      "aria-invalid": !!k.errors.confirmPassword || void 0,
                      ...D(`confirmPassword`, {
                        validate: (t) => t === j || e(`Passwords don't match`),
                      }),
                    }),
                    (0, C.jsx)(g, {
                      children: k.errors.confirmPassword?.message,
                    }),
                  ],
                }),
                (0, C.jsxs)(f, {
                  type: `submit`,
                  size: `lg`,
                  disabled: k.isSubmitting,
                  children: [
                    k.isSubmitting && (0, C.jsx)(h, {}),
                    e(`Update password`),
                  ],
                }),
              ],
            }),
          }),
        });
}
export { w as default };

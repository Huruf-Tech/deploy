import {
  K as e,
  a as t,
  c as n,
  s as r,
  st as i,
} from "./useAppBranding-GcljM9XV.js";
import { D as a } from "./AuthLayout-B7RMIG_n.js";
var o = t(`x`, [
    [`path`, { d: `M18 6 6 18`, key: `1bl5f8` }],
    [`path`, { d: `m6 6 12 12`, key: `d8bk6v` }],
  ]),
  s = e(),
  c = [
    { label: `Enter a password`, color: `bg-border` },
    { label: `Weak`, color: `bg-red-500` },
    { label: `Weak`, color: `bg-orange-500` },
    { label: `Fair`, color: `bg-amber-500` },
    { label: `Strong`, color: `bg-emerald-500` },
  ];
function l({ password: e }) {
  let { t } = i(),
    l = r(e),
    u = l.filter((e) => e.met).length,
    d = c[u];
  return (0, s.jsxs)(`div`, {
    className: `flex flex-col gap-2.5`,
    children: [
      (0, s.jsxs)(`div`, {
        role: `meter`,
        "aria-label": t(`Password strength`),
        "aria-valuemin": 0,
        "aria-valuemax": 4,
        "aria-valuenow": u,
        className: `flex items-center gap-3`,
        children: [
          (0, s.jsx)(`div`, {
            className: `grid flex-1 grid-cols-4 gap-1`,
            children: [1, 2, 3, 4].map((e) =>
              (0, s.jsx)(
                `span`,
                {
                  className: n(
                    `h-1 rounded-full transition-colors duration-300`,
                    u >= e ? d.color : `bg-border`,
                  ),
                },
                e,
              ),
            ),
          }),
          (0, s.jsx)(`span`, {
            className: `min-w-12 text-end text-xs font-medium text-muted-foreground`,
            children: t(d.label),
          }),
        ],
      }),
      (0, s.jsx)(`ul`, {
        "aria-label": t(`Password requirements`),
        className: `grid grid-cols-1 gap-x-3 gap-y-1 sm:grid-cols-2`,
        children: l.map((e) =>
          (0, s.jsxs)(
            `li`,
            {
              className: `flex items-center gap-1.5 text-xs`,
              children: [
                e.met
                  ? (0, s.jsx)(a, {
                      "aria-hidden": !0,
                      className: `size-3.5 text-success`,
                    })
                  : (0, s.jsx)(o, {
                      "aria-hidden": !0,
                      className: `size-3.5 text-muted-foreground/60`,
                    }),
                (0, s.jsxs)(`span`, {
                  className: e.met
                    ? `text-foreground`
                    : `text-muted-foreground`,
                  children: [
                    t(e.text),
                    (0, s.jsx)(`span`, {
                      className: `sr-only`,
                      children: e.met
                        ? t(` - requirement met`)
                        : t(` - requirement not met`),
                    }),
                  ],
                }),
              ],
            },
            e.text,
          ),
        ),
      }),
    ],
  });
}
var u = (e) => (t) =>
  r(t).every((e) => e.met) || e(`Password doesn't meet all the requirements`);
export { u as n, o as r, l as t };

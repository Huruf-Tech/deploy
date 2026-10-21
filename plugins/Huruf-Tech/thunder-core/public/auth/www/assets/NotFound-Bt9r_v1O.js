import { K as e, a as t, st as n, ut as r } from "./useAppBranding-GcljM9XV.js";
import { t as i } from "./AuthLayout-B7RMIG_n.js";
import { D as a } from "./index-CvWHA45R.js";
import { n as o, t as s } from "./navigation-Dd1cx1bO.js";
var c = t(`compass`, [
    [`circle`, { cx: `12`, cy: `12`, r: `10`, key: `1mglay` }],
    [
      `path`,
      {
        d: `m16.24 7.76-1.804 5.411a2 2 0 0 1-1.265 1.265L7.76 16.24l1.804-5.411a2 2 0 0 1 1.265-1.265z`,
        key: `9ktpf1`,
      },
    ],
  ]),
  l = e();
function u() {
  let { t: e } = n();
  return (0, l.jsx)(i, {
    title: e(`Page not found`),
    children: (0, l.jsxs)(`div`, {
      className: `flex flex-col items-center gap-4 text-center`,
      children: [
        (0, l.jsx)(`div`, {
          className: `flex size-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground`,
          children: (0, l.jsx)(c, { className: `size-6` }),
        }),
        (0, l.jsxs)(`div`, {
          className: `flex flex-col gap-1.5`,
          children: [
            (0, l.jsx)(`p`, {
              className: `text-sm font-medium text-primary`,
              children: `404`,
            }),
            (0, l.jsx)(`h1`, {
              className: `text-2xl font-semibold`,
              children: e(`Page not found`),
            }),
            (0, l.jsx)(`p`, {
              className: `text-sm text-muted-foreground`,
              children: e(
                `The page you're looking for doesn't exist or has moved.`,
              ),
            }),
          ],
        }),
        (0, l.jsx)(a, {
          size: `lg`,
          className: `mt-2 w-full`,
          render: (0, l.jsx)(r, { to: o(`/account`, { omit: s }) }),
          children: e(`Go to your account`),
        }),
      ],
    }),
  });
}
export { u as default };

import { K as e, a as t } from "./useAppBranding-GcljM9XV.js";
import { c as n } from "./index-CvWHA45R.js";
var r = t(`circle-check`, [
    [`circle`, { cx: `12`, cy: `12`, r: `10`, key: `1mglay` }],
    [`path`, { d: `m9 12 2 2 4-4`, key: `dzmm74` }],
  ]),
  i = e();
function a({ tone: e, title: t, description: a, action: o }) {
  return (0, i.jsxs)(`div`, {
    className: `flex flex-col items-center gap-4 text-center`,
    children: [
      (0, i.jsx)(`div`, {
        className:
          e === `success`
            ? `flex size-12 items-center justify-center rounded-2xl bg-success/12 text-success`
            : `flex size-12 items-center justify-center rounded-2xl bg-destructive/10 text-destructive`,
        children: (0, i.jsx)(e === `success` ? r : n, { className: `size-6` }),
      }),
      (0, i.jsxs)(`div`, {
        className: `flex flex-col gap-1.5`,
        children: [
          (0, i.jsx)(`h1`, {
            className: `text-2xl font-semibold`,
            children: t,
          }),
          (0, i.jsx)(`p`, {
            className: `text-sm text-pretty text-muted-foreground`,
            children: a,
          }),
        ],
      }),
      o &&
        (0, i.jsx)(`div`, {
          className: `mt-2 flex w-full flex-col`,
          children: o,
        }),
    ],
  });
}
export { a as t };

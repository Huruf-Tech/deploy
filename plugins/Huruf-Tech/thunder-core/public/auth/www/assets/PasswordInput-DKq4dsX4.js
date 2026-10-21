import {
  Et as e,
  K as t,
  a as n,
  c as r,
  st as i,
  wt as a,
} from "./useAppBranding-GcljM9XV.js";
import { D as o, O as s, l as c } from "./index-CvWHA45R.js";
var l = n(`eye-off`, [
    [
      `path`,
      {
        d: `M10.733 5.076a10.744 10.744 0 0 1 11.205 6.575 1 1 0 0 1 0 .696 10.747 10.747 0 0 1-1.444 2.49`,
        key: `ct8e1f`,
      },
    ],
    [`path`, { d: `M14.084 14.158a3 3 0 0 1-4.242-4.242`, key: `151rxh` }],
    [
      `path`,
      {
        d: `M17.479 17.499a10.75 10.75 0 0 1-15.417-5.151 1 1 0 0 1 0-.696 10.75 10.75 0 0 1 4.446-5.143`,
        key: `13bj9a`,
      },
    ],
    [`path`, { d: `m2 2 20 20`, key: `1ooewy` }],
  ]),
  u = n(`eye`, [
    [
      `path`,
      {
        d: `M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0`,
        key: `1nclc0`,
      },
    ],
    [`circle`, { cx: `12`, cy: `12`, r: `3`, key: `1v7zrd` }],
  ]),
  d = e(a(), 1),
  f = t();
function p({ className: e, ...t }) {
  return (0, f.jsx)(`textarea`, {
    "data-slot": `textarea`,
    className: r(
      `border-input dark:bg-input/30 focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:aria-invalid:border-destructive/50 disabled:bg-input/50 dark:disabled:bg-input/80 rounded-lg border bg-transparent px-2.5 py-2 text-base transition-colors focus-visible:ring-[3px] aria-invalid:ring-[3px] md:text-sm placeholder:text-muted-foreground flex field-sizing-content min-h-16 w-full outline-none disabled:cursor-not-allowed disabled:opacity-50`,
      e,
    ),
    ...t,
  });
}
function m({ className: e, ...t }) {
  return (0, f.jsx)(`div`, {
    "data-slot": `input-group`,
    role: `group`,
    className: r(
      `border-input bg-background shadow-xs/5 dark:bg-input/32 has-[[data-slot=input-group-control]:focus-visible]:border-ring has-[[data-slot=input-group-control]:focus-visible]:ring-ring/24 has-[[data-slot][aria-invalid=true]]:ring-destructive/20 has-[[data-slot][aria-invalid=true]]:border-destructive dark:has-[[data-slot][aria-invalid=true]]:ring-destructive/40 has-disabled:bg-input/50 dark:has-disabled:bg-input/80 h-8 rounded-lg border transition-colors has-disabled:opacity-50 has-[[data-slot=input-group-control]:focus-visible]:ring-[3px] has-[[data-slot][aria-invalid=true]]:ring-[3px] has-[>[data-align=block-end]]:h-auto has-[>[data-align=block-end]]:flex-col has-[>[data-align=block-start]]:h-auto has-[>[data-align=block-start]]:flex-col has-[>[data-align=block-end]]:[&>input]:pt-3 has-[>[data-align=block-start]]:[&>input]:pb-3 has-[>[data-align=inline-end]]:[&>input]:pe-1.5 has-[>[data-align=inline-start]]:[&>input]:ps-1.5 [[data-slot=combobox-content]_&]:focus-within:border-inherit [[data-slot=combobox-content]_&]:focus-within:ring-0 group/input-group relative flex w-full min-w-0 items-center outline-none has-[>textarea]:h-auto`,
      e,
    ),
    ...t,
  });
}
var h = s(
  `text-muted-foreground h-auto gap-2 py-1.5 text-sm font-medium group-data-[disabled=true]/input-group:opacity-50 [&>kbd]:rounded-[calc(var(--radius)-5px)] [&>svg:not([class*='size-'])]:size-4 flex cursor-text items-center justify-center select-none`,
  {
    variants: {
      align: {
        "inline-start": `ps-2 has-[>button]:ms-[-0.3rem] has-[>kbd]:ms-[-0.15rem] order-first`,
        "inline-end": `pe-2 has-[>button]:me-[-0.3rem] has-[>kbd]:me-[-0.15rem] order-last`,
        "block-start": `px-2.5 pt-2 group-has-[>input]/input-group:pt-2 [.border-b]:pb-2 order-first w-full justify-start`,
        "block-end": `px-2.5 pb-2 group-has-[>input]/input-group:pb-2 [.border-t]:pt-2 order-last w-full justify-start`,
      },
    },
    defaultVariants: { align: `inline-start` },
  },
);
function g({ className: e, align: t = `inline-start`, ...n }) {
  return (0, f.jsx)(`div`, {
    role: `group`,
    "data-slot": `input-group-addon`,
    "data-align": t,
    className: r(h({ align: t }), e),
    onClick: (e) => {
      e.target.closest(`button`) ||
        e.currentTarget.parentElement?.querySelector(`input`)?.focus();
    },
    ...n,
  });
}
var _ = s(`gap-2 text-sm shadow-none flex items-center`, {
  variants: {
    size: {
      xs: `h-6 gap-1 rounded-[calc(var(--radius)-3px)] px-1.5 [&>svg:not([class*='size-'])]:size-3.5`,
      sm: ``,
      "icon-xs": `size-6 rounded-[calc(var(--radius)-3px)] p-0 has-[>svg]:p-0`,
      "icon-sm": `size-8 p-0 has-[>svg]:p-0`,
    },
  },
  defaultVariants: { size: `xs` },
});
function v({
  className: e,
  type: t = `button`,
  variant: n = `ghost`,
  size: i = `xs`,
  ...a
}) {
  return (0, f.jsx)(o, {
    type: t,
    "data-size": i,
    variant: n,
    className: r(_({ size: i }), e),
    ...a,
  });
}
function y({ className: e, ...t }) {
  return (0, f.jsx)(c, {
    unstyled: !0,
    "data-slot": `input-group-control`,
    className: r(`flex min-w-0 flex-1 text-base sm:text-sm`, e),
    ...t,
  });
}
function b({ className: e, ...t }) {
  let { t: n } = i(),
    [r, a] = d.useState(!1);
  return (0, f.jsxs)(m, {
    className: e,
    children: [
      (0, f.jsx)(y, {
        size: `lg`,
        type: r ? `text` : `password`,
        autoComplete: `current-password`,
        ...t,
      }),
      (0, f.jsx)(g, {
        align: `inline-end`,
        children: (0, f.jsx)(v, {
          size: `icon-xs`,
          "aria-label": n(r ? `Hide password` : `Show password`),
          "aria-pressed": r,
          onClick: () => a((e) => !e),
          children: r ? (0, f.jsx)(l, {}) : (0, f.jsx)(u, {}),
        }),
      }),
    ],
  });
}
export { y as a, v as i, m as n, p as o, g as r, b as t };

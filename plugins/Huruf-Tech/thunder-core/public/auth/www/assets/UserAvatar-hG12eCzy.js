import {
  K as e,
  a as t,
  b as n,
  c as r,
  m as i,
} from "./useAppBranding-GcljM9XV.js";
import { a, i as o, r as s } from "./BrandLogo-D2la5kwZ.js";
var c = t(`badge-check`, [
    [
      `path`,
      {
        d: `M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76Z`,
        key: `3c2336`,
      },
    ],
    [`path`, { d: `m9 12 2 2 4-4`, key: `dzmm74` }],
  ]),
  l = t(`refresh-cw`, [
    [
      `path`,
      {
        d: `M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8`,
        key: `v9h5vc`,
      },
    ],
    [`path`, { d: `M21 3v5h-5`, key: `1q7to0` }],
    [
      `path`,
      {
        d: `M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16`,
        key: `3uifl3`,
      },
    ],
    [`path`, { d: `M8 16H3v5`, key: `1cv678` }],
  ]),
  u = t(`shield`, [
    [
      `path`,
      {
        d: `M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z`,
        key: `oel41y`,
      },
    ],
  ]),
  d = t(`user-round`, [
    [`circle`, { cx: `12`, cy: `8`, r: `5`, key: `1hypcn` }],
    [`path`, { d: `M20 21a8 8 0 0 0-16 0`, key: `rfgkzh` }],
  ]),
  f = e();
function p(e) {
  let t = 0;
  for (let n of e) t = (t * 31 + n.charCodeAt(0)) | 0;
  return Math.abs(t) % 360;
}
function m({ name: e, email: t, image: c, size: l = 40, className: u }) {
  let d = e || t || ``,
    m = p(d);
  return (0, f.jsxs)(s, {
    className: r(`ring-1 ring-foreground/8`, u),
    style: { width: l, height: l },
    children: [
      c &&
        (0, f.jsx)(a, { src: n(c, { width: l * 2, height: l * 2 }), alt: d }),
      (0, f.jsx)(o, {
        className: `font-semibold`,
        style: {
          fontSize: Math.max(11, l * 0.36),
          color: `oklch(0.45 0.14 ${m})`,
          background: `oklch(0.93 0.05 ${m})`,
        },
        children: i(d),
      }),
    ],
  });
}
export { c as a, l as i, d as n, u as r, m as t };

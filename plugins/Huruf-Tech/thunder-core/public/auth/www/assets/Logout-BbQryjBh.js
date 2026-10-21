import {
  Et as e,
  K as t,
  h as n,
  st as r,
  wt as i,
  xt as a,
  y as o,
} from "./useAppBranding-GcljM9XV.js";
import { o as s } from "./index-CvWHA45R.js";
import { t as c } from "./BrandLogo-D2la5kwZ.js";
import { t as l } from "./auth-DO2_vqL6.js";
var u = e(i(), 1),
  d = t();
function f() {
  let { t: e } = r(),
    [t] = a(),
    i = t.get(`redirect`);
  return (
    u.useEffect(() => {
      (async () => {
        try {
          await l.signOut();
        } catch {}
        window.location.replace(n(i) ?? o(`/login`));
      })();
    }, [i]),
    (0, d.jsxs)(`div`, {
      className: `flex min-h-svh flex-col items-center justify-center gap-5`,
      children: [
        (0, d.jsx)(`title`, { children: e(`Signing out…`) }),
        (0, d.jsx)(c, { className: `size-12 rounded-2xl` }),
        (0, d.jsxs)(`div`, {
          className: `flex items-center gap-2 text-sm text-muted-foreground`,
          children: [(0, d.jsx)(s, {}), e(`Signing you out…`)],
        }),
      ],
    })
  );
}
export { f as default };

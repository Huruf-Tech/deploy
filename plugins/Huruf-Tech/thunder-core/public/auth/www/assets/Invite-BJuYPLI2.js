import {
  Et as e,
  K as t,
  dt as n,
  n as r,
  ot as i,
  st as a,
  ut as o,
  wt as s,
  yt as c,
} from "./useAppBranding-GcljM9XV.js";
import { r as l, t as u } from "./AuthLayout-B7RMIG_n.js";
import { t as d } from "./StatusMessage-CDiXpIRA.js";
import { Br as f, D as p, o as m } from "./index-CvWHA45R.js";
import { t as h } from "./auth-DO2_vqL6.js";
var g = e(s(), 1),
  _ = t();
function v() {
  let { t: e } = a(),
    { _id: t } = c(),
    { app: s, appName: v } = r(),
    { has: y } = l(),
    { data: b, isPending: x } = h.useSession(),
    [S, C] = g.useState({ status: `joining` }),
    w = g.useRef(!1);
  if (
    (g.useEffect(() => {
      !b ||
        !t ||
        w.current ||
        ((w.current = !0),
        i.tenantMembers
          .create({ body: { invite: t }, axiosConfig: { silent: !0 } })
          .then(() => C({ status: `joined` }))
          .catch((e) => C({ status: `failed`, message: f(e) })));
    }, [b, t]),
    !x && !b)
  ) {
    let e = encodeURIComponent(window.location.pathname);
    return (0, _.jsx)(n, {
      to: `${y(`signup`) ? `/signup` : `/login`}?redirect=${e}`,
      replace: !0,
    });
  }
  return (0, _.jsx)(u, {
    title: e(`Join workspace`),
    children:
      S.status === `joining`
        ? (0, _.jsxs)(`div`, {
            className: `flex flex-col items-center gap-3 py-6 text-center`,
            children: [
              (0, _.jsx)(m, { className: `size-6` }),
              (0, _.jsx)(`p`, {
                className: `text-sm text-muted-foreground`,
                children: e(`Accepting your invitation…`),
              }),
            ],
          })
        : S.status === `joined`
          ? (0, _.jsx)(d, {
              tone: `success`,
              title: e(`You're in!`),
              description: e(`You've joined the workspace on {{name}}.`, {
                name: v,
              }),
              action: (0, _.jsx)(p, {
                size: `lg`,
                render: (0, _.jsx)(o, { to: `/account`, replace: !0 }),
                children: e(`Go to your account`),
              }),
            })
          : (0, _.jsx)(d, {
              tone: `error`,
              title: e(`We couldn't add you`),
              description: e(
                `This invitation may have expired, been revoked, or been sent to a different email address.`,
              ),
              action: (0, _.jsxs)(`div`, {
                className: `flex flex-col gap-2`,
                children: [
                  (0, _.jsx)(`p`, {
                    className: `text-xs text-muted-foreground`,
                    children: S.message,
                  }),
                  (0, _.jsx)(p, {
                    size: `lg`,
                    variant: `outline`,
                    render: (0, _.jsx)(o, { to: `/account`, replace: !0 }),
                    children: e(`Go to your account`),
                  }),
                  s?.supportEmail &&
                    (0, _.jsx)(p, {
                      size: `lg`,
                      variant: `ghost`,
                      render: (0, _.jsx)(`a`, {
                        href: `mailto:${s.supportEmail}`,
                      }),
                      children: e(`Contact support`),
                    }),
                ],
              }),
            }),
  });
}
export { v as default };

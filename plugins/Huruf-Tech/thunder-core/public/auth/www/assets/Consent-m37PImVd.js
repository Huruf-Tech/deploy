import {
  Et as e,
  J as t,
  K as n,
  _t as r,
  a as i,
  b as a,
  dt as o,
  m as s,
  ot as c,
  st as l,
  ut as u,
  wt as d,
  xt as f,
} from "./useAppBranding-GcljM9XV.js";
import { T as p, t as m } from "./AuthLayout-B7RMIG_n.js";
import {
  a as h,
  i as g,
  n as _,
  r as v,
  t as y,
} from "./UserAvatar-hG12eCzy.js";
import { t as b } from "./mail-D1PhSive.js";
import { D as x, Hr as S, c as C, o as w } from "./index-CvWHA45R.js";
import {
  a as T,
  i as E,
  n as D,
  r as O,
  t as k,
} from "./BrandLogo-D2la5kwZ.js";
import { t as A } from "./auth-DO2_vqL6.js";
import { n as j, t as M } from "./navigation-Dd1cx1bO.js";
var N = i(`arrow-left-right`, [
    [`path`, { d: `M8 3 4 7l4 4`, key: `9rb6wj` }],
    [`path`, { d: `M4 7h16`, key: `6tx8e3` }],
    [`path`, { d: `m16 21 4-4-4-4`, key: `siv7j2` }],
    [`path`, { d: `M20 17H4`, key: `h6l3hr` }],
  ]),
  P = i(`external-link`, [
    [`path`, { d: `M15 3h6v6`, key: `1q9fwt` }],
    [`path`, { d: `M10 14 21 3`, key: `gplh6r` }],
    [
      `path`,
      {
        d: `M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6`,
        key: `a6xqqp`,
      },
    ],
  ]),
  F = i(`id-card`, [
    [`path`, { d: `M16 10h2`, key: `8sgtl7` }],
    [`path`, { d: `M16 14h2`, key: `epxaof` }],
    [`path`, { d: `M6.17 15a3 3 0 0 1 5.66 0`, key: `n6f512` }],
    [`circle`, { cx: `9`, cy: `11`, r: `2`, key: `yxgjnd` }],
    [
      `rect`,
      { x: `2`, y: `5`, width: `20`, height: `14`, rx: `2`, key: `qneu4z` },
    ],
  ]),
  I = e(d(), 1),
  L = n(),
  R = {
    openid: {
      icon: F,
      label: `Verify your identity`,
      description: `Know who you are when you sign in`,
    },
    profile: {
      icon: _,
      label: `View your profile`,
      description: `Your name and profile picture`,
    },
    email: {
      icon: b,
      label: `View your email address`,
      description: `The primary email address of your account`,
    },
    offline_access: {
      icon: g,
      label: `Stay connected`,
      description: `Access your data while you're not using the app`,
    },
    full_access: {
      icon: p,
      label: `Full access to your account`,
      description: `Read and change all of your account's resources`,
    },
  };
function z() {
  let { t: e } = l(),
    n = r(),
    [i] = f(),
    { data: d, isPending: p } = A.useSession(),
    [g, _] = I.useState(null),
    b = i.get(`client_id`),
    F = i.get(`redirect_uri`),
    z = I.useMemo(
      () => (i.get(`scope`) ?? ``).trim().split(/\s+/).filter(Boolean),
      [i],
    ),
    { data: B, isLoading: V } = t(
      d && b ? [`oauthClient`, b] : null,
      async ([, e]) => {
        let { results: t } = await c.oauthClients.get({
          params: { id: e },
          query: {},
          axiosConfig: { silent: !0 },
        });
        return t[0] ?? null;
      },
      { shouldRetryOnError: !1 },
    ),
    H = I.useMemo(() => {
      try {
        return F ? new URL(F).host : null;
      } catch {
        return null;
      }
    }, [F]),
    U = !!B && !!F && !!B.redirectUris?.includes(F);
  if (!p && !d)
    return (0, L.jsx)(o, { to: j(`/login`, { omit: M }), replace: !0 });
  let W = B?.name ?? H ?? e(`Unknown application`);
  return !b || !F || !H
    ? (0, L.jsx)(m, {
        title: e(`Authorize access`),
        children: (0, L.jsxs)(`div`, {
          className: `flex flex-col items-center gap-4 text-center`,
          children: [
            (0, L.jsx)(`div`, {
              className: `flex size-12 items-center justify-center rounded-2xl bg-destructive/10 text-destructive`,
              children: (0, L.jsx)(C, { className: `size-6` }),
            }),
            (0, L.jsxs)(`div`, {
              className: `flex flex-col gap-1.5`,
              children: [
                (0, L.jsx)(`h1`, {
                  className: `text-2xl font-semibold`,
                  children: e(`Invalid authorization request`),
                }),
                (0, L.jsx)(`p`, {
                  className: `text-sm text-muted-foreground`,
                  children: e(
                    `This link is missing required information. Go back to the application and try signing in again.`,
                  ),
                }),
              ],
            }),
          ],
        }),
      })
    : (0, L.jsx)(m, {
        title: e(`Authorize access`),
        media: (0, L.jsxs)(`div`, {
          className: `flex items-center gap-3`,
          children: [
            (0, L.jsx)(k, { className: `size-12 rounded-2xl` }),
            (0, L.jsxs)(`div`, {
              className: `flex items-center gap-1 text-muted-foreground/60`,
              children: [
                (0, L.jsx)(`span`, {
                  className: `size-1 rounded-full bg-current`,
                }),
                (0, L.jsx)(N, { className: `size-4` }),
                (0, L.jsx)(`span`, {
                  className: `size-1 rounded-full bg-current`,
                }),
              ],
            }),
            V
              ? (0, L.jsx)(D, { className: `size-12 rounded-2xl` })
              : (0, L.jsxs)(O, {
                  className: `size-12 rounded-2xl bg-transparent ring-1 ring-foreground/8`,
                  children: [
                    B?.logo && (0, L.jsx)(T, { src: a(B.logo), alt: W }),
                    (0, L.jsx)(E, {
                      className: `rounded-[inherit] bg-muted text-sm font-semibold`,
                      children: s(W),
                    }),
                  ],
                }),
          ],
        }),
        heading: V
          ? (0, L.jsx)(D, { className: `h-7 w-56` })
          : e(`{{name}} wants to access your account`, { name: W }),
        description: B?.description,
        children: (0, L.jsxs)(`div`, {
          className: `flex flex-col gap-5`,
          children: [
            (0, L.jsxs)(`div`, {
              className: `flex items-center gap-3 rounded-xl border bg-card p-3 shadow-xs/5`,
              children: [
                (0, L.jsx)(y, {
                  size: 36,
                  name: d?.user.name,
                  email: d?.user.email,
                  image: d?.user.image,
                }),
                (0, L.jsxs)(`div`, {
                  className: `flex min-w-0 flex-1 flex-col`,
                  children: [
                    (0, L.jsx)(`span`, {
                      className: `truncate text-sm font-medium`,
                      children: d?.user.name,
                    }),
                    (0, L.jsx)(`span`, {
                      className: `truncate text-xs text-muted-foreground`,
                      children: d?.user.email,
                    }),
                  ],
                }),
                (0, L.jsx)(x, {
                  variant: `ghost`,
                  size: `sm`,
                  render: (0, L.jsx)(u, {
                    to: j(`/login`, { omit: M, set: { addAccount: `1` } }),
                  }),
                  children: e(`Switch`),
                }),
              ],
            }),
            (0, L.jsxs)(`div`, {
              className: `flex flex-col gap-3`,
              children: [
                (0, L.jsx)(`p`, {
                  className: `text-sm font-medium`,
                  children: e(`This will allow {{name}} to:`, { name: W }),
                }),
                (0, L.jsx)(`ul`, {
                  className: `flex flex-col divide-y rounded-xl border bg-card shadow-xs/5`,
                  children: (z.length ? z : [`openid`]).map((t) => {
                    let n = R[t];
                    return (0, L.jsxs)(
                      `li`,
                      {
                        className: `flex items-start gap-3 p-3`,
                        children: [
                          (0, L.jsx)(`div`, {
                            className: `mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary`,
                            children: (0, L.jsx)(n?.icon ?? v, {
                              className: `size-4`,
                            }),
                          }),
                          (0, L.jsxs)(`div`, {
                            className: `flex min-w-0 flex-col`,
                            children: [
                              (0, L.jsx)(`span`, {
                                className: `text-sm font-medium`,
                                children: n
                                  ? e(n.label)
                                  : e(`Access “{{scope}}”`, { scope: t }),
                              }),
                              (0, L.jsx)(`span`, {
                                className: `text-xs text-muted-foreground`,
                                children: n
                                  ? e(n.description)
                                  : e(`Permission defined by {{name}}`, {
                                      name: W,
                                    }),
                              }),
                            ],
                          }),
                        ],
                      },
                      t,
                    );
                  }),
                }),
              ],
            }),
            (0, L.jsxs)(`div`, {
              className: `flex items-start gap-2 text-xs text-muted-foreground`,
              children: [
                U
                  ? (0, L.jsx)(h, {
                      className: `mt-px size-4 shrink-0 text-success`,
                    })
                  : (0, L.jsx)(P, { className: `mt-px size-4 shrink-0` }),
                (0, L.jsx)(`p`, {
                  children: e(
                    `You'll be redirected to {{host}}. Only allow access if you trust this app.`,
                    { host: H },
                  ),
                }),
              ],
            }),
            (0, L.jsxs)(`div`, {
              className: `grid grid-cols-2 gap-3`,
              children: [
                (0, L.jsxs)(x, {
                  variant: `outline`,
                  size: `lg`,
                  onClick: () => {
                    if ((_(`deny`), U)) {
                      let e = new URL(F);
                      (e.searchParams.set(`error`, `access_denied`),
                        e.searchParams.set(
                          `error_description`,
                          `The user denied the request`,
                        ));
                      let t = i.get(`state`);
                      (t && e.searchParams.set(`state`, t),
                        window.location.assign(e.toString()));
                    } else
                      (S.info(e(`Access was not granted`)),
                        n(`/account`, { replace: !0 }));
                  },
                  disabled: g !== null,
                  children: [g === `deny` && (0, L.jsx)(w, {}), e(`Cancel`)],
                }),
                (0, L.jsxs)(x, {
                  size: `lg`,
                  onClick: async () => {
                    _(`allow`);
                    try {
                      let { _id: t } = await c.oauth.consent({
                        query: {
                          client_id: b,
                          redirect_uri: F,
                          state: i.get(`state`) ?? void 0,
                          scope: i.get(`scope`) ?? ``,
                          nonce: i.get(`nonce`) ?? void 0,
                          response_type: `code`,
                          code_challenge: i.get(`code_challenge`) ?? ``,
                          code_challenge_method: `S256`,
                        },
                        body: { resourceGrant: {} },
                      });
                      if (!t) throw Error(e(`Failed to process consent`));
                      n(j(`/account`, { omit: M }), { replace: !0 });
                    } catch (e) {
                      (console.error(e), _(null));
                    }
                  },
                  disabled: g !== null,
                  children: [g === `allow` && (0, L.jsx)(w, {}), e(`Allow`)],
                }),
              ],
            }),
          ],
        }),
      });
}
export { z as default };

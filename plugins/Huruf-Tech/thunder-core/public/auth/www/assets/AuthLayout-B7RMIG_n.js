import {
  A as e,
  B as t,
  C as n,
  Ct as r,
  Et as i,
  F as a,
  G as o,
  H as s,
  I as c,
  K as l,
  L as u,
  N as d,
  O as f,
  S as p,
  T as m,
  U as h,
  V as g,
  W as _,
  a as v,
  at as y,
  c as b,
  i as x,
  j as S,
  n as C,
  r as w,
  st as T,
  wt as E,
} from "./useAppBranding-GcljM9XV.js";
import {
  $ as D,
  $n as O,
  $t as k,
  An as A,
  Ar as j,
  At as M,
  Bn as N,
  Bt as P,
  Cn as ee,
  Cr as F,
  D as I,
  Dn as L,
  Dr as R,
  Dt as te,
  En as z,
  Er as B,
  Et as V,
  Fn as ne,
  Fr as H,
  Ft as re,
  Gn as U,
  Gt as ie,
  Ht as W,
  In as ae,
  Ir as G,
  It as oe,
  Jt as se,
  Kn as ce,
  Kt as le,
  Lr as K,
  Lt as ue,
  M as de,
  Mr as q,
  Mt as fe,
  Nr as pe,
  Nt as me,
  On as J,
  Or as he,
  Ot as ge,
  Pr as _e,
  Pt as ve,
  Qn as ye,
  Qt as be,
  Rr as xe,
  Rt as Se,
  Sn as Ce,
  Sr as we,
  T as Te,
  Tr as Ee,
  Tt as De,
  Ut as Oe,
  Vn as ke,
  Vt as Ae,
  Wn as je,
  Wt as Me,
  Xn as Ne,
  Xt as Pe,
  Yn as Fe,
  Yt as Ie,
  Z as Le,
  Zn as Re,
  Zt as ze,
  _n as Be,
  _r as Ve,
  _t as He,
  an as Ue,
  ar as We,
  at as Ge,
  bn as Ke,
  br as qe,
  bt as Je,
  c as Ye,
  cn as Xe,
  cr as Ze,
  dn as Qe,
  dr as $e,
  dt as et,
  en as tt,
  er as nt,
  fn as rt,
  fr as it,
  ft as at,
  gn as ot,
  gr as st,
  gt as ct,
  hn as lt,
  ht as ut,
  in as dt,
  ir as ft,
  it as pt,
  j as mt,
  jr as Y,
  jt as ht,
  kr as gt,
  kt as _t,
  ln as vt,
  lr as yt,
  mn as bt,
  mt as xt,
  n as St,
  nn as Ct,
  nr as X,
  on as wt,
  or as Tt,
  pn as Et,
  pr as Dt,
  pt as Ot,
  qn as kt,
  qt as At,
  r as jt,
  rn as Mt,
  rr as Nt,
  s as Pt,
  sn as Ft,
  sr as It,
  t as Lt,
  tn as Rt,
  tr as zt,
  tt as Bt,
  un as Vt,
  ur as Ht,
  vn as Ut,
  vr as Wt,
  vt as Gt,
  wr as Kt,
  wt as qt,
  xn as Jt,
  xr as Yt,
  xt as Xt,
  yn as Zt,
  yt as Qt,
  z as $t,
  zr as en,
  zt as tn,
} from "./index-CvWHA45R.js";
import { n as nn, t as rn } from "./BrandLogo-D2la5kwZ.js";
var Z = i(E()),
  an = i(r(), 1);
function on(e, t) {
  return t != null && !Ze(t) ? 0 : typeof e == `function` ? e() : e;
}
function sn(e, t, n) {
  let r = on(e, n);
  return typeof r == `number` ? r : r?.[t];
}
function cn(e) {
  return typeof e == `function` ? e() : e;
}
function ln(e, t) {
  return t || e === `click` || e === `mousedown`;
}
function un(e) {
  return e?.includes(`mouse`) && e !== `mousedown`;
}
function dn(e, n = {}) {
  let {
      enabled: r = !0,
      event: i = `click`,
      toggle: a = !0,
      ignoreMouse: o = !1,
      stickIfOpen: c = !0,
      touchOpenDelay: l = 0,
      reason: d = kt,
    } = n,
    f = `rootStore` in e ? e.rootStore : e,
    p = f.context.dataRef,
    m = Z.useRef(void 0),
    h = t(),
    g = s(),
    _ = Z.useMemo(() => {
      function e(e, t, n, r) {
        let i = J(d, t, n);
        e && r === `touch` && l > 0
          ? g.start(l, () => {
              f.setOpen(!0, i);
            })
          : f.setOpen(e, i);
      }
      function t(e, t, n) {
        let r = p.current.openEvent,
          i = f.select(`domReferenceElement`) !== t;
        return (e && i) || !e || !a ? !0 : r && c ? !n(r.type) : !1;
      }
      return {
        onPointerDown(e) {
          m.current = e.pointerType;
        },
        onMouseDown(n) {
          let r = m.current,
            a = n.nativeEvent,
            s = f.select(`open`);
          if (n.button !== 0 || i === `click` || (Ze(r, !0) && o)) return;
          let c = t(
              s,
              n.currentTarget,
              (e) => e === `click` || e === `mousedown`,
            ),
            l = Nt(a);
          if (O(l)) {
            e(c, a, l, r);
            return;
          }
          let u = n.currentTarget;
          h.request(() => {
            e(c, a, u, r);
          });
        },
        onClick(n) {
          if (i === `mousedown-only`) return;
          let r = m.current;
          if (i === `mousedown` && r) {
            m.current = void 0;
            return;
          }
          (Ze(r, !0) && o) ||
            e(
              t(
                f.select(`open`),
                n.currentTarget,
                (e) =>
                  e === `click` ||
                  e === `mousedown` ||
                  e === `keydown` ||
                  e === `keyup`,
              ),
              n.nativeEvent,
              n.currentTarget,
              r,
            );
        },
        onKeyDown() {
          m.current = void 0;
        },
      };
    }, [p, i, o, d, f, c, a, h, g, l]);
  return Z.useMemo(() => (r ? { reference: _ } : u), [r, _]);
}
function fn(e, t, n) {
  let { reference: r, floating: i } = e,
    a = Be(t),
    o = Xe(t),
    s = Vt(o),
    c = ot(t),
    l = a === `y`,
    u = r.x + r.width / 2 - i.width / 2,
    d = r.y + r.height / 2 - i.height / 2,
    f = r[s] / 2 - i[s] / 2,
    p;
  switch (c) {
    case `top`:
      p = { x: u, y: r.y - i.height };
      break;
    case `bottom`:
      p = { x: u, y: r.y + r.height };
      break;
    case `right`:
      p = { x: r.x + r.width, y: d };
      break;
    case `left`:
      p = { x: r.x - i.width, y: d };
      break;
    default:
      p = { x: r.x, y: r.y };
  }
  switch (Ft(t)) {
    case `start`:
      p[o] -= f * (n && l ? -1 : 1);
      break;
    case `end`:
      p[o] += f * (n && l ? -1 : 1);
      break;
  }
  return p;
}
async function pn(e, t) {
  t === void 0 && (t = {});
  let { x: n, y: r, platform: i, rects: a, elements: o, strategy: s } = e,
    {
      boundary: c = `clippingAncestors`,
      rootBoundary: l = `viewport`,
      elementContext: u = `floating`,
      altBoundary: d = !1,
      padding: f = 0,
    } = Ue(t, e),
    p = lt(f),
    m = o[d ? (u === `floating` ? `reference` : `floating`) : u],
    h = Ke(
      await i.getClippingRect({
        element:
          ((await (i.isElement == null ? void 0 : i.isElement(m))) ?? !0)
            ? m
            : m.contextElement ||
              (await (i.getDocumentElement == null
                ? void 0
                : i.getDocumentElement(o.floating))),
        boundary: c,
        rootBoundary: l,
        strategy: s,
      }),
    ),
    g =
      u === `floating`
        ? { x: n, y: r, width: a.floating.width, height: a.floating.height }
        : a.reference,
    _ = await (i.getOffsetParent == null
      ? void 0
      : i.getOffsetParent(o.floating)),
    v = ((await (i.isElement == null ? void 0 : i.isElement(_))) &&
      (await (i.getScale == null ? void 0 : i.getScale(_)))) || { x: 1, y: 1 },
    y = Ke(
      i.convertOffsetParentRelativeRectToViewportRelativeRect
        ? await i.convertOffsetParentRelativeRectToViewportRelativeRect({
            elements: o,
            rect: g,
            offsetParent: _,
            strategy: s,
          })
        : g,
    );
  return {
    top: (h.top - y.top + p.top) / v.y,
    bottom: (y.bottom - h.bottom + p.bottom) / v.y,
    left: (h.left - y.left + p.left) / v.x,
    right: (y.right - h.right + p.right) / v.x,
  };
}
var mn = 50,
  hn = async (e, t, n) => {
    let {
        placement: r = `bottom`,
        strategy: i = `absolute`,
        middleware: a = [],
        platform: o,
      } = n,
      s = o.detectOverflow ? o : { ...o, detectOverflow: pn },
      c = await (o.isRTL == null ? void 0 : o.isRTL(t)),
      l = await o.getElementRects({ reference: e, floating: t, strategy: i }),
      { x: u, y: d } = fn(l, r, c),
      f = r,
      p = 0,
      m = {};
    for (let n = 0; n < a.length; n++) {
      let h = a[n];
      if (!h) continue;
      let { name: g, fn: _ } = h,
        {
          x: v,
          y,
          data: b,
          reset: x,
        } = await _({
          x: u,
          y: d,
          initialPlacement: r,
          placement: f,
          strategy: i,
          middlewareData: m,
          rects: l,
          platform: s,
          elements: { reference: e, floating: t },
        });
      ((u = v ?? u),
        (d = y ?? d),
        (m[g] = { ...m[g], ...b }),
        x &&
          p < mn &&
          (p++,
          typeof x == `object` &&
            (x.placement && (f = x.placement),
            x.rects &&
              (l =
                x.rects === !0
                  ? await o.getElementRects({
                      reference: e,
                      floating: t,
                      strategy: i,
                    })
                  : x.rects),
            ({ x: u, y: d } = fn(l, f, c))),
          (n = -1)));
    }
    return { x: u, y: d, placement: f, strategy: i, middlewareData: m };
  },
  gn = function (e) {
    return (
      e === void 0 && (e = {}),
      {
        name: `flip`,
        options: e,
        async fn(t) {
          var n;
          let {
              placement: r,
              middlewareData: i,
              rects: a,
              initialPlacement: o,
              platform: s,
              elements: c,
            } = t,
            {
              mainAxis: l = !0,
              crossAxis: u = !0,
              fallbackPlacements: d,
              fallbackStrategy: f = `bestFit`,
              fallbackAxisSideDirection: p = `none`,
              flipAlignment: m = !0,
              ...h
            } = Ue(e, t);
          if ((n = i.arrow) != null && n.alignmentOffset) return {};
          let g = ot(r),
            _ = Be(o),
            v = ot(o) === o,
            y = await (s.isRTL == null ? void 0 : s.isRTL(c.floating)),
            b = d || (v || !m ? [bt(o)] : Qe(o)),
            x = p !== `none`;
          !d && x && b.push(...Et(o, m, p, y));
          let S = [o, ...b],
            C = await s.detectOverflow(t, h),
            w = [],
            T = i.flip?.overflows || [];
          if ((l && w.push(C[g]), u)) {
            let e = vt(r, a, y);
            w.push(C[e[0]], C[e[1]]);
          }
          if (
            ((T = [...T, { placement: r, overflows: w }]),
            !w.every((e) => e <= 0))
          ) {
            let e = (i.flip?.index || 0) + 1,
              t = S[e];
            if (
              t &&
              (!(u === `alignment` && _ !== Be(t)) ||
                T.every((e) =>
                  Be(e.placement) === _ ? e.overflows[0] > 0 : !0,
                ))
            )
              return {
                data: { index: e, overflows: T },
                reset: { placement: t },
              };
            let n = T.filter((e) => e.overflows[0] <= 0).sort(
              (e, t) => e.overflows[1] - t.overflows[1],
            )[0]?.placement;
            if (!n)
              switch (f) {
                case `bestFit`: {
                  let e = T.filter((e) => {
                    if (x) {
                      let t = Be(e.placement);
                      return t === _ || t === `y`;
                    }
                    return !0;
                  })
                    .map((e) => [
                      e.placement,
                      e.overflows
                        .filter((e) => e > 0)
                        .reduce((e, t) => e + t, 0),
                    ])
                    .sort((e, t) => e[1] - t[1])[0]?.[0];
                  e && (n = e);
                  break;
                }
                case `initialPlacement`:
                  n = o;
                  break;
              }
            if (r !== n) return { reset: { placement: n } };
          }
          return {};
        },
      }
    );
  };
function _n(e, t) {
  return {
    top: e.top - t.height,
    right: e.right - t.width,
    bottom: e.bottom - t.height,
    left: e.left - t.width,
  };
}
function vn(e) {
  return Ce.some((t) => e[t] >= 0);
}
var yn = function (e) {
    return (
      e === void 0 && (e = {}),
      {
        name: `hide`,
        options: e,
        async fn(t) {
          let { rects: n, platform: r } = t,
            { strategy: i = `referenceHidden`, ...a } = Ue(e, t);
          switch (i) {
            case `referenceHidden`: {
              let e = _n(
                await r.detectOverflow(t, {
                  ...a,
                  elementContext: `reference`,
                }),
                n.reference,
              );
              return {
                data: { referenceHiddenOffsets: e, referenceHidden: vn(e) },
              };
            }
            case `escaped`: {
              let e = _n(
                await r.detectOverflow(t, { ...a, altBoundary: !0 }),
                n.floating,
              );
              return { data: { escapedOffsets: e, escaped: vn(e) } };
            }
            default:
              return {};
          }
        },
      }
    );
  },
  bn = new Set([`left`, `top`]);
async function xn(e, t) {
  let { placement: n, platform: r, elements: i } = e,
    a = await (r.isRTL == null ? void 0 : r.isRTL(i.floating)),
    o = ot(n),
    s = Ft(n),
    c = Be(n) === `y`,
    l = bn.has(o) ? -1 : 1,
    u = a && c ? -1 : 1,
    d = Ue(t, e),
    {
      mainAxis: f,
      crossAxis: p,
      alignmentAxis: m,
    } = typeof d == `number`
      ? { mainAxis: d, crossAxis: 0, alignmentAxis: null }
      : {
          mainAxis: d.mainAxis || 0,
          crossAxis: d.crossAxis || 0,
          alignmentAxis: d.alignmentAxis,
        };
  return (
    s && typeof m == `number` && (p = s === `end` ? m * -1 : m),
    c ? { x: p * u, y: f * l } : { x: f * l, y: p * u }
  );
}
var Sn = function (e) {
    return (
      e === void 0 && (e = 0),
      {
        name: `offset`,
        options: e,
        async fn(t) {
          var n;
          let { x: r, y: i, placement: a, middlewareData: o } = t,
            s = await xn(t, e);
          return a === o.offset?.placement &&
            (n = o.arrow) != null &&
            n.alignmentOffset
            ? {}
            : { x: r + s.x, y: i + s.y, data: { ...s, placement: a } };
        },
      }
    );
  },
  Cn = function (e) {
    return (
      e === void 0 && (e = {}),
      {
        name: `shift`,
        options: e,
        async fn(t) {
          let { x: n, y: r, placement: i, platform: a } = t,
            {
              mainAxis: o = !0,
              crossAxis: s = !1,
              limiter: c = {
                fn: (e) => {
                  let { x: t, y: n } = e;
                  return { x: t, y: n };
                },
              },
              ...l
            } = Ue(e, t),
            u = { x: n, y: r },
            d = await a.detectOverflow(t, l),
            f = Be(ot(i)),
            p = rt(f),
            m = u[p],
            h = u[f];
          if (o) {
            let e = p === `y` ? `top` : `left`,
              t = p === `y` ? `bottom` : `right`,
              n = m + d[e],
              r = m - d[t];
            m = Mt(n, m, r);
          }
          if (s) {
            let e = f === `y` ? `top` : `left`,
              t = f === `y` ? `bottom` : `right`,
              n = h + d[e],
              r = h - d[t];
            h = Mt(n, h, r);
          }
          let g = c.fn({ ...t, [p]: m, [f]: h });
          return {
            ...g,
            data: { x: g.x - n, y: g.y - r, enabled: { [p]: o, [f]: s } },
          };
        },
      }
    );
  },
  wn = function (e) {
    return (
      e === void 0 && (e = {}),
      {
        options: e,
        fn(t) {
          let { x: n, y: r, placement: i, rects: a, middlewareData: o } = t,
            { offset: s = 0, mainAxis: c = !0, crossAxis: l = !0 } = Ue(e, t),
            u = { x: n, y: r },
            d = Be(i),
            f = rt(d),
            p = u[f],
            m = u[d],
            h = Ue(s, t),
            g =
              typeof h == `number`
                ? { mainAxis: h, crossAxis: 0 }
                : { mainAxis: 0, crossAxis: 0, ...h };
          if (c) {
            let e = f === `y` ? `height` : `width`,
              t = a.reference[f] - a.floating[e] + g.mainAxis,
              n = a.reference[f] + a.reference[e] - g.mainAxis;
            p < t ? (p = t) : p > n && (p = n);
          }
          if (l) {
            let e = f === `y` ? `width` : `height`,
              t = bn.has(ot(i)),
              n =
                a.reference[d] -
                a.floating[e] +
                ((t && o.offset?.[d]) || 0) +
                (t ? 0 : g.crossAxis),
              r =
                a.reference[d] +
                a.reference[e] +
                (t ? 0 : o.offset?.[d] || 0) -
                (t ? g.crossAxis : 0);
            m < n ? (m = n) : m > r && (m = r);
          }
          return { [f]: p, [d]: m };
        },
      }
    );
  },
  Tn = function (e) {
    return (
      e === void 0 && (e = {}),
      {
        name: `size`,
        options: e,
        async fn(t) {
          var n, r;
          let { placement: i, rects: a, platform: o, elements: s } = t,
            { apply: c = () => {}, ...l } = Ue(e, t),
            u = await o.detectOverflow(t, l),
            d = ot(i),
            f = Ft(i),
            p = Be(i) === `y`,
            { width: m, height: h } = a.floating,
            g,
            _;
          d === `top` || d === `bottom`
            ? ((g = d),
              (_ =
                f ===
                ((await (o.isRTL == null ? void 0 : o.isRTL(s.floating)))
                  ? `start`
                  : `end`)
                  ? `left`
                  : `right`))
            : ((_ = d), (g = f === `end` ? `top` : `bottom`));
          let v = h - u.top - u.bottom,
            y = m - u.left - u.right,
            b = Zt(h - u[g], v),
            x = Zt(m - u[_], y),
            S = !t.middlewareData.shift,
            C = b,
            w = x;
          if (
            ((n = t.middlewareData.shift) != null && n.enabled.x && (w = y),
            (r = t.middlewareData.shift) != null && r.enabled.y && (C = v),
            S && !f)
          ) {
            let e = Ut(u.left, 0),
              t = Ut(u.right, 0),
              n = Ut(u.top, 0),
              r = Ut(u.bottom, 0);
            p
              ? (w = m - 2 * (e !== 0 || t !== 0 ? e + t : Ut(u.left, u.right)))
              : (C =
                  h - 2 * (n !== 0 || r !== 0 ? n + r : Ut(u.top, u.bottom)));
          }
          await c({ ...t, availableWidth: w, availableHeight: C });
          let T = await o.getDimensions(s.floating);
          return m !== T.width || h !== T.height
            ? { reset: { rects: !0 } }
            : {};
        },
      }
    );
  };
function En(e) {
  let t = Yt(e),
    n = parseFloat(t.width) || 0,
    r = parseFloat(t.height) || 0,
    i = q(e),
    a = i ? e.offsetWidth : n,
    o = i ? e.offsetHeight : r,
    s = Jt(n) !== a || Jt(r) !== o;
  return (s && ((n = a), (r = o)), { width: n, height: r, $: s });
}
function Dn(e) {
  return Y(e) ? e : e.contextElement;
}
function On(e) {
  let t = Dn(e);
  if (!q(t)) return dt(1);
  let n = t.getBoundingClientRect(),
    { width: r, height: i, $: a } = En(t),
    o = (a ? Jt(n.width) : n.width) / r,
    s = (a ? Jt(n.height) : n.height) / i;
  return (
    (!o || !Number.isFinite(o)) && (o = 1),
    (!s || !Number.isFinite(s)) && (s = 1),
    { x: o, y: s }
  );
}
var kn = dt(0);
function An(e) {
  let t = gt(e);
  return !K() || !t.visualViewport
    ? kn
    : { x: t.visualViewport.offsetLeft, y: t.visualViewport.offsetTop };
}
function jn(e, t, n) {
  return (t === void 0 && (t = !1), !n || (t && n !== gt(e)) ? !1 : t);
}
function Mn(e, t, n, r) {
  (t === void 0 && (t = !1), n === void 0 && (n = !1));
  let i = e.getBoundingClientRect(),
    a = Dn(e),
    o = dt(1);
  t && (r ? Y(r) && (o = On(r)) : (o = On(e)));
  let s = jn(a, n, r) ? An(a) : dt(0),
    c = (i.left + s.x) / o.x,
    l = (i.top + s.y) / o.y,
    u = i.width / o.x,
    d = i.height / o.y;
  if (a) {
    let e = gt(a),
      t = r && Y(r) ? gt(r) : r,
      n = e,
      i = Kt(n);
    for (; i && r && t !== n; ) {
      let e = On(i),
        t = i.getBoundingClientRect(),
        r = Yt(i),
        a = t.left + (i.clientLeft + parseFloat(r.paddingLeft)) * e.x,
        o = t.top + (i.clientTop + parseFloat(r.paddingTop)) * e.y;
      ((c *= e.x),
        (l *= e.y),
        (u *= e.x),
        (d *= e.y),
        (c += a),
        (l += o),
        (n = gt(i)),
        (i = Kt(n)));
    }
  }
  return Ke({ width: u, height: d, x: c, y: l });
}
function Nn(e, t) {
  let n = B(e).scrollLeft;
  return t ? t.left + n : Mn(F(e)).left + n;
}
function Pn(e, t) {
  let n = e.getBoundingClientRect();
  return { x: n.left + t.scrollLeft - Nn(e, n), y: n.top + t.scrollTop };
}
function Fn(e) {
  let { elements: t, rect: n, offsetParent: r, strategy: i } = e,
    a = i === `fixed`,
    o = F(r),
    s = t ? G(t.floating) : !1;
  if (r === o || (s && a)) return n;
  let c = { scrollLeft: 0, scrollTop: 0 },
    l = dt(1),
    u = dt(0),
    d = q(r);
  if ((d || (!d && !a)) && ((Ee(r) !== `body` || _e(o)) && (c = B(r)), d)) {
    let e = Mn(r);
    ((l = On(r)), (u.x = e.x + r.clientLeft), (u.y = e.y + r.clientTop));
  }
  let f = o && !d && !a ? Pn(o, c) : dt(0);
  return {
    width: n.width * l.x,
    height: n.height * l.y,
    x: n.x * l.x - c.scrollLeft * l.x + u.x + f.x,
    y: n.y * l.y - c.scrollTop * l.y + u.y + f.y,
  };
}
function In(e) {
  return Array.from(e.getClientRects());
}
function Ln(e) {
  let t = F(e),
    n = B(e),
    r = e.ownerDocument.body,
    i = Ut(t.scrollWidth, t.clientWidth, r.scrollWidth, r.clientWidth),
    a = Ut(t.scrollHeight, t.clientHeight, r.scrollHeight, r.clientHeight),
    o = -n.scrollLeft + Nn(e),
    s = -n.scrollTop;
  return (
    Yt(r).direction === `rtl` && (o += Ut(t.clientWidth, r.clientWidth) - i),
    { width: i, height: a, x: o, y: s }
  );
}
var Rn = 25;
function zn(e, t) {
  let n = gt(e),
    r = F(e),
    i = n.visualViewport,
    a = r.clientWidth,
    o = r.clientHeight,
    s = 0,
    c = 0;
  if (i) {
    ((a = i.width), (o = i.height));
    let e = K();
    (!e || (e && t === `fixed`)) && ((s = i.offsetLeft), (c = i.offsetTop));
  }
  let l = Nn(r);
  if (l <= 0) {
    let e = r.ownerDocument,
      t = e.body,
      n = getComputedStyle(t),
      i =
        (e.compatMode === `CSS1Compat` &&
          parseFloat(n.marginLeft) + parseFloat(n.marginRight)) ||
        0,
      o = Math.abs(r.clientWidth - t.clientWidth - i);
    o <= Rn && (a -= o);
  } else l <= Rn && (a += l);
  return { width: a, height: o, x: s, y: c };
}
function Bn(e, t) {
  let n = Mn(e, !0, t === `fixed`),
    r = n.top + e.clientTop,
    i = n.left + e.clientLeft,
    a = q(e) ? On(e) : dt(1);
  return {
    width: e.clientWidth * a.x,
    height: e.clientHeight * a.y,
    x: i * a.x,
    y: r * a.y,
  };
}
function Vn(e, t, n) {
  let r;
  if (t === `viewport`) r = zn(e, n);
  else if (t === `document`) r = Ln(F(e));
  else if (Y(t)) r = Bn(t, n);
  else {
    let n = An(e);
    r = { x: t.x - n.x, y: t.y - n.y, width: t.width, height: t.height };
  }
  return Ke(r);
}
function Hn(e, t) {
  let n = he(e);
  return n === t || !Y(n) || pe(n)
    ? !1
    : Yt(n).position === `fixed` || Hn(n, t);
}
function Un(e, t) {
  let n = t.get(e);
  if (n) return n;
  let r = R(e, [], !1).filter((e) => Y(e) && Ee(e) !== `body`),
    i = null,
    a = Yt(e).position === `fixed`,
    o = a ? he(e) : e;
  for (; Y(o) && !pe(o); ) {
    let t = Yt(o),
      n = j(o);
    (!n && t.position === `fixed` && (i = null),
      (
        a
          ? !n && !i
          : (!n &&
              t.position === `static` &&
              i &&
              (i.position === `absolute` || i.position === `fixed`)) ||
            (_e(o) && !n && Hn(e, o))
      )
        ? (r = r.filter((e) => e !== o))
        : (i = t),
      (o = he(o)));
  }
  return (t.set(e, r), r);
}
function Wn(e) {
  let { element: t, boundary: n, rootBoundary: r, strategy: i } = e,
    a = [
      ...(n === `clippingAncestors`
        ? G(t)
          ? []
          : Un(t, this._c)
        : [].concat(n)),
      r,
    ],
    o = Vn(t, a[0], i),
    s = o.top,
    c = o.right,
    l = o.bottom,
    u = o.left;
  for (let e = 1; e < a.length; e++) {
    let n = Vn(t, a[e], i);
    ((s = Ut(n.top, s)),
      (c = Zt(n.right, c)),
      (l = Zt(n.bottom, l)),
      (u = Ut(n.left, u)));
  }
  return { width: c - u, height: l - s, x: u, y: s };
}
function Gn(e) {
  let { width: t, height: n } = En(e);
  return { width: t, height: n };
}
function Kn(e, t, n) {
  let r = q(t),
    i = F(t),
    a = n === `fixed`,
    o = Mn(e, !0, a, t),
    s = { scrollLeft: 0, scrollTop: 0 },
    c = dt(0);
  function l() {
    c.x = Nn(i);
  }
  if (r || (!r && !a))
    if (((Ee(t) !== `body` || _e(i)) && (s = B(t)), r)) {
      let e = Mn(t, !0, a, t);
      ((c.x = e.x + t.clientLeft), (c.y = e.y + t.clientTop));
    } else i && l();
  a && !r && i && l();
  let u = i && !r && !a ? Pn(i, s) : dt(0);
  return {
    x: o.left + s.scrollLeft - c.x - u.x,
    y: o.top + s.scrollTop - c.y - u.y,
    width: o.width,
    height: o.height,
  };
}
function qn(e) {
  return Yt(e).position === `static`;
}
function Jn(e, t) {
  if (!q(e) || Yt(e).position === `fixed`) return null;
  if (t) return t(e);
  let n = e.offsetParent;
  return (F(e) === n && (n = n.ownerDocument.body), n);
}
function Yn(e, t) {
  let n = gt(e);
  if (G(e)) return n;
  if (!q(e)) {
    let t = he(e);
    for (; t && !pe(t); ) {
      if (Y(t) && !qn(t)) return t;
      t = he(t);
    }
    return n;
  }
  let r = Jn(e, t);
  for (; r && H(r) && qn(r); ) r = Jn(r, t);
  return r && pe(r) && qn(r) && !j(r) ? n : r || we(e) || n;
}
var Xn = async function (e) {
  let t = this.getOffsetParent || Yn,
    n = this.getDimensions,
    r = await n(e.floating);
  return {
    reference: Kn(e.reference, await t(e.floating), e.strategy),
    floating: { x: 0, y: 0, width: r.width, height: r.height },
  };
};
function Zn(e) {
  return Yt(e).direction === `rtl`;
}
var Qn = {
  convertOffsetParentRelativeRectToViewportRelativeRect: Fn,
  getDocumentElement: F,
  getClippingRect: Wn,
  getOffsetParent: Yn,
  getElementRects: Xn,
  getClientRects: In,
  getDimensions: Gn,
  getScale: On,
  isElement: Y,
  isRTL: Zn,
};
function $n(e, t) {
  return (
    e.x === t.x && e.y === t.y && e.width === t.width && e.height === t.height
  );
}
function er(e, t) {
  let n = null,
    r,
    i = F(e);
  function a() {
    var e;
    (clearTimeout(r), (e = n) == null || e.disconnect(), (n = null));
  }
  function o(s, c) {
    (s === void 0 && (s = !1), c === void 0 && (c = 1), a());
    let l = e.getBoundingClientRect(),
      { left: u, top: d, width: f, height: p } = l;
    if ((s || t(), !f || !p)) return;
    let m = wt(d),
      h = wt(i.clientWidth - (u + f)),
      g = wt(i.clientHeight - (d + p)),
      _ = wt(u),
      v = {
        rootMargin: -m + `px ` + -h + `px ` + -g + `px ` + -_ + `px`,
        threshold: Ut(0, Zt(1, c)) || 1,
      },
      y = !0;
    function b(t) {
      let n = t[0].intersectionRatio;
      if (n !== c) {
        if (!y) return o();
        n
          ? o(!1, n)
          : (r = setTimeout(() => {
              o(!1, 1e-7);
            }, 1e3));
      }
      (n === 1 && !$n(l, e.getBoundingClientRect()) && o(), (y = !1));
    }
    try {
      n = new IntersectionObserver(b, { ...v, root: i.ownerDocument });
    } catch {
      n = new IntersectionObserver(b, v);
    }
    n.observe(e);
  }
  return (o(!0), a);
}
function tr(e, t, n, r) {
  r === void 0 && (r = {});
  let {
      ancestorScroll: i = !0,
      ancestorResize: a = !0,
      elementResize: o = typeof ResizeObserver == `function`,
      layoutShift: s = typeof IntersectionObserver == `function`,
      animationFrame: c = !1,
    } = r,
    l = Dn(e),
    u = i || a ? [...(l ? R(l) : []), ...(t ? R(t) : [])] : [];
  u.forEach((e) => {
    (i && e.addEventListener(`scroll`, n, { passive: !0 }),
      a && e.addEventListener(`resize`, n));
  });
  let d = l && s ? er(l, n) : null,
    f = -1,
    p = null;
  o &&
    ((p = new ResizeObserver((e) => {
      let [r] = e;
      (r &&
        r.target === l &&
        p &&
        t &&
        (p.unobserve(t),
        cancelAnimationFrame(f),
        (f = requestAnimationFrame(() => {
          var e;
          (e = p) == null || e.observe(t);
        }))),
        n());
    })),
    l && !c && p.observe(l),
    t && p.observe(t));
  let m,
    h = c ? Mn(e) : null;
  c && g();
  function g() {
    let t = Mn(e);
    (h && !$n(h, t) && n(), (h = t), (m = requestAnimationFrame(g)));
  }
  return (
    n(),
    () => {
      var e;
      (u.forEach((e) => {
        (i && e.removeEventListener(`scroll`, n),
          a && e.removeEventListener(`resize`, n));
      }),
        d?.(),
        (e = p) == null || e.disconnect(),
        (p = null),
        c && cancelAnimationFrame(m));
    }
  );
}
var nr = Sn,
  rr = Cn,
  ir = gn,
  ar = Tn,
  or = yn,
  sr = wn,
  cr = (e, t, n) => {
    let r = new Map(),
      i = { platform: Qn, ...n },
      a = { ...i.platform, _c: r };
    return hn(e, t, { ...i, platform: a });
  },
  lr = typeof document < `u` ? Z.useLayoutEffect : function () {};
function ur(e, t) {
  if (e === t) return !0;
  if (typeof e != typeof t) return !1;
  if (typeof e == `function` && e.toString() === t.toString()) return !0;
  let n, r, i;
  if (e && t && typeof e == `object`) {
    if (Array.isArray(e)) {
      if (((n = e.length), n !== t.length)) return !1;
      for (r = n; r-- !== 0; ) if (!ur(e[r], t[r])) return !1;
      return !0;
    }
    if (((i = Object.keys(e)), (n = i.length), n !== Object.keys(t).length))
      return !1;
    for (r = n; r-- !== 0; ) if (!{}.hasOwnProperty.call(t, i[r])) return !1;
    for (r = n; r-- !== 0; ) {
      let n = i[r];
      if (!(n === `_owner` && e.$$typeof) && !ur(e[n], t[n])) return !1;
    }
    return !0;
  }
  return e !== e && t !== t;
}
function dr(e) {
  return typeof window > `u`
    ? 1
    : (e.ownerDocument.defaultView || window).devicePixelRatio || 1;
}
function fr(e, t) {
  let n = dr(e);
  return Math.round(t * n) / n;
}
function pr(e) {
  let t = Z.useRef(e);
  return (
    lr(() => {
      t.current = e;
    }),
    t
  );
}
function mr(e) {
  e === void 0 && (e = {});
  let {
      placement: t = `bottom`,
      strategy: n = `absolute`,
      middleware: r = [],
      platform: i,
      elements: { reference: a, floating: o } = {},
      transform: s = !0,
      whileElementsMounted: c,
      open: l,
    } = e,
    [u, d] = Z.useState({
      x: 0,
      y: 0,
      strategy: n,
      placement: t,
      middlewareData: {},
      isPositioned: !1,
    }),
    [f, p] = Z.useState(r);
  ur(f, r) || p(r);
  let [m, h] = Z.useState(null),
    [g, _] = Z.useState(null),
    v = Z.useCallback((e) => {
      e !== S.current && ((S.current = e), h(e));
    }, []),
    y = Z.useCallback((e) => {
      e !== C.current && ((C.current = e), _(e));
    }, []),
    b = a || m,
    x = o || g,
    S = Z.useRef(null),
    C = Z.useRef(null),
    w = Z.useRef(u),
    T = c != null,
    E = pr(c),
    D = pr(i),
    O = pr(l),
    k = Z.useCallback(() => {
      if (!S.current || !C.current) return;
      let e = { placement: t, strategy: n, middleware: f };
      (D.current && (e.platform = D.current),
        cr(S.current, C.current, e).then((e) => {
          let t = { ...e, isPositioned: O.current !== !1 };
          A.current &&
            !ur(w.current, t) &&
            ((w.current = t),
            an.flushSync(() => {
              d(t);
            }));
        }));
    }, [f, t, n, D, O]);
  lr(() => {
    l === !1 &&
      w.current.isPositioned &&
      ((w.current.isPositioned = !1), d((e) => ({ ...e, isPositioned: !1 })));
  }, [l]);
  let A = Z.useRef(!1);
  (lr(
    () => (
      (A.current = !0),
      () => {
        A.current = !1;
      }
    ),
    [],
  ),
    lr(() => {
      if ((b && (S.current = b), x && (C.current = x), b && x)) {
        if (E.current) return E.current(b, x, k);
        k();
      }
    }, [b, x, k, E, T]));
  let j = Z.useMemo(
      () => ({ reference: S, floating: C, setReference: v, setFloating: y }),
      [v, y],
    ),
    M = Z.useMemo(() => ({ reference: b, floating: x }), [b, x]),
    N = Z.useMemo(() => {
      let e = { position: n, left: 0, top: 0 };
      if (!M.floating) return e;
      let t = fr(M.floating, u.x),
        r = fr(M.floating, u.y);
      return s
        ? {
            ...e,
            transform: `translate(` + t + `px, ` + r + `px)`,
            ...(dr(M.floating) >= 1.5 && { willChange: `transform` }),
          }
        : { position: n, left: t, top: r };
    }, [n, s, M.floating, u.x, u.y]);
  return Z.useMemo(
    () => ({ ...u, update: k, refs: j, elements: M, floatingStyles: N }),
    [u, k, j, M, N],
  );
}
var hr = (e, t) => {
    let n = nr(e);
    return { name: n.name, fn: n.fn, options: [e, t] };
  },
  gr = (e, t) => {
    let n = rr(e);
    return { name: n.name, fn: n.fn, options: [e, t] };
  },
  _r = (e, t) => ({ fn: sr(e).fn, options: [e, t] }),
  vr = (e, t) => {
    let n = ir(e);
    return { name: n.name, fn: n.fn, options: [e, t] };
  },
  yr = (e, t) => {
    let n = ar(e);
    return { name: n.name, fn: n.fn, options: [e, t] };
  },
  br = (e, t) => {
    let n = or(e);
    return { name: n.name, fn: n.fn, options: [e, t] };
  };
function xr(e) {
  let { open: t = !1, onOpenChange: n, elements: r = {} } = e,
    i = tn(),
    a = fe() != null,
    s = _(
      () =>
        new Je({
          open: t,
          transitionStatus: void 0,
          onOpenChange: n,
          referenceElement: r.reference ?? null,
          floatingElement: r.floating ?? null,
          triggerElements: new Ot(),
          floatingId: i,
          syncOnly: !1,
          nested: a,
        }),
    ).current;
  return (
    o(() => {
      let e = { open: t, floatingId: i };
      (r.reference !== void 0 &&
        ((e.referenceElement = r.reference),
        (e.domReferenceElement = Y(r.reference) ? r.reference : null)),
        r.floating !== void 0 && (e.floatingElement = r.floating),
        s.update(e));
    }, [t, i, r.reference, r.floating, s]),
    (s.context.onOpenChange = n),
    (s.context.nested = a),
    s
  );
}
function Sr(e = {}) {
  let { nodeId: t, externalTree: n } = e,
    r = xr(e),
    i = e.rootContext || r,
    a = i.useState(`referenceElement`),
    s = i.useState(`floatingElement`),
    c = i.useState(`domReferenceElement`),
    l = i.useState(`open`),
    u = i.useState(`floatingId`),
    [d, f] = Z.useState(null),
    [p, m] = Z.useState(void 0),
    [h, g] = Z.useState(void 0),
    _ = Z.useRef(null),
    v = me(n),
    y = Z.useMemo(
      () => ({ reference: a, floating: s, domReference: c }),
      [a, s, c],
    ),
    b = mr({ ...e, elements: { ...y, ...(d && { reference: d }) } }),
    x = Y(p) ? p : null,
    S = h === void 0 ? i.state.floatingElement : h;
  (i.useSyncedValue(`referenceElement`, p ?? null),
    i.useSyncedValue(`domReferenceElement`, p === void 0 ? c : x),
    i.useSyncedValue(`floatingElement`, S));
  let C = Z.useCallback(
      (e) => {
        let t = Y(e)
          ? {
              getBoundingClientRect: () => e.getBoundingClientRect(),
              getClientRects: () => e.getClientRects(),
              contextElement: e,
            }
          : e;
        (f(t), b.refs.setReference(t));
      },
      [b.refs],
    ),
    w = Z.useCallback(
      (e) => {
        ((Y(e) || e === null) && ((_.current = e), m(e)),
          (Y(b.refs.reference.current) ||
            b.refs.reference.current === null ||
            (e !== null && !Y(e))) &&
            b.refs.setReference(e));
      },
      [b.refs, m],
    ),
    T = Z.useCallback(
      (e) => {
        (g(e), b.refs.setFloating(e));
      },
      [b.refs],
    ),
    E = Z.useMemo(
      () => ({
        ...b.refs,
        setReference: w,
        setFloating: T,
        setPositionReference: C,
        domReference: _,
      }),
      [b.refs, w, T, C],
    ),
    D = Z.useMemo(() => ({ ...b.elements, domReference: c }), [b.elements, c]),
    O = Z.useMemo(
      () => ({
        ...b,
        dataRef: i.context.dataRef,
        open: l,
        onOpenChange: i.setOpen,
        events: i.context.events,
        floatingId: u,
        refs: E,
        elements: D,
        nodeId: t,
        rootStore: i,
      }),
      [b, E, D, t, i, l, u],
    );
  return (
    o(() => {
      c && (_.current = c);
    }, [c]),
    o(() => {
      i.context.dataRef.current.floatingContext = O;
      let e = v?.nodesRef.current.find((e) => e.id === t);
      e && (e.context = O);
    }),
    Z.useMemo(
      () => ({ ...b, context: O, refs: E, elements: D, rootStore: i }),
      [b, E, D, O, i],
    )
  );
}
var Cr = Ve && Wt;
function wr(e, t = {}) {
  let { enabled: n = !0, delay: r } = t,
    i = `rootStore` in e ? e.rootStore : e,
    { events: a, dataRef: o } = i.context,
    c = Z.useRef(!1),
    l = Z.useRef(null),
    u = Z.useRef(!0),
    d = s();
  (Z.useEffect(() => {
    let e = i.select(`domReferenceElement`);
    if (!n) return;
    let t = gt(e);
    function r() {
      let e = i.select(`domReferenceElement`);
      !i.select(`open`) && q(e) && e === zt(Dt(e)) && (c.current = !0);
    }
    function a() {
      u.current = !0;
    }
    function o() {
      u.current = !1;
    }
    return L(
      qe(t, `blur`, r),
      Cr && qe(t, `keydown`, a, !0),
      Cr && qe(t, `pointerdown`, o, !0),
    );
  }, [i, n]),
    Z.useEffect(() => {
      if (!n) return;
      function e(e) {
        if (e.reason === `trigger-press` || e.reason === `escape-key`) {
          let e = i.select(`domReferenceElement`);
          Y(e) && ((l.current = e), (c.current = !0));
        }
      }
      return (
        a.on(`openchange`, e),
        () => {
          a.off(`openchange`, e);
        }
      );
    }, [a, n, i]));
  let f = Z.useMemo(() => {
    function e() {
      ((c.current = !1), (l.current = null));
    }
    return {
      onMouseLeave() {
        e();
      },
      onFocus(t) {
        let n = t.currentTarget;
        if (c.current) {
          if (l.current === n) return;
          e();
        }
        let a = Nt(t.nativeEvent);
        if (Y(a)) {
          if (Cr && !t.relatedTarget) {
            if (!u.current && !O(a)) return;
          } else if (!nt(a)) return;
        }
        let o = Re(t.relatedTarget, i.context.triggerElements),
          { nativeEvent: s, currentTarget: f } = t,
          p = typeof r == `function` ? r() : r;
        if ((i.select(`open`) && o) || p === 0 || p === void 0) {
          i.setOpen(!0, J(U, s, f));
          return;
        }
        d.start(p, () => {
          c.current || i.setOpen(!0, J(U, s, f));
        });
      },
      onBlur(t) {
        e();
        let n = t.relatedTarget,
          r = t.nativeEvent,
          a =
            Y(n) &&
            n.hasAttribute(Ae(`focus-guard`)) &&
            n.getAttribute(`data-type`) === `outside`;
        d.start(0, () => {
          let e = i.select(`domReferenceElement`),
            t = zt(Dt(e));
          (!n && t === e) ||
            X(o.current.floatingContext?.refs.floating.current, t) ||
            X(e, t) ||
            a ||
            Re(n ?? t, i.context.triggerElements) ||
            i.setOpen(!1, J(U, r));
        });
      },
    };
  }, [o, r, i, d]);
  return Z.useMemo(() => (n ? { reference: f, trigger: f } : {}), [n, f]);
}
var Tr = class e {
    constructor() {
      ((this.pointerType = void 0),
        (this.interactedInside = !1),
        (this.handler = void 0),
        (this.blockMouseMove = !0),
        (this.performedPointerEventsMutation = !1),
        (this.pointerEventsScopeElement = null),
        (this.pointerEventsReferenceElement = null),
        (this.pointerEventsFloatingElement = null),
        (this.restTimeoutPending = !1),
        (this.openChangeTimeout = new g()),
        (this.restTimeout = new g()),
        (this.handleCloseOptions = void 0));
    }
    static create() {
      return new e();
    }
    dispose = () => {
      (this.openChangeTimeout.clear(), this.restTimeout.clear());
    };
    disposeEffect = () => this.dispose;
  },
  Er = new WeakMap();
function Dr(e) {
  if (!e.performedPointerEventsMutation) return;
  let t = e.pointerEventsScopeElement;
  (t &&
    Er.get(t) === e &&
    (e.pointerEventsScopeElement?.style.removeProperty(`pointer-events`),
    e.pointerEventsReferenceElement?.style.removeProperty(`pointer-events`),
    e.pointerEventsFloatingElement?.style.removeProperty(`pointer-events`),
    Er.delete(t)),
    (e.performedPointerEventsMutation = !1),
    (e.pointerEventsScopeElement = null),
    (e.pointerEventsReferenceElement = null),
    (e.pointerEventsFloatingElement = null));
}
function Or(e, t) {
  let { scopeElement: n, referenceElement: r, floatingElement: i } = t,
    a = Er.get(n);
  (a && a !== e && Dr(a),
    Dr(e),
    (e.performedPointerEventsMutation = !0),
    (e.pointerEventsScopeElement = n),
    (e.pointerEventsReferenceElement = r),
    (e.pointerEventsFloatingElement = i),
    Er.set(n, e),
    (n.style.pointerEvents = `none`),
    (r.style.pointerEvents = `auto`),
    (i.style.pointerEvents = `auto`));
}
function kr(e) {
  let t = e.context.dataRef.current,
    n = _(() => t.hoverInteractionState ?? Tr.create()).current;
  return (
    (t.hoverInteractionState ||= n),
    h(t.hoverInteractionState.disposeEffect),
    t.hoverInteractionState
  );
}
function Ar(e, t = {}) {
  let { enabled: n = !0, closeDelay: r = 0, nodeId: i } = t,
    a = `rootStore` in e ? e.rootStore : e,
    c = a.useState(`open`),
    l = a.useState(`floatingElement`),
    u = a.useState(`domReferenceElement`),
    { dataRef: d } = a.context,
    f = me(),
    p = fe(),
    m = kr(a),
    h = s(),
    g = S(() => ln(d.current.openEvent?.type, m.interactedInside)),
    _ = S(() => un(d.current.openEvent?.type)),
    v = S(() => {
      Dr(m);
    });
  (o(() => {
    c ||
      ((m.pointerType = void 0),
      (m.restTimeoutPending = !1),
      (m.interactedInside = !1),
      v());
  }, [c, m, v]),
    Z.useEffect(() => v, [v]),
    o(() => {
      if (
        n &&
        c &&
        m.handleCloseOptions?.blockPointerEvents &&
        _() &&
        Y(u) &&
        l
      ) {
        let e = u,
          t = l,
          n = Dt(l),
          r = f?.nodesRef.current.find((e) => e.id === p)?.context?.elements
            .floating;
        r && (r.style.pointerEvents = ``);
        let i =
            m.pointerEventsScopeElement === t
              ? null
              : m.pointerEventsScopeElement,
          a = r === t ? null : r;
        return (
          Or(m, {
            scopeElement:
              m.handleCloseOptions?.getScope?.() ??
              i ??
              a ??
              e.closest(`[data-rootownerid]`) ??
              n.body,
            referenceElement: e,
            floatingElement: t,
          }),
          () => {
            v();
          }
        );
      }
    }, [n, c, u, l, m, _, f, p, v]),
    Z.useEffect(() => {
      if (!n) return;
      function e() {
        return !!(f && p && W(f.nodesRef.current, p).length > 0);
      }
      function t(e) {
        let t = sn(r, `close`, m.pointerType),
          n = () => {
            (a.setOpen(!1, J(ce, e)), f?.events.emit(`floating.closed`, e));
          };
        t
          ? m.openChangeTimeout.start(t, n)
          : (m.openChangeTimeout.clear(), n());
      }
      function o(e) {
        let t = Nt(e);
        if (!Ne(t)) {
          m.interactedInside = !1;
          return;
        }
        m.interactedInside = t?.closest(`[aria-haspopup]`) != null;
      }
      function s() {
        (m.openChangeTimeout.clear(),
          h.clear(),
          f?.events.off(`floating.closed`, u),
          v());
      }
      function c(n) {
        if (e() && f) {
          f.events.on(`floating.closed`, u);
          return;
        }
        if (Re(n.relatedTarget, a.context.triggerElements)) return;
        let r = d.current.floatingContext?.nodeId ?? i,
          o = n.relatedTarget;
        if (
          !(
            f &&
            r &&
            Y(o) &&
            W(f.nodesRef.current, r, !1).some((e) =>
              X(e.context?.elements.floating, o),
            )
          )
        ) {
          if (m.handler) {
            m.handler(n);
            return;
          }
          (v(), g() || t(n));
        }
      }
      function u(t) {
        !f ||
          !p ||
          e() ||
          h.start(0, () => {
            (f.events.off(`floating.closed`, u),
              a.setOpen(!1, J(ce, t)),
              f.events.emit(`floating.closed`, t));
          });
      }
      let _ = l;
      return L(
        _ && qe(_, `mouseenter`, s),
        _ && qe(_, `mouseleave`, c),
        _ && qe(_, `pointerdown`, o, !0),
        () => {
          f?.events.off(`floating.closed`, u);
        },
      );
    }, [n, l, a, d, r, i, g, v, m, f, p, h]));
}
var jr = { current: null };
function Mr(e, t = {}) {
  let {
      enabled: n = !0,
      delay: r = 0,
      handleClose: i = null,
      mouseOnly: a = !1,
      restMs: o = 0,
      move: s = !0,
      triggerElementRef: c = jr,
      externalTree: l,
      isActiveTrigger: u = !0,
      getHandleCloseContext: d,
      isClosing: f,
      shouldOpen: p,
    } = t,
    m = `rootStore` in e ? e.rootStore : e,
    { dataRef: h, events: g } = m.context,
    _ = me(l),
    v = kr(m),
    y = Z.useRef(!1),
    b = z(i),
    x = z(r),
    C = z(o),
    w = z(n),
    T = z(p),
    E = z(f),
    D = S(() => ln(h.current.openEvent?.type, v.interactedInside)),
    O = S(() => T.current?.() !== !1),
    k = S((e, t, n) => {
      let r = m.context.triggerElements;
      if (r.hasElement(t)) return !e || !X(e, t);
      if (!Y(n)) return !1;
      let i = n;
      return r.hasMatchingElement((e) => X(e, i)) && (!e || !X(e, i));
    }),
    A = S(() => {
      v.handler &&=
        (Dt(m.select(`domReferenceElement`)).removeEventListener(
          `mousemove`,
          v.handler,
        ),
        void 0);
    }),
    j = S(() => {
      Dr(v);
    });
  return (
    u && (v.handleCloseOptions = b.current?.__options),
    Z.useEffect(() => A, [A]),
    Z.useEffect(() => {
      if (!n) return;
      function e(e) {
        e.open
          ? (y.current = !1)
          : ((y.current = e.reason === ce),
            A(),
            v.openChangeTimeout.clear(),
            v.restTimeout.clear(),
            (v.blockMouseMove = !0),
            (v.restTimeoutPending = !1));
      }
      return (
        g.on(`openchange`, e),
        () => {
          g.off(`openchange`, e);
        }
      );
    }, [n, g, v, A]),
    Z.useEffect(() => {
      if (!n) return;
      function e(e, t = !0) {
        let n = sn(x.current, `close`, v.pointerType);
        n
          ? v.openChangeTimeout.start(n, () => {
              (m.setOpen(!1, J(ce, e)), _?.events.emit(`floating.closed`, e));
            })
          : t &&
            (v.openChangeTimeout.clear(),
            m.setOpen(!1, J(ce, e)),
            _?.events.emit(`floating.closed`, e));
      }
      let t = c.current ?? (u ? m.select(`domReferenceElement`) : null);
      if (!Y(t)) return;
      function r(e) {
        if (
          (v.openChangeTimeout.clear(),
          (v.blockMouseMove = !1),
          a && !Ze(v.pointerType))
        )
          return;
        let t = cn(C.current),
          n = sn(x.current, `open`, v.pointerType),
          r = Nt(e),
          i = e.currentTarget ?? null,
          o = m.select(`domReferenceElement`),
          s = i;
        if (Y(r) && !m.context.triggerElements.hasElement(r)) {
          for (let e of m.context.triggerElements.elements())
            if (X(e, r)) {
              s = e;
              break;
            }
        }
        Y(i) &&
          Y(o) &&
          !m.context.triggerElements.hasElement(i) &&
          X(i, o) &&
          (s = o);
        let c = s == null ? !1 : k(o, s, r),
          l = m.select(`open`),
          u = E.current?.() ?? m.select(`transitionStatus`) === `ending`,
          d = !l && u && y.current,
          f = !c && Y(s) && Y(o) && X(o, s) && d,
          p = t > 0 && !n,
          h = (c && (l || d)) || f,
          g = !l || c;
        if (h) {
          O() && m.setOpen(!0, J(ce, e, s));
          return;
        }
        p ||
          (n
            ? v.openChangeTimeout.start(n, () => {
                g && O() && m.setOpen(!0, J(ce, e, s));
              })
            : g && O() && m.setOpen(!0, J(ce, e, s)));
      }
      function i(t) {
        if (D()) {
          j();
          return;
        }
        A();
        let n = Dt(m.select(`domReferenceElement`));
        (v.restTimeout.clear(), (v.restTimeoutPending = !1));
        let r = h.current.floatingContext ?? d?.();
        if (!Re(t.relatedTarget, m.context.triggerElements)) {
          if (b.current && r) {
            m.select(`open`) || v.openChangeTimeout.clear();
            let i = c.current;
            ((v.handler = b.current({
              ...r,
              tree: _,
              x: t.clientX,
              y: t.clientY,
              onClose() {
                (j(),
                  A(),
                  w.current &&
                    !D() &&
                    i === m.select(`domReferenceElement`) &&
                    e(t, !0));
              },
            })),
              n.addEventListener(`mousemove`, v.handler),
              v.handler(t));
            return;
          }
          (v.pointerType !== `touch` ||
            !X(m.select(`floatingElement`), t.relatedTarget)) &&
            e(t);
        }
      }
      return s
        ? L(
            qe(t, `mousemove`, r, { once: !0 }),
            qe(t, `mouseenter`, r),
            qe(t, `mouseleave`, i),
          )
        : L(qe(t, `mouseenter`, r), qe(t, `mouseleave`, i));
    }, [A, j, h, x, m, n, b, v, u, k, D, a, s, C, c, _, w, d, E, O]),
    Z.useMemo(() => {
      if (!n) return;
      function e(e) {
        v.pointerType = e.pointerType;
      }
      return {
        onPointerDown: e,
        onPointerEnter: e,
        onMouseMove(e) {
          let { nativeEvent: t } = e,
            n = e.currentTarget,
            r = m.select(`domReferenceElement`),
            i = m.select(`open`),
            o = k(r, n, e.target);
          if (a && !Ze(v.pointerType)) return;
          if (i && o && v.handleCloseOptions?.blockPointerEvents) {
            let e = m.select(`floatingElement`);
            e &&
              Or(v, {
                scopeElement:
                  v.handleCloseOptions?.getScope?.() ?? n.ownerDocument.body,
                referenceElement: n,
                floatingElement: e,
              });
          }
          let s = cn(C.current);
          if (
            (i && !o) ||
            s === 0 ||
            (!o &&
              v.restTimeoutPending &&
              e.movementX ** 2 + e.movementY ** 2 < 2)
          )
            return;
          v.restTimeout.clear();
          function c() {
            if (((v.restTimeoutPending = !1), D())) return;
            let e = m.select(`open`);
            !v.blockMouseMove && (!e || o) && O() && m.setOpen(!0, J(ce, t, n));
          }
          v.pointerType === `touch`
            ? an.flushSync(() => {
                c();
              })
            : o && i
              ? c()
              : ((v.restTimeoutPending = !0), v.restTimeout.start(s, c));
        },
      };
    }, [n, v, D, k, a, m, C, O])
  );
}
var Nr = `Escape`;
function Pr(e, t, n) {
  switch (e) {
    case `vertical`:
      return t;
    case `horizontal`:
      return n;
    default:
      return t || n;
  }
}
function Fr(e, t) {
  return Pr(
    t,
    e === `ArrowUp` || e === `ArrowDown`,
    e === `ArrowLeft` || e === `ArrowRight`,
  );
}
function Ir(e, t, n) {
  return (
    Pr(t, e === `ArrowDown`, n ? e === `ArrowLeft` : e === `ArrowRight`) ||
    e === `Enter` ||
    e === ` ` ||
    e === ``
  );
}
function Lr(e, t, n) {
  return Pr(t, n ? e === We : e === Tt, e === ft);
}
function Rr(e, t, n, r) {
  return t === `both` || (t === `horizontal` && r && r > 1)
    ? e === Nr
    : Pr(t, n ? e === Tt : e === We, e === It);
}
function zr(e, n) {
  let {
      listRef: r,
      activeIndex: i,
      onNavigate: a = () => {},
      enabled: s = !0,
      selectedIndex: c = null,
      allowEscape: l = !1,
      loopFocus: u = !1,
      nested: d = !1,
      rtl: f = !1,
      virtual: p = !1,
      focusItemOnOpen: m = `auto`,
      focusItemOnHover: h = !0,
      openOnArrowKeyDown: g = !0,
      disabledIndices: _ = void 0,
      orientation: v = `vertical`,
      parentOrientation: y,
      cols: b = 1,
      id: x,
      resetOnPointerLeave: C = !0,
      externalTree: w,
    } = n,
    T = `rootStore` in e ? e.rootStore : e,
    E = T.useState(`open`),
    D = T.useState(`floatingElement`),
    O = T.useState(`domReferenceElement`),
    A = T.context.dataRef,
    j = Fe(D),
    M = ye(O),
    N = z(j),
    ee = fe(),
    F = me(w),
    I = Z.useRef(m),
    L = Z.useRef(c ?? -1),
    R = Z.useRef(null),
    te = Z.useRef(!0),
    B = S((e) => {
      a(L.current === -1 ? null : L.current, e);
    }),
    V = Z.useRef(B),
    H = Z.useRef(!!D),
    re = Z.useRef(E),
    U = Z.useRef(!1),
    ie = Z.useRef(!1),
    W = Z.useRef(null),
    ae = z(_),
    G = z(E),
    oe = z(c),
    ce = z(C),
    le = t(),
    K = t(),
    ue = S(() => {
      function e(e) {
        p
          ? F?.events.emit(`virtualfocus`, e)
          : (W.current = P(e, { sync: U.current, preventScroll: !0 }));
      }
      let t = r.current[L.current],
        n = ie.current;
      (t && e(t),
        (U.current ? (e) => e() : (e) => le.request(e))(() => {
          let i = r.current[L.current] || t;
          i &&
            (t || e(i),
            ve &&
              (n || !te.current) &&
              i.scrollIntoView?.({ block: `nearest`, inline: `nearest` }));
        }));
    });
  (o(() => {
    A.current.orientation = v;
  }, [A, v]),
    o(() => {
      s &&
        (E && D
          ? ((L.current = c ?? -1),
            I.current && c != null && ((ie.current = !0), B()))
          : H.current && ((L.current = -1), V.current()));
    }, [s, E, D, c, B]),
    o(() => {
      if (s) {
        if (!E) {
          U.current = !1;
          return;
        }
        if (D)
          if (i == null) {
            if (((U.current = !1), oe.current != null)) return;
            if (
              (H.current && ((L.current = -1), ue()),
              (!re.current || !H.current) &&
                I.current &&
                (R.current != null || (I.current === !0 && R.current == null)))
            ) {
              let e = 0,
                t = () => {
                  r.current[0] == null
                    ? (e < 2 && (e ? (e) => K.request(e) : queueMicrotask)(t),
                      (e += 1))
                    : ((L.current =
                        R.current == null || Ir(R.current, v, f) || d
                          ? k(r)
                          : be(r)),
                      (R.current = null),
                      B());
                };
              t();
            }
          } else Rt(r.current, i) || ((L.current = i), ue(), (ie.current = !1));
      }
    }, [s, E, D, i, oe, d, r, v, f, B, ue, K]),
    o(() => {
      if (!s || D || !F || p || !H.current) return;
      let e = F.nodesRef.current,
        t = e.find((e) => e.id === ee)?.context?.elements.floating,
        n = zt(Dt(D)),
        r = e.some((e) => e.context && X(e.context.elements.floating, n));
      t && !r && te.current && t.focus({ preventScroll: !0 });
    }, [s, D, F, ee, p]),
    o(() => {
      ((V.current = B), (re.current = E), (H.current = !!D));
    }),
    o(() => {
      E || ((R.current = null), (I.current = m));
    }, [E, m]));
  let de = i != null,
    pe = S((e) => {
      if (!G.current) return;
      let t = r.current.indexOf(e.currentTarget);
      t !== -1 && (L.current !== t || i !== t) && ((L.current = t), B(e));
    }),
    he = S(
      () =>
        y ??
        F?.nodesRef.current.find((e) => e.id === ee)?.context?.dataRef?.current
          .orientation,
    ),
    ge = S(() => k(r, ae.current)),
    _e = S((e) => {
      if (
        ((te.current = !1),
        (U.current = !0),
        e.which === 229 || (!G.current && e.currentTarget === N.current))
      )
        return;
      if (d && Rr(e.key, v, f, b)) {
        (Fr(e.key, he()) || $e(e),
          T.setOpen(!1, J(ke, e.nativeEvent)),
          q(O) && (p ? F?.events.emit(`virtualfocus`, O) : O.focus()));
        return;
      }
      let t = L.current,
        n = k(r, _),
        i = be(r, _);
      if (
        (M ||
          (e.key === `Home` && ($e(e), (L.current = n), B(e)),
          e.key === `End` && ($e(e), (L.current = i), B(e))),
        b > 1)
      ) {
        let t = Array.from({ length: r.current.length }, () => ({
            width: 1,
            height: 1,
          })),
          a = At(t, b, !1),
          o = a.findIndex((e) => e != null && !Ct(r.current, e, _)),
          s = a.reduce(
            (e, t, n) => (t != null && !Ct(r.current, t, _) ? n : e),
            -1,
          ),
          c =
            a[
              ze(
                a.map((e) => (e == null ? null : r.current[e])),
                {
                  event: e,
                  orientation: v,
                  loopFocus: u,
                  rtl: f,
                  cols: b,
                  disabledIndices: Pe(
                    [
                      ...((typeof _ == `function` ? null : _) ||
                        r.current.map((e, t) =>
                          Ct(r.current, t, _) ? t : void 0,
                        )),
                      void 0,
                    ],
                    a,
                  ),
                  minIndex: o,
                  maxIndex: s,
                  prevIndex: Ie(
                    L.current > i ? n : L.current,
                    t,
                    a,
                    b,
                    e.key === `ArrowDown`
                      ? `bl`
                      : e.key === (f ? `ArrowLeft` : `ArrowRight`)
                        ? `tr`
                        : `tl`,
                  ),
                  stopEvent: !0,
                },
              )
            ];
        if ((c != null && ((L.current = c), B(e)), v === `both`)) return;
      }
      if (Fr(e.key, v)) {
        if (
          ($e(e),
          E && !p && zt(e.currentTarget.ownerDocument) === e.currentTarget)
        ) {
          ((L.current = Ir(e.key, v, f) ? n : i), B(e));
          return;
        }
        (Ir(e.key, v, f)
          ? u
            ? t >= i
              ? l && t !== r.current.length
                ? (L.current = -1)
                : ((U.current = !1), (L.current = n))
              : (L.current = se(r.current, {
                  startingIndex: t,
                  disabledIndices: _,
                }))
            : (L.current = Math.min(
                i,
                se(r.current, { startingIndex: t, disabledIndices: _ }),
              ))
          : u
            ? t <= n
              ? l && t !== -1
                ? (L.current = r.current.length)
                : ((U.current = !1), (L.current = i))
              : (L.current = se(r.current, {
                  startingIndex: t,
                  decrement: !0,
                  disabledIndices: _,
                }))
            : (L.current = Math.max(
                n,
                se(r.current, {
                  startingIndex: t,
                  decrement: !0,
                  disabledIndices: _,
                }),
              )),
          Rt(r.current, L.current) && (L.current = -1),
          B(e));
      }
    }),
    ve = Z.useMemo(
      () => ({
        onFocus(e) {
          ((U.current = !0), pe(e));
        },
        onClick: ({ currentTarget: e }) => e.focus({ preventScroll: !0 }),
        onMouseMove(e) {
          ((U.current = !0), (ie.current = !1), h && pe(e));
        },
        onPointerLeave(e) {
          if (!G.current || !te.current || e.pointerType === `touch`) return;
          U.current = !0;
          let t = e.relatedTarget;
          if (
            !(!h || r.current.includes(t)) &&
            ce.current &&
            (W.current?.(), (W.current = null), (L.current = -1), B(e), !p)
          ) {
            let e = N.current,
              t = zt(Dt(e));
            e && X(e, t) && e.focus({ preventScroll: !0 });
          }
        },
      }),
      [pe, G, N, h, r, B, ce, p],
    ),
    xe = Z.useMemo(
      () => p && E && de && { "aria-activedescendant": `${x}-${i}` },
      [p, E, de, x, i],
    ),
    Se = Z.useMemo(
      () => ({
        "aria-orientation": v === `both` ? void 0 : v,
        ...(M ? {} : xe),
        onKeyDown(e) {
          if (e.key === `Tab` && e.shiftKey && E && !p) {
            let t = Nt(e.nativeEvent);
            if (t && !X(N.current, t)) return;
            ($e(e), T.setOpen(!1, J(ne, e.nativeEvent)), q(O) && O.focus());
            return;
          }
          _e(e);
        },
        onPointerMove() {
          te.current = !0;
        },
      }),
      [xe, _e, N, v, M, T, E, p, O],
    ),
    Ce = Z.useMemo(() => {
      function e(e) {
        T.setOpen(!0, J(ke, e.nativeEvent, e.currentTarget));
      }
      function t(e) {
        m === `auto` && yt(e.nativeEvent) && (I.current = !p);
      }
      function n(e) {
        ((I.current = m),
          m === `auto` && Ht(e.nativeEvent) && (I.current = !0));
      }
      return {
        onKeyDown(t) {
          let n = T.select(`open`);
          te.current = !1;
          let r = t.key.startsWith(`Arrow`),
            i = Lr(t.key, he(), f),
            a = Fr(t.key, v),
            o = (d ? i : a) || t.key === `Enter` || t.key.trim() === ``;
          if (p && n) return _e(t);
          if (!(!n && !g && r)) {
            if (o) {
              let e = Fr(t.key, he());
              R.current = d && e ? null : t.key;
            }
            if (d) {
              i && ($e(t), n ? ((L.current = ge()), B(t)) : e(t));
              return;
            }
            a &&
              (oe.current != null && (L.current = oe.current),
              $e(t),
              !n && g ? e(t) : _e(t),
              n && B(t));
          }
        },
        onFocus(e) {
          T.select(`open`) && !p && ((L.current = -1), B(e));
        },
        onPointerDown: n,
        onPointerEnter: n,
        onMouseDown: t,
        onClick: t,
      };
    }, [_e, m, ge, d, B, T, g, v, he, f, oe, p]),
    we = Z.useMemo(() => ({ ...xe, ...Ce }), [xe, Ce]);
  return Z.useMemo(
    () => (s ? { reference: we, floating: Se, item: ve, trigger: Ce } : {}),
    [s, we, Se, Ce, ve],
  );
}
function Br(e, t) {
  let {
      listRef: n,
      elementsRef: r,
      activeIndex: i,
      onMatch: a,
      onTyping: c,
      enabled: l = !0,
      resetMs: u = 750,
      selectedIndex: d = null,
    } = t,
    f = `rootStore` in e ? e.rootStore : e,
    p = f.useState(`open`),
    m = s(),
    h = Z.useRef(``),
    g = Z.useRef(d ?? i ?? -1),
    _ = Z.useRef(null),
    v = S((e) => {
      function t(e) {
        let t = r?.current[e];
        return !t || tt(t);
      }
      function o(e, n, r = 0) {
        if (e.length === 0) return -1;
        let i = ((r % e.length) + e.length) % e.length,
          a = n.toLocaleLowerCase();
        for (let n = 0; n < e.length; n += 1) {
          let r = (i + n) % e.length;
          if (!(!e[r]?.toLocaleLowerCase().startsWith(a) || !t(r))) return r;
        }
        return -1;
      }
      let s = n.current;
      if (
        (h.current.length > 0 && e.key === ` ` && ($e(e), c?.(!0)),
        h.current.length > 0 &&
          h.current[0] !== ` ` &&
          o(s, h.current) === -1 &&
          e.key !== ` ` &&
          c?.(!1),
        s == null || e.key.length !== 1 || e.ctrlKey || e.metaKey || e.altKey)
      )
        return;
      p && e.key !== ` ` && ($e(e), c?.(!0));
      let l = h.current === ``;
      (l && (g.current = d ?? i ?? -1),
        s.every((e) =>
          e ? e[0]?.toLocaleLowerCase() !== e[1]?.toLocaleLowerCase() : !0,
        ) &&
          h.current === e.key &&
          ((h.current = ``), (g.current = _.current)),
        (h.current += e.key),
        m.start(u, () => {
          ((h.current = ``), (g.current = _.current), c?.(!1));
        }));
      let f = ((l ? (d ?? i ?? -1) : g.current) ?? 0) + 1,
        v = o(s, h.current, f);
      v === -1
        ? e.key !== ` ` && ((h.current = ``), c?.(!1))
        : (a?.(v), (_.current = v));
    }),
    y = S((e) => {
      let t = e.relatedTarget,
        n = f.select(`domReferenceElement`),
        r = f.select(`floatingElement`);
      X(n, t) ||
        X(r, t) ||
        (m.clear(), (h.current = ``), (g.current = _.current), c?.(!1));
    });
  (o(() => {
    (!p && d !== null) ||
      (m.clear(), (_.current = null), h.current !== `` && (h.current = ``));
  }, [p, d, m]),
    o(() => {
      p && h.current === `` && (g.current = d ?? i ?? -1);
    }, [p, d, i]));
  let b = Z.useMemo(() => ({ onKeyDown: v, onBlur: y }), [v, y]);
  return Z.useMemo(() => (l ? { reference: b, floating: b } : {}), [l, b]);
}
var Vr = 0.1,
  Hr = Vr * Vr,
  Q = 0.5;
function Ur(e, t, n, r, i, a) {
  return r >= t != a >= t && e <= ((i - n) * (t - r)) / (a - r) + n;
}
function Wr(e, t, n, r, i, a, o, s, c, l) {
  let u = !1;
  return (
    Ur(e, t, n, r, i, a) && (u = !u),
    Ur(e, t, i, a, o, s) && (u = !u),
    Ur(e, t, o, s, c, l) && (u = !u),
    Ur(e, t, c, l, n, r) && (u = !u),
    u
  );
}
function Gr(e, t, n) {
  return e >= n.x && e <= n.x + n.width && t >= n.y && t <= n.y + n.height;
}
function Kr(e, t, n, r, i, a) {
  return (
    e >= Math.min(n, i) &&
    e <= Math.max(n, i) &&
    t >= Math.min(r, a) &&
    t <= Math.max(r, a)
  );
}
function qr(e = {}) {
  let { blockPointerEvents: t = !1 } = e,
    n = new g(),
    r = ({
      x: e,
      y: t,
      placement: r,
      elements: i,
      onClose: a,
      nodeId: o,
      tree: s,
    }) => {
      let c = r?.split(`-`)[0],
        l = !1,
        u = null,
        d = null,
        f = typeof performance < `u` ? performance.now() : 0;
      function p(e, t) {
        let n = performance.now(),
          r = n - f;
        if (u === null || d === null || r === 0)
          return ((u = e), (d = t), (f = n), !1);
        let i = e - u,
          a = t - d,
          o = i * i + a * a,
          s = r * r * Hr;
        return ((u = e), (d = t), (f = n), o < s);
      }
      function m() {
        (n.clear(), a());
      }
      return function (r) {
        n.clear();
        let a = i.domReference,
          u = i.floating;
        if (!a || !u || c == null || e == null || t == null) return;
        let { clientX: d, clientY: f } = r,
          h = Nt(r),
          g = r.type === `mouseleave`,
          _ = X(u, h),
          v = X(a, h);
        if (_ && ((l = !0), !g)) return;
        if (v && ((l = !1), !g)) {
          l = !0;
          return;
        }
        if (g && Y(r.relatedTarget) && X(u, r.relatedTarget)) return;
        function y() {
          return !!(s && W(s.nodesRef.current, o).length > 0);
        }
        function b() {
          y() || m();
        }
        if (y()) return;
        let x = a.getBoundingClientRect(),
          S = u.getBoundingClientRect(),
          C = e > S.right - S.width / 2,
          w = t > S.bottom - S.height / 2,
          T = S.width > x.width,
          E = S.height > x.height,
          D = (T ? x : S).left,
          O = (T ? x : S).right,
          k = (E ? x : S).top,
          A = (E ? x : S).bottom;
        if (
          (c === `top` && t >= x.bottom - 1) ||
          (c === `bottom` && t <= x.top + 1) ||
          (c === `left` && e >= x.right - 1) ||
          (c === `right` && e <= x.left + 1)
        ) {
          b();
          return;
        }
        let j = !1;
        switch (c) {
          case `top`:
            j = Kr(d, f, D, x.top + 1, O, S.bottom - 1);
            break;
          case `bottom`:
            j = Kr(d, f, D, S.top + 1, O, x.bottom - 1);
            break;
          case `left`:
            j = Kr(d, f, S.right - 1, A, x.left + 1, k);
            break;
          case `right`:
            j = Kr(d, f, x.right - 1, A, S.left + 1, k);
            break;
          default:
        }
        if (j) return;
        if (l && !Gr(d, f, x)) {
          b();
          return;
        }
        if (!g && p(d, f)) {
          b();
          return;
        }
        let M = !1;
        switch (c) {
          case `top`: {
            let n = T ? Q / 2 : Q * 4,
              r = T || C ? e + n : e - n,
              i = T ? e - n : C ? e + n : e - n,
              a = t + Q + 1,
              o = C || T ? S.bottom - Q : S.top,
              s = C ? (T ? S.bottom - Q : S.top) : S.bottom - Q;
            M = Wr(d, f, r, a, i, a, S.left, o, S.right, s);
            break;
          }
          case `bottom`: {
            let n = T ? Q / 2 : Q * 4,
              r = T || C ? e + n : e - n,
              i = T ? e - n : C ? e + n : e - n,
              a = t - Q,
              o = C || T ? S.top + Q : S.bottom,
              s = C ? (T ? S.top + Q : S.bottom) : S.top + Q;
            M = Wr(d, f, r, a, i, a, S.left, o, S.right, s);
            break;
          }
          case `left`: {
            let n = E ? Q / 2 : Q * 4,
              r = E || w ? t + n : t - n,
              i = E ? t - n : w ? t + n : t - n,
              a = e + Q + 1,
              o = w || E ? S.right - Q : S.left,
              s = w ? (E ? S.right - Q : S.left) : S.right - Q;
            M = Wr(d, f, o, S.top, s, S.bottom, a, r, a, i);
            break;
          }
          case `right`: {
            let n = E ? Q / 2 : Q * 4,
              r = E || w ? t + n : t - n,
              i = E ? t - n : w ? t + n : t - n,
              a = e - Q,
              o = w || E ? S.left + Q : S.right,
              s = w ? (E ? S.left + Q : S.right) : S.left + Q;
            M = Wr(d, f, a, r, a, i, o, S.top, s, S.bottom);
            break;
          }
          default:
        }
        M ? l || n.start(40, b) : b();
      };
    };
  return ((r.__options = { ...e, blockPointerEvents: t }), r);
}
var $ = l();
function Jr(e) {
  let t = Z.useRef(``),
    n = Z.useCallback(
      (n) => {
        n.defaultPrevented ||
          ((t.current = n.pointerType), e(n, n.pointerType));
      },
      [e],
    );
  return {
    onClick: Z.useCallback(
      (n) => {
        if (n.detail === 0) {
          e(n, `keyboard`);
          return;
        }
        (`pointerType` in n ? e(n, n.pointerType) : e(n, t.current),
          (t.current = ``));
      },
      [e],
    ),
    onPointerDown: n,
  };
}
function Yr(e, t) {
  let n = Z.useRef(e),
    r = S(t);
  (o(() => {
    n.current !== e && r(n.current);
  }, [e, r]),
    o(() => {
      n.current = e;
    }, [e]));
}
function Xr(e, t) {
  let { onClick: n, onPointerDown: r } = Jr(
    S((n, r) => {
      (typeof e == `function` ? e() : e) || t(r || (st ? `touch` : ``));
    }),
  );
  return Z.useMemo(() => ({ onClick: n, onPointerDown: r }), [n, r]);
}
function Zr(e) {
  let [t, n] = Z.useState(null),
    r = Xr(e, n);
  return (
    Yr(e, (t) => {
      t && !e && n(null);
    }),
    Z.useMemo(() => ({ openMethod: t, triggerProps: r }), [t, r])
  );
}
var Qr = v(`check`, [[`path`, { d: `M20 6 9 17l-5-5`, key: `1gmf2c` }]]),
  $r = v(`fingerprint-pattern`, [
    [`path`, { d: `M12 10a2 2 0 0 0-2 2c0 1.02-.1 2.51-.26 4`, key: `1nerag` }],
    [`path`, { d: `M14 13.12c0 2.38 0 6.38-1 8.88`, key: `o46ks0` }],
    [`path`, { d: `M17.29 21.02c.12-.6.43-2.3.5-3.02`, key: `ptglia` }],
    [`path`, { d: `M2 12a10 10 0 0 1 18-6`, key: `ydlgp0` }],
    [`path`, { d: `M2 16h.01`, key: `1gqxmh` }],
    [`path`, { d: `M21.8 16c.2-2 .131-5.354 0-6`, key: `drycrb` }],
    [`path`, { d: `M5 19.5C5.5 18 6 15 6 12a6 6 0 0 1 .34-2`, key: `1tidbn` }],
    [`path`, { d: `M8.65 22c.21-.66.45-1.32.57-2`, key: `13wd9y` }],
    [`path`, { d: `M9 6.8a6 6 0 0 1 9 5.2v2`, key: `1fr1j5` }],
  ]),
  ei = v(`key-round`, [
    [
      `path`,
      {
        d: `M2.586 17.414A2 2 0 0 0 2 18.828V21a1 1 0 0 0 1 1h3a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1h1a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1h.172a2 2 0 0 0 1.414-.586l.814-.814a6.5 6.5 0 1 0-4-4z`,
        key: `1s6t7t`,
      },
    ],
    [
      `circle`,
      { cx: `16.5`, cy: `7.5`, r: `.5`, fill: `currentColor`, key: `w0ekpg` },
    ],
  ]),
  ti = v(`languages`, [
    [`path`, { d: `m5 8 6 6`, key: `1wu5hv` }],
    [`path`, { d: `m4 14 6-6 2-3`, key: `1k1g8d` }],
    [`path`, { d: `M2 5h12`, key: `or177f` }],
    [`path`, { d: `M7 2h1`, key: `1t2jsx` }],
    [`path`, { d: `m22 22-5-10-5 10`, key: `don7ne` }],
    [`path`, { d: `M14 18h6`, key: `1m8k6r` }],
  ]),
  ni = v(`monitor`, [
    [
      `rect`,
      { width: `20`, height: `14`, x: `2`, y: `3`, rx: `2`, key: `48i651` },
    ],
    [`line`, { x1: `8`, x2: `16`, y1: `21`, y2: `21`, key: `1svkeh` }],
    [`line`, { x1: `12`, x2: `12`, y1: `17`, y2: `21`, key: `vw1qmm` }],
  ]),
  ri = v(`moon`, [
    [
      `path`,
      {
        d: `M20.985 12.486a9 9 0 1 1-9.473-9.472c.405-.022.617.46.402.803a6 6 0 0 0 8.268 8.268c.344-.215.825-.004.803.401`,
        key: `kfwtm`,
      },
    ],
  ]),
  ii = v(`shield-check`, [
    [
      `path`,
      {
        d: `M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z`,
        key: `oel41y`,
      },
    ],
    [`path`, { d: `m9 12 2 2 4-4`, key: `dzmm74` }],
  ]),
  ai = v(`sun`, [
    [`circle`, { cx: `12`, cy: `12`, r: `4`, key: `4exip2` }],
    [`path`, { d: `M12 2v2`, key: `tus03m` }],
    [`path`, { d: `M12 20v2`, key: `1lh1kg` }],
    [`path`, { d: `m4.93 4.93 1.41 1.41`, key: `149t6j` }],
    [`path`, { d: `m17.66 17.66 1.41 1.41`, key: `ptbguv` }],
    [`path`, { d: `M2 12h2`, key: `1t8f8n` }],
    [`path`, { d: `M20 12h2`, key: `1q8mjw` }],
    [`path`, { d: `m6.34 17.66-1.41 1.41`, key: `1m8zz5` }],
    [`path`, { d: `m19.07 4.93-1.41 1.41`, key: `1shlcs` }],
  ]);
function oi({ className: e }) {
  let { t } = T(),
    { app: n, isLoading: r } = C();
  return r || n?.hidePoweredBy || !n || n.hidePoweredBy
    ? null
    : (0, $.jsxs)(`a`, {
        href: `https://huruftech.com`,
        target: `_blank`,
        rel: `noreferrer`,
        className: b(
          `inline-flex items-center gap-2 text-xs text-muted-foreground transition-colors hover:text-foreground`,
          e,
        ),
        children: [
          t(`Powered by`),
          (0, $.jsx)(`img`, {
            src: w,
            className: `h-4.5 w-auto`,
            alt: `Huruf Tech`,
          }),
        ],
      });
}
var si = Z.createContext(void 0);
function ci(t) {
  let n = Z.useContext(si);
  if (n === void 0 && !t) throw Error(e(33));
  return n;
}
var li = Z.createContext(void 0);
function ui(t) {
  let n = Z.useContext(li);
  if (n === void 0 && !t) throw Error(e(36));
  return n;
}
var di = Z.createContext(void 0);
function fi(t = !0) {
  let n = Z.useContext(di);
  if (n === void 0 && !t) throw Error(e(25));
  return n;
}
function pi(e) {
  let {
      closeOnClick: t,
      highlighted: n,
      id: r,
      nodeId: i,
      store: a,
      typingRef: o,
      itemRef: s,
      itemMetadata: c,
    } = e,
    { events: l } = a.useState(`floatingTreeRoot`),
    u = fi(!0),
    d = u !== void 0;
  return Z.useMemo(
    () => ({
      id: r,
      role: `menuitem`,
      tabIndex: n ? 0 : -1,
      onKeyDown(e) {
        e.key === ` ` && o?.current && e.preventDefault();
      },
      onMouseMove(e) {
        i && l.emit(`itemhover`, { nodeId: i, target: e.currentTarget });
      },
      onClick(e) {
        t && l.emit(`close`, { domEvent: e, reason: N });
      },
      onMouseUp(e) {
        if (u) {
          let t = u.initialCursorPointRef.current;
          if (
            ((u.initialCursorPointRef.current = null),
            (d &&
              t &&
              Math.abs(e.clientX - t.x) <= 1 &&
              Math.abs(e.clientY - t.y) <= 1) ||
              (d && !Ve && e.button === 2))
          )
            return;
        }
        s.current &&
          a.context.allowMouseUpTriggerRef.current &&
          (!d || e.button === 2) &&
          (!c || c.type === `regular-item`) &&
          s.current.click();
      },
    }),
    [t, n, r, l, i, a, o, s, u, d, c],
  );
}
var mi = { type: `regular-item` };
function hi(e) {
  let {
      closeOnClick: t,
      disabled: n = !1,
      highlighted: r,
      id: i,
      store: o,
      typingRef: s = o.context.typingRef,
      nativeButton: c,
      itemMetadata: l,
      nodeId: u,
    } = e,
    f = Z.useRef(null),
    { getButtonProps: p, buttonRef: m } = D({
      disabled: n,
      focusableWhenDisabled: !0,
      native: c,
      composite: !0,
    }),
    h = pi({
      closeOnClick: t,
      highlighted: r,
      id: i,
      nodeId: u,
      store: o,
      typingRef: s,
      itemRef: f,
      itemMetadata: l,
    }),
    g = Z.useCallback(
      (e) =>
        a(
          h,
          {
            onMouseEnter() {
              l.type === `submenu-trigger` && l.setActive();
            },
          },
          e,
          p,
        ),
      [h, p, l],
    ),
    _ = d(f, m);
  return Z.useMemo(() => ({ getItemProps: g, itemRef: _ }), [g, _]);
}
var gi = Z.createContext({
  register: () => {},
  unregister: () => {},
  subscribeMapChange: () => () => {},
  elementsRef: { current: [] },
  nextIndexRef: { current: 0 },
});
function _i() {
  return Z.useContext(gi);
}
var vi = (function (e) {
  return (
    (e[(e.None = 0)] = `None`),
    (e[(e.GuessFromOrder = 1)] = `GuessFromOrder`),
    e
  );
})({});
function yi(e = {}) {
  let {
      label: t,
      metadata: n,
      textRef: r,
      indexGuessBehavior: i,
      index: a,
    } = e,
    {
      register: s,
      unregister: c,
      subscribeMapChange: l,
      elementsRef: u,
      labelsRef: d,
      nextIndexRef: f,
    } = _i(),
    p = Z.useRef(-1),
    [m, h] = Z.useState(
      a ??
        (i === vi.GuessFromOrder
          ? () => {
              if (p.current === -1) {
                let e = f.current;
                ((f.current += 1), (p.current = e));
              }
              return p.current;
            }
          : -1),
    ),
    g = Z.useRef(null),
    _ = Z.useCallback(
      (e) => {
        if (
          ((g.current = e), m !== -1 && e !== null && ((u.current[m] = e), d))
        ) {
          let n = t !== void 0;
          d.current[m] = n ? t : (r?.current?.textContent ?? e.textContent);
        }
      },
      [m, u, d, t, r],
    );
  return (
    o(() => {
      if (a != null) return;
      let e = g.current;
      if (e)
        return (
          s(e, n),
          () => {
            c(e);
          }
        );
    }, [a, s, c, n]),
    o(() => {
      if (a == null)
        return l((e) => {
          let t = g.current ? e.get(g.current)?.index : null;
          t != null && h(t);
        });
    }, [a, l, h]),
    Z.useMemo(() => ({ ref: _, index: m }), [m, _])
  );
}
var bi = Z.createContext(void 0);
function xi() {
  let t = Z.useContext(bi);
  if (t === void 0) throw Error(e(31));
  return t;
}
var Si = Z.forwardRef(function (e, t) {
    let { render: n, className: r, style: i, ...a } = e,
      [o, s] = Z.useState(void 0),
      c = f(`div`, e, {
        ref: t,
        props: { role: `group`, "aria-labelledby": o, ...a },
      });
    return (0, $.jsx)(bi.Provider, { value: s, children: c });
  }),
  Ci = Z.forwardRef(function (e, t) {
    let { render: n, className: r, style: i, id: a, ...s } = e,
      c = Le(a),
      l = xi();
    return (
      o(
        () => (
          l(c),
          () => {
            l(void 0);
          }
        ),
        [l, c],
      ),
      f(`div`, e, { ref: t, props: { id: c, role: `presentation`, ...s } })
    );
  }),
  wi = Z.forwardRef(function (e, t) {
    let {
        render: n,
        className: r,
        id: i,
        label: a,
        nativeButton: o = !1,
        disabled: s = !1,
        closeOnClick: c = !0,
        style: l,
        ...u
      } = e,
      d = yi({ label: a }),
      p = ci(!0),
      m = Le(i),
      { store: h } = ui(),
      g = h.useState(`isActive`, d.index),
      _ = h.useState(`itemProps`),
      { getItemProps: v, itemRef: y } = hi({
        closeOnClick: c,
        disabled: s,
        highlighted: g,
        id: m,
        store: h,
        nativeButton: o,
        nodeId: p?.context.nodeId,
        itemMetadata: mi,
      });
    return f(`div`, e, {
      state: { disabled: s, highlighted: g },
      props: [_, u, v],
      ref: [y, t, d.ref],
    });
  }),
  Ti = Z.createContext(void 0);
function Ei(t) {
  let n = Z.useContext(Ti);
  if (n === void 0 && !t) throw Error(e(69));
  return n;
}
function Di(e) {
  return e === `starting` ? oe : u;
}
var Oi = { ...pt, ...m },
  ki = Z.forwardRef(function (e, t) {
    let { render: n, className: r, style: i, finalFocus: a, ...o } = e,
      { store: s } = ui(),
      { side: c, align: l } = ci(),
      u = Ei(!0) != null,
      d = s.useState(`open`),
      m = s.useState(`transitionStatus`),
      h = s.useState(`popupProps`),
      g = s.useState(`mounted`),
      _ = s.useState(`instantType`),
      v = s.useState(`activeTriggerElement`),
      y = s.useState(`parent`),
      b = s.useState(`lastOpenChangeReason`),
      x = s.useState(`rootId`),
      S = s.useState(`floatingRootContext`),
      C = s.useState(`floatingTreeRoot`),
      w = s.useState(`closeDelay`),
      T = s.useState(`activeTriggerElement`),
      E = s.useState(`hoverEnabled`),
      D = s.useState(`disabled`),
      O = y.type === `context-menu`;
    (p({
      open: d,
      ref: s.context.popupRef,
      onComplete() {
        d && s.context.onOpenChangeComplete?.(!0);
      },
    }),
      Z.useEffect(() => {
        function e(e) {
          s.setOpen(!1, J(e.reason, e.domEvent));
        }
        return (
          C.events.on(`close`, e),
          () => {
            C.events.off(`close`, e);
          }
        );
      }, [C.events, s]),
      Ar(S, { enabled: E && !D && !O && y.type !== `menubar`, closeDelay: w }));
    let k = Z.useCallback(
        (e) => {
          s.set(`popupElement`, e);
        },
        [s],
      ),
      A = f(`div`, e, {
        state: {
          transitionStatus: m,
          side: c,
          align: l,
          open: d,
          nested: y.type === `menu`,
          instant: _,
        },
        ref: [t, s.context.popupRef, k],
        stateAttributesMapping: Oi,
        props: [
          h,
          {
            onKeyDown(e) {
              u && $t.has(e.key) && e.stopPropagation();
            },
          },
          Di(m),
          o,
          { "data-rootownerid": x },
        ],
      }),
      j = y.type === void 0 || O;
    return (
      (v || (y.type === `menubar` && b !== `outside-press`)) && (j = !0),
      (0, $.jsx)(ge, {
        context: S,
        modal: O,
        disabled: !g,
        returnFocus: a === void 0 ? j : a,
        initialFocus: y.type !== `menu`,
        restoreFocus: !0,
        externalTree: y.type === `menubar` ? void 0 : C,
        previousFocusableElement: T,
        nextFocusableElement:
          y.type === void 0 ? s.context.triggerFocusTargetRef : void 0,
        beforeContentFocusGuardRef:
          y.type === void 0 ? s.context.beforeContentFocusGuardRef : void 0,
        children: A,
      })
    );
  }),
  Ai = Z.createContext(void 0);
function ji() {
  let t = Z.useContext(Ai);
  if (t === void 0) throw Error(e(32));
  return t;
}
var Mi = Z.forwardRef(function (e, t) {
    let { keepMounted: n = !1, ...r } = e,
      { store: i } = ui();
    return i.useState(`mounted`) || n
      ? (0, $.jsx)(Ai.Provider, {
          value: n,
          children: (0, $.jsx)(re, { ref: t, ...r }),
        })
      : null;
  }),
  Ni = (e) => ({
    name: `arrow`,
    options: e,
    async fn(t) {
      let {
          x: n,
          y: r,
          placement: i,
          rects: a,
          platform: o,
          elements: s,
          middlewareData: c,
        } = t,
        {
          element: l,
          padding: u = 0,
          offsetParent: d = `real`,
        } = Ue(e, t) || {};
      if (l == null) return {};
      let f = lt(u),
        p = { x: n, y: r },
        m = Xe(i),
        h = Vt(m),
        g = await o.getDimensions(l),
        _ = m === `y`,
        v = _ ? `top` : `left`,
        y = _ ? `bottom` : `right`,
        b = _ ? `clientHeight` : `clientWidth`,
        x = a.reference[h] + a.reference[m] - p[m] - a.floating[h],
        S = p[m] - a.reference[m],
        C = d === `real` ? await o.getOffsetParent?.(l) : s.floating,
        w = s.floating[b] || a.floating[h];
      (!w || !(await o.isElement?.(C))) && (w = s.floating[b] || a.floating[h]);
      let T = x / 2 - S / 2,
        E = w / 2 - g[h] / 2 - 1,
        D = Math.min(f[v], E),
        O = Math.min(f[y], E),
        k = D,
        A = w - g[h] - O,
        j = w / 2 - g[h] / 2 + T,
        M = Mt(k, j, A),
        N =
          !c.arrow &&
          Ft(i) != null &&
          j !== M &&
          a.reference[h] / 2 - (j < k ? D : O) - g[h] / 2 < 0,
        P = N ? (j < k ? j - k : j - A) : 0;
      return {
        [m]: p[m] + P,
        data: {
          [m]: M,
          centerOffset: j - M - P,
          ...(N && { alignmentOffset: P }),
        },
        reset: N,
      };
    },
  }),
  Pi = (e, t) => ({ ...Ni(e), options: [e, t] }),
  Fi = {
    name: `hide`,
    async fn(e) {
      let { width: t, height: n, x: r, y: i } = e.rects.reference,
        a = t === 0 && n === 0 && r === 0 && i === 0;
      return {
        data: {
          referenceHidden: (await br().fn(e)).data?.referenceHidden || a,
        },
      };
    },
  },
  Ii = { sideX: `left`, sideY: `top` },
  Li = {
    name: `adaptiveOrigin`,
    async fn(e) {
      let {
          x: t,
          y: n,
          rects: { floating: r },
          elements: { floating: i },
          platform: a,
          strategy: o,
          placement: s,
        } = e,
        c = gt(i),
        l = c.getComputedStyle(i);
      if (!(l.transitionDuration !== `0s` && l.transitionDuration !== ``))
        return { x: t, y: n, data: Ii };
      let u = await a.getOffsetParent?.(i),
        d = { width: 0, height: 0 };
      if (o === `fixed` && c?.visualViewport)
        d = { width: c.visualViewport.width, height: c.visualViewport.height };
      else if (u === c) {
        let e = Dt(i);
        d = {
          width: e.documentElement.clientWidth,
          height: e.documentElement.clientHeight,
        };
      } else (await a.isElement?.(u)) && (d = await a.getDimensions(u));
      let f = ot(s),
        p = t,
        m = n;
      (f === `left` && (p = d.width - (t + r.width)),
        f === `top` && (m = d.height - (n + r.height)));
      let h = f === `left` ? `right` : Ii.sideX,
        g = f === `top` ? `bottom` : Ii.sideY;
      return { x: p, y: m, data: { sideX: h, sideY: g } };
    },
  };
function Ri(e, t, n) {
  let r = e === `inline-start` || e === `inline-end`;
  return {
    top: `top`,
    right: r ? (n ? `inline-start` : `inline-end`) : `right`,
    bottom: `bottom`,
    left: r ? (n ? `inline-end` : `inline-start`) : `left`,
  }[t];
}
function zi(e, t, n) {
  let { rects: r, placement: i } = e;
  return {
    side: Ri(t, ot(i), n),
    align: Ft(i) || `center`,
    anchor: { width: r.reference.width, height: r.reference.height },
    positioner: { width: r.floating.width, height: r.floating.height },
  };
}
function Bi(e) {
  let {
      anchor: t,
      positionMethod: n = `absolute`,
      side: r = `bottom`,
      sideOffset: i = 0,
      align: a = `center`,
      alignOffset: s = 0,
      collisionBoundary: c,
      collisionPadding: l = 5,
      sticky: u = !1,
      arrowPadding: d = 5,
      disableAnchorTracking: f = !1,
      inline: p,
      keepMounted: m = !1,
      floatingRootContext: h,
      mounted: g,
      collisionAvoidance: _,
      shiftCrossAxis: v = !1,
      nodeId: y,
      adaptiveOrigin: b,
      lazyFlip: x = !1,
      externalTree: C,
    } = e,
    [w, T] = Z.useState(null);
  !g && w !== null && T(null);
  let E = _.side || `flip`,
    D = _.align || `flip`,
    O = _.fallbackAxisSide || `end`,
    k = typeof t == `function` ? t : void 0,
    A = S(k),
    j = k ? A : t,
    M = z(t),
    N = z(g),
    P = en() === `rtl`,
    ee =
      w ||
      {
        top: `top`,
        right: `right`,
        bottom: `bottom`,
        left: `left`,
        "inline-end": P ? `left` : `right`,
        "inline-start": P ? `right` : `left`,
      }[r],
    F = a === `center` ? ee : `${ee}-${a}`,
    I = l,
    L = +(r === `bottom`),
    R = +(r === `top`),
    te = +(r === `right`),
    B = +(r === `left`);
  typeof I == `number`
    ? (I = { top: I + L, right: I + B, bottom: I + R, left: I + te })
    : (I &&= {
        top: (I.top || 0) + L,
        right: (I.right || 0) + B,
        bottom: (I.bottom || 0) + R,
        left: (I.left || 0) + te,
      });
  let V = {
      boundary: c === `clipping-ancestors` ? `clippingAncestors` : c,
      padding: I,
    },
    ne = Z.useRef(null),
    H = z(i),
    re = z(s),
    U = typeof i == `function` ? 0 : i,
    ie = typeof s == `function` ? 0 : s,
    W = [];
  (p && W.push(p),
    W.push(
      hr(
        (e) => {
          let t = zi(e, r, P),
            n = typeof H.current == `function` ? H.current(t) : H.current,
            i = typeof re.current == `function` ? re.current(t) : re.current;
          return { mainAxis: n, crossAxis: i, alignmentAxis: i };
        },
        [U, ie, P, r],
      ),
    ));
  let ae = D === `none` && E !== `shift`,
    G = !ae && (u || v || E === `shift`),
    oe =
      E === `none`
        ? null
        : vr({
            ...V,
            padding: {
              top: I.top + 1,
              right: I.right + 1,
              bottom: I.bottom + 1,
              left: I.left + 1,
            },
            mainAxis: !v && E === `flip`,
            crossAxis: D === `flip` ? `alignment` : !1,
            fallbackAxisSideDirection: O,
          }),
    se = ae
      ? null
      : gr(
          (e) => {
            let t = Dt(e.elements.floating).documentElement;
            return {
              ...V,
              rootBoundary: v
                ? { x: 0, y: 0, width: t.clientWidth, height: t.clientHeight }
                : void 0,
              mainAxis: D !== `none`,
              crossAxis: G,
              limiter:
                u || v
                  ? void 0
                  : _r((e) => {
                      if (!ne.current) return {};
                      let { width: t, height: n } =
                          ne.current.getBoundingClientRect(),
                        r = Be(ot(e.placement)),
                        i = r === `y` ? t : n,
                        a = r === `y` ? I.left + I.right : I.top + I.bottom;
                      return { offset: i / 2 + a / 2 };
                    }),
            };
          },
          [V, u, v, I, D],
        );
  (E === `shift` || D === `shift` || a === `center`
    ? W.push(se, oe)
    : W.push(oe, se),
    W.push(
      yr({
        ...V,
        apply({
          elements: { floating: e },
          availableWidth: t,
          availableHeight: n,
          rects: r,
        }) {
          if (!N.current) return;
          let i = e.style;
          (i.setProperty(`--available-width`, `${t}px`),
            i.setProperty(`--available-height`, `${n}px`));
          let a = gt(e).devicePixelRatio || 1,
            { x: o, y: s, width: c, height: l } = r.reference,
            u = (Math.round((o + c) * a) - Math.round(o * a)) / a,
            d = (Math.round((s + l) * a) - Math.round(s * a)) / a;
          (i.setProperty(`--anchor-width`, `${u}px`),
            i.setProperty(`--anchor-height`, `${d}px`));
        },
      }),
      Pi(
        (e) => ({
          element: ne.current || Dt(e.elements.floating).createElement(`div`),
          padding: d,
          offsetParent: `floating`,
        }),
        [d],
      ),
      {
        name: `transformOrigin`,
        fn(e) {
          let {
              elements: t,
              middlewareData: n,
              placement: a,
              rects: o,
              y: s,
            } = e,
            c = ot(a),
            l = Be(c),
            u = ne.current,
            d = n.arrow?.x || 0,
            f = n.arrow?.y || 0,
            p = u?.clientWidth || 0,
            m = u?.clientHeight || 0,
            h = d + p / 2,
            g = f + m / 2,
            _ = Math.abs(n.shift?.y || 0),
            v = o.reference.height / 2,
            y = typeof i == `function` ? i(zi(e, r, P)) : i,
            b = _ > y,
            x = {
              top: `${h}px calc(100% + ${y}px)`,
              bottom: `${h}px ${-y}px`,
              left: `calc(100% + ${y}px) ${g}px`,
              right: `${-y}px ${g}px`,
            }[c],
            S = `${h}px ${o.reference.y + v - s}px`;
          return (
            t.floating.style.setProperty(
              `--transform-origin`,
              G && l === `y` && b ? S : x,
            ),
            {}
          );
        },
      },
      Fi,
      b,
    ),
    o(() => {
      !g &&
        h &&
        h.update({
          referenceElement: null,
          floatingElement: null,
          domReferenceElement: null,
          positionReference: null,
        });
    }, [g, h]));
  let ce = Z.useMemo(
      () => ({
        elementResize: !f && typeof ResizeObserver < `u`,
        layoutShift: !f && typeof IntersectionObserver < `u`,
      }),
      [f],
    ),
    {
      refs: le,
      elements: K,
      x: ue,
      y: de,
      middlewareData: q,
      update: fe,
      placement: pe,
      context: me,
      isPositioned: J,
      floatingStyles: he,
    } = Sr({
      rootContext: h,
      open: m ? g : void 0,
      placement: F,
      middleware: W,
      strategy: n,
      whileElementsMounted: m ? void 0 : (...e) => tr(...e, ce),
      nodeId: y,
      externalTree: C,
    }),
    { sideX: ge, sideY: _e } = q.adaptiveOrigin || Ii,
    ve = J ? n : `fixed`,
    ye = Z.useMemo(() => {
      let e = b
        ? { position: ve, [ge]: ue, [_e]: de }
        : { position: ve, ...he };
      return (J || (e.opacity = 0), e);
    }, [b, ve, ge, ue, _e, de, he, J]),
    be = Z.useRef(null);
  (o(() => {
    if (!g) return;
    let e = M.current,
      t = typeof e == `function` ? e() : e,
      n = (Vi(t) ? t.current : t) || null;
    n !== be.current && (le.setPositionReference(n), (be.current = n));
  }, [g, le, j, M]),
    Z.useEffect(() => {
      if (!g) return;
      let e = M.current;
      typeof e != `function` &&
        Vi(e) &&
        e.current !== be.current &&
        (le.setPositionReference(e.current), (be.current = e.current));
    }, [g, le, j, M]),
    Z.useEffect(() => {
      if (m && g && K.domReference && K.floating)
        return tr(K.domReference, K.floating, fe, ce);
    }, [m, g, K, fe, ce]));
  let xe = ot(pe),
    Se = Ri(r, xe, P),
    Ce = Ft(pe) || `center`,
    we = !!q.hide?.referenceHidden;
  o(() => {
    x && g && J && T(xe);
  }, [x, g, J, xe]);
  let Te = Z.useMemo(
      () => ({ position: `absolute`, top: q.arrow?.y, left: q.arrow?.x }),
      [q.arrow],
    ),
    Ee = q.arrow?.centerOffset !== 0;
  return Z.useMemo(
    () => ({
      positionerStyles: ye,
      arrowStyles: Te,
      arrowRef: ne,
      arrowUncentered: Ee,
      side: Se,
      align: Ce,
      physicalSide: xe,
      anchorHidden: we,
      refs: le,
      context: me,
      isPositioned: J,
      update: fe,
    }),
    [ye, Te, ne, Ee, Se, Ce, xe, we, le, me, J, fe],
  );
}
function Vi(e) {
  return e != null && `current` in e;
}
function Hi(e) {
  let { children: t, elementsRef: n, labelsRef: r, onMapChange: i } = e,
    a = S(i),
    s = Z.useRef(0),
    c = _(Wi).current,
    l = _(Ui).current,
    [u, d] = Z.useState(0),
    f = Z.useRef(u),
    p = S((e, t) => {
      (l.set(e, t ?? null), (f.current += 1), d(f.current));
    }),
    m = S((e) => {
      (l.delete(e), (f.current += 1), d(f.current));
    }),
    h = Z.useMemo(() => {
      let e = new Map();
      return (
        Array.from(l.keys())
          .filter((e) => e.isConnected)
          .sort(Gi)
          .forEach((t, n) => {
            let r = l.get(t) ?? {};
            e.set(t, { ...r, index: n });
          }),
        e
      );
    }, [l, u]);
  (o(() => {
    if (typeof MutationObserver != `function` || h.size === 0) return;
    let e = new MutationObserver((e) => {
      let t = new Set(),
        n = (e) => (t.has(e) ? t.delete(e) : t.add(e));
      (e.forEach((e) => {
        (e.removedNodes.forEach(n), e.addedNodes.forEach(n));
      }),
        t.size === 0 && ((f.current += 1), d(f.current)));
    });
    return (
      h.forEach((t, n) => {
        n.parentElement && e.observe(n.parentElement, { childList: !0 });
      }),
      () => {
        e.disconnect();
      }
    );
  }, [h]),
    o(() => {
      (f.current === u &&
        (n.current.length !== h.size && (n.current.length = h.size),
        r && r.current.length !== h.size && (r.current.length = h.size),
        (s.current = h.size)),
        a(h));
    }, [a, h, n, r, u]),
    o(
      () => () => {
        n.current = [];
      },
      [n],
    ),
    o(
      () => () => {
        r && (r.current = []);
      },
      [r],
    ));
  let g = S(
    (e) => (
      c.add(e),
      () => {
        c.delete(e);
      }
    ),
  );
  o(() => {
    c.forEach((e) => e(h));
  }, [c, h]);
  let v = Z.useMemo(
    () => ({
      register: p,
      unregister: m,
      subscribeMapChange: g,
      elementsRef: n,
      labelsRef: r,
      nextIndexRef: s,
    }),
    [p, m, g, n, r, s],
  );
  return (0, $.jsx)(gi.Provider, { value: v, children: t });
}
function Ui() {
  return new Map();
}
function Wi() {
  return new Set();
}
function Gi(e, t) {
  let n = e.compareDocumentPosition(t);
  return n & Node.DOCUMENT_POSITION_FOLLOWING ||
    n & Node.DOCUMENT_POSITION_CONTAINED_BY
    ? -1
    : n & Node.DOCUMENT_POSITION_PRECEDING ||
        n & Node.DOCUMENT_POSITION_CONTAINS
      ? 1
      : 0;
}
function Ki(
  e,
  t,
  {
    styles: n,
    transitionStatus: r,
    props: i,
    refs: a,
    hidden: o,
    inert: s = !1,
  },
) {
  let c = { ...n };
  return (
    s && (c.pointerEvents = `none`),
    f(`div`, e, {
      state: t,
      ref: a,
      props: [{ role: `presentation`, hidden: o, style: c }, Di(r), i],
      stateAttributesMapping: pt,
    })
  );
}
var qi = 20;
function Ji(e, t, n, r) {
  let [i, a] = Z.useState(!1);
  (o(() => {
    if (!e || !t || n == null) {
      a(!1);
      return;
    }
    let r = Dt(n).documentElement.clientWidth,
      i = n.offsetWidth;
    a(r > 0 && i > 0 && i >= r - qi);
  }, [e, t, n]),
    it(e && (!t || i), r));
}
var Yi = Z.forwardRef(function (e, t) {
    let {
        anchor: r,
        positionMethod: i = `absolute`,
        className: a,
        render: c,
        side: l,
        align: u,
        sideOffset: d = 0,
        alignOffset: f = 0,
        collisionBoundary: p = `clipping-ancestors`,
        collisionPadding: m = 5,
        arrowPadding: h = 5,
        sticky: g = !1,
        disableAnchorTracking: _ = !1,
        collisionAvoidance: v = ue,
        style: y,
        ...b
      } = e,
      { store: x } = ui(),
      S = ji(),
      C = fi(!0),
      w = x.useState(`parent`),
      T = x.useState(`floatingRootContext`),
      E = x.useState(`floatingTreeRoot`),
      D = x.useState(`mounted`),
      O = x.useState(`open`),
      k = x.useState(`modal`),
      A = x.useState(`openMethod`),
      j = x.useState(`activeTriggerElement`),
      M = x.useState(`transitionStatus`),
      N = x.useState(`positionerElement`),
      P = x.useState(`instantType`),
      ee = x.useState(`hasViewport`),
      F = x.useState(`lastOpenChangeReason`),
      I = x.useState(`floatingNodeId`),
      L = x.useState(`floatingParentNodeId`),
      R = T.useState(`domReferenceElement`),
      te = Z.useRef(null),
      z = n(N, !1, !1),
      B = r,
      V = d,
      ne = f,
      H = u,
      re = v;
    w.type === `context-menu` &&
      ((B = r ?? w.context?.anchor),
      (H ??= `start`),
      !l &&
        H !== `center` &&
        ((ne = e.alignOffset ?? 2), (V = e.sideOffset ?? -5)));
    let U = l,
      ie = H;
    w.type === `menu`
      ? ((U ??= `inline-end`),
        (ie ??= `start`),
        (re = e.collisionAvoidance ?? Se))
      : w.type === `menubar` && ((U ??= `bottom`), (ie ??= `start`));
    let W = w.type === `context-menu`,
      ae = Bi({
        anchor: B,
        floatingRootContext: T,
        positionMethod: C ? `fixed` : i,
        mounted: D,
        side: U,
        sideOffset: V,
        align: ie,
        alignOffset: ne,
        arrowPadding: W ? 0 : h,
        collisionBoundary: p,
        collisionPadding: m,
        sticky: g,
        nodeId: I,
        keepMounted: S,
        disableAnchorTracking: _,
        collisionAvoidance: re,
        shiftCrossAxis: W && !(`side` in re && re.side === `flip`),
        externalTree: E,
        adaptiveOrigin: ee ? Li : void 0,
      });
    (Z.useEffect(() => {
      function e(e) {
        e.open &&
          (e.parentNodeId === I && x.set(`hoverEnabled`, !1),
          e.nodeId !== I &&
            e.parentNodeId === x.select(`floatingParentNodeId`) &&
            x.setOpen(!1, J(je)));
      }
      return (
        E.events.on(`menuopenchange`, e),
        () => {
          E.events.off(`menuopenchange`, e);
        }
      );
    }, [x, E.events, I]),
      Z.useEffect(() => {
        if (x.select(`floatingParentNodeId`) == null) return;
        function e(e) {
          if (e.open || e.nodeId !== x.select(`floatingParentNodeId`)) return;
          let t = e.reason ?? `sibling-open`;
          x.setOpen(!1, J(t));
        }
        return (
          E.events.on(`menuopenchange`, e),
          () => {
            E.events.off(`menuopenchange`, e);
          }
        );
      }, [E.events, x]));
    let G = s();
    (Z.useEffect(() => {
      O || G.clear();
    }, [O, G]),
      Z.useEffect(() => {
        function e(e) {
          if (!(!O || e.nodeId !== x.select(`floatingParentNodeId`)))
            if (e.target && j && j !== e.target) {
              let e = x.select(`closeDelay`);
              e > 0
                ? G.isStarted() ||
                  G.start(e, () => {
                    x.setOpen(!1, J(je));
                  })
                : x.setOpen(!1, J(je));
            } else G.clear();
        }
        return (
          E.events.on(`itemhover`, e),
          () => {
            E.events.off(`itemhover`, e);
          }
        );
      }, [E.events, O, j, x, G]),
      Z.useEffect(() => {
        let e = {
          open: O,
          nodeId: I,
          parentNodeId: L,
          reason: x.select(`lastOpenChangeReason`),
        };
        E.events.emit(`menuopenchange`, e);
      }, [E.events, O, x, I, L]),
      o(() => {
        let e = R,
          t = te.current;
        if ((e && (te.current = e), t && e && e !== t)) {
          x.set(`instantType`, void 0);
          let e = new AbortController();
          return (
            z(() => {
              x.set(`instantType`, `trigger-change`);
            }, e.signal),
            () => {
              e.abort();
            }
          );
        }
      }, [R, z, x]));
    let oe = {
        open: O,
        side: ae.side,
        align: ae.align,
        anchorHidden: ae.anchorHidden,
        nested: w.type === `menu`,
        instant: P,
      },
      se = w.type === `menubar` && w.context.modal;
    Ji(O && (se || (k && F !== `trigger-hover`)), A === `touch`, N, j);
    let ce = Ki(e, oe, {
        styles: ae.positionerStyles,
        transitionStatus: M,
        props: b,
        refs: [t, x.useStateSetter(`positionerElement`)],
        hidden: !D,
        inert: !O,
      }),
      le =
        D &&
        w.type !== `menu` &&
        ((w.type !== `menubar` && k && F !== `trigger-hover`) ||
          (w.type === `menubar` && w.context.modal)),
      K = null;
    return (
      w.type === `menubar`
        ? (K = w.context.contentElement)
        : w.type === void 0 && (K = j),
      (0, $.jsxs)(si.Provider, {
        value: ae,
        children: [
          le &&
            (0, $.jsx)(mt, {
              ref:
                w.type === `context-menu` || w.type === `nested-context-menu`
                  ? w.context.internalBackdropRef
                  : null,
              inert: de(!O),
              cutout: K,
            }),
          (0, $.jsx)(_t, {
            id: I,
            children: (0, $.jsx)(Hi, {
              elementsRef: x.context.itemDomElements,
              labelsRef: x.context.itemLabels,
              children: ce,
            }),
          }),
        ],
      })
    );
  }),
  Xi = Z.createContext(null);
function Zi(t) {
  let n = Z.useContext(Xi);
  if (n === null && !t) throw Error(e(5));
  return n;
}
var Qi = {
    ...at,
    disabled: V(
      (e) =>
        (e.parent.type === `menubar` && e.parent.context.disabled) ||
        e.disabled,
    ),
    modal: V(
      (e) =>
        (e.parent.type === void 0 || e.parent.type === `context-menu`) &&
        (e.modal ?? !0),
    ),
    openMethod: V((e) => e.openMethod),
    allowMouseEnter: V((e) => e.allowMouseEnter),
    stickIfOpen: V((e) => e.stickIfOpen),
    parent: V((e) => e.parent),
    rootId: V((e) =>
      e.parent.type === `menu`
        ? e.parent.store.select(`rootId`)
        : e.parent.type === void 0
          ? e.rootId
          : e.parent.context.rootId,
    ),
    activeIndex: V((e) => e.activeIndex),
    isActive: V((e, t) => e.activeIndex === t),
    hoverEnabled: V((e) => e.hoverEnabled),
    instantType: V((e) => e.instantType),
    lastOpenChangeReason: V((e) => e.openChangeReason),
    floatingTreeRoot: V((e) =>
      e.parent.type === `menu`
        ? e.parent.store.select(`floatingTreeRoot`)
        : e.floatingTreeRoot,
    ),
    floatingNodeId: V((e) => e.floatingNodeId),
    floatingParentNodeId: V((e) => e.floatingParentNodeId),
    itemProps: V((e) => e.itemProps),
    closeDelay: V((e) => e.closeDelay),
    hasViewport: V((e) => e.hasViewport),
    keyboardEventRelay: V((e) => {
      if (e.keyboardEventRelay) return e.keyboardEventRelay;
      if (e.parent.type === `menu`)
        return e.parent.store.select(`keyboardEventRelay`);
    }),
  },
  $i = class e extends Xt {
    constructor(e) {
      (super(
        { ...ea(), ...e },
        {
          positionerRef: Z.createRef(),
          popupRef: Z.createRef(),
          typingRef: { current: !1 },
          itemDomElements: { current: [] },
          itemLabels: { current: [] },
          allowMouseUpTriggerRef: { current: !1 },
          triggerFocusTargetRef: Z.createRef(),
          beforeContentFocusGuardRef: Z.createRef(),
          onOpenChangeComplete: void 0,
          triggerElements: new Ot(),
        },
        Qi,
      ),
        (this.unsubscribeParentListener = this.observe(`parent`, (e) => {
          if ((this.unsubscribeParentListener?.(), e.type === `menu`)) {
            let t = e.store.select(`rootId`),
              n = e.store.select(`floatingTreeRoot`),
              r = e.store.select(`keyboardEventRelay`);
            ((this.unsubscribeParentListener = e.store.subscribe(() => {
              let i = e.store.select(`rootId`),
                a = e.store.select(`floatingTreeRoot`),
                o = e.store.select(`keyboardEventRelay`);
              (t === i && n === a && r === o) ||
                ((t = i), (n = a), (r = o), this.notifyAll());
            })),
              (this.context.allowMouseUpTriggerRef =
                e.store.context.allowMouseUpTriggerRef));
            return;
          }
          (e.type !== void 0 &&
            (this.context.allowMouseUpTriggerRef =
              e.context.allowMouseUpTriggerRef),
            (this.unsubscribeParentListener = null));
        })));
    }
    setOpen(e, t) {
      this.state.floatingRootContext.context.events.emit(`setOpen`, {
        open: e,
        eventDetails: t,
      });
    }
    static useStore(t, n) {
      let r = _(() => new e(n)).current;
      return t ?? r;
    }
    unsubscribeParentListener = null;
  };
function ea() {
  return {
    ...et(),
    disabled: !1,
    modal: !0,
    openMethod: null,
    allowMouseEnter: !1,
    stickIfOpen: !0,
    parent: { type: void 0 },
    rootId: void 0,
    activeIndex: null,
    hoverEnabled: !0,
    instantType: void 0,
    openChangeReason: null,
    floatingTreeRoot: new ve(),
    floatingNodeId: void 0,
    floatingParentNodeId: null,
    itemProps: u,
    keyboardEventRelay: void 0,
    closeDelay: 0,
    hasViewport: !1,
  };
}
var ta = Z.createContext(void 0);
function na() {
  return Z.useContext(ta);
}
var ra = qt(function (e) {
  let {
      children: t,
      open: n,
      onOpenChange: r,
      onOpenChangeComplete: i,
      defaultOpen: l = !1,
      disabled: d = !1,
      modal: f,
      loopFocus: p = !0,
      orientation: m = `vertical`,
      actionsRef: h,
      closeParentOnEsc: g = !1,
      handle: _,
      triggerId: v,
      defaultTriggerId: y = null,
      highlightItemOnHover: b = !0,
    } = e,
    x = fi(!0),
    C = ui(!0),
    w = Zi(!0),
    T = na(),
    E = Z.useMemo(
      () =>
        T && C
          ? { type: `menu`, store: C.store }
          : w
            ? { type: `menubar`, context: w }
            : x && !C
              ? { type: `context-menu`, context: x }
              : { type: void 0 },
      [x, C, w, T],
    ),
    D = $i.useStore(_?.store, {
      open: l,
      openProp: n,
      activeTriggerId: y,
      triggerIdProp: v,
      parent: E,
    });
  (xe(() => {
    n === void 0 &&
      D.state.open === !1 &&
      l === !0 &&
      D.update({ open: !0, activeTriggerId: y });
  }),
    D.useControlledProp(`openProp`, n),
    D.useControlledProp(`triggerIdProp`, v),
    D.useContextCallback(`onOpenChangeComplete`, i));
  let O = tn(),
    k = tn(),
    A = D.useState(`floatingTreeRoot`),
    j = ht(A),
    N = fe(),
    P = D.useState(`open`),
    ee = D.useState(`activeTriggerElement`),
    F = D.useState(`positionerElement`),
    I = D.useState(`hoverEnabled`),
    L = D.useState(`disabled`),
    R = D.useState(`lastOpenChangeReason`),
    z = D.useState(`parent`),
    B = D.useState(`activeIndex`),
    V = D.useState(`payload`),
    ne = D.useState(`floatingParentNodeId`),
    H = Z.useRef(null),
    re = Z.useRef(z.type !== `context-menu`),
    U = s(),
    ie = Z.useRef(!0),
    W = s(),
    G = ne != null,
    { openMethod: oe, triggerProps: se } = Zr(P);
  (D.useSyncedValues({
    disabled: d,
    modal: z.type === void 0 ? f : void 0,
    openMethod: oe,
    rootId: O,
  }),
    ut(D));
  let { forceUnmount: ce } = ct(P, D, () => {
    D.update({ allowMouseEnter: !1, stickIfOpen: !0 });
  });
  (o(() => {
    x && !C
      ? D.update({
          parent: { type: `context-menu`, context: x },
          floatingNodeId: j,
          floatingParentNodeId: N,
        })
      : C && D.update({ floatingNodeId: j, floatingParentNodeId: N });
  }, [x, C, j, N, D]),
    Z.useEffect(() => {
      if ((P || (H.current = null), z.type === `context-menu`)) {
        if (!P) {
          (U.clear(), (re.current = !1));
          return;
        }
        U.start(500, () => {
          re.current = !0;
        });
      }
    }, [U, P, z.type]),
    o(() => {
      !P && !I && D.set(`hoverEnabled`, !0);
    }, [P, I, D]));
  let le = S((e, t) => {
      let n = t.reason;
      if (
        (P === e && t.trigger === ee && R === n) ||
        ((t.preventUnmountOnClose = () => {
          D.set(`preventUnmountingOnClose`, !0);
        }),
        !e && t.trigger == null && (t.trigger = ee ?? void 0),
        r?.(e, t),
        t.isCanceled)
      )
        return;
      D.state.floatingRootContext.dispatchOpenChange(e, t);
      let i = t.event;
      if (
        e === !1 &&
        i?.type === `click` &&
        i.pointerType === `touch` &&
        !ie.current
      )
        return;
      if (!e && B !== null) {
        let e = D.context.itemDomElements.current[B];
        queueMicrotask(() => {
          e?.setAttribute(`tabindex`, `-1`);
        });
      }
      e && n === `trigger-focus`
        ? ((ie.current = !1),
          W.start(300, () => {
            ie.current = !0;
          }))
        : ((ie.current = !0), W.clear());
      let a =
          (n === `trigger-press` || n === `item-press`) &&
          i.detail === 0 &&
          i?.isTrusted,
        o = !e && (n === `escape-key` || n == null),
        s = { open: e, openChangeReason: n };
      H.current = t.event ?? null;
      let c = t.trigger?.id ?? null;
      ((c || e) &&
        ((s.activeTriggerId = c), (s.activeTriggerElement = t.trigger ?? null)),
        D.update(s),
        z.type === `menubar` &&
        (n === `trigger-focus` ||
          n === `focus-out` ||
          n === `trigger-hover` ||
          n === `list-navigation` ||
          n === `sibling-open`)
          ? D.set(`instantType`, `group`)
          : a || o
            ? D.set(`instantType`, a ? `click` : `dismiss`)
            : D.set(`instantType`, void 0));
    }),
    K = Qt({
      popupStore: D,
      floatingId: k,
      nested: N != null,
      onOpenChange: le,
    }),
    ue = K.context.events;
  Z.useEffect(() => {
    let e = ({ open: e, eventDetails: t }) => le(e, t);
    return (
      ue.on(`setOpen`, e),
      () => {
        ue?.off(`setOpen`, e);
      }
    );
  }, [ue, le]);
  let de = Z.useCallback(() => {
    D.setOpen(!1, J(ae));
  }, [D]);
  Z.useImperativeHandle(h, () => ({ unmount: ce, close: de }), [ce, de]);
  let q;
  (z.type === `context-menu` && (q = z.context),
    Z.useImperativeHandle(q?.positionerRef, () => F, [F]),
    Z.useImperativeHandle(q?.actionsRef, () => ({ setOpen: le }), [le]));
  let pe = te(K, {
      enabled: !L,
      bubbles: { escapeKey: g && z.type === `menu` },
      outsidePress() {
        return z.type !== `context-menu` || H.current?.type === `contextmenu`
          ? !0
          : re.current;
      },
      externalTree: G ? A : void 0,
    }),
    me = en(),
    he = Z.useCallback(
      (e) => {
        D.select(`activeIndex`) !== e && D.set(`activeIndex`, e);
      },
      [D],
    ),
    ge = zr(K, {
      enabled: !L,
      listRef: D.context.itemDomElements,
      activeIndex: B,
      nested: z.type !== void 0,
      loopFocus: p,
      orientation: m,
      parentOrientation: z.type === `menubar` ? z.context.orientation : void 0,
      rtl: me === `rtl`,
      disabledIndices: c,
      onNavigate: he,
      openOnArrowKeyDown: z.type !== `context-menu`,
      externalTree: G ? A : void 0,
      focusItemOnHover: b,
    }),
    _e = Z.useCallback(
      (e) => {
        D.context.typingRef.current = e;
      },
      [D],
    ),
    ve = Br(K, {
      listRef: D.context.itemLabels,
      elementsRef: D.context.itemDomElements,
      activeIndex: B,
      resetMs: 500,
      onMatch: (e) => {
        P && e !== B && D.set(`activeIndex`, e);
      },
      onTyping: _e,
    });
  He(D, {
    floatingRootContext: K,
    activeTriggerProps: Z.useMemo(() => {
      let e = a(
        ve.reference,
        ge.reference,
        pe.reference,
        {
          onMouseMove() {
            D.set(`allowMouseEnter`, !0);
          },
        },
        se,
      );
      return ((e[`aria-haspopup`] = `menu`), (e[`aria-expanded`] = P), e);
    }, [D, ve.reference, ge.reference, pe.reference, se, P]),
    inactiveTriggerProps: Z.useMemo(() => {
      let e = a(ge.trigger, pe.trigger, se);
      return ((e[`aria-haspopup`] = `menu`), (e[`aria-expanded`] = !1), e);
    }, [ge.trigger, pe.trigger, se]),
    popupProps: Z.useMemo(
      () =>
        a(
          xt,
          {
            id: k,
            role: `menu`,
            "aria-labelledby": ee?.id,
            onMouseMove() {
              (D.set(`allowMouseEnter`, !0),
                z.type === `menu` && D.set(`hoverEnabled`, !1));
            },
            onClick() {
              D.select(`hoverEnabled`) && D.set(`hoverEnabled`, !1);
            },
            onKeyDown(e) {
              let t = D.select(`keyboardEventRelay`);
              t && !e.isPropagationStopped() && t(e);
            },
          },
          ve.floating,
          ge.floating,
          pe.floating,
        ),
      [ee, k, z.type, D, ve.floating, ge.floating, pe.floating],
    ),
    itemProps: ge.item ?? u,
  });
  let ye = Z.useMemo(() => ({ store: D, parent: E }), [D, E]),
    be = (0, $.jsx)(li.Provider, {
      value: ye,
      children: typeof t == `function` ? t({ payload: V }) : t,
    });
  return z.type === void 0 || z.type === `context-menu`
    ? (0, $.jsx)(M, { externalTree: A, children: be })
    : be;
});
function ia(e) {
  let t = e.getBoundingClientRect(),
    n = gt(e),
    r = n.getComputedStyle(e, `::before`),
    i = n.getComputedStyle(e, `::after`);
  if (!(r.content !== `none` || i.content !== `none`)) return t;
  let a = parseFloat(r.width) || 0,
    o = parseFloat(r.height) || 0,
    s = parseFloat(i.width) || 0,
    c = parseFloat(i.height) || 0,
    l = Math.max(t.width, a, s),
    u = Math.max(t.height, o, c),
    d = l - t.width,
    f = u - t.height;
  return {
    left: t.left - d / 2,
    right: t.right + d / 2,
    top: t.top - f / 2,
    bottom: t.bottom + f / 2,
  };
}
function aa(e = {}) {
  let {
      highlightItemOnHover: t,
      highlightedIndex: n,
      onHighlightedIndexChange: r,
    } = Bt(),
    { ref: i, index: a } = yi(e),
    o = n === a,
    s = Z.useRef(null),
    c = d(i, s);
  return {
    compositeProps: Z.useMemo(
      () => ({
        tabIndex: o ? 0 : -1,
        onFocus() {
          r(a);
        },
        onMouseMove() {
          let e = s.current;
          if (!t || !e) return;
          let n = e.hasAttribute(`disabled`) || e.ariaDisabled === `true`;
          !o && !n && e.focus();
        },
      }),
      [o, r, a, t],
    ),
    compositeRef: c,
    index: a,
  };
}
function oa(e) {
  let {
      render: t,
      className: n,
      style: r,
      state: i = u,
      props: a = c,
      refs: o = c,
      metadata: s,
      stateAttributesMapping: l,
      tag: d = `div`,
      ...p
    } = e,
    { compositeProps: m, compositeRef: h } = aa({ metadata: s });
  return f(d, e, {
    state: i,
    ref: [...o, h],
    props: [m, ...a, p],
    stateAttributesMapping: l,
  });
}
function sa(e) {
  if (q(e) && e.hasAttribute(`data-rootownerid`))
    return e.getAttribute(`data-rootownerid`) ?? void 0;
  if (!pe(e)) return sa(he(e));
}
function ca(e, t) {
  let n = Z.useRef(null);
  function r(t) {
    (an.flushSync(() => {
      e.setOpen(!1, J(ne, t.nativeEvent, t.currentTarget));
    }),
      ie(n.current)?.focus());
  }
  function i(n) {
    let r = e.select(`positionerElement`);
    if (r && le(n, r)) e.context.beforeContentFocusGuardRef.current?.focus();
    else {
      an.flushSync(() => {
        e.setOpen(!1, J(ne, n.nativeEvent, n.currentTarget));
      });
      let i = Me(e.context.triggerFocusTargetRef.current || t.current);
      for (; i !== null && X(r, i); ) {
        let e = i;
        if (((i = Oe(i)), i === e)) break;
      }
      i?.focus();
    }
  }
  return {
    preFocusGuardRef: n,
    handlePreFocusGuardFocus: r,
    handleFocusTargetFocus: i,
  };
}
function la(e) {
  let { enabled: t = !0, mouseDownAction: n, open: r } = e,
    i = Z.useRef(!1);
  return Z.useMemo(
    () =>
      t
        ? {
            onMouseDown: (e) => {
              ((n === `open` && !r) || (n === `close` && r)) &&
                ((i.current = !0),
                Dt(e.currentTarget).addEventListener(
                  `click`,
                  () => {
                    i.current = !1;
                  },
                  { once: !0 },
                ));
            },
            onClick: (e) => {
              i.current && ((i.current = !1), e.preventBaseUIHandler());
            },
          }
        : u,
    [t, n, r],
  );
}
var ua = 2,
  da = De(function (t, n) {
    let {
        render: r,
        className: i,
        style: o,
        disabled: c = !1,
        nativeButton: l = !0,
        id: d,
        openOnHover: p,
        delay: m = 100,
        closeDelay: h = 0,
        handle: g,
        payload: _,
        ...v
      } = t,
      y = ui(!0),
      b = g?.store ?? y?.store;
    if (!b) throw Error(e(85));
    let x = Le(d),
      C = b.useState(`isTriggerActive`, x),
      w = b.useState(`floatingRootContext`),
      T = b.useState(`isOpenedByTrigger`, x),
      E = b.useState(`triggerPopupId`, x),
      O = Z.useRef(null),
      k = pa(),
      j = Bt(!0),
      M = me(),
      N = Z.useMemo(() => M ?? new ve(), [M]),
      { registerTrigger: P, isMountedByThisTrigger: F } = Gt(x, O, b, {
        payload: _,
        closeDelay: h,
        parent: k,
        floatingTreeRoot: N,
        floatingNodeId: ht(N),
        floatingParentNodeId: fe(),
        keyboardEventRelay: j?.relayKeyboardEvent,
      }),
      I = k.type === `menubar`,
      L = b.useState(`disabled`),
      R = c || L || (I && k.context.disabled),
      { getButtonProps: te, buttonRef: z } = D({ disabled: R, native: l });
    Z.useEffect(() => {
      !T &&
        k.type === void 0 &&
        (b.context.allowMouseUpTriggerRef.current = !1);
    }, [b, T, k.type]);
    let B = Z.useRef(null),
      V = s(),
      ne = S((e) => {
        if (!B.current) return;
        (V.clear(), (b.context.allowMouseUpTriggerRef.current = !1));
        let t = e.target;
        if (
          X(B.current, t) ||
          X(b.select(`positionerElement`), t) ||
          t === B.current ||
          (t != null && sa(t) === b.select(`rootId`))
        )
          return;
        let n = ia(B.current);
        (e.clientX >= n.left - ua &&
          e.clientX <= n.right + ua &&
          e.clientY >= n.top - ua &&
          e.clientY <= n.bottom + ua) ||
          N.events.emit(`close`, { domEvent: e, reason: A });
      });
    Z.useEffect(() => {
      T &&
        b.select(`lastOpenChangeReason`) === `trigger-hover` &&
        Dt(B.current).addEventListener(`mouseup`, ne, { once: !0 });
    }, [T, ne, b]);
    let H = I && k.context.hasSubmenuOpen,
      re = Mr(w, {
        enabled:
          (p ?? H) && !R && k.type !== `context-menu` && (!I || (H && !F)),
        handleClose: qr({ blockPointerEvents: !I }),
        mouseOnly: !0,
        move: !1,
        restMs: k.type === void 0 ? m : void 0,
        delay: { close: h },
        triggerElementRef: O,
        externalTree: N,
        isActiveTrigger: C,
        isClosing: () => b.select(`transitionStatus`) === `ending`,
      }),
      U = fa(T, b.select(`lastOpenChangeReason`)),
      ie = dn(w, {
        enabled: !R && k.type !== `context-menu`,
        event: T && I ? `click` : `mousedown`,
        toggle: !0,
        ignoreMouse: !1,
        stickIfOpen: k.type === void 0 ? U : !1,
      }),
      W = wr(w, { enabled: !R && H }),
      ae = la({ open: T, enabled: I, mouseDownAction: `open` }),
      G = Z.useMemo(
        () => a(W.reference, ie.reference),
        [W.reference, ie.reference],
      ),
      oe = b.useState(`triggerProps`, F),
      {
        preFocusGuardRef: se,
        handlePreFocusGuardFocus: ce,
        handleFocusTargetFocus: le,
      } = ca(b, O),
      K = { disabled: R, open: T },
      ue = [B, n, z, P, O],
      de = [
        G,
        re ?? u,
        oe,
        {
          "aria-haspopup": `menu`,
          "aria-controls": E,
          id: x,
          onMouseDown: (e) => {
            b.select(`open`) ||
              (V.start(200, () => {
                b.context.allowMouseUpTriggerRef.current = !0;
              }),
              Dt(e.currentTarget).addEventListener(`mouseup`, ne, {
                once: !0,
              }));
          },
        },
        I ? { role: `menuitem` } : {},
        ae,
        v,
        te,
      ],
      q = f(`button`, t, {
        enabled: !I,
        stateAttributesMapping: Ge,
        state: K,
        ref: ue,
        props: de,
      });
    return I
      ? (0, $.jsx)(oa, {
          tag: `button`,
          render: r,
          className: i,
          style: o,
          state: K,
          refs: ue,
          props: de,
          stateAttributesMapping: Ge,
        })
      : T
        ? (0, $.jsxs)(Z.Fragment, {
            children: [
              (0, $.jsx)(ee, { ref: se, onFocus: ce }, `${x}-pre-focus-guard`),
              (0, $.jsx)(Z.Fragment, { children: q }, x),
              (0, $.jsx)(
                ee,
                { ref: b.context.triggerFocusTargetRef, onFocus: le },
                `${x}-post-focus-guard`,
              ),
            ],
          })
        : (0, $.jsx)(Z.Fragment, { children: q }, x);
  });
function fa(e, t) {
  let n = s(),
    [r, i] = Z.useState(!1);
  return (
    o(() => {
      e && t === `trigger-hover`
        ? (i(!0),
          n.start(500, () => {
            i(!1);
          }))
        : e || (n.clear(), i(!1));
    }, [e, t, n]),
    r
  );
}
function pa() {
  let e = fi(!0),
    t = ui(!0),
    n = Zi(!0);
  return Z.useMemo(
    () =>
      n
        ? { type: `menubar`, context: n }
        : e && !t
          ? { type: `context-menu`, context: e }
          : { type: void 0 },
    [e, t, n],
  );
}
function ma({ ...e }) {
  return (0, $.jsx)(ra, { "data-slot": `dropdown-menu`, ...e });
}
function ha({ ...e }) {
  return (0, $.jsx)(da, { "data-slot": `dropdown-menu-trigger`, ...e });
}
function ga({
  align: e = `start`,
  alignOffset: t = 0,
  side: n = `bottom`,
  sideOffset: r = 4,
  className: i,
  ...a
}) {
  return (0, $.jsx)(Mi, {
    children: (0, $.jsx)(Yi, {
      className: `isolate z-50 outline-none`,
      align: e,
      alignOffset: t,
      side: n,
      sideOffset: r,
      children: (0, $.jsx)(ki, {
        "data-slot": `dropdown-menu-content`,
        className: b(
          `data-open:animate-in data-closed:animate-out data-closed:fade-out-0 data-open:fade-in-0 data-closed:zoom-out-95 data-open:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 ring-foreground/10 bg-popover text-popover-foreground min-w-32 rounded-lg p-1 shadow-md ring-1 duration-100 data-[side=inline-start]:slide-in-from-end-2 data-[side=inline-end]:slide-in-from-start-2 z-50 max-h-(--available-height) w-(--anchor-width) origin-(--transform-origin) overflow-x-hidden overflow-y-auto outline-none data-closed:overflow-hidden`,
          i,
        ),
        ...a,
      }),
    }),
  });
}
function _a({ ...e }) {
  return (0, $.jsx)(Si, { "data-slot": `dropdown-menu-group`, ...e });
}
function va({ className: e, inset: t, ...n }) {
  return (0, $.jsx)(Ci, {
    "data-slot": `dropdown-menu-label`,
    "data-inset": t,
    className: b(
      `text-muted-foreground px-1.5 py-1 text-xs font-medium data-[inset]:ps-8`,
      e,
    ),
    ...n,
  });
}
function ya({ className: e, inset: t, variant: n = `default`, ...r }) {
  return (0, $.jsx)(wi, {
    "data-slot": `dropdown-menu-item`,
    "data-inset": t,
    "data-variant": n,
    className: b(
      `focus:bg-accent focus:text-accent-foreground data-[variant=destructive]:text-destructive data-[variant=destructive]:focus:bg-destructive/10 dark:data-[variant=destructive]:focus:bg-destructive/20 data-[variant=destructive]:focus:text-destructive data-[variant=destructive]:*:[svg]:text-destructive not-data-[variant=destructive]:focus:**:text-accent-foreground gap-1.5 rounded-md px-1.5 py-1 text-sm [&_svg:not([class*='size-'])]:size-4 group/dropdown-menu-item relative flex cursor-default items-center outline-hidden select-none data-disabled:pointer-events-none data-disabled:opacity-50 data-[inset]:ps-8 [&_svg]:pointer-events-none [&_svg]:shrink-0`,
      e,
    ),
    ...r,
  });
}
function ba({ className: e, ...t }) {
  return (0, $.jsx)(Te, {
    "data-slot": `dropdown-menu-separator`,
    className: b(`bg-border -mx-1 my-1 h-px`, e),
    ...t,
  });
}
var xa = (e) =>
    ![`false`, `0`, `off`, `no`].includes((e ?? ``).trim().toLowerCase()),
  Sa = {
    oauthApps: xa(void 0),
    apiKeys: xa(void 0),
    members: xa(void 0),
    connectedAccounts: xa(void 0),
    deviceSessions: xa(void 0),
    profileEditing: xa(void 0),
    themeSwitcher: xa(void 0),
    languageSwitcher: xa(void 0),
  },
  Ca = [
    { value: `light`, label: `Light`, icon: ai },
    { value: `dark`, label: `Dark`, icon: ri },
    { value: `system`, label: `System`, icon: ni },
  ];
function wa() {
  let { t: e } = T(),
    { scheme: t, resolved: n, setScheme: r } = jt(),
    i = n === `dark` ? ri : ai;
  return (0, $.jsxs)(ma, {
    children: [
      (0, $.jsx)(ha, {
        render: (0, $.jsx)(I, {
          variant: `ghost`,
          size: `icon-sm`,
          "aria-label": e(`Change theme`),
        }),
        children: (0, $.jsx)(i, {}),
      }),
      (0, $.jsx)(ga, {
        align: `end`,
        className: `w-36`,
        children: Ca.map((n) =>
          (0, $.jsxs)(
            ya,
            {
              onClick: () => r(n.value),
              children: [
                (0, $.jsx)(n.icon, {}),
                e(n.label),
                t === n.value && (0, $.jsx)(Qr, { className: `ms-auto` }),
              ],
            },
            n.value,
          ),
        ),
      }),
    ],
  });
}
function Ta() {
  let { t: e } = T(),
    { language: t, changeLanguage: n } = St();
  return (0, $.jsxs)(ma, {
    children: [
      (0, $.jsx)(ha, {
        render: (0, $.jsx)(I, {
          variant: `ghost`,
          size: `icon-sm`,
          "aria-label": e(`Change language`),
        }),
        children: (0, $.jsx)(ti, {}),
      }),
      (0, $.jsx)(ga, {
        align: `end`,
        className: `w-36`,
        children: Lt.map((e) =>
          (0, $.jsxs)(
            ya,
            {
              onClick: () => n(e.code),
              children: [
                e.label,
                t.startsWith(e.code) &&
                  (0, $.jsx)(Qr, { className: `ms-auto` }),
              ],
            },
            e.code,
          ),
        ),
      }),
    ],
  });
}
function Ea() {
  return !Sa.languageSwitcher && !Sa.themeSwitcher
    ? null
    : (0, $.jsxs)(`div`, {
        className: `flex items-center gap-0.5`,
        children: [
          Sa.languageSwitcher && (0, $.jsx)(Ta, {}),
          Sa.themeSwitcher && (0, $.jsx)(wa, {}),
        ],
      });
}
function Da() {
  let { data: e, error: t, isLoading: n } = x(`auth-capabilities`, y),
    r = Z.useCallback((t) => !!e?.includes(t), [e]);
  return { isLoading: n, error: t ?? null, capabilities: e ?? null, has: r };
}
function Oa({
  title: e,
  heading: t,
  description: n,
  media: r,
  footer: i,
  children: a,
}) {
  let { t: o } = T(),
    { app: s, isLoading: c, error: l, appName: u } = C(),
    { isLoading: d } = Da(),
    f = c || d;
  return (0, $.jsxs)(`div`, {
    className: `grid min-h-svh w-full lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]`,
    children: [
      (0, $.jsx)(`title`, { children: f ? o(`Loading…`) : `${e} · ${u}` }),
      (0, $.jsxs)(`div`, {
        className: `relative isolate flex min-h-svh flex-col px-5 py-5 sm:px-10`,
        children: [
          (0, $.jsx)(`div`, {
            "aria-hidden": !0,
            className: `pointer-events-none absolute inset-x-0 top-0 -z-1 h-80 bg-[radial-gradient(60%_100%_at_50%_0%,color-mix(in_oklch,var(--primary)_16%,transparent),transparent)] lg:hidden`,
          }),
          (0, $.jsxs)(`header`, {
            className: `flex items-center justify-between gap-3`,
            children: [
              s?.homepageURL
                ? (0, $.jsx)(`a`, {
                    href: s.homepageURL,
                    className: `rounded-lg`,
                    children: (0, $.jsx)(rn, { showName: !0 }),
                  })
                : (0, $.jsx)(rn, { showName: !0 }),
              (0, $.jsx)(Ea, {}),
            ],
          }),
          (0, $.jsx)(`main`, {
            className: `flex flex-1 items-center justify-center py-10`,
            children: (0, $.jsx)(`div`, {
              className: `w-full max-w-[380px] animate-in fade-in slide-in-from-bottom-2 duration-500`,
              children: l
                ? (0, $.jsx)(Pa, { error: l })
                : f
                  ? (0, $.jsx)(Fa, {})
                  : (0, $.jsxs)($.Fragment, {
                      children: [
                        r &&
                          (0, $.jsx)(`div`, { className: `mb-6`, children: r }),
                        (t || n) &&
                          (0, $.jsxs)(`div`, {
                            className: `mb-7 flex flex-col gap-1.5`,
                            children: [
                              t &&
                                (0, $.jsx)(`h1`, {
                                  className: `text-2xl font-semibold`,
                                  children: t,
                                }),
                              n &&
                                (0, $.jsx)(`p`, {
                                  className: `text-sm text-pretty text-muted-foreground`,
                                  children: n,
                                }),
                            ],
                          }),
                        a,
                        i &&
                          (0, $.jsx)(`div`, {
                            className: `mt-6 text-center text-sm text-muted-foreground`,
                            children: i,
                          }),
                      ],
                    }),
            }),
          }),
          (0, $.jsxs)(`footer`, {
            className: `flex flex-wrap items-center justify-between gap-x-4 gap-y-2 text-xs text-muted-foreground`,
            children: [(0, $.jsx)(ka, {}), (0, $.jsx)(oi, {})],
          }),
        ],
      }),
      (0, $.jsx)(`aside`, {
        className: `hidden p-3 lg:block`,
        children: (0, $.jsx)(Aa, {}),
      }),
    ],
  });
}
function ka({ className: e }) {
  let { t } = T(),
    { app: n, appName: r } = C(),
    i = new Date().getFullYear();
  return (0, $.jsxs)(`nav`, {
    className: b(`flex flex-wrap items-center gap-x-4 gap-y-1`, e),
    children: [
      (0, $.jsxs)(`span`, { children: [`© `, i, ` `, r] }),
      n?.termsURL &&
        (0, $.jsx)(`a`, {
          className: `hover:text-foreground`,
          href: n.termsURL,
          children: t(`Terms`),
        }),
      n?.privacyURL &&
        (0, $.jsx)(`a`, {
          className: `hover:text-foreground`,
          href: n.privacyURL,
          children: t(`Privacy`),
        }),
    ],
  });
}
function Aa() {
  let { t: e } = T(),
    { app: t, appName: n, isLoading: r } = C(),
    { has: i, isLoading: a } = Da(),
    o = n,
    s = ja(t?.heroImage);
  if (r || a || s === `loading`) return (0, $.jsx)(Ma, {});
  let c = s === `loaded` ? t?.heroImage : void 0,
    l = !!t?.theme?.[`--primary`],
    u = [
      i(`passkey`) && { icon: $r, label: e(`Passkeys`) },
      i(`2fa`) && { icon: ii, label: e(`2-step verification`) },
      { icon: ei, label: e(`Single sign-on`) },
    ].filter(Boolean);
  return (0, $.jsxs)(`div`, {
    className: b(
      `relative isolate flex h-full flex-col justify-between overflow-hidden rounded-[28px] p-10 animate-in fade-in duration-500`,
      l
        ? `bg-primary text-primary-foreground`
        : `bg-neutral-700 text-white dark:bg-neutral-800`,
      c && `text-white`,
    ),
    children: [
      c &&
        (0, $.jsxs)($.Fragment, {
          children: [
            (0, $.jsx)(`img`, {
              src: c,
              alt: ``,
              "aria-hidden": !0,
              className: `absolute inset-0 -z-2 size-full object-cover`,
            }),
            (0, $.jsx)(`div`, {
              "aria-hidden": !0,
              className: `absolute inset-0 -z-1 bg-linear-to-t from-black/75 via-black/25 to-black/35`,
            }),
          ],
        }),
      (0, $.jsx)(`div`, {
        "aria-hidden": !0,
        className: `absolute inset-0 -z-1 bg-[radial-gradient(80%_60%_at_100%_0%,color-mix(in_oklch,white_28%,transparent),transparent_60%),radial-gradient(70%_60%_at_0%_100%,color-mix(in_oklch,black_35%,transparent),transparent_70%)]`,
      }),
      (0, $.jsx)(`div`, {
        "aria-hidden": !0,
        className: `absolute inset-0 -z-1 bg-[radial-gradient(color-mix(in_oklch,white_22%,transparent)_1px,transparent_1px)] mask-[radial-gradient(70%_60%_at_70%_30%,black,transparent)] bg-size-[20px_20px]`,
      }),
      (0, $.jsx)(`div`, {
        "aria-hidden": !0,
        className: `absolute -end-24 top-1/3 -z-1 size-96 rounded-full border border-white/15`,
      }),
      (0, $.jsx)(`div`, {
        "aria-hidden": !0,
        className: `absolute -end-48 top-1/4 -z-1 size-[34rem] rounded-full border border-white/10`,
      }),
      (0, $.jsxs)(`span`, {
        className: `inline-flex w-fit items-center gap-2 rounded-full bg-white/12 px-3 py-1 text-xs font-medium ring-1 ring-white/20 backdrop-blur`,
        children: [
          (0, $.jsx)(ii, { className: `size-3.5` }),
          e(`Secure sign-in`),
        ],
      }),
      !c &&
        (0, $.jsx)(Na, {
          name: o,
          accentClass: l ? `text-primary` : `text-neutral-700`,
        }),
      (0, $.jsxs)(`div`, {
        className: `flex max-w-md flex-col gap-5`,
        children: [
          (0, $.jsx)(`h2`, {
            className: `text-4xl leading-[1.1] font-semibold text-balance`,
            children:
              t?.heroTitle ||
              e(`One account for everything {{name}}.`, { name: o }),
          }),
          t?.description &&
            (0, $.jsx)(`p`, {
              className: `text-base text-pretty opacity-80`,
              children: t.description,
            }),
          (0, $.jsx)(`ul`, {
            className: `flex flex-wrap gap-2`,
            children: u.map((e) =>
              (0, $.jsxs)(
                `li`,
                {
                  className: `inline-flex items-center gap-1.5 rounded-full bg-black/10 px-3 py-1.5 text-sm ring-1 ring-white/15`,
                  children: [
                    (0, $.jsx)(e.icon, { className: `size-4 opacity-90` }),
                    e.label,
                  ],
                },
                e.label,
              ),
            ),
          }),
        ],
      }),
    ],
  });
}
function ja(e) {
  let [t, n] = Z.useState();
  return (
    Z.useEffect(() => {
      if (!e) return;
      let t = !1,
        r = new Image();
      return (
        (r.onload = () => !t && n({ src: e, status: `loaded` })),
        (r.onerror = () => !t && n({ src: e, status: `error` })),
        (r.src = e),
        () => {
          t = !0;
        }
      );
    }, [e]),
    e ? (t?.src === e ? t.status : `loading`) : `none`
  );
}
function Ma() {
  let e = `rounded-md bg-foreground/7 dark:bg-foreground/6`;
  return (0, $.jsxs)(nn, {
    "aria-hidden": !0,
    className: `flex h-full flex-col justify-between rounded-[28px] p-10`,
    children: [
      (0, $.jsx)(`div`, { className: b(e, `h-7 w-32 rounded-full`) }),
      (0, $.jsx)(`div`, {
        className: b(e, `mx-auto h-28 w-full max-w-xs rounded-2xl`),
      }),
      (0, $.jsxs)(`div`, {
        className: `flex flex-col gap-4`,
        children: [
          (0, $.jsx)(`div`, { className: b(e, `h-10 w-3/4`) }),
          (0, $.jsx)(`div`, { className: b(e, `h-10 w-1/2`) }),
          (0, $.jsx)(`div`, { className: b(e, `mt-2 h-5 w-2/3`) }),
          (0, $.jsxs)(`div`, {
            className: `mt-1 flex gap-2`,
            children: [
              (0, $.jsx)(`div`, { className: b(e, `h-8 w-28 rounded-full`) }),
              (0, $.jsx)(`div`, { className: b(e, `h-8 w-36 rounded-full`) }),
              (0, $.jsx)(`div`, { className: b(e, `h-8 w-32 rounded-full`) }),
            ],
          }),
        ],
      }),
    ],
  });
}
function Na({ name: e, accentClass: t }) {
  let { t: n } = T();
  return (0, $.jsxs)(`div`, {
    "aria-hidden": !0,
    className: `mx-auto w-full max-w-xs rotate-[-4deg] rounded-2xl bg-white/14 p-4 shadow-2xl shadow-black/20 ring-1 ring-white/25 backdrop-blur-md transition-transform duration-700 hover:rotate-0`,
    children: [
      (0, $.jsxs)(`div`, {
        className: `flex items-center gap-3`,
        children: [
          (0, $.jsx)(`div`, {
            className: `flex size-10 items-center justify-center rounded-xl bg-white/20`,
            children: (0, $.jsx)($r, { className: `size-5` }),
          }),
          (0, $.jsxs)(`div`, {
            className: `flex flex-col`,
            children: [
              (0, $.jsx)(`span`, {
                className: `text-sm font-semibold`,
                children: n(`Verified`),
              }),
              (0, $.jsx)(`span`, {
                className: `text-xs opacity-75`,
                children: n(`Signed in to {{name}}`, { name: e }),
              }),
            ],
          }),
          (0, $.jsx)(`span`, {
            className: b(
              `ms-auto flex size-6 items-center justify-center rounded-full bg-white`,
              t,
            ),
            children: (0, $.jsx)(ii, { className: `size-3.5` }),
          }),
        ],
      }),
      (0, $.jsxs)(`div`, {
        className: `mt-4 flex flex-col gap-2`,
        children: [
          (0, $.jsx)(`span`, {
            className: `h-2 w-4/5 rounded-full bg-white/25`,
          }),
          (0, $.jsx)(`span`, {
            className: `h-2 w-3/5 rounded-full bg-white/15`,
          }),
        ],
      }),
    ],
  });
}
function Pa({ error: e }) {
  let { t } = T();
  return (0, $.jsxs)(`div`, {
    className: `flex flex-col items-center gap-4 rounded-2xl border bg-card p-8 text-center shadow-xs/5`,
    children: [
      (0, $.jsx)(`div`, {
        className: `flex size-11 items-center justify-center rounded-xl bg-destructive/10 text-destructive`,
        children: (0, $.jsx)(Ye, { className: `size-5` }),
      }),
      (0, $.jsxs)(`div`, {
        className: `flex flex-col gap-1`,
        children: [
          (0, $.jsx)(`h1`, {
            className: `font-semibold`,
            children: t(`We can't reach the server`),
          }),
          (0, $.jsx)(`p`, {
            className: `text-sm break-words text-muted-foreground`,
            children: e.message,
          }),
        ],
      }),
      (0, $.jsxs)(I, {
        variant: `outline`,
        onClick: () => window.location.reload(),
        children: [(0, $.jsx)(Pt, {}), t(`Try again`)],
      }),
    ],
  });
}
function Fa() {
  return (0, $.jsxs)(`div`, {
    className: `flex flex-col gap-6`,
    children: [
      (0, $.jsxs)(`div`, {
        className: `flex flex-col gap-2`,
        children: [
          (0, $.jsx)(nn, { className: `h-7 w-44` }),
          (0, $.jsx)(nn, { className: `h-4 w-64` }),
        ],
      }),
      (0, $.jsx)(nn, { className: `h-10 w-full` }),
      (0, $.jsx)(nn, { className: `h-10 w-full` }),
      (0, $.jsxs)(`div`, {
        className: `flex flex-col gap-2`,
        children: [
          (0, $.jsx)(nn, { className: `h-4 w-16` }),
          (0, $.jsx)(nn, { className: `h-10 w-full` }),
        ],
      }),
      (0, $.jsxs)(`div`, {
        className: `flex flex-col gap-2`,
        children: [
          (0, $.jsx)(nn, { className: `h-4 w-20` }),
          (0, $.jsx)(nn, { className: `h-10 w-full` }),
        ],
      }),
      (0, $.jsx)(nn, { className: `h-10 w-full` }),
    ],
  });
}
export {
  Br as A,
  oi as C,
  Qr as D,
  $r as E,
  xr as M,
  Qn as N,
  Zr as O,
  dn as P,
  yi as S,
  ei as T,
  Hi as _,
  Sa as a,
  Ei as b,
  _a as c,
  ba as d,
  ha as f,
  Ki as g,
  Ji as h,
  Ea as i,
  zr as j,
  Yr as k,
  ya as l,
  ia as m,
  ka as n,
  ma as o,
  oa as p,
  Da as r,
  ga as s,
  Oa as t,
  va as u,
  Bi as v,
  ii as w,
  vi as x,
  Di as y,
};

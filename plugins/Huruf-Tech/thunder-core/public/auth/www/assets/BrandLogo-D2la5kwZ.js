import {
  A as e,
  E as t,
  Et as n,
  G as r,
  H as i,
  K as a,
  O as o,
  R as s,
  S as c,
  T as l,
  c as u,
  j as d,
  n as f,
  t as p,
  wt as m,
} from "./useAppBranding-GcljM9XV.js";
var h = n(m()),
  g = h.createContext(void 0);
function _() {
  let t = h.useContext(g);
  if (t === void 0) throw Error(e(13));
  return t;
}
var v = { imageLoadingStatus: () => null },
  y = a(),
  b = h.forwardRef(function (e, t) {
    let { className: n, render: r, style: i, ...a } = e,
      [s, c] = h.useState(`idle`),
      l = { imageLoadingStatus: s },
      u = h.useMemo(
        () => ({ imageLoadingStatus: s, setImageLoadingStatus: c }),
        [s, c],
      ),
      d = o(`span`, e, {
        state: l,
        ref: t,
        props: a,
        stateAttributesMapping: v,
      });
    return (0, y.jsx)(g.Provider, { value: u, children: d });
  });
function x(e, { referrerPolicy: t, crossOrigin: n }) {
  let [i, a] = h.useState(`idle`);
  return (
    r(() => {
      if (!e) return (a(`error`), s);
      let r = !0,
        i = new window.Image(),
        o = (e) => () => {
          r && a(e);
        };
      return (
        a(`loading`),
        (i.onload = o(`loaded`)),
        (i.onerror = o(`error`)),
        t && (i.referrerPolicy = t),
        (i.crossOrigin = n ?? null),
        (i.src = e),
        i.complete && a(i.naturalWidth > 0 ? `loaded` : `error`),
        () => {
          r = !1;
        }
      );
    }, [e, n, t]),
    i
  );
}
var S = { ...v, ...l },
  C = h.forwardRef(function (e, n) {
    let {
        className: i,
        render: a,
        onLoadingStatusChange: s,
        referrerPolicy: l,
        crossOrigin: u,
        style: f,
        ...p
      } = e,
      m = _(),
      g = x(e.src, { referrerPolicy: l, crossOrigin: u }),
      v = g === `loaded`,
      { mounted: y, transitionStatus: b, setMounted: C } = t(v),
      w = h.useRef(null),
      T = d((e) => {
        (s?.(e), m.setImageLoadingStatus(e));
      });
    (r(() => {
      g !== `idle` && T(g);
    }, [g, T]),
      c({
        open: v,
        ref: w,
        onComplete() {
          v || C(!1);
        },
      }));
    let E = o(`img`, e, {
      state: { imageLoadingStatus: g, transitionStatus: b },
      ref: [n, w],
      props: p,
      stateAttributesMapping: S,
      enabled: y,
    });
    return y ? E : null;
  }),
  w = h.forwardRef(function (e, t) {
    let { className: n, render: r, delay: a, style: s, ...c } = e,
      { imageLoadingStatus: l } = _(),
      [u, d] = h.useState(a === void 0),
      f = i();
    return (
      h.useEffect(
        () => (a !== void 0 && f.start(a, () => d(!0)), f.clear),
        [f, a],
      ),
      o(`span`, e, {
        state: { imageLoadingStatus: l },
        ref: t,
        props: c,
        stateAttributesMapping: v,
        enabled: l !== `loaded` && u,
      })
    );
  });
function T({ className: e, ...t }) {
  return (0, y.jsx)(b, {
    className: u(
      `inline-flex size-8 shrink-0 select-none items-center justify-center overflow-hidden rounded-full bg-background align-middle font-medium text-xs`,
      e,
    ),
    "data-slot": `avatar`,
    ...t,
  });
}
function E({ className: e, ...t }) {
  return (0, y.jsx)(C, {
    className: u(`size-full object-cover`, e),
    "data-slot": `avatar-image`,
    ...t,
  });
}
function D({ className: e, ...t }) {
  return (0, y.jsx)(w, {
    className: u(
      `flex size-full items-center justify-center rounded-full bg-muted`,
      e,
    ),
    "data-slot": `avatar-fallback`,
    ...t,
  });
}
function O({ className: e, ...t }) {
  return (0, y.jsx)(`div`, {
    className: u(
      `animate-skeleton rounded-sm [--skeleton-highlight:--alpha(var(--color-white)/64%)] [background:linear-gradient(120deg,transparent_40%,var(--skeleton-highlight),transparent_60%)_var(--color-muted)_0_0/200%_100%_fixed] dark:[--skeleton-highlight:--alpha(var(--color-white)/4%)]`,
      e,
    ),
    "data-slot": `skeleton`,
    ...t,
  });
}
function k({ className: e, showName: t = !1 }) {
  let { isLoading: n, appName: r, logo: i } = f();
  return n
    ? (0, y.jsxs)(`div`, {
        className: `flex items-center gap-2.5`,
        children: [
          (0, y.jsx)(O, { className: u(`size-9 rounded-xl`, e) }),
          t && (0, y.jsx)(O, { className: `h-4 w-24` }),
        ],
      })
    : (0, y.jsxs)(`div`, {
        className: `flex min-w-0 items-center gap-2.5`,
        children: [
          (0, y.jsxs)(T, {
            className: u(`size-9 rounded-xl bg-transparent`, e),
            children: [
              (0, y.jsx)(E, { src: i, alt: r, className: `object-contain` }),
              (0, y.jsx)(D, {
                className: `rounded-[inherit] bg-transparent`,
                children: (0, y.jsx)(`img`, {
                  src: p,
                  alt: r,
                  className: `size-full object-contain`,
                }),
              }),
            ],
          }),
          t &&
            (0, y.jsx)(`span`, {
              className: `truncate text-[15px] font-semibold tracking-tight`,
              children: r,
            }),
        ],
      });
}
export { E as a, D as i, O as n, T as r, k as t };

const __vite__mapDeps = (
  i,
  m = __vite__mapDeps,
  d = m.f ||
    (m.f = [
      "assets/Account-DWiGnTHB.js",
      "assets/useAppBranding-GcljM9XV.js",
      "assets/BrandLogo-D2la5kwZ.js",
      "assets/OtpInput-Bje10j5L.js",
      "assets/AuthLayout-B7RMIG_n.js",
      "assets/auth-DO2_vqL6.js",
      "assets/arrow-left-DYUggq6L.js",
      "assets/UserAvatar-hG12eCzy.js",
      "assets/PasswordInput-DKq4dsX4.js",
      "assets/mail-D1PhSive.js",
      "assets/PasswordStrength-2dmuRzKw.js",
      "assets/index.esm-DYQrnkVj.js",
      "assets/SocialButtons-D3G1TVGi.js",
      "assets/navigation-Dd1cx1bO.js",
      "assets/Login-Dn3Y7zlN.js",
      "assets/mail-check-CpZB-loQ.js",
      "assets/useOnLogin-BBimfqRd.js",
      "assets/Signup-C-PGPlxr.js",
      "assets/ResetPassword-C4fDJ-Be.js",
      "assets/ChangePassword-Q1wA_Hbx.js",
      "assets/StatusMessage-CDiXpIRA.js",
      "assets/Consent-m37PImVd.js",
      "assets/Invite-BJuYPLI2.js",
      "assets/Logout-BbQryjBh.js",
      "assets/NotFound-Bt9r_v1O.js",
    ]),
) => i.map((i) => d[i]);
import {
  A as e,
  B as t,
  Ct as n,
  D as r,
  E as i,
  Et as a,
  F as o,
  G as s,
  H as c,
  K as l,
  L as u,
  M as d,
  N as f,
  O as p,
  P as m,
  R as h,
  S as g,
  St as _,
  T as v,
  Tt as y,
  V as b,
  W as x,
  a as S,
  bt as C,
  c as w,
  ct as T,
  dt as E,
  ft as ee,
  gt as D,
  ht as te,
  it as ne,
  j as O,
  k as re,
  lt as ie,
  mt as k,
  n as A,
  o as j,
  ot as ae,
  pt as oe,
  q as se,
  st as M,
  t as N,
  vt as ce,
  w as le,
  wt as ue,
  x as de,
  xt as fe,
  z as pe,
} from "./useAppBranding-GcljM9XV.js";
(function () {
  let e = document.createElement(`link`).relList;
  if (e && e.supports && e.supports(`modulepreload`)) return;
  for (let e of document.querySelectorAll(`link[rel="modulepreload"]`)) n(e);
  new MutationObserver((e) => {
    for (let t of e)
      if (t.type === `childList`)
        for (let e of t.addedNodes)
          e.tagName === `LINK` && e.rel === `modulepreload` && n(e);
  }).observe(document, { childList: !0, subtree: !0 });
  function t(e) {
    let t = {};
    return (
      e.integrity && (t.integrity = e.integrity),
      e.referrerPolicy && (t.referrerPolicy = e.referrerPolicy),
      e.crossOrigin === `use-credentials`
        ? (t.credentials = `include`)
        : e.crossOrigin === `anonymous`
          ? (t.credentials = `omit`)
          : (t.credentials = `same-origin`),
      t
    );
  }
  function n(e) {
    if (e.ep) return;
    e.ep = !0;
    let n = t(e);
    fetch(e.href, n);
  }
})();
var me = y((e) => {
    function t(e, t) {
      var n = e.length;
      e.push(t);
      a: for (; 0 < n; ) {
        var r = (n - 1) >>> 1,
          a = e[r];
        if (0 < i(a, t)) ((e[r] = t), (e[n] = a), (n = r));
        else break a;
      }
    }
    function n(e) {
      return e.length === 0 ? null : e[0];
    }
    function r(e) {
      if (e.length === 0) return null;
      var t = e[0],
        n = e.pop();
      if (n !== t) {
        e[0] = n;
        a: for (var r = 0, a = e.length, o = a >>> 1; r < o; ) {
          var s = 2 * (r + 1) - 1,
            c = e[s],
            l = s + 1,
            u = e[l];
          if (0 > i(c, n))
            l < a && 0 > i(u, c)
              ? ((e[r] = u), (e[l] = n), (r = l))
              : ((e[r] = c), (e[s] = n), (r = s));
          else if (l < a && 0 > i(u, n)) ((e[r] = u), (e[l] = n), (r = l));
          else break a;
        }
      }
      return t;
    }
    function i(e, t) {
      var n = e.sortIndex - t.sortIndex;
      return n === 0 ? e.id - t.id : n;
    }
    if (
      ((e.unstable_now = void 0),
      typeof performance == `object` && typeof performance.now == `function`)
    ) {
      var a = performance;
      e.unstable_now = function () {
        return a.now();
      };
    } else {
      var o = Date,
        s = o.now();
      e.unstable_now = function () {
        return o.now() - s;
      };
    }
    var c = [],
      l = [],
      u = 1,
      d = null,
      f = 3,
      p = !1,
      m = !1,
      h = !1,
      g = !1,
      _ = typeof setTimeout == `function` ? setTimeout : null,
      v = typeof clearTimeout == `function` ? clearTimeout : null,
      y = typeof setImmediate < `u` ? setImmediate : null;
    function b(e) {
      for (var i = n(l); i !== null; ) {
        if (i.callback === null) r(l);
        else if (i.startTime <= e)
          (r(l), (i.sortIndex = i.expirationTime), t(c, i));
        else break;
        i = n(l);
      }
    }
    function x(e) {
      if (((h = !1), b(e), !m))
        if (n(c) !== null) ((m = !0), S || ((S = !0), D()));
        else {
          var t = n(l);
          t !== null && O(x, t.startTime - e);
        }
    }
    var S = !1,
      C = -1,
      w = 5,
      T = -1;
    function E() {
      return g ? !0 : !(e.unstable_now() - T < w);
    }
    function ee() {
      if (((g = !1), S)) {
        var t = e.unstable_now();
        T = t;
        var i = !0;
        try {
          a: {
            ((m = !1), h && ((h = !1), v(C), (C = -1)), (p = !0));
            var a = f;
            try {
              b: {
                for (
                  b(t), d = n(c);
                  d !== null && !(d.expirationTime > t && E());
                ) {
                  var o = d.callback;
                  if (typeof o == `function`) {
                    ((d.callback = null), (f = d.priorityLevel));
                    var s = o(d.expirationTime <= t);
                    if (((t = e.unstable_now()), typeof s == `function`)) {
                      ((d.callback = s), b(t), (i = !0));
                      break b;
                    }
                    (d === n(c) && r(c), b(t));
                  } else r(c);
                  d = n(c);
                }
                if (d !== null) i = !0;
                else {
                  var u = n(l);
                  (u !== null && O(x, u.startTime - t), (i = !1));
                }
              }
              break a;
            } finally {
              ((d = null), (f = a), (p = !1));
            }
            i = void 0;
          }
        } finally {
          i ? D() : (S = !1);
        }
      }
    }
    var D;
    if (typeof y == `function`)
      D = function () {
        y(ee);
      };
    else if (typeof MessageChannel < `u`) {
      var te = new MessageChannel(),
        ne = te.port2;
      ((te.port1.onmessage = ee),
        (D = function () {
          ne.postMessage(null);
        }));
    } else
      D = function () {
        _(ee, 0);
      };
    function O(t, n) {
      C = _(function () {
        t(e.unstable_now());
      }, n);
    }
    ((e.unstable_IdlePriority = 5),
      (e.unstable_ImmediatePriority = 1),
      (e.unstable_LowPriority = 4),
      (e.unstable_NormalPriority = 3),
      (e.unstable_Profiling = null),
      (e.unstable_UserBlockingPriority = 2),
      (e.unstable_cancelCallback = function (e) {
        e.callback = null;
      }),
      (e.unstable_forceFrameRate = function (e) {
        0 > e || 125 < e
          ? console.error(
              `forceFrameRate takes a positive int between 0 and 125, forcing frame rates higher than 125 fps is not supported`,
            )
          : (w = 0 < e ? Math.floor(1e3 / e) : 5);
      }),
      (e.unstable_getCurrentPriorityLevel = function () {
        return f;
      }),
      (e.unstable_next = function (e) {
        switch (f) {
          case 1:
          case 2:
          case 3:
            var t = 3;
            break;
          default:
            t = f;
        }
        var n = f;
        f = t;
        try {
          return e();
        } finally {
          f = n;
        }
      }),
      (e.unstable_requestPaint = function () {
        g = !0;
      }),
      (e.unstable_runWithPriority = function (e, t) {
        switch (e) {
          case 1:
          case 2:
          case 3:
          case 4:
          case 5:
            break;
          default:
            e = 3;
        }
        var n = f;
        f = e;
        try {
          return t();
        } finally {
          f = n;
        }
      }),
      (e.unstable_scheduleCallback = function (r, i, a) {
        var o = e.unstable_now();
        switch (
          (typeof a == `object` && a
            ? ((a = a.delay), (a = typeof a == `number` && 0 < a ? o + a : o))
            : (a = o),
          r)
        ) {
          case 1:
            var s = -1;
            break;
          case 2:
            s = 250;
            break;
          case 5:
            s = 1073741823;
            break;
          case 4:
            s = 1e4;
            break;
          default:
            s = 5e3;
        }
        return (
          (s = a + s),
          (r = {
            id: u++,
            callback: i,
            priorityLevel: r,
            startTime: a,
            expirationTime: s,
            sortIndex: -1,
          }),
          a > o
            ? ((r.sortIndex = a),
              t(l, r),
              n(c) === null &&
                r === n(l) &&
                (h ? (v(C), (C = -1)) : (h = !0), O(x, a - o)))
            : ((r.sortIndex = s),
              t(c, r),
              m || p || ((m = !0), S || ((S = !0), D()))),
          r
        );
      }),
      (e.unstable_shouldYield = E),
      (e.unstable_wrapCallback = function (e) {
        var t = f;
        return function () {
          var n = f;
          f = t;
          try {
            return e.apply(this, arguments);
          } finally {
            f = n;
          }
        };
      }));
  }),
  he = y((e, t) => {
    t.exports = me();
  }),
  P = y((e) => {
    var t = he(),
      r = ue(),
      i = n();
    function a(e) {
      var t = `https://react.dev/errors/` + e;
      if (1 < arguments.length) {
        t += `?args[]=` + encodeURIComponent(arguments[1]);
        for (var n = 2; n < arguments.length; n++)
          t += `&args[]=` + encodeURIComponent(arguments[n]);
      }
      return (
        `Minified React error #` +
        e +
        `; visit ` +
        t +
        ` for the full message or use the non-minified dev environment for full errors and additional helpful warnings.`
      );
    }
    function o(e) {
      return !(
        !e ||
        (e.nodeType !== 1 && e.nodeType !== 9 && e.nodeType !== 11)
      );
    }
    function s(e) {
      var t = e,
        n = e;
      if (e.alternate) for (; t.return; ) t = t.return;
      else {
        e = t;
        do ((t = e), t.flags & 4098 && (n = t.return), (e = t.return));
        while (e);
      }
      return t.tag === 3 ? n : null;
    }
    function c(e) {
      if (e.tag === 13) {
        var t = e.memoizedState;
        if (
          (t === null &&
            ((e = e.alternate), e !== null && (t = e.memoizedState)),
          t !== null)
        )
          return t.dehydrated;
      }
      return null;
    }
    function l(e) {
      if (e.tag === 31) {
        var t = e.memoizedState;
        if (
          (t === null &&
            ((e = e.alternate), e !== null && (t = e.memoizedState)),
          t !== null)
        )
          return t.dehydrated;
      }
      return null;
    }
    function u(e) {
      if (s(e) !== e) throw Error(a(188));
    }
    function d(e) {
      var t = e.alternate;
      if (!t) {
        if (((t = s(e)), t === null)) throw Error(a(188));
        return t === e ? e : null;
      }
      for (var n = e, r = t; ; ) {
        var i = n.return;
        if (i === null) break;
        var o = i.alternate;
        if (o === null) {
          if (((r = i.return), r !== null)) {
            n = r;
            continue;
          }
          break;
        }
        if (i.child === o.child) {
          for (o = i.child; o; ) {
            if (o === n) return (u(i), e);
            if (o === r) return (u(i), t);
            o = o.sibling;
          }
          throw Error(a(188));
        }
        if (n.return !== r.return) ((n = i), (r = o));
        else {
          for (var c = !1, l = i.child; l; ) {
            if (l === n) {
              ((c = !0), (n = i), (r = o));
              break;
            }
            if (l === r) {
              ((c = !0), (r = i), (n = o));
              break;
            }
            l = l.sibling;
          }
          if (!c) {
            for (l = o.child; l; ) {
              if (l === n) {
                ((c = !0), (n = o), (r = i));
                break;
              }
              if (l === r) {
                ((c = !0), (r = o), (n = i));
                break;
              }
              l = l.sibling;
            }
            if (!c) throw Error(a(189));
          }
        }
        if (n.alternate !== r) throw Error(a(190));
      }
      if (n.tag !== 3) throw Error(a(188));
      return n.stateNode.current === n ? e : t;
    }
    function f(e) {
      var t = e.tag;
      if (t === 5 || t === 26 || t === 27 || t === 6) return e;
      for (e = e.child; e !== null; ) {
        if (((t = f(e)), t !== null)) return t;
        e = e.sibling;
      }
      return null;
    }
    var p = Object.assign,
      m = Symbol.for(`react.element`),
      h = Symbol.for(`react.transitional.element`),
      g = Symbol.for(`react.portal`),
      _ = Symbol.for(`react.fragment`),
      v = Symbol.for(`react.strict_mode`),
      y = Symbol.for(`react.profiler`),
      b = Symbol.for(`react.consumer`),
      x = Symbol.for(`react.context`),
      S = Symbol.for(`react.forward_ref`),
      C = Symbol.for(`react.suspense`),
      w = Symbol.for(`react.suspense_list`),
      T = Symbol.for(`react.memo`),
      E = Symbol.for(`react.lazy`),
      ee = Symbol.for(`react.activity`),
      D = Symbol.for(`react.memo_cache_sentinel`),
      te = Symbol.iterator;
    function ne(e) {
      return typeof e != `object` || !e
        ? null
        : ((e = (te && e[te]) || e[`@@iterator`]),
          typeof e == `function` ? e : null);
    }
    var O = Symbol.for(`react.client.reference`);
    function re(e) {
      if (e == null) return null;
      if (typeof e == `function`)
        return e.$$typeof === O ? null : e.displayName || e.name || null;
      if (typeof e == `string`) return e;
      switch (e) {
        case _:
          return `Fragment`;
        case y:
          return `Profiler`;
        case v:
          return `StrictMode`;
        case C:
          return `Suspense`;
        case w:
          return `SuspenseList`;
        case ee:
          return `Activity`;
      }
      if (typeof e == `object`)
        switch (e.$$typeof) {
          case g:
            return `Portal`;
          case x:
            return e.displayName || `Context`;
          case b:
            return (e._context.displayName || `Context`) + `.Consumer`;
          case S:
            var t = e.render;
            return (
              (e = e.displayName),
              (e ||=
                ((e = t.displayName || t.name || ``),
                e === `` ? `ForwardRef` : `ForwardRef(` + e + `)`)),
              e
            );
          case T:
            return (
              (t = e.displayName || null),
              t === null ? re(e.type) || `Memo` : t
            );
          case E:
            ((t = e._payload), (e = e._init));
            try {
              return re(e(t));
            } catch {}
        }
      return null;
    }
    var ie = Array.isArray,
      k = r.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE,
      A = i.__DOM_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE,
      j = { pending: !1, data: null, method: null, action: null },
      ae = [],
      oe = -1;
    function se(e) {
      return { current: e };
    }
    function M(e) {
      0 > oe || ((e.current = ae[oe]), (ae[oe] = null), oe--);
    }
    function N(e, t) {
      (oe++, (ae[oe] = e.current), (e.current = t));
    }
    var ce = se(null),
      le = se(null),
      de = se(null),
      fe = se(null);
    function pe(e, t) {
      switch ((N(de, t), N(le, e), N(ce, null), t.nodeType)) {
        case 9:
        case 11:
          e = (e = t.documentElement) && (e = e.namespaceURI) ? Vd(e) : 0;
          break;
        default:
          if (((e = t.tagName), (t = t.namespaceURI)))
            ((t = Vd(t)), (e = Hd(t, e)));
          else
            switch (e) {
              case `svg`:
                e = 1;
                break;
              case `math`:
                e = 2;
                break;
              default:
                e = 0;
            }
      }
      (M(ce), N(ce, e));
    }
    function me() {
      (M(ce), M(le), M(de));
    }
    function P(e) {
      e.memoizedState !== null && N(fe, e);
      var t = ce.current,
        n = Hd(t, e.type);
      t !== n && (N(le, e), N(ce, n));
    }
    function ge(e) {
      (le.current === e && (M(ce), M(le)),
        fe.current === e && (M(fe), (Qf._currentValue = j)));
    }
    var F, _e;
    function ve(e) {
      if (F === void 0)
        try {
          throw Error();
        } catch (e) {
          var t = e.stack.trim().match(/\n( *(at )?)/);
          ((F = (t && t[1]) || ``),
            (_e =
              -1 <
              e.stack.indexOf(`
    at`)
                ? ` (<anonymous>)`
                : -1 < e.stack.indexOf(`@`)
                  ? `@unknown:0:0`
                  : ``));
        }
      return (
        `
` +
        F +
        e +
        _e
      );
    }
    var I = !1;
    function ye(e, t) {
      if (!e || I) return ``;
      I = !0;
      var n = Error.prepareStackTrace;
      Error.prepareStackTrace = void 0;
      try {
        var r = {
          DetermineComponentFrameRoot: function () {
            try {
              if (t) {
                var n = function () {
                  throw Error();
                };
                if (
                  (Object.defineProperty(n.prototype, "props", {
                    set: function () {
                      throw Error();
                    },
                  }),
                  typeof Reflect == `object` && Reflect.construct)
                ) {
                  try {
                    Reflect.construct(n, []);
                  } catch (e) {
                    var r = e;
                  }
                  Reflect.construct(e, [], n);
                } else {
                  try {
                    n.call();
                  } catch (e) {
                    r = e;
                  }
                  e.call(n.prototype);
                }
              } else {
                try {
                  throw Error();
                } catch (e) {
                  r = e;
                }
                (n = e()) &&
                  typeof n.catch == `function` &&
                  n.catch(function () {});
              }
            } catch (e) {
              if (e && r && typeof e.stack == `string`)
                return [e.stack, r.stack];
            }
            return [null, null];
          },
        };
        r.DetermineComponentFrameRoot.displayName = `DetermineComponentFrameRoot`;
        var i = Object.getOwnPropertyDescriptor(
          r.DetermineComponentFrameRoot,
          `name`,
        );
        i &&
          i.configurable &&
          Object.defineProperty(r.DetermineComponentFrameRoot, "name", {
            value: `DetermineComponentFrameRoot`,
          });
        var a = r.DetermineComponentFrameRoot(),
          o = a[0],
          s = a[1];
        if (o && s) {
          var c = o.split(`
`),
            l = s.split(`
`);
          for (
            i = r = 0;
            r < c.length && !c[r].includes(`DetermineComponentFrameRoot`);
          )
            r++;
          for (
            ;
            i < l.length && !l[i].includes(`DetermineComponentFrameRoot`);
          )
            i++;
          if (r === c.length || i === l.length)
            for (
              r = c.length - 1, i = l.length - 1;
              1 <= r && 0 <= i && c[r] !== l[i];
            )
              i--;
          for (; 1 <= r && 0 <= i; r--, i--)
            if (c[r] !== l[i]) {
              if (r !== 1 || i !== 1)
                do
                  if ((r--, i--, 0 > i || c[r] !== l[i])) {
                    var u =
                      `
` + c[r].replace(` at new `, ` at `);
                    return (
                      e.displayName &&
                        u.includes(`<anonymous>`) &&
                        (u = u.replace(`<anonymous>`, e.displayName)),
                      u
                    );
                  }
                while (1 <= r && 0 <= i);
              break;
            }
        }
      } finally {
        ((I = !1), (Error.prepareStackTrace = n));
      }
      return (n = e ? e.displayName || e.name : ``) ? ve(n) : ``;
    }
    function be(e, t) {
      switch (e.tag) {
        case 26:
        case 27:
        case 5:
          return ve(e.type);
        case 16:
          return ve(`Lazy`);
        case 13:
          return e.child !== t && t !== null
            ? ve(`Suspense Fallback`)
            : ve(`Suspense`);
        case 19:
          return ve(`SuspenseList`);
        case 0:
        case 15:
          return ye(e.type, !1);
        case 11:
          return ye(e.type.render, !1);
        case 1:
          return ye(e.type, !0);
        case 31:
          return ve(`Activity`);
        default:
          return ``;
      }
    }
    function xe(e) {
      try {
        var t = ``,
          n = null;
        do ((t += be(e, n)), (n = e), (e = e.return));
        while (e);
        return t;
      } catch (e) {
        return (
          `
Error generating stack: ` +
          e.message +
          `
` +
          e.stack
        );
      }
    }
    var Se = Object.prototype.hasOwnProperty,
      Ce = t.unstable_scheduleCallback,
      we = t.unstable_cancelCallback,
      Te = t.unstable_shouldYield,
      Ee = t.unstable_requestPaint,
      De = t.unstable_now,
      Oe = t.unstable_getCurrentPriorityLevel,
      ke = t.unstable_ImmediatePriority,
      Ae = t.unstable_UserBlockingPriority,
      je = t.unstable_NormalPriority,
      Me = t.unstable_LowPriority,
      Ne = t.unstable_IdlePriority,
      Pe = t.log,
      Fe = t.unstable_setDisableYieldValue,
      Ie = null,
      Le = null;
    function Re(e) {
      if (
        (typeof Pe == `function` && Fe(e),
        Le && typeof Le.setStrictMode == `function`)
      )
        try {
          Le.setStrictMode(Ie, e);
        } catch {}
    }
    var ze = Math.clz32 ? Math.clz32 : He,
      Be = Math.log,
      Ve = Math.LN2;
    function He(e) {
      return ((e >>>= 0), e === 0 ? 32 : (31 - ((Be(e) / Ve) | 0)) | 0);
    }
    var Ue = 256,
      We = 262144,
      Ge = 4194304;
    function Ke(e) {
      var t = e & 42;
      if (t !== 0) return t;
      switch (e & -e) {
        case 1:
          return 1;
        case 2:
          return 2;
        case 4:
          return 4;
        case 8:
          return 8;
        case 16:
          return 16;
        case 32:
          return 32;
        case 64:
          return 64;
        case 128:
          return 128;
        case 256:
        case 512:
        case 1024:
        case 2048:
        case 4096:
        case 8192:
        case 16384:
        case 32768:
        case 65536:
        case 131072:
          return e & 261888;
        case 262144:
        case 524288:
        case 1048576:
        case 2097152:
          return e & 3932160;
        case 4194304:
        case 8388608:
        case 16777216:
        case 33554432:
          return e & 62914560;
        case 67108864:
          return 67108864;
        case 134217728:
          return 134217728;
        case 268435456:
          return 268435456;
        case 536870912:
          return 536870912;
        case 1073741824:
          return 0;
        default:
          return e;
      }
    }
    function qe(e, t, n) {
      var r = e.pendingLanes;
      if (r === 0) return 0;
      var i = 0,
        a = e.suspendedLanes,
        o = e.pingedLanes;
      e = e.warmLanes;
      var s = r & 134217727;
      return (
        s === 0
          ? ((s = r & ~a),
            s === 0
              ? o === 0
                ? n || ((n = r & ~e), n !== 0 && (i = Ke(n)))
                : (i = Ke(o))
              : (i = Ke(s)))
          : ((r = s & ~a),
            r === 0
              ? ((o &= s),
                o === 0
                  ? n || ((n = s & ~e), n !== 0 && (i = Ke(n)))
                  : (i = Ke(o)))
              : (i = Ke(r))),
        i === 0
          ? 0
          : t !== 0 &&
              t !== i &&
              (t & a) === 0 &&
              ((a = i & -i), (n = t & -t), a >= n || (a === 32 && n & 4194048))
            ? t
            : i
      );
    }
    function Je(e, t) {
      return (e.pendingLanes & ~(e.suspendedLanes & ~e.pingedLanes) & t) === 0;
    }
    function Ye(e, t) {
      switch (e) {
        case 1:
        case 2:
        case 4:
        case 8:
        case 64:
          return t + 250;
        case 16:
        case 32:
        case 128:
        case 256:
        case 512:
        case 1024:
        case 2048:
        case 4096:
        case 8192:
        case 16384:
        case 32768:
        case 65536:
        case 131072:
        case 262144:
        case 524288:
        case 1048576:
        case 2097152:
          return t + 5e3;
        case 4194304:
        case 8388608:
        case 16777216:
        case 33554432:
          return -1;
        case 67108864:
        case 134217728:
        case 268435456:
        case 536870912:
        case 1073741824:
          return -1;
        default:
          return -1;
      }
    }
    function Xe() {
      var e = Ge;
      return ((Ge <<= 1), !(Ge & 62914560) && (Ge = 4194304), e);
    }
    function Ze(e) {
      for (var t = [], n = 0; 31 > n; n++) t.push(e);
      return t;
    }
    function Qe(e, t) {
      ((e.pendingLanes |= t),
        t !== 268435456 &&
          ((e.suspendedLanes = 0), (e.pingedLanes = 0), (e.warmLanes = 0)));
    }
    function $e(e, t, n, r, i, a) {
      var o = e.pendingLanes;
      ((e.pendingLanes = n),
        (e.suspendedLanes = 0),
        (e.pingedLanes = 0),
        (e.warmLanes = 0),
        (e.expiredLanes &= n),
        (e.entangledLanes &= n),
        (e.errorRecoveryDisabledLanes &= n),
        (e.shellSuspendCounter = 0));
      var s = e.entanglements,
        c = e.expirationTimes,
        l = e.hiddenUpdates;
      for (n = o & ~n; 0 < n; ) {
        var u = 31 - ze(n),
          d = 1 << u;
        ((s[u] = 0), (c[u] = -1));
        var f = l[u];
        if (f !== null)
          for (l[u] = null, u = 0; u < f.length; u++) {
            var p = f[u];
            p !== null && (p.lane &= -536870913);
          }
        n &= ~d;
      }
      (r !== 0 && et(e, r, 0),
        a !== 0 &&
          i === 0 &&
          e.tag !== 0 &&
          (e.suspendedLanes |= a & ~(o & ~t)));
    }
    function et(e, t, n) {
      ((e.pendingLanes |= t), (e.suspendedLanes &= ~t));
      var r = 31 - ze(t);
      ((e.entangledLanes |= t),
        (e.entanglements[r] = e.entanglements[r] | 1073741824 | (n & 261930)));
    }
    function tt(e, t) {
      var n = (e.entangledLanes |= t);
      for (e = e.entanglements; n; ) {
        var r = 31 - ze(n),
          i = 1 << r;
        ((i & t) | (e[r] & t) && (e[r] |= t), (n &= ~i));
      }
    }
    function nt(e, t) {
      var n = t & -t;
      return (
        (n = n & 42 ? 1 : rt(n)),
        (n & (e.suspendedLanes | t)) === 0 ? n : 0
      );
    }
    function rt(e) {
      switch (e) {
        case 2:
          e = 1;
          break;
        case 8:
          e = 4;
          break;
        case 32:
          e = 16;
          break;
        case 256:
        case 512:
        case 1024:
        case 2048:
        case 4096:
        case 8192:
        case 16384:
        case 32768:
        case 65536:
        case 131072:
        case 262144:
        case 524288:
        case 1048576:
        case 2097152:
        case 4194304:
        case 8388608:
        case 16777216:
        case 33554432:
          e = 128;
          break;
        case 268435456:
          e = 134217728;
          break;
        default:
          e = 0;
      }
      return e;
    }
    function it(e) {
      return (
        (e &= -e),
        2 < e ? (8 < e ? (e & 134217727 ? 32 : 268435456) : 8) : 2
      );
    }
    function at() {
      var e = A.p;
      return e === 0 ? ((e = window.event), e === void 0 ? 32 : mp(e.type)) : e;
    }
    function ot(e, t) {
      var n = A.p;
      try {
        return ((A.p = e), t());
      } finally {
        A.p = n;
      }
    }
    var st = Math.random().toString(36).slice(2),
      ct = `__reactFiber$` + st,
      lt = `__reactProps$` + st,
      ut = `__reactContainer$` + st,
      dt = `__reactEvents$` + st,
      ft = `__reactListeners$` + st,
      pt = `__reactHandles$` + st,
      mt = `__reactResources$` + st,
      ht = `__reactMarker$` + st;
    function gt(e) {
      (delete e[ct], delete e[lt], delete e[dt], delete e[ft], delete e[pt]);
    }
    function _t(e) {
      var t = e[ct];
      if (t) return t;
      for (var n = e.parentNode; n; ) {
        if ((t = n[ut] || n[ct])) {
          if (
            ((n = t.alternate),
            t.child !== null || (n !== null && n.child !== null))
          )
            for (e = df(e); e !== null; ) {
              if ((n = e[ct])) return n;
              e = df(e);
            }
          return t;
        }
        ((e = n), (n = e.parentNode));
      }
      return null;
    }
    function vt(e) {
      if ((e = e[ct] || e[ut])) {
        var t = e.tag;
        if (
          t === 5 ||
          t === 6 ||
          t === 13 ||
          t === 31 ||
          t === 26 ||
          t === 27 ||
          t === 3
        )
          return e;
      }
      return null;
    }
    function yt(e) {
      var t = e.tag;
      if (t === 5 || t === 26 || t === 27 || t === 6) return e.stateNode;
      throw Error(a(33));
    }
    function bt(e) {
      var t = e[mt];
      return (
        (t ||= e[mt] =
          { hoistableStyles: new Map(), hoistableScripts: new Map() }),
        t
      );
    }
    function xt(e) {
      e[ht] = !0;
    }
    var St = new Set(),
      Ct = {};
    function wt(e, t) {
      (Tt(e, t), Tt(e + `Capture`, t));
    }
    function Tt(e, t) {
      for (Ct[e] = t, e = 0; e < t.length; e++) St.add(t[e]);
    }
    var Et = RegExp(
        `^[:A-Z_a-z\\u00C0-\\u00D6\\u00D8-\\u00F6\\u00F8-\\u02FF\\u0370-\\u037D\\u037F-\\u1FFF\\u200C-\\u200D\\u2070-\\u218F\\u2C00-\\u2FEF\\u3001-\\uD7FF\\uF900-\\uFDCF\\uFDF0-\\uFFFD][:A-Z_a-z\\u00C0-\\u00D6\\u00D8-\\u00F6\\u00F8-\\u02FF\\u0370-\\u037D\\u037F-\\u1FFF\\u200C-\\u200D\\u2070-\\u218F\\u2C00-\\u2FEF\\u3001-\\uD7FF\\uF900-\\uFDCF\\uFDF0-\\uFFFD\\-.0-9\\u00B7\\u0300-\\u036F\\u203F-\\u2040]*$`,
      ),
      Dt = {},
      Ot = {};
    function kt(e) {
      return Se.call(Ot, e)
        ? !0
        : Se.call(Dt, e)
          ? !1
          : Et.test(e)
            ? (Ot[e] = !0)
            : ((Dt[e] = !0), !1);
    }
    function At(e, t, n) {
      if (kt(t))
        if (n === null) e.removeAttribute(t);
        else {
          switch (typeof n) {
            case `undefined`:
            case `function`:
            case `symbol`:
              e.removeAttribute(t);
              return;
            case `boolean`:
              var r = t.toLowerCase().slice(0, 5);
              if (r !== `data-` && r !== `aria-`) {
                e.removeAttribute(t);
                return;
              }
          }
          e.setAttribute(t, `` + n);
        }
    }
    function jt(e, t, n) {
      if (n === null) e.removeAttribute(t);
      else {
        switch (typeof n) {
          case `undefined`:
          case `function`:
          case `symbol`:
          case `boolean`:
            e.removeAttribute(t);
            return;
        }
        e.setAttribute(t, `` + n);
      }
    }
    function Mt(e, t, n, r) {
      if (r === null) e.removeAttribute(n);
      else {
        switch (typeof r) {
          case `undefined`:
          case `function`:
          case `symbol`:
          case `boolean`:
            e.removeAttribute(n);
            return;
        }
        e.setAttributeNS(t, n, `` + r);
      }
    }
    function Nt(e) {
      switch (typeof e) {
        case `bigint`:
        case `boolean`:
        case `number`:
        case `string`:
        case `undefined`:
          return e;
        case `object`:
          return e;
        default:
          return ``;
      }
    }
    function Pt(e) {
      var t = e.type;
      return (
        (e = e.nodeName) &&
        e.toLowerCase() === `input` &&
        (t === `checkbox` || t === `radio`)
      );
    }
    function Ft(e, t, n) {
      var r = Object.getOwnPropertyDescriptor(e.constructor.prototype, t);
      if (
        !e.hasOwnProperty(t) &&
        r !== void 0 &&
        typeof r.get == `function` &&
        typeof r.set == `function`
      ) {
        var i = r.get,
          a = r.set;
        return (
          Object.defineProperty(e, t, {
            configurable: !0,
            get: function () {
              return i.call(this);
            },
            set: function (e) {
              ((n = `` + e), a.call(this, e));
            },
          }),
          Object.defineProperty(e, t, { enumerable: r.enumerable }),
          {
            getValue: function () {
              return n;
            },
            setValue: function (e) {
              n = `` + e;
            },
            stopTracking: function () {
              ((e._valueTracker = null), delete e[t]);
            },
          }
        );
      }
    }
    function It(e) {
      if (!e._valueTracker) {
        var t = Pt(e) ? `checked` : `value`;
        e._valueTracker = Ft(e, t, `` + e[t]);
      }
    }
    function Lt(e) {
      if (!e) return !1;
      var t = e._valueTracker;
      if (!t) return !0;
      var n = t.getValue(),
        r = ``;
      return (
        e && (r = Pt(e) ? (e.checked ? `true` : `false`) : e.value),
        (e = r),
        e === n ? !1 : (t.setValue(e), !0)
      );
    }
    function Rt(e) {
      if (((e ||= typeof document < `u` ? document : void 0), e === void 0))
        return null;
      try {
        return e.activeElement || e.body;
      } catch {
        return e.body;
      }
    }
    var zt = /[\n"\\]/g;
    function Bt(e) {
      return e.replace(zt, function (e) {
        return `\\` + e.charCodeAt(0).toString(16) + ` `;
      });
    }
    function Vt(e, t, n, r, i, a, o, s) {
      ((e.name = ``),
        o != null &&
        typeof o != `function` &&
        typeof o != `symbol` &&
        typeof o != `boolean`
          ? (e.type = o)
          : e.removeAttribute(`type`),
        t == null
          ? (o !== `submit` && o !== `reset`) || e.removeAttribute(`value`)
          : o === `number`
            ? ((t === 0 && e.value === ``) || e.value != t) &&
              (e.value = `` + Nt(t))
            : e.value !== `` + Nt(t) && (e.value = `` + Nt(t)),
        t == null
          ? n == null
            ? r != null && e.removeAttribute(`value`)
            : Ut(e, o, Nt(n))
          : Ut(e, o, Nt(t)),
        i == null && a != null && (e.defaultChecked = !!a),
        i != null &&
          (e.checked = i && typeof i != `function` && typeof i != `symbol`),
        s != null &&
        typeof s != `function` &&
        typeof s != `symbol` &&
        typeof s != `boolean`
          ? (e.name = `` + Nt(s))
          : e.removeAttribute(`name`));
    }
    function Ht(e, t, n, r, i, a, o, s) {
      if (
        (a != null &&
          typeof a != `function` &&
          typeof a != `symbol` &&
          typeof a != `boolean` &&
          (e.type = a),
        t != null || n != null)
      ) {
        if (!((a !== `submit` && a !== `reset`) || t != null)) {
          It(e);
          return;
        }
        ((n = n == null ? `` : `` + Nt(n)),
          (t = t == null ? n : `` + Nt(t)),
          s || t === e.value || (e.value = t),
          (e.defaultValue = t));
      }
      ((r ??= i),
        (r = typeof r != `function` && typeof r != `symbol` && !!r),
        (e.checked = s ? e.checked : !!r),
        (e.defaultChecked = !!r),
        o != null &&
          typeof o != `function` &&
          typeof o != `symbol` &&
          typeof o != `boolean` &&
          (e.name = o),
        It(e));
    }
    function Ut(e, t, n) {
      (t === `number` && Rt(e.ownerDocument) === e) ||
        e.defaultValue === `` + n ||
        (e.defaultValue = `` + n);
    }
    function Wt(e, t, n, r) {
      if (((e = e.options), t)) {
        t = {};
        for (var i = 0; i < n.length; i++) t[`$` + n[i]] = !0;
        for (n = 0; n < e.length; n++)
          ((i = t.hasOwnProperty(`$` + e[n].value)),
            e[n].selected !== i && (e[n].selected = i),
            i && r && (e[n].defaultSelected = !0));
      } else {
        for (n = `` + Nt(n), t = null, i = 0; i < e.length; i++) {
          if (e[i].value === n) {
            ((e[i].selected = !0), r && (e[i].defaultSelected = !0));
            return;
          }
          t !== null || e[i].disabled || (t = e[i]);
        }
        t !== null && (t.selected = !0);
      }
    }
    function Gt(e, t, n) {
      if (
        t != null &&
        ((t = `` + Nt(t)), t !== e.value && (e.value = t), n == null)
      ) {
        e.defaultValue !== t && (e.defaultValue = t);
        return;
      }
      e.defaultValue = n == null ? `` : `` + Nt(n);
    }
    function Kt(e, t, n, r) {
      if (t == null) {
        if (r != null) {
          if (n != null) throw Error(a(92));
          if (ie(r)) {
            if (1 < r.length) throw Error(a(93));
            r = r[0];
          }
          n = r;
        }
        ((n ??= ``), (t = n));
      }
      ((n = Nt(t)),
        (e.defaultValue = n),
        (r = e.textContent),
        r === n && r !== `` && r !== null && (e.value = r),
        It(e));
    }
    function qt(e, t) {
      if (t) {
        var n = e.firstChild;
        if (n && n === e.lastChild && n.nodeType === 3) {
          n.nodeValue = t;
          return;
        }
      }
      e.textContent = t;
    }
    var Jt = new Set(
      `animationIterationCount aspectRatio borderImageOutset borderImageSlice borderImageWidth boxFlex boxFlexGroup boxOrdinalGroup columnCount columns flex flexGrow flexPositive flexShrink flexNegative flexOrder gridArea gridRow gridRowEnd gridRowSpan gridRowStart gridColumn gridColumnEnd gridColumnSpan gridColumnStart fontWeight lineClamp lineHeight opacity order orphans scale tabSize widows zIndex zoom fillOpacity floodOpacity stopOpacity strokeDasharray strokeDashoffset strokeMiterlimit strokeOpacity strokeWidth MozAnimationIterationCount MozBoxFlex MozBoxFlexGroup MozLineClamp msAnimationIterationCount msFlex msZoom msFlexGrow msFlexNegative msFlexOrder msFlexPositive msFlexShrink msGridColumn msGridColumnSpan msGridRow msGridRowSpan WebkitAnimationIterationCount WebkitBoxFlex WebKitBoxFlexGroup WebkitBoxOrdinalGroup WebkitColumnCount WebkitColumns WebkitFlex WebkitFlexGrow WebkitFlexPositive WebkitFlexShrink WebkitLineClamp`.split(
        ` `,
      ),
    );
    function Yt(e, t, n) {
      var r = t.indexOf(`--`) === 0;
      n == null || typeof n == `boolean` || n === ``
        ? r
          ? e.setProperty(t, ``)
          : t === `float`
            ? (e.cssFloat = ``)
            : (e[t] = ``)
        : r
          ? e.setProperty(t, n)
          : typeof n != `number` || n === 0 || Jt.has(t)
            ? t === `float`
              ? (e.cssFloat = n)
              : (e[t] = (`` + n).trim())
            : (e[t] = n + `px`);
    }
    function Xt(e, t, n) {
      if (t != null && typeof t != `object`) throw Error(a(62));
      if (((e = e.style), n != null)) {
        for (var r in n)
          !n.hasOwnProperty(r) ||
            (t != null && t.hasOwnProperty(r)) ||
            (r.indexOf(`--`) === 0
              ? e.setProperty(r, ``)
              : r === `float`
                ? (e.cssFloat = ``)
                : (e[r] = ``));
        for (var i in t)
          ((r = t[i]), t.hasOwnProperty(i) && n[i] !== r && Yt(e, i, r));
      } else for (var o in t) t.hasOwnProperty(o) && Yt(e, o, t[o]);
    }
    function Zt(e) {
      if (e.indexOf(`-`) === -1) return !1;
      switch (e) {
        case `annotation-xml`:
        case `color-profile`:
        case `font-face`:
        case `font-face-src`:
        case `font-face-uri`:
        case `font-face-format`:
        case `font-face-name`:
        case `missing-glyph`:
          return !1;
        default:
          return !0;
      }
    }
    var Qt = new Map([
        [`acceptCharset`, `accept-charset`],
        [`htmlFor`, `for`],
        [`httpEquiv`, `http-equiv`],
        [`crossOrigin`, `crossorigin`],
        [`accentHeight`, `accent-height`],
        [`alignmentBaseline`, `alignment-baseline`],
        [`arabicForm`, `arabic-form`],
        [`baselineShift`, `baseline-shift`],
        [`capHeight`, `cap-height`],
        [`clipPath`, `clip-path`],
        [`clipRule`, `clip-rule`],
        [`colorInterpolation`, `color-interpolation`],
        [`colorInterpolationFilters`, `color-interpolation-filters`],
        [`colorProfile`, `color-profile`],
        [`colorRendering`, `color-rendering`],
        [`dominantBaseline`, `dominant-baseline`],
        [`enableBackground`, `enable-background`],
        [`fillOpacity`, `fill-opacity`],
        [`fillRule`, `fill-rule`],
        [`floodColor`, `flood-color`],
        [`floodOpacity`, `flood-opacity`],
        [`fontFamily`, `font-family`],
        [`fontSize`, `font-size`],
        [`fontSizeAdjust`, `font-size-adjust`],
        [`fontStretch`, `font-stretch`],
        [`fontStyle`, `font-style`],
        [`fontVariant`, `font-variant`],
        [`fontWeight`, `font-weight`],
        [`glyphName`, `glyph-name`],
        [`glyphOrientationHorizontal`, `glyph-orientation-horizontal`],
        [`glyphOrientationVertical`, `glyph-orientation-vertical`],
        [`horizAdvX`, `horiz-adv-x`],
        [`horizOriginX`, `horiz-origin-x`],
        [`imageRendering`, `image-rendering`],
        [`letterSpacing`, `letter-spacing`],
        [`lightingColor`, `lighting-color`],
        [`markerEnd`, `marker-end`],
        [`markerMid`, `marker-mid`],
        [`markerStart`, `marker-start`],
        [`overlinePosition`, `overline-position`],
        [`overlineThickness`, `overline-thickness`],
        [`paintOrder`, `paint-order`],
        [`panose-1`, `panose-1`],
        [`pointerEvents`, `pointer-events`],
        [`renderingIntent`, `rendering-intent`],
        [`shapeRendering`, `shape-rendering`],
        [`stopColor`, `stop-color`],
        [`stopOpacity`, `stop-opacity`],
        [`strikethroughPosition`, `strikethrough-position`],
        [`strikethroughThickness`, `strikethrough-thickness`],
        [`strokeDasharray`, `stroke-dasharray`],
        [`strokeDashoffset`, `stroke-dashoffset`],
        [`strokeLinecap`, `stroke-linecap`],
        [`strokeLinejoin`, `stroke-linejoin`],
        [`strokeMiterlimit`, `stroke-miterlimit`],
        [`strokeOpacity`, `stroke-opacity`],
        [`strokeWidth`, `stroke-width`],
        [`textAnchor`, `text-anchor`],
        [`textDecoration`, `text-decoration`],
        [`textRendering`, `text-rendering`],
        [`transformOrigin`, `transform-origin`],
        [`underlinePosition`, `underline-position`],
        [`underlineThickness`, `underline-thickness`],
        [`unicodeBidi`, `unicode-bidi`],
        [`unicodeRange`, `unicode-range`],
        [`unitsPerEm`, `units-per-em`],
        [`vAlphabetic`, `v-alphabetic`],
        [`vHanging`, `v-hanging`],
        [`vIdeographic`, `v-ideographic`],
        [`vMathematical`, `v-mathematical`],
        [`vectorEffect`, `vector-effect`],
        [`vertAdvY`, `vert-adv-y`],
        [`vertOriginX`, `vert-origin-x`],
        [`vertOriginY`, `vert-origin-y`],
        [`wordSpacing`, `word-spacing`],
        [`writingMode`, `writing-mode`],
        [`xmlnsXlink`, `xmlns:xlink`],
        [`xHeight`, `x-height`],
      ]),
      $t =
        /^[\u0000-\u001F ]*j[\r\n\t]*a[\r\n\t]*v[\r\n\t]*a[\r\n\t]*s[\r\n\t]*c[\r\n\t]*r[\r\n\t]*i[\r\n\t]*p[\r\n\t]*t[\r\n\t]*:/i;
    function en(e) {
      return $t.test(`` + e)
        ? `javascript:throw new Error('React has blocked a javascript: URL as a security precaution.')`
        : e;
    }
    function tn() {}
    var nn = null;
    function rn(e) {
      return (
        (e = e.target || e.srcElement || window),
        e.correspondingUseElement && (e = e.correspondingUseElement),
        e.nodeType === 3 ? e.parentNode : e
      );
    }
    var an = null,
      on = null;
    function sn(e) {
      var t = vt(e);
      if (t && (e = t.stateNode)) {
        var n = e[lt] || null;
        a: switch (((e = t.stateNode), t.type)) {
          case `input`:
            if (
              (Vt(
                e,
                n.value,
                n.defaultValue,
                n.defaultValue,
                n.checked,
                n.defaultChecked,
                n.type,
                n.name,
              ),
              (t = n.name),
              n.type === `radio` && t != null)
            ) {
              for (n = e; n.parentNode; ) n = n.parentNode;
              for (
                n = n.querySelectorAll(
                  `input[name="` + Bt(`` + t) + `"][type="radio"]`,
                ),
                  t = 0;
                t < n.length;
                t++
              ) {
                var r = n[t];
                if (r !== e && r.form === e.form) {
                  var i = r[lt] || null;
                  if (!i) throw Error(a(90));
                  Vt(
                    r,
                    i.value,
                    i.defaultValue,
                    i.defaultValue,
                    i.checked,
                    i.defaultChecked,
                    i.type,
                    i.name,
                  );
                }
              }
              for (t = 0; t < n.length; t++)
                ((r = n[t]), r.form === e.form && Lt(r));
            }
            break a;
          case `textarea`:
            Gt(e, n.value, n.defaultValue);
            break a;
          case `select`:
            ((t = n.value), t != null && Wt(e, !!n.multiple, t, !1));
        }
      }
    }
    var cn = !1;
    function ln(e, t, n) {
      if (cn) return e(t, n);
      cn = !0;
      try {
        return e(t);
      } finally {
        if (
          ((cn = !1),
          (an !== null || on !== null) &&
            (bu(), an && ((t = an), (e = on), (on = an = null), sn(t), e)))
        )
          for (t = 0; t < e.length; t++) sn(e[t]);
      }
    }
    function un(e, t) {
      var n = e.stateNode;
      if (n === null) return null;
      var r = n[lt] || null;
      if (r === null) return null;
      n = r[t];
      a: switch (t) {
        case `onClick`:
        case `onClickCapture`:
        case `onDoubleClick`:
        case `onDoubleClickCapture`:
        case `onMouseDown`:
        case `onMouseDownCapture`:
        case `onMouseMove`:
        case `onMouseMoveCapture`:
        case `onMouseUp`:
        case `onMouseUpCapture`:
        case `onMouseEnter`:
          ((r = !r.disabled) ||
            ((e = e.type),
            (r = !(
              e === `button` ||
              e === `input` ||
              e === `select` ||
              e === `textarea`
            ))),
            (e = !r));
          break a;
        default:
          e = !1;
      }
      if (e) return null;
      if (n && typeof n != `function`) throw Error(a(231, t, typeof n));
      return n;
    }
    var dn = !(
        typeof window > `u` ||
        window.document === void 0 ||
        window.document.createElement === void 0
      ),
      fn = !1;
    if (dn)
      try {
        var pn = {};
        (Object.defineProperty(pn, "passive", {
          get: function () {
            fn = !0;
          },
        }),
          window.addEventListener(`test`, pn, pn),
          window.removeEventListener(`test`, pn, pn));
      } catch {
        fn = !1;
      }
    var mn = null,
      hn = null,
      gn = null;
    function _n() {
      if (gn) return gn;
      var e,
        t = hn,
        n = t.length,
        r,
        i = `value` in mn ? mn.value : mn.textContent,
        a = i.length;
      for (e = 0; e < n && t[e] === i[e]; e++);
      var o = n - e;
      for (r = 1; r <= o && t[n - r] === i[a - r]; r++);
      return (gn = i.slice(e, 1 < r ? 1 - r : void 0));
    }
    function vn(e) {
      var t = e.keyCode;
      return (
        `charCode` in e
          ? ((e = e.charCode), e === 0 && t === 13 && (e = 13))
          : (e = t),
        e === 10 && (e = 13),
        32 <= e || e === 13 ? e : 0
      );
    }
    function yn() {
      return !0;
    }
    function bn() {
      return !1;
    }
    function L(e) {
      function t(t, n, r, i, a) {
        for (var o in ((this._reactName = t),
        (this._targetInst = r),
        (this.type = n),
        (this.nativeEvent = i),
        (this.target = a),
        (this.currentTarget = null),
        e))
          e.hasOwnProperty(o) && ((t = e[o]), (this[o] = t ? t(i) : i[o]));
        return (
          (this.isDefaultPrevented = (
            i.defaultPrevented == null
              ? !1 === i.returnValue
              : i.defaultPrevented
          )
            ? yn
            : bn),
          (this.isPropagationStopped = bn),
          this
        );
      }
      return (
        p(t.prototype, {
          preventDefault: function () {
            this.defaultPrevented = !0;
            var e = this.nativeEvent;
            e &&
              (e.preventDefault
                ? e.preventDefault()
                : typeof e.returnValue != `unknown` && (e.returnValue = !1),
              (this.isDefaultPrevented = yn));
          },
          stopPropagation: function () {
            var e = this.nativeEvent;
            e &&
              (e.stopPropagation
                ? e.stopPropagation()
                : typeof e.cancelBubble != `unknown` && (e.cancelBubble = !0),
              (this.isPropagationStopped = yn));
          },
          persist: function () {},
          isPersistent: yn,
        }),
        t
      );
    }
    var xn = {
        eventPhase: 0,
        bubbles: 0,
        cancelable: 0,
        timeStamp: function (e) {
          return e.timeStamp || Date.now();
        },
        defaultPrevented: 0,
        isTrusted: 0,
      },
      Sn = L(xn),
      Cn = p({}, xn, { view: 0, detail: 0 }),
      wn = L(Cn),
      Tn,
      En,
      Dn,
      On = p({}, Cn, {
        screenX: 0,
        screenY: 0,
        clientX: 0,
        clientY: 0,
        pageX: 0,
        pageY: 0,
        ctrlKey: 0,
        shiftKey: 0,
        altKey: 0,
        metaKey: 0,
        getModifierState: zn,
        button: 0,
        buttons: 0,
        relatedTarget: function (e) {
          return e.relatedTarget === void 0
            ? e.fromElement === e.srcElement
              ? e.toElement
              : e.fromElement
            : e.relatedTarget;
        },
        movementX: function (e) {
          return `movementX` in e
            ? e.movementX
            : (e !== Dn &&
                (Dn && e.type === `mousemove`
                  ? ((Tn = e.screenX - Dn.screenX),
                    (En = e.screenY - Dn.screenY))
                  : (En = Tn = 0),
                (Dn = e)),
              Tn);
        },
        movementY: function (e) {
          return `movementY` in e ? e.movementY : En;
        },
      }),
      kn = L(On),
      An = L(p({}, On, { dataTransfer: 0 })),
      jn = L(p({}, Cn, { relatedTarget: 0 })),
      Mn = L(p({}, xn, { animationName: 0, elapsedTime: 0, pseudoElement: 0 })),
      Nn = L(
        p({}, xn, {
          clipboardData: function (e) {
            return `clipboardData` in e
              ? e.clipboardData
              : window.clipboardData;
          },
        }),
      ),
      Pn = L(p({}, xn, { data: 0 })),
      Fn = {
        Esc: `Escape`,
        Spacebar: ` `,
        Left: `ArrowLeft`,
        Up: `ArrowUp`,
        Right: `ArrowRight`,
        Down: `ArrowDown`,
        Del: `Delete`,
        Win: `OS`,
        Menu: `ContextMenu`,
        Apps: `ContextMenu`,
        Scroll: `ScrollLock`,
        MozPrintableKey: `Unidentified`,
      },
      In = {
        8: `Backspace`,
        9: `Tab`,
        12: `Clear`,
        13: `Enter`,
        16: `Shift`,
        17: `Control`,
        18: `Alt`,
        19: `Pause`,
        20: `CapsLock`,
        27: `Escape`,
        32: ` `,
        33: `PageUp`,
        34: `PageDown`,
        35: `End`,
        36: `Home`,
        37: `ArrowLeft`,
        38: `ArrowUp`,
        39: `ArrowRight`,
        40: `ArrowDown`,
        45: `Insert`,
        46: `Delete`,
        112: `F1`,
        113: `F2`,
        114: `F3`,
        115: `F4`,
        116: `F5`,
        117: `F6`,
        118: `F7`,
        119: `F8`,
        120: `F9`,
        121: `F10`,
        122: `F11`,
        123: `F12`,
        144: `NumLock`,
        145: `ScrollLock`,
        224: `Meta`,
      },
      Ln = {
        Alt: `altKey`,
        Control: `ctrlKey`,
        Meta: `metaKey`,
        Shift: `shiftKey`,
      };
    function Rn(e) {
      var t = this.nativeEvent;
      return t.getModifierState
        ? t.getModifierState(e)
        : (e = Ln[e])
          ? !!t[e]
          : !1;
    }
    function zn() {
      return Rn;
    }
    var Bn = L(
        p({}, Cn, {
          key: function (e) {
            if (e.key) {
              var t = Fn[e.key] || e.key;
              if (t !== `Unidentified`) return t;
            }
            return e.type === `keypress`
              ? ((e = vn(e)), e === 13 ? `Enter` : String.fromCharCode(e))
              : e.type === `keydown` || e.type === `keyup`
                ? In[e.keyCode] || `Unidentified`
                : ``;
          },
          code: 0,
          location: 0,
          ctrlKey: 0,
          shiftKey: 0,
          altKey: 0,
          metaKey: 0,
          repeat: 0,
          locale: 0,
          getModifierState: zn,
          charCode: function (e) {
            return e.type === `keypress` ? vn(e) : 0;
          },
          keyCode: function (e) {
            return e.type === `keydown` || e.type === `keyup` ? e.keyCode : 0;
          },
          which: function (e) {
            return e.type === `keypress`
              ? vn(e)
              : e.type === `keydown` || e.type === `keyup`
                ? e.keyCode
                : 0;
          },
        }),
      ),
      Vn = L(
        p({}, On, {
          pointerId: 0,
          width: 0,
          height: 0,
          pressure: 0,
          tangentialPressure: 0,
          tiltX: 0,
          tiltY: 0,
          twist: 0,
          pointerType: 0,
          isPrimary: 0,
        }),
      ),
      Hn = L(
        p({}, Cn, {
          touches: 0,
          targetTouches: 0,
          changedTouches: 0,
          altKey: 0,
          metaKey: 0,
          ctrlKey: 0,
          shiftKey: 0,
          getModifierState: zn,
        }),
      ),
      Un = L(p({}, xn, { propertyName: 0, elapsedTime: 0, pseudoElement: 0 })),
      Wn = L(
        p({}, On, {
          deltaX: function (e) {
            return `deltaX` in e
              ? e.deltaX
              : `wheelDeltaX` in e
                ? -e.wheelDeltaX
                : 0;
          },
          deltaY: function (e) {
            return `deltaY` in e
              ? e.deltaY
              : `wheelDeltaY` in e
                ? -e.wheelDeltaY
                : `wheelDelta` in e
                  ? -e.wheelDelta
                  : 0;
          },
          deltaZ: 0,
          deltaMode: 0,
        }),
      ),
      Gn = L(p({}, xn, { newState: 0, oldState: 0 })),
      Kn = [9, 13, 27, 32],
      qn = dn && `CompositionEvent` in window,
      R = null;
    dn && `documentMode` in document && (R = document.documentMode);
    var Jn = dn && `TextEvent` in window && !R,
      Yn = dn && (!qn || (R && 8 < R && 11 >= R)),
      Xn = ` `,
      Zn = !1;
    function Qn(e, t) {
      switch (e) {
        case `keyup`:
          return Kn.indexOf(t.keyCode) !== -1;
        case `keydown`:
          return t.keyCode !== 229;
        case `keypress`:
        case `mousedown`:
        case `focusout`:
          return !0;
        default:
          return !1;
      }
    }
    function $n(e) {
      return (
        (e = e.detail),
        typeof e == `object` && `data` in e ? e.data : null
      );
    }
    var er = !1;
    function tr(e, t) {
      switch (e) {
        case `compositionend`:
          return $n(t);
        case `keypress`:
          return t.which === 32 ? ((Zn = !0), Xn) : null;
        case `textInput`:
          return ((e = t.data), e === Xn && Zn ? null : e);
        default:
          return null;
      }
    }
    function nr(e, t) {
      if (er)
        return e === `compositionend` || (!qn && Qn(e, t))
          ? ((e = _n()), (gn = hn = mn = null), (er = !1), e)
          : null;
      switch (e) {
        case `paste`:
          return null;
        case `keypress`:
          if (
            !(t.ctrlKey || t.altKey || t.metaKey) ||
            (t.ctrlKey && t.altKey)
          ) {
            if (t.char && 1 < t.char.length) return t.char;
            if (t.which) return String.fromCharCode(t.which);
          }
          return null;
        case `compositionend`:
          return Yn && t.locale !== `ko` ? null : t.data;
        default:
          return null;
      }
    }
    var rr = {
      color: !0,
      date: !0,
      datetime: !0,
      "datetime-local": !0,
      email: !0,
      month: !0,
      number: !0,
      password: !0,
      range: !0,
      search: !0,
      tel: !0,
      text: !0,
      time: !0,
      url: !0,
      week: !0,
    };
    function ir(e) {
      var t = e && e.nodeName && e.nodeName.toLowerCase();
      return t === `input` ? !!rr[e.type] : t === `textarea`;
    }
    function ar(e, t, n, r) {
      (an ? (on ? on.push(r) : (on = [r])) : (an = r),
        (t = Ed(t, `onChange`)),
        0 < t.length &&
          ((n = new Sn(`onChange`, `change`, null, n, r)),
          e.push({ event: n, listeners: t })));
    }
    var or = null,
      sr = null;
    function cr(e) {
      yd(e, 0);
    }
    function lr(e) {
      if (Lt(yt(e))) return e;
    }
    function ur(e, t) {
      if (e === `change`) return t;
    }
    var dr = !1;
    if (dn) {
      var fr;
      if (dn) {
        var pr = `oninput` in document;
        if (!pr) {
          var mr = document.createElement(`div`);
          (mr.setAttribute(`oninput`, `return;`),
            (pr = typeof mr.oninput == `function`));
        }
        fr = pr;
      } else fr = !1;
      dr = fr && (!document.documentMode || 9 < document.documentMode);
    }
    function hr() {
      or && (or.detachEvent(`onpropertychange`, gr), (sr = or = null));
    }
    function gr(e) {
      if (e.propertyName === `value` && lr(sr)) {
        var t = [];
        (ar(t, sr, e, rn(e)), ln(cr, t));
      }
    }
    function _r(e, t, n) {
      e === `focusin`
        ? (hr(), (or = t), (sr = n), or.attachEvent(`onpropertychange`, gr))
        : e === `focusout` && hr();
    }
    function vr(e) {
      if (e === `selectionchange` || e === `keyup` || e === `keydown`)
        return lr(sr);
    }
    function yr(e, t) {
      if (e === `click`) return lr(t);
    }
    function br(e, t) {
      if (e === `input` || e === `change`) return lr(t);
    }
    function xr(e, t) {
      return (e === t && (e !== 0 || 1 / e == 1 / t)) || (e !== e && t !== t);
    }
    var Sr = typeof Object.is == `function` ? Object.is : xr;
    function Cr(e, t) {
      if (Sr(e, t)) return !0;
      if (typeof e != `object` || !e || typeof t != `object` || !t) return !1;
      var n = Object.keys(e),
        r = Object.keys(t);
      if (n.length !== r.length) return !1;
      for (r = 0; r < n.length; r++) {
        var i = n[r];
        if (!Se.call(t, i) || !Sr(e[i], t[i])) return !1;
      }
      return !0;
    }
    function wr(e) {
      for (; e && e.firstChild; ) e = e.firstChild;
      return e;
    }
    function Tr(e, t) {
      var n = wr(e);
      e = 0;
      for (var r; n; ) {
        if (n.nodeType === 3) {
          if (((r = e + n.textContent.length), e <= t && r >= t))
            return { node: n, offset: t - e };
          e = r;
        }
        a: {
          for (; n; ) {
            if (n.nextSibling) {
              n = n.nextSibling;
              break a;
            }
            n = n.parentNode;
          }
          n = void 0;
        }
        n = wr(n);
      }
    }
    function Er(e, t) {
      return e && t
        ? e === t
          ? !0
          : e && e.nodeType === 3
            ? !1
            : t && t.nodeType === 3
              ? Er(e, t.parentNode)
              : `contains` in e
                ? e.contains(t)
                : e.compareDocumentPosition
                  ? !!(e.compareDocumentPosition(t) & 16)
                  : !1
        : !1;
    }
    function Dr(e) {
      e =
        e != null &&
        e.ownerDocument != null &&
        e.ownerDocument.defaultView != null
          ? e.ownerDocument.defaultView
          : window;
      for (var t = Rt(e.document); t instanceof e.HTMLIFrameElement; ) {
        try {
          var n = typeof t.contentWindow.location.href == `string`;
        } catch {
          n = !1;
        }
        if (n) e = t.contentWindow;
        else break;
        t = Rt(e.document);
      }
      return t;
    }
    function Or(e) {
      var t = e && e.nodeName && e.nodeName.toLowerCase();
      return (
        t &&
        ((t === `input` &&
          (e.type === `text` ||
            e.type === `search` ||
            e.type === `tel` ||
            e.type === `url` ||
            e.type === `password`)) ||
          t === `textarea` ||
          e.contentEditable === `true`)
      );
    }
    var kr = dn && `documentMode` in document && 11 >= document.documentMode,
      Ar = null,
      z = null,
      jr = null,
      Mr = !1;
    function Nr(e, t, n) {
      var r =
        n.window === n ? n.document : n.nodeType === 9 ? n : n.ownerDocument;
      Mr ||
        Ar == null ||
        Ar !== Rt(r) ||
        ((r = Ar),
        `selectionStart` in r && Or(r)
          ? (r = { start: r.selectionStart, end: r.selectionEnd })
          : ((r = (
              (r.ownerDocument && r.ownerDocument.defaultView) ||
              window
            ).getSelection()),
            (r = {
              anchorNode: r.anchorNode,
              anchorOffset: r.anchorOffset,
              focusNode: r.focusNode,
              focusOffset: r.focusOffset,
            })),
        (jr && Cr(jr, r)) ||
          ((jr = r),
          (r = Ed(z, `onSelect`)),
          0 < r.length &&
            ((t = new Sn(`onSelect`, `select`, null, t, n)),
            e.push({ event: t, listeners: r }),
            (t.target = Ar))));
    }
    function Pr(e, t) {
      var n = {};
      return (
        (n[e.toLowerCase()] = t.toLowerCase()),
        (n[`Webkit` + e] = `webkit` + t),
        (n[`Moz` + e] = `moz` + t),
        n
      );
    }
    var Fr = {
        animationend: Pr(`Animation`, `AnimationEnd`),
        animationiteration: Pr(`Animation`, `AnimationIteration`),
        animationstart: Pr(`Animation`, `AnimationStart`),
        transitionrun: Pr(`Transition`, `TransitionRun`),
        transitionstart: Pr(`Transition`, `TransitionStart`),
        transitioncancel: Pr(`Transition`, `TransitionCancel`),
        transitionend: Pr(`Transition`, `TransitionEnd`),
      },
      Ir = {},
      Lr = {};
    dn &&
      ((Lr = document.createElement(`div`).style),
      `AnimationEvent` in window ||
        (delete Fr.animationend.animation,
        delete Fr.animationiteration.animation,
        delete Fr.animationstart.animation),
      `TransitionEvent` in window || delete Fr.transitionend.transition);
    function Rr(e) {
      if (Ir[e]) return Ir[e];
      if (!Fr[e]) return e;
      var t = Fr[e],
        n;
      for (n in t) if (t.hasOwnProperty(n) && n in Lr) return (Ir[e] = t[n]);
      return e;
    }
    var zr = Rr(`animationend`),
      Br = Rr(`animationiteration`),
      Vr = Rr(`animationstart`),
      Hr = Rr(`transitionrun`),
      Ur = Rr(`transitionstart`),
      Wr = Rr(`transitioncancel`),
      Gr = Rr(`transitionend`),
      Kr = new Map(),
      qr =
        `abort auxClick beforeToggle cancel canPlay canPlayThrough click close contextMenu copy cut drag dragEnd dragEnter dragExit dragLeave dragOver dragStart drop durationChange emptied encrypted ended error gotPointerCapture input invalid keyDown keyPress keyUp load loadedData loadedMetadata loadStart lostPointerCapture mouseDown mouseMove mouseOut mouseOver mouseUp paste pause play playing pointerCancel pointerDown pointerMove pointerOut pointerOver pointerUp progress rateChange reset resize seeked seeking stalled submit suspend timeUpdate touchCancel touchEnd touchStart volumeChange scroll toggle touchMove waiting wheel`.split(
          ` `,
        );
    qr.push(`scrollEnd`);
    function Jr(e, t) {
      (Kr.set(e, t), wt(t, [e]));
    }
    var Yr =
        typeof reportError == `function`
          ? reportError
          : function (e) {
              if (
                typeof window == `object` &&
                typeof window.ErrorEvent == `function`
              ) {
                var t = new window.ErrorEvent(`error`, {
                  bubbles: !0,
                  cancelable: !0,
                  message:
                    typeof e == `object` && e && typeof e.message == `string`
                      ? String(e.message)
                      : String(e),
                  error: e,
                });
                if (!window.dispatchEvent(t)) return;
              } else if (
                typeof process == `object` &&
                typeof process.emit == `function`
              ) {
                process.emit(`uncaughtException`, e);
                return;
              }
              console.error(e);
            },
      Xr = [],
      Zr = 0,
      Qr = 0;
    function $r() {
      for (var e = Zr, t = (Qr = Zr = 0); t < e; ) {
        var n = Xr[t];
        Xr[t++] = null;
        var r = Xr[t];
        Xr[t++] = null;
        var i = Xr[t];
        Xr[t++] = null;
        var a = Xr[t];
        if (((Xr[t++] = null), r !== null && i !== null)) {
          var o = r.pending;
          (o === null ? (i.next = i) : ((i.next = o.next), (o.next = i)),
            (r.pending = i));
        }
        a !== 0 && ri(n, i, a);
      }
    }
    function ei(e, t, n, r) {
      ((Xr[Zr++] = e),
        (Xr[Zr++] = t),
        (Xr[Zr++] = n),
        (Xr[Zr++] = r),
        (Qr |= r),
        (e.lanes |= r),
        (e = e.alternate),
        e !== null && (e.lanes |= r));
    }
    function ti(e, t, n, r) {
      return (ei(e, t, n, r), ii(e));
    }
    function ni(e, t) {
      return (ei(e, null, null, t), ii(e));
    }
    function ri(e, t, n) {
      e.lanes |= n;
      var r = e.alternate;
      r !== null && (r.lanes |= n);
      for (var i = !1, a = e.return; a !== null; )
        ((a.childLanes |= n),
          (r = a.alternate),
          r !== null && (r.childLanes |= n),
          a.tag === 22 &&
            ((e = a.stateNode), e === null || e._visibility & 1 || (i = !0)),
          (e = a),
          (a = a.return));
      return e.tag === 3
        ? ((a = e.stateNode),
          i &&
            t !== null &&
            ((i = 31 - ze(n)),
            (e = a.hiddenUpdates),
            (r = e[i]),
            r === null ? (e[i] = [t]) : r.push(t),
            (t.lane = n | 536870912)),
          a)
        : null;
    }
    function ii(e) {
      if (50 < du) throw ((du = 0), (fu = null), Error(a(185)));
      for (var t = e.return; t !== null; ) ((e = t), (t = e.return));
      return e.tag === 3 ? e.stateNode : null;
    }
    var ai = {};
    function oi(e, t, n, r) {
      ((this.tag = e),
        (this.key = n),
        (this.sibling =
          this.child =
          this.return =
          this.stateNode =
          this.type =
          this.elementType =
            null),
        (this.index = 0),
        (this.refCleanup = this.ref = null),
        (this.pendingProps = t),
        (this.dependencies =
          this.memoizedState =
          this.updateQueue =
          this.memoizedProps =
            null),
        (this.mode = r),
        (this.subtreeFlags = this.flags = 0),
        (this.deletions = null),
        (this.childLanes = this.lanes = 0),
        (this.alternate = null));
    }
    function si(e, t, n, r) {
      return new oi(e, t, n, r);
    }
    function ci(e) {
      return ((e = e.prototype), !(!e || !e.isReactComponent));
    }
    function li(e, t) {
      var n = e.alternate;
      return (
        n === null
          ? ((n = si(e.tag, t, e.key, e.mode)),
            (n.elementType = e.elementType),
            (n.type = e.type),
            (n.stateNode = e.stateNode),
            (n.alternate = e),
            (e.alternate = n))
          : ((n.pendingProps = t),
            (n.type = e.type),
            (n.flags = 0),
            (n.subtreeFlags = 0),
            (n.deletions = null)),
        (n.flags = e.flags & 65011712),
        (n.childLanes = e.childLanes),
        (n.lanes = e.lanes),
        (n.child = e.child),
        (n.memoizedProps = e.memoizedProps),
        (n.memoizedState = e.memoizedState),
        (n.updateQueue = e.updateQueue),
        (t = e.dependencies),
        (n.dependencies =
          t === null ? null : { lanes: t.lanes, firstContext: t.firstContext }),
        (n.sibling = e.sibling),
        (n.index = e.index),
        (n.ref = e.ref),
        (n.refCleanup = e.refCleanup),
        n
      );
    }
    function ui(e, t) {
      e.flags &= 65011714;
      var n = e.alternate;
      return (
        n === null
          ? ((e.childLanes = 0),
            (e.lanes = t),
            (e.child = null),
            (e.subtreeFlags = 0),
            (e.memoizedProps = null),
            (e.memoizedState = null),
            (e.updateQueue = null),
            (e.dependencies = null),
            (e.stateNode = null))
          : ((e.childLanes = n.childLanes),
            (e.lanes = n.lanes),
            (e.child = n.child),
            (e.subtreeFlags = 0),
            (e.deletions = null),
            (e.memoizedProps = n.memoizedProps),
            (e.memoizedState = n.memoizedState),
            (e.updateQueue = n.updateQueue),
            (e.type = n.type),
            (t = n.dependencies),
            (e.dependencies =
              t === null
                ? null
                : { lanes: t.lanes, firstContext: t.firstContext })),
        e
      );
    }
    function di(e, t, n, r, i, o) {
      var s = 0;
      if (((r = e), typeof e == `function`)) ci(e) && (s = 1);
      else if (typeof e == `string`)
        s = Uf(e, n, ce.current)
          ? 26
          : e === `html` || e === `head` || e === `body`
            ? 27
            : 5;
      else
        a: switch (e) {
          case ee:
            return (
              (e = si(31, n, t, i)),
              (e.elementType = ee),
              (e.lanes = o),
              e
            );
          case _:
            return fi(n.children, i, o, t);
          case v:
            ((s = 8), (i |= 24));
            break;
          case y:
            return (
              (e = si(12, n, t, i | 2)),
              (e.elementType = y),
              (e.lanes = o),
              e
            );
          case C:
            return (
              (e = si(13, n, t, i)),
              (e.elementType = C),
              (e.lanes = o),
              e
            );
          case w:
            return (
              (e = si(19, n, t, i)),
              (e.elementType = w),
              (e.lanes = o),
              e
            );
          default:
            if (typeof e == `object` && e)
              switch (e.$$typeof) {
                case x:
                  s = 10;
                  break a;
                case b:
                  s = 9;
                  break a;
                case S:
                  s = 11;
                  break a;
                case T:
                  s = 14;
                  break a;
                case E:
                  ((s = 16), (r = null));
                  break a;
              }
            ((s = 29),
              (n = Error(a(130, e === null ? `null` : typeof e, ``))),
              (r = null));
        }
      return (
        (t = si(s, n, t, i)),
        (t.elementType = e),
        (t.type = r),
        (t.lanes = o),
        t
      );
    }
    function fi(e, t, n, r) {
      return ((e = si(7, e, r, t)), (e.lanes = n), e);
    }
    function pi(e, t, n) {
      return ((e = si(6, e, null, t)), (e.lanes = n), e);
    }
    function mi(e) {
      var t = si(18, null, null, 0);
      return ((t.stateNode = e), t);
    }
    function hi(e, t, n) {
      return (
        (t = si(4, e.children === null ? [] : e.children, e.key, t)),
        (t.lanes = n),
        (t.stateNode = {
          containerInfo: e.containerInfo,
          pendingChildren: null,
          implementation: e.implementation,
        }),
        t
      );
    }
    var gi = new WeakMap();
    function _i(e, t) {
      if (typeof e == `object` && e) {
        var n = gi.get(e);
        return n === void 0
          ? ((t = { value: e, source: t, stack: xe(t) }), gi.set(e, t), t)
          : n;
      }
      return { value: e, source: t, stack: xe(t) };
    }
    var vi = [],
      yi = 0,
      bi = null,
      xi = 0,
      Si = [],
      Ci = 0,
      wi = null,
      Ti = 1,
      Ei = ``;
    function Di(e, t) {
      ((vi[yi++] = xi), (vi[yi++] = bi), (bi = e), (xi = t));
    }
    function Oi(e, t, n) {
      ((Si[Ci++] = Ti), (Si[Ci++] = Ei), (Si[Ci++] = wi), (wi = e));
      var r = Ti;
      e = Ei;
      var i = 32 - ze(r) - 1;
      ((r &= ~(1 << i)), (n += 1));
      var a = 32 - ze(t) + i;
      if (30 < a) {
        var o = i - (i % 5);
        ((a = (r & ((1 << o) - 1)).toString(32)),
          (r >>= o),
          (i -= o),
          (Ti = (1 << (32 - ze(t) + i)) | (n << i) | r),
          (Ei = a + e));
      } else ((Ti = (1 << a) | (n << i) | r), (Ei = e));
    }
    function ki(e) {
      e.return !== null && (Di(e, 1), Oi(e, 1, 0));
    }
    function Ai(e) {
      for (; e === bi; )
        ((bi = vi[--yi]), (vi[yi] = null), (xi = vi[--yi]), (vi[yi] = null));
      for (; e === wi; )
        ((wi = Si[--Ci]),
          (Si[Ci] = null),
          (Ei = Si[--Ci]),
          (Si[Ci] = null),
          (Ti = Si[--Ci]),
          (Si[Ci] = null));
    }
    function ji(e, t) {
      ((Si[Ci++] = Ti),
        (Si[Ci++] = Ei),
        (Si[Ci++] = wi),
        (Ti = t.id),
        (Ei = t.overflow),
        (wi = e));
    }
    var Mi = null,
      B = null,
      V = !1,
      Ni = null,
      Pi = !1,
      Fi = Error(a(519));
    function Ii(e) {
      throw (
        Hi(
          _i(
            Error(
              a(
                418,
                1 < arguments.length && arguments[1] !== void 0 && arguments[1]
                  ? `text`
                  : `HTML`,
                ``,
              ),
            ),
            e,
          ),
        ),
        Fi
      );
    }
    function Li(e) {
      var t = e.stateNode,
        n = e.type,
        r = e.memoizedProps;
      switch (((t[ct] = e), (t[lt] = r), n)) {
        case `dialog`:
          (Q(`cancel`, t), Q(`close`, t));
          break;
        case `iframe`:
        case `object`:
        case `embed`:
          Q(`load`, t);
          break;
        case `video`:
        case `audio`:
          for (n = 0; n < _d.length; n++) Q(_d[n], t);
          break;
        case `source`:
          Q(`error`, t);
          break;
        case `img`:
        case `image`:
        case `link`:
          (Q(`error`, t), Q(`load`, t));
          break;
        case `details`:
          Q(`toggle`, t);
          break;
        case `input`:
          (Q(`invalid`, t),
            Ht(
              t,
              r.value,
              r.defaultValue,
              r.checked,
              r.defaultChecked,
              r.type,
              r.name,
              !0,
            ));
          break;
        case `select`:
          Q(`invalid`, t);
          break;
        case `textarea`:
          (Q(`invalid`, t), Kt(t, r.value, r.defaultValue, r.children));
      }
      ((n = r.children),
        (typeof n != `string` &&
          typeof n != `number` &&
          typeof n != `bigint`) ||
        t.textContent === `` + n ||
        !0 === r.suppressHydrationWarning ||
        Md(t.textContent, n)
          ? (r.popover != null && (Q(`beforetoggle`, t), Q(`toggle`, t)),
            r.onScroll != null && Q(`scroll`, t),
            r.onScrollEnd != null && Q(`scrollend`, t),
            r.onClick != null && (t.onclick = tn),
            (t = !0))
          : (t = !1),
        t || Ii(e, !0));
    }
    function Ri(e) {
      for (Mi = e.return; Mi; )
        switch (Mi.tag) {
          case 5:
          case 31:
          case 13:
            Pi = !1;
            return;
          case 27:
          case 3:
            Pi = !0;
            return;
          default:
            Mi = Mi.return;
        }
    }
    function zi(e) {
      if (e !== Mi) return !1;
      if (!V) return (Ri(e), (V = !0), !1);
      var t = e.tag,
        n;
      if (
        ((n = t !== 3 && t !== 27) &&
          ((n = t === 5) &&
            ((n = e.type),
            (n =
              !(n !== `form` && n !== `button`) ||
              Ud(e.type, e.memoizedProps))),
          (n = !n)),
        n && B && Ii(e),
        Ri(e),
        t === 13)
      ) {
        if (((e = e.memoizedState), (e = e === null ? null : e.dehydrated), !e))
          throw Error(a(317));
        B = uf(e);
      } else if (t === 31) {
        if (((e = e.memoizedState), (e = e === null ? null : e.dehydrated), !e))
          throw Error(a(317));
        B = uf(e);
      } else
        t === 27
          ? ((t = B), Zd(e.type) ? ((e = lf), (lf = null), (B = e)) : (B = t))
          : (B = Mi ? cf(e.stateNode.nextSibling) : null);
      return !0;
    }
    function Bi() {
      ((B = Mi = null), (V = !1));
    }
    function Vi() {
      var e = Ni;
      return (
        e !== null &&
          (Zl === null ? (Zl = e) : Zl.push.apply(Zl, e), (Ni = null)),
        e
      );
    }
    function Hi(e) {
      Ni === null ? (Ni = [e]) : Ni.push(e);
    }
    var Ui = se(null),
      Wi = null,
      Gi = null;
    function Ki(e, t, n) {
      (N(Ui, t._currentValue), (t._currentValue = n));
    }
    function qi(e) {
      ((e._currentValue = Ui.current), M(Ui));
    }
    function Ji(e, t, n) {
      for (; e !== null; ) {
        var r = e.alternate;
        if (
          ((e.childLanes & t) === t
            ? r !== null && (r.childLanes & t) !== t && (r.childLanes |= t)
            : ((e.childLanes |= t), r !== null && (r.childLanes |= t)),
          e === n)
        )
          break;
        e = e.return;
      }
    }
    function Yi(e, t, n, r) {
      var i = e.child;
      for (i !== null && (i.return = e); i !== null; ) {
        var o = i.dependencies;
        if (o !== null) {
          var s = i.child;
          o = o.firstContext;
          a: for (; o !== null; ) {
            var c = o;
            o = i;
            for (var l = 0; l < t.length; l++)
              if (c.context === t[l]) {
                ((o.lanes |= n),
                  (c = o.alternate),
                  c !== null && (c.lanes |= n),
                  Ji(o.return, n, e),
                  r || (s = null));
                break a;
              }
            o = c.next;
          }
        } else if (i.tag === 18) {
          if (((s = i.return), s === null)) throw Error(a(341));
          ((s.lanes |= n),
            (o = s.alternate),
            o !== null && (o.lanes |= n),
            Ji(s, n, e),
            (s = null));
        } else s = i.child;
        if (s !== null) s.return = i;
        else
          for (s = i; s !== null; ) {
            if (s === e) {
              s = null;
              break;
            }
            if (((i = s.sibling), i !== null)) {
              ((i.return = s.return), (s = i));
              break;
            }
            s = s.return;
          }
        i = s;
      }
    }
    function Xi(e, t, n, r) {
      e = null;
      for (var i = t, o = !1; i !== null; ) {
        if (!o) {
          if (i.flags & 524288) o = !0;
          else if (i.flags & 262144) break;
        }
        if (i.tag === 10) {
          var s = i.alternate;
          if (s === null) throw Error(a(387));
          if (((s = s.memoizedProps), s !== null)) {
            var c = i.type;
            Sr(i.pendingProps.value, s.value) ||
              (e === null ? (e = [c]) : e.push(c));
          }
        } else if (i === fe.current) {
          if (((s = i.alternate), s === null)) throw Error(a(387));
          s.memoizedState.memoizedState !== i.memoizedState.memoizedState &&
            (e === null ? (e = [Qf]) : e.push(Qf));
        }
        i = i.return;
      }
      (e !== null && Yi(t, e, n, r), (t.flags |= 262144));
    }
    function Zi(e) {
      for (e = e.firstContext; e !== null; ) {
        if (!Sr(e.context._currentValue, e.memoizedValue)) return !0;
        e = e.next;
      }
      return !1;
    }
    function Qi(e) {
      ((Wi = e),
        (Gi = null),
        (e = e.dependencies),
        e !== null && (e.firstContext = null));
    }
    function $i(e) {
      return ta(Wi, e);
    }
    function ea(e, t) {
      return (Wi === null && Qi(e), ta(e, t));
    }
    function ta(e, t) {
      var n = t._currentValue;
      if (((t = { context: t, memoizedValue: n, next: null }), Gi === null)) {
        if (e === null) throw Error(a(308));
        ((Gi = t),
          (e.dependencies = { lanes: 0, firstContext: t }),
          (e.flags |= 524288));
      } else Gi = Gi.next = t;
      return n;
    }
    var na =
        typeof AbortController < `u`
          ? AbortController
          : function () {
              var e = [],
                t = (this.signal = {
                  aborted: !1,
                  addEventListener: function (t, n) {
                    e.push(n);
                  },
                });
              this.abort = function () {
                ((t.aborted = !0),
                  e.forEach(function (e) {
                    return e();
                  }));
              };
            },
      ra = t.unstable_scheduleCallback,
      ia = t.unstable_NormalPriority,
      aa = {
        $$typeof: x,
        Consumer: null,
        Provider: null,
        _currentValue: null,
        _currentValue2: null,
        _threadCount: 0,
      };
    function oa() {
      return { controller: new na(), data: new Map(), refCount: 0 };
    }
    function sa(e) {
      (e.refCount--,
        e.refCount === 0 &&
          ra(ia, function () {
            e.controller.abort();
          }));
    }
    var ca = null,
      la = 0,
      ua = 0,
      da = null;
    function fa(e, t) {
      if (ca === null) {
        var n = (ca = []);
        ((la = 0),
          (ua = dd()),
          (da = {
            status: `pending`,
            value: void 0,
            then: function (e) {
              n.push(e);
            },
          }));
      }
      return (la++, t.then(pa, pa), t);
    }
    function pa() {
      if (--la === 0 && ca !== null) {
        da !== null && (da.status = `fulfilled`);
        var e = ca;
        ((ca = null), (ua = 0), (da = null));
        for (var t = 0; t < e.length; t++) (0, e[t])();
      }
    }
    function ma(e, t) {
      var n = [],
        r = {
          status: `pending`,
          value: null,
          reason: null,
          then: function (e) {
            n.push(e);
          },
        };
      return (
        e.then(
          function () {
            ((r.status = `fulfilled`), (r.value = t));
            for (var e = 0; e < n.length; e++) (0, n[e])(t);
          },
          function (e) {
            for (r.status = `rejected`, r.reason = e, e = 0; e < n.length; e++)
              (0, n[e])(void 0);
          },
        ),
        r
      );
    }
    var ha = k.S;
    k.S = function (e, t) {
      ((eu = De()),
        typeof t == `object` && t && typeof t.then == `function` && fa(e, t),
        ha !== null && ha(e, t));
    };
    var ga = se(null);
    function _a() {
      var e = ga.current;
      return e === null ? q.pooledCache : e;
    }
    function va(e, t) {
      t === null ? N(ga, ga.current) : N(ga, t.pool);
    }
    function ya() {
      var e = _a();
      return e === null ? null : { parent: aa._currentValue, pool: e };
    }
    var ba = Error(a(460)),
      xa = Error(a(474)),
      Sa = Error(a(542)),
      Ca = { then: function () {} };
    function wa(e) {
      return ((e = e.status), e === `fulfilled` || e === `rejected`);
    }
    function Ta(e, t, n) {
      switch (
        ((n = e[n]),
        n === void 0 ? e.push(t) : n !== t && (t.then(tn, tn), (t = n)),
        t.status)
      ) {
        case `fulfilled`:
          return t.value;
        case `rejected`:
          throw ((e = t.reason), ka(e), e);
        default:
          if (typeof t.status == `string`) t.then(tn, tn);
          else {
            if (((e = q), e !== null && 100 < e.shellSuspendCounter))
              throw Error(a(482));
            ((e = t),
              (e.status = `pending`),
              e.then(
                function (e) {
                  if (t.status === `pending`) {
                    var n = t;
                    ((n.status = `fulfilled`), (n.value = e));
                  }
                },
                function (e) {
                  if (t.status === `pending`) {
                    var n = t;
                    ((n.status = `rejected`), (n.reason = e));
                  }
                },
              ));
          }
          switch (t.status) {
            case `fulfilled`:
              return t.value;
            case `rejected`:
              throw ((e = t.reason), ka(e), e);
          }
          throw ((Da = t), ba);
      }
    }
    function Ea(e) {
      try {
        var t = e._init;
        return t(e._payload);
      } catch (e) {
        throw typeof e == `object` && e && typeof e.then == `function`
          ? ((Da = e), ba)
          : e;
      }
    }
    var Da = null;
    function Oa() {
      if (Da === null) throw Error(a(459));
      var e = Da;
      return ((Da = null), e);
    }
    function ka(e) {
      if (e === ba || e === Sa) throw Error(a(483));
    }
    var Aa = null,
      ja = 0;
    function Ma(e) {
      var t = ja;
      return ((ja += 1), Aa === null && (Aa = []), Ta(Aa, e, t));
    }
    function Na(e, t) {
      ((t = t.props.ref), (e.ref = t === void 0 ? null : t));
    }
    function Pa(e, t) {
      throw t.$$typeof === m
        ? Error(a(525))
        : ((e = Object.prototype.toString.call(t)),
          Error(
            a(
              31,
              e === `[object Object]`
                ? `object with keys {` + Object.keys(t).join(`, `) + `}`
                : e,
            ),
          ));
    }
    function Fa(e) {
      function t(t, n) {
        if (e) {
          var r = t.deletions;
          r === null ? ((t.deletions = [n]), (t.flags |= 16)) : r.push(n);
        }
      }
      function n(n, r) {
        if (!e) return null;
        for (; r !== null; ) (t(n, r), (r = r.sibling));
        return null;
      }
      function r(e) {
        for (var t = new Map(); e !== null; )
          (e.key === null ? t.set(e.index, e) : t.set(e.key, e),
            (e = e.sibling));
        return t;
      }
      function i(e, t) {
        return ((e = li(e, t)), (e.index = 0), (e.sibling = null), e);
      }
      function o(t, n, r) {
        return (
          (t.index = r),
          e
            ? ((r = t.alternate),
              r === null
                ? ((t.flags |= 67108866), n)
                : ((r = r.index), r < n ? ((t.flags |= 67108866), n) : r))
            : ((t.flags |= 1048576), n)
        );
      }
      function s(t) {
        return (e && t.alternate === null && (t.flags |= 67108866), t);
      }
      function c(e, t, n, r) {
        return t === null || t.tag !== 6
          ? ((t = pi(n, e.mode, r)), (t.return = e), t)
          : ((t = i(t, n)), (t.return = e), t);
      }
      function l(e, t, n, r) {
        var a = n.type;
        return a === _
          ? d(e, t, n.props.children, r, n.key)
          : t !== null &&
              (t.elementType === a ||
                (typeof a == `object` &&
                  a &&
                  a.$$typeof === E &&
                  Ea(a) === t.type))
            ? ((t = i(t, n.props)), Na(t, n), (t.return = e), t)
            : ((t = di(n.type, n.key, n.props, null, e.mode, r)),
              Na(t, n),
              (t.return = e),
              t);
      }
      function u(e, t, n, r) {
        return t === null ||
          t.tag !== 4 ||
          t.stateNode.containerInfo !== n.containerInfo ||
          t.stateNode.implementation !== n.implementation
          ? ((t = hi(n, e.mode, r)), (t.return = e), t)
          : ((t = i(t, n.children || [])), (t.return = e), t);
      }
      function d(e, t, n, r, a) {
        return t === null || t.tag !== 7
          ? ((t = fi(n, e.mode, r, a)), (t.return = e), t)
          : ((t = i(t, n)), (t.return = e), t);
      }
      function f(e, t, n) {
        if (
          (typeof t == `string` && t !== ``) ||
          typeof t == `number` ||
          typeof t == `bigint`
        )
          return ((t = pi(`` + t, e.mode, n)), (t.return = e), t);
        if (typeof t == `object` && t) {
          switch (t.$$typeof) {
            case h:
              return (
                (n = di(t.type, t.key, t.props, null, e.mode, n)),
                Na(n, t),
                (n.return = e),
                n
              );
            case g:
              return ((t = hi(t, e.mode, n)), (t.return = e), t);
            case E:
              return ((t = Ea(t)), f(e, t, n));
          }
          if (ie(t) || ne(t))
            return ((t = fi(t, e.mode, n, null)), (t.return = e), t);
          if (typeof t.then == `function`) return f(e, Ma(t), n);
          if (t.$$typeof === x) return f(e, ea(e, t), n);
          Pa(e, t);
        }
        return null;
      }
      function p(e, t, n, r) {
        var i = t === null ? null : t.key;
        if (
          (typeof n == `string` && n !== ``) ||
          typeof n == `number` ||
          typeof n == `bigint`
        )
          return i === null ? c(e, t, `` + n, r) : null;
        if (typeof n == `object` && n) {
          switch (n.$$typeof) {
            case h:
              return n.key === i ? l(e, t, n, r) : null;
            case g:
              return n.key === i ? u(e, t, n, r) : null;
            case E:
              return ((n = Ea(n)), p(e, t, n, r));
          }
          if (ie(n) || ne(n)) return i === null ? d(e, t, n, r, null) : null;
          if (typeof n.then == `function`) return p(e, t, Ma(n), r);
          if (n.$$typeof === x) return p(e, t, ea(e, n), r);
          Pa(e, n);
        }
        return null;
      }
      function m(e, t, n, r, i) {
        if (
          (typeof r == `string` && r !== ``) ||
          typeof r == `number` ||
          typeof r == `bigint`
        )
          return ((e = e.get(n) || null), c(t, e, `` + r, i));
        if (typeof r == `object` && r) {
          switch (r.$$typeof) {
            case h:
              return (
                (e = e.get(r.key === null ? n : r.key) || null),
                l(t, e, r, i)
              );
            case g:
              return (
                (e = e.get(r.key === null ? n : r.key) || null),
                u(t, e, r, i)
              );
            case E:
              return ((r = Ea(r)), m(e, t, n, r, i));
          }
          if (ie(r) || ne(r))
            return ((e = e.get(n) || null), d(t, e, r, i, null));
          if (typeof r.then == `function`) return m(e, t, n, Ma(r), i);
          if (r.$$typeof === x) return m(e, t, n, ea(t, r), i);
          Pa(t, r);
        }
        return null;
      }
      function v(i, a, s, c) {
        for (
          var l = null, u = null, d = a, h = (a = 0), g = null;
          d !== null && h < s.length;
          h++
        ) {
          d.index > h ? ((g = d), (d = null)) : (g = d.sibling);
          var _ = p(i, d, s[h], c);
          if (_ === null) {
            d === null && (d = g);
            break;
          }
          (e && d && _.alternate === null && t(i, d),
            (a = o(_, a, h)),
            u === null ? (l = _) : (u.sibling = _),
            (u = _),
            (d = g));
        }
        if (h === s.length) return (n(i, d), V && Di(i, h), l);
        if (d === null) {
          for (; h < s.length; h++)
            ((d = f(i, s[h], c)),
              d !== null &&
                ((a = o(d, a, h)),
                u === null ? (l = d) : (u.sibling = d),
                (u = d)));
          return (V && Di(i, h), l);
        }
        for (d = r(d); h < s.length; h++)
          ((g = m(d, i, h, s[h], c)),
            g !== null &&
              (e &&
                g.alternate !== null &&
                d.delete(g.key === null ? h : g.key),
              (a = o(g, a, h)),
              u === null ? (l = g) : (u.sibling = g),
              (u = g)));
        return (
          e &&
            d.forEach(function (e) {
              return t(i, e);
            }),
          V && Di(i, h),
          l
        );
      }
      function y(i, s, c, l) {
        if (c == null) throw Error(a(151));
        for (
          var u = null, d = null, h = s, g = (s = 0), _ = null, v = c.next();
          h !== null && !v.done;
          g++, v = c.next()
        ) {
          h.index > g ? ((_ = h), (h = null)) : (_ = h.sibling);
          var y = p(i, h, v.value, l);
          if (y === null) {
            h === null && (h = _);
            break;
          }
          (e && h && y.alternate === null && t(i, h),
            (s = o(y, s, g)),
            d === null ? (u = y) : (d.sibling = y),
            (d = y),
            (h = _));
        }
        if (v.done) return (n(i, h), V && Di(i, g), u);
        if (h === null) {
          for (; !v.done; g++, v = c.next())
            ((v = f(i, v.value, l)),
              v !== null &&
                ((s = o(v, s, g)),
                d === null ? (u = v) : (d.sibling = v),
                (d = v)));
          return (V && Di(i, g), u);
        }
        for (h = r(h); !v.done; g++, v = c.next())
          ((v = m(h, i, g, v.value, l)),
            v !== null &&
              (e &&
                v.alternate !== null &&
                h.delete(v.key === null ? g : v.key),
              (s = o(v, s, g)),
              d === null ? (u = v) : (d.sibling = v),
              (d = v)));
        return (
          e &&
            h.forEach(function (e) {
              return t(i, e);
            }),
          V && Di(i, g),
          u
        );
      }
      function b(e, r, o, c) {
        if (
          (typeof o == `object` &&
            o &&
            o.type === _ &&
            o.key === null &&
            (o = o.props.children),
          typeof o == `object` && o)
        ) {
          switch (o.$$typeof) {
            case h:
              a: {
                for (var l = o.key; r !== null; ) {
                  if (r.key === l) {
                    if (((l = o.type), l === _)) {
                      if (r.tag === 7) {
                        (n(e, r.sibling),
                          (c = i(r, o.props.children)),
                          (c.return = e),
                          (e = c));
                        break a;
                      }
                    } else if (
                      r.elementType === l ||
                      (typeof l == `object` &&
                        l &&
                        l.$$typeof === E &&
                        Ea(l) === r.type)
                    ) {
                      (n(e, r.sibling),
                        (c = i(r, o.props)),
                        Na(c, o),
                        (c.return = e),
                        (e = c));
                      break a;
                    }
                    n(e, r);
                    break;
                  } else t(e, r);
                  r = r.sibling;
                }
                o.type === _
                  ? ((c = fi(o.props.children, e.mode, c, o.key)),
                    (c.return = e),
                    (e = c))
                  : ((c = di(o.type, o.key, o.props, null, e.mode, c)),
                    Na(c, o),
                    (c.return = e),
                    (e = c));
              }
              return s(e);
            case g:
              a: {
                for (l = o.key; r !== null; ) {
                  if (r.key === l)
                    if (
                      r.tag === 4 &&
                      r.stateNode.containerInfo === o.containerInfo &&
                      r.stateNode.implementation === o.implementation
                    ) {
                      (n(e, r.sibling),
                        (c = i(r, o.children || [])),
                        (c.return = e),
                        (e = c));
                      break a;
                    } else {
                      n(e, r);
                      break;
                    }
                  else t(e, r);
                  r = r.sibling;
                }
                ((c = hi(o, e.mode, c)), (c.return = e), (e = c));
              }
              return s(e);
            case E:
              return ((o = Ea(o)), b(e, r, o, c));
          }
          if (ie(o)) return v(e, r, o, c);
          if (ne(o)) {
            if (((l = ne(o)), typeof l != `function`)) throw Error(a(150));
            return ((o = l.call(o)), y(e, r, o, c));
          }
          if (typeof o.then == `function`) return b(e, r, Ma(o), c);
          if (o.$$typeof === x) return b(e, r, ea(e, o), c);
          Pa(e, o);
        }
        return (typeof o == `string` && o !== ``) ||
          typeof o == `number` ||
          typeof o == `bigint`
          ? ((o = `` + o),
            r !== null && r.tag === 6
              ? (n(e, r.sibling), (c = i(r, o)), (c.return = e), (e = c))
              : (n(e, r), (c = pi(o, e.mode, c)), (c.return = e), (e = c)),
            s(e))
          : n(e, r);
      }
      return function (e, t, n, r) {
        try {
          ja = 0;
          var i = b(e, t, n, r);
          return ((Aa = null), i);
        } catch (t) {
          if (t === ba || t === Sa) throw t;
          var a = si(29, t, null, e.mode);
          return ((a.lanes = r), (a.return = e), a);
        }
      };
    }
    var Ia = Fa(!0),
      La = Fa(!1),
      Ra = !1;
    function za(e) {
      e.updateQueue = {
        baseState: e.memoizedState,
        firstBaseUpdate: null,
        lastBaseUpdate: null,
        shared: { pending: null, lanes: 0, hiddenCallbacks: null },
        callbacks: null,
      };
    }
    function Ba(e, t) {
      ((e = e.updateQueue),
        t.updateQueue === e &&
          (t.updateQueue = {
            baseState: e.baseState,
            firstBaseUpdate: e.firstBaseUpdate,
            lastBaseUpdate: e.lastBaseUpdate,
            shared: e.shared,
            callbacks: null,
          }));
    }
    function Va(e) {
      return { lane: e, tag: 0, payload: null, callback: null, next: null };
    }
    function Ha(e, t, n) {
      var r = e.updateQueue;
      if (r === null) return null;
      if (((r = r.shared), K & 2)) {
        var i = r.pending;
        return (
          i === null ? (t.next = t) : ((t.next = i.next), (i.next = t)),
          (r.pending = t),
          (t = ii(e)),
          ri(e, null, n),
          t
        );
      }
      return (ei(e, r, t, n), ii(e));
    }
    function Ua(e, t, n) {
      if (((t = t.updateQueue), t !== null && ((t = t.shared), n & 4194048))) {
        var r = t.lanes;
        ((r &= e.pendingLanes), (n |= r), (t.lanes = n), tt(e, n));
      }
    }
    function Wa(e, t) {
      var n = e.updateQueue,
        r = e.alternate;
      if (r !== null && ((r = r.updateQueue), n === r)) {
        var i = null,
          a = null;
        if (((n = n.firstBaseUpdate), n !== null)) {
          do {
            var o = {
              lane: n.lane,
              tag: n.tag,
              payload: n.payload,
              callback: null,
              next: null,
            };
            (a === null ? (i = a = o) : (a = a.next = o), (n = n.next));
          } while (n !== null);
          a === null ? (i = a = t) : (a = a.next = t);
        } else i = a = t;
        ((n = {
          baseState: r.baseState,
          firstBaseUpdate: i,
          lastBaseUpdate: a,
          shared: r.shared,
          callbacks: r.callbacks,
        }),
          (e.updateQueue = n));
        return;
      }
      ((e = n.lastBaseUpdate),
        e === null ? (n.firstBaseUpdate = t) : (e.next = t),
        (n.lastBaseUpdate = t));
    }
    var Ga = !1;
    function Ka() {
      if (Ga) {
        var e = da;
        if (e !== null) throw e;
      }
    }
    function qa(e, t, n, r) {
      Ga = !1;
      var i = e.updateQueue;
      Ra = !1;
      var a = i.firstBaseUpdate,
        o = i.lastBaseUpdate,
        s = i.shared.pending;
      if (s !== null) {
        i.shared.pending = null;
        var c = s,
          l = c.next;
        ((c.next = null), o === null ? (a = l) : (o.next = l), (o = c));
        var u = e.alternate;
        u !== null &&
          ((u = u.updateQueue),
          (s = u.lastBaseUpdate),
          s !== o &&
            (s === null ? (u.firstBaseUpdate = l) : (s.next = l),
            (u.lastBaseUpdate = c)));
      }
      if (a !== null) {
        var d = i.baseState;
        ((o = 0), (u = l = c = null), (s = a));
        do {
          var f = s.lane & -536870913,
            m = f !== s.lane;
          if (m ? (Y & f) === f : (r & f) === f) {
            (f !== 0 && f === ua && (Ga = !0),
              u !== null &&
                (u = u.next =
                  {
                    lane: 0,
                    tag: s.tag,
                    payload: s.payload,
                    callback: null,
                    next: null,
                  }));
            a: {
              var h = e,
                g = s;
              f = t;
              var _ = n;
              switch (g.tag) {
                case 1:
                  if (((h = g.payload), typeof h == `function`)) {
                    d = h.call(_, d, f);
                    break a;
                  }
                  d = h;
                  break a;
                case 3:
                  h.flags = (h.flags & -65537) | 128;
                case 0:
                  if (
                    ((h = g.payload),
                    (f = typeof h == `function` ? h.call(_, d, f) : h),
                    f == null)
                  )
                    break a;
                  d = p({}, d, f);
                  break a;
                case 2:
                  Ra = !0;
              }
            }
            ((f = s.callback),
              f !== null &&
                ((e.flags |= 64),
                m && (e.flags |= 8192),
                (m = i.callbacks),
                m === null ? (i.callbacks = [f]) : m.push(f)));
          } else
            ((m = {
              lane: f,
              tag: s.tag,
              payload: s.payload,
              callback: s.callback,
              next: null,
            }),
              u === null ? ((l = u = m), (c = d)) : (u = u.next = m),
              (o |= f));
          if (((s = s.next), s === null)) {
            if (((s = i.shared.pending), s === null)) break;
            ((m = s),
              (s = m.next),
              (m.next = null),
              (i.lastBaseUpdate = m),
              (i.shared.pending = null));
          }
        } while (1);
        (u === null && (c = d),
          (i.baseState = c),
          (i.firstBaseUpdate = l),
          (i.lastBaseUpdate = u),
          a === null && (i.shared.lanes = 0),
          (Gl |= o),
          (e.lanes = o),
          (e.memoizedState = d));
      }
    }
    function Ja(e, t) {
      if (typeof e != `function`) throw Error(a(191, e));
      e.call(t);
    }
    function Ya(e, t) {
      var n = e.callbacks;
      if (n !== null)
        for (e.callbacks = null, e = 0; e < n.length; e++) Ja(n[e], t);
    }
    var Xa = se(null),
      Za = se(0);
    function Qa(e, t) {
      ((e = Ul), N(Za, e), N(Xa, t), (Ul = e | t.baseLanes));
    }
    function $a() {
      (N(Za, Ul), N(Xa, Xa.current));
    }
    function eo() {
      ((Ul = Za.current), M(Xa), M(Za));
    }
    var to = se(null),
      no = null;
    function ro(e) {
      var t = e.alternate;
      (N(co, co.current & 1),
        N(to, e),
        no === null &&
          (t === null || Xa.current !== null || t.memoizedState !== null) &&
          (no = e));
    }
    function io(e) {
      (N(co, co.current), N(to, e), no === null && (no = e));
    }
    function ao(e) {
      e.tag === 22
        ? (N(co, co.current), N(to, e), no === null && (no = e))
        : oo(e);
    }
    function oo() {
      (N(co, co.current), N(to, to.current));
    }
    function so(e) {
      (M(to), no === e && (no = null), M(co));
    }
    var co = se(0);
    function lo(e) {
      for (var t = e; t !== null; ) {
        if (t.tag === 13) {
          var n = t.memoizedState;
          if (n !== null && ((n = n.dehydrated), n === null || af(n) || of(n)))
            return t;
        } else if (
          t.tag === 19 &&
          (t.memoizedProps.revealOrder === `forwards` ||
            t.memoizedProps.revealOrder === `backwards` ||
            t.memoizedProps.revealOrder === `unstable_legacy-backwards` ||
            t.memoizedProps.revealOrder === `together`)
        ) {
          if (t.flags & 128) return t;
        } else if (t.child !== null) {
          ((t.child.return = t), (t = t.child));
          continue;
        }
        if (t === e) break;
        for (; t.sibling === null; ) {
          if (t.return === null || t.return === e) return null;
          t = t.return;
        }
        ((t.sibling.return = t.return), (t = t.sibling));
      }
      return null;
    }
    var uo = 0,
      H = null,
      U = null,
      fo = null,
      po = !1,
      mo = !1,
      ho = !1,
      go = 0,
      _o = 0,
      vo = null,
      yo = 0;
    function W() {
      throw Error(a(321));
    }
    function bo(e, t) {
      if (t === null) return !1;
      for (var n = 0; n < t.length && n < e.length; n++)
        if (!Sr(e[n], t[n])) return !1;
      return !0;
    }
    function xo(e, t, n, r, i, a) {
      return (
        (uo = a),
        (H = t),
        (t.memoizedState = null),
        (t.updateQueue = null),
        (t.lanes = 0),
        (k.H = e === null || e.memoizedState === null ? Rs : zs),
        (ho = !1),
        (a = n(r, i)),
        (ho = !1),
        mo && (a = Co(t, n, r, i)),
        So(e),
        a
      );
    }
    function So(e) {
      k.H = Ls;
      var t = U !== null && U.next !== null;
      if (((uo = 0), (fo = U = H = null), (po = !1), (_o = 0), (vo = null), t))
        throw Error(a(300));
      e === null ||
        nc ||
        ((e = e.dependencies), e !== null && Zi(e) && (nc = !0));
    }
    function Co(e, t, n, r) {
      H = e;
      var i = 0;
      do {
        if ((mo && (vo = null), (_o = 0), (mo = !1), 25 <= i))
          throw Error(a(301));
        if (((i += 1), (fo = U = null), e.updateQueue != null)) {
          var o = e.updateQueue;
          ((o.lastEffect = null),
            (o.events = null),
            (o.stores = null),
            o.memoCache != null && (o.memoCache.index = 0));
        }
        ((k.H = Bs), (o = t(n, r)));
      } while (mo);
      return o;
    }
    function wo() {
      var e = k.H,
        t = e.useState()[0];
      return (
        (t = typeof t.then == `function` ? jo(t) : t),
        (e = e.useState()[0]),
        (U === null ? null : U.memoizedState) !== e && (H.flags |= 1024),
        t
      );
    }
    function To() {
      var e = go !== 0;
      return ((go = 0), e);
    }
    function Eo(e, t, n) {
      ((t.updateQueue = e.updateQueue), (t.flags &= -2053), (e.lanes &= ~n));
    }
    function Do(e) {
      if (po) {
        for (e = e.memoizedState; e !== null; ) {
          var t = e.queue;
          (t !== null && (t.pending = null), (e = e.next));
        }
        po = !1;
      }
      ((uo = 0), (fo = U = H = null), (mo = !1), (_o = go = 0), (vo = null));
    }
    function Oo() {
      var e = {
        memoizedState: null,
        baseState: null,
        baseQueue: null,
        queue: null,
        next: null,
      };
      return (
        fo === null ? (H.memoizedState = fo = e) : (fo = fo.next = e),
        fo
      );
    }
    function ko() {
      if (U === null) {
        var e = H.alternate;
        e = e === null ? null : e.memoizedState;
      } else e = U.next;
      var t = fo === null ? H.memoizedState : fo.next;
      if (t !== null) ((fo = t), (U = e));
      else {
        if (e === null)
          throw H.alternate === null ? Error(a(467)) : Error(a(310));
        ((U = e),
          (e = {
            memoizedState: U.memoizedState,
            baseState: U.baseState,
            baseQueue: U.baseQueue,
            queue: U.queue,
            next: null,
          }),
          fo === null ? (H.memoizedState = fo = e) : (fo = fo.next = e));
      }
      return fo;
    }
    function Ao() {
      return { lastEffect: null, events: null, stores: null, memoCache: null };
    }
    function jo(e) {
      var t = _o;
      return (
        (_o += 1),
        vo === null && (vo = []),
        (e = Ta(vo, e, t)),
        (t = H),
        (fo === null ? t.memoizedState : fo.next) === null &&
          ((t = t.alternate),
          (k.H = t === null || t.memoizedState === null ? Rs : zs)),
        e
      );
    }
    function Mo(e) {
      if (typeof e == `object` && e) {
        if (typeof e.then == `function`) return jo(e);
        if (e.$$typeof === x) return $i(e);
      }
      throw Error(a(438, String(e)));
    }
    function No(e) {
      var t = null,
        n = H.updateQueue;
      if ((n !== null && (t = n.memoCache), t == null)) {
        var r = H.alternate;
        r !== null &&
          ((r = r.updateQueue),
          r !== null &&
            ((r = r.memoCache),
            r != null &&
              (t = {
                data: r.data.map(function (e) {
                  return e.slice();
                }),
                index: 0,
              })));
      }
      if (
        ((t ??= { data: [], index: 0 }),
        n === null && ((n = Ao()), (H.updateQueue = n)),
        (n.memoCache = t),
        (n = t.data[t.index]),
        n === void 0)
      )
        for (n = t.data[t.index] = Array(e), r = 0; r < e; r++) n[r] = D;
      return (t.index++, n);
    }
    function Po(e, t) {
      return typeof t == `function` ? t(e) : t;
    }
    function Fo(e) {
      return Io(ko(), U, e);
    }
    function Io(e, t, n) {
      var r = e.queue;
      if (r === null) throw Error(a(311));
      r.lastRenderedReducer = n;
      var i = e.baseQueue,
        o = r.pending;
      if (o !== null) {
        if (i !== null) {
          var s = i.next;
          ((i.next = o.next), (o.next = s));
        }
        ((t.baseQueue = i = o), (r.pending = null));
      }
      if (((o = e.baseState), i === null)) e.memoizedState = o;
      else {
        t = i.next;
        var c = (s = null),
          l = null,
          u = t,
          d = !1;
        do {
          var f = u.lane & -536870913;
          if (f === u.lane ? (uo & f) === f : (Y & f) === f) {
            var p = u.revertLane;
            if (p === 0)
              (l !== null &&
                (l = l.next =
                  {
                    lane: 0,
                    revertLane: 0,
                    gesture: null,
                    action: u.action,
                    hasEagerState: u.hasEagerState,
                    eagerState: u.eagerState,
                    next: null,
                  }),
                f === ua && (d = !0));
            else if ((uo & p) === p) {
              ((u = u.next), p === ua && (d = !0));
              continue;
            } else
              ((f = {
                lane: 0,
                revertLane: u.revertLane,
                gesture: null,
                action: u.action,
                hasEagerState: u.hasEagerState,
                eagerState: u.eagerState,
                next: null,
              }),
                l === null ? ((c = l = f), (s = o)) : (l = l.next = f),
                (H.lanes |= p),
                (Gl |= p));
            ((f = u.action),
              ho && n(o, f),
              (o = u.hasEagerState ? u.eagerState : n(o, f)));
          } else
            ((p = {
              lane: f,
              revertLane: u.revertLane,
              gesture: u.gesture,
              action: u.action,
              hasEagerState: u.hasEagerState,
              eagerState: u.eagerState,
              next: null,
            }),
              l === null ? ((c = l = p), (s = o)) : (l = l.next = p),
              (H.lanes |= f),
              (Gl |= f));
          u = u.next;
        } while (u !== null && u !== t);
        if (
          (l === null ? (s = o) : (l.next = c),
          !Sr(o, e.memoizedState) && ((nc = !0), d && ((n = da), n !== null)))
        )
          throw n;
        ((e.memoizedState = o),
          (e.baseState = s),
          (e.baseQueue = l),
          (r.lastRenderedState = o));
      }
      return (i === null && (r.lanes = 0), [e.memoizedState, r.dispatch]);
    }
    function Lo(e) {
      var t = ko(),
        n = t.queue;
      if (n === null) throw Error(a(311));
      n.lastRenderedReducer = e;
      var r = n.dispatch,
        i = n.pending,
        o = t.memoizedState;
      if (i !== null) {
        n.pending = null;
        var s = (i = i.next);
        do ((o = e(o, s.action)), (s = s.next));
        while (s !== i);
        (Sr(o, t.memoizedState) || (nc = !0),
          (t.memoizedState = o),
          t.baseQueue === null && (t.baseState = o),
          (n.lastRenderedState = o));
      }
      return [o, r];
    }
    function Ro(e, t, n) {
      var r = H,
        i = ko(),
        o = V;
      if (o) {
        if (n === void 0) throw Error(a(407));
        n = n();
      } else n = t();
      var s = !Sr((U || i).memoizedState, n);
      if (
        (s && ((i.memoizedState = n), (nc = !0)),
        (i = i.queue),
        ls(Vo.bind(null, r, i, e), [e]),
        i.getSnapshot !== t || s || (fo !== null && fo.memoizedState.tag & 1))
      ) {
        if (
          ((r.flags |= 2048),
          is(9, { destroy: void 0 }, Bo.bind(null, r, i, n, t), null),
          q === null)
        )
          throw Error(a(349));
        o || uo & 127 || zo(r, t, n);
      }
      return n;
    }
    function zo(e, t, n) {
      ((e.flags |= 16384),
        (e = { getSnapshot: t, value: n }),
        (t = H.updateQueue),
        t === null
          ? ((t = Ao()), (H.updateQueue = t), (t.stores = [e]))
          : ((n = t.stores), n === null ? (t.stores = [e]) : n.push(e)));
    }
    function Bo(e, t, n, r) {
      ((t.value = n), (t.getSnapshot = r), Ho(t) && Uo(e));
    }
    function Vo(e, t, n) {
      return n(function () {
        Ho(t) && Uo(e);
      });
    }
    function Ho(e) {
      var t = e.getSnapshot;
      e = e.value;
      try {
        var n = t();
        return !Sr(e, n);
      } catch {
        return !0;
      }
    }
    function Uo(e) {
      var t = ni(e, 2);
      t !== null && hu(t, e, 2);
    }
    function Wo(e) {
      var t = Oo();
      if (typeof e == `function`) {
        var n = e;
        if (((e = n()), ho)) {
          Re(!0);
          try {
            n();
          } finally {
            Re(!1);
          }
        }
      }
      return (
        (t.memoizedState = t.baseState = e),
        (t.queue = {
          pending: null,
          lanes: 0,
          dispatch: null,
          lastRenderedReducer: Po,
          lastRenderedState: e,
        }),
        t
      );
    }
    function Go(e, t, n, r) {
      return ((e.baseState = n), Io(e, U, typeof r == `function` ? r : Po));
    }
    function Ko(e, t, n, r, i) {
      if (Ps(e)) throw Error(a(485));
      if (((e = t.action), e !== null)) {
        var o = {
          payload: i,
          action: e,
          next: null,
          isTransition: !0,
          status: `pending`,
          value: null,
          reason: null,
          listeners: [],
          then: function (e) {
            o.listeners.push(e);
          },
        };
        (k.T === null ? (o.isTransition = !1) : n(!0),
          r(o),
          (n = t.pending),
          n === null
            ? ((o.next = t.pending = o), qo(t, o))
            : ((o.next = n.next), (t.pending = n.next = o)));
      }
    }
    function qo(e, t) {
      var n = t.action,
        r = t.payload,
        i = e.state;
      if (t.isTransition) {
        var a = k.T,
          o = {};
        k.T = o;
        try {
          var s = n(i, r),
            c = k.S;
          (c !== null && c(o, s), Jo(e, t, s));
        } catch (n) {
          Xo(e, t, n);
        } finally {
          (a !== null && o.types !== null && (a.types = o.types), (k.T = a));
        }
      } else
        try {
          ((a = n(i, r)), Jo(e, t, a));
        } catch (n) {
          Xo(e, t, n);
        }
    }
    function Jo(e, t, n) {
      typeof n == `object` && n && typeof n.then == `function`
        ? n.then(
            function (n) {
              Yo(e, t, n);
            },
            function (n) {
              return Xo(e, t, n);
            },
          )
        : Yo(e, t, n);
    }
    function Yo(e, t, n) {
      ((t.status = `fulfilled`),
        (t.value = n),
        Zo(t),
        (e.state = n),
        (t = e.pending),
        t !== null &&
          ((n = t.next),
          n === t
            ? (e.pending = null)
            : ((n = n.next), (t.next = n), qo(e, n))));
    }
    function Xo(e, t, n) {
      var r = e.pending;
      if (((e.pending = null), r !== null)) {
        r = r.next;
        do ((t.status = `rejected`), (t.reason = n), Zo(t), (t = t.next));
        while (t !== r);
      }
      e.action = null;
    }
    function Zo(e) {
      e = e.listeners;
      for (var t = 0; t < e.length; t++) (0, e[t])();
    }
    function Qo(e, t) {
      return t;
    }
    function $o(e, t) {
      if (V) {
        var n = q.formState;
        if (n !== null) {
          a: {
            var r = H;
            if (V) {
              if (B) {
                b: {
                  for (var i = B, a = Pi; i.nodeType !== 8; ) {
                    if (!a) {
                      i = null;
                      break b;
                    }
                    if (((i = cf(i.nextSibling)), i === null)) {
                      i = null;
                      break b;
                    }
                  }
                  ((a = i.data), (i = a === `F!` || a === `F` ? i : null));
                }
                if (i) {
                  ((B = cf(i.nextSibling)), (r = i.data === `F!`));
                  break a;
                }
              }
              Ii(r);
            }
            r = !1;
          }
          r && (t = n[0]);
        }
      }
      return (
        (n = Oo()),
        (n.memoizedState = n.baseState = t),
        (r = {
          pending: null,
          lanes: 0,
          dispatch: null,
          lastRenderedReducer: Qo,
          lastRenderedState: t,
        }),
        (n.queue = r),
        (n = js.bind(null, H, r)),
        (r.dispatch = n),
        (r = Wo(!1)),
        (a = Ns.bind(null, H, !1, r.queue)),
        (r = Oo()),
        (i = { state: t, dispatch: null, action: e, pending: null }),
        (r.queue = i),
        (n = Ko.bind(null, H, i, a, n)),
        (i.dispatch = n),
        (r.memoizedState = e),
        [t, n, !1]
      );
    }
    function es(e) {
      return ts(ko(), U, e);
    }
    function ts(e, t, n) {
      if (
        ((t = Io(e, t, Qo)[0]),
        (e = Fo(Po)[0]),
        typeof t == `object` && t && typeof t.then == `function`)
      )
        try {
          var r = jo(t);
        } catch (e) {
          throw e === ba ? Sa : e;
        }
      else r = t;
      t = ko();
      var i = t.queue,
        a = i.dispatch;
      return (
        n !== t.memoizedState &&
          ((H.flags |= 2048),
          is(9, { destroy: void 0 }, ns.bind(null, i, n), null)),
        [r, a, e]
      );
    }
    function ns(e, t) {
      e.action = t;
    }
    function rs(e) {
      var t = ko(),
        n = U;
      if (n !== null) return ts(t, n, e);
      (ko(), (t = t.memoizedState), (n = ko()));
      var r = n.queue.dispatch;
      return ((n.memoizedState = e), [t, r, !1]);
    }
    function is(e, t, n, r) {
      return (
        (e = { tag: e, create: n, deps: r, inst: t, next: null }),
        (t = H.updateQueue),
        t === null && ((t = Ao()), (H.updateQueue = t)),
        (n = t.lastEffect),
        n === null
          ? (t.lastEffect = e.next = e)
          : ((r = n.next), (n.next = e), (e.next = r), (t.lastEffect = e)),
        e
      );
    }
    function as() {
      return ko().memoizedState;
    }
    function os(e, t, n, r) {
      var i = Oo();
      ((H.flags |= e),
        (i.memoizedState = is(
          1 | t,
          { destroy: void 0 },
          n,
          r === void 0 ? null : r,
        )));
    }
    function ss(e, t, n, r) {
      var i = ko();
      r = r === void 0 ? null : r;
      var a = i.memoizedState.inst;
      U !== null && r !== null && bo(r, U.memoizedState.deps)
        ? (i.memoizedState = is(t, a, n, r))
        : ((H.flags |= e), (i.memoizedState = is(1 | t, a, n, r)));
    }
    function cs(e, t) {
      os(8390656, 8, e, t);
    }
    function ls(e, t) {
      ss(2048, 8, e, t);
    }
    function us(e) {
      H.flags |= 4;
      var t = H.updateQueue;
      if (t === null) ((t = Ao()), (H.updateQueue = t), (t.events = [e]));
      else {
        var n = t.events;
        n === null ? (t.events = [e]) : n.push(e);
      }
    }
    function ds(e) {
      var t = ko().memoizedState;
      return (
        us({ ref: t, nextImpl: e }),
        function () {
          if (K & 2) throw Error(a(440));
          return t.impl.apply(void 0, arguments);
        }
      );
    }
    function fs(e, t) {
      return ss(4, 2, e, t);
    }
    function ps(e, t) {
      return ss(4, 4, e, t);
    }
    function ms(e, t) {
      if (typeof t == `function`) {
        e = e();
        var n = t(e);
        return function () {
          typeof n == `function` ? n() : t(null);
        };
      }
      if (t != null)
        return (
          (e = e()),
          (t.current = e),
          function () {
            t.current = null;
          }
        );
    }
    function hs(e, t, n) {
      ((n = n == null ? null : n.concat([e])),
        ss(4, 4, ms.bind(null, t, e), n));
    }
    function gs() {}
    function _s(e, t) {
      var n = ko();
      t = t === void 0 ? null : t;
      var r = n.memoizedState;
      return t !== null && bo(t, r[1]) ? r[0] : ((n.memoizedState = [e, t]), e);
    }
    function vs(e, t) {
      var n = ko();
      t = t === void 0 ? null : t;
      var r = n.memoizedState;
      if (t !== null && bo(t, r[1])) return r[0];
      if (((r = e()), ho)) {
        Re(!0);
        try {
          e();
        } finally {
          Re(!1);
        }
      }
      return ((n.memoizedState = [r, t]), r);
    }
    function ys(e, t, n) {
      return n === void 0 || (uo & 1073741824 && !(Y & 261930))
        ? (e.memoizedState = t)
        : ((e.memoizedState = n), (e = mu()), (H.lanes |= e), (Gl |= e), n);
    }
    function bs(e, t, n, r) {
      return Sr(n, t)
        ? n
        : Xa.current === null
          ? !(uo & 42) || (uo & 1073741824 && !(Y & 261930))
            ? ((nc = !0), (e.memoizedState = n))
            : ((e = mu()), (H.lanes |= e), (Gl |= e), t)
          : ((e = ys(e, n, r)), Sr(e, t) || (nc = !0), e);
    }
    function xs(e, t, n, r, i) {
      var a = A.p;
      A.p = a !== 0 && 8 > a ? a : 8;
      var o = k.T,
        s = {};
      ((k.T = s), Ns(e, !1, t, n));
      try {
        var c = i(),
          l = k.S;
        (l !== null && l(s, c),
          typeof c == `object` && c && typeof c.then == `function`
            ? Ms(e, t, ma(c, r), pu(e))
            : Ms(e, t, r, pu(e)));
      } catch (n) {
        Ms(e, t, { then: function () {}, status: `rejected`, reason: n }, pu());
      } finally {
        ((A.p = a),
          o !== null && s.types !== null && (o.types = s.types),
          (k.T = o));
      }
    }
    function Ss() {}
    function Cs(e, t, n, r) {
      if (e.tag !== 5) throw Error(a(476));
      var i = ws(e).queue;
      xs(
        e,
        i,
        t,
        j,
        n === null
          ? Ss
          : function () {
              return (Ts(e), n(r));
            },
      );
    }
    function ws(e) {
      var t = e.memoizedState;
      if (t !== null) return t;
      t = {
        memoizedState: j,
        baseState: j,
        baseQueue: null,
        queue: {
          pending: null,
          lanes: 0,
          dispatch: null,
          lastRenderedReducer: Po,
          lastRenderedState: j,
        },
        next: null,
      };
      var n = {};
      return (
        (t.next = {
          memoizedState: n,
          baseState: n,
          baseQueue: null,
          queue: {
            pending: null,
            lanes: 0,
            dispatch: null,
            lastRenderedReducer: Po,
            lastRenderedState: n,
          },
          next: null,
        }),
        (e.memoizedState = t),
        (e = e.alternate),
        e !== null && (e.memoizedState = t),
        t
      );
    }
    function Ts(e) {
      var t = ws(e);
      (t.next === null && (t = e.alternate.memoizedState),
        Ms(e, t.next.queue, {}, pu()));
    }
    function Es() {
      return $i(Qf);
    }
    function Ds() {
      return ko().memoizedState;
    }
    function Os() {
      return ko().memoizedState;
    }
    function ks(e) {
      for (var t = e.return; t !== null; ) {
        switch (t.tag) {
          case 24:
          case 3:
            var n = pu();
            e = Va(n);
            var r = Ha(t, e, n);
            (r !== null && (hu(r, t, n), Ua(r, t, n)),
              (t = { cache: oa() }),
              (e.payload = t));
            return;
        }
        t = t.return;
      }
    }
    function As(e, t, n) {
      var r = pu();
      ((n = {
        lane: r,
        revertLane: 0,
        gesture: null,
        action: n,
        hasEagerState: !1,
        eagerState: null,
        next: null,
      }),
        Ps(e)
          ? Fs(t, n)
          : ((n = ti(e, t, n, r)), n !== null && (hu(n, e, r), Is(n, t, r))));
    }
    function js(e, t, n) {
      Ms(e, t, n, pu());
    }
    function Ms(e, t, n, r) {
      var i = {
        lane: r,
        revertLane: 0,
        gesture: null,
        action: n,
        hasEagerState: !1,
        eagerState: null,
        next: null,
      };
      if (Ps(e)) Fs(t, i);
      else {
        var a = e.alternate;
        if (
          e.lanes === 0 &&
          (a === null || a.lanes === 0) &&
          ((a = t.lastRenderedReducer), a !== null)
        )
          try {
            var o = t.lastRenderedState,
              s = a(o, n);
            if (((i.hasEagerState = !0), (i.eagerState = s), Sr(s, o)))
              return (ei(e, t, i, 0), q === null && $r(), !1);
          } catch {}
        if (((n = ti(e, t, i, r)), n !== null))
          return (hu(n, e, r), Is(n, t, r), !0);
      }
      return !1;
    }
    function Ns(e, t, n, r) {
      if (
        ((r = {
          lane: 2,
          revertLane: dd(),
          gesture: null,
          action: r,
          hasEagerState: !1,
          eagerState: null,
          next: null,
        }),
        Ps(e))
      ) {
        if (t) throw Error(a(479));
      } else ((t = ti(e, n, r, 2)), t !== null && hu(t, e, 2));
    }
    function Ps(e) {
      var t = e.alternate;
      return e === H || (t !== null && t === H);
    }
    function Fs(e, t) {
      mo = po = !0;
      var n = e.pending;
      (n === null ? (t.next = t) : ((t.next = n.next), (n.next = t)),
        (e.pending = t));
    }
    function Is(e, t, n) {
      if (n & 4194048) {
        var r = t.lanes;
        ((r &= e.pendingLanes), (n |= r), (t.lanes = n), tt(e, n));
      }
    }
    var Ls = {
      readContext: $i,
      use: Mo,
      useCallback: W,
      useContext: W,
      useEffect: W,
      useImperativeHandle: W,
      useLayoutEffect: W,
      useInsertionEffect: W,
      useMemo: W,
      useReducer: W,
      useRef: W,
      useState: W,
      useDebugValue: W,
      useDeferredValue: W,
      useTransition: W,
      useSyncExternalStore: W,
      useId: W,
      useHostTransitionStatus: W,
      useFormState: W,
      useActionState: W,
      useOptimistic: W,
      useMemoCache: W,
      useCacheRefresh: W,
    };
    Ls.useEffectEvent = W;
    var Rs = {
        readContext: $i,
        use: Mo,
        useCallback: function (e, t) {
          return ((Oo().memoizedState = [e, t === void 0 ? null : t]), e);
        },
        useContext: $i,
        useEffect: cs,
        useImperativeHandle: function (e, t, n) {
          ((n = n == null ? null : n.concat([e])),
            os(4194308, 4, ms.bind(null, t, e), n));
        },
        useLayoutEffect: function (e, t) {
          return os(4194308, 4, e, t);
        },
        useInsertionEffect: function (e, t) {
          os(4, 2, e, t);
        },
        useMemo: function (e, t) {
          var n = Oo();
          t = t === void 0 ? null : t;
          var r = e();
          if (ho) {
            Re(!0);
            try {
              e();
            } finally {
              Re(!1);
            }
          }
          return ((n.memoizedState = [r, t]), r);
        },
        useReducer: function (e, t, n) {
          var r = Oo();
          if (n !== void 0) {
            var i = n(t);
            if (ho) {
              Re(!0);
              try {
                n(t);
              } finally {
                Re(!1);
              }
            }
          } else i = t;
          return (
            (r.memoizedState = r.baseState = i),
            (e = {
              pending: null,
              lanes: 0,
              dispatch: null,
              lastRenderedReducer: e,
              lastRenderedState: i,
            }),
            (r.queue = e),
            (e = e.dispatch = As.bind(null, H, e)),
            [r.memoizedState, e]
          );
        },
        useRef: function (e) {
          var t = Oo();
          return ((e = { current: e }), (t.memoizedState = e));
        },
        useState: function (e) {
          e = Wo(e);
          var t = e.queue,
            n = js.bind(null, H, t);
          return ((t.dispatch = n), [e.memoizedState, n]);
        },
        useDebugValue: gs,
        useDeferredValue: function (e, t) {
          return ys(Oo(), e, t);
        },
        useTransition: function () {
          var e = Wo(!1);
          return (
            (e = xs.bind(null, H, e.queue, !0, !1)),
            (Oo().memoizedState = e),
            [!1, e]
          );
        },
        useSyncExternalStore: function (e, t, n) {
          var r = H,
            i = Oo();
          if (V) {
            if (n === void 0) throw Error(a(407));
            n = n();
          } else {
            if (((n = t()), q === null)) throw Error(a(349));
            Y & 127 || zo(r, t, n);
          }
          i.memoizedState = n;
          var o = { value: n, getSnapshot: t };
          return (
            (i.queue = o),
            cs(Vo.bind(null, r, o, e), [e]),
            (r.flags |= 2048),
            is(9, { destroy: void 0 }, Bo.bind(null, r, o, n, t), null),
            n
          );
        },
        useId: function () {
          var e = Oo(),
            t = q.identifierPrefix;
          if (V) {
            var n = Ei,
              r = Ti;
            ((n = (r & ~(1 << (32 - ze(r) - 1))).toString(32) + n),
              (t = `_` + t + `R_` + n),
              (n = go++),
              0 < n && (t += `H` + n.toString(32)),
              (t += `_`));
          } else ((n = yo++), (t = `_` + t + `r_` + n.toString(32) + `_`));
          return (e.memoizedState = t);
        },
        useHostTransitionStatus: Es,
        useFormState: $o,
        useActionState: $o,
        useOptimistic: function (e) {
          var t = Oo();
          t.memoizedState = t.baseState = e;
          var n = {
            pending: null,
            lanes: 0,
            dispatch: null,
            lastRenderedReducer: null,
            lastRenderedState: null,
          };
          return (
            (t.queue = n),
            (t = Ns.bind(null, H, !0, n)),
            (n.dispatch = t),
            [e, t]
          );
        },
        useMemoCache: No,
        useCacheRefresh: function () {
          return (Oo().memoizedState = ks.bind(null, H));
        },
        useEffectEvent: function (e) {
          var t = Oo(),
            n = { impl: e };
          return (
            (t.memoizedState = n),
            function () {
              if (K & 2) throw Error(a(440));
              return n.impl.apply(void 0, arguments);
            }
          );
        },
      },
      zs = {
        readContext: $i,
        use: Mo,
        useCallback: _s,
        useContext: $i,
        useEffect: ls,
        useImperativeHandle: hs,
        useInsertionEffect: fs,
        useLayoutEffect: ps,
        useMemo: vs,
        useReducer: Fo,
        useRef: as,
        useState: function () {
          return Fo(Po);
        },
        useDebugValue: gs,
        useDeferredValue: function (e, t) {
          return bs(ko(), U.memoizedState, e, t);
        },
        useTransition: function () {
          var e = Fo(Po)[0],
            t = ko().memoizedState;
          return [typeof e == `boolean` ? e : jo(e), t];
        },
        useSyncExternalStore: Ro,
        useId: Ds,
        useHostTransitionStatus: Es,
        useFormState: es,
        useActionState: es,
        useOptimistic: function (e, t) {
          return Go(ko(), U, e, t);
        },
        useMemoCache: No,
        useCacheRefresh: Os,
      };
    zs.useEffectEvent = ds;
    var Bs = {
      readContext: $i,
      use: Mo,
      useCallback: _s,
      useContext: $i,
      useEffect: ls,
      useImperativeHandle: hs,
      useInsertionEffect: fs,
      useLayoutEffect: ps,
      useMemo: vs,
      useReducer: Lo,
      useRef: as,
      useState: function () {
        return Lo(Po);
      },
      useDebugValue: gs,
      useDeferredValue: function (e, t) {
        var n = ko();
        return U === null ? ys(n, e, t) : bs(n, U.memoizedState, e, t);
      },
      useTransition: function () {
        var e = Lo(Po)[0],
          t = ko().memoizedState;
        return [typeof e == `boolean` ? e : jo(e), t];
      },
      useSyncExternalStore: Ro,
      useId: Ds,
      useHostTransitionStatus: Es,
      useFormState: rs,
      useActionState: rs,
      useOptimistic: function (e, t) {
        var n = ko();
        return U === null
          ? ((n.baseState = e), [e, n.queue.dispatch])
          : Go(n, U, e, t);
      },
      useMemoCache: No,
      useCacheRefresh: Os,
    };
    Bs.useEffectEvent = ds;
    function Vs(e, t, n, r) {
      ((t = e.memoizedState),
        (n = n(r, t)),
        (n = n == null ? t : p({}, t, n)),
        (e.memoizedState = n),
        e.lanes === 0 && (e.updateQueue.baseState = n));
    }
    var Hs = {
      enqueueSetState: function (e, t, n) {
        e = e._reactInternals;
        var r = pu(),
          i = Va(r);
        ((i.payload = t),
          n != null && (i.callback = n),
          (t = Ha(e, i, r)),
          t !== null && (hu(t, e, r), Ua(t, e, r)));
      },
      enqueueReplaceState: function (e, t, n) {
        e = e._reactInternals;
        var r = pu(),
          i = Va(r);
        ((i.tag = 1),
          (i.payload = t),
          n != null && (i.callback = n),
          (t = Ha(e, i, r)),
          t !== null && (hu(t, e, r), Ua(t, e, r)));
      },
      enqueueForceUpdate: function (e, t) {
        e = e._reactInternals;
        var n = pu(),
          r = Va(n);
        ((r.tag = 2),
          t != null && (r.callback = t),
          (t = Ha(e, r, n)),
          t !== null && (hu(t, e, n), Ua(t, e, n)));
      },
    };
    function Us(e, t, n, r, i, a, o) {
      return (
        (e = e.stateNode),
        typeof e.shouldComponentUpdate == `function`
          ? e.shouldComponentUpdate(r, a, o)
          : t.prototype && t.prototype.isPureReactComponent
            ? !Cr(n, r) || !Cr(i, a)
            : !0
      );
    }
    function Ws(e, t, n, r) {
      ((e = t.state),
        typeof t.componentWillReceiveProps == `function` &&
          t.componentWillReceiveProps(n, r),
        typeof t.UNSAFE_componentWillReceiveProps == `function` &&
          t.UNSAFE_componentWillReceiveProps(n, r),
        t.state !== e && Hs.enqueueReplaceState(t, t.state, null));
    }
    function Gs(e, t) {
      var n = t;
      if (`ref` in t) for (var r in ((n = {}), t)) r !== `ref` && (n[r] = t[r]);
      if ((e = e.defaultProps))
        for (var i in (n === t && (n = p({}, n)), e))
          n[i] === void 0 && (n[i] = e[i]);
      return n;
    }
    function Ks(e) {
      Yr(e);
    }
    function qs(e) {
      console.error(e);
    }
    function Js(e) {
      Yr(e);
    }
    function Ys(e, t) {
      try {
        var n = e.onUncaughtError;
        n(t.value, { componentStack: t.stack });
      } catch (e) {
        setTimeout(function () {
          throw e;
        });
      }
    }
    function Xs(e, t, n) {
      try {
        var r = e.onCaughtError;
        r(n.value, {
          componentStack: n.stack,
          errorBoundary: t.tag === 1 ? t.stateNode : null,
        });
      } catch (e) {
        setTimeout(function () {
          throw e;
        });
      }
    }
    function Zs(e, t, n) {
      return (
        (n = Va(n)),
        (n.tag = 3),
        (n.payload = { element: null }),
        (n.callback = function () {
          Ys(e, t);
        }),
        n
      );
    }
    function Qs(e) {
      return ((e = Va(e)), (e.tag = 3), e);
    }
    function $s(e, t, n, r) {
      var i = n.type.getDerivedStateFromError;
      if (typeof i == `function`) {
        var a = r.value;
        ((e.payload = function () {
          return i(a);
        }),
          (e.callback = function () {
            Xs(t, n, r);
          }));
      }
      var o = n.stateNode;
      o !== null &&
        typeof o.componentDidCatch == `function` &&
        (e.callback = function () {
          (Xs(t, n, r),
            typeof i != `function` &&
              (ru === null ? (ru = new Set([this])) : ru.add(this)));
          var e = r.stack;
          this.componentDidCatch(r.value, {
            componentStack: e === null ? `` : e,
          });
        });
    }
    function ec(e, t, n, r, i) {
      if (
        ((n.flags |= 32768),
        typeof r == `object` && r && typeof r.then == `function`)
      ) {
        if (
          ((t = n.alternate),
          t !== null && Xi(t, n, i, !0),
          (n = to.current),
          n !== null)
        ) {
          switch (n.tag) {
            case 31:
            case 13:
              return (
                no === null
                  ? Du()
                  : n.alternate === null && Wl === 0 && (Wl = 3),
                (n.flags &= -257),
                (n.flags |= 65536),
                (n.lanes = i),
                r === Ca
                  ? (n.flags |= 16384)
                  : ((t = n.updateQueue),
                    t === null ? (n.updateQueue = new Set([r])) : t.add(r),
                    Gu(e, r, i)),
                !1
              );
            case 22:
              return (
                (n.flags |= 65536),
                r === Ca
                  ? (n.flags |= 16384)
                  : ((t = n.updateQueue),
                    t === null
                      ? ((t = {
                          transitions: null,
                          markerInstances: null,
                          retryQueue: new Set([r]),
                        }),
                        (n.updateQueue = t))
                      : ((n = t.retryQueue),
                        n === null ? (t.retryQueue = new Set([r])) : n.add(r)),
                    Gu(e, r, i)),
                !1
              );
          }
          throw Error(a(435, n.tag));
        }
        return (Gu(e, r, i), Du(), !1);
      }
      if (V)
        return (
          (t = to.current),
          t === null
            ? (r !== Fi && ((t = Error(a(423), { cause: r })), Hi(_i(t, n))),
              (e = e.current.alternate),
              (e.flags |= 65536),
              (i &= -i),
              (e.lanes |= i),
              (r = _i(r, n)),
              (i = Zs(e.stateNode, r, i)),
              Wa(e, i),
              Wl !== 4 && (Wl = 2))
            : (!(t.flags & 65536) && (t.flags |= 256),
              (t.flags |= 65536),
              (t.lanes = i),
              r !== Fi && ((e = Error(a(422), { cause: r })), Hi(_i(e, n)))),
          !1
        );
      var o = Error(a(520), { cause: r });
      if (
        ((o = _i(o, n)),
        Xl === null ? (Xl = [o]) : Xl.push(o),
        Wl !== 4 && (Wl = 2),
        t === null)
      )
        return !0;
      ((r = _i(r, n)), (n = t));
      do {
        switch (n.tag) {
          case 3:
            return (
              (n.flags |= 65536),
              (e = i & -i),
              (n.lanes |= e),
              (e = Zs(n.stateNode, r, e)),
              Wa(n, e),
              !1
            );
          case 1:
            if (
              ((t = n.type),
              (o = n.stateNode),
              !(n.flags & 128) &&
                (typeof t.getDerivedStateFromError == `function` ||
                  (o !== null &&
                    typeof o.componentDidCatch == `function` &&
                    (ru === null || !ru.has(o)))))
            )
              return (
                (n.flags |= 65536),
                (i &= -i),
                (n.lanes |= i),
                (i = Qs(i)),
                $s(i, e, n, r),
                Wa(n, i),
                !1
              );
        }
        n = n.return;
      } while (n !== null);
      return !1;
    }
    var tc = Error(a(461)),
      nc = !1;
    function rc(e, t, n, r) {
      t.child = e === null ? La(t, null, n, r) : Ia(t, e.child, n, r);
    }
    function ic(e, t, n, r, i) {
      n = n.render;
      var a = t.ref;
      if (`ref` in r) {
        var o = {};
        for (var s in r) s !== `ref` && (o[s] = r[s]);
      } else o = r;
      return (
        Qi(t),
        (r = xo(e, t, n, o, a, i)),
        (s = To()),
        e !== null && !nc
          ? (Eo(e, t, i), Oc(e, t, i))
          : (V && s && ki(t), (t.flags |= 1), rc(e, t, r, i), t.child)
      );
    }
    function ac(e, t, n, r, i) {
      if (e === null) {
        var a = n.type;
        return typeof a == `function` &&
          !ci(a) &&
          a.defaultProps === void 0 &&
          n.compare === null
          ? ((t.tag = 15), (t.type = a), oc(e, t, a, r, i))
          : ((e = di(n.type, null, r, t, t.mode, i)),
            (e.ref = t.ref),
            (e.return = t),
            (t.child = e));
      }
      if (((a = e.child), !kc(e, i))) {
        var o = a.memoizedProps;
        if (
          ((n = n.compare),
          (n = n === null ? Cr : n),
          n(o, r) && e.ref === t.ref)
        )
          return Oc(e, t, i);
      }
      return (
        (t.flags |= 1),
        (e = li(a, r)),
        (e.ref = t.ref),
        (e.return = t),
        (t.child = e)
      );
    }
    function oc(e, t, n, r, i) {
      if (e !== null) {
        var a = e.memoizedProps;
        if (Cr(a, r) && e.ref === t.ref)
          if (((nc = !1), (t.pendingProps = r = a), kc(e, i)))
            e.flags & 131072 && (nc = !0);
          else return ((t.lanes = e.lanes), Oc(e, t, i));
      }
      return mc(e, t, n, r, i);
    }
    function sc(e, t, n, r) {
      var i = r.children,
        a = e === null ? null : e.memoizedState;
      if (
        (e === null &&
          t.stateNode === null &&
          (t.stateNode = {
            _visibility: 1,
            _pendingMarkers: null,
            _retryCache: null,
            _transitions: null,
          }),
        r.mode === `hidden`)
      ) {
        if (t.flags & 128) {
          if (((a = a === null ? n : a.baseLanes | n), e !== null)) {
            for (r = t.child = e.child, i = 0; r !== null; )
              ((i = i | r.lanes | r.childLanes), (r = r.sibling));
            r = i & ~a;
          } else ((r = 0), (t.child = null));
          return lc(e, t, a, n, r);
        }
        if (n & 536870912)
          ((t.memoizedState = { baseLanes: 0, cachePool: null }),
            e !== null && va(t, a === null ? null : a.cachePool),
            a === null ? $a() : Qa(t, a),
            ao(t));
        else
          return (
            (r = t.lanes = 536870912),
            lc(e, t, a === null ? n : a.baseLanes | n, n, r)
          );
      } else
        a === null
          ? (e !== null && va(t, null), $a(), oo(t))
          : (va(t, a.cachePool), Qa(t, a), oo(t), (t.memoizedState = null));
      return (rc(e, t, i, n), t.child);
    }
    function cc(e, t) {
      return (
        (e !== null && e.tag === 22) ||
          t.stateNode !== null ||
          (t.stateNode = {
            _visibility: 1,
            _pendingMarkers: null,
            _retryCache: null,
            _transitions: null,
          }),
        t.sibling
      );
    }
    function lc(e, t, n, r, i) {
      var a = _a();
      return (
        (a = a === null ? null : { parent: aa._currentValue, pool: a }),
        (t.memoizedState = { baseLanes: n, cachePool: a }),
        e !== null && va(t, null),
        $a(),
        ao(t),
        e !== null && Xi(e, t, r, !0),
        (t.childLanes = i),
        null
      );
    }
    function uc(e, t) {
      return (
        (t = Cc({ mode: t.mode, children: t.children }, e.mode)),
        (t.ref = e.ref),
        (e.child = t),
        (t.return = e),
        t
      );
    }
    function dc(e, t, n) {
      return (
        Ia(t, e.child, null, n),
        (e = uc(t, t.pendingProps)),
        (e.flags |= 2),
        so(t),
        (t.memoizedState = null),
        e
      );
    }
    function fc(e, t, n) {
      var r = t.pendingProps,
        i = (t.flags & 128) != 0;
      if (((t.flags &= -129), e === null)) {
        if (V) {
          if (r.mode === `hidden`)
            return ((e = uc(t, r)), (t.lanes = 536870912), cc(null, e));
          if (
            (io(t),
            (e = B)
              ? ((e = rf(e, Pi)),
                (e = e !== null && e.data === `&` ? e : null),
                e !== null &&
                  ((t.memoizedState = {
                    dehydrated: e,
                    treeContext: wi === null ? null : { id: Ti, overflow: Ei },
                    retryLane: 536870912,
                    hydrationErrors: null,
                  }),
                  (n = mi(e)),
                  (n.return = t),
                  (t.child = n),
                  (Mi = t),
                  (B = null)))
              : (e = null),
            e === null)
          )
            throw Ii(t);
          return ((t.lanes = 536870912), null);
        }
        return uc(t, r);
      }
      var o = e.memoizedState;
      if (o !== null) {
        var s = o.dehydrated;
        if ((io(t), i))
          if (t.flags & 256) ((t.flags &= -257), (t = dc(e, t, n)));
          else if (t.memoizedState !== null)
            ((t.child = e.child), (t.flags |= 128), (t = null));
          else throw Error(a(558));
        else if (
          (nc || Xi(e, t, n, !1), (i = (n & e.childLanes) !== 0), nc || i)
        ) {
          if (
            ((r = q),
            r !== null && ((s = nt(r, n)), s !== 0 && s !== o.retryLane))
          )
            throw ((o.retryLane = s), ni(e, s), hu(r, e, s), tc);
          (Du(), (t = dc(e, t, n)));
        } else
          ((e = o.treeContext),
            (B = cf(s.nextSibling)),
            (Mi = t),
            (V = !0),
            (Ni = null),
            (Pi = !1),
            e !== null && ji(t, e),
            (t = uc(t, r)),
            (t.flags |= 4096));
        return t;
      }
      return (
        (e = li(e.child, { mode: r.mode, children: r.children })),
        (e.ref = t.ref),
        (t.child = e),
        (e.return = t),
        e
      );
    }
    function pc(e, t) {
      var n = t.ref;
      if (n === null) e !== null && e.ref !== null && (t.flags |= 4194816);
      else {
        if (typeof n != `function` && typeof n != `object`) throw Error(a(284));
        (e === null || e.ref !== n) && (t.flags |= 4194816);
      }
    }
    function mc(e, t, n, r, i) {
      return (
        Qi(t),
        (n = xo(e, t, n, r, void 0, i)),
        (r = To()),
        e !== null && !nc
          ? (Eo(e, t, i), Oc(e, t, i))
          : (V && r && ki(t), (t.flags |= 1), rc(e, t, n, i), t.child)
      );
    }
    function hc(e, t, n, r, i, a) {
      return (
        Qi(t),
        (t.updateQueue = null),
        (n = Co(t, r, n, i)),
        So(e),
        (r = To()),
        e !== null && !nc
          ? (Eo(e, t, a), Oc(e, t, a))
          : (V && r && ki(t), (t.flags |= 1), rc(e, t, n, a), t.child)
      );
    }
    function gc(e, t, n, r, i) {
      if ((Qi(t), t.stateNode === null)) {
        var a = ai,
          o = n.contextType;
        (typeof o == `object` && o && (a = $i(o)),
          (a = new n(r, a)),
          (t.memoizedState =
            a.state !== null && a.state !== void 0 ? a.state : null),
          (a.updater = Hs),
          (t.stateNode = a),
          (a._reactInternals = t),
          (a = t.stateNode),
          (a.props = r),
          (a.state = t.memoizedState),
          (a.refs = {}),
          za(t),
          (o = n.contextType),
          (a.context = typeof o == `object` && o ? $i(o) : ai),
          (a.state = t.memoizedState),
          (o = n.getDerivedStateFromProps),
          typeof o == `function` &&
            (Vs(t, n, o, r), (a.state = t.memoizedState)),
          typeof n.getDerivedStateFromProps == `function` ||
            typeof a.getSnapshotBeforeUpdate == `function` ||
            (typeof a.UNSAFE_componentWillMount != `function` &&
              typeof a.componentWillMount != `function`) ||
            ((o = a.state),
            typeof a.componentWillMount == `function` && a.componentWillMount(),
            typeof a.UNSAFE_componentWillMount == `function` &&
              a.UNSAFE_componentWillMount(),
            o !== a.state && Hs.enqueueReplaceState(a, a.state, null),
            qa(t, r, a, i),
            Ka(),
            (a.state = t.memoizedState)),
          typeof a.componentDidMount == `function` && (t.flags |= 4194308),
          (r = !0));
      } else if (e === null) {
        a = t.stateNode;
        var s = t.memoizedProps,
          c = Gs(n, s);
        a.props = c;
        var l = a.context,
          u = n.contextType;
        ((o = ai), typeof u == `object` && u && (o = $i(u)));
        var d = n.getDerivedStateFromProps;
        ((u =
          typeof d == `function` ||
          typeof a.getSnapshotBeforeUpdate == `function`),
          (s = t.pendingProps !== s),
          u ||
            (typeof a.UNSAFE_componentWillReceiveProps != `function` &&
              typeof a.componentWillReceiveProps != `function`) ||
            ((s || l !== o) && Ws(t, a, r, o)),
          (Ra = !1));
        var f = t.memoizedState;
        ((a.state = f),
          qa(t, r, a, i),
          Ka(),
          (l = t.memoizedState),
          s || f !== l || Ra
            ? (typeof d == `function` &&
                (Vs(t, n, d, r), (l = t.memoizedState)),
              (c = Ra || Us(t, n, c, r, f, l, o))
                ? (u ||
                    (typeof a.UNSAFE_componentWillMount != `function` &&
                      typeof a.componentWillMount != `function`) ||
                    (typeof a.componentWillMount == `function` &&
                      a.componentWillMount(),
                    typeof a.UNSAFE_componentWillMount == `function` &&
                      a.UNSAFE_componentWillMount()),
                  typeof a.componentDidMount == `function` &&
                    (t.flags |= 4194308))
                : (typeof a.componentDidMount == `function` &&
                    (t.flags |= 4194308),
                  (t.memoizedProps = r),
                  (t.memoizedState = l)),
              (a.props = r),
              (a.state = l),
              (a.context = o),
              (r = c))
            : (typeof a.componentDidMount == `function` && (t.flags |= 4194308),
              (r = !1)));
      } else {
        ((a = t.stateNode),
          Ba(e, t),
          (o = t.memoizedProps),
          (u = Gs(n, o)),
          (a.props = u),
          (d = t.pendingProps),
          (f = a.context),
          (l = n.contextType),
          (c = ai),
          typeof l == `object` && l && (c = $i(l)),
          (s = n.getDerivedStateFromProps),
          (l =
            typeof s == `function` ||
            typeof a.getSnapshotBeforeUpdate == `function`) ||
            (typeof a.UNSAFE_componentWillReceiveProps != `function` &&
              typeof a.componentWillReceiveProps != `function`) ||
            ((o !== d || f !== c) && Ws(t, a, r, c)),
          (Ra = !1),
          (f = t.memoizedState),
          (a.state = f),
          qa(t, r, a, i),
          Ka());
        var p = t.memoizedState;
        o !== d ||
        f !== p ||
        Ra ||
        (e !== null && e.dependencies !== null && Zi(e.dependencies))
          ? (typeof s == `function` && (Vs(t, n, s, r), (p = t.memoizedState)),
            (u =
              Ra ||
              Us(t, n, u, r, f, p, c) ||
              (e !== null && e.dependencies !== null && Zi(e.dependencies)))
              ? (l ||
                  (typeof a.UNSAFE_componentWillUpdate != `function` &&
                    typeof a.componentWillUpdate != `function`) ||
                  (typeof a.componentWillUpdate == `function` &&
                    a.componentWillUpdate(r, p, c),
                  typeof a.UNSAFE_componentWillUpdate == `function` &&
                    a.UNSAFE_componentWillUpdate(r, p, c)),
                typeof a.componentDidUpdate == `function` && (t.flags |= 4),
                typeof a.getSnapshotBeforeUpdate == `function` &&
                  (t.flags |= 1024))
              : (typeof a.componentDidUpdate != `function` ||
                  (o === e.memoizedProps && f === e.memoizedState) ||
                  (t.flags |= 4),
                typeof a.getSnapshotBeforeUpdate != `function` ||
                  (o === e.memoizedProps && f === e.memoizedState) ||
                  (t.flags |= 1024),
                (t.memoizedProps = r),
                (t.memoizedState = p)),
            (a.props = r),
            (a.state = p),
            (a.context = c),
            (r = u))
          : (typeof a.componentDidUpdate != `function` ||
              (o === e.memoizedProps && f === e.memoizedState) ||
              (t.flags |= 4),
            typeof a.getSnapshotBeforeUpdate != `function` ||
              (o === e.memoizedProps && f === e.memoizedState) ||
              (t.flags |= 1024),
            (r = !1));
      }
      return (
        (a = r),
        pc(e, t),
        (r = (t.flags & 128) != 0),
        a || r
          ? ((a = t.stateNode),
            (n =
              r && typeof n.getDerivedStateFromError != `function`
                ? null
                : a.render()),
            (t.flags |= 1),
            e !== null && r
              ? ((t.child = Ia(t, e.child, null, i)),
                (t.child = Ia(t, null, n, i)))
              : rc(e, t, n, i),
            (t.memoizedState = a.state),
            (e = t.child))
          : (e = Oc(e, t, i)),
        e
      );
    }
    function _c(e, t, n, r) {
      return (Bi(), (t.flags |= 256), rc(e, t, n, r), t.child);
    }
    var vc = {
      dehydrated: null,
      treeContext: null,
      retryLane: 0,
      hydrationErrors: null,
    };
    function yc(e) {
      return { baseLanes: e, cachePool: ya() };
    }
    function bc(e, t, n) {
      return ((e = e === null ? 0 : e.childLanes & ~n), t && (e |= Jl), e);
    }
    function xc(e, t, n) {
      var r = t.pendingProps,
        i = !1,
        o = (t.flags & 128) != 0,
        s;
      if (
        ((s = o) ||
          (s =
            e !== null && e.memoizedState === null
              ? !1
              : (co.current & 2) != 0),
        s && ((i = !0), (t.flags &= -129)),
        (s = (t.flags & 32) != 0),
        (t.flags &= -33),
        e === null)
      ) {
        if (V) {
          if (
            (i ? ro(t) : oo(t),
            (e = B)
              ? ((e = rf(e, Pi)),
                (e = e !== null && e.data !== `&` ? e : null),
                e !== null &&
                  ((t.memoizedState = {
                    dehydrated: e,
                    treeContext: wi === null ? null : { id: Ti, overflow: Ei },
                    retryLane: 536870912,
                    hydrationErrors: null,
                  }),
                  (n = mi(e)),
                  (n.return = t),
                  (t.child = n),
                  (Mi = t),
                  (B = null)))
              : (e = null),
            e === null)
          )
            throw Ii(t);
          return (of(e) ? (t.lanes = 32) : (t.lanes = 536870912), null);
        }
        var c = r.children;
        return (
          (r = r.fallback),
          i
            ? (oo(t),
              (i = t.mode),
              (c = Cc({ mode: `hidden`, children: c }, i)),
              (r = fi(r, i, n, null)),
              (c.return = t),
              (r.return = t),
              (c.sibling = r),
              (t.child = c),
              (r = t.child),
              (r.memoizedState = yc(n)),
              (r.childLanes = bc(e, s, n)),
              (t.memoizedState = vc),
              cc(null, r))
            : (ro(t), Sc(t, c))
        );
      }
      var l = e.memoizedState;
      if (l !== null && ((c = l.dehydrated), c !== null)) {
        if (o)
          t.flags & 256
            ? (ro(t), (t.flags &= -257), (t = wc(e, t, n)))
            : t.memoizedState === null
              ? (oo(t),
                (c = r.fallback),
                (i = t.mode),
                (r = Cc({ mode: `visible`, children: r.children }, i)),
                (c = fi(c, i, n, null)),
                (c.flags |= 2),
                (r.return = t),
                (c.return = t),
                (r.sibling = c),
                (t.child = r),
                Ia(t, e.child, null, n),
                (r = t.child),
                (r.memoizedState = yc(n)),
                (r.childLanes = bc(e, s, n)),
                (t.memoizedState = vc),
                (t = cc(null, r)))
              : (oo(t), (t.child = e.child), (t.flags |= 128), (t = null));
        else if ((ro(t), of(c))) {
          if (((s = c.nextSibling && c.nextSibling.dataset), s)) var u = s.dgst;
          ((s = u),
            (r = Error(a(419))),
            (r.stack = ``),
            (r.digest = s),
            Hi({ value: r, source: null, stack: null }),
            (t = wc(e, t, n)));
        } else if (
          (nc || Xi(e, t, n, !1), (s = (n & e.childLanes) !== 0), nc || s)
        ) {
          if (
            ((s = q),
            s !== null && ((r = nt(s, n)), r !== 0 && r !== l.retryLane))
          )
            throw ((l.retryLane = r), ni(e, r), hu(s, e, r), tc);
          (af(c) || Du(), (t = wc(e, t, n)));
        } else
          af(c)
            ? ((t.flags |= 192), (t.child = e.child), (t = null))
            : ((e = l.treeContext),
              (B = cf(c.nextSibling)),
              (Mi = t),
              (V = !0),
              (Ni = null),
              (Pi = !1),
              e !== null && ji(t, e),
              (t = Sc(t, r.children)),
              (t.flags |= 4096));
        return t;
      }
      return i
        ? (oo(t),
          (c = r.fallback),
          (i = t.mode),
          (l = e.child),
          (u = l.sibling),
          (r = li(l, { mode: `hidden`, children: r.children })),
          (r.subtreeFlags = l.subtreeFlags & 65011712),
          u === null
            ? ((c = fi(c, i, n, null)), (c.flags |= 2))
            : (c = li(u, c)),
          (c.return = t),
          (r.return = t),
          (r.sibling = c),
          (t.child = r),
          cc(null, r),
          (r = t.child),
          (c = e.child.memoizedState),
          c === null
            ? (c = yc(n))
            : ((i = c.cachePool),
              i === null
                ? (i = ya())
                : ((l = aa._currentValue),
                  (i = i.parent === l ? i : { parent: l, pool: l })),
              (c = { baseLanes: c.baseLanes | n, cachePool: i })),
          (r.memoizedState = c),
          (r.childLanes = bc(e, s, n)),
          (t.memoizedState = vc),
          cc(e.child, r))
        : (ro(t),
          (n = e.child),
          (e = n.sibling),
          (n = li(n, { mode: `visible`, children: r.children })),
          (n.return = t),
          (n.sibling = null),
          e !== null &&
            ((s = t.deletions),
            s === null ? ((t.deletions = [e]), (t.flags |= 16)) : s.push(e)),
          (t.child = n),
          (t.memoizedState = null),
          n);
    }
    function Sc(e, t) {
      return (
        (t = Cc({ mode: `visible`, children: t }, e.mode)),
        (t.return = e),
        (e.child = t)
      );
    }
    function Cc(e, t) {
      return ((e = si(22, e, null, t)), (e.lanes = 0), e);
    }
    function wc(e, t, n) {
      return (
        Ia(t, e.child, null, n),
        (e = Sc(t, t.pendingProps.children)),
        (e.flags |= 2),
        (t.memoizedState = null),
        e
      );
    }
    function Tc(e, t, n) {
      e.lanes |= t;
      var r = e.alternate;
      (r !== null && (r.lanes |= t), Ji(e.return, t, n));
    }
    function Ec(e, t, n, r, i, a) {
      var o = e.memoizedState;
      o === null
        ? (e.memoizedState = {
            isBackwards: t,
            rendering: null,
            renderingStartTime: 0,
            last: r,
            tail: n,
            tailMode: i,
            treeForkCount: a,
          })
        : ((o.isBackwards = t),
          (o.rendering = null),
          (o.renderingStartTime = 0),
          (o.last = r),
          (o.tail = n),
          (o.tailMode = i),
          (o.treeForkCount = a));
    }
    function Dc(e, t, n) {
      var r = t.pendingProps,
        i = r.revealOrder,
        a = r.tail;
      r = r.children;
      var o = co.current,
        s = (o & 2) != 0;
      if (
        (s ? ((o = (o & 1) | 2), (t.flags |= 128)) : (o &= 1),
        N(co, o),
        rc(e, t, r, n),
        (r = V ? xi : 0),
        !s && e !== null && e.flags & 128)
      )
        a: for (e = t.child; e !== null; ) {
          if (e.tag === 13) e.memoizedState !== null && Tc(e, n, t);
          else if (e.tag === 19) Tc(e, n, t);
          else if (e.child !== null) {
            ((e.child.return = e), (e = e.child));
            continue;
          }
          if (e === t) break a;
          for (; e.sibling === null; ) {
            if (e.return === null || e.return === t) break a;
            e = e.return;
          }
          ((e.sibling.return = e.return), (e = e.sibling));
        }
      switch (i) {
        case `forwards`:
          for (n = t.child, i = null; n !== null; )
            ((e = n.alternate),
              e !== null && lo(e) === null && (i = n),
              (n = n.sibling));
          ((n = i),
            n === null
              ? ((i = t.child), (t.child = null))
              : ((i = n.sibling), (n.sibling = null)),
            Ec(t, !1, i, n, a, r));
          break;
        case `backwards`:
        case `unstable_legacy-backwards`:
          for (n = null, i = t.child, t.child = null; i !== null; ) {
            if (((e = i.alternate), e !== null && lo(e) === null)) {
              t.child = i;
              break;
            }
            ((e = i.sibling), (i.sibling = n), (n = i), (i = e));
          }
          Ec(t, !0, n, null, a, r);
          break;
        case `together`:
          Ec(t, !1, null, null, void 0, r);
          break;
        default:
          t.memoizedState = null;
      }
      return t.child;
    }
    function Oc(e, t, n) {
      if (
        (e !== null && (t.dependencies = e.dependencies),
        (Gl |= t.lanes),
        (n & t.childLanes) === 0)
      )
        if (e !== null) {
          if ((Xi(e, t, n, !1), (n & t.childLanes) === 0)) return null;
        } else return null;
      if (e !== null && t.child !== e.child) throw Error(a(153));
      if (t.child !== null) {
        for (
          e = t.child, n = li(e, e.pendingProps), t.child = n, n.return = t;
          e.sibling !== null;
        )
          ((e = e.sibling),
            (n = n.sibling = li(e, e.pendingProps)),
            (n.return = t));
        n.sibling = null;
      }
      return t.child;
    }
    function kc(e, t) {
      return (e.lanes & t) === 0
        ? ((e = e.dependencies), !!(e !== null && Zi(e)))
        : !0;
    }
    function Ac(e, t, n) {
      switch (t.tag) {
        case 3:
          (pe(t, t.stateNode.containerInfo),
            Ki(t, aa, e.memoizedState.cache),
            Bi());
          break;
        case 27:
        case 5:
          P(t);
          break;
        case 4:
          pe(t, t.stateNode.containerInfo);
          break;
        case 10:
          Ki(t, t.type, t.memoizedProps.value);
          break;
        case 31:
          if (t.memoizedState !== null) return ((t.flags |= 128), io(t), null);
          break;
        case 13:
          var r = t.memoizedState;
          if (r !== null)
            return r.dehydrated === null
              ? (n & t.child.childLanes) === 0
                ? (ro(t), (e = Oc(e, t, n)), e === null ? null : e.sibling)
                : xc(e, t, n)
              : (ro(t), (t.flags |= 128), null);
          ro(t);
          break;
        case 19:
          var i = (e.flags & 128) != 0;
          if (
            ((r = (n & t.childLanes) !== 0),
            (r ||= (Xi(e, t, n, !1), (n & t.childLanes) !== 0)),
            i)
          ) {
            if (r) return Dc(e, t, n);
            t.flags |= 128;
          }
          if (
            ((i = t.memoizedState),
            i !== null &&
              ((i.rendering = null), (i.tail = null), (i.lastEffect = null)),
            N(co, co.current),
            r)
          )
            break;
          return null;
        case 22:
          return ((t.lanes = 0), sc(e, t, n, t.pendingProps));
        case 24:
          Ki(t, aa, e.memoizedState.cache);
      }
      return Oc(e, t, n);
    }
    function jc(e, t, n) {
      if (e !== null)
        if (e.memoizedProps !== t.pendingProps) nc = !0;
        else {
          if (!kc(e, n) && !(t.flags & 128)) return ((nc = !1), Ac(e, t, n));
          nc = !!(e.flags & 131072);
        }
      else ((nc = !1), V && t.flags & 1048576 && Oi(t, xi, t.index));
      switch (((t.lanes = 0), t.tag)) {
        case 16:
          a: {
            var r = t.pendingProps;
            if (((e = Ea(t.elementType)), (t.type = e), typeof e == `function`))
              ci(e)
                ? ((r = Gs(e, r)), (t.tag = 1), (t = gc(null, t, e, r, n)))
                : ((t.tag = 0), (t = mc(null, t, e, r, n)));
            else {
              if (e != null) {
                var i = e.$$typeof;
                if (i === S) {
                  ((t.tag = 11), (t = ic(null, t, e, r, n)));
                  break a;
                } else if (i === T) {
                  ((t.tag = 14), (t = ac(null, t, e, r, n)));
                  break a;
                }
              }
              throw ((t = re(e) || e), Error(a(306, t, ``)));
            }
          }
          return t;
        case 0:
          return mc(e, t, t.type, t.pendingProps, n);
        case 1:
          return ((r = t.type), (i = Gs(r, t.pendingProps)), gc(e, t, r, i, n));
        case 3:
          a: {
            if ((pe(t, t.stateNode.containerInfo), e === null))
              throw Error(a(387));
            r = t.pendingProps;
            var o = t.memoizedState;
            ((i = o.element), Ba(e, t), qa(t, r, null, n));
            var s = t.memoizedState;
            if (
              ((r = s.cache),
              Ki(t, aa, r),
              r !== o.cache && Yi(t, [aa], n, !0),
              Ka(),
              (r = s.element),
              o.isDehydrated)
            )
              if (
                ((o = { element: r, isDehydrated: !1, cache: s.cache }),
                (t.updateQueue.baseState = o),
                (t.memoizedState = o),
                t.flags & 256)
              ) {
                t = _c(e, t, r, n);
                break a;
              } else if (r !== i) {
                ((i = _i(Error(a(424)), t)), Hi(i), (t = _c(e, t, r, n)));
                break a;
              } else {
                switch (((e = t.stateNode.containerInfo), e.nodeType)) {
                  case 9:
                    e = e.body;
                    break;
                  default:
                    e = e.nodeName === `HTML` ? e.ownerDocument.body : e;
                }
                for (
                  B = cf(e.firstChild),
                    Mi = t,
                    V = !0,
                    Ni = null,
                    Pi = !0,
                    n = La(t, null, r, n),
                    t.child = n;
                  n;
                )
                  ((n.flags = (n.flags & -3) | 4096), (n = n.sibling));
              }
            else {
              if ((Bi(), r === i)) {
                t = Oc(e, t, n);
                break a;
              }
              rc(e, t, r, n);
            }
            t = t.child;
          }
          return t;
        case 26:
          return (
            pc(e, t),
            e === null
              ? (n = kf(t.type, null, t.pendingProps, null))
                ? (t.memoizedState = n)
                : V ||
                  ((n = t.type),
                  (e = t.pendingProps),
                  (r = Bd(de.current).createElement(n)),
                  (r[ct] = t),
                  (r[lt] = e),
                  Pd(r, n, e),
                  xt(r),
                  (t.stateNode = r))
              : (t.memoizedState = kf(
                  t.type,
                  e.memoizedProps,
                  t.pendingProps,
                  e.memoizedState,
                )),
            null
          );
        case 27:
          return (
            P(t),
            e === null &&
              V &&
              ((r = t.stateNode = ff(t.type, t.pendingProps, de.current)),
              (Mi = t),
              (Pi = !0),
              (i = B),
              Zd(t.type) ? ((lf = i), (B = cf(r.firstChild))) : (B = i)),
            rc(e, t, t.pendingProps.children, n),
            pc(e, t),
            e === null && (t.flags |= 4194304),
            t.child
          );
        case 5:
          return (
            e === null &&
              V &&
              ((i = r = B) &&
                ((r = tf(r, t.type, t.pendingProps, Pi)),
                r === null
                  ? (i = !1)
                  : ((t.stateNode = r),
                    (Mi = t),
                    (B = cf(r.firstChild)),
                    (Pi = !1),
                    (i = !0))),
              i || Ii(t)),
            P(t),
            (i = t.type),
            (o = t.pendingProps),
            (s = e === null ? null : e.memoizedProps),
            (r = o.children),
            Ud(i, o) ? (r = null) : s !== null && Ud(i, s) && (t.flags |= 32),
            t.memoizedState !== null &&
              ((i = xo(e, t, wo, null, null, n)), (Qf._currentValue = i)),
            pc(e, t),
            rc(e, t, r, n),
            t.child
          );
        case 6:
          return (
            e === null &&
              V &&
              ((e = n = B) &&
                ((n = nf(n, t.pendingProps, Pi)),
                n === null
                  ? (e = !1)
                  : ((t.stateNode = n), (Mi = t), (B = null), (e = !0))),
              e || Ii(t)),
            null
          );
        case 13:
          return xc(e, t, n);
        case 4:
          return (
            pe(t, t.stateNode.containerInfo),
            (r = t.pendingProps),
            e === null ? (t.child = Ia(t, null, r, n)) : rc(e, t, r, n),
            t.child
          );
        case 11:
          return ic(e, t, t.type, t.pendingProps, n);
        case 7:
          return (rc(e, t, t.pendingProps, n), t.child);
        case 8:
          return (rc(e, t, t.pendingProps.children, n), t.child);
        case 12:
          return (rc(e, t, t.pendingProps.children, n), t.child);
        case 10:
          return (
            (r = t.pendingProps),
            Ki(t, t.type, r.value),
            rc(e, t, r.children, n),
            t.child
          );
        case 9:
          return (
            (i = t.type._context),
            (r = t.pendingProps.children),
            Qi(t),
            (i = $i(i)),
            (r = r(i)),
            (t.flags |= 1),
            rc(e, t, r, n),
            t.child
          );
        case 14:
          return ac(e, t, t.type, t.pendingProps, n);
        case 15:
          return oc(e, t, t.type, t.pendingProps, n);
        case 19:
          return Dc(e, t, n);
        case 31:
          return fc(e, t, n);
        case 22:
          return sc(e, t, n, t.pendingProps);
        case 24:
          return (
            Qi(t),
            (r = $i(aa)),
            e === null
              ? ((i = _a()),
                i === null &&
                  ((i = q),
                  (o = oa()),
                  (i.pooledCache = o),
                  o.refCount++,
                  o !== null && (i.pooledCacheLanes |= n),
                  (i = o)),
                (t.memoizedState = { parent: r, cache: i }),
                za(t),
                Ki(t, aa, i))
              : ((e.lanes & n) !== 0 && (Ba(e, t), qa(t, null, null, n), Ka()),
                (i = e.memoizedState),
                (o = t.memoizedState),
                i.parent === r
                  ? ((r = o.cache),
                    Ki(t, aa, r),
                    r !== i.cache && Yi(t, [aa], n, !0))
                  : ((i = { parent: r, cache: r }),
                    (t.memoizedState = i),
                    t.lanes === 0 &&
                      (t.memoizedState = t.updateQueue.baseState = i),
                    Ki(t, aa, r))),
            rc(e, t, t.pendingProps.children, n),
            t.child
          );
        case 29:
          throw t.pendingProps;
      }
      throw Error(a(156, t.tag));
    }
    function Mc(e) {
      e.flags |= 4;
    }
    function Nc(e, t, n, r, i) {
      if (((t = (e.mode & 32) != 0) && (t = !1), t)) {
        if (((e.flags |= 16777216), (i & 335544128) === i))
          if (e.stateNode.complete) e.flags |= 8192;
          else if (wu()) e.flags |= 8192;
          else throw ((Da = Ca), xa);
      } else e.flags &= -16777217;
    }
    function Pc(e, t) {
      if (t.type !== `stylesheet` || t.state.loading & 4) e.flags &= -16777217;
      else if (((e.flags |= 16777216), !Wf(t)))
        if (wu()) e.flags |= 8192;
        else throw ((Da = Ca), xa);
    }
    function Fc(e, t) {
      (t !== null && (e.flags |= 4),
        e.flags & 16384 &&
          ((t = e.tag === 22 ? 536870912 : Xe()), (e.lanes |= t), (Yl |= t)));
    }
    function Ic(e, t) {
      if (!V)
        switch (e.tailMode) {
          case `hidden`:
            t = e.tail;
            for (var n = null; t !== null; )
              (t.alternate !== null && (n = t), (t = t.sibling));
            n === null ? (e.tail = null) : (n.sibling = null);
            break;
          case `collapsed`:
            n = e.tail;
            for (var r = null; n !== null; )
              (n.alternate !== null && (r = n), (n = n.sibling));
            r === null
              ? t || e.tail === null
                ? (e.tail = null)
                : (e.tail.sibling = null)
              : (r.sibling = null);
        }
    }
    function G(e) {
      var t = e.alternate !== null && e.alternate.child === e.child,
        n = 0,
        r = 0;
      if (t)
        for (var i = e.child; i !== null; )
          ((n |= i.lanes | i.childLanes),
            (r |= i.subtreeFlags & 65011712),
            (r |= i.flags & 65011712),
            (i.return = e),
            (i = i.sibling));
      else
        for (i = e.child; i !== null; )
          ((n |= i.lanes | i.childLanes),
            (r |= i.subtreeFlags),
            (r |= i.flags),
            (i.return = e),
            (i = i.sibling));
      return ((e.subtreeFlags |= r), (e.childLanes = n), t);
    }
    function Lc(e, t, n) {
      var r = t.pendingProps;
      switch ((Ai(t), t.tag)) {
        case 16:
        case 15:
        case 0:
        case 11:
        case 7:
        case 8:
        case 12:
        case 9:
        case 14:
          return (G(t), null);
        case 1:
          return (G(t), null);
        case 3:
          return (
            (n = t.stateNode),
            (r = null),
            e !== null && (r = e.memoizedState.cache),
            t.memoizedState.cache !== r && (t.flags |= 2048),
            qi(aa),
            me(),
            n.pendingContext &&
              ((n.context = n.pendingContext), (n.pendingContext = null)),
            (e === null || e.child === null) &&
              (zi(t)
                ? Mc(t)
                : e === null ||
                  (e.memoizedState.isDehydrated && !(t.flags & 256)) ||
                  ((t.flags |= 1024), Vi())),
            G(t),
            null
          );
        case 26:
          var i = t.type,
            o = t.memoizedState;
          return (
            e === null
              ? (Mc(t),
                o === null ? (G(t), Nc(t, i, null, r, n)) : (G(t), Pc(t, o)))
              : o
                ? o === e.memoizedState
                  ? (G(t), (t.flags &= -16777217))
                  : (Mc(t), G(t), Pc(t, o))
                : ((e = e.memoizedProps),
                  e !== r && Mc(t),
                  G(t),
                  Nc(t, i, e, r, n)),
            null
          );
        case 27:
          if (
            (ge(t),
            (n = de.current),
            (i = t.type),
            e !== null && t.stateNode != null)
          )
            e.memoizedProps !== r && Mc(t);
          else {
            if (!r) {
              if (t.stateNode === null) throw Error(a(166));
              return (G(t), null);
            }
            ((e = ce.current),
              zi(t) ? Li(t, e) : ((e = ff(i, r, n)), (t.stateNode = e), Mc(t)));
          }
          return (G(t), null);
        case 5:
          if ((ge(t), (i = t.type), e !== null && t.stateNode != null))
            e.memoizedProps !== r && Mc(t);
          else {
            if (!r) {
              if (t.stateNode === null) throw Error(a(166));
              return (G(t), null);
            }
            if (((o = ce.current), zi(t))) Li(t, o);
            else {
              var s = Bd(de.current);
              switch (o) {
                case 1:
                  o = s.createElementNS(`http://www.w3.org/2000/svg`, i);
                  break;
                case 2:
                  o = s.createElementNS(
                    `http://www.w3.org/1998/Math/MathML`,
                    i,
                  );
                  break;
                default:
                  switch (i) {
                    case `svg`:
                      o = s.createElementNS(`http://www.w3.org/2000/svg`, i);
                      break;
                    case `math`:
                      o = s.createElementNS(
                        `http://www.w3.org/1998/Math/MathML`,
                        i,
                      );
                      break;
                    case `script`:
                      ((o = s.createElement(`div`)),
                        (o.innerHTML = `<script><\/script>`),
                        (o = o.removeChild(o.firstChild)));
                      break;
                    case `select`:
                      ((o =
                        typeof r.is == `string`
                          ? s.createElement(`select`, { is: r.is })
                          : s.createElement(`select`)),
                        r.multiple
                          ? (o.multiple = !0)
                          : r.size && (o.size = r.size));
                      break;
                    default:
                      o =
                        typeof r.is == `string`
                          ? s.createElement(i, { is: r.is })
                          : s.createElement(i);
                  }
              }
              ((o[ct] = t), (o[lt] = r));
              a: for (s = t.child; s !== null; ) {
                if (s.tag === 5 || s.tag === 6) o.appendChild(s.stateNode);
                else if (s.tag !== 4 && s.tag !== 27 && s.child !== null) {
                  ((s.child.return = s), (s = s.child));
                  continue;
                }
                if (s === t) break a;
                for (; s.sibling === null; ) {
                  if (s.return === null || s.return === t) break a;
                  s = s.return;
                }
                ((s.sibling.return = s.return), (s = s.sibling));
              }
              t.stateNode = o;
              a: switch ((Pd(o, i, r), i)) {
                case `button`:
                case `input`:
                case `select`:
                case `textarea`:
                  r = !!r.autoFocus;
                  break a;
                case `img`:
                  r = !0;
                  break a;
                default:
                  r = !1;
              }
              r && Mc(t);
            }
          }
          return (
            G(t),
            Nc(
              t,
              t.type,
              e === null ? null : e.memoizedProps,
              t.pendingProps,
              n,
            ),
            null
          );
        case 6:
          if (e && t.stateNode != null) e.memoizedProps !== r && Mc(t);
          else {
            if (typeof r != `string` && t.stateNode === null)
              throw Error(a(166));
            if (((e = de.current), zi(t))) {
              if (
                ((e = t.stateNode),
                (n = t.memoizedProps),
                (r = null),
                (i = Mi),
                i !== null)
              )
                switch (i.tag) {
                  case 27:
                  case 5:
                    r = i.memoizedProps;
                }
              ((e[ct] = t),
                (e = !!(
                  e.nodeValue === n ||
                  (r !== null && !0 === r.suppressHydrationWarning) ||
                  Md(e.nodeValue, n)
                )),
                e || Ii(t, !0));
            } else
              ((e = Bd(e).createTextNode(r)), (e[ct] = t), (t.stateNode = e));
          }
          return (G(t), null);
        case 31:
          if (((n = t.memoizedState), e === null || e.memoizedState !== null)) {
            if (((r = zi(t)), n !== null)) {
              if (e === null) {
                if (!r) throw Error(a(318));
                if (
                  ((e = t.memoizedState),
                  (e = e === null ? null : e.dehydrated),
                  !e)
                )
                  throw Error(a(557));
                e[ct] = t;
              } else
                (Bi(),
                  !(t.flags & 128) && (t.memoizedState = null),
                  (t.flags |= 4));
              (G(t), (e = !1));
            } else
              ((n = Vi()),
                e !== null &&
                  e.memoizedState !== null &&
                  (e.memoizedState.hydrationErrors = n),
                (e = !0));
            if (!e) return t.flags & 256 ? (so(t), t) : (so(t), null);
            if (t.flags & 128) throw Error(a(558));
          }
          return (G(t), null);
        case 13:
          if (
            ((r = t.memoizedState),
            e === null ||
              (e.memoizedState !== null && e.memoizedState.dehydrated !== null))
          ) {
            if (((i = zi(t)), r !== null && r.dehydrated !== null)) {
              if (e === null) {
                if (!i) throw Error(a(318));
                if (
                  ((i = t.memoizedState),
                  (i = i === null ? null : i.dehydrated),
                  !i)
                )
                  throw Error(a(317));
                i[ct] = t;
              } else
                (Bi(),
                  !(t.flags & 128) && (t.memoizedState = null),
                  (t.flags |= 4));
              (G(t), (i = !1));
            } else
              ((i = Vi()),
                e !== null &&
                  e.memoizedState !== null &&
                  (e.memoizedState.hydrationErrors = i),
                (i = !0));
            if (!i) return t.flags & 256 ? (so(t), t) : (so(t), null);
          }
          return (
            so(t),
            t.flags & 128
              ? ((t.lanes = n), t)
              : ((n = r !== null),
                (e = e !== null && e.memoizedState !== null),
                n &&
                  ((r = t.child),
                  (i = null),
                  r.alternate !== null &&
                    r.alternate.memoizedState !== null &&
                    r.alternate.memoizedState.cachePool !== null &&
                    (i = r.alternate.memoizedState.cachePool.pool),
                  (o = null),
                  r.memoizedState !== null &&
                    r.memoizedState.cachePool !== null &&
                    (o = r.memoizedState.cachePool.pool),
                  o !== i && (r.flags |= 2048)),
                n !== e && n && (t.child.flags |= 8192),
                Fc(t, t.updateQueue),
                G(t),
                null)
          );
        case 4:
          return (
            me(),
            e === null && Sd(t.stateNode.containerInfo),
            G(t),
            null
          );
        case 10:
          return (qi(t.type), G(t), null);
        case 19:
          if ((M(co), (r = t.memoizedState), r === null)) return (G(t), null);
          if (((i = (t.flags & 128) != 0), (o = r.rendering), o === null))
            if (i) Ic(r, !1);
            else {
              if (Wl !== 0 || (e !== null && e.flags & 128))
                for (e = t.child; e !== null; ) {
                  if (((o = lo(e)), o !== null)) {
                    for (
                      t.flags |= 128,
                        Ic(r, !1),
                        e = o.updateQueue,
                        t.updateQueue = e,
                        Fc(t, e),
                        t.subtreeFlags = 0,
                        e = n,
                        n = t.child;
                      n !== null;
                    )
                      (ui(n, e), (n = n.sibling));
                    return (
                      N(co, (co.current & 1) | 2),
                      V && Di(t, r.treeForkCount),
                      t.child
                    );
                  }
                  e = e.sibling;
                }
              r.tail !== null &&
                De() > tu &&
                ((t.flags |= 128), (i = !0), Ic(r, !1), (t.lanes = 4194304));
            }
          else {
            if (!i)
              if (((e = lo(o)), e !== null)) {
                if (
                  ((t.flags |= 128),
                  (i = !0),
                  (e = e.updateQueue),
                  (t.updateQueue = e),
                  Fc(t, e),
                  Ic(r, !0),
                  r.tail === null &&
                    r.tailMode === `hidden` &&
                    !o.alternate &&
                    !V)
                )
                  return (G(t), null);
              } else
                2 * De() - r.renderingStartTime > tu &&
                  n !== 536870912 &&
                  ((t.flags |= 128), (i = !0), Ic(r, !1), (t.lanes = 4194304));
            r.isBackwards
              ? ((o.sibling = t.child), (t.child = o))
              : ((e = r.last),
                e === null ? (t.child = o) : (e.sibling = o),
                (r.last = o));
          }
          return r.tail === null
            ? (G(t), null)
            : ((e = r.tail),
              (r.rendering = e),
              (r.tail = e.sibling),
              (r.renderingStartTime = De()),
              (e.sibling = null),
              (n = co.current),
              N(co, i ? (n & 1) | 2 : n & 1),
              V && Di(t, r.treeForkCount),
              e);
        case 22:
        case 23:
          return (
            so(t),
            eo(),
            (r = t.memoizedState !== null),
            e === null
              ? r && (t.flags |= 8192)
              : (e.memoizedState !== null) !== r && (t.flags |= 8192),
            r
              ? n & 536870912 &&
                !(t.flags & 128) &&
                (G(t), t.subtreeFlags & 6 && (t.flags |= 8192))
              : G(t),
            (n = t.updateQueue),
            n !== null && Fc(t, n.retryQueue),
            (n = null),
            e !== null &&
              e.memoizedState !== null &&
              e.memoizedState.cachePool !== null &&
              (n = e.memoizedState.cachePool.pool),
            (r = null),
            t.memoizedState !== null &&
              t.memoizedState.cachePool !== null &&
              (r = t.memoizedState.cachePool.pool),
            r !== n && (t.flags |= 2048),
            e !== null && M(ga),
            null
          );
        case 24:
          return (
            (n = null),
            e !== null && (n = e.memoizedState.cache),
            t.memoizedState.cache !== n && (t.flags |= 2048),
            qi(aa),
            G(t),
            null
          );
        case 25:
          return null;
        case 30:
          return null;
      }
      throw Error(a(156, t.tag));
    }
    function Rc(e, t) {
      switch ((Ai(t), t.tag)) {
        case 1:
          return (
            (e = t.flags),
            e & 65536 ? ((t.flags = (e & -65537) | 128), t) : null
          );
        case 3:
          return (
            qi(aa),
            me(),
            (e = t.flags),
            e & 65536 && !(e & 128) ? ((t.flags = (e & -65537) | 128), t) : null
          );
        case 26:
        case 27:
        case 5:
          return (ge(t), null);
        case 31:
          if (t.memoizedState !== null) {
            if ((so(t), t.alternate === null)) throw Error(a(340));
            Bi();
          }
          return (
            (e = t.flags),
            e & 65536 ? ((t.flags = (e & -65537) | 128), t) : null
          );
        case 13:
          if (
            (so(t), (e = t.memoizedState), e !== null && e.dehydrated !== null)
          ) {
            if (t.alternate === null) throw Error(a(340));
            Bi();
          }
          return (
            (e = t.flags),
            e & 65536 ? ((t.flags = (e & -65537) | 128), t) : null
          );
        case 19:
          return (M(co), null);
        case 4:
          return (me(), null);
        case 10:
          return (qi(t.type), null);
        case 22:
        case 23:
          return (
            so(t),
            eo(),
            e !== null && M(ga),
            (e = t.flags),
            e & 65536 ? ((t.flags = (e & -65537) | 128), t) : null
          );
        case 24:
          return (qi(aa), null);
        case 25:
          return null;
        default:
          return null;
      }
    }
    function zc(e, t) {
      switch ((Ai(t), t.tag)) {
        case 3:
          (qi(aa), me());
          break;
        case 26:
        case 27:
        case 5:
          ge(t);
          break;
        case 4:
          me();
          break;
        case 31:
          t.memoizedState !== null && so(t);
          break;
        case 13:
          so(t);
          break;
        case 19:
          M(co);
          break;
        case 10:
          qi(t.type);
          break;
        case 22:
        case 23:
          (so(t), eo(), e !== null && M(ga));
          break;
        case 24:
          qi(aa);
      }
    }
    function Bc(e, t) {
      try {
        var n = t.updateQueue,
          r = n === null ? null : n.lastEffect;
        if (r !== null) {
          var i = r.next;
          n = i;
          do {
            if ((n.tag & e) === e) {
              r = void 0;
              var a = n.create,
                o = n.inst;
              ((r = a()), (o.destroy = r));
            }
            n = n.next;
          } while (n !== i);
        }
      } catch (e) {
        Z(t, t.return, e);
      }
    }
    function Vc(e, t, n) {
      try {
        var r = t.updateQueue,
          i = r === null ? null : r.lastEffect;
        if (i !== null) {
          var a = i.next;
          r = a;
          do {
            if ((r.tag & e) === e) {
              var o = r.inst,
                s = o.destroy;
              if (s !== void 0) {
                ((o.destroy = void 0), (i = t));
                var c = n,
                  l = s;
                try {
                  l();
                } catch (e) {
                  Z(i, c, e);
                }
              }
            }
            r = r.next;
          } while (r !== a);
        }
      } catch (e) {
        Z(t, t.return, e);
      }
    }
    function Hc(e) {
      var t = e.updateQueue;
      if (t !== null) {
        var n = e.stateNode;
        try {
          Ya(t, n);
        } catch (t) {
          Z(e, e.return, t);
        }
      }
    }
    function Uc(e, t, n) {
      ((n.props = Gs(e.type, e.memoizedProps)), (n.state = e.memoizedState));
      try {
        n.componentWillUnmount();
      } catch (n) {
        Z(e, t, n);
      }
    }
    function Wc(e, t) {
      try {
        var n = e.ref;
        if (n !== null) {
          switch (e.tag) {
            case 26:
            case 27:
            case 5:
              var r = e.stateNode;
              break;
            case 30:
              r = e.stateNode;
              break;
            default:
              r = e.stateNode;
          }
          typeof n == `function` ? (e.refCleanup = n(r)) : (n.current = r);
        }
      } catch (n) {
        Z(e, t, n);
      }
    }
    function Gc(e, t) {
      var n = e.ref,
        r = e.refCleanup;
      if (n !== null)
        if (typeof r == `function`)
          try {
            r();
          } catch (n) {
            Z(e, t, n);
          } finally {
            ((e.refCleanup = null),
              (e = e.alternate),
              e != null && (e.refCleanup = null));
          }
        else if (typeof n == `function`)
          try {
            n(null);
          } catch (n) {
            Z(e, t, n);
          }
        else n.current = null;
    }
    function Kc(e) {
      var t = e.type,
        n = e.memoizedProps,
        r = e.stateNode;
      try {
        a: switch (t) {
          case `button`:
          case `input`:
          case `select`:
          case `textarea`:
            n.autoFocus && r.focus();
            break a;
          case `img`:
            n.src ? (r.src = n.src) : n.srcSet && (r.srcset = n.srcSet);
        }
      } catch (t) {
        Z(e, e.return, t);
      }
    }
    function qc(e, t, n) {
      try {
        var r = e.stateNode;
        (Fd(r, e.type, n, t), (r[lt] = t));
      } catch (t) {
        Z(e, e.return, t);
      }
    }
    function Jc(e) {
      return (
        e.tag === 5 ||
        e.tag === 3 ||
        e.tag === 26 ||
        (e.tag === 27 && Zd(e.type)) ||
        e.tag === 4
      );
    }
    function Yc(e) {
      a: for (;;) {
        for (; e.sibling === null; ) {
          if (e.return === null || Jc(e.return)) return null;
          e = e.return;
        }
        for (
          e.sibling.return = e.return, e = e.sibling;
          e.tag !== 5 && e.tag !== 6 && e.tag !== 18;
        ) {
          if (
            (e.tag === 27 && Zd(e.type)) ||
            e.flags & 2 ||
            e.child === null ||
            e.tag === 4
          )
            continue a;
          ((e.child.return = e), (e = e.child));
        }
        if (!(e.flags & 2)) return e.stateNode;
      }
    }
    function Xc(e, t, n) {
      var r = e.tag;
      if (r === 5 || r === 6)
        ((e = e.stateNode),
          t
            ? (n.nodeType === 9
                ? n.body
                : n.nodeName === `HTML`
                  ? n.ownerDocument.body
                  : n
              ).insertBefore(e, t)
            : ((t =
                n.nodeType === 9
                  ? n.body
                  : n.nodeName === `HTML`
                    ? n.ownerDocument.body
                    : n),
              t.appendChild(e),
              (n = n._reactRootContainer),
              n != null || t.onclick !== null || (t.onclick = tn)));
      else if (
        r !== 4 &&
        (r === 27 && Zd(e.type) && ((n = e.stateNode), (t = null)),
        (e = e.child),
        e !== null)
      )
        for (Xc(e, t, n), e = e.sibling; e !== null; )
          (Xc(e, t, n), (e = e.sibling));
    }
    function Zc(e, t, n) {
      var r = e.tag;
      if (r === 5 || r === 6)
        ((e = e.stateNode), t ? n.insertBefore(e, t) : n.appendChild(e));
      else if (
        r !== 4 &&
        (r === 27 && Zd(e.type) && (n = e.stateNode), (e = e.child), e !== null)
      )
        for (Zc(e, t, n), e = e.sibling; e !== null; )
          (Zc(e, t, n), (e = e.sibling));
    }
    function Qc(e) {
      var t = e.stateNode,
        n = e.memoizedProps;
      try {
        for (var r = e.type, i = t.attributes; i.length; )
          t.removeAttributeNode(i[0]);
        (Pd(t, r, n), (t[ct] = e), (t[lt] = n));
      } catch (t) {
        Z(e, e.return, t);
      }
    }
    var $c = !1,
      el = !1,
      tl = !1,
      nl = typeof WeakSet == `function` ? WeakSet : Set,
      rl = null;
    function il(e, t) {
      if (((e = e.containerInfo), (Rd = sp), (e = Dr(e)), Or(e))) {
        if (`selectionStart` in e)
          var n = { start: e.selectionStart, end: e.selectionEnd };
        else
          a: {
            n = ((n = e.ownerDocument) && n.defaultView) || window;
            var r = n.getSelection && n.getSelection();
            if (r && r.rangeCount !== 0) {
              n = r.anchorNode;
              var i = r.anchorOffset,
                o = r.focusNode;
              r = r.focusOffset;
              try {
                (n.nodeType, o.nodeType);
              } catch {
                n = null;
                break a;
              }
              var s = 0,
                c = -1,
                l = -1,
                u = 0,
                d = 0,
                f = e,
                p = null;
              b: for (;;) {
                for (
                  var m;
                  f !== n || (i !== 0 && f.nodeType !== 3) || (c = s + i),
                    f !== o || (r !== 0 && f.nodeType !== 3) || (l = s + r),
                    f.nodeType === 3 && (s += f.nodeValue.length),
                    (m = f.firstChild) !== null;
                )
                  ((p = f), (f = m));
                for (;;) {
                  if (f === e) break b;
                  if (
                    (p === n && ++u === i && (c = s),
                    p === o && ++d === r && (l = s),
                    (m = f.nextSibling) !== null)
                  )
                    break;
                  ((f = p), (p = f.parentNode));
                }
                f = m;
              }
              n = c === -1 || l === -1 ? null : { start: c, end: l };
            } else n = null;
          }
        n ||= { start: 0, end: 0 };
      } else n = null;
      for (
        zd = { focusedElem: e, selectionRange: n }, sp = !1, rl = t;
        rl !== null;
      )
        if (((t = rl), (e = t.child), t.subtreeFlags & 1028 && e !== null))
          ((e.return = t), (rl = e));
        else
          for (; rl !== null; ) {
            switch (((t = rl), (o = t.alternate), (e = t.flags), t.tag)) {
              case 0:
                if (
                  e & 4 &&
                  ((e = t.updateQueue),
                  (e = e === null ? null : e.events),
                  e !== null)
                )
                  for (n = 0; n < e.length; n++)
                    ((i = e[n]), (i.ref.impl = i.nextImpl));
                break;
              case 11:
              case 15:
                break;
              case 1:
                if (e & 1024 && o !== null) {
                  ((e = void 0),
                    (n = t),
                    (i = o.memoizedProps),
                    (o = o.memoizedState),
                    (r = n.stateNode));
                  try {
                    var h = Gs(n.type, i);
                    ((e = r.getSnapshotBeforeUpdate(h, o)),
                      (r.__reactInternalSnapshotBeforeUpdate = e));
                  } catch (e) {
                    Z(n, n.return, e);
                  }
                }
                break;
              case 3:
                if (e & 1024) {
                  if (
                    ((e = t.stateNode.containerInfo), (n = e.nodeType), n === 9)
                  )
                    ef(e);
                  else if (n === 1)
                    switch (e.nodeName) {
                      case `HEAD`:
                      case `HTML`:
                      case `BODY`:
                        ef(e);
                        break;
                      default:
                        e.textContent = ``;
                    }
                }
                break;
              case 5:
              case 26:
              case 27:
              case 6:
              case 4:
              case 17:
                break;
              default:
                if (e & 1024) throw Error(a(163));
            }
            if (((e = t.sibling), e !== null)) {
              ((e.return = t.return), (rl = e));
              break;
            }
            rl = t.return;
          }
    }
    function al(e, t, n) {
      var r = n.flags;
      switch (n.tag) {
        case 0:
        case 11:
        case 15:
          (bl(e, n), r & 4 && Bc(5, n));
          break;
        case 1:
          if ((bl(e, n), r & 4))
            if (((e = n.stateNode), t === null))
              try {
                e.componentDidMount();
              } catch (e) {
                Z(n, n.return, e);
              }
            else {
              var i = Gs(n.type, t.memoizedProps);
              t = t.memoizedState;
              try {
                e.componentDidUpdate(
                  i,
                  t,
                  e.__reactInternalSnapshotBeforeUpdate,
                );
              } catch (e) {
                Z(n, n.return, e);
              }
            }
          (r & 64 && Hc(n), r & 512 && Wc(n, n.return));
          break;
        case 3:
          if ((bl(e, n), r & 64 && ((e = n.updateQueue), e !== null))) {
            if (((t = null), n.child !== null))
              switch (n.child.tag) {
                case 27:
                case 5:
                  t = n.child.stateNode;
                  break;
                case 1:
                  t = n.child.stateNode;
              }
            try {
              Ya(e, t);
            } catch (e) {
              Z(n, n.return, e);
            }
          }
          break;
        case 27:
          t === null && r & 4 && Qc(n);
        case 26:
        case 5:
          (bl(e, n), t === null && r & 4 && Kc(n), r & 512 && Wc(n, n.return));
          break;
        case 12:
          bl(e, n);
          break;
        case 31:
          (bl(e, n), r & 4 && dl(e, n));
          break;
        case 13:
          (bl(e, n),
            r & 4 && fl(e, n),
            r & 64 &&
              ((e = n.memoizedState),
              e !== null &&
                ((e = e.dehydrated),
                e !== null && ((n = Ju.bind(null, n)), sf(e, n)))));
          break;
        case 22:
          if (((r = n.memoizedState !== null || $c), !r)) {
            ((t = (t !== null && t.memoizedState !== null) || el), (i = $c));
            var a = el;
            (($c = r),
              (el = t) && !a
                ? Sl(e, n, (n.subtreeFlags & 8772) != 0)
                : bl(e, n),
              ($c = i),
              (el = a));
          }
          break;
        case 30:
          break;
        default:
          bl(e, n);
      }
    }
    function ol(e) {
      var t = e.alternate;
      (t !== null && ((e.alternate = null), ol(t)),
        (e.child = null),
        (e.deletions = null),
        (e.sibling = null),
        e.tag === 5 && ((t = e.stateNode), t !== null && gt(t)),
        (e.stateNode = null),
        (e.return = null),
        (e.dependencies = null),
        (e.memoizedProps = null),
        (e.memoizedState = null),
        (e.pendingProps = null),
        (e.stateNode = null),
        (e.updateQueue = null));
    }
    var sl = null,
      cl = !1;
    function ll(e, t, n) {
      for (n = n.child; n !== null; ) (ul(e, t, n), (n = n.sibling));
    }
    function ul(e, t, n) {
      if (Le && typeof Le.onCommitFiberUnmount == `function`)
        try {
          Le.onCommitFiberUnmount(Ie, n);
        } catch {}
      switch (n.tag) {
        case 26:
          (el || Gc(n, t),
            ll(e, t, n),
            n.memoizedState
              ? n.memoizedState.count--
              : n.stateNode &&
                ((n = n.stateNode), n.parentNode.removeChild(n)));
          break;
        case 27:
          el || Gc(n, t);
          var r = sl,
            i = cl;
          (Zd(n.type) && ((sl = n.stateNode), (cl = !1)),
            ll(e, t, n),
            pf(n.stateNode),
            (sl = r),
            (cl = i));
          break;
        case 5:
          el || Gc(n, t);
        case 6:
          if (
            ((r = sl),
            (i = cl),
            (sl = null),
            ll(e, t, n),
            (sl = r),
            (cl = i),
            sl !== null)
          )
            if (cl)
              try {
                (sl.nodeType === 9
                  ? sl.body
                  : sl.nodeName === `HTML`
                    ? sl.ownerDocument.body
                    : sl
                ).removeChild(n.stateNode);
              } catch (e) {
                Z(n, t, e);
              }
            else
              try {
                sl.removeChild(n.stateNode);
              } catch (e) {
                Z(n, t, e);
              }
          break;
        case 18:
          sl !== null &&
            (cl
              ? ((e = sl),
                Qd(
                  e.nodeType === 9
                    ? e.body
                    : e.nodeName === `HTML`
                      ? e.ownerDocument.body
                      : e,
                  n.stateNode,
                ),
                Np(e))
              : Qd(sl, n.stateNode));
          break;
        case 4:
          ((r = sl),
            (i = cl),
            (sl = n.stateNode.containerInfo),
            (cl = !0),
            ll(e, t, n),
            (sl = r),
            (cl = i));
          break;
        case 0:
        case 11:
        case 14:
        case 15:
          (Vc(2, n, t), el || Vc(4, n, t), ll(e, t, n));
          break;
        case 1:
          (el ||
            (Gc(n, t),
            (r = n.stateNode),
            typeof r.componentWillUnmount == `function` && Uc(n, t, r)),
            ll(e, t, n));
          break;
        case 21:
          ll(e, t, n);
          break;
        case 22:
          ((el = (r = el) || n.memoizedState !== null), ll(e, t, n), (el = r));
          break;
        default:
          ll(e, t, n);
      }
    }
    function dl(e, t) {
      if (
        t.memoizedState === null &&
        ((e = t.alternate), e !== null && ((e = e.memoizedState), e !== null))
      ) {
        e = e.dehydrated;
        try {
          Np(e);
        } catch (e) {
          Z(t, t.return, e);
        }
      }
    }
    function fl(e, t) {
      if (
        t.memoizedState === null &&
        ((e = t.alternate),
        e !== null &&
          ((e = e.memoizedState),
          e !== null && ((e = e.dehydrated), e !== null)))
      )
        try {
          Np(e);
        } catch (e) {
          Z(t, t.return, e);
        }
    }
    function pl(e) {
      switch (e.tag) {
        case 31:
        case 13:
        case 19:
          var t = e.stateNode;
          return (t === null && (t = e.stateNode = new nl()), t);
        case 22:
          return (
            (e = e.stateNode),
            (t = e._retryCache),
            t === null && (t = e._retryCache = new nl()),
            t
          );
        default:
          throw Error(a(435, e.tag));
      }
    }
    function ml(e, t) {
      var n = pl(e);
      t.forEach(function (t) {
        if (!n.has(t)) {
          n.add(t);
          var r = Yu.bind(null, e, t);
          t.then(r, r);
        }
      });
    }
    function hl(e, t) {
      var n = t.deletions;
      if (n !== null)
        for (var r = 0; r < n.length; r++) {
          var i = n[r],
            o = e,
            s = t,
            c = s;
          a: for (; c !== null; ) {
            switch (c.tag) {
              case 27:
                if (Zd(c.type)) {
                  ((sl = c.stateNode), (cl = !1));
                  break a;
                }
                break;
              case 5:
                ((sl = c.stateNode), (cl = !1));
                break a;
              case 3:
              case 4:
                ((sl = c.stateNode.containerInfo), (cl = !0));
                break a;
            }
            c = c.return;
          }
          if (sl === null) throw Error(a(160));
          (ul(o, s, i),
            (sl = null),
            (cl = !1),
            (o = i.alternate),
            o !== null && (o.return = null),
            (i.return = null));
        }
      if (t.subtreeFlags & 13886)
        for (t = t.child; t !== null; ) (_l(t, e), (t = t.sibling));
    }
    var gl = null;
    function _l(e, t) {
      var n = e.alternate,
        r = e.flags;
      switch (e.tag) {
        case 0:
        case 11:
        case 14:
        case 15:
          (hl(t, e),
            vl(e),
            r & 4 && (Vc(3, e, e.return), Bc(3, e), Vc(5, e, e.return)));
          break;
        case 1:
          (hl(t, e),
            vl(e),
            r & 512 && (el || n === null || Gc(n, n.return)),
            r & 64 &&
              $c &&
              ((e = e.updateQueue),
              e !== null &&
                ((r = e.callbacks),
                r !== null &&
                  ((n = e.shared.hiddenCallbacks),
                  (e.shared.hiddenCallbacks = n === null ? r : n.concat(r))))));
          break;
        case 26:
          var i = gl;
          if (
            (hl(t, e),
            vl(e),
            r & 512 && (el || n === null || Gc(n, n.return)),
            r & 4)
          ) {
            var o = n === null ? null : n.memoizedState;
            if (((r = e.memoizedState), n === null))
              if (r === null)
                if (e.stateNode === null) {
                  a: {
                    ((r = e.type),
                      (n = e.memoizedProps),
                      (i = i.ownerDocument || i));
                    b: switch (r) {
                      case `title`:
                        ((o = i.getElementsByTagName(`title`)[0]),
                          (!o ||
                            o[ht] ||
                            o[ct] ||
                            o.namespaceURI === `http://www.w3.org/2000/svg` ||
                            o.hasAttribute(`itemprop`)) &&
                            ((o = i.createElement(r)),
                            i.head.insertBefore(
                              o,
                              i.querySelector(`head > title`),
                            )),
                          Pd(o, r, n),
                          (o[ct] = e),
                          xt(o),
                          (r = o));
                        break a;
                      case `link`:
                        var s = Vf(`link`, `href`, i).get(r + (n.href || ``));
                        if (s) {
                          for (var c = 0; c < s.length; c++)
                            if (
                              ((o = s[c]),
                              o.getAttribute(`href`) ===
                                (n.href == null || n.href === ``
                                  ? null
                                  : n.href) &&
                                o.getAttribute(`rel`) ===
                                  (n.rel == null ? null : n.rel) &&
                                o.getAttribute(`title`) ===
                                  (n.title == null ? null : n.title) &&
                                o.getAttribute(`crossorigin`) ===
                                  (n.crossOrigin == null
                                    ? null
                                    : n.crossOrigin))
                            ) {
                              s.splice(c, 1);
                              break b;
                            }
                        }
                        ((o = i.createElement(r)),
                          Pd(o, r, n),
                          i.head.appendChild(o));
                        break;
                      case `meta`:
                        if (
                          (s = Vf(`meta`, `content`, i).get(
                            r + (n.content || ``),
                          ))
                        ) {
                          for (c = 0; c < s.length; c++)
                            if (
                              ((o = s[c]),
                              o.getAttribute(`content`) ===
                                (n.content == null ? null : `` + n.content) &&
                                o.getAttribute(`name`) ===
                                  (n.name == null ? null : n.name) &&
                                o.getAttribute(`property`) ===
                                  (n.property == null ? null : n.property) &&
                                o.getAttribute(`http-equiv`) ===
                                  (n.httpEquiv == null ? null : n.httpEquiv) &&
                                o.getAttribute(`charset`) ===
                                  (n.charSet == null ? null : n.charSet))
                            ) {
                              s.splice(c, 1);
                              break b;
                            }
                        }
                        ((o = i.createElement(r)),
                          Pd(o, r, n),
                          i.head.appendChild(o));
                        break;
                      default:
                        throw Error(a(468, r));
                    }
                    ((o[ct] = e), xt(o), (r = o));
                  }
                  e.stateNode = r;
                } else Hf(i, e.type, e.stateNode);
              else e.stateNode = If(i, r, e.memoizedProps);
            else
              o === r
                ? r === null &&
                  e.stateNode !== null &&
                  qc(e, e.memoizedProps, n.memoizedProps)
                : (o === null
                    ? n.stateNode !== null &&
                      ((n = n.stateNode), n.parentNode.removeChild(n))
                    : o.count--,
                  r === null
                    ? Hf(i, e.type, e.stateNode)
                    : If(i, r, e.memoizedProps));
          }
          break;
        case 27:
          (hl(t, e),
            vl(e),
            r & 512 && (el || n === null || Gc(n, n.return)),
            n !== null && r & 4 && qc(e, e.memoizedProps, n.memoizedProps));
          break;
        case 5:
          if (
            (hl(t, e),
            vl(e),
            r & 512 && (el || n === null || Gc(n, n.return)),
            e.flags & 32)
          ) {
            i = e.stateNode;
            try {
              qt(i, ``);
            } catch (t) {
              Z(e, e.return, t);
            }
          }
          (r & 4 &&
            e.stateNode != null &&
            ((i = e.memoizedProps), qc(e, i, n === null ? i : n.memoizedProps)),
            r & 1024 && (tl = !0));
          break;
        case 6:
          if ((hl(t, e), vl(e), r & 4)) {
            if (e.stateNode === null) throw Error(a(162));
            ((r = e.memoizedProps), (n = e.stateNode));
            try {
              n.nodeValue = r;
            } catch (t) {
              Z(e, e.return, t);
            }
          }
          break;
        case 3:
          if (
            ((Bf = null),
            (i = gl),
            (gl = gf(t.containerInfo)),
            hl(t, e),
            (gl = i),
            vl(e),
            r & 4 && n !== null && n.memoizedState.isDehydrated)
          )
            try {
              Np(t.containerInfo);
            } catch (t) {
              Z(e, e.return, t);
            }
          tl && ((tl = !1), yl(e));
          break;
        case 4:
          ((r = gl),
            (gl = gf(e.stateNode.containerInfo)),
            hl(t, e),
            vl(e),
            (gl = r));
          break;
        case 12:
          (hl(t, e), vl(e));
          break;
        case 31:
          (hl(t, e),
            vl(e),
            r & 4 &&
              ((r = e.updateQueue),
              r !== null && ((e.updateQueue = null), ml(e, r))));
          break;
        case 13:
          (hl(t, e),
            vl(e),
            e.child.flags & 8192 &&
              (e.memoizedState !== null) !=
                (n !== null && n.memoizedState !== null) &&
              ($l = De()),
            r & 4 &&
              ((r = e.updateQueue),
              r !== null && ((e.updateQueue = null), ml(e, r))));
          break;
        case 22:
          i = e.memoizedState !== null;
          var l = n !== null && n.memoizedState !== null,
            u = $c,
            d = el;
          if (
            (($c = u || i),
            (el = d || l),
            hl(t, e),
            (el = d),
            ($c = u),
            vl(e),
            r & 8192)
          )
            a: for (
              t = e.stateNode,
                t._visibility = i ? t._visibility & -2 : t._visibility | 1,
                i && (n === null || l || $c || el || xl(e)),
                n = null,
                t = e;
              ;
            ) {
              if (t.tag === 5 || t.tag === 26) {
                if (n === null) {
                  l = n = t;
                  try {
                    if (((o = l.stateNode), i))
                      ((s = o.style),
                        typeof s.setProperty == `function`
                          ? s.setProperty(`display`, `none`, `important`)
                          : (s.display = `none`));
                    else {
                      c = l.stateNode;
                      var f = l.memoizedProps.style,
                        p =
                          f != null && f.hasOwnProperty(`display`)
                            ? f.display
                            : null;
                      c.style.display =
                        p == null || typeof p == `boolean`
                          ? ``
                          : (`` + p).trim();
                    }
                  } catch (e) {
                    Z(l, l.return, e);
                  }
                }
              } else if (t.tag === 6) {
                if (n === null) {
                  l = t;
                  try {
                    l.stateNode.nodeValue = i ? `` : l.memoizedProps;
                  } catch (e) {
                    Z(l, l.return, e);
                  }
                }
              } else if (t.tag === 18) {
                if (n === null) {
                  l = t;
                  try {
                    var m = l.stateNode;
                    i ? $d(m, !0) : $d(l.stateNode, !1);
                  } catch (e) {
                    Z(l, l.return, e);
                  }
                }
              } else if (
                ((t.tag !== 22 && t.tag !== 23) ||
                  t.memoizedState === null ||
                  t === e) &&
                t.child !== null
              ) {
                ((t.child.return = t), (t = t.child));
                continue;
              }
              if (t === e) break a;
              for (; t.sibling === null; ) {
                if (t.return === null || t.return === e) break a;
                (n === t && (n = null), (t = t.return));
              }
              (n === t && (n = null),
                (t.sibling.return = t.return),
                (t = t.sibling));
            }
          r & 4 &&
            ((r = e.updateQueue),
            r !== null &&
              ((n = r.retryQueue),
              n !== null && ((r.retryQueue = null), ml(e, n))));
          break;
        case 19:
          (hl(t, e),
            vl(e),
            r & 4 &&
              ((r = e.updateQueue),
              r !== null && ((e.updateQueue = null), ml(e, r))));
          break;
        case 30:
          break;
        case 21:
          break;
        default:
          (hl(t, e), vl(e));
      }
    }
    function vl(e) {
      var t = e.flags;
      if (t & 2) {
        try {
          for (var n, r = e.return; r !== null; ) {
            if (Jc(r)) {
              n = r;
              break;
            }
            r = r.return;
          }
          if (n == null) throw Error(a(160));
          switch (n.tag) {
            case 27:
              var i = n.stateNode;
              Zc(e, Yc(e), i);
              break;
            case 5:
              var o = n.stateNode;
              (n.flags & 32 && (qt(o, ``), (n.flags &= -33)), Zc(e, Yc(e), o));
              break;
            case 3:
            case 4:
              var s = n.stateNode.containerInfo;
              Xc(e, Yc(e), s);
              break;
            default:
              throw Error(a(161));
          }
        } catch (t) {
          Z(e, e.return, t);
        }
        e.flags &= -3;
      }
      t & 4096 && (e.flags &= -4097);
    }
    function yl(e) {
      if (e.subtreeFlags & 1024)
        for (e = e.child; e !== null; ) {
          var t = e;
          (yl(t),
            t.tag === 5 && t.flags & 1024 && t.stateNode.reset(),
            (e = e.sibling));
        }
    }
    function bl(e, t) {
      if (t.subtreeFlags & 8772)
        for (t = t.child; t !== null; )
          (al(e, t.alternate, t), (t = t.sibling));
    }
    function xl(e) {
      for (e = e.child; e !== null; ) {
        var t = e;
        switch (t.tag) {
          case 0:
          case 11:
          case 14:
          case 15:
            (Vc(4, t, t.return), xl(t));
            break;
          case 1:
            Gc(t, t.return);
            var n = t.stateNode;
            (typeof n.componentWillUnmount == `function` && Uc(t, t.return, n),
              xl(t));
            break;
          case 27:
            pf(t.stateNode);
          case 26:
          case 5:
            (Gc(t, t.return), xl(t));
            break;
          case 22:
            t.memoizedState === null && xl(t);
            break;
          case 30:
            xl(t);
            break;
          default:
            xl(t);
        }
        e = e.sibling;
      }
    }
    function Sl(e, t, n) {
      for (n &&= (t.subtreeFlags & 8772) != 0, t = t.child; t !== null; ) {
        var r = t.alternate,
          i = e,
          a = t,
          o = a.flags;
        switch (a.tag) {
          case 0:
          case 11:
          case 15:
            (Sl(i, a, n), Bc(4, a));
            break;
          case 1:
            if (
              (Sl(i, a, n),
              (r = a),
              (i = r.stateNode),
              typeof i.componentDidMount == `function`)
            )
              try {
                i.componentDidMount();
              } catch (e) {
                Z(r, r.return, e);
              }
            if (((r = a), (i = r.updateQueue), i !== null)) {
              var s = r.stateNode;
              try {
                var c = i.shared.hiddenCallbacks;
                if (c !== null)
                  for (
                    i.shared.hiddenCallbacks = null, i = 0;
                    i < c.length;
                    i++
                  )
                    Ja(c[i], s);
              } catch (e) {
                Z(r, r.return, e);
              }
            }
            (n && o & 64 && Hc(a), Wc(a, a.return));
            break;
          case 27:
            Qc(a);
          case 26:
          case 5:
            (Sl(i, a, n), n && r === null && o & 4 && Kc(a), Wc(a, a.return));
            break;
          case 12:
            Sl(i, a, n);
            break;
          case 31:
            (Sl(i, a, n), n && o & 4 && dl(i, a));
            break;
          case 13:
            (Sl(i, a, n), n && o & 4 && fl(i, a));
            break;
          case 22:
            (a.memoizedState === null && Sl(i, a, n), Wc(a, a.return));
            break;
          case 30:
            break;
          default:
            Sl(i, a, n);
        }
        t = t.sibling;
      }
    }
    function Cl(e, t) {
      var n = null;
      (e !== null &&
        e.memoizedState !== null &&
        e.memoizedState.cachePool !== null &&
        (n = e.memoizedState.cachePool.pool),
        (e = null),
        t.memoizedState !== null &&
          t.memoizedState.cachePool !== null &&
          (e = t.memoizedState.cachePool.pool),
        e !== n && (e != null && e.refCount++, n != null && sa(n)));
    }
    function wl(e, t) {
      ((e = null),
        t.alternate !== null && (e = t.alternate.memoizedState.cache),
        (t = t.memoizedState.cache),
        t !== e && (t.refCount++, e != null && sa(e)));
    }
    function Tl(e, t, n, r) {
      if (t.subtreeFlags & 10256)
        for (t = t.child; t !== null; ) (El(e, t, n, r), (t = t.sibling));
    }
    function El(e, t, n, r) {
      var i = t.flags;
      switch (t.tag) {
        case 0:
        case 11:
        case 15:
          (Tl(e, t, n, r), i & 2048 && Bc(9, t));
          break;
        case 1:
          Tl(e, t, n, r);
          break;
        case 3:
          (Tl(e, t, n, r),
            i & 2048 &&
              ((e = null),
              t.alternate !== null && (e = t.alternate.memoizedState.cache),
              (t = t.memoizedState.cache),
              t !== e && (t.refCount++, e != null && sa(e))));
          break;
        case 12:
          if (i & 2048) {
            (Tl(e, t, n, r), (e = t.stateNode));
            try {
              var a = t.memoizedProps,
                o = a.id,
                s = a.onPostCommit;
              typeof s == `function` &&
                s(
                  o,
                  t.alternate === null ? `mount` : `update`,
                  e.passiveEffectDuration,
                  -0,
                );
            } catch (e) {
              Z(t, t.return, e);
            }
          } else Tl(e, t, n, r);
          break;
        case 31:
          Tl(e, t, n, r);
          break;
        case 13:
          Tl(e, t, n, r);
          break;
        case 23:
          break;
        case 22:
          ((a = t.stateNode),
            (o = t.alternate),
            t.memoizedState === null
              ? a._visibility & 2
                ? Tl(e, t, n, r)
                : ((a._visibility |= 2),
                  Dl(e, t, n, r, (t.subtreeFlags & 10256) != 0 || !1))
              : a._visibility & 2
                ? Tl(e, t, n, r)
                : Ol(e, t),
            i & 2048 && Cl(o, t));
          break;
        case 24:
          (Tl(e, t, n, r), i & 2048 && wl(t.alternate, t));
          break;
        default:
          Tl(e, t, n, r);
      }
    }
    function Dl(e, t, n, r, i) {
      for (
        i &&= (t.subtreeFlags & 10256) != 0 || !1, t = t.child;
        t !== null;
      ) {
        var a = e,
          o = t,
          s = n,
          c = r,
          l = o.flags;
        switch (o.tag) {
          case 0:
          case 11:
          case 15:
            (Dl(a, o, s, c, i), Bc(8, o));
            break;
          case 23:
            break;
          case 22:
            var u = o.stateNode;
            (o.memoizedState === null
              ? ((u._visibility |= 2), Dl(a, o, s, c, i))
              : u._visibility & 2
                ? Dl(a, o, s, c, i)
                : Ol(a, o),
              i && l & 2048 && Cl(o.alternate, o));
            break;
          case 24:
            (Dl(a, o, s, c, i), i && l & 2048 && wl(o.alternate, o));
            break;
          default:
            Dl(a, o, s, c, i);
        }
        t = t.sibling;
      }
    }
    function Ol(e, t) {
      if (t.subtreeFlags & 10256)
        for (t = t.child; t !== null; ) {
          var n = e,
            r = t,
            i = r.flags;
          switch (r.tag) {
            case 22:
              (Ol(n, r), i & 2048 && Cl(r.alternate, r));
              break;
            case 24:
              (Ol(n, r), i & 2048 && wl(r.alternate, r));
              break;
            default:
              Ol(n, r);
          }
          t = t.sibling;
        }
    }
    var kl = 8192;
    function Al(e, t, n) {
      if (e.subtreeFlags & kl)
        for (e = e.child; e !== null; ) (jl(e, t, n), (e = e.sibling));
    }
    function jl(e, t, n) {
      switch (e.tag) {
        case 26:
          (Al(e, t, n),
            e.flags & kl &&
              e.memoizedState !== null &&
              Gf(n, gl, e.memoizedState, e.memoizedProps));
          break;
        case 5:
          Al(e, t, n);
          break;
        case 3:
        case 4:
          var r = gl;
          ((gl = gf(e.stateNode.containerInfo)), Al(e, t, n), (gl = r));
          break;
        case 22:
          e.memoizedState === null &&
            ((r = e.alternate),
            r !== null && r.memoizedState !== null
              ? ((r = kl), (kl = 16777216), Al(e, t, n), (kl = r))
              : Al(e, t, n));
          break;
        default:
          Al(e, t, n);
      }
    }
    function Ml(e) {
      var t = e.alternate;
      if (t !== null && ((e = t.child), e !== null)) {
        t.child = null;
        do ((t = e.sibling), (e.sibling = null), (e = t));
        while (e !== null);
      }
    }
    function Nl(e) {
      var t = e.deletions;
      if (e.flags & 16) {
        if (t !== null)
          for (var n = 0; n < t.length; n++) {
            var r = t[n];
            ((rl = r), Il(r, e));
          }
        Ml(e);
      }
      if (e.subtreeFlags & 10256)
        for (e = e.child; e !== null; ) (Pl(e), (e = e.sibling));
    }
    function Pl(e) {
      switch (e.tag) {
        case 0:
        case 11:
        case 15:
          (Nl(e), e.flags & 2048 && Vc(9, e, e.return));
          break;
        case 3:
          Nl(e);
          break;
        case 12:
          Nl(e);
          break;
        case 22:
          var t = e.stateNode;
          e.memoizedState !== null &&
          t._visibility & 2 &&
          (e.return === null || e.return.tag !== 13)
            ? ((t._visibility &= -3), Fl(e))
            : Nl(e);
          break;
        default:
          Nl(e);
      }
    }
    function Fl(e) {
      var t = e.deletions;
      if (e.flags & 16) {
        if (t !== null)
          for (var n = 0; n < t.length; n++) {
            var r = t[n];
            ((rl = r), Il(r, e));
          }
        Ml(e);
      }
      for (e = e.child; e !== null; ) {
        switch (((t = e), t.tag)) {
          case 0:
          case 11:
          case 15:
            (Vc(8, t, t.return), Fl(t));
            break;
          case 22:
            ((n = t.stateNode),
              n._visibility & 2 && ((n._visibility &= -3), Fl(t)));
            break;
          default:
            Fl(t);
        }
        e = e.sibling;
      }
    }
    function Il(e, t) {
      for (; rl !== null; ) {
        var n = rl;
        switch (n.tag) {
          case 0:
          case 11:
          case 15:
            Vc(8, n, t);
            break;
          case 23:
          case 22:
            if (
              n.memoizedState !== null &&
              n.memoizedState.cachePool !== null
            ) {
              var r = n.memoizedState.cachePool.pool;
              r != null && r.refCount++;
            }
            break;
          case 24:
            sa(n.memoizedState.cache);
        }
        if (((r = n.child), r !== null)) ((r.return = n), (rl = r));
        else
          a: for (n = e; rl !== null; ) {
            r = rl;
            var i = r.sibling,
              a = r.return;
            if ((ol(r), r === n)) {
              rl = null;
              break a;
            }
            if (i !== null) {
              ((i.return = a), (rl = i));
              break a;
            }
            rl = a;
          }
      }
    }
    var Ll = {
        getCacheForType: function (e) {
          var t = $i(aa),
            n = t.data.get(e);
          return (n === void 0 && ((n = e()), t.data.set(e, n)), n);
        },
        cacheSignal: function () {
          return $i(aa).controller.signal;
        },
      },
      Rl = typeof WeakMap == `function` ? WeakMap : Map,
      K = 0,
      q = null,
      J = null,
      Y = 0,
      X = 0,
      zl = null,
      Bl = !1,
      Vl = !1,
      Hl = !1,
      Ul = 0,
      Wl = 0,
      Gl = 0,
      Kl = 0,
      ql = 0,
      Jl = 0,
      Yl = 0,
      Xl = null,
      Zl = null,
      Ql = !1,
      $l = 0,
      eu = 0,
      tu = 1 / 0,
      nu = null,
      ru = null,
      iu = 0,
      au = null,
      ou = null,
      su = 0,
      cu = 0,
      lu = null,
      uu = null,
      du = 0,
      fu = null;
    function pu() {
      return K & 2 && Y !== 0 ? Y & -Y : k.T === null ? at() : dd();
    }
    function mu() {
      if (Jl === 0)
        if (!(Y & 536870912) || V) {
          var e = We;
          ((We <<= 1), !(We & 3932160) && (We = 262144), (Jl = e));
        } else Jl = 536870912;
      return ((e = to.current), e !== null && (e.flags |= 32), Jl);
    }
    function hu(e, t, n) {
      (((e === q && (X === 2 || X === 9)) || e.cancelPendingCommit !== null) &&
        (Su(e, 0), yu(e, Y, Jl, !1)),
        Qe(e, n),
        (!(K & 2) || e !== q) &&
          (e === q && (!(K & 2) && (Kl |= n), Wl === 4 && yu(e, Y, Jl, !1)),
          rd(e)));
    }
    function gu(e, t, n) {
      if (K & 6) throw Error(a(327));
      var r = (!n && (t & 127) == 0 && (t & e.expiredLanes) === 0) || Je(e, t),
        i = r ? Au(e, t) : Ou(e, t, !0),
        o = r;
      do {
        if (i === 0) {
          Vl && !r && yu(e, t, 0, !1);
          break;
        } else {
          if (((n = e.current.alternate), o && !vu(n))) {
            ((i = Ou(e, t, !1)), (o = !1));
            continue;
          }
          if (i === 2) {
            if (((o = t), e.errorRecoveryDisabledLanes & o)) var s = 0;
            else
              ((s = e.pendingLanes & -536870913),
                (s = s === 0 ? (s & 536870912 ? 536870912 : 0) : s));
            if (s !== 0) {
              t = s;
              a: {
                var c = e;
                i = Xl;
                var l = c.current.memoizedState.isDehydrated;
                if (
                  (l && (Su(c, s).flags |= 256), (s = Ou(c, s, !1)), s !== 2)
                ) {
                  if (Hl && !l) {
                    ((c.errorRecoveryDisabledLanes |= o), (Kl |= o), (i = 4));
                    break a;
                  }
                  ((o = Zl),
                    (Zl = i),
                    o !== null &&
                      (Zl === null ? (Zl = o) : Zl.push.apply(Zl, o)));
                }
                i = s;
              }
              if (((o = !1), i !== 2)) continue;
            }
          }
          if (i === 1) {
            (Su(e, 0), yu(e, t, 0, !0));
            break;
          }
          a: {
            switch (((r = e), (o = i), o)) {
              case 0:
              case 1:
                throw Error(a(345));
              case 4:
                if ((t & 4194048) !== t) break;
              case 6:
                yu(r, t, Jl, !Bl);
                break a;
              case 2:
                Zl = null;
                break;
              case 3:
              case 5:
                break;
              default:
                throw Error(a(329));
            }
            if ((t & 62914560) === t && ((i = $l + 300 - De()), 10 < i)) {
              if ((yu(r, t, Jl, !Bl), qe(r, 0, !0) !== 0)) break a;
              ((su = t),
                (r.timeoutHandle = Kd(
                  _u.bind(
                    null,
                    r,
                    n,
                    Zl,
                    nu,
                    Ql,
                    t,
                    Jl,
                    Kl,
                    Yl,
                    Bl,
                    o,
                    `Throttled`,
                    -0,
                    0,
                  ),
                  i,
                )));
              break a;
            }
            _u(r, n, Zl, nu, Ql, t, Jl, Kl, Yl, Bl, o, null, -0, 0);
          }
        }
        break;
      } while (1);
      rd(e);
    }
    function _u(e, t, n, r, i, a, o, s, c, l, u, d, f, p) {
      if (
        ((e.timeoutHandle = -1),
        (d = t.subtreeFlags),
        d & 8192 || (d & 16785408) == 16785408)
      ) {
        ((d = {
          stylesheets: null,
          count: 0,
          imgCount: 0,
          imgBytes: 0,
          suspenseyImages: [],
          waitingForImages: !0,
          waitingForViewTransition: !1,
          unsuspend: tn,
        }),
          jl(t, a, d));
        var m =
          (a & 62914560) === a
            ? $l - De()
            : (a & 4194048) === a
              ? eu - De()
              : 0;
        if (((m = qf(d, m)), m !== null)) {
          ((su = a),
            (e.cancelPendingCommit = m(
              Lu.bind(null, e, t, a, n, r, i, o, s, c, u, d, null, f, p),
            )),
            yu(e, a, o, !l));
          return;
        }
      }
      Lu(e, t, a, n, r, i, o, s, c);
    }
    function vu(e) {
      for (var t = e; ; ) {
        var n = t.tag;
        if (
          (n === 0 || n === 11 || n === 15) &&
          t.flags & 16384 &&
          ((n = t.updateQueue), n !== null && ((n = n.stores), n !== null))
        )
          for (var r = 0; r < n.length; r++) {
            var i = n[r],
              a = i.getSnapshot;
            i = i.value;
            try {
              if (!Sr(a(), i)) return !1;
            } catch {
              return !1;
            }
          }
        if (((n = t.child), t.subtreeFlags & 16384 && n !== null))
          ((n.return = t), (t = n));
        else {
          if (t === e) break;
          for (; t.sibling === null; ) {
            if (t.return === null || t.return === e) return !0;
            t = t.return;
          }
          ((t.sibling.return = t.return), (t = t.sibling));
        }
      }
      return !0;
    }
    function yu(e, t, n, r) {
      ((t &= ~ql),
        (t &= ~Kl),
        (e.suspendedLanes |= t),
        (e.pingedLanes &= ~t),
        r && (e.warmLanes |= t),
        (r = e.expirationTimes));
      for (var i = t; 0 < i; ) {
        var a = 31 - ze(i),
          o = 1 << a;
        ((r[a] = -1), (i &= ~o));
      }
      n !== 0 && et(e, n, t);
    }
    function bu() {
      return K & 6 ? !0 : (id(0, !1), !1);
    }
    function xu() {
      if (J !== null) {
        if (X === 0) var e = J.return;
        else ((e = J), (Gi = Wi = null), Do(e), (Aa = null), (ja = 0), (e = J));
        for (; e !== null; ) (zc(e.alternate, e), (e = e.return));
        J = null;
      }
    }
    function Su(e, t) {
      var n = e.timeoutHandle;
      (n !== -1 && ((e.timeoutHandle = -1), qd(n)),
        (n = e.cancelPendingCommit),
        n !== null && ((e.cancelPendingCommit = null), n()),
        (su = 0),
        xu(),
        (q = e),
        (J = n = li(e.current, null)),
        (Y = t),
        (X = 0),
        (zl = null),
        (Bl = !1),
        (Vl = Je(e, t)),
        (Hl = !1),
        (Yl = Jl = ql = Kl = Gl = Wl = 0),
        (Zl = Xl = null),
        (Ql = !1),
        t & 8 && (t |= t & 32));
      var r = e.entangledLanes;
      if (r !== 0)
        for (e = e.entanglements, r &= t; 0 < r; ) {
          var i = 31 - ze(r),
            a = 1 << i;
          ((t |= e[i]), (r &= ~a));
        }
      return ((Ul = t), $r(), n);
    }
    function Cu(e, t) {
      ((H = null),
        (k.H = Ls),
        t === ba || t === Sa
          ? ((t = Oa()), (X = 3))
          : t === xa
            ? ((t = Oa()), (X = 4))
            : (X =
                t === tc
                  ? 8
                  : typeof t == `object` && t && typeof t.then == `function`
                    ? 6
                    : 1),
        (zl = t),
        J === null && ((Wl = 1), Ys(e, _i(t, e.current))));
    }
    function wu() {
      var e = to.current;
      return e === null
        ? !0
        : (Y & 4194048) === Y
          ? no === null
          : (Y & 62914560) === Y || Y & 536870912
            ? e === no
            : !1;
    }
    function Tu() {
      var e = k.H;
      return ((k.H = Ls), e === null ? Ls : e);
    }
    function Eu() {
      var e = k.A;
      return ((k.A = Ll), e);
    }
    function Du() {
      ((Wl = 4),
        Bl || ((Y & 4194048) !== Y && to.current !== null) || (Vl = !0),
        (!(Gl & 134217727) && !(Kl & 134217727)) ||
          q === null ||
          yu(q, Y, Jl, !1));
    }
    function Ou(e, t, n) {
      var r = K;
      K |= 2;
      var i = Tu(),
        a = Eu();
      ((q !== e || Y !== t) && ((nu = null), Su(e, t)), (t = !1));
      var o = Wl;
      a: do
        try {
          if (X !== 0 && J !== null) {
            var s = J,
              c = zl;
            switch (X) {
              case 8:
                (xu(), (o = 6));
                break a;
              case 3:
              case 2:
              case 9:
              case 6:
                to.current === null && (t = !0);
                var l = X;
                if (((X = 0), (zl = null), Pu(e, s, c, l), n && Vl)) {
                  o = 0;
                  break a;
                }
                break;
              default:
                ((l = X), (X = 0), (zl = null), Pu(e, s, c, l));
            }
          }
          (ku(), (o = Wl));
          break;
        } catch (t) {
          Cu(e, t);
        }
      while (1);
      return (
        t && e.shellSuspendCounter++,
        (Gi = Wi = null),
        (K = r),
        (k.H = i),
        (k.A = a),
        J === null && ((q = null), (Y = 0), $r()),
        o
      );
    }
    function ku() {
      for (; J !== null; ) Mu(J);
    }
    function Au(e, t) {
      var n = K;
      K |= 2;
      var r = Tu(),
        i = Eu();
      q !== e || Y !== t
        ? ((nu = null), (tu = De() + 500), Su(e, t))
        : (Vl = Je(e, t));
      a: do
        try {
          if (X !== 0 && J !== null) {
            t = J;
            var o = zl;
            b: switch (X) {
              case 1:
                ((X = 0), (zl = null), Pu(e, t, o, 1));
                break;
              case 2:
              case 9:
                if (wa(o)) {
                  ((X = 0), (zl = null), Nu(t));
                  break;
                }
                ((t = function () {
                  ((X !== 2 && X !== 9) || q !== e || (X = 7), rd(e));
                }),
                  o.then(t, t));
                break a;
              case 3:
                X = 7;
                break a;
              case 4:
                X = 5;
                break a;
              case 7:
                wa(o)
                  ? ((X = 0), (zl = null), Nu(t))
                  : ((X = 0), (zl = null), Pu(e, t, o, 7));
                break;
              case 5:
                var s = null;
                switch (J.tag) {
                  case 26:
                    s = J.memoizedState;
                  case 5:
                  case 27:
                    var c = J;
                    if (s ? Wf(s) : c.stateNode.complete) {
                      ((X = 0), (zl = null));
                      var l = c.sibling;
                      if (l !== null) J = l;
                      else {
                        var u = c.return;
                        u === null ? (J = null) : ((J = u), Fu(u));
                      }
                      break b;
                    }
                }
                ((X = 0), (zl = null), Pu(e, t, o, 5));
                break;
              case 6:
                ((X = 0), (zl = null), Pu(e, t, o, 6));
                break;
              case 8:
                (xu(), (Wl = 6));
                break a;
              default:
                throw Error(a(462));
            }
          }
          ju();
          break;
        } catch (t) {
          Cu(e, t);
        }
      while (1);
      return (
        (Gi = Wi = null),
        (k.H = r),
        (k.A = i),
        (K = n),
        J === null ? ((q = null), (Y = 0), $r(), Wl) : 0
      );
    }
    function ju() {
      for (; J !== null && !Te(); ) Mu(J);
    }
    function Mu(e) {
      var t = jc(e.alternate, e, Ul);
      ((e.memoizedProps = e.pendingProps), t === null ? Fu(e) : (J = t));
    }
    function Nu(e) {
      var t = e,
        n = t.alternate;
      switch (t.tag) {
        case 15:
        case 0:
          t = hc(n, t, t.pendingProps, t.type, void 0, Y);
          break;
        case 11:
          t = hc(n, t, t.pendingProps, t.type.render, t.ref, Y);
          break;
        case 5:
          Do(t);
        default:
          (zc(n, t), (t = J = ui(t, Ul)), (t = jc(n, t, Ul)));
      }
      ((e.memoizedProps = e.pendingProps), t === null ? Fu(e) : (J = t));
    }
    function Pu(e, t, n, r) {
      ((Gi = Wi = null), Do(t), (Aa = null), (ja = 0));
      var i = t.return;
      try {
        if (ec(e, i, t, n, Y)) {
          ((Wl = 1), Ys(e, _i(n, e.current)), (J = null));
          return;
        }
      } catch (t) {
        if (i !== null) throw ((J = i), t);
        ((Wl = 1), Ys(e, _i(n, e.current)), (J = null));
        return;
      }
      t.flags & 32768
        ? (V || r === 1
            ? (e = !0)
            : Vl || Y & 536870912
              ? (e = !1)
              : ((Bl = e = !0),
                (r === 2 || r === 9 || r === 3 || r === 6) &&
                  ((r = to.current),
                  r !== null && r.tag === 13 && (r.flags |= 16384))),
          Iu(t, e))
        : Fu(t);
    }
    function Fu(e) {
      var t = e;
      do {
        if (t.flags & 32768) {
          Iu(t, Bl);
          return;
        }
        e = t.return;
        var n = Lc(t.alternate, t, Ul);
        if (n !== null) {
          J = n;
          return;
        }
        if (((t = t.sibling), t !== null)) {
          J = t;
          return;
        }
        J = t = e;
      } while (t !== null);
      Wl === 0 && (Wl = 5);
    }
    function Iu(e, t) {
      do {
        var n = Rc(e.alternate, e);
        if (n !== null) {
          ((n.flags &= 32767), (J = n));
          return;
        }
        if (
          ((n = e.return),
          n !== null &&
            ((n.flags |= 32768), (n.subtreeFlags = 0), (n.deletions = null)),
          !t && ((e = e.sibling), e !== null))
        ) {
          J = e;
          return;
        }
        J = e = n;
      } while (e !== null);
      ((Wl = 6), (J = null));
    }
    function Lu(e, t, n, r, i, o, s, c, l) {
      e.cancelPendingCommit = null;
      do Hu();
      while (iu !== 0);
      if (K & 6) throw Error(a(327));
      if (t !== null) {
        if (t === e.current) throw Error(a(177));
        if (
          ((o = t.lanes | t.childLanes),
          (o |= Qr),
          $e(e, n, o, s, c, l),
          e === q && ((J = q = null), (Y = 0)),
          (ou = t),
          (au = e),
          (su = n),
          (cu = o),
          (lu = i),
          (uu = r),
          t.subtreeFlags & 10256 || t.flags & 10256
            ? ((e.callbackNode = null),
              (e.callbackPriority = 0),
              Xu(je, function () {
                return (Uu(), null);
              }))
            : ((e.callbackNode = null), (e.callbackPriority = 0)),
          (r = (t.flags & 13878) != 0),
          t.subtreeFlags & 13878 || r)
        ) {
          ((r = k.T), (k.T = null), (i = A.p), (A.p = 2), (s = K), (K |= 4));
          try {
            il(e, t, n);
          } finally {
            ((K = s), (A.p = i), (k.T = r));
          }
        }
        ((iu = 1), Ru(), zu(), Bu());
      }
    }
    function Ru() {
      if (iu === 1) {
        iu = 0;
        var e = au,
          t = ou,
          n = (t.flags & 13878) != 0;
        if (t.subtreeFlags & 13878 || n) {
          ((n = k.T), (k.T = null));
          var r = A.p;
          A.p = 2;
          var i = K;
          K |= 4;
          try {
            _l(t, e);
            var a = zd,
              o = Dr(e.containerInfo),
              s = a.focusedElem,
              c = a.selectionRange;
            if (
              o !== s &&
              s &&
              s.ownerDocument &&
              Er(s.ownerDocument.documentElement, s)
            ) {
              if (c !== null && Or(s)) {
                var l = c.start,
                  u = c.end;
                if ((u === void 0 && (u = l), `selectionStart` in s))
                  ((s.selectionStart = l),
                    (s.selectionEnd = Math.min(u, s.value.length)));
                else {
                  var d = s.ownerDocument || document,
                    f = (d && d.defaultView) || window;
                  if (f.getSelection) {
                    var p = f.getSelection(),
                      m = s.textContent.length,
                      h = Math.min(c.start, m),
                      g = c.end === void 0 ? h : Math.min(c.end, m);
                    !p.extend && h > g && ((o = g), (g = h), (h = o));
                    var _ = Tr(s, h),
                      v = Tr(s, g);
                    if (
                      _ &&
                      v &&
                      (p.rangeCount !== 1 ||
                        p.anchorNode !== _.node ||
                        p.anchorOffset !== _.offset ||
                        p.focusNode !== v.node ||
                        p.focusOffset !== v.offset)
                    ) {
                      var y = d.createRange();
                      (y.setStart(_.node, _.offset),
                        p.removeAllRanges(),
                        h > g
                          ? (p.addRange(y), p.extend(v.node, v.offset))
                          : (y.setEnd(v.node, v.offset), p.addRange(y)));
                    }
                  }
                }
              }
              for (d = [], p = s; (p = p.parentNode); )
                p.nodeType === 1 &&
                  d.push({ element: p, left: p.scrollLeft, top: p.scrollTop });
              for (
                typeof s.focus == `function` && s.focus(), s = 0;
                s < d.length;
                s++
              ) {
                var b = d[s];
                ((b.element.scrollLeft = b.left),
                  (b.element.scrollTop = b.top));
              }
            }
            ((sp = !!Rd), (zd = Rd = null));
          } finally {
            ((K = i), (A.p = r), (k.T = n));
          }
        }
        ((e.current = t), (iu = 2));
      }
    }
    function zu() {
      if (iu === 2) {
        iu = 0;
        var e = au,
          t = ou,
          n = (t.flags & 8772) != 0;
        if (t.subtreeFlags & 8772 || n) {
          ((n = k.T), (k.T = null));
          var r = A.p;
          A.p = 2;
          var i = K;
          K |= 4;
          try {
            al(e, t.alternate, t);
          } finally {
            ((K = i), (A.p = r), (k.T = n));
          }
        }
        iu = 3;
      }
    }
    function Bu() {
      if (iu === 4 || iu === 3) {
        ((iu = 0), Ee());
        var e = au,
          t = ou,
          n = su,
          r = uu;
        t.subtreeFlags & 10256 || t.flags & 10256
          ? (iu = 5)
          : ((iu = 0), (ou = au = null), Vu(e, e.pendingLanes));
        var i = e.pendingLanes;
        if (
          (i === 0 && (ru = null),
          it(n),
          (t = t.stateNode),
          Le && typeof Le.onCommitFiberRoot == `function`)
        )
          try {
            Le.onCommitFiberRoot(Ie, t, void 0, (t.current.flags & 128) == 128);
          } catch {}
        if (r !== null) {
          ((t = k.T), (i = A.p), (A.p = 2), (k.T = null));
          try {
            for (var a = e.onRecoverableError, o = 0; o < r.length; o++) {
              var s = r[o];
              a(s.value, { componentStack: s.stack });
            }
          } finally {
            ((k.T = t), (A.p = i));
          }
        }
        (su & 3 && Hu(),
          rd(e),
          (i = e.pendingLanes),
          n & 261930 && i & 42
            ? e === fu
              ? du++
              : ((du = 0), (fu = e))
            : (du = 0),
          id(0, !1));
      }
    }
    function Vu(e, t) {
      (e.pooledCacheLanes &= t) === 0 &&
        ((t = e.pooledCache), t != null && ((e.pooledCache = null), sa(t)));
    }
    function Hu() {
      return (Ru(), zu(), Bu(), Uu());
    }
    function Uu() {
      if (iu !== 5) return !1;
      var e = au,
        t = cu;
      cu = 0;
      var n = it(su),
        r = k.T,
        i = A.p;
      try {
        ((A.p = 32 > n ? 32 : n), (k.T = null), (n = lu), (lu = null));
        var o = au,
          s = su;
        if (((iu = 0), (ou = au = null), (su = 0), K & 6)) throw Error(a(331));
        var c = K;
        if (
          ((K |= 4),
          Pl(o.current),
          El(o, o.current, s, n),
          (K = c),
          id(0, !1),
          Le && typeof Le.onPostCommitFiberRoot == `function`)
        )
          try {
            Le.onPostCommitFiberRoot(Ie, o);
          } catch {}
        return !0;
      } finally {
        ((A.p = i), (k.T = r), Vu(e, t));
      }
    }
    function Wu(e, t, n) {
      ((t = _i(n, t)),
        (t = Zs(e.stateNode, t, 2)),
        (e = Ha(e, t, 2)),
        e !== null && (Qe(e, 2), rd(e)));
    }
    function Z(e, t, n) {
      if (e.tag === 3) Wu(e, e, n);
      else
        for (; t !== null; ) {
          if (t.tag === 3) {
            Wu(t, e, n);
            break;
          } else if (t.tag === 1) {
            var r = t.stateNode;
            if (
              typeof t.type.getDerivedStateFromError == `function` ||
              (typeof r.componentDidCatch == `function` &&
                (ru === null || !ru.has(r)))
            ) {
              ((e = _i(n, e)),
                (n = Qs(2)),
                (r = Ha(t, n, 2)),
                r !== null && ($s(n, r, t, e), Qe(r, 2), rd(r)));
              break;
            }
          }
          t = t.return;
        }
    }
    function Gu(e, t, n) {
      var r = e.pingCache;
      if (r === null) {
        r = e.pingCache = new Rl();
        var i = new Set();
        r.set(t, i);
      } else ((i = r.get(t)), i === void 0 && ((i = new Set()), r.set(t, i)));
      i.has(n) ||
        ((Hl = !0), i.add(n), (e = Ku.bind(null, e, t, n)), t.then(e, e));
    }
    function Ku(e, t, n) {
      var r = e.pingCache;
      (r !== null && r.delete(t),
        (e.pingedLanes |= e.suspendedLanes & n),
        (e.warmLanes &= ~n),
        q === e &&
          (Y & n) === n &&
          (Wl === 4 || (Wl === 3 && (Y & 62914560) === Y && 300 > De() - $l)
            ? !(K & 2) && Su(e, 0)
            : (ql |= n),
          Yl === Y && (Yl = 0)),
        rd(e));
    }
    function qu(e, t) {
      (t === 0 && (t = Xe()), (e = ni(e, t)), e !== null && (Qe(e, t), rd(e)));
    }
    function Ju(e) {
      var t = e.memoizedState,
        n = 0;
      (t !== null && (n = t.retryLane), qu(e, n));
    }
    function Yu(e, t) {
      var n = 0;
      switch (e.tag) {
        case 31:
        case 13:
          var r = e.stateNode,
            i = e.memoizedState;
          i !== null && (n = i.retryLane);
          break;
        case 19:
          r = e.stateNode;
          break;
        case 22:
          r = e.stateNode._retryCache;
          break;
        default:
          throw Error(a(314));
      }
      (r !== null && r.delete(t), qu(e, n));
    }
    function Xu(e, t) {
      return Ce(e, t);
    }
    var Zu = null,
      Qu = null,
      $u = !1,
      ed = !1,
      td = !1,
      nd = 0;
    function rd(e) {
      (e !== Qu &&
        e.next === null &&
        (Qu === null ? (Zu = Qu = e) : (Qu = Qu.next = e)),
        (ed = !0),
        $u || (($u = !0), ud()));
    }
    function id(e, t) {
      if (!td && ed) {
        td = !0;
        do
          for (var n = !1, r = Zu; r !== null; ) {
            if (!t)
              if (e !== 0) {
                var i = r.pendingLanes;
                if (i === 0) var a = 0;
                else {
                  var o = r.suspendedLanes,
                    s = r.pingedLanes;
                  ((a = (1 << (31 - ze(42 | e) + 1)) - 1),
                    (a &= i & ~(o & ~s)),
                    (a = a & 201326741 ? (a & 201326741) | 1 : a ? a | 2 : 0));
                }
                a !== 0 && ((n = !0), ld(r, a));
              } else
                ((a = Y),
                  (a = qe(
                    r,
                    r === q ? a : 0,
                    r.cancelPendingCommit !== null || r.timeoutHandle !== -1,
                  )),
                  !(a & 3) || Je(r, a) || ((n = !0), ld(r, a)));
            r = r.next;
          }
        while (n);
        td = !1;
      }
    }
    function ad() {
      od();
    }
    function od() {
      ed = $u = !1;
      var e = 0;
      nd !== 0 && Gd() && (e = nd);
      for (var t = De(), n = null, r = Zu; r !== null; ) {
        var i = r.next,
          a = sd(r, t);
        (a === 0
          ? ((r.next = null),
            n === null ? (Zu = i) : (n.next = i),
            i === null && (Qu = n))
          : ((n = r), (e !== 0 || a & 3) && (ed = !0)),
          (r = i));
      }
      ((iu !== 0 && iu !== 5) || id(e, !1), nd !== 0 && (nd = 0));
    }
    function sd(e, t) {
      for (
        var n = e.suspendedLanes,
          r = e.pingedLanes,
          i = e.expirationTimes,
          a = e.pendingLanes & -62914561;
        0 < a;
      ) {
        var o = 31 - ze(a),
          s = 1 << o,
          c = i[o];
        (c === -1
          ? ((s & n) === 0 || (s & r) !== 0) && (i[o] = Ye(s, t))
          : c <= t && (e.expiredLanes |= s),
          (a &= ~s));
      }
      if (
        ((t = q),
        (n = Y),
        (n = qe(
          e,
          e === t ? n : 0,
          e.cancelPendingCommit !== null || e.timeoutHandle !== -1,
        )),
        (r = e.callbackNode),
        n === 0 ||
          (e === t && (X === 2 || X === 9)) ||
          e.cancelPendingCommit !== null)
      )
        return (
          r !== null && r !== null && we(r),
          (e.callbackNode = null),
          (e.callbackPriority = 0)
        );
      if (!(n & 3) || Je(e, n)) {
        if (((t = n & -n), t === e.callbackPriority)) return t;
        switch ((r !== null && we(r), it(n))) {
          case 2:
          case 8:
            n = Ae;
            break;
          case 32:
            n = je;
            break;
          case 268435456:
            n = Ne;
            break;
          default:
            n = je;
        }
        return (
          (r = cd.bind(null, e)),
          (n = Ce(n, r)),
          (e.callbackPriority = t),
          (e.callbackNode = n),
          t
        );
      }
      return (
        r !== null && r !== null && we(r),
        (e.callbackPriority = 2),
        (e.callbackNode = null),
        2
      );
    }
    function cd(e, t) {
      if (iu !== 0 && iu !== 5)
        return ((e.callbackNode = null), (e.callbackPriority = 0), null);
      var n = e.callbackNode;
      if (Hu() && e.callbackNode !== n) return null;
      var r = Y;
      return (
        (r = qe(
          e,
          e === q ? r : 0,
          e.cancelPendingCommit !== null || e.timeoutHandle !== -1,
        )),
        r === 0
          ? null
          : (gu(e, r, t),
            sd(e, De()),
            e.callbackNode != null && e.callbackNode === n
              ? cd.bind(null, e)
              : null)
      );
    }
    function ld(e, t) {
      if (Hu()) return null;
      gu(e, t, !0);
    }
    function ud() {
      Yd(function () {
        K & 6 ? Ce(ke, ad) : od();
      });
    }
    function dd() {
      if (nd === 0) {
        var e = ua;
        (e === 0 && ((e = Ue), (Ue <<= 1), !(Ue & 261888) && (Ue = 256)),
          (nd = e));
      }
      return nd;
    }
    function fd(e) {
      return e == null || typeof e == `symbol` || typeof e == `boolean`
        ? null
        : typeof e == `function`
          ? e
          : en(`` + e);
    }
    function pd(e, t) {
      var n = t.ownerDocument.createElement(`input`);
      return (
        (n.name = t.name),
        (n.value = t.value),
        e.id && n.setAttribute(`form`, e.id),
        t.parentNode.insertBefore(n, t),
        (e = new FormData(e)),
        n.parentNode.removeChild(n),
        e
      );
    }
    function md(e, t, n, r, i) {
      if (t === `submit` && n && n.stateNode === i) {
        var a = fd((i[lt] || null).action),
          o = r.submitter;
        o &&
          ((t = (t = o[lt] || null)
            ? fd(t.formAction)
            : o.getAttribute(`formAction`)),
          t !== null && ((a = t), (o = null)));
        var s = new Sn(`action`, `action`, null, r, i);
        e.push({
          event: s,
          listeners: [
            {
              instance: null,
              listener: function () {
                if (r.defaultPrevented) {
                  if (nd !== 0) {
                    var e = o ? pd(i, o) : new FormData(i);
                    Cs(
                      n,
                      { pending: !0, data: e, method: i.method, action: a },
                      null,
                      e,
                    );
                  }
                } else
                  typeof a == `function` &&
                    (s.preventDefault(),
                    (e = o ? pd(i, o) : new FormData(i)),
                    Cs(
                      n,
                      { pending: !0, data: e, method: i.method, action: a },
                      a,
                      e,
                    ));
              },
              currentTarget: i,
            },
          ],
        });
      }
    }
    for (var hd = 0; hd < qr.length; hd++) {
      var gd = qr[hd];
      Jr(gd.toLowerCase(), `on` + (gd[0].toUpperCase() + gd.slice(1)));
    }
    (Jr(zr, `onAnimationEnd`),
      Jr(Br, `onAnimationIteration`),
      Jr(Vr, `onAnimationStart`),
      Jr(`dblclick`, `onDoubleClick`),
      Jr(`focusin`, `onFocus`),
      Jr(`focusout`, `onBlur`),
      Jr(Hr, `onTransitionRun`),
      Jr(Ur, `onTransitionStart`),
      Jr(Wr, `onTransitionCancel`),
      Jr(Gr, `onTransitionEnd`),
      Tt(`onMouseEnter`, [`mouseout`, `mouseover`]),
      Tt(`onMouseLeave`, [`mouseout`, `mouseover`]),
      Tt(`onPointerEnter`, [`pointerout`, `pointerover`]),
      Tt(`onPointerLeave`, [`pointerout`, `pointerover`]),
      wt(
        `onChange`,
        `change click focusin focusout input keydown keyup selectionchange`.split(
          ` `,
        ),
      ),
      wt(
        `onSelect`,
        `focusout contextmenu dragend focusin keydown keyup mousedown mouseup selectionchange`.split(
          ` `,
        ),
      ),
      wt(`onBeforeInput`, [`compositionend`, `keypress`, `textInput`, `paste`]),
      wt(
        `onCompositionEnd`,
        `compositionend focusout keydown keypress keyup mousedown`.split(` `),
      ),
      wt(
        `onCompositionStart`,
        `compositionstart focusout keydown keypress keyup mousedown`.split(` `),
      ),
      wt(
        `onCompositionUpdate`,
        `compositionupdate focusout keydown keypress keyup mousedown`.split(
          ` `,
        ),
      ));
    var _d =
        `abort canplay canplaythrough durationchange emptied encrypted ended error loadeddata loadedmetadata loadstart pause play playing progress ratechange resize seeked seeking stalled suspend timeupdate volumechange waiting`.split(
          ` `,
        ),
      vd = new Set(
        `beforetoggle cancel close invalid load scroll scrollend toggle`
          .split(` `)
          .concat(_d),
      );
    function yd(e, t) {
      t = (t & 4) != 0;
      for (var n = 0; n < e.length; n++) {
        var r = e[n],
          i = r.event;
        r = r.listeners;
        a: {
          var a = void 0;
          if (t)
            for (var o = r.length - 1; 0 <= o; o--) {
              var s = r[o],
                c = s.instance,
                l = s.currentTarget;
              if (((s = s.listener), c !== a && i.isPropagationStopped()))
                break a;
              ((a = s), (i.currentTarget = l));
              try {
                a(i);
              } catch (e) {
                Yr(e);
              }
              ((i.currentTarget = null), (a = c));
            }
          else
            for (o = 0; o < r.length; o++) {
              if (
                ((s = r[o]),
                (c = s.instance),
                (l = s.currentTarget),
                (s = s.listener),
                c !== a && i.isPropagationStopped())
              )
                break a;
              ((a = s), (i.currentTarget = l));
              try {
                a(i);
              } catch (e) {
                Yr(e);
              }
              ((i.currentTarget = null), (a = c));
            }
        }
      }
    }
    function Q(e, t) {
      var n = t[dt];
      n === void 0 && (n = t[dt] = new Set());
      var r = e + `__bubble`;
      n.has(r) || (Cd(t, e, 2, !1), n.add(r));
    }
    function bd(e, t, n) {
      var r = 0;
      (t && (r |= 4), Cd(n, e, r, t));
    }
    var xd = `_reactListening` + Math.random().toString(36).slice(2);
    function Sd(e) {
      if (!e[xd]) {
        ((e[xd] = !0),
          St.forEach(function (t) {
            t !== `selectionchange` &&
              (vd.has(t) || bd(t, !1, e), bd(t, !0, e));
          }));
        var t = e.nodeType === 9 ? e : e.ownerDocument;
        t === null || t[xd] || ((t[xd] = !0), bd(`selectionchange`, !1, t));
      }
    }
    function Cd(e, t, n, r) {
      switch (mp(t)) {
        case 2:
          var i = cp;
          break;
        case 8:
          i = lp;
          break;
        default:
          i = up;
      }
      ((n = i.bind(null, t, n, e)),
        (i = void 0),
        !fn ||
          (t !== `touchstart` && t !== `touchmove` && t !== `wheel`) ||
          (i = !0),
        r
          ? i === void 0
            ? e.addEventListener(t, n, !0)
            : e.addEventListener(t, n, { capture: !0, passive: i })
          : i === void 0
            ? e.addEventListener(t, n, !1)
            : e.addEventListener(t, n, { passive: i }));
    }
    function wd(e, t, n, r, i) {
      var a = r;
      if (!(t & 1) && !(t & 2) && r !== null)
        a: for (;;) {
          if (r === null) return;
          var o = r.tag;
          if (o === 3 || o === 4) {
            var c = r.stateNode.containerInfo;
            if (c === i) break;
            if (o === 4)
              for (o = r.return; o !== null; ) {
                var l = o.tag;
                if ((l === 3 || l === 4) && o.stateNode.containerInfo === i)
                  return;
                o = o.return;
              }
            for (; c !== null; ) {
              if (((o = _t(c)), o === null)) return;
              if (((l = o.tag), l === 5 || l === 6 || l === 26 || l === 27)) {
                r = a = o;
                continue a;
              }
              c = c.parentNode;
            }
          }
          r = r.return;
        }
      ln(function () {
        var r = a,
          i = rn(n),
          o = [];
        a: {
          var c = Kr.get(e);
          if (c !== void 0) {
            var l = Sn,
              u = e;
            switch (e) {
              case `keypress`:
                if (vn(n) === 0) break a;
              case `keydown`:
              case `keyup`:
                l = Bn;
                break;
              case `focusin`:
                ((u = `focus`), (l = jn));
                break;
              case `focusout`:
                ((u = `blur`), (l = jn));
                break;
              case `beforeblur`:
              case `afterblur`:
                l = jn;
                break;
              case `click`:
                if (n.button === 2) break a;
              case `auxclick`:
              case `dblclick`:
              case `mousedown`:
              case `mousemove`:
              case `mouseup`:
              case `mouseout`:
              case `mouseover`:
              case `contextmenu`:
                l = kn;
                break;
              case `drag`:
              case `dragend`:
              case `dragenter`:
              case `dragexit`:
              case `dragleave`:
              case `dragover`:
              case `dragstart`:
              case `drop`:
                l = An;
                break;
              case `touchcancel`:
              case `touchend`:
              case `touchmove`:
              case `touchstart`:
                l = Hn;
                break;
              case zr:
              case Br:
              case Vr:
                l = Mn;
                break;
              case Gr:
                l = Un;
                break;
              case `scroll`:
              case `scrollend`:
                l = wn;
                break;
              case `wheel`:
                l = Wn;
                break;
              case `copy`:
              case `cut`:
              case `paste`:
                l = Nn;
                break;
              case `gotpointercapture`:
              case `lostpointercapture`:
              case `pointercancel`:
              case `pointerdown`:
              case `pointermove`:
              case `pointerout`:
              case `pointerover`:
              case `pointerup`:
                l = Vn;
                break;
              case `toggle`:
              case `beforetoggle`:
                l = Gn;
            }
            var d = (t & 4) != 0,
              f = !d && (e === `scroll` || e === `scrollend`),
              p = d ? (c === null ? null : c + `Capture`) : c;
            d = [];
            for (var m = r, h; m !== null; ) {
              var g = m;
              if (
                ((h = g.stateNode),
                (g = g.tag),
                (g !== 5 && g !== 26 && g !== 27) ||
                  h === null ||
                  p === null ||
                  ((g = un(m, p)), g != null && d.push(Td(m, g, h))),
                f)
              )
                break;
              m = m.return;
            }
            0 < d.length &&
              ((c = new l(c, u, null, n, i)),
              o.push({ event: c, listeners: d }));
          }
        }
        if (!(t & 7)) {
          a: {
            if (
              ((c = e === `mouseover` || e === `pointerover`),
              (l = e === `mouseout` || e === `pointerout`),
              c &&
                n !== nn &&
                (u = n.relatedTarget || n.fromElement) &&
                (_t(u) || u[ut]))
            )
              break a;
            if (
              (l || c) &&
              ((c =
                i.window === i
                  ? i
                  : (c = i.ownerDocument)
                    ? c.defaultView || c.parentWindow
                    : window),
              l
                ? ((u = n.relatedTarget || n.toElement),
                  (l = r),
                  (u = u ? _t(u) : null),
                  u !== null &&
                    ((f = s(u)),
                    (d = u.tag),
                    u !== f || (d !== 5 && d !== 27 && d !== 6)) &&
                    (u = null))
                : ((l = null), (u = r)),
              l !== u)
            ) {
              if (
                ((d = kn),
                (g = `onMouseLeave`),
                (p = `onMouseEnter`),
                (m = `mouse`),
                (e === `pointerout` || e === `pointerover`) &&
                  ((d = Vn),
                  (g = `onPointerLeave`),
                  (p = `onPointerEnter`),
                  (m = `pointer`)),
                (f = l == null ? c : yt(l)),
                (h = u == null ? c : yt(u)),
                (c = new d(g, m + `leave`, l, n, i)),
                (c.target = f),
                (c.relatedTarget = h),
                (g = null),
                _t(i) === r &&
                  ((d = new d(p, m + `enter`, u, n, i)),
                  (d.target = h),
                  (d.relatedTarget = f),
                  (g = d)),
                (f = g),
                l && u)
              )
                b: {
                  for (d = Dd, p = l, m = u, h = 0, g = p; g; g = d(g)) h++;
                  g = 0;
                  for (var _ = m; _; _ = d(_)) g++;
                  for (; 0 < h - g; ) ((p = d(p)), h--);
                  for (; 0 < g - h; ) ((m = d(m)), g--);
                  for (; h--; ) {
                    if (p === m || (m !== null && p === m.alternate)) {
                      d = p;
                      break b;
                    }
                    ((p = d(p)), (m = d(m)));
                  }
                  d = null;
                }
              else d = null;
              (l !== null && Od(o, c, l, d, !1),
                u !== null && f !== null && Od(o, f, u, d, !0));
            }
          }
          a: {
            if (
              ((c = r ? yt(r) : window),
              (l = c.nodeName && c.nodeName.toLowerCase()),
              l === `select` || (l === `input` && c.type === `file`))
            )
              var v = ur;
            else if (ir(c))
              if (dr) v = br;
              else {
                v = vr;
                var y = _r;
              }
            else
              ((l = c.nodeName),
                !l ||
                l.toLowerCase() !== `input` ||
                (c.type !== `checkbox` && c.type !== `radio`)
                  ? r && Zt(r.elementType) && (v = ur)
                  : (v = yr));
            if ((v &&= v(e, r))) {
              ar(o, v, n, i);
              break a;
            }
            (y && y(e, c, r),
              e === `focusout` &&
                r &&
                c.type === `number` &&
                r.memoizedProps.value != null &&
                Ut(c, `number`, c.value));
          }
          switch (((y = r ? yt(r) : window), e)) {
            case `focusin`:
              (ir(y) || y.contentEditable === `true`) &&
                ((Ar = y), (z = r), (jr = null));
              break;
            case `focusout`:
              jr = z = Ar = null;
              break;
            case `mousedown`:
              Mr = !0;
              break;
            case `contextmenu`:
            case `mouseup`:
            case `dragend`:
              ((Mr = !1), Nr(o, n, i));
              break;
            case `selectionchange`:
              if (kr) break;
            case `keydown`:
            case `keyup`:
              Nr(o, n, i);
          }
          var b;
          if (qn)
            b: {
              switch (e) {
                case `compositionstart`:
                  var x = `onCompositionStart`;
                  break b;
                case `compositionend`:
                  x = `onCompositionEnd`;
                  break b;
                case `compositionupdate`:
                  x = `onCompositionUpdate`;
                  break b;
              }
              x = void 0;
            }
          else
            er
              ? Qn(e, n) && (x = `onCompositionEnd`)
              : e === `keydown` &&
                n.keyCode === 229 &&
                (x = `onCompositionStart`);
          (x &&
            (Yn &&
              n.locale !== `ko` &&
              (er || x !== `onCompositionStart`
                ? x === `onCompositionEnd` && er && (b = _n())
                : ((mn = i),
                  (hn = `value` in mn ? mn.value : mn.textContent),
                  (er = !0))),
            (y = Ed(r, x)),
            0 < y.length &&
              ((x = new Pn(x, e, null, n, i)),
              o.push({ event: x, listeners: y }),
              b ? (x.data = b) : ((b = $n(n)), b !== null && (x.data = b)))),
            (b = Jn ? tr(e, n) : nr(e, n)) &&
              ((x = Ed(r, `onBeforeInput`)),
              0 < x.length &&
                ((y = new Pn(`onBeforeInput`, `beforeinput`, null, n, i)),
                o.push({ event: y, listeners: x }),
                (y.data = b))),
            md(o, e, r, n, i));
        }
        yd(o, t);
      });
    }
    function Td(e, t, n) {
      return { instance: e, listener: t, currentTarget: n };
    }
    function Ed(e, t) {
      for (var n = t + `Capture`, r = []; e !== null; ) {
        var i = e,
          a = i.stateNode;
        if (
          ((i = i.tag),
          (i !== 5 && i !== 26 && i !== 27) ||
            a === null ||
            ((i = un(e, n)),
            i != null && r.unshift(Td(e, i, a)),
            (i = un(e, t)),
            i != null && r.push(Td(e, i, a))),
          e.tag === 3)
        )
          return r;
        e = e.return;
      }
      return [];
    }
    function Dd(e) {
      if (e === null) return null;
      do e = e.return;
      while (e && e.tag !== 5 && e.tag !== 27);
      return e || null;
    }
    function Od(e, t, n, r, i) {
      for (var a = t._reactName, o = []; n !== null && n !== r; ) {
        var s = n,
          c = s.alternate,
          l = s.stateNode;
        if (((s = s.tag), c !== null && c === r)) break;
        ((s !== 5 && s !== 26 && s !== 27) ||
          l === null ||
          ((c = l),
          i
            ? ((l = un(n, a)), l != null && o.unshift(Td(n, l, c)))
            : i || ((l = un(n, a)), l != null && o.push(Td(n, l, c)))),
          (n = n.return));
      }
      o.length !== 0 && e.push({ event: t, listeners: o });
    }
    var kd = /\r\n?/g,
      Ad = /\u0000|\uFFFD/g;
    function jd(e) {
      return (typeof e == `string` ? e : `` + e)
        .replace(
          kd,
          `
`,
        )
        .replace(Ad, ``);
    }
    function Md(e, t) {
      return ((t = jd(t)), jd(e) === t);
    }
    function $(e, t, n, r, i, o) {
      switch (n) {
        case `children`:
          typeof r == `string`
            ? t === `body` || (t === `textarea` && r === ``) || qt(e, r)
            : (typeof r == `number` || typeof r == `bigint`) &&
              t !== `body` &&
              qt(e, `` + r);
          break;
        case `className`:
          jt(e, `class`, r);
          break;
        case `tabIndex`:
          jt(e, `tabindex`, r);
          break;
        case `dir`:
        case `role`:
        case `viewBox`:
        case `width`:
        case `height`:
          jt(e, n, r);
          break;
        case `style`:
          Xt(e, r, o);
          break;
        case `data`:
          if (t !== `object`) {
            jt(e, `data`, r);
            break;
          }
        case `src`:
        case `href`:
          if (r === `` && (t !== `a` || n !== `href`)) {
            e.removeAttribute(n);
            break;
          }
          if (
            r == null ||
            typeof r == `function` ||
            typeof r == `symbol` ||
            typeof r == `boolean`
          ) {
            e.removeAttribute(n);
            break;
          }
          ((r = en(`` + r)), e.setAttribute(n, r));
          break;
        case `action`:
        case `formAction`:
          if (typeof r == `function`) {
            e.setAttribute(
              n,
              `javascript:throw new Error('A React form was unexpectedly submitted. If you called form.submit() manually, consider using form.requestSubmit() instead. If you\\'re trying to use event.stopPropagation() in a submit event handler, consider also calling event.preventDefault().')`,
            );
            break;
          } else
            typeof o == `function` &&
              (n === `formAction`
                ? (t !== `input` && $(e, t, `name`, i.name, i, null),
                  $(e, t, `formEncType`, i.formEncType, i, null),
                  $(e, t, `formMethod`, i.formMethod, i, null),
                  $(e, t, `formTarget`, i.formTarget, i, null))
                : ($(e, t, `encType`, i.encType, i, null),
                  $(e, t, `method`, i.method, i, null),
                  $(e, t, `target`, i.target, i, null)));
          if (r == null || typeof r == `symbol` || typeof r == `boolean`) {
            e.removeAttribute(n);
            break;
          }
          ((r = en(`` + r)), e.setAttribute(n, r));
          break;
        case `onClick`:
          r != null && (e.onclick = tn);
          break;
        case `onScroll`:
          r != null && Q(`scroll`, e);
          break;
        case `onScrollEnd`:
          r != null && Q(`scrollend`, e);
          break;
        case `dangerouslySetInnerHTML`:
          if (r != null) {
            if (typeof r != `object` || !(`__html` in r)) throw Error(a(61));
            if (((n = r.__html), n != null)) {
              if (i.children != null) throw Error(a(60));
              e.innerHTML = n;
            }
          }
          break;
        case `multiple`:
          e.multiple = r && typeof r != `function` && typeof r != `symbol`;
          break;
        case `muted`:
          e.muted = r && typeof r != `function` && typeof r != `symbol`;
          break;
        case `suppressContentEditableWarning`:
        case `suppressHydrationWarning`:
        case `defaultValue`:
        case `defaultChecked`:
        case `innerHTML`:
        case `ref`:
          break;
        case `autoFocus`:
          break;
        case `xlinkHref`:
          if (
            r == null ||
            typeof r == `function` ||
            typeof r == `boolean` ||
            typeof r == `symbol`
          ) {
            e.removeAttribute(`xlink:href`);
            break;
          }
          ((n = en(`` + r)),
            e.setAttributeNS(`http://www.w3.org/1999/xlink`, `xlink:href`, n));
          break;
        case `contentEditable`:
        case `spellCheck`:
        case `draggable`:
        case `value`:
        case `autoReverse`:
        case `externalResourcesRequired`:
        case `focusable`:
        case `preserveAlpha`:
          r != null && typeof r != `function` && typeof r != `symbol`
            ? e.setAttribute(n, `` + r)
            : e.removeAttribute(n);
          break;
        case `inert`:
        case `allowFullScreen`:
        case `async`:
        case `autoPlay`:
        case `controls`:
        case `default`:
        case `defer`:
        case `disabled`:
        case `disablePictureInPicture`:
        case `disableRemotePlayback`:
        case `formNoValidate`:
        case `hidden`:
        case `loop`:
        case `noModule`:
        case `noValidate`:
        case `open`:
        case `playsInline`:
        case `readOnly`:
        case `required`:
        case `reversed`:
        case `scoped`:
        case `seamless`:
        case `itemScope`:
          r && typeof r != `function` && typeof r != `symbol`
            ? e.setAttribute(n, ``)
            : e.removeAttribute(n);
          break;
        case `capture`:
        case `download`:
          !0 === r
            ? e.setAttribute(n, ``)
            : !1 !== r &&
                r != null &&
                typeof r != `function` &&
                typeof r != `symbol`
              ? e.setAttribute(n, r)
              : e.removeAttribute(n);
          break;
        case `cols`:
        case `rows`:
        case `size`:
        case `span`:
          r != null &&
          typeof r != `function` &&
          typeof r != `symbol` &&
          !isNaN(r) &&
          1 <= r
            ? e.setAttribute(n, r)
            : e.removeAttribute(n);
          break;
        case `rowSpan`:
        case `start`:
          r == null ||
          typeof r == `function` ||
          typeof r == `symbol` ||
          isNaN(r)
            ? e.removeAttribute(n)
            : e.setAttribute(n, r);
          break;
        case `popover`:
          (Q(`beforetoggle`, e), Q(`toggle`, e), At(e, `popover`, r));
          break;
        case `xlinkActuate`:
          Mt(e, `http://www.w3.org/1999/xlink`, `xlink:actuate`, r);
          break;
        case `xlinkArcrole`:
          Mt(e, `http://www.w3.org/1999/xlink`, `xlink:arcrole`, r);
          break;
        case `xlinkRole`:
          Mt(e, `http://www.w3.org/1999/xlink`, `xlink:role`, r);
          break;
        case `xlinkShow`:
          Mt(e, `http://www.w3.org/1999/xlink`, `xlink:show`, r);
          break;
        case `xlinkTitle`:
          Mt(e, `http://www.w3.org/1999/xlink`, `xlink:title`, r);
          break;
        case `xlinkType`:
          Mt(e, `http://www.w3.org/1999/xlink`, `xlink:type`, r);
          break;
        case `xmlBase`:
          Mt(e, `http://www.w3.org/XML/1998/namespace`, `xml:base`, r);
          break;
        case `xmlLang`:
          Mt(e, `http://www.w3.org/XML/1998/namespace`, `xml:lang`, r);
          break;
        case `xmlSpace`:
          Mt(e, `http://www.w3.org/XML/1998/namespace`, `xml:space`, r);
          break;
        case `is`:
          At(e, `is`, r);
          break;
        case `innerText`:
        case `textContent`:
          break;
        default:
          (!(2 < n.length) ||
            (n[0] !== `o` && n[0] !== `O`) ||
            (n[1] !== `n` && n[1] !== `N`)) &&
            ((n = Qt.get(n) || n), At(e, n, r));
      }
    }
    function Nd(e, t, n, r, i, o) {
      switch (n) {
        case `style`:
          Xt(e, r, o);
          break;
        case `dangerouslySetInnerHTML`:
          if (r != null) {
            if (typeof r != `object` || !(`__html` in r)) throw Error(a(61));
            if (((n = r.__html), n != null)) {
              if (i.children != null) throw Error(a(60));
              e.innerHTML = n;
            }
          }
          break;
        case `children`:
          typeof r == `string`
            ? qt(e, r)
            : (typeof r == `number` || typeof r == `bigint`) && qt(e, `` + r);
          break;
        case `onScroll`:
          r != null && Q(`scroll`, e);
          break;
        case `onScrollEnd`:
          r != null && Q(`scrollend`, e);
          break;
        case `onClick`:
          r != null && (e.onclick = tn);
          break;
        case `suppressContentEditableWarning`:
        case `suppressHydrationWarning`:
        case `innerHTML`:
        case `ref`:
          break;
        case `innerText`:
        case `textContent`:
          break;
        default:
          if (!Ct.hasOwnProperty(n))
            a: {
              if (
                n[0] === `o` &&
                n[1] === `n` &&
                ((i = n.endsWith(`Capture`)),
                (t = n.slice(2, i ? n.length - 7 : void 0)),
                (o = e[lt] || null),
                (o = o == null ? null : o[n]),
                typeof o == `function` && e.removeEventListener(t, o, i),
                typeof r == `function`)
              ) {
                (typeof o != `function` &&
                  o !== null &&
                  (n in e
                    ? (e[n] = null)
                    : e.hasAttribute(n) && e.removeAttribute(n)),
                  e.addEventListener(t, r, i));
                break a;
              }
              n in e
                ? (e[n] = r)
                : !0 === r
                  ? e.setAttribute(n, ``)
                  : At(e, n, r);
            }
      }
    }
    function Pd(e, t, n) {
      switch (t) {
        case `div`:
        case `span`:
        case `svg`:
        case `path`:
        case `a`:
        case `g`:
        case `p`:
        case `li`:
          break;
        case `img`:
          (Q(`error`, e), Q(`load`, e));
          var r = !1,
            i = !1,
            o;
          for (o in n)
            if (n.hasOwnProperty(o)) {
              var s = n[o];
              if (s != null)
                switch (o) {
                  case `src`:
                    r = !0;
                    break;
                  case `srcSet`:
                    i = !0;
                    break;
                  case `children`:
                  case `dangerouslySetInnerHTML`:
                    throw Error(a(137, t));
                  default:
                    $(e, t, o, s, n, null);
                }
            }
          (i && $(e, t, `srcSet`, n.srcSet, n, null),
            r && $(e, t, `src`, n.src, n, null));
          return;
        case `input`:
          Q(`invalid`, e);
          var c = (o = s = i = null),
            l = null,
            u = null;
          for (r in n)
            if (n.hasOwnProperty(r)) {
              var d = n[r];
              if (d != null)
                switch (r) {
                  case `name`:
                    i = d;
                    break;
                  case `type`:
                    s = d;
                    break;
                  case `checked`:
                    l = d;
                    break;
                  case `defaultChecked`:
                    u = d;
                    break;
                  case `value`:
                    o = d;
                    break;
                  case `defaultValue`:
                    c = d;
                    break;
                  case `children`:
                  case `dangerouslySetInnerHTML`:
                    if (d != null) throw Error(a(137, t));
                    break;
                  default:
                    $(e, t, r, d, n, null);
                }
            }
          Ht(e, o, c, l, u, s, i, !1);
          return;
        case `select`:
          for (i in (Q(`invalid`, e), (r = s = o = null), n))
            if (n.hasOwnProperty(i) && ((c = n[i]), c != null))
              switch (i) {
                case `value`:
                  o = c;
                  break;
                case `defaultValue`:
                  s = c;
                  break;
                case `multiple`:
                  r = c;
                default:
                  $(e, t, i, c, n, null);
              }
          ((t = o),
            (n = s),
            (e.multiple = !!r),
            t == null ? n != null && Wt(e, !!r, n, !0) : Wt(e, !!r, t, !1));
          return;
        case `textarea`:
          for (s in (Q(`invalid`, e), (o = i = r = null), n))
            if (n.hasOwnProperty(s) && ((c = n[s]), c != null))
              switch (s) {
                case `value`:
                  r = c;
                  break;
                case `defaultValue`:
                  i = c;
                  break;
                case `children`:
                  o = c;
                  break;
                case `dangerouslySetInnerHTML`:
                  if (c != null) throw Error(a(91));
                  break;
                default:
                  $(e, t, s, c, n, null);
              }
          Kt(e, r, i, o);
          return;
        case `option`:
          for (l in n)
            if (n.hasOwnProperty(l) && ((r = n[l]), r != null))
              switch (l) {
                case `selected`:
                  e.selected =
                    r && typeof r != `function` && typeof r != `symbol`;
                  break;
                default:
                  $(e, t, l, r, n, null);
              }
          return;
        case `dialog`:
          (Q(`beforetoggle`, e), Q(`toggle`, e), Q(`cancel`, e), Q(`close`, e));
          break;
        case `iframe`:
        case `object`:
          Q(`load`, e);
          break;
        case `video`:
        case `audio`:
          for (r = 0; r < _d.length; r++) Q(_d[r], e);
          break;
        case `image`:
          (Q(`error`, e), Q(`load`, e));
          break;
        case `details`:
          Q(`toggle`, e);
          break;
        case `embed`:
        case `source`:
        case `link`:
          (Q(`error`, e), Q(`load`, e));
        case `area`:
        case `base`:
        case `br`:
        case `col`:
        case `hr`:
        case `keygen`:
        case `meta`:
        case `param`:
        case `track`:
        case `wbr`:
        case `menuitem`:
          for (u in n)
            if (n.hasOwnProperty(u) && ((r = n[u]), r != null))
              switch (u) {
                case `children`:
                case `dangerouslySetInnerHTML`:
                  throw Error(a(137, t));
                default:
                  $(e, t, u, r, n, null);
              }
          return;
        default:
          if (Zt(t)) {
            for (d in n)
              n.hasOwnProperty(d) &&
                ((r = n[d]), r !== void 0 && Nd(e, t, d, r, n, void 0));
            return;
          }
      }
      for (c in n)
        n.hasOwnProperty(c) &&
          ((r = n[c]), r != null && $(e, t, c, r, n, null));
    }
    function Fd(e, t, n, r) {
      switch (t) {
        case `div`:
        case `span`:
        case `svg`:
        case `path`:
        case `a`:
        case `g`:
        case `p`:
        case `li`:
          break;
        case `input`:
          var i = null,
            o = null,
            s = null,
            c = null,
            l = null,
            u = null,
            d = null;
          for (m in n) {
            var f = n[m];
            if (n.hasOwnProperty(m) && f != null)
              switch (m) {
                case `checked`:
                  break;
                case `value`:
                  break;
                case `defaultValue`:
                  l = f;
                default:
                  r.hasOwnProperty(m) || $(e, t, m, null, r, f);
              }
          }
          for (var p in r) {
            var m = r[p];
            if (((f = n[p]), r.hasOwnProperty(p) && (m != null || f != null)))
              switch (p) {
                case `type`:
                  o = m;
                  break;
                case `name`:
                  i = m;
                  break;
                case `checked`:
                  u = m;
                  break;
                case `defaultChecked`:
                  d = m;
                  break;
                case `value`:
                  s = m;
                  break;
                case `defaultValue`:
                  c = m;
                  break;
                case `children`:
                case `dangerouslySetInnerHTML`:
                  if (m != null) throw Error(a(137, t));
                  break;
                default:
                  m !== f && $(e, t, p, m, r, f);
              }
          }
          Vt(e, s, c, l, u, d, o, i);
          return;
        case `select`:
          for (o in ((m = s = c = p = null), n))
            if (((l = n[o]), n.hasOwnProperty(o) && l != null))
              switch (o) {
                case `value`:
                  break;
                case `multiple`:
                  m = l;
                default:
                  r.hasOwnProperty(o) || $(e, t, o, null, r, l);
              }
          for (i in r)
            if (
              ((o = r[i]),
              (l = n[i]),
              r.hasOwnProperty(i) && (o != null || l != null))
            )
              switch (i) {
                case `value`:
                  p = o;
                  break;
                case `defaultValue`:
                  c = o;
                  break;
                case `multiple`:
                  s = o;
                default:
                  o !== l && $(e, t, i, o, r, l);
              }
          ((t = c),
            (n = s),
            (r = m),
            p == null
              ? !!r != !!n &&
                (t == null ? Wt(e, !!n, n ? [] : ``, !1) : Wt(e, !!n, t, !0))
              : Wt(e, !!n, p, !1));
          return;
        case `textarea`:
          for (c in ((m = p = null), n))
            if (
              ((i = n[c]),
              n.hasOwnProperty(c) && i != null && !r.hasOwnProperty(c))
            )
              switch (c) {
                case `value`:
                  break;
                case `children`:
                  break;
                default:
                  $(e, t, c, null, r, i);
              }
          for (s in r)
            if (
              ((i = r[s]),
              (o = n[s]),
              r.hasOwnProperty(s) && (i != null || o != null))
            )
              switch (s) {
                case `value`:
                  p = i;
                  break;
                case `defaultValue`:
                  m = i;
                  break;
                case `children`:
                  break;
                case `dangerouslySetInnerHTML`:
                  if (i != null) throw Error(a(91));
                  break;
                default:
                  i !== o && $(e, t, s, i, r, o);
              }
          Gt(e, p, m);
          return;
        case `option`:
          for (var h in n)
            if (
              ((p = n[h]),
              n.hasOwnProperty(h) && p != null && !r.hasOwnProperty(h))
            )
              switch (h) {
                case `selected`:
                  e.selected = !1;
                  break;
                default:
                  $(e, t, h, null, r, p);
              }
          for (l in r)
            if (
              ((p = r[l]),
              (m = n[l]),
              r.hasOwnProperty(l) && p !== m && (p != null || m != null))
            )
              switch (l) {
                case `selected`:
                  e.selected =
                    p && typeof p != `function` && typeof p != `symbol`;
                  break;
                default:
                  $(e, t, l, p, r, m);
              }
          return;
        case `img`:
        case `link`:
        case `area`:
        case `base`:
        case `br`:
        case `col`:
        case `embed`:
        case `hr`:
        case `keygen`:
        case `meta`:
        case `param`:
        case `source`:
        case `track`:
        case `wbr`:
        case `menuitem`:
          for (var g in n)
            ((p = n[g]),
              n.hasOwnProperty(g) &&
                p != null &&
                !r.hasOwnProperty(g) &&
                $(e, t, g, null, r, p));
          for (u in r)
            if (
              ((p = r[u]),
              (m = n[u]),
              r.hasOwnProperty(u) && p !== m && (p != null || m != null))
            )
              switch (u) {
                case `children`:
                case `dangerouslySetInnerHTML`:
                  if (p != null) throw Error(a(137, t));
                  break;
                default:
                  $(e, t, u, p, r, m);
              }
          return;
        default:
          if (Zt(t)) {
            for (var _ in n)
              ((p = n[_]),
                n.hasOwnProperty(_) &&
                  p !== void 0 &&
                  !r.hasOwnProperty(_) &&
                  Nd(e, t, _, void 0, r, p));
            for (d in r)
              ((p = r[d]),
                (m = n[d]),
                !r.hasOwnProperty(d) ||
                  p === m ||
                  (p === void 0 && m === void 0) ||
                  Nd(e, t, d, p, r, m));
            return;
          }
      }
      for (var v in n)
        ((p = n[v]),
          n.hasOwnProperty(v) &&
            p != null &&
            !r.hasOwnProperty(v) &&
            $(e, t, v, null, r, p));
      for (f in r)
        ((p = r[f]),
          (m = n[f]),
          !r.hasOwnProperty(f) ||
            p === m ||
            (p == null && m == null) ||
            $(e, t, f, p, r, m));
    }
    function Id(e) {
      switch (e) {
        case `css`:
        case `script`:
        case `font`:
        case `img`:
        case `image`:
        case `input`:
        case `link`:
          return !0;
        default:
          return !1;
      }
    }
    function Ld() {
      if (typeof performance.getEntriesByType == `function`) {
        for (
          var e = 0, t = 0, n = performance.getEntriesByType(`resource`), r = 0;
          r < n.length;
          r++
        ) {
          var i = n[r],
            a = i.transferSize,
            o = i.initiatorType,
            s = i.duration;
          if (a && s && Id(o)) {
            for (o = 0, s = i.responseEnd, r += 1; r < n.length; r++) {
              var c = n[r],
                l = c.startTime;
              if (l > s) break;
              var u = c.transferSize,
                d = c.initiatorType;
              u &&
                Id(d) &&
                ((c = c.responseEnd),
                (o += u * (c < s ? 1 : (s - l) / (c - l))));
            }
            if ((--r, (t += (8 * (a + o)) / (i.duration / 1e3)), e++, 10 < e))
              break;
          }
        }
        if (0 < e) return t / e / 1e6;
      }
      return navigator.connection &&
        ((e = navigator.connection.downlink), typeof e == `number`)
        ? e
        : 5;
    }
    var Rd = null,
      zd = null;
    function Bd(e) {
      return e.nodeType === 9 ? e : e.ownerDocument;
    }
    function Vd(e) {
      switch (e) {
        case `http://www.w3.org/2000/svg`:
          return 1;
        case `http://www.w3.org/1998/Math/MathML`:
          return 2;
        default:
          return 0;
      }
    }
    function Hd(e, t) {
      if (e === 0)
        switch (t) {
          case `svg`:
            return 1;
          case `math`:
            return 2;
          default:
            return 0;
        }
      return e === 1 && t === `foreignObject` ? 0 : e;
    }
    function Ud(e, t) {
      return (
        e === `textarea` ||
        e === `noscript` ||
        typeof t.children == `string` ||
        typeof t.children == `number` ||
        typeof t.children == `bigint` ||
        (typeof t.dangerouslySetInnerHTML == `object` &&
          t.dangerouslySetInnerHTML !== null &&
          t.dangerouslySetInnerHTML.__html != null)
      );
    }
    var Wd = null;
    function Gd() {
      var e = window.event;
      return e && e.type === `popstate`
        ? e === Wd
          ? !1
          : ((Wd = e), !0)
        : ((Wd = null), !1);
    }
    var Kd = typeof setTimeout == `function` ? setTimeout : void 0,
      qd = typeof clearTimeout == `function` ? clearTimeout : void 0,
      Jd = typeof Promise == `function` ? Promise : void 0,
      Yd =
        typeof queueMicrotask == `function`
          ? queueMicrotask
          : Jd === void 0
            ? Kd
            : function (e) {
                return Jd.resolve(null).then(e).catch(Xd);
              };
    function Xd(e) {
      setTimeout(function () {
        throw e;
      });
    }
    function Zd(e) {
      return e === `head`;
    }
    function Qd(e, t) {
      var n = t,
        r = 0;
      do {
        var i = n.nextSibling;
        if ((e.removeChild(n), i && i.nodeType === 8))
          if (((n = i.data), n === `/$` || n === `/&`)) {
            if (r === 0) {
              (e.removeChild(i), Np(t));
              return;
            }
            r--;
          } else if (
            n === `$` ||
            n === `$?` ||
            n === `$~` ||
            n === `$!` ||
            n === `&`
          )
            r++;
          else if (n === `html`) pf(e.ownerDocument.documentElement);
          else if (n === `head`) {
            ((n = e.ownerDocument.head), pf(n));
            for (var a = n.firstChild; a; ) {
              var o = a.nextSibling,
                s = a.nodeName;
              (a[ht] ||
                s === `SCRIPT` ||
                s === `STYLE` ||
                (s === `LINK` && a.rel.toLowerCase() === `stylesheet`) ||
                n.removeChild(a),
                (a = o));
            }
          } else n === `body` && pf(e.ownerDocument.body);
        n = i;
      } while (n);
      Np(t);
    }
    function $d(e, t) {
      var n = e;
      e = 0;
      do {
        var r = n.nextSibling;
        if (
          (n.nodeType === 1
            ? t
              ? ((n._stashedDisplay = n.style.display),
                (n.style.display = `none`))
              : ((n.style.display = n._stashedDisplay || ``),
                n.getAttribute(`style`) === `` && n.removeAttribute(`style`))
            : n.nodeType === 3 &&
              (t
                ? ((n._stashedText = n.nodeValue), (n.nodeValue = ``))
                : (n.nodeValue = n._stashedText || ``)),
          r && r.nodeType === 8)
        )
          if (((n = r.data), n === `/$`)) {
            if (e === 0) break;
            e--;
          } else (n !== `$` && n !== `$?` && n !== `$~` && n !== `$!`) || e++;
        n = r;
      } while (n);
    }
    function ef(e) {
      var t = e.firstChild;
      for (t && t.nodeType === 10 && (t = t.nextSibling); t; ) {
        var n = t;
        switch (((t = t.nextSibling), n.nodeName)) {
          case `HTML`:
          case `HEAD`:
          case `BODY`:
            (ef(n), gt(n));
            continue;
          case `SCRIPT`:
          case `STYLE`:
            continue;
          case `LINK`:
            if (n.rel.toLowerCase() === `stylesheet`) continue;
        }
        e.removeChild(n);
      }
    }
    function tf(e, t, n, r) {
      for (; e.nodeType === 1; ) {
        var i = n;
        if (e.nodeName.toLowerCase() !== t.toLowerCase()) {
          if (!r && (e.nodeName !== `INPUT` || e.type !== `hidden`)) break;
        } else if (!r)
          if (t === `input` && e.type === `hidden`) {
            var a = i.name == null ? null : `` + i.name;
            if (i.type === `hidden` && e.getAttribute(`name`) === a) return e;
          } else return e;
        else if (!e[ht])
          switch (t) {
            case `meta`:
              if (!e.hasAttribute(`itemprop`)) break;
              return e;
            case `link`:
              if (
                ((a = e.getAttribute(`rel`)),
                (a === `stylesheet` && e.hasAttribute(`data-precedence`)) ||
                  a !== i.rel ||
                  e.getAttribute(`href`) !==
                    (i.href == null || i.href === `` ? null : i.href) ||
                  e.getAttribute(`crossorigin`) !==
                    (i.crossOrigin == null ? null : i.crossOrigin) ||
                  e.getAttribute(`title`) !==
                    (i.title == null ? null : i.title))
              )
                break;
              return e;
            case `style`:
              if (e.hasAttribute(`data-precedence`)) break;
              return e;
            case `script`:
              if (
                ((a = e.getAttribute(`src`)),
                (a !== (i.src == null ? null : i.src) ||
                  e.getAttribute(`type`) !== (i.type == null ? null : i.type) ||
                  e.getAttribute(`crossorigin`) !==
                    (i.crossOrigin == null ? null : i.crossOrigin)) &&
                  a &&
                  e.hasAttribute(`async`) &&
                  !e.hasAttribute(`itemprop`))
              )
                break;
              return e;
            default:
              return e;
          }
        if (((e = cf(e.nextSibling)), e === null)) break;
      }
      return null;
    }
    function nf(e, t, n) {
      if (t === ``) return null;
      for (; e.nodeType !== 3; )
        if (
          ((e.nodeType !== 1 ||
            e.nodeName !== `INPUT` ||
            e.type !== `hidden`) &&
            !n) ||
          ((e = cf(e.nextSibling)), e === null)
        )
          return null;
      return e;
    }
    function rf(e, t) {
      for (; e.nodeType !== 8; )
        if (
          ((e.nodeType !== 1 ||
            e.nodeName !== `INPUT` ||
            e.type !== `hidden`) &&
            !t) ||
          ((e = cf(e.nextSibling)), e === null)
        )
          return null;
      return e;
    }
    function af(e) {
      return e.data === `$?` || e.data === `$~`;
    }
    function of(e) {
      return (
        e.data === `$!` ||
        (e.data === `$?` && e.ownerDocument.readyState !== `loading`)
      );
    }
    function sf(e, t) {
      var n = e.ownerDocument;
      if (e.data === `$~`) e._reactRetry = t;
      else if (e.data !== `$?` || n.readyState !== `loading`) t();
      else {
        var r = function () {
          (t(), n.removeEventListener(`DOMContentLoaded`, r));
        };
        (n.addEventListener(`DOMContentLoaded`, r), (e._reactRetry = r));
      }
    }
    function cf(e) {
      for (; e != null; e = e.nextSibling) {
        var t = e.nodeType;
        if (t === 1 || t === 3) break;
        if (t === 8) {
          if (
            ((t = e.data),
            t === `$` ||
              t === `$!` ||
              t === `$?` ||
              t === `$~` ||
              t === `&` ||
              t === `F!` ||
              t === `F`)
          )
            break;
          if (t === `/$` || t === `/&`) return null;
        }
      }
      return e;
    }
    var lf = null;
    function uf(e) {
      e = e.nextSibling;
      for (var t = 0; e; ) {
        if (e.nodeType === 8) {
          var n = e.data;
          if (n === `/$` || n === `/&`) {
            if (t === 0) return cf(e.nextSibling);
            t--;
          } else
            (n !== `$` &&
              n !== `$!` &&
              n !== `$?` &&
              n !== `$~` &&
              n !== `&`) ||
              t++;
        }
        e = e.nextSibling;
      }
      return null;
    }
    function df(e) {
      e = e.previousSibling;
      for (var t = 0; e; ) {
        if (e.nodeType === 8) {
          var n = e.data;
          if (
            n === `$` ||
            n === `$!` ||
            n === `$?` ||
            n === `$~` ||
            n === `&`
          ) {
            if (t === 0) return e;
            t--;
          } else (n !== `/$` && n !== `/&`) || t++;
        }
        e = e.previousSibling;
      }
      return null;
    }
    function ff(e, t, n) {
      switch (((t = Bd(n)), e)) {
        case `html`:
          if (((e = t.documentElement), !e)) throw Error(a(452));
          return e;
        case `head`:
          if (((e = t.head), !e)) throw Error(a(453));
          return e;
        case `body`:
          if (((e = t.body), !e)) throw Error(a(454));
          return e;
        default:
          throw Error(a(451));
      }
    }
    function pf(e) {
      for (var t = e.attributes; t.length; ) e.removeAttributeNode(t[0]);
      gt(e);
    }
    var mf = new Map(),
      hf = new Set();
    function gf(e) {
      return typeof e.getRootNode == `function`
        ? e.getRootNode()
        : e.nodeType === 9
          ? e
          : e.ownerDocument;
    }
    var _f = A.d;
    A.d = { f: vf, r: yf, D: Sf, C: Cf, L: wf, m: Tf, X: Df, S: Ef, M: Of };
    function vf() {
      var e = _f.f(),
        t = bu();
      return e || t;
    }
    function yf(e) {
      var t = vt(e);
      t !== null && t.tag === 5 && t.type === `form` ? Ts(t) : _f.r(e);
    }
    var bf = typeof document > `u` ? null : document;
    function xf(e, t, n) {
      var r = bf;
      if (r && typeof t == `string` && t) {
        var i = Bt(t);
        ((i = `link[rel="` + e + `"][href="` + i + `"]`),
          typeof n == `string` && (i += `[crossorigin="` + n + `"]`),
          hf.has(i) ||
            (hf.add(i),
            (e = { rel: e, crossOrigin: n, href: t }),
            r.querySelector(i) === null &&
              ((t = r.createElement(`link`)),
              Pd(t, `link`, e),
              xt(t),
              r.head.appendChild(t))));
      }
    }
    function Sf(e) {
      (_f.D(e), xf(`dns-prefetch`, e, null));
    }
    function Cf(e, t) {
      (_f.C(e, t), xf(`preconnect`, e, t));
    }
    function wf(e, t, n) {
      _f.L(e, t, n);
      var r = bf;
      if (r && e && t) {
        var i = `link[rel="preload"][as="` + Bt(t) + `"]`;
        t === `image` && n && n.imageSrcSet
          ? ((i += `[imagesrcset="` + Bt(n.imageSrcSet) + `"]`),
            typeof n.imageSizes == `string` &&
              (i += `[imagesizes="` + Bt(n.imageSizes) + `"]`))
          : (i += `[href="` + Bt(e) + `"]`);
        var a = i;
        switch (t) {
          case `style`:
            a = Af(e);
            break;
          case `script`:
            a = Pf(e);
        }
        mf.has(a) ||
          ((e = p(
            {
              rel: `preload`,
              href: t === `image` && n && n.imageSrcSet ? void 0 : e,
              as: t,
            },
            n,
          )),
          mf.set(a, e),
          r.querySelector(i) !== null ||
            (t === `style` && r.querySelector(jf(a))) ||
            (t === `script` && r.querySelector(Ff(a))) ||
            ((t = r.createElement(`link`)),
            Pd(t, `link`, e),
            xt(t),
            r.head.appendChild(t)));
      }
    }
    function Tf(e, t) {
      _f.m(e, t);
      var n = bf;
      if (n && e) {
        var r = t && typeof t.as == `string` ? t.as : `script`,
          i =
            `link[rel="modulepreload"][as="` +
            Bt(r) +
            `"][href="` +
            Bt(e) +
            `"]`,
          a = i;
        switch (r) {
          case `audioworklet`:
          case `paintworklet`:
          case `serviceworker`:
          case `sharedworker`:
          case `worker`:
          case `script`:
            a = Pf(e);
        }
        if (
          !mf.has(a) &&
          ((e = p({ rel: `modulepreload`, href: e }, t)),
          mf.set(a, e),
          n.querySelector(i) === null)
        ) {
          switch (r) {
            case `audioworklet`:
            case `paintworklet`:
            case `serviceworker`:
            case `sharedworker`:
            case `worker`:
            case `script`:
              if (n.querySelector(Ff(a))) return;
          }
          ((r = n.createElement(`link`)),
            Pd(r, `link`, e),
            xt(r),
            n.head.appendChild(r));
        }
      }
    }
    function Ef(e, t, n) {
      _f.S(e, t, n);
      var r = bf;
      if (r && e) {
        var i = bt(r).hoistableStyles,
          a = Af(e);
        t ||= `default`;
        var o = i.get(a);
        if (!o) {
          var s = { loading: 0, preload: null };
          if ((o = r.querySelector(jf(a)))) s.loading = 5;
          else {
            ((e = p({ rel: `stylesheet`, href: e, "data-precedence": t }, n)),
              (n = mf.get(a)) && Rf(e, n));
            var c = (o = r.createElement(`link`));
            (xt(c),
              Pd(c, `link`, e),
              (c._p = new Promise(function (e, t) {
                ((c.onload = e), (c.onerror = t));
              })),
              c.addEventListener(`load`, function () {
                s.loading |= 1;
              }),
              c.addEventListener(`error`, function () {
                s.loading |= 2;
              }),
              (s.loading |= 4),
              Lf(o, t, r));
          }
          ((o = { type: `stylesheet`, instance: o, count: 1, state: s }),
            i.set(a, o));
        }
      }
    }
    function Df(e, t) {
      _f.X(e, t);
      var n = bf;
      if (n && e) {
        var r = bt(n).hoistableScripts,
          i = Pf(e),
          a = r.get(i);
        a ||
          ((a = n.querySelector(Ff(i))),
          a ||
            ((e = p({ src: e, async: !0 }, t)),
            (t = mf.get(i)) && zf(e, t),
            (a = n.createElement(`script`)),
            xt(a),
            Pd(a, `link`, e),
            n.head.appendChild(a)),
          (a = { type: `script`, instance: a, count: 1, state: null }),
          r.set(i, a));
      }
    }
    function Of(e, t) {
      _f.M(e, t);
      var n = bf;
      if (n && e) {
        var r = bt(n).hoistableScripts,
          i = Pf(e),
          a = r.get(i);
        a ||
          ((a = n.querySelector(Ff(i))),
          a ||
            ((e = p({ src: e, async: !0, type: `module` }, t)),
            (t = mf.get(i)) && zf(e, t),
            (a = n.createElement(`script`)),
            xt(a),
            Pd(a, `link`, e),
            n.head.appendChild(a)),
          (a = { type: `script`, instance: a, count: 1, state: null }),
          r.set(i, a));
      }
    }
    function kf(e, t, n, r) {
      var i = (i = de.current) ? gf(i) : null;
      if (!i) throw Error(a(446));
      switch (e) {
        case `meta`:
        case `title`:
          return null;
        case `style`:
          return typeof n.precedence == `string` && typeof n.href == `string`
            ? ((t = Af(n.href)),
              (n = bt(i).hoistableStyles),
              (r = n.get(t)),
              r ||
                ((r = { type: `style`, instance: null, count: 0, state: null }),
                n.set(t, r)),
              r)
            : { type: `void`, instance: null, count: 0, state: null };
        case `link`:
          if (
            n.rel === `stylesheet` &&
            typeof n.href == `string` &&
            typeof n.precedence == `string`
          ) {
            e = Af(n.href);
            var o = bt(i).hoistableStyles,
              s = o.get(e);
            if (
              (s ||
                ((i = i.ownerDocument || i),
                (s = {
                  type: `stylesheet`,
                  instance: null,
                  count: 0,
                  state: { loading: 0, preload: null },
                }),
                o.set(e, s),
                (o = i.querySelector(jf(e))) &&
                  !o._p &&
                  ((s.instance = o), (s.state.loading = 5)),
                mf.has(e) ||
                  ((n = {
                    rel: `preload`,
                    as: `style`,
                    href: n.href,
                    crossOrigin: n.crossOrigin,
                    integrity: n.integrity,
                    media: n.media,
                    hrefLang: n.hrefLang,
                    referrerPolicy: n.referrerPolicy,
                  }),
                  mf.set(e, n),
                  o || Nf(i, e, n, s.state))),
              t && r === null)
            )
              throw Error(a(528, ``));
            return s;
          }
          if (t && r !== null) throw Error(a(529, ``));
          return null;
        case `script`:
          return (
            (t = n.async),
            (n = n.src),
            typeof n == `string` &&
            t &&
            typeof t != `function` &&
            typeof t != `symbol`
              ? ((t = Pf(n)),
                (n = bt(i).hoistableScripts),
                (r = n.get(t)),
                r ||
                  ((r = {
                    type: `script`,
                    instance: null,
                    count: 0,
                    state: null,
                  }),
                  n.set(t, r)),
                r)
              : { type: `void`, instance: null, count: 0, state: null }
          );
        default:
          throw Error(a(444, e));
      }
    }
    function Af(e) {
      return `href="` + Bt(e) + `"`;
    }
    function jf(e) {
      return `link[rel="stylesheet"][` + e + `]`;
    }
    function Mf(e) {
      return p({}, e, { "data-precedence": e.precedence, precedence: null });
    }
    function Nf(e, t, n, r) {
      e.querySelector(`link[rel="preload"][as="style"][` + t + `]`)
        ? (r.loading = 1)
        : ((t = e.createElement(`link`)),
          (r.preload = t),
          t.addEventListener(`load`, function () {
            return (r.loading |= 1);
          }),
          t.addEventListener(`error`, function () {
            return (r.loading |= 2);
          }),
          Pd(t, `link`, n),
          xt(t),
          e.head.appendChild(t));
    }
    function Pf(e) {
      return `[src="` + Bt(e) + `"]`;
    }
    function Ff(e) {
      return `script[async]` + e;
    }
    function If(e, t, n) {
      if ((t.count++, t.instance === null))
        switch (t.type) {
          case `style`:
            var r = e.querySelector(`style[data-href~="` + Bt(n.href) + `"]`);
            if (r) return ((t.instance = r), xt(r), r);
            var i = p({}, n, {
              "data-href": n.href,
              "data-precedence": n.precedence,
              href: null,
              precedence: null,
            });
            return (
              (r = (e.ownerDocument || e).createElement(`style`)),
              xt(r),
              Pd(r, `style`, i),
              Lf(r, n.precedence, e),
              (t.instance = r)
            );
          case `stylesheet`:
            i = Af(n.href);
            var o = e.querySelector(jf(i));
            if (o) return ((t.state.loading |= 4), (t.instance = o), xt(o), o);
            ((r = Mf(n)),
              (i = mf.get(i)) && Rf(r, i),
              (o = (e.ownerDocument || e).createElement(`link`)),
              xt(o));
            var s = o;
            return (
              (s._p = new Promise(function (e, t) {
                ((s.onload = e), (s.onerror = t));
              })),
              Pd(o, `link`, r),
              (t.state.loading |= 4),
              Lf(o, n.precedence, e),
              (t.instance = o)
            );
          case `script`:
            return (
              (o = Pf(n.src)),
              (i = e.querySelector(Ff(o)))
                ? ((t.instance = i), xt(i), i)
                : ((r = n),
                  (i = mf.get(o)) && ((r = p({}, n)), zf(r, i)),
                  (e = e.ownerDocument || e),
                  (i = e.createElement(`script`)),
                  xt(i),
                  Pd(i, `link`, r),
                  e.head.appendChild(i),
                  (t.instance = i))
            );
          case `void`:
            return null;
          default:
            throw Error(a(443, t.type));
        }
      else
        t.type === `stylesheet` &&
          !(t.state.loading & 4) &&
          ((r = t.instance), (t.state.loading |= 4), Lf(r, n.precedence, e));
      return t.instance;
    }
    function Lf(e, t, n) {
      for (
        var r = n.querySelectorAll(
            `link[rel="stylesheet"][data-precedence],style[data-precedence]`,
          ),
          i = r.length ? r[r.length - 1] : null,
          a = i,
          o = 0;
        o < r.length;
        o++
      ) {
        var s = r[o];
        if (s.dataset.precedence === t) a = s;
        else if (a !== i) break;
      }
      a
        ? a.parentNode.insertBefore(e, a.nextSibling)
        : ((t = n.nodeType === 9 ? n.head : n),
          t.insertBefore(e, t.firstChild));
    }
    function Rf(e, t) {
      ((e.crossOrigin ??= t.crossOrigin),
        (e.referrerPolicy ??= t.referrerPolicy),
        (e.title ??= t.title));
    }
    function zf(e, t) {
      ((e.crossOrigin ??= t.crossOrigin),
        (e.referrerPolicy ??= t.referrerPolicy),
        (e.integrity ??= t.integrity));
    }
    var Bf = null;
    function Vf(e, t, n) {
      if (Bf === null) {
        var r = new Map(),
          i = (Bf = new Map());
        i.set(n, r);
      } else ((i = Bf), (r = i.get(n)), r || ((r = new Map()), i.set(n, r)));
      if (r.has(e)) return r;
      for (
        r.set(e, null), n = n.getElementsByTagName(e), i = 0;
        i < n.length;
        i++
      ) {
        var a = n[i];
        if (
          !(
            a[ht] ||
            a[ct] ||
            (e === `link` && a.getAttribute(`rel`) === `stylesheet`)
          ) &&
          a.namespaceURI !== `http://www.w3.org/2000/svg`
        ) {
          var o = a.getAttribute(t) || ``;
          o = e + o;
          var s = r.get(o);
          s ? s.push(a) : r.set(o, [a]);
        }
      }
      return r;
    }
    function Hf(e, t, n) {
      ((e = e.ownerDocument || e),
        e.head.insertBefore(
          n,
          t === `title` ? e.querySelector(`head > title`) : null,
        ));
    }
    function Uf(e, t, n) {
      if (n === 1 || t.itemProp != null) return !1;
      switch (e) {
        case `meta`:
        case `title`:
          return !0;
        case `style`:
          if (
            typeof t.precedence != `string` ||
            typeof t.href != `string` ||
            t.href === ``
          )
            break;
          return !0;
        case `link`:
          if (
            typeof t.rel != `string` ||
            typeof t.href != `string` ||
            t.href === `` ||
            t.onLoad ||
            t.onError
          )
            break;
          switch (t.rel) {
            case `stylesheet`:
              return (
                (e = t.disabled),
                typeof t.precedence == `string` && e == null
              );
            default:
              return !0;
          }
        case `script`:
          if (
            t.async &&
            typeof t.async != `function` &&
            typeof t.async != `symbol` &&
            !t.onLoad &&
            !t.onError &&
            t.src &&
            typeof t.src == `string`
          )
            return !0;
      }
      return !1;
    }
    function Wf(e) {
      return !(e.type === `stylesheet` && !(e.state.loading & 3));
    }
    function Gf(e, t, n, r) {
      if (
        n.type === `stylesheet` &&
        (typeof r.media != `string` || !1 !== matchMedia(r.media).matches) &&
        !(n.state.loading & 4)
      ) {
        if (n.instance === null) {
          var i = Af(r.href),
            a = t.querySelector(jf(i));
          if (a) {
            ((t = a._p),
              typeof t == `object` &&
                t &&
                typeof t.then == `function` &&
                (e.count++, (e = Jf.bind(e)), t.then(e, e)),
              (n.state.loading |= 4),
              (n.instance = a),
              xt(a));
            return;
          }
          ((a = t.ownerDocument || t),
            (r = Mf(r)),
            (i = mf.get(i)) && Rf(r, i),
            (a = a.createElement(`link`)),
            xt(a));
          var o = a;
          ((o._p = new Promise(function (e, t) {
            ((o.onload = e), (o.onerror = t));
          })),
            Pd(a, `link`, r),
            (n.instance = a));
        }
        (e.stylesheets === null && (e.stylesheets = new Map()),
          e.stylesheets.set(n, t),
          (t = n.state.preload) &&
            !(n.state.loading & 3) &&
            (e.count++,
            (n = Jf.bind(e)),
            t.addEventListener(`load`, n),
            t.addEventListener(`error`, n)));
      }
    }
    var Kf = 0;
    function qf(e, t) {
      return (
        e.stylesheets && e.count === 0 && Xf(e, e.stylesheets),
        0 < e.count || 0 < e.imgCount
          ? function (n) {
              var r = setTimeout(function () {
                if ((e.stylesheets && Xf(e, e.stylesheets), e.unsuspend)) {
                  var t = e.unsuspend;
                  ((e.unsuspend = null), t());
                }
              }, 6e4 + t);
              0 < e.imgBytes && Kf === 0 && (Kf = 62500 * Ld());
              var i = setTimeout(
                function () {
                  if (
                    ((e.waitingForImages = !1),
                    e.count === 0 &&
                      (e.stylesheets && Xf(e, e.stylesheets), e.unsuspend))
                  ) {
                    var t = e.unsuspend;
                    ((e.unsuspend = null), t());
                  }
                },
                (e.imgBytes > Kf ? 50 : 800) + t,
              );
              return (
                (e.unsuspend = n),
                function () {
                  ((e.unsuspend = null), clearTimeout(r), clearTimeout(i));
                }
              );
            }
          : null
      );
    }
    function Jf() {
      if (
        (this.count--,
        this.count === 0 && (this.imgCount === 0 || !this.waitingForImages))
      ) {
        if (this.stylesheets) Xf(this, this.stylesheets);
        else if (this.unsuspend) {
          var e = this.unsuspend;
          ((this.unsuspend = null), e());
        }
      }
    }
    var Yf = null;
    function Xf(e, t) {
      ((e.stylesheets = null),
        e.unsuspend !== null &&
          (e.count++,
          (Yf = new Map()),
          t.forEach(Zf, e),
          (Yf = null),
          Jf.call(e)));
    }
    function Zf(e, t) {
      if (!(t.state.loading & 4)) {
        var n = Yf.get(e);
        if (n) var r = n.get(null);
        else {
          ((n = new Map()), Yf.set(e, n));
          for (
            var i = e.querySelectorAll(
                `link[data-precedence],style[data-precedence]`,
              ),
              a = 0;
            a < i.length;
            a++
          ) {
            var o = i[a];
            (o.nodeName === `LINK` || o.getAttribute(`media`) !== `not all`) &&
              (n.set(o.dataset.precedence, o), (r = o));
          }
          r && n.set(null, r);
        }
        ((i = t.instance),
          (o = i.getAttribute(`data-precedence`)),
          (a = n.get(o) || r),
          a === r && n.set(null, i),
          n.set(o, i),
          this.count++,
          (r = Jf.bind(this)),
          i.addEventListener(`load`, r),
          i.addEventListener(`error`, r),
          a
            ? a.parentNode.insertBefore(i, a.nextSibling)
            : ((e = e.nodeType === 9 ? e.head : e),
              e.insertBefore(i, e.firstChild)),
          (t.state.loading |= 4));
      }
    }
    var Qf = {
      $$typeof: x,
      Provider: null,
      Consumer: null,
      _currentValue: j,
      _currentValue2: j,
      _threadCount: 0,
    };
    function $f(e, t, n, r, i, a, o, s, c) {
      ((this.tag = 1),
        (this.containerInfo = e),
        (this.pingCache = this.current = this.pendingChildren = null),
        (this.timeoutHandle = -1),
        (this.callbackNode =
          this.next =
          this.pendingContext =
          this.context =
          this.cancelPendingCommit =
            null),
        (this.callbackPriority = 0),
        (this.expirationTimes = Ze(-1)),
        (this.entangledLanes =
          this.shellSuspendCounter =
          this.errorRecoveryDisabledLanes =
          this.expiredLanes =
          this.warmLanes =
          this.pingedLanes =
          this.suspendedLanes =
          this.pendingLanes =
            0),
        (this.entanglements = Ze(0)),
        (this.hiddenUpdates = Ze(null)),
        (this.identifierPrefix = r),
        (this.onUncaughtError = i),
        (this.onCaughtError = a),
        (this.onRecoverableError = o),
        (this.pooledCache = null),
        (this.pooledCacheLanes = 0),
        (this.formState = c),
        (this.incompleteTransitions = new Map()));
    }
    function ep(e, t, n, r, i, a, o, s, c, l, u, d) {
      return (
        (e = new $f(e, t, n, o, c, l, u, d, s)),
        (t = 1),
        !0 === a && (t |= 24),
        (a = si(3, null, null, t)),
        (e.current = a),
        (a.stateNode = e),
        (t = oa()),
        t.refCount++,
        (e.pooledCache = t),
        t.refCount++,
        (a.memoizedState = { element: r, isDehydrated: n, cache: t }),
        za(a),
        e
      );
    }
    function tp(e) {
      return e ? ((e = ai), e) : ai;
    }
    function np(e, t, n, r, i, a) {
      ((i = tp(i)),
        r.context === null ? (r.context = i) : (r.pendingContext = i),
        (r = Va(t)),
        (r.payload = { element: n }),
        (a = a === void 0 ? null : a),
        a !== null && (r.callback = a),
        (n = Ha(e, r, t)),
        n !== null && (hu(n, e, t), Ua(n, e, t)));
    }
    function rp(e, t) {
      if (((e = e.memoizedState), e !== null && e.dehydrated !== null)) {
        var n = e.retryLane;
        e.retryLane = n !== 0 && n < t ? n : t;
      }
    }
    function ip(e, t) {
      (rp(e, t), (e = e.alternate) && rp(e, t));
    }
    function ap(e) {
      if (e.tag === 13 || e.tag === 31) {
        var t = ni(e, 67108864);
        (t !== null && hu(t, e, 67108864), ip(e, 67108864));
      }
    }
    function op(e) {
      if (e.tag === 13 || e.tag === 31) {
        var t = pu();
        t = rt(t);
        var n = ni(e, t);
        (n !== null && hu(n, e, t), ip(e, t));
      }
    }
    var sp = !0;
    function cp(e, t, n, r) {
      var i = k.T;
      k.T = null;
      var a = A.p;
      try {
        ((A.p = 2), up(e, t, n, r));
      } finally {
        ((A.p = a), (k.T = i));
      }
    }
    function lp(e, t, n, r) {
      var i = k.T;
      k.T = null;
      var a = A.p;
      try {
        ((A.p = 8), up(e, t, n, r));
      } finally {
        ((A.p = a), (k.T = i));
      }
    }
    function up(e, t, n, r) {
      if (sp) {
        var i = dp(r);
        if (i === null) (wd(e, t, r, fp, n), Cp(e, r));
        else if (Tp(i, e, t, n, r)) r.stopPropagation();
        else if ((Cp(e, r), t & 4 && -1 < Sp.indexOf(e))) {
          for (; i !== null; ) {
            var a = vt(i);
            if (a !== null)
              switch (a.tag) {
                case 3:
                  if (
                    ((a = a.stateNode), a.current.memoizedState.isDehydrated)
                  ) {
                    var o = Ke(a.pendingLanes);
                    if (o !== 0) {
                      var s = a;
                      for (s.pendingLanes |= 2, s.entangledLanes |= 2; o; ) {
                        var c = 1 << (31 - ze(o));
                        ((s.entanglements[1] |= c), (o &= ~c));
                      }
                      (rd(a), !(K & 6) && ((tu = De() + 500), id(0, !1)));
                    }
                  }
                  break;
                case 31:
                case 13:
                  ((s = ni(a, 2)), s !== null && hu(s, a, 2), bu(), ip(a, 2));
              }
            if (((a = dp(r)), a === null && wd(e, t, r, fp, n), a === i)) break;
            i = a;
          }
          i !== null && r.stopPropagation();
        } else wd(e, t, r, null, n);
      }
    }
    function dp(e) {
      return ((e = rn(e)), pp(e));
    }
    var fp = null;
    function pp(e) {
      if (((fp = null), (e = _t(e)), e !== null)) {
        var t = s(e);
        if (t === null) e = null;
        else {
          var n = t.tag;
          if (n === 13) {
            if (((e = c(t)), e !== null)) return e;
            e = null;
          } else if (n === 31) {
            if (((e = l(t)), e !== null)) return e;
            e = null;
          } else if (n === 3) {
            if (t.stateNode.current.memoizedState.isDehydrated)
              return t.tag === 3 ? t.stateNode.containerInfo : null;
            e = null;
          } else t !== e && (e = null);
        }
      }
      return ((fp = e), null);
    }
    function mp(e) {
      switch (e) {
        case `beforetoggle`:
        case `cancel`:
        case `click`:
        case `close`:
        case `contextmenu`:
        case `copy`:
        case `cut`:
        case `auxclick`:
        case `dblclick`:
        case `dragend`:
        case `dragstart`:
        case `drop`:
        case `focusin`:
        case `focusout`:
        case `input`:
        case `invalid`:
        case `keydown`:
        case `keypress`:
        case `keyup`:
        case `mousedown`:
        case `mouseup`:
        case `paste`:
        case `pause`:
        case `play`:
        case `pointercancel`:
        case `pointerdown`:
        case `pointerup`:
        case `ratechange`:
        case `reset`:
        case `resize`:
        case `seeked`:
        case `submit`:
        case `toggle`:
        case `touchcancel`:
        case `touchend`:
        case `touchstart`:
        case `volumechange`:
        case `change`:
        case `selectionchange`:
        case `textInput`:
        case `compositionstart`:
        case `compositionend`:
        case `compositionupdate`:
        case `beforeblur`:
        case `afterblur`:
        case `beforeinput`:
        case `blur`:
        case `fullscreenchange`:
        case `focus`:
        case `hashchange`:
        case `popstate`:
        case `select`:
        case `selectstart`:
          return 2;
        case `drag`:
        case `dragenter`:
        case `dragexit`:
        case `dragleave`:
        case `dragover`:
        case `mousemove`:
        case `mouseout`:
        case `mouseover`:
        case `pointermove`:
        case `pointerout`:
        case `pointerover`:
        case `scroll`:
        case `touchmove`:
        case `wheel`:
        case `mouseenter`:
        case `mouseleave`:
        case `pointerenter`:
        case `pointerleave`:
          return 8;
        case `message`:
          switch (Oe()) {
            case ke:
              return 2;
            case Ae:
              return 8;
            case je:
            case Me:
              return 32;
            case Ne:
              return 268435456;
            default:
              return 32;
          }
        default:
          return 32;
      }
    }
    var hp = !1,
      gp = null,
      _p = null,
      vp = null,
      yp = new Map(),
      bp = new Map(),
      xp = [],
      Sp =
        `mousedown mouseup touchcancel touchend touchstart auxclick dblclick pointercancel pointerdown pointerup dragend dragstart drop compositionend compositionstart keydown keypress keyup input textInput copy cut paste click change contextmenu reset`.split(
          ` `,
        );
    function Cp(e, t) {
      switch (e) {
        case `focusin`:
        case `focusout`:
          gp = null;
          break;
        case `dragenter`:
        case `dragleave`:
          _p = null;
          break;
        case `mouseover`:
        case `mouseout`:
          vp = null;
          break;
        case `pointerover`:
        case `pointerout`:
          yp.delete(t.pointerId);
          break;
        case `gotpointercapture`:
        case `lostpointercapture`:
          bp.delete(t.pointerId);
      }
    }
    function wp(e, t, n, r, i, a) {
      return e === null || e.nativeEvent !== a
        ? ((e = {
            blockedOn: t,
            domEventName: n,
            eventSystemFlags: r,
            nativeEvent: a,
            targetContainers: [i],
          }),
          t !== null && ((t = vt(t)), t !== null && ap(t)),
          e)
        : ((e.eventSystemFlags |= r),
          (t = e.targetContainers),
          i !== null && t.indexOf(i) === -1 && t.push(i),
          e);
    }
    function Tp(e, t, n, r, i) {
      switch (t) {
        case `focusin`:
          return ((gp = wp(gp, e, t, n, r, i)), !0);
        case `dragenter`:
          return ((_p = wp(_p, e, t, n, r, i)), !0);
        case `mouseover`:
          return ((vp = wp(vp, e, t, n, r, i)), !0);
        case `pointerover`:
          var a = i.pointerId;
          return (yp.set(a, wp(yp.get(a) || null, e, t, n, r, i)), !0);
        case `gotpointercapture`:
          return (
            (a = i.pointerId),
            bp.set(a, wp(bp.get(a) || null, e, t, n, r, i)),
            !0
          );
      }
      return !1;
    }
    function Ep(e) {
      var t = _t(e.target);
      if (t !== null) {
        var n = s(t);
        if (n !== null) {
          if (((t = n.tag), t === 13)) {
            if (((t = c(n)), t !== null)) {
              ((e.blockedOn = t),
                ot(e.priority, function () {
                  op(n);
                }));
              return;
            }
          } else if (t === 31) {
            if (((t = l(n)), t !== null)) {
              ((e.blockedOn = t),
                ot(e.priority, function () {
                  op(n);
                }));
              return;
            }
          } else if (
            t === 3 &&
            n.stateNode.current.memoizedState.isDehydrated
          ) {
            e.blockedOn = n.tag === 3 ? n.stateNode.containerInfo : null;
            return;
          }
        }
      }
      e.blockedOn = null;
    }
    function Dp(e) {
      if (e.blockedOn !== null) return !1;
      for (var t = e.targetContainers; 0 < t.length; ) {
        var n = dp(e.nativeEvent);
        if (n === null) {
          n = e.nativeEvent;
          var r = new n.constructor(n.type, n);
          ((nn = r), n.target.dispatchEvent(r), (nn = null));
        } else return ((t = vt(n)), t !== null && ap(t), (e.blockedOn = n), !1);
        t.shift();
      }
      return !0;
    }
    function Op(e, t, n) {
      Dp(e) && n.delete(t);
    }
    function kp() {
      ((hp = !1),
        gp !== null && Dp(gp) && (gp = null),
        _p !== null && Dp(_p) && (_p = null),
        vp !== null && Dp(vp) && (vp = null),
        yp.forEach(Op),
        bp.forEach(Op));
    }
    function Ap(e, n) {
      e.blockedOn === n &&
        ((e.blockedOn = null),
        hp ||
          ((hp = !0),
          t.unstable_scheduleCallback(t.unstable_NormalPriority, kp)));
    }
    var jp = null;
    function Mp(e) {
      jp !== e &&
        ((jp = e),
        t.unstable_scheduleCallback(t.unstable_NormalPriority, function () {
          jp === e && (jp = null);
          for (var t = 0; t < e.length; t += 3) {
            var n = e[t],
              r = e[t + 1],
              i = e[t + 2];
            if (typeof r != `function`) {
              if (pp(r || n) === null) continue;
              break;
            }
            var a = vt(n);
            a !== null &&
              (e.splice(t, 3),
              (t -= 3),
              Cs(
                a,
                { pending: !0, data: i, method: n.method, action: r },
                r,
                i,
              ));
          }
        }));
    }
    function Np(e) {
      function t(t) {
        return Ap(t, e);
      }
      (gp !== null && Ap(gp, e),
        _p !== null && Ap(_p, e),
        vp !== null && Ap(vp, e),
        yp.forEach(t),
        bp.forEach(t));
      for (var n = 0; n < xp.length; n++) {
        var r = xp[n];
        r.blockedOn === e && (r.blockedOn = null);
      }
      for (; 0 < xp.length && ((n = xp[0]), n.blockedOn === null); )
        (Ep(n), n.blockedOn === null && xp.shift());
      if (((n = (e.ownerDocument || e).$$reactFormReplay), n != null))
        for (r = 0; r < n.length; r += 3) {
          var i = n[r],
            a = n[r + 1],
            o = i[lt] || null;
          if (typeof a == `function`) o || Mp(n);
          else if (o) {
            var s = null;
            if (a && a.hasAttribute(`formAction`)) {
              if (((i = a), (o = a[lt] || null))) s = o.formAction;
              else if (pp(i) !== null) continue;
            } else s = o.action;
            (typeof s == `function`
              ? (n[r + 1] = s)
              : (n.splice(r, 3), (r -= 3)),
              Mp(n));
          }
        }
    }
    function Pp() {
      function e(e) {
        e.canIntercept &&
          e.info === `react-transition` &&
          e.intercept({
            handler: function () {
              return new Promise(function (e) {
                return (i = e);
              });
            },
            focusReset: `manual`,
            scroll: `manual`,
          });
      }
      function t() {
        (i !== null && (i(), (i = null)), r || setTimeout(n, 20));
      }
      function n() {
        if (!r && !navigation.transition) {
          var e = navigation.currentEntry;
          e &&
            e.url != null &&
            navigation.navigate(e.url, {
              state: e.getState(),
              info: `react-transition`,
              history: `replace`,
            });
        }
      }
      if (typeof navigation == `object`) {
        var r = !1,
          i = null;
        return (
          navigation.addEventListener(`navigate`, e),
          navigation.addEventListener(`navigatesuccess`, t),
          navigation.addEventListener(`navigateerror`, t),
          setTimeout(n, 100),
          function () {
            ((r = !0),
              navigation.removeEventListener(`navigate`, e),
              navigation.removeEventListener(`navigatesuccess`, t),
              navigation.removeEventListener(`navigateerror`, t),
              i !== null && (i(), (i = null)));
          }
        );
      }
    }
    function Fp(e) {
      this._internalRoot = e;
    }
    ((Ip.prototype.render = Fp.prototype.render =
      function (e) {
        var t = this._internalRoot;
        if (t === null) throw Error(a(409));
        var n = t.current;
        np(n, pu(), e, t, null, null);
      }),
      (Ip.prototype.unmount = Fp.prototype.unmount =
        function () {
          var e = this._internalRoot;
          if (e !== null) {
            this._internalRoot = null;
            var t = e.containerInfo;
            (np(e.current, 2, null, e, null, null), bu(), (t[ut] = null));
          }
        }));
    function Ip(e) {
      this._internalRoot = e;
    }
    Ip.prototype.unstable_scheduleHydration = function (e) {
      if (e) {
        var t = at();
        e = { blockedOn: null, target: e, priority: t };
        for (var n = 0; n < xp.length && t !== 0 && t < xp[n].priority; n++);
        (xp.splice(n, 0, e), n === 0 && Ep(e));
      }
    };
    var Lp = r.version;
    if (Lp !== `19.2.7`) throw Error(a(527, Lp, `19.2.7`));
    A.findDOMNode = function (e) {
      var t = e._reactInternals;
      if (t === void 0)
        throw typeof e.render == `function`
          ? Error(a(188))
          : ((e = Object.keys(e).join(`,`)), Error(a(268, e)));
      return (
        (e = d(t)),
        (e = e === null ? null : f(e)),
        (e = e === null ? null : e.stateNode),
        e
      );
    };
    var Rp = {
      bundleType: 0,
      version: `19.2.7`,
      rendererPackageName: `react-dom`,
      currentDispatcherRef: k,
      reconcilerVersion: `19.2.7`,
    };
    if (typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ < `u`) {
      var zp = __REACT_DEVTOOLS_GLOBAL_HOOK__;
      if (!zp.isDisabled && zp.supportsFiber)
        try {
          ((Ie = zp.inject(Rp)), (Le = zp));
        } catch {}
    }
    e.createRoot = function (e, t) {
      if (!o(e)) throw Error(a(299));
      var n = !1,
        r = ``,
        i = Ks,
        s = qs,
        c = Js;
      return (
        t != null &&
          (!0 === t.unstable_strictMode && (n = !0),
          t.identifierPrefix !== void 0 && (r = t.identifierPrefix),
          t.onUncaughtError !== void 0 && (i = t.onUncaughtError),
          t.onCaughtError !== void 0 && (s = t.onCaughtError),
          t.onRecoverableError !== void 0 && (c = t.onRecoverableError)),
        (t = ep(e, 1, !1, null, null, n, r, null, i, s, c, Pp)),
        (e[ut] = t.current),
        Sd(e),
        new Fp(t)
      );
    };
  }),
  ge = y((e, t) => {
    function n() {
      if (
        !(
          typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ > `u` ||
          typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE != `function`
        )
      )
        try {
          __REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE(n);
        } catch (e) {
          console.error(e);
        }
    }
    (n(), (t.exports = P()));
  })(),
  F = a(ue(), 1),
  _e = a(n(), 1);
function ve(e) {
  return F.createElement(oe, { flushSync: _e.flushSync, ...e });
}
te();
var I = (e) => typeof e == `string`,
  ye = () => {
    let e,
      t,
      n = new Promise((n, r) => {
        ((e = n), (t = r));
      });
    return ((n.resolve = e), (n.reject = t), n);
  },
  be = (e) => (e == null ? `` : String(e)),
  xe = (e, t, n) => {
    e.forEach((e) => {
      t[e] && (n[e] = t[e]);
    });
  },
  Se = /###/g,
  Ce = (e) => (e && e.includes(`###`) ? e.replace(Se, `.`) : e),
  we = (e) => !e || I(e),
  Te = (e, t, n) => {
    let r = I(t) ? t.split(`.`) : t,
      i = 0;
    for (; i < r.length - 1; ) {
      if (we(e)) return {};
      let t = Ce(r[i]);
      (!e[t] && n && (e[t] = new n()),
        (e = Object.prototype.hasOwnProperty.call(e, t) ? e[t] : {}),
        ++i);
    }
    return we(e) ? {} : { obj: e, k: Ce(r[i]) };
  },
  Ee = (e, t, n) => {
    let { obj: r, k: i } = Te(e, t, Object);
    if (r !== void 0 || t.length === 1) {
      r[i] = n;
      return;
    }
    let a = t[t.length - 1],
      o = t.slice(0, t.length - 1),
      s = Te(e, o, Object);
    for (; s.obj === void 0 && o.length; )
      ((a = `${o[o.length - 1]}.${a}`),
        (o = o.slice(0, o.length - 1)),
        (s = Te(e, o, Object)),
        s?.obj && s.obj[`${s.k}.${a}`] !== void 0 && (s.obj = void 0));
    s.obj[`${s.k}.${a}`] = n;
  },
  De = (e, t, n, r) => {
    let { obj: i, k: a } = Te(e, t, Object);
    ((i[a] = i[a] || []), i[a].push(n));
  },
  Oe = (e, t) => {
    let { obj: n, k: r } = Te(e, t);
    if (n && Object.prototype.hasOwnProperty.call(n, r)) return n[r];
  },
  ke = (e, t, n) => {
    let r = Oe(e, n);
    return r === void 0 ? Oe(t, n) : r;
  },
  Ae = (e, t, n) => {
    for (let r in t)
      r !== `__proto__` &&
        r !== `constructor` &&
        (r in e
          ? I(e[r]) ||
            e[r] instanceof String ||
            I(t[r]) ||
            t[r] instanceof String
            ? n && (e[r] = t[r])
            : Ae(e[r], t[r], n)
          : (e[r] = t[r]));
    return e;
  },
  je = (e) => e.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, `\\$&`),
  Me = {
    "&": `&amp;`,
    "<": `&lt;`,
    ">": `&gt;`,
    '"': `&quot;`,
    "'": `&#39;`,
    "/": `&#x2F;`,
  },
  Ne = (e) => (I(e) ? e.replace(/[&<>"'\/]/g, (e) => Me[e]) : e),
  Pe = class {
    constructor(e) {
      ((this.capacity = e),
        (this.regExpMap = new Map()),
        (this.regExpQueue = []));
    }
    getRegExp(e) {
      let t = this.regExpMap.get(e);
      if (t !== void 0) return t;
      let n = new RegExp(e);
      return (
        this.regExpQueue.length === this.capacity &&
          this.regExpMap.delete(this.regExpQueue.shift()),
        this.regExpMap.set(e, n),
        this.regExpQueue.push(e),
        n
      );
    }
  },
  Fe = [` `, `,`, `?`, `!`, `;`],
  Ie = new Pe(20),
  Le = (e, t, n) => {
    ((t ||= ``), (n ||= ``));
    let r = Fe.filter((e) => !t.includes(e) && !n.includes(e));
    if (r.length === 0) return !0;
    let i = Ie.getRegExp(
        `(${r.map((e) => (e === `?` ? `\\?` : e)).join(`|`)})`,
      ),
      a = !i.test(e);
    if (!a) {
      let t = e.indexOf(n);
      t > 0 && !i.test(e.substring(0, t)) && (a = !0);
    }
    return a;
  },
  Re = (e, t, n = `.`) => {
    if (!e) return;
    if (e[t]) return Object.prototype.hasOwnProperty.call(e, t) ? e[t] : void 0;
    let r = t.split(n),
      i = e;
    for (let e = 0; e < r.length; ) {
      if (!i || typeof i != `object`) return;
      let t,
        a = ``;
      for (let o = e; o < r.length; ++o)
        if ((o !== e && (a += n), (a += r[o]), (t = i[a]), t !== void 0)) {
          if (
            [`string`, `number`, `boolean`].includes(typeof t) &&
            o < r.length - 1
          )
            continue;
          e += o - e + 1;
          break;
        }
      i = t;
    }
    return i;
  },
  ze = (e) => e?.replace(/_/g, `-`),
  Be = {
    type: `logger`,
    log(e) {
      this.output(`log`, e);
    },
    warn(e) {
      this.output(`warn`, e);
    },
    error(e) {
      this.output(`error`, e);
    },
    output(e, t) {
      console?.[e]?.apply?.(console, t);
    },
  },
  Ve = new (class e {
    constructor(e, t = {}) {
      this.init(e, t);
    }
    init(e, t = {}) {
      ((this.prefix = t.prefix || `i18next:`),
        (this.logger = e || Be),
        (this.options = t),
        (this.debug = t.debug));
    }
    log(...e) {
      return this.forward(e, `log`, ``, !0);
    }
    warn(...e) {
      return this.forward(e, `warn`, ``, !0);
    }
    error(...e) {
      return this.forward(e, `error`, ``);
    }
    deprecate(...e) {
      return this.forward(e, `warn`, `WARNING DEPRECATED: `, !0);
    }
    forward(e, t, n, r) {
      return r && !this.debug
        ? null
        : ((e = e.map((e) =>
            I(e) ? e.replace(/[\r\n\x00-\x1F\x7F]/g, ` `) : e,
          )),
          I(e[0]) && (e[0] = `${n}${this.prefix} ${e[0]}`),
          this.logger[t](e));
    }
    create(t) {
      return new e(this.logger, {
        prefix: `${this.prefix}:${t}:`,
        ...this.options,
      });
    }
    clone(t) {
      return (
        (t ||= this.options),
        (t.prefix = t.prefix || this.prefix),
        new e(this.logger, t)
      );
    }
  })(),
  He = class {
    constructor() {
      this.observers = {};
    }
    on(e, t) {
      return (
        e.split(` `).forEach((e) => {
          this.observers[e] || (this.observers[e] = new Map());
          let n = this.observers[e].get(t) || 0;
          this.observers[e].set(t, n + 1);
        }),
        this
      );
    }
    off(e, t) {
      if (this.observers[e]) {
        if (!t) {
          delete this.observers[e];
          return;
        }
        this.observers[e].delete(t);
      }
    }
    once(e, t) {
      let n = (...r) => {
        (t(...r), this.off(e, n));
      };
      return (this.on(e, n), this);
    }
    emit(e, ...t) {
      (this.observers[e] &&
        Array.from(this.observers[e].entries()).forEach(([e, n]) => {
          for (let r = 0; r < n; r++) e(...t);
        }),
        this.observers[`*`] &&
          Array.from(this.observers[`*`].entries()).forEach(([n, r]) => {
            for (let i = 0; i < r; i++) n(e, ...t);
          }));
    }
  },
  Ue = class extends He {
    constructor(e, t = { ns: [`translation`], defaultNS: `translation` }) {
      (super(),
        (this.data = e || {}),
        (this.options = t),
        this.options.keySeparator === void 0 &&
          (this.options.keySeparator = `.`),
        this.options.ignoreJSONStructure === void 0 &&
          (this.options.ignoreJSONStructure = !0));
    }
    addNamespaces(e) {
      this.options.ns.includes(e) || this.options.ns.push(e);
    }
    removeNamespaces(e) {
      let t = this.options.ns.indexOf(e);
      t > -1 && this.options.ns.splice(t, 1);
    }
    getResource(e, t, n, r = {}) {
      let i =
          r.keySeparator === void 0
            ? this.options.keySeparator
            : r.keySeparator,
        a =
          r.ignoreJSONStructure === void 0
            ? this.options.ignoreJSONStructure
            : r.ignoreJSONStructure,
        o;
      e.includes(`.`)
        ? (o = e.split(`.`))
        : ((o = [e, t]),
          n &&
            (Array.isArray(n)
              ? o.push(...n)
              : I(n) && i
                ? o.push(...n.split(i))
                : o.push(n)));
      let s = Oe(this.data, o);
      return (
        !s &&
          !t &&
          !n &&
          e.includes(`.`) &&
          ((e = o[0]), (t = o[1]), (n = o.slice(2).join(`.`))),
        s || !a || !I(n) ? s : Re(this.data?.[e]?.[t], n, i)
      );
    }
    addResource(e, t, n, r, i = { silent: !1 }) {
      let a =
          i.keySeparator === void 0
            ? this.options.keySeparator
            : i.keySeparator,
        o = [e, t];
      (n && (o = o.concat(a ? n.split(a) : n)),
        e.includes(`.`) && ((o = e.split(`.`)), (r = t), (t = o[1])),
        this.addNamespaces(t),
        Ee(this.data, o, r),
        i.silent || this.emit(`added`, e, t, n, r));
    }
    addResources(e, t, n, r = { silent: !1 }) {
      for (let r in n)
        (I(n[r]) || Array.isArray(n[r])) &&
          this.addResource(e, t, r, n[r], { silent: !0 });
      r.silent || this.emit(`added`, e, t, n);
    }
    addResourceBundle(e, t, n, r, i, a = { silent: !1, skipCopy: !1 }) {
      let o = [e, t];
      (e.includes(`.`) && ((o = e.split(`.`)), (r = n), (n = t), (t = o[1])),
        this.addNamespaces(t));
      let s = Oe(this.data, o) || {};
      (a.skipCopy || (n = JSON.parse(JSON.stringify(n))),
        r ? Ae(s, n, i) : (s = { ...s, ...n }),
        Ee(this.data, o, s),
        a.silent || this.emit(`added`, e, t, n));
    }
    removeResourceBundle(e, t) {
      (this.hasResourceBundle(e, t) && delete this.data[e][t],
        this.removeNamespaces(t),
        this.emit(`removed`, e, t));
    }
    hasResourceBundle(e, t) {
      return this.getResource(e, t) !== void 0;
    }
    getResourceBundle(e, t) {
      return ((t ||= this.options.defaultNS), this.getResource(e, t));
    }
    getDataByLanguage(e) {
      return this.data[e];
    }
    hasLanguageSomeTranslations(e) {
      let t = this.getDataByLanguage(e);
      return !!((t && Object.keys(t)) || []).find(
        (e) => t[e] && Object.keys(t[e]).length > 0,
      );
    }
    toJSON() {
      return this.data;
    }
  },
  We = {
    processors: {},
    addPostProcessor(e) {
      this.processors[e.name] = e;
    },
    handle(e, t, n, r, i) {
      return (
        e.forEach((e) => {
          t = this.processors[e]?.process(t, n, r, i) ?? t;
        }),
        t
      );
    },
  },
  Ge = Symbol(`i18next/PATH_KEY`);
function Ke() {
  let e = [],
    t = Object.create(null),
    n;
  return (
    (t.get = (r, i) => (
      n?.revoke?.(),
      i === Ge ? e : (e.push(i), (n = Proxy.revocable(r, t)), n.proxy)
    )),
    Proxy.revocable(Object.create(null), t).proxy
  );
}
function qe(e, t) {
  let { [Ge]: n } = e(Ke()),
    r = t?.keySeparator ?? `.`,
    i = t?.nsSeparator ?? `:`,
    a = t?.enableSelector === `strict`;
  if (n.length > 1 && i) {
    let e = t?.ns,
      o = a
        ? Array.isArray(e)
          ? e
          : e
            ? [e]
            : null
        : Array.isArray(e)
          ? e
          : null;
    if (o && (a ? o : o.length > 1 ? o.slice(1) : []).includes(n[0]))
      return `${n[0]}${i}${n.slice(1).join(r)}`;
  }
  return n.join(r);
}
var Je = (e) => !I(e) && typeof e != `boolean` && typeof e != `number`,
  Ye = class e extends He {
    constructor(e, t = {}) {
      (super(),
        xe(
          [
            `resourceStore`,
            `languageUtils`,
            `pluralResolver`,
            `interpolator`,
            `backendConnector`,
            `i18nFormat`,
            `utils`,
          ],
          e,
          this,
        ),
        (this.options = t),
        this.options.keySeparator === void 0 &&
          (this.options.keySeparator = `.`),
        (this.logger = Ve.create(`translator`)),
        (this.checkedLoadedFor = {}));
    }
    changeLanguage(e) {
      e && (this.language = e);
    }
    exists(e, t = { interpolation: {} }) {
      let n = { ...t };
      if (e == null) return !1;
      let r = this.resolve(e, n);
      if (r?.res === void 0) return !1;
      let i = Je(r.res);
      return !(n.returnObjects === !1 && i);
    }
    extractFromKey(e, t) {
      let n =
        t.nsSeparator === void 0 ? this.options.nsSeparator : t.nsSeparator;
      n === void 0 && (n = `:`);
      let r =
          t.keySeparator === void 0
            ? this.options.keySeparator
            : t.keySeparator,
        i = t.ns || this.options.defaultNS || [],
        a = n && e.includes(n),
        o =
          !this.options.userDefinedKeySeparator &&
          !t.keySeparator &&
          !this.options.userDefinedNsSeparator &&
          !t.nsSeparator &&
          !Le(e, n, r);
      if (a && !o) {
        let t = e.match(this.interpolator.nestingRegexp);
        if (t && t.length > 0) return { key: e, namespaces: I(i) ? [i] : i };
        let a = e.split(n);
        ((n !== r || (n === r && this.options.ns.includes(a[0]))) &&
          (i = a.shift()),
          (e = a.join(r)));
      }
      return { key: e, namespaces: I(i) ? [i] : i };
    }
    translate(t, n, r) {
      let i = typeof n == `object` ? { ...n } : n;
      if (
        (typeof i != `object` &&
          this.options.overloadTranslationOptionHandler &&
          (i = this.options.overloadTranslationOptionHandler(arguments)),
        typeof i == `object` && (i = { ...i }),
        (i ||= {}),
        t == null)
      )
        return ``;
      (typeof t == `function` && (t = qe(t, { ...this.options, ...i })),
        Array.isArray(t) || (t = [String(t)]),
        (t = t.map((e) =>
          typeof e == `function` ? qe(e, { ...this.options, ...i }) : String(e),
        )));
      let a =
          i.returnDetails === void 0
            ? this.options.returnDetails
            : i.returnDetails,
        o =
          i.keySeparator === void 0
            ? this.options.keySeparator
            : i.keySeparator,
        { key: s, namespaces: c } = this.extractFromKey(t[t.length - 1], i),
        l = c[c.length - 1],
        u = i.nsSeparator === void 0 ? this.options.nsSeparator : i.nsSeparator;
      u === void 0 && (u = `:`);
      let d = i.lng || this.language,
        f = i.appendNamespaceToCIMode || this.options.appendNamespaceToCIMode;
      if (d?.toLowerCase() === `cimode`)
        return f
          ? a
            ? {
                res: `${l}${u}${s}`,
                usedKey: s,
                exactUsedKey: s,
                usedLng: d,
                usedNS: l,
                usedParams: this.getUsedParamsDetails(i),
              }
            : `${l}${u}${s}`
          : a
            ? {
                res: s,
                usedKey: s,
                exactUsedKey: s,
                usedLng: d,
                usedNS: l,
                usedParams: this.getUsedParamsDetails(i),
              }
            : s;
      let p = this.resolve(t, i),
        m = p?.res,
        h = p?.usedKey || s,
        g = p?.exactUsedKey || s,
        _ = [`[object Number]`, `[object Function]`, `[object RegExp]`],
        v = i.joinArrays === void 0 ? this.options.joinArrays : i.joinArrays,
        y = !this.i18nFormat || this.i18nFormat.handleAsObject,
        b = i.count !== void 0 && !I(i.count),
        x = e.hasDefaultValue(i),
        S = b ? this.pluralResolver.getSuffix(d, i.count, i) : ``,
        C =
          i.ordinal && b
            ? this.pluralResolver.getSuffix(d, i.count, { ordinal: !1 })
            : ``,
        w = b && !i.ordinal && i.count === 0,
        T =
          (w && i[`defaultValue${this.options.pluralSeparator}zero`]) ||
          i[`defaultValue${S}`] ||
          i[`defaultValue${C}`] ||
          i.defaultValue,
        E = m;
      y && !m && x && (E = T);
      let ee = Je(E),
        D = Object.prototype.toString.apply(E);
      if (y && E && ee && !_.includes(D) && !(I(v) && Array.isArray(E))) {
        if (!i.returnObjects && !this.options.returnObjects) {
          this.options.returnedObjectHandler ||
            this.logger.warn(
              `accessing an object - but returnObjects options is not enabled!`,
            );
          let e = this.options.returnedObjectHandler
            ? this.options.returnedObjectHandler(h, E, { ...i, ns: c })
            : `key '${s} (${this.language})' returned an object instead of string.`;
          return a
            ? ((p.res = e), (p.usedParams = this.getUsedParamsDetails(i)), p)
            : e;
        }
        if (o) {
          let e = Array.isArray(E),
            t = e ? [] : {},
            n = e ? g : h;
          for (let e in E)
            if (Object.prototype.hasOwnProperty.call(E, e)) {
              let r = `${n}${o}${e}`;
              (x && !m
                ? (t[e] = this.translate(r, {
                    ...i,
                    defaultValue: Je(T) ? T[e] : void 0,
                    joinArrays: !1,
                    ns: c,
                  }))
                : (t[e] = this.translate(r, { ...i, joinArrays: !1, ns: c })),
                t[e] === r && (t[e] = E[e]));
            }
          m = t;
        }
      } else if (y && I(v) && Array.isArray(m))
        ((m = m.join(v)), (m &&= this.extendTranslation(m, t, i, r)));
      else {
        let e = !1,
          n = !1;
        (!this.isValidLookup(m) && x && ((e = !0), (m = T)),
          this.isValidLookup(m) || ((n = !0), (m = s)));
        let a =
            (i.missingKeyNoValueFallbackToKey ||
              this.options.missingKeyNoValueFallbackToKey) &&
            n
              ? void 0
              : m,
          c = x && T !== m && this.options.updateMissing;
        if (n || e || c) {
          if (
            (this.logger.log(
              c ? `updateKey` : `missingKey`,
              d,
              l,
              b && !c
                ? `${s}${this.pluralResolver.getSuffix(d, i.count, i)}`
                : s,
              c ? T : m,
            ),
            o)
          ) {
            let e = this.resolve(s, { ...i, keySeparator: !1 });
            e &&
              e.res &&
              this.logger.warn(
                `Seems the loaded translations were in flat JSON format instead of nested. Either set keySeparator: false on init or make sure your translations are published in nested format.`,
              );
          }
          let e = [],
            t = this.languageUtils.getFallbackCodes(
              this.options.fallbackLng,
              i.lng || this.language,
            );
          if (this.options.saveMissingTo === `fallback` && t && t[0])
            for (let n = 0; n < t.length; n++) e.push(t[n]);
          else
            this.options.saveMissingTo === `all`
              ? (e = this.languageUtils.toResolveHierarchy(
                  i.lng || this.language,
                ))
              : e.push(i.lng || this.language);
          let n = (e, t, n) => {
            let r = x && n !== m ? n : a;
            (this.options.missingKeyHandler
              ? this.options.missingKeyHandler(e, l, t, r, c, i)
              : this.backendConnector?.saveMissing &&
                this.backendConnector.saveMissing(e, l, t, r, c, i),
              this.emit(`missingKey`, e, l, t, m));
          };
          this.options.saveMissing &&
            (this.options.saveMissingPlurals && b
              ? e.forEach((e) => {
                  let t = this.pluralResolver.getSuffixes(e, i);
                  (w &&
                    i[`defaultValue${this.options.pluralSeparator}zero`] &&
                    !t.includes(`${this.options.pluralSeparator}zero`) &&
                    t.push(`${this.options.pluralSeparator}zero`),
                    t.forEach((t) => {
                      n([e], s + t, i[`defaultValue${t}`] || T);
                    }));
                })
              : n(e, s, T));
        }
        ((m = this.extendTranslation(m, t, i, p, r)),
          n &&
            m === s &&
            this.options.appendNamespaceToMissingKey &&
            (m = `${l}${u}${s}`),
          (n || e) &&
            this.options.parseMissingKeyHandler &&
            (m = this.options.parseMissingKeyHandler(
              this.options.appendNamespaceToMissingKey ? `${l}${u}${s}` : s,
              e ? m : void 0,
              i,
            )));
      }
      return a
        ? ((p.res = m), (p.usedParams = this.getUsedParamsDetails(i)), p)
        : m;
    }
    extendTranslation(e, t, n, r, i) {
      if (this.i18nFormat?.parse)
        e = this.i18nFormat.parse(
          e,
          { ...this.options.interpolation.defaultVariables, ...n },
          n.lng || this.language || r.usedLng,
          r.usedNS,
          r.usedKey,
          { resolved: r },
        );
      else if (!n.skipInterpolation) {
        n.interpolation &&
          this.interpolator.init({
            ...n,
            interpolation: {
              ...this.options.interpolation,
              ...n.interpolation,
            },
          });
        let a =
            I(e) &&
            (n?.interpolation?.skipOnVariables === void 0
              ? this.options.interpolation.skipOnVariables
              : n.interpolation.skipOnVariables),
          o;
        if (a) {
          let t = e.match(this.interpolator.nestingRegexp);
          o = t && t.length;
        }
        let s = n.replace && !I(n.replace) ? n.replace : n;
        if (
          (this.options.interpolation.defaultVariables &&
            (s = { ...this.options.interpolation.defaultVariables, ...s }),
          (e = this.interpolator.interpolate(
            e,
            s,
            n.lng || this.language || r.usedLng,
            n,
          )),
          a)
        ) {
          let t = e.match(this.interpolator.nestingRegexp),
            r = t && t.length;
          o < r && (n.nest = !1);
        }
        (!n.lng && r && r.res && (n.lng = this.language || r.usedLng),
          n.nest !== !1 &&
            (e = this.interpolator.nest(
              e,
              (...e) =>
                i?.[0] === e[0] && !n.context
                  ? (this.logger.warn(
                      `It seems you are nesting recursively key: ${e[0]} in key: ${t[0]}`,
                    ),
                    null)
                  : this.translate(...e, t),
              n,
            )),
          n.interpolation && this.interpolator.reset());
      }
      let a = n.postProcess || this.options.postProcess,
        o = I(a) ? [a] : a;
      return (
        e != null &&
          o?.length &&
          n.applyPostProcessor !== !1 &&
          (e = We.handle(
            o,
            e,
            t,
            this.options && this.options.postProcessPassResolved
              ? {
                  i18nResolved: {
                    ...r,
                    usedParams: this.getUsedParamsDetails(n),
                  },
                  ...n,
                }
              : n,
            this,
          )),
        e
      );
    }
    resolve(e, t = {}) {
      let n, r, i, a, o;
      return (
        I(e) && (e = [e]),
        Array.isArray(e) &&
          (e = e.map((e) =>
            typeof e == `function` ? qe(e, { ...this.options, ...t }) : e,
          )),
        e.forEach((e) => {
          if (this.isValidLookup(n)) return;
          let s = this.extractFromKey(e, t),
            c = s.key;
          r = c;
          let l = s.namespaces;
          this.options.fallbackNS && (l = l.concat(this.options.fallbackNS));
          let u = t.count !== void 0 && !I(t.count),
            d = u && !t.ordinal && t.count === 0,
            f =
              t.context !== void 0 &&
              (I(t.context) || typeof t.context == `number`) &&
              t.context !== ``,
            p = t.lngs
              ? t.lngs
              : this.languageUtils.toResolveHierarchy(
                  t.lng || this.language,
                  t.fallbackLng,
                );
          l.forEach((e) => {
            this.isValidLookup(n) ||
              ((o = e),
              !this.checkedLoadedFor[`${p[0]}-${e}`] &&
                this.utils?.hasLoadedNamespace &&
                !this.utils?.hasLoadedNamespace(o) &&
                ((this.checkedLoadedFor[`${p[0]}-${e}`] = !0),
                this.logger.warn(
                  `key "${r}" for languages "${p.join(`, `)}" won't get resolved as namespace "${o}" was not yet loaded`,
                  `This means something IS WRONG in your setup. You access the t function before i18next.init / i18next.loadNamespace / i18next.changeLanguage was done. Wait for the callback or Promise to resolve before accessing it!!!`,
                )),
              p.forEach((r) => {
                if (this.isValidLookup(n)) return;
                a = r;
                let o = [c];
                if (this.i18nFormat?.addLookupKeys)
                  this.i18nFormat.addLookupKeys(o, c, r, e, t);
                else {
                  let e;
                  u && (e = this.pluralResolver.getSuffix(r, t.count, t));
                  let n = `${this.options.pluralSeparator}zero`,
                    i = `${this.options.pluralSeparator}ordinal${this.options.pluralSeparator}`;
                  if (
                    (u &&
                      (t.ordinal &&
                        e.startsWith(i) &&
                        o.push(c + e.replace(i, this.options.pluralSeparator)),
                      o.push(c + e),
                      d && o.push(c + n)),
                    f)
                  ) {
                    let r = `${c}${this.options.contextSeparator || `_`}${t.context}`;
                    (o.push(r),
                      u &&
                        (t.ordinal &&
                          e.startsWith(i) &&
                          o.push(
                            r + e.replace(i, this.options.pluralSeparator),
                          ),
                        o.push(r + e),
                        d && o.push(r + n)));
                  }
                }
                let s;
                for (; (s = o.pop()); )
                  this.isValidLookup(n) ||
                    ((i = s), (n = this.getResource(r, e, s, t)));
              }));
          });
        }),
        { res: n, usedKey: r, exactUsedKey: i, usedLng: a, usedNS: o }
      );
    }
    isValidLookup(e) {
      return (
        e !== void 0 &&
        !(!this.options.returnNull && e === null) &&
        !(!this.options.returnEmptyString && e === ``)
      );
    }
    getResource(e, t, n, r = {}) {
      return this.i18nFormat?.getResource
        ? this.i18nFormat.getResource(e, t, n, r)
        : this.resourceStore.getResource(e, t, n, r);
    }
    getUsedParamsDetails(e = {}) {
      let t = [
          `defaultValue`,
          `ordinal`,
          `context`,
          `replace`,
          `lng`,
          `lngs`,
          `fallbackLng`,
          `ns`,
          `keySeparator`,
          `nsSeparator`,
          `returnObjects`,
          `returnDetails`,
          `joinArrays`,
          `postProcess`,
          `interpolation`,
        ],
        n = e.replace && !I(e.replace),
        r = n ? e.replace : e;
      if (
        (n && e.count !== void 0 && (r.count = e.count),
        this.options.interpolation.defaultVariables &&
          (r = { ...this.options.interpolation.defaultVariables, ...r }),
        !n)
      ) {
        r = { ...r };
        for (let e of t) delete r[e];
      }
      return r;
    }
    static hasDefaultValue(e) {
      for (let t in e)
        if (
          Object.prototype.hasOwnProperty.call(e, t) &&
          t.startsWith(`defaultValue`) &&
          e[t] !== void 0
        )
          return !0;
      return !1;
    }
  },
  Xe = class {
    constructor(e) {
      ((this.options = e),
        (this.supportedLngs = this.options.supportedLngs || !1),
        (this.logger = Ve.create(`languageUtils`)));
    }
    getScriptPartFromCode(e) {
      if (((e = ze(e)), !e || !e.includes(`-`))) return null;
      let t = e.split(`-`);
      return t.length === 2 || (t.pop(), t[t.length - 1].toLowerCase() === `x`)
        ? null
        : this.formatLanguageCode(t.join(`-`));
    }
    getLanguagePartFromCode(e) {
      if (((e = ze(e)), !e || !e.includes(`-`))) return e;
      let t = e.split(`-`);
      return this.formatLanguageCode(t[0]);
    }
    formatLanguageCode(e) {
      if (I(e) && e.includes(`-`)) {
        let t;
        try {
          t = Intl.getCanonicalLocales(e)[0];
        } catch {}
        return (
          t && this.options.lowerCaseLng && (t = t.toLowerCase()),
          t || (this.options.lowerCaseLng ? e.toLowerCase() : e)
        );
      }
      return this.options.cleanCode || this.options.lowerCaseLng
        ? e.toLowerCase()
        : e;
    }
    isSupportedCode(e) {
      return (
        (this.options.load === `languageOnly` ||
          this.options.nonExplicitSupportedLngs) &&
          (e = this.getLanguagePartFromCode(e)),
        !this.supportedLngs ||
          !this.supportedLngs.length ||
          this.supportedLngs.includes(e)
      );
    }
    getBestMatchFromCodes(e) {
      if (!e) return null;
      let t;
      return (
        e.forEach((e) => {
          if (t) return;
          let n = this.formatLanguageCode(e);
          (!this.options.supportedLngs || this.isSupportedCode(n)) && (t = n);
        }),
        !t &&
          this.options.supportedLngs &&
          e.forEach((e) => {
            if (t) return;
            let n = this.getScriptPartFromCode(e);
            if (this.isSupportedCode(n)) return (t = n);
            let r = this.getLanguagePartFromCode(e);
            if (this.isSupportedCode(r)) return (t = r);
            t = this.options.supportedLngs.find((e) =>
              e === r
                ? !0
                : !e.includes(`-`) && !r.includes(`-`)
                  ? !1
                  : !!(
                      (e.includes(`-`) &&
                        !r.includes(`-`) &&
                        e.slice(0, e.indexOf(`-`)) === r) ||
                      (e.startsWith(r) && r.length > 1)
                    ),
            );
          }),
        (t ||= this.getFallbackCodes(this.options.fallbackLng)[0]),
        t
      );
    }
    getFallbackCodes(e, t) {
      if (!e) return [];
      if (
        (typeof e == `function` && (e = e(t)),
        I(e) && (e = [e]),
        Array.isArray(e))
      )
        return e;
      if (!t) return e.default || [];
      let n = e[t];
      return (
        (n ||= e[this.getScriptPartFromCode(t)]),
        (n ||= e[this.formatLanguageCode(t)]),
        (n ||= e[this.getLanguagePartFromCode(t)]),
        (n ||= e.default),
        n || []
      );
    }
    toResolveHierarchy(e, t) {
      let n = this.getFallbackCodes(
          (t === !1 ? [] : t) || this.options.fallbackLng || [],
          e,
        ),
        r = [],
        i = (e) => {
          e &&
            (this.isSupportedCode(e)
              ? r.push(e)
              : this.logger.warn(
                  `rejecting language code not found in supportedLngs: ${e}`,
                ));
        };
      return (
        I(e) && (e.includes(`-`) || e.includes(`_`))
          ? (this.options.load !== `languageOnly` &&
              i(this.formatLanguageCode(e)),
            this.options.load !== `languageOnly` &&
              this.options.load !== `currentOnly` &&
              i(this.getScriptPartFromCode(e)),
            this.options.load !== `currentOnly` &&
              i(this.getLanguagePartFromCode(e)))
          : I(e) && i(this.formatLanguageCode(e)),
        n.forEach((e) => {
          r.includes(e) || i(this.formatLanguageCode(e));
        }),
        r
      );
    }
  },
  Ze = { zero: 0, one: 1, two: 2, few: 3, many: 4, other: 5 },
  Qe = {
    select: (e) => (e === 1 ? `one` : `other`),
    resolvedOptions: () => ({ pluralCategories: [`one`, `other`] }),
  },
  $e = class {
    constructor(e, t = {}) {
      ((this.languageUtils = e),
        (this.options = t),
        (this.logger = Ve.create(`pluralResolver`)),
        (this.pluralRulesCache = {}));
    }
    clearCache() {
      this.pluralRulesCache = {};
    }
    getRule(e, t = {}) {
      let n = ze(e === `dev` ? `en` : e),
        r = t.ordinal ? `ordinal` : `cardinal`,
        i = JSON.stringify({ cleanedCode: n, type: r });
      if (i in this.pluralRulesCache) return this.pluralRulesCache[i];
      let a;
      try {
        a = new Intl.PluralRules(n, { type: r });
      } catch {
        if (typeof Intl > `u`)
          return (
            this.logger.error(`No Intl support, please use an Intl polyfill!`),
            Qe
          );
        if (!e.match(/-|_/)) return Qe;
        let n = this.languageUtils.getLanguagePartFromCode(e);
        a = this.getRule(n, t);
      }
      return ((this.pluralRulesCache[i] = a), a);
    }
    needsPlural(e, t = {}) {
      let n = this.getRule(e, t);
      return (
        (n ||= this.getRule(`dev`, t)),
        n?.resolvedOptions().pluralCategories.length > 1
      );
    }
    getPluralFormsOfKey(e, t, n = {}) {
      return this.getSuffixes(e, n).map((e) => `${t}${e}`);
    }
    getSuffixes(e, t = {}) {
      let n = this.getRule(e, t);
      return (
        (n ||= this.getRule(`dev`, t)),
        n
          ? n
              .resolvedOptions()
              .pluralCategories.sort((e, t) => Ze[e] - Ze[t])
              .map(
                (e) =>
                  `${this.options.prepend}${t.ordinal ? `ordinal${this.options.prepend}` : ``}${e}`,
              )
          : []
      );
    }
    getSuffix(e, t, n = {}) {
      let r = this.getRule(e, n);
      return r
        ? `${this.options.prepend}${n.ordinal ? `ordinal${this.options.prepend}` : ``}${r.select(t)}`
        : (this.logger.warn(`no plural rule found for: ${e}`),
          this.getSuffix(`dev`, t, n));
    }
  },
  et = (e, t, n, r = `.`, i = !0) => {
    let a = ke(e, t, n);
    return (
      !a && i && I(n) && ((a = Re(e, n, r)), a === void 0 && (a = Re(t, n, r))),
      a
    );
  },
  tt = (e) => e.replace(/\$/g, `$$$$`),
  nt = class {
    constructor(e = {}) {
      ((this.logger = Ve.create(`interpolator`)),
        (this.options = e),
        (this.format = e?.interpolation?.format || ((e) => e)),
        this.init(e));
    }
    init(e = {}) {
      e.interpolation ||= { escapeValue: !0 };
      let {
        escape: t,
        escapeValue: n,
        useRawValueToEscape: r,
        prefix: i,
        prefixEscaped: a,
        suffix: o,
        suffixEscaped: s,
        formatSeparator: c,
        unescapeSuffix: l,
        unescapePrefix: u,
        nestingPrefix: d,
        nestingPrefixEscaped: f,
        nestingSuffix: p,
        nestingSuffixEscaped: m,
        nestingOptionsSeparator: h,
        maxReplaces: g,
        alwaysFormat: _,
      } = e.interpolation;
      ((this.escape = t === void 0 ? Ne : t),
        (this.escapeValue = n === void 0 ? !0 : n),
        (this.useRawValueToEscape = r === void 0 ? !1 : r),
        (this.prefix = i ? je(i) : a || `{{`),
        (this.suffix = o ? je(o) : s || `}}`),
        (this.formatSeparator = c || `,`),
        (this.unescapePrefix = l ? `` : u ? je(u) : `-`),
        (this.unescapeSuffix = this.unescapePrefix ? `` : l ? je(l) : ``),
        (this.nestingPrefix = d ? je(d) : f || je(`$t(`)),
        (this.nestingSuffix = p ? je(p) : m || je(`)`)),
        (this.nestingOptionsSeparator = h || `,`),
        (this.maxReplaces = g || 1e3),
        (this.alwaysFormat = _ === void 0 ? !1 : _),
        this.resetRegExp());
    }
    reset() {
      this.options && this.init(this.options);
    }
    resetRegExp() {
      let e = (e, t) =>
        e?.source === t ? ((e.lastIndex = 0), e) : new RegExp(t, `g`);
      ((this.regexp = e(this.regexp, `${this.prefix}(.+?)${this.suffix}`)),
        (this.regexpUnescape = e(
          this.regexpUnescape,
          `${this.prefix}${this.unescapePrefix}(.+?)${this.unescapeSuffix}${this.suffix}`,
        )),
        (this.nestingRegexp = e(
          this.nestingRegexp,
          `${this.nestingPrefix}((?:[^()"']+|"[^"]*"|'[^']*'|\\((?:[^()]|"[^"]*"|'[^']*')*\\))*?)${this.nestingSuffix}`,
        )));
    }
    interpolate(e, t, n, r) {
      let i,
        a,
        o,
        s =
          (this.options &&
            this.options.interpolation &&
            this.options.interpolation.defaultVariables) ||
          {},
        c = (e) => {
          if (!e.includes(this.formatSeparator)) {
            let i = et(
              t,
              s,
              e,
              this.options.keySeparator,
              this.options.ignoreJSONStructure,
            );
            return this.alwaysFormat
              ? this.format(i, void 0, n, { ...r, ...t, interpolationkey: e })
              : i;
          }
          let i = e.split(this.formatSeparator),
            a = i.shift().trim(),
            o = i.join(this.formatSeparator).trim();
          return this.format(
            et(
              t,
              s,
              a,
              this.options.keySeparator,
              this.options.ignoreJSONStructure,
            ),
            o,
            n,
            { ...r, ...t, interpolationkey: a },
          );
        };
      (this.resetRegExp(),
        !this.escapeValue &&
          typeof e == `string` &&
          /\$t\([^)]*\{[^}]*\{\{/.test(e) &&
          this.logger.warn(
            `nesting options string contains interpolated variables with escapeValue: false — if any of those values are attacker-controlled they can inject additional nesting options (e.g. redirect lng/ns). Sanitise untrusted input before passing it to t(), or keep escapeValue: true.`,
          ));
      let l =
          r?.missingInterpolationHandler ||
          this.options.missingInterpolationHandler,
        u =
          r?.interpolation?.skipOnVariables === void 0
            ? this.options.interpolation.skipOnVariables
            : r.interpolation.skipOnVariables;
      return (
        [
          { regex: this.regexpUnescape, safeValue: (e) => tt(e) },
          {
            regex: this.regexp,
            safeValue: (e) => (this.escapeValue ? tt(this.escape(e)) : tt(e)),
          },
        ].forEach((t) => {
          for (o = 0; (i = t.regex.exec(e)); ) {
            let n = i[1].trim();
            if (((a = c(n)), a === void 0))
              if (typeof l == `function`) {
                let t = l(e, i, r);
                a = I(t) ? t : ``;
              } else if (r && Object.prototype.hasOwnProperty.call(r, n))
                a = ``;
              else if (u) {
                a = i[0];
                continue;
              } else
                (this.logger.warn(
                  `missed to pass in variable ${n} for interpolating ${e}`,
                ),
                  (a = ``));
            else !I(a) && !this.useRawValueToEscape && (a = be(a));
            let s = t.safeValue(a);
            if (
              ((e = e.replace(i[0], s)),
              u
                ? ((t.regex.lastIndex += a.length),
                  (t.regex.lastIndex -= i[0].length))
                : (t.regex.lastIndex = 0),
              o++,
              o >= this.maxReplaces)
            )
              break;
          }
        }),
        e
      );
    }
    nest(e, t, n = {}) {
      let r,
        i,
        a,
        o = (e, t) => {
          let n = this.nestingOptionsSeparator;
          if (!e.includes(n)) return e;
          let r = e.split(RegExp(`${je(n)}[ ]*{`)),
            i = `{${r[1]}`;
          ((e = r[0]), (i = this.interpolate(i, a)));
          let o = i.match(/'/g),
            s = i.match(/"/g);
          (((o?.length ?? 0) % 2 == 0 && !s) || (s?.length ?? 0) % 2 != 0) &&
            (i = i.replace(/'/g, `"`));
          try {
            ((a = JSON.parse(i)), t && (a = { ...t, ...a }));
          } catch (t) {
            return (
              this.logger.warn(
                `failed parsing options string in nesting for key ${e}`,
                t,
              ),
              `${e}${n}${i}`
            );
          }
          return (
            a.defaultValue &&
              a.defaultValue.includes(this.prefix) &&
              delete a.defaultValue,
            e
          );
        };
      for (; (r = this.nestingRegexp.exec(e)); ) {
        let s = [];
        ((a = { ...n }),
          (a = a.replace && !I(a.replace) ? a.replace : a),
          (a.applyPostProcessor = !1),
          delete a.defaultValue);
        let c = /{.*}/.test(r[1])
          ? r[1].lastIndexOf(`}`) + 1
          : r[1].indexOf(this.formatSeparator);
        if (
          (c !== -1 &&
            ((s = r[1]
              .slice(c)
              .split(this.formatSeparator)
              .map((e) => e.trim())
              .filter(Boolean)),
            (r[1] = r[1].slice(0, c))),
          (i = t(o.call(this, r[1].trim(), a), a)),
          i && r[0] === e && !I(i))
        )
          return i;
        (I(i) || (i = be(i)),
          (i ||=
            (this.logger.warn(`missed to resolve ${r[1]} for nesting ${e}`),
            ``)),
          s.length &&
            (i = s.reduce(
              (e, t) =>
                this.format(e, t, n.lng, {
                  ...n,
                  interpolationkey: r[1].trim(),
                }),
              i.trim(),
            )),
          (e = e.replace(r[0], i)),
          (this.regexp.lastIndex = 0));
      }
      return e;
    }
  },
  rt = (e) => {
    let t = e.toLowerCase().trim(),
      n = {};
    if (e.includes(`(`)) {
      let r = e.split(`(`);
      t = r[0].toLowerCase().trim();
      let i = r[1].slice(0, -1);
      t === `currency` && !i.includes(`:`)
        ? (n.currency ||= i.trim())
        : t === `relativetime` && !i.includes(`:`)
          ? (n.range ||= i.trim())
          : i.split(`;`).forEach((e) => {
              if (e) {
                let [t, ...r] = e.split(`:`),
                  i = r
                    .join(`:`)
                    .trim()
                    .replace(/^'+|'+$/g, ``),
                  a = t.trim();
                (n[a] || (n[a] = i),
                  i === `false` && (n[a] = !1),
                  i === `true` && (n[a] = !0),
                  isNaN(i) || (n[a] = parseInt(i, 10)));
              }
            });
    }
    return { formatName: t, formatOptions: n };
  },
  it = (e) => {
    let t = {};
    return (n, r, i) => {
      let a = i;
      i &&
        i.interpolationkey &&
        i.formatParams &&
        i.formatParams[i.interpolationkey] &&
        i[i.interpolationkey] &&
        (a = { ...a, [i.interpolationkey]: void 0 });
      let o = r + JSON.stringify(a),
        s = t[o];
      return (s || ((s = e(ze(r), i)), (t[o] = s)), s(n));
    };
  },
  at = (e) => (t, n, r) => e(ze(n), r)(t),
  ot = class {
    constructor(e = {}) {
      ((this.logger = Ve.create(`formatter`)),
        (this.options = e),
        this.init(e));
    }
    init(e, t = { interpolation: {} }) {
      this.formatSeparator = t.interpolation.formatSeparator || `,`;
      let n = t.cacheInBuiltFormats ? it : at;
      this.formats = {
        number: n((e, t) => {
          let n = new Intl.NumberFormat(e, { ...t });
          return (e) => n.format(e);
        }),
        currency: n((e, t) => {
          let n = new Intl.NumberFormat(e, { ...t, style: `currency` });
          return (e) => n.format(e);
        }),
        datetime: n((e, t) => {
          let n = new Intl.DateTimeFormat(e, { ...t });
          return (e) => n.format(e);
        }),
        relativetime: n((e, t) => {
          let n = new Intl.RelativeTimeFormat(e, { ...t });
          return (e) => n.format(e, t.range || `day`);
        }),
        list: n((e, t) => {
          let n = new Intl.ListFormat(e, { ...t });
          return (e) => n.format(e);
        }),
      };
    }
    add(e, t) {
      this.formats[e.toLowerCase().trim()] = t;
    }
    addCached(e, t) {
      this.formats[e.toLowerCase().trim()] = it(t);
    }
    format(e, t, n, r = {}) {
      if (!t || e == null) return e;
      let i = t.split(this.formatSeparator);
      if (
        i.length > 1 &&
        i[0].indexOf(`(`) > 1 &&
        !i[0].includes(`)`) &&
        i.find((e) => e.includes(`)`))
      ) {
        let e = i.findIndex((e) => e.includes(`)`));
        i[0] = [i[0], ...i.splice(1, e)].join(this.formatSeparator);
      }
      return i.reduce((e, t) => {
        let { formatName: i, formatOptions: a } = rt(t);
        if (this.formats[i]) {
          let t = e;
          try {
            let o = r?.formatParams?.[r.interpolationkey] || {},
              s = o.locale || o.lng || r.locale || r.lng || n;
            t = this.formats[i](e, s, { ...a, ...r, ...o });
          } catch (e) {
            this.logger.warn(e);
          }
          return t;
        } else this.logger.warn(`there was no format function for ${i}`);
        return e;
      }, e);
    }
  },
  st = (e, t) => {
    e.pending[t] !== void 0 && (delete e.pending[t], e.pendingCount--);
  },
  ct = class extends He {
    constructor(e, t, n, r = {}) {
      (super(),
        (this.backend = e),
        (this.store = t),
        (this.services = n),
        (this.languageUtils = n.languageUtils),
        (this.options = r),
        (this.logger = Ve.create(`backendConnector`)),
        (this.waitingReads = []),
        (this.maxParallelReads = r.maxParallelReads || 10),
        (this.readingCalls = 0),
        (this.maxRetries = r.maxRetries >= 0 ? r.maxRetries : 5),
        (this.retryTimeout = r.retryTimeout >= 1 ? r.retryTimeout : 350),
        (this.state = {}),
        (this.queue = []),
        this.backend?.init?.(n, r.backend, r));
    }
    queueLoad(e, t, n, r) {
      let i = {},
        a = {},
        o = {},
        s = {};
      return (
        e.forEach((e) => {
          let r = !0;
          (t.forEach((t) => {
            let o = `${e}|${t}`;
            !n.reload && this.store.hasResourceBundle(e, t)
              ? (this.state[o] = 2)
              : this.state[o] < 0 ||
                (this.state[o] === 1
                  ? a[o] === void 0 && (a[o] = !0)
                  : ((this.state[o] = 1),
                    (r = !1),
                    a[o] === void 0 && (a[o] = !0),
                    i[o] === void 0 && (i[o] = !0),
                    s[t] === void 0 && (s[t] = !0)));
          }),
            r || (o[e] = !0));
        }),
        (Object.keys(i).length || Object.keys(a).length) &&
          this.queue.push({
            pending: a,
            pendingCount: Object.keys(a).length,
            loaded: {},
            errors: [],
            callback: r,
          }),
        {
          toLoad: Object.keys(i),
          pending: Object.keys(a),
          toLoadLanguages: Object.keys(o),
          toLoadNamespaces: Object.keys(s),
        }
      );
    }
    loaded(e, t, n) {
      let r = e.split(`|`),
        i = r[0],
        a = r[1];
      (t && this.emit(`failedLoading`, i, a, t),
        !t &&
          n &&
          this.store.addResourceBundle(i, a, n, void 0, void 0, {
            skipCopy: !0,
          }),
        (this.state[e] = t ? -1 : 2),
        t && n && (this.state[e] = 0));
      let o = {};
      (this.queue.forEach((n) => {
        (De(n.loaded, [i], a),
          st(n, e),
          t && n.errors.push(t),
          n.pendingCount === 0 &&
            !n.done &&
            (Object.keys(n.loaded).forEach((e) => {
              o[e] || (o[e] = {});
              let t = n.loaded[e];
              t.length &&
                t.forEach((t) => {
                  o[e][t] === void 0 && (o[e][t] = !0);
                });
            }),
            (n.done = !0),
            n.errors.length ? n.callback(n.errors) : n.callback()));
      }),
        this.emit(`loaded`, o),
        (this.queue = this.queue.filter((e) => !e.done)));
    }
    read(e, t, n, r = 0, i = this.retryTimeout, a) {
      if (!e.length) return a(null, {});
      if (this.readingCalls >= this.maxParallelReads) {
        this.waitingReads.push({
          lng: e,
          ns: t,
          fcName: n,
          tried: r,
          wait: i,
          callback: a,
        });
        return;
      }
      this.readingCalls++;
      let o = (o, s) => {
          if ((this.readingCalls--, this.waitingReads.length > 0)) {
            let e = this.waitingReads.shift();
            this.read(e.lng, e.ns, e.fcName, e.tried, e.wait, e.callback);
          }
          if (o && s && r < this.maxRetries) {
            setTimeout(() => {
              this.read(e, t, n, r + 1, i * 2, a);
            }, i);
            return;
          }
          a(o, s);
        },
        s = this.backend[n].bind(this.backend);
      if (s.length === 2) {
        try {
          let n = s(e, t);
          n && typeof n.then == `function`
            ? n.then((e) => o(null, e)).catch(o)
            : o(null, n);
        } catch (e) {
          o(e);
        }
        return;
      }
      return s(e, t, o);
    }
    prepareLoading(e, t, n = {}, r) {
      if (!this.backend)
        return (
          this.logger.warn(
            `No backend was added via i18next.use. Will not load resources.`,
          ),
          r && r()
        );
      (I(e) && (e = this.languageUtils.toResolveHierarchy(e)),
        I(t) && (t = [t]));
      let i = this.queueLoad(e, t, n, r);
      if (!i.toLoad.length) return (i.pending.length || r(), null);
      i.toLoad.forEach((e) => {
        this.loadOne(e);
      });
    }
    load(e, t, n) {
      this.prepareLoading(e, t, {}, n);
    }
    reload(e, t, n) {
      this.prepareLoading(e, t, { reload: !0 }, n);
    }
    loadOne(e, t = ``) {
      let n = e.split(`|`),
        r = n[0],
        i = n[1];
      this.read(r, i, `read`, void 0, void 0, (n, a) => {
        (n &&
          this.logger.warn(
            `${t}loading namespace ${i} for language ${r} failed`,
            n,
          ),
          !n &&
            a &&
            this.logger.log(`${t}loaded namespace ${i} for language ${r}`, a),
          this.loaded(e, n, a));
      });
    }
    saveMissing(e, t, n, r, i, a = {}, o = () => {}) {
      if (
        this.services?.utils?.hasLoadedNamespace &&
        !this.services?.utils?.hasLoadedNamespace(t)
      ) {
        this.logger.warn(
          `did not save key "${n}" as the namespace "${t}" was not yet loaded`,
          `This means something IS WRONG in your setup. You access the t function before i18next.init / i18next.loadNamespace / i18next.changeLanguage was done. Wait for the callback or Promise to resolve before accessing it!!!`,
        );
        return;
      }
      if (!(n == null || n === ``)) {
        if (this.backend?.create) {
          let s = { ...a, isUpdate: i },
            c = this.backend.create.bind(this.backend);
          if (c.length < 6)
            try {
              let i;
              ((i = c.length === 5 ? c(e, t, n, r, s) : c(e, t, n, r)),
                i && typeof i.then == `function`
                  ? i.then((e) => o(null, e)).catch(o)
                  : o(null, i));
            } catch (e) {
              o(e);
            }
          else c(e, t, n, r, o, s);
        }
        !e || !e[0] || this.store.addResource(e[0], t, n, r);
      }
    }
  },
  lt = () => ({
    debug: !1,
    initAsync: !0,
    ns: [`translation`],
    defaultNS: [`translation`],
    fallbackLng: [`dev`],
    fallbackNS: !1,
    supportedLngs: !1,
    nonExplicitSupportedLngs: !1,
    load: `all`,
    preload: !1,
    keySeparator: `.`,
    nsSeparator: `:`,
    pluralSeparator: `_`,
    contextSeparator: `_`,
    enableSelector: !1,
    partialBundledLanguages: !1,
    saveMissing: !1,
    updateMissing: !1,
    saveMissingTo: `fallback`,
    saveMissingPlurals: !0,
    missingKeyHandler: !1,
    missingInterpolationHandler: !1,
    postProcess: !1,
    postProcessPassResolved: !1,
    returnNull: !1,
    returnEmptyString: !0,
    returnObjects: !1,
    joinArrays: !1,
    returnedObjectHandler: !1,
    parseMissingKeyHandler: !1,
    appendNamespaceToMissingKey: !1,
    appendNamespaceToCIMode: !1,
    overloadTranslationOptionHandler: (e) => {
      let t = {};
      if (
        (typeof e[1] == `object` && (t = e[1]),
        I(e[1]) && (t.defaultValue = e[1]),
        I(e[2]) && (t.tDescription = e[2]),
        typeof e[2] == `object` || typeof e[3] == `object`)
      ) {
        let n = e[3] || e[2];
        Object.keys(n).forEach((e) => {
          t[e] = n[e];
        });
      }
      return t;
    },
    interpolation: {
      escapeValue: !0,
      prefix: `{{`,
      suffix: `}}`,
      formatSeparator: `,`,
      unescapePrefix: `-`,
      nestingPrefix: `$t(`,
      nestingSuffix: `)`,
      nestingOptionsSeparator: `,`,
      maxReplaces: 1e3,
      skipOnVariables: !0,
    },
    cacheInBuiltFormats: !0,
  }),
  ut = (e) => (
    I(e.ns) && (e.ns = [e.ns]),
    I(e.fallbackLng) && (e.fallbackLng = [e.fallbackLng]),
    I(e.fallbackNS) && (e.fallbackNS = [e.fallbackNS]),
    e.supportedLngs &&
      !e.supportedLngs.includes(`cimode`) &&
      (e.supportedLngs = e.supportedLngs.concat([`cimode`])),
    e
  ),
  dt = () => {},
  ft = (e) => {
    Object.getOwnPropertyNames(Object.getPrototypeOf(e)).forEach((t) => {
      typeof e[t] == `function` && (e[t] = e[t].bind(e));
    });
  },
  pt = class e extends He {
    constructor(e = {}, t) {
      if (
        (super(),
        (this.options = ut(e)),
        (this.services = {}),
        (this.logger = Ve),
        (this.modules = { external: [] }),
        ft(this),
        t && !this.isInitialized && !e.isClone)
      ) {
        if (!this.options.initAsync) return (this.init(e, t), this);
        setTimeout(() => {
          this.init(e, t);
        }, 0);
      }
    }
    init(e = {}, t) {
      ((this.isInitializing = !0),
        typeof e == `function` && ((t = e), (e = {})),
        e.defaultNS == null &&
          e.ns &&
          (I(e.ns)
            ? (e.defaultNS = e.ns)
            : e.ns.includes(`translation`) || (e.defaultNS = e.ns[0])));
      let n = lt();
      ((this.options = { ...n, ...this.options, ...ut(e) }),
        (this.options.interpolation = {
          ...n.interpolation,
          ...this.options.interpolation,
        }),
        e.keySeparator !== void 0 &&
          (this.options.userDefinedKeySeparator = e.keySeparator),
        e.nsSeparator !== void 0 &&
          (this.options.userDefinedNsSeparator = e.nsSeparator),
        typeof this.options.overloadTranslationOptionHandler != `function` &&
          (this.options.overloadTranslationOptionHandler =
            n.overloadTranslationOptionHandler));
      let r = (e) => (e ? (typeof e == `function` ? new e() : e) : null);
      if (!this.options.isClone) {
        this.modules.logger
          ? Ve.init(r(this.modules.logger), this.options)
          : Ve.init(null, this.options);
        let e;
        e = this.modules.formatter ? this.modules.formatter : ot;
        let t = new Xe(this.options);
        this.store = new Ue(this.options.resources, this.options);
        let n = this.services;
        ((n.logger = Ve),
          (n.resourceStore = this.store),
          (n.languageUtils = t),
          (n.pluralResolver = new $e(t, {
            prepend: this.options.pluralSeparator,
          })),
          e &&
            ((n.formatter = r(e)),
            n.formatter.init && n.formatter.init(n, this.options),
            (this.options.interpolation.format = n.formatter.format.bind(
              n.formatter,
            ))),
          (n.interpolator = new nt(this.options)),
          (n.utils = {
            hasLoadedNamespace: this.hasLoadedNamespace.bind(this),
          }),
          (n.backendConnector = new ct(
            r(this.modules.backend),
            n.resourceStore,
            n,
            this.options,
          )),
          n.backendConnector.on(`*`, (e, ...t) => {
            this.emit(e, ...t);
          }),
          this.modules.languageDetector &&
            ((n.languageDetector = r(this.modules.languageDetector)),
            n.languageDetector.init &&
              n.languageDetector.init(n, this.options.detection, this.options)),
          this.modules.i18nFormat &&
            ((n.i18nFormat = r(this.modules.i18nFormat)),
            n.i18nFormat.init && n.i18nFormat.init(this)),
          (this.translator = new Ye(this.services, this.options)),
          this.translator.on(`*`, (e, ...t) => {
            this.emit(e, ...t);
          }),
          this.modules.external.forEach((e) => {
            e.init && e.init(this);
          }));
      }
      if (
        ((this.format = this.options.interpolation.format),
        (t ||= dt),
        this.options.fallbackLng &&
          !this.services.languageDetector &&
          !this.options.lng)
      ) {
        let e = this.services.languageUtils.getFallbackCodes(
          this.options.fallbackLng,
        );
        e.length > 0 && e[0] !== `dev` && (this.options.lng = e[0]);
      }
      (!this.services.languageDetector &&
        !this.options.lng &&
        this.logger.warn(
          `init: no languageDetector is used and no lng is defined`,
        ),
        [
          `getResource`,
          `hasResourceBundle`,
          `getResourceBundle`,
          `getDataByLanguage`,
        ].forEach((e) => {
          this[e] = (...t) => this.store[e](...t);
        }),
        [
          `addResource`,
          `addResources`,
          `addResourceBundle`,
          `removeResourceBundle`,
        ].forEach((e) => {
          this[e] = (...t) => (this.store[e](...t), this);
        }));
      let i = ye(),
        a = () => {
          let e = (e, n) => {
            ((this.isInitializing = !1),
              this.isInitialized &&
                !this.initializedStoreOnce &&
                this.logger.warn(
                  `init: i18next is already initialized. You should call init just once!`,
                ),
              (this.isInitialized = !0),
              this.options.isClone ||
                this.logger.log(`initialized`, this.options),
              this.emit(`initialized`, this.options),
              i.resolve(n),
              t(e, n));
          };
          if (
            (this.languages || this.isLanguageChangingTo) &&
            !this.isInitialized
          )
            return e(null, this.t.bind(this));
          this.changeLanguage(this.options.lng, e);
        };
      return (
        this.options.resources || !this.options.initAsync
          ? a()
          : setTimeout(a, 0),
        i
      );
    }
    loadResources(e, t = dt) {
      let n = t,
        r = I(e) ? e : this.language;
      if (
        (typeof e == `function` && (n = e),
        !this.options.resources || this.options.partialBundledLanguages)
      ) {
        if (
          r?.toLowerCase() === `cimode` &&
          (!this.options.preload || this.options.preload.length === 0)
        )
          return n();
        let e = [],
          t = (t) => {
            t &&
              t !== `cimode` &&
              this.services.languageUtils.toResolveHierarchy(t).forEach((t) => {
                t !== `cimode` && (e.includes(t) || e.push(t));
              });
          };
        (r
          ? t(r)
          : this.services.languageUtils
              .getFallbackCodes(this.options.fallbackLng)
              .forEach((e) => t(e)),
          this.options.preload?.forEach?.((e) => t(e)),
          this.services.backendConnector.load(e, this.options.ns, (e) => {
            (!e &&
              !this.resolvedLanguage &&
              this.language &&
              this.setResolvedLanguage(this.language),
              n(e));
          }));
      } else n(null);
    }
    reloadResources(e, t, n) {
      let r = ye();
      return (
        typeof e == `function` && ((n = e), (e = void 0)),
        typeof t == `function` && ((n = t), (t = void 0)),
        (e ||= this.languages),
        (t ||= this.options.ns),
        (n ||= dt),
        this.services.backendConnector.reload(e, t, (e) => {
          (r.resolve(), n(e));
        }),
        r
      );
    }
    use(e) {
      if (!e)
        throw Error(
          `You are passing an undefined module! Please check the object you are passing to i18next.use()`,
        );
      if (!e.type)
        throw Error(
          `You are passing a wrong module! Please check the object you are passing to i18next.use()`,
        );
      return (
        e.type === `backend` && (this.modules.backend = e),
        (e.type === `logger` || (e.log && e.warn && e.error)) &&
          (this.modules.logger = e),
        e.type === `languageDetector` && (this.modules.languageDetector = e),
        e.type === `i18nFormat` && (this.modules.i18nFormat = e),
        e.type === `postProcessor` && We.addPostProcessor(e),
        e.type === `formatter` && (this.modules.formatter = e),
        e.type === `3rdParty` && this.modules.external.push(e),
        this
      );
    }
    setResolvedLanguage(e) {
      if (!(!e || !this.languages) && ![`cimode`, `dev`].includes(e)) {
        for (let e = 0; e < this.languages.length; e++) {
          let t = this.languages[e];
          if (
            ![`cimode`, `dev`].includes(t) &&
            this.store.hasLanguageSomeTranslations(t)
          ) {
            this.resolvedLanguage = t;
            break;
          }
        }
        !this.resolvedLanguage &&
          !this.languages.includes(e) &&
          this.store.hasLanguageSomeTranslations(e) &&
          ((this.resolvedLanguage = e), this.languages.unshift(e));
      }
    }
    changeLanguage(e, t) {
      this.isLanguageChangingTo = e;
      let n = ye();
      this.emit(`languageChanging`, e);
      let r = (e) => {
          ((this.language = e),
            (this.languages =
              this.services.languageUtils.toResolveHierarchy(e)),
            (this.resolvedLanguage = void 0),
            this.setResolvedLanguage(e));
        },
        i = (i, a) => {
          (a
            ? this.isLanguageChangingTo === e &&
              (r(a),
              this.translator.changeLanguage(a),
              (this.isLanguageChangingTo = void 0),
              this.emit(`languageChanged`, a),
              this.logger.log(`languageChanged`, a))
            : (this.isLanguageChangingTo = void 0),
            n.resolve((...e) => this.t(...e)),
            t && t(i, (...e) => this.t(...e)));
        },
        a = (t) => {
          !e && !t && this.services.languageDetector && (t = []);
          let n = I(t) ? t : t && t[0],
            a = this.store.hasLanguageSomeTranslations(n)
              ? n
              : this.services.languageUtils.getBestMatchFromCodes(
                  I(t) ? [t] : t,
                );
          (a &&
            (this.language || r(a),
            this.translator.language || this.translator.changeLanguage(a),
            this.services.languageDetector?.cacheUserLanguage?.(a)),
            this.loadResources(a, (e) => {
              i(e, a);
            }));
        };
      return (
        !e &&
        this.services.languageDetector &&
        !this.services.languageDetector.async
          ? a(this.services.languageDetector.detect())
          : !e &&
              this.services.languageDetector &&
              this.services.languageDetector.async
            ? this.services.languageDetector.detect.length === 0
              ? this.services.languageDetector.detect().then(a)
              : this.services.languageDetector.detect(a)
            : a(e),
        n
      );
    }
    getFixedT(e, t, n, r) {
      let i = r?.scopeNs,
        a = (e, t, ...r) => {
          let o;
          ((o =
            typeof t == `object`
              ? { ...t }
              : this.options.overloadTranslationOptionHandler(
                  [e, t].concat(r),
                )),
            (o.lng = o.lng || a.lng),
            (o.lngs = o.lngs || a.lngs));
          let s = o.ns !== void 0 && o.ns !== null;
          ((o.ns = o.ns || a.ns),
            o.keyPrefix !== `` &&
              (o.keyPrefix = o.keyPrefix || n || a.keyPrefix));
          let c = { ...this.options, ...o };
          (Array.isArray(i) && !s && (c.ns = i),
            typeof o.keyPrefix == `function` &&
              (o.keyPrefix = qe(o.keyPrefix, c)));
          let l = this.options.keySeparator || `.`,
            u;
          return (
            o.keyPrefix && Array.isArray(e)
              ? (u = e.map(
                  (e) => (
                    typeof e == `function` && (e = qe(e, c)),
                    `${o.keyPrefix}${l}${e}`
                  ),
                ))
              : (typeof e == `function` && (e = qe(e, c)),
                (u = o.keyPrefix ? `${o.keyPrefix}${l}${e}` : e)),
            this.t(u, o)
          );
        };
      return (
        I(e) ? (a.lng = e) : (a.lngs = e),
        (a.ns = t),
        (a.keyPrefix = n),
        a
      );
    }
    t(...e) {
      return this.translator?.translate(...e);
    }
    exists(...e) {
      return this.translator?.exists(...e);
    }
    setDefaultNamespace(e) {
      this.options.defaultNS = e;
    }
    hasLoadedNamespace(e, t = {}) {
      if (!this.isInitialized)
        return (
          this.logger.warn(
            `hasLoadedNamespace: i18next was not initialized`,
            this.languages,
          ),
          !1
        );
      if (!this.languages || !this.languages.length)
        return (
          this.logger.warn(
            `hasLoadedNamespace: i18n.languages were undefined or empty`,
            this.languages,
          ),
          !1
        );
      let n = t.lng || this.resolvedLanguage || this.languages[0],
        r = this.options ? this.options.fallbackLng : !1,
        i = this.languages[this.languages.length - 1];
      if (n.toLowerCase() === `cimode`) return !0;
      let a = (e, t) => {
        let n = this.services.backendConnector.state[`${e}|${t}`];
        return n === -1 || n === 0 || n === 2;
      };
      if (t.precheck) {
        let e = t.precheck(this, a);
        if (e !== void 0) return e;
      }
      return !!(
        this.hasResourceBundle(n, e) ||
        !this.services.backendConnector.backend ||
        (this.options.resources && !this.options.partialBundledLanguages) ||
        (a(n, e) && (!r || a(i, e)))
      );
    }
    loadNamespaces(e, t) {
      let n = ye();
      return this.options.ns
        ? (I(e) && (e = [e]),
          e.forEach((e) => {
            this.options.ns.includes(e) || this.options.ns.push(e);
          }),
          this.loadResources((e) => {
            (n.resolve(), t && t(e));
          }),
          n)
        : (t && t(), Promise.resolve());
    }
    loadLanguages(e, t) {
      let n = ye();
      I(e) && (e = [e]);
      let r = this.options.preload || [],
        i = e.filter(
          (e) =>
            !r.includes(e) && this.services.languageUtils.isSupportedCode(e),
        );
      return i.length
        ? ((this.options.preload = r.concat(i)),
          this.loadResources((e) => {
            (n.resolve(), t && t(e));
          }),
          n)
        : (t && t(), Promise.resolve());
    }
    dir(e) {
      if (
        ((e ||=
          this.resolvedLanguage ||
          (this.languages?.length > 0 ? this.languages[0] : this.language)),
        !e)
      )
        return `rtl`;
      try {
        let t = new Intl.Locale(e);
        if (t && t.getTextInfo) {
          let e = t.getTextInfo();
          if (e && e.direction) return e.direction;
        }
      } catch {}
      let t =
          `ar.shu.sqr.ssh.xaa.yhd.yud.aao.abh.abv.acm.acq.acw.acx.acy.adf.ads.aeb.aec.afb.ajp.apc.apd.arb.arq.ars.ary.arz.auz.avl.ayh.ayl.ayn.ayp.bbz.pga.he.iw.ps.pbt.pbu.pst.prp.prd.ug.ur.ydd.yds.yih.ji.yi.hbo.men.xmn.fa.jpr.peo.pes.prs.dv.sam.ckb`.split(
            `.`,
          ),
        n = this.services?.languageUtils || new Xe(lt());
      return e.toLowerCase().indexOf(`-latn`) > 1
        ? `ltr`
        : t.includes(n.getLanguagePartFromCode(e)) ||
            e.toLowerCase().indexOf(`-arab`) > 1
          ? `rtl`
          : `ltr`;
    }
    static createInstance(t = {}, n) {
      let r = new e(t, n);
      return ((r.createInstance = e.createInstance), r);
    }
    cloneInstance(t = {}, n = dt) {
      let r = t.forkResourceStore;
      r && delete t.forkResourceStore;
      let i = { ...this.options, ...t, isClone: !0 },
        a = new e(i);
      if (
        ((t.debug !== void 0 || t.prefix !== void 0) &&
          (a.logger = a.logger.clone(t)),
        [`store`, `services`, `language`].forEach((e) => {
          a[e] = this[e];
        }),
        (a.services = { ...this.services }),
        (a.services.utils = {
          hasLoadedNamespace: a.hasLoadedNamespace.bind(a),
        }),
        r &&
          ((a.store = new Ue(
            Object.keys(this.store.data).reduce(
              (e, t) => (
                (e[t] = { ...this.store.data[t] }),
                (e[t] = Object.keys(e[t]).reduce(
                  (n, r) => ((n[r] = { ...e[t][r] }), n),
                  e[t],
                )),
                e
              ),
              {},
            ),
            i,
          )),
          (a.services.resourceStore = a.store)),
        t.interpolation)
      ) {
        let e = {
            ...lt().interpolation,
            ...this.options.interpolation,
            ...t.interpolation,
          },
          n = { ...i, interpolation: e };
        a.services.interpolator = new nt(n);
      }
      return (
        (a.translator = new Ye(a.services, i)),
        a.translator.on(`*`, (e, ...t) => {
          a.emit(e, ...t);
        }),
        a.init(i, n),
        (a.translator.options = i),
        (a.translator.backendConnector.services.utils = {
          hasLoadedNamespace: a.hasLoadedNamespace.bind(a),
        }),
        a
      );
    }
    toJSON() {
      return {
        options: this.options,
        store: this.store,
        language: this.language,
        languages: this.languages,
        resolvedLanguage: this.resolvedLanguage,
      };
    }
  }.createInstance();
(pt.createInstance,
  pt.dir,
  pt.init,
  pt.loadResources,
  pt.reloadResources,
  pt.use,
  pt.changeLanguage,
  pt.getFixedT,
  pt.t,
  pt.exists,
  pt.setDefaultNamespace,
  pt.hasLoadedNamespace,
  pt.loadNamespaces,
  pt.loadLanguages);
var { slice: mt, forEach: ht } = [];
function gt(e) {
  return (
    ht.call(mt.call(arguments, 1), (t) => {
      if (t) for (let n in t) e[n] === void 0 && (e[n] = t[n]);
    }),
    e
  );
}
function _t(e) {
  return typeof e == `string`
    ? [
        /<\s*script.*?>/i,
        /<\s*\/\s*script\s*>/i,
        /<\s*img.*?on\w+\s*=/i,
        /<\s*\w+\s*on\w+\s*=.*?>/i,
        /javascript\s*:/i,
        /vbscript\s*:/i,
        /expression\s*\(/i,
        /eval\s*\(/i,
        /alert\s*\(/i,
        /document\.cookie/i,
        /document\.write\s*\(/i,
        /window\.location/i,
        /innerHTML/i,
      ].some((t) => t.test(e))
    : !1;
}
var vt = /^[\u0009\u0020-\u007e\u0080-\u00ff]+$/,
  yt = function (e, t) {
    let n =
        arguments.length > 2 && arguments[2] !== void 0
          ? arguments[2]
          : { path: `/` },
      r = `${e}=${encodeURIComponent(t)}`;
    if (n.maxAge > 0) {
      let e = n.maxAge - 0;
      if (Number.isNaN(e)) throw Error(`maxAge should be a Number`);
      r += `; Max-Age=${Math.floor(e)}`;
    }
    if (n.domain) {
      if (!vt.test(n.domain)) throw TypeError(`option domain is invalid`);
      r += `; Domain=${n.domain}`;
    }
    if (n.path) {
      if (!vt.test(n.path)) throw TypeError(`option path is invalid`);
      r += `; Path=${n.path}`;
    }
    if (n.expires) {
      if (typeof n.expires.toUTCString != `function`)
        throw TypeError(`option expires is invalid`);
      r += `; Expires=${n.expires.toUTCString()}`;
    }
    if (
      (n.httpOnly && (r += `; HttpOnly`),
      n.secure && (r += `; Secure`),
      n.sameSite)
    )
      switch (
        typeof n.sameSite == `string` ? n.sameSite.toLowerCase() : n.sameSite
      ) {
        case !0:
          r += `; SameSite=Strict`;
          break;
        case `lax`:
          r += `; SameSite=Lax`;
          break;
        case `strict`:
          r += `; SameSite=Strict`;
          break;
        case `none`:
          r += `; SameSite=None`;
          break;
        default:
          throw TypeError(`option sameSite is invalid`);
      }
    return (n.partitioned && (r += `; Partitioned`), r);
  },
  bt = {
    create(e, t, n, r) {
      let i =
        arguments.length > 4 && arguments[4] !== void 0
          ? arguments[4]
          : { path: `/`, sameSite: `strict` };
      (n &&
        ((i.expires = new Date()),
        i.expires.setTime(i.expires.getTime() + n * 60 * 1e3)),
        r && (i.domain = r),
        (document.cookie = yt(e, t, i)));
    },
    read(e) {
      let t = `${e}=`,
        n = document.cookie.split(`;`);
      for (let e = 0; e < n.length; e++) {
        let r = n[e];
        for (; r.charAt(0) === ` `; ) r = r.substring(1, r.length);
        if (r.indexOf(t) === 0) return r.substring(t.length, r.length);
      }
      return null;
    },
    remove(e, t) {
      this.create(e, ``, -1, t);
    },
  },
  xt = {
    name: `cookie`,
    lookup(e) {
      let { lookupCookie: t } = e;
      if (t && typeof document < `u`) return bt.read(t) || void 0;
    },
    cacheUserLanguage(e, t) {
      let {
        lookupCookie: n,
        cookieMinutes: r,
        cookieDomain: i,
        cookieOptions: a,
      } = t;
      n && typeof document < `u` && bt.create(n, e, r, i, a);
    },
  },
  St = {
    name: `querystring`,
    lookup(e) {
      let { lookupQuerystring: t } = e,
        n;
      if (typeof window < `u`) {
        let { search: e } = window.location;
        !window.location.search &&
          window.location.hash?.indexOf(`?`) > -1 &&
          (e = window.location.hash.substring(
            window.location.hash.indexOf(`?`),
          ));
        let r = e.substring(1).split(`&`);
        for (let e = 0; e < r.length; e++) {
          let i = r[e].indexOf(`=`);
          i > 0 && r[e].substring(0, i) === t && (n = r[e].substring(i + 1));
        }
      }
      return n;
    },
  },
  Ct = {
    name: `hash`,
    lookup(e) {
      let { lookupHash: t, lookupFromHashIndex: n } = e,
        r;
      if (typeof window < `u`) {
        let { hash: e } = window.location;
        if (e && e.length > 2) {
          let i = e.substring(1);
          if (t) {
            let e = i.split(`&`);
            for (let n = 0; n < e.length; n++) {
              let i = e[n].indexOf(`=`);
              i > 0 &&
                e[n].substring(0, i) === t &&
                (r = e[n].substring(i + 1));
            }
          }
          if (r) return r;
          if (!r && n > -1) {
            let t = e.match(/\/([a-zA-Z-]*)/g);
            return Array.isArray(t)
              ? t[typeof n == `number` ? n : 0]?.replace(`/`, ``)
              : void 0;
          }
        }
      }
      return r;
    },
  },
  wt = null,
  Tt = () => {
    if (wt !== null) return wt;
    try {
      if (((wt = typeof window < `u` && window.localStorage !== null), !wt))
        return !1;
      let e = `i18next.translate.boo`;
      (window.localStorage.setItem(e, `foo`),
        window.localStorage.removeItem(e));
    } catch {
      wt = !1;
    }
    return wt;
  },
  Et = {
    name: `localStorage`,
    lookup(e) {
      let { lookupLocalStorage: t } = e;
      if (t && Tt()) return window.localStorage.getItem(t) || void 0;
    },
    cacheUserLanguage(e, t) {
      let { lookupLocalStorage: n } = t;
      n && Tt() && window.localStorage.setItem(n, e);
    },
  },
  Dt = null,
  Ot = () => {
    if (Dt !== null) return Dt;
    try {
      if (((Dt = typeof window < `u` && window.sessionStorage !== null), !Dt))
        return !1;
      let e = `i18next.translate.boo`;
      (window.sessionStorage.setItem(e, `foo`),
        window.sessionStorage.removeItem(e));
    } catch {
      Dt = !1;
    }
    return Dt;
  },
  kt = {
    name: `sessionStorage`,
    lookup(e) {
      let { lookupSessionStorage: t } = e;
      if (t && Ot()) return window.sessionStorage.getItem(t) || void 0;
    },
    cacheUserLanguage(e, t) {
      let { lookupSessionStorage: n } = t;
      n && Ot() && window.sessionStorage.setItem(n, e);
    },
  },
  At = {
    name: `navigator`,
    lookup(e) {
      let t = [];
      if (typeof navigator < `u`) {
        let { languages: e, userLanguage: n, language: r } = navigator;
        if (e) for (let n = 0; n < e.length; n++) t.push(e[n]);
        (n && t.push(n), r && t.push(r));
      }
      return t.length > 0 ? t : void 0;
    },
  },
  jt = {
    name: `htmlTag`,
    lookup(e) {
      let { htmlTag: t } = e,
        n,
        r = t || (typeof document < `u` ? document.documentElement : null);
      return (
        r &&
          typeof r.getAttribute == `function` &&
          (n = r.getAttribute(`lang`)),
        n
      );
    },
  },
  Mt = {
    name: `path`,
    lookup(e) {
      let { lookupFromPathIndex: t } = e;
      if (typeof window > `u`) return;
      let n = window.location.pathname.match(/\/([a-zA-Z-]*)/g);
      if (Array.isArray(n))
        return n[typeof t == `number` ? t : 0]?.replace(`/`, ``);
    },
  },
  Nt = {
    name: `subdomain`,
    lookup(e) {
      let { lookupFromSubdomainIndex: t } = e,
        n = typeof t == `number` ? t + 1 : 1,
        r =
          typeof window < `u` &&
          window.location?.hostname?.match(
            /^(\w{2,5})\.(([a-z0-9-]{1,63}\.[a-z]{2,6})|localhost)/i,
          );
      if (r) return r[n];
    },
  },
  Pt = !1;
try {
  (document.cookie, (Pt = !0));
} catch {}
var Ft = [
  `querystring`,
  `cookie`,
  `localStorage`,
  `sessionStorage`,
  `navigator`,
  `htmlTag`,
];
Pt || Ft.splice(1, 1);
var It = () => ({
    order: Ft,
    lookupQuerystring: `lng`,
    lookupCookie: `i18next`,
    lookupLocalStorage: `i18nextLng`,
    lookupSessionStorage: `i18nextLng`,
    caches: [`localStorage`],
    excludeCacheFor: [`cimode`],
    convertDetectedLanguage: (e) => e,
  }),
  Lt = class {
    constructor(e) {
      let t =
        arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
      ((this.type = `languageDetector`),
        (this.detectors = {}),
        this.init(e, t));
    }
    init() {
      let e =
          arguments.length > 0 && arguments[0] !== void 0
            ? arguments[0]
            : { languageUtils: {} },
        t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {},
        n = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : {};
      ((this.services = e),
        (this.options = gt(t, this.options || {}, It())),
        typeof this.options.convertDetectedLanguage == `string` &&
          this.options.convertDetectedLanguage.indexOf(`15897`) > -1 &&
          (this.options.convertDetectedLanguage = (e) => e.replace(`-`, `_`)),
        this.options.lookupFromUrlIndex &&
          (this.options.lookupFromPathIndex = this.options.lookupFromUrlIndex),
        (this.i18nOptions = n),
        this.addDetector(xt),
        this.addDetector(St),
        this.addDetector(Et),
        this.addDetector(kt),
        this.addDetector(At),
        this.addDetector(jt),
        this.addDetector(Mt),
        this.addDetector(Nt),
        this.addDetector(Ct));
    }
    addDetector(e) {
      return ((this.detectors[e.name] = e), this);
    }
    detect() {
      let e =
          arguments.length > 0 && arguments[0] !== void 0
            ? arguments[0]
            : this.options.order,
        t = [];
      return (
        e.forEach((e) => {
          if (this.detectors[e]) {
            let n = this.detectors[e].lookup(this.options);
            (n && typeof n == `string` && (n = [n]), n && (t = t.concat(n)));
          }
        }),
        (t = t
          .filter((e) => e != null && !_t(e))
          .map((e) => this.options.convertDetectedLanguage(e))),
        this.services &&
        this.services.languageUtils &&
        this.services.languageUtils.getBestMatchFromCodes
          ? t
          : t.length > 0
            ? t[0]
            : null
      );
    }
    cacheUserLanguage(e) {
      let t =
        arguments.length > 1 && arguments[1] !== void 0
          ? arguments[1]
          : this.options.caches;
      t &&
        ((this.options.excludeCacheFor &&
          this.options.excludeCacheFor.indexOf(e) > -1) ||
          t.forEach((t) => {
            this.detectors[t] &&
              this.detectors[t].cacheUserLanguage(e, this.options);
          }));
    }
  };
((Lt.type = `languageDetector`),
  pt
    .use(Lt)
    .use(ie)
    .init({
      fallbackLng: `en`,
      supportedLngs: [`en`, `ar`],
      nonExplicitSupportedLngs: !0,
      debug: !1,
      keySeparator: !1,
      nsSeparator: !1,
      resources: {
        en: {
          translation: {
            "{{count}} active sessions_one": `{{count}} active session`,
            "{{count}} active sessions_other": `{{count}} active sessions`,
            "{{count}} recommended actions_one": `{{count}} recommended action`,
            "{{count}} recommended actions_other": `{{count}} recommended actions`,
            "{{count}} redirect URIs_one": `{{count}} redirect URI`,
            "{{count}} redirect URIs_other": `{{count}} redirect URIs`,
            "{{count}} tenants_one": `{{count}} tenant`,
            "{{count}} tenants_other": `{{count}} tenants`,
            "Last used {{time}} · {{count}} requests_one": `Last used {{time}} · {{count}} request`,
            "Last used {{time}} · {{count}} requests_other": `Last used {{time}} · {{count}} requests`,
          },
        },
        ar: {
          translation: {
            " - requirement met": ` - تم استيفاء الشرط`,
            " - requirement not met": ` - لم يتم استيفاء الشرط`,
            "2-step verification": `التحقق بخطوتين`,
            "2-step verification is on. Keep these codes somewhere safe — each one works once if you lose your device.": `تم تفعيل التحقق بخطوتين. احفظ هذه الرموز في مكان آمن — يعمل كل رمز مرة واحدة إذا فقدت جهازك.`,
            "2-step verification turned off": `تم إيقاف التحقق بخطوتين`,
            "2-step verification turned on": `تم تفعيل التحقق بخطوتين`,
            "A new version is available": `يتوفر إصدار جديد`,
            "A photo helps people recognize you.": `تساعد الصورة الآخرين على التعرّف عليك.`,
            "Accepting your invitation…": `جارٍ قبول دعوتك…`,
            "Access was not granted": `لم يتم منح الوصول`,
            "Access your data while you're not using the app": `الوصول إلى بياناتك أثناء عدم استخدامك للتطبيق`,
            "Access “{{scope}}”": `الوصول إلى «{{scope}}»`,
            Account: `الحساب`,
            "Account menu": `قائمة الحساب`,
            "Account sections": `أقسام الحساب`,
            "Active now": `نشط الآن`,
            "Add a passkey for faster, phishing-resistant sign in": `أضف مفتاح مرور لتسجيل دخول أسرع ومقاوم للتصيّد`,
            "Add an extra layer of security to your account.": `أضف طبقة حماية إضافية إلى حسابك.`,
            "Add another account": `إضافة حساب آخر`,
            "Add at least one redirect URI": `أضف رابط إعادة توجيه واحدًا على الأقل`,
            "Add passkey": `إضافة مفتاح مرور`,
            "Add redirect URI": `إضافة رابط إعادة توجيه`,
            "Add tenant": `إضافة مستأجر`,
            "Added {{date}}": `أُضيف في {{date}}`,
            Allow: `سماح`,
            "Allowed scopes": `النطاقات المسموح بها`,
            "Already have an account?": `لديك حساب بالفعل؟`,
            and: `و`,
            "Any server using this key will immediately lose access. This can't be undone.": `سيفقد أي خادم يستخدم هذا المفتاح الوصول فورًا. لا يمكن التراجع عن ذلك.`,
            "API key created": `تم إنشاء مفتاح API`,
            "API key deleted": `تم حذف مفتاح API`,
            "API key updated": `تم تحديث مفتاح API`,
            "API keys": `مفاتيح API`,
            "API keys let your servers call the API on your behalf.": `تتيح مفاتيح API لخوادمك استدعاء الواجهة البرمجية نيابةً عنك.`,
            "App created": `تم إنشاء التطبيق`,
            "App deleted": `تم حذف التطبيق`,
            "App name": `اسم التطبيق`,
            "App name is required!": `اسم التطبيق مطلوب!`,
            "App type": `نوع التطبيق`,
            "App updated": `تم تحديث التطبيق`,
            "Applications that can sign users in with this account system.": `التطبيقات التي يمكنها تسجيل دخول المستخدمين عبر نظام الحسابات هذا.`,
            "Apps using this client will immediately stop being able to sign users in. This can't be undone.": `ستتوقف التطبيقات التي تستخدم هذا العميل فورًا عن تسجيل دخول المستخدمين. لا يمكن التراجع عن ذلك.`,
            "Are you sure?": `هل أنت متأكد؟`,
            "At least 1 lowercase letter": `حرف صغير واحد على الأقل`,
            "At least 1 number": `رقم واحد على الأقل`,
            "At least 1 uppercase letter": `حرف كبير واحد على الأقل`,
            "At least 8 characters": `8 أحرف على الأقل`,
            "Authenticator app": `تطبيق المصادقة`,
            "Authorize access": `تفويض الوصول`,
            "Back to app": `العودة إلى التطبيق`,
            "Back to sign in": `العودة إلى تسجيل الدخول`,
            "Backup code": `رمز احتياطي`,
            "Backup code is required!": `الرمز الاحتياطي مطلوب!`,
            "Backup codes": `الرموز الاحتياطية`,
            Birthday: `تاريخ الميلاد`,
            "Birthday can't be in the future": `لا يمكن أن يكون تاريخ الميلاد في المستقبل`,
            "Build on top of your account with OAuth apps and API keys.": `ابنِ على حسابك باستخدام تطبيقات OAuth ومفاتيح API.`,
            "By continuing, you agree to the": `بالمتابعة، فإنك توافق على`,
            "Call the API from your servers.": `استدعِ الواجهة البرمجية من خوادمك.`,
            "Can't scan? Enter this key manually:": `لا يمكنك المسح؟ أدخل هذا المفتاح يدويًا:`,
            Cancel: `إلغاء`,
            Change: `تغيير`,
            "Change language": `تغيير اللغة`,
            "Change password": `تغيير كلمة المرور`,
            "Change theme": `تغيير المظهر`,
            "Check your inbox": `تحقّق من بريدك الوارد`,
            "Check your inbox for the verification link.": `تحقّق من بريدك الوارد للعثور على رابط التحقق.`,
            "Choose a role": `اختر دورًا`,
            "Choose a strong password you don't use anywhere else.": `اختر كلمة مرور قوية لا تستخدمها في أي مكان آخر.`,
            "Clipboard access was denied": `تم رفض الوصول إلى الحافظة`,
            "Codes from your authenticator app are required to sign in.": `رموز تطبيق المصادقة مطلوبة لتسجيل الدخول.`,
            Confidential: `سرّي`,
            Confirm: `تأكيد`,
            "Confirm new password": `تأكيد كلمة المرور الجديدة`,
            "Confirm password": `تأكيد كلمة المرور`,
            "Confirm your password to continue.": `أكّد كلمة المرور للمتابعة.`,
            Connect: `ربط`,
            Connected: `مرتبط`,
            "Connected accounts": `الحسابات المرتبطة`,
            "Connected {{date}}": `رُبط في {{date}}`,
            "Contact info": `معلومات الاتصال`,
            "Contact support": `تواصل مع الدعم`,
            Continue: `متابعة`,
            "Continue to sign in": `متابعة إلى تسجيل الدخول`,
            "Continue with {{provider}}": `المتابعة باستخدام {{provider}}`,
            Copied: `تم النسخ`,
            Copy: `نسخ`,
            "Copy invite link": `نسخ رابط الدعوة`,
            "Copy this secret now and store it in a password manager or secret store.": `انسخ هذا السر الآن واحفظه في مدير كلمات مرور أو مخزن أسرار.`,
            "Copy {{value}}": `نسخ {{value}}`,
            "Create a key to authenticate requests from your backend.": `أنشئ مفتاحًا لمصادقة الطلبات من خادمك.`,
            "Create account": `إنشاء حساب`,
            "Create an app to add “Sign in with your account” to your own products.": `أنشئ تطبيقًا لإضافة «تسجيل الدخول بحسابك» إلى منتجاتك.`,
            "Create app": `إنشاء تطبيق`,
            "Create key": `إنشاء مفتاح`,
            "Create one": `أنشئ حسابًا`,
            "Create your account": `أنشئ حسابك`,
            "Current password": `كلمة المرور الحالية`,
            Dark: `داكن`,
            Delete: `حذف`,
            "Delete app": `حذف التطبيق`,
            "Delete key": `حذف المفتاح`,
            "Delete {{name}}?": `حذف {{name}}؟`,
            Description: `الوصف`,
            "Developer tools": `أدوات المطوّرين`,
            Developers: `المطوّرون`,
            Disabled: `معطّل`,
            Disconnect: `فصل`,
            "Disconnect {{provider}}?": `فصل {{provider}}؟`,
            "Don't have an account?": `ليس لديك حساب؟`,
            Done: `تم`,
            Download: `تنزيل`,
            "e.g. My Application": `مثال: تطبيقي`,
            "e.g. Production server": `مثال: خادم الإنتاج`,
            "Each backup code can only be used once.": `يمكن استخدام كل رمز احتياطي مرة واحدة فقط.`,
            Edit: `تعديل`,
            "Edit API key": `تعديل مفتاح API`,
            "Edit OAuth app": `تعديل تطبيق OAuth`,
            "Edit profile": `تعديل الملف الشخصي`,
            Email: `البريد الإلكتروني`,
            "Email & password": `البريد الإلكتروني وكلمة المرور`,
            "Email me a sign-in link": `أرسل لي رابط تسجيل الدخول`,
            "Email me a sign-in link instead": `أرسل لي رابط تسجيل الدخول بدلًا من ذلك`,
            "Email sent": `تم إرسال البريد`,
            "Enter a full URL, e.g. https://myapp.com/callback": `أدخل رابطًا كاملًا، مثل https://myapp.com/callback`,
            "Enter a password": `أدخل كلمة مرور`,
            "Enter the 6-digit code from your authenticator app to finish signing in.": `أدخل الرمز المكوّن من 6 أرقام من تطبيق المصادقة لإكمال تسجيل الدخول.`,
            "Enter the email you use to sign in and we'll send you a reset link.": `أدخل البريد الإلكتروني الذي تستخدمه لتسجيل الدخول وسنرسل لك رابط إعادة التعيين.`,
            "Every device except this one will need to sign in again.": `ستحتاج كل الأجهزة باستثناء هذا الجهاز إلى تسجيل الدخول مجددًا.`,
            "Everyone with access to this workspace.": `كل من لديه وصول إلى مساحة العمل هذه.`,
            Expiration: `تاريخ الانتهاء`,
            "Expiration date must be in the future": `يجب أن يكون تاريخ الانتهاء في المستقبل`,
            Expired: `منتهي الصلاحية`,
            "Expires {{date}}": `ينتهي في {{date}}`,
            "Failed to process consent": `تعذّرت معالجة الموافقة`,
            Fair: `متوسطة`,
            female: `أنثى`,
            "First name": `الاسم الأول`,
            "First name is required!": `الاسم الأول مطلوب!`,
            "For your security, you won't be able to see it again.": `حفاظًا على أمانك، لن تتمكن من رؤيته مرة أخرى.`,
            "Forgot password?": `نسيت كلمة المرور؟`,
            "Forgot your password?": `هل نسيت كلمة المرور؟`,
            "Full access to your account": `وصول كامل إلى حسابك`,
            "Full name": `الاسم الكامل`,
            Gender: `الجنس`,
            Generate: `إنشاء`,
            "Generate a new client secret?": `إنشاء سر عميل جديد؟`,
            "Generate new backup codes": `إنشاء رموز احتياطية جديدة`,
            "Generate new secret": `إنشاء سر جديد`,
            "Get new codes": `الحصول على رموز جديدة`,
            "Get started with {{name}} in less than a minute.": `ابدأ مع {{name}} في أقل من دقيقة.`,
            "Go to your account": `الانتقال إلى حسابك`,
            "Grant different scopes per tenant instead of globally.": `امنح نطاقات مختلفة لكل مستأجر بدلًا من نطاقات عامة.`,
            "Grant {{n}}": `منح {{n}}`,
            "Hide password": `إخفاء كلمة المرور`,
            "I've saved it": `لقد حفظته`,
            "I've saved my codes": `لقد حفظت رموزي`,
            "If an account exists for {{email}}, you'll get an email with a link to reset your password.": `إذا كان هناك حساب مرتبط بـ {{email}}، فستصلك رسالة تحتوي على رابط لإعادة تعيين كلمة المرور.`,
            "Images must be smaller than 5 MB": `يجب أن يكون حجم الصورة أقل من 5 ميغابايت`,
            "Invalid authorization request": `طلب تفويض غير صالح`,
            "Invalid backup code": `رمز احتياطي غير صالح`,
            "Invalid code": `رمز غير صالح`,
            "Invalid email or password": `البريد الإلكتروني أو كلمة المرور غير صحيحة`,
            "Invitation revoked": `تم إلغاء الدعوة`,
            "Invitation sent to {{email}}": `تم إرسال الدعوة إلى {{email}}`,
            Invite: `دعوة`,
            "Invite a teammate": `دعوة زميل`,
            "Invite people to this workspace and manage their roles.": `ادعُ أشخاصًا إلى مساحة العمل هذه وأدِر أدوارهم.`,
            "Invite your first teammate above.": `ادعُ أول زميل لك من الأعلى.`,
            "Join workspace": `الانضمام إلى مساحة العمل`,
            "Joined {{date}}": `انضم في {{date}}`,
            "Keep me signed in": `إبقائي مسجّلًا الدخول`,
            "Know who you are when you sign in": `معرفة هويتك عند تسجيل الدخول`,
            "Last active {{time}}": `آخر نشاط {{time}}`,
            "Last changed {{date}}": `آخر تغيير {{date}}`,
            "Last name": `اسم العائلة`,
            "Last used {{time}} · {{count}} requests_few": `آخر استخدام {{time}} · {{count}} طلبات`,
            "Last used {{time}} · {{count}} requests_many": `آخر استخدام {{time}} · {{count}} طلبًا`,
            "Last used {{time}} · {{count}} requests_one": `آخر استخدام {{time}} · طلب واحد`,
            "Last used {{time}} · {{count}} requests_other": `آخر استخدام {{time}} · {{count}} طلب`,
            "Last used {{time}} · {{count}} requests_two": `آخر استخدام {{time}} · طلبان`,
            "Last used {{time}} · {{count}} requests_zero": `آخر استخدام {{time}} · لا طلبات`,
            "Leave empty for a key that never expires.": `اتركه فارغًا لمفتاح لا تنتهي صلاحيته.`,
            "Let your applications sign users in with their {{name}} account.": `اسمح لتطبيقاتك بتسجيل دخول المستخدمين بحساب {{name}} الخاص بهم.`,
            "Let your own applications sign users in.": `اسمح لتطبيقاتك بتسجيل دخول المستخدمين.`,
            Light: `فاتح`,
            "Load more": `تحميل المزيد`,
            "Loading…": `جارٍ التحميل…`,
            Logo: `الشعار`,
            male: `ذكر`,
            "Manage your info, privacy and security to make {{name}} work better for you.": `أدِر معلوماتك وخصوصيتك وأمانك ليعمل {{name}} بشكل أفضل لك.`,
            "Member removed": `تمت إزالة العضو`,
            "Member since {{date}}": `عضو منذ {{date}}`,
            Members: `الأعضاء`,
            Name: `الاسم`,
            "Name is required!": `الاسم مطلوب!`,
            "Name, photo and birthday": `الاسم والصورة وتاريخ الميلاد`,
            "Never used": `لم يُستخدم قط`,
            "New accounts can't be created for {{name}} right now. Ask an administrator for an invitation.": `لا يمكن إنشاء حسابات جديدة في {{name}} حاليًا. اطلب دعوة من أحد المسؤولين.`,
            "New API key": `مفتاح API جديد`,
            "New app": `تطبيق جديد`,
            "New client secret": `سر عميل جديد`,
            "New key": `مفتاح جديد`,
            "New OAuth app": `تطبيق OAuth جديد`,
            "New password": `كلمة المرور الجديدة`,
            "No active sessions": `لا توجد جلسات نشطة`,
            "No API keys yet": `لا توجد مفاتيح API بعد`,
            "No expiry": `بدون انتهاء`,
            "No matching scopes.": `لا توجد نطاقات مطابقة.`,
            "No members yet": `لا يوجد أعضاء بعد`,
            "No OAuth apps yet": `لا توجد تطبيقات OAuth بعد`,
            "No passkeys yet": `لا توجد مفاتيح مرور بعد`,
            "No password set": `لم يتم تعيين كلمة مرور`,
            "No scopes": `بدون نطاقات`,
            "No sign-in methods are enabled for this app.": `لا توجد طرق تسجيل دخول مفعّلة لهذا التطبيق.`,
            "No tenants found.": `لم يتم العثور على مستأجرين.`,
            "Not connected": `غير مرتبط`,
            "Not set": `غير محدد`,
            "OAuth apps": `تطبيقات OAuth`,
            Off: `متوقف`,
            On: `مفعّل`,
            "One account for everything {{name}}.": `حساب واحد لكل ما في {{name}}.`,
            "One-time codes to sign in if you lose access to your authenticator.": `رموز لمرة واحدة لتسجيل الدخول إذا فقدت الوصول إلى تطبيق المصادقة.`,
            Options: `خيارات`,
            or: `أو`,
            other: `آخر`,
            Overview: `نظرة عامة`,
            Owner: `المالك`,
            "Page not found": `الصفحة غير موجودة`,
            "Passkey added": `تمت إضافة مفتاح المرور`,
            "Passkey removed": `تمت إزالة مفتاح المرور`,
            Passkeys: `مفاتيح المرور`,
            "Passkeys are a safer, faster alternative to passwords and can't be phished.": `مفاتيح المرور بديل أكثر أمانًا وأسرع من كلمات المرور ولا يمكن تصيّدها.`,
            Password: `كلمة المرور`,
            "Password changed": `تم تغيير كلمة المرور`,
            "Password doesn't meet all the requirements": `كلمة المرور لا تستوفي جميع الشروط`,
            "Password is required!": `كلمة المرور مطلوبة!`,
            "Password requirements": `شروط كلمة المرور`,
            "Password reset links can only be used once and expire after a while. Request a new one to continue.": `يمكن استخدام روابط إعادة تعيين كلمة المرور مرة واحدة فقط وتنتهي صلاحيتها بعد فترة. اطلب رابطًا جديدًا للمتابعة.`,
            "Password strength": `قوة كلمة المرور`,
            "Password updated": `تم تحديث كلمة المرور`,
            "Password, passkeys and 2-step verification": `كلمة المرور ومفاتيح المرور والتحقق بخطوتين`,
            "Passwords don't match": `كلمتا المرور غير متطابقتين`,
            Paste: `لصق`,
            "Pending invitations": `الدعوات المعلّقة`,
            People: `الأشخاص`,
            "People who haven't accepted their invite yet.": `الأشخاص الذين لم يقبلوا دعوتهم بعد.`,
            "Permission defined by {{name}}": `صلاحية محددة من {{name}}`,
            "Personal info": `المعلومات الشخصية`,
            "Pick a name that helps you recognize the device.": `اختر اسمًا يساعدك على التعرّف على الجهاز.`,
            "Please choose an image file": `يرجى اختيار ملف صورة`,
            "Please provide a valid email!": `يرجى إدخال بريد إلكتروني صالح!`,
            "Powered by": `مدعوم من`,
            Privacy: `الخصوصية`,
            "Privacy Policy": `سياسة الخصوصية`,
            Profile: `الملف الشخصي`,
            "Profile photo": `الصورة الشخصية`,
            "Profile photo removed": `تمت إزالة الصورة الشخصية`,
            "Profile photo updated": `تم تحديث الصورة الشخصية`,
            "Profile updated": `تم تحديث الملف الشخصي`,
            Public: `عام`,
            "Quick links": `روابط سريعة`,
            "Read and change all of your account's resources": `قراءة جميع موارد حسابك وتعديلها`,
            Recommended: `موصى به`,
            "Redirect URIs": `روابط إعادة التوجيه`,
            "Redirecting…": `جارٍ إعادة التوجيه…`,
            Regenerate: `إعادة الإنشاء`,
            "Regenerate {{name}}?": `إعادة إنشاء {{name}}؟`,
            "Reload page": `إعادة تحميل الصفحة`,
            "Reload the page to get the latest version.": `أعد تحميل الصفحة للحصول على أحدث إصدار.`,
            Remove: `إزالة`,
            "Remove grant": `إزالة المنح`,
            "Remove member": `إزالة العضو`,
            "Remove passkey?": `إزالة مفتاح المرور؟`,
            "Remove {{email}}?": `إزالة {{email}}؟`,
            "Remove {{value}}": `إزالة {{value}}`,
            Rename: `إعادة تسمية`,
            "Rename passkey": `إعادة تسمية مفتاح المرور`,
            "Request a new link": `طلب رابط جديد`,
            "Require a code from your authenticator app when signing in with a password.": `اطلب رمزًا من تطبيق المصادقة عند تسجيل الدخول بكلمة المرور.`,
            "Resend email": `إعادة إرسال البريد`,
            "Resend verification email": `إعادة إرسال بريد التحقق`,
            "Reset password": `إعادة تعيين كلمة المرور`,
            Revoke: `إلغاء`,
            "Revoke invitation?": `إلغاء الدعوة؟`,
            Role: `الدور`,
            "Role updated": `تم تحديث الدور`,
            Save: `حفظ`,
            "Save changes": `حفظ التغييرات`,
            "Save your backup codes": `احفظ رموزك الاحتياطية`,
            "Scan the QR code with an app like Google Authenticator, 1Password or Authy, then enter the 6-digit code.": `امسح رمز QR بتطبيق مثل Google Authenticator أو 1Password أو Authy، ثم أدخل الرمز المكوّن من 6 أرقام.`,
            Scopes: `النطاقات`,
            "Secret keys for calling the API from your servers.": `مفاتيح سرية لاستدعاء الواجهة البرمجية من خوادمك.`,
            "Secure sign-in": `تسجيل دخول آمن`,
            Security: `الأمان`,
            "Security checkup": `فحص الأمان`,
            Select: `اختر`,
            "Select a tenant": `اختر مستأجرًا`,
            "Select at least one scope": `اختر نطاقًا واحدًا على الأقل`,
            "Select scopes": `اختر النطاقات`,
            "Select scopes…": `اختر النطاقات…`,
            "Select tenant…": `اختر المستأجر…`,
            "Send link": `إرسال الرابط`,
            "Send reset link": `إرسال رابط إعادة التعيين`,
            "Sent {{time}}": `أُرسلت {{time}}`,
            "Server-side apps that can store a client secret securely.": `تطبيقات الخادم التي يمكنها تخزين سر العميل بأمان.`,
            "Set a new password": `تعيين كلمة مرور جديدة`,
            "Set a password first to turn on 2-step verification.": `عيّن كلمة مرور أولًا لتفعيل التحقق بخطوتين.`,
            "Set password": `تعيين كلمة المرور`,
            "Set up your authenticator": `إعداد تطبيق المصادقة`,
            "Settings and recommendations to help keep your account secure.": `إعدادات وتوصيات للمساعدة في الحفاظ على أمان حسابك.`,
            "Show password": `إظهار كلمة المرور`,
            "Shown to users on the consent screen": `يظهر للمستخدمين في شاشة الموافقة`,
            "Sign in": `تسجيل الدخول`,
            "Sign in failed": `فشل تسجيل الدخول`,
            "Sign in faster with the accounts you already use.": `سجّل الدخول بشكل أسرع باستخدام الحسابات التي تستخدمها بالفعل.`,
            "Sign in to continue to {{name}}": `سجّل الدخول للمتابعة إلى {{name}}`,
            "Sign in with a passkey": `تسجيل الدخول بمفتاح مرور`,
            "Sign in with password instead": `تسجيل الدخول بكلمة المرور بدلًا من ذلك`,
            "Sign in with your fingerprint, face or screen lock instead of a password.": `سجّل الدخول ببصمتك أو وجهك أو قفل الشاشة بدلًا من كلمة المرور.`,
            "Sign out": `تسجيل الخروج`,
            "Sign out everywhere else": `تسجيل الخروج من كل مكان آخر`,
            "Sign out of all accounts": `تسجيل الخروج من جميع الحسابات`,
            "Sign out of all other devices": `تسجيل الخروج من جميع الأجهزة الأخرى`,
            "Sign out of all other devices?": `تسجيل الخروج من جميع الأجهزة الأخرى؟`,
            "Sign out of this device?": `تسجيل الخروج من هذا الجهاز؟`,
            "Sign up": `إنشاء حساب`,
            "Sign up is disabled": `إنشاء الحسابات معطّل`,
            "Sign up with {{provider}}": `إنشاء حساب باستخدام {{provider}}`,
            "Signed in to {{name}}": `تم تسجيل الدخول إلى {{name}}`,
            "Signed out of other devices": `تم تسجيل الخروج من الأجهزة الأخرى`,
            "Signing out…": `جارٍ تسجيل الخروج…`,
            "Signing you out…": `جارٍ تسجيل خروجك…`,
            "Single sign-on": `تسجيل دخول موحّد`,
            "Single-page or mobile apps that can't keep a secret.": `تطبيقات الصفحة الواحدة أو تطبيقات الجوال التي لا يمكنها الاحتفاظ بسر.`,
            "Some of this info may be visible to other people.": `قد تكون بعض هذه المعلومات مرئية للآخرين.`,
            "Something went wrong": `حدث خطأ ما`,
            "Stay connected": `البقاء متصلًا`,
            "Store them somewhere safe. Each code works once.": `احفظها في مكان آمن. يعمل كل رمز مرة واحدة.`,
            Strong: `قوية`,
            Switch: `تبديل`,
            "Switch account": `تبديل الحساب`,
            System: `النظام`,
            "Taking you back to the app…": `جارٍ إعادتك إلى التطبيق…`,
            Tenant: `المستأجر`,
            "Tenant-specific scopes": `نطاقات خاصة بكل مستأجر`,
            Terms: `الشروط`,
            "Terms of Service": `شروط الخدمة`,
            "The app type can't be changed after creation.": `لا يمكن تغيير نوع التطبيق بعد إنشائه.`,
            "The current secret stops working immediately.": `سيتوقف السر الحالي عن العمل فورًا.`,
            "The current secret stops working immediately. Update your server with the new one right away.": `سيتوقف السر الحالي عن العمل فورًا. حدّث خادمك بالسر الجديد على الفور.`,
            "The invite link sent to {{email}} will stop working.": `سيتوقف رابط الدعوة المرسل إلى {{email}} عن العمل.`,
            "The page you're looking for doesn't exist or has moved.": `الصفحة التي تبحث عنها غير موجودة أو تم نقلها.`,
            "The primary email address of your account": `البريد الإلكتروني الأساسي لحسابك`,
            "They'll get an email with a link to join.": `سيصلهم بريد إلكتروني يحتوي على رابط للانضمام.`,
            "They'll lose access to this workspace immediately.": `سيفقدون الوصول إلى مساحة العمل هذه فورًا.`,
            "This device": `هذا الجهاز`,
            "This invitation may have expired, been revoked, or been sent to a different email address.": `قد تكون هذه الدعوة منتهية الصلاحية أو أُلغيت أو أُرسلت إلى بريد إلكتروني مختلف.`,
            "This link is invalid or has expired": `هذا الرابط غير صالح أو منتهي الصلاحية`,
            "This link is missing required information. Go back to the application and try signing in again.": `يفتقد هذا الرابط إلى معلومات مطلوبة. عُد إلى التطبيق وحاول تسجيل الدخول مجددًا.`,
            "This will allow {{name}} to:": `سيسمح هذا لـ {{name}} بما يلي:`,
            "Trust this device for 30 days": `الوثوق بهذا الجهاز لمدة 30 يومًا`,
            "Try again": `حاول مجددًا`,
            "Turn off": `إيقاف`,
            "Turn off 2-step verification?": `إيقاف التحقق بخطوتين؟`,
            "Turn on": `تفعيل`,
            "Turn on 2-step verification": `تفعيل التحقق بخطوتين`,
            "Two-step verification": `التحقق بخطوتين`,
            "Type {{text}} to confirm": `اكتب {{text}} للتأكيد`,
            Unknown: `غير معروف`,
            "Unknown application": `تطبيق غير معروف`,
            "Unknown device": `جهاز غير معروف`,
            "Unnamed passkey": `مفتاح مرور بدون اسم`,
            Unverified: `غير موثّق`,
            "Update password": `تحديث كلمة المرور`,
            "Update your personal details.": `حدّث بياناتك الشخصية.`,
            Upload: `رفع`,
            "Upload failed. Please try again.": `فشل الرفع. يرجى المحاولة مجددًا.`,
            "Upload image": `رفع صورة`,
            "Use a backup code": `استخدام رمز احتياطي`,
            "Use a different email": `استخدام بريد إلكتروني مختلف`,
            "Use a strong password you don't reuse elsewhere.": `استخدم كلمة مرور قوية لا تعيد استخدامها في مكان آخر.`,
            "Use authenticator app": `استخدام تطبيق المصادقة`,
            "Used to sign in and to recover your account.": `يُستخدم لتسجيل الدخول واستعادة حسابك.`,
            "Users are only sent back to these exact URLs after signing in.": `لا تتم إعادة المستخدمين إلا إلى هذه الروابط تحديدًا بعد تسجيل الدخول.`,
            "Verification code": `رمز التحقق`,
            Verified: `موثّق`,
            Verify: `تحقّق`,
            "Verify your email": `تحقّق من بريدك الإلكتروني`,
            "Verify your email address": `تحقّق من عنوان بريدك الإلكتروني`,
            "Verify your email to continue": `تحقّق من بريدك الإلكتروني للمتابعة`,
            "Verify your email to secure your account and enable recovery.": `تحقّق من بريدك الإلكتروني لتأمين حسابك وتمكين الاستعادة.`,
            "Verify your identity": `التحقق من هويتك`,
            "View your email address": `عرض بريدك الإلكتروني`,
            "View your profile": `عرض ملفك الشخصي`,
            "We can't reach the server": `لا يمكننا الوصول إلى الخادم`,
            "We couldn't add you": `لم نتمكن من إضافتك`,
            "We sent a new verification link to {{email}}.": `أرسلنا رابط تحقق جديدًا إلى {{email}}.`,
            "We sent a sign-in link to {{email}}. It expires shortly.": `أرسلنا رابط تسجيل الدخول إلى {{email}}. تنتهي صلاحيته قريبًا.`,
            "We sent a verification link to {{email}}. Open it to activate your account.": `أرسلنا رابط تحقق إلى {{email}}. افتحه لتفعيل حسابك.`,
            "We sent you a link to set your password.": `أرسلنا إليك رابطًا لتعيين كلمة المرور.`,
            Weak: `ضعيفة`,
            "Welcome back": `مرحبًا بعودتك`,
            "Welcome,": `مرحبًا،`,
            "Where you're signed in": `الأماكن التي سجّلت الدخول منها`,
            "Where you're signed in right now.": `الأماكن التي سجّلت الدخول منها حاليًا.`,
            You: `أنت`,
            "You sign in with a connected account. Add a password as a backup.": `تسجّل الدخول بحساب مرتبط. أضف كلمة مرور كخيار احتياطي.`,
            "You won't be able to sign in with {{provider}} anymore.": `لن تتمكن من تسجيل الدخول باستخدام {{provider}} بعد الآن.`,
            "You won't be able to sign in with “{{name}}” anymore. The passkey may still appear in your password manager until you delete it there.": `لن تتمكن من تسجيل الدخول باستخدام «{{name}}» بعد الآن. قد يظل مفتاح المرور ظاهرًا في مدير كلمات المرور حتى تحذفه من هناك.`,
            "You'll be redirected to {{host}}. Only allow access if you trust this app.": `ستتم إعادة توجيهك إلى {{host}}. لا تسمح بالوصول إلا إذا كنت تثق بهذا التطبيق.`,
            "You'll use your new password the next time you sign in.": `ستستخدم كلمة المرور الجديدة في المرة القادمة التي تسجّل فيها الدخول.`,
            "You're in!": `أنت معنا!`,
            "You've joined the workspace on {{name}}.": `لقد انضممت إلى مساحة العمل على {{name}}.`,
            "Your account is well protected.": `حسابك محمي جيدًا.`,
            "Your account will only be protected by your password.": `سيكون حسابك محميًا بكلمة المرور فقط.`,
            "Your API key": `مفتاح API الخاص بك`,
            "Your basic info, used across apps that you sign in to.": `معلوماتك الأساسية المستخدمة في التطبيقات التي تسجّل الدخول إليها.`,
            "Your client secret": `سر العميل الخاص بك`,
            "Your devices": `أجهزتك`,
            "Your name and profile picture": `اسمك وصورتك الشخصية`,
            "Your new backup codes": `رموزك الاحتياطية الجديدة`,
            "Your old backup codes will stop working.": `ستتوقف رموزك الاحتياطية القديمة عن العمل.`,
            "Your password has been changed. You can now sign in with your new password.": `تم تغيير كلمة المرور. يمكنك الآن تسجيل الدخول بكلمة المرور الجديدة.`,
            "Your primary email address": `بريدك الإلكتروني الأساسي`,
            "{{count}} active sessions_few": `{{count}} جلسات نشطة`,
            "{{count}} active sessions_many": `{{count}} جلسة نشطة`,
            "{{count}} active sessions_one": `جلسة نشطة واحدة`,
            "{{count}} active sessions_other": `{{count}} جلسة نشطة`,
            "{{count}} active sessions_two": `جلستان نشطتان`,
            "{{count}} active sessions_zero": `لا توجد جلسات نشطة`,
            "{{count}} recommended actions_few": `{{count}} إجراءات موصى بها`,
            "{{count}} recommended actions_many": `{{count}} إجراءً موصى به`,
            "{{count}} recommended actions_one": `إجراء واحد موصى به`,
            "{{count}} recommended actions_other": `{{count}} إجراء موصى به`,
            "{{count}} recommended actions_two": `إجراءان موصى بهما`,
            "{{count}} recommended actions_zero": `لا توجد إجراءات موصى بها`,
            "{{count}} redirect URIs_few": `{{count}} روابط إعادة توجيه`,
            "{{count}} redirect URIs_many": `{{count}} رابط إعادة توجيه`,
            "{{count}} redirect URIs_one": `رابط إعادة توجيه واحد`,
            "{{count}} redirect URIs_other": `{{count}} رابط إعادة توجيه`,
            "{{count}} redirect URIs_two": `رابطا إعادة توجيه`,
            "{{count}} redirect URIs_zero": `لا توجد روابط إعادة توجيه`,
            "{{count}} tenants_few": `{{count}} مستأجرين`,
            "{{count}} tenants_many": `{{count}} مستأجرًا`,
            "{{count}} tenants_one": `مستأجر واحد`,
            "{{count}} tenants_other": `{{count}} مستأجر`,
            "{{count}} tenants_two": `مستأجران`,
            "{{count}} tenants_zero": `لا يوجد مستأجرون`,
            "{{device}} will need to sign in again.": `سيحتاج {{device}} إلى تسجيل الدخول مجددًا.`,
            "{{name}} wants to access your account": `يريد {{name}} الوصول إلى حسابك`,
          },
        },
      },
      detection: {
        order: [`localStorage`, `navigator`],
        lookupLocalStorage: `i18nextLng`,
        caches: [`localStorage`],
      },
      interpolation: { escapeValue: !1 },
    }));
function Rt(e) {
  if (!e || typeof document > `u`) return;
  let t = document.head || document.getElementsByTagName(`head`)[0],
    n = document.createElement(`style`);
  ((n.type = `text/css`),
    t.appendChild(n),
    n.styleSheet
      ? (n.styleSheet.cssText = e)
      : n.appendChild(document.createTextNode(e)));
}
var zt = (e) => {
    switch (e) {
      case `success`:
        return Ht;
      case `info`:
        return Wt;
      case `warning`:
        return Ut;
      case `error`:
        return Gt;
      default:
        return null;
    }
  },
  Bt = Array(12).fill(0),
  Vt = ({ visible: e, className: t }) =>
    F.createElement(
      `div`,
      {
        className: [`sonner-loading-wrapper`, t].filter(Boolean).join(` `),
        "data-visible": e,
      },
      F.createElement(
        `div`,
        { className: `sonner-spinner` },
        Bt.map((e, t) =>
          F.createElement(`div`, {
            className: `sonner-loading-bar`,
            key: `spinner-bar-${t}`,
          }),
        ),
      ),
    ),
  Ht = F.createElement(
    `svg`,
    {
      xmlns: `http://www.w3.org/2000/svg`,
      viewBox: `0 0 20 20`,
      fill: `currentColor`,
      height: `20`,
      width: `20`,
    },
    F.createElement(`path`, {
      fillRule: `evenodd`,
      d: `M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z`,
      clipRule: `evenodd`,
    }),
  ),
  Ut = F.createElement(
    `svg`,
    {
      xmlns: `http://www.w3.org/2000/svg`,
      viewBox: `0 0 24 24`,
      fill: `currentColor`,
      height: `20`,
      width: `20`,
    },
    F.createElement(`path`, {
      fillRule: `evenodd`,
      d: `M9.401 3.003c1.155-2 4.043-2 5.197 0l7.355 12.748c1.154 2-.29 4.5-2.599 4.5H4.645c-2.309 0-3.752-2.5-2.598-4.5L9.4 3.003zM12 8.25a.75.75 0 01.75.75v3.75a.75.75 0 01-1.5 0V9a.75.75 0 01.75-.75zm0 8.25a.75.75 0 100-1.5.75.75 0 000 1.5z`,
      clipRule: `evenodd`,
    }),
  ),
  Wt = F.createElement(
    `svg`,
    {
      xmlns: `http://www.w3.org/2000/svg`,
      viewBox: `0 0 20 20`,
      fill: `currentColor`,
      height: `20`,
      width: `20`,
    },
    F.createElement(`path`, {
      fillRule: `evenodd`,
      d: `M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z`,
      clipRule: `evenodd`,
    }),
  ),
  Gt = F.createElement(
    `svg`,
    {
      xmlns: `http://www.w3.org/2000/svg`,
      viewBox: `0 0 20 20`,
      fill: `currentColor`,
      height: `20`,
      width: `20`,
    },
    F.createElement(`path`, {
      fillRule: `evenodd`,
      d: `M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z`,
      clipRule: `evenodd`,
    }),
  ),
  Kt = F.createElement(
    `svg`,
    {
      xmlns: `http://www.w3.org/2000/svg`,
      width: `12`,
      height: `12`,
      viewBox: `0 0 24 24`,
      fill: `none`,
      stroke: `currentColor`,
      strokeWidth: `1.5`,
      strokeLinecap: `round`,
      strokeLinejoin: `round`,
    },
    F.createElement(`line`, { x1: `18`, y1: `6`, x2: `6`, y2: `18` }),
    F.createElement(`line`, { x1: `6`, y1: `6`, x2: `18`, y2: `18` }),
  ),
  qt = () => {
    let [e, t] = F.useState(document.hidden);
    return (
      F.useEffect(() => {
        let e = () => {
          t(document.hidden);
        };
        return (
          document.addEventListener(`visibilitychange`, e),
          () => window.removeEventListener(`visibilitychange`, e)
        );
      }, []),
      e
    );
  },
  Jt = 1,
  Yt = new (class {
    constructor() {
      ((this.subscribe = (e) => (
        this.subscribers.push(e),
        () => {
          let t = this.subscribers.indexOf(e);
          this.subscribers.splice(t, 1);
        }
      )),
        (this.publish = (e) => {
          this.subscribers.forEach((t) => t(e));
        }),
        (this.addToast = (e) => {
          (this.publish(e), (this.toasts = [...this.toasts, e]));
        }),
        (this.create = (e) => {
          let { message: t, ...n } = e,
            r = typeof e?.id == `number` || e.id?.length > 0 ? e.id : Jt++,
            i = this.toasts.find((e) => e.id === r),
            a = e.dismissible === void 0 ? !0 : e.dismissible;
          return (
            this.dismissedToasts.has(r) && this.dismissedToasts.delete(r),
            i
              ? (this.toasts = this.toasts.map((n) =>
                  n.id === r
                    ? (this.publish({ ...n, ...e, id: r, title: t }),
                      { ...n, ...e, id: r, dismissible: a, title: t })
                    : n,
                ))
              : this.addToast({ title: t, ...n, dismissible: a, id: r }),
            r
          );
        }),
        (this.dismiss = (e) => (
          e
            ? (this.dismissedToasts.add(e),
              requestAnimationFrame(() =>
                this.subscribers.forEach((t) => t({ id: e, dismiss: !0 })),
              ))
            : this.toasts.forEach((e) => {
                this.subscribers.forEach((t) => t({ id: e.id, dismiss: !0 }));
              }),
          e
        )),
        (this.message = (e, t) => this.create({ ...t, message: e })),
        (this.error = (e, t) =>
          this.create({ ...t, message: e, type: `error` })),
        (this.success = (e, t) =>
          this.create({ ...t, type: `success`, message: e })),
        (this.info = (e, t) => this.create({ ...t, type: `info`, message: e })),
        (this.warning = (e, t) =>
          this.create({ ...t, type: `warning`, message: e })),
        (this.loading = (e, t) =>
          this.create({ ...t, type: `loading`, message: e })),
        (this.promise = (e, t) => {
          if (!t) return;
          let n;
          t.loading !== void 0 &&
            (n = this.create({
              ...t,
              promise: e,
              type: `loading`,
              message: t.loading,
              description:
                typeof t.description == `function` ? void 0 : t.description,
            }));
          let r = Promise.resolve(e instanceof Function ? e() : e),
            i = n !== void 0,
            a,
            o = r
              .then(async (e) => {
                if (((a = [`resolve`, e]), F.isValidElement(e)))
                  ((i = !1),
                    this.create({ id: n, type: `default`, message: e }));
                else if (Zt(e) && !e.ok) {
                  i = !1;
                  let r =
                      typeof t.error == `function`
                        ? await t.error(`HTTP error! status: ${e.status}`)
                        : t.error,
                    a =
                      typeof t.description == `function`
                        ? await t.description(`HTTP error! status: ${e.status}`)
                        : t.description,
                    o =
                      typeof r == `object` && !F.isValidElement(r)
                        ? r
                        : { message: r };
                  this.create({ id: n, type: `error`, description: a, ...o });
                } else if (e instanceof Error) {
                  i = !1;
                  let r =
                      typeof t.error == `function` ? await t.error(e) : t.error,
                    a =
                      typeof t.description == `function`
                        ? await t.description(e)
                        : t.description,
                    o =
                      typeof r == `object` && !F.isValidElement(r)
                        ? r
                        : { message: r };
                  this.create({ id: n, type: `error`, description: a, ...o });
                } else if (t.success !== void 0) {
                  i = !1;
                  let r =
                      typeof t.success == `function`
                        ? await t.success(e)
                        : t.success,
                    a =
                      typeof t.description == `function`
                        ? await t.description(e)
                        : t.description,
                    o =
                      typeof r == `object` && !F.isValidElement(r)
                        ? r
                        : { message: r };
                  this.create({ id: n, type: `success`, description: a, ...o });
                }
              })
              .catch(async (e) => {
                if (((a = [`reject`, e]), t.error !== void 0)) {
                  i = !1;
                  let r =
                      typeof t.error == `function` ? await t.error(e) : t.error,
                    a =
                      typeof t.description == `function`
                        ? await t.description(e)
                        : t.description,
                    o =
                      typeof r == `object` && !F.isValidElement(r)
                        ? r
                        : { message: r };
                  this.create({ id: n, type: `error`, description: a, ...o });
                }
              })
              .finally(() => {
                (i && (this.dismiss(n), (n = void 0)),
                  t.finally == null || t.finally.call(t));
              }),
            s = () =>
              new Promise((e, t) =>
                o.then(() => (a[0] === `reject` ? t(a[1]) : e(a[1]))).catch(t),
              );
          return typeof n != `string` && typeof n != `number`
            ? { unwrap: s }
            : Object.assign(n, { unwrap: s });
        }),
        (this.custom = (e, t) => {
          let n = t?.id || Jt++;
          return (this.create({ jsx: e(n), id: n, ...t }), n);
        }),
        (this.getActiveToasts = () =>
          this.toasts.filter((e) => !this.dismissedToasts.has(e.id))),
        (this.subscribers = []),
        (this.toasts = []),
        (this.dismissedToasts = new Set()));
    }
  })(),
  Xt = (e, t) => {
    let n = t?.id || Jt++;
    return (Yt.addToast({ title: e, ...t, id: n }), n);
  },
  Zt = (e) =>
    e &&
    typeof e == `object` &&
    `ok` in e &&
    typeof e.ok == `boolean` &&
    `status` in e &&
    typeof e.status == `number`,
  Qt = Object.assign(
    Xt,
    {
      success: Yt.success,
      info: Yt.info,
      warning: Yt.warning,
      error: Yt.error,
      custom: Yt.custom,
      message: Yt.message,
      promise: Yt.promise,
      dismiss: Yt.dismiss,
      loading: Yt.loading,
    },
    { getHistory: () => Yt.toasts, getToasts: () => Yt.getActiveToasts() },
  );
Rt(
  `[data-sonner-toaster][dir=ltr],html[dir=ltr]{--toast-icon-margin-start:-3px;--toast-icon-margin-end:4px;--toast-svg-margin-start:-1px;--toast-svg-margin-end:0px;--toast-button-margin-start:auto;--toast-button-margin-end:0;--toast-close-button-start:0;--toast-close-button-end:unset;--toast-close-button-transform:translate(-35%, -35%)}[data-sonner-toaster][dir=rtl],html[dir=rtl]{--toast-icon-margin-start:4px;--toast-icon-margin-end:-3px;--toast-svg-margin-start:0px;--toast-svg-margin-end:-1px;--toast-button-margin-start:0;--toast-button-margin-end:auto;--toast-close-button-start:unset;--toast-close-button-end:0;--toast-close-button-transform:translate(35%, -35%)}[data-sonner-toaster]{position:fixed;width:var(--width);font-family:ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Helvetica Neue,Arial,Noto Sans,sans-serif,Apple Color Emoji,Segoe UI Emoji,Segoe UI Symbol,Noto Color Emoji;--gray1:hsl(0, 0%, 99%);--gray2:hsl(0, 0%, 97.3%);--gray3:hsl(0, 0%, 95.1%);--gray4:hsl(0, 0%, 93%);--gray5:hsl(0, 0%, 90.9%);--gray6:hsl(0, 0%, 88.7%);--gray7:hsl(0, 0%, 85.8%);--gray8:hsl(0, 0%, 78%);--gray9:hsl(0, 0%, 56.1%);--gray10:hsl(0, 0%, 52.3%);--gray11:hsl(0, 0%, 43.5%);--gray12:hsl(0, 0%, 9%);--border-radius:8px;box-sizing:border-box;padding:0;margin:0;list-style:none;outline:0;z-index:999999999;transition:transform .4s ease}@media (hover:none) and (pointer:coarse){[data-sonner-toaster][data-lifted=true]{transform:none}}[data-sonner-toaster][data-x-position=right]{right:var(--offset-right)}[data-sonner-toaster][data-x-position=left]{left:var(--offset-left)}[data-sonner-toaster][data-x-position=center]{left:50%;transform:translateX(-50%)}[data-sonner-toaster][data-y-position=top]{top:var(--offset-top)}[data-sonner-toaster][data-y-position=bottom]{bottom:var(--offset-bottom)}[data-sonner-toast]{--y:translateY(100%);--lift-amount:calc(var(--lift) * var(--gap));z-index:var(--z-index);position:absolute;opacity:0;transform:var(--y);touch-action:none;transition:transform .4s,opacity .4s,height .4s,box-shadow .2s;box-sizing:border-box;outline:0;overflow-wrap:anywhere}[data-sonner-toast][data-styled=true]{padding:16px;background:var(--normal-bg);border:1px solid var(--normal-border);color:var(--normal-text);border-radius:var(--border-radius);box-shadow:0 4px 12px rgba(0,0,0,.1);width:var(--width);font-size:13px;display:flex;align-items:center;gap:6px}[data-sonner-toast]:focus-visible{box-shadow:0 4px 12px rgba(0,0,0,.1),0 0 0 2px rgba(0,0,0,.2)}[data-sonner-toast][data-y-position=top]{top:0;--y:translateY(-100%);--lift:1;--lift-amount:calc(1 * var(--gap))}[data-sonner-toast][data-y-position=bottom]{bottom:0;--y:translateY(100%);--lift:-1;--lift-amount:calc(var(--lift) * var(--gap))}[data-sonner-toast][data-styled=true] [data-description]{font-weight:400;line-height:1.4;color:#3f3f3f}[data-rich-colors=true][data-sonner-toast][data-styled=true] [data-description]{color:inherit}[data-sonner-toaster][data-sonner-theme=dark] [data-description]{color:#e8e8e8}[data-sonner-toast][data-styled=true] [data-title]{font-weight:500;line-height:1.5;color:inherit}[data-sonner-toast][data-styled=true] [data-icon]{display:flex;height:16px;width:16px;position:relative;justify-content:flex-start;align-items:center;flex-shrink:0;margin-left:var(--toast-icon-margin-start);margin-right:var(--toast-icon-margin-end)}[data-sonner-toast][data-promise=true] [data-icon]>svg{opacity:0;transform:scale(.8);transform-origin:center;animation:sonner-fade-in .3s ease forwards}[data-sonner-toast][data-styled=true] [data-icon]>*{flex-shrink:0}[data-sonner-toast][data-styled=true] [data-icon] svg{margin-left:var(--toast-svg-margin-start);margin-right:var(--toast-svg-margin-end)}[data-sonner-toast][data-styled=true] [data-content]{display:flex;flex-direction:column;gap:2px}[data-sonner-toast][data-styled=true] [data-button]{border-radius:4px;padding-left:8px;padding-right:8px;height:24px;font-size:12px;color:var(--normal-bg);background:var(--normal-text);margin-left:var(--toast-button-margin-start);margin-right:var(--toast-button-margin-end);border:none;font-weight:500;cursor:pointer;outline:0;display:flex;align-items:center;flex-shrink:0;transition:opacity .4s,box-shadow .2s}[data-sonner-toast][data-styled=true] [data-button]:focus-visible{box-shadow:0 0 0 2px rgba(0,0,0,.4)}[data-sonner-toast][data-styled=true] [data-button]:first-of-type{margin-left:var(--toast-button-margin-start);margin-right:var(--toast-button-margin-end)}[data-sonner-toast][data-styled=true] [data-cancel]{color:var(--normal-text);background:rgba(0,0,0,.08)}[data-sonner-toaster][data-sonner-theme=dark] [data-sonner-toast][data-styled=true] [data-cancel]{background:rgba(255,255,255,.3)}[data-sonner-toast][data-styled=true] [data-close-button]{position:absolute;left:var(--toast-close-button-start);right:var(--toast-close-button-end);top:0;height:20px;width:20px;display:flex;justify-content:center;align-items:center;padding:0;color:var(--gray12);background:var(--normal-bg);border:1px solid var(--gray4);transform:var(--toast-close-button-transform);border-radius:50%;cursor:pointer;z-index:1;transition:opacity .1s,background .2s,border-color .2s}[data-sonner-toast][data-styled=true] [data-close-button]:focus-visible{box-shadow:0 4px 12px rgba(0,0,0,.1),0 0 0 2px rgba(0,0,0,.2)}[data-sonner-toast][data-styled=true] [data-disabled=true]{cursor:not-allowed}[data-sonner-toast][data-styled=true]:hover [data-close-button]:hover{background:var(--gray2);border-color:var(--gray5)}[data-sonner-toast][data-swiping=true]::before{content:'';position:absolute;left:-100%;right:-100%;height:100%;z-index:-1}[data-sonner-toast][data-y-position=top][data-swiping=true]::before{bottom:50%;transform:scaleY(3) translateY(50%)}[data-sonner-toast][data-y-position=bottom][data-swiping=true]::before{top:50%;transform:scaleY(3) translateY(-50%)}[data-sonner-toast][data-swiping=false][data-removed=true]::before{content:'';position:absolute;inset:0;transform:scaleY(2)}[data-sonner-toast][data-expanded=true]::after{content:'';position:absolute;left:0;height:calc(var(--gap) + 1px);bottom:100%;width:100%}[data-sonner-toast][data-mounted=true]{--y:translateY(0);opacity:1}[data-sonner-toast][data-expanded=false][data-front=false]{--scale:var(--toasts-before) * 0.05 + 1;--y:translateY(calc(var(--lift-amount) * var(--toasts-before))) scale(calc(-1 * var(--scale)));height:var(--front-toast-height)}[data-sonner-toast]>*{transition:opacity .4s}[data-sonner-toast][data-x-position=right]{right:0}[data-sonner-toast][data-x-position=left]{left:0}[data-sonner-toast][data-expanded=false][data-front=false][data-styled=true]>*{opacity:0}[data-sonner-toast][data-visible=false]{opacity:0;pointer-events:none}[data-sonner-toast][data-mounted=true][data-expanded=true]{--y:translateY(calc(var(--lift) * var(--offset)));height:var(--initial-height)}[data-sonner-toast][data-removed=true][data-front=true][data-swipe-out=false]{--y:translateY(calc(var(--lift) * -100%));opacity:0}[data-sonner-toast][data-removed=true][data-front=false][data-swipe-out=false][data-expanded=true]{--y:translateY(calc(var(--lift) * var(--offset) + var(--lift) * -100%));opacity:0}[data-sonner-toast][data-removed=true][data-front=false][data-swipe-out=false][data-expanded=false]{--y:translateY(40%);opacity:0;transition:transform .5s,opacity .2s}[data-sonner-toast][data-removed=true][data-front=false]::before{height:calc(var(--initial-height) + 20%)}[data-sonner-toast][data-swiping=true]{transform:var(--y) translateY(var(--swipe-amount-y,0)) translateX(var(--swipe-amount-x,0));transition:none}[data-sonner-toast][data-swiped=true]{user-select:none}[data-sonner-toast][data-swipe-out=true][data-y-position=bottom],[data-sonner-toast][data-swipe-out=true][data-y-position=top]{animation-duration:.2s;animation-timing-function:ease-out;animation-fill-mode:forwards}[data-sonner-toast][data-swipe-out=true][data-swipe-direction=left]{animation-name:swipe-out-left}[data-sonner-toast][data-swipe-out=true][data-swipe-direction=right]{animation-name:swipe-out-right}[data-sonner-toast][data-swipe-out=true][data-swipe-direction=up]{animation-name:swipe-out-up}[data-sonner-toast][data-swipe-out=true][data-swipe-direction=down]{animation-name:swipe-out-down}@keyframes swipe-out-left{from{transform:var(--y) translateX(var(--swipe-amount-x));opacity:1}to{transform:var(--y) translateX(calc(var(--swipe-amount-x) - 100%));opacity:0}}@keyframes swipe-out-right{from{transform:var(--y) translateX(var(--swipe-amount-x));opacity:1}to{transform:var(--y) translateX(calc(var(--swipe-amount-x) + 100%));opacity:0}}@keyframes swipe-out-up{from{transform:var(--y) translateY(var(--swipe-amount-y));opacity:1}to{transform:var(--y) translateY(calc(var(--swipe-amount-y) - 100%));opacity:0}}@keyframes swipe-out-down{from{transform:var(--y) translateY(var(--swipe-amount-y));opacity:1}to{transform:var(--y) translateY(calc(var(--swipe-amount-y) + 100%));opacity:0}}@media (max-width:600px){[data-sonner-toaster]{position:fixed;right:var(--mobile-offset-right);left:var(--mobile-offset-left);width:100%}[data-sonner-toaster][dir=rtl]{left:calc(var(--mobile-offset-left) * -1)}[data-sonner-toaster] [data-sonner-toast]{left:0;right:0;width:calc(100% - var(--mobile-offset-left) * 2)}[data-sonner-toaster][data-x-position=left]{left:var(--mobile-offset-left)}[data-sonner-toaster][data-y-position=bottom]{bottom:var(--mobile-offset-bottom)}[data-sonner-toaster][data-y-position=top]{top:var(--mobile-offset-top)}[data-sonner-toaster][data-x-position=center]{left:var(--mobile-offset-left);right:var(--mobile-offset-right);transform:none}}[data-sonner-toaster][data-sonner-theme=light]{--normal-bg:#fff;--normal-border:var(--gray4);--normal-text:var(--gray12);--success-bg:hsl(143, 85%, 96%);--success-border:hsl(145, 92%, 87%);--success-text:hsl(140, 100%, 27%);--info-bg:hsl(208, 100%, 97%);--info-border:hsl(221, 91%, 93%);--info-text:hsl(210, 92%, 45%);--warning-bg:hsl(49, 100%, 97%);--warning-border:hsl(49, 91%, 84%);--warning-text:hsl(31, 92%, 45%);--error-bg:hsl(359, 100%, 97%);--error-border:hsl(359, 100%, 94%);--error-text:hsl(360, 100%, 45%)}[data-sonner-toaster][data-sonner-theme=light] [data-sonner-toast][data-invert=true]{--normal-bg:#000;--normal-border:hsl(0, 0%, 20%);--normal-text:var(--gray1)}[data-sonner-toaster][data-sonner-theme=dark] [data-sonner-toast][data-invert=true]{--normal-bg:#fff;--normal-border:var(--gray3);--normal-text:var(--gray12)}[data-sonner-toaster][data-sonner-theme=dark]{--normal-bg:#000;--normal-bg-hover:hsl(0, 0%, 12%);--normal-border:hsl(0, 0%, 20%);--normal-border-hover:hsl(0, 0%, 25%);--normal-text:var(--gray1);--success-bg:hsl(150, 100%, 6%);--success-border:hsl(147, 100%, 12%);--success-text:hsl(150, 86%, 65%);--info-bg:hsl(215, 100%, 6%);--info-border:hsl(223, 43%, 17%);--info-text:hsl(216, 87%, 65%);--warning-bg:hsl(64, 100%, 6%);--warning-border:hsl(60, 100%, 9%);--warning-text:hsl(46, 87%, 65%);--error-bg:hsl(358, 76%, 10%);--error-border:hsl(357, 89%, 16%);--error-text:hsl(358, 100%, 81%)}[data-sonner-toaster][data-sonner-theme=dark] [data-sonner-toast] [data-close-button]{background:var(--normal-bg);border-color:var(--normal-border);color:var(--normal-text)}[data-sonner-toaster][data-sonner-theme=dark] [data-sonner-toast] [data-close-button]:hover{background:var(--normal-bg-hover);border-color:var(--normal-border-hover)}[data-rich-colors=true][data-sonner-toast][data-type=success]{background:var(--success-bg);border-color:var(--success-border);color:var(--success-text)}[data-rich-colors=true][data-sonner-toast][data-type=success] [data-close-button]{background:var(--success-bg);border-color:var(--success-border);color:var(--success-text)}[data-rich-colors=true][data-sonner-toast][data-type=info]{background:var(--info-bg);border-color:var(--info-border);color:var(--info-text)}[data-rich-colors=true][data-sonner-toast][data-type=info] [data-close-button]{background:var(--info-bg);border-color:var(--info-border);color:var(--info-text)}[data-rich-colors=true][data-sonner-toast][data-type=warning]{background:var(--warning-bg);border-color:var(--warning-border);color:var(--warning-text)}[data-rich-colors=true][data-sonner-toast][data-type=warning] [data-close-button]{background:var(--warning-bg);border-color:var(--warning-border);color:var(--warning-text)}[data-rich-colors=true][data-sonner-toast][data-type=error]{background:var(--error-bg);border-color:var(--error-border);color:var(--error-text)}[data-rich-colors=true][data-sonner-toast][data-type=error] [data-close-button]{background:var(--error-bg);border-color:var(--error-border);color:var(--error-text)}.sonner-loading-wrapper{--size:16px;height:var(--size);width:var(--size);position:absolute;inset:0;z-index:10}.sonner-loading-wrapper[data-visible=false]{transform-origin:center;animation:sonner-fade-out .2s ease forwards}.sonner-spinner{position:relative;top:50%;left:50%;height:var(--size);width:var(--size)}.sonner-loading-bar{animation:sonner-spin 1.2s linear infinite;background:var(--gray11);border-radius:6px;height:8%;left:-10%;position:absolute;top:-3.9%;width:24%}.sonner-loading-bar:first-child{animation-delay:-1.2s;transform:rotate(.0001deg) translate(146%)}.sonner-loading-bar:nth-child(2){animation-delay:-1.1s;transform:rotate(30deg) translate(146%)}.sonner-loading-bar:nth-child(3){animation-delay:-1s;transform:rotate(60deg) translate(146%)}.sonner-loading-bar:nth-child(4){animation-delay:-.9s;transform:rotate(90deg) translate(146%)}.sonner-loading-bar:nth-child(5){animation-delay:-.8s;transform:rotate(120deg) translate(146%)}.sonner-loading-bar:nth-child(6){animation-delay:-.7s;transform:rotate(150deg) translate(146%)}.sonner-loading-bar:nth-child(7){animation-delay:-.6s;transform:rotate(180deg) translate(146%)}.sonner-loading-bar:nth-child(8){animation-delay:-.5s;transform:rotate(210deg) translate(146%)}.sonner-loading-bar:nth-child(9){animation-delay:-.4s;transform:rotate(240deg) translate(146%)}.sonner-loading-bar:nth-child(10){animation-delay:-.3s;transform:rotate(270deg) translate(146%)}.sonner-loading-bar:nth-child(11){animation-delay:-.2s;transform:rotate(300deg) translate(146%)}.sonner-loading-bar:nth-child(12){animation-delay:-.1s;transform:rotate(330deg) translate(146%)}@keyframes sonner-fade-in{0%{opacity:0;transform:scale(.8)}100%{opacity:1;transform:scale(1)}}@keyframes sonner-fade-out{0%{opacity:1;transform:scale(1)}100%{opacity:0;transform:scale(.8)}}@keyframes sonner-spin{0%{opacity:1}100%{opacity:.15}}@media (prefers-reduced-motion){.sonner-loading-bar,[data-sonner-toast],[data-sonner-toast]>*{transition:none!important;animation:none!important}}.sonner-loader{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);transform-origin:center;transition:opacity .2s,transform .2s}.sonner-loader[data-visible=false]{opacity:0;transform:scale(.8) translate(-50%,-50%)}`,
);
function $t(e) {
  return e.label !== void 0;
}
var en = 3,
  tn = `24px`,
  nn = `16px`,
  rn = 4e3,
  an = 356,
  on = 14,
  sn = 45,
  cn = 200;
function ln(...e) {
  return e.filter(Boolean).join(` `);
}
function un(e) {
  let [t, n] = e.split(`-`),
    r = [];
  return (t && r.push(t), n && r.push(n), r);
}
var dn = (e) => {
  let {
      invert: t,
      toast: n,
      unstyled: r,
      interacting: i,
      setHeights: a,
      visibleToasts: o,
      heights: s,
      index: c,
      toasts: l,
      expanded: u,
      removeToast: d,
      defaultRichColors: f,
      closeButton: p,
      style: m,
      cancelButtonStyle: h,
      actionButtonStyle: g,
      className: _ = ``,
      descriptionClassName: v = ``,
      duration: y,
      position: b,
      gap: x,
      expandByDefault: S,
      classNames: C,
      icons: w,
      closeButtonAriaLabel: T = `Close toast`,
    } = e,
    [E, ee] = F.useState(null),
    [D, te] = F.useState(null),
    [ne, O] = F.useState(!1),
    [re, ie] = F.useState(!1),
    [k, A] = F.useState(!1),
    [j, ae] = F.useState(!1),
    [oe, se] = F.useState(!1),
    [M, N] = F.useState(0),
    [ce, le] = F.useState(0),
    ue = F.useRef(n.duration || y || rn),
    de = F.useRef(null),
    fe = F.useRef(null),
    pe = c === 0,
    me = c + 1 <= o,
    he = n.type,
    P = n.dismissible !== !1,
    ge = n.className || ``,
    _e = n.descriptionClassName || ``,
    ve = F.useMemo(
      () => s.findIndex((e) => e.toastId === n.id) || 0,
      [s, n.id],
    ),
    I = F.useMemo(() => n.closeButton ?? p, [n.closeButton, p]),
    ye = F.useMemo(() => n.duration || y || rn, [n.duration, y]),
    be = F.useRef(0),
    xe = F.useRef(0),
    Se = F.useRef(0),
    Ce = F.useRef(null),
    [we, Te] = b.split(`-`),
    Ee = F.useMemo(
      () => s.reduce((e, t, n) => (n >= ve ? e : e + t.height), 0),
      [s, ve],
    ),
    De = qt(),
    Oe = n.invert || t,
    ke = he === `loading`;
  ((xe.current = F.useMemo(() => ve * x + Ee, [ve, Ee])),
    F.useEffect(() => {
      ue.current = ye;
    }, [ye]),
    F.useEffect(() => {
      O(!0);
    }, []),
    F.useEffect(() => {
      let e = fe.current;
      if (e) {
        let t = e.getBoundingClientRect().height;
        return (
          le(t),
          a((e) => [{ toastId: n.id, height: t, position: n.position }, ...e]),
          () => a((e) => e.filter((e) => e.toastId !== n.id))
        );
      }
    }, [a, n.id]),
    F.useLayoutEffect(() => {
      if (!ne) return;
      let e = fe.current,
        t = e.style.height;
      e.style.height = `auto`;
      let r = e.getBoundingClientRect().height;
      ((e.style.height = t),
        le(r),
        a((e) =>
          e.find((e) => e.toastId === n.id)
            ? e.map((e) => (e.toastId === n.id ? { ...e, height: r } : e))
            : [{ toastId: n.id, height: r, position: n.position }, ...e],
        ));
    }, [ne, n.title, n.description, a, n.id, n.jsx, n.action, n.cancel]));
  let Ae = F.useCallback(() => {
    (ie(!0),
      N(xe.current),
      a((e) => e.filter((e) => e.toastId !== n.id)),
      setTimeout(() => {
        d(n);
      }, cn));
  }, [n, d, a, xe]);
  (F.useEffect(() => {
    if (
      (n.promise && he === `loading`) ||
      n.duration === 1 / 0 ||
      n.type === `loading`
    )
      return;
    let e;
    return (
      u || i || De
        ? (() => {
            if (Se.current < be.current) {
              let e = new Date().getTime() - be.current;
              ue.current -= e;
            }
            Se.current = new Date().getTime();
          })()
        : ue.current !== 1 / 0 &&
          ((be.current = new Date().getTime()),
          (e = setTimeout(() => {
            (n.onAutoClose == null || n.onAutoClose.call(n, n), Ae());
          }, ue.current))),
      () => clearTimeout(e)
    );
  }, [u, i, n, he, De, Ae]),
    F.useEffect(() => {
      n.delete && (Ae(), n.onDismiss == null || n.onDismiss.call(n, n));
    }, [Ae, n.delete]));
  function je() {
    return w?.loading
      ? F.createElement(
          `div`,
          {
            className: ln(C?.loader, n?.classNames?.loader, `sonner-loader`),
            "data-visible": he === `loading`,
          },
          w.loading,
        )
      : F.createElement(Vt, {
          className: ln(C?.loader, n?.classNames?.loader),
          visible: he === `loading`,
        });
  }
  let Me = n.icon || w?.[he] || zt(he);
  return F.createElement(
    `li`,
    {
      tabIndex: 0,
      ref: fe,
      className: ln(
        _,
        ge,
        C?.toast,
        n?.classNames?.toast,
        C?.default,
        C?.[he],
        n?.classNames?.[he],
      ),
      "data-sonner-toast": ``,
      "data-rich-colors": n.richColors ?? f,
      "data-styled": !(n.jsx || n.unstyled || r),
      "data-mounted": ne,
      "data-promise": !!n.promise,
      "data-swiped": oe,
      "data-removed": re,
      "data-visible": me,
      "data-y-position": we,
      "data-x-position": Te,
      "data-index": c,
      "data-front": pe,
      "data-swiping": k,
      "data-dismissible": P,
      "data-type": he,
      "data-invert": Oe,
      "data-swipe-out": j,
      "data-swipe-direction": D,
      "data-expanded": !!(u || (S && ne)),
      "data-testid": n.testId,
      style: {
        "--index": c,
        "--toasts-before": c,
        "--z-index": l.length - c,
        "--offset": `${re ? M : xe.current}px`,
        "--initial-height": S ? `auto` : `${ce}px`,
        ...m,
        ...n.style,
      },
      onDragEnd: () => {
        (A(!1), ee(null), (Ce.current = null));
      },
      onPointerDown: (e) => {
        e.button !== 2 &&
          (ke ||
            !P ||
            ((de.current = new Date()),
            N(xe.current),
            e.target.setPointerCapture(e.pointerId),
            e.target.tagName !== `BUTTON` &&
              (A(!0), (Ce.current = { x: e.clientX, y: e.clientY }))));
      },
      onPointerUp: () => {
        if (j || !P) return;
        Ce.current = null;
        let e = Number(
            fe.current?.style
              .getPropertyValue(`--swipe-amount-x`)
              .replace(`px`, ``) || 0,
          ),
          t = Number(
            fe.current?.style
              .getPropertyValue(`--swipe-amount-y`)
              .replace(`px`, ``) || 0,
          ),
          r = new Date().getTime() - de.current?.getTime(),
          i = E === `x` ? e : t,
          a = Math.abs(i) / r;
        if (Math.abs(i) >= sn || a > 0.11) {
          (N(xe.current),
            n.onDismiss == null || n.onDismiss.call(n, n),
            te(E === `x` ? (e > 0 ? `right` : `left`) : t > 0 ? `down` : `up`),
            Ae(),
            ae(!0));
          return;
        } else {
          var o, s;
          ((o = fe.current) == null ||
            o.style.setProperty(`--swipe-amount-x`, `0px`),
            (s = fe.current) == null ||
              s.style.setProperty(`--swipe-amount-y`, `0px`));
        }
        (se(!1), A(!1), ee(null));
      },
      onPointerMove: (t) => {
        var n, r;
        if (!Ce.current || !P || window.getSelection()?.toString().length > 0)
          return;
        let i = t.clientY - Ce.current.y,
          a = t.clientX - Ce.current.x,
          o = e.swipeDirections ?? un(b);
        !E &&
          (Math.abs(a) > 1 || Math.abs(i) > 1) &&
          ee(Math.abs(a) > Math.abs(i) ? `x` : `y`);
        let s = { x: 0, y: 0 },
          c = (e) => 1 / (1.5 + Math.abs(e) / 20);
        if (E === `y`) {
          if (o.includes(`top`) || o.includes(`bottom`))
            if ((o.includes(`top`) && i < 0) || (o.includes(`bottom`) && i > 0))
              s.y = i;
            else {
              let e = i * c(i);
              s.y = Math.abs(e) < Math.abs(i) ? e : i;
            }
        } else if (E === `x` && (o.includes(`left`) || o.includes(`right`)))
          if ((o.includes(`left`) && a < 0) || (o.includes(`right`) && a > 0))
            s.x = a;
          else {
            let e = a * c(a);
            s.x = Math.abs(e) < Math.abs(a) ? e : a;
          }
        ((Math.abs(s.x) > 0 || Math.abs(s.y) > 0) && se(!0),
          (n = fe.current) == null ||
            n.style.setProperty(`--swipe-amount-x`, `${s.x}px`),
          (r = fe.current) == null ||
            r.style.setProperty(`--swipe-amount-y`, `${s.y}px`));
      },
    },
    I && !n.jsx && he !== `loading`
      ? F.createElement(
          `button`,
          {
            "aria-label": T,
            "data-disabled": ke,
            "data-close-button": !0,
            onClick:
              ke || !P
                ? () => {}
                : () => {
                    (Ae(), n.onDismiss == null || n.onDismiss.call(n, n));
                  },
            className: ln(C?.closeButton, n?.classNames?.closeButton),
          },
          w?.close ?? Kt,
        )
      : null,
    (he || n.icon || n.promise) &&
      n.icon !== null &&
      (w?.[he] !== null || n.icon)
      ? F.createElement(
          `div`,
          { "data-icon": ``, className: ln(C?.icon, n?.classNames?.icon) },
          n.promise || (n.type === `loading` && !n.icon)
            ? n.icon || je()
            : null,
          n.type === `loading` ? null : Me,
        )
      : null,
    F.createElement(
      `div`,
      { "data-content": ``, className: ln(C?.content, n?.classNames?.content) },
      F.createElement(
        `div`,
        { "data-title": ``, className: ln(C?.title, n?.classNames?.title) },
        n.jsx ? n.jsx : typeof n.title == `function` ? n.title() : n.title,
      ),
      n.description
        ? F.createElement(
            `div`,
            {
              "data-description": ``,
              className: ln(v, _e, C?.description, n?.classNames?.description),
            },
            typeof n.description == `function`
              ? n.description()
              : n.description,
          )
        : null,
    ),
    F.isValidElement(n.cancel)
      ? n.cancel
      : n.cancel && $t(n.cancel)
        ? F.createElement(
            `button`,
            {
              "data-button": !0,
              "data-cancel": !0,
              style: n.cancelButtonStyle || h,
              onClick: (e) => {
                $t(n.cancel) &&
                  P &&
                  (n.cancel.onClick == null ||
                    n.cancel.onClick.call(n.cancel, e),
                  Ae());
              },
              className: ln(C?.cancelButton, n?.classNames?.cancelButton),
            },
            n.cancel.label,
          )
        : null,
    F.isValidElement(n.action)
      ? n.action
      : n.action && $t(n.action)
        ? F.createElement(
            `button`,
            {
              "data-button": !0,
              "data-action": !0,
              style: n.actionButtonStyle || g,
              onClick: (e) => {
                $t(n.action) &&
                  (n.action.onClick == null ||
                    n.action.onClick.call(n.action, e),
                  !e.defaultPrevented && Ae());
              },
              className: ln(C?.actionButton, n?.classNames?.actionButton),
            },
            n.action.label,
          )
        : null,
  );
};
function fn() {
  if (typeof window > `u` || typeof document > `u`) return `ltr`;
  let e = document.documentElement.getAttribute(`dir`);
  return e === `auto` || !e
    ? window.getComputedStyle(document.documentElement).direction
    : e;
}
function pn(e, t) {
  let n = {};
  return (
    [e, t].forEach((e, t) => {
      let r = t === 1,
        i = r ? `--mobile-offset` : `--offset`,
        a = r ? nn : tn;
      function o(e) {
        [`top`, `right`, `bottom`, `left`].forEach((t) => {
          n[`${i}-${t}`] = typeof e == `number` ? `${e}px` : e;
        });
      }
      typeof e == `number` || typeof e == `string`
        ? o(e)
        : typeof e == `object`
          ? [`top`, `right`, `bottom`, `left`].forEach((t) => {
              e[t] === void 0
                ? (n[`${i}-${t}`] = a)
                : (n[`${i}-${t}`] =
                    typeof e[t] == `number` ? `${e[t]}px` : e[t]);
            })
          : o(a);
    }),
    n
  );
}
var mn = F.forwardRef(function (e, t) {
    let {
        id: n,
        invert: r,
        position: i = `bottom-right`,
        hotkey: a = [`altKey`, `KeyT`],
        expand: o,
        closeButton: s,
        className: c,
        offset: l,
        mobileOffset: u,
        theme: d = `light`,
        richColors: f,
        duration: p,
        style: m,
        visibleToasts: h = en,
        toastOptions: g,
        dir: _ = fn(),
        gap: v = on,
        icons: y,
        containerAriaLabel: b = `Notifications`,
      } = e,
      [x, S] = F.useState([]),
      C = F.useMemo(
        () =>
          n
            ? x.filter((e) => e.toasterId === n)
            : x.filter((e) => !e.toasterId),
        [x, n],
      ),
      w = F.useMemo(
        () =>
          Array.from(
            new Set(
              [i].concat(C.filter((e) => e.position).map((e) => e.position)),
            ),
          ),
        [C, i],
      ),
      [T, E] = F.useState([]),
      [ee, D] = F.useState(!1),
      [te, ne] = F.useState(!1),
      [O, re] = F.useState(
        d === `system`
          ? typeof window < `u` &&
            window.matchMedia &&
            window.matchMedia(`(prefers-color-scheme: dark)`).matches
            ? `dark`
            : `light`
          : d,
      ),
      ie = F.useRef(null),
      k = a.join(`+`).replace(/Key/g, ``).replace(/Digit/g, ``),
      A = F.useRef(null),
      j = F.useRef(!1),
      ae = F.useCallback((e) => {
        S(
          (t) => (
            t.find((t) => t.id === e.id)?.delete || Yt.dismiss(e.id),
            t.filter(({ id: t }) => t !== e.id)
          ),
        );
      }, []);
    return (
      F.useEffect(
        () =>
          Yt.subscribe((e) => {
            if (e.dismiss) {
              requestAnimationFrame(() => {
                S((t) =>
                  t.map((t) => (t.id === e.id ? { ...t, delete: !0 } : t)),
                );
              });
              return;
            }
            setTimeout(() => {
              _e.flushSync(() => {
                S((t) => {
                  let n = t.findIndex((t) => t.id === e.id);
                  return n === -1
                    ? [e, ...t]
                    : [...t.slice(0, n), { ...t[n], ...e }, ...t.slice(n + 1)];
                });
              });
            });
          }),
        [x],
      ),
      F.useEffect(() => {
        if (d !== `system`) {
          re(d);
          return;
        }
        if (
          (d === `system` &&
            (window.matchMedia &&
            window.matchMedia(`(prefers-color-scheme: dark)`).matches
              ? re(`dark`)
              : re(`light`)),
          typeof window > `u`)
        )
          return;
        let e = window.matchMedia(`(prefers-color-scheme: dark)`);
        try {
          e.addEventListener(`change`, ({ matches: e }) => {
            re(e ? `dark` : `light`);
          });
        } catch {
          e.addListener(({ matches: e }) => {
            try {
              re(e ? `dark` : `light`);
            } catch (e) {
              console.error(e);
            }
          });
        }
      }, [d]),
      F.useEffect(() => {
        x.length <= 1 && D(!1);
      }, [x]),
      F.useEffect(() => {
        let e = (e) => {
          if (a.every((t) => e[t] || e.code === t)) {
            var t;
            (D(!0), (t = ie.current) == null || t.focus());
          }
          e.code === `Escape` &&
            (document.activeElement === ie.current ||
              ie.current?.contains(document.activeElement)) &&
            D(!1);
        };
        return (
          document.addEventListener(`keydown`, e),
          () => document.removeEventListener(`keydown`, e)
        );
      }, [a]),
      F.useEffect(() => {
        if (ie.current)
          return () => {
            A.current &&
              (A.current.focus({ preventScroll: !0 }),
              (A.current = null),
              (j.current = !1));
          };
      }, [ie.current]),
      F.createElement(
        `section`,
        {
          ref: t,
          "aria-label": `${b} ${k}`,
          tabIndex: -1,
          "aria-live": `polite`,
          "aria-relevant": `additions text`,
          "aria-atomic": `false`,
          suppressHydrationWarning: !0,
        },
        w.map((t, n) => {
          let [i, a] = t.split(`-`);
          return C.length
            ? F.createElement(
                `ol`,
                {
                  key: t,
                  dir: _ === `auto` ? fn() : _,
                  tabIndex: -1,
                  ref: ie,
                  className: c,
                  "data-sonner-toaster": !0,
                  "data-sonner-theme": O,
                  "data-y-position": i,
                  "data-x-position": a,
                  style: {
                    "--front-toast-height": `${T[0]?.height || 0}px`,
                    "--width": `${an}px`,
                    "--gap": `${v}px`,
                    ...m,
                    ...pn(l, u),
                  },
                  onBlur: (e) => {
                    j.current &&
                      !e.currentTarget.contains(e.relatedTarget) &&
                      ((j.current = !1),
                      (A.current &&=
                        (A.current.focus({ preventScroll: !0 }), null)));
                  },
                  onFocus: (e) => {
                    (e.target instanceof HTMLElement &&
                      e.target.dataset.dismissible === `false`) ||
                      j.current ||
                      ((j.current = !0), (A.current = e.relatedTarget));
                  },
                  onMouseEnter: () => D(!0),
                  onMouseMove: () => D(!0),
                  onMouseLeave: () => {
                    te || D(!1);
                  },
                  onDragEnd: () => D(!1),
                  onPointerDown: (e) => {
                    (e.target instanceof HTMLElement &&
                      e.target.dataset.dismissible === `false`) ||
                      ne(!0);
                  },
                  onPointerUp: () => ne(!1),
                },
                C.filter(
                  (e) => (!e.position && n === 0) || e.position === t,
                ).map((n, i) =>
                  F.createElement(dn, {
                    key: n.id,
                    icons: y,
                    index: i,
                    toast: n,
                    defaultRichColors: f,
                    duration: g?.duration ?? p,
                    className: g?.className,
                    descriptionClassName: g?.descriptionClassName,
                    invert: r,
                    visibleToasts: h,
                    closeButton: g?.closeButton ?? s,
                    interacting: te,
                    position: t,
                    style: g?.style,
                    unstyled: g?.unstyled,
                    classNames: g?.classNames,
                    cancelButtonStyle: g?.cancelButtonStyle,
                    actionButtonStyle: g?.actionButtonStyle,
                    closeButtonAriaLabel: g?.closeButtonAriaLabel,
                    removeToast: ae,
                    toasts: C.filter((e) => e.position == n.position),
                    heights: T.filter((e) => e.position == n.position),
                    setHeights: E,
                    expandByDefault: o,
                    gap: v,
                    expanded: ee,
                    swipeDirections: e.swipeDirections,
                  }),
                ),
              )
            : null;
        }),
      )
    );
  }),
  hn = (e) => {
    if (typeof e == `string`) return e.trim() || void 0;
    if (e && typeof e == `object` && `message` in e) return hn(e.message);
  };
function gn(e, t = `Something went wrong`) {
  let n = e?.response?.data;
  return typeof n == `string`
    ? (hn(n) ?? t)
    : (hn(n?.message) ?? hn(n?.error) ?? hn(e) ?? t);
}
function _n() {
  (ae.init({ logs: !1, axiosConfig: { baseURL: ne, withCredentials: !0 } }),
    ae._axios?.interceptors.response.use(
      (e) => e,
      (e) => (e.config?.silent || Qt.error(gn(e)), Promise.reject(e)),
    ));
}
var vn = (e) => ({ axiosConfig: { headers: { "X-TENANT-ID": e ?? null } } }),
  yn = F.createContext(void 0);
function bn() {
  return F.useContext(yn)?.direction ?? `ltr`;
}
var L = l(),
  xn = function (e) {
    let { direction: t = `ltr` } = e,
      n = F.useMemo(() => ({ direction: t }), [t]);
    return (0, L.jsx)(yn.Provider, { value: n, children: e.children });
  };
function Sn(e) {
  let t = F.useRef(!0);
  t.current && ((t.current = !1), e());
}
function Cn() {
  return typeof window < `u`;
}
function wn(e) {
  return Dn(e) ? (e.nodeName || ``).toLowerCase() : `#document`;
}
function Tn(e) {
  var t;
  return (
    (e == null || (t = e.ownerDocument) == null ? void 0 : t.defaultView) ||
    window
  );
}
function En(e) {
  return ((Dn(e) ? e.ownerDocument : e.document) || window.document)
    ?.documentElement;
}
function Dn(e) {
  return Cn() ? e instanceof Node || e instanceof Tn(e).Node : !1;
}
function On(e) {
  return Cn() ? e instanceof Element || e instanceof Tn(e).Element : !1;
}
function kn(e) {
  return Cn() ? e instanceof HTMLElement || e instanceof Tn(e).HTMLElement : !1;
}
function An(e) {
  return !Cn() || typeof ShadowRoot > `u`
    ? !1
    : e instanceof ShadowRoot || e instanceof Tn(e).ShadowRoot;
}
function jn(e) {
  let { overflow: t, overflowX: n, overflowY: r, display: i } = Hn(e);
  return (
    /auto|scroll|overlay|hidden|clip/.test(t + r + n) &&
    i !== `inline` &&
    i !== `contents`
  );
}
function Mn(e) {
  return /^(table|td|th)$/.test(wn(e));
}
function Nn(e) {
  try {
    if (e.matches(`:popover-open`)) return !0;
  } catch {}
  try {
    return e.matches(`:modal`);
  } catch {
    return !1;
  }
}
var Pn = /transform|translate|scale|rotate|perspective|filter/,
  Fn = /paint|layout|strict|content/,
  In = (e) => !!e && e !== `none`,
  Ln;
function Rn(e) {
  let t = On(e) ? Hn(e) : e;
  return (
    In(t.transform) ||
    In(t.translate) ||
    In(t.scale) ||
    In(t.rotate) ||
    In(t.perspective) ||
    (!Bn() && (In(t.backdropFilter) || In(t.filter))) ||
    Pn.test(t.willChange || ``) ||
    Fn.test(t.contain || ``)
  );
}
function zn(e) {
  let t = Wn(e);
  for (; kn(t) && !Vn(t); ) {
    if (Rn(t)) return t;
    if (Nn(t)) return null;
    t = Wn(t);
  }
  return null;
}
function Bn() {
  return (
    (Ln ??=
      typeof CSS < `u` &&
      CSS.supports &&
      CSS.supports(`-webkit-backdrop-filter`, `none`)),
    Ln
  );
}
function Vn(e) {
  return /^(html|body|#document)$/.test(wn(e));
}
function Hn(e) {
  return Tn(e).getComputedStyle(e);
}
function Un(e) {
  return On(e)
    ? { scrollLeft: e.scrollLeft, scrollTop: e.scrollTop }
    : { scrollLeft: e.scrollX, scrollTop: e.scrollY };
}
function Wn(e) {
  if (wn(e) === `html`) return e;
  let t = e.assignedSlot || e.parentNode || (An(e) && e.host) || En(e);
  return An(t) ? t.host : t;
}
function Gn(e) {
  let t = Wn(e);
  return Vn(t)
    ? e.ownerDocument
      ? e.ownerDocument.body
      : e.body
    : kn(t) && jn(t)
      ? t
      : Gn(t);
}
function Kn(e, t, n) {
  (t === void 0 && (t = []), n === void 0 && (n = !0));
  let r = Gn(e),
    i = r === e.ownerDocument?.body,
    a = Tn(r);
  if (i) {
    let e = qn(a);
    return t.concat(
      a,
      a.visualViewport || [],
      jn(r) ? r : [],
      e && n ? Kn(e) : [],
    );
  } else return t.concat(r, Kn(r, [], n));
}
function qn(e) {
  return e.parent && Object.getPrototypeOf(e.parent) ? e.frameElement : null;
}
function R(e, t, n, r) {
  return (
    e.addEventListener(t, n, r),
    () => {
      e.removeEventListener(t, n, r);
    }
  );
}
var Jn = typeof navigator < `u`,
  Yn = ar(),
  Xn = sr(),
  Zn = or(),
  Qn =
    typeof CSS > `u` || !CSS.supports
      ? !1
      : CSS.supports(`-webkit-backdrop-filter:none`),
  $n =
    Yn.platform === `MacIntel` && Yn.maxTouchPoints > 1
      ? !0
      : /iP(hone|ad|od)|iOS/.test(Yn.platform),
  er = Jn && /firefox/i.test(Zn),
  tr = Jn && /apple/i.test(navigator.vendor);
Jn && /Edg/i.test(Zn);
var nr = (Jn && /android/i.test(Xn)) || /android/i.test(Zn),
  rr = Jn && Xn.toLowerCase().startsWith(`mac`) && !navigator.maxTouchPoints,
  ir = Zn.includes(`jsdom/`);
function ar() {
  if (!Jn) return { platform: ``, maxTouchPoints: -1 };
  let e = navigator.userAgentData;
  return e?.platform
    ? { platform: e.platform, maxTouchPoints: navigator.maxTouchPoints }
    : {
        platform: navigator.platform ?? ``,
        maxTouchPoints: navigator.maxTouchPoints ?? -1,
      };
}
function or() {
  if (!Jn) return ``;
  let e = navigator.userAgentData;
  return e && Array.isArray(e.brands)
    ? e.brands.map(({ brand: e, version: t }) => `${e}/${t}`).join(` `)
    : navigator.userAgent;
}
function sr() {
  if (!Jn) return ``;
  let e = navigator.userAgentData;
  return e?.platform ? e.platform : (navigator.platform ?? ``);
}
function cr(e) {
  return e?.ownerDocument || document;
}
var lr = {},
  ur = {},
  dr = ``;
function fr(e) {
  if (typeof document > `u`) return !1;
  let t = cr(e);
  return Tn(t).innerWidth - t.documentElement.clientWidth > 0;
}
function pr(e) {
  if (
    !(
      typeof CSS < `u` &&
      CSS.supports &&
      CSS.supports(`scrollbar-gutter`, `stable`)
    ) ||
    typeof document > `u`
  )
    return !1;
  let t = cr(e),
    n = t.documentElement,
    r = t.body,
    i = jn(n) ? n : r,
    a = i.style.overflowY,
    o = n.style.scrollbarGutter;
  ((n.style.scrollbarGutter = `stable`), (i.style.overflowY = `scroll`));
  let s = i.offsetWidth;
  i.style.overflowY = `hidden`;
  let c = i.offsetWidth;
  return ((i.style.overflowY = a), (n.style.scrollbarGutter = o), s === c);
}
function mr(e) {
  let t = cr(e),
    n = t.documentElement,
    r = t.body,
    i = jn(n) ? n : r,
    a = { overflowY: i.style.overflowY, overflowX: i.style.overflowX };
  return (
    Object.assign(i.style, { overflowY: `hidden`, overflowX: `hidden` }),
    () => {
      Object.assign(i.style, a);
    }
  );
}
function hr(e) {
  let t = cr(e),
    n = t.documentElement,
    r = t.body,
    i = Tn(n),
    a = 0,
    o = 0,
    s = !1,
    c = pe.create();
  if (Qn && (i.visualViewport?.scale ?? 1) !== 1) return () => {};
  function l() {
    let t = i.getComputedStyle(n),
      c = i.getComputedStyle(r),
      l = (t.scrollbarGutter || ``).includes(`both-edges`)
        ? `stable both-edges`
        : `stable`;
    ((a = n.scrollTop),
      (o = n.scrollLeft),
      (lr = {
        scrollbarGutter: n.style.scrollbarGutter,
        overflowY: n.style.overflowY,
        overflowX: n.style.overflowX,
      }),
      (dr = n.style.scrollBehavior),
      (ur = {
        position: r.style.position,
        height: r.style.height,
        width: r.style.width,
        boxSizing: r.style.boxSizing,
        overflowY: r.style.overflowY,
        overflowX: r.style.overflowX,
        scrollBehavior: r.style.scrollBehavior,
      }));
    let u = n.scrollHeight > n.clientHeight,
      d = n.scrollWidth > n.clientWidth,
      f = t.overflowY === `scroll` || c.overflowY === `scroll`,
      p = t.overflowX === `scroll` || c.overflowX === `scroll`,
      m = Math.max(0, i.innerWidth - r.clientWidth),
      h = Math.max(0, i.innerHeight - r.clientHeight),
      g = parseFloat(c.marginTop) + parseFloat(c.marginBottom),
      _ = parseFloat(c.marginLeft) + parseFloat(c.marginRight),
      v = jn(n) ? n : r;
    if (((s = pr(e)), s)) {
      ((n.style.scrollbarGutter = l),
        (v.style.overflowY = `hidden`),
        (v.style.overflowX = `hidden`));
      return;
    }
    (Object.assign(n.style, {
      scrollbarGutter: l,
      overflowY: `hidden`,
      overflowX: `hidden`,
    }),
      (u || f) && (n.style.overflowY = `scroll`),
      (d || p) && (n.style.overflowX = `scroll`),
      Object.assign(r.style, {
        position: `relative`,
        height: g || h ? `calc(100dvh - ${g + h}px)` : `100dvh`,
        width: _ || m ? `calc(100vw - ${_ + m}px)` : `100vw`,
        boxSizing: `border-box`,
        overflow: `hidden`,
        scrollBehavior: `unset`,
      }),
      (r.scrollTop = a),
      (r.scrollLeft = o),
      n.setAttribute(`data-base-ui-scroll-locked`, ``),
      (n.style.scrollBehavior = `unset`));
  }
  function u() {
    (Object.assign(n.style, lr),
      Object.assign(r.style, ur),
      s ||
        ((n.scrollTop = a),
        (n.scrollLeft = o),
        n.removeAttribute(`data-base-ui-scroll-locked`),
        (n.style.scrollBehavior = dr)));
  }
  function d() {
    (u(), c.request(l));
  }
  l();
  let f = R(i, `resize`, d);
  return () => {
    (c.cancel(), u(), typeof i.removeEventListener == `function` && f());
  };
}
var gr = new (class {
  lockCount = 0;
  restore = null;
  timeoutLock = b.create();
  timeoutUnlock = b.create();
  acquire(e) {
    return (
      (this.lockCount += 1),
      this.lockCount === 1 &&
        this.restore === null &&
        this.timeoutLock.start(0, () => this.lock(e)),
      this.release
    );
  }
  release = () => {
    (--this.lockCount,
      this.lockCount === 0 &&
        this.restore &&
        this.timeoutUnlock.start(0, this.unlock));
  };
  unlock = () => {
    this.lockCount === 0 &&
      this.restore &&
      (this.restore?.(), (this.restore = null));
  };
  lock(e) {
    if (this.lockCount === 0 || this.restore !== null) return;
    let t = cr(e).documentElement,
      n = Tn(t).getComputedStyle(t).overflowY;
    if (n === `hidden` || n === `clip`) {
      this.restore = h;
      return;
    }
    let r = $n || !fr(e);
    this.restore = r ? mr(e) : hr(e);
  }
})();
function _r(e = !0, t = null) {
  s(() => {
    if (e) return gr.acquire(t);
  }, [e, t]);
}
function vr(e) {
  (e.preventDefault(), e.stopPropagation());
}
function yr(e) {
  return `nativeEvent` in e;
}
function br(e) {
  return e.pointerType === `` && e.isTrusted
    ? !0
    : nr && e.pointerType
      ? e.type === `click` && e.buttons === 1
      : e.detail === 0 && !e.pointerType;
}
function xr(e) {
  return ir
    ? !1
    : (!nr && e.width === 0 && e.height === 0) ||
        (nr &&
          e.width === 1 &&
          e.height === 1 &&
          e.pressure === 0 &&
          e.detail === 0 &&
          e.pointerType === `mouse`) ||
        (e.width < 1 &&
          e.height < 1 &&
          e.pressure === 0 &&
          e.detail === 0 &&
          e.pointerType === `touch`);
}
function Sr(e, t) {
  let n = [`mouse`, `pen`];
  return (t || n.push(``, void 0), n.includes(e));
}
function Cr(e) {
  let t = e.type;
  return t === `click` || t === `mousedown` || t === `keydown` || t === `keyup`;
}
var wr = `data-base-ui-focusable`,
  Tr = `input:not([type='hidden']):not([disabled]),[contenteditable]:not([contenteditable='false']),textarea:not([disabled])`,
  Er = `ArrowLeft`,
  Dr = `ArrowRight`,
  Or = `ArrowUp`,
  kr = `ArrowDown`;
function Ar(e) {
  let t = e.activeElement;
  for (; t?.shadowRoot?.activeElement != null; ) t = t.shadowRoot.activeElement;
  return t;
}
function z(e, t) {
  if (!e || !t) return !1;
  let n = t.getRootNode?.();
  if (e.contains(t)) return !0;
  if (n && An(n)) {
    let n = t;
    for (; n; ) {
      if (e === n) return !0;
      n = n.parentNode || n.host;
    }
  }
  return !1;
}
function jr(e) {
  return `composedPath` in e ? e.composedPath()[0] : e.target;
}
function Mr(e, t) {
  if (!On(e)) return !1;
  let n = e;
  if (t.hasElement(n)) return !n.hasAttribute(`data-trigger-disabled`);
  for (let [, e] of t.entries())
    if (z(e, n)) return !e.hasAttribute(`data-trigger-disabled`);
  return !1;
}
function Nr(e, t) {
  if (t == null) return !1;
  if (`composedPath` in e) return e.composedPath().includes(t);
  let n = e;
  return n.target != null && t.contains(n.target);
}
function Pr(e) {
  return e.matches(`html,body`);
}
function Fr(e) {
  return (
    kn(e) &&
    e.matches(
      `input:not([type='hidden']):not([disabled]),[contenteditable]:not([contenteditable='false']),textarea:not([disabled])`,
    )
  );
}
function Ir(e) {
  return (
    e?.closest(
      `button,a[href],[role="button"],select,[tabindex]:not([tabindex="-1"]),${Tr}`,
    ) != null
  );
}
function Lr(e) {
  return e ? e.getAttribute(`role`) === `combobox` && Fr(e) : !1;
}
function Rr(e) {
  if (!e || ir) return !0;
  try {
    return e.matches(`:focus-visible`);
  } catch {
    return !0;
  }
}
function zr(e) {
  return e
    ? e.hasAttribute(`data-base-ui-focusable`)
      ? e
      : e.querySelector(`[data-base-ui-focusable]`) || e
    : null;
}
var Br = `none`,
  Vr = `trigger-press`,
  Hr = `trigger-hover`,
  Ur = `trigger-focus`,
  Wr = `outside-press`,
  Gr = `item-press`,
  Kr = `close-press`,
  qr = `clear-press`,
  Jr = `chip-remove-press`,
  Yr = `input-change`,
  Xr = `input-clear`,
  Zr = `input-press`,
  Qr = `focus-out`,
  $r = `escape-key`,
  ei = `list-navigation`,
  ti = `cancel-open`,
  ni = `sibling-open`,
  ri = `imperative-action`,
  ii = `window-resize`;
function ai(e, t, n, r) {
  let i = !1,
    a = !1,
    o = r ?? u;
  return {
    reason: e,
    event: t ?? new Event(`base-ui`),
    cancel() {
      i = !0;
    },
    allowPropagation() {
      a = !0;
    },
    get isCanceled() {
      return i;
    },
    get isPropagationAllowed() {
      return a;
    },
    trigger: n,
    ...o,
  };
}
function oi(e, t, n) {
  let r = n ?? u;
  return { reason: e, event: t ?? new Event(`base-ui`), ...r };
}
function si(...e) {
  return () => {
    for (let t = 0; t < e.length; t += 1) {
      let n = e[t];
      n && n();
    }
  };
}
function ci(e) {
  let t = x(li, e).current;
  return ((t.next = e), s(t.effect), t);
}
function li(e) {
  let t = {
    current: e,
    next: e,
    effect: () => {
      t.current = t.next;
    },
  };
  return t;
}
var ui = {
    clipPath: `inset(50%)`,
    overflow: `hidden`,
    whiteSpace: `nowrap`,
    border: 0,
    padding: 0,
    width: 1,
    height: 1,
    margin: -1,
  },
  di = { ...ui, position: `fixed`, top: 0, left: 0 },
  fi = { ...ui, position: `absolute` },
  pi = F.forwardRef(function (e, t) {
    let [n, r] = F.useState();
    s(() => {
      tr && r(`button`);
    }, []);
    let i = { tabIndex: 0, role: n };
    return (0, L.jsx)(`span`, {
      ...e,
      ref: t,
      style: di,
      "aria-hidden": n ? void 0 : !0,
      ...i,
      "data-base-ui-focus-guard": ``,
    });
  }),
  mi = [`top`, `right`, `bottom`, `left`],
  hi = Math.min,
  gi = Math.max,
  _i = Math.round,
  vi = Math.floor,
  yi = (e) => ({ x: e, y: e }),
  bi = { left: `right`, right: `left`, bottom: `top`, top: `bottom` };
function xi(e, t, n) {
  return gi(e, hi(t, n));
}
function Si(e, t) {
  return typeof e == `function` ? e(t) : e;
}
function Ci(e) {
  return e.split(`-`)[0];
}
function wi(e) {
  return e.split(`-`)[1];
}
function Ti(e) {
  return e === `x` ? `y` : `x`;
}
function Ei(e) {
  return e === `y` ? `height` : `width`;
}
function Di(e) {
  let t = e[0];
  return t === `t` || t === `b` ? `y` : `x`;
}
function Oi(e) {
  return Ti(Di(e));
}
function ki(e, t, n) {
  n === void 0 && (n = !1);
  let r = wi(e),
    i = Oi(e),
    a = Ei(i),
    o =
      i === `x`
        ? r === (n ? `end` : `start`)
          ? `right`
          : `left`
        : r === `start`
          ? `bottom`
          : `top`;
  return (t.reference[a] > t.floating[a] && (o = Ii(o)), [o, Ii(o)]);
}
function Ai(e) {
  let t = Ii(e);
  return [ji(e), t, ji(t)];
}
function ji(e) {
  return e.includes(`start`)
    ? e.replace(`start`, `end`)
    : e.replace(`end`, `start`);
}
var Mi = [`left`, `right`],
  B = [`right`, `left`],
  V = [`top`, `bottom`],
  Ni = [`bottom`, `top`];
function Pi(e, t, n) {
  switch (e) {
    case `top`:
    case `bottom`:
      return n ? (t ? B : Mi) : t ? Mi : B;
    case `left`:
    case `right`:
      return t ? V : Ni;
    default:
      return [];
  }
}
function Fi(e, t, n, r) {
  let i = wi(e),
    a = Pi(Ci(e), n === `start`, r);
  return (
    i && ((a = a.map((e) => e + `-` + i)), t && (a = a.concat(a.map(ji)))),
    a
  );
}
function Ii(e) {
  let t = Ci(e);
  return bi[t] + e.slice(t.length);
}
function Li(e) {
  return { top: 0, right: 0, bottom: 0, left: 0, ...e };
}
function Ri(e) {
  return typeof e == `number`
    ? { top: e, right: e, bottom: e, left: e }
    : Li(e);
}
function zi(e) {
  let { x: t, y: n, width: r, height: i } = e;
  return {
    width: r,
    height: i,
    top: n,
    left: t,
    right: t + r,
    bottom: n + i,
    x: t,
    y: n,
  };
}
function Bi(e, t, n) {
  return Math.floor(e / t) !== n;
}
function Vi(e, t) {
  return t < 0 || t >= e.length;
}
function Hi(e, t) {
  return Wi(e.current, { disabledIndices: t });
}
function Ui(e, t) {
  return Wi(e.current, {
    decrement: !0,
    startingIndex: e.current.length,
    disabledIndices: t,
  });
}
function Wi(
  e,
  {
    startingIndex: t = -1,
    decrement: n = !1,
    disabledIndices: r,
    amount: i = 1,
  } = {},
) {
  let a = t;
  do a += n ? -i : i;
  while (a >= 0 && a <= e.length - 1 && Yi(e, a, r));
  return a;
}
function Gi(
  e,
  {
    event: t,
    orientation: n,
    loopFocus: r,
    onLoop: i,
    rtl: a,
    cols: o,
    disabledIndices: s,
    minIndex: c,
    maxIndex: l,
    prevIndex: u,
    stopEvent: d = !1,
  },
) {
  let f = u,
    p;
  if (
    (t.key === `ArrowUp` ? (p = `up`) : t.key === `ArrowDown` && (p = `down`),
    p)
  ) {
    let n = [],
      a = [],
      m = !1,
      h = 0;
    {
      let t = null,
        r = -1;
      e.forEach((e, i) => {
        if (e == null) return;
        h += 1;
        let o = e.closest(`[role="row"]`);
        (o && (m = !0),
          (o !== t || r === -1) && ((t = o), (r += 1), (n[r] = [])),
          n[r].push(i),
          (a[i] = r));
      });
    }
    let g = !1,
      _ = 0;
    if (m)
      for (let e of n) {
        let t = e.length;
        (t > _ && (_ = t), t !== o && (g = !0));
      }
    let v = g && h < e.length,
      y = _ || o,
      b = (o) => {
        if (!g || u === -1) return;
        let c = a[u];
        if (c == null) return;
        let l = n[c].indexOf(u),
          d = o === `up` ? -1 : 1;
        for (let o = c + d, f = 0; f < n.length; f += 1, o += d) {
          if (o < 0 || o >= n.length) {
            if (!r || v) return;
            if (((o = o < 0 ? n.length - 1 : 0), i)) {
              let e = Math.min(l, n[o].length - 1);
              o = a[i(t, u, n[o][e] ?? n[o][0])] ?? o;
            }
          }
          let c = n[o];
          for (let t = Math.min(l, c.length - 1); t >= 0; --t) {
            let n = c[t];
            if (!Yi(e, n, s)) return n;
          }
        }
      },
      x = (t) => {
        if (!v || u === -1) return;
        let n = u % y,
          i = t === `up` ? -y : y,
          a = l - (l % y),
          o = vi(l / y) + 1;
        for (let t = u - n + i, c = 0; c < o; c += 1, t += i) {
          if (t < 0 || t > l) {
            if (!r) return;
            t = t < 0 ? a : 0;
          }
          let i = Math.min(t + y - 1, l);
          for (let r = Math.min(t + n, i); r >= t; --r)
            if (!Yi(e, r, s)) return r;
        }
      };
    d && vr(t);
    let S = b(p) ?? x(p);
    if (S !== void 0) f = S;
    else if (u === -1) f = p === `up` ? l : c;
    else if (
      ((f = Wi(e, {
        startingIndex: u,
        amount: y,
        decrement: p === `up`,
        disabledIndices: s,
      })),
      r)
    ) {
      if (p === `up` && (u - y < c || f < 0)) {
        let e = u % y,
          n = l % y,
          r = l - (n - e);
        ((f = n === e ? l : n > e ? r : r - y), i && (f = i(t, u, f)));
      }
      p === `down` &&
        u + y > l &&
        ((f = Wi(e, {
          startingIndex: (u % y) - y,
          amount: y,
          disabledIndices: s,
        })),
        i && (f = i(t, u, f)));
    }
    Vi(e, f) && (f = u);
  }
  if (n === `both`) {
    let n = vi(u / o);
    (t.key === (a ? `ArrowLeft` : `ArrowRight`) &&
      (d && vr(t),
      u % o === o - 1
        ? r &&
          ((f = Wi(e, { startingIndex: u - (u % o) - 1, disabledIndices: s })),
          i && (f = i(t, u, f)))
        : ((f = Wi(e, { startingIndex: u, disabledIndices: s })),
          r &&
            Bi(f, o, n) &&
            ((f = Wi(e, {
              startingIndex: u - (u % o) - 1,
              disabledIndices: s,
            })),
            i && (f = i(t, u, f)))),
      Bi(f, o, n) && (f = u)),
      t.key === (a ? `ArrowRight` : `ArrowLeft`) &&
        (d && vr(t),
        u % o === 0
          ? r &&
            ((f = Wi(e, {
              startingIndex: u + (o - (u % o)),
              decrement: !0,
              disabledIndices: s,
            })),
            i && (f = i(t, u, f)))
          : ((f = Wi(e, {
              startingIndex: u,
              decrement: !0,
              disabledIndices: s,
            })),
            r &&
              Bi(f, o, n) &&
              ((f = Wi(e, {
                startingIndex: u + (o - (u % o)),
                decrement: !0,
                disabledIndices: s,
              })),
              i && (f = i(t, u, f)))),
        Bi(f, o, n) && (f = u)));
    let c = vi(l / o) === n;
    Vi(e, f) &&
      (r && c
        ? ((f =
            t.key === (a ? `ArrowRight` : `ArrowLeft`)
              ? l
              : Wi(e, { startingIndex: u - (u % o) - 1, disabledIndices: s })),
          i && (f = i(t, u, f)))
        : (f = u));
  }
  return f;
}
function Ki(e, t, n) {
  let r = [],
    i = 0;
  return (
    e.forEach(({ width: e, height: a }, o) => {
      let s = !1;
      for (n && (i = 0); !s; ) {
        let n = [];
        for (let r = 0; r < e; r += 1)
          for (let e = 0; e < a; e += 1) n.push(i + r + e * t);
        (i % t) + e <= t && n.every((e) => r[e] == null)
          ? (n.forEach((e) => {
              r[e] = o;
            }),
            (s = !0))
          : (i += 1);
      }
    }),
    [...r]
  );
}
function qi(e, t, n, r, i) {
  if (e === -1) return -1;
  let a = n.indexOf(e),
    o = t[e];
  switch (i) {
    case `tl`:
      return a;
    case `tr`:
      return o ? a + o.width - 1 : a;
    case `bl`:
      return o ? a + (o.height - 1) * r : a;
    case `br`:
      return n.lastIndexOf(e);
    default:
      return -1;
  }
}
function Ji(e, t) {
  return t.flatMap((t, n) => (e.includes(t) ? [n] : []));
}
function Yi(e, t, n) {
  if (typeof n == `function` ? n(t) : (n?.includes(t) ?? !1)) return !0;
  let r = e[t];
  return r
    ? Zi(r)
      ? !n &&
        (r.hasAttribute(`disabled`) ||
          r.getAttribute(`aria-disabled`) === `true`)
      : !0
    : !1;
}
function Xi(e) {
  return e.visibility === `hidden` || e.visibility === `collapse`;
}
function Zi(e, t = e ? Hn(e) : null) {
  return !e || !e.isConnected || !t || Xi(t)
    ? !1
    : typeof e.checkVisibility == `function`
      ? e.checkVisibility()
      : t.display !== `none` && t.display !== `contents`;
}
var Qi = `a[href],button,input,select,textarea,summary,details,iframe,object,embed,[tabindex],[contenteditable]:not([contenteditable="false"]),audio[controls],video[controls]`;
function $i(e) {
  let t = e.assignedSlot;
  if (t) return t;
  if (e.parentElement) return e.parentElement;
  let n = e.getRootNode();
  return An(n) ? n.host : null;
}
function ea(e) {
  for (let t of Array.from(e.children)) if (wn(t) === `summary`) return t;
  return null;
}
function ta(e, t) {
  let n = ea(t);
  return !!n && (e === n || z(n, e));
}
function na(e) {
  let t = e ? wn(e) : ``;
  return (
    e != null &&
    e.matches(Qi) &&
    (t !== `summary` ||
      (e.parentElement != null &&
        wn(e.parentElement) === `details` &&
        ea(e.parentElement) === e)) &&
    (t !== `details` || ea(e) == null) &&
    (t !== `input` || e.type !== `hidden`)
  );
}
function ra(e) {
  if (!na(e) || !e.isConnected || e.matches(`:disabled`)) return !1;
  for (let t = e; t; t = $i(t)) {
    let n = t !== e,
      r = wn(t) === `slot`;
    if (
      t.hasAttribute(`inert`) ||
      (n && wn(t) === `details` && !t.open && !ta(e, t)) ||
      t.hasAttribute(`hidden`) ||
      (!r && !ia(t, n))
    )
      return !1;
  }
  return !0;
}
function ia(e, t) {
  let n = Hn(e);
  return t ? n.display !== `none` : Zi(e, n);
}
function aa(e) {
  let t = e.tabIndex;
  if (t < 0) {
    let t = wn(e);
    if (
      t === `details` ||
      t === `audio` ||
      t === `video` ||
      (kn(e) && e.isContentEditable)
    )
      return 0;
  }
  return t;
}
function oa(e) {
  if (wn(e) !== `input`) return null;
  let t = e;
  return t.type === `radio` && t.name !== `` ? t : null;
}
function sa(e, t) {
  let n = oa(e);
  if (!n) return !0;
  let r = t.find((e) => {
    let t = oa(e);
    return t?.name === n.name && t.form === n.form && t.checked;
  });
  return r
    ? r === n
    : t.find((e) => {
        let t = oa(e);
        return t?.name === n.name && t.form === n.form;
      }) === n;
}
function ca(e) {
  if (kn(e) && wn(e) === `slot`) {
    let t = e.assignedElements({ flatten: !0 });
    if (t.length > 0) return t;
  }
  return kn(e) && e.shadowRoot
    ? Array.from(e.shadowRoot.children)
    : Array.from(e.children);
}
function la(e, t) {
  ca(e).forEach((e) => {
    (na(e) && t.push(e), la(e, t));
  });
}
function ua(e, t, n) {
  ca(e).forEach((e) => {
    (kn(e) && e.matches(t) && n.push(e), ua(e, t, n));
  });
}
function da(e) {
  return ra(e) && aa(e) >= 0;
}
function fa(e) {
  let t = [];
  return (la(e, t), t.filter(ra));
}
function pa(e) {
  let t = fa(e);
  return t.filter((e) => aa(e) >= 0 && sa(e, t));
}
function ma(e, t) {
  let n = pa(e),
    r = n.length;
  if (r === 0) return;
  let i = Ar(cr(e)),
    a = n.indexOf(i);
  return n[a === -1 ? (t === 1 ? 0 : r - 1) : a + t];
}
function ha(e) {
  return ma(cr(e).body, 1) || e;
}
function ga(e) {
  return ma(cr(e).body, -1) || e;
}
function _a(e, t) {
  if (!e) return null;
  let n = pa(cr(e).body),
    r = n.length;
  if (r === 0) return null;
  let i = n.indexOf(e);
  return i === -1 ? null : n[(i + t + r) % r];
}
function va(e) {
  return _a(e, 1);
}
function ya(e) {
  return _a(e, -1);
}
function ba(e, t) {
  let n = t || e.currentTarget,
    r = e.relatedTarget;
  return !r || !z(n, r);
}
function xa(e) {
  pa(e).forEach((e) => {
    ((e.dataset.tabindex = e.getAttribute(`tabindex`) || ``),
      e.setAttribute(`tabindex`, `-1`));
  });
}
function Sa(e) {
  let t = [];
  (ua(e, `[data-tabindex]`, t),
    t.forEach((e) => {
      let t = e.dataset.tabindex;
      (delete e.dataset.tabindex,
        t ? e.setAttribute(`tabindex`, t) : e.removeAttribute(`tabindex`));
    }));
}
function Ca(e, t, n = !0) {
  return e
    .filter((e) => e.parentId === t)
    .flatMap((t) => [...(!n || t.context?.open ? [t] : []), ...Ca(e, t.id, n)]);
}
function wa(e, t) {
  let n = [],
    r = e.find((e) => e.id === t)?.parentId;
  for (; r; ) {
    let t = e.find((e) => e.id === r);
    ((r = t?.parentId), t && (n = n.concat(t)));
  }
  return n;
}
function Ta(e) {
  return `data-base-ui-${e}`;
}
var Ea = 0;
function Da(e, t = {}) {
  let { preventScroll: n = !1, sync: r = !1, shouldFocus: i } = t;
  cancelAnimationFrame(Ea);
  function a() {
    (i && !i()) || e?.focus({ preventScroll: n });
  }
  if (r) return (a(), h);
  let o = requestAnimationFrame(a);
  return (
    (Ea = o),
    () => {
      Ea === o && (cancelAnimationFrame(o), (Ea = 0));
    }
  );
}
var Oa = { inert: new WeakMap(), "aria-hidden": new WeakMap() },
  ka = `data-base-ui-inert`,
  Aa = { inert: new WeakSet(), "aria-hidden": new WeakSet() },
  ja = new WeakMap(),
  Ma = 0;
function Na(e) {
  return Aa[e];
}
function Pa(e) {
  return e ? (An(e) ? e.host : Pa(e.parentNode)) : null;
}
var Fa = (e, t) =>
    t
      .map((t) => {
        if (e.contains(t)) return t;
        let n = Pa(t);
        return e.contains(n) ? n : null;
      })
      .filter((e) => e != null),
  Ia = (e) => {
    let t = new Set();
    return (
      e.forEach((e) => {
        let n = e;
        for (; n && !t.has(n); ) (t.add(n), (n = n.parentNode));
      }),
      t
    );
  },
  La = (e, t, n) => {
    let r = [],
      i = (e) => {
        !e ||
          n.has(e) ||
          Array.from(e.children).forEach((e) => {
            wn(e) !== `script` && (t.has(e) ? i(e) : r.push(e));
          });
      };
    return (i(e), r);
  };
function Ra(e, t, n, r, { mark: i = !0, markerIgnoreElements: a = [] }) {
  let o = r ? `inert` : n ? `aria-hidden` : null,
    s = null,
    c = null,
    l = Fa(t, e),
    u = i ? Fa(t, a) : [],
    d = new Set(u),
    f = i ? La(t, Ia(l), new Set(l)).filter((e) => !d.has(e)) : [],
    p = [],
    m = [];
  if (o) {
    let e = Oa[o],
      n = Na(o);
    ((c = n), (s = e));
    let r = Fa(t, Array.from(t.querySelectorAll(`[aria-live]`))),
      i = l.concat(r);
    La(t, Ia(i), new Set(i)).forEach((t) => {
      let r = t.getAttribute(o),
        i = r !== null && r !== `false`,
        a = (e.get(t) || 0) + 1;
      (e.set(t, a),
        p.push(t),
        a === 1 && i && n.add(t),
        i || t.setAttribute(o, o === `inert` ? `` : `true`));
    });
  }
  return (
    i &&
      f.forEach((e) => {
        let t = (ja.get(e) || 0) + 1;
        (ja.set(e, t), m.push(e), t === 1 && e.setAttribute(ka, ``));
      }),
    (Ma += 1),
    () => {
      (s &&
        p.forEach((e) => {
          let t = (s.get(e) || 0) - 1;
          (s.set(e, t),
            t || (!c?.has(e) && o && e.removeAttribute(o), c?.delete(e)));
        }),
        i &&
          m.forEach((e) => {
            let t = (ja.get(e) || 0) - 1;
            (ja.set(e, t), t || e.removeAttribute(ka));
          }),
        --Ma,
        Ma ||
          ((Oa.inert = new WeakMap()),
          (Oa[`aria-hidden`] = new WeakMap()),
          (Aa.inert = new WeakSet()),
          (Aa[`aria-hidden`] = new WeakSet()),
          (ja = new WeakMap())));
    }
  );
}
function za(e, t = {}) {
  let {
      ariaHidden: n = !1,
      inert: r = !1,
      mark: i = !0,
      markerIgnoreElements: a = [],
    } = t,
    o = cr(e[0]).body;
  return Ra(e, o, n, r, { mark: i, markerIgnoreElements: a });
}
var Ba = 0;
function Va(e, t = `mui`) {
  let [n, r] = F.useState(e),
    i = e || n;
  return (
    F.useEffect(() => {
      n ?? ((Ba += 1), r(`${t}-${Ba}`));
    }, [n, t]),
    i
  );
}
var Ha = d.useId;
function Ua(e, t) {
  if (Ha !== void 0) {
    let n = Ha();
    return e ?? (t ? `${t}-${n}` : n);
  }
  return Va(e, t);
}
var Wa = { style: { transition: `none` } },
  Ga = { fallbackAxisSide: `none` },
  Ka = { fallbackAxisSide: `end` },
  qa = { clipPath: `inset(50%)`, position: `fixed`, top: 0, left: 0 },
  Ja = F.createContext(null),
  Ya = () => F.useContext(Ja),
  Xa = Ta(`portal`);
function Za(e = {}) {
  let { ref: t, container: n, componentProps: r = u, elementProps: i } = e,
    a = Ua(),
    o = Ya()?.portalNode,
    [c, l] = F.useState(null),
    [d, f] = F.useState(null),
    m = O((e) => {
      e !== null && f(e);
    }),
    h = F.useRef(null);
  s(() => {
    if (n === null) {
      h.current && ((h.current = null), f(null), l(null));
      return;
    }
    if (a == null) return;
    let e = (n && (Dn(n) ? n : n.current)) ?? o ?? document.body;
    if (e == null) {
      h.current && ((h.current = null), f(null), l(null));
      return;
    }
    h.current !== e && ((h.current = e), f(null), l(e));
  }, [n, o, a]);
  let g = p(`div`, r, { ref: [t, m], props: [{ id: a, [Xa]: `` }, i] });
  return {
    portalNode: d,
    portalSubtree: c && g ? _e.createPortal(g, c) : null,
  };
}
var Qa = F.forwardRef(function (e, t) {
  let {
      render: n,
      className: r,
      style: i,
      children: a,
      container: o,
      renderGuards: s,
      ...c
    } = e,
    { portalNode: l, portalSubtree: u } = Za({
      container: o,
      ref: t,
      componentProps: e,
      elementProps: c,
    }),
    d = F.useRef(null),
    f = F.useRef(null),
    p = F.useRef(null),
    m = F.useRef(null),
    [h, g] = F.useState(null),
    _ = F.useRef(!1),
    v = h?.modal,
    y = h?.open,
    b = typeof s == `boolean` ? s : !!h && !h.modal && h.open && !!l;
  (F.useEffect(() => {
    if (!l || v) return;
    function e(e) {
      l &&
        e.relatedTarget &&
        ba(e) &&
        (e.type === `focusin`
          ? (_.current &&= (Sa(l), !1))
          : (xa(l), (_.current = !0)));
    }
    return si(R(l, `focusin`, e, !0), R(l, `focusout`, e, !0));
  }, [l, v]),
    F.useEffect(() => {
      !l || y !== !1 || (Sa(l), (_.current = !1));
    }, [y, l]));
  let x = F.useMemo(
    () => ({
      beforeOutsideRef: d,
      afterOutsideRef: f,
      beforeInsideRef: p,
      afterInsideRef: m,
      portalNode: l,
      setFocusManagerState: g,
    }),
    [l],
  );
  return (0, L.jsxs)(F.Fragment, {
    children: [
      u,
      (0, L.jsxs)(Ja.Provider, {
        value: x,
        children: [
          b &&
            l &&
            (0, L.jsx)(pi, {
              "data-type": `outside`,
              ref: d,
              onFocus: (e) => {
                ba(e, l)
                  ? p.current?.focus()
                  : ga(h ? h.domReference : null)?.focus();
              },
            }),
          b && l && (0, L.jsx)(`span`, { "aria-owns": l.id, style: qa }),
          l && _e.createPortal(a, l),
          b &&
            l &&
            (0, L.jsx)(pi, {
              "data-type": `outside`,
              ref: f,
              onFocus: (e) => {
                ba(e, l)
                  ? m.current?.focus()
                  : (ha(h ? h.domReference : null)?.focus(),
                    h?.closeOnFocusOut &&
                      h?.onOpenChange(!1, ai(`focus-out`, e.nativeEvent)));
              },
            }),
        ],
      }),
    ],
  });
});
function $a() {
  let e = new Map();
  return {
    emit(t, n) {
      e.get(t)?.forEach((e) => e(n));
    },
    on(t, n) {
      (e.has(t) || e.set(t, new Set()), e.get(t).add(n));
    },
    off(t, n) {
      e.get(t)?.delete(n);
    },
  };
}
var eo = class {
    nodesRef = { current: [] };
    events = $a();
    addNode(e) {
      this.nodesRef.current.push(e);
    }
    removeNode(e) {
      let t = this.nodesRef.current.findIndex((t) => t === e);
      t !== -1 && this.nodesRef.current.splice(t, 1);
    }
  },
  to = F.createContext(null),
  no = F.createContext(null),
  ro = () => F.useContext(to)?.id || null,
  io = (e) => {
    let t = F.useContext(no);
    return e ?? t;
  };
function ao(e) {
  let t = Ua(),
    n = io(e),
    r = ro();
  return (
    s(() => {
      if (!t) return;
      let e = { id: t, parentId: r };
      return (
        n?.addNode(e),
        () => {
          n?.removeNode(e);
        }
      );
    }, [n, t, r]),
    t
  );
}
function oo(e) {
  let { children: t, id: n } = e,
    r = ro();
  return (0, L.jsx)(to.Provider, {
    value: F.useMemo(() => ({ id: n, parentId: r }), [n, r]),
    children: t,
  });
}
function so(e) {
  let { children: t, externalTree: n } = e,
    r = x(() => n ?? new eo()).current;
  return (0, L.jsx)(no.Provider, { value: r, children: t });
}
function co(e, t) {
  let n = Tn(jr(e));
  return e instanceof n.KeyboardEvent
    ? `keyboard`
    : e instanceof n.FocusEvent
      ? t || `keyboard`
      : `pointerType` in e
        ? e.pointerType || `keyboard`
        : `touches` in e
          ? `touch`
          : e instanceof n.MouseEvent
            ? t || (e.detail === 0 ? `keyboard` : `mouse`)
            : ``;
}
var lo = 20,
  uo = [];
function H() {
  uo = uo.filter((e) => e.deref()?.isConnected);
}
function U(e) {
  (H(),
    e &&
      wn(e) !== `body` &&
      (uo.push(new WeakRef(e)), uo.length > lo && (uo = uo.slice(-20))));
}
function fo() {
  return (H(), uo[uo.length - 1]?.deref());
}
function po(e) {
  return e ? (da(e) ? e : pa(e)[0] || e) : null;
}
function mo(e, t) {
  if (
    (e.hasAttribute(`tabindex`) && !e.hasAttribute(`data-tabindex`)) ||
    (!t.current.includes(`floating`) &&
      !e.getAttribute(`role`)?.includes(`dialog`))
  )
    return;
  let n = fa(e).filter((e) => {
      let t = e.getAttribute(`data-tabindex`) || ``;
      return da(e) || (e.hasAttribute(`data-tabindex`) && !t.startsWith(`-`));
    }),
    r = e.getAttribute(`tabindex`);
  t.current.includes(`floating`) || n.length === 0
    ? r !== `0` && e.setAttribute(`tabindex`, `0`)
    : (r !== `-1` ||
        (e.hasAttribute(`data-tabindex`) &&
          e.getAttribute(`data-tabindex`) !== `-1`)) &&
      (e.setAttribute(`tabindex`, `-1`), e.setAttribute(`data-tabindex`, `-1`));
}
function ho(e) {
  let {
      context: n,
      children: i,
      disabled: a = !1,
      initialFocus: o = !0,
      returnFocus: l = !0,
      restoreFocus: u = !1,
      modal: d = !0,
      closeOnFocusOut: p = !0,
      openInteractionType: m = ``,
      nextFocusableElement: h,
      previousFocusableElement: g,
      beforeContentFocusGuardRef: _,
      externalTree: v,
      getInsideElements: y,
    } = e,
    b = `rootStore` in n ? n.rootStore : n,
    x = b.useState(`open`),
    S = b.useState(`domReferenceElement`),
    C = b.useState(`floatingElement`),
    { events: w, dataRef: T } = b.context,
    E = O(() => T.current.floatingContext?.nodeId),
    ee = o === !1,
    D = Lr(S) && ee,
    te = F.useRef([`content`]),
    ne = ci(o),
    re = ci(l),
    ie = ci(m),
    k = io(v),
    A = Ya(),
    j = F.useRef(!1),
    ae = F.useRef(!1),
    oe = F.useRef(!1),
    se = F.useRef(null),
    M = F.useRef(``),
    N = F.useRef(``),
    ce = F.useRef(null),
    le = F.useRef(null),
    ue = f(ce, _, A?.beforeInsideRef),
    de = f(le, A?.afterInsideRef),
    fe = c(),
    pe = c(),
    me = t(),
    he = A != null,
    P = zr(C),
    ge = O((e = P) => (e ? pa(e) : [])),
    _e = O(() => y?.().filter((e) => e != null) ?? []);
  (F.useEffect(() => {
    if (a || !d) return;
    function e(e) {
      e.key === `Tab` && z(P, Ar(cr(P))) && ge().length === 0 && !D && vr(e);
    }
    return R(cr(P), `keydown`, e);
  }, [a, P, d, D, ge]),
    F.useEffect(() => {
      if (a || !x) return;
      let e = cr(P);
      function t() {
        oe.current = !1;
      }
      function n(e) {
        let t = jr(e),
          n = _e();
        ((oe.current = !(
          z(C, t) ||
          z(S, t) ||
          z(A?.portalNode, t) ||
          n.some((e) => e === t || z(e, t))
        )),
          (N.current = e.pointerType || `keyboard`),
          t?.closest(`[data-base-ui-click-trigger]`) && (ae.current = !0));
      }
      function r() {
        N.current = `keyboard`;
      }
      return si(
        R(e, `pointerdown`, n, !0),
        R(e, `pointerup`, t, !0),
        R(e, `pointercancel`, t, !0),
        R(e, `keydown`, r, !0),
      );
    }, [a, C, S, P, x, A, _e]),
    F.useEffect(() => {
      if (a || !p) return;
      let e = cr(P);
      function t() {
        ((ae.current = !0),
          pe.start(0, () => {
            ae.current = !1;
          }));
      }
      function n(e) {
        let t = jr(e);
        da(t) && (se.current = t);
      }
      function i(t) {
        let n = t.relatedTarget,
          i = t.currentTarget,
          a = jr(t);
        queueMicrotask(() => {
          let o = E(),
            s = b.context.triggerElements,
            c = _e(),
            l =
              n?.hasAttribute(Ta(`focus-guard`)) &&
              [
                ce.current,
                le.current,
                A?.beforeInsideRef.current,
                A?.afterInsideRef.current,
                A?.beforeOutsideRef.current,
                A?.afterOutsideRef.current,
                r(g),
                r(h),
              ].includes(n),
            f = !(
              z(S, n) ||
              z(C, n) ||
              z(n, C) ||
              z(A?.portalNode, n) ||
              c.some((e) => e === n || z(e, n)) ||
              (n != null && s.hasElement(n)) ||
              s.hasMatchingElement((e) => z(e, n)) ||
              l ||
              (k &&
                (Ca(k.nodesRef.current, o).find(
                  (e) =>
                    z(e.context?.elements.floating, n) ||
                    z(e.context?.elements.domReference, n),
                ) ||
                  wa(k.nodesRef.current, o).find(
                    (e) =>
                      [
                        e.context?.elements.floating,
                        zr(e.context?.elements.floating),
                      ].includes(n) || e.context?.elements.domReference === n,
                  )))
            );
          if (
            (i === S && P && mo(P, te),
            u && i !== S && !Zi(a) && Ar(e) === e.body)
          ) {
            if (kn(P) && (P.focus(), u === `popup`)) {
              me.request(() => {
                P.focus();
              });
              return;
            }
            let e = ge(),
              t = se.current,
              n = (t && e.includes(t) ? t : null) || e[e.length - 1] || P;
            kn(n) && n.focus();
          }
          if (T.current.insideReactTree) {
            T.current.insideReactTree = !1;
            return;
          }
          (D || !d) &&
            n &&
            f &&
            !ae.current &&
            (D || n !== fo()) &&
            ((j.current = !0), b.setOpen(!1, ai(Qr, t)));
        });
      }
      function o() {
        oe.current ||
          ((T.current.insideReactTree = !0),
          fe.start(0, () => {
            T.current.insideReactTree = !1;
          }));
      }
      let s = kn(S) ? S : null;
      if (!(!C && !s))
        return si(
          s && R(s, `focusout`, i),
          s && R(s, `pointerdown`, t),
          C && R(C, `focusin`, n),
          C && R(C, `focusout`, i),
          C && A && R(C, `focusout`, o, !0),
        );
    }, [a, S, C, P, d, k, A, b, p, u, ge, D, E, te, T, fe, pe, me, h, g, _e]),
    F.useEffect(() => {
      if (a || !C || !x) return;
      let e = Array.from(
          A?.portalNode?.querySelectorAll(`[${Ta(`portal`)}]`) || [],
        ),
        t = (k ? wa(k.nodesRef.current, E()) : []).find((e) =>
          Lr(e.context?.elements.domReference || null),
        )?.context?.elements.domReference,
        n = za(
          [
            C,
            ...e,
            ce.current,
            le.current,
            A?.beforeOutsideRef.current,
            A?.afterOutsideRef.current,
            ..._e(),
            t,
            r(g),
            r(h),
            D ? S : null,
          ].filter((e) => e != null),
          { ariaHidden: d || D, mark: !1 },
        ),
        i = za([C, ...e].filter((e) => e != null));
      return () => {
        (i(), n());
      };
    }, [x, a, S, C, d, A, D, k, E, h, g, _e]),
    s(() => {
      if (!x || a || !kn(P)) return;
      let e = cr(P),
        t = Ar(e);
      queueMicrotask(() => {
        let n = ne.current,
          i = typeof n == `function` ? n(ie.current || ``) : n;
        if (i === void 0 || i === !1 || z(P, t)) return;
        let a = null,
          o = () => ((a ??= ge(P)), a[0] || P),
          s;
        ((s = i === !0 || i === null ? o() : r(i)), (s ||= o()));
        let c = z(P, Ar(e));
        Da(s, {
          preventScroll: s === P,
          shouldFocus() {
            if (c) return !0;
            let t = Ar(e);
            return !(t !== s && z(P, t));
          },
        });
      });
    }, [a, x, P, ge, ne, ie]),
    s(() => {
      if (a || !P) return;
      let e = cr(P);
      U(Ar(e));
      function t(e) {
        if (
          (e.open || (M.current = co(e.nativeEvent, N.current)),
          e.reason === `trigger-hover` &&
            e.nativeEvent.type === `mouseleave` &&
            (j.current = !0),
          e.reason === `outside-press`)
        )
          if (e.nested) j.current = !1;
          else if (br(e.nativeEvent) || xr(e.nativeEvent)) j.current = !1;
          else {
            let e = !1;
            (cr(P)
              .createElement(`div`)
              .focus({
                get preventScroll() {
                  return ((e = !0), !1);
                },
              }),
              e ? (j.current = !1) : (j.current = !0));
          }
      }
      w.on(`openchange`, t);
      function n() {
        let e = re.current,
          t = typeof e == `function` ? e(M.current) : e;
        if (t === void 0 || t === !1) return null;
        if ((t === null && (t = !0), typeof t == `boolean`))
          return S?.isConnected ? S : fo() || null;
        let n = S?.isConnected ? S : fo();
        return r(t) || n || null;
      }
      return () => {
        w.off(`openchange`, t);
        let r = Ar(e),
          i = _e(),
          a =
            z(C, r) ||
            i.some((e) => e === r || z(e, r)) ||
            (k &&
              Ca(k.nodesRef.current, E(), !1).some((e) =>
                z(e.context?.elements.floating, r),
              )),
          o = re.current,
          s = n();
        queueMicrotask(() => {
          let t = po(s),
            n = typeof o != `boolean`;
          (o &&
            !j.current &&
            kn(t) &&
            (!(!n && t !== r && r !== e.body) || a) &&
            t.focus({ preventScroll: !0 }),
            (j.current = !1));
        });
      };
    }, [a, C, P, re, w, k, S, E, _e]),
    s(() => {
      if (!Qn || x || !C) return;
      let e = Ar(cr(C));
      !kn(e) || !Fr(e) || (z(C, e) && e.blur());
    }, [x, C]),
    s(() => {
      if (!(a || !A))
        return (
          A.setFocusManagerState({
            modal: d,
            closeOnFocusOut: p,
            open: x,
            onOpenChange: b.setOpen,
            domReference: S,
          }),
          () => {
            A.setFocusManagerState(null);
          }
        );
    }, [a, A, d, x, b, p, S]),
    s(() => {
      if (!(a || !P))
        return (
          mo(P, te),
          () => {
            queueMicrotask(H);
          }
        );
    }, [a, P, te]));
  let ve = !a && (d ? !D : !0) && (he || d);
  return (0, L.jsxs)(F.Fragment, {
    children: [
      ve &&
        (0, L.jsx)(pi, {
          "data-type": `inside`,
          ref: ue,
          onFocus: (e) => {
            if (d) {
              let e = ge();
              Da(e[e.length - 1]);
            } else
              A?.portalNode &&
                ((j.current = !1),
                ba(e, A.portalNode)
                  ? ha(S)?.focus()
                  : r(g ?? A.beforeOutsideRef)?.focus());
          },
        }),
      i,
      ve &&
        (0, L.jsx)(pi, {
          "data-type": `inside`,
          ref: de,
          onFocus: (e) => {
            d
              ? Da(ge()[0])
              : A?.portalNode &&
                (p && (j.current = !0),
                ba(e, A.portalNode)
                  ? ga(S)?.focus()
                  : r(h ?? A.afterOutsideRef)?.focus());
          },
        }),
    ],
  });
}
var go = { intentional: `onClick`, sloppy: `onPointerDown` };
function _o() {
  return !1;
}
function vo(e) {
  return {
    escapeKey: typeof e == `boolean` ? e : (e?.escapeKey ?? !1),
    outsidePress: typeof e == `boolean` ? e : (e?.outsidePress ?? !0),
  };
}
function yo(e, t = {}) {
  let {
      enabled: n = !0,
      escapeKey: r = !0,
      outsidePress: i = !0,
      outsidePressEvent: a = `sloppy`,
      referencePress: o = _o,
      referencePressEvent: s = `sloppy`,
      bubbles: l,
      externalTree: u,
    } = t,
    d = `rootStore` in e ? e.rootStore : e,
    f = d.useState(`open`),
    p = d.useState(`floatingElement`),
    { dataRef: m } = d.context,
    h = io(u),
    g = O(typeof i == `function` ? i : () => !1),
    _ = typeof i == `function` ? g : i,
    v = _ !== !1,
    y = O(() => a),
    { escapeKey: x, outsidePress: S } = vo(l),
    C = F.useRef(!1),
    w = F.useRef(!1),
    T = F.useRef(!1),
    E = F.useRef(!1),
    ee = F.useRef(``),
    D = F.useRef(null),
    te = c(),
    ne = c(),
    re = O(() => {
      (ne.clear(), (m.current.insideReactTree = !1));
    }),
    ie = O((e) => {
      let t = m.current.floatingContext?.nodeId;
      return (h ? Ca(h.nodesRef.current, t) : []).some(
        (t) => t.context?.open && !t.context.dataRef.current[e],
      );
    }),
    k = O(
      (e) =>
        Nr(e, d.select(`floatingElement`)) ||
        Nr(e, d.select(`domReferenceElement`)),
    ),
    A = O((e) => {
      o() && d.setOpen(!1, ai(Vr, e.nativeEvent));
    }),
    j = O((e) => {
      if (
        !f ||
        !n ||
        !r ||
        e.key !== `Escape` ||
        E.current ||
        (!x && ie(`__escapeKeyBubbles`))
      )
        return;
      let t = ai($r, yr(e) ? e.nativeEvent : e);
      (d.setOpen(!1, t),
        t.isCanceled || e.preventDefault(),
        !x && !t.isPropagationAllowed && e.stopPropagation());
    }),
    ae = O(() => {
      ((m.current.insideReactTree = !0), ne.start(0, re));
    }),
    oe = O((e) => {
      if (!f || !n || e.button !== 0) return;
      let t = jr(e.nativeEvent);
      z(d.select(`floatingElement`), t) &&
        (C.current || ((C.current = !0), (w.current = !1)));
    }),
    se = O((e) => {
      !f ||
        !n ||
        ((e.defaultPrevented || e.nativeEvent.defaultPrevented) &&
          C.current &&
          (w.current = !0));
    });
  (F.useEffect(() => {
    if (!f || !n) return;
    ((m.current.__escapeKeyBubbles = x), (m.current.__outsidePressBubbles = S));
    let e = new b(),
      t = new b();
    function i() {
      (e.clear(), (E.current = !0));
    }
    function a() {
      e.start(Bn() ? 5 : 0, () => {
        E.current = !1;
      });
    }
    function o() {
      ((T.current = !0),
        t.start(0, () => {
          T.current = !1;
        }));
    }
    function s() {
      ((C.current = !1), (w.current = !1));
    }
    function c() {
      let e = ee.current,
        t = e === `pen` || !e ? `mouse` : e,
        n = y(),
        r = typeof n == `function` ? n() : n;
      return typeof r == `string` ? r : r[t];
    }
    function l(e) {
      let t = c();
      return (
        (t === `intentional` && e.type !== `click`) ||
        (t === `sloppy` && e.type === `click`)
      );
    }
    function u(e) {
      let t = m.current.floatingContext?.nodeId,
        n =
          h &&
          Ca(h.nodesRef.current, t).some((t) =>
            Nr(e, t.context?.elements.floating),
          );
      return k(e) || n;
    }
    function g(e) {
      if (l(e)) {
        (e.type !== `click` && !k(e) && (t.clear(), (T.current = !1)), re());
        return;
      }
      if (m.current.insideReactTree) {
        re();
        return;
      }
      let n = jr(e),
        r = `[${Ta(`inert`)}]`,
        i = On(n) ? n.getRootNode() : null,
        a = Array.from(
          (An(i) ? i : cr(d.select(`floatingElement`))).querySelectorAll(r),
        ),
        o = d.context.triggerElements;
      if (n && (o.hasElement(n) || o.hasMatchingElement((e) => z(e, n))))
        return;
      let s = On(n) ? n : null;
      for (; s && !Vn(s); ) {
        let e = Wn(s);
        if (Vn(e) || !On(e)) break;
        s = e;
      }
      if (
        !(
          a.length &&
          On(n) &&
          !Pr(n) &&
          !z(n, d.select(`floatingElement`)) &&
          a.every((e) => !z(s, e))
        )
      ) {
        if (kn(n) && !(`touches` in e)) {
          let t = Vn(n),
            r = Hn(n),
            i = /auto|scroll/,
            a = t || i.test(r.overflowX),
            o = t || i.test(r.overflowY),
            s = a && n.clientWidth > 0 && n.scrollWidth > n.clientWidth,
            c = o && n.clientHeight > 0 && n.scrollHeight > n.clientHeight,
            l = r.direction === `rtl`,
            u =
              c &&
              (l
                ? e.offsetX <= n.offsetWidth - n.clientWidth
                : e.offsetX > n.clientWidth),
            d = s && e.offsetY > n.clientHeight;
          if (u || d) return;
        }
        if (!u(e)) {
          if (c() === `intentional` && T.current) {
            (t.clear(), (T.current = !1));
            return;
          }
          (typeof _ == `function` && !_(e)) ||
            ie(`__outsidePressBubbles`) ||
            (d.setOpen(!1, ai(Wr, e)), re());
        }
      }
    }
    function ne(e) {
      c() !== `sloppy` ||
        e.pointerType === `touch` ||
        !d.select(`open`) ||
        !n ||
        k(e) ||
        g(e);
    }
    function O(e) {
      if (c() !== `sloppy` || !d.select(`open`) || !n || k(e)) return;
      let t = e.touches[0];
      t &&
        ((D.current = {
          startTime: Date.now(),
          startX: t.clientX,
          startY: t.clientY,
          dismissOnTouchEnd: !1,
          dismissOnMouseDown: !0,
        }),
        te.start(1e3, () => {
          D.current &&
            ((D.current.dismissOnTouchEnd = !1),
            (D.current.dismissOnMouseDown = !1));
        }));
    }
    function A(e, t) {
      let n = jr(e);
      if (!n) return;
      let r = R(n, e.type, () => {
        (t(e), r());
      });
    }
    function ae(e) {
      ((ee.current = `touch`), A(e, O));
    }
    function oe(e) {
      (te.clear(),
        e.type === `pointerdown` && (ee.current = e.pointerType),
        !(
          e.type === `mousedown` &&
          D.current &&
          !D.current.dismissOnMouseDown
        ) &&
          A(e, (e) => {
            e.type === `pointerdown` ? ne(e) : g(e);
          }));
    }
    function se(e) {
      if (!C.current) return;
      let n = w.current;
      if ((s(), c() === `intentional`)) {
        if (e.type === `pointercancel`) {
          n && o();
          return;
        }
        if (!u(e)) {
          if (n) {
            o();
            return;
          }
          (typeof _ == `function` && !_(e)) ||
            (t.clear(), (T.current = !0), re());
        }
      }
    }
    function M(e) {
      if (c() !== `sloppy` || !D.current || k(e)) return;
      let t = e.touches[0];
      if (!t) return;
      let n = Math.abs(t.clientX - D.current.startX),
        r = Math.abs(t.clientY - D.current.startY),
        i = Math.sqrt(n * n + r * r);
      (i > 5 && (D.current.dismissOnTouchEnd = !0),
        i > 10 && (g(e), te.clear(), (D.current = null)));
    }
    function N(e) {
      A(e, M);
    }
    function ce(e) {
      c() !== `sloppy` ||
        !D.current ||
        k(e) ||
        (D.current.dismissOnTouchEnd && g(e), te.clear(), (D.current = null));
    }
    function le(e) {
      A(e, ce);
    }
    let ue = cr(p),
      de = si(
        r &&
          si(
            R(ue, `keydown`, j),
            R(ue, `compositionstart`, i),
            R(ue, `compositionend`, a),
          ),
        v &&
          si(
            R(ue, `click`, oe, !0),
            R(ue, `pointerdown`, oe, !0),
            R(ue, `pointerup`, se, !0),
            R(ue, `pointercancel`, se, !0),
            R(ue, `mousedown`, oe, !0),
            R(ue, `mouseup`, se, !0),
            R(ue, `touchstart`, ae, !0),
            R(ue, `touchmove`, N, !0),
            R(ue, `touchend`, le, !0),
          ),
      );
    return () => {
      (de(), e.clear(), t.clear(), s(), (T.current = !1));
    };
  }, [m, p, r, v, _, f, n, x, S, j, re, y, ie, k, h, d, te]),
    F.useEffect(re, [_, re]));
  let M = F.useMemo(
      () => ({
        onKeyDown: j,
        [go[s]]: A,
        ...(s !== `intentional` && { onClick: A }),
      }),
      [j, A, s],
    ),
    N = F.useMemo(
      () => ({
        onKeyDown: j,
        onPointerDown: se,
        onMouseDown: se,
        onClickCapture: ae,
        onMouseDownCapture(e) {
          (ae(), oe(e));
        },
        onPointerDownCapture(e) {
          (ae(), oe(e));
        },
        onMouseUpCapture: ae,
        onTouchEndCapture: ae,
        onTouchMoveCapture: ae,
      }),
      [j, ae, oe, se],
    );
  return F.useMemo(
    () => (n ? { reference: M, floating: N, trigger: M } : {}),
    [n, M, N],
  );
}
var W = (t, n, r, i, a, o, ...s) => {
    if (s.length > 0) throw Error(e(1));
    let c;
    if (t && n && r && i && a && o)
      c = (e, s, c, l) =>
        o(
          t(e, s, c, l),
          n(e, s, c, l),
          r(e, s, c, l),
          i(e, s, c, l),
          a(e, s, c, l),
          s,
          c,
          l,
        );
    else if (t && n && r && i && a)
      c = (e, o, s, c) =>
        a(t(e, o, s, c), n(e, o, s, c), r(e, o, s, c), i(e, o, s, c), o, s, c);
    else if (t && n && r && i)
      c = (e, a, o, s) =>
        i(t(e, a, o, s), n(e, a, o, s), r(e, a, o, s), a, o, s);
    else if (t && n && r)
      c = (e, i, a, o) => r(t(e, i, a, o), n(e, i, a, o), i, a, o);
    else if (t && n) c = (e, r, i, a) => n(t(e, r, i, a), r, i, a);
    else if (t) c = t;
    else throw Error(`Missing arguments`);
    return c;
  },
  bo = y((e) => {
    var t = ue(),
      n = T();
    function r(e, t) {
      return (e === t && (e !== 0 || 1 / e == 1 / t)) || (e !== e && t !== t);
    }
    var i = typeof Object.is == `function` ? Object.is : r,
      a = n.useSyncExternalStore,
      o = t.useRef,
      s = t.useEffect,
      c = t.useMemo,
      l = t.useDebugValue;
    e.useSyncExternalStoreWithSelector = function (e, t, n, r, u) {
      var d = o(null);
      if (d.current === null) {
        var f = { hasValue: !1, value: null };
        d.current = f;
      } else f = d.current;
      d = c(
        function () {
          function e(e) {
            if (!a) {
              if (((a = !0), (o = e), (e = r(e)), u !== void 0 && f.hasValue)) {
                var t = f.value;
                if (u(t, e)) return (s = t);
              }
              return (s = e);
            }
            if (((t = s), i(o, e))) return t;
            var n = r(e);
            return u !== void 0 && u(t, n) ? ((o = e), t) : ((o = e), (s = n));
          }
          var a = !1,
            o,
            s,
            c = n === void 0 ? null : n;
          return [
            function () {
              return e(t());
            },
            c === null
              ? void 0
              : function () {
                  return e(c());
                },
          ];
        },
        [t, n, r, u],
      );
      var p = a(e, d[0], d[1]);
      return (
        s(
          function () {
            ((f.hasValue = !0), (f.value = p));
          },
          [p],
        ),
        l(p),
        p
      );
    };
  }),
  xo = y((e, t) => {
    t.exports = bo();
  }),
  So = [],
  Co = void 0;
function wo() {
  return Co;
}
function To(e) {
  So.push(e);
}
function Eo(e) {
  let t = (t, n) => {
    let r = x(Oo).current,
      i;
    try {
      Co = r;
      for (let e of So) e.before(r);
      i = e(t, n);
      for (let e of So) e.after(r);
      r.didInitialize = !0;
    } finally {
      Co = void 0;
    }
    return i;
  };
  return ((t.displayName = e.displayName || e.name), t);
}
function Do(e) {
  return F.forwardRef(Eo(e));
}
function Oo() {
  return { didInitialize: !1 };
}
var ko = T(),
  Ao = xo(),
  jo = re(19) ? Po : Fo;
function Mo(e, t, n, r, i) {
  return jo(e, t, n, r, i);
}
function No(e, t, n, r, i) {
  let a = F.useCallback(() => t(e.getSnapshot(), n, r, i), [e, t, n, r, i]);
  return (0, ko.useSyncExternalStore)(e.subscribe, a, a);
}
To({
  before(e) {
    ((e.syncIndex = 0),
      e.didInitialize ||
        ((e.syncTick = 1),
        (e.syncHooks = []),
        (e.didChangeStore = !0),
        (e.getSnapshot = () => {
          let t = !1;
          for (let n = 0; n < e.syncHooks.length; n += 1) {
            let r = e.syncHooks[n],
              i = r.selector(r.store.state, r.a1, r.a2, r.a3);
            (r.didChange || !Object.is(r.value, i)) &&
              ((t = !0), (r.value = i), (r.didChange = !1));
          }
          return (t && (e.syncTick += 1), e.syncTick);
        })));
  },
  after(e) {
    e.syncHooks.length > 0 &&
      (e.didChangeStore &&
        ((e.didChangeStore = !1),
        (e.subscribe = (t) => {
          let n = new Set();
          for (let t of e.syncHooks) n.add(t.store);
          let r = [];
          for (let e of n) r.push(e.subscribe(t));
          return () => {
            for (let e of r) e();
          };
        })),
      (0, ko.useSyncExternalStore)(e.subscribe, e.getSnapshot, e.getSnapshot));
  },
});
function Po(e, t, n, r, i) {
  let a = wo();
  if (!a) return No(e, t, n, r, i);
  let o = a.syncIndex;
  a.syncIndex += 1;
  let s;
  return (
    a.didInitialize
      ? ((s = a.syncHooks[o]),
        (s.store !== e ||
          s.selector !== t ||
          !Object.is(s.a1, n) ||
          !Object.is(s.a2, r) ||
          !Object.is(s.a3, i)) &&
          (s.store !== e && (a.didChangeStore = !0),
          (s.store = e),
          (s.selector = t),
          (s.a1 = n),
          (s.a2 = r),
          (s.a3 = i),
          (s.didChange = !0)))
      : ((s = {
          store: e,
          selector: t,
          a1: n,
          a2: r,
          a3: i,
          value: t(e.getSnapshot(), n, r, i),
          didChange: !1,
        }),
        a.syncHooks.push(s)),
    s.value
  );
}
function Fo(e, t, n, r, i) {
  return (0, Ao.useSyncExternalStoreWithSelector)(
    e.subscribe,
    e.getSnapshot,
    e.getSnapshot,
    (e) => t(e, n, r, i),
  );
}
var Io = class {
    constructor(e) {
      ((this.state = e), (this.listeners = new Set()), (this.updateTick = 0));
    }
    subscribe = (e) => (
      this.listeners.add(e),
      () => {
        this.listeners.delete(e);
      }
    );
    getSnapshot = () => this.state;
    setState(e) {
      if (this.state === e) return;
      ((this.state = e), (this.updateTick += 1));
      let t = this.updateTick;
      for (let n of this.listeners) {
        if (t !== this.updateTick) return;
        n(e);
      }
    }
    update(e) {
      for (let t in e)
        if (!Object.is(this.state[t], e[t])) {
          this.setState({ ...this.state, ...e });
          return;
        }
    }
    set(e, t) {
      Object.is(this.state[e], t) || this.setState({ ...this.state, [e]: t });
    }
    notifyAll() {
      let e = { ...this.state };
      this.setState(e);
    }
    use(e, t, n, r) {
      return Mo(this, e, t, n, r);
    }
  },
  Lo = class extends Io {
    constructor(e, t = {}, n) {
      (super(e), (this.context = t), (this.selectors = n));
    }
    useSyncedValue(e, t) {
      F.useDebugValue(e);
      let n = this;
      s(() => {
        n.state[e] !== t && n.set(e, t);
      }, [n, e, t]);
    }
    useSyncedValueWithCleanup(e, t) {
      let n = this;
      s(
        () => (
          n.state[e] !== t && n.set(e, t),
          () => {
            n.set(e, void 0);
          }
        ),
        [n, e, t],
      );
    }
    useSyncedValues(e) {
      let t = this;
      s(() => {
        t.update(e);
      }, [t, ...Object.values(e)]);
    }
    useControlledProp(e, t) {
      F.useDebugValue(e);
      let n = this,
        r = t !== void 0;
      s(() => {
        r && !Object.is(n.state[e], t) && n.setState({ ...n.state, [e]: t });
      }, [n, e, t, r]);
    }
    select(e, t, n, r) {
      let i = this.selectors[e];
      return i(this.state, t, n, r);
    }
    useState(e, t, n, r) {
      return (F.useDebugValue(e), Mo(this, this.selectors[e], t, n, r));
    }
    useContextCallback(e, t) {
      F.useDebugValue(e);
      let n = O(t ?? h);
      this.context[e] = n;
    }
    useStateSetter(e) {
      let t = F.useRef(void 0);
      return (
        t.current === void 0 &&
          (t.current = (t) => {
            this.set(e, t);
          }),
        t.current
      );
    }
    observe(e, t) {
      let n;
      n = typeof e == `function` ? e : this.selectors[e];
      let r = n(this.state);
      return (
        t(r, r, this),
        this.subscribe((e) => {
          let i = n(e);
          if (!Object.is(r, i)) {
            let e = r;
            ((r = i), t(i, e, this));
          }
        })
      );
    }
  },
  Ro = {
    open: W((e) => e.open),
    transitionStatus: W((e) => e.transitionStatus),
    domReferenceElement: W((e) => e.domReferenceElement),
    referenceElement: W((e) => e.positionReference ?? e.referenceElement),
    floatingElement: W((e) => e.floatingElement),
    floatingId: W((e) => e.floatingId),
  },
  zo = class extends Lo {
    constructor(e) {
      let {
        syncOnly: t,
        nested: n,
        onOpenChange: r,
        triggerElements: i,
        ...a
      } = e;
      (super(
        {
          ...a,
          positionReference: a.referenceElement,
          domReferenceElement: a.referenceElement,
        },
        {
          onOpenChange: r,
          dataRef: { current: {} },
          events: $a(),
          nested: n,
          triggerElements: i,
        },
        Ro,
      ),
        (this.syncOnly = t));
    }
    syncOpenEvent = (e, t) => {
      (!e || !this.state.open || (t != null && Cr(t))) &&
        (this.context.dataRef.current.openEvent = e ? t : void 0);
    };
    dispatchOpenChange = (e, t) => {
      this.syncOpenEvent(e, t.event);
      let n = {
        open: e,
        reason: t.reason,
        nativeEvent: t.event,
        nested: this.context.nested,
        triggerElement: t.trigger,
      };
      this.context.events.emit(`openchange`, n);
    };
    setOpen = (e, t) => {
      if (this.syncOnly) {
        this.context.onOpenChange?.(e, t);
        return;
      }
      (this.dispatchOpenChange(e, t), this.context.onOpenChange?.(e, t));
    };
  };
function Bo(e) {
  let {
      popupStore: t,
      treatPopupAsFloatingElement: n = !1,
      floatingRootContext: r,
      floatingId: i,
      nested: a,
      onOpenChange: o,
    } = e,
    c = t.useState(`open`),
    l = t.useState(`activeTriggerElement`),
    u = t.useState(n ? `popupElement` : `positionerElement`),
    d = t.context.triggerElements,
    f = o,
    p = F.useRef(null);
  r === void 0 &&
    p.current === null &&
    (p.current = new zo({
      open: c,
      transitionStatus: void 0,
      referenceElement: l,
      floatingElement: u,
      triggerElements: d,
      onOpenChange: f,
      floatingId: i,
      syncOnly: !0,
      nested: a,
    }));
  let m = r ?? p.current;
  return (
    t.useSyncedValue(`floatingId`, i),
    s(() => {
      let e = {
        open: c,
        floatingId: i,
        referenceElement: l,
        floatingElement: u,
      };
      (On(l) && (e.domReferenceElement = l),
        m.state.positionReference === m.state.referenceElement &&
          (e.positionReference = l),
        m.update(e));
    }, [c, i, l, u, m]),
    (m.context.onOpenChange = f),
    (m.context.nested = a),
    m
  );
}
var Vo = { tabIndex: -1, [wr]: `` };
function Ho(e, t, n = !1) {
  let r = Ua(),
    i = ro() != null,
    a = F.useRef(null);
  e === void 0 && a.current === null && (a.current = t(r, i));
  let o = e ?? a.current;
  return (
    Bo({
      popupStore: o,
      treatPopupAsFloatingElement: n,
      floatingRootContext: o.state.floatingRootContext,
      floatingId: r,
      nested: i,
      onOpenChange: o.setOpen,
    }),
    { store: o, internalStore: a.current }
  );
}
function Uo(e, t) {
  let n = F.useRef(null),
    r = F.useRef(null);
  return F.useCallback(
    (i) => {
      if (e === void 0) return;
      let a = !1;
      if (n.current !== null) {
        let e = n.current,
          i = r.current,
          o = t.context.triggerElements.getById(e);
        (i && o === i && (t.context.triggerElements.delete(e), (a = !0)),
          (n.current = null),
          (r.current = null));
      }
      if (
        (i !== null &&
          ((n.current = e),
          (r.current = i),
          t.context.triggerElements.add(e, i),
          (a = !0)),
        a)
      ) {
        let e = t.context.triggerElements.size;
        t.select(`open`) &&
          t.state.triggerCount !== e &&
          t.set(`triggerCount`, e);
      }
    },
    [t, e],
  );
}
function Wo(e, t, n) {
  let r = n?.id ?? null;
  (r || t) && ((e.activeTriggerId = r), (e.activeTriggerElement = n ?? null));
}
function Go(e, t, n, r) {
  let i = n.useState(`isMountedByTrigger`, e),
    a = Uo(e, n),
    o = O((t) => {
      if ((a(t), !t)) return;
      let i = n.select(`open`),
        o = n.select(`activeTriggerId`);
      if (o === e) {
        n.update({ activeTriggerElement: t, ...(i ? r : null) });
        return;
      }
      o == null &&
        i &&
        n.update({ activeTriggerId: e, activeTriggerElement: t, ...r });
    });
  return (
    s(() => {
      i && n.update({ activeTriggerElement: t.current, ...r });
    }, [i, n, t, ...Object.values(r)]),
    { registerTrigger: o, isMountedByThisTrigger: i }
  );
}
function Ko(e) {
  let t = e.useState(`open`);
  s(() => {
    if (!t) {
      e.state.triggerCount !== 0 && e.set(`triggerCount`, 0);
      return;
    }
    let n = e.context.triggerElements.size,
      r = {};
    if (
      (e.state.triggerCount !== n && (r.triggerCount = n),
      !e.select(`activeTriggerId`) && n === 1)
    ) {
      let t = e.context.triggerElements.entries().next();
      if (!t.done) {
        let [e, n] = t.value;
        ((r.activeTriggerId = e), (r.activeTriggerElement = n));
      }
    }
    (r.triggerCount !== void 0 || r.activeTriggerId !== void 0) && e.update(r);
  }, [t, e, e.useState(`triggerCount`)]);
}
function qo(e, t, n) {
  let { mounted: r, setMounted: a, transitionStatus: o } = i(e);
  t.useSyncedValues({ mounted: r, transitionStatus: o });
  let s = O(() => {
      (a(!1),
        t.update({
          activeTriggerId: null,
          activeTriggerElement: null,
          mounted: !1,
          preventUnmountingOnClose: !1,
        }),
        n?.(),
        t.context.onOpenChangeComplete?.(!1));
    }),
    c = t.useState(`preventUnmountingOnClose`);
  return (
    g({
      enabled: r && !e && !c,
      open: e,
      ref: t.context.popupRef,
      onComplete() {
        e || s();
      },
    }),
    { forceUnmount: s, transitionStatus: o }
  );
}
function Jo(e, t) {
  (e.useSyncedValues(t),
    s(
      () => () => {
        e.update({
          activeTriggerProps: u,
          inactiveTriggerProps: u,
          popupProps: u,
        });
      },
      [e],
    ));
}
function Yo(e, t) {
  (s(() => {
    !t && e.state.openMethod !== null && e.set(`openMethod`, null);
  }, [t, e]),
    s(
      () => () => {
        e.state.openMethod !== null && e.set(`openMethod`, null);
      },
      [e],
    ));
}
var Xo = class {
  constructor() {
    ((this.elementsSet = new Set()), (this.idMap = new Map()));
  }
  add(e, t) {
    let n = this.idMap.get(e);
    n !== t &&
      (n !== void 0 && this.elementsSet.delete(n),
      this.elementsSet.add(t),
      this.idMap.set(e, t));
  }
  delete(e) {
    let t = this.idMap.get(e);
    t && (this.elementsSet.delete(t), this.idMap.delete(e));
  }
  hasElement(e) {
    return this.elementsSet.has(e);
  }
  hasMatchingElement(e) {
    for (let t of this.elementsSet) if (e(t)) return !0;
    return !1;
  }
  getById(e) {
    return this.idMap.get(e);
  }
  entries() {
    return this.idMap.entries();
  }
  elements() {
    return this.elementsSet.values();
  }
  get size() {
    return this.idMap.size;
  }
};
function Zo() {
  return new zo({
    open: !1,
    transitionStatus: void 0,
    floatingElement: null,
    referenceElement: null,
    triggerElements: new Xo(),
    floatingId: void 0,
    syncOnly: !1,
    nested: !1,
    onOpenChange: void 0,
  });
}
function Qo() {
  return {
    open: !1,
    openProp: void 0,
    mounted: !1,
    transitionStatus: void 0,
    floatingRootContext: Zo(),
    floatingId: void 0,
    triggerCount: 0,
    preventUnmountingOnClose: !1,
    payload: void 0,
    activeTriggerId: null,
    activeTriggerElement: null,
    triggerIdProp: void 0,
    popupElement: null,
    positionerElement: null,
    activeTriggerProps: u,
    inactiveTriggerProps: u,
    popupProps: u,
  };
}
function $o(e, t, n = !1) {
  return new zo({
    open: !1,
    transitionStatus: void 0,
    floatingElement: null,
    referenceElement: null,
    triggerElements: e,
    floatingId: t,
    syncOnly: !0,
    nested: n,
    onOpenChange: void 0,
  });
}
var es = W((e) => e.triggerIdProp ?? e.activeTriggerId),
  ts = W((e) => e.openProp ?? e.open),
  ns = W((e) => (e.popupElement?.id ?? e.floatingId) || void 0);
function rs(e, t) {
  return t !== void 0 && ts(e) && es(e) === t;
}
function is(e, t) {
  return rs(e, t)
    ? !0
    : t !== void 0 && ts(e) && es(e) == null && e.triggerCount === 1;
}
var as = {
  open: ts,
  mounted: W((e) => e.mounted),
  transitionStatus: W((e) => e.transitionStatus),
  floatingRootContext: W((e) => e.floatingRootContext),
  triggerCount: W((e) => e.triggerCount),
  preventUnmountingOnClose: W((e) => e.preventUnmountingOnClose),
  payload: W((e) => e.payload),
  activeTriggerId: es,
  activeTriggerElement: W((e) => (e.mounted ? e.activeTriggerElement : null)),
  popupId: ns,
  isTriggerActive: W((e, t) => t !== void 0 && es(e) === t),
  isOpenedByTrigger: W((e, t) => rs(e, t)),
  isMountedByTrigger: W((e, t) => t !== void 0 && es(e) === t && e.mounted),
  triggerProps: W((e, t) =>
    t ? e.activeTriggerProps : e.inactiveTriggerProps,
  ),
  triggerPopupId: W((e, t) => (is(e, t) ? ns(e) : void 0)),
  popupProps: W((e) => e.popupProps),
  popupElement: W((e) => e.popupElement),
  positionerElement: W((e) => e.positionerElement),
};
function os(e) {
  let { store: t, parentContext: n, actionsRef: r, isDrawer: i } = e,
    a = t.useState(`open`);
  (Yo(t, a), Ko(t));
  let { forceUnmount: o } = qo(a, t),
    s = F.useCallback(() => {
      t.setOpen(!1, ai(ri));
    }, [t]);
  return (
    F.useImperativeHandle(r, () => ({ unmount: o, close: s }), [o, s]),
    { parentContext: n, isDrawer: i }
  );
}
function ss({ store: e, dialogRoot: t }) {
  let { parentContext: n, isDrawer: r } = t,
    i = e.useState(`open`),
    a = e.useState(`disablePointerDismissal`),
    s = e.useState(`modal`),
    c = e.useState(`popupElement`),
    l = e.useState(`floatingRootContext`),
    [d, f] = F.useState(0),
    [p, m] = F.useState(0),
    h = d === 0,
    g = yo(l, {
      outsidePressEvent() {
        return e.context.internalBackdropRef.current ||
          e.context.backdropRef.current
          ? `intentional`
          : {
              mouse: s === `trap-focus` ? `sloppy` : `intentional`,
              touch: `sloppy`,
            };
      },
      outsidePress(t) {
        if (
          !e.context.outsidePressEnabledRef.current ||
          (`button` in t && t.button !== 0) ||
          (`touches` in t && t.touches.length !== 1)
        )
          return !1;
        let n = jr(t);
        if (h && !a) {
          let t = n;
          return s &&
            (e.context.internalBackdropRef.current ||
              e.context.backdropRef.current)
            ? e.context.internalBackdropRef.current === t ||
                e.context.backdropRef.current === t ||
                (z(t, c) && !t?.hasAttribute(`data-base-ui-portal`))
            : !0;
        }
        return !1;
      },
      escapeKey: h,
    });
  return (
    _r(i && s === !0, c),
    e.useContextCallback(`onNestedDialogOpen`, (e, t) => {
      (f(e), m(t));
    }),
    e.useContextCallback(`onNestedDialogClose`, () => {
      (f(0), m(0));
    }),
    F.useEffect(
      () => (
        n?.onNestedDialogOpen && i && n.onNestedDialogOpen(d + 1, p + +!!r),
        n?.onNestedDialogClose && !i && n.onNestedDialogClose(),
        () => {
          n?.onNestedDialogClose && i && n.onNestedDialogClose();
        }
      ),
      [r, i, d, p, n],
    ),
    Jo(e, {
      activeTriggerProps: g.reference ?? u,
      inactiveTriggerProps: g.trigger ?? u,
      popupProps: F.useMemo(() => o(Vo, g.floating), [g.floating]),
      nestedOpenDialogCount: d,
      nestedOpenDrawerCount: p,
    }),
    null
  );
}
var cs = F.createContext(!1),
  ls = F.createContext(void 0);
function us(t) {
  let n = F.useContext(ls);
  if (t === !1 && n === void 0) throw Error(e(27));
  return n;
}
var ds = {
    ...as,
    modal: W((e) => e.modal),
    nested: W((e) => e.nested),
    nestedOpenDialogCount: W((e) => e.nestedOpenDialogCount),
    nestedOpenDrawerCount: W((e) => e.nestedOpenDrawerCount),
    disablePointerDismissal: W((e) => e.disablePointerDismissal),
    openMethod: W((e) => e.openMethod),
    descriptionElementId: W((e) => e.descriptionElementId),
    titleElementId: W((e) => e.titleElementId),
    viewportElement: W((e) => e.viewportElement),
    role: W((e) => e.role),
  },
  fs = class e extends Lo {
    constructor(e, t, n = !1) {
      let r = new Xo(),
        i = ps(e);
      ((i.floatingRootContext = $o(r, t, n)),
        super(
          i,
          {
            popupRef: F.createRef(),
            backdropRef: F.createRef(),
            internalBackdropRef: F.createRef(),
            outsidePressEnabledRef: { current: !0 },
            triggerElements: r,
            onOpenChange: void 0,
            onOpenChangeComplete: void 0,
          },
          ds,
        ));
    }
    setOpen = (e, t) => {
      if (
        ((t.preventUnmountOnClose = () => {
          this.set(`preventUnmountingOnClose`, !0);
        }),
        !e &&
          t.trigger == null &&
          this.state.activeTriggerId != null &&
          (t.trigger = this.state.activeTriggerElement ?? void 0),
        this.context.onOpenChange?.(e, t),
        t.isCanceled)
      )
        return;
      this.state.floatingRootContext.dispatchOpenChange(e, t);
      let n = { open: e };
      (Wo(n, e, t.trigger), this.update(n));
    };
    static useStore(t, n) {
      return Ho(t, (t, r) => new e(n, t, r), !0).store;
    }
  };
function ps(e = {}) {
  return {
    ...Qo(),
    modal: !0,
    disablePointerDismissal: !1,
    popupElement: null,
    viewportElement: null,
    descriptionElementId: void 0,
    titleElementId: void 0,
    openMethod: null,
    nested: !1,
    nestedOpenDialogCount: 0,
    nestedOpenDrawerCount: 0,
    role: `dialog`,
    ...e,
  };
}
function ms(e, t = `dialog`) {
  let {
      children: n,
      open: r,
      defaultOpen: i = !1,
      onOpenChange: a,
      onOpenChangeComplete: o,
      disablePointerDismissal: s = !1,
      modal: c = !0,
      actionsRef: l,
      handle: u,
      triggerId: d,
      defaultTriggerId: f = null,
    } = e,
    p = t === `drawer`,
    m = t === `alert-dialog`,
    h = m ? !0 : c,
    g = m || s,
    _ = m ? `alertdialog` : `dialog`,
    v = us(!0),
    y = { modal: h, disablePointerDismissal: g, nested: !!v, role: _ },
    b = fs.useStore(u?.store, {
      open: i,
      openProp: r,
      activeTriggerId: f,
      triggerIdProp: d,
      ...y,
    });
  (Sn(() => {
    let e =
      r === void 0 && b.state.open === !1 && i === !0
        ? { open: !0, activeTriggerId: f }
        : null;
    m ? b.update(e ? { ...y, ...e } : y) : e && b.update(e);
  }),
    b.useControlledProp(`openProp`, r),
    b.useControlledProp(`triggerIdProp`, d),
    b.useSyncedValues(y),
    b.useContextCallback(`onOpenChange`, a),
    b.useContextCallback(`onOpenChangeComplete`, o));
  let x = b.useState(`open`),
    S = b.useState(`mounted`),
    C = b.useState(`payload`),
    w = os({
      store: b,
      actionsRef: l,
      parentContext: v?.store.context,
      isDrawer: p,
    }),
    T = x || S,
    E = F.useMemo(() => ({ store: b }), [b]);
  return (0, L.jsx)(cs.Provider, {
    value: !1,
    children: (0, L.jsxs)(ls.Provider, {
      value: E,
      children: [
        T && (0, L.jsx)(ss, { store: b, dialogRoot: w }),
        typeof n == `function` ? n({ payload: C }) : n,
      ],
    }),
  });
}
function hs(e) {
  return ms(e, `alert-dialog`);
}
var gs = (function (e) {
    return (
      (e.open = `data-open`),
      (e.closed = `data-closed`),
      (e[(e.startingStyle = le.startingStyle)] = `startingStyle`),
      (e[(e.endingStyle = le.endingStyle)] = `endingStyle`),
      (e.anchorHidden = `data-anchor-hidden`),
      (e.side = `data-side`),
      (e.align = `data-align`),
      e
    );
  })({}),
  _s = (function (e) {
    return ((e.popupOpen = `data-popup-open`), (e.pressed = `data-pressed`), e);
  })({}),
  vs = { [_s.popupOpen]: `` },
  ys = { [_s.popupOpen]: ``, [_s.pressed]: `` },
  bs = { [gs.open]: `` },
  xs = { [gs.closed]: `` },
  Ss = { [gs.anchorHidden]: `` },
  Cs = {
    open(e) {
      return e ? vs : null;
    },
  },
  ws = {
    open(e) {
      return e ? ys : null;
    },
  },
  Ts = {
    open(e) {
      return e ? bs : xs;
    },
    anchorHidden(e) {
      return e ? Ss : null;
    },
  },
  Es = { ...Ts, ...v },
  Ds = F.forwardRef(function (e, t) {
    let { render: n, className: r, style: i, forceRender: a = !1, ...o } = e,
      { store: s } = us(),
      c = s.useState(`open`),
      l = s.useState(`nested`),
      u = s.useState(`mounted`);
    return p(`div`, e, {
      state: { open: c, transitionStatus: s.useState(`transitionStatus`) },
      ref: [s.context.backdropRef, t],
      stateAttributesMapping: Es,
      props: [
        {
          role: `presentation`,
          hidden: !u,
          style: { userSelect: `none`, WebkitUserSelect: `none` },
        },
        o,
      ],
      enabled: a || !l,
    });
  }),
  Os = F.createContext(void 0);
function ks(t = !1) {
  let n = F.useContext(Os);
  if (n === void 0 && !t) throw Error(e(16));
  return n;
}
function As(e) {
  let {
      focusableWhenDisabled: t,
      disabled: n,
      composite: r = !1,
      tabIndex: i = 0,
      isNativeButton: a,
    } = e,
    o = r && t !== !1,
    s = r && t === !1;
  return {
    props: F.useMemo(() => {
      let e = {
        onKeyDown(e) {
          n && t && e.key !== `Tab` && e.preventDefault();
        },
      };
      return (
        r || ((e.tabIndex = i), !a && n && (e.tabIndex = t ? i : -1)),
        ((a && (t || o)) || (!a && n)) && (e[`aria-disabled`] = n),
        a && (!t || s) && (e.disabled = n),
        e
      );
    }, [r, n, t, o, s, a, i]),
  };
}
function js(e = {}) {
  let {
      disabled: t = !1,
      focusableWhenDisabled: n,
      tabIndex: r = 0,
      native: i = !0,
      composite: a,
    } = e,
    c = F.useRef(null),
    l = ks(!0),
    u = a ?? l !== void 0,
    { props: d } = As({
      focusableWhenDisabled: n,
      disabled: t,
      composite: u,
      tabIndex: r,
      isNativeButton: i,
    }),
    f = F.useCallback(() => {
      let e = c.current;
      Ms(e) &&
        u &&
        t &&
        d.disabled === void 0 &&
        e.disabled &&
        (e.disabled = !1);
    }, [t, d.disabled, u]);
  return (
    s(f, [f]),
    {
      getButtonProps: F.useCallback(
        (e = {}) => {
          let {
            onClick: n,
            onMouseDown: r,
            onKeyUp: a,
            onKeyDown: s,
            onPointerDown: c,
            ...l
          } = e;
          return o(
            {
              onClick(e) {
                if (t) {
                  e.preventDefault();
                  return;
                }
                n?.(e);
              },
              onMouseDown(e) {
                t || r?.(e);
              },
              onKeyDown(e) {
                if (t || (m(e), s?.(e), e.baseUIHandlerPrevented)) return;
                let r = e.target === e.currentTarget,
                  a = e.currentTarget,
                  o = Ms(a),
                  c = !i && Ns(a),
                  l = r && (i ? o : !c),
                  d = e.key === `Enter`,
                  f = e.key === ` `,
                  p = a.getAttribute(`role`),
                  h =
                    p?.startsWith(`menuitem`) ||
                    p === `option` ||
                    p === `gridcell`;
                if (r && u && f) {
                  if (e.defaultPrevented && h) return;
                  (e.preventDefault(),
                    c || (i && o)
                      ? (a.click(), e.preventBaseUIHandler())
                      : l && (n?.(e), e.preventBaseUIHandler()));
                  return;
                }
                l && (!i && (f || d) && e.preventDefault(), !i && d && n?.(e));
              },
              onKeyUp(e) {
                if (!t) {
                  if (
                    (m(e),
                    a?.(e),
                    e.target === e.currentTarget &&
                      i &&
                      u &&
                      Ms(e.currentTarget) &&
                      e.key === ` `)
                  ) {
                    e.preventDefault();
                    return;
                  }
                  e.baseUIHandlerPrevented ||
                    (e.target === e.currentTarget &&
                      !i &&
                      !u &&
                      e.key === ` ` &&
                      n?.(e));
                }
              },
              onPointerDown(e) {
                if (t) {
                  e.preventDefault();
                  return;
                }
                c?.(e);
              },
            },
            i ? { type: `button` } : { role: `button` },
            d,
            l,
          );
        },
        [t, d, u, i],
      ),
      buttonRef: O((e) => {
        ((c.current = e), f());
      }),
    }
  );
}
function Ms(e) {
  return kn(e) && e.tagName === `BUTTON`;
}
function Ns(e) {
  return !!(e?.tagName === `A` && e?.href);
}
var Ps = F.forwardRef(function (e, t) {
  let {
      render: n,
      className: r,
      style: i,
      disabled: a = !1,
      nativeButton: o = !0,
      ...s
    } = e,
    { store: c } = us(),
    l = c.useState(`open`),
    { getButtonProps: u, buttonRef: d } = js({ disabled: a, native: o }),
    f = { disabled: a };
  function m(e) {
    l && c.setOpen(!1, ai(Kr, e.nativeEvent));
  }
  return p(`button`, e, {
    state: f,
    ref: [t, d],
    props: [{ onClick: m }, s, u],
  });
});
function Fs(e) {
  return Ua(e, `base-ui`);
}
var Is = F.forwardRef(function (e, t) {
    let { render: n, className: r, style: i, id: a, ...o } = e,
      { store: s } = us(),
      c = Fs(a);
    return (
      s.useSyncedValueWithCleanup(`descriptionElementId`, c),
      p(`p`, e, { ref: t, props: [{ id: c }, o] })
    );
  }),
  Ls = (function (e) {
    return ((e.nestedDialogs = `--nested-dialogs`), e);
  })({}),
  Rs = (function (e) {
    return (
      (e[(e.open = gs.open)] = `open`),
      (e[(e.closed = gs.closed)] = `closed`),
      (e[(e.startingStyle = gs.startingStyle)] = `startingStyle`),
      (e[(e.endingStyle = gs.endingStyle)] = `endingStyle`),
      (e.nested = `data-nested`),
      (e.nestedDialogOpen = `data-nested-dialog-open`),
      e
    );
  })({}),
  zs = F.createContext(void 0);
function Bs() {
  let t = F.useContext(zs);
  if (t === void 0) throw Error(e(26));
  return t;
}
var Vs = `ArrowUp`,
  Hs = `ArrowDown`,
  Us = `ArrowLeft`,
  Ws = `ArrowRight`,
  Gs = `Home`,
  Ks = new Set([Us, Ws]),
  qs = new Set([Us, Ws, Gs, `End`]),
  Js = new Set([Vs, Hs]),
  Ys = new Set([Vs, Hs, Gs, `End`]),
  Xs = new Set([...Ks, ...Js]),
  Zs = new Set([...Xs, Gs, `End`]),
  Qs = `Shift`,
  $s = new Set([Qs, `Control`, `Alt`, `Meta`]);
function ec(e) {
  return kn(e) && e.tagName === `INPUT`;
}
function tc(e) {
  return !!(
    (ec(e) && e.selectionStart != null) ||
    (kn(e) && e.tagName === `TEXTAREA`)
  );
}
function nc(e, t, n, r) {
  if (!e || !t || !t.scrollTo) return;
  let i = e.scrollLeft,
    a = e.scrollTop,
    o = e.clientWidth < e.scrollWidth,
    s = e.clientHeight < e.scrollHeight;
  if (o && r !== `vertical`) {
    let r = rc(e, t, `left`),
      a = ic(e),
      o = ic(t);
    (n === `ltr` &&
      (r + t.offsetWidth + o.scrollMarginRight >
      e.scrollLeft + e.clientWidth - a.scrollPaddingRight
        ? (i =
            r +
            t.offsetWidth +
            o.scrollMarginRight -
            e.clientWidth +
            a.scrollPaddingRight)
        : r - o.scrollMarginLeft < e.scrollLeft + a.scrollPaddingLeft &&
          (i = r - o.scrollMarginLeft - a.scrollPaddingLeft)),
      n === `rtl` &&
        (r - o.scrollMarginRight < e.scrollLeft + a.scrollPaddingLeft
          ? (i = r - o.scrollMarginLeft - a.scrollPaddingLeft)
          : r + t.offsetWidth + o.scrollMarginRight >
              e.scrollLeft + e.clientWidth - a.scrollPaddingRight &&
            (i =
              r +
              t.offsetWidth +
              o.scrollMarginRight -
              e.clientWidth +
              a.scrollPaddingRight)));
  }
  if (s && r !== `horizontal`) {
    let n = rc(e, t, `top`),
      r = ic(e),
      i = ic(t);
    n - i.scrollMarginTop < e.scrollTop + r.scrollPaddingTop
      ? (a = n - i.scrollMarginTop - r.scrollPaddingTop)
      : n + t.offsetHeight + i.scrollMarginBottom >
          e.scrollTop + e.clientHeight - r.scrollPaddingBottom &&
        (a =
          n +
          t.offsetHeight +
          i.scrollMarginBottom -
          e.clientHeight +
          r.scrollPaddingBottom);
  }
  e.scrollTo({ left: i, top: a, behavior: `auto` });
}
function rc(e, t, n) {
  let r = n === `left` ? `offsetLeft` : `offsetTop`,
    i = 0;
  for (; t.offsetParent && ((i += t[r]), t.offsetParent !== e); )
    t = t.offsetParent;
  return i;
}
function ic(e) {
  let t = getComputedStyle(e);
  return {
    scrollMarginTop: parseFloat(t.scrollMarginTop) || 0,
    scrollMarginRight: parseFloat(t.scrollMarginRight) || 0,
    scrollMarginBottom: parseFloat(t.scrollMarginBottom) || 0,
    scrollMarginLeft: parseFloat(t.scrollMarginLeft) || 0,
    scrollPaddingTop: parseFloat(t.scrollPaddingTop) || 0,
    scrollPaddingRight: parseFloat(t.scrollPaddingRight) || 0,
    scrollPaddingBottom: parseFloat(t.scrollPaddingBottom) || 0,
    scrollPaddingLeft: parseFloat(t.scrollPaddingLeft) || 0,
  };
}
var ac = {
    ...Ts,
    ...v,
    nestedDialogOpen(e) {
      return e ? { [Rs.nestedDialogOpen]: `` } : null;
    },
  },
  oc = F.forwardRef(function (e, t) {
    let {
        render: n,
        className: r,
        style: i,
        finalFocus: a,
        initialFocus: o,
        ...s
      } = e,
      { store: c } = us(),
      l = c.useState(`descriptionElementId`),
      u = c.useState(`disablePointerDismissal`),
      d = c.useState(`floatingRootContext`),
      f = c.useState(`popupProps`),
      m = c.useState(`modal`),
      h = c.useState(`mounted`),
      _ = c.useState(`nested`),
      v = c.useState(`nestedOpenDialogCount`),
      y = c.useState(`open`),
      b = c.useState(`openMethod`),
      x = c.useState(`titleElementId`),
      S = c.useState(`transitionStatus`),
      C = c.useState(`role`),
      w = d.useState(`floatingId`),
      T = s.id ?? w;
    (Bs(),
      g({
        open: y,
        ref: c.context.popupRef,
        onComplete() {
          y && c.context.onOpenChangeComplete?.(!0);
        },
      }));
    function E(e) {
      return e === `touch` ? c.context.popupRef.current : !0;
    }
    let ee = o === void 0 ? E : o,
      D = v > 0,
      te = c.useStateSetter(`popupElement`),
      ne = p(`div`, e, {
        state: { open: y, nested: _, transitionStatus: S, nestedDialogOpen: D },
        props: [
          f,
          {
            id: T,
            "aria-labelledby": x ?? void 0,
            "aria-describedby": l ?? void 0,
            role: C,
            ...Vo,
            hidden: !h,
            onKeyDown(e) {
              Zs.has(e.key) && e.stopPropagation();
            },
            style: { [Ls.nestedDialogs]: v },
          },
          s,
        ],
        ref: [t, c.context.popupRef, te],
        stateAttributesMapping: ac,
      });
    return (0, L.jsx)(ho, {
      context: d,
      openInteractionType: b,
      disabled: !h,
      closeOnFocusOut: !u,
      initialFocus: ee,
      returnFocus: a,
      modal: m !== !1,
      restoreFocus: `popup`,
      children: ne,
    });
  });
function sc(e) {
  return re(19) ? e : e ? `true` : void 0;
}
var cc = F.forwardRef(function (e, t) {
    let { cutout: n, ...r } = e,
      i;
    if (n) {
      let e = n.getBoundingClientRect();
      i = `polygon(0% 0%,100% 0%,100% 100%,0% 100%,0% 0%,${e.left}px ${e.top}px,${e.left}px ${e.bottom}px,${e.right}px ${e.bottom}px,${e.right}px ${e.top}px,${e.left}px ${e.top}px)`;
    }
    return (0, L.jsx)(`div`, {
      ref: t,
      role: `presentation`,
      "data-base-ui-inert": ``,
      ...r,
      style: {
        position: `fixed`,
        inset: 0,
        userSelect: `none`,
        WebkitUserSelect: `none`,
        clipPath: i,
      },
    });
  }),
  lc = F.forwardRef(function (e, t) {
    let { keepMounted: n = !1, ...r } = e,
      { store: i } = us(),
      a = i.useState(`mounted`),
      o = i.useState(`modal`),
      s = i.useState(`open`);
    return a || n
      ? (0, L.jsx)(zs.Provider, {
          value: n,
          children: (0, L.jsxs)(Qa, {
            ref: t,
            ...r,
            children: [
              a &&
                o === !0 &&
                (0, L.jsx)(cc, {
                  ref: i.context.internalBackdropRef,
                  inert: sc(!s),
                }),
              e.children,
            ],
          }),
        })
      : null;
  }),
  uc = F.forwardRef(function (e, t) {
    let { render: n, className: r, style: i, id: a, ...o } = e,
      { store: s } = us(),
      c = Fs(a);
    return (
      s.useSyncedValueWithCleanup(`titleElementId`, c),
      p(`h2`, e, { ref: t, props: [{ id: c }, o] })
    );
  });
function dc(e) {
  return p(e.defaultTagName ?? `div`, e, e);
}
var fc = (e) => (typeof e == `boolean` ? `${e}` : e === 0 ? `0` : e),
  pc = de,
  mc = (e, t) => (n) => {
    if (t?.variants == null) return pc(e, n?.class, n?.className);
    let { variants: r, defaultVariants: i } = t,
      a = Object.keys(r).map((e) => {
        let t = n?.[e],
          a = i?.[e];
        if (t === null) return null;
        let o = fc(t) || fc(a);
        return r[e][o];
      }),
      o =
        n &&
        Object.entries(n).reduce((e, t) => {
          let [n, r] = t;
          return (r === void 0 || (e[n] = r), e);
        }, {});
    return pc(
      e,
      a,
      t?.compoundVariants?.reduce((e, t) => {
        let { class: n, className: r, ...a } = t;
        return Object.entries(a).every((e) => {
          let [t, n] = e;
          return Array.isArray(n)
            ? n.includes({ ...i, ...o }[t])
            : { ...i, ...o }[t] === n;
        })
          ? [...e, n, r]
          : e;
      }, []),
      n?.class,
      n?.className,
    );
  },
  hc = mc(
    `[&_svg]:-mx-0.5 relative inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-lg border font-medium text-base outline-none transition-shadow before:pointer-events-none before:absolute before:inset-0 before:rounded-[calc(var(--radius-lg)-1px)] pointer-coarse:after:absolute pointer-coarse:after:size-full pointer-coarse:after:min-h-11 pointer-coarse:after:min-w-11 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-64 sm:text-sm [&_svg:not([class*='opacity-'])]:opacity-80 [&_svg:not([class*='size-'])]:size-4.5 sm:[&_svg:not([class*='size-'])]:size-4 [&_svg]:pointer-events-none [&_svg]:shrink-0`,
    {
      defaultVariants: { size: `default`, variant: `default` },
      variants: {
        size: {
          default: `h-10 px-[calc(--spacing(3.5)-1px)] sm:h-9`,
          icon: `size-10 sm:size-9`,
          "icon-lg": `size-10 sm:size-9`,
          "icon-sm": `size-8 sm:size-7`,
          "icon-xl": `size-11 sm:size-10 [&_svg:not([class*='size-'])]:size-5 sm:[&_svg:not([class*='size-'])]:size-4.5`,
          "icon-xs": `size-7 rounded-md before:rounded-[calc(var(--radius-md)-1px)] sm:size-6 not-in-data-[slot=input-group]:[&_svg:not([class*='size-'])]:size-4 sm:not-in-data-[slot=input-group]:[&_svg:not([class*='size-'])]:size-3.5`,
          lg: `h-11 px-[calc(--spacing(4)-1px)] sm:h-10`,
          sm: `h-8 gap-1.5 px-[calc(--spacing(2.5)-1px)] sm:h-7`,
          xl: `h-11 px-[calc(--spacing(4)-1px)] text-lg sm:h-10 sm:text-base [&_svg:not([class*='size-'])]:size-5 sm:[&_svg:not([class*='size-'])]:size-4.5`,
          xs: `h-7 gap-1 rounded-md px-[calc(--spacing(2)-1px)] text-sm before:rounded-[calc(var(--radius-md)-1px)] sm:h-6 sm:text-xs [&_svg:not([class*='size-'])]:size-4 sm:[&_svg:not([class*='size-'])]:size-3.5`,
        },
        variant: {
          default: `not-disabled:inset-shadow-[0_1px_--theme(--color-white/16%)] border-primary bg-primary text-primary-foreground shadow-primary/24 shadow-xs hover:bg-primary/90 data-pressed:bg-primary/90 [:active,[data-pressed]]:inset-shadow-[0_1px_--theme(--color-black/8%)] [:disabled,:active,[data-pressed]]:shadow-none`,
          destructive: `not-disabled:inset-shadow-[0_1px_--theme(--color-white/16%)] border-destructive bg-destructive text-white shadow-destructive/24 shadow-xs hover:bg-destructive/90 data-pressed:bg-destructive/90 [:active,[data-pressed]]:inset-shadow-[0_1px_--theme(--color-black/8%)] [:disabled,:active,[data-pressed]]:shadow-none`,
          "destructive-outline": `border-input bg-popover not-dark:bg-clip-padding text-destructive-foreground shadow-xs/5 not-disabled:not-active:not-data-pressed:before:shadow-[0_1px_--theme(--color-black/4%)] hover:border-destructive/32 hover:bg-destructive/4 data-pressed:border-destructive/32 data-pressed:bg-destructive/4 dark:bg-input/32 dark:not-disabled:before:shadow-[0_-1px_--theme(--color-white/2%)] dark:not-disabled:not-active:not-data-pressed:before:shadow-[0_-1px_--theme(--color-white/6%)] [:disabled,:active,[data-pressed]]:shadow-none`,
          ghost: `border-transparent text-foreground hover:bg-accent data-pressed:bg-accent`,
          link: `border-transparent underline-offset-4 hover:underline data-pressed:underline`,
          outline: `border-input bg-popover not-dark:bg-clip-padding text-foreground shadow-xs/5 not-disabled:not-active:not-data-pressed:before:shadow-[0_1px_--theme(--color-black/4%)] hover:bg-accent/50 data-pressed:bg-accent/50 dark:bg-input/32 dark:data-pressed:bg-input/64 dark:hover:bg-input/64 dark:not-disabled:before:shadow-[0_-1px_--theme(--color-white/2%)] dark:not-disabled:not-active:not-data-pressed:before:shadow-[0_-1px_--theme(--color-white/6%)] [:disabled,:active,[data-pressed]]:shadow-none`,
          secondary: `border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/90 data-pressed:bg-secondary/90 [:active,[data-pressed]]:bg-secondary/80`,
        },
      },
    },
  );
function gc({ className: e, variant: t, size: n, render: r, ...i }) {
  let a = r ? void 0 : `button`;
  return dc({
    defaultTagName: `button`,
    props: o(
      {
        className: w(hc({ className: e, size: n, variant: t })),
        "data-slot": `button`,
        type: a,
      },
      i,
    ),
    render: r,
  });
}
function _c({ ...e }) {
  return (0, L.jsx)(hs, { "data-slot": `alert-dialog`, ...e });
}
function vc({ ...e }) {
  return (0, L.jsx)(lc, { "data-slot": `alert-dialog-portal`, ...e });
}
function yc({ className: e, ...t }) {
  return (0, L.jsx)(Ds, {
    "data-slot": `alert-dialog-overlay`,
    className: w(
      `data-open:animate-in data-closed:animate-out data-closed:fade-out-0 data-open:fade-in-0 bg-black/10 duration-100 supports-backdrop-filter:backdrop-blur-xs fixed inset-0 isolate z-50`,
      e,
    ),
    ...t,
  });
}
function bc({ className: e, size: t = `default`, ...n }) {
  return (0, L.jsxs)(vc, {
    children: [
      (0, L.jsx)(yc, {}),
      (0, L.jsx)(oc, {
        "data-slot": `alert-dialog-content`,
        "data-size": t,
        className: w(
          `data-open:animate-in data-closed:animate-out data-closed:fade-out-0 data-open:fade-in-0 data-closed:zoom-out-95 data-open:zoom-in-95 bg-background ring-foreground/10 gap-4 rounded-xl p-4 ring-1 duration-100 data-[size=default]:max-w-xs data-[size=sm]:max-w-xs data-[size=default]:sm:max-w-sm group/alert-dialog-content fixed top-1/2 start-1/2 z-50 grid w-full -translate-x-1/2 rtl:translate-x-1/2 -translate-y-1/2 outline-none`,
          e,
        ),
        ...n,
      }),
    ],
  });
}
function xc({ className: e, ...t }) {
  return (0, L.jsx)(`div`, {
    "data-slot": `alert-dialog-header`,
    className: w(
      `grid grid-rows-[auto_1fr] place-items-center gap-1.5 text-center has-data-[slot=alert-dialog-media]:grid-rows-[auto_auto_1fr] has-data-[slot=alert-dialog-media]:gap-x-4 sm:group-data-[size=default]/alert-dialog-content:place-items-start sm:group-data-[size=default]/alert-dialog-content:text-start sm:group-data-[size=default]/alert-dialog-content:has-data-[slot=alert-dialog-media]:grid-rows-[auto_1fr]`,
      e,
    ),
    ...t,
  });
}
function Sc({ className: e, ...t }) {
  return (0, L.jsx)(`div`, {
    "data-slot": `alert-dialog-footer`,
    className: w(
      `bg-muted/50 -mx-4 -mb-4 rounded-b-xl border-t p-4 flex flex-col-reverse gap-2 group-data-[size=sm]/alert-dialog-content:grid group-data-[size=sm]/alert-dialog-content:grid-cols-2 sm:flex-row sm:justify-end`,
      e,
    ),
    ...t,
  });
}
function Cc({ className: e, ...t }) {
  return (0, L.jsx)(uc, {
    "data-slot": `alert-dialog-title`,
    className: w(
      `text-base font-medium sm:group-data-[size=default]/alert-dialog-content:group-has-data-[slot=alert-dialog-media]/alert-dialog-content:col-start-2`,
      e,
    ),
    ...t,
  });
}
function wc({ className: e, ...t }) {
  return (0, L.jsx)(Is, {
    "data-slot": `alert-dialog-description`,
    className: w(
      `text-muted-foreground *:[a]:hover:text-foreground text-sm text-balance md:text-pretty *:[a]:underline *:[a]:underline-offset-3`,
      e,
    ),
    ...t,
  });
}
function Tc({
  className: e,
  variant: t = `outline`,
  size: n = `default`,
  ...r
}) {
  return (0, L.jsx)(Ps, {
    "data-slot": `alert-dialog-cancel`,
    className: w(e),
    render: (0, L.jsx)(gc, { variant: t, size: n }),
    ...r,
  });
}
function Ec({ className: e, ...t }) {
  return (0, L.jsx)(`label`, {
    "data-slot": `label`,
    className: w(
      `gap-2 text-sm leading-none font-medium group-data-[disabled=true]:opacity-50 peer-disabled:opacity-50 flex items-center select-none group-data-[disabled=true]:pointer-events-none peer-disabled:cursor-not-allowed`,
      e,
    ),
    ...t,
  });
}
var Dc = F.forwardRef(function (e, t) {
  let {
    className: n,
    render: r,
    orientation: i = `horizontal`,
    style: a,
    ...o
  } = e;
  return p(`div`, e, {
    state: { orientation: i },
    ref: t,
    props: [{ role: `separator`, "aria-orientation": i }, o],
  });
});
function Oc({ className: e, orientation: t = `horizontal`, ...n }) {
  return (0, L.jsx)(Dc, {
    className: w(
      `shrink-0 bg-border data-[orientation=horizontal]:h-px data-[orientation=horizontal]:w-full data-[orientation=vertical]:w-px data-[orientation=vertical]:not-[[class^='h-']]:not-[[class*='_h-']]:self-stretch`,
      e,
    ),
    "data-slot": `separator`,
    orientation: t,
    ...n,
  });
}
function kc({ className: e, ...t }) {
  return (0, L.jsx)(`div`, {
    "data-slot": `field-group`,
    className: w(
      `gap-5 data-[slot=checkbox-group]:gap-3 [&>[data-slot=field-group]]:gap-4 group/field-group @container/field-group flex w-full flex-col`,
      e,
    ),
    ...t,
  });
}
var Ac = mc(
  `data-[invalid=true]:text-destructive gap-2 group/field flex w-full`,
  {
    variants: {
      orientation: {
        vertical: `flex-col [&>*]:w-full [&>.sr-only]:w-auto`,
        horizontal: `flex-row items-center [&>[data-slot=field-label]]:flex-auto has-[>[data-slot=field-content]]:items-start has-[>[data-slot=field-content]]:[&>[role=checkbox],[role=radio]]:mt-px`,
        responsive: `flex-col [&>*]:w-full [&>.sr-only]:w-auto @md/field-group:flex-row @md/field-group:items-center @md/field-group:[&>*]:w-auto @md/field-group:[&>[data-slot=field-label]]:flex-auto @md/field-group:has-[>[data-slot=field-content]]:items-start @md/field-group:has-[>[data-slot=field-content]]:[&>[role=checkbox],[role=radio]]:mt-px`,
      },
    },
    defaultVariants: { orientation: `vertical` },
  },
);
function jc({ className: e, orientation: t = `vertical`, ...n }) {
  return (0, L.jsx)(`div`, {
    role: `group`,
    "data-slot": `field`,
    "data-orientation": t,
    className: w(Ac({ orientation: t }), e),
    ...n,
  });
}
function Mc({ className: e, ...t }) {
  return (0, L.jsx)(Ec, {
    "data-slot": `field-label`,
    className: w(
      `has-data-checked:bg-primary/5 has-data-checked:border-primary dark:has-data-checked:bg-primary/10 gap-2 group-data-[disabled=true]/field:opacity-50 has-[>[data-slot=field]]:rounded-lg has-[>[data-slot=field]]:border [&>*]:data-[slot=field]:p-2.5 group/field-label peer/field-label flex w-fit leading-snug`,
      `has-[>[data-slot=field]]:w-full has-[>[data-slot=field]]:flex-col`,
      e,
    ),
    ...t,
  });
}
function Nc({ className: e, ...t }) {
  return (0, L.jsx)(`p`, {
    "data-slot": `field-description`,
    className: w(
      `text-muted-foreground text-start text-sm [[data-variant=legend]+&]:-mt-1.5 leading-normal font-normal group-has-[[data-orientation=horizontal]]/field:text-balance`,
      `last:mt-0 nth-last-2:-mt-1`,
      `[&>a:hover]:text-primary [&>a]:underline [&>a]:underline-offset-4`,
      e,
    ),
    ...t,
  });
}
function Pc({ children: e, className: t, ...n }) {
  return (0, L.jsxs)(`div`, {
    "data-slot": `field-separator`,
    "data-content": !!e,
    className: w(
      `-my-2 h-5 text-sm group-data-[variant=outline]/field-group:-mb-2 relative`,
      t,
    ),
    ...n,
    children: [
      (0, L.jsx)(Oc, { className: `absolute inset-0 top-1/2` }),
      e &&
        (0, L.jsx)(`span`, {
          className: `text-muted-foreground px-2 bg-background relative mx-auto block w-fit`,
          "data-slot": `field-separator-content`,
          children: e,
        }),
    ],
  });
}
function Fc({ className: e, children: t, errors: n, ...r }) {
  let i = (0, F.useMemo)(() => {
    if (t) return t;
    if (!n?.length) return null;
    let e = [...new Map(n.map((e) => [e?.message, e])).values()];
    return e?.length == 1
      ? e[0]?.message
      : (0, L.jsx)(`ul`, {
          className: `ms-4 flex list-disc flex-col gap-1`,
          children: e.map(
            (e, t) =>
              e?.message && (0, L.jsx)(`li`, { children: e.message }, t),
          ),
        });
  }, [t, n]);
  return i
    ? (0, L.jsx)(`div`, {
        role: `alert`,
        "data-slot": `field-error`,
        className: w(`text-destructive text-sm font-normal`, e),
        ...r,
        children: i,
      })
    : null;
}
var Ic = (function (e) {
    return (
      (e.disabled = `data-disabled`),
      (e.valid = `data-valid`),
      (e.invalid = `data-invalid`),
      (e.touched = `data-touched`),
      (e.dirty = `data-dirty`),
      (e.filled = `data-filled`),
      (e.focused = `data-focused`),
      e
    );
  })({}),
  G = {
    badInput: !1,
    customError: !1,
    patternMismatch: !1,
    rangeOverflow: !1,
    rangeUnderflow: !1,
    stepMismatch: !1,
    tooLong: !1,
    tooShort: !1,
    typeMismatch: !1,
    valid: null,
    valueMissing: !1,
  },
  Lc = { valid: null, touched: !1, dirty: !1, filled: !1, focused: !1 },
  Rc = { disabled: !1, ...Lc },
  zc = {
    valid(e) {
      return e === null ? null : e ? { [Ic.valid]: `` } : { [Ic.invalid]: `` };
    },
  },
  Bc = {
    invalid: void 0,
    name: void 0,
    validityData: {
      state: G,
      errors: [],
      error: ``,
      value: ``,
      initialValue: null,
    },
    setValidityData: h,
    disabled: void 0,
    touched: Lc.touched,
    setTouched: h,
    dirty: Lc.dirty,
    setDirty: h,
    filled: Lc.filled,
    setFilled: h,
    focused: Lc.focused,
    setFocused: h,
    validate: () => null,
    validationMode: `onSubmit`,
    validationDebounceTime: 0,
    shouldValidateOnChange: () => !1,
    state: Rc,
    markedDirtyRef: { current: !1 },
    registerFieldControl: h,
    validation: {
      getValidationProps: (e = u) => e,
      getInputValidationProps: (e = u) => e,
      inputRef: { current: null },
      commit: async () => {},
    },
  },
  Vc = F.createContext(Bc);
function Hc(t = !0) {
  let n = F.useContext(Vc);
  if (n.setValidityData === h && !t) throw Error(e(28));
  return n;
}
var Uc = F.createContext({
  controlId: void 0,
  registerControlId: h,
  labelId: void 0,
  setLabelId: h,
  messageIds: [],
  setMessageIds: h,
  getDescriptionProps: (e) => e,
});
function Wc() {
  return F.useContext(Uc);
}
function Gc(e = {}) {
  let { id: t, implicit: n = !1, controlRef: r } = e,
    { controlId: i, registerControlId: a } = Wc(),
    o = Fs(t),
    c = n ? i : void 0,
    l = x(() => Symbol(`labelable-control`)),
    u = F.useRef(!1),
    d = F.useRef(t != null),
    f = O(() => {
      !u.current || a === h || ((u.current = !1), a(l.current, void 0));
    });
  return (
    s(() => {
      if (a === h) return;
      let e;
      if (n) {
        let n = r?.current;
        e = On(n) && n.closest(`label`) != null ? (t ?? null) : (c ?? o);
      } else if (t != null) ((d.current = !0), (e = t));
      else if (d.current) e = o;
      else {
        f();
        return;
      }
      if (e === void 0) {
        f();
        return;
      }
      ((u.current = !0), a(l.current, e));
    }, [t, r, c, a, n, o, l, f]),
    F.useEffect(() => f, [f]),
    i ?? o
  );
}
function Kc({ controlled: e, default: t, name: n, state: r = `value` }) {
  let { current: i } = F.useRef(e !== void 0),
    [a, o] = F.useState(t);
  return [
    i ? e : a,
    F.useCallback((e) => {
      i || o(e);
    }, []),
  ];
}
function qc(e, t, n, r, i = !0) {
  let { registerFieldControl: a } = Hc(),
    o = F.useRef(null);
  ((o.current ||= Symbol()),
    s(() => {
      let s = o.current;
      if (!(!s || !i))
        return (
          a(s, { controlRef: e, getValue: r, id: t, value: n }),
          () => {
            a(s, void 0);
          }
        );
    }, [e, i, r, t, a, n]));
}
var Jc = F.forwardRef(function (e, t) {
    let {
        render: n,
        className: r,
        id: i,
        name: a,
        value: o,
        disabled: c = !1,
        onValueChange: l,
        defaultValue: u,
        autoFocus: d = !1,
        style: f,
        ...m
      } = e,
      {
        state: h,
        name: g,
        disabled: _,
        setTouched: v,
        setDirty: y,
        validityData: b,
        setFocused: x,
        setFilled: S,
        validationMode: C,
        validation: w,
      } = Hc(),
      T = _ || c,
      E = g ?? a,
      ee = { ...h, disabled: T },
      { labelId: D } = Wc(),
      te = Gc({ id: i });
    s(() => {
      let e = o != null;
      w.inputRef.current?.value || (e && o !== ``)
        ? S(!0)
        : e && o === `` && S(!1);
    }, [w.inputRef, S, o]);
    let ne = F.useRef(null);
    s(() => {
      d && ne.current === Ar(cr(ne.current)) && x(!0);
    }, [d, x]);
    let [re] = Kc({
        controlled: o,
        default: u,
        name: `FieldControl`,
        state: `value`,
      }),
      ie = o !== void 0,
      k = ie ? re : void 0,
      A = O(() => w.inputRef.current?.value);
    return (
      qc(w.inputRef, te, k, A),
      p(`input`, e, {
        ref: [t, ne],
        state: ee,
        props: [
          {
            id: te,
            disabled: T,
            name: E,
            ref: w.inputRef,
            "aria-labelledby": D,
            autoFocus: d,
            ...(ie ? { value: k } : { defaultValue: u }),
            onChange(e) {
              let t = e.currentTarget.value;
              (l?.(t, ai(Br, e.nativeEvent)),
                y(t !== b.initialValue),
                S(t !== ``));
            },
            onFocus() {
              x(!0);
            },
            onBlur(e) {
              (v(!0), x(!1), C === `onBlur` && w.commit(e.currentTarget.value));
            },
            onKeyDown(e) {
              e.currentTarget.tagName === `INPUT` &&
                e.key === `Enter` &&
                (v(!0), w.commit(e.currentTarget.value));
            },
          },
          w.getInputValidationProps(),
          m,
        ],
        stateAttributesMapping: zc,
      })
    );
  }),
  Yc = F.forwardRef(function (e, t) {
    return (0, L.jsx)(Jc, { ref: t, ...e });
  });
function Xc({
  className: e,
  size: t = `default`,
  unstyled: n = !1,
  nativeInput: r = !1,
  style: i,
  ...a
}) {
  let o = w(
    `h-9.5 w-full min-w-0 rounded-[inherit] px-[calc(--spacing(3)-1px)] leading-9.5 outline-none [transition:background-color_5000000s_ease-in-out_0s] placeholder:text-muted-foreground/72 sm:h-8.5 sm:leading-8.5`,
    t === `sm` &&
      `h-7.5 px-[calc(--spacing(2.5)-1px)] leading-7.5 sm:h-6.5 sm:leading-6.5`,
    t === `lg` && `h-10.5 leading-10.5 sm:h-9.5 sm:leading-9.5`,
    a.type === `search` &&
      `[&::-webkit-search-cancel-button]:appearance-none [&::-webkit-search-decoration]:appearance-none [&::-webkit-search-results-button]:appearance-none [&::-webkit-search-results-decoration]:appearance-none`,
    a.type === `file` &&
      `text-muted-foreground file:me-3 file:bg-transparent file:font-medium file:text-foreground file:text-sm`,
  );
  return (0, L.jsx)(`span`, {
    className:
      w(
        !n &&
          `relative inline-flex w-full rounded-lg border border-input bg-background not-dark:bg-clip-padding text-base text-foreground shadow-xs/5 ring-ring/24 transition-shadow before:pointer-events-none before:absolute before:inset-0 before:rounded-[calc(var(--radius-lg)-1px)] not-has-disabled:not-has-focus-visible:not-has-aria-invalid:before:shadow-[0_1px_--theme(--color-black/4%)] has-focus-visible:has-aria-invalid:border-destructive/64 has-focus-visible:has-aria-invalid:ring-destructive/16 has-aria-invalid:border-destructive/36 has-focus-visible:border-ring has-autofill:bg-foreground/4 has-disabled:opacity-64 has-[:disabled,:focus-visible,[aria-invalid]]:shadow-none has-focus-visible:ring-[3px] sm:text-sm dark:bg-input/32 dark:has-autofill:bg-foreground/8 dark:has-aria-invalid:ring-destructive/24 dark:not-has-disabled:not-has-focus-visible:not-has-aria-invalid:before:shadow-[0_-1px_--theme(--color-white/6%)]`,
        e,
      ) || void 0,
    "data-size": t,
    "data-slot": `input-control`,
    children: r
      ? (0, L.jsx)(`input`, {
          className: o,
          "data-slot": `input`,
          size: typeof t == `number` ? t : void 0,
          style: typeof i == `function` ? void 0 : i,
          ...a,
        })
      : (0, L.jsx)(Yc, {
          className: o,
          "data-slot": `input`,
          size: typeof t == `number` ? t : void 0,
          style: i,
          ...a,
        }),
  });
}
var Zc = S(`circle-alert`, [
    [`circle`, { cx: `12`, cy: `12`, r: `10`, key: `1mglay` }],
    [`line`, { x1: `12`, x2: `12`, y1: `8`, y2: `12`, key: `1pkeuh` }],
    [`line`, { x1: `12`, x2: `12.01`, y1: `16`, y2: `16`, key: `4dfq90` }],
  ]),
  Qc = S(`loader-circle`, [
    [`path`, { d: `M21 12a9 9 0 1 1-6.219-8.56`, key: `13zald` }],
  ]),
  $c = S(`refresh-ccw`, [
    [
      `path`,
      {
        d: `M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8`,
        key: `14sxne`,
      },
    ],
    [`path`, { d: `M3 3v5h5`, key: `1xhq8a` }],
    [
      `path`,
      {
        d: `M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16`,
        key: `1hlbsb`,
      },
    ],
    [`path`, { d: `M16 16h5v5`, key: `ccwih5` }],
  ]);
function el({ className: e, ...t }) {
  return (0, L.jsx)(Qc, {
    "aria-label": `Loading`,
    className: w(`animate-spin`, e),
    role: `status`,
    ...t,
  });
}
var tl = F.createContext(null);
function nl({ children: e }) {
  let { t } = M(),
    [n, r] = F.useState(null),
    [i, a] = F.useState(!1),
    [o, s] = F.useState(!1),
    [c, l] = F.useState(``),
    u = F.useRef(null),
    d = F.useCallback(
      (e) => (
        u.current?.(!1),
        r(e),
        l(``),
        a(!0),
        new Promise((e) => {
          u.current = e;
        })
      ),
      [],
    ),
    f = (e) => {
      (u.current?.(e), (u.current = null), a(!1));
    },
    p = async () => {
      if (!n?.onConfirm) return f(!0);
      s(!0);
      try {
        (await n.onConfirm()) !== !1 && f(!0);
      } catch (e) {
        console.error(e);
      } finally {
        s(!1);
      }
    },
    m = !!n?.confirmText && c !== n.confirmText;
  return (0, L.jsxs)(tl, {
    value: d,
    children: [
      e,
      (0, L.jsx)(_c, {
        open: i,
        onOpenChange: (e) => {
          !e && !o && f(!1);
        },
        children: (0, L.jsxs)(bc, {
          className: `sm:max-w-md`,
          children: [
            (0, L.jsxs)(xc, {
              className: `text-start`,
              children: [
                (0, L.jsx)(Cc, { children: n?.title ?? t(`Are you sure?`) }),
                n?.description
                  ? (0, L.jsx)(wc, { children: n.description })
                  : null,
              ],
            }),
            n?.confirmText
              ? (0, L.jsxs)(jc, {
                  children: [
                    (0, L.jsx)(Mc, {
                      htmlFor: `confirm-text`,
                      className: `font-normal`,
                      children: t(`Type {{text}} to confirm`, {
                        text: n.confirmText,
                      }),
                    }),
                    (0, L.jsx)(Xc, {
                      id: `confirm-text`,
                      autoComplete: `off`,
                      value: c,
                      onChange: (e) => l(e.target.value),
                    }),
                  ],
                })
              : null,
            (0, L.jsxs)(Sc, {
              children: [
                (0, L.jsx)(Tc, { disabled: o, children: t(`Cancel`) }),
                (0, L.jsxs)(gc, {
                  variant: n?.destructive ? `destructive` : `default`,
                  disabled: o || m,
                  onClick: p,
                  children: [
                    o && (0, L.jsx)(el, {}),
                    n?.confirmLabel ?? t(`Confirm`),
                  ],
                }),
              ],
            }),
          ],
        }),
      }),
    ],
  });
}
function rl() {
  let e = F.useContext(tl);
  if (!e) throw Error(`useConfirm must be used within ConfirmProvider`);
  return e;
}
var il = (0, F.createContext)(void 0);
function al() {
  let e = (0, F.useContext)(il);
  if (!e) throw Error(`useLoading must be used within LoadingProvider`);
  return e;
}
function ol({ isLoading: e, className: t }) {
  return (0, L.jsx)(`div`, {
    role: `progressbar`,
    "aria-hidden": !e,
    "aria-busy": e,
    className: w(
      `pointer-events-none fixed inset-x-0 top-0 z-100 h-0.5 overflow-hidden transition-opacity duration-300`,
      e ? `opacity-100` : `opacity-0`,
      t,
    ),
    children: (0, L.jsx)(`div`, {
      className: `h-full w-full origin-left animate-progress bg-primary`,
    }),
  });
}
function sl({ children: e }) {
  let [t, n] = (0, F.useState)(!1);
  return (0, L.jsxs)(il.Provider, {
    value: { isLoading: t, setLoading: n },
    children: [(0, L.jsx)(ol, { isLoading: t }), e],
  });
}
var cl = [`light`, `dark`, `system`],
  ll = `theme`,
  ul = F.createContext(null),
  dl = (e) => cl.includes(e);
function fl() {
  try {
    let e = localStorage.getItem(ll);
    return dl(e) ? e : null;
  } catch {
    return null;
  }
}
var pl = () => window.matchMedia(`(prefers-color-scheme: dark)`);
function ml({ initial: e, children: t }) {
  let [n, r] = F.useState(() => (dl(e) ? e : fl()) ?? `system`),
    [i, a] = F.useState(() => pl().matches);
  F.useEffect(() => {
    let e = pl(),
      t = (e) => a(e.matches);
    return (
      e.addEventListener(`change`, t),
      () => e.removeEventListener(`change`, t)
    );
  }, []);
  let o = n === `system` ? (i ? `dark` : `light`) : n;
  F.useLayoutEffect(() => {
    let e = document.documentElement;
    (e.classList.remove(`light`, `dark`), e.classList.add(o));
  }, [o]);
  let s = F.useCallback((e) => {
      r(e);
      try {
        localStorage.setItem(ll, e);
      } catch {}
    }, []),
    [c, l] = F.useState(e);
  return (
    e !== c && (l(e), dl(e) && r(e)),
    F.useEffect(() => {
      if (dl(e))
        try {
          localStorage.setItem(ll, e);
        } catch {}
    }, [e]),
    (0, L.jsx)(ul, {
      value: F.useMemo(
        () => ({ scheme: n, resolved: o, setScheme: s }),
        [n, o, s],
      ),
      children: t,
    })
  );
}
function hl() {
  let e = F.useContext(ul);
  if (!e) throw Error(`useTheme must be used within ThemeProvider`);
  return e;
}
function gl(e) {
  let t = document.querySelector(`link[rel='icon']`);
  (t ||
    ((t = document.createElement(`link`)),
    (t.rel = `icon`),
    document.head.appendChild(t)),
    t.removeAttribute(`type`),
    (t.href = e));
}
function _l(e, t) {
  F.useEffect(() => {
    let n = !1,
      r = new Image();
    return (
      (r.onload = () => !n && gl(e)),
      (r.onerror = () => !n && gl(t)),
      (r.src = e),
      () => {
        n = !0;
      }
    );
  }, [e, t]);
}
var vl = [
    { code: `en`, label: `English` },
    { code: `ar`, label: `العربية` },
  ],
  yl = new Set([`ar`, `he`, `fa`, `ur`]),
  bl = (e) => (yl.has(e.split(`-`)[0]) ? `rtl` : `ltr`);
function xl(e) {
  let { i18n: t } = M();
  F.useEffect(() => {
    e && e !== t.language && t.changeLanguage(e).catch(console.error);
  }, [e, t]);
  let n = t.resolvedLanguage ?? t.language ?? `en`,
    r = bl(n);
  return (
    F.useLayoutEffect(() => {
      let e = document.documentElement;
      (e.setAttribute(`lang`, n), e.setAttribute(`dir`, r));
    }, [n, r]),
    {
      language: n,
      direction: r,
      changeLanguage: F.useCallback(
        (e) => void t.changeLanguage(e).catch(console.error),
        [t],
      ),
    }
  );
}
function Sl() {
  let [e] = fe();
  return (0, L.jsx)(se, {
    value: {
      dedupingInterval: 5e3,
      revalidateOnFocus: !1,
      revalidateIfStale: !0,
      shouldRetryOnError: !1,
      revalidateOnReconnect: !0,
    },
    children: (0, L.jsx)(ml, {
      initial: e.get(`theme`),
      children: (0, L.jsx)(Cl, { language: e.get(`lng`) }),
    }),
  });
}
function Cl({ language: e }) {
  let { app: t, logo: n } = A(),
    { resolved: r } = hl(),
    { direction: i } = xl(e),
    a = ce();
  return (
    _l(n, N),
    F.useEffect(() => {
      t?.theme && j(t.theme);
    }, [t]),
    (0, L.jsx)(xn, {
      direction: i,
      children: (0, L.jsx)(sl, {
        children: (0, L.jsxs)(nl, {
          children: [
            (0, L.jsx)(ol, { isLoading: a.state === `loading` }),
            (0, L.jsx)(`div`, {
              className: `relative isolate flex min-h-svh w-full flex-col`,
              children: (0, L.jsx)(ee, {}),
            }),
            (0, L.jsx)(mn, {
              theme: r,
              dir: i,
              position: `top-center`,
              richColors: !0,
              closeButton: !0,
              toastOptions: {
                classNames: {
                  toast: `!rounded-xl !shadow-lg/5 !font-sans`,
                  description: `!text-muted-foreground`,
                },
              },
            }),
          ],
        }),
      }),
    })
  );
}
function wl() {
  let { t: e } = M(),
    t = C(),
    n = D(t)
      ? `${t.status} ${t.statusText}`
      : t instanceof Error
        ? t.message
        : String(t),
    r = /dynamically imported module|Importing a module script/i.test(n);
  return (0, L.jsx)(`div`, {
    className: `flex min-h-svh items-center justify-center p-6`,
    children: (0, L.jsxs)(`div`, {
      className: `flex w-full max-w-md flex-col items-center gap-4 rounded-2xl border bg-card p-8 text-center shadow-xs/5`,
      children: [
        (0, L.jsx)(`div`, {
          className: `flex size-12 items-center justify-center rounded-2xl bg-destructive/10 text-destructive`,
          children: (0, L.jsx)(Zc, { className: `size-6` }),
        }),
        (0, L.jsxs)(`div`, {
          className: `flex flex-col gap-1.5`,
          children: [
            (0, L.jsx)(`h1`, {
              className: `text-xl font-semibold`,
              children: e(
                r ? `A new version is available` : `Something went wrong`,
              ),
            }),
            (0, L.jsx)(`p`, {
              className: `text-sm break-words text-muted-foreground`,
              children: r ? e(`Reload the page to get the latest version.`) : n,
            }),
          ],
        }),
        (0, L.jsxs)(gc, {
          onClick: () => window.location.reload(),
          children: [(0, L.jsx)($c, {}), e(`Reload page`)],
        }),
      ],
    }),
  });
}
var Tl = (e) => async () => ({ Component: (await e()).default }),
  El = k(
    [
      {
        path: `/`,
        element: (0, L.jsx)(Sl, {}),
        errorElement: (0, L.jsx)(wl, {}),
        hydrateFallbackElement: (0, L.jsx)(`div`, {
          className: `min-h-svh bg-background`,
        }),
        children: [
          {
            index: !0,
            element: (0, L.jsx)(E, {
              to: `/account` + window.location.search,
              replace: !0,
            }),
          },
          {
            path: `account`,
            lazy: Tl(() =>
              _(
                () => import(`./Account-DWiGnTHB.js`),
                __vite__mapDeps([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13]),
              ),
            ),
          },
          {
            path: `login`,
            lazy: Tl(() =>
              _(
                () => import(`./Login-Dn3Y7zlN.js`),
                __vite__mapDeps([14, 1, 3, 4, 2, 5, 8, 15, 9, 11, 12, 13, 16]),
              ),
            ),
          },
          {
            path: `signup`,
            lazy: Tl(() =>
              _(
                () => import(`./Signup-C-PGPlxr.js`),
                __vite__mapDeps([17, 1, 4, 2, 5, 8, 15, 10, 11, 12, 13, 16]),
              ),
            ),
          },
          {
            path: `reset-password`,
            lazy: Tl(() =>
              _(
                () => import(`./ResetPassword-C4fDJ-Be.js`),
                __vite__mapDeps([18, 1, 4, 2, 5, 6, 15, 11, 13]),
              ),
            ),
          },
          {
            path: `change-password`,
            lazy: Tl(() =>
              _(
                () => import(`./ChangePassword-Q1wA_Hbx.js`),
                __vite__mapDeps([19, 1, 4, 2, 5, 20, 8, 10, 11, 13]),
              ),
            ),
          },
          {
            path: `consent`,
            lazy: Tl(() =>
              _(
                () => import(`./Consent-m37PImVd.js`),
                __vite__mapDeps([21, 1, 2, 4, 5, 7, 9, 13]),
              ),
            ),
          },
          {
            path: `invite/:_id`,
            lazy: Tl(() =>
              _(
                () => import(`./Invite-BJuYPLI2.js`),
                __vite__mapDeps([22, 1, 4, 2, 5, 20]),
              ),
            ),
          },
          {
            path: `logout`,
            lazy: Tl(() =>
              _(
                () => import(`./Logout-BbQryjBh.js`),
                __vite__mapDeps([23, 1, 2, 5]),
              ),
            ),
          },
          {
            path: `*`,
            lazy: Tl(() =>
              _(
                () => import(`./NotFound-Bt9r_v1O.js`),
                __vite__mapDeps([24, 1, 4, 2, 13]),
              ),
            ),
          },
        ],
      },
    ],
    { basename: `/auth` },
  );
(_n(),
  (0, ge.createRoot)(document.getElementById(`root`)).render(
    (0, L.jsx)(F.StrictMode, { children: (0, L.jsx)(ve, { router: El }) }),
  ));
export {
  js as $,
  Fr as $n,
  Hi as $t,
  lc as A,
  ti as An,
  Rn as Ar,
  so as At,
  Gs as B,
  Gr as Bn,
  gn as Br,
  Da as Bt,
  Mc as C,
  pi as Cn,
  En as Cr,
  Mo as Ct,
  gc as D,
  si as Dn,
  Kn as Dr,
  yo as Dt,
  Ec as E,
  ci as En,
  Un as Er,
  W as Et,
  Xs as F,
  Qr as Fn,
  Mn as Fr,
  Qa as Ft,
  Js as G,
  Ur as Gn,
  ya as Gt,
  qs as H,
  Br as Hn,
  Qt as Hr,
  Ca as Ht,
  Us as I,
  ri as In,
  Nn as Ir,
  Wa as It,
  nc as J,
  ii as Jn,
  Wi as Jt,
  Ys as K,
  Hr as Kn,
  ba as Kt,
  Ws as L,
  Yr as Ln,
  Bn as Lr,
  Ga as Lt,
  sc as M,
  qr as Mn,
  kn as Mr,
  ro as Mt,
  oc as N,
  Kr as Nn,
  Vn as Nr,
  io as Nt,
  mc as O,
  ai as On,
  Wn as Or,
  ho as Ot,
  Hs as P,
  $r as Pn,
  jn as Pr,
  eo as Pt,
  Ps as Q,
  Lr as Qn,
  Ui as Qt,
  Vs as R,
  Xr as Rn,
  Sn as Rr,
  Ka as Rt,
  kc as S,
  mi as Sn,
  zn as Sr,
  Io as St,
  Dc as T,
  fi as Tn,
  wn as Tr,
  Do as Tt,
  $s as U,
  Wr as Un,
  ha as Ut,
  Ks as V,
  ei as Vn,
  vn as Vr,
  Ta as Vt,
  Qs as W,
  ni as Wn,
  va as Wt,
  Is as X,
  Ir as Xn,
  Ji as Xt,
  Bs as Y,
  zr as Yn,
  qi as Yt,
  Fs as Z,
  Mr as Zn,
  Gi as Zt,
  Lc as _,
  Di as _n,
  rr as _r,
  Jo as _t,
  rl as a,
  Si as an,
  Er as ar,
  ws as at,
  Nc as b,
  zi as bn,
  R as br,
  zo as bt,
  Zc as c,
  Oi as cn,
  Sr as cr,
  fs as ct,
  Kc as d,
  Ai as dn,
  vr as dr,
  Qo as dt,
  Zi as en,
  Rr as er,
  Os as et,
  Gc as f,
  Ti as fn,
  _r as fr,
  as as ft,
  Hc as g,
  Ci as gn,
  $n as gr,
  qo as gt,
  Vc as h,
  Ri as hn,
  er as hr,
  Ko as ht,
  al as i,
  yi as in,
  kr as ir,
  Ts as it,
  cc as j,
  Jr as jn,
  On as jr,
  ao as jt,
  uc as k,
  oi as kn,
  Tn as kr,
  oo as kt,
  Xc as l,
  ki as ln,
  br as lr,
  cs as lt,
  Bc as m,
  Ii as mn,
  nr as mr,
  Vo as mt,
  xl as n,
  Yi as nn,
  z as nr,
  Ds as nt,
  el as o,
  vi as on,
  Dr as or,
  Cs as ot,
  Wc as p,
  Fi as pn,
  cr as pr,
  Xo as pt,
  tc as q,
  Vr as qn,
  Ki as qt,
  hl as r,
  xi as rn,
  jr as rr,
  gs as rt,
  $c as s,
  wi as sn,
  Or as sr,
  ms as st,
  vl as t,
  Vi as tn,
  Ar as tr,
  ks as tt,
  qc as u,
  Ei as un,
  xr as ur,
  us as ut,
  zc as v,
  gi as vn,
  tr as vr,
  Go as vt,
  Pc as w,
  di as wn,
  qn as wr,
  Eo as wt,
  Fc as x,
  _i as xn,
  Hn as xr,
  Lo as xt,
  jc as y,
  hi as yn,
  Qn as yr,
  Bo as yt,
  Zs as z,
  Zr as zn,
  bn as zr,
  Ua as zt,
};

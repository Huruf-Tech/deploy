var e = Object.create,
  t = Object.defineProperty,
  n = Object.getOwnPropertyDescriptor,
  r = Object.getOwnPropertyNames,
  i = Object.getPrototypeOf,
  a = Object.prototype.hasOwnProperty,
  o = (e, t) => () => (
    t || (e((t = { exports: {} }).exports, t), (e = null)),
    t.exports
  ),
  s = (e, n) => {
    let r = {};
    for (var i in e) t(r, i, { get: e[i], enumerable: !0 });
    return (n || t(r, Symbol.toStringTag, { value: `Module` }), r);
  },
  c = (e, i, o, s) => {
    if ((i && typeof i == `object`) || typeof i == `function`)
      for (var c = r(i), l = 0, u = c.length, d; l < u; l++)
        ((d = c[l]),
          !a.call(e, d) &&
            d !== o &&
            t(e, d, {
              get: ((e) => i[e]).bind(null, d),
              enumerable: !(s = n(i, d)) || s.enumerable,
            }));
    return e;
  },
  l = (n, r, a) => (
    (a = n == null ? {} : e(i(n))),
    c(
      r || !n || !n.__esModule
        ? t(a, `default`, { value: n, enumerable: !0 })
        : a,
      n,
    )
  ),
  u = o((e) => {
    var t = Symbol.for(`react.transitional.element`),
      n = Symbol.for(`react.portal`),
      r = Symbol.for(`react.fragment`),
      i = Symbol.for(`react.strict_mode`),
      a = Symbol.for(`react.profiler`),
      o = Symbol.for(`react.consumer`),
      s = Symbol.for(`react.context`),
      c = Symbol.for(`react.forward_ref`),
      l = Symbol.for(`react.suspense`),
      u = Symbol.for(`react.memo`),
      d = Symbol.for(`react.lazy`),
      f = Symbol.for(`react.activity`),
      p = Symbol.iterator;
    function m(e) {
      return typeof e != `object` || !e
        ? null
        : ((e = (p && e[p]) || e[`@@iterator`]),
          typeof e == `function` ? e : null);
    }
    var h = {
        isMounted: function () {
          return !1;
        },
        enqueueForceUpdate: function () {},
        enqueueReplaceState: function () {},
        enqueueSetState: function () {},
      },
      g = Object.assign,
      _ = {};
    function v(e, t, n) {
      ((this.props = e),
        (this.context = t),
        (this.refs = _),
        (this.updater = n || h));
    }
    ((v.prototype.isReactComponent = {}),
      (v.prototype.setState = function (e, t) {
        if (typeof e != `object` && typeof e != `function` && e != null)
          throw Error(
            `takes an object of state variables to update or a function which returns an object of state variables.`,
          );
        this.updater.enqueueSetState(this, e, t, `setState`);
      }),
      (v.prototype.forceUpdate = function (e) {
        this.updater.enqueueForceUpdate(this, e, `forceUpdate`);
      }));
    function y() {}
    y.prototype = v.prototype;
    function b(e, t, n) {
      ((this.props = e),
        (this.context = t),
        (this.refs = _),
        (this.updater = n || h));
    }
    var x = (b.prototype = new y());
    ((x.constructor = b), g(x, v.prototype), (x.isPureReactComponent = !0));
    var S = Array.isArray;
    function C() {}
    var w = { H: null, A: null, T: null, S: null },
      T = Object.prototype.hasOwnProperty;
    function E(e, n, r) {
      var i = r.ref;
      return {
        $$typeof: t,
        type: e,
        key: n,
        ref: i === void 0 ? null : i,
        props: r,
      };
    }
    function D(e, t) {
      return E(e.type, t, e.props);
    }
    function O(e) {
      return typeof e == `object` && !!e && e.$$typeof === t;
    }
    function k(e) {
      var t = { "=": `=0`, ":": `=2` };
      return (
        `$` +
        e.replace(/[=:]/g, function (e) {
          return t[e];
        })
      );
    }
    var A = /\/+/g;
    function j(e, t) {
      return typeof e == `object` && e && e.key != null
        ? k(`` + e.key)
        : t.toString(36);
    }
    function M(e) {
      switch (e.status) {
        case `fulfilled`:
          return e.value;
        case `rejected`:
          throw e.reason;
        default:
          switch (
            (typeof e.status == `string`
              ? e.then(C, C)
              : ((e.status = `pending`),
                e.then(
                  function (t) {
                    e.status === `pending` &&
                      ((e.status = `fulfilled`), (e.value = t));
                  },
                  function (t) {
                    e.status === `pending` &&
                      ((e.status = `rejected`), (e.reason = t));
                  },
                )),
            e.status)
          ) {
            case `fulfilled`:
              return e.value;
            case `rejected`:
              throw e.reason;
          }
      }
      throw e;
    }
    function N(e, r, i, a, o) {
      var s = typeof e;
      (s === `undefined` || s === `boolean`) && (e = null);
      var c = !1;
      if (e === null) c = !0;
      else
        switch (s) {
          case `bigint`:
          case `string`:
          case `number`:
            c = !0;
            break;
          case `object`:
            switch (e.$$typeof) {
              case t:
              case n:
                c = !0;
                break;
              case d:
                return ((c = e._init), N(c(e._payload), r, i, a, o));
            }
        }
      if (c)
        return (
          (o = o(e)),
          (c = a === `` ? `.` + j(e, 0) : a),
          S(o)
            ? ((i = ``),
              c != null && (i = c.replace(A, `$&/`) + `/`),
              N(o, r, i, ``, function (e) {
                return e;
              }))
            : o != null &&
              (O(o) &&
                (o = D(
                  o,
                  i +
                    (o.key == null || (e && e.key === o.key)
                      ? ``
                      : (`` + o.key).replace(A, `$&/`) + `/`) +
                    c,
                )),
              r.push(o)),
          1
        );
      c = 0;
      var l = a === `` ? `.` : a + `:`;
      if (S(e))
        for (var u = 0; u < e.length; u++)
          ((a = e[u]), (s = l + j(a, u)), (c += N(a, r, i, s, o)));
      else if (((u = m(e)), typeof u == `function`))
        for (e = u.call(e), u = 0; !(a = e.next()).done; )
          ((a = a.value), (s = l + j(a, u++)), (c += N(a, r, i, s, o)));
      else if (s === `object`) {
        if (typeof e.then == `function`) return N(M(e), r, i, a, o);
        throw (
          (r = String(e)),
          Error(
            `Objects are not valid as a React child (found: ` +
              (r === `[object Object]`
                ? `object with keys {` + Object.keys(e).join(`, `) + `}`
                : r) +
              `). If you meant to render a collection of children, use an array instead.`,
          )
        );
      }
      return c;
    }
    function P(e, t, n) {
      if (e == null) return e;
      var r = [],
        i = 0;
      return (
        N(e, r, ``, ``, function (e) {
          return t.call(n, e, i++);
        }),
        r
      );
    }
    function ee(e) {
      if (e._status === -1) {
        var t = e._result;
        ((t = t()),
          t.then(
            function (t) {
              (e._status === 0 || e._status === -1) &&
                ((e._status = 1), (e._result = t));
            },
            function (t) {
              (e._status === 0 || e._status === -1) &&
                ((e._status = 2), (e._result = t));
            },
          ),
          e._status === -1 && ((e._status = 0), (e._result = t)));
      }
      if (e._status === 1) return e._result.default;
      throw e._result;
    }
    var F =
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
      I = {
        map: P,
        forEach: function (e, t, n) {
          P(
            e,
            function () {
              t.apply(this, arguments);
            },
            n,
          );
        },
        count: function (e) {
          var t = 0;
          return (
            P(e, function () {
              t++;
            }),
            t
          );
        },
        toArray: function (e) {
          return (
            P(e, function (e) {
              return e;
            }) || []
          );
        },
        only: function (e) {
          if (!O(e))
            throw Error(
              `React.Children.only expected to receive a single React element child.`,
            );
          return e;
        },
      };
    ((e.Activity = f),
      (e.Children = I),
      (e.Component = v),
      (e.Fragment = r),
      (e.Profiler = a),
      (e.PureComponent = b),
      (e.StrictMode = i),
      (e.Suspense = l),
      (e.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE = w),
      (e.__COMPILER_RUNTIME = {
        __proto__: null,
        c: function (e) {
          return w.H.useMemoCache(e);
        },
      }),
      (e.cache = function (e) {
        return function () {
          return e.apply(null, arguments);
        };
      }),
      (e.cacheSignal = function () {
        return null;
      }),
      (e.cloneElement = function (e, t, n) {
        if (e == null)
          throw Error(
            `The argument must be a React element, but you passed ` + e + `.`,
          );
        var r = g({}, e.props),
          i = e.key;
        if (t != null)
          for (a in (t.key !== void 0 && (i = `` + t.key), t))
            !T.call(t, a) ||
              a === `key` ||
              a === `__self` ||
              a === `__source` ||
              (a === `ref` && t.ref === void 0) ||
              (r[a] = t[a]);
        var a = arguments.length - 2;
        if (a === 1) r.children = n;
        else if (1 < a) {
          for (var o = Array(a), s = 0; s < a; s++) o[s] = arguments[s + 2];
          r.children = o;
        }
        return E(e.type, i, r);
      }),
      (e.createContext = function (e) {
        return (
          (e = {
            $$typeof: s,
            _currentValue: e,
            _currentValue2: e,
            _threadCount: 0,
            Provider: null,
            Consumer: null,
          }),
          (e.Provider = e),
          (e.Consumer = { $$typeof: o, _context: e }),
          e
        );
      }),
      (e.createElement = function (e, t, n) {
        var r,
          i = {},
          a = null;
        if (t != null)
          for (r in (t.key !== void 0 && (a = `` + t.key), t))
            T.call(t, r) &&
              r !== `key` &&
              r !== `__self` &&
              r !== `__source` &&
              (i[r] = t[r]);
        var o = arguments.length - 2;
        if (o === 1) i.children = n;
        else if (1 < o) {
          for (var s = Array(o), c = 0; c < o; c++) s[c] = arguments[c + 2];
          i.children = s;
        }
        if (e && e.defaultProps)
          for (r in ((o = e.defaultProps), o)) i[r] === void 0 && (i[r] = o[r]);
        return E(e, a, i);
      }),
      (e.createRef = function () {
        return { current: null };
      }),
      (e.forwardRef = function (e) {
        return { $$typeof: c, render: e };
      }),
      (e.isValidElement = O),
      (e.lazy = function (e) {
        return {
          $$typeof: d,
          _payload: { _status: -1, _result: e },
          _init: ee,
        };
      }),
      (e.memo = function (e, t) {
        return { $$typeof: u, type: e, compare: t === void 0 ? null : t };
      }),
      (e.startTransition = function (e) {
        var t = w.T,
          n = {};
        w.T = n;
        try {
          var r = e(),
            i = w.S;
          (i !== null && i(n, r),
            typeof r == `object` &&
              r &&
              typeof r.then == `function` &&
              r.then(C, F));
        } catch (e) {
          F(e);
        } finally {
          (t !== null && n.types !== null && (t.types = n.types), (w.T = t));
        }
      }),
      (e.unstable_useCacheRefresh = function () {
        return w.H.useCacheRefresh();
      }),
      (e.use = function (e) {
        return w.H.use(e);
      }),
      (e.useActionState = function (e, t, n) {
        return w.H.useActionState(e, t, n);
      }),
      (e.useCallback = function (e, t) {
        return w.H.useCallback(e, t);
      }),
      (e.useContext = function (e) {
        return w.H.useContext(e);
      }),
      (e.useDebugValue = function () {}),
      (e.useDeferredValue = function (e, t) {
        return w.H.useDeferredValue(e, t);
      }),
      (e.useEffect = function (e, t) {
        return w.H.useEffect(e, t);
      }),
      (e.useEffectEvent = function (e) {
        return w.H.useEffectEvent(e);
      }),
      (e.useId = function () {
        return w.H.useId();
      }),
      (e.useImperativeHandle = function (e, t, n) {
        return w.H.useImperativeHandle(e, t, n);
      }),
      (e.useInsertionEffect = function (e, t) {
        return w.H.useInsertionEffect(e, t);
      }),
      (e.useLayoutEffect = function (e, t) {
        return w.H.useLayoutEffect(e, t);
      }),
      (e.useMemo = function (e, t) {
        return w.H.useMemo(e, t);
      }),
      (e.useOptimistic = function (e, t) {
        return w.H.useOptimistic(e, t);
      }),
      (e.useReducer = function (e, t, n) {
        return w.H.useReducer(e, t, n);
      }),
      (e.useRef = function (e) {
        return w.H.useRef(e);
      }),
      (e.useState = function (e) {
        return w.H.useState(e);
      }),
      (e.useSyncExternalStore = function (e, t, n) {
        return w.H.useSyncExternalStore(e, t, n);
      }),
      (e.useTransition = function () {
        return w.H.useTransition();
      }),
      (e.version = `19.2.7`));
  }),
  d = o((e, t) => {
    t.exports = u();
  }),
  f = o((e) => {
    var t = d();
    function n(e) {
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
    function r() {}
    var i = {
        d: {
          f: r,
          r: function () {
            throw Error(n(522));
          },
          D: r,
          C: r,
          L: r,
          m: r,
          X: r,
          S: r,
          M: r,
        },
        p: 0,
        findDOMNode: null,
      },
      a = Symbol.for(`react.portal`);
    function o(e, t, n) {
      var r =
        3 < arguments.length && arguments[3] !== void 0 ? arguments[3] : null;
      return {
        $$typeof: a,
        key: r == null ? null : `` + r,
        children: e,
        containerInfo: t,
        implementation: n,
      };
    }
    var s = t.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE;
    function c(e, t) {
      if (e === `font`) return ``;
      if (typeof t == `string`) return t === `use-credentials` ? t : ``;
    }
    ((e.__DOM_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE = i),
      (e.createPortal = function (e, t) {
        var r =
          2 < arguments.length && arguments[2] !== void 0 ? arguments[2] : null;
        if (!t || (t.nodeType !== 1 && t.nodeType !== 9 && t.nodeType !== 11))
          throw Error(n(299));
        return o(e, t, null, r);
      }),
      (e.flushSync = function (e) {
        var t = s.T,
          n = i.p;
        try {
          if (((s.T = null), (i.p = 2), e)) return e();
        } finally {
          ((s.T = t), (i.p = n), i.d.f());
        }
      }),
      (e.preconnect = function (e, t) {
        typeof e == `string` &&
          (t
            ? ((t = t.crossOrigin),
              (t =
                typeof t == `string`
                  ? t === `use-credentials`
                    ? t
                    : ``
                  : void 0))
            : (t = null),
          i.d.C(e, t));
      }),
      (e.prefetchDNS = function (e) {
        typeof e == `string` && i.d.D(e);
      }),
      (e.preinit = function (e, t) {
        if (typeof e == `string` && t && typeof t.as == `string`) {
          var n = t.as,
            r = c(n, t.crossOrigin),
            a = typeof t.integrity == `string` ? t.integrity : void 0,
            o = typeof t.fetchPriority == `string` ? t.fetchPriority : void 0;
          n === `style`
            ? i.d.S(
                e,
                typeof t.precedence == `string` ? t.precedence : void 0,
                { crossOrigin: r, integrity: a, fetchPriority: o },
              )
            : n === `script` &&
              i.d.X(e, {
                crossOrigin: r,
                integrity: a,
                fetchPriority: o,
                nonce: typeof t.nonce == `string` ? t.nonce : void 0,
              });
        }
      }),
      (e.preinitModule = function (e, t) {
        if (typeof e == `string`)
          if (typeof t == `object` && t) {
            if (t.as == null || t.as === `script`) {
              var n = c(t.as, t.crossOrigin);
              i.d.M(e, {
                crossOrigin: n,
                integrity:
                  typeof t.integrity == `string` ? t.integrity : void 0,
                nonce: typeof t.nonce == `string` ? t.nonce : void 0,
              });
            }
          } else t ?? i.d.M(e);
      }),
      (e.preload = function (e, t) {
        if (
          typeof e == `string` &&
          typeof t == `object` &&
          t &&
          typeof t.as == `string`
        ) {
          var n = t.as,
            r = c(n, t.crossOrigin);
          i.d.L(e, n, {
            crossOrigin: r,
            integrity: typeof t.integrity == `string` ? t.integrity : void 0,
            nonce: typeof t.nonce == `string` ? t.nonce : void 0,
            type: typeof t.type == `string` ? t.type : void 0,
            fetchPriority:
              typeof t.fetchPriority == `string` ? t.fetchPriority : void 0,
            referrerPolicy:
              typeof t.referrerPolicy == `string` ? t.referrerPolicy : void 0,
            imageSrcSet:
              typeof t.imageSrcSet == `string` ? t.imageSrcSet : void 0,
            imageSizes: typeof t.imageSizes == `string` ? t.imageSizes : void 0,
            media: typeof t.media == `string` ? t.media : void 0,
          });
        }
      }),
      (e.preloadModule = function (e, t) {
        if (typeof e == `string`)
          if (t) {
            var n = c(t.as, t.crossOrigin);
            i.d.m(e, {
              as: typeof t.as == `string` && t.as !== `script` ? t.as : void 0,
              crossOrigin: n,
              integrity: typeof t.integrity == `string` ? t.integrity : void 0,
            });
          } else i.d.m(e);
      }),
      (e.requestFormReset = function (e) {
        i.d.r(e);
      }),
      (e.unstable_batchedUpdates = function (e, t) {
        return e(t);
      }),
      (e.useFormState = function (e, t, n) {
        return s.H.useFormState(e, t, n);
      }),
      (e.useFormStatus = function () {
        return s.H.useHostTransitionStatus();
      }),
      (e.version = `19.2.7`));
  }),
  p = o((e, t) => {
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
    (n(), (t.exports = f()));
  }),
  m = l(d(), 1),
  h = `modulepreload`,
  g = function (e) {
    return `/auth/` + e;
  },
  _ = {},
  v = function (e, t, n) {
    let r = Promise.resolve();
    if (t && t.length > 0) {
      let e = document.getElementsByTagName(`link`),
        i = document.querySelector(`meta[property=csp-nonce]`),
        a = i?.nonce || i?.getAttribute(`nonce`);
      function o(e) {
        return Promise.all(
          e.map((e) =>
            Promise.resolve(e).then(
              (e) => ({ status: `fulfilled`, value: e }),
              (e) => ({ status: `rejected`, reason: e }),
            ),
          ),
        );
      }
      r = o(
        t.map((t) => {
          if (((t = g(t, n)), t in _)) return;
          _[t] = !0;
          let r = t.endsWith(`.css`),
            i = r ? `[rel="stylesheet"]` : ``;
          if (n)
            for (let n = e.length - 1; n >= 0; n--) {
              let i = e[n];
              if (i.href === t && (!r || i.rel === `stylesheet`)) return;
            }
          else if (document.querySelector(`link[href="${t}"]${i}`)) return;
          let o = document.createElement(`link`);
          if (
            ((o.rel = r ? `stylesheet` : h),
            r || (o.as = `script`),
            (o.crossOrigin = ``),
            (o.href = t),
            a && o.setAttribute(`nonce`, a),
            document.head.appendChild(o),
            r)
          )
            return new Promise((e, n) => {
              (o.addEventListener(`load`, e),
                o.addEventListener(`error`, () =>
                  n(Error(`Unable to preload CSS for ${t}`)),
                ));
            });
        }),
      );
    }
    function i(e) {
      let t = new Event(`vite:preloadError`, { cancelable: !0 });
      if (((t.payload = e), window.dispatchEvent(t), !t.defaultPrevented))
        throw e;
    }
    return r.then((t) => {
      for (let e of t || []) e.status === `rejected` && i(e.reason);
      return e().catch(i);
    });
  },
  y = (e) => {
    throw TypeError(e);
  },
  b = (e, t, n) => t.has(e) || y(`Cannot ` + n),
  x = (e, t, n) => (
    b(e, t, `read from private field`),
    n ? n.call(e) : t.get(e)
  ),
  S = (e, t, n) =>
    t.has(e)
      ? y(`Cannot add the same private member more than once`)
      : t instanceof WeakSet
        ? t.add(e)
        : t.set(e, n),
  C = (e, t, n, r) => (
    b(e, t, `write to private field`),
    r ? r.call(e, n) : t.set(e, n),
    n
  ),
  w = `popstate`;
function T(e) {
  return (
    typeof e == `object` &&
    !!e &&
    `pathname` in e &&
    `search` in e &&
    `hash` in e &&
    `state` in e &&
    `key` in e
  );
}
function E(e = {}) {
  function t(e, t) {
    let n = t.state?.masked,
      { pathname: r, search: i, hash: a } = n || e.location;
    return j(
      ``,
      { pathname: r, search: i, hash: a },
      (t.state && t.state.usr) || null,
      (t.state && t.state.key) || `default`,
      n
        ? {
            pathname: e.location.pathname,
            search: e.location.search,
            hash: e.location.hash,
          }
        : void 0,
    );
  }
  function n(e, t) {
    return typeof t == `string` ? t : M(t);
  }
  return P(t, n, null, e);
}
function D(e, t) {
  if (e === !1 || e == null) throw Error(t);
}
function O(e, t) {
  if (!e) {
    typeof console < `u` && console.warn(t);
    try {
      throw Error(t);
    } catch {}
  }
}
function k() {
  return Math.random().toString(36).substring(2, 10);
}
function A(e, t) {
  return {
    usr: e.state,
    key: e.key,
    idx: t,
    masked: e.mask
      ? { pathname: e.pathname, search: e.search, hash: e.hash }
      : void 0,
  };
}
function j(e, t, n = null, r, i) {
  return {
    pathname: typeof e == `string` ? e : e.pathname,
    search: ``,
    hash: ``,
    ...(typeof t == `string` ? N(t) : t),
    state: n,
    key: (t && t.key) || r || k(),
    mask: i,
  };
}
function M({ pathname: e = `/`, search: t = ``, hash: n = `` }) {
  return (
    t && t !== `?` && (e += t.charAt(0) === `?` ? t : `?` + t),
    n && n !== `#` && (e += n.charAt(0) === `#` ? n : `#` + n),
    e
  );
}
function N(e) {
  let t = {};
  if (e) {
    let n = e.indexOf(`#`);
    n >= 0 && ((t.hash = e.substring(n)), (e = e.substring(0, n)));
    let r = e.indexOf(`?`);
    (r >= 0 && ((t.search = e.substring(r)), (e = e.substring(0, r))),
      e && (t.pathname = e));
  }
  return t;
}
function P(e, t, n, r = {}) {
  let { window: i = document.defaultView, v5Compat: a = !1 } = r,
    o = i.history,
    s = `POP`,
    c = null,
    l = u();
  l ?? ((l = 0), o.replaceState({ ...o.state, idx: l }, ``));
  function u() {
    return (o.state || { idx: null }).idx;
  }
  function d() {
    s = `POP`;
    let e = u(),
      t = e == null ? null : e - l;
    ((l = e), c && c({ action: s, location: h.location, delta: t }));
  }
  function f(e, t) {
    s = `PUSH`;
    let r = T(e) ? e : j(h.location, e, t);
    (n && n(r, e), (l = u() + 1));
    let d = A(r, l),
      f = h.createHref(r.mask || r);
    try {
      o.pushState(d, ``, f);
    } catch (e) {
      if (e instanceof DOMException && e.name === `DataCloneError`) throw e;
      i.location.assign(f);
    }
    a && c && c({ action: s, location: h.location, delta: 1 });
  }
  function p(e, t) {
    s = `REPLACE`;
    let r = T(e) ? e : j(h.location, e, t);
    (n && n(r, e), (l = u()));
    let i = A(r, l),
      d = h.createHref(r.mask || r);
    (o.replaceState(i, ``, d),
      a && c && c({ action: s, location: h.location, delta: 0 }));
  }
  function m(e) {
    return ee(i, e);
  }
  let h = {
    get action() {
      return s;
    },
    get location() {
      return e(i, o);
    },
    listen(e) {
      if (c) throw Error(`A history only accepts one active listener`);
      return (
        i.addEventListener(w, d),
        (c = e),
        () => {
          (i.removeEventListener(w, d), (c = null));
        }
      );
    },
    createHref(e) {
      return t(i, e);
    },
    createURL: m,
    encodeLocation(e) {
      let t = m(e);
      return { pathname: t.pathname, search: t.search, hash: t.hash };
    },
    push: f,
    replace: p,
    go(e) {
      return o.go(e);
    },
  };
  return h;
}
function ee(e, t, n = !1) {
  let r = `http://localhost`;
  (e &&
    (r = e.location.origin === `null` ? e.location.href : e.location.origin),
    D(r, `No window.location.(origin|href) available to create URL`));
  let i = typeof t == `string` ? t : M(t);
  return (
    (i = i.replace(/ $/, `%20`)),
    !n && i.startsWith(`//`) && (i = r + i),
    new URL(i, r)
  );
}
function F(e) {
  return { defaultValue: e };
}
var I,
  te = class {
    constructor(e) {
      if ((S(this, I, new Map()), e)) for (let [t, n] of e) this.set(t, n);
    }
    get(e) {
      if (x(this, I).has(e)) return x(this, I).get(e);
      if (e.defaultValue !== void 0) return e.defaultValue;
      throw Error(`No value found for context`);
    }
    set(e, t) {
      x(this, I).set(e, t);
    }
  };
I = new WeakMap();
var ne = new Set([`lazy`, `caseSensitive`, `path`, `id`, `index`, `children`]);
function re(e) {
  return ne.has(e);
}
var L = new Set([
  `lazy`,
  `caseSensitive`,
  `path`,
  `id`,
  `index`,
  `middleware`,
  `children`,
]);
function R(e) {
  return L.has(e);
}
function ie(e) {
  return e.index === !0;
}
function ae(e, t, n = [], r = {}, i = !1) {
  return e.map((e, a) => {
    let o = [...n, String(a)],
      s = typeof e.id == `string` ? e.id : o.join(`-`);
    if (
      (D(
        e.index !== !0 || !e.children,
        `Cannot specify children on an index route`,
      ),
      D(
        i || !r[s],
        `Found a route id collision on id "${s}".  Route id's must be globally unique within Data Router usages`,
      ),
      ie(e))
    ) {
      let n = { ...e, id: s };
      return ((r[s] = z(n, t(n))), n);
    } else {
      let n = { ...e, id: s, children: void 0 };
      return (
        (r[s] = z(n, t(n))),
        e.children && (n.children = ae(e.children, t, o, r, i)),
        n
      );
    }
  });
}
function z(e, t) {
  return Object.assign(e, {
    ...t,
    ...(typeof t.lazy == `object` && t.lazy != null
      ? { lazy: { ...e.lazy, ...t.lazy } }
      : {}),
  });
}
function oe(e, t, n = `/`) {
  return se(e, t, n, !1);
}
function se(e, t, n, r, i) {
  let a = Te((typeof t == `string` ? N(t) : t).pathname || `/`, n);
  if (a == null) return null;
  let o = i ?? le(e),
    s = null,
    c = we(a);
  for (let e = 0; s == null && e < o.length; ++e) s = xe(o[e], c, r);
  return s;
}
function ce(e, t) {
  let { route: n, pathname: r, params: i } = e;
  return {
    id: n.id,
    pathname: r,
    params: i,
    data: t[n.id],
    loaderData: t[n.id],
    handle: n.handle,
  };
}
function le(e) {
  let t = B(e);
  return (de(t), t);
}
function B(e, t = [], n = [], r = ``, i = !1) {
  let a = (e, a, o = i, s) => {
    let c = {
      relativePath: s === void 0 ? e.path || `` : s,
      caseSensitive: e.caseSensitive === !0,
      childrenIndex: a,
      route: e,
    };
    if (c.relativePath.startsWith(`/`)) {
      if (!c.relativePath.startsWith(r) && o) return;
      (D(
        c.relativePath.startsWith(r),
        `Absolute route path "${c.relativePath}" nested under path "${r}" is not valid. An absolute child route path must start with the combined path of all its parent routes.`,
      ),
        (c.relativePath = c.relativePath.slice(r.length)));
    }
    let l = V([r, c.relativePath]),
      u = n.concat(c);
    (e.children &&
      e.children.length > 0 &&
      (D(
        e.index !== !0,
        `Index routes must not have child routes. Please remove all child routes from route path "${l}".`,
      ),
      B(e.children, t, u, l, o)),
      !(e.path == null && !e.index) &&
        t.push({ path: l, score: ye(l, e.index), routesMeta: u }));
  };
  return (
    e.forEach((e, t) => {
      if (e.path === `` || !e.path?.includes(`?`)) a(e, t);
      else for (let n of ue(e.path)) a(e, t, !0, n);
    }),
    t
  );
}
function ue(e) {
  let t = e.split(`/`);
  if (t.length === 0) return [];
  let [n, ...r] = t,
    i = n.endsWith(`?`),
    a = n.replace(/\?$/, ``);
  if (r.length === 0) return i ? [a, ``] : [a];
  let o = ue(r.join(`/`)),
    s = [];
  return (
    s.push(...o.map((e) => (e === `` ? a : [a, e].join(`/`)))),
    i && s.push(...o),
    s.map((t) => (e.startsWith(`/`) && t === `` ? `/` : t))
  );
}
function de(e) {
  e.sort((e, t) =>
    e.score === t.score
      ? be(
          e.routesMeta.map((e) => e.childrenIndex),
          t.routesMeta.map((e) => e.childrenIndex),
        )
      : t.score - e.score,
  );
}
var fe = /^:[\w-]+$/,
  pe = 3,
  me = 2,
  he = 1,
  ge = 10,
  _e = -2,
  ve = (e) => e === `*`;
function ye(e, t) {
  let n = e.split(`/`),
    r = n.length;
  return (
    n.some(ve) && (r += _e),
    t && (r += me),
    n
      .filter((e) => !ve(e))
      .reduce((e, t) => e + (fe.test(t) ? pe : t === `` ? he : ge), r)
  );
}
function be(e, t) {
  return e.length === t.length && e.slice(0, -1).every((e, n) => e === t[n])
    ? e[e.length - 1] - t[t.length - 1]
    : 0;
}
function xe(e, t, n = !1) {
  let { routesMeta: r } = e,
    i = {},
    a = `/`,
    o = [];
  for (let e = 0; e < r.length; ++e) {
    let s = r[e],
      c = e === r.length - 1,
      l = a === `/` ? t : t.slice(a.length) || `/`,
      u = Se(
        { path: s.relativePath, caseSensitive: s.caseSensitive, end: c },
        l,
      ),
      d = s.route;
    if (
      (!u &&
        c &&
        n &&
        !r[r.length - 1].route.index &&
        (u = Se(
          { path: s.relativePath, caseSensitive: s.caseSensitive, end: !1 },
          l,
        )),
      !u)
    )
      return null;
    (Object.assign(i, u.params),
      o.push({
        params: i,
        pathname: V([a, u.pathname]),
        pathnameBase: Le(V([a, u.pathnameBase])),
        route: d,
      }),
      u.pathnameBase !== `/` && (a = V([a, u.pathnameBase])));
  }
  return o;
}
function Se(e, t) {
  typeof e == `string` && (e = { path: e, caseSensitive: !1, end: !0 });
  let [n, r] = Ce(e.path, e.caseSensitive, e.end),
    i = t.match(n);
  if (!i) return null;
  let a = i[0],
    o = a.replace(/(.)\/+$/, `$1`),
    s = i.slice(1);
  return {
    params: r.reduce((e, { paramName: t, isOptional: n }, r) => {
      if (t === `*`) {
        let e = s[r] || ``;
        o = a.slice(0, a.length - e.length).replace(/(.)\/+$/, `$1`);
      }
      let i = s[r];
      return (
        n && !i ? (e[t] = void 0) : (e[t] = (i || ``).replace(/%2F/g, `/`)),
        e
      );
    }, {}),
    pathname: a,
    pathnameBase: o,
    pattern: e,
  };
}
function Ce(e, t = !1, n = !0) {
  O(
    e === `*` || !e.endsWith(`*`) || e.endsWith(`/*`),
    `Route path "${e}" will be treated as if it were "${e.replace(/\*$/, `/*`)}" because the \`*\` character must always follow a \`/\` in the pattern. To get rid of this warning, please change the route path to "${e.replace(/\*$/, `/*`)}".`,
  );
  let r = [],
    i =
      `^` +
      e
        .replace(/\/*\*?$/, ``)
        .replace(/^\/*/, `/`)
        .replace(/[\\.*+^${}|()[\]]/g, `\\$&`)
        .replace(/\/:([\w-]+)(\?)?/g, (e, t, n, i, a) => {
          if ((r.push({ paramName: t, isOptional: n != null }), n)) {
            let t = a.charAt(i + e.length);
            return t && t !== `/` ? `/([^\\/]*)` : `(?:/([^\\/]*))?`;
          }
          return `/([^\\/]+)`;
        })
        .replace(/\/([\w-]+)\?(\/|$)/g, `(/$1)?$2`);
  return (
    e.endsWith(`*`)
      ? (r.push({ paramName: `*` }),
        (i += e === `*` || e === `/*` ? `(.*)$` : `(?:\\/(.+)|\\/*)$`))
      : n
        ? (i += `\\/*$`)
        : e !== `` && e !== `/` && (i += `(?:(?=\\/|$))`),
    [new RegExp(i, t ? void 0 : `i`), r]
  );
}
function we(e) {
  try {
    return e
      .split(`/`)
      .map((e) => decodeURIComponent(e).replace(/\//g, `%2F`))
      .join(`/`);
  } catch (t) {
    return (
      O(
        !1,
        `The URL path "${e}" could not be decoded because it is a malformed URL segment. This is probably due to a bad percent encoding (${t}).`,
      ),
      e
    );
  }
}
function Te(e, t) {
  if (t === `/`) return e;
  if (!e.toLowerCase().startsWith(t.toLowerCase())) return null;
  let n = t.endsWith(`/`) ? t.length - 1 : t.length,
    r = e.charAt(n);
  return r && r !== `/` ? null : e.slice(n) || `/`;
}
function Ee({ basename: e, pathname: t }) {
  return t === `/` ? e : V([e, t]);
}
var De = /^(?:[a-z][a-z0-9+.-]*:|\/\/)/i,
  Oe = (e) => De.test(e);
function ke(e, t = `/`) {
  let {
      pathname: n,
      search: r = ``,
      hash: i = ``,
    } = typeof e == `string` ? N(e) : e,
    a;
  return (
    n
      ? ((n = Fe(n)),
        (a = n.startsWith(`/`) ? Ae(n.substring(1), `/`) : Ae(n, t)))
      : (a = t),
    { pathname: a, search: Re(r), hash: ze(i) }
  );
}
function Ae(e, t) {
  let n = Ie(t).split(`/`);
  return (
    e.split(`/`).forEach((e) => {
      e === `..` ? n.length > 1 && n.pop() : e !== `.` && n.push(e);
    }),
    n.length > 1 ? n.join(`/`) : `/`
  );
}
function je(e, t, n, r) {
  return `Cannot include a '${e}' character in a manually specified \`to.${t}\` field [${JSON.stringify(r)}].  Please separate it out to the \`to.${n}\` field. Alternatively you may provide the full path as a string in <Link to="..."> and the router will parse it for you.`;
}
function Me(e) {
  return e.filter(
    (e, t) => t === 0 || (e.route.path && e.route.path.length > 0),
  );
}
function Ne(e) {
  let t = Me(e);
  return t.map((e, n) => (n === t.length - 1 ? e.pathname : e.pathnameBase));
}
function Pe(e, t, n, r = !1) {
  let i;
  typeof e == `string`
    ? (i = N(e))
    : ((i = { ...e }),
      D(
        !i.pathname || !i.pathname.includes(`?`),
        je(`?`, `pathname`, `search`, i),
      ),
      D(
        !i.pathname || !i.pathname.includes(`#`),
        je(`#`, `pathname`, `hash`, i),
      ),
      D(!i.search || !i.search.includes(`#`), je(`#`, `search`, `hash`, i)));
  let a = e === `` || i.pathname === ``,
    o = a ? `/` : i.pathname,
    s;
  if (o == null) s = n;
  else {
    let e = t.length - 1;
    if (!r && o.startsWith(`..`)) {
      let t = o.split(`/`);
      for (; t[0] === `..`; ) (t.shift(), --e);
      i.pathname = t.join(`/`);
    }
    s = e >= 0 ? t[e] : `/`;
  }
  let c = ke(i, s),
    l = o && o !== `/` && o.endsWith(`/`),
    u = (a || o === `.`) && n.endsWith(`/`);
  return (!c.pathname.endsWith(`/`) && (l || u) && (c.pathname += `/`), c);
}
var Fe = (e) => e.replace(/\/\/+/g, `/`),
  V = (e) => Fe(e.join(`/`)),
  Ie = (e) => e.replace(/\/+$/, ``),
  Le = (e) => Ie(e).replace(/^\/*/, `/`),
  Re = (e) => (!e || e === `?` ? `` : e.startsWith(`?`) ? e : `?` + e),
  ze = (e) => (!e || e === `#` ? `` : e.startsWith(`#`) ? e : `#` + e),
  Be = class {
    constructor(e, t, n, r = !1) {
      ((this.status = e),
        (this.statusText = t || ``),
        (this.internal = r),
        n instanceof Error
          ? ((this.data = n.toString()), (this.error = n))
          : (this.data = n));
    }
  };
function Ve(e) {
  return (
    e != null &&
    typeof e.status == `number` &&
    typeof e.statusText == `string` &&
    typeof e.internal == `boolean` &&
    `data` in e
  );
}
function He(e) {
  return V(e.map((e) => e.route.path).filter(Boolean)) || `/`;
}
var Ue =
  typeof window < `u` &&
  window.document !== void 0 &&
  window.document.createElement !== void 0;
function We(e, t) {
  let n = e;
  if (typeof n != `string` || !De.test(n))
    return { absoluteURL: void 0, isExternal: !1, to: n };
  let r = n,
    i = !1;
  if (Ue)
    try {
      let e = new URL(window.location.href),
        r = n.startsWith(`//`) ? new URL(e.protocol + n) : new URL(n),
        a = Te(r.pathname, t);
      r.origin === e.origin && a != null
        ? (n = a + r.search + r.hash)
        : (i = !0);
    } catch {
      O(
        !1,
        `<Link to="${n}"> contains an invalid URL which will probably break when clicked - please update to a valid URL path.`,
      );
    }
  return { absoluteURL: r, isExternal: i, to: n };
}
var Ge = Symbol(`Uninstrumented`);
function Ke(e, t) {
  let n = {
    lazy: [],
    "lazy.loader": [],
    "lazy.action": [],
    "lazy.middleware": [],
    middleware: [],
    loader: [],
    action: [],
  };
  e.forEach((e) =>
    e({
      id: t.id,
      index: t.index,
      path: t.path,
      instrument(e) {
        let t = Object.keys(n);
        for (let r of t) e[r] && n[r].push(e[r]);
      },
    }),
  );
  let r = {};
  if (typeof t.lazy == `function` && n.lazy.length > 0) {
    let e = Je(n.lazy, t.lazy, () => void 0);
    e && (r.lazy = e);
  }
  if (typeof t.lazy == `object`) {
    let e = t.lazy;
    [`middleware`, `loader`, `action`].forEach((t) => {
      let i = e[t],
        a = n[`lazy.${t}`];
      if (typeof i == `function` && a.length > 0) {
        let e = Je(a, i, () => void 0);
        e && (r.lazy = Object.assign(r.lazy || {}, { [t]: e }));
      }
    });
  }
  return (
    [`loader`, `action`].forEach((e) => {
      let i = t[e];
      if (typeof i == `function` && n[e].length > 0) {
        let t = i[Ge] ?? i,
          a = Je(n[e], t, (...e) => Xe(e[0]));
        a &&
          (e === `loader` && t.hydrate === !0 && (a.hydrate = !0),
          (a[Ge] = t),
          (r[e] = a));
      }
    }),
    t.middleware &&
      t.middleware.length > 0 &&
      n.middleware.length > 0 &&
      (r.middleware = t.middleware.map((e) => {
        let t = e[Ge] ?? e,
          r = Je(n.middleware, t, (...e) => Xe(e[0]));
        return r ? ((r[Ge] = t), r) : e;
      })),
    r
  );
}
function qe(e, t) {
  let n = { navigate: [], fetch: [] };
  if (
    (t.forEach((e) =>
      e({
        instrument(e) {
          let t = Object.keys(e);
          for (let r of t) e[r] && n[r].push(e[r]);
        },
      }),
    ),
    n.navigate.length > 0)
  ) {
    let t = e.navigate[Ge] ?? e.navigate,
      r = Je(n.navigate, t, (...t) => {
        let [n, r] = t;
        return {
          to: typeof n == `number` || typeof n == `string` ? n : n ? M(n) : `.`,
          ...Ze(e, r ?? {}),
        };
      });
    r && ((r[Ge] = t), (e.navigate = r));
  }
  if (n.fetch.length > 0) {
    let t = e.fetch[Ge] ?? e.fetch,
      r = Je(n.fetch, t, (...t) => {
        let [n, , r, i] = t;
        return { href: r ?? `.`, fetcherKey: n, ...Ze(e, i ?? {}) };
      });
    r && ((r[Ge] = t), (e.fetch = r));
  }
  return e;
}
function Je(e, t, n) {
  return e.length === 0
    ? null
    : async (...r) => {
        let i = await Ye(e, n(...r), () => t(...r), e.length - 1);
        if (i.type === `error`) throw i.value;
        return i.value;
      };
}
async function Ye(e, t, n, r) {
  let i = e[r],
    a;
  if (i) {
    let o,
      s = async () => (
        o
          ? console.error(
              `You cannot call instrumented handlers more than once`,
            )
          : (o = Ye(e, t, n, r - 1)),
        (a = await o),
        D(a, `Expected a result`),
        a.type === `error` && a.value instanceof Error
          ? { status: `error`, error: a.value }
          : { status: `success`, error: void 0 }
      );
    try {
      await i(s, t);
    } catch (e) {
      console.error(`An instrumentation function threw an error:`, e);
    }
    (o || (await s()), await o);
  } else
    try {
      a = { type: `success`, value: await n() };
    } catch (e) {
      a = { type: `error`, value: e };
    }
  return (
    a || {
      type: `error`,
      value: Error(`No result assigned in instrumentation chain.`),
    }
  );
}
function Xe(e) {
  let { request: t, context: n, params: r, pattern: i } = e;
  return { request: Qe(t), params: { ...r }, pattern: i, context: $e(n) };
}
function Ze(e, t) {
  return {
    currentUrl: M(e.state.location),
    ...(`formMethod` in t ? { formMethod: t.formMethod } : {}),
    ...(`formEncType` in t ? { formEncType: t.formEncType } : {}),
    ...(`formData` in t ? { formData: t.formData } : {}),
    ...(`body` in t ? { body: t.body } : {}),
  };
}
function Qe(e) {
  return {
    method: e.method,
    url: e.url,
    headers: { get: (...t) => e.headers.get(...t) },
  };
}
function $e(e) {
  if (tt(e)) {
    let t = { ...e };
    return (Object.freeze(t), t);
  } else return { get: (t) => e.get(t) };
}
var et = Object.getOwnPropertyNames(Object.prototype).sort().join(`\0`);
function tt(e) {
  if (typeof e != `object` || !e) return !1;
  let t = Object.getPrototypeOf(e);
  return (
    t === Object.prototype ||
    t === null ||
    Object.getOwnPropertyNames(t).sort().join(`\0`) === et
  );
}
var nt = [`POST`, `PUT`, `PATCH`, `DELETE`],
  rt = new Set(nt),
  it = [`GET`, ...nt],
  at = new Set(it),
  ot = new Set([301, 302, 303, 307, 308]),
  st = new Set([307, 308]),
  ct = {
    state: `idle`,
    location: void 0,
    matches: void 0,
    historyAction: void 0,
    formMethod: void 0,
    formAction: void 0,
    formEncType: void 0,
    formData: void 0,
    json: void 0,
    text: void 0,
  },
  lt = {
    state: `idle`,
    data: void 0,
    formMethod: void 0,
    formAction: void 0,
    formEncType: void 0,
    formData: void 0,
    json: void 0,
    text: void 0,
  },
  ut = { state: `unblocked`, proceed: void 0, reset: void 0, location: void 0 },
  dt = (e) => ({ hasErrorBoundary: !!e.hasErrorBoundary }),
  ft = `remix-router-transitions`,
  pt = Symbol(`ResetLoaderData`),
  mt,
  ht,
  gt,
  _t,
  vt = class {
    constructor(e) {
      (S(this, mt),
        S(this, ht),
        S(this, gt),
        S(this, _t),
        C(this, mt, e),
        C(this, ht, le(e)));
    }
    get stableRoutes() {
      return x(this, mt);
    }
    get activeRoutes() {
      return x(this, gt) ?? x(this, mt);
    }
    get branches() {
      return x(this, _t) ?? x(this, ht);
    }
    get hasHMRRoutes() {
      return x(this, gt) != null;
    }
    setRoutes(e) {
      (C(this, mt, e), C(this, ht, le(e)));
    }
    setHmrRoutes(e) {
      (C(this, gt, e), C(this, _t, le(e)));
    }
    commitHmrRoutes() {
      x(this, gt) &&
        (C(this, mt, x(this, gt)),
        C(this, ht, x(this, _t)),
        C(this, gt, void 0),
        C(this, _t, void 0));
    }
  };
((mt = new WeakMap()),
  (ht = new WeakMap()),
  (gt = new WeakMap()),
  (_t = new WeakMap()));
function yt(e) {
  let t = e.window ? e.window : typeof window < `u` ? window : void 0,
    n =
      t !== void 0 &&
      t.document !== void 0 &&
      t.document.createElement !== void 0;
  D(
    e.routes.length > 0,
    `You must provide a non-empty routes array to createRouter`,
  );
  let r = e.hydrationRouteProperties || [],
    i = e.mapRouteProperties || dt,
    a = i;
  if (e.instrumentations) {
    let t = e.instrumentations;
    a = (e) => ({ ...i(e), ...Ke(t.map((e) => e.route).filter(Boolean), e) });
  }
  let o = {},
    s = new vt(ae(e.routes, a, void 0, o)),
    c = e.basename || `/`;
  c.startsWith(`/`) || (c = `/${c}`);
  let l = e.dataStrategy || It,
    u = { ...e.future },
    d = null,
    f = new Set(),
    p = null,
    m = null,
    h = null,
    g = null,
    _ = e.hydrationData != null,
    v = se(s.activeRoutes, e.history.location, c, !1, s.branches),
    y = !1,
    b = null,
    x,
    S;
  if (v == null && !e.patchRoutesOnNavigation) {
    let t = sn(404, { pathname: e.history.location.pathname }),
      { matches: n, route: r } = on(s.activeRoutes);
    ((x = !0), (S = !x), (v = n), (b = { [r.id]: t }));
  } else if (
    (v &&
      !e.hydrationData &&
      nt(v, s.activeRoutes, e.history.location.pathname).active &&
      (v = null),
    !v)
  ) {
    ((x = !1), (S = !x), (v = []));
    let t = nt(null, s.activeRoutes, e.history.location.pathname);
    t.active && t.matches && ((y = !0), (v = t.matches));
  } else if (v.some((e) => e.route.lazy)) ((x = !1), (S = !x));
  else if (!v.some((e) => wt(e.route))) ((x = !0), (S = !x));
  else {
    let t = e.hydrationData ? e.hydrationData.loaderData : null,
      n = e.hydrationData ? e.hydrationData.errors : null,
      r = v;
    if (n) {
      let e = v.findIndex((e) => n[e.route.id] !== void 0);
      r = r.slice(0, e + 1);
    }
    ((S = !1),
      (x = !0),
      r.forEach((e) => {
        let r = Tt(e.route, t, n);
        ((S ||= r.renderFallback), (x &&= !r.shouldLoad));
      }));
  }
  let C,
    w = {
      historyAction: e.history.action,
      location: e.history.location,
      matches: v,
      initialized: x,
      renderFallback: S,
      navigation: ct,
      restoreScrollPosition: e.hydrationData == null ? null : !1,
      preventScrollReset: !1,
      revalidation: `idle`,
      loaderData: (e.hydrationData && e.hydrationData.loaderData) || {},
      actionData: (e.hydrationData && e.hydrationData.actionData) || null,
      errors: (e.hydrationData && e.hydrationData.errors) || b,
      fetchers: new Map(),
      blockers: new Map(),
    },
    T = `POP`,
    E = null,
    k = !1,
    A,
    M = !1,
    P = new Map(),
    F = null,
    I = !1,
    ne = !1,
    re = new Set(),
    L = new Map(),
    R = 0,
    ie = -1,
    z = new Map(),
    oe = new Set(),
    le = new Map(),
    B = new Map(),
    ue = new Set(),
    de = new Map(),
    fe,
    pe = null;
  function me() {
    if (
      ((d = e.history.listen(({ action: t, location: n, delta: r }) => {
        if (fe) {
          (fe(), (fe = void 0));
          return;
        }
        O(
          de.size === 0 || r != null,
          "You are trying to use a blocker on a POP navigation to a location that was not created by @remix-run/router. This will fail silently in production. This can happen if you are navigating outside the router via `window.history.pushState`/`window.location.hash` instead of using router navigation APIs.  This can also happen if you are using createHashRouter and the user manually changes the URL.",
        );
        let i = Xe({
          currentLocation: w.location,
          nextLocation: n,
          historyAction: t,
        });
        if (i && r != null) {
          let t = new Promise((e) => {
            fe = e;
          });
          (e.history.go(r * -1),
            Ye(i, {
              state: `blocked`,
              location: n,
              proceed() {
                (Ye(i, {
                  state: `proceeding`,
                  proceed: void 0,
                  reset: void 0,
                  location: n,
                }),
                  t.then(() => e.history.go(r)));
              },
              reset() {
                let e = new Map(w.blockers);
                (e.set(i, ut), _e({ blockers: e }));
              },
            }),
            E?.resolve(),
            (E = null));
          return;
        }
        return xe(t, n);
      })),
      n)
    ) {
      jn(t, P);
      let e = () => Mn(t, P);
      (t.addEventListener(`pagehide`, e),
        (F = () => t.removeEventListener(`pagehide`, e)));
    }
    return (
      w.initialized || xe(`POP`, w.location, { initialHydration: !0 }),
      C
    );
  }
  function he() {
    (d && d(),
      F && F(),
      f.clear(),
      A && A.abort(),
      w.fetchers.forEach((e, t) => Re(w.fetchers, t)),
      w.blockers.forEach((e, t) => Je(t)));
  }
  function ge(e) {
    if ((f.add(e), p)) {
      let { newErrors: t } = p;
      ((p = null),
        e(w, {
          deletedFetchers: [],
          newErrors: t,
          viewTransitionOpts: void 0,
          flushSync: !1,
        }));
    }
    return () => f.delete(e);
  }
  function _e(e, t = {}) {
    ((e.matches &&= e.matches.map((e) => {
      let t = o[e.route.id],
        n = e.route;
      return n.element !== t.element ||
        n.errorElement !== t.errorElement ||
        n.hydrateFallbackElement !== t.hydrateFallbackElement
        ? { ...e, route: t }
        : e;
    })),
      (w = { ...w, ...e }));
    let n = [],
      r = [];
    (w.fetchers.forEach((e, t) => {
      e.state === `idle` && (ue.has(t) ? n.push(t) : r.push(t));
    }),
      ue.forEach((e) => {
        !w.fetchers.has(e) && !L.has(e) && n.push(e);
      }),
      f.size === 0 && (p = { newErrors: e.errors ?? null }),
      [...f].forEach((r) =>
        r(w, {
          deletedFetchers: n,
          newErrors: e.errors ?? null,
          viewTransitionOpts: t.viewTransitionOpts,
          flushSync: t.flushSync === !0,
        }),
      ),
      n.forEach((e) => Re(w.fetchers, e)),
      r.forEach((e) => w.fetchers.delete(e)));
  }
  function ve(t, n, { flushSync: r } = {}) {
    let i =
        w.actionData != null &&
        w.navigation.formMethod != null &&
        Sn(w.navigation.formMethod) &&
        w.navigation.state === `loading` &&
        t.state?._isRedirect !== !0,
      a;
    a = n.actionData
      ? Object.keys(n.actionData).length > 0
        ? n.actionData
        : null
      : i
        ? w.actionData
        : null;
    let o = n.loaderData
        ? nn(w.loaderData, n.loaderData, n.matches || [], n.errors)
        : w.loaderData,
      c = w.blockers;
    c.size > 0 && ((c = new Map(c)), c.forEach((e, t) => c.set(t, ut)));
    let l = I ? !1 : tt(t, n.matches || w.matches),
      u =
        k === !0 ||
        (w.navigation.formMethod != null &&
          Sn(w.navigation.formMethod) &&
          t.state?._isRedirect !== !0);
    (s.commitHmrRoutes(),
      I ||
        T === `POP` ||
        (T === `PUSH`
          ? e.history.push(t, t.state)
          : T === `REPLACE` && e.history.replace(t, t.state)));
    let d;
    if (T === `POP`) {
      let e = P.get(w.location.pathname);
      e && e.has(t.pathname)
        ? (d = { currentLocation: w.location, nextLocation: t })
        : P.has(t.pathname) &&
          (d = { currentLocation: t, nextLocation: w.location });
    } else if (M) {
      let e = P.get(w.location.pathname);
      (e
        ? e.add(t.pathname)
        : ((e = new Set([t.pathname])), P.set(w.location.pathname, e)),
        (d = { currentLocation: w.location, nextLocation: t }));
    }
    (_e(
      {
        ...n,
        actionData: a,
        loaderData: o,
        historyAction: T,
        location: t,
        initialized: !0,
        renderFallback: !1,
        navigation: ct,
        revalidation: `idle`,
        restoreScrollPosition: l,
        preventScrollReset: u,
        blockers: c,
      },
      { viewTransitionOpts: d, flushSync: r === !0 },
    ),
      (T = `POP`),
      (k = !1),
      (M = !1),
      (I = !1),
      (ne = !1),
      E?.resolve(),
      (E = null),
      pe?.resolve(),
      (pe = null));
  }
  async function ye(t, n) {
    if ((E?.resolve(), (E = null), typeof t == `number`)) {
      E ||= Nn();
      let n = E.promise;
      return (e.history.go(t), n);
    }
    let {
        path: r,
        submission: i,
        error: a,
      } = St(
        !1,
        xt(w.location, w.matches, c, t, n?.fromRouteId, n?.relative),
        n,
      ),
      o;
    n?.mask &&
      (o = {
        pathname: ``,
        search: ``,
        hash: ``,
        ...(typeof n.mask == `string`
          ? N(n.mask)
          : { ...w.location.mask, ...n.mask }),
      });
    let s = w.location,
      l = j(s, r, n && n.state, void 0, o);
    l = { ...l, ...e.history.encodeLocation(l) };
    let u = n && n.replace != null ? n.replace : void 0,
      d = `PUSH`;
    u === !0
      ? (d = `REPLACE`)
      : u === !1 ||
        (i != null &&
          Sn(i.formMethod) &&
          i.formAction === w.location.pathname + w.location.search &&
          (d = `REPLACE`));
    let f =
        n && `preventScrollReset` in n ? n.preventScrollReset === !0 : void 0,
      p = (n && n.flushSync) === !0,
      m = Xe({ currentLocation: s, nextLocation: l, historyAction: d });
    if (m) {
      Ye(m, {
        state: `blocked`,
        location: l,
        proceed() {
          (Ye(m, {
            state: `proceeding`,
            proceed: void 0,
            reset: void 0,
            location: l,
          }),
            ye(t, n));
        },
        reset() {
          let e = new Map(w.blockers);
          (e.set(m, ut), _e({ blockers: e }));
        },
      });
      return;
    }
    await xe(d, l, {
      submission: i,
      pendingError: a,
      preventScrollReset: f,
      replace: n && n.replace,
      enableViewTransition: n && n.viewTransition,
      flushSync: p,
      callSiteDefaultShouldRevalidate: n && n.defaultShouldRevalidate,
    });
  }
  function be() {
    ((pe ||= Nn()), Pe(), _e({ revalidation: `loading` }));
    let e = pe.promise;
    return w.navigation.state === `submitting`
      ? e
      : w.navigation.state === `idle`
        ? (xe(w.historyAction, w.location, {
            startUninterruptedRevalidation: !0,
          }),
          e)
        : (xe(T || w.historyAction, w.navigation.location, {
            overrideNavigation: w.navigation,
            enableViewTransition: M === !0,
          }),
          e);
  }
  async function xe(t, n, r) {
    (A && A.abort(),
      (A = null),
      (T = t),
      (I = (r && r.startUninterruptedRevalidation) === !0),
      et(w.location, w.matches),
      (k = (r && r.preventScrollReset) === !0),
      (M = (r && r.enableViewTransition) === !0));
    let i = s.activeRoutes,
      a =
        r?.initialHydration && w.matches && w.matches.length > 0 && !y
          ? w.matches
          : se(i, n, c, !1, s.branches),
      o = (r && r.flushSync) === !0;
    if (
      a &&
      w.initialized &&
      !ne &&
      un(w.location, n) &&
      !(r && r.submission && Sn(r.submission.formMethod))
    ) {
      ve(n, { matches: a }, { flushSync: o });
      return;
    }
    let l = nt(a, i, n.pathname);
    if ((l.active && l.matches && (a = l.matches), !a)) {
      let { error: e, notFoundMatches: t, route: r } = Ze(n.pathname);
      ve(
        n,
        { matches: t, loaderData: {}, errors: { [r.id]: e } },
        { flushSync: o },
      );
      return;
    }
    let u =
      r && r.overrideNavigation
        ? { ...r.overrideNavigation, matches: a, historyAction: t }
        : void 0;
    A = new AbortController();
    let d = Xt(e.history, n, A.signal, r && r.submission),
      f = e.getContext ? await e.getContext() : new te(),
      p;
    if (r && r.pendingError)
      p = [an(a).route.id, { type: `error`, error: r.pendingError }];
    else if (r && r.submission && Sn(r.submission.formMethod)) {
      let i = await Se(
        d,
        n,
        r.submission,
        a,
        t,
        f,
        l.active,
        r && r.initialHydration === !0,
        { replace: r.replace, flushSync: o },
      );
      if (i.shortCircuited) return;
      if (i.pendingActionResult) {
        let [e, t] = i.pendingActionResult;
        if (hn(t) && Ve(t.error) && t.error.status === 404) {
          ((A = null),
            ve(n, {
              matches: i.matches,
              loaderData: {},
              errors: { [e]: t.error },
            }));
          return;
        }
      }
      ((a = i.matches || a),
        (p = i.pendingActionResult),
        (u = En(n, a, t, r.submission)),
        (o = !1),
        (l.active = !1),
        (d = Xt(e.history, d.url, d.signal)));
    }
    let {
      shortCircuited: m,
      matches: h,
      loaderData: g,
      errors: _,
      workingFetchers: v,
    } = await Ce(
      d,
      n,
      a,
      t,
      f,
      l.active,
      u,
      r && r.submission,
      r && r.fetcherSubmission,
      r && r.replace,
      r && r.initialHydration === !0,
      o,
      p,
      r && r.callSiteDefaultShouldRevalidate,
    );
    m ||
      ((A = null),
      ve(n, {
        matches: h || a,
        ...rn(p),
        loaderData: g,
        errors: _,
        ...(v ? { fetchers: v } : {}),
      }));
  }
  async function Se(t, n, i, l, u, d, f, p, m = {}) {
    if (
      (Pe(),
      _e({ navigation: Dn(n, l, u, i) }, { flushSync: m.flushSync === !0 }),
      f)
    ) {
      let e = await rt(l, n.pathname, t.signal);
      if (e.type === `aborted`) return { shortCircuited: !0 };
      if (e.type === `error`) {
        if (e.partialMatches.length === 0) {
          let { matches: t, route: n } = on(s.activeRoutes);
          return {
            matches: t,
            pendingActionResult: [n.id, { type: `error`, error: e.error }],
          };
        }
        let t = an(e.partialMatches).route.id;
        return {
          matches: e.partialMatches,
          pendingActionResult: [t, { type: `error`, error: e.error }],
        };
      } else if (e.matches) l = e.matches;
      else {
        let { notFoundMatches: e, error: t, route: r } = Ze(n.pathname);
        return {
          matches: e,
          pendingActionResult: [r.id, { type: `error`, error: t }],
        };
      }
    }
    let h,
      g = wn(l, n);
    if (!g.route.action && !g.route.lazy)
      h = {
        type: `error`,
        error: sn(405, {
          method: t.method,
          pathname: n.pathname,
          routeId: g.route.id,
        }),
      };
    else {
      let e = await Me(t, n, Ht(a, o, t, n, l, g, p ? [] : r, d), d, null);
      if (((h = e[g.route.id]), !h)) {
        for (let t of l)
          if (e[t.route.id]) {
            h = e[t.route.id];
            break;
          }
      }
      if (t.signal.aborted) return { shortCircuited: !0 };
    }
    if (gn(h)) {
      let n;
      return (
        (n =
          m && m.replace != null
            ? m.replace
            : Yt(
                h.response.headers.get(`Location`),
                new URL(t.url),
                c,
                e.history,
              ) ===
              w.location.pathname + w.location.search),
        await je(t, h, !0, { submission: i, replace: n }),
        { shortCircuited: !0 }
      );
    }
    if (hn(h)) {
      let e = an(l, g.route.id);
      return (
        (m && m.replace) !== !0 && (T = `PUSH`),
        { matches: l, pendingActionResult: [e.route.id, h, g.route.id] }
      );
    }
    return { matches: l, pendingActionResult: [g.route.id, h] };
  }
  async function Ce(t, n, i, l, u, d, f, p, m, h, g, _, v, y) {
    let b = f || En(n, i, l, p),
      x = p || m || Tn(b),
      S = !I && !g;
    if (d) {
      if (S) {
        let e = we(v);
        _e(
          { navigation: b, ...(e === void 0 ? {} : { actionData: e }) },
          { flushSync: _ },
        );
      }
      let e = await rt(i, n.pathname, t.signal);
      if (e.type === `aborted`) return { shortCircuited: !0 };
      if (e.type === `error`) {
        if (e.partialMatches.length === 0) {
          let { matches: t, route: n } = on(s.activeRoutes);
          return { matches: t, loaderData: {}, errors: { [n.id]: e.error } };
        }
        let t = an(e.partialMatches).route.id;
        return {
          matches: e.partialMatches,
          loaderData: {},
          errors: { [t]: e.error },
        };
      } else if (e.matches) i = e.matches;
      else {
        let { error: e, notFoundMatches: t, route: r } = Ze(n.pathname);
        return { matches: t, loaderData: {}, errors: { [r.id]: e } };
      }
    }
    let C = s.activeRoutes,
      { dsMatches: T, revalidatingFetchers: E } = Ct(
        t,
        u,
        a,
        o,
        e.history,
        w,
        i,
        x,
        n,
        g ? [] : r,
        g === !0,
        ne,
        re,
        ue,
        le,
        oe,
        C,
        c,
        e.patchRoutesOnNavigation != null,
        s.branches,
        v,
        y,
      );
    if (
      ((ie = ++R),
      !e.dataStrategy &&
        !T.some((e) => e.shouldLoad) &&
        !T.some((e) => e.route.middleware && e.route.middleware.length > 0) &&
        E.length === 0)
    ) {
      let e = new Map(w.fetchers),
        t = Ue(e);
      return (
        ve(
          n,
          {
            matches: i,
            loaderData: {},
            errors: v && hn(v[1]) ? { [v[0]]: v[1].error } : null,
            ...rn(v),
            ...(t ? { fetchers: e } : {}),
          },
          { flushSync: _ },
        ),
        { shortCircuited: !0 }
      );
    }
    if (S) {
      let e = {};
      if (!d) {
        e.navigation = b;
        let t = we(v);
        t !== void 0 && (e.actionData = t);
      }
      (E.length > 0 && (e.fetchers = Ee(E)), _e(e, { flushSync: _ }));
    }
    E.forEach((e) => {
      (Be(e.key), e.controller && L.set(e.key, e.controller));
    });
    let D = () => E.forEach((e) => Be(e.key));
    A && A.signal.addEventListener(`abort`, D);
    let { loaderResults: O, fetcherResults: k } = await Ne(T, E, t, n, u);
    if (t.signal.aborted) return { shortCircuited: !0 };
    (A && A.signal.removeEventListener(`abort`, D),
      E.forEach((e) => L.delete(e.key)));
    let j = cn(O);
    if (j)
      return (
        await je(t, j.result, !0, { replace: h }),
        { shortCircuited: !0 }
      );
    if (((j = cn(k)), j))
      return (
        oe.add(j.key),
        await je(t, j.result, !0, { replace: h }),
        { shortCircuited: !0 }
      );
    let M = new Map(w.fetchers),
      { loaderData: N, errors: P } = tn(w, i, O, v, E, k, M);
    g && w.errors && (P = { ...w.errors, ...P });
    let ee = Ue(M),
      F = We(ie, M),
      te = ee || F || E.length > 0;
    return {
      matches: i,
      loaderData: N,
      errors: P,
      ...(te ? { workingFetchers: M } : {}),
    };
  }
  function we(e) {
    if (e && !hn(e[1])) return { [e[0]]: e[1].data };
    if (w.actionData)
      return Object.keys(w.actionData).length === 0 ? null : w.actionData;
  }
  function Ee(e) {
    let t = new Map(w.fetchers);
    return (
      e.forEach((e) => {
        let n = t.get(e.key),
          r = On(void 0, n ? n.data : void 0);
        t.set(e.key, r);
      }),
      t
    );
  }
  async function De(t, n, r, i) {
    Be(t);
    let a = (i && i.flushSync) === !0,
      o = s.activeRoutes,
      l = xt(w.location, w.matches, c, r, n, i?.relative),
      u = se(o, l, c, !1, s.branches),
      d = nt(u, o, l);
    if ((d.active && d.matches && (u = d.matches), !u)) {
      V(t, n, sn(404, { pathname: l }), { flushSync: a });
      return;
    }
    let { path: f, submission: p, error: m } = St(!0, l, i);
    if (m) {
      V(t, n, m, { flushSync: a });
      return;
    }
    let h = e.getContext ? await e.getContext() : new te(),
      g = (i && i.preventScrollReset) === !0;
    if (p && Sn(p.formMethod)) {
      await ke(
        t,
        n,
        f,
        u,
        h,
        d.active,
        a,
        g,
        p,
        i && i.defaultShouldRevalidate,
      );
      return;
    }
    (le.set(t, { routeId: n, path: f }),
      await Ae(t, n, f, u, h, d.active, a, g, p));
  }
  async function ke(t, n, i, l, u, d, f, p, m, h) {
    (Pe(), le.delete(t), Fe(t, kn(m, w.fetchers.get(t)), { flushSync: f }));
    let g = new AbortController(),
      _ = Xt(e.history, i, g.signal, m);
    if (d) {
      let e = await rt(l, new URL(_.url).pathname, _.signal, t);
      if (e.type === `aborted`) return;
      if (e.type === `error`) {
        V(t, n, e.error, { flushSync: f });
        return;
      } else if (e.matches) l = e.matches;
      else {
        V(t, n, sn(404, { pathname: i }), { flushSync: f });
        return;
      }
    }
    let v = wn(l, i);
    if (!v.route.action && !v.route.lazy) {
      V(t, n, sn(405, { method: m.formMethod, pathname: i, routeId: n }), {
        flushSync: f,
      });
      return;
    }
    L.set(t, g);
    let y = R,
      b = Ht(a, o, _, i, l, v, r, u),
      x = await Me(_, i, b, u, t),
      S = x[v.route.id];
    if (!S) {
      for (let e of b)
        if (x[e.route.id]) {
          S = x[e.route.id];
          break;
        }
    }
    if (_.signal.aborted) {
      L.get(t) === g && L.delete(t);
      return;
    }
    if (ue.has(t)) {
      if (gn(S) || hn(S)) {
        Fe(t, An(void 0));
        return;
      }
    } else {
      if (gn(S))
        if ((L.delete(t), ie > y)) {
          Fe(t, An(void 0));
          return;
        } else
          return (
            oe.add(t),
            Fe(t, On(m)),
            je(_, S, !1, { fetcherSubmission: m, preventScrollReset: p })
          );
      if (hn(S)) {
        V(t, n, S.error);
        return;
      }
    }
    let C = w.navigation.location || w.location,
      E = Xt(e.history, C, g.signal),
      O = s.activeRoutes,
      k =
        w.navigation.state === `idle`
          ? w.matches
          : se(O, w.navigation.location, c, !1, s.branches);
    D(k, `Didn't find any matches after fetcher action`);
    let j = ++R;
    z.set(t, j);
    let { dsMatches: M, revalidatingFetchers: N } = Ct(
        E,
        u,
        a,
        o,
        e.history,
        w,
        k,
        m,
        C,
        r,
        !1,
        ne,
        re,
        ue,
        le,
        oe,
        O,
        c,
        e.patchRoutesOnNavigation != null,
        s.branches,
        [v.route.id, S],
        h,
      ),
      P = On(m, S.data),
      ee = new Map(w.fetchers);
    (ee.set(t, P),
      N.filter((e) => e.key !== t).forEach((e) => {
        let t = e.key,
          n = ee.get(t),
          r = On(void 0, n ? n.data : void 0);
        (ee.set(t, r), Be(t), e.controller && L.set(t, e.controller));
      }),
      _e({ fetchers: ee }));
    let F = () => N.forEach((e) => Be(e.key));
    g.signal.addEventListener(`abort`, F);
    let { loaderResults: I, fetcherResults: te } = await Ne(M, N, E, C, u);
    if (g.signal.aborted) return;
    (g.signal.removeEventListener(`abort`, F),
      z.delete(t),
      L.delete(t),
      N.forEach((e) => L.delete(e.key)));
    let ae = w.fetchers.has(t),
      ce = (e) => {
        if (!ae) return e;
        let n = new Map(e.fetchers);
        return (n.set(t, An(S.data)), { ...e, fetchers: n });
      },
      B = cn(I);
    if (B) return ((w = ce(w)), je(E, B.result, !1, { preventScrollReset: p }));
    if (((B = cn(te)), B))
      return (
        oe.add(B.key),
        (w = ce(w)),
        je(E, B.result, !1, { preventScrollReset: p })
      );
    let de = new Map(w.fetchers);
    ae && de.set(t, An(S.data));
    let { loaderData: fe, errors: pe } = tn(w, k, I, void 0, N, te, de);
    (We(j, de),
      w.navigation.state === `loading` && j > ie
        ? (D(T, `Expected pending action`),
          A && A.abort(),
          ve(w.navigation.location, {
            matches: k,
            loaderData: fe,
            errors: pe,
            fetchers: de,
          }))
        : (_e({
            errors: pe,
            loaderData: nn(w.loaderData, fe, k, pe),
            fetchers: de,
          }),
          (ne = !1)));
  }
  async function Ae(t, n, i, s, c, l, u, d, f) {
    let p = w.fetchers.get(t);
    Fe(t, On(f, p ? p.data : void 0), { flushSync: u });
    let m = new AbortController(),
      h = Xt(e.history, i, m.signal);
    if (l) {
      let e = await rt(s, new URL(h.url).pathname, h.signal, t);
      if (e.type === `aborted`) return;
      if (e.type === `error`) {
        V(t, n, e.error, { flushSync: u });
        return;
      } else if (e.matches) s = e.matches;
      else {
        V(t, n, sn(404, { pathname: i }), { flushSync: u });
        return;
      }
    }
    let g = wn(s, i);
    L.set(t, m);
    let _ = R,
      v = await Me(h, i, Ht(a, o, h, i, s, g, r, c), c, t),
      y = v[g.route.id];
    if (!y) {
      for (let e of s)
        if (v[e.route.id]) {
          y = v[e.route.id];
          break;
        }
    }
    if ((L.get(t) === m && L.delete(t), !h.signal.aborted)) {
      if (ue.has(t)) {
        Fe(t, An(void 0));
        return;
      }
      if (gn(y))
        if (ie > _) {
          Fe(t, An(void 0));
          return;
        } else {
          (oe.add(t), await je(h, y, !1, { preventScrollReset: d }));
          return;
        }
      if (hn(y)) {
        V(t, n, y.error);
        return;
      }
      Fe(t, An(y.data));
    }
  }
  async function je(
    r,
    i,
    a,
    {
      submission: o,
      fetcherSubmission: s,
      preventScrollReset: l,
      replace: u,
    } = {},
  ) {
    (a || (E?.resolve(), (E = null)),
      i.response.headers.has(`X-Remix-Revalidate`) && (ne = !0));
    let d = i.response.headers.get(`Location`);
    (D(d, `Expected a Location header on the redirect Response`),
      (d = Yt(d, new URL(r.url), c, e.history)));
    let f = j(w.location, d, { _isRedirect: !0 });
    if (n) {
      let e = !1;
      if (i.response.headers.has(`X-Remix-Reload-Document`)) e = !0;
      else if (Oe(d)) {
        let n = ee(t, d, !0);
        e = n.origin !== t.location.origin || Te(n.pathname, c) == null;
      }
      if (e) {
        u ? t.location.replace(d) : t.location.assign(d);
        return;
      }
    }
    A = null;
    let p =
        u === !0 || i.response.headers.has(`X-Remix-Replace`)
          ? `REPLACE`
          : `PUSH`,
      { formMethod: m, formAction: h, formEncType: g } = w.navigation;
    !o && !s && m && h && g && (o = Tn(w.navigation));
    let _ = o || s;
    st.has(i.response.status) && _ && Sn(_.formMethod)
      ? await xe(p, f, {
          submission: { ..._, formAction: d },
          preventScrollReset: l || k,
          enableViewTransition: a ? M : void 0,
        })
      : await xe(p, f, {
          overrideNavigation: En(f, [], p, o),
          fetcherSubmission: s,
          preventScrollReset: l || k,
          enableViewTransition: a ? M : void 0,
        });
  }
  async function Me(e, t, n, r, i) {
    let a,
      o = {};
    try {
      a = await Ut(l, e, t, n, i, r, !1);
    } catch (e) {
      return (
        n
          .filter((e) => e.shouldLoad)
          .forEach((t) => {
            o[t.route.id] = { type: `error`, error: e };
          }),
        o
      );
    }
    if (e.signal.aborted) return o;
    if (!Sn(e.method))
      for (let e of n) {
        if (a[e.route.id]?.type === `error`) break;
        !a.hasOwnProperty(e.route.id) &&
          !w.loaderData.hasOwnProperty(e.route.id) &&
          (!w.errors || !w.errors.hasOwnProperty(e.route.id)) &&
          e.shouldCallHandler() &&
          (a[e.route.id] = {
            type: `error`,
            result: Error(
              `No result returned from dataStrategy for route ${e.route.id}`,
            ),
          });
      }
    for (let [t, r] of Object.entries(a))
      if (mn(r)) {
        let i = r.result;
        o[t] = { type: `redirect`, response: qt(i, e, t, n, c) };
      } else o[t] = await Kt(r);
    return o;
  }
  async function Ne(e, t, n, r, i) {
    let a = Me(n, r, e, i, null),
      o = Promise.all(
        t.map(async (e) => {
          if (e.matches && e.match && e.request && e.controller) {
            let t = (await Me(e.request, e.path, e.matches, i, e.key))[
              e.match.route.id
            ];
            return { [e.key]: t };
          } else
            return Promise.resolve({
              [e.key]: { type: `error`, error: sn(404, { pathname: e.path }) },
            });
        }),
      );
    return {
      loaderResults: await a,
      fetcherResults: (await o).reduce((e, t) => Object.assign(e, t), {}),
    };
  }
  function Pe() {
    ((ne = !0),
      le.forEach((e, t) => {
        (L.has(t) && re.add(t), Be(t));
      }));
  }
  function Fe(e, t, n = {}) {
    let r = new Map(w.fetchers);
    (r.set(e, t),
      _e({ fetchers: r }, { flushSync: (n && n.flushSync) === !0 }));
  }
  function V(e, t, n, r = {}) {
    let i = an(w.matches, t),
      a = new Map(w.fetchers);
    (Re(a, e),
      _e(
        { errors: { [i.route.id]: n }, fetchers: a },
        { flushSync: (r && r.flushSync) === !0 },
      ));
  }
  function Ie(e) {
    return (
      B.set(e, (B.get(e) || 0) + 1),
      ue.has(e) && ue.delete(e),
      w.fetchers.get(e) || lt
    );
  }
  function Le(e, t) {
    (Be(e, t?.reason), Fe(e, An(null)));
  }
  function Re(e, t) {
    let n = w.fetchers.get(t);
    (L.has(t) && !(n && n.state === `loading` && z.has(t)) && Be(t),
      le.delete(t),
      z.delete(t),
      oe.delete(t),
      ue.delete(t),
      re.delete(t),
      e.delete(t));
  }
  function ze(e) {
    let t = (B.get(e) || 0) - 1;
    (t <= 0 ? (B.delete(e), ue.add(e)) : B.set(e, t),
      _e({ fetchers: new Map(w.fetchers) }));
  }
  function Be(e, t) {
    let n = L.get(e);
    n && (n.abort(t), L.delete(e));
  }
  function He(e, t) {
    for (let n of e) {
      let e = t.get(n);
      D(e, `Expected fetcher: ${n}`);
      let r = An(e.data);
      t.set(n, r);
    }
  }
  function Ue(e) {
    let t = [],
      n = !1;
    for (let r of oe) {
      let i = e.get(r);
      (D(i, `Expected fetcher: ${r}`),
        i.state === `loading` && (oe.delete(r), t.push(r), (n = !0)));
    }
    return (He(t, e), n);
  }
  function We(e, t) {
    let n = [];
    for (let [r, i] of z)
      if (i < e) {
        let e = t.get(r);
        (D(e, `Expected fetcher: ${r}`),
          e.state === `loading` && (Be(r), z.delete(r), n.push(r)));
      }
    return (He(n, t), n.length > 0);
  }
  function Ge(e, t) {
    let n = w.blockers.get(e) || ut;
    return (de.get(e) !== t && de.set(e, t), n);
  }
  function Je(e) {
    (w.blockers.delete(e), de.delete(e));
  }
  function Ye(e, t) {
    let n = w.blockers.get(e) || ut;
    D(
      (n.state === `unblocked` && t.state === `blocked`) ||
        (n.state === `blocked` && t.state === `blocked`) ||
        (n.state === `blocked` && t.state === `proceeding`) ||
        (n.state === `blocked` && t.state === `unblocked`) ||
        (n.state === `proceeding` && t.state === `unblocked`),
      `Invalid blocker state transition: ${n.state} -> ${t.state}`,
    );
    let r = new Map(w.blockers);
    (r.set(e, t), _e({ blockers: r }));
  }
  function Xe({ currentLocation: e, nextLocation: t, historyAction: n }) {
    if (de.size === 0) return;
    de.size > 1 && O(!1, `A router only supports one blocker at a time`);
    let r = Array.from(de.entries()),
      [i, a] = r[r.length - 1],
      o = w.blockers.get(i);
    if (
      !(o && o.state === `proceeding`) &&
      a({ currentLocation: e, nextLocation: t, historyAction: n })
    )
      return i;
  }
  function Ze(e) {
    let t = sn(404, { pathname: e }),
      n = s.activeRoutes,
      { matches: r, route: i } = on(n);
    return { notFoundMatches: r, route: i, error: t };
  }
  function Qe(e, t, n) {
    if (((m = e), (g = t), (h = n || null), !_ && w.navigation === ct)) {
      _ = !0;
      let e = tt(w.location, w.matches);
      e != null && _e({ restoreScrollPosition: e });
    }
    return () => {
      ((m = null), (g = null), (h = null));
    };
  }
  function $e(e, t) {
    return (
      (h &&
        h(
          e,
          t.map((e) => ce(e, w.loaderData)),
        )) ||
      e.key
    );
  }
  function et(e, t) {
    if (m && g) {
      let n = $e(e, t);
      m[n] = g();
    }
  }
  function tt(e, t) {
    if (m) {
      let n = $e(e, t),
        r = m[n];
      if (typeof r == `number`) return r;
    }
    return null;
  }
  function nt(t, n, r) {
    if (e.patchRoutesOnNavigation) {
      let e = s.branches;
      if (!t) return { active: !0, matches: se(n, r, c, !0, e) || [] };
      if (Object.keys(t[0].params).length > 0)
        return { active: !0, matches: se(n, r, c, !0, e) };
    }
    return { active: !1, matches: null };
  }
  async function rt(t, n, r, i) {
    if (!e.patchRoutesOnNavigation) return { type: `success`, matches: t };
    let l = t;
    for (;;) {
      let t = o;
      try {
        await e.patchRoutesOnNavigation({
          signal: r,
          path: n,
          matches: l,
          fetcherKey: i,
          patch: (e, n) => {
            r.aborted || kt(e, n, s, t, a, !1);
          },
        });
      } catch (e) {
        return { type: `error`, error: e, partialMatches: l };
      }
      if (r.aborted) return { type: `aborted` };
      let u = s.branches,
        d = se(s.activeRoutes, n, c, !1, u),
        f = null;
      if (
        d &&
        (Object.keys(d[0].params).length === 0 ||
          ((f = se(s.activeRoutes, n, c, !0, u)),
          !(f && l.length < f.length && it(l, f.slice(0, l.length)))))
      )
        return { type: `success`, matches: d };
      if (((f ||= se(s.activeRoutes, n, c, !0, u)), !f || it(l, f)))
        return { type: `success`, matches: null };
      l = f;
    }
  }
  function it(e, t) {
    return (
      e.length === t.length && e.every((e, n) => e.route.id === t[n].route.id)
    );
  }
  function at(e) {
    ((o = {}), s.setHmrRoutes(ae(e, a, void 0, o)));
  }
  function ot(e, t, n = !1) {
    (kt(e, t, s, o, a, n), s.hasHMRRoutes || _e({}));
  }
  return (
    (C = {
      get basename() {
        return c;
      },
      get future() {
        return u;
      },
      get state() {
        return w;
      },
      get routes() {
        return s.stableRoutes;
      },
      get branches() {
        return s.branches;
      },
      get manifest() {
        return o;
      },
      get window() {
        return t;
      },
      initialize: me,
      subscribe: ge,
      enableScrollRestoration: Qe,
      navigate: ye,
      fetch: De,
      revalidate: be,
      createHref: (t) => e.history.createHref(t),
      encodeLocation: (t) => e.history.encodeLocation(t),
      getFetcher: Ie,
      resetFetcher: Le,
      deleteFetcher: ze,
      dispose: he,
      getBlocker: Ge,
      deleteBlocker: Je,
      patchRoutes: ot,
      _internalFetchControllers: L,
      _internalSetRoutes: at,
      _internalSetStateDoNotUseOrYouWillBreakYourApp(e) {
        _e(e);
      },
    }),
    e.instrumentations &&
      (C = qe(C, e.instrumentations.map((e) => e.router).filter(Boolean))),
    C
  );
}
function bt(e) {
  return (
    e != null &&
    ((`formData` in e && e.formData != null) ||
      (`body` in e && e.body !== void 0))
  );
}
function xt(e, t, n, r, i, a) {
  let o, s;
  if (i) {
    o = [];
    for (let e of t)
      if ((o.push(e), e.route.id === i)) {
        s = e;
        break;
      }
  } else ((o = t), (s = t[t.length - 1]));
  let c = Pe(r || `.`, Ne(o), Te(e.pathname, n) || e.pathname, a === `path`);
  if (
    (r ?? ((c.search = e.search), (c.hash = e.hash)),
    (r == null || r === `` || r === `.`) && s)
  ) {
    let e = Cn(c.search);
    if (s.route.index && !e)
      c.search = c.search ? c.search.replace(/^\?/, `?index&`) : `?index`;
    else if (!s.route.index && e) {
      let e = new URLSearchParams(c.search),
        t = e.getAll(`index`);
      (e.delete(`index`),
        t.filter((e) => e).forEach((t) => e.append(`index`, t)));
      let n = e.toString();
      c.search = n ? `?${n}` : ``;
    }
  }
  return (
    n !== `/` && (c.pathname = Ee({ basename: n, pathname: c.pathname })),
    M(c)
  );
}
function St(e, t, n) {
  if (!n || !bt(n)) return { path: t };
  if (n.formMethod && !xn(n.formMethod))
    return { path: t, error: sn(405, { method: n.formMethod }) };
  let r = () => ({ path: t, error: sn(400, { type: `invalid-body` }) }),
    i = (n.formMethod || `get`).toUpperCase(),
    a = ln(t);
  if (n.body !== void 0) {
    if (n.formEncType === `text/plain`) {
      if (!Sn(i)) return r();
      let e =
        typeof n.body == `string`
          ? n.body
          : n.body instanceof FormData || n.body instanceof URLSearchParams
            ? Array.from(n.body.entries()).reduce(
                (e, [t, n]) => `${e}${t}=${n}
`,
                ``,
              )
            : String(n.body);
      return {
        path: t,
        submission: {
          formMethod: i,
          formAction: a,
          formEncType: n.formEncType,
          formData: void 0,
          json: void 0,
          text: e,
        },
      };
    } else if (n.formEncType === `application/json`) {
      if (!Sn(i)) return r();
      try {
        let e = typeof n.body == `string` ? JSON.parse(n.body) : n.body;
        return {
          path: t,
          submission: {
            formMethod: i,
            formAction: a,
            formEncType: n.formEncType,
            formData: void 0,
            json: e,
            text: void 0,
          },
        };
      } catch {
        return r();
      }
    }
  }
  D(
    typeof FormData == `function`,
    `FormData is not available in this environment`,
  );
  let o, s;
  if (n.formData) ((o = Qt(n.formData)), (s = n.formData));
  else if (n.body instanceof FormData) ((o = Qt(n.body)), (s = n.body));
  else if (n.body instanceof URLSearchParams) ((o = n.body), (s = $t(o)));
  else if (n.body == null) ((o = new URLSearchParams()), (s = new FormData()));
  else
    try {
      ((o = new URLSearchParams(n.body)), (s = $t(o)));
    } catch {
      return r();
    }
  let c = {
    formMethod: i,
    formAction: a,
    formEncType: (n && n.formEncType) || `application/x-www-form-urlencoded`,
    formData: s,
    json: void 0,
    text: void 0,
  };
  if (Sn(c.formMethod)) return { path: t, submission: c };
  let l = N(t);
  return (
    e && l.search && Cn(l.search) && o.append(`index`, ``),
    (l.search = `?${o}`),
    { path: M(l), submission: c }
  );
}
function Ct(e, t, n, r, i, a, o, s, c, l, u, d, f, p, m, h, g, _, v, y, b, x) {
  let S = b ? (hn(b[1]) ? b[1].error : b[1].data) : void 0,
    C = i.createURL(a.location),
    w = i.createURL(c),
    T;
  if (u && a.errors) {
    let e = Object.keys(a.errors)[0];
    T = o.findIndex((t) => t.route.id === e);
  } else if (b && hn(b[1])) {
    let e = b[0];
    T = o.findIndex((t) => t.route.id === e) - 1;
  }
  let E = b ? b[1].statusCode : void 0,
    D = E && E >= 400,
    O = {
      currentUrl: C,
      currentParams: a.matches[0]?.params || {},
      nextUrl: w,
      nextParams: o[0].params,
      ...s,
      actionResult: S,
      actionStatus: E,
    },
    k = He(o),
    A = o.map((i, o) => {
      let { route: s } = i,
        f = null;
      if (T != null && o > T) f = !1;
      else if (s.lazy) f = !0;
      else if (!wt(s)) f = !1;
      else if (u) {
        let { shouldLoad: e } = Tt(s, a.loaderData, a.errors);
        f = e;
      } else Et(a.loaderData, a.matches[o], i) && (f = !0);
      if (f !== null) return Vt(n, r, e, c, k, i, l, t, f);
      let p = !1;
      typeof x == `boolean`
        ? (p = x)
        : D
          ? (p = !1)
          : d || C.pathname + C.search === w.pathname + w.search
            ? (p = !0)
            : C.search === w.search
              ? Dt(a.matches[o], i) && (p = !0)
              : (p = !0);
      let m = { ...O, defaultShouldRevalidate: p };
      return Vt(n, r, e, c, k, i, l, t, Ot(i, m), m, x);
    }),
    j = [];
  return (
    m.forEach((e, s) => {
      if (u || !o.some((t) => t.route.id === e.routeId) || p.has(s)) return;
      let c = a.fetchers.get(s),
        m = c && c.state !== `idle` && c.data === void 0,
        b = se(g, e.path, _ ?? `/`, !1, y);
      if (!b) {
        if (v && m) return;
        j.push({
          key: s,
          routeId: e.routeId,
          path: e.path,
          matches: null,
          match: null,
          request: null,
          controller: null,
        });
        return;
      }
      if (h.has(s)) return;
      let S = wn(b, e.path),
        C = new AbortController(),
        w = Xt(i, e.path, C.signal),
        T = null;
      if (f.has(s)) (f.delete(s), (T = Ht(n, r, w, e.path, b, S, l, t)));
      else if (m) d && (T = Ht(n, r, w, e.path, b, S, l, t));
      else {
        let i;
        i = typeof x == `boolean` ? x : D ? !1 : d;
        let a = { ...O, defaultShouldRevalidate: i };
        Ot(S, a) && (T = Ht(n, r, w, e.path, b, S, l, t, a));
      }
      T &&
        j.push({
          key: s,
          routeId: e.routeId,
          path: e.path,
          matches: T,
          match: S,
          request: w,
          controller: C,
        });
    }),
    { dsMatches: A, revalidatingFetchers: j }
  );
}
function wt(e) {
  return e.loader != null || (e.middleware != null && e.middleware.length > 0);
}
function Tt(e, t, n) {
  if (e.lazy) return { shouldLoad: !0, renderFallback: !0 };
  if (!wt(e)) return { shouldLoad: !1, renderFallback: !1 };
  let r = t != null && e.id in t,
    i = n != null && n[e.id] !== void 0;
  if (!r && i) return { shouldLoad: !1, renderFallback: !1 };
  if (typeof e.loader == `function` && e.loader.hydrate === !0)
    return { shouldLoad: !0, renderFallback: !r };
  let a = !r && !i;
  return { shouldLoad: a, renderFallback: a };
}
function Et(e, t, n) {
  let r = !t || n.route.id !== t.route.id,
    i = !e.hasOwnProperty(n.route.id);
  return r || i;
}
function Dt(e, t) {
  let n = e.route.path;
  return (
    e.pathname !== t.pathname ||
    (n != null && n.endsWith(`*`) && e.params[`*`] !== t.params[`*`])
  );
}
function Ot(e, t) {
  if (e.route.shouldRevalidate) {
    let n = e.route.shouldRevalidate(t);
    if (typeof n == `boolean`) return n;
  }
  return t.defaultShouldRevalidate;
}
function kt(e, t, n, r, i, a) {
  let o;
  if (e) {
    let t = r[e];
    (D(t, `No route found to patch children into: routeId = ${e}`),
      (t.children ||= []),
      (o = t.children));
  } else o = n.activeRoutes;
  let s = [],
    c = [];
  if (
    (t.forEach((e) => {
      let t = o.find((t) => At(e, t));
      t ? c.push({ existingRoute: t, newRoute: e }) : s.push(e);
    }),
    s.length > 0)
  ) {
    let t = ae(s, i, [e || `_`, `patch`, String(o?.length || `0`)], r);
    o.push(...t);
  }
  if (a && c.length > 0)
    for (let e = 0; e < c.length; e++) {
      let { existingRoute: t, newRoute: n } = c[e],
        r = t,
        [a] = ae([n], i, [], {}, !0);
      Object.assign(r, {
        element: a.element ? a.element : r.element,
        errorElement: a.errorElement ? a.errorElement : r.errorElement,
        hydrateFallbackElement: a.hydrateFallbackElement
          ? a.hydrateFallbackElement
          : r.hydrateFallbackElement,
      });
    }
  n.hasHMRRoutes || n.setRoutes([...n.activeRoutes]);
}
function At(e, t) {
  return `id` in e && `id` in t && e.id === t.id
    ? !0
    : e.index === t.index &&
        e.path === t.path &&
        e.caseSensitive === t.caseSensitive
      ? (!e.children || e.children.length === 0) &&
        (!t.children || t.children.length === 0)
        ? !0
        : (e.children?.every((e, n) => t.children?.some((t) => At(e, t))) ?? !1)
      : !1;
}
var jt = new WeakMap(),
  Mt = ({ key: e, route: t, manifest: n, mapRouteProperties: r }) => {
    let i = n[t.id];
    if (
      (D(i, `No route found in manifest`), !i.lazy || typeof i.lazy != `object`)
    )
      return;
    let a = i.lazy[e];
    if (!a) return;
    let o = jt.get(i);
    o || ((o = {}), jt.set(i, o));
    let s = o[e];
    if (s) return s;
    let c = (async () => {
      let t = re(e),
        n = i[e] !== void 0 && e !== `hasErrorBoundary`;
      if (t)
        (O(
          !t,
          `Route property ` +
            e +
            ` is not a supported lazy route property. This property will be ignored.`,
        ),
          (o[e] = Promise.resolve()));
      else if (n)
        O(
          !1,
          `Route "${i.id}" has a static property "${e}" defined. The lazy property will be ignored.`,
        );
      else {
        let t = await a();
        t != null && (Object.assign(i, { [e]: t }), Object.assign(i, r(i)));
      }
      typeof i.lazy == `object` &&
        ((i.lazy[e] = void 0),
        Object.values(i.lazy).every((e) => e === void 0) && (i.lazy = void 0));
    })();
    return ((o[e] = c), c);
  },
  Nt = new WeakMap();
function Pt(e, t, n, r, i) {
  let a = n[e.id];
  if ((D(a, `No route found in manifest`), !e.lazy))
    return { lazyRoutePromise: void 0, lazyHandlerPromise: void 0 };
  if (typeof e.lazy == `function`) {
    let t = Nt.get(a);
    if (t) return { lazyRoutePromise: t, lazyHandlerPromise: t };
    let n = (async () => {
      D(typeof e.lazy == `function`, `No lazy route function found`);
      let t = await e.lazy(),
        n = {};
      for (let e in t) {
        let r = t[e];
        if (r === void 0) continue;
        let i = R(e),
          o = a[e] !== void 0 && e !== `hasErrorBoundary`;
        i
          ? O(
              !i,
              `Route property ` +
                e +
                ` is not a supported property to be returned from a lazy route function. This property will be ignored.`,
            )
          : o
            ? O(
                !o,
                `Route "${a.id}" has a static property "${e}" defined but its lazy function is also returning a value for this property. The lazy route property "${e}" will be ignored.`,
              )
            : (n[e] = r);
      }
      (Object.assign(a, n), Object.assign(a, { ...r(a), lazy: void 0 }));
    })();
    return (
      Nt.set(a, n),
      n.catch(() => {}),
      { lazyRoutePromise: n, lazyHandlerPromise: n }
    );
  }
  let o = Object.keys(e.lazy),
    s = [],
    c;
  for (let a of o) {
    if (i && i.includes(a)) continue;
    let o = Mt({ key: a, route: e, manifest: n, mapRouteProperties: r });
    o && (s.push(o), a === t && (c = o));
  }
  let l = s.length > 0 ? Promise.all(s).then(() => {}) : void 0;
  return (
    l?.catch(() => {}),
    c?.catch(() => {}),
    { lazyRoutePromise: l, lazyHandlerPromise: c }
  );
}
async function Ft(e) {
  let t = e.matches.filter((e) => e.shouldLoad),
    n = {};
  return (
    (await Promise.all(t.map((e) => e.resolve()))).forEach((e, r) => {
      n[t[r].route.id] = e;
    }),
    n
  );
}
async function It(e) {
  return e.matches.some((e) => e.route.middleware) ? Lt(e, () => Ft(e)) : Ft(e);
}
function Lt(e, t) {
  return Rt(
    e,
    t,
    (e) => {
      if (bn(e)) throw e;
      return e;
    },
    fn,
    n,
  );
  function n(t, n, r) {
    if (r)
      return Promise.resolve(
        Object.assign(r.value, { [n]: { type: `error`, result: t } }),
      );
    {
      let { matches: r } = e,
        i = an(
          r,
          r[
            Math.min(
              Math.max(
                r.findIndex((e) => e.route.id === n),
                0,
              ),
              Math.max(
                r.findIndex((e) => e.shouldCallHandler()),
                0,
              ),
            )
          ].route.id,
        ).route.id;
      return Promise.resolve({ [i]: { type: `error`, result: t } });
    }
  }
}
async function Rt(e, t, n, r, i) {
  let { matches: a, ...o } = e;
  return await zt(
    o,
    a.flatMap((e) =>
      e.route.middleware ? e.route.middleware.map((t) => [e.route.id, t]) : [],
    ),
    t,
    n,
    r,
    i,
  );
}
async function zt(e, t, n, r, i, a, o = 0) {
  let { request: s } = e;
  if (s.signal.aborted)
    throw s.signal.reason ?? Error(`Request aborted: ${s.method} ${s.url}`);
  let c = t[o];
  if (!c) return await n();
  let [l, u] = c,
    d,
    f = async () => {
      if (d) throw Error("You may only call `next()` once per middleware");
      try {
        return ((d = { value: await zt(e, t, n, r, i, a, o + 1) }), d.value);
      } catch (e) {
        return ((d = { value: await a(e, l, d) }), d.value);
      }
    };
  try {
    let t = await u(e, f),
      n = t == null ? void 0 : r(t);
    return i(n)
      ? n
      : d
        ? (n ?? d.value)
        : ((d = { value: await f() }), d.value);
  } catch (e) {
    return await a(e, l, d);
  }
}
function Bt(e, t, n, r, i) {
  let a = Mt({
      key: `middleware`,
      route: r.route,
      manifest: t,
      mapRouteProperties: e,
    }),
    o = Pt(r.route, Sn(n.method) ? `action` : `loader`, t, e, i);
  return {
    middleware: a,
    route: o.lazyRoutePromise,
    handler: o.lazyHandlerPromise,
  };
}
function Vt(e, t, n, r, i, a, o, s, c, l = null, u) {
  let d = !1,
    f = Bt(e, t, n, a, o);
  return {
    ...a,
    _lazyPromises: f,
    shouldLoad: c,
    shouldRevalidateArgs: l,
    shouldCallHandler(e) {
      return (
        (d = !0),
        l
          ? typeof u == `boolean`
            ? Ot(a, { ...l, defaultShouldRevalidate: u })
            : typeof e == `boolean`
              ? Ot(a, { ...l, defaultShouldRevalidate: e })
              : Ot(a, l)
          : c
      );
    },
    resolve(e) {
      let { lazy: t, loader: o, middleware: l } = a.route,
        u = d || c || (e && !Sn(n.method) && (t || o)),
        p = l && l.length > 0 && !o && !t;
      return u && (Sn(n.method) || !p)
        ? Wt({
            request: n,
            path: r,
            pattern: i,
            match: a,
            lazyHandlerPromise: f?.handler,
            lazyRoutePromise: f?.route,
            handlerOverride: e,
            scopedContext: s,
          })
        : Promise.resolve({ type: `data`, result: void 0 });
    },
  };
}
function Ht(e, t, n, r, i, a, o, s, c = null) {
  return i.map((l) =>
    l.route.id === a.route.id
      ? Vt(e, t, n, r, He(i), l, o, s, !0, c)
      : {
          ...l,
          shouldLoad: !1,
          shouldRevalidateArgs: c,
          shouldCallHandler: () => !1,
          _lazyPromises: Bt(e, t, n, l, o),
          resolve: () => Promise.resolve({ type: `data`, result: void 0 }),
        },
  );
}
async function Ut(e, t, n, r, i, a, o) {
  r.some((e) => e._lazyPromises?.middleware) &&
    (await Promise.all(r.map((e) => e._lazyPromises?.middleware)));
  let s = {
      request: t,
      url: Zt(t, n),
      pattern: He(r),
      params: r[0].params,
      context: a,
      matches: r,
    },
    c = o
      ? () => {
          throw Error(
            "You cannot call `runClientMiddleware()` from a static handler `dataStrategy`. Middleware is run outside of `dataStrategy` during SSR in order to bubble up the Response.  You can enable middleware via the `respond` API in `query`/`queryRoute`",
          );
        }
      : (e) => {
          let t = s;
          return Lt(t, () =>
            e({
              ...t,
              fetcherKey: i,
              runClientMiddleware: () => {
                throw Error(
                  "Cannot call `runClientMiddleware()` from within an `runClientMiddleware` handler",
                );
              },
            }),
          );
        },
    l = await e({ ...s, fetcherKey: i, runClientMiddleware: c });
  try {
    await Promise.all(
      r.flatMap((e) => [e._lazyPromises?.handler, e._lazyPromises?.route]),
    );
  } catch {}
  return l;
}
async function Wt({
  request: e,
  path: t,
  pattern: n,
  match: r,
  lazyHandlerPromise: i,
  lazyRoutePromise: a,
  handlerOverride: o,
  scopedContext: s,
}) {
  let c,
    l,
    u = Sn(e.method),
    d = u ? `action` : `loader`,
    f = (i) => {
      let a,
        c = new Promise((e, t) => (a = t));
      ((l = () => a()), e.signal.addEventListener(`abort`, l));
      let u = (a) =>
          typeof i == `function`
            ? i(
                {
                  request: e,
                  url: Zt(e, t),
                  pattern: n,
                  params: r.params,
                  context: s,
                },
                ...(a === void 0 ? [] : [a]),
              )
            : Promise.reject(
                Error(
                  `You cannot call the handler for a route which defines a boolean "${d}" [routeId: ${r.route.id}]`,
                ),
              ),
        f = (async () => {
          try {
            return { type: `data`, result: await (o ? o((e) => u(e)) : u()) };
          } catch (e) {
            return { type: `error`, result: e };
          }
        })();
      return Promise.race([f, c]);
    };
  try {
    let t = u ? r.route.action : r.route.loader;
    if (i || a)
      if (t) {
        let e,
          [n] = await Promise.all([
            f(t).catch((t) => {
              e = t;
            }),
            i,
            a,
          ]);
        if (e !== void 0) throw e;
        c = n;
      } else {
        await i;
        let t = u ? r.route.action : r.route.loader;
        if (t) [c] = await Promise.all([f(t), a]);
        else if (d === `action`) {
          let t = new URL(e.url),
            n = t.pathname + t.search;
          throw sn(405, { method: e.method, pathname: n, routeId: r.route.id });
        } else return { type: `data`, result: void 0 };
      }
    else if (t) c = await f(t);
    else {
      let t = new URL(e.url);
      throw sn(404, { pathname: t.pathname + t.search });
    }
  } catch (e) {
    return { type: `error`, result: e };
  } finally {
    l && e.signal.removeEventListener(`abort`, l);
  }
  return c;
}
async function Gt(e) {
  let t = e.headers.get(`Content-Type`);
  return t && /\bapplication\/json\b/.test(t)
    ? e.body == null
      ? null
      : e.json()
    : e.text();
}
async function Kt(e) {
  let { result: t, type: n } = e;
  if (vn(t)) {
    let e;
    try {
      e = await Gt(t);
    } catch (e) {
      return { type: `error`, error: e };
    }
    return n === `error`
      ? {
          type: `error`,
          error: new Be(t.status, t.statusText, e),
          statusCode: t.status,
          headers: t.headers,
        }
      : { type: `data`, data: e, statusCode: t.status, headers: t.headers };
  }
  return n === `error`
    ? _n(t)
      ? t.data instanceof Error
        ? {
            type: `error`,
            error: t.data,
            statusCode: t.init?.status,
            headers: t.init?.headers ? new Headers(t.init.headers) : void 0,
          }
        : {
            type: `error`,
            error: dn(t),
            statusCode: Ve(t) ? t.status : void 0,
            headers: t.init?.headers ? new Headers(t.init.headers) : void 0,
          }
      : { type: `error`, error: t, statusCode: Ve(t) ? t.status : void 0 }
    : _n(t)
      ? {
          type: `data`,
          data: t.data,
          statusCode: t.init?.status,
          headers: t.init?.headers ? new Headers(t.init.headers) : void 0,
        }
      : { type: `data`, data: t };
}
function qt(e, t, n, r, i) {
  let a = e.headers.get(`Location`);
  if (
    (D(
      a,
      `Redirects returned/thrown from loaders/actions must have a Location header`,
    ),
    !Oe(a))
  ) {
    let o = r.slice(0, r.findIndex((e) => e.route.id === n) + 1);
    ((a = xt(new URL(t.url), o, i, a)), e.headers.set(`Location`, a));
  }
  return e;
}
var Jt = [
  `about:`,
  `blob:`,
  `chrome:`,
  `chrome-untrusted:`,
  `content:`,
  `data:`,
  `devtools:`,
  `file:`,
  `filesystem:`,
  `javascript:`,
];
function Yt(e, t, n, r) {
  if (Oe(e)) {
    let r = e,
      i = r.startsWith(`//`) ? new URL(t.protocol + r) : new URL(r);
    if (Jt.includes(i.protocol)) throw Error(`Invalid redirect location`);
    let a = Te(i.pathname, n) != null;
    if (i.origin === t.origin && a) return Fe(i.pathname) + i.search + i.hash;
  }
  try {
    let t = r.createURL(e);
    if (Jt.includes(t.protocol)) throw Error(`Invalid redirect location`);
  } catch {}
  return e;
}
function Xt(e, t, n, r) {
  let i = e.createURL(ln(t)).toString(),
    a = { signal: n };
  if (r && Sn(r.formMethod)) {
    let { formMethod: e, formEncType: t } = r;
    ((a.method = e.toUpperCase()),
      t === `application/json`
        ? ((a.headers = new Headers({ "Content-Type": t })),
          (a.body = JSON.stringify(r.json)))
        : t === `text/plain`
          ? (a.body = r.text)
          : t === `application/x-www-form-urlencoded` && r.formData
            ? (a.body = Qt(r.formData))
            : (a.body = r.formData));
  }
  return new Request(i, a);
}
function Zt(e, t) {
  let n = new URL(e.url),
    r = typeof t == `string` ? N(t) : t;
  if (((n.pathname = r.pathname || `/`), r.search)) {
    let e = new URLSearchParams(r.search),
      t = e.getAll(`index`);
    e.delete(`index`);
    for (let n of t.filter(Boolean)) e.append(`index`, n);
    n.search = e.size ? `?${e.toString()}` : ``;
  } else n.search = ``;
  return ((n.hash = r.hash || ``), n);
}
function Qt(e) {
  let t = new URLSearchParams();
  for (let [n, r] of e.entries())
    t.append(n, typeof r == `string` ? r : r.name);
  return t;
}
function $t(e) {
  let t = new FormData();
  for (let [n, r] of e.entries()) t.append(n, r);
  return t;
}
function en(e, t, n, r = !1, i = !1) {
  let a = {},
    o = null,
    s,
    c = !1,
    l = {},
    u = n && hn(n[1]) ? n[1].error : void 0;
  return (
    e.forEach((n) => {
      if (!(n.route.id in t)) return;
      let d = n.route.id,
        f = t[d];
      if (
        (D(!gn(f), `Cannot handle redirect results in processLoaderData`),
        hn(f))
      ) {
        let t = f.error;
        if ((u !== void 0 && ((t = u), (u = void 0)), (o ||= {}), i)) o[d] = t;
        else {
          let n = an(e, d);
          o[n.route.id] ?? (o[n.route.id] = t);
        }
        (r || (a[d] = pt),
          c || ((c = !0), (s = Ve(f.error) ? f.error.status : 500)),
          f.headers && (l[d] = f.headers));
      } else
        ((a[d] = f.data),
          f.statusCode && f.statusCode !== 200 && !c && (s = f.statusCode),
          f.headers && (l[d] = f.headers));
    }),
    u !== void 0 && n && ((o = { [n[0]]: u }), n[2] && (a[n[2]] = void 0)),
    { loaderData: a, errors: o, statusCode: s || 200, loaderHeaders: l }
  );
}
function tn(e, t, n, r, i, a, o) {
  let { loaderData: s, errors: c } = en(t, n, r);
  return (
    i
      .filter((e) => !e.matches || e.matches.some((e) => e.shouldLoad))
      .forEach((t) => {
        let { key: n, match: r, controller: i } = t;
        if (i && i.signal.aborted) return;
        let s = a[n];
        if ((D(s, `Did not find corresponding fetcher result`), hn(s))) {
          let t = an(e.matches, r?.route.id);
          ((c && c[t.route.id]) || (c = { ...c, [t.route.id]: s.error }),
            o.delete(n));
        } else if (gn(s)) D(!1, `Unhandled fetcher revalidation redirect`);
        else {
          let e = An(s.data);
          o.set(n, e);
        }
      }),
    { loaderData: s, errors: c }
  );
}
function nn(e, t, n, r) {
  let i = Object.entries(t)
    .filter(([, e]) => e !== pt)
    .reduce((e, [t, n]) => ((e[t] = n), e), {});
  for (let a of n) {
    let n = a.route.id;
    if (
      (!t.hasOwnProperty(n) &&
        e.hasOwnProperty(n) &&
        a.route.loader &&
        (i[n] = e[n]),
      r && r.hasOwnProperty(n))
    )
      break;
  }
  return i;
}
function rn(e) {
  return e
    ? hn(e[1])
      ? { actionData: {} }
      : { actionData: { [e[0]]: e[1].data } }
    : {};
}
function an(e, t) {
  return (
    (t ? e.slice(0, e.findIndex((e) => e.route.id === t) + 1) : [...e])
      .reverse()
      .find((e) => e.route.hasErrorBoundary === !0) || e[0]
  );
}
function on(e) {
  let t =
    e.length === 1
      ? e[0]
      : e.find((e) => e.index || !e.path || e.path === `/`) || {
          id: `__shim-error-route__`,
        };
  return {
    matches: [{ params: {}, pathname: ``, pathnameBase: ``, route: t }],
    route: t,
  };
}
function sn(
  e,
  { pathname: t, routeId: n, method: r, type: i, message: a } = {},
) {
  let o = `Unknown Server Error`,
    s = `Unknown @remix-run/router error`;
  return (
    e === 400
      ? ((o = `Bad Request`),
        r && t && n
          ? (s = `You made a ${r} request to "${t}" but did not provide a \`loader\` for route "${n}", so there is no way to handle the request.`)
          : i === `invalid-body` && (s = `Unable to encode submission body`))
      : e === 403
        ? ((o = `Forbidden`), (s = `Route "${n}" does not match URL "${t}"`))
        : e === 404
          ? ((o = `Not Found`), (s = `No route matches URL "${t}"`))
          : e === 405 &&
            ((o = `Method Not Allowed`),
            r && t && n
              ? (s = `You made a ${r.toUpperCase()} request to "${t}" but did not provide an \`action\` for route "${n}", so there is no way to handle the request.`)
              : r && (s = `Invalid request method "${r.toUpperCase()}"`)),
    new Be(e || 500, o, Error(s), !0)
  );
}
function cn(e) {
  let t = Object.entries(e);
  for (let e = t.length - 1; e >= 0; e--) {
    let [n, r] = t[e];
    if (gn(r)) return { key: n, result: r };
  }
}
function ln(e) {
  return M({ ...(typeof e == `string` ? N(e) : e), hash: `` });
}
function un(e, t) {
  return e.pathname !== t.pathname || e.search !== t.search
    ? !1
    : e.hash === ``
      ? t.hash !== ``
      : e.hash === t.hash
        ? !0
        : t.hash !== ``;
}
function dn(e) {
  return new Be(
    e.init?.status ?? 500,
    e.init?.statusText ?? `Internal Server Error`,
    e.data,
  );
}
function fn(e) {
  return (
    typeof e == `object` &&
    !!e &&
    Object.entries(e).every(([e, t]) => typeof e == `string` && pn(t))
  );
}
function pn(e) {
  return (
    typeof e == `object` &&
    !!e &&
    `type` in e &&
    `result` in e &&
    (e.type === `data` || e.type === `error`)
  );
}
function mn(e) {
  return vn(e.result) && ot.has(e.result.status);
}
function hn(e) {
  return e.type === `error`;
}
function gn(e) {
  return (e && e.type) === `redirect`;
}
function _n(e) {
  return (
    typeof e == `object` &&
    !!e &&
    `type` in e &&
    `data` in e &&
    `init` in e &&
    e.type === `DataWithResponseInit`
  );
}
function vn(e) {
  return (
    e != null &&
    typeof e.status == `number` &&
    typeof e.statusText == `string` &&
    typeof e.headers == `object` &&
    e.body !== void 0
  );
}
function yn(e) {
  return ot.has(e);
}
function bn(e) {
  return vn(e) && yn(e.status) && e.headers.has(`Location`);
}
function xn(e) {
  return at.has(e.toUpperCase());
}
function Sn(e) {
  return rt.has(e.toUpperCase());
}
function Cn(e) {
  return new URLSearchParams(e).getAll(`index`).some((e) => e === ``);
}
function wn(e, t) {
  let n = typeof t == `string` ? N(t).search : t.search;
  if (e[e.length - 1].route.index && Cn(n || ``)) return e[e.length - 1];
  let r = Me(e);
  return r[r.length - 1];
}
function Tn(e) {
  let {
    formMethod: t,
    formAction: n,
    formEncType: r,
    text: i,
    formData: a,
    json: o,
  } = e;
  if (!(!t || !n || !r)) {
    if (i != null)
      return {
        formMethod: t,
        formAction: n,
        formEncType: r,
        formData: void 0,
        json: void 0,
        text: i,
      };
    if (a != null)
      return {
        formMethod: t,
        formAction: n,
        formEncType: r,
        formData: a,
        json: void 0,
        text: void 0,
      };
    if (o !== void 0)
      return {
        formMethod: t,
        formAction: n,
        formEncType: r,
        formData: void 0,
        json: o,
        text: void 0,
      };
  }
}
function En(e, t, n, r) {
  return r
    ? {
        state: `loading`,
        location: e,
        matches: t,
        historyAction: n,
        formMethod: r.formMethod,
        formAction: r.formAction,
        formEncType: r.formEncType,
        formData: r.formData,
        json: r.json,
        text: r.text,
      }
    : {
        state: `loading`,
        location: e,
        matches: t,
        historyAction: n,
        formMethod: void 0,
        formAction: void 0,
        formEncType: void 0,
        formData: void 0,
        json: void 0,
        text: void 0,
      };
}
function Dn(e, t, n, r) {
  return {
    state: `submitting`,
    location: e,
    matches: t,
    historyAction: n,
    formMethod: r.formMethod,
    formAction: r.formAction,
    formEncType: r.formEncType,
    formData: r.formData,
    json: r.json,
    text: r.text,
  };
}
function On(e, t) {
  return e
    ? {
        state: `loading`,
        formMethod: e.formMethod,
        formAction: e.formAction,
        formEncType: e.formEncType,
        formData: e.formData,
        json: e.json,
        text: e.text,
        data: t,
      }
    : {
        state: `loading`,
        formMethod: void 0,
        formAction: void 0,
        formEncType: void 0,
        formData: void 0,
        json: void 0,
        text: void 0,
        data: t,
      };
}
function kn(e, t) {
  return {
    state: `submitting`,
    formMethod: e.formMethod,
    formAction: e.formAction,
    formEncType: e.formEncType,
    formData: e.formData,
    json: e.json,
    text: e.text,
    data: t ? t.data : void 0,
  };
}
function An(e) {
  return {
    state: `idle`,
    formMethod: void 0,
    formAction: void 0,
    formEncType: void 0,
    formData: void 0,
    json: void 0,
    text: void 0,
    data: e,
  };
}
function jn(e, t) {
  try {
    let n = e.sessionStorage.getItem(ft);
    if (n) {
      let e = JSON.parse(n);
      for (let [n, r] of Object.entries(e || {}))
        r && Array.isArray(r) && t.set(n, new Set(r || []));
    }
  } catch {}
}
function Mn(e, t) {
  if (t.size > 0) {
    let n = {};
    for (let [e, r] of t) n[e] = [...r];
    try {
      e.sessionStorage.setItem(ft, JSON.stringify(n));
    } catch (e) {
      O(
        !1,
        `Failed to save applied view transitions in sessionStorage (${e}).`,
      );
    }
  }
}
function Nn() {
  let e,
    t,
    n = new Promise((r, i) => {
      ((e = async (e) => {
        r(e);
        try {
          await n;
        } catch {}
      }),
        (t = async (e) => {
          i(e);
          try {
            await n;
          } catch {}
        }));
    });
  return { promise: n, resolve: e, reject: t };
}
var Pn = m.createContext(null);
Pn.displayName = `DataRouter`;
var Fn = m.createContext(null);
Fn.displayName = `DataRouterState`;
var In = m.createContext(!1);
function Ln() {
  return m.useContext(In);
}
var Rn = m.createContext({ isTransitioning: !1 });
Rn.displayName = `ViewTransition`;
var zn = m.createContext(new Map());
zn.displayName = `Fetchers`;
var Bn = m.createContext(null);
Bn.displayName = `Await`;
var Vn = m.createContext(null);
Vn.displayName = `Navigation`;
var Hn = m.createContext(null);
Hn.displayName = `Location`;
var Un = m.createContext({ outlet: null, matches: [], isDataRoute: !1 });
Un.displayName = `Route`;
var Wn = m.createContext(null);
Wn.displayName = `RouteError`;
var Gn = `REACT_ROUTER_ERROR`,
  Kn = `REDIRECT`,
  qn = `ROUTE_ERROR_RESPONSE`;
function Jn(e) {
  if (e.startsWith(`${Gn}:${Kn}:{`))
    try {
      let t = JSON.parse(e.slice(28));
      if (
        typeof t == `object` &&
        t &&
        typeof t.status == `number` &&
        typeof t.statusText == `string` &&
        typeof t.location == `string` &&
        typeof t.reloadDocument == `boolean` &&
        typeof t.replace == `boolean`
      )
        return t;
    } catch {}
}
function Yn(e) {
  if (e.startsWith(`${Gn}:${qn}:{`))
    try {
      let t = JSON.parse(e.slice(40));
      if (
        typeof t == `object` &&
        t &&
        typeof t.status == `number` &&
        typeof t.statusText == `string`
      )
        return new Be(t.status, t.statusText, t.data);
    } catch {}
}
function Xn(e, { relative: t } = {}) {
  D(Zn(), `useHref() may be used only in the context of a <Router> component.`);
  let { basename: n, navigator: r } = m.useContext(Vn),
    { hash: i, pathname: a, search: o } = or(e, { relative: t }),
    s = a;
  return (
    n !== `/` && (s = a === `/` ? n : V([n, a])),
    r.createHref({ pathname: s, search: o, hash: i })
  );
}
function Zn() {
  return m.useContext(Hn) != null;
}
function Qn() {
  return (
    D(
      Zn(),
      `useLocation() may be used only in the context of a <Router> component.`,
    ),
    m.useContext(Hn).location
  );
}
var $n = `You should call navigate() in a React.useEffect(), not when your component is first rendered.`;
function er(e) {
  m.useContext(Vn).static || m.useLayoutEffect(e);
}
function tr() {
  let { isDataRoute: e } = m.useContext(Un);
  return e ? wr() : nr();
}
function nr() {
  D(
    Zn(),
    `useNavigate() may be used only in the context of a <Router> component.`,
  );
  let e = m.useContext(Pn),
    { basename: t, navigator: n } = m.useContext(Vn),
    { matches: r } = m.useContext(Un),
    { pathname: i } = Qn(),
    a = JSON.stringify(Ne(r)),
    o = m.useRef(!1);
  return (
    er(() => {
      o.current = !0;
    }),
    m.useCallback(
      (r, s = {}) => {
        if ((O(o.current, $n), !o.current)) return;
        if (typeof r == `number`) {
          n.go(r);
          return;
        }
        let c = Pe(r, JSON.parse(a), i, s.relative === `path`);
        (e == null &&
          t !== `/` &&
          (c.pathname = c.pathname === `/` ? t : V([t, c.pathname])),
          (s.replace ? n.replace : n.push)(c, s.state, s));
      },
      [t, n, a, i, e],
    )
  );
}
var rr = m.createContext(null);
function ir(e) {
  let t = m.useContext(Un).outlet;
  return m.useMemo(
    () => t && m.createElement(rr.Provider, { value: e }, t),
    [t, e],
  );
}
function ar() {
  let { matches: e } = m.useContext(Un);
  return e[e.length - 1]?.params ?? {};
}
function or(e, { relative: t } = {}) {
  let { matches: n } = m.useContext(Un),
    { pathname: r } = Qn(),
    i = JSON.stringify(Ne(n));
  return m.useMemo(() => Pe(e, JSON.parse(i), r, t === `path`), [e, i, r, t]);
}
function sr(e, t, n) {
  D(
    Zn(),
    `useRoutes() may be used only in the context of a <Router> component.`,
  );
  let { navigator: r } = m.useContext(Vn),
    { matches: i } = m.useContext(Un),
    a = i[i.length - 1],
    o = a ? a.params : {},
    s = a ? a.pathname : `/`,
    c = a ? a.pathnameBase : `/`,
    l = a && a.route;
  {
    let e = (l && l.path) || ``;
    Er(
      s,
      !l || e.endsWith(`*`) || e.endsWith(`*?`),
      `You rendered descendant <Routes> (or called \`useRoutes()\`) at "${s}" (under <Route path="${e}">) but the parent route path has no trailing "*". This means if you navigate deeper, the parent won't match anymore and therefore the child routes will never render.

Please change the parent <Route path="${e}"> to <Route path="${e === `/` ? `*` : `${e}/*`}">.`,
    );
  }
  let u = Qn(),
    d;
  if (t) {
    let e = typeof t == `string` ? N(t) : t;
    (D(
      c === `/` || e.pathname?.startsWith(c),
      `When overriding the location using \`<Routes location>\` or \`useRoutes(routes, location)\`, the location pathname must begin with the portion of the URL pathname that was matched by all parent routes. The current pathname base is "${c}" but pathname "${e.pathname}" was given in the \`location\` prop.`,
    ),
      (d = e));
  } else d = u;
  let f = d.pathname || `/`,
    p = f;
  if (c !== `/`) {
    let e = c.replace(/^\//, ``).split(`/`);
    p = `/` + f.replace(/^\//, ``).split(`/`).slice(e.length).join(`/`);
  }
  let h =
    n && n.state.matches.length
      ? n.state.matches.map((e) =>
          Object.assign(e, { route: n.manifest[e.route.id] || e.route }),
        )
      : oe(e, { pathname: p });
  (O(
    l || h != null,
    `No routes matched location "${d.pathname}${d.search}${d.hash}" `,
  ),
    O(
      h == null ||
        h[h.length - 1].route.element !== void 0 ||
        h[h.length - 1].route.Component !== void 0 ||
        h[h.length - 1].route.lazy !== void 0,
      `Matched leaf route at location "${d.pathname}${d.search}${d.hash}" does not have an element or Component. This means it will render an <Outlet /> with a null value by default resulting in an "empty" page.`,
    ));
  let g = mr(
    h &&
      h.map((e) =>
        Object.assign({}, e, {
          params: Object.assign({}, o, e.params),
          pathname: V([
            c,
            r.encodeLocation
              ? r.encodeLocation(
                  e.pathname
                    .replace(/%/g, `%25`)
                    .replace(/\?/g, `%3F`)
                    .replace(/#/g, `%23`),
                ).pathname
              : e.pathname,
          ]),
          pathnameBase:
            e.pathnameBase === `/`
              ? c
              : V([
                  c,
                  r.encodeLocation
                    ? r.encodeLocation(
                        e.pathnameBase
                          .replace(/%/g, `%25`)
                          .replace(/\?/g, `%3F`)
                          .replace(/#/g, `%23`),
                      ).pathname
                    : e.pathnameBase,
                ]),
        }),
      ),
    i,
    n,
  );
  return t && g
    ? m.createElement(
        Hn.Provider,
        {
          value: {
            location: {
              pathname: `/`,
              search: ``,
              hash: ``,
              state: null,
              key: `default`,
              mask: void 0,
              ...d,
            },
            navigationType: `POP`,
          },
        },
        g,
      )
    : g;
}
function cr() {
  let e = Cr(),
    t = Ve(e)
      ? `${e.status} ${e.statusText}`
      : e instanceof Error
        ? e.message
        : JSON.stringify(e),
    n = e instanceof Error ? e.stack : null,
    r = `rgba(200,200,200, 0.5)`,
    i = { padding: `0.5rem`, backgroundColor: r },
    a = { padding: `2px 4px`, backgroundColor: r },
    o = null;
  return (
    console.error(`Error handled by React Router default ErrorBoundary:`, e),
    (o = m.createElement(
      m.Fragment,
      null,
      m.createElement(`p`, null, `💿 Hey developer 👋`),
      m.createElement(
        `p`,
        null,
        `You can provide a way better UX than this when your app throws errors by providing your own `,
        m.createElement(`code`, { style: a }, `ErrorBoundary`),
        ` or`,
        ` `,
        m.createElement(`code`, { style: a }, `errorElement`),
        ` prop on your route.`,
      ),
    )),
    m.createElement(
      m.Fragment,
      null,
      m.createElement(`h2`, null, `Unexpected Application Error!`),
      m.createElement(`h3`, { style: { fontStyle: `italic` } }, t),
      n ? m.createElement(`pre`, { style: i }, n) : null,
      o,
    )
  );
}
var lr = m.createElement(cr, null),
  ur = class extends m.Component {
    constructor(e) {
      (super(e),
        (this.state = {
          location: e.location,
          revalidation: e.revalidation,
          error: e.error,
        }));
    }
    static getDerivedStateFromError(e) {
      return { error: e };
    }
    static getDerivedStateFromProps(e, t) {
      return t.location !== e.location ||
        (t.revalidation !== `idle` && e.revalidation === `idle`)
        ? { error: e.error, location: e.location, revalidation: e.revalidation }
        : {
            error: e.error === void 0 ? t.error : e.error,
            location: t.location,
            revalidation: e.revalidation || t.revalidation,
          };
    }
    componentDidCatch(e, t) {
      this.props.onError
        ? this.props.onError(e, t)
        : console.error(
            `React Router caught the following error during render`,
            e,
          );
    }
    render() {
      let e = this.state.error;
      if (
        this.context &&
        typeof e == `object` &&
        e &&
        `digest` in e &&
        typeof e.digest == `string`
      ) {
        let t = Yn(e.digest);
        t && (e = t);
      }
      let t =
        e === void 0
          ? this.props.children
          : m.createElement(
              Un.Provider,
              { value: this.props.routeContext },
              m.createElement(Wn.Provider, {
                value: e,
                children: this.props.component,
              }),
            );
      return this.context ? m.createElement(fr, { error: e }, t) : t;
    }
  };
ur.contextType = In;
var dr = new WeakMap();
function fr({ children: e, error: t }) {
  let { basename: n } = m.useContext(Vn);
  if (
    typeof t == `object` &&
    t &&
    `digest` in t &&
    typeof t.digest == `string`
  ) {
    let e = Jn(t.digest);
    if (e) {
      let r = dr.get(t);
      if (r) throw r;
      let i = We(e.location, n);
      if (Ue && !dr.get(t))
        if (i.isExternal || e.reloadDocument)
          window.location.href = i.absoluteURL || i.to;
        else {
          let n = Promise.resolve().then(() =>
            window.__reactRouterDataRouter.navigate(i.to, {
              replace: e.replace,
            }),
          );
          throw (dr.set(t, n), n);
        }
      return m.createElement(`meta`, {
        httpEquiv: `refresh`,
        content: `0;url=${i.absoluteURL || i.to}`,
      });
    }
  }
  return e;
}
function pr({ routeContext: e, match: t, children: n }) {
  let r = m.useContext(Pn);
  return (
    r &&
      r.static &&
      r.staticContext &&
      (t.route.errorElement || t.route.ErrorBoundary) &&
      (r.staticContext._deepestRenderedBoundaryId = t.route.id),
    m.createElement(Un.Provider, { value: e }, n)
  );
}
function mr(e, t = [], n) {
  let r = n?.state;
  if (e == null) {
    if (!r) return null;
    if (r.errors) e = r.matches;
    else if (t.length === 0 && !r.initialized && r.matches.length > 0)
      e = r.matches;
    else return null;
  }
  let i = e,
    a = r?.errors;
  if (a != null) {
    let e = i.findIndex((e) => e.route.id && a?.[e.route.id] !== void 0);
    (D(
      e >= 0,
      `Could not find a matching route for errors on route IDs: ${Object.keys(a).join(`,`)}`,
    ),
      (i = i.slice(0, Math.min(i.length, e + 1))));
  }
  let o = !1,
    s = -1;
  if (n && r) {
    o = r.renderFallback;
    for (let e = 0; e < i.length; e++) {
      let t = i[e];
      if (
        ((t.route.HydrateFallback || t.route.hydrateFallbackElement) && (s = e),
        t.route.id)
      ) {
        let { loaderData: e, errors: a } = r,
          c =
            t.route.loader &&
            !e.hasOwnProperty(t.route.id) &&
            (!a || a[t.route.id] === void 0);
        if (t.route.lazy || c) {
          (n.isStatic && (o = !0), (i = s >= 0 ? i.slice(0, s + 1) : [i[0]]));
          break;
        }
      }
    }
  }
  let c = n?.onError,
    l =
      r && c
        ? (e, t) => {
            c(e, {
              location: r.location,
              params: r.matches?.[0]?.params ?? {},
              pattern: He(r.matches),
              errorInfo: t,
            });
          }
        : void 0;
  return i.reduceRight((e, n, c) => {
    let u,
      d = !1,
      f = null,
      p = null;
    r &&
      ((u = a && n.route.id ? a[n.route.id] : void 0),
      (f = n.route.errorElement || lr),
      o &&
        (s < 0 && c === 0
          ? (Er(
              `route-fallback`,
              !1,
              "No `HydrateFallback` element provided to render during initial hydration",
            ),
            (d = !0),
            (p = null))
          : s === c &&
            ((d = !0), (p = n.route.hydrateFallbackElement || null))));
    let h = t.concat(i.slice(0, c + 1)),
      g = () => {
        let t;
        return (
          (t = u
            ? f
            : d
              ? p
              : n.route.Component
                ? m.createElement(n.route.Component, null)
                : n.route.element
                  ? n.route.element
                  : e),
          m.createElement(pr, {
            match: n,
            routeContext: { outlet: e, matches: h, isDataRoute: r != null },
            children: t,
          })
        );
      };
    return r && (n.route.ErrorBoundary || n.route.errorElement || c === 0)
      ? m.createElement(ur, {
          location: r.location,
          revalidation: r.revalidation,
          component: f,
          error: u,
          children: g(),
          routeContext: { outlet: null, matches: h, isDataRoute: !0 },
          onError: l,
        })
      : g();
  }, null);
}
function hr(e) {
  return `${e} must be used within a data router.  See https://reactrouter.com/en/main/routers/picking-a-router.`;
}
function gr(e) {
  let t = m.useContext(Pn);
  return (D(t, hr(e)), t);
}
function _r(e) {
  let t = m.useContext(Fn);
  return (D(t, hr(e)), t);
}
function vr(e) {
  let t = m.useContext(Un);
  return (D(t, hr(e)), t);
}
function yr(e) {
  let t = vr(e),
    n = t.matches[t.matches.length - 1];
  return (
    D(n.route.id, `${e} can only be used on routes that contain a unique "id"`),
    n.route.id
  );
}
function br() {
  return yr(`useRouteId`);
}
function xr() {
  let e = _r(`useNavigation`);
  return m.useMemo(() => {
    let { matches: t, historyAction: n, ...r } = e.navigation;
    return r;
  }, [e.navigation]);
}
function Sr() {
  let { matches: e, loaderData: t } = _r(`useMatches`);
  return m.useMemo(() => e.map((e) => ce(e, t)), [e, t]);
}
function Cr() {
  let e = m.useContext(Wn),
    t = _r(`useRouteError`),
    n = yr(`useRouteError`);
  return e === void 0 ? t.errors?.[n] : e;
}
function wr() {
  let { router: e } = gr(`useNavigate`),
    t = yr(`useNavigate`),
    n = m.useRef(!1);
  return (
    er(() => {
      n.current = !0;
    }),
    m.useCallback(
      async (r, i = {}) => {
        (O(n.current, $n),
          n.current &&
            (typeof r == `number`
              ? await e.navigate(r)
              : await e.navigate(r, { fromRouteId: t, ...i })));
      },
      [e, t],
    )
  );
}
var Tr = {};
function Er(e, t, n) {
  !t && !Tr[e] && ((Tr[e] = !0), O(!1, n));
}
var Dr = {};
function Or(e, t) {
  !e && !Dr[t] && ((Dr[t] = !0), console.warn(t));
}
var kr = m.useOptimistic,
  Ar = () => void 0;
function jr(e) {
  return kr ? kr(e) : [e, Ar];
}
function Mr(e) {
  let t = {
    hasErrorBoundary:
      e.hasErrorBoundary || e.ErrorBoundary != null || e.errorElement != null,
  };
  return (
    e.Component &&
      (e.element &&
        O(
          !1,
          "You should not include both `Component` and `element` on your route - `Component` will be used.",
        ),
      Object.assign(t, {
        element: m.createElement(e.Component),
        Component: void 0,
      })),
    e.HydrateFallback &&
      (e.hydrateFallbackElement &&
        O(
          !1,
          "You should not include both `HydrateFallback` and `hydrateFallbackElement` on your route - `HydrateFallback` will be used.",
        ),
      Object.assign(t, {
        hydrateFallbackElement: m.createElement(e.HydrateFallback),
        HydrateFallback: void 0,
      })),
    e.ErrorBoundary &&
      (e.errorElement &&
        O(
          !1,
          "You should not include both `ErrorBoundary` and `errorElement` on your route - `ErrorBoundary` will be used.",
        ),
      Object.assign(t, {
        errorElement: m.createElement(e.ErrorBoundary),
        ErrorBoundary: void 0,
      })),
    t
  );
}
var Nr = [`HydrateFallback`, `hydrateFallbackElement`],
  Pr = class {
    constructor() {
      ((this.status = `pending`),
        (this.promise = new Promise((e, t) => {
          ((this.resolve = (t) => {
            this.status === `pending` && ((this.status = `resolved`), e(t));
          }),
            (this.reject = (e) => {
              this.status === `pending` && ((this.status = `rejected`), t(e));
            }));
        })));
    }
  };
function Fr({ router: e, flushSync: t, onError: n, useTransitions: r }) {
  r = Ln() || r;
  let [i, a] = m.useState(e.state),
    [o, s] = jr(i),
    [c, l] = m.useState(),
    [u, d] = m.useState({ isTransitioning: !1 }),
    [f, p] = m.useState(),
    [h, g] = m.useState(),
    [_, v] = m.useState(),
    y = m.useRef(new Map()),
    b = m.useCallback(
      (
        i,
        {
          deletedFetchers: o,
          newErrors: c,
          flushSync: u,
          viewTransitionOpts: _,
        },
      ) => {
        (c &&
          n &&
          Object.values(c).forEach((e) =>
            n(e, {
              location: i.location,
              params: i.matches[0]?.params ?? {},
              pattern: He(i.matches),
            }),
          ),
          i.fetchers.forEach((e, t) => {
            e.data !== void 0 && y.current.set(t, e.data);
          }),
          o.forEach((e) => y.current.delete(e)),
          Or(
            u === !1 || t != null,
            'You provided the `flushSync` option to a router update, but you are not using the `<RouterProvider>` from `react-router/dom` so `ReactDOM.flushSync()` is unavailable.  Please update your app to `import { RouterProvider } from "react-router/dom"` and ensure you have `react-dom` installed as a dependency to use the `flushSync` option.',
          ));
        let b =
          e.window != null &&
          e.window.document != null &&
          typeof e.window.document.startViewTransition == `function`;
        if (
          (Or(
            _ == null || b,
            "You provided the `viewTransition` option to a router update, but you do not appear to be running in a DOM environment as `window.startViewTransition` is not available.",
          ),
          !_ || !b)
        ) {
          t && u
            ? t(() => a(i))
            : r === !1
              ? a(i)
              : m.startTransition(() => {
                  (r === !0 && s((e) => Ir(e, i)), a(i));
                });
          return;
        }
        if (t && u) {
          t(() => {
            (h && (f?.resolve(), h.skipTransition()),
              d({
                isTransitioning: !0,
                flushSync: !0,
                currentLocation: _.currentLocation,
                nextLocation: _.nextLocation,
              }));
          });
          let n = e.window.document.startViewTransition(() => {
            t(() => a(i));
          });
          (n.finished.finally(() => {
            t(() => {
              (p(void 0), g(void 0), l(void 0), d({ isTransitioning: !1 }));
            });
          }),
            t(() => g(n)));
          return;
        }
        h
          ? (f?.resolve(),
            h.skipTransition(),
            v({
              state: i,
              currentLocation: _.currentLocation,
              nextLocation: _.nextLocation,
            }))
          : (l(i),
            d({
              isTransitioning: !0,
              flushSync: !1,
              currentLocation: _.currentLocation,
              nextLocation: _.nextLocation,
            }));
      },
      [e.window, t, h, f, r, s, n],
    );
  (m.useLayoutEffect(() => e.subscribe(b), [e, b]),
    m.useEffect(() => {
      u.isTransitioning && !u.flushSync && p(new Pr());
    }, [u]),
    m.useEffect(() => {
      if (f && c && e.window) {
        let t = c,
          n = f.promise,
          i = e.window.document.startViewTransition(async () => {
            (r === !1
              ? a(t)
              : m.startTransition(() => {
                  (r === !0 && s((e) => Ir(e, t)), a(t));
                }),
              await n);
          });
        (i.finished.finally(() => {
          (p(void 0), g(void 0), l(void 0), d({ isTransitioning: !1 }));
        }),
          g(i));
      }
    }, [c, f, e.window, r, s]),
    m.useEffect(() => {
      f && c && o.location.key === c.location.key && f.resolve();
    }, [f, h, o.location, c]),
    m.useEffect(() => {
      !u.isTransitioning &&
        _ &&
        (l(_.state),
        d({
          isTransitioning: !0,
          flushSync: !1,
          currentLocation: _.currentLocation,
          nextLocation: _.nextLocation,
        }),
        v(void 0));
    }, [u.isTransitioning, _]));
  let x = m.useMemo(
      () => ({
        createHref: e.createHref,
        encodeLocation: e.encodeLocation,
        go: (t) => e.navigate(t),
        push: (t, n, r) =>
          e.navigate(t, {
            state: n,
            preventScrollReset: r?.preventScrollReset,
          }),
        replace: (t, n, r) =>
          e.navigate(t, {
            replace: !0,
            state: n,
            preventScrollReset: r?.preventScrollReset,
          }),
      }),
      [e],
    ),
    S = e.basename || `/`,
    C = m.useMemo(
      () => ({ router: e, navigator: x, static: !1, basename: S, onError: n }),
      [e, x, S, n],
    );
  return m.createElement(
    m.Fragment,
    null,
    m.createElement(
      Pn.Provider,
      { value: C },
      m.createElement(
        Fn.Provider,
        { value: o },
        m.createElement(
          zn.Provider,
          { value: y.current },
          m.createElement(
            Rn.Provider,
            { value: u },
            m.createElement(
              Vr,
              {
                basename: S,
                location: o.location,
                navigationType: o.historyAction,
                navigator: x,
                useTransitions: r,
              },
              m.createElement(Lr, {
                routes: e.routes,
                manifest: e.manifest,
                future: e.future,
                state: o,
                isStatic: !1,
                onError: n,
              }),
            ),
          ),
        ),
      ),
    ),
    null,
  );
}
function Ir(e, t) {
  return {
    ...e,
    navigation: t.navigation.state === `idle` ? e.navigation : t.navigation,
    revalidation: t.revalidation === `idle` ? e.revalidation : t.revalidation,
    actionData:
      t.navigation.state === `submitting` ? e.actionData : t.actionData,
    fetchers: t.fetchers,
  };
}
var Lr = m.memo(Rr);
function Rr({
  routes: e,
  manifest: t,
  future: n,
  state: r,
  isStatic: i,
  onError: a,
}) {
  return sr(e, void 0, {
    manifest: t,
    state: r,
    isStatic: i,
    onError: a,
    future: n,
  });
}
function zr({ to: e, replace: t, state: n, relative: r }) {
  D(
    Zn(),
    `<Navigate> may be used only in the context of a <Router> component.`,
  );
  let { static: i } = m.useContext(Vn);
  O(
    !i,
    `<Navigate> must not be used on the initial render in a <StaticRouter>. This is a no-op, but you should modify your code so the <Navigate> is only ever rendered in response to some user interaction or state change.`,
  );
  let { matches: a } = m.useContext(Un),
    { pathname: o } = Qn(),
    s = tr(),
    c = Pe(e, Ne(a), o, r === `path`),
    l = JSON.stringify(c);
  return (
    m.useEffect(() => {
      s(JSON.parse(l), { replace: t, state: n, relative: r });
    }, [s, l, r, t, n]),
    null
  );
}
function Br(e) {
  return ir(e.context);
}
function Vr({
  basename: e = `/`,
  children: t = null,
  location: n,
  navigationType: r = `POP`,
  navigator: i,
  static: a = !1,
  useTransitions: o,
}) {
  D(
    !Zn(),
    `You cannot render a <Router> inside another <Router>. You should never have more than one in your app.`,
  );
  let s = e.replace(/^\/*/, `/`),
    c = m.useMemo(
      () => ({
        basename: s,
        navigator: i,
        static: a,
        useTransitions: o,
        future: {},
      }),
      [s, i, a, o],
    );
  typeof n == `string` && (n = N(n));
  let {
      pathname: l = `/`,
      search: u = ``,
      hash: d = ``,
      state: f = null,
      key: p = `default`,
      mask: h,
    } = n,
    g = m.useMemo(() => {
      let e = Te(l, s);
      return e == null
        ? null
        : {
            location: {
              pathname: e,
              search: u,
              hash: d,
              state: f,
              key: p,
              mask: h,
            },
            navigationType: r,
          };
    }, [s, l, u, d, f, p, r, h]);
  return (
    O(
      g != null,
      `<Router basename="${s}"> is not able to match the URL "${l}${u}${d}" because it does not start with the basename, so the <Router> won't render anything.`,
    ),
    g == null
      ? null
      : m.createElement(
          Vn.Provider,
          { value: c },
          m.createElement(Hn.Provider, { children: t, value: g }),
        )
  );
}
m.Component;
var Hr = `get`,
  Ur = `application/x-www-form-urlencoded`;
function Wr(e) {
  return typeof HTMLElement < `u` && e instanceof HTMLElement;
}
function Gr(e) {
  return Wr(e) && e.tagName.toLowerCase() === `button`;
}
function Kr(e) {
  return Wr(e) && e.tagName.toLowerCase() === `form`;
}
function qr(e) {
  return Wr(e) && e.tagName.toLowerCase() === `input`;
}
function Jr(e) {
  return !!(e.metaKey || e.altKey || e.ctrlKey || e.shiftKey);
}
function Yr(e, t) {
  return e.button === 0 && (!t || t === `_self`) && !Jr(e);
}
function Xr(e = ``) {
  return new URLSearchParams(
    typeof e == `string` || Array.isArray(e) || e instanceof URLSearchParams
      ? e
      : Object.keys(e).reduce((t, n) => {
          let r = e[n];
          return t.concat(Array.isArray(r) ? r.map((e) => [n, e]) : [[n, r]]);
        }, []),
  );
}
function Zr(e, t) {
  let n = Xr(e);
  return (
    t &&
      t.forEach((e, r) => {
        n.has(r) ||
          t.getAll(r).forEach((e) => {
            n.append(r, e);
          });
      }),
    n
  );
}
var Qr = null;
function $r() {
  if (Qr === null)
    try {
      (new FormData(document.createElement(`form`), 0), (Qr = !1));
    } catch {
      Qr = !0;
    }
  return Qr;
}
var ei = new Set([
  `application/x-www-form-urlencoded`,
  `multipart/form-data`,
  `text/plain`,
]);
function ti(e) {
  return e != null && !ei.has(e)
    ? (O(
        !1,
        `"${e}" is not a valid \`encType\` for \`<Form>\`/\`<fetcher.Form>\` and will default to "${Ur}"`,
      ),
      null)
    : e;
}
function ni(e, t) {
  let n, r, i, a, o;
  if (Kr(e)) {
    let o = e.getAttribute(`action`);
    ((r = o ? Te(o, t) : null),
      (n = e.getAttribute(`method`) || Hr),
      (i = ti(e.getAttribute(`enctype`)) || Ur),
      (a = new FormData(e)));
  } else if (Gr(e) || (qr(e) && (e.type === `submit` || e.type === `image`))) {
    let o = e.form;
    if (o == null)
      throw Error(
        `Cannot submit a <button> or <input type="submit"> without a <form>`,
      );
    let s = e.getAttribute(`formaction`) || o.getAttribute(`action`);
    if (
      ((r = s ? Te(s, t) : null),
      (n = e.getAttribute(`formmethod`) || o.getAttribute(`method`) || Hr),
      (i =
        ti(e.getAttribute(`formenctype`)) ||
        ti(o.getAttribute(`enctype`)) ||
        Ur),
      (a = new FormData(o, e)),
      !$r())
    ) {
      let { name: t, type: n, value: r } = e;
      if (n === `image`) {
        let e = t ? `${t}.` : ``;
        (a.append(`${e}x`, `0`), a.append(`${e}y`, `0`));
      } else t && a.append(t, r);
    }
  } else if (Wr(e))
    throw Error(
      `Cannot submit element that is not <form>, <button>, or <input type="submit|image">`,
    );
  else ((n = Hr), (r = null), (i = Ur), (o = e));
  return (
    a && i === `text/plain` && ((o = a), (a = void 0)),
    { action: r, method: n.toLowerCase(), encType: i, formData: a, body: o }
  );
}
Object.getOwnPropertyNames(Object.prototype).sort().join(`\0`);
var ri = {
    "&": `\\u0026`,
    ">": `\\u003e`,
    "<": `\\u003c`,
    "\u2028": `\\u2028`,
    "\u2029": `\\u2029`,
  },
  ii = /[&><\u2028\u2029]/g;
function ai(e) {
  return e.replace(ii, (e) => ri[e]);
}
function oi(e, t) {
  if (e === !1 || e == null) throw Error(t);
}
function si(e, t, n, r) {
  let i =
    typeof e == `string`
      ? new URL(
          e,
          typeof window > `u`
            ? `server://singlefetch/`
            : window.location.origin,
        )
      : e;
  return (
    n
      ? i.pathname.endsWith(`/`)
        ? (i.pathname = `${i.pathname}_.${r}`)
        : (i.pathname = `${i.pathname}.${r}`)
      : i.pathname === `/`
        ? (i.pathname = `_root.${r}`)
        : t && Te(i.pathname, t) === `/`
          ? (i.pathname = `${Ie(t)}/_root.${r}`)
          : (i.pathname = `${Ie(i.pathname)}.${r}`),
    i
  );
}
async function ci(e, t) {
  if (e.id in t) return t[e.id];
  try {
    let n = await v(() => import(e.module), []);
    return ((t[e.id] = n), n);
  } catch (t) {
    return (
      console.error(
        `Error loading route module \`${e.module}\`, reloading page...`,
      ),
      console.error(t),
      window.__reactRouterContext && window.__reactRouterContext.isSpaMode,
      window.location.reload(),
      new Promise(() => {})
    );
  }
}
function li(e) {
  return e != null && typeof e.page == `string`;
}
function ui(e) {
  return e == null
    ? !1
    : e.href == null
      ? e.rel === `preload` &&
        typeof e.imageSrcSet == `string` &&
        typeof e.imageSizes == `string`
      : typeof e.rel == `string` && typeof e.href == `string`;
}
async function di(e, t, n) {
  return gi(
    (
      await Promise.all(
        e.map(async (e) => {
          let r = t.routes[e.route.id];
          if (r) {
            let e = await ci(r, n);
            return e.links ? e.links() : [];
          }
          return [];
        }),
      )
    )
      .flat(1)
      .filter(ui)
      .filter((e) => e.rel === `stylesheet` || e.rel === `preload`)
      .map((e) =>
        e.rel === `stylesheet`
          ? { ...e, rel: `prefetch`, as: `style` }
          : { ...e, rel: `prefetch` },
      ),
  );
}
function fi(e, t, n, r, i, a) {
  let o = (e, t) => (n[t] ? e.route.id !== n[t].route.id : !0),
    s = (e, t) =>
      n[t].pathname !== e.pathname ||
      (n[t].route.path?.endsWith(`*`) && n[t].params[`*`] !== e.params[`*`]);
  return a === `assets`
    ? t.filter((e, t) => o(e, t) || s(e, t))
    : a === `data`
      ? t.filter((t, a) => {
          let c = r.routes[t.route.id];
          if (!c || !c.hasLoader) return !1;
          if (o(t, a) || s(t, a)) return !0;
          if (t.route.shouldRevalidate) {
            let r = t.route.shouldRevalidate({
              currentUrl: new URL(
                i.pathname + i.search + i.hash,
                window.origin,
              ),
              currentParams: n[0]?.params || {},
              nextUrl: new URL(e, window.origin),
              nextParams: t.params,
              defaultShouldRevalidate: !0,
            });
            if (typeof r == `boolean`) return r;
          }
          return !0;
        })
      : [];
}
function pi(e, t, { includeHydrateFallback: n } = {}) {
  return mi(
    e
      .map((e) => {
        let r = t.routes[e.route.id];
        if (!r) return [];
        let i = [r.module];
        return (
          r.clientActionModule && (i = i.concat(r.clientActionModule)),
          r.clientLoaderModule && (i = i.concat(r.clientLoaderModule)),
          n &&
            r.hydrateFallbackModule &&
            (i = i.concat(r.hydrateFallbackModule)),
          r.imports && (i = i.concat(r.imports)),
          i
        );
      })
      .flat(1),
  );
}
function mi(e) {
  return [...new Set(e)];
}
function hi(e) {
  let t = {},
    n = Object.keys(e).sort();
  for (let r of n) t[r] = e[r];
  return t;
}
function gi(e, t) {
  let n = new Set(),
    r = new Set(t);
  return e.reduce((e, i) => {
    if (t && !li(i) && i.as === `script` && i.href && r.has(i.href)) return e;
    let a = JSON.stringify(hi(i));
    return (n.has(a) || (n.add(a), e.push({ key: a, link: i })), e);
  }, []);
}
function _i() {
  let e = m.useContext(Pn);
  return (
    oi(
      e,
      `You must render this element inside a <DataRouterContext.Provider> element`,
    ),
    e
  );
}
function vi() {
  let e = m.useContext(Fn);
  return (
    oi(
      e,
      `You must render this element inside a <DataRouterStateContext.Provider> element`,
    ),
    e
  );
}
var yi = m.createContext(void 0);
yi.displayName = `FrameworkContext`;
function bi() {
  let e = m.useContext(yi);
  return (
    oi(e, `You must render this element inside a <HydratedRouter> element`),
    e
  );
}
function xi(e, t) {
  let n = m.useContext(yi),
    [r, i] = m.useState(!1),
    [a, o] = m.useState(!1),
    {
      onFocus: s,
      onBlur: c,
      onMouseEnter: l,
      onMouseLeave: u,
      onTouchStart: d,
    } = t,
    f = m.useRef(null);
  (m.useEffect(() => {
    if ((e === `render` && o(!0), e === `viewport`)) {
      let e = new IntersectionObserver(
        (e) => {
          e.forEach((e) => {
            o(e.isIntersecting);
          });
        },
        { threshold: 0.5 },
      );
      return (
        f.current && e.observe(f.current),
        () => {
          e.disconnect();
        }
      );
    }
  }, [e]),
    m.useEffect(() => {
      if (r) {
        let e = setTimeout(() => {
          o(!0);
        }, 100);
        return () => {
          clearTimeout(e);
        };
      }
    }, [r]));
  let p = () => {
      i(!0);
    },
    h = () => {
      (i(!1), o(!1));
    };
  return n
    ? e === `intent`
      ? [
          a,
          f,
          {
            onFocus: Si(s, p),
            onBlur: Si(c, h),
            onMouseEnter: Si(l, p),
            onMouseLeave: Si(u, h),
            onTouchStart: Si(d, p),
          },
        ]
      : [a, f, {}]
    : [!1, f, {}];
}
function Si(e, t) {
  return (n) => {
    (e && e(n), n.defaultPrevented || t(n));
  };
}
function Ci({ page: e, ...t }) {
  let n = Ln(),
    { router: r } = _i(),
    i = m.useMemo(() => oe(r.routes, e, r.basename), [r.routes, e, r.basename]);
  return i
    ? n
      ? m.createElement(Ti, { page: e, matches: i, ...t })
      : m.createElement(Ei, { page: e, matches: i, ...t })
    : null;
}
function wi(e) {
  let { manifest: t, routeModules: n } = bi(),
    [r, i] = m.useState([]);
  return (
    m.useEffect(() => {
      let r = !1;
      return (
        di(e, t, n).then((e) => {
          r || i(e);
        }),
        () => {
          r = !0;
        }
      );
    }, [e, t, n]),
    r
  );
}
function Ti({ page: e, matches: t, ...n }) {
  let r = Qn(),
    { future: i } = bi(),
    { basename: a } = _i(),
    o = m.useMemo(() => {
      if (e === r.pathname + r.search + r.hash) return [];
      let n = si(e, a, i.v8_trailingSlashAwareDataRequests, `rsc`),
        o = !1,
        s = [];
      for (let e of t)
        typeof e.route.shouldRevalidate == `function`
          ? (o = !0)
          : s.push(e.route.id);
      return (
        o && s.length > 0 && n.searchParams.set(`_routes`, s.join(`,`)),
        [n.pathname + n.search]
      );
    }, [a, i.v8_trailingSlashAwareDataRequests, e, r, t]);
  return m.createElement(
    m.Fragment,
    null,
    o.map((e) =>
      m.createElement(`link`, {
        key: e,
        rel: `prefetch`,
        as: `fetch`,
        href: e,
        ...n,
      }),
    ),
  );
}
function Ei({ page: e, matches: t, ...n }) {
  let r = Qn(),
    { future: i, manifest: a, routeModules: o } = bi(),
    { basename: s } = _i(),
    { loaderData: c, matches: l } = vi(),
    u = m.useMemo(() => fi(e, t, l, a, r, `data`), [e, t, l, a, r]),
    d = m.useMemo(() => fi(e, t, l, a, r, `assets`), [e, t, l, a, r]),
    f = m.useMemo(() => {
      if (e === r.pathname + r.search + r.hash) return [];
      let n = new Set(),
        l = !1;
      if (
        (t.forEach((e) => {
          let t = a.routes[e.route.id];
          !t ||
            !t.hasLoader ||
            ((!u.some((t) => t.route.id === e.route.id) &&
              e.route.id in c &&
              o[e.route.id]?.shouldRevalidate) ||
            t.hasClientLoader
              ? (l = !0)
              : n.add(e.route.id));
        }),
        n.size === 0)
      )
        return [];
      let d = si(e, s, i.v8_trailingSlashAwareDataRequests, `data`);
      return (
        l &&
          n.size > 0 &&
          d.searchParams.set(
            `_routes`,
            t
              .filter((e) => n.has(e.route.id))
              .map((e) => e.route.id)
              .join(`,`),
          ),
        [d.pathname + d.search]
      );
    }, [s, i.v8_trailingSlashAwareDataRequests, c, r, a, u, t, e, o]),
    p = m.useMemo(() => pi(d, a), [d, a]),
    h = wi(d);
  return m.createElement(
    m.Fragment,
    null,
    f.map((e) =>
      m.createElement(`link`, {
        key: e,
        rel: `prefetch`,
        as: `fetch`,
        href: e,
        ...n,
      }),
    ),
    p.map((e) =>
      m.createElement(`link`, { key: e, rel: `modulepreload`, href: e, ...n }),
    ),
    h.map(({ key: e, link: t }) =>
      m.createElement(`link`, {
        key: e,
        nonce: n.nonce,
        ...t,
        crossOrigin: t.crossOrigin ?? n.crossOrigin,
      }),
    ),
  );
}
function Di(...e) {
  return (t) => {
    e.forEach((e) => {
      typeof e == `function` ? e(t) : e != null && (e.current = t);
    });
  };
}
m.Component;
var Oi =
  typeof window < `u` &&
  window.document !== void 0 &&
  window.document.createElement !== void 0;
try {
  Oi && (window.__reactRouterVersion = `7.17.0`);
} catch {}
function ki(e, t) {
  return yt({
    basename: t?.basename,
    getContext: t?.getContext,
    future: t?.future,
    history: E({ window: t?.window }),
    hydrationData: t?.hydrationData || Ai(),
    routes: e,
    mapRouteProperties: Mr,
    hydrationRouteProperties: Nr,
    dataStrategy: t?.dataStrategy,
    patchRoutesOnNavigation: t?.patchRoutesOnNavigation,
    window: t?.window,
    instrumentations: t?.instrumentations,
  }).initialize();
}
function Ai() {
  let e = window?.__staticRouterHydrationData;
  return (e && e.errors && (e = { ...e, errors: ji(e.errors) }), e);
}
function ji(e) {
  if (!e) return null;
  let t = Object.entries(e),
    n = {};
  for (let [e, r] of t)
    if (r && r.__type === `RouteErrorResponse`)
      n[e] = new Be(r.status, r.statusText, r.data, r.internal === !0);
    else if (r && r.__type === `Error`) {
      if (r.__subType) {
        let t = window[r.__subType];
        if (typeof t == `function`)
          try {
            let i = new t(r.message);
            ((i.stack = ``), (n[e] = i));
          } catch {}
      }
      if (n[e] == null) {
        let t = Error(r.message);
        ((t.stack = ``), (n[e] = t));
      }
    } else n[e] = r;
  return n;
}
function Mi({ basename: e, children: t, history: n, useTransitions: r }) {
  let [i, a] = m.useState({ action: n.action, location: n.location }),
    o = m.useCallback(
      (e) => {
        r === !1 ? a(e) : m.startTransition(() => a(e));
      },
      [r],
    );
  return (
    m.useLayoutEffect(() => n.listen(o), [n, o]),
    m.createElement(Vr, {
      basename: e,
      children: t,
      location: i.location,
      navigationType: i.action,
      navigator: n,
      useTransitions: r,
    })
  );
}
Mi.displayName = `unstable_HistoryRouter`;
var Ni = /^(?:[a-z][a-z0-9+.-]*:|\/\/)/i,
  Pi = m.forwardRef(function (
    {
      onClick: e,
      discover: t = `render`,
      prefetch: n = `none`,
      relative: r,
      reloadDocument: i,
      replace: a,
      mask: o,
      state: s,
      target: c,
      to: l,
      preventScrollReset: u,
      viewTransition: d,
      defaultShouldRevalidate: f,
      ...p
    },
    h,
  ) {
    let { basename: g, navigator: _, useTransitions: v } = m.useContext(Vn),
      y = typeof l == `string` && Ni.test(l),
      b = We(l, g);
    l = b.to;
    let x = Xn(l, { relative: r }),
      S = Qn(),
      C = null;
    if (o) {
      let e = Pe(o, [], S.mask ? S.mask.pathname : `/`, !0);
      (g !== `/` && (e.pathname = e.pathname === `/` ? g : V([g, e.pathname])),
        (C = _.createHref(e)));
    }
    let [w, T, E] = xi(n, p),
      D = Vi(l, {
        replace: a,
        mask: o,
        state: s,
        target: c,
        preventScrollReset: u,
        relative: r,
        viewTransition: d,
        defaultShouldRevalidate: f,
        useTransitions: v,
      });
    function O(t) {
      (e && e(t), t.defaultPrevented || D(t));
    }
    let k = !(b.isExternal || i),
      A = m.createElement(`a`, {
        ...p,
        ...E,
        href: (k ? C : void 0) || b.absoluteURL || x,
        onClick: k ? O : e,
        ref: Di(h, T),
        target: c,
        "data-discover": !y && t === `render` ? `true` : void 0,
      });
    return w && !y
      ? m.createElement(m.Fragment, null, A, m.createElement(Ci, { page: x }))
      : A;
  });
Pi.displayName = `Link`;
var Fi = m.forwardRef(function (
  {
    "aria-current": e = `page`,
    caseSensitive: t = !1,
    className: n = ``,
    end: r = !1,
    style: i,
    to: a,
    viewTransition: o,
    children: s,
    ...c
  },
  l,
) {
  let u = or(a, { relative: c.relative }),
    d = Qn(),
    f = m.useContext(Fn),
    { navigator: p, basename: h } = m.useContext(Vn),
    g = f != null && Qi(u) && o === !0,
    _ = p.encodeLocation ? p.encodeLocation(u).pathname : u.pathname,
    v = d.pathname,
    y =
      f && f.navigation && f.navigation.location
        ? f.navigation.location.pathname
        : null;
  (t ||
    ((v = v.toLowerCase()),
    (y = y ? y.toLowerCase() : null),
    (_ = _.toLowerCase())),
    y && h && (y = Te(y, h) || y));
  let b = _ !== `/` && _.endsWith(`/`) ? _.length - 1 : _.length,
    x = v === _ || (!r && v.startsWith(_) && v.charAt(b) === `/`),
    S =
      y != null &&
      (y === _ || (!r && y.startsWith(_) && y.charAt(_.length) === `/`)),
    C = { isActive: x, isPending: S, isTransitioning: g },
    w = x ? e : void 0,
    T;
  T =
    typeof n == `function`
      ? n(C)
      : [
          n,
          x ? `active` : null,
          S ? `pending` : null,
          g ? `transitioning` : null,
        ]
          .filter(Boolean)
          .join(` `);
  let E = typeof i == `function` ? i(C) : i;
  return m.createElement(
    Pi,
    {
      ...c,
      "aria-current": w,
      className: T,
      ref: l,
      style: E,
      to: a,
      viewTransition: o,
    },
    typeof s == `function` ? s(C) : s,
  );
});
Fi.displayName = `NavLink`;
var Ii = m.forwardRef(
  (
    {
      discover: e = `render`,
      fetcherKey: t,
      navigate: n,
      reloadDocument: r,
      replace: i,
      state: a,
      method: o = Hr,
      action: s,
      onSubmit: c,
      relative: l,
      preventScrollReset: u,
      viewTransition: d,
      defaultShouldRevalidate: f,
      ...p
    },
    h,
  ) => {
    let { useTransitions: g } = m.useContext(Vn),
      _ = Gi(),
      v = Ki(s, { relative: l }),
      y = o.toLowerCase() === `get` ? `get` : `post`,
      b = typeof s == `string` && Ni.test(s);
    return m.createElement(`form`, {
      ref: h,
      method: y,
      action: v,
      onSubmit: r
        ? c
        : (e) => {
            if ((c && c(e), e.defaultPrevented)) return;
            e.preventDefault();
            let r = e.nativeEvent.submitter,
              s = r?.getAttribute(`formmethod`) || o,
              p = () =>
                _(r || e.currentTarget, {
                  fetcherKey: t,
                  method: s,
                  navigate: n,
                  replace: i,
                  state: a,
                  relative: l,
                  preventScrollReset: u,
                  viewTransition: d,
                  defaultShouldRevalidate: f,
                });
            g && n !== !1 ? m.startTransition(() => p()) : p();
          },
      ...p,
      "data-discover": !b && e === `render` ? `true` : void 0,
    });
  },
);
Ii.displayName = `Form`;
function Li({ getKey: e, storageKey: t, ...n }) {
  let r = m.useContext(yi),
    { basename: i } = m.useContext(Vn),
    a = Qn(),
    o = Sr();
  Xi({ getKey: e, storageKey: t });
  let s = m.useMemo(() => {
    if (!r || !e) return null;
    let t = Yi(a, o, i, e);
    return t === a.key ? null : t;
  }, []);
  if (!r || r.isSpaMode) return null;
  let c = ((e, t) => {
    if (!window.history.state || !window.history.state.key) {
      let e = Math.random().toString(32).slice(2);
      window.history.replaceState({ key: e }, ``);
    }
    try {
      let n = JSON.parse(sessionStorage.getItem(e) || `{}`)[
        t || window.history.state.key
      ];
      typeof n == `number` && window.scrollTo(0, n);
    } catch (t) {
      (console.error(t), sessionStorage.removeItem(e));
    }
  }).toString();
  return m.createElement(`script`, {
    ...n,
    suppressHydrationWarning: !0,
    dangerouslySetInnerHTML: {
      __html: `(${c})(${ai(JSON.stringify(t || qi))}, ${ai(JSON.stringify(s))})`,
    },
  });
}
Li.displayName = `ScrollRestoration`;
function Ri(e) {
  return `${e} must be used within a data router.  See https://reactrouter.com/en/main/routers/picking-a-router.`;
}
function zi(e) {
  let t = m.useContext(Pn);
  return (D(t, Ri(e)), t);
}
function Bi(e) {
  let t = m.useContext(Fn);
  return (D(t, Ri(e)), t);
}
function Vi(
  e,
  {
    target: t,
    replace: n,
    mask: r,
    state: i,
    preventScrollReset: a,
    relative: o,
    viewTransition: s,
    defaultShouldRevalidate: c,
    useTransitions: l,
  } = {},
) {
  let u = tr(),
    d = Qn(),
    f = or(e, { relative: o });
  return m.useCallback(
    (p) => {
      if (Yr(p, t)) {
        p.preventDefault();
        let t = n === void 0 ? M(d) === M(f) : n,
          h = () =>
            u(e, {
              replace: t,
              mask: r,
              state: i,
              preventScrollReset: a,
              relative: o,
              viewTransition: s,
              defaultShouldRevalidate: c,
            });
        l ? m.startTransition(() => h()) : h();
      }
    },
    [d, u, f, n, r, i, t, e, a, o, s, c, l],
  );
}
function Hi(e) {
  O(
    typeof URLSearchParams < `u`,
    "You cannot use the `useSearchParams` hook in a browser that does not support the URLSearchParams API. If you need to support Internet Explorer 11, we recommend you load a polyfill such as https://github.com/ungap/url-search-params.",
  );
  let t = m.useRef(Xr(e)),
    n = m.useRef(!1),
    r = Qn(),
    i = m.useMemo(() => Zr(r.search, n.current ? null : t.current), [r.search]),
    a = tr();
  return [
    i,
    m.useCallback(
      (e, t) => {
        let r = Xr(typeof e == `function` ? e(new URLSearchParams(i)) : e);
        ((n.current = !0), a(`?` + r, t));
      },
      [a, i],
    ),
  ];
}
var Ui = 0,
  Wi = () => `__${String(++Ui)}__`;
function Gi() {
  let { router: e } = zi(`useSubmit`),
    { basename: t } = m.useContext(Vn),
    n = br(),
    r = e.fetch,
    i = e.navigate;
  return m.useCallback(
    async (e, a = {}) => {
      let { action: o, method: s, encType: c, formData: l, body: u } = ni(e, t);
      a.navigate === !1
        ? await r(a.fetcherKey || Wi(), n, a.action || o, {
            defaultShouldRevalidate: a.defaultShouldRevalidate,
            preventScrollReset: a.preventScrollReset,
            formData: l,
            body: u,
            formMethod: a.method || s,
            formEncType: a.encType || c,
            flushSync: a.flushSync,
          })
        : await i(a.action || o, {
            defaultShouldRevalidate: a.defaultShouldRevalidate,
            preventScrollReset: a.preventScrollReset,
            formData: l,
            body: u,
            formMethod: a.method || s,
            formEncType: a.encType || c,
            replace: a.replace,
            state: a.state,
            fromRouteId: n,
            flushSync: a.flushSync,
            viewTransition: a.viewTransition,
          });
    },
    [r, i, t, n],
  );
}
function Ki(e, { relative: t } = {}) {
  let { basename: n } = m.useContext(Vn),
    r = m.useContext(Un);
  D(r, `useFormAction must be used inside a RouteContext`);
  let [i] = r.matches.slice(-1),
    a = { ...or(e || `.`, { relative: t }) },
    o = Qn();
  if (e == null) {
    a.search = o.search;
    let e = new URLSearchParams(a.search),
      t = e.getAll(`index`);
    if (t.some((e) => e === ``)) {
      (e.delete(`index`),
        t.filter((e) => e).forEach((t) => e.append(`index`, t)));
      let n = e.toString();
      a.search = n ? `?${n}` : ``;
    }
  }
  return (
    (!e || e === `.`) &&
      i.route.index &&
      (a.search = a.search ? a.search.replace(/^\?/, `?index&`) : `?index`),
    n !== `/` && (a.pathname = a.pathname === `/` ? n : V([n, a.pathname])),
    M(a)
  );
}
var qi = `react-router-scroll-positions`,
  Ji = {};
function Yi(e, t, n, r) {
  let i = null;
  return (
    r &&
      (i = r(
        n === `/` ? e : { ...e, pathname: Te(e.pathname, n) || e.pathname },
        t,
      )),
    (i ??= e.key),
    i
  );
}
function Xi({ getKey: e, storageKey: t } = {}) {
  let { router: n } = zi(`useScrollRestoration`),
    { restoreScrollPosition: r, preventScrollReset: i } =
      Bi(`useScrollRestoration`),
    { basename: a } = m.useContext(Vn),
    o = Qn(),
    s = Sr(),
    c = xr();
  (m.useEffect(
    () => (
      (window.history.scrollRestoration = `manual`),
      () => {
        window.history.scrollRestoration = `auto`;
      }
    ),
    [],
  ),
    Zi(
      m.useCallback(() => {
        if (c.state === `idle`) {
          let t = Yi(o, s, a, e);
          Ji[t] = window.scrollY;
        }
        try {
          sessionStorage.setItem(t || qi, JSON.stringify(Ji));
        } catch (e) {
          O(
            !1,
            `Failed to save scroll positions in sessionStorage, <ScrollRestoration /> will not work properly (${e}).`,
          );
        }
        window.history.scrollRestoration = `auto`;
      }, [c.state, e, a, o, s, t]),
    ),
    typeof document < `u` &&
      (m.useLayoutEffect(() => {
        try {
          let e = sessionStorage.getItem(t || qi);
          e && (Ji = JSON.parse(e));
        } catch {}
      }, [t]),
      m.useLayoutEffect(() => {
        let t = n?.enableScrollRestoration(
          Ji,
          () => window.scrollY,
          e ? (t, n) => Yi(t, n, a, e) : void 0,
        );
        return () => t && t();
      }, [n, a, e]),
      m.useLayoutEffect(() => {
        if (r !== !1) {
          if (typeof r == `number`) {
            window.scrollTo(0, r);
            return;
          }
          try {
            if (o.hash) {
              let e = document.getElementById(
                decodeURIComponent(o.hash.slice(1)),
              );
              if (e) {
                e.scrollIntoView();
                return;
              }
            }
          } catch {
            O(
              !1,
              `"${o.hash.slice(1)}" is not a decodable element ID. The view will not scroll to it.`,
            );
          }
          i !== !0 && window.scrollTo(0, 0);
        }
      }, [o, r, i])));
}
function Zi(e, t) {
  let { capture: n } = t || {};
  m.useEffect(() => {
    let t = n == null ? void 0 : { capture: n };
    return (
      window.addEventListener(`pagehide`, e, t),
      () => {
        window.removeEventListener(`pagehide`, e, t);
      }
    );
  }, [e, n]);
}
function Qi(e, { relative: t } = {}) {
  let n = m.useContext(Rn);
  D(
    n != null,
    "`useViewTransitionState` must be used within `react-router-dom`'s `RouterProvider`.  Did you accidentally import `RouterProvider` from `react-router`?",
  );
  let { basename: r } = zi(`useViewTransitionState`),
    i = or(e, { relative: t });
  if (!n.isTransitioning) return !1;
  let a = Te(n.currentLocation.pathname, r) || n.currentLocation.pathname,
    o = Te(n.nextLocation.pathname, r) || n.nextLocation.pathname;
  return Se(i.pathname, o) != null || Se(i.pathname, a) != null;
}
var $i = (e, t, n, r) => {
    let i = [n, { code: t, ...(r || {}) }];
    if (e?.services?.logger?.forward)
      return e.services.logger.forward(i, `warn`, `react-i18next::`, !0);
    (oa(i[0]) && (i[0] = `react-i18next:: ${i[0]}`),
      e?.services?.logger?.warn
        ? e.services.logger.warn(...i)
        : console?.warn && console.warn(...i));
  },
  ea = {},
  ta = (e, t, n, r) => {
    (oa(n) && ea[n]) || (oa(n) && (ea[n] = new Date()), $i(e, t, n, r));
  },
  na = (e, t) => () => {
    if (e.isInitialized) t();
    else {
      let n = () => {
        (setTimeout(() => {
          e.off(`initialized`, n);
        }, 0),
          t());
      };
      e.on(`initialized`, n);
    }
  },
  ra = (e, t, n) => {
    e.loadNamespaces(t, na(e, n));
  },
  ia = (e, t, n, r) => {
    if (
      (oa(n) && (n = [n]),
      e.options.preload && e.options.preload.indexOf(t) > -1)
    )
      return ra(e, n, r);
    (n.forEach((t) => {
      e.options.ns.indexOf(t) < 0 && e.options.ns.push(t);
    }),
      e.loadLanguages(t, na(e, r)));
  },
  aa = (e, t, n = {}) =>
    !t.languages || !t.languages.length
      ? (ta(t, `NO_LANGUAGES`, `i18n.languages were undefined or empty`, {
          languages: t.languages,
        }),
        !0)
      : t.hasLoadedNamespace(e, {
          lng: n.lng,
          precheck: (t, r) => {
            if (
              n.bindI18n &&
              n.bindI18n.indexOf(`languageChanging`) > -1 &&
              t.services.backendConnector.backend &&
              t.isLanguageChangingTo &&
              !r(t.isLanguageChangingTo, e)
            )
              return !1;
          },
        }),
  oa = (e) => typeof e == `string`,
  sa = (e) => typeof e == `object` && !!e,
  ca =
    /&(?:amp|#38|lt|#60|gt|#62|apos|#39|quot|#34|nbsp|#160|copy|#169|reg|#174|hellip|#8230|#x2F|#47);/g,
  la = {
    "&amp;": `&`,
    "&#38;": `&`,
    "&lt;": `<`,
    "&#60;": `<`,
    "&gt;": `>`,
    "&#62;": `>`,
    "&apos;": `'`,
    "&#39;": `'`,
    "&quot;": `"`,
    "&#34;": `"`,
    "&nbsp;": ` `,
    "&#160;": ` `,
    "&copy;": `©`,
    "&#169;": `©`,
    "&reg;": `®`,
    "&#174;": `®`,
    "&hellip;": `…`,
    "&#8230;": `…`,
    "&#x2F;": `/`,
    "&#47;": `/`,
  },
  ua = (e) => la[e],
  da = {
    bindI18n: `languageChanged`,
    bindI18nStore: ``,
    transEmptyNodeValue: ``,
    transSupportBasicHtmlNodes: !0,
    transWrapTextNodes: ``,
    transKeepBasicHtmlNodesFor: [`br`, `strong`, `i`, `p`],
    useSuspense: !0,
    unescape: (e) => e.replace(ca, ua),
    transDefaultProps: void 0,
  },
  fa = (e = {}) => {
    da = { ...da, ...e };
  },
  pa = () => da,
  ma,
  ha = (e) => {
    ma = e;
  },
  ga = () => ma,
  _a = {
    type: `3rdParty`,
    init(e) {
      (fa(e.options.react), ha(e));
    },
  },
  va = (0, m.createContext)(),
  ya = class {
    constructor() {
      this.usedNamespaces = {};
    }
    addUsedNamespaces(e) {
      e.forEach((e) => {
        this.usedNamespaces[e] || (this.usedNamespaces[e] = !0);
      });
    }
    getUsedNamespaces() {
      return Object.keys(this.usedNamespaces);
    }
  },
  ba = o((e) => {
    var t = d();
    function n(e, t) {
      return (e === t && (e !== 0 || 1 / e == 1 / t)) || (e !== e && t !== t);
    }
    var r = typeof Object.is == `function` ? Object.is : n,
      i = t.useState,
      a = t.useEffect,
      o = t.useLayoutEffect,
      s = t.useDebugValue;
    function c(e, t) {
      var n = t(),
        r = i({ inst: { value: n, getSnapshot: t } }),
        c = r[0].inst,
        u = r[1];
      return (
        o(
          function () {
            ((c.value = n), (c.getSnapshot = t), l(c) && u({ inst: c }));
          },
          [e, n, t],
        ),
        a(
          function () {
            return (
              l(c) && u({ inst: c }),
              e(function () {
                l(c) && u({ inst: c });
              })
            );
          },
          [e],
        ),
        s(n),
        n
      );
    }
    function l(e) {
      var t = e.getSnapshot;
      e = e.value;
      try {
        var n = t();
        return !r(e, n);
      } catch {
        return !0;
      }
    }
    function u(e, t) {
      return t();
    }
    var f =
      typeof window > `u` ||
      window.document === void 0 ||
      window.document.createElement === void 0
        ? u
        : c;
    e.useSyncExternalStore =
      t.useSyncExternalStore === void 0 ? f : t.useSyncExternalStore;
  }),
  xa = o((e, t) => {
    t.exports = ba();
  }),
  Sa = xa(),
  Ca = {
    t: (e, t) => {
      if (oa(t)) return t;
      if (sa(t) && oa(t.defaultValue)) return t.defaultValue;
      if (typeof e == `function`) return ``;
      if (Array.isArray(e)) {
        let t = e[e.length - 1];
        return typeof t == `function` ? `` : t;
      }
      return e;
    },
    ready: !1,
  },
  wa = () => () => {},
  Ta = (e, t = {}) => {
    let { i18n: n } = t,
      { i18n: r, defaultNS: i } = (0, m.useContext)(va) || {},
      a = n || r || ga();
    (a && !a.reportNamespaces && (a.reportNamespaces = new ya()),
      a ||
        ta(
          a,
          `NO_I18NEXT_INSTANCE`,
          `useTranslation: You will need to pass in an i18next instance by using initReactI18next`,
        ));
    let o = (0, m.useMemo)(
        () => ({ ...pa(), ...a?.options?.react, ...t }),
        [a, t],
      ),
      { useSuspense: s, keyPrefix: c } = o,
      l = e || i || a?.options?.defaultNS,
      u = oa(l) ? [l] : l || [`translation`],
      d = (0, m.useMemo)(() => u, u);
    a?.reportNamespaces?.addUsedNamespaces?.(d);
    let f = (0, m.useRef)(0),
      p = (0, m.useCallback)(
        (e) => {
          if (!a) return wa;
          let { bindI18n: t, bindI18nStore: n } = o,
            r = () => {
              ((f.current += 1), e());
            };
          return (
            t && a.on(t, r),
            n && a.store.on(n, r),
            () => {
              (t && t.split(` `).forEach((e) => a.off(e, r)),
                n && n.split(` `).forEach((e) => a.store.off(e, r)));
            }
          );
        },
        [a, o],
      ),
      h = (0, m.useRef)(),
      g = (0, m.useCallback)(() => {
        if (!a) return Ca;
        let e =
            !!(a.isInitialized || a.initializedStoreOnce) &&
            d.every((e) => aa(e, a, o)),
          n = t.lng || a.language,
          r = f.current,
          i = h.current;
        if (
          i &&
          i.ready === e &&
          i.lng === n &&
          i.keyPrefix === c &&
          i.revision === r
        )
          return i;
        let s = {
          t: a.getFixedT(n, o.nsMode === `fallback` ? d : d[0], c, {
            scopeNs: d,
          }),
          ready: e,
          lng: n,
          keyPrefix: c,
          revision: r,
        };
        return ((h.current = s), s);
      }, [a, d, c, o, t.lng]),
      [_, v] = (0, m.useState)(0),
      { t: y, ready: b } = (0, Sa.useSyncExternalStore)(p, g, g);
    (0, m.useEffect)(() => {
      if (a && !b && !s) {
        let e = () => v((e) => e + 1);
        t.lng ? ia(a, t.lng, d, e) : ra(a, d, e);
      }
    }, [a, t.lng, d, b, s, _]);
    let x = a || {},
      S = (0, m.useRef)(null),
      C = (0, m.useRef)(),
      w = (e) => {
        let t = Object.getOwnPropertyDescriptors(e);
        t.__original && delete t.__original;
        let n = Object.create(Object.getPrototypeOf(e), t);
        if (!Object.prototype.hasOwnProperty.call(n, `__original`))
          try {
            Object.defineProperty(n, "__original", {
              value: e,
              writable: !1,
              enumerable: !1,
              configurable: !1,
            });
          } catch {}
        return n;
      },
      T = (0, m.useMemo)(() => {
        let e = x,
          t = e?.language,
          n = e;
        e &&
          (S.current && S.current.__original === e && C.current === t
            ? (n = S.current)
            : ((n = w(e)), (S.current = n), (C.current = t)));
        let r =
            !b && !s
              ? (...e) => (
                  ta(
                    a,
                    `USE_T_BEFORE_READY`,
                    `useTranslation: t was called before ready. When using useSuspense: false, make sure to check the ready flag before using t.`,
                  ),
                  y(...e)
                )
              : y,
          i = [r, n, b];
        return ((i.t = r), (i.i18n = n), (i.ready = b), i);
      }, [y, x, b, x.resolvedLanguage, x.language, x.languages]);
    if (a && s && !b)
      throw new Promise((e) => {
        let n = () => e();
        t.lng ? ia(a, t.lng, d, n) : ra(a, d, n);
      });
    return T;
  };
function Ea(e, t) {
  return function () {
    return e.apply(t, arguments);
  };
}
var { toString: Da } = Object.prototype,
  { getPrototypeOf: Oa } = Object,
  { iterator: ka, toStringTag: Aa } = Symbol,
  ja = ((e) => (t) => {
    let n = Da.call(t);
    return e[n] || (e[n] = n.slice(8, -1).toLowerCase());
  })(Object.create(null)),
  Ma = (e) => ((e = e.toLowerCase()), (t) => ja(t) === e),
  Na = (e) => (t) => typeof t === e,
  { isArray: Pa } = Array,
  Fa = Na(`undefined`);
function Ia(e) {
  return (
    e !== null &&
    !Fa(e) &&
    e.constructor !== null &&
    !Fa(e.constructor) &&
    Ba(e.constructor.isBuffer) &&
    e.constructor.isBuffer(e)
  );
}
var La = Ma(`ArrayBuffer`);
function Ra(e) {
  let t;
  return (
    (t =
      typeof ArrayBuffer < `u` && ArrayBuffer.isView
        ? ArrayBuffer.isView(e)
        : e && e.buffer && La(e.buffer)),
    t
  );
}
var za = Na(`string`),
  Ba = Na(`function`),
  Va = Na(`number`),
  Ha = (e) => typeof e == `object` && !!e,
  Ua = (e) => e === !0 || e === !1,
  Wa = (e) => {
    if (ja(e) !== `object`) return !1;
    let t = Oa(e);
    return (
      (t === null ||
        t === Object.prototype ||
        Object.getPrototypeOf(t) === null) &&
      !(Aa in e) &&
      !(ka in e)
    );
  },
  Ga = (e) => {
    if (!Ha(e) || Ia(e)) return !1;
    try {
      return (
        Object.keys(e).length === 0 &&
        Object.getPrototypeOf(e) === Object.prototype
      );
    } catch {
      return !1;
    }
  },
  Ka = Ma(`Date`),
  qa = Ma(`File`),
  Ja = (e) => !!(e && e.uri !== void 0),
  Ya = (e) => e && e.getParts !== void 0,
  Xa = Ma(`Blob`),
  Za = Ma(`FileList`),
  Qa = (e) => Ha(e) && Ba(e.pipe);
function $a() {
  return typeof globalThis < `u`
    ? globalThis
    : typeof self < `u`
      ? self
      : typeof window < `u`
        ? window
        : typeof global < `u`
          ? global
          : {};
}
var eo = $a(),
  to = eo.FormData === void 0 ? void 0 : eo.FormData,
  no = (e) => {
    if (!e) return !1;
    if (to && e instanceof to) return !0;
    let t = Oa(e);
    if (!t || t === Object.prototype || !Ba(e.append)) return !1;
    let n = ja(e);
    return (
      n === `formdata` ||
      (n === `object` && Ba(e.toString) && e.toString() === `[object FormData]`)
    );
  },
  ro = Ma(`URLSearchParams`),
  [io, ao, oo, so] = [`ReadableStream`, `Request`, `Response`, `Headers`].map(
    Ma,
  ),
  co = (e) =>
    e.trim ? e.trim() : e.replace(/^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g, ``);
function lo(e, t, { allOwnKeys: n = !1 } = {}) {
  if (e == null) return;
  let r, i;
  if ((typeof e != `object` && (e = [e]), Pa(e)))
    for (r = 0, i = e.length; r < i; r++) t.call(null, e[r], r, e);
  else {
    if (Ia(e)) return;
    let i = n ? Object.getOwnPropertyNames(e) : Object.keys(e),
      a = i.length,
      o;
    for (r = 0; r < a; r++) ((o = i[r]), t.call(null, e[o], o, e));
  }
}
function uo(e, t) {
  if (Ia(e)) return null;
  t = t.toLowerCase();
  let n = Object.keys(e),
    r = n.length,
    i;
  for (; r-- > 0; ) if (((i = n[r]), t === i.toLowerCase())) return i;
  return null;
}
var fo =
    typeof globalThis < `u`
      ? globalThis
      : typeof self < `u`
        ? self
        : typeof window < `u`
          ? window
          : global,
  po = (e) => !Fa(e) && e !== fo;
function mo(...e) {
  let { caseless: t, skipUndefined: n } = (po(this) && this) || {},
    r = {},
    i = (e, i) => {
      if (i === `__proto__` || i === `constructor` || i === `prototype`) return;
      let a = (t && typeof i == `string` && uo(r, i)) || i,
        o = Eo(r, a) ? r[a] : void 0;
      Wa(o) && Wa(e)
        ? (r[a] = mo(o, e))
        : Wa(e)
          ? (r[a] = mo({}, e))
          : Pa(e)
            ? (r[a] = e.slice())
            : (!n || !Fa(e)) && (r[a] = e);
    };
  for (let t = 0, n = e.length; t < n; t++) {
    let n = e[t];
    if (!n || Ia(n) || (lo(n, i), typeof n != `object` || Pa(n))) continue;
    let r = Object.getOwnPropertySymbols(n);
    for (let e = 0; e < r.length; e++) {
      let t = r[e];
      Do.call(n, t) && i(n[t], t);
    }
  }
  return r;
}
var ho = (e, t, n, { allOwnKeys: r } = {}) => (
    lo(
      t,
      (t, r) => {
        n && Ba(t)
          ? Object.defineProperty(e, r, {
              __proto__: null,
              value: Ea(t, n),
              writable: !0,
              enumerable: !0,
              configurable: !0,
            })
          : Object.defineProperty(e, r, {
              __proto__: null,
              value: t,
              writable: !0,
              enumerable: !0,
              configurable: !0,
            });
      },
      { allOwnKeys: r },
    ),
    e
  ),
  go = (e) => (e.charCodeAt(0) === 65279 && (e = e.slice(1)), e),
  _o = (e, t, n, r) => {
    ((e.prototype = Object.create(t.prototype, r)),
      Object.defineProperty(e.prototype, "constructor", {
        __proto__: null,
        value: e,
        writable: !0,
        enumerable: !1,
        configurable: !0,
      }),
      Object.defineProperty(e, "super", {
        __proto__: null,
        value: t.prototype,
      }),
      n && Object.assign(e.prototype, n));
  },
  vo = (e, t, n, r) => {
    let i,
      a,
      o,
      s = {};
    if (((t ||= {}), e == null)) return t;
    do {
      for (i = Object.getOwnPropertyNames(e), a = i.length; a-- > 0; )
        ((o = i[a]),
          (!r || r(o, e, t)) && !s[o] && ((t[o] = e[o]), (s[o] = !0)));
      e = n !== !1 && Oa(e);
    } while (e && (!n || n(e, t)) && e !== Object.prototype);
    return t;
  },
  yo = (e, t, n) => {
    ((e = String(e)),
      (n === void 0 || n > e.length) && (n = e.length),
      (n -= t.length));
    let r = e.indexOf(t, n);
    return r !== -1 && r === n;
  },
  bo = (e) => {
    if (!e) return null;
    if (Pa(e)) return e;
    let t = e.length;
    if (!Va(t)) return null;
    let n = Array(t);
    for (; t-- > 0; ) n[t] = e[t];
    return n;
  },
  xo = (
    (e) => (t) =>
      e && t instanceof e
  )(typeof Uint8Array < `u` && Oa(Uint8Array)),
  So = (e, t) => {
    let n = (e && e[ka]).call(e),
      r;
    for (; (r = n.next()) && !r.done; ) {
      let n = r.value;
      t.call(e, n[0], n[1]);
    }
  },
  Co = (e, t) => {
    let n,
      r = [];
    for (; (n = e.exec(t)) !== null; ) r.push(n);
    return r;
  },
  wo = Ma(`HTMLFormElement`),
  To = (e) =>
    e.toLowerCase().replace(/[-_\s]([a-z\d])(\w*)/g, function (e, t, n) {
      return t.toUpperCase() + n;
    }),
  Eo = (
    ({ hasOwnProperty: e }) =>
    (t, n) =>
      e.call(t, n)
  )(Object.prototype),
  { propertyIsEnumerable: Do } = Object.prototype,
  Oo = Ma(`RegExp`),
  ko = (e, t) => {
    let n = Object.getOwnPropertyDescriptors(e),
      r = {};
    (lo(n, (n, i) => {
      let a;
      (a = t(n, i, e)) !== !1 && (r[i] = a || n);
    }),
      Object.defineProperties(e, r));
  },
  Ao = (e) => {
    ko(e, (t, n) => {
      if (Ba(e) && [`arguments`, `caller`, `callee`].includes(n)) return !1;
      let r = e[n];
      if (Ba(r)) {
        if (((t.enumerable = !1), `writable` in t)) {
          t.writable = !1;
          return;
        }
        t.set ||= () => {
          throw Error(`Can not rewrite read-only method '` + n + `'`);
        };
      }
    });
  },
  jo = (e, t) => {
    let n = {},
      r = (e) => {
        e.forEach((e) => {
          n[e] = !0;
        });
      };
    return (Pa(e) ? r(e) : r(String(e).split(t)), n);
  },
  Mo = () => {},
  No = (e, t) => (e != null && Number.isFinite((e = +e)) ? e : t);
function Po(e) {
  return !!(e && Ba(e.append) && e[Aa] === `FormData` && e[ka]);
}
var Fo = (e) => {
    let t = new WeakSet(),
      n = (e) => {
        if (Ha(e)) {
          if (t.has(e)) return;
          if (Ia(e)) return e;
          if (!(`toJSON` in e)) {
            t.add(e);
            let r = Pa(e) ? [] : {};
            return (
              lo(e, (e, t) => {
                let i = n(e);
                !Fa(i) && (r[t] = i);
              }),
              t.delete(e),
              r
            );
          }
        }
        return e;
      };
    return n(e);
  },
  Io = Ma(`AsyncFunction`),
  Lo = (e) => e && (Ha(e) || Ba(e)) && Ba(e.then) && Ba(e.catch),
  Ro = ((e, t) =>
    e
      ? setImmediate
      : t
        ? ((e, t) => (
            fo.addEventListener(
              `message`,
              ({ source: n, data: r }) => {
                n === fo && r === e && t.length && t.shift()();
              },
              !1,
            ),
            (n) => {
              (t.push(n), fo.postMessage(e, `*`));
            }
          ))(`axios@${Math.random()}`, [])
        : (e) => setTimeout(e))(
    typeof setImmediate == `function`,
    Ba(fo.postMessage),
  ),
  H = {
    isArray: Pa,
    isArrayBuffer: La,
    isBuffer: Ia,
    isFormData: no,
    isArrayBufferView: Ra,
    isString: za,
    isNumber: Va,
    isBoolean: Ua,
    isObject: Ha,
    isPlainObject: Wa,
    isEmptyObject: Ga,
    isReadableStream: io,
    isRequest: ao,
    isResponse: oo,
    isHeaders: so,
    isUndefined: Fa,
    isDate: Ka,
    isFile: qa,
    isReactNativeBlob: Ja,
    isReactNative: Ya,
    isBlob: Xa,
    isRegExp: Oo,
    isFunction: Ba,
    isStream: Qa,
    isURLSearchParams: ro,
    isTypedArray: xo,
    isFileList: Za,
    forEach: lo,
    merge: mo,
    extend: ho,
    trim: co,
    stripBOM: go,
    inherits: _o,
    toFlatObject: vo,
    kindOf: ja,
    kindOfTest: Ma,
    endsWith: yo,
    toArray: bo,
    forEachEntry: So,
    matchAll: Co,
    isHTMLForm: wo,
    hasOwnProperty: Eo,
    hasOwnProp: Eo,
    reduceDescriptors: ko,
    freezeMethods: Ao,
    toObjectSet: jo,
    toCamelCase: To,
    noop: Mo,
    toFiniteNumber: No,
    findKey: uo,
    global: fo,
    isContextDefined: po,
    isSpecCompliantForm: Po,
    toJSONObject: Fo,
    isAsyncFn: Io,
    isThenable: Lo,
    setImmediate: Ro,
    asap:
      typeof queueMicrotask < `u`
        ? queueMicrotask.bind(fo)
        : (typeof process < `u` && process.nextTick) || Ro,
    isIterable: (e) => e != null && Ba(e[ka]),
  },
  zo = H.toObjectSet([
    `age`,
    `authorization`,
    `content-length`,
    `content-type`,
    `etag`,
    `expires`,
    `from`,
    `host`,
    `if-modified-since`,
    `if-unmodified-since`,
    `last-modified`,
    `location`,
    `max-forwards`,
    `proxy-authorization`,
    `referer`,
    `retry-after`,
    `user-agent`,
  ]),
  Bo = (e) => {
    let t = {},
      n,
      r,
      i;
    return (
      e &&
        e
          .split(
            `
`,
          )
          .forEach(function (e) {
            ((i = e.indexOf(`:`)),
              (n = e.substring(0, i).trim().toLowerCase()),
              (r = e.substring(i + 1).trim()),
              !(!n || (t[n] && zo[n])) &&
                (n === `set-cookie`
                  ? t[n]
                    ? t[n].push(r)
                    : (t[n] = [r])
                  : (t[n] = t[n] ? t[n] + `, ` + r : r)));
          }),
      t
    );
  };
function Vo(e) {
  let t = 0,
    n = e.length;
  for (; t < n; ) {
    let n = e.charCodeAt(t);
    if (n !== 9 && n !== 32) break;
    t += 1;
  }
  for (; n > t; ) {
    let t = e.charCodeAt(n - 1);
    if (t !== 9 && t !== 32) break;
    --n;
  }
  return t === 0 && n === e.length ? e : e.slice(t, n);
}
var Ho = RegExp(`[\\u0000-\\u0008\\u000a-\\u001f\\u007f]+`, `g`),
  Uo = RegExp(`[^\\u0009\\u0020-\\u007e\\u0080-\\u00ff]+`, `g`);
function Wo(e, t) {
  return H.isArray(e) ? e.map((e) => Wo(e, t)) : Vo(String(e).replace(t, ``));
}
var Go = (e) => Wo(e, Ho),
  Ko = (e) => Wo(e, Uo);
function qo(e) {
  let t = Object.create(null);
  return (
    H.forEach(e.toJSON(), (e, n) => {
      t[n] = Ko(e);
    }),
    t
  );
}
var Jo = Symbol(`internals`);
function Yo(e) {
  return e && String(e).trim().toLowerCase();
}
function Xo(e) {
  return e === !1 || e == null ? e : H.isArray(e) ? e.map(Xo) : Go(String(e));
}
function Zo(e) {
  let t = Object.create(null),
    n = /([^\s,;=]+)\s*(?:=\s*([^,;]+))?/g,
    r;
  for (; (r = n.exec(e)); ) t[r[1]] = r[2];
  return t;
}
var Qo = (e) => /^[-_a-zA-Z0-9^`|~,!#$%&'*+.]+$/.test(e.trim());
function $o(e, t, n, r, i) {
  if (H.isFunction(r)) return r.call(this, t, n);
  if ((i && (t = n), H.isString(t))) {
    if (H.isString(r)) return t.indexOf(r) !== -1;
    if (H.isRegExp(r)) return r.test(t);
  }
}
function es(e) {
  return e
    .trim()
    .toLowerCase()
    .replace(/([a-z\d])(\w*)/g, (e, t, n) => t.toUpperCase() + n);
}
function ts(e, t) {
  let n = H.toCamelCase(` ` + t);
  [`get`, `set`, `has`].forEach((r) => {
    Object.defineProperty(e, r + n, {
      __proto__: null,
      value: function (e, n, i) {
        return this[r].call(this, t, e, n, i);
      },
      configurable: !0,
    });
  });
}
var ns = class {
  constructor(e) {
    e && this.set(e);
  }
  set(e, t, n) {
    let r = this;
    function i(e, t, n) {
      let i = Yo(t);
      if (!i) return;
      let a = H.findKey(r, i);
      (!a || r[a] === void 0 || n === !0 || (n === void 0 && r[a] !== !1)) &&
        (r[a || t] = Xo(e));
    }
    let a = (e, t) => H.forEach(e, (e, n) => i(e, n, t));
    if (H.isPlainObject(e) || e instanceof this.constructor) a(e, t);
    else if (H.isString(e) && (e = e.trim()) && !Qo(e)) a(Bo(e), t);
    else if (H.isObject(e) && H.isIterable(e)) {
      let n = {},
        r,
        i;
      for (let t of e) {
        if (!H.isArray(t))
          throw TypeError(`Object iterator must return a key-value pair`);
        n[(i = t[0])] = (r = n[i])
          ? H.isArray(r)
            ? [...r, t[1]]
            : [r, t[1]]
          : t[1];
      }
      a(n, t);
    } else e != null && i(t, e, n);
    return this;
  }
  get(e, t) {
    if (((e = Yo(e)), e)) {
      let n = H.findKey(this, e);
      if (n) {
        let e = this[n];
        if (!t) return e;
        if (t === !0) return Zo(e);
        if (H.isFunction(t)) return t.call(this, e, n);
        if (H.isRegExp(t)) return t.exec(e);
        throw TypeError(`parser must be boolean|regexp|function`);
      }
    }
  }
  has(e, t) {
    if (((e = Yo(e)), e)) {
      let n = H.findKey(this, e);
      return !!(n && this[n] !== void 0 && (!t || $o(this, this[n], n, t)));
    }
    return !1;
  }
  delete(e, t) {
    let n = this,
      r = !1;
    function i(e) {
      if (((e = Yo(e)), e)) {
        let i = H.findKey(n, e);
        i && (!t || $o(n, n[i], i, t)) && (delete n[i], (r = !0));
      }
    }
    return (H.isArray(e) ? e.forEach(i) : i(e), r);
  }
  clear(e) {
    let t = Object.keys(this),
      n = t.length,
      r = !1;
    for (; n--; ) {
      let i = t[n];
      (!e || $o(this, this[i], i, e, !0)) && (delete this[i], (r = !0));
    }
    return r;
  }
  normalize(e) {
    let t = this,
      n = {};
    return (
      H.forEach(this, (r, i) => {
        let a = H.findKey(n, i);
        if (a) {
          ((t[a] = Xo(r)), delete t[i]);
          return;
        }
        let o = e ? es(i) : String(i).trim();
        (o !== i && delete t[i], (t[o] = Xo(r)), (n[o] = !0));
      }),
      this
    );
  }
  concat(...e) {
    return this.constructor.concat(this, ...e);
  }
  toJSON(e) {
    let t = Object.create(null);
    return (
      H.forEach(this, (n, r) => {
        n != null && n !== !1 && (t[r] = e && H.isArray(n) ? n.join(`, `) : n);
      }),
      t
    );
  }
  [Symbol.iterator]() {
    return Object.entries(this.toJSON())[Symbol.iterator]();
  }
  toString() {
    return Object.entries(this.toJSON()).map(([e, t]) => e + `: ` + t).join(`
`);
  }
  getSetCookie() {
    return this.get(`set-cookie`) || [];
  }
  get [Symbol.toStringTag]() {
    return `AxiosHeaders`;
  }
  static from(e) {
    return e instanceof this ? e : new this(e);
  }
  static concat(e, ...t) {
    let n = new this(e);
    return (t.forEach((e) => n.set(e)), n);
  }
  static accessor(e) {
    let t = (this[Jo] = this[Jo] = { accessors: {} }).accessors,
      n = this.prototype;
    function r(e) {
      let r = Yo(e);
      t[r] || (ts(n, e), (t[r] = !0));
    }
    return (H.isArray(e) ? e.forEach(r) : r(e), this);
  }
};
(ns.accessor([
  `Content-Type`,
  `Content-Length`,
  `Accept`,
  `Accept-Encoding`,
  `User-Agent`,
  `Authorization`,
]),
  H.reduceDescriptors(ns.prototype, ({ value: e }, t) => {
    let n = t[0].toUpperCase() + t.slice(1);
    return {
      get: () => e,
      set(e) {
        this[n] = e;
      },
    };
  }),
  H.freezeMethods(ns));
var rs = `[REDACTED ****]`;
function is(e) {
  if (H.hasOwnProp(e, `toJSON`)) return !0;
  let t = Object.getPrototypeOf(e);
  for (; t && t !== Object.prototype; ) {
    if (H.hasOwnProp(t, `toJSON`)) return !0;
    t = Object.getPrototypeOf(t);
  }
  return !1;
}
function as(e, t) {
  let n = new Set(t.map((e) => String(e).toLowerCase())),
    r = [],
    i = (e) => {
      if (typeof e != `object` || !e || H.isBuffer(e)) return e;
      if (r.indexOf(e) !== -1) return;
      (e instanceof ns && (e = e.toJSON()), r.push(e));
      let t;
      if (H.isArray(e))
        ((t = []),
          e.forEach((e, n) => {
            let r = i(e);
            H.isUndefined(r) || (t[n] = r);
          }));
      else {
        if (!H.isPlainObject(e) && is(e)) return (r.pop(), e);
        t = Object.create(null);
        for (let [r, a] of Object.entries(e)) {
          let e = n.has(r.toLowerCase()) ? rs : i(a);
          H.isUndefined(e) || (t[r] = e);
        }
      }
      return (r.pop(), t);
    };
  return i(e);
}
var U = class e extends Error {
  static from(t, n, r, i, a, o) {
    let s = new e(t.message, n || t.code, r, i, a);
    return (
      (s.cause = t),
      (s.name = t.name),
      t.status != null && s.status == null && (s.status = t.status),
      o && Object.assign(s, o),
      s
    );
  }
  constructor(e, t, n, r, i) {
    (super(e),
      Object.defineProperty(this, "message", {
        __proto__: null,
        value: e,
        enumerable: !0,
        writable: !0,
        configurable: !0,
      }),
      (this.name = `AxiosError`),
      (this.isAxiosError = !0),
      t && (this.code = t),
      n && (this.config = n),
      r && (this.request = r),
      i && ((this.response = i), (this.status = i.status)));
  }
  toJSON() {
    let e = this.config,
      t = e && H.hasOwnProp(e, `redact`) ? e.redact : void 0,
      n = H.isArray(t) && t.length > 0 ? as(e, t) : H.toJSONObject(e);
    return {
      message: this.message,
      name: this.name,
      description: this.description,
      number: this.number,
      fileName: this.fileName,
      lineNumber: this.lineNumber,
      columnNumber: this.columnNumber,
      stack: this.stack,
      config: n,
      code: this.code,
      status: this.status,
    };
  }
};
((U.ERR_BAD_OPTION_VALUE = `ERR_BAD_OPTION_VALUE`),
  (U.ERR_BAD_OPTION = `ERR_BAD_OPTION`),
  (U.ECONNABORTED = `ECONNABORTED`),
  (U.ETIMEDOUT = `ETIMEDOUT`),
  (U.ECONNREFUSED = `ECONNREFUSED`),
  (U.ERR_NETWORK = `ERR_NETWORK`),
  (U.ERR_FR_TOO_MANY_REDIRECTS = `ERR_FR_TOO_MANY_REDIRECTS`),
  (U.ERR_DEPRECATED = `ERR_DEPRECATED`),
  (U.ERR_BAD_RESPONSE = `ERR_BAD_RESPONSE`),
  (U.ERR_BAD_REQUEST = `ERR_BAD_REQUEST`),
  (U.ERR_CANCELED = `ERR_CANCELED`),
  (U.ERR_NOT_SUPPORT = `ERR_NOT_SUPPORT`),
  (U.ERR_INVALID_URL = `ERR_INVALID_URL`),
  (U.ERR_FORM_DATA_DEPTH_EXCEEDED = `ERR_FORM_DATA_DEPTH_EXCEEDED`));
function os(e) {
  return H.isPlainObject(e) || H.isArray(e);
}
function ss(e) {
  return H.endsWith(e, `[]`) ? e.slice(0, -2) : e;
}
function cs(e, t, n) {
  return e
    ? e
        .concat(t)
        .map(function (e, t) {
          return ((e = ss(e)), !n && t ? `[` + e + `]` : e);
        })
        .join(n ? `.` : ``)
    : t;
}
function ls(e) {
  return H.isArray(e) && !e.some(os);
}
var us = H.toFlatObject(H, {}, null, function (e) {
  return /^is[A-Z]/.test(e);
});
function ds(e, t, n) {
  if (!H.isObject(e)) throw TypeError(`target must be an object`);
  ((t ||= new FormData()),
    (n = H.toFlatObject(
      n,
      { metaTokens: !0, dots: !1, indexes: !1 },
      !1,
      function (e, t) {
        return !H.isUndefined(t[e]);
      },
    )));
  let r = n.metaTokens,
    i = n.visitor || d,
    a = n.dots,
    o = n.indexes,
    s = n.Blob || (typeof Blob < `u` && Blob),
    c = n.maxDepth === void 0 ? 100 : n.maxDepth,
    l = s && H.isSpecCompliantForm(t);
  if (!H.isFunction(i)) throw TypeError(`visitor must be a function`);
  function u(e) {
    if (e === null) return ``;
    if (H.isDate(e)) return e.toISOString();
    if (H.isBoolean(e)) return e.toString();
    if (!l && H.isBlob(e))
      throw new U(`Blob is not supported. Use a Buffer instead.`);
    return H.isArrayBuffer(e) || H.isTypedArray(e)
      ? l && typeof Blob == `function`
        ? new Blob([e])
        : Buffer.from(e)
      : e;
  }
  function d(e, n, i) {
    let s = e;
    if (H.isReactNative(t) && H.isReactNativeBlob(e))
      return (t.append(cs(i, n, a), u(e)), !1);
    if (e && !i && typeof e == `object`) {
      if (H.endsWith(n, `{}`))
        ((n = r ? n : n.slice(0, -2)), (e = JSON.stringify(e)));
      else if (
        (H.isArray(e) && ls(e)) ||
        ((H.isFileList(e) || H.endsWith(n, `[]`)) && (s = H.toArray(e)))
      )
        return (
          (n = ss(n)),
          s.forEach(function (e, r) {
            !(H.isUndefined(e) || e === null) &&
              t.append(
                o === !0 ? cs([n], r, a) : o === null ? n : n + `[]`,
                u(e),
              );
          }),
          !1
        );
    }
    return os(e) ? !0 : (t.append(cs(i, n, a), u(e)), !1);
  }
  let f = [],
    p = Object.assign(us, {
      defaultVisitor: d,
      convertValue: u,
      isVisitable: os,
    });
  function m(e, n, r = 0) {
    if (!H.isUndefined(e)) {
      if (r > c)
        throw new U(
          `Object is too deeply nested (` + r + ` levels). Max depth: ` + c,
          U.ERR_FORM_DATA_DEPTH_EXCEEDED,
        );
      if (f.indexOf(e) !== -1)
        throw Error(`Circular reference detected in ` + n.join(`.`));
      (f.push(e),
        H.forEach(e, function (e, a) {
          (!(H.isUndefined(e) || e === null) &&
            i.call(t, e, H.isString(a) ? a.trim() : a, n, p)) === !0 &&
            m(e, n ? n.concat(a) : [a], r + 1);
        }),
        f.pop());
    }
  }
  if (!H.isObject(e)) throw TypeError(`data must be an object`);
  return (m(e), t);
}
function fs(e) {
  let t = {
    "!": `%21`,
    "'": `%27`,
    "(": `%28`,
    ")": `%29`,
    "~": `%7E`,
    "%20": `+`,
  };
  return encodeURIComponent(e).replace(/[!'()~]|%20/g, function (e) {
    return t[e];
  });
}
function ps(e, t) {
  ((this._pairs = []), e && ds(e, this, t));
}
var ms = ps.prototype;
((ms.append = function (e, t) {
  this._pairs.push([e, t]);
}),
  (ms.toString = function (e) {
    let t = e
      ? function (t) {
          return e.call(this, t, fs);
        }
      : fs;
    return this._pairs
      .map(function (e) {
        return t(e[0]) + `=` + t(e[1]);
      }, ``)
      .join(`&`);
  }));
function hs(e) {
  return encodeURIComponent(e)
    .replace(/%3A/gi, `:`)
    .replace(/%24/g, `$`)
    .replace(/%2C/gi, `,`)
    .replace(/%20/g, `+`);
}
function gs(e, t, n) {
  if (!t) return e;
  let r = (n && n.encode) || hs,
    i = H.isFunction(n) ? { serialize: n } : n,
    a = i && i.serialize,
    o;
  if (
    ((o = a
      ? a(t, i)
      : H.isURLSearchParams(t)
        ? t.toString()
        : new ps(t, i).toString(r)),
    o)
  ) {
    let t = e.indexOf(`#`);
    (t !== -1 && (e = e.slice(0, t)),
      (e += (e.indexOf(`?`) === -1 ? `?` : `&`) + o));
  }
  return e;
}
var _s = class {
    constructor() {
      this.handlers = [];
    }
    use(e, t, n) {
      return (
        this.handlers.push({
          fulfilled: e,
          rejected: t,
          synchronous: n ? n.synchronous : !1,
          runWhen: n ? n.runWhen : null,
        }),
        this.handlers.length - 1
      );
    }
    eject(e) {
      this.handlers[e] && (this.handlers[e] = null);
    }
    clear() {
      this.handlers &&= [];
    }
    forEach(e) {
      H.forEach(this.handlers, function (t) {
        t !== null && e(t);
      });
    }
  },
  vs = {
    silentJSONParsing: !0,
    forcedJSONParsing: !0,
    clarifyTimeoutError: !1,
    legacyInterceptorReqResOrdering: !0,
    advertiseZstdAcceptEncoding: !1,
  },
  ys = {
    isBrowser: !0,
    classes: {
      URLSearchParams: typeof URLSearchParams < `u` ? URLSearchParams : ps,
      FormData: typeof FormData < `u` ? FormData : null,
      Blob: typeof Blob < `u` ? Blob : null,
    },
    protocols: [`http`, `https`, `file`, `blob`, `url`, `data`],
  },
  bs = s({
    hasBrowserEnv: () => xs,
    hasStandardBrowserEnv: () => Cs,
    hasStandardBrowserWebWorkerEnv: () => ws,
    navigator: () => Ss,
    origin: () => Ts,
  }),
  xs = typeof window < `u` && typeof document < `u`,
  Ss = (typeof navigator == `object` && navigator) || void 0,
  Cs =
    xs &&
    (!Ss || [`ReactNative`, `NativeScript`, `NS`].indexOf(Ss.product) < 0),
  ws =
    typeof WorkerGlobalScope < `u` &&
    self instanceof WorkerGlobalScope &&
    typeof self.importScripts == `function`,
  Ts = (xs && window.location.href) || `http://localhost`,
  Es = { ...bs, ...ys };
function Ds(e, t) {
  return ds(e, new Es.classes.URLSearchParams(), {
    visitor: function (e, t, n, r) {
      return Es.isNode && H.isBuffer(e)
        ? (this.append(t, e.toString(`base64`)), !1)
        : r.defaultVisitor.apply(this, arguments);
    },
    ...t,
  });
}
function Os(e) {
  return H.matchAll(/\w+|\[(\w*)]/g, e).map((e) =>
    e[0] === `[]` ? `` : e[1] || e[0],
  );
}
function ks(e) {
  let t = {},
    n = Object.keys(e),
    r,
    i = n.length,
    a;
  for (r = 0; r < i; r++) ((a = n[r]), (t[a] = e[a]));
  return t;
}
function As(e) {
  function t(e, n, r, i) {
    let a = e[i++];
    if (a === `__proto__`) return !0;
    let o = Number.isFinite(+a),
      s = i >= e.length;
    return (
      (a = !a && H.isArray(r) ? r.length : a),
      s
        ? (H.hasOwnProp(r, a)
            ? (r[a] = H.isArray(r[a]) ? r[a].concat(n) : [r[a], n])
            : (r[a] = n),
          !o)
        : ((!H.hasOwnProp(r, a) || !H.isObject(r[a])) && (r[a] = []),
          t(e, n, r[a], i) && H.isArray(r[a]) && (r[a] = ks(r[a])),
          !o)
    );
  }
  if (H.isFormData(e) && H.isFunction(e.entries)) {
    let n = {};
    return (
      H.forEachEntry(e, (e, r) => {
        t(Os(e), r, n, 0);
      }),
      n
    );
  }
  return null;
}
var js = (e, t) => (e != null && H.hasOwnProp(e, t) ? e[t] : void 0);
function Ms(e, t, n) {
  if (H.isString(e))
    try {
      return ((t || JSON.parse)(e), H.trim(e));
    } catch (e) {
      if (e.name !== `SyntaxError`) throw e;
    }
  return (n || JSON.stringify)(e);
}
var Ns = {
  transitional: vs,
  adapter: [`xhr`, `http`, `fetch`],
  transformRequest: [
    function (e, t) {
      let n = t.getContentType() || ``,
        r = n.indexOf(`application/json`) > -1,
        i = H.isObject(e);
      if ((i && H.isHTMLForm(e) && (e = new FormData(e)), H.isFormData(e)))
        return r ? JSON.stringify(As(e)) : e;
      if (
        H.isArrayBuffer(e) ||
        H.isBuffer(e) ||
        H.isStream(e) ||
        H.isFile(e) ||
        H.isBlob(e) ||
        H.isReadableStream(e)
      )
        return e;
      if (H.isArrayBufferView(e)) return e.buffer;
      if (H.isURLSearchParams(e))
        return (
          t.setContentType(
            `application/x-www-form-urlencoded;charset=utf-8`,
            !1,
          ),
          e.toString()
        );
      let a;
      if (i) {
        let t = js(this, `formSerializer`);
        if (n.indexOf(`application/x-www-form-urlencoded`) > -1)
          return Ds(e, t).toString();
        if ((a = H.isFileList(e)) || n.indexOf(`multipart/form-data`) > -1) {
          let n = js(this, `env`),
            r = n && n.FormData;
          return ds(a ? { "files[]": e } : e, r && new r(), t);
        }
      }
      return i || r ? (t.setContentType(`application/json`, !1), Ms(e)) : e;
    },
  ],
  transformResponse: [
    function (e) {
      let t = js(this, `transitional`) || Ns.transitional,
        n = t && t.forcedJSONParsing,
        r = js(this, `responseType`),
        i = r === `json`;
      if (H.isResponse(e) || H.isReadableStream(e)) return e;
      if (e && H.isString(e) && ((n && !r) || i)) {
        let n = !(t && t.silentJSONParsing) && i;
        try {
          return JSON.parse(e, js(this, `parseReviver`));
        } catch (e) {
          if (n)
            throw e.name === `SyntaxError`
              ? U.from(e, U.ERR_BAD_RESPONSE, this, null, js(this, `response`))
              : e;
        }
      }
      return e;
    },
  ],
  timeout: 0,
  xsrfCookieName: `XSRF-TOKEN`,
  xsrfHeaderName: `X-XSRF-TOKEN`,
  maxContentLength: -1,
  maxBodyLength: -1,
  env: { FormData: Es.classes.FormData, Blob: Es.classes.Blob },
  validateStatus: function (e) {
    return e >= 200 && e < 300;
  },
  headers: {
    common: {
      Accept: `application/json, text/plain, */*`,
      "Content-Type": void 0,
    },
  },
};
H.forEach([`delete`, `get`, `head`, `post`, `put`, `patch`, `query`], (e) => {
  Ns.headers[e] = {};
});
function Ps(e, t) {
  let n = this || Ns,
    r = t || n,
    i = ns.from(r.headers),
    a = r.data;
  return (
    H.forEach(e, function (e) {
      a = e.call(n, a, i.normalize(), t ? t.status : void 0);
    }),
    i.normalize(),
    a
  );
}
function Fs(e) {
  return !!(e && e.__CANCEL__);
}
var Is = class extends U {
  constructor(e, t, n) {
    (super(e ?? `canceled`, U.ERR_CANCELED, t, n),
      (this.name = `CanceledError`),
      (this.__CANCEL__ = !0));
  }
};
function Ls(e, t, n) {
  let r = n.config.validateStatus;
  !n.status || !r || r(n.status)
    ? e(n)
    : t(
        new U(
          `Request failed with status code ` + n.status,
          n.status >= 400 && n.status < 500
            ? U.ERR_BAD_REQUEST
            : U.ERR_BAD_RESPONSE,
          n.config,
          n.request,
          n,
        ),
      );
}
function Rs(e) {
  let t = /^([-+\w]{1,25}):(?:\/\/)?/.exec(e);
  return (t && t[1]) || ``;
}
function zs(e, t) {
  e ||= 10;
  let n = Array(e),
    r = Array(e),
    i = 0,
    a = 0,
    o;
  return (
    (t = t === void 0 ? 1e3 : t),
    function (s) {
      let c = Date.now(),
        l = r[a];
      ((o ||= c), (n[i] = s), (r[i] = c));
      let u = a,
        d = 0;
      for (; u !== i; ) ((d += n[u++]), (u %= e));
      if (((i = (i + 1) % e), i === a && (a = (a + 1) % e), c - o < t)) return;
      let f = l && c - l;
      return f ? Math.round((d * 1e3) / f) : void 0;
    }
  );
}
function Bs(e, t) {
  let n = 0,
    r = 1e3 / t,
    i,
    a,
    o = (t, r = Date.now()) => {
      ((n = r), (i = null), (a &&= (clearTimeout(a), null)), e(...t));
    };
  return [
    (...e) => {
      let t = Date.now(),
        s = t - n;
      s >= r
        ? o(e, t)
        : ((i = e),
          (a ||= setTimeout(() => {
            ((a = null), o(i));
          }, r - s)));
    },
    () => i && o(i),
  ];
}
var Vs = (e, t, n = 3) => {
    let r = 0,
      i = zs(50, 250);
    return Bs((n) => {
      if (!n || typeof n.loaded != `number`) return;
      let a = n.loaded,
        o = n.lengthComputable ? n.total : void 0,
        s = o == null ? a : Math.min(a, o),
        c = Math.max(0, s - r),
        l = i(c);
      ((r = Math.max(r, s)),
        e({
          loaded: s,
          total: o,
          progress: o ? s / o : void 0,
          bytes: c,
          rate: l || void 0,
          estimated: l && o ? (o - s) / l : void 0,
          event: n,
          lengthComputable: o != null,
          [t ? `download` : `upload`]: !0,
        }));
    }, n);
  },
  Hs = (e, t) => {
    let n = e != null;
    return [(r) => t[0]({ lengthComputable: n, total: e, loaded: r }), t[1]];
  },
  Us =
    (e) =>
    (...t) =>
      H.asap(() => e(...t)),
  Ws = Es.hasStandardBrowserEnv
    ? ((e, t) => (n) => (
        (n = new URL(n, Es.origin)),
        e.protocol === n.protocol &&
          e.host === n.host &&
          (t || e.port === n.port)
      ))(
        new URL(Es.origin),
        Es.navigator && /(msie|trident)/i.test(Es.navigator.userAgent),
      )
    : () => !0,
  Gs = Es.hasStandardBrowserEnv
    ? {
        write(e, t, n, r, i, a, o) {
          if (typeof document > `u`) return;
          let s = [`${e}=${encodeURIComponent(t)}`];
          (H.isNumber(n) && s.push(`expires=${new Date(n).toUTCString()}`),
            H.isString(r) && s.push(`path=${r}`),
            H.isString(i) && s.push(`domain=${i}`),
            a === !0 && s.push(`secure`),
            H.isString(o) && s.push(`SameSite=${o}`),
            (document.cookie = s.join(`; `)));
        },
        read(e) {
          if (typeof document > `u`) return null;
          let t = document.cookie.split(`;`);
          for (let n = 0; n < t.length; n++) {
            let r = t[n].replace(/^\s+/, ``),
              i = r.indexOf(`=`);
            if (i !== -1 && r.slice(0, i) === e)
              return decodeURIComponent(r.slice(i + 1));
          }
          return null;
        },
        remove(e) {
          this.write(e, ``, Date.now() - 864e5, `/`);
        },
      }
    : {
        write() {},
        read() {
          return null;
        },
        remove() {},
      };
function Ks(e) {
  return typeof e == `string` ? /^([a-z][a-z\d+\-.]*:)?\/\//i.test(e) : !1;
}
function qs(e, t) {
  return t ? e.replace(/\/?\/$/, ``) + `/` + t.replace(/^\/+/, ``) : e;
}
function Js(e, t, n) {
  let r = !Ks(t);
  return e && (r || n === !1) ? qs(e, t) : t;
}
var Ys = (e) => (e instanceof ns ? { ...e } : e);
function Xs(e, t) {
  t ||= {};
  let n = Object.create(null);
  Object.defineProperty(n, "hasOwnProperty", {
    __proto__: null,
    value: Object.prototype.hasOwnProperty,
    enumerable: !1,
    writable: !0,
    configurable: !0,
  });
  function r(e, t, n, r) {
    return H.isPlainObject(e) && H.isPlainObject(t)
      ? H.merge.call({ caseless: r }, e, t)
      : H.isPlainObject(t)
        ? H.merge({}, t)
        : H.isArray(t)
          ? t.slice()
          : t;
  }
  function i(e, t, n, i) {
    if (!H.isUndefined(t)) return r(e, t, n, i);
    if (!H.isUndefined(e)) return r(void 0, e, n, i);
  }
  function a(e, t) {
    if (!H.isUndefined(t)) return r(void 0, t);
  }
  function o(e, t) {
    if (!H.isUndefined(t)) return r(void 0, t);
    if (!H.isUndefined(e)) return r(void 0, e);
  }
  function s(n, i, a) {
    if (H.hasOwnProp(t, a)) return r(n, i);
    if (H.hasOwnProp(e, a)) return r(void 0, n);
  }
  let c = {
    url: a,
    method: a,
    data: a,
    baseURL: o,
    transformRequest: o,
    transformResponse: o,
    paramsSerializer: o,
    timeout: o,
    timeoutMessage: o,
    withCredentials: o,
    withXSRFToken: o,
    adapter: o,
    responseType: o,
    xsrfCookieName: o,
    xsrfHeaderName: o,
    onUploadProgress: o,
    onDownloadProgress: o,
    decompress: o,
    maxContentLength: o,
    maxBodyLength: o,
    beforeRedirect: o,
    transport: o,
    httpAgent: o,
    httpsAgent: o,
    cancelToken: o,
    socketPath: o,
    allowedSocketPaths: o,
    responseEncoding: o,
    validateStatus: s,
    headers: (e, t, n) => i(Ys(e), Ys(t), n, !0),
  };
  return (
    H.forEach(Object.keys({ ...e, ...t }), function (r) {
      if (r === `__proto__` || r === `constructor` || r === `prototype`) return;
      let a = H.hasOwnProp(c, r) ? c[r] : i,
        o = a(
          H.hasOwnProp(e, r) ? e[r] : void 0,
          H.hasOwnProp(t, r) ? t[r] : void 0,
          r,
        );
      (H.isUndefined(o) && a !== s) || (n[r] = o);
    }),
    n
  );
}
var Zs = [`content-type`, `content-length`];
function Qs(e, t, n) {
  if (n !== `content-only`) {
    e.set(t);
    return;
  }
  Object.entries(t).forEach(([t, n]) => {
    Zs.includes(t.toLowerCase()) && e.set(t, n);
  });
}
var $s = (e) =>
  encodeURIComponent(e).replace(/%([0-9A-F]{2})/gi, (e, t) =>
    String.fromCharCode(parseInt(t, 16)),
  );
function ec(e) {
  let t = Xs({}, e),
    n = (e) => (H.hasOwnProp(t, e) ? t[e] : void 0),
    r = n(`data`),
    i = n(`withXSRFToken`),
    a = n(`xsrfHeaderName`),
    o = n(`xsrfCookieName`),
    s = n(`headers`),
    c = n(`auth`),
    l = n(`baseURL`),
    u = n(`allowAbsoluteUrls`),
    d = n(`url`);
  if (
    ((t.headers = s = ns.from(s)),
    (t.url = gs(Js(l, d, u), n(`params`), n(`paramsSerializer`))),
    c &&
      s.set(
        `Authorization`,
        `Basic ` +
          btoa((c.username || ``) + `:` + (c.password ? $s(c.password) : ``)),
      ),
    H.isFormData(r) &&
      (Es.hasStandardBrowserEnv ||
      Es.hasStandardBrowserWebWorkerEnv ||
      H.isReactNative(r)
        ? s.setContentType(void 0)
        : H.isFunction(r.getHeaders) &&
          Qs(s, r.getHeaders(), n(`formDataHeaderPolicy`))),
    Es.hasStandardBrowserEnv &&
      (H.isFunction(i) && (i = i(t)), i === !0 || (i == null && Ws(t.url))))
  ) {
    let e = a && o && Gs.read(o);
    e && s.set(a, e);
  }
  return t;
}
var tc =
    typeof XMLHttpRequest < `u` &&
    function (e) {
      return new Promise(function (t, n) {
        let r = ec(e),
          i = r.data,
          a = ns.from(r.headers).normalize(),
          { responseType: o, onUploadProgress: s, onDownloadProgress: c } = r,
          l,
          u,
          d,
          f,
          p;
        function m() {
          (f && f(),
            p && p(),
            r.cancelToken && r.cancelToken.unsubscribe(l),
            r.signal && r.signal.removeEventListener(`abort`, l));
        }
        let h = new XMLHttpRequest();
        (h.open(r.method.toUpperCase(), r.url, !0), (h.timeout = r.timeout));
        function g() {
          if (!h) return;
          let r = ns.from(
            `getAllResponseHeaders` in h && h.getAllResponseHeaders(),
          );
          (Ls(
            function (e) {
              (t(e), m());
            },
            function (e) {
              (n(e), m());
            },
            {
              data:
                !o || o === `text` || o === `json`
                  ? h.responseText
                  : h.response,
              status: h.status,
              statusText: h.statusText,
              headers: r,
              config: e,
              request: h,
            },
          ),
            (h = null));
        }
        (`onloadend` in h
          ? (h.onloadend = g)
          : (h.onreadystatechange = function () {
              !h ||
                h.readyState !== 4 ||
                (h.status === 0 &&
                  !(h.responseURL && h.responseURL.startsWith(`file:`))) ||
                setTimeout(g);
            }),
          (h.onabort = function () {
            h &&=
              (n(new U(`Request aborted`, U.ECONNABORTED, e, h)), m(), null);
          }),
          (h.onerror = function (t) {
            let r = new U(
              t && t.message ? t.message : `Network Error`,
              U.ERR_NETWORK,
              e,
              h,
            );
            ((r.event = t || null), n(r), m(), (h = null));
          }),
          (h.ontimeout = function () {
            let t = r.timeout
                ? `timeout of ` + r.timeout + `ms exceeded`
                : `timeout exceeded`,
              i = r.transitional || vs;
            (r.timeoutErrorMessage && (t = r.timeoutErrorMessage),
              n(
                new U(
                  t,
                  i.clarifyTimeoutError ? U.ETIMEDOUT : U.ECONNABORTED,
                  e,
                  h,
                ),
              ),
              m(),
              (h = null));
          }),
          i === void 0 && a.setContentType(null),
          `setRequestHeader` in h &&
            H.forEach(qo(a), function (e, t) {
              h.setRequestHeader(t, e);
            }),
          H.isUndefined(r.withCredentials) ||
            (h.withCredentials = !!r.withCredentials),
          o && o !== `json` && (h.responseType = r.responseType),
          c && (([d, p] = Vs(c, !0)), h.addEventListener(`progress`, d)),
          s &&
            h.upload &&
            (([u, f] = Vs(s)),
            h.upload.addEventListener(`progress`, u),
            h.upload.addEventListener(`loadend`, f)),
          (r.cancelToken || r.signal) &&
            ((l = (t) => {
              h &&=
                (n(!t || t.type ? new Is(null, e, h) : t),
                h.abort(),
                m(),
                null);
            }),
            r.cancelToken && r.cancelToken.subscribe(l),
            r.signal &&
              (r.signal.aborted
                ? l()
                : r.signal.addEventListener(`abort`, l))));
        let _ = Rs(r.url);
        if (_ && !Es.protocols.includes(_)) {
          n(new U(`Unsupported protocol ` + _ + `:`, U.ERR_BAD_REQUEST, e));
          return;
        }
        h.send(i || null);
      });
    },
  nc = (e, t) => {
    if (((e = e ? e.filter(Boolean) : []), !t && !e.length)) return;
    let n = new AbortController(),
      r = !1,
      i = function (e) {
        if (!r) {
          ((r = !0), o());
          let t = e instanceof Error ? e : this.reason;
          n.abort(
            t instanceof U ? t : new Is(t instanceof Error ? t.message : t),
          );
        }
      },
      a =
        t &&
        setTimeout(() => {
          ((a = null), i(new U(`timeout of ${t}ms exceeded`, U.ETIMEDOUT)));
        }, t),
      o = () => {
        e &&=
          (a && clearTimeout(a),
          (a = null),
          e.forEach((e) => {
            e.unsubscribe
              ? e.unsubscribe(i)
              : e.removeEventListener(`abort`, i);
          }),
          null);
      };
    e.forEach((e) => e.addEventListener(`abort`, i));
    let { signal: s } = n;
    return ((s.unsubscribe = () => H.asap(o)), s);
  },
  rc = function* (e, t) {
    let n = e.byteLength;
    if (!t || n < t) {
      yield e;
      return;
    }
    let r = 0,
      i;
    for (; r < n; ) ((i = r + t), yield e.slice(r, i), (r = i));
  },
  ic = async function* (e, t) {
    for await (let n of ac(e)) yield* rc(n, t);
  },
  ac = async function* (e) {
    if (e[Symbol.asyncIterator]) {
      yield* e;
      return;
    }
    let t = e.getReader();
    try {
      for (;;) {
        let { done: e, value: n } = await t.read();
        if (e) break;
        yield n;
      }
    } finally {
      await t.cancel();
    }
  },
  oc = (e, t, n, r) => {
    let i = ic(e, t),
      a = 0,
      o,
      s = (e) => {
        o || ((o = !0), r && r(e));
      };
    return new ReadableStream(
      {
        async pull(e) {
          try {
            let { done: t, value: r } = await i.next();
            if (t) {
              (s(), e.close());
              return;
            }
            let o = r.byteLength;
            (n && n((a += o)), e.enqueue(new Uint8Array(r)));
          } catch (e) {
            throw (s(e), e);
          }
        },
        cancel(e) {
          return (s(e), i.return());
        },
      },
      { highWaterMark: 2 },
    );
  };
function sc(e) {
  if (!e || typeof e != `string` || !e.startsWith(`data:`)) return 0;
  let t = e.indexOf(`,`);
  if (t < 0) return 0;
  let n = e.slice(5, t),
    r = e.slice(t + 1);
  if (/;base64/i.test(n)) {
    let e = r.length,
      t = r.length;
    for (let n = 0; n < t; n++)
      if (r.charCodeAt(n) === 37 && n + 2 < t) {
        let t = r.charCodeAt(n + 1),
          i = r.charCodeAt(n + 2);
        ((t >= 48 && t <= 57) ||
          (t >= 65 && t <= 70) ||
          (t >= 97 && t <= 102)) &&
          ((i >= 48 && i <= 57) ||
            (i >= 65 && i <= 70) ||
            (i >= 97 && i <= 102)) &&
          ((e -= 2), (n += 2));
      }
    let n = 0,
      i = t - 1,
      a = (e) =>
        e >= 2 &&
        r.charCodeAt(e - 2) === 37 &&
        r.charCodeAt(e - 1) === 51 &&
        (r.charCodeAt(e) === 68 || r.charCodeAt(e) === 100);
    (i >= 0 && (r.charCodeAt(i) === 61 ? (n++, i--) : a(i) && (n++, (i -= 3))),
      n === 1 && i >= 0 && (r.charCodeAt(i) === 61 || a(i)) && n++);
    let o = Math.floor(e / 4) * 3 - (n || 0);
    return o > 0 ? o : 0;
  }
  if (typeof Buffer < `u` && typeof Buffer.byteLength == `function`)
    return Buffer.byteLength(r, `utf8`);
  let i = 0;
  for (let e = 0, t = r.length; e < t; e++) {
    let n = r.charCodeAt(e);
    if (n < 128) i += 1;
    else if (n < 2048) i += 2;
    else if (n >= 55296 && n <= 56319 && e + 1 < t) {
      let t = r.charCodeAt(e + 1);
      t >= 56320 && t <= 57343 ? ((i += 4), e++) : (i += 3);
    } else i += 3;
  }
  return i;
}
var cc = `1.17.0`,
  lc = 64 * 1024,
  { isFunction: uc } = H,
  dc = (e) =>
    encodeURIComponent(e).replace(/%([0-9A-F]{2})/gi, (e, t) =>
      String.fromCharCode(parseInt(t, 16)),
    ),
  fc = (e) => {
    if (!H.isString(e)) return e;
    try {
      return decodeURIComponent(e);
    } catch {
      return e;
    }
  },
  pc = (e, ...t) => {
    try {
      return !!e(...t);
    } catch {
      return !1;
    }
  },
  mc = (e) => {
    let t = e.indexOf(`://`),
      n = e;
    return (
      t !== -1 && (n = n.slice(t + 3)),
      n.includes(`@`) || n.includes(`:`)
    );
  },
  hc = (e) => {
    let t = H.global !== void 0 && H.global !== null ? H.global : globalThis,
      { ReadableStream: n, TextEncoder: r } = t;
    e = H.merge.call(
      { skipUndefined: !0 },
      { Request: t.Request, Response: t.Response },
      e,
    );
    let { fetch: i, Request: a, Response: o } = e,
      s = i ? uc(i) : typeof fetch == `function`,
      c = uc(a),
      l = uc(o);
    if (!s) return !1;
    let u = s && uc(n),
      d =
        s &&
        (typeof r == `function`
          ? (
              (e) => (t) =>
                e.encode(t)
            )(new r())
          : async (e) => new Uint8Array(await new a(e).arrayBuffer())),
      f =
        c &&
        u &&
        pc(() => {
          let e = !1,
            t = new a(Es.origin, {
              body: new n(),
              method: `POST`,
              get duplex() {
                return ((e = !0), `half`);
              },
            }),
            r = t.headers.has(`Content-Type`);
          return (t.body != null && t.body.cancel(), e && !r);
        }),
      p = l && u && pc(() => H.isReadableStream(new o(``).body)),
      m = { stream: p && ((e) => e.body) };
    s &&
      [`text`, `arrayBuffer`, `blob`, `formData`, `stream`].forEach((e) => {
        !m[e] &&
          (m[e] = (t, n) => {
            let r = t && t[e];
            if (r) return r.call(t);
            throw new U(
              `Response type '${e}' is not supported`,
              U.ERR_NOT_SUPPORT,
              n,
            );
          });
      });
    let h = async (e) => {
        if (e == null) return 0;
        if (H.isBlob(e)) return e.size;
        if (H.isSpecCompliantForm(e))
          return (
            await new a(Es.origin, { method: `POST`, body: e }).arrayBuffer()
          ).byteLength;
        if (H.isArrayBufferView(e) || H.isArrayBuffer(e)) return e.byteLength;
        if ((H.isURLSearchParams(e) && (e += ``), H.isString(e)))
          return (await d(e)).byteLength;
      },
      g = async (e, t) => H.toFiniteNumber(e.getContentLength()) ?? h(t);
    return async (e) => {
      let {
          url: t,
          method: n,
          data: s,
          signal: l,
          cancelToken: u,
          timeout: d,
          onDownloadProgress: h,
          onUploadProgress: _,
          responseType: v,
          headers: y,
          withCredentials: b = `same-origin`,
          fetchOptions: x,
          maxContentLength: S,
          maxBodyLength: C,
        } = ec(e),
        w = H.isNumber(S) && S > -1,
        T = H.isNumber(C) && C > -1,
        E = (t) => (H.hasOwnProp(e, t) ? e[t] : void 0),
        D = i || fetch;
      v = v ? (v + ``).toLowerCase() : `text`;
      let O = nc([l, u && u.toAbortSignal()], d),
        k = null,
        A =
          O &&
          O.unsubscribe &&
          (() => {
            O.unsubscribe();
          }),
        j;
      try {
        let i,
          l = E(`auth`);
        if (
          (l &&
            (i = { username: l.username || ``, password: l.password || `` }),
          mc(t))
        ) {
          let e = new URL(t, Es.origin);
          (!i &&
            (e.username || e.password) &&
            (i = { username: fc(e.username), password: fc(e.password) }),
            (e.username || e.password) &&
              ((e.username = ``), (e.password = ``), (t = e.href)));
        }
        if (
          (i &&
            (y.delete(`authorization`),
            y.set(
              `Authorization`,
              `Basic ` +
                btoa(dc((i.username || ``) + `:` + (i.password || ``))),
            )),
          w && typeof t == `string` && t.startsWith(`data:`) && sc(t) > S)
        )
          throw new U(
            `maxContentLength size of ` + S + ` exceeded`,
            U.ERR_BAD_RESPONSE,
            e,
            k,
          );
        if (T && n !== `get` && n !== `head`) {
          let t = await g(y, s);
          if (typeof t == `number` && isFinite(t) && t > C)
            throw new U(
              `Request body larger than maxBodyLength limit`,
              U.ERR_BAD_REQUEST,
              e,
              k,
            );
        }
        if (
          _ &&
          f &&
          n !== `get` &&
          n !== `head` &&
          (j = await g(y, s)) !== 0
        ) {
          let e = new a(t, { method: `POST`, body: s, duplex: `half` }),
            n;
          if (
            (H.isFormData(s) &&
              (n = e.headers.get(`content-type`)) &&
              y.setContentType(n),
            e.body)
          ) {
            let [t, n] = Hs(j, Vs(Us(_)));
            s = oc(e.body, lc, t, n);
          }
        }
        H.isString(b) || (b = b ? `include` : `omit`);
        let u = c && `credentials` in a.prototype;
        if (H.isFormData(s)) {
          let e = y.getContentType();
          e &&
            /^multipart\/form-data/i.test(e) &&
            !/boundary=/i.test(e) &&
            y.delete(`content-type`);
        }
        y.set(`User-Agent`, `axios/` + cc, !1);
        let d = {
          ...x,
          signal: O,
          method: n.toUpperCase(),
          headers: qo(y.normalize()),
          body: s,
          duplex: `half`,
          credentials: u ? b : void 0,
        };
        k = c && new a(t, d);
        let M = await (c ? D(k, x) : D(t, d));
        if (w) {
          let t = H.toFiniteNumber(M.headers.get(`content-length`));
          if (t != null && t > S)
            throw new U(
              `maxContentLength size of ` + S + ` exceeded`,
              U.ERR_BAD_RESPONSE,
              e,
              k,
            );
        }
        let N = p && (v === `stream` || v === `response`);
        if (p && M.body && (h || w || (N && A))) {
          let t = {};
          [`status`, `statusText`, `headers`].forEach((e) => {
            t[e] = M[e];
          });
          let n = H.toFiniteNumber(M.headers.get(`content-length`)),
            [r, i] = (h && Hs(n, Vs(Us(h), !0))) || [],
            a = 0;
          M = new o(
            oc(
              M.body,
              lc,
              (t) => {
                if (w && ((a = t), a > S))
                  throw new U(
                    `maxContentLength size of ` + S + ` exceeded`,
                    U.ERR_BAD_RESPONSE,
                    e,
                    k,
                  );
                r && r(t);
              },
              () => {
                (i && i(), A && A());
              },
            ),
            t,
          );
        }
        v ||= `text`;
        let P = await m[H.findKey(m, v) || `text`](M, e);
        if (w && !p && !N) {
          let t;
          if (
            (P != null &&
              (typeof P.byteLength == `number`
                ? (t = P.byteLength)
                : typeof P.size == `number`
                  ? (t = P.size)
                  : typeof P == `string` &&
                    (t =
                      typeof r == `function`
                        ? new r().encode(P).byteLength
                        : P.length)),
            typeof t == `number` && t > S)
          )
            throw new U(
              `maxContentLength size of ` + S + ` exceeded`,
              U.ERR_BAD_RESPONSE,
              e,
              k,
            );
        }
        return (
          !N && A && A(),
          await new Promise((t, n) => {
            Ls(t, n, {
              data: P,
              headers: ns.from(M.headers),
              status: M.status,
              statusText: M.statusText,
              config: e,
              request: k,
            });
          })
        );
      } catch (t) {
        if ((A && A(), O && O.aborted && O.reason instanceof U)) {
          let n = O.reason;
          throw (
            (n.config = e),
            k && (n.request = k),
            t !== n && (n.cause = t),
            n
          );
        }
        throw t &&
          t.name === `TypeError` &&
          /Load failed|fetch/i.test(t.message)
          ? Object.assign(
              new U(`Network Error`, U.ERR_NETWORK, e, k, t && t.response),
              { cause: t.cause || t },
            )
          : U.from(t, t && t.code, e, k, t && t.response);
      }
    };
  },
  gc = new Map(),
  _c = (e) => {
    let t = (e && e.env) || {},
      { fetch: n, Request: r, Response: i } = t,
      a = [r, i, n],
      o = a.length,
      s,
      c,
      l = gc;
    for (; o--; )
      ((s = a[o]),
        (c = l.get(s)),
        c === void 0 && l.set(s, (c = o ? new Map() : hc(t))),
        (l = c));
    return c;
  };
_c();
var vc = { http: null, xhr: tc, fetch: { get: _c } };
H.forEach(vc, (e, t) => {
  if (e) {
    try {
      Object.defineProperty(e, "name", { __proto__: null, value: t });
    } catch {}
    Object.defineProperty(e, "adapterName", { __proto__: null, value: t });
  }
});
var yc = (e) => `- ${e}`,
  bc = (e) => H.isFunction(e) || e === null || e === !1;
function xc(e, t) {
  e = H.isArray(e) ? e : [e];
  let { length: n } = e,
    r,
    i,
    a = {};
  for (let o = 0; o < n; o++) {
    r = e[o];
    let n;
    if (
      ((i = r),
      !bc(r) && ((i = vc[(n = String(r)).toLowerCase()]), i === void 0))
    )
      throw new U(`Unknown adapter '${n}'`);
    if (i && (H.isFunction(i) || (i = i.get(t)))) break;
    a[n || `#` + o] = i;
  }
  if (!i) {
    let e = Object.entries(a).map(
      ([e, t]) =>
        `adapter ${e} ` +
        (t === !1
          ? `is not supported by the environment`
          : `is not available in the build`),
    );
    throw new U(
      `There is no suitable adapter to dispatch the request ` +
        (n
          ? e.length > 1
            ? `since :
` +
              e.map(yc).join(`
`)
            : ` ` + yc(e[0])
          : `as no adapter specified`),
      `ERR_NOT_SUPPORT`,
    );
  }
  return i;
}
var Sc = { getAdapter: xc, adapters: vc };
function Cc(e) {
  if (
    (e.cancelToken && e.cancelToken.throwIfRequested(),
    e.signal && e.signal.aborted)
  )
    throw new Is(null, e);
}
function wc(e) {
  return (
    Cc(e),
    (e.headers = ns.from(e.headers)),
    (e.data = Ps.call(e, e.transformRequest)),
    [`post`, `put`, `patch`].indexOf(e.method) !== -1 &&
      e.headers.setContentType(`application/x-www-form-urlencoded`, !1),
    Sc.getAdapter(
      e.adapter || Ns.adapter,
      e,
    )(e).then(
      function (t) {
        (Cc(e), (e.response = t));
        try {
          t.data = Ps.call(e, e.transformResponse, t);
        } finally {
          delete e.response;
        }
        return ((t.headers = ns.from(t.headers)), t);
      },
      function (t) {
        if (!Fs(t) && (Cc(e), t && t.response)) {
          e.response = t.response;
          try {
            t.response.data = Ps.call(e, e.transformResponse, t.response);
          } finally {
            delete e.response;
          }
          t.response.headers = ns.from(t.response.headers);
        }
        return Promise.reject(t);
      },
    )
  );
}
var Tc = {};
[`object`, `boolean`, `number`, `function`, `string`, `symbol`].forEach(
  (e, t) => {
    Tc[e] = function (n) {
      return typeof n === e || `a` + (t < 1 ? `n ` : ` `) + e;
    };
  },
);
var Ec = {};
((Tc.transitional = function (e, t, n) {
  function r(e, t) {
    return (
      `[Axios v` +
      cc +
      `] Transitional option '` +
      e +
      `'` +
      t +
      (n ? `. ` + n : ``)
    );
  }
  return (n, i, a) => {
    if (e === !1)
      throw new U(
        r(i, ` has been removed` + (t ? ` in ` + t : ``)),
        U.ERR_DEPRECATED,
      );
    return (
      t &&
        !Ec[i] &&
        ((Ec[i] = !0),
        console.warn(
          r(
            i,
            ` has been deprecated since v` +
              t +
              ` and will be removed in the near future`,
          ),
        )),
      e ? e(n, i, a) : !0
    );
  };
}),
  (Tc.spelling = function (e) {
    return (t, n) => (console.warn(`${n} is likely a misspelling of ${e}`), !0);
  }));
function Dc(e, t, n) {
  if (typeof e != `object`)
    throw new U(`options must be an object`, U.ERR_BAD_OPTION_VALUE);
  let r = Object.keys(e),
    i = r.length;
  for (; i-- > 0; ) {
    let a = r[i],
      o = Object.prototype.hasOwnProperty.call(t, a) ? t[a] : void 0;
    if (o) {
      let t = e[a],
        n = t === void 0 || o(t, a, e);
      if (n !== !0)
        throw new U(`option ` + a + ` must be ` + n, U.ERR_BAD_OPTION_VALUE);
      continue;
    }
    if (n !== !0) throw new U(`Unknown option ` + a, U.ERR_BAD_OPTION);
  }
}
var Oc = { assertOptions: Dc, validators: Tc },
  kc = Oc.validators,
  Ac = class {
    constructor(e) {
      ((this.defaults = e || {}),
        (this.interceptors = { request: new _s(), response: new _s() }));
    }
    async request(e, t) {
      try {
        return await this._request(e, t);
      } catch (e) {
        if (e instanceof Error) {
          let t = {};
          Error.captureStackTrace ? Error.captureStackTrace(t) : (t = Error());
          let n = (() => {
            if (!t.stack) return ``;
            let e = t.stack.indexOf(`
`);
            return e === -1 ? `` : t.stack.slice(e + 1);
          })();
          try {
            if (!e.stack) e.stack = n;
            else if (n) {
              let t = n.indexOf(`
`),
                r =
                  t === -1
                    ? -1
                    : n.indexOf(
                        `
`,
                        t + 1,
                      ),
                i = r === -1 ? `` : n.slice(r + 1);
              String(e.stack).endsWith(i) ||
                (e.stack +=
                  `
` + n);
            }
          } catch {}
        }
        throw e;
      }
    }
    _request(e, t) {
      (typeof e == `string` ? ((t ||= {}), (t.url = e)) : (t = e || {}),
        (t = Xs(this.defaults, t)));
      let { transitional: n, paramsSerializer: r, headers: i } = t;
      (n !== void 0 &&
        Oc.assertOptions(
          n,
          {
            silentJSONParsing: kc.transitional(kc.boolean),
            forcedJSONParsing: kc.transitional(kc.boolean),
            clarifyTimeoutError: kc.transitional(kc.boolean),
            legacyInterceptorReqResOrdering: kc.transitional(kc.boolean),
            advertiseZstdAcceptEncoding: kc.transitional(kc.boolean),
          },
          !1,
        ),
        r != null &&
          (H.isFunction(r)
            ? (t.paramsSerializer = { serialize: r })
            : Oc.assertOptions(
                r,
                { encode: kc.function, serialize: kc.function },
                !0,
              )),
        t.allowAbsoluteUrls !== void 0 ||
          (this.defaults.allowAbsoluteUrls === void 0
            ? (t.allowAbsoluteUrls = !0)
            : (t.allowAbsoluteUrls = this.defaults.allowAbsoluteUrls)),
        Oc.assertOptions(
          t,
          {
            baseUrl: kc.spelling(`baseURL`),
            withXsrfToken: kc.spelling(`withXSRFToken`),
          },
          !0,
        ),
        (t.method = (t.method || this.defaults.method || `get`).toLowerCase()));
      let a = i && H.merge(i.common, i[t.method]);
      (i &&
        H.forEach(
          [`delete`, `get`, `head`, `post`, `put`, `patch`, `query`, `common`],
          (e) => {
            delete i[e];
          },
        ),
        (t.headers = ns.concat(a, i)));
      let o = [],
        s = !0;
      this.interceptors.request.forEach(function (e) {
        if (typeof e.runWhen == `function` && e.runWhen(t) === !1) return;
        s &&= e.synchronous;
        let n = t.transitional || vs;
        n && n.legacyInterceptorReqResOrdering
          ? o.unshift(e.fulfilled, e.rejected)
          : o.push(e.fulfilled, e.rejected);
      });
      let c = [];
      this.interceptors.response.forEach(function (e) {
        c.push(e.fulfilled, e.rejected);
      });
      let l,
        u = 0,
        d;
      if (!s) {
        let e = [wc.bind(this), void 0];
        for (
          e.unshift(...o), e.push(...c), d = e.length, l = Promise.resolve(t);
          u < d;
        )
          l = l.then(e[u++], e[u++]);
        return l;
      }
      d = o.length;
      let f = t;
      for (; u < d; ) {
        let e = o[u++],
          t = o[u++];
        try {
          f = e(f);
        } catch (e) {
          t.call(this, e);
          break;
        }
      }
      try {
        l = wc.call(this, f);
      } catch (e) {
        return Promise.reject(e);
      }
      for (u = 0, d = c.length; u < d; ) l = l.then(c[u++], c[u++]);
      return l;
    }
    getUri(e) {
      return (
        (e = Xs(this.defaults, e)),
        gs(
          Js(e.baseURL, e.url, e.allowAbsoluteUrls),
          e.params,
          e.paramsSerializer,
        )
      );
    }
  };
(H.forEach([`delete`, `get`, `head`, `options`], function (e) {
  Ac.prototype[e] = function (t, n) {
    return this.request(
      Xs(n || {}, { method: e, url: t, data: (n || {}).data }),
    );
  };
}),
  H.forEach([`post`, `put`, `patch`, `query`], function (e) {
    function t(t) {
      return function (n, r, i) {
        return this.request(
          Xs(i || {}, {
            method: e,
            headers: t ? { "Content-Type": `multipart/form-data` } : {},
            url: n,
            data: r,
          }),
        );
      };
    }
    ((Ac.prototype[e] = t()),
      e !== `query` && (Ac.prototype[e + `Form`] = t(!0)));
  }));
var jc = class e {
  constructor(e) {
    if (typeof e != `function`) throw TypeError(`executor must be a function.`);
    let t;
    this.promise = new Promise(function (e) {
      t = e;
    });
    let n = this;
    (this.promise.then((e) => {
      if (!n._listeners) return;
      let t = n._listeners.length;
      for (; t-- > 0; ) n._listeners[t](e);
      n._listeners = null;
    }),
      (this.promise.then = (e) => {
        let t,
          r = new Promise((e) => {
            (n.subscribe(e), (t = e));
          }).then(e);
        return (
          (r.cancel = function () {
            n.unsubscribe(t);
          }),
          r
        );
      }),
      e(function (e, r, i) {
        n.reason || ((n.reason = new Is(e, r, i)), t(n.reason));
      }));
  }
  throwIfRequested() {
    if (this.reason) throw this.reason;
  }
  subscribe(e) {
    if (this.reason) {
      e(this.reason);
      return;
    }
    this._listeners ? this._listeners.push(e) : (this._listeners = [e]);
  }
  unsubscribe(e) {
    if (!this._listeners) return;
    let t = this._listeners.indexOf(e);
    t !== -1 && this._listeners.splice(t, 1);
  }
  toAbortSignal() {
    let e = new AbortController(),
      t = (t) => {
        e.abort(t);
      };
    return (
      this.subscribe(t),
      (e.signal.unsubscribe = () => this.unsubscribe(t)),
      e.signal
    );
  }
  static source() {
    let t;
    return {
      token: new e(function (e) {
        t = e;
      }),
      cancel: t,
    };
  }
};
function Mc(e) {
  return function (t) {
    return e.apply(null, t);
  };
}
function Nc(e) {
  return H.isObject(e) && e.isAxiosError === !0;
}
var Pc = {
  Continue: 100,
  SwitchingProtocols: 101,
  Processing: 102,
  EarlyHints: 103,
  Ok: 200,
  Created: 201,
  Accepted: 202,
  NonAuthoritativeInformation: 203,
  NoContent: 204,
  ResetContent: 205,
  PartialContent: 206,
  MultiStatus: 207,
  AlreadyReported: 208,
  ImUsed: 226,
  MultipleChoices: 300,
  MovedPermanently: 301,
  Found: 302,
  SeeOther: 303,
  NotModified: 304,
  UseProxy: 305,
  Unused: 306,
  TemporaryRedirect: 307,
  PermanentRedirect: 308,
  BadRequest: 400,
  Unauthorized: 401,
  PaymentRequired: 402,
  Forbidden: 403,
  NotFound: 404,
  MethodNotAllowed: 405,
  NotAcceptable: 406,
  ProxyAuthenticationRequired: 407,
  RequestTimeout: 408,
  Conflict: 409,
  Gone: 410,
  LengthRequired: 411,
  PreconditionFailed: 412,
  PayloadTooLarge: 413,
  UriTooLong: 414,
  UnsupportedMediaType: 415,
  RangeNotSatisfiable: 416,
  ExpectationFailed: 417,
  ImATeapot: 418,
  MisdirectedRequest: 421,
  UnprocessableEntity: 422,
  Locked: 423,
  FailedDependency: 424,
  TooEarly: 425,
  UpgradeRequired: 426,
  PreconditionRequired: 428,
  TooManyRequests: 429,
  RequestHeaderFieldsTooLarge: 431,
  UnavailableForLegalReasons: 451,
  InternalServerError: 500,
  NotImplemented: 501,
  BadGateway: 502,
  ServiceUnavailable: 503,
  GatewayTimeout: 504,
  HttpVersionNotSupported: 505,
  VariantAlsoNegotiates: 506,
  InsufficientStorage: 507,
  LoopDetected: 508,
  NotExtended: 510,
  NetworkAuthenticationRequired: 511,
  WebServerIsDown: 521,
  ConnectionTimedOut: 522,
  OriginIsUnreachable: 523,
  TimeoutOccurred: 524,
  SslHandshakeFailed: 525,
  InvalidSslCertificate: 526,
};
Object.entries(Pc).forEach(([e, t]) => {
  Pc[t] = e;
});
function Fc(e) {
  let t = new Ac(e),
    n = Ea(Ac.prototype.request, t);
  return (
    H.extend(n, Ac.prototype, t, { allOwnKeys: !0 }),
    H.extend(n, t, null, { allOwnKeys: !0 }),
    (n.create = function (t) {
      return Fc(Xs(e, t));
    }),
    n
  );
}
var W = Fc(Ns);
((W.Axios = Ac),
  (W.CanceledError = Is),
  (W.CancelToken = jc),
  (W.isCancel = Fs),
  (W.VERSION = cc),
  (W.toFormData = ds),
  (W.AxiosError = U),
  (W.Cancel = W.CanceledError),
  (W.all = function (e) {
    return Promise.all(e);
  }),
  (W.spread = Mc),
  (W.isAxiosError = Nc),
  (W.mergeConfig = Xs),
  (W.AxiosHeaders = ns),
  (W.formToJSON = (e) => As(H.isHTMLForm(e) ? new FormData(e) : e)),
  (W.getAdapter = Sc.getAdapter),
  (W.HttpStatusCode = Pc),
  (W.default = W));
var Ic = l(p()),
  Lc,
  Rc = class {
    static resolveAxiosConfig(e) {
      if (e?.headers) {
        let t = Object.keys(e.headers);
        t.length &&
          (e.headers = t.reduce(
            (t, n) => ((t[n.toLowerCase()] = e.headers[n]), t),
            {},
          ));
      }
      return e;
    }
    static log(...e) {
      this._options?.logs && console.log(`Thunder SDK::`, ...e);
    }
    static async init(e) {
      ((this._options = e),
        (this._axios = W.create(e?.axiosConfig)),
        await Promise.all(
          Object.values(this.plugins).map(async (e) => {
            typeof e.init == `function` && (await e.init());
          }),
        ));
    }
    static async clean() {
      (await Promise.all(
        Object.values(this.plugins).map(async (e) => {
          typeof e.clean == `function` && (await e.clean());
        }),
      ),
        await this.clearCache(),
        delete this._options,
        delete this._axios,
        (this._useCachingMethods = new Map()),
        (this._cachingActivity = new Map()),
        (this._cacheNamespaces = this._cacheNamespacesDefault));
    }
    static checkPermission(e, t) {
      if (!this.isPermitted(e, t))
        throw Error(
          `You are not authorized to perform this action! Missing permission '${e}.${t}'!`,
        );
    }
    static resolveCacheKey(e, t) {
      return [
        ...Object.values(this._cacheNamespaces),
        t,
        ...(e instanceof Array ? e : [e]),
      ]
        .filter(Boolean)
        .join(`:`);
    }
    static async setCache(e, t) {
      if (typeof this._options?.cache?.setter != `function`)
        throw Error(`A cache setter is not defined!`);
      return await this._options.cache.setter(
        this.resolveCacheKey(e),
        JSON.stringify({ value: t, timestamp: Date.now() / 1e3 }),
      );
    }
    static async getCache(e) {
      if (typeof this._options?.cache?.getter != `function`)
        throw Error(`A cache getter is not defined!`);
      let t = await this._options.cache.getter(this.resolveCacheKey(e));
      return t ? JSON.parse(t) : null;
    }
    static async expireCache(e) {
      if (typeof this._options?.cache?.getter != `function`)
        throw Error(`A cache getter is not defined!`);
      if (typeof this._options?.cache?.setter != `function`)
        throw Error(`A cache setter is not defined!`);
      let t = await this._options.cache.getter(this.resolveCacheKey(e));
      return !t || /^{\s*"expired"/.test(t)
        ? !1
        : await this._options.cache.setter(
            this.resolveCacheKey(e),
            `{"expired": true,` + t.substring(1),
          );
    }
    static async delCache(e) {
      if (typeof this._options?.cache?.delete != `function`)
        throw Error(`A cache delete function is not defined!`);
      return await this._options.cache.delete(this.resolveCacheKey(e));
    }
    static async clearCache() {
      if (typeof this._options?.cache?.delete != `function`)
        throw Error(`A cache delete function is not defined!`);
      let e = await this.cacheKeys();
      await Promise.all(e.map((e) => this._options.cache.delete(e)));
    }
    static async cacheKeys(e) {
      if (typeof this._options?.cache?.keys != `function`)
        throw Error(`A cache keys function is not defined!`);
      return (await this._options.cache.keys()).filter((t) =>
        t.startsWith(e ?? this.resolveCacheKey(``)),
      );
    }
    static async useCache(e, t) {
      let n = t?.cacheKey ? await this.getCache(t.cacheKey) : null;
      returnCache: if (n !== null) {
        if (n.expired) break returnCache;
        if (
          t?.cacheTTL &&
          n.timestamp +
            (typeof t.cacheTTL == `function`
              ? t.cacheTTL(n.value, n.timestamp)
              : t.cacheTTL) <
            Date.now() / 1e3
        ) {
          await this.expireCache(t.cacheKey);
          break returnCache;
        }
        return n.value;
      }
      try {
        let n = await e();
        return (
          t?.cacheKey &&
            ![null, void 0].includes(n) &&
            (await this.setCache(t.cacheKey, n)),
          n
        );
      } catch (e) {
        if (n) return n.value;
        throw e;
      }
    }
    static useCaching(e, t, n, r = !1) {
      let i = this.resolveCacheKey(e),
        a = this._useCachingMethods.get(i);
      if (a && !r) return a;
      let o = () =>
          this.useCache(
            async () => {
              let e = this._cachingActivity.get(i);
              if (e)
                if (Date.now() - e.timestamp > 1e3)
                  e.controller.abort(`Repeated request!`);
                else return e.resultPromise;
              let n = new AbortController(),
                r = t({ signal: n.signal });
              this._cachingActivity.set(i, {
                controller: n,
                resultPromise: r,
                timestamp: Date.now(),
              });
              let a = await r;
              return (this._cachingActivity.delete(i), a);
            },
            { cacheKey: e, ...n },
          ),
        s = new Set(),
        c = (e) => {
          s.add(e);
        },
        l = (e) => {
          s.delete(e);
        },
        u = async (t) => {
          if (!t?.stopPropagation) {
            let t = e instanceof Array ? e[0] : e,
              n = Array.from(this._useCachingMethods.keys());
            await Promise.all(
              n.map(async (e) => {
                i !== e &&
                  RegExp(`^${this.resolveCacheKey(t)}($|:.*)`).test(e) &&
                  (await this._useCachingMethods
                    .get(e)
                    .expire({ stopPropagation: !0 }));
              }),
            );
          }
          let n = await this.expireCache(e);
          for (let e of s) e();
          return n;
        },
        d = () => this.delCache(e),
        f = new Set(),
        p = {
          key: i,
          get: o,
          expire: u,
          del: d,
          invalidate: async (t) => {
            if (!t?.stopPropagation) {
              let t = e instanceof Array ? e[0] : e,
                n = Array.from(this._useCachingMethods.keys());
              await Promise.all(
                n.map(async (e) => {
                  i !== e &&
                    RegExp(`^${this.resolveCacheKey(t)}($|:.*)`).test(e) &&
                    (await this._useCachingMethods
                      .get(e)
                      .invalidate({ stopPropagation: !0 }));
                }),
              );
            }
            await u();
            let n = await o();
            for (let e of f) e(n);
            return n;
          },
          onInvalidate: (e) => {
            f.add(e);
          },
          offInvalidate: (e) => {
            f.delete(e);
          },
          onExpire: c,
          offExpire: l,
        };
      return (this._useCachingMethods.set(i, p), p);
    }
    static async withCaching(e, t) {
      for (let [n, r] of this._useCachingMethods)
        (t && t.matcher instanceof RegExp && !t.matcher.test(n)) ||
          (await e(r, n));
    }
    static resolveAxiosResponse(e, t) {
      if (!this._axios) throw Error(`Axios not initialized!`);
      let n = {
        get raw() {
          return e();
        },
        get data() {
          let e = () =>
            new Promise((e, t) => {
              n.raw.then((t) => e(t.data)).catch((e) => t(e));
            });
          return t?.cacheKey ? Lc.useCache(e, t) : e();
        },
        then: (e, t) => n.data.then(e, t),
        catch: (e) => n.data.catch(e),
        finally: (e) => n.data.finally(e),
      };
      return n;
    }
  };
((Lc = Rc),
  Object.defineProperty(Rc, "_moduleGroup", {
    enumerable: !0,
    configurable: !0,
    writable: !0,
    value: new WeakMap(),
  }),
  Object.defineProperty(Rc, "_moduleMetadata", {
    enumerable: !0,
    configurable: !0,
    writable: !0,
    value: new WeakMap(),
  }),
  Object.defineProperty(Rc, "_useCachingMethods", {
    enumerable: !0,
    configurable: !0,
    writable: !0,
    value: new Map(),
  }),
  Object.defineProperty(Rc, "_cachingActivity", {
    enumerable: !0,
    configurable: !0,
    writable: !0,
    value: new Map(),
  }),
  Object.defineProperty(Rc, "_cacheNamespacesDefault", {
    enumerable: !0,
    configurable: !0,
    writable: !0,
    value: { __internal: `__thunder-sdk:cache` },
  }),
  Object.defineProperty(Rc, "_cacheNamespaces", {
    enumerable: !0,
    configurable: !0,
    writable: !0,
    value: Lc._cacheNamespacesDefault,
  }),
  Object.defineProperty(Rc, "plugins", {
    enumerable: !0,
    configurable: !0,
    writable: !0,
    value: {},
  }),
  Object.defineProperty(Rc, "isPermitted", {
    enumerable: !0,
    configurable: !0,
    writable: !0,
    value: (e, t) => !0,
  }));
var G = o((e) => {
    (Object.defineProperty(e, "__esModule", { value: !0 }),
      (e.PathError = e.TokenData = void 0),
      (e.compile = c));
    var t = `/`,
      n = (e) => e,
      r = /^[$_\p{ID_Start}]$/u,
      i = /^[$\u200c\u200d\p{ID_Continue}]$/u,
      a = class {
        constructor(e, t) {
          ((this.tokens = e), (this.originalPath = t));
        }
      };
    e.TokenData = a;
    var o = class extends TypeError {
      constructor(e, t) {
        let n = e;
        (t && (n += `: ${t}`),
          (n += `; visit https://git.new/pathToRegexpError for info`),
          super(n),
          (this.originalPath = t));
      }
    };
    e.PathError = o;
    function s(e, t = {}) {
      let { encodePath: s = n } = t,
        c = [...e],
        l = 0;
      function u(t) {
        let n = [],
          a = ``;
        function d() {
          a &&= (n.push({ type: `text`, value: s(a) }), ``);
        }
        for (; l < c.length; ) {
          let s = c[l++];
          if (s === t) return (d(), n);
          if (s === `\\`) {
            if (l === c.length)
              throw new o(`Unexpected end after \\ at index ${l}`, e);
            a += c[l++];
            continue;
          }
          if (s === `:` || s === `*`) {
            let t = s === `:` ? `param` : `wildcard`,
              a = ``;
            if (r.test(c[l]))
              do a += c[l++];
              while (i.test(c[l]));
            else if (c[l] === `"`) {
              let t = l;
              for (; l < c.length; ) {
                if (c[++l] === `"`) {
                  (l++, (t = 0));
                  break;
                }
                (c[l] === `\\` && l++, (a += c[l]));
              }
              if (t) throw new o(`Unterminated quote at index ${t}`, e);
            }
            if (!a) throw new o(`Missing parameter name at index ${l}`, e);
            (d(), n.push({ type: t, name: a }));
            continue;
          }
          if (s === `{`) {
            (d(), n.push({ type: `group`, tokens: u(`}`) }));
            continue;
          }
          if (
            s === `}` ||
            s === `(` ||
            s === `)` ||
            s === `[` ||
            s === `]` ||
            s === `+` ||
            s === `?` ||
            s === `!`
          )
            throw new o(`Unexpected ${s} at index ${l - 1}`, e);
          a += s;
        }
        if (t) throw new o(`Unexpected end at index ${l}, expected ${t}`, e);
        return (d(), n);
      }
      return new a(u(``), e);
    }
    function c(e, n = {}) {
      let { encode: r = encodeURIComponent, delimiter: i = t } = n,
        a = l((typeof e == `object` ? e : s(e, n)).tokens, i, r);
      return function (e = {}) {
        let t = [],
          n = a(e, t);
        if (t.length) throw TypeError(`Missing parameters: ${t.join(`, `)}`);
        return n;
      };
    }
    function l(e, t, n) {
      let r = e.map((e) => u(e, t, n));
      return (e, t) => {
        let n = ``;
        for (let i of r) n += i(e, t);
        return n;
      };
    }
    function u(e, t, r) {
      if (e.type === `text`) return () => e.value;
      if (e.type === `group`) {
        let n = l(e.tokens, t, r);
        return (e, t) => {
          let r = t.length,
            i = n(e, t);
          return t.length === r ? i : ((t.length = r), ``);
        };
      }
      let i = r || n;
      return e.type === `wildcard` && r !== !1
        ? (n, r) => {
            let a = n[e.name];
            if (a == null) return (r.push(e.name), ``);
            if (!Array.isArray(a) || a.length === 0)
              throw TypeError(`Expected "${e.name}" to be a non-empty array`);
            let o = ``;
            for (let n = 0; n < a.length; n++) {
              if (typeof a[n] != `string`)
                throw TypeError(`Expected "${e.name}/${n}" to be a string`);
              (n > 0 && (o += t), (o += i(a[n])));
            }
            return o;
          }
        : (t, n) => {
            let r = t[e.name];
            if (r == null) return (n.push(e.name), ``);
            if (typeof r != `string`)
              throw TypeError(`Expected "${e.name}" to be a string`);
            return i(r);
          };
    }
  })(),
  zc = (e) => {
    let t = {
      oauthServerMeta(t) {
        return e.resolveAxiosResponse(async () => {
          e.checkPermission(`wellKnown`, `oauthServerMeta`);
          let n = {
            method: `get`,
            url: (0, G.compile)(
              `.well-known/oauth-authorization-server{/*endpoint}`,
            )(t?.params),
            params: t?.query,
            data: t?.body,
            signal: t?.signal,
            ...(t?.axiosConfig ? e.resolveAxiosConfig(t.axiosConfig) : void 0),
          };
          return (e.log(`Sending Request:`, n), await e._axios.request(n));
        }, t);
      },
      openidConfig(t) {
        return e.resolveAxiosResponse(async () => {
          e.checkPermission(`wellKnown`, `openidConfig`);
          let n = {
            method: `get`,
            url: (0, G.compile)(`.well-known/openid-configuration{/*endpoint}`)(
              t?.params,
            ),
            params: t?.query,
            data: t?.body,
            signal: t?.signal,
            ...(t?.axiosConfig ? e.resolveAxiosConfig(t.axiosConfig) : void 0),
          };
          return (e.log(`Sending Request:`, n), await e._axios.request(n));
        }, t);
      },
    };
    return (
      (t.oauthServerMeta.__scope = `wellKnown`),
      (t.openidConfig.__scope = `wellKnown`),
      e._moduleGroup.set(t, `Default`),
      t
    );
  },
  Bc = (e) => {
    let t = {
      create(t) {
        return e.resolveAxiosResponse(async () => {
          e.checkPermission(`accessControl`, `create`);
          let n = {
            method: `post`,
            url: (0, G.compile)(`accessControl/api/`)(t?.params),
            params: t?.query,
            data: t?.body,
            signal: t?.signal,
            ...(t?.axiosConfig ? e.resolveAxiosConfig(t.axiosConfig) : void 0),
          };
          return (e.log(`Sending Request:`, n), await e._axios.request(n));
        }, t);
      },
      count(t) {
        return e.resolveAxiosResponse(async () => {
          e.checkPermission(`accessControl`, `count`);
          let n = {
            method: `get`,
            url: (0, G.compile)(`accessControl/api/count`)(t?.params),
            params: t?.query,
            data: t?.body,
            signal: t?.signal,
            ...(t?.axiosConfig ? e.resolveAxiosConfig(t.axiosConfig) : void 0),
          };
          return (e.log(`Sending Request:`, n), await e._axios.request(n));
        }, t);
      },
      get(t) {
        return e.resolveAxiosResponse(async () => {
          e.checkPermission(`accessControl`, `get`);
          let n = {
            method: `get`,
            url: (0, G.compile)(`accessControl/api{/:id}`)(t?.params),
            params: t?.query,
            data: t?.body,
            signal: t?.signal,
            ...(t?.axiosConfig ? e.resolveAxiosConfig(t.axiosConfig) : void 0),
          };
          return (e.log(`Sending Request:`, n), await e._axios.request(n));
        }, t);
      },
      update(t) {
        return e.resolveAxiosResponse(async () => {
          e.checkPermission(`accessControl`, `update`);
          let n = {
            method: `patch`,
            url: (0, G.compile)(`accessControl/api/:id`)(t?.params),
            params: t?.query,
            data: t?.body,
            signal: t?.signal,
            ...(t?.axiosConfig ? e.resolveAxiosConfig(t.axiosConfig) : void 0),
          };
          return (e.log(`Sending Request:`, n), await e._axios.request(n));
        }, t);
      },
      del(t) {
        return e.resolveAxiosResponse(async () => {
          e.checkPermission(`accessControl`, `del`);
          let n = {
            method: `delete`,
            url: (0, G.compile)(`accessControl/api/:id`)(t?.params),
            params: t?.query,
            data: t?.body,
            signal: t?.signal,
            ...(t?.axiosConfig ? e.resolveAxiosConfig(t.axiosConfig) : void 0),
          };
          return (e.log(`Sending Request:`, n), await e._axios.request(n));
        }, t);
      },
    };
    return (
      (t.create.__scope = `accessControl`),
      (t.count.__scope = `accessControl`),
      (t.get.__scope = `accessControl`),
      (t.update.__scope = `accessControl`),
      (t.del.__scope = `accessControl`),
      e._moduleGroup.set(t, `IAM`),
      e._moduleMetadata.set(t, {
        crud: {
          schema: {
            $schema: `https://json-schema.org/draft/2020-12/schema`,
            type: `object`,
            properties: {
              role: {
                type: `string`,
                maxLength: 100,
                description: `The name of the role`,
              },
              skipIntersection: { type: `boolean` },
              policies: {
                type: `array`,
                items: { tsType: `string`, ref: `accessControlPolicies` },
                description: `The policies associated with the role`,
              },
              subRoles: {
                type: `array`,
                items: { type: `string`, maxLength: 100 },
              },
              createdAt: {
                default: `2026-05-22T12:21:14.678Z`,
                type: `string`,
                format: `date-time`,
              },
              updatedAt: {
                default: `2026-05-22T12:21:14.682Z`,
                type: `string`,
                format: `date-time`,
              },
            },
            required: [`role`, `policies`, `createdAt`, `updatedAt`],
            additionalProperties: !1,
          },
          insertSchema: {
            $schema: `https://json-schema.org/draft/2020-12/schema`,
            type: `object`,
            properties: {
              role: {
                type: `string`,
                maxLength: 100,
                description: `The name of the role`,
              },
              skipIntersection: { type: `boolean` },
              policies: {
                type: `array`,
                items: { tsType: `string`, ref: `accessControlPolicies` },
                description: `The policies associated with the role`,
              },
              subRoles: {
                type: `array`,
                items: { type: `string`, maxLength: 100 },
              },
            },
            required: [`role`, `policies`],
          },
        },
      }),
      t
    );
  },
  Vc = (e) => {
    let t = {
      myPolicies(t) {
        return e.resolveAxiosResponse(async () => {
          e.checkPermission(`accessControlPolicies`, `myPolicies`);
          let n = {
            method: `get`,
            url: (0, G.compile)(`accessControlPolicies/api/me`)(t?.params),
            params: t?.query,
            data: t?.body,
            signal: t?.signal,
            ...(t?.axiosConfig ? e.resolveAxiosConfig(t.axiosConfig) : void 0),
          };
          return (e.log(`Sending Request:`, n), await e._axios.request(n));
        }, t);
      },
      create(t) {
        return e.resolveAxiosResponse(async () => {
          e.checkPermission(`accessControlPolicies`, `create`);
          let n = {
            method: `post`,
            url: (0, G.compile)(`accessControlPolicies/api/`)(t?.params),
            params: t?.query,
            data: t?.body,
            signal: t?.signal,
            ...(t?.axiosConfig ? e.resolveAxiosConfig(t.axiosConfig) : void 0),
          };
          return (e.log(`Sending Request:`, n), await e._axios.request(n));
        }, t);
      },
      count(t) {
        return e.resolveAxiosResponse(async () => {
          e.checkPermission(`accessControlPolicies`, `count`);
          let n = {
            method: `get`,
            url: (0, G.compile)(`accessControlPolicies/api/count`)(t?.params),
            params: t?.query,
            data: t?.body,
            signal: t?.signal,
            ...(t?.axiosConfig ? e.resolveAxiosConfig(t.axiosConfig) : void 0),
          };
          return (e.log(`Sending Request:`, n), await e._axios.request(n));
        }, t);
      },
      get(t) {
        return e.resolveAxiosResponse(async () => {
          e.checkPermission(`accessControlPolicies`, `get`);
          let n = {
            method: `get`,
            url: (0, G.compile)(`accessControlPolicies/api{/:id}`)(t?.params),
            params: t?.query,
            data: t?.body,
            signal: t?.signal,
            ...(t?.axiosConfig ? e.resolveAxiosConfig(t.axiosConfig) : void 0),
          };
          return (e.log(`Sending Request:`, n), await e._axios.request(n));
        }, t);
      },
      update(t) {
        return e.resolveAxiosResponse(async () => {
          e.checkPermission(`accessControlPolicies`, `update`);
          let n = {
            method: `patch`,
            url: (0, G.compile)(`accessControlPolicies/api/:id`)(t?.params),
            params: t?.query,
            data: t?.body,
            signal: t?.signal,
            ...(t?.axiosConfig ? e.resolveAxiosConfig(t.axiosConfig) : void 0),
          };
          return (e.log(`Sending Request:`, n), await e._axios.request(n));
        }, t);
      },
      del(t) {
        return e.resolveAxiosResponse(async () => {
          e.checkPermission(`accessControlPolicies`, `del`);
          let n = {
            method: `delete`,
            url: (0, G.compile)(`accessControlPolicies/api/:id`)(t?.params),
            params: t?.query,
            data: t?.body,
            signal: t?.signal,
            ...(t?.axiosConfig ? e.resolveAxiosConfig(t.axiosConfig) : void 0),
          };
          return (e.log(`Sending Request:`, n), await e._axios.request(n));
        }, t);
      },
    };
    return (
      (t.myPolicies.__scope = `accessControlPolicies`),
      (t.create.__scope = `accessControlPolicies`),
      (t.count.__scope = `accessControlPolicies`),
      (t.get.__scope = `accessControlPolicies`),
      (t.update.__scope = `accessControlPolicies`),
      (t.del.__scope = `accessControlPolicies`),
      e._moduleGroup.set(t, `IAM`),
      e._moduleMetadata.set(t, {
        crud: {
          schema: {
            $schema: `https://json-schema.org/draft/2020-12/schema`,
            type: `object`,
            properties: {
              name: {
                type: `string`,
                maxLength: 100,
                description: `The name of the access control policy`,
              },
              permissions: {
                type: `array`,
                items: { type: `string` },
                description: `The permissions associated with the access control policy`,
              },
              createdAt: {
                default: `2026-05-22T12:21:30.343Z`,
                type: `string`,
                format: `date-time`,
              },
              updatedAt: {
                default: `2026-05-22T12:21:30.343Z`,
                type: `string`,
                format: `date-time`,
              },
            },
            required: [`name`, `permissions`, `createdAt`, `updatedAt`],
            additionalProperties: !1,
          },
          insertSchema: {
            $schema: `https://json-schema.org/draft/2020-12/schema`,
            type: `object`,
            properties: {
              name: {
                type: `string`,
                maxLength: 100,
                description: `The name of the access control policy`,
              },
              permissions: {
                type: `array`,
                items: { type: `string` },
                description: `The permissions associated with the access control policy`,
              },
            },
            required: [`name`, `permissions`],
          },
        },
      }),
      t
    );
  },
  Hc = (e) => {
    let t = {
      create(t) {
        return e.resolveAxiosResponse(async () => {
          e.checkPermission(`apiKeys`, `create`);
          let n = {
            method: `post`,
            url: (0, G.compile)(`apiKeys/api/`)(t?.params),
            params: t?.query,
            data: t?.body,
            signal: t?.signal,
            ...(t?.axiosConfig ? e.resolveAxiosConfig(t.axiosConfig) : void 0),
          };
          return (e.log(`Sending Request:`, n), await e._axios.request(n));
        }, t);
      },
      count(t) {
        return e.resolveAxiosResponse(async () => {
          e.checkPermission(`apiKeys`, `count`);
          let n = {
            method: `get`,
            url: (0, G.compile)(`apiKeys/api/count`)(t?.params),
            params: t?.query,
            data: t?.body,
            signal: t?.signal,
            ...(t?.axiosConfig ? e.resolveAxiosConfig(t.axiosConfig) : void 0),
          };
          return (e.log(`Sending Request:`, n), await e._axios.request(n));
        }, t);
      },
      get(t) {
        return e.resolveAxiosResponse(async () => {
          e.checkPermission(`apiKeys`, `get`);
          let n = {
            method: `get`,
            url: (0, G.compile)(`apiKeys/api{/:id}`)(t?.params),
            params: t?.query,
            data: t?.body,
            signal: t?.signal,
            ...(t?.axiosConfig ? e.resolveAxiosConfig(t.axiosConfig) : void 0),
          };
          return (e.log(`Sending Request:`, n), await e._axios.request(n));
        }, t);
      },
      update(t) {
        return e.resolveAxiosResponse(async () => {
          e.checkPermission(`apiKeys`, `update`);
          let n = {
            method: `patch`,
            url: (0, G.compile)(`apiKeys/api/:id`)(t?.params),
            params: t?.query,
            data: t?.body,
            signal: t?.signal,
            ...(t?.axiosConfig ? e.resolveAxiosConfig(t.axiosConfig) : void 0),
          };
          return (e.log(`Sending Request:`, n), await e._axios.request(n));
        }, t);
      },
      del(t) {
        return e.resolveAxiosResponse(async () => {
          e.checkPermission(`apiKeys`, `del`);
          let n = {
            method: `delete`,
            url: (0, G.compile)(`apiKeys/api/:id`)(t?.params),
            params: t?.query,
            data: t?.body,
            signal: t?.signal,
            ...(t?.axiosConfig ? e.resolveAxiosConfig(t.axiosConfig) : void 0),
          };
          return (e.log(`Sending Request:`, n), await e._axios.request(n));
        }, t);
      },
    };
    return (
      (t.create.__scope = `apiKeys`),
      (t.count.__scope = `apiKeys`),
      (t.get.__scope = `apiKeys`),
      (t.update.__scope = `apiKeys`),
      (t.del.__scope = `apiKeys`),
      e._moduleGroup.set(t, `Developer`),
      e._moduleMetadata.set(t, {
        crud: {
          schema: {
            $schema: `https://json-schema.org/draft/2020-12/schema`,
            type: `object`,
            properties: {
              name: { type: `string`, minLength: 2, maxLength: 100 },
              resourceGrant: {
                type: `object`,
                propertyNames: { type: `string` },
                additionalProperties: {
                  type: `array`,
                  items: { type: `string` },
                },
              },
              secret: {},
              scopes: {
                type: `array`,
                items: { type: `string`, maxLength: 100 },
              },
              expiresAt: { type: `string`, format: `date-time` },
              lastAccessAt: { type: `string`, format: `date-time` },
              accessCount: { default: 0, type: `number` },
              createdBy: { tsType: `string` },
              createdAt: {
                default: `2026-05-22T12:21:30.397Z`,
                type: `string`,
                format: `date-time`,
              },
              updatedAt: {
                default: `2026-05-22T12:21:30.397Z`,
                type: `string`,
                format: `date-time`,
              },
            },
            required: [
              `name`,
              `resourceGrant`,
              `secret`,
              `accessCount`,
              `createdBy`,
              `createdAt`,
              `updatedAt`,
            ],
            additionalProperties: !1,
          },
          insertSchema: {
            $schema: `https://json-schema.org/draft/2020-12/schema`,
            type: `object`,
            properties: {
              name: { type: `string`, minLength: 2, maxLength: 100 },
              resourceGrant: {
                type: `object`,
                propertyNames: { type: `string` },
                additionalProperties: {
                  type: `array`,
                  items: { type: `string` },
                },
              },
              secret: {
                type: `string`,
                pattern: `^sk-([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})$`,
              },
              scopes: {
                type: `array`,
                items: { type: `string`, maxLength: 100 },
              },
              expiresAt: { type: `string`, format: `date-time` },
            },
            required: [`name`, `resourceGrant`, `secret`],
          },
        },
      }),
      t
    );
  },
  Uc = (e) => {
    let t = {
      branding(t) {
        return e.resolveAxiosResponse(async () => {
          e.checkPermission(`auth`, `branding`);
          let n = {
            method: `get`,
            url: (0, G.compile)(`auth/branding`)(t?.params),
            params: t?.query,
            data: t?.body,
            signal: t?.signal,
            ...(t?.axiosConfig ? e.resolveAxiosConfig(t.axiosConfig) : void 0),
          };
          return (e.log(`Sending Request:`, n), await e._axios.request(n));
        }, t);
      },
      capabilities(t) {
        return e.resolveAxiosResponse(async () => {
          e.checkPermission(`auth`, `capabilities`);
          let n = {
            method: `get`,
            url: (0, G.compile)(`auth/api/capabilities`)(t?.params),
            params: t?.query,
            data: t?.body,
            signal: t?.signal,
            ...(t?.axiosConfig ? e.resolveAxiosConfig(t.axiosConfig) : void 0),
          };
          return (e.log(`Sending Request:`, n), await e._axios.request(n));
        }, t);
      },
      handleAuth(t) {
        return e.resolveAxiosResponse(async () => {
          e.checkPermission(`auth`, `handleAuth`);
          let n = {
            method: `all`,
            url: (0, G.compile)(`auth/api{/*endpoint}`)(t?.params),
            params: t?.query,
            data: t?.body,
            signal: t?.signal,
            ...(t?.axiosConfig ? e.resolveAxiosConfig(t.axiosConfig) : void 0),
          };
          return (e.log(`Sending Request:`, n), await e._axios.request(n));
        }, t);
      },
      betterAuthUI(t) {
        return e.resolveAxiosResponse(async () => {
          e.checkPermission(`auth`, `betterAuthUI`);
          let n = {
            method: `get`,
            url: (0, G.compile)(`auth{/*endpoint}`)(t?.params),
            params: t?.query,
            data: t?.body,
            signal: t?.signal,
            ...(t?.axiosConfig ? e.resolveAxiosConfig(t.axiosConfig) : void 0),
          };
          return (e.log(`Sending Request:`, n), await e._axios.request(n));
        }, t);
      },
    };
    return (
      (t.branding.__scope = `auth`),
      (t.capabilities.__scope = `auth`),
      (t.handleAuth.__scope = `auth`),
      (t.betterAuthUI.__scope = `auth`),
      e._moduleGroup.set(t, `Auth`),
      t
    );
  },
  Wc = (e) => {
    let t = {
      create(t) {
        return e.resolveAxiosResponse(async () => {
          e.checkPermission(`envs`, `create`);
          let n = {
            method: `post`,
            url: (0, G.compile)(`envs/api/`)(t?.params),
            params: t?.query,
            data: t?.body,
            signal: t?.signal,
            ...(t?.axiosConfig ? e.resolveAxiosConfig(t.axiosConfig) : void 0),
          };
          return (e.log(`Sending Request:`, n), await e._axios.request(n));
        }, t);
      },
      count(t) {
        return e.resolveAxiosResponse(async () => {
          e.checkPermission(`envs`, `count`);
          let n = {
            method: `get`,
            url: (0, G.compile)(`envs/api/count`)(t?.params),
            params: t?.query,
            data: t?.body,
            signal: t?.signal,
            ...(t?.axiosConfig ? e.resolveAxiosConfig(t.axiosConfig) : void 0),
          };
          return (e.log(`Sending Request:`, n), await e._axios.request(n));
        }, t);
      },
      get(t) {
        return e.resolveAxiosResponse(async () => {
          e.checkPermission(`envs`, `get`);
          let n = {
            method: `get`,
            url: (0, G.compile)(`envs/api{/:id}`)(t?.params),
            params: t?.query,
            data: t?.body,
            signal: t?.signal,
            ...(t?.axiosConfig ? e.resolveAxiosConfig(t.axiosConfig) : void 0),
          };
          return (e.log(`Sending Request:`, n), await e._axios.request(n));
        }, t);
      },
      update(t) {
        return e.resolveAxiosResponse(async () => {
          e.checkPermission(`envs`, `update`);
          let n = {
            method: `patch`,
            url: (0, G.compile)(`envs/api/:id`)(t?.params),
            params: t?.query,
            data: t?.body,
            signal: t?.signal,
            ...(t?.axiosConfig ? e.resolveAxiosConfig(t.axiosConfig) : void 0),
          };
          return (e.log(`Sending Request:`, n), await e._axios.request(n));
        }, t);
      },
      del(t) {
        return e.resolveAxiosResponse(async () => {
          e.checkPermission(`envs`, `del`);
          let n = {
            method: `delete`,
            url: (0, G.compile)(`envs/api/:id`)(t?.params),
            params: t?.query,
            data: t?.body,
            signal: t?.signal,
            ...(t?.axiosConfig ? e.resolveAxiosConfig(t.axiosConfig) : void 0),
          };
          return (e.log(`Sending Request:`, n), await e._axios.request(n));
        }, t);
      },
    };
    return (
      (t.create.__scope = `envs`),
      (t.count.__scope = `envs`),
      (t.get.__scope = `envs`),
      (t.update.__scope = `envs`),
      (t.del.__scope = `envs`),
      e._moduleGroup.set(t, `Admin`),
      e._moduleMetadata.set(t, {
        crud: {
          schema: {
            $schema: `https://json-schema.org/draft/2020-12/schema`,
            type: `object`,
            properties: {
              key: {
                type: `string`,
                maxLength: 100,
                description: `The key of the environment variable`,
              },
              value: {
                type: `string`,
                maxLength: 3e3,
                description: `The value of the environment variable`,
              },
            },
            required: [`key`, `value`],
            additionalProperties: !1,
          },
          insertSchema: {
            $schema: `https://json-schema.org/draft/2020-12/schema`,
            type: `object`,
            properties: {
              key: {
                type: `string`,
                maxLength: 100,
                description: `The key of the environment variable`,
              },
              value: {
                type: `string`,
                maxLength: 3e3,
                description: `The value of the environment variable`,
              },
            },
            required: [`key`, `value`],
          },
        },
      }),
      t
    );
  },
  Gc = (e) => {
    let t = {
      status(t) {
        return e.resolveAxiosResponse(async () => {
          e.checkPermission(`home`, `status`);
          let n = {
            method: `get`,
            url: (0, G.compile)(`home/api/`)(t?.params),
            params: t?.query,
            data: t?.body,
            signal: t?.signal,
            ...(t?.axiosConfig ? e.resolveAxiosConfig(t.axiosConfig) : void 0),
          };
          return (e.log(`Sending Request:`, n), await e._axios.request(n));
        }, t);
      },
    };
    return ((t.status.__scope = `home`), e._moduleGroup.set(t, `Default`), t);
  },
  Kc = (e) => {
    let t = {
      auth(t) {
        return e.resolveAxiosResponse(async () => {
          e.checkPermission(`imageKit`, `auth`);
          let n = {
            method: `get`,
            url: (0, G.compile)(`imagekit/api/auth`)(t?.params),
            params: t?.query,
            data: t?.body,
            signal: t?.signal,
            ...(t?.axiosConfig ? e.resolveAxiosConfig(t.axiosConfig) : void 0),
          };
          return (e.log(`Sending Request:`, n), await e._axios.request(n));
        }, t);
      },
    };
    return ((t.auth.__scope = `imageKit`), e._moduleGroup.set(t, `Media`), t);
  },
  qc = (e) => {
    let t = {
      app(t) {
        return e.resolveAxiosResponse(async () => {
          e.checkPermission(`index`, `app`);
          let n = {
            method: `get`,
            url: (0, G.compile)(`index/app{/*endpoint}`)(t?.params),
            params: t?.query,
            data: t?.body,
            signal: t?.signal,
            ...(t?.axiosConfig ? e.resolveAxiosConfig(t.axiosConfig) : void 0),
          };
          return (e.log(`Sending Request:`, n), await e._axios.request(n));
        }, t);
      },
      index(t) {
        return e.resolveAxiosResponse(async () => {
          e.checkPermission(`index`, `index`);
          let n = {
            method: `get`,
            url: (0, G.compile)(`index{/*endpoint}`)(t?.params),
            params: t?.query,
            data: t?.body,
            signal: t?.signal,
            ...(t?.axiosConfig ? e.resolveAxiosConfig(t.axiosConfig) : void 0),
          };
          return (e.log(`Sending Request:`, n), await e._axios.request(n));
        }, t);
      },
    };
    return (
      (t.app.__scope = `index`),
      (t.index.__scope = `index`),
      e._moduleGroup.set(t, `Default`),
      t
    );
  },
  Jc = (e) => {
    let t = {
      get(t) {
        return e.resolveAxiosResponse(async () => {
          e.checkPermission(`me`, `get`);
          let n = {
            method: `get`,
            url: (0, G.compile)(`me/api/`)(t?.params),
            params: t?.query,
            data: t?.body,
            signal: t?.signal,
            ...(t?.axiosConfig ? e.resolveAxiosConfig(t.axiosConfig) : void 0),
          };
          return (e.log(`Sending Request:`, n), await e._axios.request(n));
        }, t);
      },
    };
    return ((t.get.__scope = `me`), t);
  },
  Yc = (e) => {
    let t = {
      authorize(t) {
        return e.resolveAxiosResponse(async () => {
          e.checkPermission(`oauth`, `authorize`);
          let n = {
            method: `get`,
            url: (0, G.compile)(`oauth/authorize`)(t?.params),
            params: t?.query,
            data: t?.body,
            signal: t?.signal,
            ...(t?.axiosConfig ? e.resolveAxiosConfig(t.axiosConfig) : void 0),
          };
          return (e.log(`Sending Request:`, n), await e._axios.request(n));
        }, t);
      },
      consent(t) {
        return e.resolveAxiosResponse(async () => {
          e.checkPermission(`oauth`, `consent`);
          let n = {
            method: `post`,
            url: (0, G.compile)(`oauth/consent`)(t?.params),
            params: t?.query,
            data: t?.body,
            signal: t?.signal,
            ...(t?.axiosConfig ? e.resolveAxiosConfig(t.axiosConfig) : void 0),
          };
          return (e.log(`Sending Request:`, n), await e._axios.request(n));
        }, t);
      },
      token(t) {
        return e.resolveAxiosResponse(async () => {
          e.checkPermission(`oauth`, `token`);
          let n = {
            method: `post`,
            url: (0, G.compile)(`oauth/token`)(t?.params),
            params: t?.query,
            data: t?.body,
            signal: t?.signal,
            ...(t?.axiosConfig ? e.resolveAxiosConfig(t.axiosConfig) : void 0),
          };
          return (e.log(`Sending Request:`, n), await e._axios.request(n));
        }, t);
      },
      revoke(t) {
        return e.resolveAxiosResponse(async () => {
          e.checkPermission(`oauth`, `revoke`);
          let n = {
            method: `post`,
            url: (0, G.compile)(`oauth/revoke`)(t?.params),
            params: t?.query,
            data: t?.body,
            signal: t?.signal,
            ...(t?.axiosConfig ? e.resolveAxiosConfig(t.axiosConfig) : void 0),
          };
          return (e.log(`Sending Request:`, n), await e._axios.request(n));
        }, t);
      },
      jwks(t) {
        return e.resolveAxiosResponse(async () => {
          e.checkPermission(`oauth`, `jwks`);
          let n = {
            method: `get`,
            url: (0, G.compile)(`oauth/jwks`)(t?.params),
            params: t?.query,
            data: t?.body,
            signal: t?.signal,
            ...(t?.axiosConfig ? e.resolveAxiosConfig(t.axiosConfig) : void 0),
          };
          return (e.log(`Sending Request:`, n), await e._axios.request(n));
        }, t);
      },
    };
    return (
      (t.authorize.__scope = `oauth`),
      (t.consent.__scope = `oauth`),
      (t.token.__scope = `oauth`),
      (t.revoke.__scope = `oauth`),
      (t.jwks.__scope = `oauth`),
      e._moduleGroup.set(t, `OAuth`),
      t
    );
  },
  Xc = (e) => {
    let t = {
      create(t) {
        return e.resolveAxiosResponse(async () => {
          e.checkPermission(`oauthClients`, `create`);
          let n = {
            method: `post`,
            url: (0, G.compile)(`oauthClients/api/`)(t?.params),
            params: t?.query,
            data: t?.body,
            signal: t?.signal,
            ...(t?.axiosConfig ? e.resolveAxiosConfig(t.axiosConfig) : void 0),
          };
          return (e.log(`Sending Request:`, n), await e._axios.request(n));
        }, t);
      },
      count(t) {
        return e.resolveAxiosResponse(async () => {
          e.checkPermission(`oauthClients`, `count`);
          let n = {
            method: `get`,
            url: (0, G.compile)(`oauthClients/api/count`)(t?.params),
            params: t?.query,
            data: t?.body,
            signal: t?.signal,
            ...(t?.axiosConfig ? e.resolveAxiosConfig(t.axiosConfig) : void 0),
          };
          return (e.log(`Sending Request:`, n), await e._axios.request(n));
        }, t);
      },
      get(t) {
        return e.resolveAxiosResponse(async () => {
          e.checkPermission(`oauthClients`, `get`);
          let n = {
            method: `get`,
            url: (0, G.compile)(`oauthClients/api{/:id}`)(t?.params),
            params: t?.query,
            data: t?.body,
            signal: t?.signal,
            ...(t?.axiosConfig ? e.resolveAxiosConfig(t.axiosConfig) : void 0),
          };
          return (e.log(`Sending Request:`, n), await e._axios.request(n));
        }, t);
      },
      update(t) {
        return e.resolveAxiosResponse(async () => {
          e.checkPermission(`oauthClients`, `update`);
          let n = {
            method: `patch`,
            url: (0, G.compile)(`oauthClients/api/:id`)(t?.params),
            params: t?.query,
            data: t?.body,
            signal: t?.signal,
            ...(t?.axiosConfig ? e.resolveAxiosConfig(t.axiosConfig) : void 0),
          };
          return (e.log(`Sending Request:`, n), await e._axios.request(n));
        }, t);
      },
      del(t) {
        return e.resolveAxiosResponse(async () => {
          e.checkPermission(`oauthClients`, `del`);
          let n = {
            method: `delete`,
            url: (0, G.compile)(`oauthClients/api/:id`)(t?.params),
            params: t?.query,
            data: t?.body,
            signal: t?.signal,
            ...(t?.axiosConfig ? e.resolveAxiosConfig(t.axiosConfig) : void 0),
          };
          return (e.log(`Sending Request:`, n), await e._axios.request(n));
        }, t);
      },
    };
    return (
      (t.create.__scope = `oauthClients`),
      (t.count.__scope = `oauthClients`),
      (t.get.__scope = `oauthClients`),
      (t.update.__scope = `oauthClients`),
      (t.del.__scope = `oauthClients`),
      e._moduleGroup.set(t, `OAuth`),
      e._moduleMetadata.set(t, {
        crud: {
          schema: {
            $schema: `https://json-schema.org/draft/2020-12/schema`,
            type: `object`,
            properties: {
              name: { type: `string`, minLength: 1, maxLength: 100 },
              description: { type: `string`, maxLength: 300 },
              logo: { type: `string`, format: `uri` },
              type: { type: `string`, enum: [`confidential`, `public`] },
              secret: { type: `hidden` },
              allowedScopes: {
                default: [],
                type: `array`,
                items: { type: `string`, minLength: 1, maxLength: 255 },
              },
              redirectUris: {
                default: [],
                type: `array`,
                items: { type: `string`, format: `uri` },
              },
              disabled: { type: `boolean` },
              createdBy: { tsType: `string` },
              createdAt: {
                default: `2026-05-22T12:21:31.575Z`,
                type: `string`,
                format: `date-time`,
              },
              updatedAt: {
                default: `2026-05-22T12:21:31.575Z`,
                type: `string`,
                format: `date-time`,
              },
            },
            required: [
              `name`,
              `type`,
              `allowedScopes`,
              `redirectUris`,
              `createdBy`,
              `createdAt`,
              `updatedAt`,
            ],
            additionalProperties: !1,
          },
          insertSchema: {
            $schema: `https://json-schema.org/draft/2020-12/schema`,
            type: `object`,
            properties: {
              name: { type: `string`, minLength: 1, maxLength: 100 },
              description: { type: `string`, maxLength: 300 },
              logo: { type: `string`, format: `uri` },
              type: { type: `string`, enum: [`confidential`, `public`] },
              secret: { type: `hidden` },
              allowedScopes: {
                default: [],
                type: `array`,
                items: { type: `string`, minLength: 1, maxLength: 255 },
              },
              redirectUris: {
                default: [],
                type: `array`,
                items: { type: `string`, format: `uri` },
              },
              disabled: { type: `boolean` },
            },
            required: [`name`, `type`],
          },
        },
      }),
      t
    );
  },
  Zc = (e) => {
    let t = {
      create(t) {
        return e.resolveAxiosResponse(async () => {
          e.checkPermission(`tenantInvites`, `create`);
          let n = {
            method: `post`,
            url: (0, G.compile)(`tenantInvites/api/`)(t?.params),
            params: t?.query,
            data: t?.body,
            signal: t?.signal,
            ...(t?.axiosConfig ? e.resolveAxiosConfig(t.axiosConfig) : void 0),
          };
          return (e.log(`Sending Request:`, n), await e._axios.request(n));
        }, t);
      },
      count(t) {
        return e.resolveAxiosResponse(async () => {
          e.checkPermission(`tenantInvites`, `count`);
          let n = {
            method: `get`,
            url: (0, G.compile)(`tenantInvites/api/count`)(t?.params),
            params: t?.query,
            data: t?.body,
            signal: t?.signal,
            ...(t?.axiosConfig ? e.resolveAxiosConfig(t.axiosConfig) : void 0),
          };
          return (e.log(`Sending Request:`, n), await e._axios.request(n));
        }, t);
      },
      get(t) {
        return e.resolveAxiosResponse(async () => {
          e.checkPermission(`tenantInvites`, `get`);
          let n = {
            method: `get`,
            url: (0, G.compile)(`tenantInvites/api{/:id}`)(t?.params),
            params: t?.query,
            data: t?.body,
            signal: t?.signal,
            ...(t?.axiosConfig ? e.resolveAxiosConfig(t.axiosConfig) : void 0),
          };
          return (e.log(`Sending Request:`, n), await e._axios.request(n));
        }, t);
      },
      update(t) {
        return e.resolveAxiosResponse(async () => {
          e.checkPermission(`tenantInvites`, `update`);
          let n = {
            method: `patch`,
            url: (0, G.compile)(`tenantInvites/api/:id`)(t?.params),
            params: t?.query,
            data: t?.body,
            signal: t?.signal,
            ...(t?.axiosConfig ? e.resolveAxiosConfig(t.axiosConfig) : void 0),
          };
          return (e.log(`Sending Request:`, n), await e._axios.request(n));
        }, t);
      },
      del(t) {
        return e.resolveAxiosResponse(async () => {
          e.checkPermission(`tenantInvites`, `del`);
          let n = {
            method: `delete`,
            url: (0, G.compile)(`tenantInvites/api/:id`)(t?.params),
            params: t?.query,
            data: t?.body,
            signal: t?.signal,
            ...(t?.axiosConfig ? e.resolveAxiosConfig(t.axiosConfig) : void 0),
          };
          return (e.log(`Sending Request:`, n), await e._axios.request(n));
        }, t);
      },
    };
    return (
      (t.create.__scope = `tenantInvites`),
      (t.count.__scope = `tenantInvites`),
      (t.get.__scope = `tenantInvites`),
      (t.update.__scope = `tenantInvites`),
      (t.del.__scope = `tenantInvites`),
      e._moduleGroup.set(t, `IAM`),
      e._moduleMetadata.set(t, {
        crud: {
          schema: {
            $schema: `https://json-schema.org/draft/2020-12/schema`,
            type: `object`,
            properties: {
              email: {
                type: `string`,
                format: `email`,
                pattern: `^(?!\\.)(?!.*\\.\\.)([A-Za-z0-9_'+\\-\\.]*)[A-Za-z0-9_+-]@([A-Za-z0-9][A-Za-z0-9\\-]*\\.)+[A-Za-z]{2,}$`,
              },
              role: { type: `string` },
              url: { type: `string`, format: `uri` },
              tenant: { tsType: `string` },
              createdBy: { tsType: `string` },
              createdAt: {
                default: `2026-05-22T12:21:31.642Z`,
                type: `string`,
                format: `date-time`,
              },
            },
            required: [
              `email`,
              `role`,
              `url`,
              `tenant`,
              `createdBy`,
              `createdAt`,
            ],
            additionalProperties: !1,
          },
          insertSchema: {
            $schema: `https://json-schema.org/draft/2020-12/schema`,
            type: `object`,
            properties: {
              email: {
                type: `string`,
                format: `email`,
                pattern: `^(?!\\.)(?!.*\\.\\.)([A-Za-z0-9_'+\\-\\.]*)[A-Za-z0-9_+-]@([A-Za-z0-9][A-Za-z0-9\\-]*\\.)+[A-Za-z]{2,}$`,
              },
              role: { type: `string` },
              url: { type: `string`, format: `uri` },
            },
            required: [`email`, `role`, `url`],
          },
        },
      }),
      t
    );
  },
  Qc = (e) => {
    let t = {
      count(t) {
        return e.resolveAxiosResponse(async () => {
          e.checkPermission(`tenantMembers`, `count`);
          let n = {
            method: `get`,
            url: (0, G.compile)(`tenantMembers/api/count`)(t?.params),
            params: t?.query,
            data: t?.body,
            signal: t?.signal,
            ...(t?.axiosConfig ? e.resolveAxiosConfig(t.axiosConfig) : void 0),
          };
          return (e.log(`Sending Request:`, n), await e._axios.request(n));
        }, t);
      },
      get(t) {
        return e.resolveAxiosResponse(async () => {
          e.checkPermission(`tenantMembers`, `get`);
          let n = {
            method: `get`,
            url: (0, G.compile)(`tenantMembers/api{/:id}`)(t?.params),
            params: t?.query,
            data: t?.body,
            signal: t?.signal,
            ...(t?.axiosConfig ? e.resolveAxiosConfig(t.axiosConfig) : void 0),
          };
          return (e.log(`Sending Request:`, n), await e._axios.request(n));
        }, t);
      },
      update(t) {
        return e.resolveAxiosResponse(async () => {
          e.checkPermission(`tenantMembers`, `update`);
          let n = {
            method: `patch`,
            url: (0, G.compile)(`tenantMembers/api/:id`)(t?.params),
            params: t?.query,
            data: t?.body,
            signal: t?.signal,
            ...(t?.axiosConfig ? e.resolveAxiosConfig(t.axiosConfig) : void 0),
          };
          return (e.log(`Sending Request:`, n), await e._axios.request(n));
        }, t);
      },
      del(t) {
        return e.resolveAxiosResponse(async () => {
          e.checkPermission(`tenantMembers`, `del`);
          let n = {
            method: `delete`,
            url: (0, G.compile)(`tenantMembers/api/:id`)(t?.params),
            params: t?.query,
            data: t?.body,
            signal: t?.signal,
            ...(t?.axiosConfig ? e.resolveAxiosConfig(t.axiosConfig) : void 0),
          };
          return (e.log(`Sending Request:`, n), await e._axios.request(n));
        }, t);
      },
      create(t) {
        return e.resolveAxiosResponse(async () => {
          e.checkPermission(`tenantMembers`, `create`);
          let n = {
            method: `post`,
            url: (0, G.compile)(`tenantMembers/api/`)(t?.params),
            params: t?.query,
            data: t?.body,
            signal: t?.signal,
            ...(t?.axiosConfig ? e.resolveAxiosConfig(t.axiosConfig) : void 0),
          };
          return (e.log(`Sending Request:`, n), await e._axios.request(n));
        }, t);
      },
    };
    return (
      (t.count.__scope = `tenantMembers`),
      (t.get.__scope = `tenantMembers`),
      (t.update.__scope = `tenantMembers`),
      (t.del.__scope = `tenantMembers`),
      (t.create.__scope = `tenantMembers`),
      e._moduleGroup.set(t, `IAM`),
      e._moduleMetadata.set(t, {
        crud: {
          schema: {
            $schema: `https://json-schema.org/draft/2020-12/schema`,
            type: `object`,
            properties: {
              tenant: { tsType: `string` },
              user: { tsType: `string` },
              email: { type: `string` },
              role: { type: `string` },
              isOwner: { type: `boolean` },
              createdBy: { tsType: `string` },
              createdAt: {
                default: `2026-05-22T12:21:31.667Z`,
                type: `string`,
                format: `date-time`,
              },
            },
            required: [`tenant`, `user`, `isOwner`, `createdBy`, `createdAt`],
            additionalProperties: !1,
          },
          insertSchema: {
            $schema: `https://json-schema.org/draft/2020-12/schema`,
            type: `object`,
            properties: { invite: { tsType: `string` } },
            required: [`invite`],
          },
          updateSchema: {
            $schema: `https://json-schema.org/draft/2020-12/schema`,
            type: `object`,
            properties: { role: { type: `string` } },
          },
        },
      }),
      t
    );
  },
  $c = (e) => {
    let t = {
      get(t) {
        return e.resolveAxiosResponse(async () => {
          e.checkPermission(`tenantMemberships`, `get`);
          let n = {
            method: `get`,
            url: (0, G.compile)(`tenantMemberships/api/`)(t?.params),
            params: t?.query,
            data: t?.body,
            signal: t?.signal,
            ...(t?.axiosConfig ? e.resolveAxiosConfig(t.axiosConfig) : void 0),
          };
          return (e.log(`Sending Request:`, n), await e._axios.request(n));
        }, t);
      },
    };
    return ((t.get.__scope = `tenantMemberships`), t);
  },
  el = (e) => {
    let t = {
      count(t) {
        return e.resolveAxiosResponse(async () => {
          e.checkPermission(`tenants`, `count`);
          let n = {
            method: `get`,
            url: (0, G.compile)(`tenants/api/count`)(t?.params),
            params: t?.query,
            data: t?.body,
            signal: t?.signal,
            ...(t?.axiosConfig ? e.resolveAxiosConfig(t.axiosConfig) : void 0),
          };
          return (e.log(`Sending Request:`, n), await e._axios.request(n));
        }, t);
      },
      get(t) {
        return e.resolveAxiosResponse(async () => {
          e.checkPermission(`tenants`, `get`);
          let n = {
            method: `get`,
            url: (0, G.compile)(`tenants/api{/:id}`)(t?.params),
            params: t?.query,
            data: t?.body,
            signal: t?.signal,
            ...(t?.axiosConfig ? e.resolveAxiosConfig(t.axiosConfig) : void 0),
          };
          return (e.log(`Sending Request:`, n), await e._axios.request(n));
        }, t);
      },
      update(t) {
        return e.resolveAxiosResponse(async () => {
          e.checkPermission(`tenants`, `update`);
          let n = {
            method: `patch`,
            url: (0, G.compile)(`tenants/api/:id`)(t?.params),
            params: t?.query,
            data: t?.body,
            signal: t?.signal,
            ...(t?.axiosConfig ? e.resolveAxiosConfig(t.axiosConfig) : void 0),
          };
          return (e.log(`Sending Request:`, n), await e._axios.request(n));
        }, t);
      },
      del(t) {
        return e.resolveAxiosResponse(async () => {
          e.checkPermission(`tenants`, `del`);
          let n = {
            method: `delete`,
            url: (0, G.compile)(`tenants/api/:id`)(t?.params),
            params: t?.query,
            data: t?.body,
            signal: t?.signal,
            ...(t?.axiosConfig ? e.resolveAxiosConfig(t.axiosConfig) : void 0),
          };
          return (e.log(`Sending Request:`, n), await e._axios.request(n));
        }, t);
      },
      create(t) {
        return e.resolveAxiosResponse(async () => {
          e.checkPermission(`tenants`, `create`);
          let n = {
            method: `post`,
            url: (0, G.compile)(`tenants/api/`)(t?.params),
            params: t?.query,
            data: t?.body,
            signal: t?.signal,
            ...(t?.axiosConfig ? e.resolveAxiosConfig(t.axiosConfig) : void 0),
          };
          return (e.log(`Sending Request:`, n), await e._axios.request(n));
        }, t);
      },
    };
    return (
      (t.count.__scope = `tenants`),
      (t.get.__scope = `tenants`),
      (t.update.__scope = `tenants`),
      (t.del.__scope = `tenants`),
      (t.create.__scope = `tenants`),
      e._moduleGroup.set(t, `IAM`),
      e._moduleMetadata.set(t, {
        crud: {
          schema: {
            $schema: `https://json-schema.org/draft/2020-12/schema`,
            type: `object`,
            properties: {
              name: { type: `string` },
              logo: { type: `string`, format: `uri` },
              createdBy: { tsType: `string` },
              createdAt: {
                default: `2026-05-22T12:21:31.723Z`,
                type: `string`,
                format: `date-time`,
              },
            },
            required: [`name`, `createdBy`, `createdAt`],
            additionalProperties: !1,
          },
          insertSchema: {
            $schema: `https://json-schema.org/draft/2020-12/schema`,
            type: `object`,
            properties: {
              name: { type: `string` },
              logo: { type: `string`, format: `uri` },
            },
            required: [`name`],
          },
        },
      }),
      t
    );
  },
  tl = (e) => {
    let t = {
      create(t) {
        return e.resolveAxiosResponse(async () => {
          e.checkPermission(`users`, `create`);
          let n = {
            method: `post`,
            url: (0, G.compile)(`users/api/`)(t?.params),
            params: t?.query,
            data: t?.body,
            signal: t?.signal,
            ...(t?.axiosConfig ? e.resolveAxiosConfig(t.axiosConfig) : void 0),
          };
          return (e.log(`Sending Request:`, n), await e._axios.request(n));
        }, t);
      },
      update(t) {
        return e.resolveAxiosResponse(async () => {
          e.checkPermission(`users`, `update`);
          let n = {
            method: `patch`,
            url: (0, G.compile)(`users/api/:id`)(t?.params),
            params: t?.query,
            data: t?.body,
            signal: t?.signal,
            ...(t?.axiosConfig ? e.resolveAxiosConfig(t.axiosConfig) : void 0),
          };
          return (e.log(`Sending Request:`, n), await e._axios.request(n));
        }, t);
      },
      ban(t) {
        return e.resolveAxiosResponse(async () => {
          e.checkPermission(`users`, `ban`);
          let n = {
            method: `post`,
            url: (0, G.compile)(`users/api/ban/:id`)(t?.params),
            params: t?.query,
            data: t?.body,
            signal: t?.signal,
            ...(t?.axiosConfig ? e.resolveAxiosConfig(t.axiosConfig) : void 0),
          };
          return (e.log(`Sending Request:`, n), await e._axios.request(n));
        }, t);
      },
      count(t) {
        return e.resolveAxiosResponse(async () => {
          e.checkPermission(`users`, `count`);
          let n = {
            method: `get`,
            url: (0, G.compile)(`users/api/count`)(t?.params),
            params: t?.query,
            data: t?.body,
            signal: t?.signal,
            ...(t?.axiosConfig ? e.resolveAxiosConfig(t.axiosConfig) : void 0),
          };
          return (e.log(`Sending Request:`, n), await e._axios.request(n));
        }, t);
      },
      get(t) {
        return e.resolveAxiosResponse(async () => {
          e.checkPermission(`users`, `get`);
          let n = {
            method: `get`,
            url: (0, G.compile)(`users/api{/:id}`)(t?.params),
            params: t?.query,
            data: t?.body,
            signal: t?.signal,
            ...(t?.axiosConfig ? e.resolveAxiosConfig(t.axiosConfig) : void 0),
          };
          return (e.log(`Sending Request:`, n), await e._axios.request(n));
        }, t);
      },
    };
    return (
      (t.create.__scope = `users`),
      (t.update.__scope = `users`),
      (t.ban.__scope = `users`),
      (t.count.__scope = `users`),
      (t.get.__scope = `users`),
      e._moduleGroup.set(t, `Admin`),
      e._moduleMetadata.set(t, {
        crud: {
          schema: {
            $schema: `https://json-schema.org/draft/2020-12/schema`,
            type: `object`,
            properties: {
              name: { type: `string` },
              image: { type: `string`, format: `uri` },
              email: {
                type: `string`,
                format: `email`,
                pattern: `^(?!\\.)(?!.*\\.\\.)([A-Za-z0-9_'+\\-\\.]*)[A-Za-z0-9_+-]@([A-Za-z0-9][A-Za-z0-9\\-]*\\.)+[A-Za-z]{2,}$`,
              },
              emailVerified: { type: `boolean` },
              role: { type: `string` },
              createdAt: { type: `string`, format: `date-time` },
              updatedAt: { type: `string`, format: `date-time` },
            },
            required: [
              `name`,
              `email`,
              `emailVerified`,
              `role`,
              `createdAt`,
              `updatedAt`,
            ],
            additionalProperties: !1,
          },
          insertSchema: {
            $schema: `https://json-schema.org/draft/2020-12/schema`,
            type: `object`,
            properties: {
              email: {
                type: `string`,
                format: `email`,
                pattern: `^(?!\\.)(?!.*\\.\\.)([A-Za-z0-9_'+\\-\\.]*)[A-Za-z0-9_+-]@([A-Za-z0-9][A-Za-z0-9\\-]*\\.)+[A-Za-z]{2,}$`,
              },
              password: { type: `string` },
              name: { type: `string` },
              role: { type: `string` },
              metadata: {
                type: `object`,
                propertyNames: { type: `string` },
                additionalProperties: {},
              },
            },
            required: [`email`, `name`],
          },
        },
      }),
      t
    );
  },
  nl = class {
    static setTenant(e) {
      ((this.tenant = q._cacheNamespaces.tenant = e),
        q.log(`Setting tenant:`, this.tenant),
        !this.tenantInterceptorId &&
          this.tenant &&
          (this.tenantInterceptorId = q._axios?.interceptors.request.use(
            (e) => (
              this.tenant && (e.headers[`x-tenant-id`] = this.tenant),
              q.log(`Tenant interceptor:`, this.tenant),
              e
            ),
          )));
    }
    static getTenant() {
      return this.tenant;
    }
    static removeTenant() {
      ((q._cacheNamespaces.tenant = null),
        delete this.tenant,
        q.log(`Tenant removed`),
        this.tenantInterceptorId &&
          !this.tenant &&
          q._axios?.interceptors.response.eject(this.tenantInterceptorId));
    }
    static registerAuthInterceptors(e, t) {
      if (!this.authInterceptorIds.length) {
        let n = q._axios?.interceptors.request.use(async (t) => {
          let n = await (this.accessTokenPromise ??= e());
          return (
            delete this.accessTokenPromise,
            n && (t.headers.Authorization = `Bearer ${n}`),
            q.log(`Auth interceptor:`, `Sending token:`, n),
            t
          );
        });
        n !== void 0 && this.authInterceptorIds.push(n);
        let r = q._axios?.interceptors.response.use(
          (e) => e,
          async (n) => {
            if (n.response?.status === 401 && typeof t == `function`) {
              await (this.refreshTokenPromise ??= t());
              let r = await (this.accessTokenPromise ??= e());
              if (
                (delete this.refreshTokenPromise,
                delete this.accessTokenPromise,
                r)
              )
                return (
                  (n.config.headers.Authorization = `Bearer ${r}`),
                  q._axios?.request(n.config)
                );
              q.log(`Auth interceptor:`, `Sending new token:`, r);
            }
            return Promise.reject(n);
          },
        );
        r !== void 0 && this.authInterceptorIds.push(r);
      }
    }
    static unregisterAuthInterceptors() {
      (this.authInterceptorIds.forEach((e) => {
        (q._axios?.interceptors.request.eject(e),
          q._axios?.interceptors.response.eject(e));
      }),
        (this.authInterceptorIds = []));
    }
    static async registerPermissions() {
      let { policies: e } = await q.accessControlPolicies.myPolicies();
      q.isPermitted = (t, n) => {
        let r = ((t, n) => {
          if (!t) return !1;
          let r = typeof t == `function` ? t.name : t,
            i = n;
          return e.some(
            (e) =>
              e.permissions.includes(`*`) ||
              e.permissions.includes(`${r}.${i}`) ||
              e.permissions.includes(r),
          );
        })(t, n);
        return (q.log(`Allowed permission`, t, n, r), r);
      };
    }
    static unregisterPermissions() {
      q.isPermitted = () => !1;
    }
    static clean() {
      (this.unregisterAuthInterceptors(),
        this.removeTenant(),
        this.unregisterPermissions());
    }
  };
Object.defineProperty(nl, "authInterceptorIds", {
  enumerable: !0,
  configurable: !0,
  writable: !0,
  value: [],
});
var K,
  q = class extends Rc {
    static getModuleNames() {
      return this._moduleNames;
    }
    static getModule(e) {
      if (!this.getModuleNames().includes(e))
        throw Error(`Module not found: ${e}`);
      return this[e];
    }
    static getMetadata(e) {
      return typeof e == `object`
        ? this._moduleMetadata.get(e)
        : this._moduleMetadata.get(this.getModule(e));
    }
    static getGroup(e) {
      return typeof e == `object`
        ? this._moduleGroup.get(e)
        : this._moduleGroup.get(this.getModule(e));
    }
    static listActions(e) {
      let t = (() => {
        if (this._actionsList) return this._actionsList;
        let e = [];
        return (
          this.getModuleNames().forEach((t) => {
            Object.keys(this.getModule(t)).forEach((n) => {
              e.push(`${t}.${n}`);
            });
          }),
          (this._actionsList = e)
        );
      })();
      return e ? t.filter((t) => t.startsWith(`${e}.`)) : t;
    }
  };
((K = q),
  Object.defineProperty(q, "_moduleNames", {
    enumerable: !0,
    configurable: !0,
    writable: !0,
    value: [
      `wellKnown`,
      `accessControl`,
      `accessControlPolicies`,
      `apiKeys`,
      `auth`,
      `envs`,
      `home`,
      `imageKit`,
      `index`,
      `me`,
      `oauth`,
      `oauthClients`,
      `tenantInvites`,
      `tenantMembers`,
      `tenantMemberships`,
      `tenants`,
      `users`,
    ],
  }),
  Object.defineProperty(q, "wellKnown", {
    enumerable: !0,
    configurable: !0,
    writable: !0,
    value: zc(K),
  }),
  Object.defineProperty(q, "accessControl", {
    enumerable: !0,
    configurable: !0,
    writable: !0,
    value: Bc(K),
  }),
  Object.defineProperty(q, "accessControlPolicies", {
    enumerable: !0,
    configurable: !0,
    writable: !0,
    value: Vc(K),
  }),
  Object.defineProperty(q, "apiKeys", {
    enumerable: !0,
    configurable: !0,
    writable: !0,
    value: Hc(K),
  }),
  Object.defineProperty(q, "auth", {
    enumerable: !0,
    configurable: !0,
    writable: !0,
    value: Uc(K),
  }),
  Object.defineProperty(q, "envs", {
    enumerable: !0,
    configurable: !0,
    writable: !0,
    value: Wc(K),
  }),
  Object.defineProperty(q, "home", {
    enumerable: !0,
    configurable: !0,
    writable: !0,
    value: Gc(K),
  }),
  Object.defineProperty(q, "imageKit", {
    enumerable: !0,
    configurable: !0,
    writable: !0,
    value: Kc(K),
  }),
  Object.defineProperty(q, "index", {
    enumerable: !0,
    configurable: !0,
    writable: !0,
    value: qc(K),
  }),
  Object.defineProperty(q, "me", {
    enumerable: !0,
    configurable: !0,
    writable: !0,
    value: Jc(K),
  }),
  Object.defineProperty(q, "oauth", {
    enumerable: !0,
    configurable: !0,
    writable: !0,
    value: Yc(K),
  }),
  Object.defineProperty(q, "oauthClients", {
    enumerable: !0,
    configurable: !0,
    writable: !0,
    value: Xc(K),
  }),
  Object.defineProperty(q, "tenantInvites", {
    enumerable: !0,
    configurable: !0,
    writable: !0,
    value: Zc(K),
  }),
  Object.defineProperty(q, "tenantMembers", {
    enumerable: !0,
    configurable: !0,
    writable: !0,
    value: Qc(K),
  }),
  Object.defineProperty(q, "tenantMemberships", {
    enumerable: !0,
    configurable: !0,
    writable: !0,
    value: $c(K),
  }),
  Object.defineProperty(q, "tenants", {
    enumerable: !0,
    configurable: !0,
    writable: !0,
    value: el(K),
  }),
  Object.defineProperty(q, "users", {
    enumerable: !0,
    configurable: !0,
    writable: !0,
    value: tl(K),
  }),
  Object.defineProperty(q, "plugins", {
    enumerable: !0,
    configurable: !0,
    writable: !0,
    value: { essentials: nl },
  }));
var rl = window.location.origin;
async function il(e) {
  let t = await fetch(new URL(e, rl), { method: `GET` });
  if (!t.ok)
    throw Error((await t.text()) || `Request failed with status ${t.status}`);
  return await t.json();
}
var al = () => il(`/auth/branding/`),
  ol = async () => (await il(`/auth/api/capabilities`)).capabilities,
  sl = Object.prototype.hasOwnProperty;
function cl(e, t) {
  var n, r;
  if (e === t) return !0;
  if (e && t && (n = e.constructor) === t.constructor) {
    if (n === Date) return e.getTime() === t.getTime();
    if (n === RegExp) return e.toString() === t.toString();
    if (n === Array) {
      if ((r = e.length) === t.length) for (; r-- && cl(e[r], t[r]); );
      return r === -1;
    }
    if (!n || typeof e == `object`) {
      for (n in ((r = 0), e))
        if (
          (sl.call(e, n) && ++r && !sl.call(t, n)) ||
          !(n in t) ||
          !cl(e[n], t[n])
        )
          return !1;
      return Object.keys(t).length === r;
    }
  }
  return e !== e && t !== t;
}
var ll = new WeakMap(),
  ul = () => {},
  dl = Object,
  J = (e) => e === void 0,
  fl = (e) => typeof e == `function`,
  pl = (e, t) => ({ ...e, ...t }),
  ml = (e) => fl(e.then),
  hl = {},
  gl = {},
  _l = `undefined`,
  vl = typeof window != _l,
  yl = typeof document != _l,
  bl = vl && `Deno` in window,
  xl = () => vl && typeof window.requestAnimationFrame != _l,
  Sl = (e, t) => {
    let n = ll.get(e);
    return [
      () => (!J(t) && e.get(t)) || hl,
      (r) => {
        if (!J(t)) {
          let i = e.get(t);
          (t in gl || (gl[t] = i), n[5](t, pl(i, r), i || hl));
        }
      },
      n[6],
      () => (!J(t) && t in gl ? gl[t] : (!J(t) && e.get(t)) || hl),
    ];
  },
  Cl = !0,
  wl = () => Cl,
  [Tl, El] =
    vl && window.addEventListener
      ? [
          window.addEventListener.bind(window),
          window.removeEventListener.bind(window),
        ]
      : [ul, ul],
  Dl = () => {
    let e = yl && document.visibilityState;
    return J(e) || e !== `hidden`;
  },
  Ol = (e) => (
    yl && document.addEventListener(`visibilitychange`, e),
    Tl(`focus`, e),
    () => {
      (yl && document.removeEventListener(`visibilitychange`, e),
        El(`focus`, e));
    }
  ),
  kl = (e) => {
    let t = () => {
        ((Cl = !0), e());
      },
      n = () => {
        Cl = !1;
      };
    return (
      Tl(`online`, t),
      Tl(`offline`, n),
      () => {
        (El(`online`, t), El(`offline`, n));
      }
    );
  },
  Al = { isOnline: wl, isVisible: Dl },
  jl = { initFocus: Ol, initReconnect: kl },
  Ml = !m.useId,
  Nl = !vl || bl,
  Pl = (e) => (xl() ? window.requestAnimationFrame(e) : setTimeout(e, 1)),
  Fl = Nl ? m.useEffect : m.useLayoutEffect,
  Il = typeof navigator < `u` && navigator.connection,
  Ll =
    !Nl && Il && ([`slow-2g`, `2g`].includes(Il.effectiveType) || Il.saveData),
  Rl = new WeakMap(),
  zl = (e) => dl.prototype.toString.call(e),
  Bl = (e, t) => e === `[object ${t}]`,
  Vl = 0,
  Hl = (e) => {
    let t = typeof e,
      n = zl(e),
      r = Bl(n, `Date`),
      i = Bl(n, `RegExp`),
      a = Bl(n, `Object`),
      o,
      s;
    if (dl(e) === e && !r && !i) {
      if (((o = Rl.get(e)), o)) return o;
      if (((o = ++Vl + `~`), Rl.set(e, o), Array.isArray(e))) {
        for (o = `@`, s = 0; s < e.length; s++) o += Hl(e[s]) + `,`;
        Rl.set(e, o);
      }
      if (a) {
        o = `#`;
        let t = dl.keys(e).sort();
        for (; !J((s = t.pop())); ) J(e[s]) || (o += s + `:` + Hl(e[s]) + `,`);
        Rl.set(e, o);
      }
    } else
      o = r
        ? e.toJSON()
        : t == `symbol`
          ? e.toString()
          : t == `string`
            ? JSON.stringify(e)
            : `` + e;
    return o;
  },
  Ul = (e) => {
    if (fl(e))
      try {
        e = e();
      } catch {
        e = ``;
      }
    let t = e;
    return (
      (e =
        typeof e == `string`
          ? e
          : (Array.isArray(e) ? e.length : e)
            ? Hl(e)
            : ``),
      [e, t]
    );
  },
  Wl = 0,
  Gl = () => ++Wl;
async function Kl(...e) {
  let [t, n, r, i] = e,
    a = pl(
      { populateCache: !0, throwOnError: !0 },
      typeof i == `boolean` ? { revalidate: i } : i || {},
    ),
    o = a.populateCache,
    s = a.rollbackOnError,
    c = a.optimisticData,
    l = (e) => (typeof s == `function` ? s(e) : s !== !1),
    u = a.throwOnError;
  if (fl(n)) {
    let e = n,
      r = [],
      i = t.keys();
    for (let n of i) !/^\$(inf|sub)\$/.test(n) && e(t.get(n)._k) && r.push(n);
    return Promise.all(r.map(d));
  }
  return d(n);
  async function d(n) {
    let [i] = Ul(n);
    if (!i) return;
    let [s, d] = Sl(t, i),
      [f, p, m, h] = ll.get(t),
      g = () => {
        let e = f[i];
        return (fl(a.revalidate)
          ? a.revalidate(s().data, n)
          : a.revalidate !== !1) && (delete m[i], delete h[i], e && e[0])
          ? e[0](2).then(() => s().data)
          : s().data;
      };
    if (e.length < 3) return g();
    let _ = r,
      v,
      y = !1,
      b = Gl();
    p[i] = [b, 0];
    let x = !J(c),
      S = s(),
      C = S.data,
      w = S._c,
      T = J(w) ? C : w;
    if ((x && ((c = fl(c) ? c(T, C) : c), d({ data: c, _c: T })), fl(_)))
      try {
        _ = _(T);
      } catch (e) {
        ((v = e), (y = !0));
      }
    if (_ && ml(_))
      if (
        ((_ = await _.catch((e) => {
          ((v = e), (y = !0));
        })),
        b !== p[i][0])
      ) {
        if (y) throw v;
        return _;
      } else y && x && l(v) && ((o = !0), d({ data: T, _c: void 0 }));
    if (
      (o &&
        (y ||
          (fl(o)
            ? d({ data: o(_, T), error: void 0, _c: void 0 })
            : d({ data: _, error: void 0, _c: void 0 }))),
      (p[i][1] = Gl()),
      Promise.resolve(g()).then(() => {
        d({ _c: void 0 });
      }),
      y)
    ) {
      if (u) throw v;
      return;
    }
    return _;
  }
}
var ql = (e, t) => {
    for (let n in e) e[n][0] && e[n][0](t);
  },
  Jl = (e, t) => {
    if (!ll.has(e)) {
      let n = pl(jl, t),
        r = Object.create(null),
        i = Kl.bind(void 0, e),
        a = ul,
        o = Object.create(null),
        s = (e, t) => {
          let n = o[e] || [];
          return ((o[e] = n), n.push(t), () => n.splice(n.indexOf(t), 1));
        },
        c = (t, n, r) => {
          e.set(t, n);
          let i = o[t];
          if (i) for (let e of i) e(n, r);
        },
        l = () => {
          if (
            !ll.has(e) &&
            (ll.set(e, [
              r,
              Object.create(null),
              Object.create(null),
              Object.create(null),
              i,
              c,
              s,
            ]),
            !Nl)
          ) {
            let t = n.initFocus(setTimeout.bind(void 0, ql.bind(void 0, r, 0))),
              i = n.initReconnect(
                setTimeout.bind(void 0, ql.bind(void 0, r, 1)),
              );
            a = () => {
              (t && t(), i && i(), ll.delete(e));
            };
          }
        };
      return (l(), [e, i, l, a]);
    }
    return [e, ll.get(e)[4]];
  },
  Yl = (e, t, n, r, i) => {
    let a = n.errorRetryCount,
      o = i.retryCount,
      s =
        ~~((Math.random() + 0.5) * (1 << (o < 8 ? o : 8))) *
        n.errorRetryInterval;
    (!J(a) && o > a) || setTimeout(r, s, i);
  },
  Xl = cl,
  [Zl, Ql] = Jl(new Map()),
  $l = pl(
    {
      onLoadingSlow: ul,
      onSuccess: ul,
      onError: ul,
      onErrorRetry: Yl,
      onDiscarded: ul,
      revalidateOnFocus: !0,
      revalidateOnReconnect: !0,
      revalidateIfStale: !0,
      shouldRetryOnError: !0,
      errorRetryInterval: Ll ? 1e4 : 5e3,
      focusThrottleInterval: 5 * 1e3,
      dedupingInterval: 2 * 1e3,
      loadingTimeout: Ll ? 5e3 : 3e3,
      compare: Xl,
      isPaused: () => !1,
      cache: Zl,
      mutate: Ql,
      fallback: {},
    },
    Al,
  ),
  eu = (e, t) => {
    let n = pl(e, t);
    if (t) {
      let { use: r, fallback: i } = e,
        { use: a, fallback: o } = t;
      (r && a && (n.use = r.concat(a)), i && o && (n.fallback = pl(i, o)));
    }
    return n;
  },
  tu = (0, m.createContext)({}),
  nu = (e) => {
    let { value: t } = e,
      n = (0, m.useContext)(tu),
      r = fl(t),
      i = (0, m.useMemo)(() => (r ? t(n) : t), [r, n, t]),
      a = (0, m.useMemo)(() => (r ? i : eu(n, i)), [r, n, i]),
      o = i && i.provider,
      s = (0, m.useRef)(void 0);
    o && !s.current && (s.current = Jl(o(a.cache || Zl), i));
    let c = s.current;
    return (
      c && ((a.cache = c[0]), (a.mutate = c[1])),
      Fl(() => {
        if (c) return (c[2] && c[2](), c[3]);
      }, []),
      (0, m.createElement)(tu.Provider, pl(e, { value: a }))
    );
  },
  ru = `$inf$`,
  iu = vl && window.__SWR_DEVTOOLS_USE__,
  au = iu ? window.__SWR_DEVTOOLS_USE__ : [],
  ou = () => {
    iu && (window.__SWR_DEVTOOLS_REACT__ = m.default);
  },
  su = (e) =>
    fl(e[1])
      ? [e[0], e[1], e[2] || {}]
      : [e[0], null, (e[1] === null ? e[2] : e[1]) || {}],
  cu = () => {
    let e = (0, m.useContext)(tu);
    return (0, m.useMemo)(() => pl($l, e), [e]);
  },
  lu = au.concat(
    (e) => (t, n, r) =>
      e(
        t,
        n &&
          ((...e) => {
            let [r] = Ul(t),
              [, , , i] = ll.get(Zl);
            if (r.startsWith(`$inf$`)) return n(...e);
            let a = i[r];
            return J(a) ? n(...e) : (delete i[r], a);
          }),
        r,
      ),
  ),
  uu = (e) =>
    function (...t) {
      let n = cu(),
        [r, i, a] = su(t),
        o = eu(n, a),
        s = e,
        { use: c } = o,
        l = (c || []).concat(lu);
      for (let e = l.length; e--; ) s = l[e](s);
      return s(r, i || o.fetcher || null, o);
    },
  du = (e, t, n) => {
    let r = t[e] || (t[e] = []);
    return (
      r.push(n),
      () => {
        let e = r.indexOf(n);
        e >= 0 && ((r[e] = r[r.length - 1]), r.pop());
      }
    );
  },
  fu =
    (e, t) =>
    (...n) => {
      let [r, i, a] = su(n),
        o = (a.use || []).concat(t);
      return e(r, i, { ...a, use: o });
    };
ou();
var pu =
    m.use ||
    ((e) => {
      switch (e.status) {
        case `pending`:
          throw e;
        case `fulfilled`:
          return e.value;
        case `rejected`:
          throw e.reason;
        default:
          throw (
            (e.status = `pending`),
            e.then(
              (t) => {
                ((e.status = `fulfilled`), (e.value = t));
              },
              (t) => {
                ((e.status = `rejected`), (e.reason = t));
              },
            ),
            e
          );
      }
    }),
  mu = { dedupe: !0 },
  hu = Promise.resolve(void 0),
  gu = () => ul,
  _u = (e, t, n) => {
    let {
        cache: r,
        compare: i,
        suspense: a,
        fallbackData: o,
        revalidateOnMount: s,
        revalidateIfStale: c,
        refreshInterval: l,
        refreshWhenHidden: u,
        refreshWhenOffline: d,
        keepPreviousData: f,
        strictServerPrefetchWarning: p,
      } = n,
      [h, g, _, v] = ll.get(r),
      [y, b] = Ul(e),
      x = (0, m.useRef)(!1),
      S = (0, m.useRef)(!1),
      C = (0, m.useRef)(y),
      w = (0, m.useRef)(t),
      T = (0, m.useRef)(n),
      E = () => T.current,
      D = () => E().isVisible() && E().isOnline(),
      [O, k, A, j] = Sl(r, y),
      M = (0, m.useRef)({}).current,
      N = J(o) ? (J(n.fallback) ? void 0 : n.fallback[y]) : o,
      P = (e, t) => {
        for (let n in M) {
          let r = n;
          if (r === `data`) {
            if (!i(e[r], t[r]) && (!J(e[r]) || !i(ie, t[r]))) return !1;
          } else if (t[r] !== e[r]) return !1;
        }
        return !0;
      },
      ee = !x.current,
      F = (0, m.useMemo)(() => {
        let e = O(),
          n = j(),
          r = (e) => {
            let n = pl(e);
            return (
              delete n._k,
              !(!y || !t || E().isPaused()) &&
              (ee && !J(s) ? s : J(J(N) ? n.data : N) || c)
                ? { isValidating: !0, isLoading: !0, ...n }
                : n
            );
          },
          i = r(e),
          a = e === n ? i : r(n),
          o = i;
        return [
          () => {
            let e = r(O());
            return P(e, o)
              ? ((o.data = e.data),
                (o.isLoading = e.isLoading),
                (o.isValidating = e.isValidating),
                (o.error = e.error),
                o)
              : ((o = e), e);
          },
          () => a,
        ];
      }, [r, y]),
      I = (0, Sa.useSyncExternalStore)(
        (0, m.useCallback)(
          (e) =>
            A(y, (t, n) => {
              P(n, t) || e();
            }),
          [r, y],
        ),
        F[0],
        F[1],
      ),
      te = h[y] && h[y].length > 0,
      ne = I.data,
      re = J(ne) ? (N && ml(N) ? pu(N) : N) : ne,
      L = I.error,
      R = (0, m.useRef)(re),
      ie = f ? (J(ne) ? (J(R.current) ? re : R.current) : ne) : re,
      ae = y && J(re),
      z = (0, m.useRef)(null);
    !Nl &&
      (0, Sa.useSyncExternalStore)(
        gu,
        () => ((z.current = !1), z),
        () => ((z.current = !0), z),
      );
    let oe = z.current;
    p &&
      oe &&
      !a &&
      ae &&
      console.warn(
        `Missing pre-initiated data for serialized key "${y}" during server-side rendering. Data fetching should be initiated on the server and provided to SWR via fallback data. You can set "strictServerPrefetchWarning: false" to disable this warning.`,
      );
    let se =
        !y || !t || E().isPaused() || (te && !J(L))
          ? !1
          : ee && !J(s)
            ? s
            : a
              ? J(re)
                ? !1
                : c
              : J(re) || c,
      ce = ee && se,
      le = J(I.isValidating) ? ce : I.isValidating,
      B = J(I.isLoading) ? ce : I.isLoading,
      ue = (0, m.useCallback)(
        async (e) => {
          let t = w.current;
          if (!y || !t || S.current || E().isPaused()) return !1;
          let r,
            a,
            o = !0,
            s = e || {},
            c = !_[y] || !s.dedupe,
            l = () =>
              Ml ? !S.current && y === C.current && x.current : y === C.current,
            u = { isValidating: !1, isLoading: !1 },
            d = () => {
              k(u);
            },
            f = () => {
              let e = _[y];
              e && e[1] === a && delete _[y];
            },
            p = { isValidating: !0 };
          J(O().data) && (p.isLoading = !0);
          try {
            if (
              (c &&
                (k(p),
                n.loadingTimeout &&
                  J(O().data) &&
                  setTimeout(() => {
                    o && l() && E().onLoadingSlow(y, n);
                  }, n.loadingTimeout),
                (_[y] = [t(b), Gl()])),
              ([r, a] = _[y]),
              (r = await r),
              c && setTimeout(f, n.dedupingInterval),
              !_[y] || _[y][1] !== a)
            )
              return (c && l() && E().onDiscarded(y), !1);
            u.error = void 0;
            let e = g[y];
            if (!J(e) && (a <= e[0] || a <= e[1] || e[1] === 0))
              return (d(), c && l() && E().onDiscarded(y), !1);
            let s = O().data;
            ((u.data = i(s, r) ? s : r), c && l() && E().onSuccess(r, y, n));
          } catch (e) {
            f();
            let t = E(),
              { shouldRetryOnError: n } = t;
            t.isPaused() ||
              ((u.error = e),
              c &&
                l() &&
                (t.onError(e, y, t),
                (n === !0 || (fl(n) && n(e))) &&
                  (!E().revalidateOnFocus ||
                    !E().revalidateOnReconnect ||
                    D()) &&
                  t.onErrorRetry(
                    e,
                    y,
                    t,
                    (e) => {
                      let t = h[y];
                      t && t[0] && t[0](3, e);
                    },
                    { retryCount: (s.retryCount || 0) + 1, dedupe: !0 },
                  )));
          }
          return ((o = !1), d(), !0);
        },
        [y, r],
      ),
      de = (0, m.useCallback)((...e) => Kl(r, C.current, ...e), []);
    if (
      (Fl(() => {
        ((w.current = t), (T.current = n), J(ne) || (R.current = ne));
      }),
      Fl(() => {
        if (!y) return;
        let e = ue.bind(void 0, mu),
          t = 0;
        E().revalidateOnFocus && (t = Date.now() + E().focusThrottleInterval);
        let n = du(y, h, (n, r = {}) => {
          if (n == 0) {
            let n = Date.now();
            E().revalidateOnFocus &&
              n > t &&
              D() &&
              ((t = n + E().focusThrottleInterval), e());
          } else if (n == 1) E().revalidateOnReconnect && D() && e();
          else if (n == 2) return ue();
          else if (n == 3) return ue(r);
        });
        return (
          (S.current = !1),
          (C.current = y),
          (x.current = !0),
          k({ _k: b }),
          se && (_[y] || (J(re) || Nl ? e() : Pl(e))),
          () => {
            ((S.current = !0), n());
          }
        );
      }, [y]),
      Fl(() => {
        let e;
        function t() {
          let t = fl(l) ? l(O().data) : l;
          t && e !== -1 && (e = setTimeout(n, t));
        }
        function n() {
          !O().error && (u || E().isVisible()) && (d || E().isOnline())
            ? ue(mu).then(t)
            : t();
        }
        return (
          t(),
          () => {
            e &&= (clearTimeout(e), -1);
          }
        );
      }, [l, u, d, y]),
      (0, m.useDebugValue)(ie),
      a)
    ) {
      if (!Ml && Nl && ae)
        throw Error(`Fallback data is required when using Suspense in SSR.`);
      ae && ((w.current = t), (T.current = n), (S.current = !1));
      let e = v[y];
      if ((pu(!J(e) && ae ? de(e) : hu), !J(L) && ae)) throw L;
      let r = ae ? ue(mu) : hu;
      (!J(ie) && ae && ((r.status = `fulfilled`), (r.value = !0)), pu(r));
    }
    return {
      mutate: de,
      get data() {
        return ((M.data = !0), ie);
      },
      get error() {
        return ((M.error = !0), L);
      },
      get isValidating() {
        return ((M.isValidating = !0), le);
      },
      get isLoading() {
        return ((M.isLoading = !0), B);
      },
    };
  },
  vu = dl.defineProperty(nu, `defaultValue`, { value: $l }),
  yu = uu(_u),
  bu = o((e) => {
    var t = Symbol.for(`react.transitional.element`),
      n = Symbol.for(`react.fragment`);
    function r(e, n, r) {
      var i = null;
      if (
        (r !== void 0 && (i = `` + r),
        n.key !== void 0 && (i = `` + n.key),
        `key` in n)
      )
        for (var a in ((r = {}), n)) a !== `key` && (r[a] = n[a]);
      else r = n;
      return (
        (n = r.ref),
        { $$typeof: t, type: e, key: i, ref: n === void 0 ? null : n, props: r }
      );
    }
    ((e.Fragment = n), (e.jsx = r), (e.jsxs = r));
  }),
  xu = o((e, t) => {
    t.exports = bu();
  }),
  Su = typeof document < `u` ? m.useLayoutEffect : () => {},
  Cu = {};
function wu(e, t) {
  let n = m.useRef(Cu);
  return (n.current === Cu && (n.current = e(t)), n);
}
var Tu = [];
function Eu(e) {
  m.useEffect(e, Tu);
}
var Du = 0,
  Ou = class e {
    static create() {
      return new e();
    }
    currentId = Du;
    start(e, t) {
      (this.clear(),
        (this.currentId = setTimeout(() => {
          ((this.currentId = Du), t());
        }, e)));
    }
    isStarted() {
      return this.currentId !== Du;
    }
    clear = () => {
      this.currentId !== Du &&
        (clearTimeout(this.currentId), (this.currentId = Du));
    };
    disposeEffect = () => this.clear;
  };
function ku() {
  let e = wu(Ou.create).current;
  return (Eu(e.disposeEffect), e);
}
var Au = null;
globalThis.requestAnimationFrame;
var ju = new (class {
    callbacks = [];
    callbacksCount = 0;
    nextId = 1;
    startId = 1;
    isScheduled = !1;
    tick = (e) => {
      this.isScheduled = !1;
      let t = this.callbacks,
        n = this.callbacksCount;
      if (
        ((this.callbacks = []),
        (this.callbacksCount = 0),
        (this.startId = this.nextId),
        n > 0)
      )
        for (let n = 0; n < t.length; n += 1) t[n]?.(e);
    };
    request(e) {
      let t = this.nextId;
      return (
        (this.nextId += 1),
        this.callbacks.push(e),
        (this.callbacksCount += 1),
        (this.isScheduled ||= (requestAnimationFrame(this.tick), !0)),
        t
      );
    }
    cancel(e) {
      let t = e - this.startId;
      t < 0 ||
        t >= this.callbacks.length ||
        ((this.callbacks[t] = null), --this.callbacksCount);
    }
  })(),
  Mu = class e {
    static create() {
      return new e();
    }
    static request(e) {
      return ju.request(e);
    }
    static cancel(e) {
      return ju.cancel(e);
    }
    currentId = Au;
    request(e) {
      (this.cancel(),
        (this.currentId = ju.request(() => {
          ((this.currentId = Au), e());
        })));
    }
    cancel = () => {
      this.currentId !== Au &&
        (ju.cancel(this.currentId), (this.currentId = Au));
    };
    disposeEffect = () => this.cancel;
  };
function Nu() {
  let e = wu(Mu.create).current;
  return (Eu(e.disposeEffect), e);
}
function Pu() {}
var Fu = Object.freeze([]),
  Iu = Object.freeze({});
function Lu(e, t) {
  if (e && !t) return e;
  if (!e && t) return t;
  if (e || t) return { ...e, ...t };
}
var Ru = {};
function zu(e, t, n, r, i) {
  if (!n && !r && !i && !e) return Vu(t);
  let a = Vu(e);
  return (
    t && (a = Hu(a, t)),
    n && (a = Hu(a, n)),
    r && (a = Hu(a, r)),
    i && (a = Hu(a, i)),
    a
  );
}
function Bu(e) {
  if (e.length === 0) return Ru;
  if (e.length === 1) return Vu(e[0]);
  let t = Vu(e[0]);
  for (let n = 1; n < e.length; n += 1) t = Hu(t, e[n]);
  return t;
}
function Vu(e) {
  return Ku(e) ? { ...qu(e, Ru) } : Uu(e);
}
function Hu(e, t) {
  return Ku(t) ? qu(t, e) : Wu(e, t);
}
function Uu(e) {
  let t = { ...e };
  for (let e in t) {
    let n = t[e];
    Gu(e, n) && (t[e] = Yu(n));
  }
  return t;
}
function Wu(e, t) {
  if (!t) return e;
  for (let n in t) {
    let r = t[n];
    switch (n) {
      case `style`:
        e[n] = Lu(e.style, r);
        break;
      case `className`:
        e[n] = Zu(e.className, r);
        break;
      default:
        Gu(n, r) ? (e[n] = Ju(e[n], r)) : (e[n] = r);
    }
  }
  return e;
}
function Gu(e, t) {
  let n = e.charCodeAt(0),
    r = e.charCodeAt(1),
    i = e.charCodeAt(2);
  return (
    n === 111 &&
    r === 110 &&
    i >= 65 &&
    i <= 90 &&
    (typeof t == `function` || t === void 0)
  );
}
function Ku(e) {
  return typeof e == `function`;
}
function qu(e, t) {
  return Ku(e) ? e(t) : (e ?? Ru);
}
function Ju(e, t) {
  return t
    ? e
      ? (...n) => {
          let r = n[0];
          if (Qu(r)) {
            let i = r;
            Xu(i);
            let a = t(...n);
            return (i.baseUIHandlerPrevented || e?.(...n), a);
          }
          let i = t(...n);
          return (e?.(...n), i);
        }
      : Yu(t)
    : e;
}
function Yu(e) {
  return (
    e &&
    ((...t) => {
      let n = t[0];
      return (Qu(n) && Xu(n), e(...t));
    })
  );
}
function Xu(e) {
  return (
    (e.preventBaseUIHandler = () => {
      e.baseUIHandlerPrevented = !0;
    }),
    e
  );
}
function Zu(e, t) {
  return t ? (e ? t + ` ` + e : t) : e;
}
function Qu(e) {
  return typeof e == `object` && !!e && `nativeEvent` in e;
}
function $u(e, t, n, r) {
  let i = wu(td).current;
  return (nd(i, e, t, n, r) && id(i, [e, t, n, r]), i.callback);
}
function ed(e) {
  let t = wu(td).current;
  return (rd(t, e) && id(t, e), t.callback);
}
function td() {
  return { callback: null, cleanup: null, refs: [] };
}
function nd(e, t, n, r, i) {
  return (
    e.refs[0] !== t || e.refs[1] !== n || e.refs[2] !== r || e.refs[3] !== i
  );
}
function rd(e, t) {
  return e.refs.length !== t.length || e.refs.some((e, n) => e !== t[n]);
}
function id(e, t) {
  if (((e.refs = t), t.every((e) => e == null))) {
    e.callback = null;
    return;
  }
  e.callback = (n) => {
    if (((e.cleanup &&= (e.cleanup(), null)), n != null)) {
      let r = Array(t.length).fill(null);
      for (let e = 0; e < t.length; e += 1) {
        let i = t[e];
        if (i != null)
          switch (typeof i) {
            case `function`: {
              let t = i(n);
              typeof t == `function` && (r[e] = t);
              break;
            }
            case `object`:
              i.current = n;
              break;
            default:
          }
      }
      e.cleanup = () => {
        for (let e = 0; e < t.length; e += 1) {
          let n = t[e];
          if (n != null)
            switch (typeof n) {
              case `function`: {
                let t = r[e];
                typeof t == `function` ? t() : n(null);
                break;
              }
              case `object`:
                n.current = null;
                break;
              default:
            }
        }
      };
    }
  };
}
var ad = { ...m },
  od = ad.useInsertionEffect,
  sd = od && od !== ad.useLayoutEffect ? od : (e) => e();
function cd(e) {
  let t = wu(ld).current;
  return ((t.next = e), sd(t.effect), t.trampoline);
}
function ld() {
  let e = {
    next: void 0,
    callback: ud,
    trampoline: (...t) => e.callback?.(...t),
    effect: () => {
      e.callback = e.next;
    },
  };
  return e;
}
function ud() {}
function dd(e, t) {
  return function (n, ...r) {
    let i = new URL(e);
    return (
      i.searchParams.set(`code`, n.toString()),
      r.forEach((e) => i.searchParams.append(`args[]`, e)),
      `${t} error #${n}; visit ${i} for the full message.`
    );
  };
}
var fd = dd(`https://base-ui.com/production-error`, `Base UI`),
  pd = 19;
function md(e) {
  return pd >= e;
}
function hd(e) {
  if (!m.isValidElement(e)) return null;
  let t = e,
    n = t.props;
  return (md(19) ? n?.ref : t.ref) ?? null;
}
function gd(e, t) {
  let n = {};
  for (let r in e) {
    let i = e[r];
    if (t?.hasOwnProperty(r)) {
      let e = t[r](i);
      e != null && Object.assign(n, e);
      continue;
    }
    i === !0
      ? (n[`data-${r.toLowerCase()}`] = ``)
      : i && (n[`data-${r.toLowerCase()}`] = i.toString());
  }
  return n;
}
function _d(e, t) {
  return typeof e == `function` ? e(t) : e;
}
function vd(e, t) {
  return typeof e == `function` ? e(t) : e;
}
function yd(e, t, n = {}) {
  let r = t.render,
    i = bd(t, n);
  return n.enabled === !1 ? null : Cd(e, r, i, n.state ?? Iu);
}
function bd(e, t = {}) {
  let { className: n, style: r, render: i } = e,
    {
      state: a = Iu,
      ref: o,
      props: s,
      stateAttributesMapping: c,
      enabled: l = !0,
    } = t,
    u = l ? _d(n, a) : void 0,
    d = l ? vd(r, a) : void 0,
    f = l ? gd(a, c) : Iu,
    p = l && s ? xd(s) : void 0,
    m = l ? (Lu(f, p) ?? {}) : Iu;
  return (
    typeof document < `u` &&
      (l
        ? Array.isArray(o)
          ? (m.ref = ed([m.ref, hd(i), ...o]))
          : (m.ref = $u(m.ref, hd(i), o))
        : $u(null, null)),
    l
      ? (u !== void 0 && (m.className = Zu(m.className, u)),
        d !== void 0 && (m.style = Lu(m.style, d)),
        m)
      : Iu
  );
}
function xd(e) {
  return Array.isArray(e) ? Bu(e) : zu(void 0, e);
}
var Sd = Symbol.for(`react.lazy`);
function Cd(e, t, n, r) {
  if (t) {
    if (typeof t == `function`) return t(n, r);
    let e = zu(n, t.props);
    e.ref = n.ref;
    let i = t;
    return (
      i?.$$typeof === Sd && (i = m.Children.toArray(t)[0]),
      m.cloneElement(i, e)
    );
  }
  if (e && typeof e == `string`) return wd(e, n);
  throw Error(fd(8));
}
function wd(e, t) {
  return e === `button`
    ? (0, m.createElement)(`button`, { type: `button`, ...t, key: t.key })
    : e === `img`
      ? (0, m.createElement)(`img`, { alt: ``, ...t, key: t.key })
      : m.createElement(e, t);
}
function Td(e) {
  return e == null ? e : `current` in e ? e.current : e;
}
function Ed(e, t = !1, n = !1) {
  let [r, i] = m.useState(e && t ? `idle` : void 0),
    [a, o] = m.useState(e);
  return (
    e && !a && (o(!0), i(`starting`)),
    !e && a && r !== `ending` && !n && i(`ending`),
    !e && !a && r === `ending` && i(void 0),
    Su(() => {
      if (!e && a && r !== `ending` && n) {
        let e = Mu.request(() => {
          i(`ending`);
        });
        return () => {
          Mu.cancel(e);
        };
      }
    }, [e, a, r, n]),
    Su(() => {
      if (!e || t) return;
      let n = Mu.request(() => {
        i(void 0);
      });
      return () => {
        Mu.cancel(n);
      };
    }, [t, e]),
    Su(() => {
      if (!e || !t) return;
      e && a && r !== `idle` && i(`starting`);
      let n = Mu.request(() => {
        i(`idle`);
      });
      return () => {
        Mu.cancel(n);
      };
    }, [t, e, a, r]),
    { mounted: a, setMounted: o, transitionStatus: r }
  );
}
var Dd = (function (e) {
    return (
      (e.startingStyle = `data-starting-style`),
      (e.endingStyle = `data-ending-style`),
      e
    );
  })({}),
  Od = { [Dd.startingStyle]: `` },
  kd = { [Dd.endingStyle]: `` },
  Ad = {
    transitionStatus(e) {
      return e === `starting` ? Od : e === `ending` ? kd : null;
    },
  };
function jd(e, t = !1, n = !0) {
  let r = Nu();
  return cd((i, a = null) => {
    r.cancel();
    let o = Td(e);
    if (o == null) return;
    let s = o,
      c = () => {
        Ic.flushSync(i);
      };
    if (
      typeof s.getAnimations != `function` ||
      globalThis.BASE_UI_ANIMATIONS_DISABLED
    ) {
      i();
      return;
    }
    function l() {
      Promise.all(s.getAnimations().map((e) => e.finished))
        .then(() => {
          a?.aborted || c();
        })
        .catch(() => {
          if (n) {
            a?.aborted || c();
            return;
          }
          let e = s.getAnimations();
          !a?.aborted &&
            e.length > 0 &&
            e.some((e) => e.pending || e.playState !== `finished`) &&
            l();
        });
    }
    if (t) {
      let e = Dd.startingStyle;
      if (!s.hasAttribute(e)) {
        r.request(l);
        return;
      }
      let t = new MutationObserver(() => {
        s.hasAttribute(e) || (t.disconnect(), l());
      });
      (t.observe(s, { attributes: !0, attributeFilter: [e] }),
        a?.addEventListener(`abort`, () => t.disconnect(), { once: !0 }));
      return;
    }
    r.request(l);
  });
}
function Md(e) {
  let { enabled: t = !0, open: n, ref: r, onComplete: i } = e,
    a = cd(i),
    o = jd(r, n, !1);
  m.useEffect(() => {
    if (!t) return;
    let e = new AbortController();
    return (
      o(a, e.signal),
      () => {
        e.abort();
      }
    );
  }, [t, n, a, o]);
}
function Nd(e) {
  var t,
    n,
    r = ``;
  if (typeof e == `string` || typeof e == `number`) r += e;
  else if (typeof e == `object`)
    if (Array.isArray(e)) {
      var i = e.length;
      for (t = 0; t < i; t++)
        e[t] && (n = Nd(e[t])) && (r && (r += ` `), (r += n));
    } else for (n in e) e[n] && (r && (r += ` `), (r += n));
  return r;
}
function Pd() {
  for (var e, t, n = 0, r = ``, i = arguments.length; n < i; n++)
    (e = arguments[n]) && (t = Nd(e)) && (r && (r += ` `), (r += t));
  return r;
}
var Fd = 365.2425,
  Id = 6048e5,
  Ld = 864e5,
  Rd = 43200,
  zd = 1440,
  Bd = 3600 * 24;
(Bd * 7, ((Bd * Fd) / 12) * 3);
var Vd = Symbol.for(`constructDateFrom`);
function Hd(e, t) {
  return typeof e == `function`
    ? e(t)
    : e && typeof e == `object` && Vd in e
      ? e[Vd](t)
      : e instanceof Date
        ? new e.constructor(t)
        : new Date(t);
}
function Ud(e, t) {
  return Hd(t || e, e);
}
var Wd = {};
function Gd() {
  return Wd;
}
function Kd(e, t) {
  let n = Gd(),
    r =
      t?.weekStartsOn ??
      t?.locale?.options?.weekStartsOn ??
      n.weekStartsOn ??
      n.locale?.options?.weekStartsOn ??
      0,
    i = Ud(e, t?.in),
    a = i.getDay(),
    o = (a < r ? 7 : 0) + a - r;
  return (i.setDate(i.getDate() - o), i.setHours(0, 0, 0, 0), i);
}
function qd(e, t) {
  return Kd(e, { ...t, weekStartsOn: 1 });
}
function Jd(e, t) {
  let n = Ud(e, t?.in),
    r = n.getFullYear(),
    i = Hd(n, 0);
  (i.setFullYear(r + 1, 0, 4), i.setHours(0, 0, 0, 0));
  let a = qd(i),
    o = Hd(n, 0);
  (o.setFullYear(r, 0, 4), o.setHours(0, 0, 0, 0));
  let s = qd(o);
  return n.getTime() >= a.getTime()
    ? r + 1
    : n.getTime() >= s.getTime()
      ? r
      : r - 1;
}
function Yd(e) {
  let t = Ud(e),
    n = new Date(
      Date.UTC(
        t.getFullYear(),
        t.getMonth(),
        t.getDate(),
        t.getHours(),
        t.getMinutes(),
        t.getSeconds(),
        t.getMilliseconds(),
      ),
    );
  return (n.setUTCFullYear(t.getFullYear()), e - +n);
}
function Xd(e, ...t) {
  let n = Hd.bind(null, e || t.find((e) => typeof e == `object`));
  return t.map(n);
}
function Zd(e, t) {
  let n = Ud(e, t?.in);
  return (n.setHours(0, 0, 0, 0), n);
}
function Qd(e, t, n) {
  let [r, i] = Xd(n?.in, e, t),
    a = Zd(r),
    o = Zd(i),
    s = +a - Yd(a),
    c = +o - Yd(o);
  return Math.round((s - c) / Ld);
}
function $d(e, t) {
  let n = Jd(e, t),
    r = Hd(t?.in || e, 0);
  return (r.setFullYear(n, 0, 4), r.setHours(0, 0, 0, 0), qd(r));
}
function ef(e, t) {
  let n = Ud(e) - +Ud(t);
  return n < 0 ? -1 : n > 0 ? 1 : n;
}
function tf(e) {
  return Hd(e, Date.now());
}
function nf(e) {
  return (
    e instanceof Date ||
    (typeof e == `object` &&
      Object.prototype.toString.call(e) === `[object Date]`)
  );
}
function rf(e) {
  return !((!nf(e) && typeof e != `number`) || isNaN(+Ud(e)));
}
function af(e, t, n) {
  let [r, i] = Xd(n?.in, e, t),
    a = r.getFullYear() - i.getFullYear(),
    o = r.getMonth() - i.getMonth();
  return a * 12 + o;
}
function of(e) {
  return (t) => {
    let n = (e ? Math[e] : Math.trunc)(t);
    return n === 0 ? 0 : n;
  };
}
function sf(e, t) {
  return Ud(e) - +Ud(t);
}
function cf(e, t) {
  let n = Ud(e, t?.in);
  return (n.setHours(23, 59, 59, 999), n);
}
function lf(e, t) {
  let n = Ud(e, t?.in),
    r = n.getMonth();
  return (
    n.setFullYear(n.getFullYear(), r + 1, 0),
    n.setHours(23, 59, 59, 999),
    n
  );
}
function uf(e, t) {
  let n = Ud(e, t?.in);
  return +cf(n, t) == +lf(n, t);
}
function df(e, t, n) {
  let [r, i, a] = Xd(n?.in, e, e, t),
    o = ef(i, a),
    s = Math.abs(af(i, a));
  if (s < 1) return 0;
  (i.getMonth() === 1 && i.getDate() > 27 && i.setDate(30),
    i.setMonth(i.getMonth() - o * s));
  let c = ef(i, a) === -o;
  uf(r) && s === 1 && ef(r, a) === 1 && (c = !1);
  let l = o * (s - +c);
  return l === 0 ? 0 : l;
}
function ff(e, t, n) {
  let r = sf(e, t) / 1e3;
  return of(n?.roundingMethod)(r);
}
function pf(e, t) {
  let n = Ud(e, t?.in);
  return (n.setFullYear(n.getFullYear(), 0, 1), n.setHours(0, 0, 0, 0), n);
}
var mf = {
    lessThanXSeconds: {
      one: `less than a second`,
      other: `less than {{count}} seconds`,
    },
    xSeconds: { one: `1 second`, other: `{{count}} seconds` },
    halfAMinute: `half a minute`,
    lessThanXMinutes: {
      one: `less than a minute`,
      other: `less than {{count}} minutes`,
    },
    xMinutes: { one: `1 minute`, other: `{{count}} minutes` },
    aboutXHours: { one: `about 1 hour`, other: `about {{count}} hours` },
    xHours: { one: `1 hour`, other: `{{count}} hours` },
    xDays: { one: `1 day`, other: `{{count}} days` },
    aboutXWeeks: { one: `about 1 week`, other: `about {{count}} weeks` },
    xWeeks: { one: `1 week`, other: `{{count}} weeks` },
    aboutXMonths: { one: `about 1 month`, other: `about {{count}} months` },
    xMonths: { one: `1 month`, other: `{{count}} months` },
    aboutXYears: { one: `about 1 year`, other: `about {{count}} years` },
    xYears: { one: `1 year`, other: `{{count}} years` },
    overXYears: { one: `over 1 year`, other: `over {{count}} years` },
    almostXYears: { one: `almost 1 year`, other: `almost {{count}} years` },
  },
  hf = (e, t, n) => {
    let r,
      i = mf[e];
    return (
      (r =
        typeof i == `string`
          ? i
          : t === 1
            ? i.one
            : i.other.replace(`{{count}}`, t.toString())),
      n?.addSuffix
        ? n.comparison && n.comparison > 0
          ? `in ` + r
          : r + ` ago`
        : r
    );
  };
function gf(e) {
  return (t = {}) => {
    let n = t.width ? String(t.width) : e.defaultWidth;
    return e.formats[n] || e.formats[e.defaultWidth];
  };
}
var _f = {
    date: gf({
      formats: {
        full: `EEEE, MMMM do, y`,
        long: `MMMM do, y`,
        medium: `MMM d, y`,
        short: `MM/dd/yyyy`,
      },
      defaultWidth: `full`,
    }),
    time: gf({
      formats: {
        full: `h:mm:ss a zzzz`,
        long: `h:mm:ss a z`,
        medium: `h:mm:ss a`,
        short: `h:mm a`,
      },
      defaultWidth: `full`,
    }),
    dateTime: gf({
      formats: {
        full: `{{date}} 'at' {{time}}`,
        long: `{{date}} 'at' {{time}}`,
        medium: `{{date}}, {{time}}`,
        short: `{{date}}, {{time}}`,
      },
      defaultWidth: `full`,
    }),
  },
  vf = {
    lastWeek: `'last' eeee 'at' p`,
    yesterday: `'yesterday at' p`,
    today: `'today at' p`,
    tomorrow: `'tomorrow at' p`,
    nextWeek: `eeee 'at' p`,
    other: `P`,
  },
  yf = (e, t, n, r) => vf[e];
function bf(e) {
  return (t, n) => {
    let r = n?.context ? String(n.context) : `standalone`,
      i;
    if (r === `formatting` && e.formattingValues) {
      let t = e.defaultFormattingWidth || e.defaultWidth,
        r = n?.width ? String(n.width) : t;
      i = e.formattingValues[r] || e.formattingValues[t];
    } else {
      let t = e.defaultWidth,
        r = n?.width ? String(n.width) : e.defaultWidth;
      i = e.values[r] || e.values[t];
    }
    let a = e.argumentCallback ? e.argumentCallback(t) : t;
    return i[a];
  };
}
var xf = {
  ordinalNumber: (e, t) => {
    let n = Number(e),
      r = n % 100;
    if (r > 20 || r < 10)
      switch (r % 10) {
        case 1:
          return n + `st`;
        case 2:
          return n + `nd`;
        case 3:
          return n + `rd`;
      }
    return n + `th`;
  },
  era: bf({
    values: {
      narrow: [`B`, `A`],
      abbreviated: [`BC`, `AD`],
      wide: [`Before Christ`, `Anno Domini`],
    },
    defaultWidth: `wide`,
  }),
  quarter: bf({
    values: {
      narrow: [`1`, `2`, `3`, `4`],
      abbreviated: [`Q1`, `Q2`, `Q3`, `Q4`],
      wide: [`1st quarter`, `2nd quarter`, `3rd quarter`, `4th quarter`],
    },
    defaultWidth: `wide`,
    argumentCallback: (e) => e - 1,
  }),
  month: bf({
    values: {
      narrow: [`J`, `F`, `M`, `A`, `M`, `J`, `J`, `A`, `S`, `O`, `N`, `D`],
      abbreviated: [
        `Jan`,
        `Feb`,
        `Mar`,
        `Apr`,
        `May`,
        `Jun`,
        `Jul`,
        `Aug`,
        `Sep`,
        `Oct`,
        `Nov`,
        `Dec`,
      ],
      wide: [
        `January`,
        `February`,
        `March`,
        `April`,
        `May`,
        `June`,
        `July`,
        `August`,
        `September`,
        `October`,
        `November`,
        `December`,
      ],
    },
    defaultWidth: `wide`,
  }),
  day: bf({
    values: {
      narrow: [`S`, `M`, `T`, `W`, `T`, `F`, `S`],
      short: [`Su`, `Mo`, `Tu`, `We`, `Th`, `Fr`, `Sa`],
      abbreviated: [`Sun`, `Mon`, `Tue`, `Wed`, `Thu`, `Fri`, `Sat`],
      wide: [
        `Sunday`,
        `Monday`,
        `Tuesday`,
        `Wednesday`,
        `Thursday`,
        `Friday`,
        `Saturday`,
      ],
    },
    defaultWidth: `wide`,
  }),
  dayPeriod: bf({
    values: {
      narrow: {
        am: `a`,
        pm: `p`,
        midnight: `mi`,
        noon: `n`,
        morning: `morning`,
        afternoon: `afternoon`,
        evening: `evening`,
        night: `night`,
      },
      abbreviated: {
        am: `AM`,
        pm: `PM`,
        midnight: `midnight`,
        noon: `noon`,
        morning: `morning`,
        afternoon: `afternoon`,
        evening: `evening`,
        night: `night`,
      },
      wide: {
        am: `a.m.`,
        pm: `p.m.`,
        midnight: `midnight`,
        noon: `noon`,
        morning: `morning`,
        afternoon: `afternoon`,
        evening: `evening`,
        night: `night`,
      },
    },
    defaultWidth: `wide`,
    formattingValues: {
      narrow: {
        am: `a`,
        pm: `p`,
        midnight: `mi`,
        noon: `n`,
        morning: `in the morning`,
        afternoon: `in the afternoon`,
        evening: `in the evening`,
        night: `at night`,
      },
      abbreviated: {
        am: `AM`,
        pm: `PM`,
        midnight: `midnight`,
        noon: `noon`,
        morning: `in the morning`,
        afternoon: `in the afternoon`,
        evening: `in the evening`,
        night: `at night`,
      },
      wide: {
        am: `a.m.`,
        pm: `p.m.`,
        midnight: `midnight`,
        noon: `noon`,
        morning: `in the morning`,
        afternoon: `in the afternoon`,
        evening: `in the evening`,
        night: `at night`,
      },
    },
    defaultFormattingWidth: `wide`,
  }),
};
function Sf(e) {
  return (t, n = {}) => {
    let r = n.width,
      i = (r && e.matchPatterns[r]) || e.matchPatterns[e.defaultMatchWidth],
      a = t.match(i);
    if (!a) return null;
    let o = a[0],
      s = (r && e.parsePatterns[r]) || e.parsePatterns[e.defaultParseWidth],
      c = Array.isArray(s) ? wf(s, (e) => e.test(o)) : Cf(s, (e) => e.test(o)),
      l;
    ((l = e.valueCallback ? e.valueCallback(c) : c),
      (l = n.valueCallback ? n.valueCallback(l) : l));
    let u = t.slice(o.length);
    return { value: l, rest: u };
  };
}
function Cf(e, t) {
  for (let n in e)
    if (Object.prototype.hasOwnProperty.call(e, n) && t(e[n])) return n;
}
function wf(e, t) {
  for (let n = 0; n < e.length; n++) if (t(e[n])) return n;
}
function Tf(e) {
  return (t, n = {}) => {
    let r = t.match(e.matchPattern);
    if (!r) return null;
    let i = r[0],
      a = t.match(e.parsePattern);
    if (!a) return null;
    let o = e.valueCallback ? e.valueCallback(a[0]) : a[0];
    o = n.valueCallback ? n.valueCallback(o) : o;
    let s = t.slice(i.length);
    return { value: o, rest: s };
  };
}
var Ef = {
  code: `en-US`,
  formatDistance: hf,
  formatLong: _f,
  formatRelative: yf,
  localize: xf,
  match: {
    ordinalNumber: Tf({
      matchPattern: /^(\d+)(th|st|nd|rd)?/i,
      parsePattern: /\d+/i,
      valueCallback: (e) => parseInt(e, 10),
    }),
    era: Sf({
      matchPatterns: {
        narrow: /^(b|a)/i,
        abbreviated:
          /^(b\.?\s?c\.?|b\.?\s?c\.?\s?e\.?|a\.?\s?d\.?|c\.?\s?e\.?)/i,
        wide: /^(before christ|before common era|anno domini|common era)/i,
      },
      defaultMatchWidth: `wide`,
      parsePatterns: { any: [/^b/i, /^(a|c)/i] },
      defaultParseWidth: `any`,
    }),
    quarter: Sf({
      matchPatterns: {
        narrow: /^[1234]/i,
        abbreviated: /^q[1234]/i,
        wide: /^[1234](th|st|nd|rd)? quarter/i,
      },
      defaultMatchWidth: `wide`,
      parsePatterns: { any: [/1/i, /2/i, /3/i, /4/i] },
      defaultParseWidth: `any`,
      valueCallback: (e) => e + 1,
    }),
    month: Sf({
      matchPatterns: {
        narrow: /^[jfmasond]/i,
        abbreviated: /^(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)/i,
        wide: /^(january|february|march|april|may|june|july|august|september|october|november|december)/i,
      },
      defaultMatchWidth: `wide`,
      parsePatterns: {
        narrow: [
          /^j/i,
          /^f/i,
          /^m/i,
          /^a/i,
          /^m/i,
          /^j/i,
          /^j/i,
          /^a/i,
          /^s/i,
          /^o/i,
          /^n/i,
          /^d/i,
        ],
        any: [
          /^ja/i,
          /^f/i,
          /^mar/i,
          /^ap/i,
          /^may/i,
          /^jun/i,
          /^jul/i,
          /^au/i,
          /^s/i,
          /^o/i,
          /^n/i,
          /^d/i,
        ],
      },
      defaultParseWidth: `any`,
    }),
    day: Sf({
      matchPatterns: {
        narrow: /^[smtwf]/i,
        short: /^(su|mo|tu|we|th|fr|sa)/i,
        abbreviated: /^(sun|mon|tue|wed|thu|fri|sat)/i,
        wide: /^(sunday|monday|tuesday|wednesday|thursday|friday|saturday)/i,
      },
      defaultMatchWidth: `wide`,
      parsePatterns: {
        narrow: [/^s/i, /^m/i, /^t/i, /^w/i, /^t/i, /^f/i, /^s/i],
        any: [/^su/i, /^m/i, /^tu/i, /^w/i, /^th/i, /^f/i, /^sa/i],
      },
      defaultParseWidth: `any`,
    }),
    dayPeriod: Sf({
      matchPatterns: {
        narrow: /^(a|p|mi|n|(in the|at) (morning|afternoon|evening|night))/i,
        any: /^([ap]\.?\s?m\.?|midnight|noon|(in the|at) (morning|afternoon|evening|night))/i,
      },
      defaultMatchWidth: `any`,
      parsePatterns: {
        any: {
          am: /^a/i,
          pm: /^p/i,
          midnight: /^mi/i,
          noon: /^no/i,
          morning: /morning/i,
          afternoon: /afternoon/i,
          evening: /evening/i,
          night: /night/i,
        },
      },
      defaultParseWidth: `any`,
    }),
  },
  options: { weekStartsOn: 0, firstWeekContainsDate: 1 },
};
function Df(e, t) {
  let n = Ud(e, t?.in);
  return Qd(n, pf(n)) + 1;
}
function Of(e, t) {
  let n = Ud(e, t?.in),
    r = qd(n) - +$d(n);
  return Math.round(r / Id) + 1;
}
function kf(e, t) {
  let n = Ud(e, t?.in),
    r = n.getFullYear(),
    i = Gd(),
    a =
      t?.firstWeekContainsDate ??
      t?.locale?.options?.firstWeekContainsDate ??
      i.firstWeekContainsDate ??
      i.locale?.options?.firstWeekContainsDate ??
      1,
    o = Hd(t?.in || e, 0);
  (o.setFullYear(r + 1, 0, a), o.setHours(0, 0, 0, 0));
  let s = Kd(o, t),
    c = Hd(t?.in || e, 0);
  (c.setFullYear(r, 0, a), c.setHours(0, 0, 0, 0));
  let l = Kd(c, t);
  return +n >= +s ? r + 1 : +n >= +l ? r : r - 1;
}
function Af(e, t) {
  let n = Gd(),
    r =
      t?.firstWeekContainsDate ??
      t?.locale?.options?.firstWeekContainsDate ??
      n.firstWeekContainsDate ??
      n.locale?.options?.firstWeekContainsDate ??
      1,
    i = kf(e, t),
    a = Hd(t?.in || e, 0);
  return (a.setFullYear(i, 0, r), a.setHours(0, 0, 0, 0), Kd(a, t));
}
function jf(e, t) {
  let n = Ud(e, t?.in),
    r = Kd(n, t) - +Af(n, t);
  return Math.round(r / Id) + 1;
}
function Y(e, t) {
  return (e < 0 ? `-` : ``) + Math.abs(e).toString().padStart(t, `0`);
}
var Mf = {
    y(e, t) {
      let n = e.getFullYear(),
        r = n > 0 ? n : 1 - n;
      return Y(t === `yy` ? r % 100 : r, t.length);
    },
    M(e, t) {
      let n = e.getMonth();
      return t === `M` ? String(n + 1) : Y(n + 1, 2);
    },
    d(e, t) {
      return Y(e.getDate(), t.length);
    },
    a(e, t) {
      let n = e.getHours() / 12 >= 1 ? `pm` : `am`;
      switch (t) {
        case `a`:
        case `aa`:
          return n.toUpperCase();
        case `aaa`:
          return n;
        case `aaaaa`:
          return n[0];
        default:
          return n === `am` ? `a.m.` : `p.m.`;
      }
    },
    h(e, t) {
      return Y(e.getHours() % 12 || 12, t.length);
    },
    H(e, t) {
      return Y(e.getHours(), t.length);
    },
    m(e, t) {
      return Y(e.getMinutes(), t.length);
    },
    s(e, t) {
      return Y(e.getSeconds(), t.length);
    },
    S(e, t) {
      let n = t.length,
        r = e.getMilliseconds();
      return Y(Math.trunc(r * 10 ** (n - 3)), t.length);
    },
  },
  Nf = {
    am: `am`,
    pm: `pm`,
    midnight: `midnight`,
    noon: `noon`,
    morning: `morning`,
    afternoon: `afternoon`,
    evening: `evening`,
    night: `night`,
  },
  Pf = {
    G: function (e, t, n) {
      let r = +(e.getFullYear() > 0);
      switch (t) {
        case `G`:
        case `GG`:
        case `GGG`:
          return n.era(r, { width: `abbreviated` });
        case `GGGGG`:
          return n.era(r, { width: `narrow` });
        default:
          return n.era(r, { width: `wide` });
      }
    },
    y: function (e, t, n) {
      if (t === `yo`) {
        let t = e.getFullYear(),
          r = t > 0 ? t : 1 - t;
        return n.ordinalNumber(r, { unit: `year` });
      }
      return Mf.y(e, t);
    },
    Y: function (e, t, n, r) {
      let i = kf(e, r),
        a = i > 0 ? i : 1 - i;
      return t === `YY`
        ? Y(a % 100, 2)
        : t === `Yo`
          ? n.ordinalNumber(a, { unit: `year` })
          : Y(a, t.length);
    },
    R: function (e, t) {
      return Y(Jd(e), t.length);
    },
    u: function (e, t) {
      return Y(e.getFullYear(), t.length);
    },
    Q: function (e, t, n) {
      let r = Math.ceil((e.getMonth() + 1) / 3);
      switch (t) {
        case `Q`:
          return String(r);
        case `QQ`:
          return Y(r, 2);
        case `Qo`:
          return n.ordinalNumber(r, { unit: `quarter` });
        case `QQQ`:
          return n.quarter(r, { width: `abbreviated`, context: `formatting` });
        case `QQQQQ`:
          return n.quarter(r, { width: `narrow`, context: `formatting` });
        default:
          return n.quarter(r, { width: `wide`, context: `formatting` });
      }
    },
    q: function (e, t, n) {
      let r = Math.ceil((e.getMonth() + 1) / 3);
      switch (t) {
        case `q`:
          return String(r);
        case `qq`:
          return Y(r, 2);
        case `qo`:
          return n.ordinalNumber(r, { unit: `quarter` });
        case `qqq`:
          return n.quarter(r, { width: `abbreviated`, context: `standalone` });
        case `qqqqq`:
          return n.quarter(r, { width: `narrow`, context: `standalone` });
        default:
          return n.quarter(r, { width: `wide`, context: `standalone` });
      }
    },
    M: function (e, t, n) {
      let r = e.getMonth();
      switch (t) {
        case `M`:
        case `MM`:
          return Mf.M(e, t);
        case `Mo`:
          return n.ordinalNumber(r + 1, { unit: `month` });
        case `MMM`:
          return n.month(r, { width: `abbreviated`, context: `formatting` });
        case `MMMMM`:
          return n.month(r, { width: `narrow`, context: `formatting` });
        default:
          return n.month(r, { width: `wide`, context: `formatting` });
      }
    },
    L: function (e, t, n) {
      let r = e.getMonth();
      switch (t) {
        case `L`:
          return String(r + 1);
        case `LL`:
          return Y(r + 1, 2);
        case `Lo`:
          return n.ordinalNumber(r + 1, { unit: `month` });
        case `LLL`:
          return n.month(r, { width: `abbreviated`, context: `standalone` });
        case `LLLLL`:
          return n.month(r, { width: `narrow`, context: `standalone` });
        default:
          return n.month(r, { width: `wide`, context: `standalone` });
      }
    },
    w: function (e, t, n, r) {
      let i = jf(e, r);
      return t === `wo` ? n.ordinalNumber(i, { unit: `week` }) : Y(i, t.length);
    },
    I: function (e, t, n) {
      let r = Of(e);
      return t === `Io` ? n.ordinalNumber(r, { unit: `week` }) : Y(r, t.length);
    },
    d: function (e, t, n) {
      return t === `do`
        ? n.ordinalNumber(e.getDate(), { unit: `date` })
        : Mf.d(e, t);
    },
    D: function (e, t, n) {
      let r = Df(e);
      return t === `Do`
        ? n.ordinalNumber(r, { unit: `dayOfYear` })
        : Y(r, t.length);
    },
    E: function (e, t, n) {
      let r = e.getDay();
      switch (t) {
        case `E`:
        case `EE`:
        case `EEE`:
          return n.day(r, { width: `abbreviated`, context: `formatting` });
        case `EEEEE`:
          return n.day(r, { width: `narrow`, context: `formatting` });
        case `EEEEEE`:
          return n.day(r, { width: `short`, context: `formatting` });
        default:
          return n.day(r, { width: `wide`, context: `formatting` });
      }
    },
    e: function (e, t, n, r) {
      let i = e.getDay(),
        a = (i - r.weekStartsOn + 8) % 7 || 7;
      switch (t) {
        case `e`:
          return String(a);
        case `ee`:
          return Y(a, 2);
        case `eo`:
          return n.ordinalNumber(a, { unit: `day` });
        case `eee`:
          return n.day(i, { width: `abbreviated`, context: `formatting` });
        case `eeeee`:
          return n.day(i, { width: `narrow`, context: `formatting` });
        case `eeeeee`:
          return n.day(i, { width: `short`, context: `formatting` });
        default:
          return n.day(i, { width: `wide`, context: `formatting` });
      }
    },
    c: function (e, t, n, r) {
      let i = e.getDay(),
        a = (i - r.weekStartsOn + 8) % 7 || 7;
      switch (t) {
        case `c`:
          return String(a);
        case `cc`:
          return Y(a, t.length);
        case `co`:
          return n.ordinalNumber(a, { unit: `day` });
        case `ccc`:
          return n.day(i, { width: `abbreviated`, context: `standalone` });
        case `ccccc`:
          return n.day(i, { width: `narrow`, context: `standalone` });
        case `cccccc`:
          return n.day(i, { width: `short`, context: `standalone` });
        default:
          return n.day(i, { width: `wide`, context: `standalone` });
      }
    },
    i: function (e, t, n) {
      let r = e.getDay(),
        i = r === 0 ? 7 : r;
      switch (t) {
        case `i`:
          return String(i);
        case `ii`:
          return Y(i, t.length);
        case `io`:
          return n.ordinalNumber(i, { unit: `day` });
        case `iii`:
          return n.day(r, { width: `abbreviated`, context: `formatting` });
        case `iiiii`:
          return n.day(r, { width: `narrow`, context: `formatting` });
        case `iiiiii`:
          return n.day(r, { width: `short`, context: `formatting` });
        default:
          return n.day(r, { width: `wide`, context: `formatting` });
      }
    },
    a: function (e, t, n) {
      let r = e.getHours() / 12 >= 1 ? `pm` : `am`;
      switch (t) {
        case `a`:
        case `aa`:
          return n.dayPeriod(r, {
            width: `abbreviated`,
            context: `formatting`,
          });
        case `aaa`:
          return n
            .dayPeriod(r, { width: `abbreviated`, context: `formatting` })
            .toLowerCase();
        case `aaaaa`:
          return n.dayPeriod(r, { width: `narrow`, context: `formatting` });
        default:
          return n.dayPeriod(r, { width: `wide`, context: `formatting` });
      }
    },
    b: function (e, t, n) {
      let r = e.getHours(),
        i;
      switch (
        ((i =
          r === 12
            ? Nf.noon
            : r === 0
              ? Nf.midnight
              : r / 12 >= 1
                ? `pm`
                : `am`),
        t)
      ) {
        case `b`:
        case `bb`:
          return n.dayPeriod(i, {
            width: `abbreviated`,
            context: `formatting`,
          });
        case `bbb`:
          return n
            .dayPeriod(i, { width: `abbreviated`, context: `formatting` })
            .toLowerCase();
        case `bbbbb`:
          return n.dayPeriod(i, { width: `narrow`, context: `formatting` });
        default:
          return n.dayPeriod(i, { width: `wide`, context: `formatting` });
      }
    },
    B: function (e, t, n) {
      let r = e.getHours(),
        i;
      switch (
        ((i =
          r >= 17
            ? Nf.evening
            : r >= 12
              ? Nf.afternoon
              : r >= 4
                ? Nf.morning
                : Nf.night),
        t)
      ) {
        case `B`:
        case `BB`:
        case `BBB`:
          return n.dayPeriod(i, {
            width: `abbreviated`,
            context: `formatting`,
          });
        case `BBBBB`:
          return n.dayPeriod(i, { width: `narrow`, context: `formatting` });
        default:
          return n.dayPeriod(i, { width: `wide`, context: `formatting` });
      }
    },
    h: function (e, t, n) {
      if (t === `ho`) {
        let t = e.getHours() % 12;
        return (t === 0 && (t = 12), n.ordinalNumber(t, { unit: `hour` }));
      }
      return Mf.h(e, t);
    },
    H: function (e, t, n) {
      return t === `Ho`
        ? n.ordinalNumber(e.getHours(), { unit: `hour` })
        : Mf.H(e, t);
    },
    K: function (e, t, n) {
      let r = e.getHours() % 12;
      return t === `Ko` ? n.ordinalNumber(r, { unit: `hour` }) : Y(r, t.length);
    },
    k: function (e, t, n) {
      let r = e.getHours();
      return (
        r === 0 && (r = 24),
        t === `ko` ? n.ordinalNumber(r, { unit: `hour` }) : Y(r, t.length)
      );
    },
    m: function (e, t, n) {
      return t === `mo`
        ? n.ordinalNumber(e.getMinutes(), { unit: `minute` })
        : Mf.m(e, t);
    },
    s: function (e, t, n) {
      return t === `so`
        ? n.ordinalNumber(e.getSeconds(), { unit: `second` })
        : Mf.s(e, t);
    },
    S: function (e, t) {
      return Mf.S(e, t);
    },
    X: function (e, t, n) {
      let r = e.getTimezoneOffset();
      if (r === 0) return `Z`;
      switch (t) {
        case `X`:
          return If(r);
        case `XXXX`:
        case `XX`:
          return Lf(r);
        default:
          return Lf(r, `:`);
      }
    },
    x: function (e, t, n) {
      let r = e.getTimezoneOffset();
      switch (t) {
        case `x`:
          return If(r);
        case `xxxx`:
        case `xx`:
          return Lf(r);
        default:
          return Lf(r, `:`);
      }
    },
    O: function (e, t, n) {
      let r = e.getTimezoneOffset();
      switch (t) {
        case `O`:
        case `OO`:
        case `OOO`:
          return `GMT` + Ff(r, `:`);
        default:
          return `GMT` + Lf(r, `:`);
      }
    },
    z: function (e, t, n) {
      let r = e.getTimezoneOffset();
      switch (t) {
        case `z`:
        case `zz`:
        case `zzz`:
          return `GMT` + Ff(r, `:`);
        default:
          return `GMT` + Lf(r, `:`);
      }
    },
    t: function (e, t, n) {
      return Y(Math.trunc(e / 1e3), t.length);
    },
    T: function (e, t, n) {
      return Y(+e, t.length);
    },
  };
function Ff(e, t = ``) {
  let n = e > 0 ? `-` : `+`,
    r = Math.abs(e),
    i = Math.trunc(r / 60),
    a = r % 60;
  return a === 0 ? n + String(i) : n + String(i) + t + Y(a, 2);
}
function If(e, t) {
  return e % 60 == 0 ? (e > 0 ? `-` : `+`) + Y(Math.abs(e) / 60, 2) : Lf(e, t);
}
function Lf(e, t = ``) {
  let n = e > 0 ? `-` : `+`,
    r = Math.abs(e),
    i = Y(Math.trunc(r / 60), 2),
    a = Y(r % 60, 2);
  return n + i + t + a;
}
var Rf = (e, t) => {
    switch (e) {
      case `P`:
        return t.date({ width: `short` });
      case `PP`:
        return t.date({ width: `medium` });
      case `PPP`:
        return t.date({ width: `long` });
      default:
        return t.date({ width: `full` });
    }
  },
  zf = (e, t) => {
    switch (e) {
      case `p`:
        return t.time({ width: `short` });
      case `pp`:
        return t.time({ width: `medium` });
      case `ppp`:
        return t.time({ width: `long` });
      default:
        return t.time({ width: `full` });
    }
  },
  Bf = {
    p: zf,
    P: (e, t) => {
      let n = e.match(/(P+)(p+)?/) || [],
        r = n[1],
        i = n[2];
      if (!i) return Rf(e, t);
      let a;
      switch (r) {
        case `P`:
          a = t.dateTime({ width: `short` });
          break;
        case `PP`:
          a = t.dateTime({ width: `medium` });
          break;
        case `PPP`:
          a = t.dateTime({ width: `long` });
          break;
        default:
          a = t.dateTime({ width: `full` });
          break;
      }
      return a.replace(`{{date}}`, Rf(r, t)).replace(`{{time}}`, zf(i, t));
    },
  },
  Vf = /^D+$/,
  Hf = /^Y+$/,
  Uf = [`D`, `DD`, `YY`, `YYYY`];
function Wf(e) {
  return Vf.test(e);
}
function Gf(e) {
  return Hf.test(e);
}
function Kf(e, t, n) {
  let r = qf(e, t, n);
  if ((console.warn(r), Uf.includes(e))) throw RangeError(r);
}
function qf(e, t, n) {
  let r = e[0] === `Y` ? `years` : `days of the month`;
  return `Use \`${e.toLowerCase()}\` instead of \`${e}\` (in \`${t}\`) for formatting ${r} to the input \`${n}\`; see: https://github.com/date-fns/date-fns/blob/master/docs/unicodeTokens.md`;
}
var Jf = /[yYQqMLwIdDecihHKkms]o|(\w)\1*|''|'(''|[^'])+('|$)|./g,
  Yf = /P+p+|P+|p+|''|'(''|[^'])+('|$)|./g,
  Xf = /^'([^]*?)'?$/,
  Zf = /''/g,
  Qf = /[a-zA-Z]/;
function $f(e, t, n) {
  let r = Gd(),
    i = n?.locale ?? r.locale ?? Ef,
    a =
      n?.firstWeekContainsDate ??
      n?.locale?.options?.firstWeekContainsDate ??
      r.firstWeekContainsDate ??
      r.locale?.options?.firstWeekContainsDate ??
      1,
    o =
      n?.weekStartsOn ??
      n?.locale?.options?.weekStartsOn ??
      r.weekStartsOn ??
      r.locale?.options?.weekStartsOn ??
      0,
    s = Ud(e, n?.in);
  if (!rf(s)) throw RangeError(`Invalid time value`);
  let c = t
    .match(Yf)
    .map((e) => {
      let t = e[0];
      if (t === `p` || t === `P`) {
        let n = Bf[t];
        return n(e, i.formatLong);
      }
      return e;
    })
    .join(``)
    .match(Jf)
    .map((e) => {
      if (e === `''`) return { isToken: !1, value: `'` };
      let t = e[0];
      if (t === `'`) return { isToken: !1, value: ep(e) };
      if (Pf[t]) return { isToken: !0, value: e };
      if (t.match(Qf))
        throw RangeError(
          "Format string contains an unescaped latin alphabet character `" +
            t +
            "`",
        );
      return { isToken: !1, value: e };
    });
  i.localize.preprocessor && (c = i.localize.preprocessor(s, c));
  let l = { firstWeekContainsDate: a, weekStartsOn: o, locale: i };
  return c
    .map((r) => {
      if (!r.isToken) return r.value;
      let a = r.value;
      ((!n?.useAdditionalWeekYearTokens && Gf(a)) ||
        (!n?.useAdditionalDayOfYearTokens && Wf(a))) &&
        Kf(a, t, String(e));
      let o = Pf[a[0]];
      return o(s, a, i.localize, l);
    })
    .join(``);
}
function ep(e) {
  let t = e.match(Xf);
  return t ? t[1].replace(Zf, `'`) : e;
}
function tp(e, t, n) {
  let r = Gd(),
    i = n?.locale ?? r.locale ?? Ef,
    a = ef(e, t);
  if (isNaN(a)) throw RangeError(`Invalid time value`);
  let o = Object.assign({}, n, { addSuffix: n?.addSuffix, comparison: a }),
    [s, c] = Xd(n?.in, ...(a > 0 ? [t, e] : [e, t])),
    l = ff(c, s),
    u = (Yd(c) - Yd(s)) / 1e3,
    d = Math.round((l - u) / 60),
    f;
  if (d < 2)
    return n?.includeSeconds
      ? l < 5
        ? i.formatDistance(`lessThanXSeconds`, 5, o)
        : l < 10
          ? i.formatDistance(`lessThanXSeconds`, 10, o)
          : l < 20
            ? i.formatDistance(`lessThanXSeconds`, 20, o)
            : l < 40
              ? i.formatDistance(`halfAMinute`, 0, o)
              : l < 60
                ? i.formatDistance(`lessThanXMinutes`, 1, o)
                : i.formatDistance(`xMinutes`, 1, o)
      : d === 0
        ? i.formatDistance(`lessThanXMinutes`, 1, o)
        : i.formatDistance(`xMinutes`, d, o);
  if (d < 45) return i.formatDistance(`xMinutes`, d, o);
  if (d < 90) return i.formatDistance(`aboutXHours`, 1, o);
  if (d < 1440) {
    let e = Math.round(d / 60);
    return i.formatDistance(`aboutXHours`, e, o);
  } else if (d < 2520) return i.formatDistance(`xDays`, 1, o);
  else if (d < 43200) {
    let e = Math.round(d / zd);
    return i.formatDistance(`xDays`, e, o);
  } else if (d < 43200 * 2)
    return ((f = Math.round(d / Rd)), i.formatDistance(`aboutXMonths`, f, o));
  if (((f = df(c, s)), f < 12)) {
    let e = Math.round(d / Rd);
    return i.formatDistance(`xMonths`, e, o);
  } else {
    let e = f % 12,
      t = Math.trunc(f / 12);
    return e < 3
      ? i.formatDistance(`aboutXYears`, t, o)
      : e < 9
        ? i.formatDistance(`overXYears`, t, o)
        : i.formatDistance(`almostXYears`, t + 1, o);
  }
}
function np(e, t) {
  return tp(e, tf(e), t);
}
var rp = (e, t) => {
    let n = Array(e.length + t.length);
    for (let t = 0; t < e.length; t++) n[t] = e[t];
    for (let r = 0; r < t.length; r++) n[e.length + r] = t[r];
    return n;
  },
  ip = (e, t) => ({ classGroupId: e, validator: t }),
  ap = (e = new Map(), t = null, n) => ({
    nextPart: e,
    validators: t,
    classGroupId: n,
  }),
  op = `-`,
  sp = [],
  cp = `arbitrary..`,
  lp = (e) => {
    let t = fp(e),
      { conflictingClassGroups: n, conflictingClassGroupModifiers: r } = e;
    return {
      getClassGroupId: (e) => {
        if (e.startsWith(`[`) && e.endsWith(`]`)) return dp(e);
        let n = e.split(op);
        return up(n, +(n[0] === `` && n.length > 1), t);
      },
      getConflictingClassGroupIds: (e, t) => {
        if (t) {
          let t = r[e],
            i = n[e];
          return t ? (i ? rp(i, t) : t) : i || sp;
        }
        return n[e] || sp;
      },
    };
  },
  up = (e, t, n) => {
    if (e.length - t === 0) return n.classGroupId;
    let r = e[t],
      i = n.nextPart.get(r);
    if (i) {
      let n = up(e, t + 1, i);
      if (n) return n;
    }
    let a = n.validators;
    if (a === null) return;
    let o = t === 0 ? e.join(op) : e.slice(t).join(op),
      s = a.length;
    for (let e = 0; e < s; e++) {
      let t = a[e];
      if (t.validator(o)) return t.classGroupId;
    }
  },
  dp = (e) =>
    e.slice(1, -1).indexOf(`:`) === -1
      ? void 0
      : (() => {
          let t = e.slice(1, -1),
            n = t.indexOf(`:`),
            r = t.slice(0, n);
          return r ? cp + r : void 0;
        })(),
  fp = (e) => {
    let { theme: t, classGroups: n } = e;
    return pp(n, t);
  },
  pp = (e, t) => {
    let n = ap();
    for (let r in e) {
      let i = e[r];
      mp(i, n, r, t);
    }
    return n;
  },
  mp = (e, t, n, r) => {
    let i = e.length;
    for (let a = 0; a < i; a++) {
      let i = e[a];
      hp(i, t, n, r);
    }
  },
  hp = (e, t, n, r) => {
    if (typeof e == `string`) {
      gp(e, t, n);
      return;
    }
    if (typeof e == `function`) {
      _p(e, t, n, r);
      return;
    }
    vp(e, t, n, r);
  },
  gp = (e, t, n) => {
    let r = e === `` ? t : yp(t, e);
    r.classGroupId = n;
  },
  _p = (e, t, n, r) => {
    if (bp(e)) {
      mp(e(r), t, n, r);
      return;
    }
    (t.validators === null && (t.validators = []), t.validators.push(ip(n, e)));
  },
  vp = (e, t, n, r) => {
    let i = Object.entries(e),
      a = i.length;
    for (let e = 0; e < a; e++) {
      let [a, o] = i[e];
      mp(o, yp(t, a), n, r);
    }
  },
  yp = (e, t) => {
    let n = e,
      r = t.split(op),
      i = r.length;
    for (let e = 0; e < i; e++) {
      let t = r[e],
        i = n.nextPart.get(t);
      (i || ((i = ap()), n.nextPart.set(t, i)), (n = i));
    }
    return n;
  },
  bp = (e) => `isThemeGetter` in e && e.isThemeGetter === !0,
  xp = (e) => {
    if (e < 1) return { get: () => void 0, set: () => {} };
    let t = 0,
      n = Object.create(null),
      r = Object.create(null),
      i = (i, a) => {
        ((n[i] = a),
          t++,
          t > e && ((t = 0), (r = n), (n = Object.create(null))));
      };
    return {
      get(e) {
        let t = n[e];
        if (t !== void 0) return t;
        if ((t = r[e]) !== void 0) return (i(e, t), t);
      },
      set(e, t) {
        e in n ? (n[e] = t) : i(e, t);
      },
    };
  },
  Sp = `!`,
  Cp = `:`,
  wp = [],
  Tp = (e, t, n, r, i) => ({
    modifiers: e,
    hasImportantModifier: t,
    baseClassName: n,
    maybePostfixModifierPosition: r,
    isExternal: i,
  }),
  Ep = (e) => {
    let { prefix: t, experimentalParseClassName: n } = e,
      r = (e) => {
        let t = [],
          n = 0,
          r = 0,
          i = 0,
          a,
          o = e.length;
        for (let s = 0; s < o; s++) {
          let o = e[s];
          if (n === 0 && r === 0) {
            if (o === Cp) {
              (t.push(e.slice(i, s)), (i = s + 1));
              continue;
            }
            if (o === `/`) {
              a = s;
              continue;
            }
          }
          o === `[`
            ? n++
            : o === `]`
              ? n--
              : o === `(`
                ? r++
                : o === `)` && r--;
        }
        let s = t.length === 0 ? e : e.slice(i),
          c = s,
          l = !1;
        s.endsWith(Sp)
          ? ((c = s.slice(0, -1)), (l = !0))
          : s.startsWith(Sp) && ((c = s.slice(1)), (l = !0));
        let u = a && a > i ? a - i : void 0;
        return Tp(t, l, c, u);
      };
    if (t) {
      let e = t + Cp,
        n = r;
      r = (t) =>
        t.startsWith(e) ? n(t.slice(e.length)) : Tp(wp, !1, t, void 0, !0);
    }
    if (n) {
      let e = r;
      r = (t) => n({ className: t, parseClassName: e });
    }
    return r;
  },
  Dp = (e) => {
    let t = new Map();
    return (
      e.orderSensitiveModifiers.forEach((e, n) => {
        t.set(e, 1e6 + n);
      }),
      (e) => {
        let n = [],
          r = [];
        for (let i = 0; i < e.length; i++) {
          let a = e[i],
            o = a[0] === `[`,
            s = t.has(a);
          o || s
            ? (r.length > 0 && (r.sort(), n.push(...r), (r = [])), n.push(a))
            : r.push(a);
        }
        return (r.length > 0 && (r.sort(), n.push(...r)), n);
      }
    );
  },
  Op = (e) => ({
    cache: xp(e.cacheSize),
    parseClassName: Ep(e),
    sortModifiers: Dp(e),
    postfixLookupClassGroupIds: kp(e),
    ...lp(e),
  }),
  kp = (e) => {
    let t = Object.create(null),
      n = e.postfixLookupClassGroups;
    if (n) for (let e = 0; e < n.length; e++) t[n[e]] = !0;
    return t;
  },
  Ap = /\s+/,
  jp = (e, t) => {
    let {
        parseClassName: n,
        getClassGroupId: r,
        getConflictingClassGroupIds: i,
        sortModifiers: a,
        postfixLookupClassGroupIds: o,
      } = t,
      s = [],
      c = e.trim().split(Ap),
      l = ``;
    for (let e = c.length - 1; e >= 0; --e) {
      let t = c[e],
        {
          isExternal: u,
          modifiers: d,
          hasImportantModifier: f,
          baseClassName: p,
          maybePostfixModifierPosition: m,
        } = n(t);
      if (u) {
        l = t + (l.length > 0 ? ` ` + l : l);
        continue;
      }
      let h = !!m,
        g;
      if (h) {
        g = r(p.substring(0, m));
        let e = g && o[g] ? r(p) : void 0;
        e && e !== g && ((g = e), (h = !1));
      } else g = r(p);
      if (!g) {
        if (!h) {
          l = t + (l.length > 0 ? ` ` + l : l);
          continue;
        }
        if (((g = r(p)), !g)) {
          l = t + (l.length > 0 ? ` ` + l : l);
          continue;
        }
        h = !1;
      }
      let _ = d.length === 0 ? `` : d.length === 1 ? d[0] : a(d).join(`:`),
        v = f ? _ + Sp : _,
        y = v + g;
      if (s.indexOf(y) > -1) continue;
      s.push(y);
      let b = i(g, h);
      for (let e = 0; e < b.length; ++e) {
        let t = b[e];
        s.push(v + t);
      }
      l = t + (l.length > 0 ? ` ` + l : l);
    }
    return l;
  },
  Mp = (...e) => {
    let t = 0,
      n,
      r,
      i = ``;
    for (; t < e.length; )
      (n = e[t++]) && (r = Np(n)) && (i && (i += ` `), (i += r));
    return i;
  },
  Np = (e) => {
    if (typeof e == `string`) return e;
    let t,
      n = ``;
    for (let r = 0; r < e.length; r++)
      e[r] && (t = Np(e[r])) && (n && (n += ` `), (n += t));
    return n;
  },
  Pp = (e, ...t) => {
    let n,
      r,
      i,
      a,
      o = (o) => (
        (n = Op(t.reduce((e, t) => t(e), e()))),
        (r = n.cache.get),
        (i = n.cache.set),
        (a = s),
        s(o)
      ),
      s = (e) => {
        let t = r(e);
        if (t) return t;
        let a = jp(e, n);
        return (i(e, a), a);
      };
    return ((a = o), (...e) => a(Mp(...e)));
  },
  Fp = [],
  X = (e) => {
    let t = (t) => t[e] || Fp;
    return ((t.isThemeGetter = !0), t);
  },
  Ip = /^\[(?:(\w[\w-]*):)?(.+)\]$/i,
  Lp = /^\((?:(\w[\w-]*):)?(.+)\)$/i,
  Rp = /^\d+(?:\.\d+)?\/\d+(?:\.\d+)?$/,
  zp = /^(\d+(\.\d+)?)?(xs|sm|md|lg|xl)$/,
  Bp =
    /\d+(%|px|r?em|[sdl]?v([hwib]|min|max)|pt|pc|in|cm|mm|cap|ch|ex|r?lh|cq(w|h|i|b|min|max))|\b(calc|min|max|clamp)\(.+\)|^0$/,
  Vp = /^(rgba?|hsla?|hwb|(ok)?(lab|lch)|color-mix)\(.+\)$/,
  Hp = /^(inset_)?-?((\d+)?\.?(\d+)[a-z]+|0)_-?((\d+)?\.?(\d+)[a-z]+|0)/,
  Up =
    /^(url|image|image-set|cross-fade|element|(repeating-)?(linear|radial|conic)-gradient)\(.+\)$/,
  Wp = (e) => Rp.test(e),
  Z = (e) => !!e && !Number.isNaN(Number(e)),
  Gp = (e) => !!e && Number.isInteger(Number(e)),
  Kp = (e) => e.endsWith(`%`) && Z(e.slice(0, -1)),
  qp = (e) => zp.test(e),
  Jp = () => !0,
  Yp = (e) => Bp.test(e) && !Vp.test(e),
  Xp = () => !1,
  Zp = (e) => Hp.test(e),
  Qp = (e) => Up.test(e),
  $p = (e) => !Q(e) && !$(e),
  em = (e) =>
    e.startsWith(`@container`) &&
    ((e[10] === `/` && e[11] !== void 0) ||
      (e[11] === `s` && e[16] !== void 0 && e.startsWith(`-size/`, 10)) ||
      (e[11] === `n` && e[18] !== void 0 && e.startsWith(`-normal/`, 10))),
  tm = (e) => gm(e, bm, Xp),
  Q = (e) => Ip.test(e),
  nm = (e) => gm(e, xm, Yp),
  rm = (e) => gm(e, Sm, Z),
  im = (e) => gm(e, wm, Jp),
  am = (e) => gm(e, Cm, Xp),
  om = (e) => gm(e, vm, Xp),
  sm = (e) => gm(e, ym, Qp),
  cm = (e) => gm(e, Tm, Zp),
  $ = (e) => Lp.test(e),
  lm = (e) => _m(e, xm),
  um = (e) => _m(e, Cm),
  dm = (e) => _m(e, vm),
  fm = (e) => _m(e, bm),
  pm = (e) => _m(e, ym),
  mm = (e) => _m(e, Tm, !0),
  hm = (e) => _m(e, wm, !0),
  gm = (e, t, n) => {
    let r = Ip.exec(e);
    return r ? (r[1] ? t(r[1]) : n(r[2])) : !1;
  },
  _m = (e, t, n = !1) => {
    let r = Lp.exec(e);
    return r ? (r[1] ? t(r[1]) : n) : !1;
  },
  vm = (e) => e === `position` || e === `percentage`,
  ym = (e) => e === `image` || e === `url`,
  bm = (e) => e === `length` || e === `size` || e === `bg-size`,
  xm = (e) => e === `length`,
  Sm = (e) => e === `number`,
  Cm = (e) => e === `family-name`,
  wm = (e) => e === `number` || e === `weight`,
  Tm = (e) => e === `shadow`,
  Em = Pp(() => {
    let e = X(`color`),
      t = X(`font`),
      n = X(`text`),
      r = X(`font-weight`),
      i = X(`tracking`),
      a = X(`leading`),
      o = X(`breakpoint`),
      s = X(`container`),
      c = X(`spacing`),
      l = X(`radius`),
      u = X(`shadow`),
      d = X(`inset-shadow`),
      f = X(`text-shadow`),
      p = X(`drop-shadow`),
      m = X(`blur`),
      h = X(`perspective`),
      g = X(`aspect`),
      _ = X(`ease`),
      v = X(`animate`),
      y = () => [
        `auto`,
        `avoid`,
        `all`,
        `avoid-page`,
        `page`,
        `left`,
        `right`,
        `column`,
      ],
      b = () => [
        `center`,
        `top`,
        `bottom`,
        `left`,
        `right`,
        `top-left`,
        `left-top`,
        `top-right`,
        `right-top`,
        `bottom-right`,
        `right-bottom`,
        `bottom-left`,
        `left-bottom`,
      ],
      x = () => [...b(), $, Q],
      S = () => [`auto`, `hidden`, `clip`, `visible`, `scroll`],
      C = () => [`auto`, `contain`, `none`],
      w = () => [$, Q, c],
      T = () => [Wp, `full`, `auto`, ...w()],
      E = () => [Gp, `none`, `subgrid`, $, Q],
      D = () => [`auto`, { span: [`full`, Gp, $, Q] }, Gp, $, Q],
      O = () => [Gp, `auto`, $, Q],
      k = () => [`auto`, `min`, `max`, `fr`, $, Q],
      A = () => [
        `start`,
        `end`,
        `center`,
        `between`,
        `around`,
        `evenly`,
        `stretch`,
        `baseline`,
        `center-safe`,
        `end-safe`,
      ],
      j = () => [
        `start`,
        `end`,
        `center`,
        `stretch`,
        `center-safe`,
        `end-safe`,
      ],
      M = () => [`auto`, ...w()],
      N = () => [
        Wp,
        `auto`,
        `full`,
        `dvw`,
        `dvh`,
        `lvw`,
        `lvh`,
        `svw`,
        `svh`,
        `min`,
        `max`,
        `fit`,
        ...w(),
      ],
      P = () => [
        Wp,
        `screen`,
        `full`,
        `dvw`,
        `lvw`,
        `svw`,
        `min`,
        `max`,
        `fit`,
        ...w(),
      ],
      ee = () => [
        Wp,
        `screen`,
        `full`,
        `lh`,
        `dvh`,
        `lvh`,
        `svh`,
        `min`,
        `max`,
        `fit`,
        ...w(),
      ],
      F = () => [e, $, Q],
      I = () => [...b(), dm, om, { position: [$, Q] }],
      te = () => [`no-repeat`, { repeat: [``, `x`, `y`, `space`, `round`] }],
      ne = () => [`auto`, `cover`, `contain`, fm, tm, { size: [$, Q] }],
      re = () => [Kp, lm, nm],
      L = () => [``, `none`, `full`, l, $, Q],
      R = () => [``, Z, lm, nm],
      ie = () => [`solid`, `dashed`, `dotted`, `double`],
      ae = () => [
        `normal`,
        `multiply`,
        `screen`,
        `overlay`,
        `darken`,
        `lighten`,
        `color-dodge`,
        `color-burn`,
        `hard-light`,
        `soft-light`,
        `difference`,
        `exclusion`,
        `hue`,
        `saturation`,
        `color`,
        `luminosity`,
      ],
      z = () => [Z, Kp, dm, om],
      oe = () => [``, `none`, m, $, Q],
      se = () => [`none`, Z, $, Q],
      ce = () => [`none`, Z, $, Q],
      le = () => [Z, $, Q],
      B = () => [Wp, `full`, ...w()];
    return {
      cacheSize: 500,
      theme: {
        animate: [`spin`, `ping`, `pulse`, `bounce`],
        aspect: [`video`],
        blur: [qp],
        breakpoint: [qp],
        color: [Jp],
        container: [qp],
        "drop-shadow": [qp],
        ease: [`in`, `out`, `in-out`],
        font: [$p],
        "font-weight": [
          `thin`,
          `extralight`,
          `light`,
          `normal`,
          `medium`,
          `semibold`,
          `bold`,
          `extrabold`,
          `black`,
        ],
        "inset-shadow": [qp],
        leading: [`none`, `tight`, `snug`, `normal`, `relaxed`, `loose`],
        perspective: [
          `dramatic`,
          `near`,
          `normal`,
          `midrange`,
          `distant`,
          `none`,
        ],
        radius: [qp],
        shadow: [qp],
        spacing: [`px`, Z],
        text: [qp],
        "text-shadow": [qp],
        tracking: [`tighter`, `tight`, `normal`, `wide`, `wider`, `widest`],
      },
      classGroups: {
        aspect: [{ aspect: [`auto`, `square`, Wp, Q, $, g] }],
        container: [`container`],
        "container-type": [{ "@container": [``, `normal`, `size`, $, Q] }],
        "container-named": [em],
        columns: [{ columns: [Z, Q, $, s] }],
        "break-after": [{ "break-after": y() }],
        "break-before": [{ "break-before": y() }],
        "break-inside": [
          { "break-inside": [`auto`, `avoid`, `avoid-page`, `avoid-column`] },
        ],
        "box-decoration": [{ "box-decoration": [`slice`, `clone`] }],
        box: [{ box: [`border`, `content`] }],
        display: [
          `block`,
          `inline-block`,
          `inline`,
          `flex`,
          `inline-flex`,
          `table`,
          `inline-table`,
          `table-caption`,
          `table-cell`,
          `table-column`,
          `table-column-group`,
          `table-footer-group`,
          `table-header-group`,
          `table-row-group`,
          `table-row`,
          `flow-root`,
          `grid`,
          `inline-grid`,
          `contents`,
          `list-item`,
          `hidden`,
        ],
        sr: [`sr-only`, `not-sr-only`],
        float: [{ float: [`right`, `left`, `none`, `start`, `end`] }],
        clear: [{ clear: [`left`, `right`, `both`, `none`, `start`, `end`] }],
        isolation: [`isolate`, `isolation-auto`],
        "object-fit": [
          { object: [`contain`, `cover`, `fill`, `none`, `scale-down`] },
        ],
        "object-position": [{ object: x() }],
        overflow: [{ overflow: S() }],
        "overflow-x": [{ "overflow-x": S() }],
        "overflow-y": [{ "overflow-y": S() }],
        overscroll: [{ overscroll: C() }],
        "overscroll-x": [{ "overscroll-x": C() }],
        "overscroll-y": [{ "overscroll-y": C() }],
        position: [`static`, `fixed`, `absolute`, `relative`, `sticky`],
        inset: [{ inset: T() }],
        "inset-x": [{ "inset-x": T() }],
        "inset-y": [{ "inset-y": T() }],
        start: [{ "inset-s": T(), start: T() }],
        end: [{ "inset-e": T(), end: T() }],
        "inset-bs": [{ "inset-bs": T() }],
        "inset-be": [{ "inset-be": T() }],
        top: [{ top: T() }],
        right: [{ right: T() }],
        bottom: [{ bottom: T() }],
        left: [{ left: T() }],
        visibility: [`visible`, `invisible`, `collapse`],
        z: [{ z: [Gp, `auto`, $, Q] }],
        basis: [{ basis: [Wp, `full`, `auto`, s, ...w()] }],
        "flex-direction": [
          { flex: [`row`, `row-reverse`, `col`, `col-reverse`] },
        ],
        "flex-wrap": [{ flex: [`nowrap`, `wrap`, `wrap-reverse`] }],
        flex: [{ flex: [Z, Wp, `auto`, `initial`, `none`, Q] }],
        grow: [{ grow: [``, Z, $, Q] }],
        shrink: [{ shrink: [``, Z, $, Q] }],
        order: [{ order: [Gp, `first`, `last`, `none`, $, Q] }],
        "grid-cols": [{ "grid-cols": E() }],
        "col-start-end": [{ col: D() }],
        "col-start": [{ "col-start": O() }],
        "col-end": [{ "col-end": O() }],
        "grid-rows": [{ "grid-rows": E() }],
        "row-start-end": [{ row: D() }],
        "row-start": [{ "row-start": O() }],
        "row-end": [{ "row-end": O() }],
        "grid-flow": [
          { "grid-flow": [`row`, `col`, `dense`, `row-dense`, `col-dense`] },
        ],
        "auto-cols": [{ "auto-cols": k() }],
        "auto-rows": [{ "auto-rows": k() }],
        gap: [{ gap: w() }],
        "gap-x": [{ "gap-x": w() }],
        "gap-y": [{ "gap-y": w() }],
        "justify-content": [{ justify: [...A(), `normal`] }],
        "justify-items": [{ "justify-items": [...j(), `normal`] }],
        "justify-self": [{ "justify-self": [`auto`, ...j()] }],
        "align-content": [{ content: [`normal`, ...A()] }],
        "align-items": [{ items: [...j(), { baseline: [``, `last`] }] }],
        "align-self": [{ self: [`auto`, ...j(), { baseline: [``, `last`] }] }],
        "place-content": [{ "place-content": A() }],
        "place-items": [{ "place-items": [...j(), `baseline`] }],
        "place-self": [{ "place-self": [`auto`, ...j()] }],
        p: [{ p: w() }],
        px: [{ px: w() }],
        py: [{ py: w() }],
        ps: [{ ps: w() }],
        pe: [{ pe: w() }],
        pbs: [{ pbs: w() }],
        pbe: [{ pbe: w() }],
        pt: [{ pt: w() }],
        pr: [{ pr: w() }],
        pb: [{ pb: w() }],
        pl: [{ pl: w() }],
        m: [{ m: M() }],
        mx: [{ mx: M() }],
        my: [{ my: M() }],
        ms: [{ ms: M() }],
        me: [{ me: M() }],
        mbs: [{ mbs: M() }],
        mbe: [{ mbe: M() }],
        mt: [{ mt: M() }],
        mr: [{ mr: M() }],
        mb: [{ mb: M() }],
        ml: [{ ml: M() }],
        "space-x": [{ "space-x": w() }],
        "space-x-reverse": [`space-x-reverse`],
        "space-y": [{ "space-y": w() }],
        "space-y-reverse": [`space-y-reverse`],
        size: [{ size: N() }],
        "inline-size": [{ inline: [`auto`, ...P()] }],
        "min-inline-size": [{ "min-inline": [`auto`, ...P()] }],
        "max-inline-size": [{ "max-inline": [`none`, ...P()] }],
        "block-size": [{ block: [`auto`, ...ee()] }],
        "min-block-size": [{ "min-block": [`auto`, ...ee()] }],
        "max-block-size": [{ "max-block": [`none`, ...ee()] }],
        w: [{ w: [s, `screen`, ...N()] }],
        "min-w": [{ "min-w": [s, `screen`, `none`, ...N()] }],
        "max-w": [
          { "max-w": [s, `screen`, `none`, `prose`, { screen: [o] }, ...N()] },
        ],
        h: [{ h: [`screen`, `lh`, ...N()] }],
        "min-h": [{ "min-h": [`screen`, `lh`, `none`, ...N()] }],
        "max-h": [{ "max-h": [`screen`, `lh`, ...N()] }],
        "font-size": [{ text: [`base`, n, lm, nm] }],
        "font-smoothing": [`antialiased`, `subpixel-antialiased`],
        "font-style": [`italic`, `not-italic`],
        "font-weight": [{ font: [r, hm, im] }],
        "font-stretch": [
          {
            "font-stretch": [
              `ultra-condensed`,
              `extra-condensed`,
              `condensed`,
              `semi-condensed`,
              `normal`,
              `semi-expanded`,
              `expanded`,
              `extra-expanded`,
              `ultra-expanded`,
              Kp,
              Q,
            ],
          },
        ],
        "font-family": [{ font: [um, am, t] }],
        "font-features": [{ "font-features": [Q] }],
        "fvn-normal": [`normal-nums`],
        "fvn-ordinal": [`ordinal`],
        "fvn-slashed-zero": [`slashed-zero`],
        "fvn-figure": [`lining-nums`, `oldstyle-nums`],
        "fvn-spacing": [`proportional-nums`, `tabular-nums`],
        "fvn-fraction": [`diagonal-fractions`, `stacked-fractions`],
        tracking: [{ tracking: [i, $, Q] }],
        "line-clamp": [{ "line-clamp": [Z, `none`, $, rm] }],
        leading: [{ leading: [a, ...w()] }],
        "list-image": [{ "list-image": [`none`, $, Q] }],
        "list-style-position": [{ list: [`inside`, `outside`] }],
        "list-style-type": [{ list: [`disc`, `decimal`, `none`, $, Q] }],
        "text-alignment": [
          { text: [`left`, `center`, `right`, `justify`, `start`, `end`] },
        ],
        "placeholder-color": [{ placeholder: F() }],
        "text-color": [{ text: F() }],
        "text-decoration": [
          `underline`,
          `overline`,
          `line-through`,
          `no-underline`,
        ],
        "text-decoration-style": [{ decoration: [...ie(), `wavy`] }],
        "text-decoration-thickness": [
          { decoration: [Z, `from-font`, `auto`, $, nm] },
        ],
        "text-decoration-color": [{ decoration: F() }],
        "underline-offset": [{ "underline-offset": [Z, `auto`, $, Q] }],
        "text-transform": [
          `uppercase`,
          `lowercase`,
          `capitalize`,
          `normal-case`,
        ],
        "text-overflow": [`truncate`, `text-ellipsis`, `text-clip`],
        "text-wrap": [{ text: [`wrap`, `nowrap`, `balance`, `pretty`] }],
        indent: [{ indent: w() }],
        "tab-size": [{ tab: [Gp, $, Q] }],
        "vertical-align": [
          {
            align: [
              `baseline`,
              `top`,
              `middle`,
              `bottom`,
              `text-top`,
              `text-bottom`,
              `sub`,
              `super`,
              $,
              Q,
            ],
          },
        ],
        whitespace: [
          {
            whitespace: [
              `normal`,
              `nowrap`,
              `pre`,
              `pre-line`,
              `pre-wrap`,
              `break-spaces`,
            ],
          },
        ],
        break: [{ break: [`normal`, `words`, `all`, `keep`] }],
        wrap: [{ wrap: [`break-word`, `anywhere`, `normal`] }],
        hyphens: [{ hyphens: [`none`, `manual`, `auto`] }],
        content: [{ content: [`none`, $, Q] }],
        "bg-attachment": [{ bg: [`fixed`, `local`, `scroll`] }],
        "bg-clip": [{ "bg-clip": [`border`, `padding`, `content`, `text`] }],
        "bg-origin": [{ "bg-origin": [`border`, `padding`, `content`] }],
        "bg-position": [{ bg: I() }],
        "bg-repeat": [{ bg: te() }],
        "bg-size": [{ bg: ne() }],
        "bg-image": [
          {
            bg: [
              `none`,
              {
                linear: [
                  { to: [`t`, `tr`, `r`, `br`, `b`, `bl`, `l`, `tl`] },
                  Gp,
                  $,
                  Q,
                ],
                radial: [``, $, Q],
                conic: [Gp, $, Q],
              },
              pm,
              sm,
            ],
          },
        ],
        "bg-color": [{ bg: F() }],
        "gradient-from-pos": [{ from: re() }],
        "gradient-via-pos": [{ via: re() }],
        "gradient-to-pos": [{ to: re() }],
        "gradient-from": [{ from: F() }],
        "gradient-via": [{ via: F() }],
        "gradient-to": [{ to: F() }],
        rounded: [{ rounded: L() }],
        "rounded-s": [{ "rounded-s": L() }],
        "rounded-e": [{ "rounded-e": L() }],
        "rounded-t": [{ "rounded-t": L() }],
        "rounded-r": [{ "rounded-r": L() }],
        "rounded-b": [{ "rounded-b": L() }],
        "rounded-l": [{ "rounded-l": L() }],
        "rounded-ss": [{ "rounded-ss": L() }],
        "rounded-se": [{ "rounded-se": L() }],
        "rounded-ee": [{ "rounded-ee": L() }],
        "rounded-es": [{ "rounded-es": L() }],
        "rounded-tl": [{ "rounded-tl": L() }],
        "rounded-tr": [{ "rounded-tr": L() }],
        "rounded-br": [{ "rounded-br": L() }],
        "rounded-bl": [{ "rounded-bl": L() }],
        "border-w": [{ border: R() }],
        "border-w-x": [{ "border-x": R() }],
        "border-w-y": [{ "border-y": R() }],
        "border-w-s": [{ "border-s": R() }],
        "border-w-e": [{ "border-e": R() }],
        "border-w-bs": [{ "border-bs": R() }],
        "border-w-be": [{ "border-be": R() }],
        "border-w-t": [{ "border-t": R() }],
        "border-w-r": [{ "border-r": R() }],
        "border-w-b": [{ "border-b": R() }],
        "border-w-l": [{ "border-l": R() }],
        "divide-x": [{ "divide-x": R() }],
        "divide-x-reverse": [`divide-x-reverse`],
        "divide-y": [{ "divide-y": R() }],
        "divide-y-reverse": [`divide-y-reverse`],
        "border-style": [{ border: [...ie(), `hidden`, `none`] }],
        "divide-style": [{ divide: [...ie(), `hidden`, `none`] }],
        "border-color": [{ border: F() }],
        "border-color-x": [{ "border-x": F() }],
        "border-color-y": [{ "border-y": F() }],
        "border-color-s": [{ "border-s": F() }],
        "border-color-e": [{ "border-e": F() }],
        "border-color-bs": [{ "border-bs": F() }],
        "border-color-be": [{ "border-be": F() }],
        "border-color-t": [{ "border-t": F() }],
        "border-color-r": [{ "border-r": F() }],
        "border-color-b": [{ "border-b": F() }],
        "border-color-l": [{ "border-l": F() }],
        "divide-color": [{ divide: F() }],
        "outline-style": [{ outline: [...ie(), `none`, `hidden`] }],
        "outline-offset": [{ "outline-offset": [Z, $, Q] }],
        "outline-w": [{ outline: [``, Z, lm, nm] }],
        "outline-color": [{ outline: F() }],
        shadow: [{ shadow: [``, `none`, u, mm, cm] }],
        "shadow-color": [{ shadow: F() }],
        "inset-shadow": [{ "inset-shadow": [`none`, d, mm, cm] }],
        "inset-shadow-color": [{ "inset-shadow": F() }],
        "ring-w": [{ ring: R() }],
        "ring-w-inset": [`ring-inset`],
        "ring-color": [{ ring: F() }],
        "ring-offset-w": [{ "ring-offset": [Z, nm] }],
        "ring-offset-color": [{ "ring-offset": F() }],
        "inset-ring-w": [{ "inset-ring": R() }],
        "inset-ring-color": [{ "inset-ring": F() }],
        "text-shadow": [{ "text-shadow": [`none`, f, mm, cm] }],
        "text-shadow-color": [{ "text-shadow": F() }],
        opacity: [{ opacity: [Z, $, Q] }],
        "mix-blend": [
          { "mix-blend": [...ae(), `plus-darker`, `plus-lighter`] },
        ],
        "bg-blend": [{ "bg-blend": ae() }],
        "mask-clip": [
          {
            "mask-clip": [
              `border`,
              `padding`,
              `content`,
              `fill`,
              `stroke`,
              `view`,
            ],
          },
          `mask-no-clip`,
        ],
        "mask-composite": [
          { mask: [`add`, `subtract`, `intersect`, `exclude`] },
        ],
        "mask-image-linear-pos": [{ "mask-linear": [Z] }],
        "mask-image-linear-from-pos": [{ "mask-linear-from": z() }],
        "mask-image-linear-to-pos": [{ "mask-linear-to": z() }],
        "mask-image-linear-from-color": [{ "mask-linear-from": F() }],
        "mask-image-linear-to-color": [{ "mask-linear-to": F() }],
        "mask-image-t-from-pos": [{ "mask-t-from": z() }],
        "mask-image-t-to-pos": [{ "mask-t-to": z() }],
        "mask-image-t-from-color": [{ "mask-t-from": F() }],
        "mask-image-t-to-color": [{ "mask-t-to": F() }],
        "mask-image-r-from-pos": [{ "mask-r-from": z() }],
        "mask-image-r-to-pos": [{ "mask-r-to": z() }],
        "mask-image-r-from-color": [{ "mask-r-from": F() }],
        "mask-image-r-to-color": [{ "mask-r-to": F() }],
        "mask-image-b-from-pos": [{ "mask-b-from": z() }],
        "mask-image-b-to-pos": [{ "mask-b-to": z() }],
        "mask-image-b-from-color": [{ "mask-b-from": F() }],
        "mask-image-b-to-color": [{ "mask-b-to": F() }],
        "mask-image-l-from-pos": [{ "mask-l-from": z() }],
        "mask-image-l-to-pos": [{ "mask-l-to": z() }],
        "mask-image-l-from-color": [{ "mask-l-from": F() }],
        "mask-image-l-to-color": [{ "mask-l-to": F() }],
        "mask-image-x-from-pos": [{ "mask-x-from": z() }],
        "mask-image-x-to-pos": [{ "mask-x-to": z() }],
        "mask-image-x-from-color": [{ "mask-x-from": F() }],
        "mask-image-x-to-color": [{ "mask-x-to": F() }],
        "mask-image-y-from-pos": [{ "mask-y-from": z() }],
        "mask-image-y-to-pos": [{ "mask-y-to": z() }],
        "mask-image-y-from-color": [{ "mask-y-from": F() }],
        "mask-image-y-to-color": [{ "mask-y-to": F() }],
        "mask-image-radial": [{ "mask-radial": [$, Q] }],
        "mask-image-radial-from-pos": [{ "mask-radial-from": z() }],
        "mask-image-radial-to-pos": [{ "mask-radial-to": z() }],
        "mask-image-radial-from-color": [{ "mask-radial-from": F() }],
        "mask-image-radial-to-color": [{ "mask-radial-to": F() }],
        "mask-image-radial-shape": [{ "mask-radial": [`circle`, `ellipse`] }],
        "mask-image-radial-size": [
          {
            "mask-radial": [
              { closest: [`side`, `corner`], farthest: [`side`, `corner`] },
            ],
          },
        ],
        "mask-image-radial-pos": [{ "mask-radial-at": b() }],
        "mask-image-conic-pos": [{ "mask-conic": [Z] }],
        "mask-image-conic-from-pos": [{ "mask-conic-from": z() }],
        "mask-image-conic-to-pos": [{ "mask-conic-to": z() }],
        "mask-image-conic-from-color": [{ "mask-conic-from": F() }],
        "mask-image-conic-to-color": [{ "mask-conic-to": F() }],
        "mask-mode": [{ mask: [`alpha`, `luminance`, `match`] }],
        "mask-origin": [
          {
            "mask-origin": [
              `border`,
              `padding`,
              `content`,
              `fill`,
              `stroke`,
              `view`,
            ],
          },
        ],
        "mask-position": [{ mask: I() }],
        "mask-repeat": [{ mask: te() }],
        "mask-size": [{ mask: ne() }],
        "mask-type": [{ "mask-type": [`alpha`, `luminance`] }],
        "mask-image": [{ mask: [`none`, $, Q] }],
        filter: [{ filter: [``, `none`, $, Q] }],
        blur: [{ blur: oe() }],
        brightness: [{ brightness: [Z, $, Q] }],
        contrast: [{ contrast: [Z, $, Q] }],
        "drop-shadow": [{ "drop-shadow": [``, `none`, p, mm, cm] }],
        "drop-shadow-color": [{ "drop-shadow": F() }],
        grayscale: [{ grayscale: [``, Z, $, Q] }],
        "hue-rotate": [{ "hue-rotate": [Z, $, Q] }],
        invert: [{ invert: [``, Z, $, Q] }],
        saturate: [{ saturate: [Z, $, Q] }],
        sepia: [{ sepia: [``, Z, $, Q] }],
        "backdrop-filter": [{ "backdrop-filter": [``, `none`, $, Q] }],
        "backdrop-blur": [{ "backdrop-blur": oe() }],
        "backdrop-brightness": [{ "backdrop-brightness": [Z, $, Q] }],
        "backdrop-contrast": [{ "backdrop-contrast": [Z, $, Q] }],
        "backdrop-grayscale": [{ "backdrop-grayscale": [``, Z, $, Q] }],
        "backdrop-hue-rotate": [{ "backdrop-hue-rotate": [Z, $, Q] }],
        "backdrop-invert": [{ "backdrop-invert": [``, Z, $, Q] }],
        "backdrop-opacity": [{ "backdrop-opacity": [Z, $, Q] }],
        "backdrop-saturate": [{ "backdrop-saturate": [Z, $, Q] }],
        "backdrop-sepia": [{ "backdrop-sepia": [``, Z, $, Q] }],
        "border-collapse": [{ border: [`collapse`, `separate`] }],
        "border-spacing": [{ "border-spacing": w() }],
        "border-spacing-x": [{ "border-spacing-x": w() }],
        "border-spacing-y": [{ "border-spacing-y": w() }],
        "table-layout": [{ table: [`auto`, `fixed`] }],
        caption: [{ caption: [`top`, `bottom`] }],
        transition: [
          {
            transition: [
              ``,
              `all`,
              `colors`,
              `opacity`,
              `shadow`,
              `transform`,
              `none`,
              $,
              Q,
            ],
          },
        ],
        "transition-behavior": [{ transition: [`normal`, `discrete`] }],
        duration: [{ duration: [Z, `initial`, $, Q] }],
        ease: [{ ease: [`linear`, `initial`, _, $, Q] }],
        delay: [{ delay: [Z, $, Q] }],
        animate: [{ animate: [`none`, v, $, Q] }],
        backface: [{ backface: [`hidden`, `visible`] }],
        perspective: [{ perspective: [h, $, Q] }],
        "perspective-origin": [{ "perspective-origin": x() }],
        rotate: [{ rotate: se() }],
        "rotate-x": [{ "rotate-x": se() }],
        "rotate-y": [{ "rotate-y": se() }],
        "rotate-z": [{ "rotate-z": se() }],
        scale: [{ scale: ce() }],
        "scale-x": [{ "scale-x": ce() }],
        "scale-y": [{ "scale-y": ce() }],
        "scale-z": [{ "scale-z": ce() }],
        "scale-3d": [`scale-3d`],
        skew: [{ skew: le() }],
        "skew-x": [{ "skew-x": le() }],
        "skew-y": [{ "skew-y": le() }],
        transform: [{ transform: [$, Q, ``, `none`, `gpu`, `cpu`] }],
        "transform-origin": [{ origin: x() }],
        "transform-style": [{ transform: [`3d`, `flat`] }],
        translate: [{ translate: B() }],
        "translate-x": [{ "translate-x": B() }],
        "translate-y": [{ "translate-y": B() }],
        "translate-z": [{ "translate-z": B() }],
        "translate-none": [`translate-none`],
        zoom: [{ zoom: [Gp, $, Q] }],
        accent: [{ accent: F() }],
        appearance: [{ appearance: [`none`, `auto`] }],
        "caret-color": [{ caret: F() }],
        "color-scheme": [
          {
            scheme: [
              `normal`,
              `dark`,
              `light`,
              `light-dark`,
              `only-dark`,
              `only-light`,
            ],
          },
        ],
        cursor: [
          {
            cursor: [
              `auto`,
              `default`,
              `pointer`,
              `wait`,
              `text`,
              `move`,
              `help`,
              `not-allowed`,
              `none`,
              `context-menu`,
              `progress`,
              `cell`,
              `crosshair`,
              `vertical-text`,
              `alias`,
              `copy`,
              `no-drop`,
              `grab`,
              `grabbing`,
              `all-scroll`,
              `col-resize`,
              `row-resize`,
              `n-resize`,
              `e-resize`,
              `s-resize`,
              `w-resize`,
              `ne-resize`,
              `nw-resize`,
              `se-resize`,
              `sw-resize`,
              `ew-resize`,
              `ns-resize`,
              `nesw-resize`,
              `nwse-resize`,
              `zoom-in`,
              `zoom-out`,
              $,
              Q,
            ],
          },
        ],
        "field-sizing": [{ "field-sizing": [`fixed`, `content`] }],
        "pointer-events": [{ "pointer-events": [`auto`, `none`] }],
        resize: [{ resize: [`none`, ``, `y`, `x`] }],
        "scroll-behavior": [{ scroll: [`auto`, `smooth`] }],
        "scrollbar-thumb-color": [{ "scrollbar-thumb": F() }],
        "scrollbar-track-color": [{ "scrollbar-track": F() }],
        "scrollbar-gutter": [
          { "scrollbar-gutter": [`auto`, `stable`, `both`] },
        ],
        "scrollbar-w": [{ scrollbar: [`auto`, `thin`, `none`] }],
        "scroll-m": [{ "scroll-m": w() }],
        "scroll-mx": [{ "scroll-mx": w() }],
        "scroll-my": [{ "scroll-my": w() }],
        "scroll-ms": [{ "scroll-ms": w() }],
        "scroll-me": [{ "scroll-me": w() }],
        "scroll-mbs": [{ "scroll-mbs": w() }],
        "scroll-mbe": [{ "scroll-mbe": w() }],
        "scroll-mt": [{ "scroll-mt": w() }],
        "scroll-mr": [{ "scroll-mr": w() }],
        "scroll-mb": [{ "scroll-mb": w() }],
        "scroll-ml": [{ "scroll-ml": w() }],
        "scroll-p": [{ "scroll-p": w() }],
        "scroll-px": [{ "scroll-px": w() }],
        "scroll-py": [{ "scroll-py": w() }],
        "scroll-ps": [{ "scroll-ps": w() }],
        "scroll-pe": [{ "scroll-pe": w() }],
        "scroll-pbs": [{ "scroll-pbs": w() }],
        "scroll-pbe": [{ "scroll-pbe": w() }],
        "scroll-pt": [{ "scroll-pt": w() }],
        "scroll-pr": [{ "scroll-pr": w() }],
        "scroll-pb": [{ "scroll-pb": w() }],
        "scroll-pl": [{ "scroll-pl": w() }],
        "snap-align": [{ snap: [`start`, `end`, `center`, `align-none`] }],
        "snap-stop": [{ snap: [`normal`, `always`] }],
        "snap-type": [{ snap: [`none`, `x`, `y`, `both`] }],
        "snap-strictness": [{ snap: [`mandatory`, `proximity`] }],
        touch: [{ touch: [`auto`, `none`, `manipulation`] }],
        "touch-x": [{ "touch-pan": [`x`, `left`, `right`] }],
        "touch-y": [{ "touch-pan": [`y`, `up`, `down`] }],
        "touch-pz": [`touch-pinch-zoom`],
        select: [{ select: [`none`, `text`, `all`, `auto`] }],
        "will-change": [
          { "will-change": [`auto`, `scroll`, `contents`, `transform`, $, Q] },
        ],
        fill: [{ fill: [`none`, ...F()] }],
        "stroke-w": [{ stroke: [Z, lm, nm, rm] }],
        stroke: [{ stroke: [`none`, ...F()] }],
        "forced-color-adjust": [{ "forced-color-adjust": [`auto`, `none`] }],
      },
      conflictingClassGroups: {
        "container-named": [`container-type`],
        overflow: [`overflow-x`, `overflow-y`],
        overscroll: [`overscroll-x`, `overscroll-y`],
        inset: [
          `inset-x`,
          `inset-y`,
          `inset-bs`,
          `inset-be`,
          `start`,
          `end`,
          `top`,
          `right`,
          `bottom`,
          `left`,
        ],
        "inset-x": [`right`, `left`],
        "inset-y": [`top`, `bottom`],
        flex: [`basis`, `grow`, `shrink`],
        gap: [`gap-x`, `gap-y`],
        p: [`px`, `py`, `ps`, `pe`, `pbs`, `pbe`, `pt`, `pr`, `pb`, `pl`],
        px: [`pr`, `pl`],
        py: [`pt`, `pb`],
        m: [`mx`, `my`, `ms`, `me`, `mbs`, `mbe`, `mt`, `mr`, `mb`, `ml`],
        mx: [`mr`, `ml`],
        my: [`mt`, `mb`],
        size: [`w`, `h`],
        "font-size": [`leading`],
        "fvn-normal": [
          `fvn-ordinal`,
          `fvn-slashed-zero`,
          `fvn-figure`,
          `fvn-spacing`,
          `fvn-fraction`,
        ],
        "fvn-ordinal": [`fvn-normal`],
        "fvn-slashed-zero": [`fvn-normal`],
        "fvn-figure": [`fvn-normal`],
        "fvn-spacing": [`fvn-normal`],
        "fvn-fraction": [`fvn-normal`],
        "line-clamp": [`display`, `overflow`],
        rounded: [
          `rounded-s`,
          `rounded-e`,
          `rounded-t`,
          `rounded-r`,
          `rounded-b`,
          `rounded-l`,
          `rounded-ss`,
          `rounded-se`,
          `rounded-ee`,
          `rounded-es`,
          `rounded-tl`,
          `rounded-tr`,
          `rounded-br`,
          `rounded-bl`,
        ],
        "rounded-s": [`rounded-ss`, `rounded-es`],
        "rounded-e": [`rounded-se`, `rounded-ee`],
        "rounded-t": [`rounded-tl`, `rounded-tr`],
        "rounded-r": [`rounded-tr`, `rounded-br`],
        "rounded-b": [`rounded-br`, `rounded-bl`],
        "rounded-l": [`rounded-tl`, `rounded-bl`],
        "border-spacing": [`border-spacing-x`, `border-spacing-y`],
        "border-w": [
          `border-w-x`,
          `border-w-y`,
          `border-w-s`,
          `border-w-e`,
          `border-w-bs`,
          `border-w-be`,
          `border-w-t`,
          `border-w-r`,
          `border-w-b`,
          `border-w-l`,
        ],
        "border-w-x": [`border-w-r`, `border-w-l`],
        "border-w-y": [`border-w-t`, `border-w-b`],
        "border-color": [
          `border-color-x`,
          `border-color-y`,
          `border-color-s`,
          `border-color-e`,
          `border-color-bs`,
          `border-color-be`,
          `border-color-t`,
          `border-color-r`,
          `border-color-b`,
          `border-color-l`,
        ],
        "border-color-x": [`border-color-r`, `border-color-l`],
        "border-color-y": [`border-color-t`, `border-color-b`],
        translate: [`translate-x`, `translate-y`, `translate-none`],
        "translate-none": [
          `translate`,
          `translate-x`,
          `translate-y`,
          `translate-z`,
        ],
        "scroll-m": [
          `scroll-mx`,
          `scroll-my`,
          `scroll-ms`,
          `scroll-me`,
          `scroll-mbs`,
          `scroll-mbe`,
          `scroll-mt`,
          `scroll-mr`,
          `scroll-mb`,
          `scroll-ml`,
        ],
        "scroll-mx": [`scroll-mr`, `scroll-ml`],
        "scroll-my": [`scroll-mt`, `scroll-mb`],
        "scroll-p": [
          `scroll-px`,
          `scroll-py`,
          `scroll-ps`,
          `scroll-pe`,
          `scroll-pbs`,
          `scroll-pbe`,
          `scroll-pt`,
          `scroll-pr`,
          `scroll-pb`,
          `scroll-pl`,
        ],
        "scroll-px": [`scroll-pr`, `scroll-pl`],
        "scroll-py": [`scroll-pt`, `scroll-pb`],
        touch: [`touch-x`, `touch-y`, `touch-pz`],
        "touch-x": [`touch`],
        "touch-y": [`touch`],
        "touch-pz": [`touch`],
      },
      conflictingClassGroupModifiers: { "font-size": [`leading`] },
      postfixLookupClassGroups: [`container-type`],
      orderSensitiveModifiers: [
        `*`,
        `**`,
        `after`,
        `backdrop`,
        `before`,
        `details-content`,
        `file`,
        `first-letter`,
        `first-line`,
        `marker`,
        `placeholder`,
        `selection`,
      ],
    };
  }),
  Dm = o((e, t) => {
    (function (n, r) {
      typeof e == `object` && t !== void 0
        ? r(e)
        : typeof define == `function` && define.amd
          ? define([`exports`], r)
          : r(
              ((n = typeof globalThis < `u` ? globalThis : n || self).ImageKit =
                {}),
            );
    })(e, function (e) {
      let t = {
        width: `w`,
        height: `h`,
        aspectRatio: `ar`,
        background: `bg`,
        border: `b`,
        crop: `c`,
        cropMode: `cm`,
        dpr: `dpr`,
        focus: `fo`,
        quality: `q`,
        x: `x`,
        xCenter: `xc`,
        y: `y`,
        yCenter: `yc`,
        format: `f`,
        videoCodec: `vc`,
        audioCodec: `ac`,
        radius: `r`,
        rotation: `rt`,
        blur: `bl`,
        named: `n`,
        defaultImage: `di`,
        flip: `fl`,
        original: `orig`,
        startOffset: `so`,
        endOffset: `eo`,
        duration: `du`,
        streamingResolutions: `sr`,
        grayscale: `e-grayscale`,
        aiUpscale: `e-upscale`,
        aiRetouch: `e-retouch`,
        aiVariation: `e-genvar`,
        aiDropShadow: `e-dropshadow`,
        aiChangeBackground: `e-changebg`,
        aiEdit: `e-edit`,
        aiRemoveBackground: `e-bgremove`,
        aiRemoveBackgroundExternal: `e-removedotbg`,
        contrastStretch: `e-contrast`,
        shadow: `e-shadow`,
        sharpen: `e-sharpen`,
        unsharpMask: `e-usm`,
        gradient: `e-gradient`,
        colorReplace: `cr`,
        distort: `e-distort`,
        colorize: `e-colorize`,
        progressive: `pr`,
        lossless: `lo`,
        colorProfile: `cp`,
        metadata: `md`,
        opacity: `o`,
        trim: `t`,
        zoom: `z`,
        page: `pg`,
        layerMode: `lm`,
        fontSize: `fs`,
        fontFamily: `ff`,
        fontColor: `co`,
        innerAlignment: `ia`,
        padding: `pa`,
        alpha: `al`,
        typography: `tg`,
        lineHeight: `lh`,
        fontOutline: `fol`,
        fontShadow: `fsh`,
        raw: `raw`,
      };
      var n = (e) => e.transformationPosition === `query`,
        r = function (e) {
          return (e && (t[e] || t[e.toLowerCase()])) || ``;
        },
        i = function () {
          return `:`;
        },
        a = function () {
          return `,`;
        },
        o = function () {
          return `-`;
        };
      let s = function (e) {
          if (globalThis.Buffer !== void 0)
            return globalThis.Buffer.from(e, `utf8`).toString(`base64`);
          let t = new TextEncoder().encode(e),
            n = Array.from(t, (e) => String.fromCodePoint(e)).join(``);
          return btoa(n);
        },
        c = RegExp(`^[a-zA-Z0-9-._/ ]*$`),
        l = RegExp(`^[a-zA-Z0-9-._ ]*$`);
      function u(e) {
        return (
          typeof e == `string` &&
            e[e.length - 1] == `/` &&
            (e = e.substring(0, e.length - 1)),
          e
        );
      }
      function d(e) {
        return (typeof e == `string` && e[0] == `/` && (e = e.slice(1)), e);
      }
      function f(e, t) {
        var n = t || `/`,
          r = RegExp(n + `{1,}`, `g`);
        return e.join(n).replace(r, n);
      }
      let p = (e) => {
        if (
          ((e.urlEndpoint = e.urlEndpoint || ``),
          (e.src = e.src || ``),
          (e.transformationPosition = e.transformationPosition || `query`),
          !e.src)
        )
          return ``;
        let t = e.src.startsWith(`http://`) || e.src.startsWith(`https://`);
        var r, a, o;
        try {
          t
            ? ((r = new URL(e.src)), (a = !0))
            : ((o = new URL(e.urlEndpoint).pathname),
              (r = new URL(f([e.urlEndpoint.replace(o, ``), e.src]))));
        } catch (e) {
          return (console.error(e), ``);
        }
        for (var s in e.queryParameters)
          r.searchParams.append(s, String(e.queryParameters[s]));
        var c = g(e.transformation);
        return (
          c &&
            c.length &&
            (n(e) || a || (r.pathname = f([`tr` + i() + c, r.pathname]))),
          (r.pathname = f(o ? [o, r.pathname] : [r.pathname])),
          c && c.length && (n(e) || a)
            ? r.searchParams.toString() === ``
              ? `${r.href}?tr=${c}`
              : `${r.href}&tr=${c}`
            : r.href
        );
      };
      function m(e, t) {
        return (
          (e = u(d(e))),
          t === `plain`
            ? `i-` + e.replace(/\//g, `@@`)
            : t === `base64`
              ? `ie-` + encodeURIComponent(s(e))
              : c.test(e)
                ? `i-` + e.replace(/\//g, `@@`)
                : `ie-` + encodeURIComponent(s(e))
        );
      }
      function h(e) {
        let t = [],
          {
            type: n,
            layerMode: r,
            position: i = {},
            timing: o = {},
            transformation: c = [],
          } = e || {};
        if (!n) return;
        switch (n) {
          case `text`:
            {
              let n = e;
              if (!n.text) return;
              let r = n.encoding || `auto`;
              (t.push(`l-text`),
                t.push(
                  (function (e, t) {
                    return t === `plain`
                      ? `i-` + encodeURIComponent(e)
                      : t === `base64`
                        ? `ie-` + encodeURIComponent(s(e))
                        : l.test(e)
                          ? `i-` + encodeURIComponent(e)
                          : `ie-` + encodeURIComponent(s(e));
                  })(n.text, r),
                ));
            }
            break;
          case `image`:
            t.push(`l-image`);
            {
              let n = e,
                r = n.encoding || `auto`;
              if (!n.input) return;
              t.push(m(n.input, r));
            }
            break;
          case `video`:
            t.push(`l-video`);
            {
              let n = e,
                r = n.encoding || `auto`;
              if (!n.input) return;
              t.push(m(n.input, r));
            }
            break;
          case `subtitle`:
            t.push(`l-subtitles`);
            {
              let n = e,
                r = n.encoding || `auto`;
              if (!n.input) return;
              t.push(m(n.input, r));
            }
            break;
          case `solidColor`:
            (t.push(`l-image`), t.push(`i-ik_canvas`));
            {
              let n = e;
              if (!n.color) return;
              t.push(`bg-` + n.color);
            }
        }
        r && t.push(`lm-` + r);
        let {
          x: u,
          y: d,
          xCenter: f,
          yCenter: p,
          anchorPoint: h,
          focus: _,
        } = i;
        (u && t.push(`lx-` + u),
          d && t.push(`ly-` + d),
          f && t.push(`lxc-` + f),
          p && t.push(`lyc-` + p),
          h && t.push(`lap-` + h),
          _ && t.push(`lfo-` + _));
        let { start: v, end: y, duration: b } = o;
        (v && t.push(`lso-` + v),
          y && t.push(`leo-` + y),
          b && t.push(`ldu-` + b));
        let x = g(c);
        return (
          x && x.trim() !== `` && t.push(x),
          t.push(`l-end`),
          t.join(a())
        );
      }
      let g = function (e) {
          if (!Array.isArray(e)) return ``;
          for (var t = [], n = 0, s = e.length; n < s; n++) {
            var c = [];
            for (var l in e[n]) {
              let t = e[n][l];
              if (t != null)
                if (l !== `overlay` || typeof t != `object`) {
                  var f = r(l);
                  if (((f ||= l), f !== ``))
                    if (
                      [
                        `e-grayscale`,
                        `e-contrast`,
                        `e-removedotbg`,
                        `e-bgremove`,
                        `e-upscale`,
                        `e-retouch`,
                        `e-genvar`,
                      ].includes(f)
                    ) {
                      if (!0 !== t && t !== `-` && t !== `true`) continue;
                      c.push(f);
                    } else
                      ![
                        `e-sharpen`,
                        `e-shadow`,
                        `e-gradient`,
                        `e-usm`,
                        `e-dropshadow`,
                      ].includes(f) ||
                      (t.toString().trim() !== `` && !0 !== t && t !== `true`)
                        ? l === `raw`
                          ? c.push(e[n][l])
                          : ((f !== `di` && f !== `ff`) ||
                              ((t = u(d(t || ``))),
                              (t = t.replace(/\//g, `@@`))),
                            f === `sr` && Array.isArray(t) && (t = t.join(`_`)),
                            f === `t` &&
                              t.toString().trim() === `` &&
                              (t = `true`),
                            c.push([f, t].join(o())))
                        : c.push(f);
                } else {
                  var p = h(t);
                  p && p.trim() !== `` && c.push(p);
                }
            }
            c.length && t.push(c.join(a()));
          }
          return t.join(i());
        },
        _ = [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
        v = [16, 32, 48, 64, 96, 128, 256, 384];
      var y = { message: `Missing file parameter for upload` },
        b = { message: `Missing fileName parameter for upload` },
        x = { message: `Missing public key for upload` },
        S = {
          message: `Request to ImageKit upload endpoint failed due to network error`,
        },
        C = {
          message: `Missing signature for upload. The SDK expects token, signature and expire for authentication.`,
        },
        w = {
          message: `Missing token for upload. The SDK expects token, signature and expire for authentication.`,
        },
        T = {
          message: `Missing expire for upload. The SDK expects token, signature and expire for authentication.`,
        },
        E = {
          message: `Invalid transformation parameter. Please include at least pre, post, or both.`,
        },
        D = { message: `Invalid pre transformation parameter.` },
        O = { message: `Invalid post transformation parameter.` };
      class k extends Error {
        constructor(e, t) {
          (super(e),
            (this.$ResponseMetadata = void 0),
            (this.name = `ImageKitInvalidRequestError`),
            (this.$ResponseMetadata = t));
        }
      }
      class A extends Error {
        constructor(e, t) {
          (super(e),
            (this.reason = void 0),
            (this.name = `ImageKitAbortError`),
            (this.reason = t));
        }
      }
      class j extends Error {
        constructor(e) {
          (super(e), (this.name = `ImageKitUploadNetworkError`));
        }
      }
      class M extends Error {
        constructor(e, t) {
          (super(e),
            (this.$ResponseMetadata = void 0),
            (this.name = `ImageKitServerError`),
            (this.$ResponseMetadata = t));
        }
      }
      let N = (e, t) => {
          let n = { ...e },
            r = P(t);
          return (
            Object.defineProperty(n, "$ResponseMetadata", {
              value: r,
              enumerable: !1,
              writable: !1,
            }),
            n
          );
        },
        P = (e) => {
          let t = (function (e) {
            let t = {},
              n = e.getAllResponseHeaders();
            return (
              Object.keys(n).length &&
                n
                  .trim()
                  .split(/[\r\n]+/)
                  .map((e) => e.split(/: /))
                  .forEach((e) => {
                    t[e[0].trim().toLowerCase()] = e[1].trim();
                  }),
              t
            );
          })(e);
          return {
            statusCode: e.status,
            headers: t,
            requestId: t[`x-request-id`],
          };
        };
      ((e.ImageKitAbortError = A),
        (e.ImageKitInvalidRequestError = k),
        (e.ImageKitServerError = M),
        (e.ImageKitUploadNetworkError = j),
        (e.buildSrc = p),
        (e.buildTransformationString = g),
        (e.getResponsiveImageAttributes = function (e) {
          let {
              src: t,
              urlEndpoint: n,
              transformation: r = [],
              queryParameters: i,
              transformationPosition: a,
              sizes: o,
              width: s,
              deviceBreakpoints: c = _,
              imageBreakpoints: l = v,
            } = e,
            u = [...c].sort((e, t) => e - t),
            { candidates: d, descriptorKind: f } = (function (e) {
              let {
                allBreakpoints: t,
                deviceBreakpoints: n,
                explicitWidth: r,
                sizesAttr: i,
              } = e;
              if (i) {
                let e = (i.match(/(^|\s)(1?\d{1,2})vw/g) || []).map((e) =>
                  parseInt(e, 10),
                );
                if (e.length) {
                  let r = Math.min(...e) / 100,
                    i = n[0] * r;
                  return {
                    candidates: t.filter((e) => e >= i),
                    descriptorKind: `w`,
                  };
                }
                return { candidates: t, descriptorKind: `w` };
              }
              if (typeof r != `number`)
                return { candidates: n, descriptorKind: `w` };
              let a = (e) => t.find((t) => t >= e) || t[t.length - 1];
              return {
                candidates: Array.from(new Set([a(r), a(2 * r)])),
                descriptorKind: `x`,
              };
            })({
              allBreakpoints: [...[...l].sort((e, t) => e - t), ...u].sort(
                (e, t) => e - t,
              ),
              deviceBreakpoints: u,
              explicitWidth: s,
              sizesAttr: o,
            }),
            m = (e) =>
              p({
                src: t,
                urlEndpoint: n,
                queryParameters: i,
                transformationPosition: a,
                transformation: [...r, { width: e, crop: `at_max` }],
              }),
            h =
              d
                .map((e, t) => `${m(e)} ${f === `w` ? e : t + 1}${f}`)
                .join(`, `) || void 0,
            g = o ?? (f === `w` ? `100vw` : void 0);
          return {
            src: m(d[d.length - 1]),
            srcSet: h,
            ...(g ? { sizes: g } : {}),
            ...(s === void 0 ? {} : { width: s }),
          };
        }),
        (e.upload = (e) =>
          e
            ? new Promise((t, n) => {
                let { xhr: r } = e || {};
                delete e.xhr;
                let i = r || new XMLHttpRequest();
                if (!e.file) return n(new k(y.message));
                if (!e.fileName) return n(new k(b.message));
                if (!e.publicKey || e.publicKey.length === 0)
                  return n(new k(x.message));
                if (!e.token) return n(new k(w.message));
                if (!e.signature) return n(new k(C.message));
                if (!e.expire) return n(new k(T.message));
                if (e.transformation) {
                  if (
                    !Object.keys(e.transformation).includes(`pre`) &&
                    !Object.keys(e.transformation).includes(`post`)
                  )
                    return n(new k(E.message));
                  if (
                    Object.keys(e.transformation).includes(`pre`) &&
                    !e.transformation.pre
                  )
                    return n(new k(D.message));
                  if (Object.keys(e.transformation).includes(`post`)) {
                    if (!Array.isArray(e.transformation.post))
                      return n(new k(O.message));
                    for (let t of e.transformation.post)
                      if (
                        (t.type === `abs` && !t.protocol && !t.value) ||
                        (t.type === `transformation` && !t.value)
                      )
                        return n(new k(O.message));
                  }
                }
                var a = new FormData();
                let o;
                for (o in e)
                  if (o)
                    if (o === `file` && typeof e.file != `string`)
                      a.set(`file`, e.file, String(e.fileName));
                    else if (o === `tags` && Array.isArray(e.tags))
                      a.set(`tags`, e.tags.join(`,`));
                    else if (o === `signature`) a.set(`signature`, e.signature);
                    else if (o === `expire`) a.set(`expire`, String(e.expire));
                    else if (o === `token`) a.set(`token`, e.token);
                    else if (
                      o === `responseFields` &&
                      Array.isArray(e.responseFields)
                    )
                      a.set(`responseFields`, e.responseFields.join(`,`));
                    else if (o === `extensions` && Array.isArray(e.extensions))
                      a.set(`extensions`, JSON.stringify(e.extensions));
                    else if (
                      o !== `customMetadata` ||
                      typeof e.customMetadata != `object` ||
                      Array.isArray(e.customMetadata) ||
                      e.customMetadata === null
                    ) {
                      if (
                        o === `transformation` &&
                        typeof e.transformation == `object` &&
                        e.transformation !== null
                      )
                        a.set(o, JSON.stringify(e.transformation));
                      else if (o === `checks` && e.checks)
                        a.set(`checks`, e.checks);
                      else if (e[o] !== void 0) {
                        if ([`onProgress`, `abortSignal`].includes(o)) continue;
                        a.set(o, String(e[o]));
                      }
                    } else
                      a.set(`customMetadata`, JSON.stringify(e.customMetadata));
                function s() {
                  return (
                    i.abort(),
                    n(new A(`Upload aborted`, e.abortSignal?.reason))
                  );
                }
                if (
                  (e.onProgress &&
                    (i.upload.onprogress = function (t) {
                      e.onProgress && e.onProgress(t);
                    }),
                  e.abortSignal)
                ) {
                  if (e.abortSignal.aborted)
                    return n(new A(`Upload aborted`, e.abortSignal?.reason));
                  (e.abortSignal.addEventListener(`abort`, s),
                    i.addEventListener(`loadend`, () => {
                      e.abortSignal &&
                        e.abortSignal.removeEventListener(`abort`, s);
                    }));
                }
                (i.open(
                  `POST`,
                  `https://upload.imagekit.io/api/v1/files/upload`,
                ),
                  (i.onerror = function (e) {
                    return n(new j(S.message));
                  }),
                  (i.onload = function () {
                    if (i.status >= 200 && i.status < 300)
                      try {
                        var e = JSON.parse(i.responseText);
                        return t(N(e, i));
                      } catch (e) {
                        return n(e);
                      }
                    else if (i.status >= 400 && i.status < 500)
                      try {
                        return (
                          (e = JSON.parse(i.responseText)),
                          n(
                            new k(
                              e.message ??
                                `Invalid request. Please check the parameters.`,
                              P(i),
                            ),
                          )
                        );
                      } catch (e) {
                        return n(e);
                      }
                    else
                      try {
                        return (
                          (e = JSON.parse(i.responseText)),
                          n(
                            new M(
                              e.message ??
                                `Server error occurred while uploading the file. This is rare and usually temporary.`,
                              P(i),
                            ),
                          )
                        );
                      } catch {
                        return n(
                          new M(
                            `Server error occurred while uploading the file. This is rare and usually temporary.`,
                            P(i),
                          ),
                        );
                      }
                  }),
                  i.send(a));
              })
            : Promise.reject(new k(`Invalid options provided for upload`))),
        Object.defineProperty(e, "__esModule", { value: !0 }));
    });
  })();
(0, m.createContext)({});
function Om(...e) {
  return Em(Pd(e));
}
function km(e) {
  let t = document.documentElement;
  for (let [n, r] of Object.entries(e))
    n.startsWith(`--`) && t.style.setProperty(n, r);
}
function Am(e) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
}
function jm(e) {
  let t = (e ?? ``).trim(),
    n = (t.includes(`@`) ? t.split(`@`)[0] : t)
      .split(/[\s._-]+/)
      .filter(Boolean);
  return n.length === 0
    ? `?`
    : n.length === 1
      ? n[0].slice(0, 2).toUpperCase()
      : `${n[0][0]}${n[n.length - 1][0]}`.toUpperCase();
}
function Mm(e = 32) {
  let t = ``;
  for (; t.length < e; ) {
    let n = crypto.getRandomValues(new Uint8Array(e));
    for (let r of n)
      r < 248 &&
        t.length < e &&
        (t += `ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789`[
          r % 62
        ]);
  }
  return t;
}
var Nm = (e) =>
  [
    { regex: RegExp(`.{8,}`), text: `At least 8 characters` },
    { regex: /[0-9]/, text: `At least 1 number` },
    { regex: /[a-z]/, text: `At least 1 lowercase letter` },
    { regex: /[A-Z]/, text: `At least 1 uppercase letter` },
  ].map((t) => ({ met: t.regex.test(e), text: t.text }));
function Pm(e, t = `default`) {
  if (!e) return `N/A`;
  let n = typeof e == `string` ? new Date(e) : e;
  return Number.isNaN(n.getTime())
    ? `N/A`
    : t === `timeAgo`
      ? np(n, { addSuffix: !0 })
      : $f(n, t === "default" ? `PP, hh:mm a` : t);
}
function Fm(e) {
  let t = e.toLowerCase(),
    n = `Unknown`,
    r = `Unknown`,
    i =
      /ipad|tablet/.test(t) || (t.includes(`android`) && !t.includes(`mobile`)),
    a = !i && /mobi|android|iphone/.test(t);
  return (
    t.includes(`edg/`) || t.includes(`edge`)
      ? (r = `Edge`)
      : t.includes(`opr`) || t.includes(`opera`)
        ? (r = `Opera`)
        : t.includes(`samsungbrowser`)
          ? (r = `Samsung Internet`)
          : t.includes(`brave`)
            ? (r = `Brave`)
            : t.includes(` arc/`)
              ? (r = `Arc`)
              : t.includes(`firefox`) || t.includes(`fxios`)
                ? (r = `Firefox`)
                : t.includes(`chrome`) || t.includes(`crios`)
                  ? (r = `Chrome`)
                  : t.includes(`safari`) && (r = `Safari`),
    /iphone|ipad|ipod/.test(t)
      ? (n = `iOS`)
      : t.includes(`android`)
        ? (n = `Android`)
        : t.includes(`windows`)
          ? (n = `Windows`)
          : t.includes(`mac`)
            ? (n = `macOS`)
            : t.includes(`linux`) && (n = `Linux`),
    {
      browser: r,
      os: n,
      isMobile: a,
      isTablet: i,
      deviceType: i ? `tablet` : a ? `mobile` : `desktop`,
      raw: e,
    }
  );
}
async function Im() {
  return navigator.userAgentData?.getHighEntropyValues([
    `model`,
    `platform`,
    `platformVersion`,
  ]);
}
var Lm = async (e, t) => {
  let n = Array.isArray(t?.path) ? t.path.join(`/`) : t?.path,
    {
      signature: r,
      expire: i,
      token: a,
      publicKey: o,
    } = await q.imageKit.auth();
  return await (0, Dm.upload)({
    expire: i,
    token: a,
    signature: r,
    publicKey: o,
    file: e,
    fileName: [n?.replace(/^\/|\/$/g, ``), t?.filename ?? e.name]
      .filter(Boolean)
      .join(`/`),
    onProgress: (e) => t?.onProgress?.((e.loaded / e.total) * 100),
    abortSignal: t?.signal,
  });
};
function Rm(e, t) {
  if (e)
    return !e.includes(`imagekit.io`) || e.includes(`?`)
      ? e
      : `${e}?tr=w-${t?.width ?? 100},h-${t?.height ?? 100}`;
}
function zm(e) {
  let t = new URL(`/auth`, window.location.origin)
    .toString()
    .replace(/\/$/, ``);
  return e ? [t, e.trim().replace(/^\//, ``)].join(`/`) : t;
}
function Bm(e) {
  if (!e) return null;
  try {
    let t = new URL(e, window.location.origin);
    return t.protocol === `https:` || t.protocol === `http:`
      ? t.toString()
      : null;
  } catch {
    return null;
  }
}
function Vm(e) {
  if (!e) return ``;
  let t = new Date(e);
  return Number.isNaN(t.getTime())
    ? ``
    : `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, `0`)}-${String(t.getDate()).padStart(2, `0`)}`;
}
function Hm(e, t) {
  let n = URL.createObjectURL(new Blob([t], { type: `text/plain` })),
    r = document.createElement(`a`);
  ((r.href = n), (r.download = e), r.click(), URL.revokeObjectURL(n));
}
var Um = (...e) =>
    e
      .filter((e, t, n) => !!e && e.trim() !== `` && n.indexOf(e) === t)
      .join(` `)
      .trim(),
  Wm = (e) => e.replace(/([a-z0-9])([A-Z])/g, `$1-$2`).toLowerCase(),
  Gm = (e) =>
    e.replace(/^([A-Z])|[\s-_]+(\w)/g, (e, t, n) =>
      n ? n.toUpperCase() : t.toLowerCase(),
    ),
  Km = (e) => {
    let t = Gm(e);
    return t.charAt(0).toUpperCase() + t.slice(1);
  },
  qm = {
    xmlns: `http://www.w3.org/2000/svg`,
    width: 24,
    height: 24,
    viewBox: `0 0 24 24`,
    fill: `none`,
    stroke: `currentColor`,
    strokeWidth: 2,
    strokeLinecap: `round`,
    strokeLinejoin: `round`,
  },
  Jm = (e) => {
    for (let t in e)
      if (t.startsWith(`aria-`) || t === `role` || t === `title`) return !0;
    return !1;
  },
  Ym = (0, m.createContext)({}),
  Xm = () => (0, m.useContext)(Ym),
  Zm = (0, m.forwardRef)(
    (
      {
        color: e,
        size: t,
        strokeWidth: n,
        absoluteStrokeWidth: r,
        className: i = ``,
        children: a,
        iconNode: o,
        ...s
      },
      c,
    ) => {
      let {
          size: l = 24,
          strokeWidth: u = 2,
          absoluteStrokeWidth: d = !1,
          color: f = `currentColor`,
          className: p = ``,
        } = Xm() ?? {},
        h = (r ?? d) ? (Number(n ?? u) * 24) / Number(t ?? l) : (n ?? u);
      return (0, m.createElement)(
        `svg`,
        {
          ref: c,
          ...qm,
          width: t ?? l ?? qm.width,
          height: t ?? l ?? qm.height,
          stroke: e ?? f,
          strokeWidth: h,
          className: Um(`lucide`, p, i),
          ...(!a && !Jm(s) && { "aria-hidden": `true` }),
          ...s,
        },
        [
          ...o.map(([e, t]) => (0, m.createElement)(e, t)),
          ...(Array.isArray(a) ? a : [a]),
        ],
      );
    },
  ),
  Qm = (e, t) => {
    let n = (0, m.forwardRef)(({ className: n, ...r }, i) =>
      (0, m.createElement)(Zm, {
        ref: i,
        iconNode: t,
        className: Um(`lucide-${Wm(Km(e))}`, `lucide-${e}`, n),
        ...r,
      }),
    );
    return ((n.displayName = Km(e)), n);
  },
  $m = fu(
    yu,
    (e) => (t, n, r) => (
      (r.revalidateOnFocus = !1),
      (r.revalidateIfStale = !1),
      (r.revalidateOnReconnect = !1),
      (r.refreshInterval = 0),
      e(t, n, r)
    ),
  ),
  eh = `/auth/assets/huruf-logo-DZY2c4zY.png`,
  th = eh;
function nh() {
  let { data: e, error: t, isLoading: n } = $m(`app-branding`, al),
    r = e?.name ? e : null;
  return {
    isLoading: n,
    error: t ?? null,
    app: r,
    appName: r?.name ?? `Huruf Tech`,
    logo: r?.logo || r?.icon || th,
  };
}
export {
  Sl as $,
  fd as A,
  Nu as B,
  jd as C,
  p as Ct,
  Td as D,
  Ed as E,
  l as Et,
  zu as F,
  Su as G,
  ku as H,
  Fu as I,
  yu as J,
  xu as K,
  Iu as L,
  ad as M,
  $u as N,
  yd as O,
  Xu as P,
  Zl as Q,
  Pu as R,
  Md as S,
  v as St,
  Ad as T,
  o as Tt,
  Eu as U,
  Ou as V,
  wu as W,
  ru as X,
  fu as Y,
  ll as Z,
  Am as _,
  tr as _t,
  Qm as a,
  ol as at,
  Rm as b,
  Cr as bt,
  Om as c,
  xa as ct,
  Vm as d,
  zr as dt,
  fl as et,
  Mm as f,
  Br as ft,
  Lm as g,
  Ve as gt,
  Bm as h,
  F as ht,
  $m as i,
  rl as it,
  cd as j,
  md as k,
  Hm as l,
  _a as lt,
  jm as m,
  ki as mt,
  nh as n,
  Ul as nt,
  km as o,
  q as ot,
  Im as p,
  Fr as pt,
  vu as q,
  eh as r,
  Fl as rt,
  Nm as s,
  Ta as st,
  th as t,
  J as tt,
  Pm as u,
  Pi as ut,
  Fm as v,
  xr as vt,
  Dd as w,
  d as wt,
  Pd as x,
  Hi as xt,
  zm as y,
  ar as yt,
  Mu as z,
};

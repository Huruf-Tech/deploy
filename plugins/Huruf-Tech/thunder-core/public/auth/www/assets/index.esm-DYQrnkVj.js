import { Et as e, wt as t } from "./useAppBranding-GcljM9XV.js";
var n = e(t(), 1),
  r = (e) => e.type === `checkbox`,
  i = (e) => e instanceof Date,
  a = (e) => e == null,
  o = (e) => typeof e == `object`,
  s = (e) => !a(e) && !Array.isArray(e) && o(e) && !i(e),
  c = (e) =>
    s(e) && e.target ? (r(e.target) ? e.target.checked : e.target.value) : e,
  l = (e, t) =>
    t
      .split(`.`)
      .some((t, n, r) => !isNaN(Number(t)) && e.has(r.slice(0, n).join(`.`))),
  u = (e) => {
    let t = e.constructor && e.constructor.prototype;
    return s(t) && t.hasOwnProperty(`isPrototypeOf`);
  },
  d =
    typeof window < `u` &&
    window.HTMLElement !== void 0 &&
    typeof document < `u`;
function f(e) {
  if (e instanceof Date) return new Date(e);
  let t = typeof FileList < `u` && e instanceof FileList;
  if (d && (e instanceof Blob || t)) return e;
  let n = Array.isArray(e);
  if (!n && !(s(e) && u(e))) return e;
  let r = n ? [] : Object.create(Object.getPrototypeOf(e));
  for (let t in e)
    Object.prototype.hasOwnProperty.call(e, t) && (r[t] = f(e[t]));
  return r;
}
var p = {
    BLUR: `blur`,
    FOCUS_OUT: `focusout`,
    CHANGE: `change`,
    SUBMIT: `submit`,
    TRIGGER: `trigger`,
    VALID: `valid`,
  },
  m = {
    onBlur: `onBlur`,
    onChange: `onChange`,
    onSubmit: `onSubmit`,
    onTouched: `onTouched`,
    all: `all`,
  },
  h = {
    max: `max`,
    min: `min`,
    maxLength: `maxLength`,
    minLength: `minLength`,
    pattern: `pattern`,
    required: `required`,
    validate: `validate`,
  },
  g = `form`,
  _ = `root`,
  v = [`__proto__`, `constructor`, `prototype`],
  y = (e) => /^\w*$/.test(e),
  b = (e) => e === void 0,
  x = (e) => e.split(/[.[\]'"]/g).filter(Boolean),
  S = (e, t, n) => {
    if (!t || !s(e)) return n;
    let r = y(t) ? [t] : x(t);
    if (r.some((e) => v.includes(e))) return n;
    let i = r.reduce((e, t) => (a(e) ? void 0 : e[t]), e);
    return b(i) || i === e ? (b(e[t]) ? n : e[t]) : i;
  },
  C = (e) => typeof e == `boolean`,
  w = (e) => typeof e == `function`,
  T = (e, t, n) => {
    let r = -1,
      i = y(t) ? [t] : x(t),
      a = i.length,
      o = a - 1;
    for (; ++r < a; ) {
      let t = i[r],
        a = n;
      if (r !== o) {
        let n = e[t];
        a = s(n) || Array.isArray(n) ? n : isNaN(+i[r + 1]) ? {} : [];
      }
      if (v.includes(t)) return;
      ((e[t] = a), (e = e[t]));
    }
  },
  E = n.createContext(null);
E.displayName = `HookFormControlContext`;
var D = () => n.useContext(E),
  O = (e, t, n, r = !0) => {
    let i = {};
    for (let a in e)
      Object.defineProperty(i, a, {
        get: () => {
          let i = a;
          return (
            t._proxyFormState[i] !== m.all &&
              (t._proxyFormState[i] = !r || m.all),
            n && (n[i] = !0),
            e[i]
          );
        },
      });
    return i;
  },
  k = d ? n.useLayoutEffect : n.useEffect;
function A(e) {
  let t = D(),
    { control: r = t, disabled: i, name: a, exact: o } = e || {},
    [s, c] = n.useState(() => ({
      ...r._formState,
      defaultValues: r._defaultValues,
    })),
    l = n.useRef({
      isDirty: !1,
      isLoading: !1,
      dirtyFields: !1,
      touchedFields: !1,
      validatingFields: !1,
      isValidating: !1,
      isValid: !1,
      errors: !1,
    });
  return (
    k(
      () =>
        r._subscribe({
          name: a,
          formState: l.current,
          exact: o,
          callback: (e) => {
            !i && c({ ...r._formState, ...e, defaultValues: r._defaultValues });
          },
        }),
      [a, i, o],
    ),
    n.useEffect(() => {
      l.current.isValid && r._setValid(!0);
    }, [r]),
    n.useMemo(() => O(s, r, l.current, !1), [s, r])
  );
}
var j = (e) => typeof e == `string`,
  ee = (e, t, n, r, i) =>
    j(e)
      ? (r && t.watch.add(e), S(n, e, i))
      : Array.isArray(e)
        ? e.map((e) => (r && t.watch.add(e), S(n, e)))
        : (r && (t.watchAll = !0), n),
  M = (e) => a(e) || !o(e),
  N = (e, t) => t.length === 0 && !Array.isArray(e) && !u(e);
function P(e, t, n = new WeakSet()) {
  if (e === t) return !0;
  if (M(e) || M(t)) return Object.is(e, t);
  if (i(e) && i(t)) return Object.is(e.getTime(), t.getTime());
  let r = Object.keys(e),
    a = Object.keys(t);
  if (r.length !== a.length) return !1;
  if (N(e, r) || N(t, a)) return Object.is(e, t);
  if (n.has(e) || n.has(t)) return !0;
  (n.add(e), n.add(t));
  for (let a of r) {
    let r = e[a];
    if (!(a in t)) return !1;
    if (a !== `ref`) {
      let e = t[a];
      if (
        (i(r) && i(e)) ||
        ((s(r) || Array.isArray(r)) && (s(e) || Array.isArray(e)))
          ? !P(r, e, n)
          : !Object.is(r, e)
      )
        return !1;
    }
  }
  return !0;
}
function F(e) {
  let t = D(),
    {
      control: r = t,
      name: i,
      defaultValue: a,
      disabled: o,
      exact: s,
      compute: c,
    } = e || {},
    l = n.useRef(a),
    u = n.useRef(c),
    d = n.useRef(void 0),
    f = n.useRef(r),
    p = n.useRef(i);
  u.current = c;
  let [m, h] = n.useState(() => {
      let e = r._getWatch(i, l.current);
      return u.current ? u.current(e) : e;
    }),
    g = n.useCallback(
      (e) => {
        let t = ee(i, r._names, e || r._formValues, !1, l.current);
        return u.current ? u.current(t) : t;
      },
      [r._formValues, r._names, i],
    ),
    _ = n.useCallback(
      (e) => {
        if (!o) {
          let t = ee(i, r._names, e || r._formValues, !1, l.current);
          if (u.current) {
            let e = u.current(t);
            P(e, d.current) || (h(e), (d.current = e));
          } else h(t);
        }
      },
      [r._formValues, r._names, o, i],
    );
  (k(
    () => (
      (f.current !== r || !P(p.current, i)) &&
        ((f.current = r), (p.current = i), _()),
      r._subscribe({
        name: i,
        formState: { values: !0 },
        exact: s,
        callback: (e) => {
          _(e.values);
        },
      })
    ),
    [r, s, i, _],
  ),
    n.useEffect(() => r._removeUnmounted()));
  let v = f.current !== r,
    y = p.current,
    b = n.useMemo(() => {
      if (o) return null;
      let e = !v && !P(y, i);
      return v || e ? g() : null;
    }, [o, v, i, y, g]);
  return b === null ? m : b;
}
function te(e) {
  let t = D(),
    {
      name: r,
      disabled: i,
      control: a = t,
      shouldUnregister: o,
      defaultValue: s,
      exact: u = !0,
    } = e,
    d = l(a._names.array, r),
    m = F({
      control: a,
      name: r,
      defaultValue: n.useMemo(
        () => S(a._formValues, r, S(a._defaultValues, r, s)),
        [a, r, s],
      ),
      exact: u,
    }),
    h = A({ control: a, name: r, exact: u }),
    g = n.useRef(e),
    _ = n.useRef(
      a.register(r, {
        ...e.rules,
        value: m,
        ...(C(e.disabled) ? { disabled: e.disabled } : {}),
      }),
    );
  g.current = e;
  let v = n.useMemo(
      () =>
        Object.defineProperties(
          {},
          {
            invalid: { enumerable: !0, get: () => !!S(h.errors, r) },
            isDirty: { enumerable: !0, get: () => !!S(h.dirtyFields, r) },
            isTouched: { enumerable: !0, get: () => !!S(h.touchedFields, r) },
            isValidating: {
              enumerable: !0,
              get: () => !!S(h.validatingFields, r),
            },
            error: { enumerable: !0, get: () => S(h.errors, r) },
          },
        ),
      [h, r],
    ),
    y = n.useCallback(
      (e) => {
        let t = c(e);
        (S(a._fields, r) ||
          (_.current = a.register(r, { ...g.current.rules, value: t })),
          _.current.onChange({
            target: { value: c(e), name: r },
            type: p.CHANGE,
          }));
      },
      [r, a],
    ),
    x = n.useCallback(
      () =>
        _.current.onBlur({
          target: { value: S(a._formValues, r), name: r },
          type: p.BLUR,
        }),
      [r, a._formValues],
    ),
    E = n.useCallback(
      (e) => {
        let t = S(a._fields, r);
        t &&
          t._f &&
          e &&
          (t._f.ref = {
            focus: () => w(e.focus) && e.focus(),
            select: () => w(e.select) && e.select(),
            setCustomValidity: (t) =>
              w(e.setCustomValidity) && e.setCustomValidity(t),
            reportValidity: () => w(e.reportValidity) && e.reportValidity(),
          });
      },
      [a._fields, r],
    ),
    O = n.useMemo(
      () => ({
        name: r,
        value: m,
        ...(C(i) || h.disabled ? { disabled: h.disabled || i } : {}),
        onChange: y,
        onBlur: x,
        ref: E,
      }),
      [r, i, h.disabled, y, x, E, m],
    );
  return (
    n.useEffect(() => {
      let e = a._options.shouldUnregister || o;
      a.register(r, {
        ...g.current.rules,
        ...(C(g.current.disabled) ? { disabled: g.current.disabled } : {}),
      });
      let t = (e, t) => {
        let n = S(a._fields, e);
        n && n._f && (n._f.mount = t);
      };
      if ((t(r, !0), e)) {
        let e = f(
          S(
            o ? a._defaultValues : a._options.values || a._defaultValues,
            r,
            S(a._options.defaultValues, r, g.current.defaultValue),
          ),
        );
        (T(a._defaultValues, r, e),
          b(S(a._formValues, r)) && T(a._formValues, r, e));
      }
      return (
        !d && a.register(r),
        () => {
          (d ? e && !a._state.action : e) ? a.unregister(r) : t(r, !1);
        }
      );
    }, [r, a, d, o]),
    n.useEffect(() => {
      a._setDisabledField({ disabled: i, name: r });
    }, [i, r, a]),
    n.useMemo(() => ({ field: O, formState: h, fieldState: v }), [O, h, v])
  );
}
var ne = (e) => e.render(te(e)),
  I = n.createContext(null);
I.displayName = `HookFormContext`;
var L = (e, t, n, r, i) =>
    t
      ? {
          ...n[e],
          types: { ...(n[e] && n[e].types ? n[e].types : {}), [r]: i || !0 },
        }
      : {},
  re = (e) => (Array.isArray(e) ? e.filter(Boolean) : []),
  R = (e) => (Array.isArray(e) ? e : [e]),
  ie = () => {
    let e = [];
    return {
      get observers() {
        return e;
      },
      next: (t) => {
        for (let n of e) n.next && n.next(t);
      },
      subscribe: (t) => (
        e.push(t),
        {
          unsubscribe: () => {
            e = e.filter((e) => e !== t);
          },
        }
      ),
      unsubscribe: () => {
        e = [];
      },
    };
  };
function ae(e, t) {
  let n = {};
  for (let r in e)
    if (e.hasOwnProperty(r)) {
      let i = e[r],
        a = t[r];
      if (i && s(i) && a) {
        let e = ae(i, a);
        s(e) && (n[r] = e);
      } else e[r] && (n[r] = a);
    }
  return n;
}
var z = (e) => s(e) && !Object.keys(e).length,
  oe = (e) => e.type === `file`,
  se = (e) => {
    if (!d) return !1;
    let t = e ? e.ownerDocument : 0;
    return (
      e instanceof
      (t && t.defaultView ? t.defaultView.HTMLElement : HTMLElement)
    );
  },
  ce = (e) => e.type === `select-multiple`,
  le = (e) => e.type === `radio`,
  ue = (e) => le(e) || r(e),
  de = (e) => se(e) && e.isConnected;
function fe(e, t) {
  let n = t.slice(0, -1).length,
    r = 0;
  for (; r < n; ) {
    if (a(e)) {
      e = void 0;
      break;
    }
    ((e = e[t[r]]), r++);
  }
  return e;
}
function pe(e) {
  for (let t in e) if (e.hasOwnProperty(t) && !b(e[t])) return !1;
  return !0;
}
function B(e, t) {
  if (j(t) && Object.prototype.hasOwnProperty.call(e, t))
    return (delete e[t], e);
  let n = Array.isArray(t) ? t : y(t) ? [t] : x(t),
    r = n.length === 1 ? e : fe(e, n),
    i = n.length - 1,
    a = n[i];
  return (
    r && delete r[a],
    i !== 0 &&
      ((s(r) && z(r)) || (Array.isArray(r) && pe(r))) &&
      B(e, n.slice(0, -1)),
    e
  );
}
var me = (e) => {
  for (let t in e) if (w(e[t])) return !0;
  return !1;
};
function he(e) {
  return Array.isArray(e) || (s(e) && !me(e));
}
function ge(e, t = {}) {
  for (let n in e) {
    let r = e[n];
    he(r)
      ? ((t[n] = Array.isArray(r) ? [] : {}), ge(r, t[n]))
      : b(r) || (t[n] = !0);
  }
  return t;
}
function V(e) {
  if (e !== !1) {
    if (e === !0) return !0;
    if (Array.isArray(e)) {
      let t = e.map((e) => V(e));
      return t.some((e) => e !== void 0) ? t : void 0;
    }
    if (s(e)) {
      let t = {};
      for (let n in e) {
        let r = V(e[n]);
        b(r) || (t[n] = r);
      }
      return Object.keys(t).length ? t : void 0;
    }
  }
}
function H(e, t, n) {
  n ||= ge(t);
  for (let r in e) {
    let i = e[r];
    if (he(i))
      b(t) || M(n[r])
        ? (n[r] = ge(i, Array.isArray(i) ? [] : {}))
        : H(i, a(t) ? {} : t[r], n[r]);
    else {
      let e = t[r];
      n[r] = !P(i, e);
    }
  }
  return V(n) || {};
}
var _e = { value: !1, isValid: !1 },
  U = { value: !0, isValid: !0 },
  ve = (e) => {
    if (Array.isArray(e)) {
      if (e.length > 1) {
        let t = e
          .filter((e) => e && e.checked && !e.disabled)
          .map((e) => e.value);
        return { value: t, isValid: !!t.length };
      }
      return e[0].checked && !e[0].disabled
        ? e[0].attributes && !b(e[0].attributes.value)
          ? b(e[0].value) || e[0].value === ``
            ? U
            : { value: e[0].value, isValid: !0 }
          : U
        : _e;
    }
    return _e;
  },
  ye = (e, { valueAsNumber: t, valueAsDate: n, setValueAs: r }) =>
    b(e)
      ? e
      : t
        ? e === ``
          ? NaN
          : e && +e
        : n && j(e)
          ? new Date(e)
          : r
            ? r(e)
            : e,
  be = { isValid: !1, value: null },
  W = (e) =>
    Array.isArray(e)
      ? e.reduce(
          (e, t) =>
            t && t.checked && !t.disabled ? { isValid: !0, value: t.value } : e,
          be,
        )
      : be;
function xe(e) {
  let t = e.ref;
  return oe(t)
    ? t.files
    : le(t)
      ? W(e.refs).value
      : ce(t)
        ? [...t.selectedOptions].map(({ value: e }) => e)
        : r(t)
          ? ve(e.refs).value
          : ye(b(t.value) ? e.ref.value : t.value, e);
}
var Se = (e, t, n, r) => {
    let i = {};
    for (let n of e) {
      let e = S(t, n);
      e && T(i, n, e._f);
    }
    return {
      criteriaMode: n,
      names: [...e],
      fields: i,
      shouldUseNativeValidation: r,
    };
  },
  G = (e) => e instanceof RegExp,
  Ce = (e) =>
    b(e)
      ? e
      : G(e)
        ? e.source
        : s(e)
          ? G(e.value)
            ? e.value.source
            : e.value
          : e,
  K = (e) => ({
    isOnSubmit: !e || e === m.onSubmit,
    isOnBlur: e === m.onBlur,
    isOnChange: e === m.onChange,
    isOnAll: e === m.all,
    isOnTouch: e === m.onTouched,
  }),
  q = `AsyncFunction`,
  we = (e) =>
    !!e &&
    !!e.validate &&
    !!(
      (w(e.validate) && e.validate.constructor.name === q) ||
      (s(e.validate) &&
        Object.values(e.validate).find((e) => e.constructor.name === q))
    ),
  Te = (e) =>
    e.mount &&
    (e.required ||
      e.min ||
      e.max ||
      e.maxLength ||
      e.minLength ||
      e.pattern ||
      e.validate),
  Ee = (e, t, n) =>
    !n &&
    (t.watchAll ||
      t.watch.has(e) ||
      [...t.watch].some((t) => e.startsWith(`${t}.`))),
  J = (e, t, n, r) => {
    for (let i of n || Object.keys(e)) {
      let n = S(e, i);
      if (n) {
        let { _f: e, ...a } = n;
        if (e) {
          if (
            (e.refs && e.refs[0] && t(e.refs[0], i) && !r) ||
            (e.ref && t(e.ref, e.name) && !r)
          )
            return !0;
          if (J(a, t)) break;
        } else if (s(a) && J(a, t)) break;
      }
    }
  };
function De(e, t, n) {
  let r = S(e, n);
  if (r || y(n)) return { error: r, name: n };
  let i = n.split(`.`);
  for (; i.length; ) {
    let r = i.join(`.`),
      a = S(t, r),
      o = S(e, r);
    if (a && !Array.isArray(a) && n !== r) return { name: n };
    if (o && o.type) return { name: r, error: o };
    if (o && o.root && o.root.type) return { name: `${r}.root`, error: o.root };
    i.pop();
  }
  return { name: n };
}
var Oe = (e, t, n, r) => {
    n(e);
    let { name: i, ...a } = e;
    return (
      z(a) ||
      (r && Object.keys(a).length >= Object.keys(t).length) ||
      Object.keys(a).find((e) => t[e] === (!r || m.all))
    );
  },
  ke = (e, t, n) =>
    !e ||
    !t ||
    e === t ||
    R(e).some((e) => e && (n ? e === t : e.startsWith(t) || t.startsWith(e))),
  Ae = (e, t, n, r, i) =>
    i.isOnAll
      ? !1
      : !n && i.isOnTouch
        ? !(t || e)
        : (n ? r.isOnBlur : i.isOnBlur)
          ? !e
          : (n ? r.isOnChange : i.isOnChange)
            ? e
            : !0,
  je = (e, t) => !re(S(e, t)).length && B(e, t),
  Me = (e, t, n) => {
    let r = S(e, n),
      i = Array.isArray(r) ? r : [];
    return (T(i, _, t[n]), T(e, n, i), e);
  };
function Ne(e, t, n = `validate`) {
  if (j(e) || (Array.isArray(e) && e.every(j)) || (C(e) && !e))
    return { type: n, message: j(e) ? e : ``, ref: t };
}
var Y = (e) => (s(e) && !G(e) ? e : { value: e, message: `` }),
  Pe = async (e, t, n, i, o, c) => {
    let {
        ref: l,
        refs: u,
        required: d,
        maxLength: f,
        minLength: p,
        min: m,
        max: g,
        pattern: _,
        validate: v,
        name: y,
        valueAsNumber: x,
        mount: T,
      } = e._f,
      E = S(n, y);
    if (!T || t.has(y)) return {};
    let D = u ? u[0] : l,
      O = (e) => {
        o &&
          D.reportValidity &&
          (D.setCustomValidity(C(e) ? `` : e || ``), D.reportValidity());
      },
      k = {},
      A = le(l),
      ee = r(l),
      M = A || ee,
      N =
        ((x || oe(l)) && b(l.value) && b(E)) ||
        (se(l) && l.value === ``) ||
        E === `` ||
        (Array.isArray(E) && !E.length),
      P = L.bind(null, y, i, k),
      F = (e, t, n, r = h.maxLength, i = h.minLength) => {
        let a = e ? t : n;
        k[y] = { type: e ? r : i, message: a, ref: l, ...P(e ? r : i, a) };
      };
    if (
      c
        ? !Array.isArray(E) || !E.length
        : d &&
          ((!M && (N || a(E))) ||
            (C(E) && !E) ||
            (ee && !ve(u).isValid) ||
            (A && !W(u).isValid))
    ) {
      let { value: e, message: t } = j(d) ? { value: !!d, message: d } : Y(d);
      if (
        e &&
        ((k[y] = { type: h.required, message: t, ref: D, ...P(h.required, t) }),
        !i)
      )
        return (O(t), k);
    }
    if (!N && (!a(m) || !a(g))) {
      let e,
        t,
        n = Y(g),
        r = Y(m);
      if (!a(E) && !isNaN(E)) {
        let i = l.valueAsNumber || (E && +E);
        (a(n.value) || (e = i > n.value), a(r.value) || (t = i < r.value));
      } else {
        let i = l.valueAsDate || new Date(E),
          a = (e) => new Date(new Date().toDateString() + ` ` + e),
          o = l.type == `time`,
          s = l.type == `week`;
        (j(n.value) &&
          E &&
          (e = o ? a(E) > a(n.value) : s ? E > n.value : i > new Date(n.value)),
          j(r.value) &&
            E &&
            (t = o
              ? a(E) < a(r.value)
              : s
                ? E < r.value
                : i < new Date(r.value)));
      }
      if ((e || t) && (F(!!e, n.message, r.message, h.max, h.min), !i))
        return (O(k[y].message), k);
    }
    if ((f || p) && !N && (j(E) || (c && Array.isArray(E)))) {
      let e = Y(f),
        t = Y(p),
        n = !a(e.value) && E.length > +e.value,
        r = !a(t.value) && E.length < +t.value;
      if ((n || r) && (F(n, e.message, t.message), !i))
        return (O(k[y].message), k);
    }
    if (_ && !N && j(E)) {
      let { value: e, message: t } = Y(_);
      if (
        G(e) &&
        !E.match(e) &&
        ((k[y] = { type: h.pattern, message: t, ref: l, ...P(h.pattern, t) }),
        !i)
      )
        return (O(t), k);
    }
    if (v) {
      if (w(v)) {
        let e = Ne(await v(E, n), D);
        if (e && ((k[y] = { ...e, ...P(h.validate, e.message) }), !i))
          return (O(e.message), k);
      } else if (s(v)) {
        let e = {};
        for (let t in v) {
          if (!z(e) && !i) break;
          let r = Ne(await v[t](E, n), D, t);
          r &&
            ((e = { ...r, ...P(t, r.message) }), O(r.message), i && (k[y] = e));
        }
        if (!z(e) && ((k[y] = { ref: D, ...e }), !i)) return k;
      }
    }
    return (O(!0), k);
  },
  Fe = { mode: m.onSubmit, reValidateMode: m.onChange, shouldFocusError: !0 },
  Ie = {
    submitCount: 0,
    isDirty: !1,
    isReady: !1,
    isValidating: !1,
    isSubmitted: !1,
    isSubmitting: !1,
    isSubmitSuccessful: !1,
    isValid: !1,
    touchedFields: {},
    dirtyFields: {},
    validatingFields: {},
  };
function Le(e = {}) {
  let t = { ...Fe, ...e },
    n = {
      ...f(Ie),
      isLoading: w(t.defaultValues),
      errors: t.errors || {},
      disabled: t.disabled || !1,
    },
    o = {},
    u =
      ((s(t.defaultValues) || s(t.values)) && f(t.defaultValues || t.values)) ||
      {},
    v = t.shouldUnregister ? {} : f(u),
    E = { action: !1, mount: !1, watch: !1, keepIsValid: !1 },
    D = {
      mount: new Set(),
      disabled: new Set(),
      unMount: new Set(),
      array: new Set(),
      watch: new Set(),
      registerName: new Set(),
    },
    O,
    k = 0,
    A = {
      isDirty: !1,
      dirtyFields: !1,
      validatingFields: !1,
      touchedFields: !1,
      isValidating: !1,
      isValid: !1,
      errors: !1,
    },
    M = { ...A },
    N = { ...M },
    F = { array: ie(), state: ie() },
    te = t.criteriaMode === m.all,
    ne = (e) => (t) => {
      (clearTimeout(k), (k = setTimeout(e, t)));
    },
    I = async (e) => {
      if (!E.keepIsValid && !t.disabled && (M.isValid || N.isValid || e)) {
        let e;
        (t.resolver
          ? ((e = z((await U()).errors)), L())
          : (e = await W({
              fields: o,
              onlyCheckValid: !0,
              eventType: p.VALID,
            })),
          e !== n.isValid && F.state.next({ isValid: e }));
      }
    },
    L = (e, r) => {
      !t.disabled &&
        (M.isValidating ||
          M.validatingFields ||
          N.isValidating ||
          N.validatingFields) &&
        ((e || Array.from(D.mount)).forEach((e) => {
          e && (r ? T(n.validatingFields, e, r) : B(n.validatingFields, e));
        }),
        F.state.next({
          validatingFields: n.validatingFields,
          isValidating: !z(n.validatingFields),
        }));
    },
    le = () => {
      n.dirtyFields = H(u, v);
    },
    fe = (e, r = [], i, a, s = !0, c = !0) => {
      if (a && i && !t.disabled) {
        if (((E.action = !0), c && Array.isArray(S(o, e)))) {
          let t = i(S(o, e), a.argA, a.argB);
          s && T(o, e, t);
        }
        if (c && Array.isArray(S(n.errors, e))) {
          let t = i(S(n.errors, e), a.argA, a.argB);
          (s && T(n.errors, e, t), je(n.errors, e));
        }
        if (
          (M.touchedFields || N.touchedFields) &&
          c &&
          Array.isArray(S(n.touchedFields, e))
        ) {
          let t = i(S(n.touchedFields, e), a.argA, a.argB);
          s && T(n.touchedFields, e, t);
        }
        ((M.dirtyFields || N.dirtyFields) && le(),
          F.state.next({
            name: e,
            isDirty: q(e, r),
            dirtyFields: n.dirtyFields,
            errors: n.errors,
            isValid: n.isValid,
          }));
      } else T(v, e, r);
    },
    pe = (e, t) => {
      (T(n.errors, e, t), F.state.next({ errors: n.errors }));
    },
    me = (e) => {
      ((n.errors = e), F.state.next({ errors: n.errors, isValid: !1 }));
    },
    he = (e) => {
      let t = y(e) ? [e] : x(e),
        n = v,
        r = u;
      for (let e = 0; e < t.length - 1; e++) {
        let i = t[e];
        if (
          ((n = a(n) ? n : n[i]),
          (r = a(r) ? r : r[i]),
          n === null && r !== null)
        )
          return !0;
      }
      return !1;
    },
    ge = (e, t, r, i) => {
      let a = S(o, e);
      if (a) {
        if (he(e)) return;
        let o = b(S(v, e)),
          s = S(v, e, b(r) ? S(u, e) : r);
        (b(s) || (i && i.defaultChecked) || t
          ? T(v, e, t ? s : xe(a._f))
          : Le(e, s),
          E.mount &&
            !E.action &&
            (I(),
            o &&
              n.isDirty &&
              (M.isDirty || N.isDirty) &&
              (q() || ((n.isDirty = !1), F.state.next({ ...n })))));
      }
    },
    V = (e, r, i, a, o) => {
      let s = !1,
        c = !1,
        l = { name: e };
      if (!t.disabled) {
        if (!i || a) {
          (M.isDirty || N.isDirty) &&
            ((c = n.isDirty),
            (n.isDirty = l.isDirty = q()),
            (s = c !== l.isDirty));
          let t = P(S(u, e), r);
          ((c = !!S(n.dirtyFields, e)),
            t === n.isDirty
              ? t
                ? B(n.dirtyFields, e)
                : T(n.dirtyFields, e, !0)
              : (n.dirtyFields = H(u, v)),
            (l.dirtyFields = n.dirtyFields),
            (s ||= (M.dirtyFields || N.dirtyFields) && c !== !t));
        }
        if (i) {
          let t = S(n.touchedFields, e);
          t ||
            (T(n.touchedFields, e, i),
            (l.touchedFields = n.touchedFields),
            (s ||= (M.touchedFields || N.touchedFields) && t !== i));
        }
        s && o && F.state.next(l);
      }
      return s ? l : {};
    },
    _e = (e, r, i, a) => {
      let o = S(n.errors, e),
        s = (M.isValid || N.isValid) && C(r) && n.isValid !== r;
      if (
        (t.delayError && i
          ? ((O = ne(() => pe(e, i))), O(t.delayError))
          : (clearTimeout(k),
            (O = null),
            i ? T(n.errors, e, i) : B(n.errors, e)),
        (i ? !P(o, i) : o) || !z(a) || s)
      ) {
        let t = {
          ...a,
          ...(s && C(r) ? { isValid: r } : {}),
          errors: n.errors,
          name: e,
        };
        ((n = { ...n, ...t }), F.state.next(t));
      }
    },
    U = async (e) => (
      L(e, !0),
      await t.resolver(
        v,
        t.context,
        Se(e || D.mount, o, t.criteriaMode, t.shouldUseNativeValidation),
      )
    ),
    ve = async (e) => {
      let { errors: t } = await U(e);
      if ((L(e), e))
        for (let r of e) {
          let e = S(t, r);
          e
            ? D.array.has(r) &&
              s(e) &&
              !Object.keys(e).some((e) => !Number.isNaN(Number(e)))
              ? Me(n.errors, { [r]: e }, r)
              : T(n.errors, r, e)
            : B(n.errors, r);
        }
      else n.errors = t;
      return t;
    },
    be = async ({ name: t, eventType: r }) => {
      if (e.validate) {
        let i = await e.validate({
          formValues: v,
          formState: n,
          name: t,
          eventType: r,
        });
        if (s(i))
          for (let e in i) {
            let t = i[e];
            t &&
              $(`${g}.${e}`, {
                message: j(t.message) ? t.message : ``,
                type: t.type || h.validate,
              });
          }
        else j(i) || !i ? $(g, { message: i || ``, type: h.validate }) : We(g);
        return i;
      }
      return !0;
    },
    W = async ({
      fields: r,
      onlyCheckValid: i,
      name: a,
      eventType: o,
      context: s = { valid: !0, runRootValidation: !1 },
    }) => {
      if (
        e.validate &&
        ((s.runRootValidation = !0),
        !(await be({ name: a, eventType: o })) && ((s.valid = !1), i))
      )
        return s.valid;
      for (let a in r) {
        let c = r[a];
        if (c) {
          let { _f: r, ...l } = c;
          if (r) {
            let a = D.array.has(r.name),
              o = c._f && we(c._f),
              l =
                M.validatingFields ||
                M.isValidating ||
                N.validatingFields ||
                N.isValidating;
            o && l && L([r.name], !0);
            let u = await Pe(
              c,
              D.disabled,
              v,
              te,
              t.shouldUseNativeValidation && !i,
              a,
            );
            if (
              (o && l && L([r.name]),
              (u[r.name] && ((s.valid = !1), i)) ||
                (!i &&
                  (S(u, r.name)
                    ? a
                      ? Me(n.errors, u, r.name)
                      : T(n.errors, r.name, u[r.name])
                    : B(n.errors, r.name)),
                e.shouldUseNativeValidation && u[r.name]))
            )
              break;
          }
          !z(l) &&
            (await W({
              context: s,
              onlyCheckValid: i,
              fields: l,
              name: a,
              eventType: o,
            }));
        }
      }
      return s.valid;
    },
    G = () => {
      for (let e of D.unMount) {
        let t = S(o, e);
        t &&
          (t._f.refs ? t._f.refs.every((e) => !de(e)) : !de(t._f.ref)) &&
          Je(e);
      }
      D.unMount = new Set();
    },
    q = (e, n) => !t.disabled && (e && n && T(v, e, n), !P(He(), u)),
    Ne = (e, t, n) =>
      ee(e, D, { ...(E.mount ? v : b(t) ? u : j(e) ? { [e]: t } : t) }, n, t),
    Y = (e) => re(S(E.mount ? v : u, e, t.shouldUnregister ? S(u, e, []) : [])),
    Le = (e, t, n = {}, i = !1) => {
      let s = S(o, e),
        c = t;
      if (s) {
        let n = s._f;
        n &&
          (!n.disabled && T(v, e, ye(t, n)),
          (c = se(n.ref) && a(t) ? `` : t),
          ce(n.ref)
            ? [...n.ref.options].forEach(
                (e) => (e.selected = c.includes(e.value)),
              )
            : n.refs
              ? r(n.ref)
                ? n.refs.forEach((e) => {
                    (!e.defaultChecked || !e.disabled) &&
                      (Array.isArray(c)
                        ? (e.checked = !!c.find((t) => t === e.value))
                        : (e.checked = c === e.value || !!c));
                  })
                : n.refs.forEach((e) => (e.checked = e.value === c))
              : oe(n.ref)
                ? (n.ref.value = ``)
                : ((n.ref.value = c),
                  n.ref.type ||
                    F.state.next({ name: e, values: i ? v : f(v) })));
      }
      ((n.shouldDirty || n.shouldTouch) &&
        V(e, c, n.shouldTouch, n.shouldDirty, !0),
        n.shouldValidate && Q(e));
    },
    X = (e, t, n, r = !1) => {
      for (let a in t) {
        if (!t.hasOwnProperty(a)) return;
        let c = t[a],
          l = e + `.` + a,
          u = S(o, l);
        (D.array.has(e) || s(c) || (u && !u._f)) && !i(c)
          ? X(l, c, n, r)
          : Le(l, c, n, r);
      }
    },
    Re = (e, t, r, i) => {
      let s = S(o, e),
        c = D.array.has(e),
        l = i ? t : f(t),
        u = P(S(v, e), l);
      if ((u || T(v, e, l), c))
        (F.array.next({ name: e, values: i ? v : f(v) }),
          (M.isDirty || M.dirtyFields || N.isDirty || N.dirtyFields) &&
            r.shouldDirty &&
            (le(),
            F.state.next({
              name: e,
              dirtyFields: n.dirtyFields,
              isDirty: q(e, l),
            })));
      else {
        let t = (Array.isArray(l) && !l.length) || z(l);
        !s || s._f || a(l) || t ? Le(e, l, r, i) : X(e, l, r, i);
      }
      if (!u) {
        let t = Ee(e, D),
          r = i ? v : f(v);
        F.state.next({
          ...(t && n),
          name: E.mount || t ? e : void 0,
          values: r,
        });
      }
    },
    Z = (e, t, n = {}) => Re(e, t, n, !1),
    ze = (e, t = {}) => {
      let r = w(e) ? e(v) : e;
      if (!P(v, r)) {
        v = { ...v, ...r };
        for (let e of D.mount) Re(e, S(r, e), t, !0);
        (F.state.next({ ...n, name: void 0, type: void 0, values: v }),
          t.shouldValidate && I());
      }
    },
    Be = async (r) => {
      E.mount = !0;
      let a = r.target,
        s = a.name,
        l = !0,
        u = S(o, s),
        d = (e) => {
          l =
            Number.isNaN(e) || (i(e) && isNaN(e.getTime())) || P(e, S(v, s, e));
        },
        m = K(t.mode),
        h = K(t.reValidateMode);
      if (u) {
        let i,
          g,
          _ = a.type ? xe(u._f) : c(r),
          y = r.type === p.BLUR || r.type === p.FOCUS_OUT,
          b =
            (!Te(u._f) &&
              !e.validate &&
              !t.resolver &&
              !S(n.errors, s) &&
              !u._f.deps) ||
            Ae(y, S(n.touchedFields, s), n.isSubmitted, h, m),
          x = Ee(s, D, y);
        (T(v, s, _),
          y
            ? (!a || !a.readOnly) && (u._f.onBlur && u._f.onBlur(r), O && O(0))
            : u._f.onChange && u._f.onChange(r));
        let C = V(s, _, y),
          w = !z(C) || x;
        if ((!y && F.state.next({ name: s, type: r.type, values: f(v) }), b))
          return (
            (M.isValid || N.isValid) &&
              (t.mode === `onBlur` ? y && I() : y || I()),
            w && F.state.next({ name: s, ...(x ? {} : C) })
          );
        if (
          (!t.resolver &&
            e.validate &&
            (await be({ name: s, eventType: r.type })),
          !y && x && F.state.next({ ...n }),
          t.resolver)
        ) {
          let { errors: e } = await U([s]);
          if ((L([s]), d(_), !l)) {
            !z(C) && F.state.next(C);
            return;
          }
          let t = De(n.errors, o, s),
            r = De(e, o, t.name || s);
          ((i = r.error), (s = r.name), (g = z(e)));
        } else
          (L([s], !0),
            (i = (await Pe(u, D.disabled, v, te, t.shouldUseNativeValidation))[
              s
            ]),
            L([s]),
            d(_),
            l &&
              (i
                ? (g = !1)
                : (M.isValid || N.isValid) &&
                  (g = await W({
                    fields: o,
                    onlyCheckValid: !0,
                    name: s,
                    eventType: r.type,
                  }))));
        l &&
          (u._f.deps &&
            (!Array.isArray(u._f.deps) || u._f.deps.length > 0) &&
            Q(u._f.deps),
          _e(s, g, i, C));
      }
    },
    Ve = (e, t) => {
      if (S(n.errors, t) && e.focus) return (e.focus(), 1);
    },
    Q = async (e, r = {}) => {
      let i,
        a,
        s = R(e);
      if (t.resolver) {
        let t = await ve(b(e) ? e : s);
        ((i = z(t)), (a = e ? !s.some((e) => S(t, e)) : i));
      } else
        e
          ? ((a = (
              await Promise.all(
                s.map(async (e) => {
                  let t = S(o, e);
                  return await W({
                    fields: t && t._f ? { [e]: t } : t,
                    eventType: p.TRIGGER,
                  });
                }),
              )
            ).every(Boolean)),
            !(!a && !n.isValid) && I())
          : (a = i = await W({ fields: o, name: e, eventType: p.TRIGGER }));
      return (
        F.state.next({
          ...(!j(e) || ((M.isValid || N.isValid) && i !== n.isValid)
            ? {}
            : { name: e }),
          ...(t.resolver || !e ? { isValid: i } : {}),
          errors: n.errors,
        }),
        r.shouldFocus && !a && J(o, Ve, e ? s : D.mount),
        a
      );
    },
    He = (e, t) => {
      let r = { ...(E.mount ? v : u) };
      return (
        t && (r = ae(t.dirtyFields ? n.dirtyFields : n.touchedFields, r)),
        b(e) ? r : j(e) ? S(r, e) : e.map((e) => S(r, e))
      );
    },
    Ue = (e, t) => ({
      invalid: !!S((t || n).errors, e),
      isDirty: !!S((t || n).dirtyFields, e),
      error: S((t || n).errors, e),
      isValidating: !!S(n.validatingFields, e),
      isTouched: !!S((t || n).touchedFields, e),
    }),
    We = (e) => {
      let t = e ? R(e) : void 0;
      (t?.forEach((e) => B(n.errors, e)),
        t
          ? t.forEach((e) => {
              F.state.next({ name: e, errors: n.errors });
            })
          : F.state.next({ errors: {} }));
    },
    $ = (e, t, r) => {
      let i = (S(o, e, { _f: {} })._f || {}).ref,
        { ref: a, message: s, type: c, ...l } = S(n.errors, e) || {};
      (T(n.errors, e, { ...l, ...t, ref: i }),
        F.state.next({ name: e, errors: n.errors, isValid: !1 }),
        r && r.shouldFocus && i && i.focus && i.focus());
    },
    Ge = (e, t) =>
      w(e)
        ? F.state.subscribe({
            next: (n) => `values` in n && e(n.values || Ne(void 0, t), n),
          })
        : Ne(e, t, !0),
    Ke = (e) =>
      F.state.subscribe({
        next: (t) => {
          if (
            ke(e.name, t.name, e.exact) &&
            Oe(t, e.formState || M, it, e.reRenderRoot)
          ) {
            let r = { ...v };
            e.callback({ values: r, ...n, ...t, defaultValues: u });
          }
        },
      }).unsubscribe,
    qe = (e) => (
      (E.mount = !0),
      (N = { ...N, ...e.formState }),
      Ke({ ...e, formState: { ...A, ...e.formState } })
    ),
    Je = (e, r = {}) => {
      for (let i of e ? R(e) : D.mount)
        (D.mount.delete(i),
          D.array.delete(i),
          r.keepValue || (B(o, i), B(v, i)),
          !r.keepError && B(n.errors, i),
          !r.keepDirty && B(n.dirtyFields, i),
          !r.keepTouched && B(n.touchedFields, i),
          !r.keepIsValidating && B(n.validatingFields, i),
          !t.shouldUnregister && !r.keepDefaultValue && B(u, i));
      (F.state.next({ values: f(v) }),
        F.state.next({ ...n, ...(r.keepDirty ? { isDirty: q() } : {}) }),
        !r.keepIsValid && I());
    },
    Ye = ({ disabled: e, name: t }) => {
      if ((C(e) && E.mount) || e || D.disabled.has(t)) {
        let n = D.disabled.has(t) !== !!e;
        (e ? D.disabled.add(t) : D.disabled.delete(t),
          n && E.mount && !E.action && I());
      }
    },
    Xe = (e, n = {}) => {
      let r = S(o, e),
        i = C(n.disabled) || C(t.disabled),
        a = !D.registerName.has(e) && r && r._f && !r._f.mount;
      return (
        T(o, e, {
          ...(r || {}),
          _f: {
            ...(r && r._f ? r._f : { ref: { name: e } }),
            name: e,
            mount: !0,
            ...n,
          },
        }),
        D.mount.add(e),
        r && !a
          ? Ye({ disabled: C(n.disabled) ? n.disabled : t.disabled, name: e })
          : ge(e, !0, n.value),
        {
          ...(i ? { disabled: n.disabled || t.disabled } : {}),
          ...(t.progressive
            ? {
                required: !!n.required,
                min: Ce(n.min),
                max: Ce(n.max),
                minLength: Ce(n.minLength),
                maxLength: Ce(n.maxLength),
                pattern: Ce(n.pattern),
              }
            : {}),
          name: e,
          onChange: Be,
          onBlur: Be,
          ref: (i) => {
            if (i) {
              (D.registerName.add(e),
                Xe(e, n),
                D.registerName.delete(e),
                (r = S(o, e)));
              let t =
                  (b(i.value) &&
                    i.querySelectorAll &&
                    i.querySelectorAll(`input,select,textarea`)[0]) ||
                  i,
                a = ue(t),
                s = r._f.refs || [];
              if (a ? s.find((e) => e === t) : t === r._f.ref) return;
              (T(o, e, {
                _f: {
                  ...r._f,
                  ...(a
                    ? {
                        refs: [
                          ...s.filter(de),
                          t,
                          ...(Array.isArray(S(u, e)) ? [{}] : []),
                        ],
                        ref: { type: t.type, name: e },
                      }
                    : { ref: t }),
                },
              }),
                ge(e, !1, void 0, t));
            } else
              ((r = S(o, e, {})),
                r._f && (r._f.mount = !1),
                (t.shouldUnregister || n.shouldUnregister) &&
                  !(l(D.array, e) && E.action) &&
                  D.unMount.add(e));
          },
        }
      );
    },
    Ze = () =>
      t.shouldFocusError && !t.shouldUseNativeValidation && J(o, Ve, D.mount),
    Qe = (e) => {
      C(e) &&
        (F.state.next({ disabled: e }),
        J(
          o,
          (t, n) => {
            let r = S(o, n);
            r &&
              ((t.disabled = r._f.disabled || e),
              Array.isArray(r._f.refs) &&
                r._f.refs.forEach((t) => {
                  t.disabled = r._f.disabled || e;
                }));
          },
          0,
          !1,
        ));
    },
    $e = (e, r) => async (i) => {
      let a;
      i && (i.preventDefault && i.preventDefault(), i.persist && i.persist());
      let s = f(v);
      if ((F.state.next({ isSubmitting: !0 }), t.resolver)) {
        let { errors: e, values: t } = await U();
        (L(), (n.errors = e), (s = f(t)));
      } else await W({ fields: o, eventType: p.SUBMIT });
      if (D.disabled.size) for (let e of D.disabled) B(s, e);
      if ((B(n.errors, _), z(n.errors))) {
        F.state.next({ errors: {} });
        try {
          await e(s, i);
        } catch (e) {
          a = e;
        }
      } else (r && (await r({ ...n.errors }, i)), Ze(), setTimeout(Ze));
      if (
        (F.state.next({
          isSubmitted: !0,
          isSubmitting: !1,
          isSubmitSuccessful: z(n.errors) && !a,
          submitCount: n.submitCount + 1,
          errors: n.errors,
        }),
        a)
      )
        throw a;
    },
    et = (e, t = {}) => {
      S(o, e) &&
        (b(t.defaultValue)
          ? Z(e, f(S(u, e)))
          : (Z(e, t.defaultValue), T(u, e, f(t.defaultValue))),
        t.keepTouched || B(n.touchedFields, e),
        t.keepDirty ||
          (B(n.dirtyFields, e),
          (n.isDirty = t.defaultValue ? q(e, f(S(u, e))) : q())),
        t.keepError || (B(n.errors, e), M.isValid && I()),
        F.state.next({ ...n }));
    },
    tt = (e, r = {}) => {
      let i = e ? f(e) : u,
        a = f(i),
        s = z(e),
        c = a;
      if ((r.keepDefaultValues || (u = i), !r.keepValues)) {
        if (r.keepDirtyValues) {
          let e = new Set([...D.mount, ...Object.keys(H(u, v))]);
          for (let t of Array.from(e)) {
            let e = S(n.dirtyFields, t),
              r = S(v, t),
              i = S(c, t);
            e && !b(r) ? T(c, t, r) : !e && !b(i) && Z(t, i);
          }
        } else {
          if (d && b(e))
            for (let e of D.mount) {
              let t = S(o, e);
              if (t && t._f) {
                let e = Array.isArray(t._f.refs) ? t._f.refs[0] : t._f.ref;
                if (se(e)) {
                  let t = e.closest(`form`);
                  if (t) {
                    t.reset();
                    break;
                  }
                }
              }
            }
          if (r.keepFieldsRef) for (let e of D.mount) Z(e, S(c, e));
          else o = {};
        }
        if (t.shouldUnregister) {
          if (((v = r.keepDefaultValues ? f(u) : {}), r.keepFieldsRef))
            for (let e of D.mount) T(v, e, S(c, e));
        } else v = f(c);
        (F.array.next({ values: { ...c } }),
          F.state.next({ values: { ...c } }));
      }
      ((D = {
        mount: r.keepDirtyValues ? D.mount : new Set(),
        unMount: new Set(),
        array: new Set(),
        registerName: new Set(),
        disabled: new Set(),
        watch: new Set(),
        watchAll: !1,
        focus: ``,
      }),
        (E.mount =
          !M.isValid ||
          !!r.keepIsValid ||
          !!r.keepDirtyValues ||
          (!t.shouldUnregister && !z(c))),
        (E.watch = !!t.shouldUnregister),
        (E.keepIsValid = !!r.keepIsValid),
        (E.action = !1),
        r.keepErrors || (n.errors = {}),
        F.state.next({
          submitCount: r.keepSubmitCount ? n.submitCount : 0,
          isDirty: s
            ? !1
            : r.keepDirty
              ? n.isDirty
              : r.keepValues
                ? q()
                : !!(r.keepDefaultValues && !P(e, u)),
          isSubmitted: r.keepIsSubmitted ? n.isSubmitted : !1,
          dirtyFields: s
            ? {}
            : r.keepDirtyValues
              ? r.keepDefaultValues && v
                ? H(u, v)
                : n.dirtyFields
              : r.keepDefaultValues && e
                ? H(u, e)
                : r.keepDirty
                  ? n.dirtyFields
                  : {},
          touchedFields: r.keepTouched ? n.touchedFields : {},
          errors: r.keepErrors ? n.errors : {},
          isSubmitSuccessful: r.keepIsSubmitSuccessful
            ? n.isSubmitSuccessful
            : !1,
          isSubmitting: !1,
          defaultValues: u,
        }));
    },
    nt = (e, n) => tt(w(e) ? e(v) : e, { ...t.resetOptions, ...n }),
    rt = (e, t = {}) => {
      let n = S(o, e),
        r = n && n._f;
      if (r) {
        let e = r.refs ? r.refs[0] : r.ref;
        e.focus &&
          setTimeout(() => {
            (e.focus(), t.shouldSelect && w(e.select) && e.select());
          });
      }
    },
    it = (e) => {
      n = { ...n, ...e };
    },
    at = {
      control: {
        register: Xe,
        unregister: Je,
        getFieldState: Ue,
        handleSubmit: $e,
        setError: $,
        _subscribe: Ke,
        _runSchema: U,
        _updateIsValidating: L,
        _focusError: Ze,
        _getWatch: Ne,
        _getDirty: q,
        _setValid: I,
        _setFieldArray: fe,
        _setDisabledField: Ye,
        _setErrors: me,
        _getFieldArray: Y,
        _reset: tt,
        _resetDefaultValues: () =>
          w(t.defaultValues) &&
          t.defaultValues().then((e) => {
            (nt(e, t.resetOptions), F.state.next({ isLoading: !1 }));
          }),
        _removeUnmounted: G,
        _disableForm: Qe,
        _subjects: F,
        _proxyFormState: M,
        get _fields() {
          return o;
        },
        get _formValues() {
          return v;
        },
        get _state() {
          return E;
        },
        set _state(e) {
          E = e;
        },
        get _defaultValues() {
          return u;
        },
        get _names() {
          return D;
        },
        set _names(e) {
          D = e;
        },
        get _formState() {
          return n;
        },
        get _options() {
          return t;
        },
        set _options(e) {
          t = { ...t, ...e };
        },
      },
      subscribe: qe,
      trigger: Q,
      register: Xe,
      handleSubmit: $e,
      watch: Ge,
      setValue: Z,
      setValues: ze,
      getValues: He,
      reset: nt,
      resetField: et,
      resetDefaultValues: (e, t = {}) => {
        if (((u = f(e)), !t.keepDirty)) {
          let e = H(u, v);
          ((n.dirtyFields = e), (n.isDirty = !z(e)));
        }
        (t.keepIsValid || I(), F.state.next({ ...n, defaultValues: u }));
      },
      clearErrors: We,
      unregister: Je,
      setError: $,
      setFocus: rt,
      getFieldState: Ue,
    };
  return { ...at, formControl: at };
}
var X = () => {
    if (typeof crypto < `u` && crypto.randomUUID) return crypto.randomUUID();
    let e = typeof performance > `u` ? Date.now() : performance.now() * 1e3;
    return `xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx`.replace(/[xy]/g, (t) => {
      let n = ((Math.random() * 16 + e) % 16) | 0;
      return (t == `x` ? n : (n & 3) | 8).toString(16);
    });
  },
  Re = (e, t, n = {}) =>
    n.shouldFocus || b(n.shouldFocus)
      ? n.focusName || `${e}.${b(n.focusIndex) ? t : n.focusIndex}.`
      : ``,
  Z = (e, t) => [...e, ...R(t)],
  ze = (e) => (Array.isArray(e) ? e.map(() => void 0) : void 0);
function Be(e, t, n) {
  return [...e.slice(0, t), ...R(n), ...e.slice(t)];
}
var Ve = (e, t, n) =>
    Array.isArray(e)
      ? (b(e[n]) && (e[n] = void 0), e.splice(n, 0, e.splice(t, 1)[0]), e)
      : [],
  Q = (e, t) => [...R(t), ...R(e)];
function He(e, t) {
  let n = 0,
    r = [...e];
  for (let e of t) (r.splice(e - n, 1), n++);
  return re(r).length ? r : [];
}
var Ue = (e, t) =>
    b(t)
      ? []
      : He(
          e,
          R(t).sort((e, t) => e - t),
        ),
  We = (e, t, n) => {
    [e[t], e[n]] = [e[n], e[t]];
  },
  $ = (e, t, n) => ((e[t] = n), e);
function Ge(e) {
  let t = D(),
    {
      control: r = t,
      name: i,
      keyName: a = `id`,
      shouldUnregister: o,
      rules: s,
    } = e,
    [c, l] = n.useState(r._getFieldArray(i)),
    u = n.useRef(r._getFieldArray(i).map(X)),
    d = n.useRef(!1);
  (r._names.array.add(i),
    n.useMemo(
      () => s && c.length >= 0 && r.register(i, s),
      [r, i, c.length, s],
    ),
    k(
      () =>
        r._subjects.array.subscribe({
          next: ({ values: e, name: t }) => {
            if (t === i || !t) {
              let n = S(e, i);
              Array.isArray(n)
                ? (l(n), (u.current = n.map(X)))
                : t || (l([]), (u.current = []));
            }
          },
        }).unsubscribe,
      [r, i],
    ));
  let p = n.useCallback(
    (e) => {
      ((d.current = !0), r._setFieldArray(i, e));
    },
    [r, i],
  );
  return (
    n.useEffect(() => {
      ((r._state.action = !1),
        Ee(i, r._names) && r._subjects.state.next({ ...r._formState }));
      let e = K(r._options.mode);
      if (
        d.current &&
        (!e.isOnSubmit || r._formState.isSubmitted) &&
        !K(r._options.reValidateMode).isOnSubmit &&
        !e.isOnBlur
      )
        if (r._options.resolver)
          r._runSchema([i]).then((e) => {
            r._updateIsValidating([i]);
            let t = S(e.errors, i),
              n = S(r._formState.errors, i);
            (n
              ? (!t && n.type) ||
                (t && (n.type !== t.type || n.message !== t.message))
              : t && t.type) &&
              (t ? T(r._formState.errors, i, t) : B(r._formState.errors, i),
              r._subjects.state.next({ errors: r._formState.errors }));
          });
        else {
          let e = S(r._fields, i);
          e &&
            e._f &&
            !(
              K(r._options.reValidateMode).isOnSubmit &&
              K(r._options.mode).isOnSubmit
            ) &&
            Pe(
              e,
              r._names.disabled,
              r._formValues,
              r._options.criteriaMode === m.all,
              r._options.shouldUseNativeValidation,
              !0,
            ).then(
              (e) =>
                !z(e) &&
                r._subjects.state.next({
                  errors: Me(r._formState.errors, e, i),
                }),
            );
        }
      (r._subjects.state.next({ name: i, values: f(r._formValues) }),
        r._names.focus &&
          J(r._fields, (e, t) => {
            if (r._names.focus && t.startsWith(r._names.focus) && e.focus)
              return (e.focus(), 1);
          }),
        (r._names.focus = ``),
        r._setValid(),
        (d.current = !1));
    }, [c, i, r]),
    n.useEffect(
      () => (
        !S(r._formValues, i) && r._setFieldArray(i),
        () => {
          let e = !(r._options.shouldUnregister || o);
          (d.current &&
            e &&
            r._subjects.state.next({ name: i, values: f(r._formValues) }),
            e
              ? ((e, t) => {
                  let n = S(r._fields, e);
                  n && n._f && (n._f.mount = t);
                })(i, !1)
              : r.unregister(i));
        }
      ),
      [i, r, a, o],
    ),
    {
      swap: n.useCallback(
        (e, t) => {
          let n = r._getFieldArray(i);
          (We(n, e, t),
            We(u.current, e, t),
            p(n),
            l(n),
            r._setFieldArray(i, n, We, { argA: e, argB: t }, !1));
        },
        [p, i, r],
      ),
      move: n.useCallback(
        (e, t) => {
          let n = r._getFieldArray(i);
          (Ve(n, e, t),
            Ve(u.current, e, t),
            p(n),
            l(n),
            r._setFieldArray(i, n, Ve, { argA: e, argB: t }, !1));
        },
        [p, i, r],
      ),
      prepend: n.useCallback(
        (e, t) => {
          let n = R(f(e)),
            a = Q(r._getFieldArray(i), n);
          ((r._names.focus = Re(i, 0, t)),
            (u.current = Q(u.current, n.map(X))),
            p(a),
            l(a),
            r._setFieldArray(i, a, Q, { argA: ze(e) }));
        },
        [p, i, r],
      ),
      append: n.useCallback(
        (e, t) => {
          let n = R(f(e)),
            a = Z(r._getFieldArray(i), n);
          ((r._names.focus = Re(i, a.length - 1, t)),
            (u.current = Z(u.current, n.map(X))),
            p(a),
            l(a),
            r._setFieldArray(i, a, Z, { argA: ze(e) }));
        },
        [p, i, r],
      ),
      remove: n.useCallback(
        (e) => {
          let t = Ue(r._getFieldArray(i), e);
          ((u.current = Ue(u.current, e)),
            p(t),
            l(t),
            !Array.isArray(S(r._fields, i)) && T(r._fields, i, void 0),
            r._setFieldArray(i, t, Ue, { argA: e }));
        },
        [p, i, r],
      ),
      insert: n.useCallback(
        (e, t, n) => {
          let a = R(f(t)),
            o = Be(r._getFieldArray(i), e, a);
          ((r._names.focus = Re(i, e, n)),
            (u.current = Be(u.current, e, a.map(X))),
            p(o),
            l(o),
            r._setFieldArray(i, o, Be, { argA: e, argB: ze(t) }));
        },
        [p, i, r],
      ),
      update: n.useCallback(
        (e, t) => {
          let n = f(t),
            a = $(r._getFieldArray(i), e, n);
          ((u.current = [...a].map((t, n) =>
            !t || n === e ? X() : u.current[n],
          )),
            p(a),
            l([...a]),
            r._setFieldArray(i, a, $, { argA: e, argB: n }, !0, !1));
        },
        [p, i, r],
      ),
      replace: n.useCallback(
        (e) => {
          let t = R(f(e));
          ((u.current = t.map(X)),
            p([...t]),
            l([...t]),
            r._setFieldArray(i, [...t], (e) => e, {}, !0, !1));
        },
        [p, i, r],
      ),
      fields: n.useMemo(
        () => c.map((e, t) => ({ ...e, [a]: u.current[t] || X() })),
        [c, a],
      ),
    }
  );
}
function Ke(e = {}) {
  let t = n.useRef(void 0),
    r = n.useRef(void 0),
    [i, a] = n.useState(() => ({
      ...f(Ie),
      isLoading: w(e.defaultValues),
      errors: e.errors || {},
      disabled: e.disabled || !1,
      defaultValues: w(e.defaultValues) ? void 0 : e.defaultValues,
    }));
  if (!t.current)
    if (e.formControl)
      ((t.current = { ...e.formControl, formState: i }),
        e.defaultValues &&
          !w(e.defaultValues) &&
          e.formControl.reset(e.defaultValues, e.resetOptions));
    else {
      let { formControl: n, ...r } = Le(e);
      t.current = { ...r, formState: i };
    }
  let o = t.current.control;
  return (
    (o._options = e),
    k(() => {
      let e = o._subscribe({
        formState: o._proxyFormState,
        callback: () => a({ ...o._formState, defaultValues: o._defaultValues }),
        reRenderRoot: !0,
      });
      return (
        a((e) => ({ ...e, isReady: !0 })),
        (o._formState.isReady = !0),
        e
      );
    }, [o]),
    n.useEffect(() => o._disableForm(e.disabled), [o, e.disabled]),
    n.useEffect(() => {
      (e.mode && (o._options.mode = e.mode),
        e.reValidateMode && (o._options.reValidateMode = e.reValidateMode));
    }, [o, e.mode, e.reValidateMode]),
    n.useEffect(() => {
      e.errors && (o._setErrors(e.errors), o._focusError());
    }, [o, e.errors]),
    n.useEffect(() => {
      e.shouldUnregister && o._subjects.state.next({ values: o._getWatch() });
    }, [o, e.shouldUnregister]),
    n.useEffect(() => {
      if (o._proxyFormState.isDirty) {
        let e = o._getDirty();
        e !== i.isDirty && o._subjects.state.next({ isDirty: e });
      }
    }, [o, i.isDirty]),
    n.useEffect(() => {
      e.values && !P(e.values, r.current)
        ? (o._reset(e.values, {
            keepFieldsRef: !0,
            ...o._options.resetOptions,
          }),
          o._options.resetOptions?.keepIsValid || o._setValid(),
          (r.current = e.values),
          a((e) => ({ ...e })))
        : o._resetDefaultValues();
    }, [o, e.values]),
    n.useEffect(() => {
      (o._state.mount || (o._setValid(), (o._state.mount = !0)),
        o._state.watch &&
          ((o._state.watch = !1), o._subjects.state.next({ ...o._formState })),
        o._removeUnmounted());
    }),
    (t.current.formState = n.useMemo(() => O(i, o), [o, i])),
    t.current
  );
}
export { Ge as n, Ke as r, ne as t };

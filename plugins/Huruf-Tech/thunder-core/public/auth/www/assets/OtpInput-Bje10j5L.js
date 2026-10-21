import {
  A as e,
  E as t,
  Et as n,
  F as r,
  G as i,
  K as a,
  L as o,
  N as s,
  O as c,
  R as l,
  S as u,
  T as d,
  W as f,
  a as p,
  c as m,
  wt as h,
} from "./useAppBranding-GcljM9XV.js";
import { D as g, k as _ } from "./AuthLayout-B7RMIG_n.js";
import {
  $ as ee,
  Hn as te,
  O as ne,
  On as v,
  Tn as y,
  Z as b,
  d as x,
  g as S,
  kr as C,
  p as re,
  u as w,
  v as T,
  wn as ie,
} from "./index-CvWHA45R.js";
var E = a(),
  D = n(h()),
  O = D.createContext({
    formRef: { current: { fields: new Map() } },
    errors: {},
    clearErrors: l,
    validationMode: `onSubmit`,
    submitAttemptedRef: { current: !1 },
  });
function k() {
  return D.useContext(O);
}
function A(e, t, n, r = !0, a) {
  let [o, s] = D.useState(),
    c = b(a ? `${a}-label` : void 0),
    l = e ?? t ?? o;
  return (
    i(() => {
      let i = e || t || !r ? void 0 : j(n.current, c);
      o !== i && s(i);
    }),
    l
  );
}
function j(e, t) {
  let n = M(e);
  if (n) return (!n.id && t && (n.id = t), n.id || void 0);
}
function M(e) {
  if (!e) return;
  let t = e.parentElement;
  if (t && t.tagName === `LABEL`) return t;
  let n = e.id;
  if (n) {
    let t = e.nextElementSibling;
    if (t && t.htmlFor === n) return t;
  }
  let r = e.labels;
  return r && r[0];
}
var N = D.createContext({ disabled: !1 });
function ae() {
  return D.useContext(N);
}
var P = D.createContext(void 0);
function oe(t = !0) {
  let n = D.useContext(P);
  if (n === void 0 && !t) throw Error(e(3));
  return n;
}
var se = p(`mail-warning`, [
    [
      `path`,
      {
        d: `M22 10.5V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v12c0 1.1.9 2 2 2h12.5`,
        key: `e61zoh`,
      },
    ],
    [`path`, { d: `m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7`, key: `1ocrg3` }],
    [`path`, { d: `M20 14v4`, key: `1hm744` }],
    [`path`, { d: `M20 22v.01`, key: `12bgn6` }],
  ]),
  F = p(`minus`, [[`path`, { d: `M5 12h14`, key: `1ays0h` }]]),
  I = ne(
    `relative grid w-full items-start gap-x-2 gap-y-0.5 rounded-xl border px-3.5 py-3 text-card-foreground text-sm has-[>svg]:has-data-[slot=alert-action]:grid-cols-[calc(var(--spacing)*4)_1fr_auto] has-[>svg]:grid-cols-[calc(var(--spacing)*4)_1fr] has-data-[slot=alert-action]:grid-cols-[1fr_auto] has-[>svg]:gap-x-2 [&>svg]:h-lh [&>svg]:w-4`,
    {
      defaultVariants: { variant: `default` },
      variants: {
        variant: {
          default: `bg-transparent dark:bg-input/32 [&>svg]:text-muted-foreground`,
          error: `border-destructive/32 bg-destructive/4 [&>svg]:text-destructive`,
          info: `border-info/32 bg-info/4 [&>svg]:text-info`,
          success: `border-success/32 bg-success/4 [&>svg]:text-success`,
          warning: `border-warning/32 bg-warning/4 [&>svg]:text-warning`,
        },
      },
    },
  );
function ce({ className: e, variant: t, ...n }) {
  return (0, E.jsx)(`div`, {
    className: m(I({ variant: t }), e),
    "data-slot": `alert`,
    role: `alert`,
    ...n,
  });
}
function le({ className: e, ...t }) {
  return (0, E.jsx)(`div`, {
    className: m(`font-medium [svg~&]:col-start-2`, e),
    "data-slot": `alert-title`,
    ...t,
  });
}
function ue({ className: e, ...t }) {
  return (0, E.jsx)(`div`, {
    className: m(
      `flex flex-col gap-2.5 text-muted-foreground [svg~&]:col-start-2`,
      e,
    ),
    "data-slot": `alert-description`,
    ...t,
  });
}
function de(e) {
  if (!e) return null;
  for (let t of e.elements) {
    let e = t.tagName;
    if (e === `BUTTON` || e === `INPUT`) {
      let e = t;
      if (e.type === `submit`) return e;
    }
  }
  return null;
}
var fe = (function (e) {
  return (
    (e.checked = `data-checked`),
    (e.unchecked = `data-unchecked`),
    (e.indeterminate = `data-indeterminate`),
    (e.disabled = `data-disabled`),
    (e.readonly = `data-readonly`),
    (e.required = `data-required`),
    (e.valid = `data-valid`),
    (e.invalid = `data-invalid`),
    (e.touched = `data-touched`),
    (e.dirty = `data-dirty`),
    (e.filled = `data-filled`),
    (e.focused = `data-focused`),
    e
  );
})({});
function pe(e) {
  return D.useMemo(
    () => ({
      checked(t) {
        return e.indeterminate
          ? {}
          : t
            ? { [fe.checked]: `` }
            : { [fe.unchecked]: `` };
      },
      ...T,
    }),
    [e.indeterminate],
  );
}
var me = D.createContext(void 0);
function he() {
  let t = D.useContext(me);
  if (t === void 0) throw Error(e(14));
  return t;
}
var ge = `data-parent`,
  _e = D.forwardRef(function (e, t) {
    let {
        checked: n,
        className: a,
        defaultChecked: u = !1,
        "aria-labelledby": d,
        disabled: p = !1,
        form: m,
        id: h,
        indeterminate: g = !1,
        inputRef: ne,
        name: T,
        onCheckedChange: O,
        parent: j = !1,
        readOnly: M = !1,
        render: N,
        required: P = !1,
        uncheckedValue: se,
        value: F,
        nativeButton: I = !1,
        style: ce,
        ...le
      } = e,
      { clearErrors: ue } = k(),
      {
        disabled: fe,
        name: he,
        setDirty: _e,
        setFilled: ve,
        setFocused: ye,
        setTouched: be,
        state: xe,
        validationMode: Se,
        validityData: L,
        shouldValidateOnChange: Ce,
        validation: we,
      } = S(),
      Te = ae(),
      {
        labelId: Ee,
        controlId: De,
        registerControlId: R,
        getDescriptionProps: Oe,
      } = re(),
      z = oe(),
      B = z?.parent,
      V = B && z.allValues,
      H = fe || Te.disabled || z?.disabled || p,
      U = he ?? T,
      W = F ?? U,
      ke = b(),
      Ae = b(),
      G = De;
    V ? (G = j ? Ae : `${B.id}-${W}`) : h && (G = h);
    let K = {};
    V &&
      (j
        ? (K = z.parent.getParentProps())
        : W && (K = z.parent.getChildProps(W)));
    let {
        checked: je = n,
        indeterminate: q = g,
        onCheckedChange: Me,
        ...J
      } = K,
      Y = z?.value,
      X = z?.setValue,
      Ne = z?.defaultValue,
      Pe = D.useRef(null),
      Fe = f(() => Symbol(`checkbox-control`)),
      Ie = D.useRef(!1),
      { getButtonProps: Le, buttonRef: Re } = ee({ disabled: H, native: I }),
      Z = z?.validation ?? we,
      [Q, ze] = x({
        controlled: W && Y && !j ? Y.includes(W) : je,
        default: W && Ne && !j ? Ne.includes(W) : u,
        name: `Checkbox`,
        state: `checked`,
      });
    (i(() => {
      R !== l && ((Ie.current = !0), R(Fe.current, G));
    }, [G, R, Fe]),
      D.useEffect(() => {
        let e = Fe.current;
        return () => {
          !Ie.current || R === l || ((Ie.current = !1), R(e, void 0));
        };
      }, [R, Fe]),
      w(Pe, ke, Q, void 0, !z));
    let $ = D.useRef(null),
      Be = s(ne, $, Z.inputRef),
      Ve = A(d, Ee, $, !I, G ?? void 0);
    (i(() => {
      $.current && (($.current.indeterminate = q), Q && ve(!0));
    }, [Q, q, ve]),
      _(Q, () => {
        (z && !j) ||
          (ue(U),
          ve(Q),
          _e(Q !== L.initialValue),
          Ce() ? Z.commit(Q) : Z.commit(Q, !0));
      }));
    let He = r(
        {
          checked: Q,
          disabled: H,
          form: m,
          name: j ? void 0 : U,
          id: I ? void 0 : (G ?? void 0),
          required: P,
          ref: Be,
          style: U ? y : ie,
          tabIndex: -1,
          type: `checkbox`,
          "aria-hidden": !0,
          onChange(e) {
            if (e.nativeEvent.defaultPrevented) return;
            if (M) {
              e.preventDefault();
              return;
            }
            let t = e.currentTarget.checked,
              n = v(te, e.nativeEvent);
            (Me?.(t, n),
              O?.(t, n),
              !n.isCanceled &&
                (ze(t),
                W &&
                  Y &&
                  X &&
                  !j &&
                  !V &&
                  X(t ? [...Y, W] : Y.filter((e) => e !== W), n)));
          },
          onFocus() {
            Pe.current?.focus();
          },
        },
        F === void 0 ? o : { value: (z ? Q && F : F) || `` },
        Oe,
        z ? Z.getValidationProps : Z.getInputValidationProps,
      ),
      Ue = V ? !!je : Q,
      We = (V && q) || g;
    D.useEffect(() => {
      if (!B || !W) return;
      let e = B.disabledStatesRef.current;
      return (
        e.set(W, H),
        () => {
          e.delete(W);
        }
      );
    }, [B, H, W]);
    let Ge = D.useMemo(
        () => ({
          ...xe,
          checked: Ue,
          disabled: H,
          readOnly: M,
          required: P,
          indeterminate: We,
        }),
        [xe, Ue, H, M, P, We],
      ),
      Ke = pe(Ge),
      qe = c(`span`, e, {
        state: Ge,
        ref: [Re, Pe, t, z?.registerControlRef],
        props: [
          {
            id: I ? (G ?? void 0) : ke,
            role: `checkbox`,
            "aria-checked": q ? `mixed` : Q,
            "aria-readonly": M || void 0,
            "aria-required": P || void 0,
            "aria-labelledby": Ve,
            [ge]: j ? `` : void 0,
            onFocus() {
              ye(!0);
            },
            onBlur() {
              let e = $.current;
              e &&
                (be(!0),
                ye(!1),
                Se === `onBlur` && Z.commit(z ? Y : e.checked));
            },
            onKeyDown(e) {
              if (
                e.key !== `Enter` ||
                (e.preventBaseUIHandler(), e.defaultPrevented)
              )
                return;
              let t = $.current?.form ?? null,
                n = e.currentTarget,
                r = e.nativeEvent,
                i = e.preventDefault,
                a = r.preventDefault,
                o = !1;
              ((e.preventDefault = () => {
                ((o = !0), i.call(e));
              }),
                (r.preventDefault = () => {
                  ((o = !0), a.call(r));
                }),
                a.call(r),
                C(n).queueMicrotask(() => {
                  ((e.preventDefault = i),
                    (r.preventDefault = a),
                    o || de(t)?.click());
                }));
            },
            onClick(e) {
              if (M || H) return;
              e.preventDefault();
              let t = $.current;
              t &&
                t.dispatchEvent(
                  new (C(t).PointerEvent)(`click`, {
                    bubbles: !0,
                    shiftKey: e.shiftKey,
                    ctrlKey: e.ctrlKey,
                    altKey: e.altKey,
                    metaKey: e.metaKey,
                  }),
                );
            },
          },
          Oe,
          Z.getValidationProps,
          le,
          J,
          Le,
        ],
        stateAttributesMapping: Ke,
      });
    return (0, E.jsxs)(me.Provider, {
      value: Ge,
      children: [
        qe,
        !Q &&
          !z &&
          U &&
          !j &&
          se !== void 0 &&
          (0, E.jsx)(`input`, { type: `hidden`, form: m, name: U, value: se }),
        (0, E.jsx)(`input`, { ...He, suppressHydrationWarning: !0 }),
      ],
    });
  }),
  ve = D.forwardRef(function (e, n) {
    let { render: r, className: i, style: a, keepMounted: o = !1, ...s } = e,
      l = he(),
      f = l.checked || l.indeterminate,
      { mounted: p, transitionStatus: m, setMounted: h } = t(f),
      g = D.useRef(null),
      _ = { ...l, transitionStatus: m };
    u({
      open: f,
      ref: g,
      onComplete() {
        f || h(!1);
      },
    });
    let ee = { ...pe(l), ...d, ...T },
      te = o || p,
      ne = c(`span`, e, {
        ref: [n, g],
        state: _,
        stateAttributesMapping: ee,
        props: s,
      });
    return te ? ne : null;
  });
function ye({ className: e, ...t }) {
  return (0, E.jsx)(_e, {
    "data-slot": `checkbox`,
    className: m(
      `border-input dark:bg-input/30 data-checked:bg-primary data-checked:text-primary-foreground dark:data-checked:bg-primary data-checked:border-primary aria-invalid:aria-checked:border-primary aria-invalid:border-destructive dark:aria-invalid:border-destructive/50 focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 flex size-4 items-center justify-center rounded-[4px] border transition-colors group-has-disabled/field:opacity-50 focus-visible:ring-[3px] aria-invalid:ring-[3px] peer relative shrink-0 outline-none after:absolute after:-inset-x-3 after:-inset-y-2 disabled:cursor-not-allowed disabled:opacity-50`,
      e,
    ),
    ...t,
    children: (0, E.jsx)(ve, {
      "data-slot": `checkbox-indicator`,
      className: `[&>svg]:size-3.5 grid place-content-center text-current transition-none`,
      children: (0, E.jsx)(g, {}),
    }),
  });
}
var be = Object.defineProperty,
  xe = Object.defineProperties,
  Se = Object.getOwnPropertyDescriptors,
  L = Object.getOwnPropertySymbols,
  Ce = Object.prototype.hasOwnProperty,
  we = Object.prototype.propertyIsEnumerable,
  Te = (e, t, n) =>
    t in e
      ? be(e, t, { enumerable: !0, configurable: !0, writable: !0, value: n })
      : (e[t] = n),
  Ee = (e, t) => {
    for (var n in (t ||= {})) Ce.call(t, n) && Te(e, n, t[n]);
    if (L) for (var n of L(t)) we.call(t, n) && Te(e, n, t[n]);
    return e;
  },
  De = (e, t) => xe(e, Se(t)),
  R = (e, t) => {
    var n = {};
    for (var r in e) Ce.call(e, r) && t.indexOf(r) < 0 && (n[r] = e[r]);
    if (e != null && L)
      for (var r of L(e)) t.indexOf(r) < 0 && we.call(e, r) && (n[r] = e[r]);
    return n;
  };
function Oe(e) {
  return [setTimeout(e, 0), setTimeout(e, 10), setTimeout(e, 50)];
}
function z(e) {
  let t = D.useRef();
  return (
    D.useEffect(() => {
      t.current = e;
    }),
    t.current
  );
}
var B = 18,
  V = 40,
  H = `${V}px`,
  U = [
    `[data-lastpass-icon-root]`,
    `com-1password-button`,
    `[data-dashlanecreated]`,
    `[style$="2147483647 !important;"]`,
  ].join(`,`);
function W({
  containerRef: e,
  inputRef: t,
  pushPasswordManagerStrategy: n,
  isFocused: r,
}) {
  let [i, a] = D.useState(!1),
    [o, s] = D.useState(!1),
    [c, l] = D.useState(!1),
    u = D.useMemo(
      () =>
        n === `none`
          ? !1
          : (n === `increase-width` || n === `experimental-no-flickering`) &&
            i &&
            o,
      [i, o, n],
    ),
    d = D.useCallback(() => {
      let r = e.current,
        i = t.current;
      if (!r || !i || c || n === `none`) return;
      let o = r,
        s = o.getBoundingClientRect().left + o.offsetWidth,
        u = o.getBoundingClientRect().top + o.offsetHeight / 2,
        d = s - B,
        f = u;
      (document.querySelectorAll(U).length === 0 &&
        document.elementFromPoint(d, f) === r) ||
        (a(!0), l(!0));
    }, [e, t, c, n]);
  return (
    D.useEffect(() => {
      let t = e.current;
      if (!t || n === `none`) return;
      function r() {
        s(window.innerWidth - t.getBoundingClientRect().right >= V);
      }
      r();
      let i = setInterval(r, 1e3);
      return () => {
        clearInterval(i);
      };
    }, [e, n]),
    D.useEffect(() => {
      let e = r || document.activeElement === t.current;
      if (n === `none` || !e) return;
      let i = setTimeout(d, 0),
        a = setTimeout(d, 2e3),
        o = setTimeout(d, 5e3),
        s = setTimeout(() => {
          l(!0);
        }, 6e3);
      return () => {
        (clearTimeout(i), clearTimeout(a), clearTimeout(o), clearTimeout(s));
      };
    }, [t, r, n, d]),
    { hasPWMBadge: i, willPushPWMBadge: u, PWM_BADGE_SPACE_WIDTH: H }
  );
}
var ke = D.createContext({}),
  Ae = D.forwardRef((e, t) => {
    var n = e,
      {
        value: r,
        onChange: i,
        maxLength: a,
        textAlign: o = `left`,
        pattern: s,
        placeholder: c,
        inputMode: l = `numeric`,
        onComplete: u,
        pushPasswordManagerStrategy: d = `increase-width`,
        pasteTransformer: f,
        containerClassName: p,
        noScriptCSSFallback: m = K,
        render: h,
        children: g,
      } = n,
      _ = R(n, [
        `value`,
        `onChange`,
        `maxLength`,
        `textAlign`,
        `pattern`,
        `placeholder`,
        `inputMode`,
        `onComplete`,
        `pushPasswordManagerStrategy`,
        `pasteTransformer`,
        `containerClassName`,
        `noScriptCSSFallback`,
        `render`,
        `children`,
      ]),
      ee;
    let [te, ne] = D.useState(
        typeof _.defaultValue == `string` ? _.defaultValue : ``,
      ),
      v = r ?? te,
      y = z(v),
      b = D.useCallback(
        (e) => {
          (i?.(e), ne(e));
        },
        [i],
      ),
      x = D.useMemo(
        () => (s ? (typeof s == `string` ? new RegExp(s) : s) : null),
        [s],
      ),
      S = D.useRef(null),
      C = D.useRef(null),
      re = D.useRef({
        value: v,
        onChange: b,
        isIOS:
          typeof window < `u` &&
          (ee = window == null ? void 0 : window.CSS)?.supports?.call(
            ee,
            `-webkit-touch-callout`,
            `none`,
          ),
      }),
      w = D.useRef({
        prev: [
          S.current?.selectionStart,
          S.current?.selectionEnd,
          S.current?.selectionDirection,
        ],
      });
    (D.useImperativeHandle(t, () => S.current, []),
      D.useEffect(() => {
        let e = S.current,
          t = C.current;
        if (!e || !t) return;
        (re.current.value !== e.value && re.current.onChange(e.value),
          (w.current.prev = [
            e.selectionStart,
            e.selectionEnd,
            e.selectionDirection,
          ]));
        function n() {
          if (document.activeElement !== e) {
            (A(null), M(null));
            return;
          }
          let t = e.selectionStart,
            n = e.selectionEnd,
            r = e.selectionDirection,
            i = e.maxLength,
            a = e.value,
            o = w.current.prev,
            s = -1,
            c = -1,
            l;
          if (a.length !== 0 && t !== null && n !== null) {
            let e = t === n,
              r = t === a.length && a.length < i;
            if (e && !r) {
              let e = t;
              if (e === 0) ((s = 0), (c = 1), (l = `forward`));
              else if (e === i) ((s = e - 1), (c = e), (l = `backward`));
              else if (i > 1 && a.length > 1) {
                let t = 0;
                if (o[0] !== null && o[1] !== null) {
                  l = e < o[1] ? `backward` : `forward`;
                  let n = o[0] === o[1] && o[0] < i;
                  l === `backward` && !n && (t = -1);
                }
                ((s = t + e), (c = t + e + 1));
              }
            }
            s !== -1 &&
              c !== -1 &&
              s !== c &&
              S.current.setSelectionRange(s, c, l);
          }
          let u = s === -1 ? t : s,
            d = c === -1 ? n : c,
            f = l ?? r;
          (A(u), M(d), (w.current.prev = [u, d, f]));
        }
        if (
          (document.addEventListener(`selectionchange`, n, { capture: !0 }),
          n(),
          document.activeElement === e && O(!0),
          !document.getElementById(`input-otp-style`))
        ) {
          let e = document.createElement(`style`);
          if (
            ((e.id = `input-otp-style`), document.head.appendChild(e), e.sheet)
          ) {
            let t = `background: transparent !important; color: transparent !important; border-color: transparent !important; opacity: 0 !important; box-shadow: none !important; -webkit-box-shadow: none !important; -webkit-text-fill-color: transparent !important;`;
            (G(
              e.sheet,
              `[data-input-otp]::selection { background: transparent !important; color: transparent !important; }`,
            ),
              G(e.sheet, `[data-input-otp]:autofill { ${t} }`),
              G(e.sheet, `[data-input-otp]:-webkit-autofill { ${t} }`),
              G(
                e.sheet,
                `@supports (-webkit-touch-callout: none) { [data-input-otp] { letter-spacing: -.6em !important; font-weight: 100 !important; font-stretch: ultra-condensed; font-optical-sizing: none !important; left: -1px !important; right: 1px !important; } }`,
              ),
              G(
                e.sheet,
                `[data-input-otp] + * { pointer-events: all !important; }`,
              ));
          }
        }
        let r = () => {
          t && t.style.setProperty(`--root-height`, `${e.clientHeight}px`);
        };
        r();
        let i = new ResizeObserver(r);
        return (
          i.observe(e),
          () => {
            (document.removeEventListener(`selectionchange`, n, {
              capture: !0,
            }),
              i.disconnect());
          }
        );
      }, []));
    let [T, ie] = D.useState(!1),
      [E, O] = D.useState(!1),
      [k, A] = D.useState(null),
      [j, M] = D.useState(null);
    (D.useEffect(() => {
      Oe(() => {
        var e;
        (e = S.current) == null || e.dispatchEvent(new Event(`input`));
        let t = S.current?.selectionStart,
          n = S.current?.selectionEnd,
          r = S.current?.selectionDirection;
        t !== null && n !== null && (A(t), M(n), (w.current.prev = [t, n, r]));
      });
    }, [v, E]),
      D.useEffect(() => {
        y !== void 0 && v !== y && y.length < a && v.length === a && u?.(v);
      }, [a, u, y, v]));
    let N = W({
        containerRef: C,
        inputRef: S,
        pushPasswordManagerStrategy: d,
        isFocused: E,
      }),
      ae = D.useCallback(
        (e) => {
          let t = e.currentTarget.value.slice(0, a);
          if (t.length > 0 && x && !x.test(t)) {
            e.preventDefault();
            return;
          }
          (typeof y == `string` &&
            t.length < y.length &&
            document.dispatchEvent(new Event(`selectionchange`)),
            b(t));
        },
        [a, b, y, x],
      ),
      P = D.useCallback(() => {
        var e;
        if (S.current) {
          let t = Math.min(S.current.value.length, a - 1),
            n = S.current.value.length;
          ((e = S.current) == null || e.setSelectionRange(t, n), A(t), M(n));
        }
        O(!0);
      }, [a]),
      oe = D.useCallback(
        (e) => {
          let t = S.current;
          if (!f && (!re.current.isIOS || !e.clipboardData || !t)) return;
          let n = e.clipboardData.getData(`text/plain`),
            r = f ? f(n) : n;
          e.preventDefault();
          let i = S.current?.selectionStart,
            o = S.current?.selectionEnd,
            s = (
              i === o
                ? v.slice(0, i) + r + v.slice(i)
                : v.slice(0, i) + r + v.slice(o)
            ).slice(0, a);
          if (s.length > 0 && x && !x.test(s)) return;
          ((t.value = s), b(s));
          let c = Math.min(s.length, a - 1),
            l = s.length;
          (t.setSelectionRange(c, l), A(c), M(l));
        },
        [a, b, x, v],
      ),
      se = D.useMemo(
        () => ({
          position: `relative`,
          cursor: _.disabled ? `default` : `text`,
          userSelect: `none`,
          WebkitUserSelect: `none`,
          pointerEvents: `none`,
        }),
        [_.disabled],
      ),
      F = D.useMemo(
        () => ({
          position: `absolute`,
          inset: 0,
          width: N.willPushPWMBadge
            ? `calc(100% + ${N.PWM_BADGE_SPACE_WIDTH})`
            : `100%`,
          clipPath: N.willPushPWMBadge
            ? `inset(0 ${N.PWM_BADGE_SPACE_WIDTH} 0 0)`
            : void 0,
          height: `100%`,
          display: `flex`,
          textAlign: o,
          opacity: `1`,
          color: `transparent`,
          pointerEvents: `all`,
          background: `transparent`,
          caretColor: `transparent`,
          border: `0 solid transparent`,
          outline: `0 solid transparent`,
          boxShadow: `none`,
          lineHeight: `1`,
          letterSpacing: `-.5em`,
          fontSize: `var(--root-height)`,
          fontFamily: `monospace`,
          fontVariantNumeric: `tabular-nums`,
        }),
        [N.PWM_BADGE_SPACE_WIDTH, N.willPushPWMBadge, o],
      ),
      I = D.useMemo(
        () =>
          D.createElement(
            `input`,
            De(Ee({ autoComplete: _.autoComplete || `one-time-code` }, _), {
              "data-input-otp": !0,
              "data-input-otp-placeholder-shown": v.length === 0 || void 0,
              "data-input-otp-mss": k,
              "data-input-otp-mse": j,
              inputMode: l,
              pattern: x?.source,
              "aria-placeholder": c,
              style: F,
              maxLength: a,
              value: v,
              ref: S,
              onPaste: (e) => {
                var t;
                (oe(e), (t = _.onPaste) == null || t.call(_, e));
              },
              onChange: ae,
              onMouseOver: (e) => {
                var t;
                (ie(!0), (t = _.onMouseOver) == null || t.call(_, e));
              },
              onMouseLeave: (e) => {
                var t;
                (ie(!1), (t = _.onMouseLeave) == null || t.call(_, e));
              },
              onFocus: (e) => {
                var t;
                (P(), (t = _.onFocus) == null || t.call(_, e));
              },
              onBlur: (e) => {
                var t;
                (O(!1), (t = _.onBlur) == null || t.call(_, e));
              },
            }),
          ),
        [ae, P, oe, l, F, a, j, k, _, x?.source, v],
      ),
      ce = D.useMemo(
        () => ({
          slots: Array.from({ length: a }).map((e, t) => {
            let n =
                E &&
                k !== null &&
                j !== null &&
                ((k === j && t === k) || (t >= k && t < j)),
              r = v[t] === void 0 ? null : v[t];
            return {
              char: r,
              placeholderChar: v[0] === void 0 ? (c?.[t] ?? null) : null,
              isActive: n,
              hasFakeCaret: n && r === null,
            };
          }),
          isFocused: E,
          isHovering: !_.disabled && T,
        }),
        [E, T, a, j, k, _.disabled, v],
      ),
      le = D.useMemo(
        () => (h ? h(ce) : D.createElement(ke.Provider, { value: ce }, g)),
        [g, ce, h],
      );
    return D.createElement(
      D.Fragment,
      null,
      m !== null &&
        D.createElement(`noscript`, null, D.createElement(`style`, null, m)),
      D.createElement(
        `div`,
        { ref: C, "data-input-otp-container": !0, style: se, className: p },
        le,
        D.createElement(
          `div`,
          { style: { position: `absolute`, inset: 0, pointerEvents: `none` } },
          I,
        ),
      ),
    );
  });
Ae.displayName = `Input`;
function G(e, t) {
  try {
    e.insertRule(t);
  } catch {
    console.error(`input-otp could not insert CSS rule:`, t);
  }
}
var K = `
[data-input-otp] {
  --nojs-bg: white !important;
  --nojs-fg: black !important;

  background-color: var(--nojs-bg) !important;
  color: var(--nojs-fg) !important;
  caret-color: var(--nojs-fg) !important;
  letter-spacing: .25em !important;
  text-align: center !important;
  border: 1px solid var(--nojs-fg) !important;
  border-radius: 4px !important;
  width: 100% !important;
}
@media (prefers-color-scheme: dark) {
  [data-input-otp] {
    --nojs-bg: black !important;
    --nojs-fg: white !important;
  }
}`,
  je = `^\\d+$`;
function q({ className: e, containerClassName: t, ...n }) {
  return (0, E.jsx)(Ae, {
    "data-slot": `input-otp`,
    containerClassName: m(
      `cn-input-otp flex items-center has-disabled:opacity-50`,
      t,
    ),
    spellCheck: !1,
    className: m(`disabled:cursor-not-allowed`, e),
    ...n,
  });
}
function Me({ className: e, ...t }) {
  return (0, E.jsx)(`div`, {
    "data-slot": `input-otp-group`,
    className: m(
      `has-aria-invalid:ring-destructive/20 dark:has-aria-invalid:ring-destructive/40 has-aria-invalid:border-destructive rounded-lg has-aria-invalid:ring-3 flex items-center`,
      e,
    ),
    ...t,
  });
}
function J({ index: e, className: t, ...n }) {
  let {
    char: r,
    hasFakeCaret: i,
    isActive: a,
  } = D.useContext(ke)?.slots[e] ?? {};
  return (0, E.jsxs)(`div`, {
    "data-slot": `input-otp-slot`,
    "data-active": a,
    className: m(
      `dark:bg-input/30 border-input data-[active=true]:border-ring data-[active=true]:ring-ring/50 data-[active=true]:aria-invalid:ring-destructive/20 dark:data-[active=true]:aria-invalid:ring-destructive/40 aria-invalid:border-destructive data-[active=true]:aria-invalid:border-destructive size-8 border-y border-e text-sm transition-all outline-none first:rounded-s-lg first:border-s last:rounded-e-lg data-[active=true]:ring-3 relative flex items-center justify-center data-[active=true]:z-10`,
      t,
    ),
    ...n,
    children: [
      r,
      i &&
        (0, E.jsx)(`div`, {
          className: `pointer-events-none absolute inset-0 flex items-center justify-center`,
          children: (0, E.jsx)(`div`, {
            className: `animate-caret-blink bg-foreground h-4 w-px duration-1000`,
          }),
        }),
    ],
  });
}
function Y({ ...e }) {
  return (0, E.jsx)(`div`, {
    "data-slot": `input-otp-separator`,
    className: `[&_svg:not([class*='size-'])]:size-4 flex items-center`,
    role: `separator`,
    ...e,
    children: (0, E.jsx)(F, {}),
  });
}
var X = `*:data-[slot=input-otp-slot]:h-12 *:data-[slot=input-otp-slot]:w-11 *:data-[slot=input-otp-slot]:bg-background *:data-[slot=input-otp-slot]:text-xl *:data-[slot=input-otp-slot]:font-medium`;
function Ne({
  value: e,
  onChange: t,
  onComplete: n,
  invalid: r,
  disabled: i,
  id: a = `otp`,
}) {
  return (0, E.jsx)(`div`, {
    dir: `ltr`,
    className: `flex w-full justify-center`,
    children: (0, E.jsxs)(q, {
      id: a,
      maxLength: 6,
      pattern: je,
      inputMode: `numeric`,
      autoComplete: `one-time-code`,
      autoFocus: !0,
      value: e,
      onChange: t,
      onComplete: n,
      disabled: i,
      "aria-invalid": r || void 0,
      children: [
        (0, E.jsxs)(Me, {
          className: X,
          children: [
            (0, E.jsx)(J, { index: 0, "aria-invalid": r || void 0 }),
            (0, E.jsx)(J, { index: 1, "aria-invalid": r || void 0 }),
            (0, E.jsx)(J, { index: 2, "aria-invalid": r || void 0 }),
          ],
        }),
        (0, E.jsx)(Y, { className: `mx-1.5 text-muted-foreground/50` }),
        (0, E.jsxs)(Me, {
          className: X,
          children: [
            (0, E.jsx)(J, { index: 3, "aria-invalid": r || void 0 }),
            (0, E.jsx)(J, { index: 4, "aria-invalid": r || void 0 }),
            (0, E.jsx)(J, { index: 5, "aria-invalid": r || void 0 }),
          ],
        }),
      ],
    }),
  });
}
export {
  le as a,
  A as c,
  ue as i,
  k as l,
  ye as n,
  se as o,
  ce as r,
  ae as s,
  Ne as t,
};

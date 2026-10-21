function e(e, t = {}) {
  let n = new URLSearchParams(t.search ?? window.location.search);
  for (let e of t.omit ?? []) n.delete(e);
  for (let [e, r] of Object.entries(t.set ?? {}))
    r == null ? n.delete(e) : n.set(e, r);
  let r = n.toString();
  return r ? `${e}?${r}` : e;
}
var t = [`token`, `error`, `addAccount`, `email`];
export { e as n, t };

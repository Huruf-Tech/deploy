/** `${{KEY}}` or `${{scope.KEY}}` (PLAN §12). */
const REFERENCE =
  /\$\{\{\s*(?:([a-z0-9-]+)\.)?([A-Za-z_][A-Za-z0-9_]*)\s*\}\}/g;

export class VariableReferenceError extends Error {}

/** Scopes named in references (`${{shop-db.KEY}}` → `shop-db`). */
export function referencedScopes(values: Iterable<string>) {
  const scopes = new Set<string>();
  for (const value of values) {
    for (const [, scope] of value.matchAll(REFERENCE)) {
      if (scope) scopes.add(scope);
    }
  }
  return scopes;
}

/**
 * Merges scope layers (lowest precedence first) and expands references.
 * `${{KEY}}` means the merged KEY; `${{tenant.KEY}}` pins a scope. Throws on
 * cycles, and on references to keys that don't exist unless `allowMissing`
 * (then they are left as written). `refOnly` layers (other projects) can be
 * referenced by scope but aren't part of the result; their own unscoped
 * references stay within them.
 */
export function resolveReferences(
  layers: Array<[scope: string, values: Record<string, string>]>,
  {
    allowMissing = false,
    refOnly = [] as Array<[scope: string, values: Record<string, string>]>,
  } = {},
): Record<string, string> {
  const byScope = new Map([...layers, ...refOnly]);
  const isolated = new Set(refOnly.map(([scope]) => scope));
  const owner = new Map<string, string>();
  for (const [scope, values] of layers) {
    for (const key of Object.keys(values)) owner.set(key, scope);
  }

  const done = new Map<string, string>();
  const expand = (scope: string, key: string, path: string[]): string => {
    const id = `${scope}.${key}`;
    const cached = done.get(id);
    if (cached !== undefined) return cached;
    if (path.includes(id)) {
      throw new VariableReferenceError(
        `Reference cycle: ${[...path, id].join(" → ")}`,
      );
    }

    const value = byScope.get(scope)![key].replace(
      REFERENCE,
      (match, refScope: string | undefined, refKey: string) => {
        const target = refScope ??
          (isolated.has(scope) ? scope : owner.get(refKey));
        if (!target || byScope.get(target)?.[refKey] === undefined) {
          if (allowMissing) return match;
          throw new VariableReferenceError(
            `${key} references ${
              refScope ? `${refScope}.` : ""
            }${refKey}, which does not exist`,
          );
        }
        return expand(target, refKey, [...path, id]);
      },
    );
    done.set(id, value);
    return value;
  };

  return Object.fromEntries(
    [...owner].map(([key, scope]) => [key, expand(scope, key, [])]),
  );
}

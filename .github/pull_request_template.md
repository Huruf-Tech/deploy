## What and why

<!-- Which phase / sub-phase of docs/PLAN.md §16 does this belong to? -->

## Checklist

- [ ] Reuses existing building blocks (`lib/core/`); no new duplication
- [ ] New variants added as strategy classes, not `if`/`switch` branches (PLAN
      §23.3)
- [ ] Types derived from zod schemas, not re-declared
- [ ] Hot paths stay within the §20.2 budgets; every new in-memory cache uses
      `BoundedCache` and is listed in §20.4
- [ ] Indexes added to `scripts/syncDeployIndexes.ts`; permissions to
      `scripts/syncDeployAccessControl.ts`
- [ ] SDK regenerated (`deno task generate:sdk -v 0.0.1 --overwrite`) and app
      rebuilt (`npm run build` in `public/app`), `www` committed
- [ ] en + ar translation keys added
- [ ] Docs / ADR updated
- [ ] Any new dependency is justified below

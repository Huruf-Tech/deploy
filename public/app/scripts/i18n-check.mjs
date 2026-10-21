#!/usr/bin/env node
/**
 * Reports translation keys that are referenced in the source but missing from
 * the locale files, and keys that exist only as an untranslated copy of their
 * English text.
 *
 *   npm run i18n:check
 *
 * Exits non-zero when anything is missing, so it can gate a review.
 *
 * Keys reached dynamically — `t(someVariable)`, such as the filter operator
 * labels — cannot be found by a static scan, so they are listed in DYNAMIC
 * below. Add to that list rather than deleting a key the scan calls unused.
 */
import fs from "node:fs"
import path from "node:path"
import process from "node:process"

const root = process.cwd()
const SRC = path.join(root, "src")

const CORE = "/src/core/locals"
const APP = "/src/locals"

const DYNAMIC = [
  // filter operators (src/core/crud/filters/lib/operators.ts)
  "is", "is not", "is at least", "is at most", "is on or after", "is on or before",
  "contains", "does not contain", "is between", "is not between",
  "all", "includes", "excludes",
  // wallet + overview tabs and date-range presets
  "Overview", "This Month", "3 Months", "6 Months", "Custom",
  "Sent", "Received", "Credit", "Debit", "name",
  // schema-driven field labels resolve through t(field.label ?? name)
]

const files = []
;(function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) walk(full)
    else if (/\.(ts|tsx)$/.test(entry.name) && !/\.test\./.test(entry.name)) files.push(full)
  }
})(SRC)

// Matches t("...") and i18next.t("..."), including escaped quotes.
const PATTERN = /\bt\(\s*"((?:[^"\\]|\\.)*)"/g

const used = new Map()
for (const file of files) {
  const source = fs.readFileSync(file, "utf8")
  let match
  while ((match = PATTERN.exec(source))) {
    const key = JSON.parse(`"${match[1]}"`)
    if (!used.has(key)) used.set(key, new Set())
    used.get(key).add(path.relative(root, file).replace(/\\/g, "/"))
  }
}

const load = (p) => {
  try {
    return JSON.parse(fs.readFileSync(root + p, "utf8"))
  } catch {
    return {}
  }
}

const locales = ["en", "ar"]
let failed = false

for (const locale of locales) {
  const core = load(`${CORE}/${locale}/translation.json`)
  const app = load(`${APP}/${locale}/translation.json`)
  const merged = { ...core, ...app } // app overrides core, matching src/i18n.ts

  const missing = [...used.keys()].filter((key) => !(key in merged)).sort()
  const untranslated =
    locale === "en" ? [] : Object.keys(merged).filter((key) => merged[key] === key).sort()

  console.log(
    `${locale}: ${Object.keys(merged).length} keys ` +
      `(core ${Object.keys(core).length} + app ${Object.keys(app).length})`
  )

  if (missing.length) {
    failed = true
    console.log(`  ${missing.length} missing:`)
    for (const key of missing) {
      console.log(`    ${JSON.stringify(key)}  <- ${[...used.get(key)].join(", ")}`)
    }
  }

  if (untranslated.length) {
    failed = true
    console.log(`  ${untranslated.length} untranslated (value identical to the key):`)
    for (const key of untranslated) console.log(`    ${JSON.stringify(key)}`)
  }
}

// Keys in the locale files that nothing references. Not a failure: many are
// reached dynamically, which is why DYNAMIC exists.
const known = new Set([...used.keys(), ...DYNAMIC])
const orphans = Object.keys({
  ...load(`${CORE}/en/translation.json`),
  ...load(`${APP}/en/translation.json`),
}).filter((key) => !known.has(key))

if (orphans.length) {
  console.log(`\n${orphans.length} key(s) with no static reference (check before removing):`)
  for (const key of orphans) console.log(`    ${JSON.stringify(key)}`)
}

if (failed) {
  console.error("\ni18n check failed.")
  process.exit(1)
}

console.log("\ni18n check passed.")

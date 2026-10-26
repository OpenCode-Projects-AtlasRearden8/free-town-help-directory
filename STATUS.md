# STATUS.md

Last updated: 2026-10-26

## What was built

**Free-Town Help Directory** — an offline, fill-in-your-town HTML template that
catalogs local free help. Ships with a fully fictional example county ("Maple
County", 15 example entries across all 6 categories) that users replace with
their own verified rows.

- `index.html` — single-page catalog. Inline CSS (no external requests at all).
  Features: search box, category filter buttons (All / 6 categories), print /
  save-as-PDF button with print stylesheet, per-entry cards showing hours,
  eligibility, what-to-bring, services, notes, and the verified-on date. Shows
  the maintenance note + last-updated date from the data.
- `data/directory.json` — single source of truth. 6 categories: library,
  food, senior, utility, tax, medical. All example rows are fictional;
  fields per README row table.
- `js/render.js` — shared renderer (card HTML, category nav, grouping). Runs
  identically in the browser and in Node under the tests. Escapes all text.
- `js/app.js` — page glue: loads `window.FTHD_DATA`, wires search/filters/print,
  renders a friendly error if `data.js` is missing/stale.
- `data.js` — generated embed of the JSON (browsers block local `fetch()` via
  CORS, so the build embeds the data instead; this keeps the page 100%
  double-clickable offline with no server).
- `scripts/build.js` — validates the JSON then (re)generates `data.js`.
- `scripts/validate.js` — shared validation: required fields, YYYY-MM-DD date
  format, category references, no empty strings, affiliate/tracking-link
  blocklist (test rejects `?tag=`, `aff_id=`, `utm_`, etc.).
- `scripts/test.js` — 24 checks: JSON validation, data.js freshness, render
  pipeline (incl. script-injection escaping check), category grouping/nav,
  static checks on index.html (local scripts only, inline CSS), README/LICENSE
  content (exact copyright line).
- `scripts/smoke-dom.js` — runs the real `app.js` in a minimal DOM shim:
  initial render (every entry name present), category filter renders only that
  category's cards, search works (hit / no-hit / clear), print button wired.
- `README.md` — quick start, plain-English how-it-works, fill-in-your-town row
  fields, the Find-and-double-check guide (find / double-check by phone with
  verifiedOn dates / seasonal re-verification / neighborly judgment rules),
  maintenance guide, credits + MIT.
- `LICENSE` — MIT, `Copyright (c) 2026 Asdale Dynamics, LLC`.

Design promises kept: zero signups, no network calls, no ads/affiliate links
(enforced by test), local-first. Example data is fictional so no real-world
detail can go stale in the shipped template.

## How to run it

Requirements: Node.js 18+ (for build/test only — the page itself needs just a
browser).

```bash
npm run build   # validate JSON, regenerate data.js
npm test        # data + render + static checks + DOM smoke test
```

Then double-click `index.html` (or open via `file://`). No server needed.

## Verification results (2026-10-26)

- `npm run build` → OK: wrote data.js (15 entries, 6 categories)
- `npm test` → ALL TESTS PASSED (24 checks, 0 failures)
- `node scripts/smoke-dom.js` → SMOKE TEST PASSED (10 checks, 0 failures)
- Verified: page scripts load in order (`data.js` → `render.js` → `app.js`),
  cards render for all entries, filters/search/print behave, all card text is
  HTML-escaped (XSS check passed), no external script sources in index.html.

## Known gaps / honest notes

- No dedicated test of a real browser engine (Node DOM shim instead). The
  shim covers app.js logic, not visual layout; the CSS is hand-verified and
  simple.
- Category list is fixed in `validate.js`-agnostic terms (categories are
  data-driven), but adding a new category label only requires JSON — the page
  nav updates automatically. No UI for editing JSON; users edit by hand (that
  is the product).
- `whatToBring` items are strings in a list; there is no per-item "should I
  photocopy this?" nuance. Notes field carries that.
- Example county is fictional and clearly labeled; users must do real
  verification for their own rows (that's the point of the project).
- No printing pagination polish beyond `break-inside: avoid`.

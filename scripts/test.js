#!/usr/bin/env node
"use strict";

/*
 * Tests:
 *   1. data/directory.json parses and passes all data validation rules.
 *   2. data.js is fresh (matches the JSON).
 *   3. index.html + js/ render pipeline produces correct card HTML per entry
 *      (executed in Node against the same shared render.js the browser uses).
 *   4. Static sanity checks on index.html (scripts referenced, no remote
 *      tracker scripts, copyright/credit present in README + LICENSE).
 *
 * Run: npm test   (or: node scripts/test.js)
 * Exit code 0 = all tests pass.
 */

const fs = require("fs");
const path = require("path");
const { validateData, ISO_DATE } = require("./validate");
const render = require("../js/render");

let failures = 0;
let passes = 0;

function check(name, condition, detail) {
  if (condition) {
    passes++;
    console.log("  PASS: " + name);
  } else {
    failures++;
    console.error("  FAIL: " + name + (detail ? " :: " + detail : ""));
  }
}

function section(name) {
  console.log("\n== " + name + " ==");
}

const root = path.join(__dirname, "..");

// ---------------------------------------------------------------- 1. JSON data
section("data/directory.json validation");
let data;
let jsonRaw;
try {
  jsonRaw = fs.readFileSync(path.join(root, "data", "directory.json"), "utf8");
  data = JSON.parse(jsonRaw);
  check("data/directory.json parses as JSON", true);
} catch (err) {
  check("data/directory.json parses as JSON", false, err.message);
  console.error("\nCannot continue without valid JSON. Exiting.");
  process.exit(1);
}

const problems = validateData(data);
check("all validation rules pass", problems.length === 0, problems.join(" | "));

const allDatesOk = data.entries.every(
  (e) => e.verifiedOn && ISO_DATE.test(e.verifiedOn)
);
check("every entry has a verifiedOn (YYYY-MM-DD) date", allDatesOk);

const everyCategoryUsed = data.categories.every((c) =>
  data.entries.some((e) => e.category === c.id)
);
check(
  "every declared category has at least one entry",
  everyCategoryUsed,
  "empty categories render as dead buttons"
);

const noAffiliate = data.entries.every(
  (e) =>
    !e.website ||
    ![
      "?tag=", "&tag=", "aff_id=", "affiliate", "/ref=", "referral=", "utm_", "clickbank", "amzn.to"
    ].some((m) => e.website.toLowerCase().includes(m))
);
check("no affiliate/tracking links in any entry", noAffiliate);

// -------------------------------------------------------------------- 2. data.js
section("data.js freshness");
const dataJsPath = path.join(root, "data.js");
let dataJsOk = false;
if (fs.existsSync(dataJsPath)) {
  const dataJs = fs.readFileSync(dataJsPath, "utf8");
  const marker = "window.FTHD_DATA";
  const start = dataJs.indexOf(marker) + marker.length;
  const braceStart = dataJs.indexOf("{", start);
  const braceEnd = dataJs.lastIndexOf("}");
  const embedded = dataJs.slice(braceStart, braceEnd + 1);
  let embeddedData;
  try {
    embeddedData = JSON.parse(embedded);
    dataJsOk = JSON.stringify(embeddedData) === JSON.stringify(data);
    check(
      "data.js embeds the exact current JSON",
      dataJsOk,
      "stale - run: npm run build"
    );
  } catch (err) {
    check("data.js embeds the exact current JSON", false, "unparseable: " + err.message);
  }
} else {
  check("data.js exists", false, "run: npm run build");
}

// ------------------------------------------------------------- 3. render checks
section("render pipeline (shared with browser)");
const cards = data.entries.map(render.card);
check(
  "render.card produces one card per entry",
  cards.every((c) => c && c.includes("fthd-card"))
);

const esc = render.esc;
const sample = data.entries[0];
const sampleCard = cards[0];
check(
  "card includes the entry name",
  sampleCard.includes(esc(sample.name)),
  "expected: " + esc(sample.name)
);
check(
  "card includes eligibility",
  sampleCard.includes("Eligibility") && sampleCard.includes(esc(sample.eligibility.slice(0, 30)))
);
check(
  "card includes what-to-bring list items",
  (sample.whatToBring || []).every((item) => sampleCard.includes("<li>" + esc(item) + "</li>"))
);
check(
  "card includes verified-on date",
  sampleCard.includes("verified on " + esc(sample.verifiedOn))
);

const xss = '<script>alert(1)</script>';
const xssCard = render.card({
  id: "t",
  name: xss,
  category: data.categories[0].id,
  address: xss,
  phone: "555",
  website: "",
  hours: "",
  eligibility: xss,
  whatToBring: [xss],
  services: [xss],
  notes: xss,
  verifiedOn: "2026-01-01"
});
check(
  "esc() neutralizes script injection in all fields",
  !xssCard.includes("<script>") && xssCard.includes("&lt;script&gt;")
);

const grouped = render.groupByCategory(data);
check(
  "groupByCategory covers every entry exactly once",
  grouped.reduce((n, g) => n + g.rows.length, 0) === data.entries.length
);
check(
  "groupByCategory order matches declared category order",
  JSON.stringify(grouped.map((g) => g.id)) ===
    JSON.stringify(data.categories.filter((c) => grouped.some((gr) => gr.id === c.id)).map((c) => c.id))
);

const nav = render.renderCategoryNav(data);
check(
  "category nav includes a button per populated category",
  data.categories
    .filter((c) => data.entries.some((e) => e.category === c.id))
    .every((c) => nav.includes('data-category="' + c.id + '"'))
);
check(
  "nav includes an All button that starts active",
  nav.includes('data-category="all"') && nav.includes("fthd-active")
);

// ------------------------------------------------------------- 4. static checks
section("static files");
const htmlPath = path.join(root, "index.html");
const html = fs.readFileSync(htmlPath, "utf8");

check(
  "index.html references data.js, js/render.js and js/app.js",
  ['<script src="data.js">', '<script src="js/render.js">', '<script src="js/app.js">']
    .every((s) => html.includes(s))
);
check(
  "index.html embeds the stylesheet inline (works offline)",
  html.includes("<style>") && !/link[^>]*rel="?stylesheet/i.test(html)
);
check(
  "index.html has no external <script src> except local files",
  [...html.matchAll(/<script\s+src="([^"]+)"/g)]
    .map((m) => m[1])
    .every((src) => !/^(https?:)?\/\//i.test(src)),
  "external/page.js style scripts break the offline promise"
);

const readmePath = path.join(root, "README.md");
const readme = fs.existsSync(readmePath)
  ? fs.readFileSync(readmePath, "utf8") : "";
check("README.md exists", readme.length > 0);
check(
  "README.md credits Asdale Dynamics, LLC",
  readme.includes("Asdale Dynamics, LLC")
);
check(
  "README.md describes the find-and-double-check guide",
  /(find[- ]and[- ]double[- ]check)/i.test(readme) ||
    /(find.+check guide|check it .+. double)/i.test(readme)
);

const licensePath = path.join(root, "LICENSE");
const license = fs.existsSync(licensePath) ? fs.readFileSync(licensePath, "utf8") : "";
check("LICENSE exists", license.length > 0);
const expectedLine = "Copyright (c) 2026 Asdale Dynamics, LLC";
check(
  "LICENSE copyright line is exact",
  license.split("\n").some((l) => l.trim().includes(expectedLine))
);

// --------------------------------------------------------------------- summary
console.log("\n----------------------------------------");
console.log(
  failures === 0
    ? `ALL TESTS PASSED (${passes} checks, 0 failures)`
    : `TESTS FAILED: ${failures} failed, ${passes} passed`
);
console.log("----------------------------------------");
process.exit(failures === 0 ? 0 : 1);

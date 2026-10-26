#!/usr/bin/env node
"use strict";

/*
 * Builds data.js (embedded copy of data/directory.json) so the page works
 * offline when opened directly as a file (file://), where fetch() is blocked
 * by browsers. The JSON file stays the single source of truth.
 */

const fs = require("fs");
const path = require("path");
const validate = require("./validate");

const root = path.join(__dirname, "..");
const jsonPath = path.join(root, "data", "directory.json");
const outPath = path.join(root, "data.js");

let data;
try {
  data = JSON.parse(fs.readFileSync(jsonPath, "utf8"));
} catch (err) {
  console.error("BUILD FAILED: could not parse data/directory.json");
  console.error(err.message);
  process.exit(1);
}

const problems = validate.validateData(data);
if (problems.length) {
  console.error("BUILD FAILED: data/directory.json has problems:");
  problems.forEach((p) => console.error("  - " + p));
  process.exit(1);
}

const banner =
  "// GENERATED FILE - do not edit by hand.\n" +
  "// Source of truth: data/directory.json. Regenerate with: npm run build\n" +
  "// Generated: " + new Date().toISOString() + "\n";

const body =
  "window.FTHD_DATA = " + JSON.stringify(data, null, 2) + ";\n";

fs.writeFileSync(outPath, banner + body, "utf8");
console.log(
  "OK: wrote data.js (" + data.entries.length + " entries, " +
    data.categories.length + " categories)"
);

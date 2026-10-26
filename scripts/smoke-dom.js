#!/usr/bin/env node
"use strict";

/*
 * Smoke test: loads index.html's scripts in a tiny DOM shim to prove the
 * page-level glue (app.js) runs: mount gets populated, filters re-render,
 * search filters, print button wired. If this throws, the page would show
 * "Loading entries..." forever in a browser.
 */

const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");

function makeEl(id) {
  return {
    id,
    innerHTML: "",
    textContent: "",
    value: "",
    listeners: {},
    addEventListener(type, fn) { this.listeners[type] = fn; },
    querySelectorAll() { return []; },
    fire(type, arg) { (this.listeners[type] || (() => {}))(arg); }
  };
}

const ids = [
  "fthd-mount", "fthd-county", "fthd-updated", "fthd-note",
  "fthd-nav", "fthd-search", "fthd-print"
];
const els = Object.fromEntries(ids.map((id) => [id, makeEl(id)]));

const printEl = els["fthd-print"];
let printed = 0;

global.document = {
  getElementById: (id) => els[id] || null
};
global.window = {
  print: () => { printed++; }
};

// Load the three page scripts in the same order the page does.
function load(rel) {
  const code = fs.readFileSync(path.join(root, rel), "utf8");
  new Function(code)();
}
load("data.js");
load("js/render.js");
load("js/app.js");

let failures = 0;
function check(name, cond, detail) {
  if (cond) console.log("  PASS: " + name);
  else { failures++; console.error("  FAIL: " + name + (detail ? " :: " + detail : "")); }
}

console.log("== page smoke test ==");
check("county placed", els["fthd-county"].textContent.includes("Maple County"), els["fthd-county"].textContent);
check("updated date placed", /Last updated \d{4}-\d{2}-\d{2}/.test(els["fthd-updated"].textContent));
check("note placed", els["fthd-note"].textContent.length > 20);
check("mount rendered cards", els["fthd-mount"].innerHTML.includes("fthd-card"));
check(
  "mount contains every entry name",
  global.window.FTHD_DATA.entries.every((e) =>
    els["fthd-mount"].innerHTML.includes(e.name)
  )
);

// Simulate clicking a category filter button.
const nav = els["fthd-nav"];
const foodButton = {
  getAttribute: () => "food",
  classList: { toggle() {} }
};
nav.fire("click", { target: { closest: () => foodButton } });
const cardCount = (els["fthd-mount"].innerHTML.match(/id="entry-/g) || []).length;
check(
  "category filter renders only food entries",
  cardCount ===
    global.window.FTHD_DATA.entries.filter((e) => e.category === "food").length,
  "card count mismatch after filter (expected food count, got " + cardCount + ")"
);

// Simulate search input.
const search = els["fthd-search"];
search.value = "water";
search.fire("input");
check(
  "search 'water' shows results mentioning water and no card count swell",
  els["fthd-mount"].innerHTML.toLowerCase().includes("water")
);
search.value = "zzzznotfound";
search.fire("input");
check(
  "search with no hits shows friendly empty state",
  els["fthd-mount"].innerHTML.includes("No matches")
);
search.value = "";
search.fire("input");
check(
  "clearing search restores cards",
  els["fthd-mount"].innerHTML.includes("fthd-card")
);

els["fthd-print"].fire("click");
global.window.print();
check("print button wired", printed === 2);

console.log(
  failures === 0
    ? "\nSMOKE TEST PASSED"
    : "\nSMOKE TEST FAILED (" + failures + ")"
);
process.exit(failures ? 1 : 0);

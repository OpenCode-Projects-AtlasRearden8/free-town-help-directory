"use strict";

/*
 * Shared validation for data/directory.json. Used by build.js (hard stop)
 * and test.js (reporting). Pure checks, no IO.
 */

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const REQUIRED_FIELDS = [
  "id",
  "category",
  "name",
  "address",
  "phone",
  "website",
  "hours",
  "eligibility",
  "whatToBring",
  "services",
  "notes",
  "verifiedOn"
];
const STRING_FIELDS = REQUIRED_FIELDS.filter(
  (f) => f !== "whatToBring" && f !== "services"
);

// Markers that suggest an affiliate/tracking link rather than a plain URL.
const AFFILIATE_MARKERS = [
  "?tag=",
  "&tag=",
  "aff_id=",
  "affiliate",
  "/ref=",
  "referral=",
  "utm_",
  "clickbank",
  "amzn.to"
];

function validateData(data) {
  const problems = [];

  if (!data || typeof data !== "object" || Array.isArray(data)) {
    return ["Top level of data/directory.json must be an object."];
  }

  ["title", "tagline", "county", "updatedOn", "note"].forEach((field) => {
    if (typeof data[field] !== "string" || !data[field].trim()) {
      problems.push(`Top-level field "${field}" must be a non-empty string.`);
    }
  });

  if (data.updatedOn && !ISO_DATE.test(data.updatedOn)) {
    problems.push(`"updatedOn" must be YYYY-MM-DD, got: ${JSON.stringify(data.updatedOn)}`);
  }

  if (!Array.isArray(data.categories) || data.categories.length === 0) {
    problems.push('"categories" must be a non-empty array.');
    return problems;
  }

  const categoryIds = [];
  data.categories.forEach((cat, i) => {
    if (!cat || typeof cat.id !== "string" || !cat.id.trim()) {
      problems.push(`categories[${i}] is missing a non-empty string "id".`);
      return;
    }
    if (typeof cat.label !== "string" || !cat.label.trim()) {
      problems.push(`categories[${i}] ("${cat.id}") is missing a non-empty string "label".`);
    }
    categoryIds.push(cat.id);
  });

  if (!Array.isArray(data.entries) || data.entries.length === 0) {
    problems.push('"entries" must be a non-empty array.');
    return problems;
  }

  const seenIds = new Set();
  data.entries.forEach((entry, i) => {
    const label = `entries[${i}]${entry && entry.name ? ` (${entry.name})` : ""}`;
    if (!entry || typeof entry !== "object") {
      problems.push(`${label} must be an object.`);
      return;
    }

    if (!entry.id || typeof entry.id !== "string") {
      problems.push(`${label} is missing a non-empty string "id".`);
    } else if (seenIds.has(entry.id)) {
      problems.push(`${label} has a duplicate id: "${entry.id}".`);
    } else {
      seenIds.add(entry.id);
    }

    STRING_FIELDS.forEach((field) => {
      if (typeof entry[field] !== "string") {
        problems.push(`${label} is missing string field "${field}".`);
      } else if (field !== "website" && !entry[field].trim()) {
        problems.push(`${label} field "${field}" is empty (write "None" or real content).`);
      }
    });

    if (!Array.isArray(entry.whatToBring) || entry.whatToBring.length === 0) {
      problems.push(`${label} "whatToBring" must be a non-empty array (use \["Nothing needed."\] if applicable).`);
    } else {
      entry.whatToBring.forEach((item, j) => {
        if (typeof item !== "string" || !item.trim()) {
          problems.push(`${label} whatToBring[${j}] must be a non-empty string.`);
        }
      });
    }

    if (!Array.isArray(entry.services) || entry.services.length === 0) {
      problems.push(`${label} "services" must be a non-empty array.`);
    } else {
      entry.services.forEach((item, j) => {
        if (typeof item !== "string" || !item.trim()) {
          problems.push(`${label} services[${j}] must be a non-empty string.`);
        }
      });
    }

    if (!categoryIds.includes(entry.category)) {
      problems.push(
        `${label} has category "${entry.category}" which is not in the categories list.`
      );
    }

    if (typeof entry.verifiedOn === "string") {
      if (!ISO_DATE.test(entry.verifiedOn)) {
        problems.push(
          `${label} "verifiedOn" must be YYYY-MM-DD, got: ${JSON.stringify(entry.verifiedOn)}`
        );
      }
    }
  });

  data.entries.forEach((entry) => {
    if (entry && typeof entry.website === "string" && entry.website.trim()) {
      const lower = entry.website.toLowerCase();
      if (!/^https?:\/\/[a-z0-9.-]+/i.test(entry.website)) {
        problems.push(
          `Entry "${entry.id}" website does not look like a plain URL: ${entry.website}`
        );
      }
      AFFILIATE_MARKERS.forEach((marker) => {
        if (lower.includes(marker)) {
          problems.push(
            `Entry "${entry.id}" website looks like an affiliate/tracking link (${marker}). This project must not contain affiliate links.`
          );
        }
      });
    }
  });

  return problems;
}

module.exports = { validateData, REQUIRED_FIELDS, ISO_DATE };

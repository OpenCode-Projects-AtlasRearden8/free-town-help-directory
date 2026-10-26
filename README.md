# Free-Town Help Directory

> Free directory you fill in for your own town. Prints clean. Works offline.
> Zero signups, no ads, no affiliate links — purely local.

A single-page, offline HTML template that catalogs the **free help in your county**:
library services and gadget lending, food pantries and meal sites, senior centers,
utility assistance, free tax-prep days, and hospital financial-aid offices — each
with hours, eligibility, what to bring, and the **date a human last verified it**.

It ships with a fictional example county ("Maple County") so you can see the format.
You replace those rows with your town's real listings.

**This is not official advice.** Every entry in the template is an example. Listings
in your own directory are only as good as their verified-on date — the guide below
is how a neighbor keeps them true.

---

## Quick start (2 minutes)

You need [Node.js](https://nodejs.org) (18+) installed. That is the only tooling.
No account, no install of anything else.

```bash
npm run build   # validate the JSON and generate data.js
npm test        # validate JSON + test the page render
```

Then open `index.html` by double-clicking it. It opens in your browser,
fully offline. Search, filter by category, and use
**Print / Save as PDF** for a paper copy (the fridge door was the original
API). Nothing leaves your computer — the page never talks to a network at all.

## How it works (plain English)

- `data/directory.json` — the **single source of truth**. Every listing is a row
  here: name, address, phone, website, hours, eligibility, what to bring,
  services, notes, and `verifiedOn` (the date you last confirmed it by calling
  or visiting).
- `npm run build` — checks your JSON, then writes `data.js`, a copy the page
  can use. Why the copy? Browsers refuse to let a page opened from your
  computer's hard drive read a neighboring file directly (a security rule
  called CORS). The build step sidesteps that without needing a web server.
- `index.html` — the page. Loads `js/render.js` (turns rows into cards) and
  `js/app.js` (search box, category buttons, print button).
- `npm test` — validates your JSON (missing fields, bad dates, categories that
  don't exist, and an affiliate-link blocklist), re-checks that `data.js` is
  fresh, renders every card in Node exactly like the browser would, and checks
  nothing pulls in remote tracking scripts.

## Fill in your own town

1. **Find.** Start with the [Find-and-double-check guide](#find-and-double-check-guide)
   below. Library and "211" staff often know more than any website.
2. **Edit `data/directory.json`.** Copy one of the example rows, change the
   fields, delete the rest of the examples. Keep `verifiedOn` honest: if you
   have not called or visited yet, write today's date that you *found* it listed
   somewhere — and re-verify before you rely on the listing.
3. **Run `npm run build && npm test`.** Red output tells you exactly which field
   is missing or malformed. Fix it until the tests are green.
4. **Reload `index.html`.** Print it. Staple it where it helps.

### Row fields (every entry)

| Field         | Meaning |
|---------------|---------|
| `id`          | Short unique slug, e.g. `food-pantry-1` |
| `category`    | One of: `library`, `food`, `senior`, `utility`, `tax`, `medical` |
| `name`        | What people call it, not the legal name |
| `address`     | Street address, plus any entrance detail that matters |
| `phone`       | A number a human answers during listed hours |
| `website`     | Plain URL, or `""` if none (smaller places often have none) |
| `hours`       | Write what the staff said, even if the website disagrees |
| `eligibility` | Who qualifies. "Self-declared need, no proof" is a sentence worth finding exact |
| `whatToBring` | List of items; use `["Nothing needed."]` if truly nothing |
| `services`    | 2–4 bullets; specifics beat generalities |
| `notes`       | The local wisdom: quiet hours, waitlists, accessible entrances |
| `verifiedOn`  | `YYYY-MM-DD` date you last confirmed by call or visit |

## Find-and-double-check guide

Half of this project is a method, not software. Six steps, thirty minutes a
month, one town.

### 1. Find (build the raw list)

- **Dial 211.** Most of the US and Canada: a free, confidential call that
  connects to local services. Ask them to email/mail their local resource
  sheet — it is the best starting list you will ever get.
- **Ask the library.** The reference desk keeps exactly the list you are
  building. Ask: "What do people come in asking you for help with?"
- **Your county/city website.** Search `[your county] senior services`,
  `[your county] utility assistance`, `[your state] 211`.
- **Ask at the food pantry counter.** Pantries trade referrals constantly;
  they will name the pantries the 211 sheet forgot.
- **Hospital billing office.** Every nonprofit hospital must publish a written
  financial-assistance (charity care) policy. Search
  `[hospital name] financial assistance policy`, or just call and ask them to
  mail it.
- **Tax season.** Search `[your state] VITA free tax help` or visit the IRS
  VITA locator. TCE (Tax Counseling for the Elderly) is a second, related
  program geared to age 60+.

### 2. Double-check (turn "listed" into "true")

For every entry on your list, in order:

1. **Call the number.** Websites rot; the phone is the current truth. Ask how
   the contact themselves would say it: hours, who qualifies, what to bring.
2. **Confirm the details you plan to print**: address, hours string,
   eligibility sentence, what-to-bring list, and anything surprising.
3. **Write the date.** That date, the day you called, is the `verifiedOn`
   value for that row. That is the whole system.
4. **When a phone rings to nowhere**, note it in `notes`, try one source you
   trust, and keep the date it failed. A directory that admits its gaps is
   more useful than a tidy one that hides them.

### 3. Re-verify (keep it honest)

- Recurring, predictable change: tax sites close mid-April; LIHEAP-style
  utility funds open and close seasonally; school food shelves thin out in
  summer. Re-check those on the season's turn, not the calendar's.
- Put the month's name in your phone with a 15-minute reminder. One coffee +
  six phone calls. That's the whole maintenance budget.
- Stale by 12+ months? Do not delete silently — change `verifiedOn` and write
  in `notes`: "Could not re-reach by phone as of [date]." Then try again when
  the season turns.

### 4. Keep it neighborly

- The eligibility sentence is the whole point. "No proof required — you just
  show up" is information somebody needed three weeks of courage to ask about.
  Get it exactly right.
- Include the harder-to-ask-about details people actually need:
  whether ID is required, whether it is judgement-free, which entrance is
  wheelchair-accessible, whether there's a phones-answer window.
- Never list anything you would not say to a neighbor's face.

## Why no affiliate links

Every dollar this page could earn from you would cost trust where it can least
afford it — a nurse's handout destitute people read twice: once in
desperation, then again for the phone number. There are no ads, no tracking,
no signups, and no affiliate/referral links on purpose and by test —
`npm test` rejects any entry whose URL carries a tracking marker.

## Repo layout

```
├── index.html            the page (open it, it just works)
├── data.js               generated from the JSON (don't edit by hand)
├── data/
│   └── directory.json    ← your rows live here
├── js/
│   ├── render.js         shared card renderer (browser + tests)
│   └── app.js            search, filters, print button
├── scripts/
│   ├── build.js          npm run build
│   ├── validate.js       shared data validation
│   ├── test.js           npm test (data + render + static checks)
│   └── smoke-dom.js      npm test part 2: runs app.js in a DOM shim
├── LICENSE               MIT · Copyright (c) 2026 Asdale Dynamics, LLC
└── STATUS.md             build notes, verification log, known gaps
```

## Maintenance guide (for future-you)

- **Add or edit a row:** edit `data/directory.json`, then `npm run build` and
  `npm test`. Fix anything red. Reload the page.
- **JSON error messages name the entry and the field.** If you see
  `entries[7] (Hope Hall) field "hours" is empty` you know exactly where to
  look. Empty strings fail except `website` (which may be `""`).
- **Dates are `YYYY-MM-DD`.** Tests reject anything else.
- **New category?** Add it to `categories` with an `id`/`label`, give at least
  one entry that `category`, rebuild.
- **Never edit `data.js` by hand** — the build regenerates it and the tests
  detect a stale copy.
- If the page ever says "Data failed to load," your `data.js` is missing or
  stale: run `npm run build` and reload.

## Credits, license, and honesty

Created by **Asdale Dynamics, LLC** (Dylan Asdale's plain-English AI guides and
free community tools — see dylanasdale.github.io for the rest of the shelf).

License: **MIT** — see [LICENSE](LICENSE). Copyright (c) 2026 Asdale Dynamics, LLC.

This template ships examples, not listings. Example entries are fictional. If
you distribute a filled-in copy, your rows are yours to verify — please do not
let a stranger bookmark a phone number that no longer answers.

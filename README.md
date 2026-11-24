# Tally — money skills, 10 minutes a day

A free, offline-first PWA for learning personal finance with Australian examples. Duolingo-style unit path, ~5-minute lessons that are mostly questions, XP, a forgiving streak and spaced review. No accounts, no backend: progress lives in `localStorage`.

General information only, not financial advice.

## Run it

```bash
npm install
npm run dev        # local dev server
npm run build      # static site in dist/ (host anywhere: GitHub Pages, Netlify, Cloudflare Pages)
npm run preview    # serve the built site on :4173
```

The build uses relative paths (`base: './'`) and hash routes, so `dist/` works from any static host or sub-folder.

## Check everything

```bash
npm run check
```

That runs, in order:

| Step | Command | What it checks |
| --- | --- | --- |
| Lesson validator | `npm run validate` (or `npm run validate -- 1.4`) | Schema, 8-step template order, 12–16 screens, ≥ 9 questions, ≥ 4 question types, ≤ 60 words per text screen, every question has a valid answer and an explanation, numeric answers re-computed from `calc`, fact and glossary references, payslip/ledger arithmetic |
| Type check | `npm run typecheck` | TypeScript, strict |
| Unit tests | `npm test` | Streak (freezes, 24 h repair), Leitner scheduling (1/3/7/16/35/90 days, cap 8, interleaving, sure/guess), unlocks and the 80 % gate, .ics, validator — all with a faked clock |
| Build | `npm run build` | Static output + Workbox service worker + manifest |
| End to end | `npm run e2e` | Playwright at 390×844: onboarding, every Unit 1 lesson, review node, a failed then passed unit check, Unit 2 unlocks, reload persistence, next-day review on a faked clock, offline reload, manifest, axe WCAG 2 AA scans. Screenshots go to `screenshots/` |
| Webapp sweep | `npm run sweep` | Python Playwright (the `webapp-testing` skill) drives every screen of the built app and fails on any console error, page error or failed request |

Resilience and accessibility suites (`tests/e2e/resilience.spec.ts`, `a11y.spec.ts`, `usability.spec.ts`) cover corrupt, older and missing saved data, a full quota, private mode, offline reload mid-lesson, two tabs, keyboard and screen-reader flows. Findings and fixes are logged in `docs/validation-report.md`.

Playwright uses the Chromium at `/opt/pw-browsers/chromium`; set `CHROMIUM_PATH` to use another.

## Adding Units 2–12 (content only)

Units, lessons and their order already live in `content/course.json`. To add a lesson:

1. Create `content/unitN/N.M.json` following the schema in `src/content/schema.ts` (copy a Unit 1 lesson as a template). The app picks it up automatically: no component changes.
2. Steps must run in order: `hook` → `try` → `core` → `example` → `guided` → `independent` → `apply` → `recap`.
3. Add new concept ids to `content/concepts.json` and any `[[terms]]` to `content/glossary.json`.
4. Put yearly-changing figures in `content/facts.json` (with financial year, source URL and how it was verified) and reference them as `{{factKey}}` in text, or with `"fact": "key"` on payslip/ledger rows.
5. Add 3–5 `reviewBank` variants: spaced review asks the concept in a new form.
6. Run `npm run validate -- N.M`, fix, then write the next one.
7. When the unit's 8 lessons are done, add `content/unitN/check.json` (10–14 mixed questions, `passPct: 80`).

Text markup: `**bold**`, `[[glossary term]]` (tap to define), `{{fact}}`. Visual kit: `ledger`, `payslip`, `statement`, `split`, `steps`, `stat`, `compare`, `icon`. Question types: `mcq`, `truefalse`, `numeric`, `slider`, `blank`, `match`, `order`, `sort`, `tap`.

## Facts and sources

`content/facts.json` records each figure's financial year, source and how it was checked. The Financial Claims Scheme figures were read on apra.gov.au. ATO figures come from the ATO-cited table in `docs/curriculum.md`, because ato.gov.au and moneysmart.gov.au block automated access from the build environment. Re-confirm them on the ATO site each 1 July.

## Layout

```
content/            course map, lessons (JSON), facts, glossary, concept labels
src/content/        schema, validation rules, text markup
src/logic/          pure logic: dates, streak, leitner, path/unlocks, xp, ics
src/lib/            store (localStorage), content loader, grading, sound/haptics/confetti
src/screens/        onboarding, home path, session runner, play flow, tabs
src/ui/             design-system components, question types, finance visuals
src/styles/         tokens.css (the only place colours/type/motion are defined), app.css
scripts/            validator, icon and sound generators
tests/unit, tests/e2e
docs/               research the app is built from
```

## Credits

Plus Jakarta Sans and Inter (SIL OFL, self-hosted via Fontsource) · Phosphor Icons (MIT) · canvas-confetti (ISC) · sounds synthesised by `scripts/make-sounds.mjs`, CC0.

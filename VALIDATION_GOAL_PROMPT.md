# Validation goal prompt

Paste everything inside the box below into Claude Code as `/goal <prompt>`, started from this repo's folder. It runs five open-source checking skills over the app (usability, accessibility, real-browser testing, React performance plus saved-data safety, careful fixing), fixes what they find, and logs it all in `docs/validation-report.md`.

The skills are already saved in `.claude/skills/` (sources and licences in its README), so Claude Code finds them automatically: nothing to install. To check, type `/` in Claude Code and look for `nielsen-heuristics-audit`, `accessibility`, `webapp-testing`, `vercel-react-best-practices`, `diagnose` and `verify`.

```text
OUTCOME
Tally (this repo: an offline-first finance-learning PWA, progress in localStorage, no backend) has been put through five validation skills, front end to back end, and every real issue they found is fixed or written down with a reason. A first-time learner on a cheap phone, a keyboard or screen-reader user, and someone whose saved data is old, corrupt or full all get through onboarding, a lesson, review and the unit check without confusion, a dead end or lost progress.

THE FIVE SKILLS (in .claude/skills; invoke each, read its SKILL.md and references)
1. nielsen-heuristics-audit: usability of onboarding, the path, lesson screens, feedback sheet, recap, review.
2. accessibility: WCAG 2.2 AA with keyboard-only and screen-reader passes, focus order, touch targets, reduced motion, light and dark.
3. webapp-testing: drive the built app in Playwright at 390x844 and read console errors on every screen.
4. vercel-react-best-practices: React performance and code quality (bundle size, re-renders, icon imports); skip server and Next.js-only rules. Here "backend" means the data layer, so also check: localStorage read/write and schema versioning, quota and private-mode failures, corrupt or older saved JSON, service worker update and offline behaviour, clock and timezone edges in streak and review, no secrets or tracking in the bundle, safe external links.
5. diagnose, with verify: every fix goes through root cause, a failing test first, then proof.
Run them in that order, one pass each, fixing as you go. Then do a second full pass of all five on the fixed app, because fixes cause new issues.

QUALITY BAR
Boring and bulletproof: nothing a learner does or a browser throws at it loses progress or shows a blank screen. Fix the cause, not the symptom; never delete a test or loosen a check to go green. Keep the design system, copy tone and lesson content as they are unless a finding is about them.

CLOSE THE LOOP
Keep a findings log at docs/validation-report.md: one row per finding with skill, severity (blocker / major / minor), where, evidence, and status (fixed + test name, or won't-fix + reason). Every fixed blocker or major gets a regression test: unit tests with a faked clock and fake storage for data issues, Playwright for flows. After each fix run npm run check (validator, typecheck, unit tests, build, Playwright e2e with axe). Look at the screenshots after UI changes.
Done = docs/validation-report.md holds two full passes of all five skills; the second pass finds no new blocker or major; every blocker and major is fixed with a named regression test; npm run check passes; and Playwright shows that corrupt, missing and older saved data, a full storage quota, and an offline reload mid-lesson each leave the app usable with progress kept where it existed.

WHERE TO LOOK
The store and storage layer, the pure logic (streak, review scheduling, unlocks, dates), the screens and UI kit, the service worker / PWA config, and the existing unit and e2e suites. Research docs in docs/ explain intended behaviour.

SCOPE
Free to add tests, small helpers, ARIA, copy fixes and storage hardening.
Not: new lessons or units, new features (accounts, sync, backend, export/backup, push), deploying or hosting changes, a redesign, swapping frameworks or libraries, paid tools, or changing course content beyond fixing a factual or accessibility error.
```

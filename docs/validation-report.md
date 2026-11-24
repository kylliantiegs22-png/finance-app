# Validation report

Tally was put through five validation skills from `.claude/skills`, in order, front end to back end, fixing as we went, then a second full pass on the fixed app.

1. `nielsen-heuristics-audit`: usability.
2. `accessibility`: WCAG 2.2 AA.
3. `webapp-testing`: drive the built app, read console errors.
4. `vercel-react-best-practices`: React plus the data layer.
5. `diagnose` + `verify`: every fix goes root cause, then a failing test, then proof.

Severity: **blocker** (progress lost, blank screen, or flow impossible) / **major** (key task frustrated, or a WCAG AA failure) / **minor**. Every fixed blocker and major has a named regression test. Unit tests use a faked clock and fake storage; flows use Playwright.

Test files: `tests/unit/*.test.ts` (Vitest) and `tests/e2e/*.spec.ts` (Playwright at 390×844, axe WCAG 2 A/AA).

---

## Pass 1

### 1. Nielsen heuristics (usability)

Scope: onboarding, the path, lesson screens, the feedback sheet, the recap and review, at 390×844, light and dark. Heuristics are H1–H10.

| # | Severity | Heuristic | Where | Evidence | Status |
| --- | --- | --- | --- | --- | --- |
| N1 | blocker | H9 recover from errors | Whole app | Any render error unmounted React and left a **blank white page** with no way out. Seen during the build, when lesson 1.8 crashed on an answer-type mismatch. | **Fixed**: `ErrorBoundary` recovery screen ("Back to my path" / "Reload"), saved data untouched. Test: `resilience.spec.ts › a render error shows a recovery screen, not a blank page, and keeps progress` |
| N2 | major | H2 match real world / H5 | Onboarding › "I know the basics" | Copy said "Skip ahead by passing its check", but the unit check is locked until all 8 lessons are done, so the promise was a dead end. | **Fixed**: copy now "Unit 1 will feel quick: short lessons, mostly questions." Test: `usability.spec.ts › onboarding level choice makes no promise the app cannot keep` |
| N3 | major | H1 visibility | Lesson › feedback sheet | The sheet covered the bottom of long questions (sort/match/order). The marked answers and the match key could not be scrolled into view: the last sort row's bottom sat at y=695 under a sheet starting at y=583. | **Fixed**: the session body is padded by the measured sheet height (ResizeObserver). Test: `usability.spec.ts › feedback sheet never hides the end of a long question` |
| N4 | major | H1 visibility / H9 | Whole app (storage) | Saves that failed (quota full, private mode) were silently swallowed, so a learner believed progress was saved and lost it on reload. | **Fixed**: `StorageBanner` warns (`save-warning`), offers Try again, keeps progress in memory. Tests: `resilience.spec.ts › full storage quota…`, `› storage blocked entirely (private mode)…` |
| N5 | major | H3 user control | Mid-lesson | When a new version activated, the service worker force-reloaded the page and threw away the lesson in progress (workbox-window `autoUpdate` calls `location.reload()` on `activated`). | **Fixed**: `deferredReload` only reloads on a tab screen after onboarding. Test: `updates.test.ts › never reloads in the middle of a lesson, review or check` |
| N6 | minor | H1 / H6 recognition | Lesson footer | "Guessing / I'm sure" were disabled with no reason given (e.g. a match with one pair left). | **Fixed**: the label says what's missing ("Match every pair, then check"). |
| N7 | minor | H6 recognition | Header chips | Flame, snowflake and lightning plus a number were unexplained; a new learner can't tell what "❄ 0" means. | **Fixed**: tapping a chip explains it (streak, freezes, XP), and the streak chip links to the habit grid. |
| N8 | minor | H4 consistency | Onboarding back, daily goal | The back button used a "restart" arrow; the daily goal read "10 min" in onboarding but "Steady · 60 XP" in Profile. | **Fixed**: ArrowLeft icon; both now read "10 min · 60 XP". |
| N9 | minor | H1 visibility | Review tab | After the daily cap of 8, the tab said "Nothing due." while 10 cards waited. | **Fixed**: "You've done today's 8 reviews. N more are saved for tomorrow…" |
| N10 | minor | H2 | Review complete | "8 cards strengthened" shown even when answers were wrong. | **Fixed**: "8 cards reviewed". |
| N11 | minor | H5 error prevention | Onboarding/Profile habit time | Clearing the time field produced an .ics with `NaN` times. | **Fixed**: falls back to 08:00 and the default cue. Test: `content.test.ts › ics reminder input safety` |
| N12 | minor | H3 | Mid-lesson exit or reload | Leaving or reloading restarts the lesson at screen 1. | **Won't fix**: resuming a half-finished lesson is a new feature (out of scope). Lessons are about 5 minutes, leaving asks for confirmation first, and saved progress is never affected (`resilience.spec.ts › offline reload mid-lesson`). |
| N13 | minor | H10 help | App | No help screen. | **Won't fix**: the tap-to-define glossary, chip explanations and About cover it; a help centre would be a new feature. |
| N14 | minor | H7 efficiency | Typed answers | Enter in a number field doesn't check the answer. | **Won't fix**: the learner must choose "Guessing" or "I'm sure"; Enter can't pick one, and the buttons are next in tab order. |

Positives: one primary action per screen, a progress bar throughout, the "why" on every answer, a confirm before leaving a session, no hearts or guilt copy, and the unit-check retry lists the weak lessons.

### 2. Accessibility (WCAG 2.2 AA)

Method: axe-core (WCAG 2.0/2.1/2.2 A and AA tags) on every main screen in light and dark mode. Manual passes: keyboard only (Tab/Shift-Tab/Enter/Space/Escape), the accessibility tree, touch-target measurement, and `prefers-reduced-motion: reduce`. Lighthouse/DevTools MCP isn't available here, so axe plus the manual checks are the evidence, as the skill allows.

| # | Severity | WCAG | Where | Evidence | Status |
| --- | --- | --- | --- | --- | --- |
| A1 | major | 2.4.3 Focus order, 4.1.3 Status | Session: every new screen | After Continue, focus fell to `<body>`, so screen-reader users weren't told about the new question and keyboard users restarted from the top. | **Fixed**: the new screen's `h2` gets focus (`tabIndex=-1`; focus ring only when focus is keyboard-visible). Test: `a11y.spec.ts › keyboard only: a lesson screen can be answered and focus follows each new screen` |
| A2 | major | 2.1.2 / 2.4.3 / 4.1.2 | "Take a break?" dialog | No `aria-modal`, focus stayed on the X behind the scrim, Tab wandered into the page behind, Escape did nothing. | **Fixed**: `useModal` hook moves focus to "Keep going", traps Tab, closes on Escape and returns focus to the opener. Test: `a11y.spec.ts › leave dialog takes focus, closes with Escape and returns focus` |
| A3 | major | 4.1.2 Name, role, value | All answer options, onboarding choices, segmented controls | `role="radio"` buttons with no arrow-key support: screen readers announce "radio, 1 of 3, use arrow keys" and the arrow keys do nothing. | **Fixed**: native buttons with `aria-pressed` inside labelled `role="group"`s. Test: `a11y.spec.ts › options are toggle buttons, not radios without arrow keys` |
| A4 | major | 1.4.1 Use of colour, 1.3.1 | Match questions | Which left item was paired with which right item was shown **only by border colour**; the accessible name gave no pairing. | **Fixed**: a numbered pair badge on both cells, plus visually hidden "matched with …" (and "correct / not correct" after checking). Test: `a11y.spec.ts › match pairs are not shown by colour alone` (includes axe, which caught a 2.5.3 label/name mismatch in the first attempt) |
| A5 | minor | 1.3.1 / 2.4.6 | Home, sessions | No `h1` on Home or in sessions. | **Fixed**: sr-only `h1`s ("Your learning path", the lesson title). Test: `a11y.spec.ts › every screen has one h1 and a descriptive title` |
| A6 | minor | 2.4.2 Page titled | All routes | Same `<title>` on every screen. | **Fixed**: "Learn · Tally", "Review · Tally", "What finance is · Tally" etc. Same test as A5. |
| A7 | minor | 1.4.13 / 2.1.1 | Glossary terms | Definition popover couldn't be dismissed with Escape and wasn't linked to its term. | **Fixed**: Escape/blur closes it; `aria-describedby` links it. |
| A8 | minor | 2.1.1 | Path node card | Escape didn't close it. | **Fixed**: Escape closes and returns focus to the node. |
| A9 | minor | 2.4.3 | Unit-win screen | Focus not moved into the full-screen celebration. | **Fixed**: focus goes to "Back to my path". |
| A10 | minor | 4.1.2 | Slider | Value announced as a raw number ("20800"). | **Fixed**: `aria-valuetext` "$20,800". |
| A11 | minor | 2.5.8 Target size | Header chips | Chips were 40 px tall (passes AA's 24 px, below the design system's 44–48 px). | **Fixed**: 44 px; all visible targets measured ≥ 44×44 except inline glossary words (2.5.8 inline exception). Test: `a11y.spec.ts › touch targets are at least 44×44` |
| A12 | minor | 2.4.1 Bypass blocks | App | No skip link. | **Won't fix**: each screen has a single main region and a heading to jump to; the only repeated block is the 4-item tab bar, which comes after the content. |

Checked and passing: contrast AA on all screens light and dark (axe; `a11y.spec.ts › axe AA on onboarding steps, node card…`, `unit1.spec.ts`). Reduced motion: no looping or long animation and no confetti (`a11y.spec.ts › reduced motion`). Every icon-only button is named, live-region feedback is announced, right/wrong is shown by icon and words, and the storage banners pass axe (`a11y.spec.ts › storage banners pass axe`).

### 3. Webapp testing (built app, Playwright, console)

Method: `scripts/webapp-sweep.py`, run through the skill's `with_server.py` (`npm run sweep`, now part of `npm run check`). It drives the **built** app at 390×844 through every screen: welcome, each onboarding step, the .ics download, all four tabs empty and full, all 8 lessons with one wrong answer each, the unit review, a failed then passed unit check, the unit win, every Profile toggle, 2-minute practice, then an offline reload and a whole lesson offline. It records every console error and warning, page error and failed request, per screen. Separately, every Playwright spec now fails on any console error as well as uncaught page errors (`helpers.ts › failOnErrors`).

| # | Severity | Where | Evidence | Status |
| --- | --- | --- | --- | --- |
| W1 | — (not a bug) | Offline reload | First sweep: `requestfailed icons/logo.svg net::ERR_ABORTED`. Diagnosed: `logo.svg` is in the Workbox precache; with the page settled before going offline, nothing fails and the logo renders from cache (`naturalWidth > 0`). The abort was the sweep reloading while the previous page's image request was still in flight. | **Fixed in the harness**: wait for network idle before reloading, plus a new hard check that the logo renders offline. Final sweep: **0 console errors/warnings, 0 page errors, 0 failed requests** (`test-results/webapp-sweep.log`). |
| W2 | blocker | Lesson 1.8 | Found while building and re-verified here: moving from an mcq to an order question rendered the order view with the previous answer (`a.v.includes is not a function`), producing a blank page. | **Fixed** earlier (answer/feedback state keyed to the screen); covered by `unit1.spec.ts` (all 8 lessons) and the sweep. Blank-page fallback added (N1). |

The blocking console-error findings from this skill were the corrupt-storage crashes (`TypeError: Cannot read properties of null`) that the resilience tests reproduced; they're logged once under skill 4 (R1, R2).

### 4. React best practices + data layer

React rules applied (server and Next.js-only rules skipped): `bundle-barrel-imports`, `bundle-dynamic-imports`, `client-event-listeners`, `client-localstorage-schema`, `rerender-*`, `rendering-hydration-no-flicker`. "Backend" here means the data layer: localStorage, schema, quota/private mode, corrupt and older JSON, the service worker, clock/timezone, secrets and links.

| # | Severity | Rule / area | Where | Evidence | Status |
| --- | --- | --- | --- | --- | --- |
| R1 | blocker | corrupt saved JSON | `store.ts › load()` | `{...base, ...saved}` merged unchecked JSON, so `days: null` made Home read `s.days[d]` on null and **blanked the app**. An unparsable save was silently replaced with fresh state and **overwritten on the first write**. Reproduced: `resilience.spec.ts` "partly corrupt" and "unreadable JSON" failed. | **Fixed**: `persistence.ts › sanitize` validates field by field and keeps every valid field; unreadable, newer or repaired raw text is copied to `tally.backup.<time>` before any write; a notice tells the learner. Tests: `persistence.test.ts › partly corrupt data keeps every valid field…`, `› drops individual bad entries…`, `› unreadable JSON…`; `resilience.spec.ts › partly corrupt data…`, `› unreadable JSON…` |
| R2 | blocker | private mode / blocked storage | `store.ts` module init | `typeof localStorage` runs the getter, which throws `SecurityError` in some private and sandboxed modes, before any try/catch, so the app **never rendered**. Reproduced: `resilience.spec.ts` "storage blocked" failed (onboarding never visible). | **Fixed**: `getStorage()` guards access; the app runs from memory with a warning. Tests: `persistence.test.ts › getStorage returns null when touching localStorage throws`, `› blocked storage…`; `resilience.spec.ts › storage blocked entirely (private mode): app still runs a lesson` |
| R3 | major | quota exceeded | `store.ts › persist()` | `setItem` failures were swallowed: silent loss on reload. | **Fixed**: `saveTo` detects quota errors, frees old backups, prunes day logs older than 120 days (the grid shows 66), retries, and reports failure to the banner. Tests: `persistence.test.ts › on a full quota, frees old backups and prunes…`, `› when storage stays full… leaves the old save intact`; `resilience.spec.ts › full storage quota…` |
| R4 | major | `client-localstorage-schema` | `store.ts` | No schema versioning or migration; older saves (no `v`, missing fields) and newer saves (`v: 2`) were merged blindly. | **Fixed**: `SCHEMA_VERSION`; older data migrates with defaults; newer data loads best-effort and is backed up first. Tests: `persistence.test.ts › migrates older saved data`, `› data from a newer app version…`, `› a lost onboarded flag is restored…`; `resilience.spec.ts › older saved data…` |
| R5 | major | multi-tab | `store.ts` | Two tabs (or the installed app plus a browser tab) each kept a stale copy: the last writer **rolled back** the other tab's finished lesson. Reproduced: `resilience.spec.ts` "two tabs" failed. | **Fixed**: a `storage` event listener adopts the newer saved state. Test: `resilience.spec.ts › two tabs: progress saved in one is not overwritten by the other` |
| R6 | major | service worker update | `main.tsx` | = N5 (reload mid-lesson). Root cause in `vite-plugin-pwa/dist/client/build/register.js`: auto mode calls `window.location.reload()` on `activated`. | **Fixed** via `onNeedReload` plus `deferredReload`. Test: `updates.test.ts` (4 cases) |
| R7 | major | clock edges | `logic/streak.ts › recordSession` | If the device clock moved backwards (flying west, a clock fix), `today < lastDay` fell into the reset branch: **streak reset to 1**. Failing test first: expected 5, received 1. | **Fixed**: any day on or before `lastDay` counts as already done. Tests: `streak.test.ts › clock going backwards… never resets the streak`, `› reconcile ignores a lastDay in the future` |
| R8 | minor | import validation | `store.ts › importProgress` | Imported files were spread into state unchecked (the same crash class as R1). | **Fixed**: goes through `parseSaved`/`sanitize`. |
| R9 | minor | `bundle-barrel-imports` | `ui/Icon.tsx` | Measured: direct per-icon imports give 185.6 KB gzipped vs 184.5 KB through the barrel. Vite's tree-shaking already keeps only the 72 icons used. Phosphor ships 6 weights per icon (~270 KB source). | **Won't fix**: no gain measured; shrinking further means swapping the icon library (out of scope). |
| R10 | minor | `bundle-dynamic-imports` | canvas-confetti | ~24 KB source loaded up front though used only on completion screens. | **Won't fix**: about 6 KB gzipped, and it's precached for offline anyway; an async split would add a loading edge to the celebration. |
| R11 | minor | `rerender-*` | Home, Tabs (`useApp(s => s)`) | Whole-state subscriptions re-render the visible tab on any store change. State is a few KB and only one tab screen is mounted at a time; store changes come from taps, not animation frames. Code review also found no inline component definitions, no derived state in effects, and every listener cleaned up. | **Won't fix**: low cost by inspection (not profiled); narrowing selectors adds complexity without a measured problem. |
| R12 | — | timezone / DST | `logic/dates.ts` | Checked: day keys are local and day maths uses UTC date parts. | **No bug**. Tests added: `dates.test.ts` (Sydney DST start and end, Perth vs Brisbane at midnight, 4 timezones for add/diff/week). |
| R13 | — | secrets, tracking, links | `dist/` | Scanned the built JS/HTML: no analytics, trackers, keys or tokens. The only URLs are lesson source citations (data, never fetched or linked), SVG namespaces and React's error-docs link. No `target=_blank` or `window.open`. | **No bug.** |
| R14 | — | hydration flicker | `index.html` | Theme applied by an inline script before first paint (guarded by try/catch). | **No bug.** |

### 5. Diagnose + verify (how every fix above was made)

Each blocker and major followed the same path: trace to the root cause, write a failing test, fix the cause rather than the symptom, then run the proof command and read its output.

| Finding | Root cause (traced) | Failing test first | Proof after fix |
| --- | --- | --- | --- |
| R1 corrupt data | Unchecked spread of saved JSON in `load()` reaches `s.days[d]` in `Home` | `resilience.spec.ts` partly corrupt: `path` never visible | 9/9 resilience tests pass; `persistence.test.ts` 15/15 |
| R2 private mode | Throwing `localStorage` getter at module init, outside try/catch | `resilience.spec.ts` blocked: onboarding never visible | Passes, including a whole lesson in private mode |
| R3 quota | `persist()` swallowed `QuotaExceededError` | `resilience.spec.ts` quota: no `save-warning` | Passes; earlier progress survives the reload |
| R5 two tabs | No `storage` event handling; each tab writes its own stale state | `resilience.spec.ts` two tabs: lesson rolled back | Passes |
| R6/N5 SW reload | workbox-window `activated` → `location.reload()` | `updates.test.ts` written first; reload policy didn't exist | 4/4 |
| R7 clock back | `diffDays(lastDay, today) === 1` is false when `today < lastDay`, so the else branch resets | `streak.test.ts`: expected 5, received 1 | 12/12 streak tests |
| N1 blank page | No error boundary above `App` | `resilience.spec.ts` render error: `error-screen` missing (the build-time crash showed a blank page) | Passes; progress intact |
| N2 copy | The onboarding string promised a placement skip that doesn't exist | `usability.spec.ts`: "Skip ahead…" found | Passes |
| N3 sheet overlap | Fixed sheet, no matching padding on the scroll container | `usability.spec.ts`: row bottom 695 > sheet top 583 | Passes |
| A1–A4 | Focus never moved / no modal semantics / ARIA radio role without arrow keys / colour-only pairing | `a11y.spec.ts`: 5 of 9 failed first | 9/9 pass |

Verify gate: `npm run check` (validator, typecheck, Vitest, build, Playwright e2e with axe, webapp sweep). Results are recorded at the end of this report.

---

## Pass 2 (all five skills again, on the fixed app)

Pass 2 looked specifically for problems introduced by the pass 1 fixes: new banners, focus moves, dialogs, storage paths, update policy. **It found no new blocker or major.** All findings were minor and are fixed below.

### 1. Nielsen heuristics, pass 2

Walked onboarding → path → lesson (every question type) → feedback → recap → review → unit check → unit win again, plus the new states: save warning, storage notice, error screen, chip help.

| # | Severity | Heuristic | Where | Evidence | Status |
| --- | --- | --- | --- | --- | --- |
| P2-N1 | minor | H3 user control | Save warning inside a lesson | The fixed banner (top 8 px) sat over the lesson's **Close** button (8–56 px) until hidden. "Hide" was local state, so it came back at the start of every lesson. Not blocking (Hide is one tap away). | **Fixed**: the banner sits below the session header (`.banner-session`, top 64 px), and Hide is global (`health.warningHidden`), returning only if the failure reason changes. Test: `resilience.spec.ts › full storage quota…` (hit-tests Close and checks Hide sticks). Proven to fail with the offset removed ("Received: undefined"). |
| P2-N2 | minor | H8 aesthetics | Banner entrance | Diagnosing why the P2-N1 test passed without the fix: the `pop-in` keyframe's `transform: scale()` **overrode** the banner's `translateX(-50%)`, so it slid in about 180 px off-centre for 250 ms. | **Fixed**: a dedicated `banner-in` keyframe keeps the centring; the test waits for the entrance before hit-testing. |
| P2-N3 | minor | H3 | Chip help popover | It could only be closed by tapping the same chip again. | **Fixed**: Escape or a tap outside closes it. Test: `a11y.spec.ts › axe AA on onboarding steps…` (Escape and outside-tap assertions) |

Re-checked and fine: the new copy ("Match every pair, then check", the banner texts and the error screen) is plain and in the app's tone, with no guilt language; the error screen gives two clear exits; the notices are dismissible.

### 2. Accessibility, pass 2

| # | Severity | WCAG | Where | Evidence | Status |
| --- | --- | --- | --- | --- | --- |
| P2-A1 | minor | 2.5.8 | Banner buttons | "OK" could be narrower than 44 px. | **Fixed**: `min-width: 44px`. |
| P2-A2 | — | 2.4.7 | Heading focus after a tap | Checked that the A1 fix doesn't paint a focus ring after a finger tap: the active element is the `H2`, `:focus-visible` = false. | **No bug** (probe output in the pass-2 log). |

Newly covered by axe (WCAG 2.0/2.1/2.2 A/AA): save warning in a session, error screen, leave dialog, chip help (light), lesson (dark), storage notice: **0 violations**. Keyboard: chip help and the node card close with Escape; the leave dialog traps focus and returns it.

### 3. Webapp testing, pass 2

Full sweep re-run on the fixed build, plus the new resilience flows, now with console-error failure on in every spec: **0 console errors, 0 warnings, 0 page errors, 0 failed requests** across every screen. Probe: a real save produced by onboarding plus a lesson reloads with **no** repair notice and **no** backup copy (also asserted after the full unit in `unit1.spec.ts`). No findings.

### 4. React best practices + data layer, pass 2

| # | Severity | Rule / area | Where | Evidence | Status |
| --- | --- | --- | --- | --- | --- |
| P2-R1 | minor | rendering purity | `App.tsx`, `Play.tsx` | The A6 fix set `document.title` **during render** (a side effect in render). | **Fixed**: moved into `useEffect`. Test: `a11y.spec.ts › every screen has one h1 and a descriptive title` |
| P2-R2 | minor | storage growth | `persistence.ts › backup` | Each repaired or unreadable load adds a backup key, with no upper bound. | **Fixed**: at most 3 backups, oldest removed. Test: `persistence.test.ts › keeps at most 3 backups, removing the oldest` |

Re-reviewed the new code: the `useModal` deps are stable (`useCallback`); every new listener (chip help, storage, hashchange, visibility) is added once and removed; the ResizeObserver is disconnected; the health store is separate from the app store, so banners don't re-render screens. A store `storage` event during an open session merges correctly, because the session commits through `setState(fn)` on the current state.

### 5. Diagnose + verify, pass 2

| Finding | Root cause | Failing first | Proof |
| --- | --- | --- | --- |
| P2-N1 banner over Close | The banner was fixed at top 8 px in every route | The new hit-test assertion, run with the offset removed: `Expected "Close", Received undefined` | Passes with the fix |
| P2-N2 test false-pass | The keyframe `transform` replaced `translateX(-50%)` during the entrance | Found by tracing why the assertion passed without the fix (banner box measured at x=195 during animation vs x=12 settled) | Dedicated keyframe; assertion now discriminates |
| Two test-harness errors (reload while on a non-Learn tab; reload aborting an in-flight image) | Test navigation, not the app | — | Tests corrected; the checks were made stricter, never looser |

---

## Final verification

`npm run check` (validator → typecheck → Vitest → build → Playwright e2e with axe → webapp sweep), final run:

- Lesson validator: **8 lessons + unit check valid**
- Typecheck: **clean**
- Vitest: **8 files, 63 tests passed** (streak, Leitner, unlocks, dates/DST, persistence with fake storage and a faked clock, update policy, validator, text/ics)
- Playwright: **22 passed**: `unit1.spec.ts` (whole unit, unlock, reload, offline, axe), `lesson.spec.ts`, `resilience.spec.ts` (9), `a11y.spec.ts` (9), `usability.spec.ts` (2)
- Webapp sweep: **0 problems**

Data-safety outcomes shown by Playwright (`resilience.spec.ts`):

| Situation | Result |
| --- | --- |
| Missing data | Onboarding, no errors |
| Unreadable (corrupt) JSON | Starts fresh, says so, raw copy kept in `tally.backup.*` |
| Partly corrupt JSON | App loads; XP, finished lessons and unlocks kept |
| Older saved data (no version) | Migrates; progress kept; next write upgrades it |
| Full storage quota | Lesson completes, learner warned, progress kept in memory, **earlier saved progress survives reload** |
| Storage blocked (private mode) | Whole onboarding and lesson work from memory, with a warning |
| Offline reload mid-lesson | Lesson reopens from cache; saved progress unchanged |
| Two tabs | Neither rolls back the other |
| Render error | Recovery screen, back to the path, progress intact |

Every blocker and major from pass 1 is fixed with a named regression test (above). Pass 2 found no new blocker or major.

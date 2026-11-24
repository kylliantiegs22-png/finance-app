# Persona playtest goal prompt

Paste everything inside the box below into Claude Code as `/goal <prompt>`, started from this repo's folder. Claude Code plays through the app as five learners (Emma 16, Jake 20, Olivia 24, Liam 28, Sarah 35), scores it on `docs/review-scorecard.md`, fixes what they find, and replays until every persona scores at least 80 out of 100 and at least 16 out of 20 for educational value. Each round is logged in `docs/persona-review.md`.

It uses the skills already saved in `.claude/skills/` (`webapp-testing`, `diagnose`, `verify`), so there is nothing to install.

```text
OUTCOME
Tally (this repo: an offline-first Australian finance-learning PWA, progress in localStorage, no backend) has been played end to end by five real-feeling learners: Emma 16, Jake 20, Olivia 24, Liam 28 and Sarah 35, described in docs/review-scorecard.md. Each one finishes the course as it stands knowing how to use it in their own life this week, wants to come back tomorrow, and hits no bug, dead end or confusing screen on the way.

HOW EACH PLAYTEST WORKS
Use the webapp-testing skill to drive the built app in Playwright at 390x844, from cleared storage, as that persona: their habit-plan choices, their reading level, their mistakes. Play onboarding, every lesson, review, a failed then passed unit check, reload, an offline reload and next-day return on a faked clock. Read every screen's text and the console. Then the persona writes a short real-life plan with their own numbers (budget, savings goal, emergency fund) using only what the app taught, and scores the app on the scorecard with strengths, weaknesses, recommendations and evidence (screenshot or quote) for each category.

QUALITY BAR
Learning comes first: a lesson that is fun but leaves Sarah unable to size her emergency fund or Jake unable to budget his rent has failed. Score like a hard but fair reviewer who paid for this, not like its author: every point needs evidence, and any score at 85 or above must still list a weakness. Fix causes, not scores; never delete a test or loosen a check to go green. Keep the design system and tone; content edits must stay accurate and pass the lesson validator.

CLOSE THE LOOP
Log each round in docs/persona-review.md: a table of the five personas by nine categories plus total and rating band, then each persona's feedback, real-life plan and findings (severity blocker / major / minor, status fixed + test name or won't-fix + reason). After a round, fix the findings, highest severity and most personas first, using the diagnose and verify skills. Every fixed blocker or major gets a regression test. Run npm run check after each fix and look at the screenshots after UI changes. Then run a fresh full round from cleared storage and re-score from what you see, not from what you changed.
Done = the latest round in docs/persona-review.md was played from cleared storage after the last code change, every persona scores 80 or more overall and 16 or more of 20 on educational value, each persona's real-life plan is complete and correct, no blocker or major is open, and npm run check passes.

WHERE TO LOOK
The lesson content and its validator, the screens and UI kit, onboarding and the habit plan, review and the unit check, the store and pure logic, and the e2e suite. docs/curriculum.md says what each lesson must teach; the other research docs explain intended engagement and design.

SCOPE
Free to rewrite examples, hooks, real-world apply screens and explanations so each persona sees their own life (pocket money, uni rent, a nurse's payslip, a home deposit, a household budget), add clearer feedback, fix bugs and add tests.
Not: new units or lessons, accounts, sync or a backend, leaderboards or lives, a redesign, new libraries, deploying, or marking the app down for topics that belong to later units. Put those under Recommendations.
```

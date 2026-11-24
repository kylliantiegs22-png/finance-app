OUTCOME
An installable, offline-first PWA ($0: free static hosting, progress in localStorage, no backend) that works like Duolingo for personal finance, for an Australian learner doing ~10 min a day. Opening it shows a unit path; tapping the next node runs a ~5-min lesson of short, question-heavy screens; finishing it updates XP and streak and unlocks the next node. Unit 1 "Money foundations" (its 8 lessons as listed in docs/curriculum.md, + review node + unit check) is fully written and playable, and the content pipeline makes adding Units 2-12 a pure content job.

REFERENCE
docs/ holds the full research: curriculum, design system, learning research, engagement and UX ideas. Follow it where this prompt is silent; where they disagree, this prompt wins.

QUALITY BAR
Feels like a funded fintech shipped it, not a tutorial project: every screen from one design system, nothing default-browser. Lessons teach like a sharp friend with worked AU examples, never a wall of text.
- Palette and gradients exactly as in the design-system doc: indigo #4F46E5 primary, violet #7C3AED, emerald #10B981 correct, rose #E11D48 wrong, gold/orange for rewards and streak only, real dark mode. Never green-primary. Text meets WCAG AA.
- Plus Jakarta Sans headings/numbers, Inter body (self-hosted), Phosphor icons (duotone for badges).
- One motion system: 150/250/400 ms + one spring; transform/opacity only; honour prefers-reduced-motion.
- Answer feedback as bottom sheet: emerald tick, or rose + gentle shake + one-line "why". 5-6 short CC0 sounds with a mute toggle. Celebrations in three sizes: tick pop, brand confetti on lesson end, full-screen win on unit end. Lesson ends on a recap screen with stats counting up.

LESSONS (the hard part)
Each lesson is a JSON data file, never hard-coded in components. Fixed 8-step template: hook, try it, core idea, worked example, guided practice, independent practice, real-world apply, recap. 12-16 screens, >=9 questions (mixed types, per the learning research), <=60 words per text screen. Write one lesson at a time and validate it before the next. Australian context (ATO, super, AUD); any yearly-changing figure lives in one data file tagged with financial year and source. Check facts against the trusted sources in the curriculum doc; no invented figures.

PROGRESS & HABIT
Unit path with locked/current/done nodes; unit check needs 80% to unlock the next unit. XP, daily goal, streak with up to 2 earned freezes and a 24h repair; a 2-minute review session counts for the day. Leitner review (1/3/7/16/35/90 days, max 8 a day, interleaved) and each answer has a "sure / guess" tap; confident misses return sooner. Onboarding asks for a habit plan ("After ___, I do my lesson") and offers a downloadable repeating .ics reminder.

CLOSE THE LOOP
Every iteration: run the lesson validator (schema, screen and word limits, question count, every question has a correct answer and an explanation), the type check, and unit tests for streak, unlock and review-scheduling logic (fake the clock). Then build, serve, and drive it with Playwright at a 390x844 mobile viewport: complete a lesson end to end, check XP/streak/unlock changed and persist after reload, and save screenshots of path, question, feedback, recap and dark mode. Look at the screenshots; fix anything unpolished. Manifest + service worker must make it installable and offline; axe finds no AA contrast failures.
Done = all Unit 1 lessons pass the validator, all tests pass, and a scripted Playwright run completes every Unit 1 lesson plus the unit check, sees Unit 2 unlock, survives a reload, and the screenshots match the quality bar.

SCOPE
Free to choose the framework, folder layout, quiz-type components and animation/sound libraries, as long as everything is free and the build output is static.
Not: Units 2-12 content, accounts, a backend, sync, web push, leaderboards, hearts/lives or guilt copy, paid assets, a native app wrapper, an admin CMS.

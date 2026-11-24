# How Adults Learn Best: Design Principles for a Daily Finance App

Nov 23, 2026 · @Kyllian

## Summary

The best 10-minute daily session is mostly answering questions, not reading: a short new idea taught through a problem, then a lot of spaced recall of earlier ideas. The ten rules a curriculum and build step should follow:

1. **Test, don't tell.** At least 60% of each session is the learner retrieving answers. Recall beats re-reading for long-term retention.
2. **Space everything.** Every concept comes back at growing gaps (1, 3, 7, 16, 35 days), and the gap stretches when it is answered well.
3. **Mix old with new.** Reviews shuffle concepts from different units so the learner must pick the right tool, not just repeat the last one.
4. **One idea per lesson.** Each lesson teaches a single concept in about 5 minutes; two lessons or one lesson plus review fill the 10-minute day.
5. **Problem before explanation.** Open with a question the learner can attempt, then explain. Follow with a worked example before asking them to solve alone.
6. **Fade the help.** Early questions are multiple choice with hints; later ones are typed numbers, no hints, in new contexts.
7. **Instant, specific feedback.** Every answer gets a one-line reason why it is right or wrong.
8. **Tie it to real money decisions.** Adults learn finance best when it maps to a choice they face now (a payslip, a loan, a savings account). Each lesson ends with one action or reflection about the learner's own money.
9. **Streaks with slack.** Reward showing up daily, offer streak freezes, and never punish a missed day harshly. Avoid leaderboards that rank you against others.
10. **Progress must mean mastery.** Units unlock by passing a short check, and the skill map shows what is mastered, fading, or locked.

The template in section 5 and the review rules in section 6 turn these into something the build can implement directly.

## Core learning science

Five findings carry most of the weight, and all are backed by decades of controlled studies. The table gives each one and what it means for the app.

| Finding | Evidence | What the app does |
| --- | --- | --- |
| **Retrieval practice** (the testing effect) | Students who were tested on a passage remembered more a week later than students who re-read it, even though re-readers felt more confident ([Roediger & Karpicke 2006](https://pubmed.ncbi.nlm.nih.gov/16507066/)). Rated one of only two "high utility" techniques in a review of ten study methods ([Dunlosky et al. 2013](https://www.psychologicalscience.org/journals/pspi/1529100612453266/)). | Most screens are questions. Explanations are short and always followed by a check. |
| **Spacing** (distributed practice) | The other "high utility" technique (Dunlosky). The best gap between reviews grows with how long you want to remember: roughly 10 to 20% of the retention period ([Cepeda et al. 2008](https://pubmed.ncbi.nlm.nih.gov/19076480/)). | A per-concept review schedule with expanding gaps (section 6). |
| **Interleaving** | Mixing problem types in practice led to about three times higher scores a week later (63% vs 20%) than blocking them by type, because learners had to choose the method ([Rohrer & Taylor 2007](https://digitalcommons.usf.edu/psy_facpub/1767/)). | Review sessions shuffle concepts across units. New lessons stay focused on one idea. |
| **Worked examples and cognitive load** | Novices learn more from studying a solved example than from solving cold, because working memory holds only a few new items at once. The benefit reverses as expertise grows (the expertise reversal effect, [Kalyuga 2007](https://link.springer.com/article/10.1007%2Fs10648-007-9054-3)). | One concept per lesson, a worked example before practice, then fade to independent problems. Skip examples for concepts already mastered. |
| **Immediate, explanatory feedback** | Feedback that says why an answer is right or wrong helps more than right/wrong alone, especially for novices. Brilliant gives feedback "while reasoning is still fresh" ([Brilliant](https://brilliant.org/resources/choosing-brilliant/how-brilliant-teaches-math/)). | Every answer shows a one-line explanation. Wrong answers re-queue the item later in the same session. |

### What is different about adult learners

Adults learn best when the material is relevant to a problem they have right now, when they control the pace, and when it builds on experience they already have. For finance this matters a lot. A meta-analysis of 126 studies found financial education raises knowledge modestly (effect size 0.26) but behaviour only slightly (0.09). The biggest boosts came from teaching at a "teachable moment", tied to a decision the learner faces, and from higher intensity. Mandatory courses did worse ([Kaiser & Menkhoff 2017](https://documents1.worldbank.org/curated/en/874701565806952356/pdf/Does-Financial-Education-Impact-Financial-Literacy-and-Financial-Behavior-and-If-So-When.pdf)).

So each lesson should use realistic numbers (a salary, a rent, a credit card APR), and end with a prompt that applies it to the learner's own finances. Saving and budgeting topics showed the largest behaviour change, which makes them a good place to start the curriculum.

## Motivation, gamification and habits

Game mechanics help learning a little, and they help most when they reward real practice rather than replace it. A meta-analysis found small positive effects on learning (g = 0.49), motivation (0.36) and behaviour (0.25), but only the learning effect held up in the most rigorous studies ([Sailer & Homner 2020](https://link.springer.com/article/10.1007/s10648-019-09498-w)). Story and avatars added nothing to learning. Competition worked best when mixed with collaboration, not alone.

| Mechanic | Verdict | Why, and how to build it |
| --- | --- | --- |
| **Daily streak** | Use | Duolingo reports learners who reach a 7-day streak are 3.6 times more likely to finish a course (a correlation, not proof) ([Duolingo](https://blog.duolingo.com/how-duolingo-streak-builds-habit)). Make day 7 the first big celebration. |
| **Streak freeze** | Use | Allowing up to two freezes raised daily active learners, and research suggests some slack motivates more than rigid rules (same source). Earn freezes with XP; hold up to 2. |
| **XP and daily goal** | Use, carefully | Give XP for correct answers and finished reviews, not for screens tapped. A daily goal of 10 minutes or 50 XP matches the user's aim. |
| **Levels and unlocks** | Use | Unlocking the next unit by passing a check makes progress mean mastery. Show a visible path with locked, current and done nodes. |
| **Badges** | Light touch | Use for real milestones (first 30-day streak, unit mastered). Mandatory badges plus a leaderboard lowered intrinsic motivation and grades in one classroom study ([Hanus & Fox 2015, summary](https://www.smhp.psych.ucla.edu/pdfdocs/gamil.pdf)). |
| **Leaderboards** | Skip | This is a solo app, and ranking discourages people near the bottom (same source). Compare the learner to their own past week instead. |
| **Hearts or lives** | Skip | Penalising mistakes discourages the attempts that retrieval practice depends on. Wrong answers should cost nothing but a retry. |
| **Guilt notifications** | Skip | One friendly reminder at the chosen time is enough. Use a browser or PWA notification, which costs nothing. |

### Making the 10 minutes a habit

In a UCL study it took an average of 66 days for a daily behaviour to feel automatic, and missing a single day did not significantly harm the habit ([Lally et al.](https://www.ucl.ac.uk/news/2009/aug/how-long-does-it-take-form-habit)). What mattered was doing a specific action in a specific situation.

- At onboarding, ask the learner to pick a cue and a time ("after morning coffee, 8:00").
- Show a 66-day habit tracker alongside the streak, so a missed day reads as a blip, not a reset.
- Make the first minute effortless: the session starts straight into a question, no menus.
- End every session on a success, so the next day starts with a good memory.

## Lesson length and how leading apps structure content

A 10-minute day works best as two short blocks, not one long lesson. Attention and working memory favour chunks of about 5 minutes, and leading apps break content the same way: many small steps, each ending in an interaction.

**Duolingo's mechanics (no branding copied).** A course is a path of units. Each unit has a handful of lessons of roughly 10 to 15 questions and a few minutes each, a review node, and a checkpoint that gates the next unit. A per-item memory model predicts how likely you are to recall each word and schedules practice for the ones you are about to forget ([Settles & Meeder 2016](https://aclanthology.org/P16-1174/)). Daily motivation comes from streaks, an XP goal and celebrations.

**Brilliant's mechanics.** Lessons are "carefully sequenced", and each step is "a manageable idea". It "often asks a question before presenting a procedure", so the first attempt sets up the explanation. Practice removes support and moves to new contexts, a skill check closes each lesson, and unit checks pull in earlier material ([Brilliant](https://brilliant.org/resources/choosing-brilliant/how-brilliant-teaches-math/)).

**What to take for a finance app:**

- Duolingo's structure: path, units, short lessons, review nodes, checkpoints, streaks, per-concept memory.
- Brilliant's teaching: problem first, worked example, faded support, a check at the end.
- Neither app teaches with long text. A "long lesson" is really many short interactive steps, which is also the fix for AI-written content (section 7).

**A suggested 10-minute day:**

| Block | Minutes | Content |
| --- | --- | --- |
| Warm-up review | 2 to 3 | 5 to 6 due review cards, mixed across units |
| New lesson | 5 | One concept, using the template in section 5 |
| Second lesson or extra review | 2 to 3 | Optional: continue the path, or clear more due cards |

Once the review backlog grows (after about three weeks), the warm-up takes more of the session. Cap new lessons at 2 a day so reviews never pile up.

## Recommended lesson template

Every lesson is about 5 minutes and 12 to 16 screens, built from the same eight steps. At least 9 screens are questions. No text screen runs over 60 words.

1. **Hook (1 screen, 15 s).** A real-life money question the learner can guess at. Example: "You get a 5% raise but inflation is 6%. Are you richer?"
2. **Try it (1 to 2 screens, 30 s).** The learner commits to an answer before being taught. Being wrong is fine and expected.
3. **Core idea (1 to 2 screens, 45 s).** The one concept in plain words, with a single visual or formula. Max 60 words per screen.
4. **Worked example (1 to 2 screens, 45 s).** A step-by-step solved problem with realistic numbers.
5. **Guided practice (3 to 4 screens, 90 s).** Questions with hints available, moving from recognition (multiple choice) to calculation.
6. **Independent practice (2 to 3 screens, 60 s).** No hints, a new context, at least one typed answer. One question mixes in a concept from an earlier lesson.
7. **Real-world apply (1 screen, 20 s).** A short reflection or action on the learner's own money ("Check your last payslip: what is your marginal tax rate?"). Not graded.
8. **Recap and reward (1 screen, 15 s).** Three-bullet summary, XP earned, streak update. Concepts from this lesson enter the review queue.

### Question types

| Type | Best for | Stage |
| --- | --- | --- |
| Multiple choice (3 to 4 options) | Recognising terms and concepts; distractors use common misconceptions | Try it, guided |
| True or false with "why" | Busting myths ("paying off a 3% loan beats investing") | Try it, review |
| Numeric entry | Calculations: interest, percentages, tax, returns | Guided, independent |
| Fill the blank | Definitions and key formulas | Guided, review |
| Match pairs | Terms to definitions, accounts to their features | Guided, review |
| Order the steps | Processes: budgeting method, paying down debt | Guided |
| Scenario choice | Judgement: which option is better and why | Independent, unit check |
| Slider estimate | Building intuition ("what will $100 be worth in 30 years at 7%?") | Hook, try it |
| Spot the mistake | Finding the error in a worked calculation | Independent |

Each question stores: the concept it tests, the correct answer, a one-line explanation for right and for each wrong option, an optional hint, and a difficulty level. This structure lets one review system work across every lesson.

## Review cadence and progression

Each concept gets its own review schedule, kept in the browser's local storage so it costs nothing to run. A simple Leitner-style ladder is enough to start; a fitted memory model like Duolingo's can come later.

| Box | Next review after | Move up when | Move down when |
| --- | --- | --- | --- |
| 1 (just learned) | 1 day | Answered right | Stays in box 1 |
| 2 | 3 days | Right | Back to box 1 |
| 3 | 7 days | Right | Back to box 1 |
| 4 | 16 days | Right | Back to box 2 |
| 5 | 35 days | Right | Back to box 2 |
| 6 (mastered) | 90 days | Stays | Back to box 3 |

- A wrong answer during a lesson re-queues that question 3 to 5 screens later in the same session.
- Review sessions pull the most overdue cards first, at most 8 per day, mixed across units (interleaving).
- Reviews ask the concept in a different form from the lesson (a new number, a new scenario), so the learner recalls the idea, not the answer.

### Progression and unlocks

- **Path:** units in a fixed order; each unit has 5 to 6 lessons, one review node and a unit check.
- **Unit check:** 10 to 12 mixed questions including earlier units. Passing at 80% unlocks the next unit; failing sends the learner back to the weak lessons only.
- **Skill strength:** each concept shows as strong, fading (review due) or weak, so the map itself nudges review.
- **Sizing:** the curriculum plan has 12 units of 8 lessons (96 lessons), about 3 months at 1 to 2 lessons a day. The first 5 to 6 units take about 66 days, so the habit forms during the personal finance units.
- **Reward loop:** XP per correct answer, a daily goal, streak with up to 2 freezes, and milestone celebrations at 3, 7, 30, 66 and 100 days.

## Solving the long-lesson problem for AI-written content

The fix is to stop asking for long lessons and instead generate many small, structured pieces that add up to a lot of content. AI writes short, well-specified chunks reliably; it drifts and thins out on long free-form text.

1. **Store lessons as data, not prose.** Each lesson is a JSON file following the eight-step template, with typed question objects. The app renders them; nothing is written as one long page.
2. **Generate one lesson per prompt.** Give the AI the template, the concept, the unit's earlier concepts (for the mixed-in question) and a target of 12 to 16 screens. A whole course is then 60 small, consistent jobs.
3. **Plan the curriculum first.** A concept map (unit, lessons, the one idea each lesson teaches, prerequisites) is written before any lesson. This keeps lessons from overlapping or skipping steps.
4. **Make the review bank do the heavy lifting.** Generate 3 to 5 extra question variants per concept for reviews. Volume of practice, not length of explanation, is what builds memory.
5. **Check with code.** A validation script confirms every lesson has the right step count, at least 9 questions, text under 60 words per screen, an explanation for every option, and correct maths for numeric answers.
6. **Check facts by hand where it matters.** Tax rules, account limits and rates change by country and year. Keep these in a separate, dated facts file the lessons reference, so updates touch one place.

Lessons use Australian rules (ATO tax, super, ASX), matching the curriculum plan, with tax and super figures kept in one data file.

## Sources

- Roediger & Karpicke (2006), [Test-enhanced learning](https://pubmed.ncbi.nlm.nih.gov/16507066/), Psychological Science.
- Dunlosky et al. (2013), [Improving students' learning with effective learning techniques](https://www.psychologicalscience.org/journals/pspi/1529100612453266/), Psychological Science in the Public Interest.
- Cepeda et al. (2008), [Spacing effects in learning: a temporal ridgeline of optimal retention](https://pubmed.ncbi.nlm.nih.gov/19076480/), Psychological Science.
- Rohrer & Taylor (2007), [The shuffling of mathematics practice problems boosts learning](https://digitalcommons.usf.edu/psy_facpub/1767/), Instructional Science.
- Kalyuga (2007), [Expertise reversal effect and its implications for learner-tailored instruction](https://link.springer.com/article/10.1007%2Fs10648-007-9054-3), Educational Psychology Review.
- Kaiser & Menkhoff (2017), [Does financial education impact financial literacy and financial behavior, and if so, when?](https://documents1.worldbank.org/curated/en/874701565806952356/pdf/Does-Financial-Education-Impact-Financial-Literacy-and-Financial-Behavior-and-If-So-When.pdf), World Bank Economic Review.
- Sailer & Homner (2020), [The gamification of learning: a meta-analysis](https://link.springer.com/article/10.1007/s10648-019-09498-w), Educational Psychology Review.
- Hanus & Fox (2015), Assessing the effects of gamification in the classroom, Computers & Education, via [UCLA summary](https://www.smhp.psych.ucla.edu/pdfdocs/gamil.pdf).
- Lally et al. (2010), How are habits formed, via [UCL news](https://www.ucl.ac.uk/news/2009/aug/how-long-does-it-take-form-habit).
- Settles & Meeder (2016), [A trainable spaced repetition model for language learning](https://aclanthology.org/P16-1174/), ACL.
- Duolingo, [How the streak builds habit](https://blog.duolingo.com/how-duolingo-streak-builds-habit).
- Brilliant, [How Brilliant teaches math](https://brilliant.org/resources/choosing-brilliant/how-brilliant-teaches-math/).

Duolingo and Brilliant pages are company sources and partly marketing; their figures are correlations, not controlled studies.

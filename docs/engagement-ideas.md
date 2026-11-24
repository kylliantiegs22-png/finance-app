# 20 research-backed engagement ideas

Nov 24, 2026 · @Kyllian

## Top 5 to build first

Build a fixed daily cue, a reminder that works without a server, a streak that forgives, real-money missions, and confidence ratings. Together they cover the three things that decide whether a solo app sticks: you remember to open it, missing a day doesn't make you quit, and the learning changes what you do with your money. All five run on the device with local storage, so they cost $0.

| Rank | Idea | Why it made the cut | Effort |
| --- | --- | --- | --- |
| 1 | #1 Habit anchor and if-then plan at setup | Strongest evidence on this list: if-then plans had a medium-to-large effect (d = 0.65) across 94 studies. Costs one onboarding screen. | Small |
| 2 | #2 Calendar reminder file (.ics) | A cue only works if it fires. iPhone web push needs a push server; a repeating calendar event needs nothing and fires every day. | Small |
| 3 | #3 Forgiving streak with repair and a 2-minute rescue | A broken streak makes people far more likely to stop. Freezes, a repair window and a tiny rescue session keep one bad day from ending the habit. | Medium |
| 4 | #10 Weekly money mission | Financial education fades fast unless it is tied to a real decision. A mission turns a lesson into action, which is your actual goal. | Small |
| 5 | #8 Confidence rating on each answer | Confidently wrong answers are corrected best when flagged. It also sharpens the review schedule at no extra cost. | Small |

The other 15 are worth adding later. Fresh-start resets (#4), goal-gradient progress bars (#5) and the pre-lesson hook question (#7) are the next three to pick up.

## The 20 ideas

Each idea gives the feature, the research behind it, and how to build it with no backend. Evidence is rated Strong (meta-analysis or large field trial), Moderate (several solid studies) or Emerging (promising but thin or mixed).

### Getting you to open the app every day

**1. Habit anchor and if-then plan at setup.** At onboarding, you pick an existing routine and complete a sentence: "After I pour my morning coffee, I will do my finance lesson." Optional: pair it with something you enjoy, like a lesson only with that coffee.

- Research: If-then plans ("implementation intentions") had d = 0.65 on goal attainment across 94 studies (Gollwitzer & Sheeran, 2006). Anchoring a new habit to a stable cue is how habits become automatic (Wood & Neal, 2007; Fogg, 2019). Pairing a task with a treat raised gym visits by up to 51% at first (Milkman et al., 2014). Strong.
- Build: One onboarding screen; store the sentence and show it on the home screen.

**2. Calendar reminder file.** After setup, a button downloads a repeating .ics calendar event at your chosen time, titled with your if-then sentence.

- Research: Timely reminders raised savings goal completion (Karlan et al., 2016). Reminders sent at a consistent, chosen time beat random times in mobile health trials (Bidargaddi et al., 2018). Strong.
- Build: Generate the .ics text in the browser. Web push on iPhone needs a push server and a home-screen install, so the calendar file is the $0 route that always fires.

**3. Forgiving streak: freezes, repair and a 2-minute rescue.** Earn a streak freeze every 7 days (hold up to 2). If you miss a day, a 24-hour "repair" window lets you restore it with a double session. On busy days, a 2-minute rescue (5 review cards) counts.

- Research: Breaking a streak sharply lowers later engagement, and people often quit after a break (Silverman & Barasch, 2023). In a 61,000-person megastudy, rewarding a return after a missed day was among the most effective nudges (Milkman et al., 2021). Tiny versions of a habit keep it alive on hard days (Fogg, 2019). Strong.
- Build: Streak logic in local storage; no server.

**4. Fresh-start resets.** On Mondays, the 1st of the month, your birthday and 1 July (new financial year), show a "new chapter" screen that sets a small goal for the period.

- Research: People are more likely to start goals after temporal landmarks like these (Dai, Milkman & Riis, 2014). Moderate.
- Build: A date check on app open. 1 July ties neatly to the tax unit.

**5. Goal-gradient progress bars.** Show progress toward the next unit, freeze and milestone, and start each bar with a little credit (e.g. the placement check counts as step 1).

- Research: People speed up as they near a goal (Kivetz, Urminsky & Zheng, 2006). Giving a head start on a loyalty card raised completion from 19% to 34% (Nunes & Drèze, 2006). Strong.
- Build: UI only.

**6. One-tap start.** Opening the app goes straight into today's session with a single big button. No menus to choose from.

- Research: Small friction cuts follow-through sharply; defaults and ease drive behaviour (Thaler & Sunstein, 2008; Fogg, 2019). Moderate.
- Build: Home screen design.

### Making each session stick

**7. Pre-lesson hook question.** Each lesson opens with one question you probably can't answer yet, e.g. "Is it better to pay off a 20% credit card or invest at 8%?"

- Research: Attempting a question before learning improves later recall, even when you get it wrong (Richland, Kornell & Kao, 2009). Struggling first then being taught helps understanding (Kapur, 2014). Strong.
- Build: A field in the lesson JSON.

**8. Confidence rating on each answer.** After answering, tap "sure" or "guess". A confident wrong answer gets extra explanation and comes back sooner in review.

- Research: High-confidence errors are corrected more readily than low-confidence ones, the "hypercorrection effect" (Butler, Fazio & Marsh, 2011; Metcalfe, 2017). Strong.
- Build: Two buttons; feed the rating into the Leitner box choice.

**9. "Why" feedback on every answer.** Wrong answers show a one-line reason and the right reasoning, not only the right option.

- Research: Feedback that explains is more effective than correct/incorrect alone (Hattie & Timperley, 2007; Shute, 2008). Strong.
- Build: An explanation field per question in the lesson JSON.

**10. Weekly money mission.** Each unit ends with a real task on your own money, e.g. "Find your super fund's fees" or "Check your marginal tax rate". Tick it off for bonus XP.

- Research: Financial education fades within months unless tied to a real decision (Fernandes, Lynch & Netemeyer, 2014). Showing how material applies to your own life raises interest and results (Hulleman & Harackiewicz, 2009). Strong.
- Build: A mission field per unit, a checklist screen.

**11. Explain-it-back prompts.** Once per lesson, pick the best explanation of why something is true, or type one sentence in your own words.

- Research: Self-explanation improves learning, g = 0.55 across 64 studies (Bisra et al., 2018). Strong.
- Build: A question type in the lesson JSON.

**12. Difficulty that stays around 85% correct.** If you get three in a row right, the next question is harder; after two misses, an easier one.

- Research: Learning is fastest at roughly 85% accuracy (Wilson et al., 2019). Matching challenge to skill supports focus and enjoyment, "flow" (Csikszentmihalyi, 1990). Moderate.
- Build: Tag questions easy/medium/hard; pick by recent accuracy.

**13. Mixed "boss" reviews.** Every few lessons, a short challenge mixes questions from earlier units in random order.

- Research: Mixing topics (interleaving) improves later performance, often doubling test scores (Rohrer & Taylor, 2007; Kornell & Bjork, 2008). Strong.
- Build: Draw from the review deck across units.

### Seeing your progress

**14. Skill map that fades.** Each unit icon fades as its material comes due for review, and refills when reviewed.

- Research: Memory decays predictably; Duolingo's model of this improved review targeting and engagement (Settles & Meeder, 2016). Moderate.
- Build: Compute from the Leitner boxes you already store.

**15. Weekly review screen.** Every Sunday: minutes learnt, lessons done, accuracy trend, missions ticked, and one line on what you'll do next week.

- Research: Monitoring progress helps people reach goals, and more so when recorded (Harkin et al., 2016). Strong.
- Build: Aggregate local history; no server.

**16. Personalised examples.** At setup, choose goals (e.g. first home, investing, tax) and your situation; examples swap in matching names and numbers.

- Research: Personalising problem context raised learning and motivation (Cordova & Lepper, 1996). Moderate.
- Build: Variables in the lesson JSON.

### Rewards and motivation

**17. Occasional surprise bonuses.** Now and then, finishing a session shows a surprise: double XP, a fun finance fact, or a cosmetic badge.

- Research: Unexpected rewards do not undermine intrinsic motivation, unlike expected ones tied to the task (Deci, Koestner & Ryan, 1999). Gamification overall has small to medium positive effects on learning (Sailer & Homner, 2020). Moderate. Keep them cosmetic (see guardrails).
- Build: A random check after a session.

**18. Mastery badges, not activity badges.** Badges for skills ("Can read a payslip") rather than for logins or time spent.

- Research: Rewards that signal competence support motivation; controlling ones weaken it (Ryan & Deci, 2000). Moderate.
- Build: Badge rules in a data file.

**19. Commitment pledge.** Set a goal like "5 days a week for 4 weeks" and optionally share it with a friend via a share card or message.

- Research: Commitment devices raise follow-through (Bryan, Karlan & Nelson, 2010). Progress monitoring works better when made public (Harkin et al., 2016). Moderate.
- Build: The Web Share API; no accounts needed.

**20. Identity framing.** Copy talks about who you are becoming: "You're an investor now", not "You did a lesson".

- Research: Noun framing ("be a voter") raised turnout in one study (Bryan et al., 2011), but a large replication failed (Gerber et al., 2016). Emerging. Cheap to try; don't rely on it.
- Build: Copywriting only.

## Guardrails

The aim is a habit you're glad you have, not compulsion. These rules keep the features above on the right side of that line.

- **No punishment for stopping.** No lives, no guilt-trip copy ("Your streak is about to die!"), no loss of earned progress. Loss framing drives short-term returns but adds stress and quitting.
- **Rewards stay cosmetic.** Surprise bonuses (#17) never gate lessons. Variable rewards tied to the core loop are the slot-machine pattern to avoid.
- **A daily cap.** After the session plus one optional lesson, the app says "done for today". Spacing beats cramming anyway.
- **One reminder a day, at the time you chose.** Nothing extra when you miss.
- **Watch for novelty fade.** Points and badges lose pull after a few weeks, and in one class study gamification lowered motivation (Hanus & Fox, 2015). That's why the top 5 lean on cues and real-world use, not points.
- **Missions are educational, not advice.** Money missions ask you to look things up, never to buy a product.

## Sources

These are standard peer-reviewed studies cited from my knowledge; I did not re-open each paper today, so effect sizes are approximate.

- Bidargaddi et al. (2018). Push notification timing and engagement. *JMIR mHealth and uHealth*.
- Bisra et al. (2018). Inducing self-explanation: a meta-analysis. *Educational Psychology Review*.
- Bryan, Karlan & Nelson (2010). Commitment devices. *Annual Review of Economics*.
- Bryan et al. (2011). Motivating voter turnout by invoking the self. *PNAS*.
- Butler, Fazio & Marsh (2011). The hypercorrection effect persists over a week. *Psychonomic Bulletin & Review*.
- Cordova & Lepper (1996). Intrinsic motivation and learning: personalization and choice. *Journal of Educational Psychology*.
- Csikszentmihalyi (1990). *Flow*. Harper & Row.
- Dai, Milkman & Riis (2014). The fresh start effect. *Management Science*.
- Deci, Koestner & Ryan (1999). Extrinsic rewards and intrinsic motivation: a meta-analysis. *Psychological Bulletin*.
- Fernandes, Lynch & Netemeyer (2014). Financial literacy, financial education and downstream behaviors. *Management Science*.
- Fogg (2019). *Tiny Habits*. Houghton Mifflin Harcourt.
- Gerber et al. (2016). Field experiments on noun framing and turnout. *PLOS ONE*.
- Gollwitzer & Sheeran (2006). Implementation intentions and goal achievement: a meta-analysis. *Advances in Experimental Social Psychology*.
- Hanus & Fox (2015). Gamification in the classroom: a longitudinal study. *Computers & Education*.
- Harkin et al. (2016). Does monitoring goal progress promote goal attainment? A meta-analysis. *Psychological Bulletin*.
- Hattie & Timperley (2007). The power of feedback. *Review of Educational Research*.
- Hulleman & Harackiewicz (2009). Promoting interest and performance in high school science. *Science*.
- Kapur (2014). Productive failure in learning math. *Cognitive Science*.
- Karlan et al. (2016). Getting to the top of mind: reminders and saving. *Management Science*.
- Kivetz, Urminsky & Zheng (2006). The goal-gradient hypothesis resurrected. *Journal of Marketing Research*.
- Kornell & Bjork (2008). Learning concepts and categories: is spacing the enemy of induction? *Psychological Science*.
- Metcalfe (2017). Learning from errors. *Annual Review of Psychology*.
- Milkman, Minson & Volpp (2014). Holding the Hunger Games hostage at the gym: temptation bundling. *Management Science*.
- Milkman et al. (2021). Megastudies improve the impact of applied behavioural science. *Nature*.
- Nunes & Drèze (2006). The endowed progress effect. *Journal of Consumer Research*.
- Richland, Kornell & Kao (2009). The pretesting effect. *Journal of Experimental Psychology: Applied*.
- Rohrer & Taylor (2007). The shuffling of mathematics problems improves learning. *Instructional Science*.
- Ryan & Deci (2000). Self-determination theory. *American Psychologist*.
- Sailer & Homner (2020). The gamification of learning: a meta-analysis. *Educational Psychology Review*.
- Settles & Meeder (2016). A trainable spaced repetition model for language learning. *ACL*.
- Shute (2008). Focus on formative feedback. *Review of Educational Research*.
- Silverman & Barasch (2023). On or off track: how (broken) streaks affect consumer decisions. *Journal of Consumer Research*.
- Thaler & Sunstein (2008). *Nudge*. Yale University Press.
- Wilson et al. (2019). The eighty five percent rule for optimal learning. *Nature Communications*.
- Wood & Neal (2007). A new look at habits and the habit-goal interface. *Psychological Review*.

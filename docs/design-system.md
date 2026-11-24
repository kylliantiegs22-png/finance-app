# Finance app design system & UX recommendations

Nov 23, 2026 · @Kyllian

## Summary

The app should look like a calm, premium bank that happens to be fun: a deep indigo brand colour for trust, emerald for growth and correct answers, and gold for rewards, on clean slate neutrals. Everything below is free and open-licensed, and every text colour pair has been checked against WCAG AA contrast.

The five changes that will do the most for a professional look:

1. **One token file.** Define every colour, gradient, radius and font once (section 3 and 4) and use only those values. Inconsistency is what makes hobby apps look amateur.
2. **Indigo, not green.** Green-primary is the signature of the best-known language app. Indigo plus emerald plus gold reads as finance and stays distinct.
3. **Phosphor icons, duotone for big moments.** One icon family everywhere, with the two-tone weight on unit badges and achievements so they stand out.
4. **Numbers as hero content.** Money figures in a bold display font with tabular digits, so the app feels like a finance tool, not a quiz.
5. **Celebrate in proportion.** A small tick for a right answer, a confetti burst for a finished lesson, a full-screen moment only for milestones (7, 30, 66, 100 days).

## Design principles

Seven rules to judge every screen against. If a design choice breaks one, change the design.

1. **Trust first, fun second.** Finance apps earn credibility through restraint: lots of white space, a small set of colours, crisp alignment. Playfulness lives in motion and rewards, not in clutter.
2. **One job per screen.** Each lesson screen has one question and one primary button, pinned to the bottom within thumb reach. Nothing competes with the answer.
3. **Colour carries meaning.** Indigo means "act here", emerald means "right / growth", rose means "try again", gold means "reward". Never use them decoratively, so the meaning stays clear.
4. **Feedback is instant and kind.** Every tap responds within 100 ms. Wrong answers get a calm rose panel with the reason, never a red flash or penalty sound.
5. **Progress is always visible.** A progress bar in every lesson, a daily goal ring on Home, a path that shows how far you have come. Seeing progress is the main reward for an adult learner.
6. **Celebrate in proportion.** Small wins get small feedback; rare wins get big moments. If everything explodes in confetti, nothing feels special.
7. **Accessible by default.** AA contrast, 48 px touch targets, reduced motion respected, dark mode from day one. These also read as quality to every user.

## Colour palette

The palette is built from the [Tailwind CSS colour scales](https://tailwindcss.com/docs/colors) (MIT licence), a professionally tuned set used by thousands of products, so every shade has a matching lighter and darker step. You can open and tweak it in [Coolors](https://coolors.co/4f46e5-7c3aed-10b981-fbbf24-0f172a) or preview it on a live page in [Realtime Colors](https://www.realtimecolors.com/?colors=0f172a-f8fafc-4f46e5-7c3aed-fbbf24&fonts=Plus%20Jakarta%20Sans-Inter); both are free.

| Role | Light mode | Dark mode | Used for | Contrast checked |
| --- | --- | --- | --- | --- |
| Primary (Indigo) | #4F46E5, pressed #4338CA, tint #EEF2FF | #818CF8, tint #1E1B4B | Buttons, links, current path node, focus ring | White on #4F46E5 6.3:1; #818CF8 on dark bg 6.3:1 |
| Secondary (Violet) | #7C3AED | #A78BFA | Gradient partner, hero cards, premium accents | White on #7C3AED 5.7:1 |
| Success / growth (Emerald) | fill #10B981, text #047857, tint #ECFDF5 | #34D399, tint #064E3B | Correct answers, completed nodes, upward numbers | #065F46 on tint 7.3:1; #34D399 on dark 9.8:1 |
| Reward (Gold) | #FBBF24, deep #F59E0B, tint #FEF3C7 | #FBBF24 | XP, gems, badges, milestone moments | Dark text #0F172A on gold 10.7:1 |
| Streak (Orange) | #F97316 | #FB923C | Flame icon and streak counter only | Icon only (2.8:1 on white, so never body text) |
| Error (Rose) | text #BE123C, fill #E11D48, tint #FFF1F2 | #FB7185, tint #4C0519 | Wrong answers, destructive actions | #9F1239 on tint 7.3:1; #FB7185 on dark 7.0:1 |
| Text | #0F172A | #F1F5F9 | Headings, body | 17.9:1 / 17.2:1 |
| Muted text | #475569 (min #64748B) | #94A3B8 | Captions, helper text | 7.6:1 (4.8:1) / 7.3:1 |
| Border | #E2E8F0 | #1E293B | Card outlines, dividers | Decorative, no minimum |
| Surface | #FFFFFF cards on #F8FAFC | #111827 cards on #0B1120 | Backgrounds | n/a |

Rules that keep it looking professional:

- About 70% neutral, 20% indigo, 10% everything else. Gold and orange appear only on rewards.
- Never put white text on emerald #10B981 or orange (both fail contrast); use the darker text shade or a dark label.
- Dark mode is not inverted light mode: use a near-black navy (#0B1120), lighten accent colours one or two steps, and replace shadows with slightly lighter surfaces.
- Red and green alone must never carry meaning (about 1 in 12 men are red-green colour blind): pair them with a tick or cross icon and the words "Correct" or "Not quite".

## Gradients, type, icons and tokens

### Gradients

Use four gradients, each with one job. Keep angles the same (135 degrees) so they feel like a family.

| Name | CSS | Where |
| --- | --- | --- |
| Brand | `linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)` | Home hero card, primary call to action on onboarding, app icon |
| Growth | `linear-gradient(90deg, #10B981 0%, #06B6D4 100%)` | Lesson progress bar, daily goal ring, completed path line |
| Reward | `linear-gradient(135deg, #FBBF24 0%, #F97316 100%)` | XP burst, badges, streak milestone screen |
| Night | `linear-gradient(180deg, #1E1B4B 0%, #0B1120 100%)` | Dark mode hero and splash screen |

Add depth with a soft glow instead of heavy shadows: `box-shadow: 0 8px 24px rgba(79, 70, 229, 0.25)` under brand-gradient cards. A faint background "mesh" (two radial gradients of indigo and violet at 8% opacity behind the Home header) gives a premium feel at no cost. Put text on gradients only where both ends pass contrast (white passes on Brand and Night; nothing goes on Growth or Reward except icons and dark numbers).

### Typography

| Use | Font | Weight | Size / line height |
| --- | --- | --- | --- |
| Display numbers (XP, $ amounts, streak) | [Plus Jakarta Sans](https://fontsource.org/fonts/plus-jakarta-sans) | 800 | 40 / 44 px |
| Screen titles | Plus Jakarta Sans | 700 | 24 / 32 px |
| Question text | Plus Jakarta Sans | 600 | 20 / 28 px |
| Body and explanations | [Inter](https://rsms.me/inter/) | 400 / 500 | 16 / 24 px |
| Captions, labels | Inter | 500 | 13 / 18 px |

Both fonts are free under the SIL Open Font License. Plus Jakarta Sans gives headings a modern, confident fintech character; Inter is one of the most legible screen fonts. Turn on tabular figures for all money with `font-variant-numeric: tabular-nums` so digits line up and do not jump when they animate. Self-host the fonts with Fontsource (npm packages) rather than loading from Google, so the PWA works offline. Size text in rem so the phone's text-size setting is respected.

### Icons

Use [Phosphor Icons](https://phosphoricons.com) (MIT licence, 1,500+ icons, six weights). Its duotone weight is what makes icons "standout" without paying for an illustration set.

- **Regular weight, 24 px** for navigation and buttons.
- **Fill weight** for the selected tab in the bottom bar.
- **Duotone, 32 to 48 px, in brand colours** for unit badges, achievements and empty states.
- Suggested unit icons: Wallet (1), Percent (2), CreditCard (3), Receipt (4), PiggyBank (5), ChartPieSlice (6), ChartLineUp (7), House (8), Globe (9), Notebook (10), Buildings (11), Scales (12). Core UI: Flame (streak), Lightning (XP), Snowflake (freeze), Target (daily goal), CheckCircle and XCircle (feedback), Lock (locked node).
- [Lucide](https://lucide.dev) (ISC licence) is the alternative if you prefer thinner, more minimal line icons, but pick one family and use only that.

For each unit badge, place the duotone icon on a 64 px rounded square filled with that unit's tint, so the path looks like a set of collectible coins.

### Spacing, shape and elevation tokens

| Token | Values |
| --- | --- |
| Spacing (4 px grid) | 4, 8, 12, 16, 24, 32, 48 px; screen side padding 20 px |
| Radius | 8 px inputs, 16 px cards and buttons, 24 px sheets, full for pills and path nodes |
| Elevation | Flat 0; Card `0 1px 3px rgba(15,23,42,.08)`; Raised `0 8px 24px rgba(15,23,42,.12)`; dark mode uses lighter surfaces instead of shadow |
| Touch target | 48 px minimum height for every tappable element |
| Motion | 150 ms taps, 250 ms transitions, springs for celebrations; ease-out curve `cubic-bezier(0.2, 0.8, 0.2, 1)` |

## Components and micro-interactions

### Core components

| Component | Look | Behaviour |
| --- | --- | --- |
| Primary button | Full width, 56 px tall, 16 px radius, indigo with a 4 px darker "base" underneath so it looks pressable | Sinks 4 px on press (base disappears); disabled is slate-200 with muted text |
| Answer option | White card, 2 px slate border, 16 px radius, optional leading letter or icon | Selected: indigo border and tint. After check: emerald or rose border plus tick or cross icon |
| Feedback sheet | Slides up from the bottom, tinted emerald or rose, icon + "Correct" / "Not quite" + one-line reason + Continue | Never covers the question; 250 ms slide |
| Progress bar | 8 px pill, Growth gradient fill, at the top of lessons with a close (X) button | Animates forward on each correct answer; a small sparkle at the leading edge |
| Number input | Large Plus Jakarta 800 digits, $ prefix, numeric keypad (`inputmode="decimal"`) | Accepts "1,200" and "1200"; tolerance per question |
| Stat chip | Pill with icon + number (Flame 12, Lightning 340) | Number counts up when it changes |
| Path node | 72 px circle; states: locked (slate, Lock), current (indigo gradient, pulsing ring, "Start" tooltip), done (emerald with tick), review due (gold ring) | Tap opens a small card with the lesson title and Start |
| Bottom tab bar | 4 tabs: Learn, Review, Progress, Profile; Phosphor icons, filled when active | Hidden inside lessons for focus |

### Micro-interactions and celebrations

Match the size of the reward to the size of the win:

| Moment | Feedback | Duration |
| --- | --- | --- |
| Tap an option | Scale to 0.97 and back, light haptic | 150 ms |
| Correct answer | Emerald sheet, tick draws itself, progress bar jumps, soft "ding" | 300 ms |
| Wrong answer | Rose sheet, gentle side-to-side nudge (no flash), reason shown | 300 ms |
| 3 correct in a row | "On a roll" chip pops above the progress bar | 1 s |
| Lesson complete | Confetti burst in brand colours, XP counts up, accuracy and time shown | 2 s |
| Daily goal met | Goal ring closes with a glow, streak flame grows | 1.5 s |
| Milestone (7, 30, 66, 100 days; unit mastered) | Full-screen Reward-gradient card with a duotone badge, shareable as an image | User dismisses |

Tools, all free: [canvas-confetti](https://github.com/catdad/canvas-confetti) (ISC licence) for confetti, [Motion](https://motion.dev) (MIT) or plain CSS transitions for springs and count-ups, and CC0 interface sounds from [Kenney](https://kenney.nl/assets/category:Audio). Haptics use `navigator.vibrate()`, which works on Android Chrome but not on iPhone Safari, so treat it as a bonus. Sound should default off or be easy to mute, since people often learn on the bus. Skip paid animation packs; if you add Lottie animations later, check each LottieFiles animation's own licence first.

## Key screens

### Onboarding (under 60 seconds, no sign-up)

Ask for value before effort: the learner answers a real question before anything else, and there is no account to create because progress lives on the device.

1. **Welcome.** Night gradient, app name, one line ("Get good with money, 10 minutes a day"), Start button.
2. **First question straight away.** "You earn $1,000 and inflation is 5%. After a year, is your money worth more, less or the same?" Answering gives the first XP and a taste of the feedback sheet.
3. **Your goal.** Pick one card: understand my pay and tax, stop worrying about debt, start investing, go deeper (pro finance). Used to suggest a starting unit, not to lock anything.
4. **Your level.** "New to this" starts at Unit 1; "I know the basics" offers a 2-minute placement check to skip ahead.
5. **Your habit.** Pick a time and a cue ("after morning coffee, 8:00"). Ask for notification permission here, with the reason shown first.
6. **The promise.** "General information, not financial advice" in one plain sentence, then straight to the first lesson.

### Home (Learn tab)

- **Header:** streak chip (Flame), XP chip (Lightning), freeze count (Snowflake). Tapping the streak opens the 66-day habit grid.
- **Today card:** Brand-gradient card with the daily goal ring and one big button that does the right thing ("Start today's 10 minutes": review first, then the next lesson). This is the habit trigger, so it must be the most obvious thing on screen.
- **The path:** a vertical, gently winding line of path nodes. Each unit opens with a banner in its tint showing the duotone unit icon, title and progress ("3 of 8"). Completed stretches of line use the Growth gradient. A review node and a unit check close each unit.

The winding path is a standard mechanic; give it its own look with coin-shaped nodes and unit colour bands rather than copying any existing app's layout or mascot.

### Lesson

Top: close button and Growth progress bar. Middle: one question, large type, any visual (a payslip, a bar chart, a mini statement) drawn as a clean card. Bottom: answers, then a fixed Check button. After checking, the feedback sheet slides up. Teaching screens use the same layout with a Continue button and at most 60 words, plus one simple diagram.

Finance-specific visuals worth building as reusable components: a payslip card, a bank statement row, a compound growth line chart, a pie for budgets, a loan amortisation bar, and a tax bracket staircase. Draw them in the palette so lessons look designed, not like stock images.

### Review

Same layout as a lesson with a gold progress bar so it feels distinct. A header shows "6 due today". When nothing is due: an empty state with a duotone check badge and "All caught up".

### Lesson complete

Confetti, then three stat tiles (XP earned, accuracy %, time), the three-bullet recap, and the real-world action ("Check your last payslip") as a card with a "Done it" tick. One Continue button back to Home.

### Progress tab

- 66-day habit grid (like a calendar heatmap) in emerald shades, with freezes shown as snowflakes.
- Skill map: each concept as strong (emerald), fading (gold) or weak (rose) with icons, not colour alone.
- "You vs last week" line: lessons, reviews and minutes this week compared with last week. This replaces leaderboards.

### Profile and settings

Theme (system, light, dark), reminder time, sound and haptics toggles, reduced motion, export or import progress as a file (important, because local storage can be cleared), and the not-advice notice.

## Accessibility checklist

Target [WCAG 2.2](https://www.w3.org/TR/WCAG22/) level AA. Each item is cheap to do from the start and expensive to retrofit.

- [ ] Text contrast at least 4.5:1 (3:1 for text 24 px and up, icons and input borders). The palette table lists the checked pairs.
- [ ] Every touch target at least 48 by 48 px (WCAG's minimum is 24 px; 48 px is the comfortable mobile standard).
- [ ] Right and wrong shown by icon and words as well as colour.
- [ ] Respect `prefers-reduced-motion`: replace confetti, shakes and slides with a simple fade.
- [ ] Respect `prefers-color-scheme` for the default theme, with a manual override.
- [ ] Text sized in rem and layouts that still work at 200% zoom.
- [ ] Visible focus ring (2 px indigo outline, 2 px offset) for keyboard users.
- [ ] Real buttons and labels in the HTML so screen readers announce questions, options and results; announce feedback with an `aria-live` region.
- [ ] Charts and diagrams have a one-line text description.
- [ ] Numbers read clearly: "$1,200", not "1200"; spell out % and p.a. on first use.

## Suggested improvements to the existing plan

Reading the [learning design doc](https://claude.ai/artifact/3UHLTXxQRW9N13VY2hdNN3) and the [curriculum plan](https://claude.ai/artifact/PA9dExRDwXNeP3jxLxPLJ7) side by side, two numbers disagree and should be settled before any lessons are written. The rest are additions.

### Fix first: the two docs disagree

1. **Lesson length.** The curriculum says 5 to 10 minutes with 6 to 10 practice questions; the learning doc says about 5 minutes, 12 to 16 screens and at least 9 questions. Use the learning doc's version everywhere, since it fits two blocks into the 10-minute day.
2. **Course size.** The learning doc plans about 10 units of 5 to 6 lessons (about 60 lessons, matching the 66-day habit window). The curriculum has 12 units of 8 lessons (96 lessons, about 3 to 4 months at 1 to 2 a day). Suggestion: keep the 96 lessons but split them into three "seasons" with their own finish line. Season 1 is Units 1 to 5, personal finance (40 lessons, roughly the 66-day window); Season 2 is Units 6 to 8, investing; Season 3 is Units 9 to 12, professional finance. Each unit keeps 8 lessons with a review node after lessons 4 and 8, then the unit check.

### Design additions

| Suggestion | Why | Where it goes |
| --- | --- | --- |
| Give each season its own colour: emerald (personal), indigo (investing), violet (professional) | The path shows at a glance how far into the "pro" material you are, and season finishes feel like real milestones | Path banners, unit badges |
| Add a placement check in onboarding | Lets someone who knows budgeting skip to the material that is new to them, so the first week is not boring | Onboarding step 4 |
| Add a "tap the right part" question type | Finance is full of documents. Tapping the tax line on a payslip or the fee on a statement is more realistic than multiple choice | Question types table in the learning doc |
| Build a small kit of finance visuals (payslip, statement, growth chart, budget pie, loan bar, tax staircase) | Makes AI-written lessons look designed and consistent; each lesson JSON just references a visual and its numbers | Lesson JSON schema |
| A tap-to-define glossary on key terms, plus a Glossary page | Jargon is the biggest barrier in finance; definitions in context keep text screens under 60 words | Lesson renderer, Profile tab |
| Track the real-world action as a "Done it" tick | Turns lessons into behaviour, which the research says is where finance education usually falls short | Lesson complete screen, Progress tab |
| Export and import progress, and prompt to install to the home screen | Progress lives in browser storage. iPhone Safari can clear it for sites not added to the home screen, and iPhone web push only works for installed web apps | Profile, onboarding after day 3 |
| Set a freeze price (for example 1 freeze per 200 XP, max 2) | The current plan says freezes are earned with XP but not how many | Rules in the learning doc |
| Make an original logo mark early (a simple geometric monogram in the Brand gradient) | A real icon on the home screen is the cheapest way to look professional | PWA manifest icons |
| Build a one-page "style tile" before the app | One HTML page showing the palette, type, buttons, a lesson screen and the path. Settles the look in an hour, before any code is wasted | Next build step |

## Free resources and licences

Licences for the npm packages were checked on the npm registry on 2026-11-23. All allow free commercial and personal use; MIT, ISC and OFL only ask you to keep the licence notice, which can sit on an About screen.

| Resource | What for | Licence |
| --- | --- | --- |
| [Tailwind CSS colours](https://tailwindcss.com/docs/colors) | Palette source and shade scales | MIT |
| [Coolors](https://coolors.co/4f46e5-7c3aed-10b981-fbbf24-0f172a) | Tweak and export the palette | Free web tool |
| [Realtime Colors](https://www.realtimecolors.com/?colors=0f172a-f8fafc-4f46e5-7c3aed-fbbf24&fonts=Plus%20Jakarta%20Sans-Inter) | Preview palette and fonts on a page, light and dark | Free web tool |
| [Coolors contrast checker](https://coolors.co/contrast-checker) | Check any new colour pair | Free web tool |
| [Plus Jakarta Sans](https://fontsource.org/fonts/plus-jakarta-sans) | Headings and numbers | SIL OFL 1.1 |
| [Inter](https://rsms.me/inter/) | Body text | SIL OFL 1.1 |
| [Phosphor Icons](https://phosphoricons.com) | All icons | MIT |
| [Lucide](https://lucide.dev) | Alternative icon set | ISC |
| [canvas-confetti](https://github.com/catdad/canvas-confetti) | Celebrations | ISC |
| [Motion](https://motion.dev) | Springs and animations | MIT |
| [Kenney audio](https://kenney.nl/assets/category:Audio) | Interface sounds | CC0 (public domain) |
| [WCAG 2.2](https://www.w3.org/TR/WCAG22/) | Accessibility standard | Free reference |

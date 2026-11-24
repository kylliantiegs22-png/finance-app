# 20 ways to improve the user experience

Nov 24, 2026 · @Kyllian

Build these five first: together they cover the moment people repeat 10 to 15 times a lesson (answering) and the moment they remember (finishing). All 20 ideas are free and use open-source libraries or CC0 assets.

## Top 5 to build first

1. **A tiny motion system (#6).** Three durations and one spring, set up once in Motion. Every later animation gets cheaper and more consistent.
2. **The answer-feedback moment (#9).** The bottom sheet with tick or gentle shake plus a one-line "why". This is the most repeated interaction in the app.
3. **A small sound palette (#12).** Five or six Kenney CC0 sounds played with Howler.js, with a mute toggle. Sound is the cheapest way to make a web app feel like a game.
4. **Three tiers of celebration (#16).** Tick pop, confetti burst in brand colours, then a full-screen unit win. Scaling stops rewards going stale.
5. **The lesson-complete recap (#17).** Animated stats plus "You learned" bullets. By the peak-end rule, this screen shapes how people remember every session.

Next in line: tactile buttons (#8), screen transitions (#7) and the frozen streak flame (#19), which shows off the forgiving streak.

| Area | Ideas |
| --- | --- |
| Aesthetics | 1 to 5 |
| Animations and micro-interactions | 6 to 11 |
| Sounds and haptics | 12 to 15 |
| Celebrations | 16 to 20 |

## Aesthetics (1 to 5)

The app already has its palette, fonts and icons chosen (indigo, emerald and gold, Plus Jakarta Sans and Inter, Phosphor). These five ideas are about using them so the app reads as one polished product.

| # | Idea | Why it works | Free tool |
| --- | --- | --- | --- |
| 1 | **Gradients with restraint.** Use the Brand gradient only on hero surfaces (top of the home screen, the main Continue button, unit headers). Everything else stays flat white or slate. | Roughly a 60-30-10 split (neutral, brand, accent) is a standard way to keep colour feeling premium instead of busy. Gold and the Reward gradient stay rare so they mean "you earned this". | CSS custom properties as design tokens; [Tailwind CSS](https://tailwindcss.com) (MIT) |
| 2 | **One icon shell for every unit.** Each unit gets a Phosphor duotone icon inside a gradient-filled circle with a soft inner highlight, so the path map looks like a set. | Consistent shape and weight is what makes icons look professional. Mixed styles are the most common tell of a hobby app. | [Phosphor Icons](https://phosphoricons.com) (MIT) |
| 3 | **A money-growth visual instead of a mascot.** A small plant or coin stack on the home screen grows as lessons are completed, a nod to compounding. | Gives the app its own identity and avoids looking like Duolingo, which leans on a mascot. It also teaches the core idea of compounding without words. | Hand-built SVG, or free CC0 shapes from [Open Peeps](https://www.openpeeps.com) and recolourable art from [unDraw](https://undraw.co) |
| 4 | **Money-grade numbers and a real dark mode.** Show every dollar figure in Plus Jakarta Sans with tabular numerals, always as A$ with two decimals where relevant. Dark mode uses the Night gradient and follows the phone setting. | Tabular numerals stop digits jumping when values change, which is what banking apps do. Many people learn at night, and following `prefers-color-scheme` feels native. | [Fontsource](https://fontsource.org) (self-hosted fonts); CSS `font-variant-numeric: tabular-nums` |
| 5 | **Feel like an installed app.** Branded splash and icon set, `theme-color` matching the header, safe-area padding around the iPhone notch, no white flash while loading, and skeleton placeholders instead of spinners. | These small details are what separate a PWA that feels native from one that feels like a website. Skeletons make waits feel shorter than spinners. | [Vite PWA plugin](https://vite-pwa-org.netlify.app) (MIT); [pwa-asset-generator](https://github.com/elegantapp/pwa-asset-generator) (MIT) |

## Animations, transitions and micro-interactions (6 to 11)

Good motion is fast, consistent and always explains what just happened. The rule of thumb from [Nielsen Norman Group](https://www.nngroup.com/articles/response-times-3-important-limits/): feedback within about 0.1 seconds feels instant.

| # | Idea | Why it works | Free tool |
| --- | --- | --- | --- |
| 6 | **A tiny motion system.** Three durations only (fast 150 ms, base 250 ms, slow 400 ms), one gentle spring for things entering and an ease-out for things leaving. Every animation in the app uses these. | Consistent timing is what makes motion feel designed rather than random. It is the same approach as [Material 3 motion tokens](https://m3.material.io/styles/motion/overview). | [Motion](https://motion.dev) (MIT) |
| 7 | **Screens that flow into each other.** Tapping a unit card expands it into the lesson screen; going back shrinks it home. Use the browser's View Transitions with a plain crossfade where it is not supported. | Shared-element transitions keep people oriented ("I'm inside that unit"), which reduces the feeling of jumping between web pages. | [View Transition API](https://developer.mozilla.org/en-US/docs/Web/API/View_Transition_API) (built into Chrome and Safari 18+) |
| 8 | **Tactile answer buttons.** Answer choices are chunky "pushable" buttons with a darker bottom edge that press down 2 to 4 px on tap, with a soft highlight when selected. | Gives a physical, game-like feel with zero cost and instant response. It is one of the biggest contributors to a polished quiz feel. | Plain CSS; see Josh Comeau's [3D button tutorial](https://www.joshwcomeau.com/animation/3d-button/) |
| 9 | **A clear answer-feedback moment.** On Check, a bottom sheet slides up: emerald with a tick and short praise when right; rose with the correct answer and a one-line "why" when wrong. Wrong answers get a small 4 px shake, never a loud buzzer. | Immediate, explanatory feedback is one of the best-supported practices in learning research. Keeping the wrong state gentle fits the "no guilt" guardrail from the engagement plan. | Motion for the sheet and shake; Phosphor tick and info icons |
| 10 | **Progress that visibly moves.** The lesson progress bar fills with a short shine sweep after each question, and XP and totals count up rather than snapping. | Seeing progress accelerate near the end (the goal-gradient effect) pushes people to finish. Counting numbers make rewards feel earned. | [NumberFlow](https://number-flow.barvian.me) (MIT) for animated numbers |
| 11 | **Play-with-it money visuals.** In lessons on compounding, super or budgets, a slider changes the inputs and the chart reshapes live (for example, "start at 18 vs 25"). | Learning by manipulating a model sticks better than reading a number. It is also the kind of moment people screenshot and share. | Plain SVG animated with Motion, or [Recharts](https://recharts.org) (MIT) |

## Sounds and haptics (12 to 15)

Sound and touch feedback make the app feel alive, but only if they are short, soft and easy to turn off. One catch: iPhone Safari does not support the web vibration API, so real haptics on iOS need a workaround or a wrapped app later.

| # | Idea | Why it works | Free tool |
| --- | --- | --- | --- |
| 12 | **A small, consistent sound palette.** Five or six sounds only: tap, correct, wrong (soft, low thud), lesson complete, streak extended, badge earned. All short (under 0.5 s) and mixed quietly. | A limited palette becomes recognisable, like a brand. Too many sounds feel noisy and cheap. | [Kenney Interface Sounds](https://kenney.nl/assets/interface-sounds) (CC0, free for commercial use); [Howler.js](https://howlerjs.com) (MIT) to play them |
| 13 | **A signature "coin" chime.** Design one custom sound, a bright two-note coin chime, used only for correct answers and money-mission wins. | A distinctive sound acts like an audio logo and ties the app to the money theme. | [jsfxr](https://sfxr.me) (generate and export) or [ZzFX](https://github.com/KilledByAPixel/ZzFX) (MIT, under 1 KB) |
| 14 | **Light haptics where available.** Android: one 15 ms pulse for correct, two short pulses for wrong, a longer pattern for lesson complete. iPhone: skip for now, or add later if the app is wrapped as a native app. | Touch feedback confirms an action without needing to look or listen, which helps on the bus with the sound off. | [Vibration API](https://developer.mozilla.org/en-US/docs/Web/API/Vibration_API) (Android browsers); [Capacitor Haptics](https://capacitorjs.com/docs/apis/haptics) (MIT) if wrapped later |
| 15 | **Sight, sound and touch in sync, with separate toggles.** Fire the visual, sound and haptic in the same frame. Settings has three switches: Sounds, Haptics, Reduced motion. Sounds start on but follow a mute choice that is remembered. | Feedback that lands together reads as one solid moment (game designers call this "juice"). Separate toggles respect people learning in class, at work or with sensory sensitivities. | localStorage for the settings; CSS `prefers-reduced-motion` as the default for motion |

## Celebrations and feedback moments (16 to 20)

Celebrations should scale with the achievement, so the big ones still feel big after 100 lessons. The end of a session matters most: by the [peak-end rule](https://www.nngroup.com/articles/peak-end-rule/), people remember an experience by its best moment and its ending.

| # | Idea | Why it works | Free tool |
| --- | --- | --- | --- |
| 16 | **Three tiers of celebration.** Small (correct answer): tick pops and the coin chime. Medium (lesson done): a short confetti burst in indigo, emerald and gold. Large (unit done): a full-screen animation and a badge reveal. | Scaling rewards avoids "celebration fatigue", where everything is a party so nothing feels special. | [canvas-confetti](https://github.com/catdad/canvas-confetti) (ISC); [Lottie](https://airbnb.io/lottie/) player with free animations from [LottieFiles](https://lottiefiles.com/free-animations) (check each file's licence) |
| 17 | **A lesson-complete recap screen.** Stats animate in one after another: XP earned, accuracy, time taken, streak, then "You learned: 3 things" as short bullets and one Continue button. | This is the "end" in peak-end, so it should be the most polished screen in the app. The recap also acts as retrieval practice. | Motion (staggered entrances); NumberFlow for the counting stats |
| 18 | **Collectible badges with a shine.** Badges flip in with a 3D turn and a gold sheen sweeping across, then sit on a trophy shelf on the profile. A Share button makes a neat image card. | Collectibles give a sense of progress beyond the streak, and a well-designed share card is free marketing. | CSS 3D transforms; [html-to-image](https://github.com/bubkoo/html-to-image) (MIT) and the [Web Share API](https://developer.mozilla.org/en-US/docs/Web/API/Navigator/share) |
| 19 | **A streak flame with a frozen state.** The flame grows slightly at 7, 30 and 100 days. When a streak freeze is used, it turns icy blue with a gentle frost animation instead of going out. | Makes the forgiving streak from the engagement plan visible and reassuring, rather than a guilt trip. | [Rive](https://rive.app) (free plan) or a LottieFiles flame; Phosphor flame icon as the static fallback |
| 20 | **A special moment for real-world wins.** Completing the weekly money mission (for example, "set up a savings bucket") gets its own celebration: the Reward gradient, a coin-drop sound and a "real money move" stamp. | Celebrating real behaviour, not just quiz scores, signals what actually matters and links learning to life. | Same tools as 16; Kenney coin sounds from the [Kenney asset library](https://kenney.nl/assets) (CC0) |

## Guardrails

These rules keep the polish from hurting speed, accessibility or trust. All of them cost nothing.

- **Respect reduced motion.** When the phone's "Reduce Motion" is on ([prefers-reduced-motion](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion)), swap slides and confetti for simple fades.
- **Never rely on sound or colour alone.** Right and wrong always show an icon and words too, so the app works muted and for colour-blind users. Keep the AA contrast already checked in the design system.
- **Animate only transform and opacity.** These stay smooth at 60 fps on cheap Android phones. Test on an older phone, not just a new iPhone.
- **Keep it light.** Load Lottie, confetti and sounds only when first needed, and cache them offline with the service worker. Aim for the first screen in under 2 seconds on 4G.
- **Celebrate effort, never shame.** No sad animations, broken-streak alarms or loud failure sounds, in line with the no-guilt rule from the engagement plan.
- **Check every free asset's licence.** Kenney and Open Peeps are CC0. LottieFiles animations vary by creator, so keep a simple credits list in Settings.

Tool links in this doc go to each project's own page. Research points (response times, peak-end, goal-gradient) are well-established findings summarised from memory, not re-checked today.

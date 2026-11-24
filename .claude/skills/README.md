# Validation skills

Claude Code loads every folder here automatically when it is started inside this repo, so they show up as `/skill-name` commands. Each one is an unmodified copy of an open-source skill (licence file kept in each folder). Used by `VALIDATION_GOAL_PROMPT.md`.

| Skill | Checks | Source (commit) | Licence |
| --- | --- | --- | --- |
| `nielsen-heuristics-audit` | Usability: Nielsen's 10 heuristics | github.com/mastepanoski/claude-skills (ac30238) | MIT |
| `accessibility` | WCAG 2.2: keyboard, screen reader, contrast, touch targets | github.com/addyosmani/web-quality-skills (afa8da9) | MIT |
| `webapp-testing` | Drives the real app in Playwright: flows, console errors, screenshots | github.com/anthropics/skills (e4bb5d9) | Apache 2.0 |
| `react-best-practices` (shows as `/vercel-react-best-practices`) | React performance and code quality: bundle size, re-renders, localStorage schema | github.com/vercel-labs/agent-skills (5a37a63) | MIT (stated in the skill and the repo README) |
| `diagnose` + `verify` | Root-cause fixing, then proof before saying "fixed" | github.com/takleb3rry/claude-global-appbuilding-skills (e234f4e) | MIT |

To update one, copy the newer folder from its source repo over the old one.

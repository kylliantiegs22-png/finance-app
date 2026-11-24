# Validation skills

Claude Code loads every folder here automatically when it is started inside this repo, so they show up as `/skill-name` commands. Each one is an unmodified copy of an open-source skill (licence file kept in each folder). Used by `VALIDATION_GOAL_PROMPT.md`.

| Skill | Checks | Source (commit) | Licence |
| --- | --- | --- | --- |
| `nielsen-heuristics-audit` | Usability: Nielsen's 10 heuristics | github.com/mastepanoski/claude-skills (ac30238) | MIT |
| `accessibility` | WCAG 2.2: keyboard, screen reader, contrast, touch targets | github.com/addyosmani/web-quality-skills (afa8da9) | MIT |
| `webapp-testing` | Drives the real app in Playwright: flows, console errors, screenshots | github.com/anthropics/skills (e4bb5d9) | Apache 2.0 |
| `best-practices` | Security, console errors, deprecated APIs, code quality | github.com/addyosmani/web-quality-skills (afa8da9) | MIT |
| `diagnose` + `verify` | Root-cause fixing, then proof before saying "fixed" | github.com/takleb3rry/claude-global-appbuilding-skills (e234f4e) | MIT |

To update one, copy the newer folder from its source repo over the old one.

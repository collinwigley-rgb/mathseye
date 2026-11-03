# Study guide UX audit (designing for a 12-year-old with ADHD)

Audited: `public/study/unit-2.html` (built by `tools/build_unit2_study.py` from `tools/unit2_template.html`).

## Principles used
1. One main action per screen. Help tools live behind a button, not beside the problem.
2. Small finish lines (5-problem missions), visible progress, a clear stopping point.
3. Quick, quiet wins. Nothing goes down. No timers on problems.
4. Short text first, detail on request ("Tell me more").
5. Big targets (>= 56px for actions, >= 66px for keys), no sideways scrolling, text >= 14px (body 19px).
6. Resume where she left off. Optional break after a mission.

## Findings in v1 and fixes in v2
| Problem in v1 | Fix in v2 |
| --- | --- |
| Opened on a wall of 7 text cards | Home has one big button: Start a mission |
| 44 problems in one list | 5-problem missions, mixed across lessons |
| 4 equal buttons on every problem | I'm stuck + Help; Why and Dependencies moved into a sheet |
| Why panel with 5 headings | Two short lines first, Tell me more for the rest |
| Tabs and chips visible while solving | Focus mode: only dots, the problem, and the keypad |
| No celebration or closure | Win message with the answer, mission summary, optional 2-minute break |
| Restarted at problem 1 | Mission progress and solved problems are saved on the device |
| Smallest text 13px; fraction tip crowded keypad | 14px minimum; spacing fixed; Check is a full-width button |

## Automated checks (re-run after any change)
Playwright run on iPad portrait (dark) and phone (light): full 5-problem mission, I'm stuck, Help menu, Why sheet, summary.
Results: 0 console errors, 0 targets under 44px, 0 horizontal scroll, 3 non-keypad actions on the problem screen.

## Still to learn from real use (ask her)
- Does 5 problems feel like the right size, or 3?
- Is "I'm stuck" the right wording?
- Does she want sound or a streak? (Left out on purpose.)

# MathsEye Unit Lessons — Product Brief

Nov 3, 2026 · @Collin · Live doc: https://claude.ai/artifact/GHJwUJ3RPNxgNRNtVb7HSG

## Overview & goals

Unit Lessons turns each module of a 7th grade pre-algebra class into a short, self-paced unit on the iPad: learn each skill, practice it, and walk into the module test prepared. It is the companion to MathsEye MathFacts, which drills mental-math speed; Unit Lessons covers understanding and multi-step problem solving.

**Goals**

- Mirror her class: every unit is built from the actual worksheets for that module, in the same order and vocabulary
- Explain each skill in plain words with a worked example she can step through at her own pace
- Find the skills she is shaky on before the test, not after
- Make test week calmer with a ready-made review that looks like the real test

**Success looks like**

- She opens the unit on her own during the module, not only the night before the test
- Every skill in the module reaches "ready" before test day
- Module test scores rise from the Quarter 1 baseline
- She says the test problems looked familiar

**Non-goals for v1:** accounts, grades or scores shared with school, teacher dashboards, video lessons, and diagnostic or ability labels of any kind.

## Content: units built from her worksheets

Each unit is one school module. The parent drops that module's PDF worksheets into the repo (`content/units/<module>/sources/`), and Claude turns them into a unit file. The unit follows the worksheets' order and wording, but every practice problem is new, so she can't recall the answer from homework. Content is data (JSON), not code, so a new module is a content change only.

| Part | What it holds |
| --- | --- |
| Unit | Module number and name, quarter, test date, list of skills |
| Skill | Name in the worksheet's words, "I can" statement, source worksheet and page, key vocabulary |
| Explainer | 2–4 short steps in plain words, one worked example revealed step by step, an optional visual |
| Practice set | 8–12 problems from easy to test-level; each has an answer, accepted forms, a 3-level hint ladder, and a full worked solution |
| Common mistake | The 1–2 errors students usually make on this skill, shown as "Spot the mistake" problems |
| Unit review | 15–25 mixed problems in test format, with an answer key |

**First unit:** Module 2, Quarter 1. Its test is two days out, so it ships first as a stand-alone study guide (explainers, practice, and a printable practice test with answer key), then is converted into the app format.

## Core experience

A unit opens to a skill map: one tile per skill, in worksheet order, each showing Not started, Practicing, or Ready. She can do skills in any order; the next suggested one glows.

**A lesson (10–15 minutes, one skill)**

1. **Explain:** the "I can" statement, then 2–4 short steps. The worked example reveals one step per tap.
2. **Try together:** 2 problems where each step has a blank to fill in.
3. **Practice:** 6–10 problems on her own, easy to test-level. Answers are typed on the shared MathsEye number pad, plus a variable key (x) and multiple choice where the worksheet uses it.
4. **Spot the mistake:** 1–2 worked solutions with one wrong step; she taps the wrong step.
5. **Check-in:** 3 fresh test-level problems with no hints. 3 of 3, or 2 of 3 twice, marks the skill Ready.

**Hints** use the same idea as MathFacts: a question nudge, then the first step, then the full worked solution followed by a similar problem she solves alone. Hints never count against her; they only mean the skill stays in Practicing a little longer.

**Scratch work:** a blank scratch area beside each problem for finger or Apple Pencil writing. It is never graded or saved.

**Test Prep mode (unlocks 3 days before the test date)**

- A day-by-day plan: skills still in Practicing come first, then a mixed review
- A full practice test in the class's format, untimed by default, with a worked answer key afterward
- Missed problems link straight back to that skill's explainer
- A one-page printable study sheet: each skill's steps and one worked example

## Progress, parent view, and MathFacts link

**What she sees:** the skill map with Not started / Practicing / Ready, a countdown to the test date, and "You've got this" when every skill is Ready. Never a red X, a score that goes down, or a grade.

**Parent view** (behind the same 4-digit PIN as MathFacts)

- Per skill: status, problems tried, hint level usually needed, and the last 3 check-in results
- The skills most likely to need help before the test
- Controls: set the test date, mark a skill Ready or reset it, unlock Test Prep early, print the study sheet

**Link to MathFacts:** each skill can name the MathFacts tricks it relies on (for example, integer sign rules for an integer operations skill). When she keeps missing a step that a trick covers, Unit Lessons suggests that trick, and the parent can unlock it in MathFacts. Both apps share one home screen icon, one number pad, one look, and one on-device progress store.

## Design

Unit Lessons is a daytime and homework-time app, so it gets a brighter version of the MathsEye look than the bedtime MathFacts theme, with a dark mode that matches MathFacts.

- Pop-stage energy, toned for focus: bold type, one bright accent per screen, plenty of space
- Problem text at least 28pt; number pad keys at least 64pt; works in landscape and portrait
- Step-by-step reveals instead of walls of text: one idea per screen
- Wrong answers get a gentle shake and a hint offer; correct answers get a small, quiet animation
- Copy is encouraging and plain ("That step is clicking now"); no diagnostic or ability labels
- Inspired by the K-pop stage vibe, never the band's name, logo, or images

## Technical approach and scope

Unit Lessons lives in the same `mathseye` repo and PWA as MathFacts, as a second section of one app, so it shares install, offline support, storage, the number pad, and deploys.

- Vite + React + TypeScript; same service worker and GitHub Pages deploy
- Units in `content/units/<module>/unit.json`, validated by a schema; source PDFs kept beside them in `sources/`
- Problems are fixed lists written from the worksheets, with optional generators for skills like integer operations
- Answer checking reuses MathFacts' equivalent-form checker, extended for simple expressions (2x + 3) and multiple choice
- Progress on the device, shared with MathFacts

**Phase 0 (now):** Module 2 study guide as a printable, iPad-friendly page for this week's test.

**Phase 1 (MVP):** skill map, the five-step lesson flow, hints, check-ins, Module 2 converted to the unit format.

**Phase 2:** Test Prep mode, parent view, scratch area, the link to MathFacts tricks.

**Phase 3:** a process for turning each new module's PDFs into a unit in one session, and a past-units review.

**Open questions**

- What topics and format does Module 2's test use (multiple choice, show-your-work, or both)?
- Which curriculum is the class using (for example, Illustrative Math, Big Ideas, Eureka)? Its module names would match the units.
- Should Apple Pencil scratch work be saved for the parent to look at, or always thrown away?

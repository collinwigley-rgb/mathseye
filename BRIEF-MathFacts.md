# MathsEye MathFacts — Product Brief

Nov 3, 2026 · @Collin · Live doc: https://claude.ai/artifact/MYTGuNKcaybRQp5EqfzhXD

## Overview & goals

Build an iPad flash-card app that teaches 7th grade pre-algebra math facts through mental-math tricks, used in one 15–20 minute session each night before bed. The learner is a 7th grader who reaches for a calculator by default: allowed on homework, not on tests. The app's job is to make doing it in her head faster and more confident than reaching for the calculator.

**Goals**

- Teach a growing library of tricks (divisibility, decimal shifting, break-it-apart, percent shortcuts) that map to her 7th grade workbook
- Build fluency through spaced repetition so learned tricks stay sharp
- Build the habit of spotting which trick fits a problem, which is what transfers to tests
- Fit a calm bedtime routine: short, quiet, always ends on a win

**Success looks like**

- She completes a session on most nights without prompting
- Mixed-practice accuracy without clues rises week over week
- Mental-math time beats the estimated calculator time on mastered tricks
- Test-day problems feel familiar because Test Mode looks like a test

**Non-goals for v1:** accounts, multiplayer, leaderboards, ads, teacher dashboards, and diagnostic labels of any kind. All language is framed as learning how you learn.

## Content: trick library

Content is organized as **tricks**, each with its own deck of practice cards. New tricks unlock about two per week, in an order that follows her workbook. The parent can reorder or unlock tricks manually. Store all content as data files (JSON), not hard-coded, so new tricks can be added without code changes.

| Trick | Example | Pre-algebra tie-in |
| --- | --- | --- |
| Move the decimal | 5.6 ÷ 10 = 0.56; 0.3 × 100 = 30 | Decimals, scientific notation prep |
| Divisibility by 2, 5, 10 | Last digit check | Factoring, simplifying fractions |
| Divisibility by 3 and 9 | 156 → 1+5+6 = 12, divisible by 3 | Factoring, simplifying fractions |
| Divisibility by 4, 6, 8 | 4: last two digits; 6: by 2 and 3 | GCF and LCM |
| Fact families | 99 ÷ 11 = 9, so 11 × 9 = 99 | Inverse operations, solving equations |
| Times 5 and 25 | 48 × 5 = 480 ÷ 2 = 240 | Mental computation |
| Times 9 and 11 | 23 × 11 = 253; 7 × 9 = 70 − 7 | Mental computation |
| Break it apart | 7 × 48 = 7 × 50 − 7 × 2 = 336 | Distributive property |
| Near-squares | 19 × 21 = 20² − 1 = 399 | Squares, distributive property |
| Perfect squares and roots | 13² = 169; √144 = 12 | Exponents, Pythagorean prep |
| Integer sign rules | (−6)(−4) = 24; same signs give a positive | Integer operations |
| Subtracting a negative | 5 − (−3) = 5 + 3 | Integer operations |
| 10% then build | 15% of 60 = 6 + 3 = 9 | Percents, tax, tip, discount |
| Percent swap | 8% of 50 = 50% of 8 = 4 | Percents |
| Fraction benchmarks | 1/8 = 0.125 = 12.5% | Rational number conversions |
| Ninths repeat | 4/9 = 0.444… | Repeating decimals |
| Divide by a fraction | 6 ÷ 1/2 = 6 × 2 = 12 | Fraction operations |
| Cancel first | (3/4)(8/9) → cancel to (1/1)(2/3) | Fraction multiplication |
| Estimate first | 4.9 × 21 is about 100 | Reasonableness checks |
| Unit rate | $6 for 4 = $1.50 each | Ratios and proportions |

**Each trick record holds:** id, name, one-line rule, a worked example, a "why it works" explanation (with an optional link to a visual on the companion visual math site), its workbook section, a problem generator or a fixed problem list, and a clue ladder template.

**Problem generators** create fresh problems with parameters per trick (for example, two-digit × 11, or a three-digit number with digit sum divisible by 3). Generators include near-miss distractors (for example, 157 for divisibility by 3) so she has to check, not guess.

## Core experience

Every answer is typed on a large on-screen number pad, never self-graded. The pad includes negative sign, decimal point, fraction bar, and yes/no keys for divisibility cards.

### Card types

| Type | Purpose | Shows trick name? |
| --- | --- | --- |
| Trick card | Teaches the rule, one worked example, a "Show me why" button | Yes |
| Use-it card | Practice problems built for that trick | Yes |
| Spot-the-trick card | She picks which trick fits from 3–4 choices, then solves | No |
| Mixed card | A test-style problem with no hint of which trick applies | No |
| Estimate card | "About 50 or about 500?", answered by tapping a choice | No |

### Clue ladder

A lightbulb button sits beside the number pad. Each tap reveals the next level, one line at a time, while the problem stays visible.

1. **Question nudge:** a question, never a statement ("What do you notice about 48?")
2. **Name the trick:** "Try breaking it apart."
3. **First step:** "7 × 50 = 350. Now what?"
4. **Show me:** the worked solution, followed right away by a similar card she solves alone

Rules:

- Clues are never penalties. Using one only shortens the card's review interval.
- Level 4 unlocks only after a submitted attempt or 15 seconds on the card.
- Clues fade with mastery: once a trick reaches Box 4, level 2 asks "Which trick fits?" instead of naming it.
- Log the highest clue level used per card attempt.

### Nightly session (15–20 minutes)

1. **Warm-up (about 3 min):** due review cards from spaced repetition
2. **New trick (about 5 min):** a trick card, then 5–8 use-it cards. Skip this step when no trick is unlocked; the time moves to mixed practice.
3. **Mixed practice (about 7 min):** spot-the-trick, mixed, and estimate cards across every learned trick
4. **Beat the Calculator (about 2 min):** a race against a ghost timer (see next section)
5. **Finish on a win:** one easy mastered card, a short summary, then the session closes

The session hard-stops at 20 minutes and offers no "one more round." A session can be paused and resumed the same night.

### Spaced repetition

Use a five-box Leitner system per card template, per trick.

| Box | Review again in |
| --- | --- |
| 1 | Same session |
| 2 | 1 day |
| 3 | 3 days |
| 4 | 7 days |
| 5 (mastered) | 14 days |

A correct answer with no clue moves the card up one box. A correct answer with clue level 1–2 keeps it in place. A wrong answer or clue level 3–4 sends it to Box 1. A trick counts as mastered when 80% of its cards are in Box 4 or 5.

## Calculator habit, progress, and parent view

The app shows her, with her own numbers, that her head is faster than the calculator on mastered tricks.

**Beat the Calculator**

- A 2-minute round of mastered-trick problems
- Each problem shows a ghost bar for estimated calculator time: 2 seconds plus 0.8 seconds per key press needed to type it
- She sees "You: 3s · Calculator: 7s" after each answer
- Personal best per round is saved

**Test Mode** (weekly, parent-triggered or Sunday by default)

- 15 mixed problems, no clues, no trick names, no timer pressure shown
- Results feed the confidence meter, not the Leitner boxes

**What she sees**

- A nightly streak that forgives one missed night per week
- A mastery bar per trick
- A "mental math confidence" meter: no-clue accuracy on mixed cards over the last 7 sessions
- Never a red X, a lost life, or a score that goes down

**Parent view** (behind a 4-digit PIN)

- Sessions per week and minutes per session
- Per trick: mastery %, average clue level needed, average time vs. calculator time
- The five stickiest cards (most Box 1 returns)
- Controls: unlock or reorder tricks, set the workbook section, toggle Sprint timers, trigger Test Mode
- Export progress as JSON for backup

## Design

The app is designed for bedtime: dark, warm, quiet, and calm.

**Layout (iPad, landscape and portrait)**

- Problem centered in large type (at least 48pt)
- Number pad on the right in landscape, bottom in portrait; keys at least 64pt
- Lightbulb clue button beside the pad; clue text appears under the problem
- Small progress dots at the top for session stage; no countdown clock unless Sprint timers are on

**Bedtime-friendly UI**

- Dark warm theme by default (deep navy or charcoal, amber accents); no pure white backgrounds
- Sound off by default; optional soft tones only
- A wrong answer gets a gentle shake and "Try again" or a clue offer, never red flashes
- Correct answers get a small, quiet animation
- No notifications, badges, or streak-loss warnings

**Tone of copy:** encouraging and plain. Use "Nice, that trick is getting faster" rather than "Wrong!" or "Amazing!!!" No diagnostic or ability labels anywhere.

## Technical approach and scope

The recommended build is an offline-first Progressive Web App (PWA) installed to the iPad home screen. It needs no Mac, no App Store, and no developer account, and it can share content with the visual math site.

**Stack (suggested; Claude Code may adjust)**

- Vite + React + TypeScript, Tailwind for styling
- Service worker for full offline use; web app manifest for home-screen install and full-screen mode
- IndexedDB (via Dexie) for all progress; no backend, no accounts in v1
- Trick content in `/content/tricks/*.json`, validated against a schema at build time
- Vitest for the scheduler, generators, and answer checking

**Data model**

| Entity | Key fields |
| --- | --- |
| Trick | id, name, rule, example, why, workbookSection, unlockOrder, generator, clueTemplates |
| CardTemplate | id, trickId, type, params, answerFormat |
| CardState | templateId, box, nextDue, lastSeen, attempts |
| Attempt | cardId, timestamp, answer, correct, msToAnswer, clueLevel |
| Session | id, date, startedAt, endedAt, stagesCompleted, cardsSeen |
| Settings | unlockedTricks, currentSection, timersOn, parentPin |

**Answer checking:** accept equivalent forms (0.5, .5, 1/2 where allowed, −3 and -3). Each card template declares accepted formats.

**MVP (phase 1)**

- [ ] PWA shell, offline install, dark theme
- [ ] Number pad and answer checking
- [ ] Trick, use-it, and mixed card types
- [ ] Clue ladder (all four levels)
- [ ] Leitner scheduler and the nightly session flow with the 20-minute stop
- [ ] First 4 tricks: move the decimal, divisibility by 3 and 9, integer sign rules, break it apart
- [ ] Local progress saving

**Phase 2:** spot-the-trick and estimate cards, Beat the Calculator, Test Mode, parent view, the full trick library.

**Phase 3:** "Show me why" links into the visual math site, workbook-section syncing, JSON export and import.

**Open questions**

- Is the iPad the only device she'll use? If yes, PWA stays the plan. A native SwiftUI app would add Apple Pencil handwriting but needs a Mac and a $99/year developer account.
- Which workbook section is she on now? That sets the first unlocked tricks.
- Where will it be hosted for install (for example, GitHub Pages or Netlify)?

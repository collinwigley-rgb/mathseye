# Review scopes (midterms, semester exams, cumulative review)

Status: PLAN. Nothing here is built yet because the school has not said what each midterm and the Semester 1 exam cover.
The framework is already shaped so this can be added without reworking units. When the scope is known, this is the path.

## What is already in place
- **The calendar** (`src/terms.json`): every term, its semester, and its midterm window. Semester 1 = Terms 1 + 2 (ends 2027-01-22); Semester 2 = Terms 3 + 4.
- **Units belong to terms** (`src/units.json` `term`). Unit 2 = Term 1, Unit 3 = Term 2. A scope that spans terms therefore spans units.
- **Each unit is self-contained** with its own saved data (`mathseye.unitN.study.v2`, `mathseye.hw.unitN.v1`), so mixing units never touches another unit's progress.
- **Flash Cards** are generated per lesson and can mix any lessons or units. **MathFacts** already has "this unit's facts" vs "any facts".

## What a scope is
One entry per exam window, added to `src/terms.json` when the school says what it covers:

```json
"scopes": [
  { "id": "midterm-2", "label": "Midterm 2", "term": 2, "window": "midterm", "covers": { "2": "all", "3": ["3.1", "3.2"] } },
  { "id": "semester-1", "label": "Semester 1 exam", "term": 2, "covers": { "2": "all", "3": "all" } }
]
```
`covers` maps a unit to "all" or a list of lessons. (Lessons arrive week by week, so "all lessons taught so far" is also an option: `"3": "taught"`.) Until the school confirms, there are no scopes and the app behaves as it does today.

## How each module takes a scope
| Module | How it mixes | Work |
| --- | --- | --- |
| Flash Cards | `cardsFor(unit, lessons)` takes a list of (unit, lesson) pairs instead of one unit. A "Review" choice on the setup screen. | small |
| MathFacts | Already has "any facts". A scope can name the tricks to feature (union of the covered units' tags). | small |
| Study Guide | A generated **review page** per scope (`tools/build_review.py <scope>`): same engine and templates, problem pool = the covered units' problems, practice test = 2 per lesson across the units. Each problem keeps its unit's reference number. | medium |
| Progress | Answers on a review page also count toward each problem's own unit (`solved`/`clean`/the come-back list), so nothing is "re-done" and no unit's status goes backwards. The review page keeps only its own set-in-progress and test history under `mathseye.review.<scope>.v1` (a new key, synced as a new section). | medium |
| Homework | Not part of review (it is for the week's worksheets). | none |
| Main page | When today is inside a scope's window (or the player taps it), a "Review" entry appears beside the Unit switch, e.g. "Midterm 2 review". The term line already shows when the midterm ends. | small |

## Decisions needed from the owner (not before the school says)
1. What each midterm and the Semester 1 exam cover (units, or lessons through a date).
2. Whether review practice should count toward each lesson's status ("Getting there" / "Strong"), or stay separate. Default proposed above: it counts, and never lowers anything.
3. Whether the practice test for a scope should be longer than 14 questions.

## Order of work when it is time
1. Add the scope to `src/terms.json` (+ a check in `tools/check_units.py` that every covered lesson exists).
2. Flash Cards and MathFacts accept a scope (small, ships first).
3. `tools/build_review.py` and the review page; reuse `tools/study_template.html` unchanged where possible.
4. Main page entry; sync section; tests (key names, merge, no unit's progress changes).

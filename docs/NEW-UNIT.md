# Starting a new unit (and retiring an old one)

Each unit is self-contained: its own lessons, practice problems, pages, saved-data keys and flash cards. The framework is generic; only
`tools/units/unitN.py` and the unit's sheets are unit-specific. Unit 2 is the worked example. (Status and decisions: `docs/STATUS.md`.)

## Start of a unit
1. **Sheets (public):** write `content/units/unit-N/N.x.md` from the week's PDFs (template: `content/units/TEMPLATE.md`; shapes and original examples only, never the worksheet's words or answers). Each sheet's vocabulary table and "Big idea" line become flash cards automatically (`python3 tools/build_cards.py`).
2. **Unit list:** add the unit to `src/units.json` (`id`, `label`, its `lessons`, `ready`, and which `features` exist: facts, cards, study, homework). Set `current` to switch everyone to it. A tile for a feature that is `false` shows "Coming soon".
3. **Unit module:** copy `tools/units/unit3.py` to `tools/units/unitN.py`: `UNIT`, `LABEL`, `SUBS`, `LESSONS`, `CONCEPTS`, `BASE`, `FOCUS`, `PROBS`/`GENS` (original problems with fresh-number variants), `SOLVE` (an independent re-solve of each variant from its text), `shortcut`, `facts_text`. Reference numbers: pick a free block (`REF_START`..`REF_LIMIT`; Unit 2 = 1001-4999, Unit 3 = 10001-14999; worksheet problems are 5001+). New problems are always appended at the end of `PROBS`.
4. **Build:** `python3 tools/build_unit.py N` writes `public/study/unit-N.html`, `public/homework/unit-N.html`, `content/units/unit-N/practice.json` and `refs.json`. Use `--out DIR` for a test build that must not touch the repo. Gate: `python3 tools/test_unit_variants.py N` (add it to `check:all`).
5. **Saved data:** Unit 2 keeps its original names. Unit N (N >= 3) uses `mathseye.unitN.study.v2` and `mathseye.hw.unitN.v1`, synced as sections `studyN` and `hwN`: add N to the list near the top of `public/sync.js` (profile keys follow `src/units.json` automatically). `tools/check_units.py` fails if a unit offers pages that are not synced or not precached (`public/sw.js` list).
6. **Homework pack (private repo):** `problems/unit-N/`, `learn/unit-N/`, `images/unit-N/`, then `python3 tools/ship.py N` (it already takes the unit number).
7. **Switch on:** set the unit's `features.study` / `features.homework` to `true` only when the pages exist and have been previewed as "collin".

Each lesson in `src/units.json` can carry `week`: the school week it is taught (Week 1 starts Mon 2026-09-07; Week 10 = 11/9-11/13 = lessons 3.1 and 3.2). `check_units.py` keeps it inside the unit's term. Review scopes (`docs/REVIEW-SCOPES.md`) can then mean "every lesson taught so far".

## Quarter switch (retiring a unit)
The school calendar is `src/terms.json` (terms, semesters and midterm windows, from the school's grading periods). Each unit in `src/units.json` has a `term`. **Which unit everyone starts on follows the date**: the ready unit whose term contains today (`unitForDate` in `src/terms.ts`). Between terms the last unit stays; a term with no ready unit yet keeps the newest ready one (`current` in `src/units.json` is that fallback). So a new term switches by itself on its first day, as long as the new unit is `ready`. Nothing is deleted: the old unit stays on the Unit switch with every section working, and her progress for it stays on the device and the server (keys are never renamed or removed). To take a unit off the switch entirely, set its `ready` to `false` (its pages and data stay in place and reachable by address). A player who picked a unit on purpose keeps their pick.

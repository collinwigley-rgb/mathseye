# Growing the Study Guide (the loop)

Unit 2's study guide was built by hand: a base problem per skill (`unit2_problems.py`), fresh-number variants (`unit2_variants.py`), "try this in your head" builders (`unit2_shortcuts.py`) and an independent re-solve gate. Unit 3 uses the same ideas in one shape: **a problem family**. A family is one generator that makes a new version of a problem every time (fresh numbers, same skill and the same trap), so adding practice means adding a family, nothing else.

## Add a family (about 10 minutes)
1. **Pick the gap.** `python3 tools/study_coverage.py 3` lists each lesson's families, how many variants each makes, which have a head-shortcut and which concepts are practiced by only one family (or none). Also look at the players' "Flag a problem" notes and the Study "come back" list for what she misses.
2. **Scaffold.** `python3 tools/new_family.py 3 3.3 "price after a markup"` appends a stub to `tools/units/unit3_more.py`.
3. **Fill in the stub** (see `g_discount` there as the worked example):
   - `@family(U, sub, concepts=[...], seed=N, solve=...)`: `concepts` are tags from `CONCEPTS` (the "builds on" chips; add one to `unit3.py` first if the skill is new), `seed` fixes the base problem forever, `solve` re-derives the answer **from the problem text** with separate arithmetic (use `solve_choice=` for multiple choice).
   - The generator returns `numv(text, answer, hints, steps, ...)` (or `chv`). Answers are computed with Fractions, never typed. Exactly 3 hints (a nudge, the method, the setup; never the answer) and 2+ steps (shown only after she has tried).
   - Choose numbers so every answer is clean (a few decimal places at most). Percent answers carry `pct=True, show="72%"`.
   - Optional `shortcut=`: a builder in `unit3_shortcuts.py` for a "Try this in your head" line. It must re-compute its own method and raise if it disagrees with the answer.
4. **Build and gate.** `python3 tools/build_unit.py 3 && npm run check:all`, then `python3 /home/user/mathseye-content/tools/audit.py leak .`. `check_families.py` checks shape and variety (3 hints, 8+ distinct variants, no stray placeholders); `test_unit_variants.py` checks every variant's answer from its text.
5. **Look at it as "collin"** (Study Guide, pick the lesson, DEV chip), commit, push, and log it in `docs/STATUS.md`.

## Rules that keep it safe
- **Ids are append-only** (`U3-NN`, reference numbers 10001+). Never reorder, reuse or change a family's seed or text rules after it ships; make a new family instead.
- **Original wording only.** Same skill as the worksheet, never its words, numbers or answers (the leak audit blocks the push).
- **Saved progress** is keyed by problem id, so a new family just shows up as "not started". Nothing she has saved changes.
- A lesson's `FOCUS`/`LESSONS` entry (`unit3.py`) is what the page says about the lesson; a new lesson needs those, a row in `src/units.json`, and its own families.

## When the real test review arrives
Build the review the same way: add families tagged to the lessons it covers, then use the review scopes in `docs/REVIEW-SCOPES.md` (every lesson taught so far, the midterm window, the semester).

## Standard: four hints on every problem
Every Study Guide family, and every homework problem in the private pack, has **exactly four nudges, in this order**: (1) what to look at, (2) the method, (3) the setup, (4) a last-resort different way in: an estimate or size check, a break-apart (130% = 100% + 30%), or what to compare. A hint never states the result. `check_families.py` (public) and `verify_unit3.py` (private, `tools/unit3_hint4.py`) fail a problem with fewer. The app shows however many a problem has; nothing in the templates assumes three.

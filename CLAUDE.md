# Mathseye

Math apps for a 7th grade pre-algebra student. iPad-first PWAs, also work in any browser.
The name is a play on a band she loves. Branding is *inspired by* that band's look, with the owner's approval (see `docs/BRANDING.md`).
Never copy the band's logo, wordmark artwork, photos or faces, or lyrics, and don't put the band's name in the UI.
Song titles are fine to use (owner's call; this is a private family app). Practice-test rewards use them: a better grade gets a more popular song. The list is `mathseye-content/rewards/songs.json`, uploaded by `tools/ship.py`, served at `/api/songs`, cached on the device by `public/songs.js`.

## Start of every session
1. Read `docs/STATUS.md` (what's done, what's next).
2. Check open GitHub Issues labeled `change-request`. That's the work queue.
3. When you finish something, update `docs/STATUS.md`, commit, push, and close or comment on the issue.
   Keep commits small so work survives running out of tokens.

## Structure (home screen = hub)
Three sections plus a color picker. Unit label comes from `settings.currentUnit` (default 2).
- **Players** (`src/profile.ts`, `public/profile.js`): a name chip sits top right on every screen (picker: switch or add a player, plus the build stamp `#count · sha · date` from `vite.config.ts`, also shown at the foot of the study and homework pages; on the static pages it opens the picker on the home screen). The app asks "Who's using?" only until someone is chosen, then sticks with the last player. Each player's progress is stored under its own key suffix (MathFacts, study guide, homework done-marks); the first player adopts pre-profile data. Names live only in the device's localStorage, never in the repo. Add/remove players in Grown-ups.
- **Cloud sync** (`public/sync.js` client, `worker/index.js` server, KV `NOTES` with keys `p:<name>`): each player's progress (MathFacts, study guide, homework done-marks; never the worksheet pack) is saved by lowercased name, no password (owner decision). `sync()` does fetch, merge, write locally, PUT; it runs when the hub opens, when a player is chosen, 8 s after any save (`touch()`), when the app is hidden and when back online. Things that only grow are unioned; settings, the come-back list and the plan come from the newer side; a reset (`mathseyeSync.reset(section)`) beats older copies elsewhere; a half-finished set stays on its device. The Who screen and name menu also list names that exist only on the server. Merge logic is unit-tested in `src/logic.test.ts`.
- **MathFacts** (React, `src/`): self-paced. Start practice = setup screen: Keep going vs Set a time (5-30 min; queue sized from her own pace, `secondsPerCard`), and Surprise me vs I'll pick (multi-select facts). Selection favors unseen and weak facts (`trickNeed`/`templateNeed` in `src/session.ts`). Every fact is open from the start (owner dropped the one-new-fact-per-night drip). She picks Keep going / Practice mix / Learn new facts, or taps any fact. Sessions are shuffled and vary in length and wording (`buildQueue` in `src/session.ts`). Switch between this unit's facts and any facts (`settings.factsMode`; tricks carry `units` in `content/tricks/*.json`).
- **Study Guide** (`public/study/unit-2.html`): test prep, original problems only. Setup card: Set a time (10-30 min, about 2 min per problem) or Keep going (endless, I'm done ends it), Everything or I'll pick lessons (Unit 2 · Lesson 2.x), and A mix / New ones (never opened, `save.seen`) / Need work (the come-back list). Sets are spread across the chosen lessons, with a spaced-review slot where a solved problem returns with new numbers. Every problem is labeled with its unit and lesson. Each lesson shows a plain status (Not started yet / Just started / Worth practicing / Getting there / Strong) from her last 8 solved problems (`lessonStatus` in the study template: tries, hints, time), and mixed sets favor lessons that need work. A problem answered wrong or helped (I'm stuck) goes on `save.work` and comes back first, with new numbers, until she has 3 clean solves in total, right with no miss and no help (`flagWork`/`pickBatch`). A later miss or hint never takes a clean solve away.
- **Unit Homework** (`public/homework/unit-2.html`): guides her through the real worksheet problems. The worksheet pack is NEVER in this repo: it is built in the private repo (`mathseye-content/tools/build_pack.py`), uploaded to the Worker's KV with `mathseye-content/tools/publish_pack.py N` (key `pack:unit-N`, served at `/api/pack?unit=N`, no key: family-and-friends app) and fetched by the page itself, then kept on the device for offline. The pack never goes in git. "Generate alternate" uses the original practice problems for the same lesson and kind.
- **Flag a problem** (`public/feedback.js` on the client, `worker/index.js` on the server): a small "⚑ Flag a problem" on every problem opens a sheet (quick tags + a note). The note posts to `/api/feedback` on the Cloudflare Worker, which stores it in the `NOTES` KV namespace (created on first deploy from `wrangler.jsonc`, no id). Offline notes wait on the device (`mathseye.feedback.v1`, `sent:false`) and retry. Grown-ups lists the notes from the server (Done deletes one). Optional: set a Worker secret `ADMIN_KEY` to require a grown-up key for reading/deleting; without it the list is open. The Worker serves everything else from `dist` (`ASSETS`).
- **Mental shortcuts** ("Try this in your head" in the Math facts sheet): `tools/unit2_shortcuts.py`. Each family of problems has a builder that reads the numbers off the text of the problem or its new-numbers version, writes short steps for a 12 year old and never works out the answer. The builder re-computes the described method with Fractions and raises if it does not equal the real answer, so a wrong shortcut cannot build. Yes/no, graph and table problems have none (hints cover them). `tools/test_unit2_shortcuts.py` (in `check:all`) checks wording and that no shortcut gives the answer away. To add a family: write `_uNN`, register it in `BUILDERS`.
- Both static pages are generated by `tools/build_unit2_study.py` (templates: `tools/unit2_template.html`, `tools/homework_template.html`). Edit the templates, never the generated HTML.
- Colors: single source `tools/brand_themes.py`; see `docs/COLOR-SCHEMES.md` (generated). Logo click goes home everywhere.

- **Developer mode** (`public/dev.js`): when the selected player is named "collin" (the owner), a small DEV chip (bottom-left) offers one-tap "answer right / wrong" on study problems, "fill right/wrong" and "finish the test with 6 wrong" in the practice test, and mark right/wrong in homework. Gate is the name only (family-and-friends app, not security). Pages register actions with `mathseyeDev.set([...])` and clear them in `render()`.

- **Touch and text details** (approved from a before/after review, Nov 2026): text sizes in the study and homework pages are `rem` (root 17px, or the iPad's text-size setting via `font: -apple-system-body`) so they scale; the keypad keys are 56px; `public/press.js` adds a `.pressed` look on touch-down (action still fires on release); the favorite-songs drag opens a gap and settles (skips animation under Reduce Motion). Increase-Contrast and Reduce-Motion theming was reviewed and skipped.
- **Wide landscape layout** (approved from a before/after review, Nov 2026; the girls use 2021 10.2" iPads on a table, landscape, installed PWA, so design for 1080x810 first, portrait only has to not break). One `@media (min-width:900px) and (min-aspect-ratio:1/1)` block in `tools/unit2_template.html` (the homework page shares it): thin header strip (body top padding follows the safe area; "Stop for now" + "n of N" replace the dots; the test bar is hidden), study and practice-test question cards are two columns (`.card.split`, test adds `.tq`: read on the left, keypad and Check/Next on the right, everything fits without scrolling), the hub is two columns (`.cols`), lesson tiles fill the width. Study setup is three rows (How long / Lessons / Problems; `S.row` holds the open one). Colors (six, no "more palettes") and favorite songs live in a slide-out panel opened by the palette icon beside the name chip (`openDrawer`, Esc/outside tap/✕ close). Narrow layouts keep the old single-column order.

## Cloudflare access (autonomous checks)
An account API token ("Edit Cloudflare Workers" template) is saved as a network secret on the owner's Default environment for host `api.cloudflare.com`; the proxy injects it, so call the API with plain `curl` and no header. Never ask for it in chat. Find the account id with `GET /client/v4/accounts`. Useful reads: `/accounts/<id>/workers/scripts/mathseye/deployments` (live version), `/accounts/<id>/workers/scripts/mathseye/settings` (bindings ASSETS + NOTES), `/accounts/<id>/storage/kv/namespaces` (`mathseye-notes`). Deploys happen by pushing to `main`. KV lists lag up to ~30 s after a write.

## Keeping her progress safe (read before touching saved data or sync)
Her progress lives on the iPad (localStorage) and, per player name, on the server. Rules so code changes never cost her work:
- **Never rename or restructure saved keys** (`mathseye.unit2.study.v2`, `mathseye.mathfacts.v1`, `mathseye.hw.unit2.v1`, with the player suffix). Only add fields; old saves must load as they are (a unit test checks the key names).
- **Merge per item, never "newer side wins" for whole lists.** The come-back lists (`work`, `twork`) merge problem by problem using each entry's `u` (last change); clearing a problem leaves a marker (`workDone`, `tworkDone`) so a stale device can neither undo nor resurrect it. `solved`/`clean`/`seen` only grow.
- **Save only on a real change** (`persist` skips identical saves). Opening a page must not make a device look "newer" than another one.
- **Local backups**: the study page keeps `<key>.bak` (previous copy, at most once a minute) and `<key>.day` (first copy of each day), restores from them if the main copy is missing or unreadable (the bad copy is kept as `.corrupt`), and asks the browser for persistent storage.
- **Server snapshots**: before the first overwrite each hour the Worker keeps the previous copy (`ph:<name>:<UTC hour>`, 30 days). `python3 /home/user/mathseye-content/tools/recover_player.py <name>` lists them; `--restore <key>` puts one back.
- Test your own changes as a different player (the owner's "collin"), never on hers.

## Reference numbers (bug reports)
Every problem shows a tiny `#number` in its bottom-right corner. When the owner says "bug in #1899", look it up:
`python3 /home/user/mathseye-content/tools/ref.py 1899` (works for all numbers below).
- **1001-4999**: study guide practice problems and their "new numbers" variants. Registry `content/units/unit-2/refs.json` is append-only: a number never changes meaning; retired problems stay on file.
- **5001+**: real worksheet problems (private registry `mathseye-content/problems/refs.json`).
- **MathFacts cards** show `#<template-id>-<seed>` (e.g. `#bench-dec-48213`): regenerate with `GENERATORS[template.generator](seeded(seed), template.params)`.
- Answer entry: only a plain number (3/2, 1 1/2, 1.5) earns credit. An expression like `(3/4)/(1/2)` is treated as "right setup" with no credit, so she must do the arithmetic. Missing parentheses get a tip.
- Fraction-division problems carry a second method (same-size pieces) in their steps and a "Quick check" (bigger or smaller?) after solving. Where the division result IS the answer they also get a bar-model picture (`barModel` in the study template; shown plain after the 2nd nudge, with groups once solved). Picture data is checked against the answer in `tools/test_unit2_variants.py`.

## Before every push (minimize mistakes)
`npm run check:all` (types, unit tests, color contrast + generated-file sync, independent re-solve of practice variants),
then `python3 /home/user/mathseye-content/tools/audit.py leak .` (no worksheet text or student name in this public repo).

## Math Facts app (root of repo)
- Specs: `BRIEF-MathFacts.md` and `BRIEF-UnitLessons.md` in the repo root (live docs linked at the top of each).
- Stack: Vite + React + TypeScript, plain CSS, localStorage, hand-written service worker (`public/sw.js`).
- Trick content lives in `content/tricks/*.json`. Each template names a generator in `src/generators.ts`
  and has 4 clue strings with `{var}` placeholders filled from the generator's `vars`.
- Leitner scheduler: `src/scheduler.ts`. Session flow: `src/session.ts`. UI: `src/App.tsx`.
- Unit reference sheets: `content/units/` (see its README). Build help, practice, and study guides from these, never the PDFs.
- `npm test` runs Vitest; `npm run build` typechecks and builds. Push to `main` auto-deploys on Cloudflare Workers static assets (build `npm run build`, deploy `npx wrangler deploy` using `wrangler.jsonc`, serves `dist`); `netlify.toml` is kept for the old Netlify site. There is no GitHub Pages workflow: the free plan cannot use Pages for this repo.

## Tone rules (from the brief)
Calm bedtime design: dark warm theme, no red X's, no lost lives, no scores that go down,
no diagnostic or ability labels. Copy is encouraging and plain.

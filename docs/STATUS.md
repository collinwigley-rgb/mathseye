# Status

## Math Facts: phase 1 (MVP) done
- [x] PWA shell, offline service worker, home-screen install, dark theme
- [x] Number pad (−, ., /, backspace) plus yes/no pad; answers accept equivalent forms
- [x] Trick, use-it, and mixed cards
- [x] Four-level clue ladder (level 4 gated; fades at Box 4; follow-up similar card)
- [x] Leitner scheduler and nightly session flow with 20-minute stop and same-night resume
- [x] First 4 tricks: move the decimal, divisibility by 3 and 9, integer sign rules, break it apart
- [x] Progress saved on the device (localStorage); streak, mastery bars, confidence meter
- [x] Basic grown-ups screen: unlock tricks early, stickiest cards (no PIN yet)

## Next up
- [ ] Flash Cards module (branch `flash-cards`, waiting for the owner's OK): Unit 2 deck (41 cards, 75 with flipped ones), spaced review, per-player progress synced. Next: "make your own cards", Unit 3 cards arrive with each week's reference sheets.
- [ ] Unit and lesson picker on the main selector (branch `unit-lesson-picker`, not yet on main: waiting for the owner's OK). Unit list in `src/units.json`; Unit 3 shows as "soon". Study guide takes `?lesson=2.3`, homework takes `?sub=2.3`. Next for Unit 3: parameterize builders, sync keys, service worker, then content week by week.
- [x] Main selector redesigned (Nov 2026): greeting, three icon panels, colors and songs in the slide-out panel; still to check on a real iPad
- [x] Wide-landscape layout for the 10.2" iPad (Nov 2026): thin header, two-column study and test questions, two-column hub, three-row study setup, colors and songs in a slide-out panel; still to check on a real iPad (drag in the panel, press feel)
- [x] Unit 2 reference sheets (2.1–2.8) and study guide in content/units/unit-2/
- [x] Unit 2 interactive study guide at public/study/unit-2.html (v2: missions, focus mode, help sheet; see docs/UX-AUDIT.md)
- [x] MathFacts: 9 Unit 2 tricks added (13 total), reordered by usefulness; all open from the start
- [x] Study guide: "Try a new one" on every problem (422 variants, tools/unit2_variants.py; independent re-solve test: tools/test_unit2_variants.py)
- [x] Reset progress: study guide (bottom of home) and MathFacts (Grown-ups), both ask to confirm
- [x] Branding pass (docs/BRANDING.md): ink navy + butter yellow, eye-and-star mark, serif wordmark, stage-vocabulary nods
- [x] Hub home: MathFacts / Study Guide / Unit Homework, unit label, clickable logo, seven color schemes (docs/COLOR-SCHEMES.md)
- [x] Unit Homework page: imports the on-device worksheet pack, guided nudges, Generate alternate (same lesson + kind)
- [ ] Generate alternate is lesson-and-kind based. A true number-swapped version of each worksheet problem needs a generator per problem (~180).
- [x] Fun pass: member-name color chips (rounded squares), two-tone accents, glow + sparkle dust, star burst on wins (respects reduced motion)
- [x] Reference numbers on every problem (#1001+ practice, #5001+ worksheet, #template-seed for MathFacts); answer entry accepts expressions and has ( ) keys
- [x] Original charm icons on the member chips (moon, sun, cloud, leaf, heart, butterfly)
- [x] Fraction division reinforcement: setup is not an answer, same-size-pieces second method, bigger/smaller quick check, flip-and-cancel unlocks 3rd in MathFacts
- [x] Bar-model pictures for fraction division (study guide + homework alternates)
- [ ] Bar pictures in MathFacts "how many fit?" cards (React app)
- [x] Spaced review: study missions bring a solved problem back with new numbers
- [x] MathFacts self-paced: no nightly unlock drip (owner decision); Keep going / Practice mix / Learn new facts / tap any fact
- [x] More randomization: shuffled, variable-length sessions, varied wording (incl. missing-factor form), random new-fact picks; study missions pick random lessons/problems
- [x] Fractions shown stacked (numerator over denominator): src/Fx.tsx in the app, public/fractions.js on the static pages
- [x] Players: who's-using screen, separate progress per player (MathFacts, study guide, homework marks)
- [x] MathFacts setup: Keep going or timed (5-30 min), Surprise me or I'll pick; smarter selection favors new/weak facts
- [x] Netlify: build skipped for docs-only pushes (credits); batch pushes
- [x] Notes server: Worker + KV stores "Flag a problem" notes (first piece of the cloud; progress sync still to do)
- [x] Cloud sync of progress by name (Worker + KV): see CLAUDE.md. Open: removing a player in Grown-ups only removes it from this device (the server copy stays); no way yet to delete a name from the server list.
- [x] Mental shortcuts for 30 of the 44 problems (336 of 461 with their new-numbers versions), each verified against the answer at build time
- [ ] Unit 3 (waiting on the PDFs)
- [ ] Optional more variety: spot-the-trick and estimate card types
- [ ] Assign the six seasonal palettes to members (owner to say which is whose)
- [ ] Unit 3: upload weekly PDFs, build sheets as they come
- [ ] Phase 2: Beat the Calculator, Test Mode, spot-the-trick and estimate cards, PIN for grown-ups, more tricks
- [ ] Move storage to IndexedDB and add JSON export for backup

## Worksheet pictures (done)
Crops live in the private repo (`images/unit-2`), linked to problems by `tools/link_figures.py` (geometry + text check, gated by `test_figure_links.py`). `publish_images.py N` uploads them to KV (`img:<file>`, served at `/api/img?f=`); `build_pack.py` attaches `img` per problem and `learn` (example/explore/concept pictures per lesson). Homework shows the pictures; the service worker keeps them for offline.
Pilot shipped: 2.8 "Learn it first" (cards from `pack.lessons`, content in private `learn/unit-2/2.8.json`; problems labeled "Page 117 · #9", each links back to its card). Next: same for other lessons, recrop feature, Additional Practice crops, Unit 3 import.

## Results and lesson popups (homework)
Each answer is saved as a result per problem (`hw.res[id] = {r:'got'|'miss', t}`; newest wins when synced; `done` stays a union). "My results" on a lesson shows got / to review / not tried, with the full answer and explanation for misses, a "Look at the lesson" popup (no leaving the test; pack `lessons[sub].peeks`) and quick ✓/↻ marks to record a result by hand. Problems with no practice variants hide "Generate alternate"; "Next problem" shows once the answer is revealed.

## Practice test (study guide)
Next is disabled until she answers (a quiet "Skip this one" and "← Previous" are always there). A test in progress is saved (`save.testRun`, resumes after a reload). Finished tests are saved and synced (`save.tests`, newest 8, merged from both devices). Results show every miss with her answer, the answer, "How it works" and a lesson popup (`lessonSheet`), and "Past tests" on the intro reopens any of them.

## Needs work (test)
Misses and skips on the Practice Test go on `save.twork`, a list separate from the practice come-back list (`save.work`). The setup picker has "Needs work (practice)" and "Needs work (test)". Cleared by getting it right on a later test or 3 clean solves in total. The test results screen has "Practice the ones I missed" (starts a set from that list).

## Practice test options
Two switches on the practice test start screen (saved per player in `save.testOpts`, off by default, remembered by a test in progress): **Allow help** (I'm stuck hints, then the steps, plus a Help menu) and **Must get it right to move on** (each answer is checked, no skipping; only a first-try right counts toward the score). Each question records `tries` and `helped`; results show how the test was taken.

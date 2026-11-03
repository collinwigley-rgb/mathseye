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
- [x] Unit 2 reference sheets (2.1–2.8) and study guide in content/units/unit-2/
- [x] Unit 2 interactive study guide at public/study/unit-2.html (v2: missions, focus mode, help sheet; see docs/UX-AUDIT.md)
- [x] MathFacts: 9 Unit 2 tricks added (13 total), reordered by usefulness; unlock every 2 days (parent can unlock sooner)
- [x] Study guide: "Try a new one" on every problem (422 variants, tools/unit2_variants.py; independent re-solve test: tools/test_unit2_variants.py)
- [x] Reset progress: study guide (bottom of home) and MathFacts (Grown-ups), both ask to confirm
- [x] Branding pass (docs/BRANDING.md): ink navy + butter yellow, eye-and-star mark, serif wordmark, stage-vocabulary nods
- [x] Hub home: MathFacts / Study Guide / Unit Homework, unit label, clickable logo, seven color schemes (docs/COLOR-SCHEMES.md)
- [x] Unit Homework page: imports the on-device worksheet pack, guided nudges, Generate alternate (same lesson + kind)
- [ ] Generate alternate is lesson-and-kind based. A true number-swapped version of each worksheet problem needs a generator per problem (~180).
- [ ] Unit 3: upload weekly PDFs, build sheets as they come
- [ ] Phase 2: Beat the Calculator, Test Mode, spot-the-trick and estimate cards, PIN for grown-ups, more tricks
- [ ] Move storage to IndexedDB and add JSON export for backup

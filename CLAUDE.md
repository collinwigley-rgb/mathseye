# Mathseye

Math apps for a 7th grade pre-algebra student. iPad-first PWAs, also work in any browser.
The name is a play on a band she loves. Branding is *inspired by* that band's look, with the owner's approval (see `docs/BRANDING.md`).
Never copy the band's logo, wordmark artwork, photos, song titles, or lyrics, and don't put the band's name in the UI.

## Start of every session
1. Read `docs/STATUS.md` (what's done, what's next).
2. Check open GitHub Issues labeled `change-request`. That's the work queue.
3. When you finish something, update `docs/STATUS.md`, commit, push, and close or comment on the issue.
   Keep commits small so work survives running out of tokens.

## Math Facts app (root of repo)
- Specs: `BRIEF-MathFacts.md` and `BRIEF-UnitLessons.md` in the repo root (live docs linked at the top of each).
- Stack: Vite + React + TypeScript, plain CSS, localStorage, hand-written service worker (`public/sw.js`).
- Trick content lives in `content/tricks/*.json`. Each template names a generator in `src/generators.ts`
  and has 4 clue strings with `{var}` placeholders filled from the generator's `vars`.
- Leitner scheduler: `src/scheduler.ts`. Session flow: `src/session.ts`. UI: `src/App.tsx`.
- Unit reference sheets: `content/units/` (see its README). Build help, practice, and study guides from these, never the PDFs.
- `npm test` runs Vitest; `npm run build` typechecks and builds. Push to `main` auto-deploys on Netlify (`netlify.toml`). There is no GitHub Pages workflow: the free plan cannot use Pages for this repo.

## Tone rules (from the brief)
Calm bedtime design: dark warm theme, no red X's, no lost lives, no scores that go down,
no diagnostic or ability labels. Copy is encouraging and plain.

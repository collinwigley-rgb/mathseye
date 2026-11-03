# Mathseye branding

Owner-approved direction: take cues from a band the student loves, without copying anything of theirs.

## What we borrowed (ideas only)
- **Palette:** deep ink navy (`#14111f`) with pale butter yellow (`#f3eba0`). Light mode inverts it: butter paper, ink-violet type.
- **Shapes:** an eye (the name's pun) with a star as the pupil; a small spark. Our star is a plus and a times combined, so it is also math.
- **Type:** a quirky high-contrast serif (Fraunces) for the wordmark and headings; Figtree for body text.
- **Stage vocabulary** in small doses: "Tonight's set", "Dress rehearsal" (practice test), "Intermission" (break), "That's a wrap", "Encore: another mission", win lines like "Clean take" and "On beat".
- **Star-shaped progress dots** and a small sparkle on wins.

## What we do not use
The band's logo or wordmark artwork, photos, song titles, lyrics, member names, or the band's name anywhere in the UI.

## Where it lives
`public/icon.svg` (+ PNGs), `src/Mark.tsx`, tokens in `src/styles.css` and `tools/unit2_template.html`.
Keep calm: no flashing, sound off, animations respect reduced motion.

## Color schemes
The student can pick one of seven schemes (Classic plus six seasonal palettes). Full values, sources, and contrast results: `docs/COLOR-SCHEMES.md` (generated from `tools/brand_themes.py`).

## Member color schemes
The picker uses members' first names with a rounded-square swatch of their signature color (colors from the owner's written list). Each scheme has a second color for gradients, star dots, and the celebration burst. Six seasonal palettes sit under "More palettes" until the owner says which member each belongs to. No photos or faces anywhere: they are copyrighted and the site is public.

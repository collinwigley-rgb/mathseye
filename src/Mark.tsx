/** Mathseye mark: an eye whose pupil is a math star (a plus and a times combined), plus a small spark. */
export default function Mark({ size = 72 }: { size?: number }) {
  return (
    <svg width={size} height={size * 0.8} viewBox="0 0 120 96" role="img" aria-label="Mathseye" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 54 C26 16 94 16 114 54 C94 92 26 92 6 54Z" strokeWidth="7" />
      <g strokeWidth="6"><path d="M60 30 V78 M36 54 H84" /><path d="M43 37 L77 71 M77 37 L43 71" /></g>
      <path d="M104 8 Q106 22 118 24 Q106 26 104 40 Q102 26 90 24 Q102 22 104 8Z" fill="var(--amber2, currentColor)" stroke="none" />
    </svg>
  );
}

import type { AnswerFormat } from './types';

/** Parse "−3", "-3", ".5", "1/2", "-3/4" into a number, or null. */
export function parseNumber(raw: string): number | null {
  const s = raw.trim().replace(/[−–]/g, '-').replace(/,/g, '').replace(/\s*%$/, '');
  if (!s) return null;
  const frac = s.match(/^(-?\d+(?:\.\d+)?)\/(-?\d+(?:\.\d+)?)$/);
  if (frac) {
    const den = Number(frac[2]);
    return den === 0 ? null : Number(frac[1]) / den;
  }
  if (!/^-?(\d+\.?\d*|\.\d+)$/.test(s)) return null;
  return Number(s);
}

export function checkAnswer(given: string, expected: string, format: AnswerFormat): boolean {
  if (format === 'yesno') return given.trim().toLowerCase() === expected;
  const g = parseNumber(given), e = parseNumber(expected);
  if (g === null || e === null) return false;
  return Math.abs(g - e) < 1e-9 * Math.max(1, Math.abs(e));
}

import type { Problem } from './types';

export type Rng = () => number;
const int = (rng: Rng, lo: number, hi: number) => lo + Math.floor(rng() * (hi - lo + 1));
const pick = <T,>(rng: Rng, xs: T[]) => xs[Math.floor(rng() * xs.length)];
export const MINUS = '−';
const signed = (n: number) => (n < 0 ? MINUS + Math.abs(n) : String(n));

/** Format integer mantissa m as m × 10^(-places), with no float error. */
export function fmtScaled(m: number, places: number): string {
  if (places <= 0) return String(m * 10 ** -places);
  let s = String(m).padStart(places + 1, '0');
  s = s.slice(0, -places) + '.' + s.slice(-places);
  return s.replace(/0+$/, '').replace(/\.$/, '');
}

type Gen = (rng: Rng, params: Record<string, string | number>) => Problem;

export const GENERATORS: Record<string, Gen> = {
  decimalShift(rng, { op }) {
    const k = int(rng, 1, 3);
    const p = 10 ** k;
    const places = int(rng, 0, 2);
    let m = int(rng, 2, 999);
    if (m % 10 === 0) m += int(rng, 1, 9); // avoid trailing zeros in the mantissa
    const x = fmtScaled(m, places);
    const ans = op === 'mul' ? fmtScaled(m, places - k) : fmtScaled(m, places + k);
    return {
      prompt: `${x} ${op === 'mul' ? '×' : '÷'} ${p.toLocaleString('en-US')}`,
      answer: ans,
      vars: { x, p: p.toLocaleString('en-US'), k, s: k === 1 ? '' : 's', ans },
    };
  },

  digitSum(rng, { d }) {
    const div = Number(d);
    let n = int(rng, 100, 999);
    const want = rng() < 0.5;
    if (want) n -= n % div;
    else if (n % div === 0) n += pick(rng, [1, -1]); // near miss: one away from a multiple
    if (n < 100) n += div;
    const digits = String(n).split('');
    const sum = digits.reduce((a, c) => a + Number(c), 0);
    const yes = n % div === 0;
    return {
      prompt: `Is ${n} divisible by ${div}?`,
      answer: yes ? 'yes' : 'no',
      vars: { n, digits: digits.join(' + '), sum, verdict: yes ? 'is' : "isn't" },
    };
  },

  signs(rng, { op }) {
    const absA = int(rng, 2, 12);
    const absB = int(rng, 2, 12);
    const sa = rng() < 0.5 ? -1 : 1;
    let sb = rng() < 0.5 ? -1 : 1;
    if (sa > 0 && sb > 0) sb = -1; // always at least one negative
    const same = sa === sb;
    if (op === 'mul') {
      const a = sa * absA, b = sb * absB, ans = a * b;
      return {
        prompt: `(${signed(a)}) × (${signed(b)})`,
        answer: String(ans),
        vars: { absA, absB, absAns: absA * absB, signWord: same ? 'Same' : 'Different', posneg: same ? 'positive' : 'negative', ans: signed(ans) },
      };
    }
    const prod = absA * absB;
    const a = sa * prod, b = sb * absB, ans = a / b;
    return {
      prompt: `${signed(a)} ÷ (${signed(b)})`,
      answer: String(ans),
      vars: { absA: prod, absB, absAns: absA, signWord: same ? 'Same' : 'Different', posneg: same ? 'positive' : 'negative', ans: signed(ans) },
    };
  },

  breakApart(rng) {
    const a = int(rng, 3, 9);
    const r = int(rng, 2, 9) * 10;
    const d = int(rng, 1, 2);
    const up = rng() < 0.6; // b is just under the round number
    const b = up ? r - d : r + d;
    const ans = a * b;
    return {
      prompt: `${a} × ${b}`,
      answer: String(ans),
      vars: { a, b, r, d, ar: a * r, ad: a * d, op: up ? '−' : '+', ans },
    };
  },
};

export function fill(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_, k) => (k in vars ? String(vars[k]) : `{${k}}`));
}

/** Small seeded RNG so a saved session regenerates the same problem on resume. */
export function seeded(seed: number): Rng {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

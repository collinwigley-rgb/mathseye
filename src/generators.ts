import type { Problem } from './types';

export type Rng = () => number;
const int = (rng: Rng, lo: number, hi: number) => lo + Math.floor(rng() * (hi - lo + 1));
const pick = <T,>(rng: Rng, xs: T[]) => xs[Math.floor(rng() * xs.length)];
export const MINUS = '−';
const gcd = (a: number, b: number): number => (b ? gcd(b, a % b) : Math.abs(a));
const BENCH: [number, number][] = [[1, 2], [1, 4], [3, 4], [1, 5], [2, 5], [3, 5], [4, 5], [1, 8], [3, 8], [5, 8], [7, 8], [1, 10], [3, 10], [7, 10]];
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
      prompt: phrase(rng, `${x} ${op === 'mul' ? '×' : '÷'} ${p.toLocaleString('en-US')}`),
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
        prompt: phrase(rng, `(${signed(a)}) × (${signed(b)})`),
        answer: String(ans),
        vars: { absA, absB, absAns: absA * absB, signWord: same ? 'Same' : 'Different', posneg: same ? 'positive' : 'negative', ans: signed(ans) },
      };
    }
    const prod = absA * absB;
    const a = sa * prod, b = sb * absB, ans = a / b;
    return {
      prompt: phrase(rng, `${signed(a)} ÷ (${signed(b)})`),
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
      prompt: phrase(rng, rng() < 0.3 ? `${b} × ${a}` : `${a} × ${b}`),
      answer: String(ans),
      vars: { a, b, r, d, ar: a * r, ad: a * d, op: up ? '−' : '+', ans },
    };
  },
  // ---------------------------------------------------------------- Unit 3 facts (percents)
  /** An easy percent of a friendly number: 10% (divide by 10), 1% (divide by 100), 50% (half), 25% (a quarter). */
  pctOf(rng, { p }) {
    const P = Number(p);
    const n = P === 10 ? int(rng, 12, 990) : P === 1 ? 5 * int(rng, 4, 198) : P === 50 ? int(rng, 6, 198) : 4 * int(rng, 3, 60);
    const ans = fmtScaled(n * P, 2);
    const how = P === 10 ? 'divide by 10' : P === 1 ? 'divide by 100' : P === 50 ? 'halve it' : 'halve it, then halve it again';
    const part = P === 10 ? 'a tenth' : P === 1 ? 'a hundredth' : P === 50 ? 'half' : 'a quarter';
    return { prompt: phrase(rng, `${P}% of ${n}`), answer: ans, vars: { n, p: P, how, part, half: fmtScaled(n * 50, 2), ans } };
  },
  /** Build another percent from the easy ones: 15% = 10% + 5%, 35% = 25% + 10%, ... (n is a multiple of 20 so every piece is a whole number). */
  pctBuild(rng) {
    const P = pick(rng, [5, 15, 20, 30, 35, 75]);
    const n = 20 * int(rng, 2, 30), ten = n / 10, five = n / 20, quarter = n / 4, ans = (n * P) / 100;
    const build = ({ 5: '5% is half of 10%', 15: '15% = 10% + 5%', 20: '20% = 10% + 10%', 30: '30% = 10% + 10% + 10%', 35: '35% = 25% + 10%', 75: '75% = 25% + 25% + 25%' } as Record<number, string>)[P];
    return { prompt: phrase(rng, `${P}% of ${n}`), answer: String(ans), vars: { n, p: P, ten, five, quarter, build, ans } };
  },
  /** Percent to decimal (slide the point two places left) and back (two places right). */
  pctToDec(rng, { dir }) {
    const [m, places] = pick(rng, [[4, 0], [7, 0], [35, 0], [60, 0], [85, 0], [125, 0], [8, 1], [45, 1], [25, 1], [125, 1], [4, 1], [5, 2]] as [number, number][]);
    const pct = fmtScaled(m, places), dec = fmtScaled(m, places + 2);
    if (dir === 'toDec') return { prompt: `${pct}% as a decimal`, answer: dec, vars: { x: pct, ans: dec, dec, pct } };
    return { prompt: `${dec} as a percent (just the number)`, answer: pct, vars: { x: dec, ans: pct, dec, pct } };
  },
  /** More than 100%: 100% is the whole, so the extra percent is added on. */
  pctOver(rng) {
    const P = pick(rng, [110, 120, 125, 150, 175, 200, 250, 300]);
    const n = 20 * int(rng, 2, 20), extra = (n * (P - 100)) / 100, ans = n + extra;
    return { prompt: phrase(rng, `${P}% of ${n}`), answer: String(ans), vars: { n, p: P, over: P - 100, extra, ans } };
  },

  // ---------------------------------------------------------------- Unit 2 facts
  benchmark(rng, { dir }) {
    const [n, d] = pick(rng, BENCH);
    const dec = String(n / d), unit = String(1 / d);
    if (dir === 'toDec') return { prompt: `${n}/${d} as a decimal`, answer: dec, vars: { n, d, unit, dec, ans: dec } };
    return { prompt: `${dec} as a fraction`, answer: `${n}/${d}`, vars: { n, d, unit, dec, ans: `${n}/${d}` } };
  },

  fitCount(rng, { kind }) {
    if (kind === 'whole') {
      const d = pick(rng, [2, 3, 4, 5, 6, 8, 10]), w = int(rng, 2, 9);
      return { prompt: phrase(rng, `${w} ÷ 1/${d}`), answer: String(w * d), vars: { x: String(w), d, ans: w * d } };
    }
    const b = pick(rng, [2, 3, 4, 5]), d = b * pick(rng, [2, 3, 4]), a = int(rng, 1, b - 1);
    const ans = a * (d / b);
    return { prompt: phrase(rng, `(${a}/${b}) ÷ (1/${d})`), answer: String(ans), vars: { x: `${a}/${b}`, d, ans } };
  },

  minToHour(rng) {
    const [m, f] = pick(rng, [[6, '1/10'], [10, '1/6'], [12, '1/5'], [15, '1/4'], [20, '1/3'], [30, '1/2'], [40, '2/3'], [45, '3/4'], [5, '1/12']] as [number, string][]);
    return { prompt: `${m} minutes as a fraction of an hour`, answer: f, vars: { m, k: 60 / m, ans: f } };
  },

  div5(rng, { d }) {
    const div = Number(d), q = div === 5 ? int(rng, 12, 120) : div === 25 ? int(rng, 4, 24) : int(rng, 3, 20), N = div * q;
    const mult = div === 25 ? 4 : 2, shift = div === 5 ? 10 : 100;
    return { prompt: divPrompt(rng, N, div), answer: String(q), vars: { N, d: div, mult, shift, mid: N * mult, ans: q } };
  },

  halveDiv(rng, { d }) {
    const div = Number(d), q = int(rng, 8, 60), N = div * q;
    return { prompt: divPrompt(rng, N, div), answer: String(q), vars: { N, d: div, times: div === 4 ? 'twice' : 'three times', h1: N / 2, ans: q } };
  },

  mulHalf(rng, { m }) {
    const x = 2 * int(rng, 2, 24), half = x / 2;
    const ans = m === '1.5' ? x + half : m === '2.5' ? 2 * x + half : half;
    return { prompt: phrase(rng, rng() < 0.3 ? `${m} × ${x}` : `${x} × ${m}`), answer: String(ans), vars: { x, m: String(m), half, dbl: 2 * x, ans } };
  },

  divDec(rng, { d }) {
    const k = d === '0.5' ? 2 : d === '0.25' ? 4 : 10, coin = d === '0.5' ? 'half dollars' : d === '0.25' ? 'quarters' : 'dimes';
    const N = d === '0.5' ? int(rng, 3, 40) : d === '0.25' ? int(rng, 2, 20) : int(rng, 3, 60);
    return { prompt: phrase(rng, `${N} ÷ ${d}`), answer: String(N * k), vars: { N, d: String(d), k, coin, ans: N * k } };
  },

  flipFrac(rng) {
    const DIV: [number, number][] = [[1, 2], [1, 3], [2, 3], [1, 4], [3, 4], [1, 5], [2, 5], [3, 5], [5, 6], [1, 6]];
    const Q: [number, number][] = [[2, 1], [3, 1], [4, 1], [1, 2], [3, 2], [5, 2], [6, 1], [1, 3], [4, 3], [5, 1]];
    for (let t = 0; t < 40; t++) {
      const [c, d] = pick(rng, DIV), [qn, qd] = pick(rng, Q);
      let a = qn * c, b = qd * d; const g = gcd(a, b); a /= g; b /= g;
      if (a > 20 || b > 20) continue;
      const ans = qd === 1 ? String(qn) : `${qn}/${qd}`;
      return { prompt: phrase(rng, `(${a}/${b}) ÷ (${c}/${d})`), answer: ans, vars: { a, b, c, d, ans } };
    }
    return { prompt: '(3/4) ÷ (1/2)', answer: '3/2', vars: { a: 3, b: 4, c: 1, d: 2, ans: '3/2' } };
  },

  divFactors(rng, { d }) {
    const div = Number(d), [f1, f2] = div === 6 ? [2, 3] : div === 12 ? [3, 4] : [3, 5], q = int(rng, 6, 30), N = div * q;
    return { prompt: divPrompt(rng, N, div), answer: String(q), vars: { N, d: div, f1, f2, mid: N / f1, ans: q } };
  },

};

/** Same math, different wording, so cards don't all look alike. The core expression stays intact. */
function phrase(rng: Rng, core: string): string {
  const r = rng();
  if (r < 0.4) return core;
  if (r < 0.6) return `What is ${core}?`;
  if (r < 0.8) return `${core} = ?`;
  return `Solve: ${core}`;
}
/** Division prompts also appear as a missing factor: ? × 5 = 240 (same answer, algebra-flavored). */
function divPrompt(rng: Rng, N: number, d: number | string): string {
  return rng() < 0.25 ? `? × ${d} = ${N}` : phrase(rng, `${N} ÷ ${d}`);
}

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

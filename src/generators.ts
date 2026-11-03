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
      return { prompt: `${w} ÷ 1/${d}`, answer: String(w * d), vars: { x: String(w), d, ans: w * d } };
    }
    const b = pick(rng, [2, 3, 4, 5]), d = b * pick(rng, [2, 3, 4]), a = int(rng, 1, b - 1);
    const ans = a * (d / b);
    return { prompt: `(${a}/${b}) ÷ (1/${d})`, answer: String(ans), vars: { x: `${a}/${b}`, d, ans } };
  },

  minToHour(rng) {
    const [m, f] = pick(rng, [[6, '1/10'], [10, '1/6'], [12, '1/5'], [15, '1/4'], [20, '1/3'], [30, '1/2'], [40, '2/3'], [45, '3/4'], [5, '1/12']] as [number, string][]);
    return { prompt: `${m} minutes as a fraction of an hour`, answer: f, vars: { m, k: 60 / m, ans: f } };
  },

  div5(rng, { d }) {
    const div = Number(d), q = div === 5 ? int(rng, 12, 80) : div === 25 ? int(rng, 4, 24) : int(rng, 3, 20), N = div * q;
    const mult = div === 25 ? 4 : 2, shift = div === 5 ? 10 : 100;
    return { prompt: `${N} ÷ ${div}`, answer: String(q), vars: { N, d: div, mult, shift, mid: N * mult, ans: q } };
  },

  halveDiv(rng, { d }) {
    const div = Number(d), q = int(rng, 8, 60), N = div * q;
    return { prompt: `${N} ÷ ${div}`, answer: String(q), vars: { N, d: div, times: div === 4 ? 'twice' : 'three times', h1: N / 2, ans: q } };
  },

  mulHalf(rng, { m }) {
    const x = 2 * int(rng, 2, 24), half = x / 2;
    const ans = m === '1.5' ? x + half : m === '2.5' ? 2 * x + half : half;
    return { prompt: `${x} × ${m}`, answer: String(ans), vars: { x, m: String(m), half, dbl: 2 * x, ans } };
  },

  divDec(rng, { d }) {
    const k = d === '0.5' ? 2 : d === '0.25' ? 4 : 10, coin = d === '0.5' ? 'half dollars' : d === '0.25' ? 'quarters' : 'dimes';
    const N = d === '0.5' ? int(rng, 3, 40) : d === '0.25' ? int(rng, 2, 20) : int(rng, 3, 60);
    return { prompt: `${N} ÷ ${d}`, answer: String(N * k), vars: { N, d: String(d), k, coin, ans: N * k } };
  },

  flipFrac(rng) {
    const DIV: [number, number][] = [[1, 2], [1, 3], [2, 3], [1, 4], [3, 4], [1, 5], [2, 5], [3, 5], [5, 6], [1, 6]];
    const Q: [number, number][] = [[2, 1], [3, 1], [4, 1], [1, 2], [3, 2], [5, 2], [6, 1], [1, 3], [4, 3], [5, 1]];
    for (let t = 0; t < 40; t++) {
      const [c, d] = pick(rng, DIV), [qn, qd] = pick(rng, Q);
      let a = qn * c, b = qd * d; const g = gcd(a, b); a /= g; b /= g;
      if (a > 20 || b > 20) continue;
      const ans = qd === 1 ? String(qn) : `${qn}/${qd}`;
      return { prompt: `(${a}/${b}) ÷ (${c}/${d})`, answer: ans, vars: { a, b, c, d, ans } };
    }
    return { prompt: '(3/4) ÷ (1/2)', answer: '3/2', vars: { a: 3, b: 4, c: 1, d: 2, ans: '3/2' } };
  },

  divFactors(rng, { d }) {
    const div = Number(d), [f1, f2] = div === 6 ? [2, 3] : div === 12 ? [3, 4] : [3, 5], q = int(rng, 6, 30), N = div * q;
    return { prompt: `${N} ÷ ${div}`, answer: String(q), vars: { N, d: div, f1, f2, mid: N / f1, ans: q } };
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

import { describe, expect, it } from 'vitest';
import { checkAnswer, parseNumber } from './answer';
import { GENERATORS, fmtScaled, seeded } from './generators';
import { review, newCard, INTERVALS } from './scheduler';
import tricks from '../content/tricks/move-the-decimal.json';

describe('answer checking', () => {
  it('accepts equivalent forms', () => {
    expect(checkAnswer('.5', '0.5', 'number')).toBe(true);
    expect(checkAnswer('1/2', '0.5', 'number')).toBe(true);
    expect(checkAnswer('−3', '-3', 'number')).toBe(true);
    expect(checkAnswer('-3', '3', 'number')).toBe(false);
    expect(checkAnswer('yes', 'yes', 'yesno')).toBe(true);
    expect(parseNumber('abc')).toBeNull();
  });
});

describe('generators', () => {
  it('formats decimals without float error', () => {
    expect(fmtScaled(56, 2)).toBe('0.56');
    expect(fmtScaled(3, -2)).toBe('300');
    expect(fmtScaled(120, 1)).toBe('12');
  });
  it('produce correct answers', () => {
    const rng = seeded(42);
    for (let i = 0; i < 500; i++) {
      const s = GENERATORS.signs(rng, { op: i % 2 ? 'mul' : 'div' });
      const expr = s.prompt.replace(/−/g, '-').replace('×', '*').replace('÷', '/');
      expect(Number(s.answer)).toBeCloseTo(eval(expr));
      const b = GENERATORS.breakApart(rng, {});
      expect(Number(b.answer)).toBe(eval(b.prompt.replace('×', '*')));
      const d = GENERATORS.digitSum(rng, { d: 3 });
      const n = Number(d.vars.n);
      expect(d.answer).toBe(n % 3 === 0 ? 'yes' : 'no');
      expect(n).toBeGreaterThanOrEqual(100);
      const m = GENERATORS.decimalShift(rng, { op: i % 2 ? 'mul' : 'div' });
      const [x, op, p] = m.prompt.replace(/,/g, '').split(' ');
      expect(Number(m.answer)).toBeCloseTo(op === '×' ? Number(x) * Number(p) : Number(x) / Number(p), 9);
    }
  });
  it('content has four clue levels', () => {
    for (const t of tricks.templates) expect(t.clues).toHaveLength(4);
  });
});

describe('leitner', () => {
  it('moves boxes per the brief', () => {
    let c = newCard('x', 0);
    c = review(c, true, 0, 0);
    expect(c.box).toBe(2);
    expect(c.nextDue).toBe(INTERVALS[2]);
    c = review(c, true, 2, 0);
    expect(c.box).toBe(2);
    c = review(c, true, 3, 0);
    expect(c.box).toBe(1);
    expect(c.box1Returns).toBe(1);
  });
});

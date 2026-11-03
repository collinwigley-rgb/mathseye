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

// ---------------------------------------------------------------- Unit 2 facts
import { TRICKS, TEMPLATES } from './content';
import { fill } from './generators';

describe('unit 2 generators compute the right answers', () => {
  const rng = seeded(7);
  const num = (s: string) => parseNumber(s) as number;
  it('benchmark', () => {
    for (let i = 0; i < 200; i++) {
      const a = GENERATORS.benchmark(rng, { dir: 'toDec' }), [, n, d] = a.prompt.match(/^(\d+)\/(\d+) as/)!;
      expect(num(a.answer)).toBeCloseTo(Number(n) / Number(d), 9);
      const b = GENERATORS.benchmark(rng, { dir: 'toFrac' }), [, dec] = b.prompt.match(/^([\d.]+) as/)!;
      expect(num(b.answer)).toBeCloseTo(Number(dec), 9);
    }
  });
  it('fitCount, minToHour, div5, halveDiv, divFactors, divDec, mulHalf', () => {
    for (let i = 0; i < 200; i++) {
      let m = GENERATORS.fitCount(rng, { kind: 'whole' }); let r = m.prompt.match(/^(\d+) ÷ 1\/(\d+)$/)!; expect(num(m.answer)).toBe(Number(r[1]) * Number(r[2]));
      m = GENERATORS.fitCount(rng, { kind: 'frac' }); r = m.prompt.match(/^\((\d+)\/(\d+)\) ÷ \(1\/(\d+)\)$/)!; expect(num(m.answer)).toBeCloseTo(Number(r[1]) / Number(r[2]) * Number(r[3]), 9); expect(Number.isInteger(num(m.answer))).toBe(true);
      m = GENERATORS.minToHour(rng, {}); r = m.prompt.match(/^(\d+) minutes/)!; expect(num(m.answer)).toBeCloseTo(Number(r[1]) / 60, 9);
      for (const [g, d] of [['div5', 5], ['div5', 25], ['div5', 50], ['halveDiv', 4], ['halveDiv', 8], ['divFactors', 6], ['divFactors', 12], ['divFactors', 15]] as [string, number][]) {
        m = GENERATORS[g](rng, { d }); r = m.prompt.match(/^(\d+) ÷ (\d+)$/)!; expect(num(m.answer)).toBe(Number(r[1]) / Number(r[2])); expect(Number(r[2])).toBe(d);
      }
      for (const d of ['0.5', '0.25', '0.1']) { m = GENERATORS.divDec(rng, { d }); r = m.prompt.match(/^(\d+) ÷ ([\d.]+)$/)!; expect(num(m.answer)).toBeCloseTo(Number(r[1]) / Number(r[2]), 9); }
      for (const mm of ['1.5', '2.5', '0.5']) { m = GENERATORS.mulHalf(rng, { m: mm }); r = m.prompt.match(/^(\d+) × ([\d.]+)$/)!; expect(num(m.answer)).toBeCloseTo(Number(r[1]) * Number(r[2]), 9); }
    }
  });
  it('flipFrac', () => {
    for (let i = 0; i < 300; i++) { const m = GENERATORS.flipFrac(rng, {}), r = m.prompt.match(/^\((\d+)\/(\d+)\) ÷ \((\d+)\/(\d+)\)$/)!; expect(num(m.answer)).toBeCloseTo((Number(r[1]) / Number(r[2])) / (Number(r[3]) / Number(r[4])), 9); }
  });
});

describe('every trick in content/tricks is well-formed', () => {
  it('has 4 clues per template, known generators, unique unlock order, and no unfilled {placeholders}', () => {
    const orders = TRICKS.map(t => t.unlockOrder); expect(new Set(orders).size).toBe(orders.length);
    for (const id of Object.keys(TEMPLATES)) {
      const { template } = TEMPLATES[id]; expect(template.clues).toHaveLength(4); expect(GENERATORS[template.generator]).toBeTruthy();
      const rng = seeded(id.length);
      for (let i = 0; i < 60; i++) {
        const p = GENERATORS[template.generator](rng, template.params);
        for (const c of template.clues) expect(fill(c, p.vars), `${id}: ${c}`).not.toMatch(/\{\w+\}/);
        expect(checkAnswer(p.answer, p.answer, template.answerFormat)).toBe(true);
      }
    }
  });
});

// ---------------------------------------------------------------- hub: MathFacts modes + color schemes
import { tricksFor, unlockedTricks } from './session';
import { fresh } from './store';
import { BRANDS, ICONS } from './brand';

describe('MathFacts modes', () => {
  it('unit mode shows only this unit\'s tricks; general shows all', () => {
    const db = fresh();
    expect(db.settings.factsMode).toBe('unit');
    const unit = tricksFor(db);
    expect(unit.length).toBeGreaterThan(0);
    expect(unit.every((t) => t.units?.includes(2))).toBe(true);
    db.settings.factsMode = 'general';
    expect(tricksFor(db)).toHaveLength(TRICKS.length);
    expect(TRICKS.length).toBeGreaterThan(unit.length);
  });
  it('the first unit trick is unlocked right away and later ones are not', () => {
    const db = fresh(), first = tricksFor(db)[0].id;
    expect(unlockedTricks(db, db.settings.startedOn)).toEqual([first]);
  });
  it('an old saved settings object without the new fields still works', () => {
    const db = fresh(); delete db.settings.factsMode; delete db.settings.currentUnit;
    expect(tricksFor(db).length).toBeGreaterThan(0);
  });
});

describe('color schemes', () => {
  it('every scheme has a drawn icon', () => { for (const b of BRANDS) expect(ICONS[b.icon], b.id).toBeTruthy(); });
  it('have unique ids and valid hex colors', () => {
    expect(new Set(BRANDS.map((b) => b.id)).size).toBe(BRANDS.length);
    for (const b of BRANDS) { expect(b.bg).toMatch(/^#[0-9a-f]{6}$/i); expect(b.accent).toMatch(/^#[0-9a-f]{6}$/i); }
  });
});

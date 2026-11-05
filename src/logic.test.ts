import { describe, expect, it } from 'vitest';
import { checkAnswer, parseNumber } from './answer';
import { GENERATORS, fmtScaled, seeded } from './generators';
import { review, newCard, INTERVALS } from './scheduler';
import tricks from '../content/tricks/move-the-decimal.json';

/** Strip the wording wrappers phrase()/divPrompt() add, leaving the plain expression. */
const core = (p: string) => {
  const m = p.match(/^\? × (\S+) = (\d+)$/);
  if (m) return `${m[2]} ÷ ${m[1]}`;
  return p.replace(/^Solve: /, '').replace(/^What is /, '').replace(/ = \?$/, '').replace(/\?$/, '');
};

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
      const expr = core(s.prompt).replace(/−/g, '-').replace('×', '*').replace('÷', '/');
      expect(Number(s.answer)).toBeCloseTo(eval(expr));
      const b = GENERATORS.breakApart(rng, {});
      expect(Number(b.answer)).toBe(eval(core(b.prompt).replace('×', '*')));
      const d = GENERATORS.digitSum(rng, { d: 3 });
      const n = Number(d.vars.n);
      expect(d.answer).toBe(n % 3 === 0 ? 'yes' : 'no');
      expect(n).toBeGreaterThanOrEqual(100);
      const m = GENERATORS.decimalShift(rng, { op: i % 2 ? 'mul' : 'div' });
      const [x, op, p] = core(m.prompt).replace(/,/g, '').split(' ');
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
      const a = GENERATORS.benchmark(rng, { dir: 'toDec' }), [, n, d] = core(a.prompt).match(/^(\d+)\/(\d+) as/)!;
      expect(num(a.answer)).toBeCloseTo(Number(n) / Number(d), 9);
      const b = GENERATORS.benchmark(rng, { dir: 'toFrac' }), [, dec] = core(b.prompt).match(/^([\d.]+) as/)!;
      expect(num(b.answer)).toBeCloseTo(Number(dec), 9);
    }
  });
  it('fitCount, minToHour, div5, halveDiv, divFactors, divDec, mulHalf', () => {
    for (let i = 0; i < 200; i++) {
      let m = GENERATORS.fitCount(rng, { kind: 'whole' }); let r = core(m.prompt).match(/^(\d+) ÷ 1\/(\d+)$/)!; expect(num(m.answer)).toBe(Number(r[1]) * Number(r[2]));
      m = GENERATORS.fitCount(rng, { kind: 'frac' }); r = core(m.prompt).match(/^\((\d+)\/(\d+)\) ÷ \(1\/(\d+)\)$/)!; expect(num(m.answer)).toBeCloseTo(Number(r[1]) / Number(r[2]) * Number(r[3]), 9); expect(Number.isInteger(num(m.answer))).toBe(true);
      m = GENERATORS.minToHour(rng, {}); r = core(m.prompt).match(/^(\d+) minutes/)!; expect(num(m.answer)).toBeCloseTo(Number(r[1]) / 60, 9);
      for (const [g, d] of [['div5', 5], ['div5', 25], ['div5', 50], ['halveDiv', 4], ['halveDiv', 8], ['divFactors', 6], ['divFactors', 12], ['divFactors', 15]] as [string, number][]) {
        m = GENERATORS[g](rng, { d }); r = core(m.prompt).match(/^(\d+) ÷ (\d+)$/)!; expect(num(m.answer)).toBe(Number(r[1]) / Number(r[2])); expect(Number(r[2])).toBe(d);
      }
      for (const d of ['0.5', '0.25', '0.1']) { m = GENERATORS.divDec(rng, { d }); r = core(m.prompt).match(/^(\d+) ÷ ([\d.]+)$/)!; expect(num(m.answer)).toBeCloseTo(Number(r[1]) / Number(r[2]), 9); }
      for (const mm of ['1.5', '2.5', '0.5']) { m = GENERATORS.mulHalf(rng, { m: mm }); r = core(m.prompt).match(/^([\d.]+) × ([\d.]+)$/)!; expect(num(m.answer)).toBeCloseTo(Number(r[1]) * Number(r[2]), 9); }
    }
  });
  it('flipFrac', () => {
    for (let i = 0; i < 300; i++) { const m = GENERATORS.flipFrac(rng, {}), r = core(m.prompt).match(/^\((\d+)\/(\d+)\) ÷ \((\d+)\/(\d+)\)$/)!; expect(num(m.answer)).toBeCloseTo((Number(r[1]) / Number(r[2])) / (Number(r[3]) / Number(r[4])), 9); }
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
import { buildQueue, tricksFor, unlockedTricks } from './session';
import syncSource from '../public/sync.js?raw';
import gradeSource from '../public/grade.js?raw';
import songsSource from '../public/songs.js?raw';
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
  it('every fact is open from the start (no unlock schedule)', () => {
    const db = fresh();
    expect(unlockedTricks(db)).toEqual(tricksFor(db).map((t) => t.id));
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

describe('self-paced sessions', () => {
  const learnedDb = (n: number) => { const db = fresh(); db.settings.introducedTricks = tricksFor(db).slice(0, n).map((t) => t.id); return db; };
  const cards = (q: ReturnType<typeof buildQueue>) => q.filter((x) => x.kind === 'card') as Extract<(typeof q)[number], { kind: 'card' }>[];

  it('with nothing learned, a mix falls back to teaching new facts', () => {
    const q = buildQueue(fresh(), Date.now(), { kind: 'mix' });
    expect(q[0].kind).toBe('trick');
    expect(q.filter((x) => x.kind === 'trick').length).toBe(2);        // a couple of facts, not one per night
    expect(q[q.length - 1]).toMatchObject({ kind: 'card', stage: 'finish' });
  });
  it('"new" teaches up to two unlearned facts and picks them at random', () => {
    const seen = new Set<string>();
    for (let i = 0; i < 40; i++) {
      const q = buildQueue(learnedDb(1), Date.now(), { kind: 'new' });
      const ids = q.filter((x) => x.kind === 'trick').map((x) => (x as { trickId: string }).trickId);
      expect(ids.length).toBe(2); expect(ids).not.toContain(tricksFor(learnedDb(1))[0].id);
      ids.forEach((id) => seen.add(id));
    }
    expect(seen.size).toBeGreaterThan(2);   // not always the same two
  });
  it('choosing one fact drills it without a teaching card when already learned', () => {
    const db = learnedDb(3), id = db.settings.introducedTricks[1], tpl = new Set(TRICKS.find((t) => t.id === id)!.templates.map((t) => t.id));
    const q = buildQueue(db, Date.now(), { kind: 'trick', trickId: id });
    expect(q.some((x) => x.kind === 'trick')).toBe(false);
    expect(cards(q).filter((c) => tpl.has(c.templateId)).length).toBeGreaterThanOrEqual(7);
  });
  it('a review mix varies in length and rarely repeats a card kind back to back', () => {
    const lengths = new Set<number>(); let adjacent = 0, builds = 40;
    for (let i = 0; i < builds; i++) {
      const q = cards(buildQueue(learnedDb(6), Date.now(), { kind: 'mix' })); lengths.add(q.length);
      for (let k = 1; k < q.length; k++) if (q[k].templateId === q[k - 1].templateId) adjacent++;
    }
    expect(lengths.size).toBeGreaterThan(2);
    expect(adjacent / builds).toBeLessThan(1);
  });
  it('wording varies but the math stays the same', () => {
    const seen = new Set<string>();
    for (let i = 1; i <= 200; i++) { const r = GENERATORS.div5(seeded(i), { d: 5 }); seen.add(r.prompt.replace(/\d+/g, '#')); const m = core(r.prompt).match(/^(\d+) ÷ 5$/)!; expect(Number(m[1]) / 5).toBe(Number(r.answer)); }
    expect(seen.size).toBeGreaterThanOrEqual(4);
  });

  describe('session length and picking', () => {
    const n = (q: ReturnType<typeof buildQueue>) => q.filter((x) => x.kind === 'card').length;
    it('timed sessions get longer with more minutes', () => {
      const avg = (m: number) => Array.from({ length: 20 }, () => n(buildQueue(learnedDb(4), Date.now(), { kind: 'random' }, { mode: 'timed', minutes: m }))).reduce((a, b) => a + b, 0) / 20;
      expect(avg(5)).toBeLessThan(avg(15));
      expect(avg(15)).toBeLessThan(avg(30));
      expect(avg(15)).toBeGreaterThan(20);   // about fifteen minutes of cards
    });
    it('picked facts use only the facts she picked', () => {
      const db = learnedDb(4), ids = db.settings.introducedTricks.slice(0, 2);
      const allowed = new Set(ids.flatMap((id) => TRICKS.find((t) => t.id === id)!.templates.map((t) => t.id)));
      const q = buildQueue(db, Date.now(), { kind: 'picked', trickIds: ids }, { mode: 'timed', minutes: 10 });
      for (const c of q.filter((x) => x.kind === 'card') as { templateId: string }[]) expect(allowed.has(c.templateId)).toBe(true);
    });
    it('surprise me favors facts she has not learned yet over mastered ones', () => {
      const db = learnedDb(3); let fresh = 0;
      for (let i = 0; i < 60; i++) if (buildQueue(db, Date.now(), { kind: 'random' }).some((x) => x.kind === 'trick')) fresh++;
      expect(fresh).toBeGreaterThan(45);
    });
  });

  describe('cloud sync merge', () => {
    const m = { exports: {} as any };
    new Function('module', syncSource)(m);
    const S = m.exports;
    const card = (id: string, box: number, lastSeen: number, attempts = 1) => ({ templateId: id, box, nextDue: 0, lastSeen, attempts, box1Returns: 0 });
    const facts = (over: any) => ({ settings: { introducedTricks: [], manuallyUnlocked: [], currentUnit: 2 }, cards: {}, attempts: [], sessions: [], ...over });

    it('normalizes names so Kay, kay and " KAY " are one player', () => {
      expect(S.norm(' Kay ')).toBe('kay'); expect(S.norm('KAY')).toBe('kay'); expect(S.norm('Kay   O')).toBe('kay o');
    });
    it('MathFacts: unions learned facts, keeps the most recently seen card, unions answers and sessions', () => {
      const a = facts({ settings: { introducedTricks: ['a'], manuallyUnlocked: [] }, cards: { c1: card('c1', 3, 100), c2: card('c2', 2, 50) }, attempts: [{ timestamp: 1, templateId: 'c1' }], sessions: [{ id: 's1', startedAt: 1 }], inProgress: { mine: 1 } });
      const b = facts({ settings: { introducedTricks: ['b'], manuallyUnlocked: [] }, cards: { c1: card('c1', 4, 200), c3: card('c3', 1, 10) }, attempts: [{ timestamp: 1, templateId: 'c1' }, { timestamp: 2, templateId: 'c3' }], sessions: [{ id: 's1', startedAt: 1, endedAt: 5 }, { id: 's2', startedAt: 9 }] });
      const o = S.mergeFacts(a, b, true);
      expect(o.settings.introducedTricks.sort()).toEqual(['a', 'b']);
      expect(o.cards.c1.box).toBe(4);                       // seen later on the other device
      expect(Object.keys(o.cards).sort()).toEqual(['c1', 'c2', 'c3']);
      expect(o.attempts.length).toBe(2);                    // the shared answer is not doubled
      expect(o.sessions.find((x: any) => x.id === 's1').endedAt).toBe(5);
      expect(o.inProgress).toEqual({ mine: 1 });            // a half-finished set stays on its device
    });
    it('study guide: solved, clean and seen only grow; the newer side decides the come-back list', () => {
      const a = { solved: { x: true }, clean: {}, seen: { x: true }, work: { x: { n: 1, t: 5, c: 1 } }, mission: { here: 1 } };
      const b = { solved: { y: true }, clean: { y: true }, seen: { y: true }, work: {}, mission: { there: 1 } };
      const newerLocal = S.mergeStudy(a, b, true), newerRemote = S.mergeStudy(a, b, false);
      expect(Object.keys(newerLocal.solved).sort()).toEqual(['x', 'y']);
      expect(Object.keys(newerLocal.seen).sort()).toEqual(['x', 'y']);
      expect(newerLocal.work.x).toBeTruthy(); expect(Object.keys(newerRemote.work)).toEqual([]);
      expect(newerRemote.mission).toEqual({ here: 1 });
    });
    it('homework done-marks union and a missing side is just the other side', () => {
      expect(Object.keys(S.mergeHw({ done: { a: 1 } }, { done: { b: 1 } }).done).sort()).toEqual(['a', 'b']);
      expect(S.mergeHw(null, { done: { b: 1 } })).toEqual({ done: { b: 1 } });
      expect(S.mergeFacts(null, facts({}))).toBeTruthy();
    });
    it('grade: whole-number percent on the usual +/- scale', () => {
      const gm = { exports: {} as any }; new Function('module', gradeSource)(gm); const G = gm.exports, g = (r: number) => G.gradeOf(r, 14).letter;
      expect([14, 13, 12, 11, 10, 9, 8, 0].map(g)).toEqual(['A+', 'A', 'B', 'C+', 'C-', 'D', 'F', 'F']);
      expect(G.gradeOf(97, 100).letter).toBe('A+'); expect(G.gradeOf(90, 100).letter).toBe('A-'); expect(G.gradeOf(60, 100).letter).toBe('D-'); expect(G.gradeOf(59, 100).letter).toBe('F');
    });
    it('songs: default grades from the suggested order, always sorted A+ first', () => {
      const sm = { exports: {} as any }; new Function('module', songsSource)(sm); const R = sm.exports;
      const def = Array.from({ length: 27 }, (_, i) => 's' + (i + 1));
      expect(R.sizes(27)).toEqual([1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 4]);
      const st = R.stateOf(undefined, def); expect(st.order).toEqual(def); expect(st.grade.s1).toBe('A+'); expect(st.grade.s2).toBe('A'); expect(st.grade.s24).toBe('F'); expect(st.grade.s27).toBe('F');
      expect(R.stateOf({ rank: ['s27', 's1'] }, def).grade.s27).toBe('A+');        // an older saved order still works: the first song is the A+ song
      expect(R.stateOf({ grades: { s5: 'F', zzz: 'A' }, rank: [] }, def).grade.s5).toBe('F'); expect(R.stateOf({ grades: { s5: 'F' }, rank: [] }, def).order.slice(-5)).toContain('s5');
    });
    it('songs: picking a grade moves the song to that group, dragging gives it the group grade', () => {
      const sm = { exports: {} as any }; new Function('module', songsSource)(sm); const R = sm.exports;
      const def = Array.from({ length: 27 }, (_, i) => 's' + (i + 1)); const st = R.stateOf(undefined, def);
      const a = R.setGrade(st, 's27', 'A'); expect(a.grade.s27).toBe('A'); expect(a.order.slice(0, 4)).toEqual(['s1', 's27', 's2', 's3']);     // top of the A group
      const b = R.setGrade(st, 's1', 'F'); expect(b.order[b.order.length - 5]).toBe('s1'); expect(b.order[0]).toBe('s2');
      const c = R.place(st, 's20', 0); expect(c.order[0]).toBe('s20'); expect(c.grade.s20).toBe('A+');                                       // dropped at the very top
      const d = R.place(st, 's20', 4); expect(d.grade.s20).toBe(st.grade[st.order[3]]);                                                      // joins the group above it
      for (const x of [a, b, c, d]) { const idx = x.order.map((t: string) => R.GRADES.indexOf(x.grade[t])); expect(idx).toEqual([...idx].sort((m: number, n: number) => m - n)); expect(x.order.length).toBe(27); }
    });
    it('songs: duplicates are fine, but every grade always keeps at least one song', () => {
      const sm = { exports: {} as any }; new Function('module', songsSource)(sm); const R = sm.exports;
      const def = Array.from({ length: 27 }, (_, i) => 's' + (i + 1)); let st = R.stateOf(undefined, def);
      const full = (x: any) => R.GRADES.every((g: string) => x.order.some((t: string) => x.grade[t] === g));
      for (const t of def) { st = R.setGrade(st, t, 'A'); expect(full(st)).toBe(true); expect(st.order.length).toBe(27); }          // try to make everything an A
      expect(st.order.filter((t: string) => st.grade[t] === 'A').length).toBeGreaterThan(10);                                      // lots of A's are allowed
      for (let i = 0; i < 30; i++) { st = R.place(st, def[(i * 7) % 27], (i * 5) % 27); expect(full(st)).toBe(true); const idx = st.order.map((t: string) => R.GRADES.indexOf(st.grade[t])); expect(idx).toEqual([...idx].sort((m: number, n: number) => m - n)); }
      expect(full(R.stateOf({ grades: Object.fromEntries(def.map((t: string) => [t, 'B'])), rank: def }, def))).toBe(true);        // even an old or odd saved state is repaired
    });
    it('songs: a stack of the same grade slides down in rank order to fill empty grades', () => {
      const sm = { exports: {} as any }; new Function('module', songsSource)(sm); const R = sm.exports;
      const order: string[] = [], grade: Record<string, string> = {}; const put = (g: string, ns: string[]) => ns.forEach((n) => { order.push(n); grade[n] = g; });
      put('A+', ['a1']); put('A', ['a2', 'a3']); put('A-', ['a4', 'a5']); put('B+', ['b1', 'b2']); put('B', ['x1', 'x2', 'x3']);
      put('C', ['c1', 'c2', 'c3', 'c4']); put('D+', ['d1', 'd2']); put('D', ['e1', 'e2']); put('D-', ['f1', 'f2']); put('F', ['g1', 'g2', 'g3']);      // B- and C+ are empty
      const st = R.stateOf({ grades: grade, rank: order }, order);
      expect([st.grade.x1, st.grade.x2, st.grade.x3]).toEqual(['B', 'B-', 'C+']);                    // her three B's become B, B-, C+ by rank
      expect(st.grade.c1).toBe('C');                                                                // the C group is untouched
      const o2: string[] = [], g2: Record<string, string> = {}; const p2 = (g: string, ns: string[]) => ns.forEach((n) => { o2.push(n); g2[n] = g; });
      p2('B', ['s1', 's2', 's3']); p2('F', ['s4']); R.GRADES.filter((g: string) => g !== 'B' && g !== 'F').forEach((g: string) => p2(g, ['u' + g, 'v' + g]));
      const top = R.stateOf({ grades: g2, rank: o2 }, o2); expect(R.GRADES.every((g: string) => top.order.some((t: string) => top.grade[t] === g))).toBe(true);
    });
    it('songs: a test grade earns a song with that grade, else the nearest grade (tie goes lower), same test same song', () => {
      const sm = { exports: {} as any }; new Function('module', songsSource)(sm); const R = sm.exports;
      const def = Array.from({ length: 27 }, (_, i) => 's' + (i + 1)); let st = R.stateOf(undefined, def);
      expect(R.songFor(st, 'A+', 99)).toBe('s1'); expect(['s2', 's3']).toContain(R.songFor(st, 'A', 5)); expect(R.songFor(st, 'A', 5)).toBe(R.songFor(st, 'A', 5));
      const only = { order: ['x', 'y'], grade: { x: 'B', y: 'D' } };
      expect(R.songFor(only, 'B', 1)).toBe('x'); expect(R.songFor(only, 'A+', 1)).toBe('x'); expect(R.songFor(only, 'F', 1)).toBe('y'); expect(R.songFor(only, 'C', 1)).toBe('y');   // C is one from B and one from D: tie goes lower
      expect(R.songFor({ order: [], grade: {} }, 'A', 1)).toBeNull(); expect(R.songFor(null, 'A', 1)).toBeNull();
    });
    it('song ranking helpers: move and reconcile', () => {
      const sm = { exports: {} as any }; new Function('module', songsSource)(sm); const R = sm.exports;
      expect(R.move(['a', 'b', 'c', 'd'], 3, 0)).toEqual(['d', 'a', 'b', 'c']); expect(R.reconcile(['c', 'a', 'x'], ['a', 'b', 'c'])).toEqual(['c', 'a', 'b']);
    });
    it('Central Time follows daylight saving: CDT in summer, CST in winter', () => {
      const gm = { exports: {} as any }; new Function('module', gradeSource)(gm); const G = gm.exports;
      expect(G.centralTime(Date.UTC(2026, 6, 4, 18, 0))).toContain('CDT'); expect(G.centralTime(Date.UTC(2026, 10, 5, 18, 0))).toContain('CST');
      expect(G.centralTime(Date.UTC(2026, 10, 5, 5, 14))).toBe('Nov 4, 11:14 PM CST');
      expect(G.centralTime(Date.UTC(2026, 2, 8, 7, 59))).toContain('CST'); expect(G.centralTime(Date.UTC(2026, 2, 8, 8, 1))).toContain('CDT');   // the spring-forward hour
    });
    it('finished practice tests are kept from both devices, newest first, max 8', () => {
      const t = (n: number) => ({ t: n, right: 1, items: [] });
      const m = S.mergeStudy({ solved: {}, tests: [t(3), t(1)], testRun: { i: 2 } }, { solved: {}, tests: [t(2), t(3)] }, true);
      expect(m.tests.map((x: any) => x.t)).toEqual([3, 2, 1]); expect(m.testRun.i).toBe(2);
    });
    it('homework results: the newer result for a problem wins, others are kept', () => {
      const m = S.mergeHw({ done: { a: 1 }, res: { a: { r: 'got', t: 5 }, b: { r: 'miss', t: 1 } } }, { done: {}, res: { b: { r: 'got', t: 9 }, c: { r: 'miss', t: 2 } } });
      expect(m.res.a.r).toBe('got'); expect(m.res.b.r).toBe('got'); expect(m.res.c.r).toBe('miss');
    });
  });
});

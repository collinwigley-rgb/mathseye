import { TEMPLATES, TRICKS } from './content';
import { DAY, isDue, masteryFraction, newCard } from './scheduler';
import type { Db, QueueItem } from './store';
import { today } from './store';

export const SESSION_MS = 20 * 60 * 1000;

/** Tricks for the current MathFacts mode: this unit's facts, or every fact. */
export function tricksFor(db: Db): typeof TRICKS {
  if ((db.settings.factsMode ?? 'unit') === 'general') return TRICKS;
  const unit = db.settings.currentUnit ?? 2;
  const list = TRICKS.filter((t) => t.units?.includes(unit));
  return list.length ? list : TRICKS;
}

/** Every fact is open from the start: she chooses what to practice and how much. */
export function unlockedTricks(db: Db): string[] {
  return tricksFor(db).map((t) => t.id);
}

export function cardsForTrick(db: Db, trickId: string) {
  const trick = TRICKS.find((t) => t.id === trickId)!;
  return trick.templates.map((tpl) => db.cards[tpl.id] ?? newCard(tpl.id, 0));
}

export const trickMastery = (db: Db, trickId: string) => masteryFraction(cardsForTrick(db, trickId));

const seed = () => Math.floor(Math.random() * 90000) + 10000; // short on purpose: it shows as the card's reference number

/** What a session is about: a review mix, a few new facts, a surprise mix, or the facts she picked. */
export type Focus =
  | { kind: 'mix' } | { kind: 'new' } | { kind: 'random' }
  | { kind: 'trick'; trickId: string } | { kind: 'picked'; trickIds: string[] };

/** How long: until she stops, or a number of minutes (the queue is sized to roughly fit). */
export type Length = { mode: 'continuous' } | { mode: 'timed'; minutes: number };
export type SessionPlan = { focus: Focus; length: Length };

const ri = (lo: number, hi: number) => lo + Math.floor(Math.random() * (hi - lo + 1));
const shuffle = <T,>(xs: T[]): T[] => { const a = xs.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
type CardItem = Extract<QueueItem, { kind: 'card' }>;
/** Random order, but avoid the same kind of card twice in a row whenever there is a choice. */
function spread(items: CardItem[]): CardItem[] {
  const left = shuffle(items), out: CardItem[] = [];
  while (left.length) {
    const prev = out[out.length - 1]?.templateId;
    const k = left.findIndex((c) => c.templateId !== prev);
    out.push(left.splice(k === -1 ? 0 : k, 1)[0]);
  }
  return out;
}

/** Her usual seconds per card (median of recent answers, plus a few seconds to move on). */
export function secondsPerCard(db: Db): number {
  const ms = db.attempts.slice(-60).map((a) => a.msToAnswer).filter((x) => x > 1500 && x < 120000).sort((a, b) => a - b);
  const med = ms.length >= 8 ? ms[Math.floor(ms.length / 2)] / 1000 : 18;
  return Math.min(40, Math.max(12, med)) + 5;
}

/** How much a fact needs work: never seen = highest, then low box and recent misses. */
export function templateNeed(db: Db, templateId: string): number {
  const mine = db.attempts.filter((a) => a.templateId === templateId).slice(-12);
  if (!mine.length) return 8;
  const miss = mine.filter((a) => !a.correct || a.clueLevel > 0).length / mine.length;
  return Math.max(1, 6 - (db.cards[templateId]?.box ?? 1)) + 4 * miss;
}
export function trickNeed(db: Db, trickId: string): number {
  if (!db.settings.introducedTricks.includes(trickId)) return 10;
  const tpls = TRICKS.find((t) => t.id === trickId)!.templates;
  return 1 + tpls.reduce((a, t) => a + templateNeed(db, t.id), 0) / tpls.length;
}
/** Random pick without repeats, favoring what needs the most work. */
function weightedPick<T>(items: T[], w: (x: T) => number, n: number): T[] {
  const left = items.slice(), out: T[] = [];
  while (out.length < n && left.length) {
    const ws = left.map(w), tot = ws.reduce((a, b) => a + b, 0);
    let r = Math.random() * tot, k = 0;
    for (; k < left.length - 1; k++) if ((r -= ws[k]) < 0) break;
    out.push(left.splice(k, 1)[0]);
  }
  return out;
}

export function buildQueue(db: Db, now = Date.now(), focus: Focus = { kind: 'mix' }, length: Length = { mode: 'continuous' }): QueueItem[] {
  const list = tricksFor(db);
  const learned = db.settings.introducedTricks;
  const modeIds = new Set(list.map((t) => t.id));
  const learnedTemplates = Object.keys(TEMPLATES).filter((id) => learned.includes(TEMPLATES[id].trick.id) && modeIds.has(TEMPLATES[id].trick.id));
  const card = (templateId: string, type: 'use' | 'mixed', stage: CardItem['stage']): CardItem => ({ kind: 'card', templateId, type, stage, seed: seed() });

  const unlearned = shuffle(list.filter((t) => !learned.includes(t.id)).map((t) => t.id));
  const minutes = length.mode === 'timed' ? length.minutes : 0;
  let kind = focus.kind;
  if (kind === 'mix' && learnedTemplates.length === 0) kind = 'random';   // nothing to review yet
  if (kind === 'new' && unlearned.length === 0) kind = 'mix';             // everything already learned
  const focused = kind === 'trick' || kind === 'picked';
  let picks: string[];
  if (focus.kind === 'trick' && kind === 'trick') picks = [focus.trickId];
  else if (focus.kind === 'picked' && kind === 'picked') picks = focus.trickIds.slice();
  else if (kind === 'new') picks = unlearned.slice(0, minutes && minutes < 10 ? 1 : 2);
  else if (kind === 'random') picks = weightedPick(list.map((t) => t.id), (id) => trickNeed(db, id) ** 2, minutes && minutes < 10 ? 1 : 2);
  else picks = [];
  const warm = kind === 'mix' || kind === 'random';
  const teach = picks.filter((id) => !learned.includes(id)).length;

  // Total number of practice cards: sized to the minutes asked for, or a natural round when she goes until she stops
  const total = minutes ? Math.max(6, Math.round((minutes * 60 - teach * 40) * 0.85 / secondsPerCard(db))) : 0;

  const head: QueueItem[] = [];
  const rest: CardItem[] = [];
  let used = 1; // the finishing card
  if (warm) {
    const cap = minutes ? Math.max(2, Math.min(6, Math.floor(total * 0.3))) : ri(4, 6);
    const due = learnedTemplates.map((id) => db.cards[id]).filter((c) => c && isDue(c, now)).sort((a, b) => a.box - b.box).slice(0, cap);
    for (const c of shuffle(due)) { head.push(card(c.templateId, 'use', 'warmup')); used++; }
  }
  for (const id of picks) {
    const trick = TRICKS.find((t) => t.id === id)!;
    const isNew = !learned.includes(id);
    if (isNew) head.push({ kind: 'trick', trickId: id, stage: 'new' });
    const n = minutes
      ? Math.max(3, Math.round(total * (focused ? 0.55 : 0.3) / picks.length))
      : focused ? ri(Math.max(4, Math.ceil(10 / picks.length)), Math.max(5, Math.ceil(14 / picks.length))) : ri(4, 5);
    for (let i = 0; i < n; i++) {
      const c = card(trick.templates[i % trick.templates.length].id, 'use', isNew ? 'new' : 'drill');
      if (i < 2) head.push(c); else rest.push({ ...c, stage: 'mixed' });
      used++;
    }
  }
  const pickTemplates = picks.flatMap((id) => TRICKS.find((t) => t.id === id)!.templates.map((t) => t.id));
  const pool = focused ? [...new Set(pickTemplates)] : [...new Set([...learnedTemplates, ...pickTemplates])];
  const weights = pool.map((id) => templateNeed(db, id));
  const sum = weights.reduce((a, b) => a + b, 0);
  const pickOne = () => { let r = Math.random() * sum; for (let j = 0; j < pool.length; j++) if ((r -= weights[j]) < 0) return pool[j]; return pool[pool.length - 1]; };
  const mixedCount = minutes ? Math.max(0, total - used) : warm ? ri(10, 16) : ri(5, 8);
  for (let i = 0; pool.length && i < mixedCount; i++) rest.push(card(pickOne(), 'mixed', 'mixed'));

  const out: QueueItem[] = [...head, ...spread(rest)];
  // Finish on a win: the easiest (highest-box) card
  const easiest = pool.slice().sort((a, b) => (db.cards[b]?.box ?? 1) - (db.cards[a]?.box ?? 1))[0];
  if (easiest) out.push(card(easiest, 'use', 'finish'));
  return out;
}

/** Nightly streak that forgives one missed night per rolling week. */
export function streak(db: Db, now = Date.now()): number {
  const days = new Set(db.sessions.filter((s) => s.endedAt).map((s) => s.date));
  let count = 0;
  let misses: number[] = []; // day offsets of forgiven misses
  for (let off = 0; off < 400; off++) {
    const d = today(now - off * DAY);
    if (days.has(d)) { count++; continue; }
    if (off === 0) continue; // tonight isn't over yet
    misses = misses.filter((m) => off - m < 7);
    if (misses.length >= 1) break;
    misses.push(off);
  }
  return count;
}

/** No-clue accuracy on mixed cards over the last 7 sessions. */
export function confidence(db: Db): number | null {
  const recent = db.sessions.slice(-7);
  if (!recent.length) return null;
  const since = recent[0].startedAt;
  const mixed = db.attempts.filter((a) => a.cardType === 'mixed' && a.timestamp >= since);
  if (mixed.length < 3) return null;
  return mixed.filter((a) => a.correct && a.clueLevel === 0).length / mixed.length;
}

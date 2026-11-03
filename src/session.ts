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

/** What a session is about: a review mix, a couple of new facts, or one chosen fact. */
export type Focus = { kind: 'mix' } | { kind: 'new' } | { kind: 'trick'; trickId: string };

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

export function buildQueue(db: Db, now = Date.now(), focus: Focus = { kind: 'mix' }): QueueItem[] {
  const list = tricksFor(db);
  const learned = db.settings.introducedTricks;
  const modeIds = new Set(list.map((t) => t.id));
  const learnedTemplates = Object.keys(TEMPLATES).filter((id) => learned.includes(TEMPLATES[id].trick.id) && modeIds.has(TEMPLATES[id].trick.id));
  const card = (templateId: string, type: 'use' | 'mixed', stage: CardItem['stage']): CardItem => ({ kind: 'card', templateId, type, stage, seed: seed() });

  // Which facts to teach or drill: random new ones (not a fixed order), or the one she chose
  const unlearned = shuffle(list.filter((t) => !learned.includes(t.id)).map((t) => t.id));
  let kind = focus.kind;
  if (kind === 'mix' && learnedTemplates.length === 0) kind = 'new';   // nothing to review yet
  if (kind === 'new' && unlearned.length === 0) kind = 'mix';          // everything already learned
  const picks = kind === 'trick' ? [(focus as { trickId: string }).trickId] : kind === 'new' ? unlearned.slice(0, 2) : [];

  const head: QueueItem[] = [];      // fixed opening: due reviews, then each fact's teaching card and first two examples
  const rest: CardItem[] = [];       // everything else gets shuffled together
  if (kind === 'mix') {
    const due = learnedTemplates.map((id) => db.cards[id]).filter((c) => c && isDue(c, now)).sort((a, b) => a.box - b.box).slice(0, ri(4, 6));
    for (const c of shuffle(due)) head.push(card(c.templateId, 'use', 'warmup'));
  }
  for (const id of picks) {
    const trick = TRICKS.find((t) => t.id === id)!;
    const isNew = !learned.includes(id);
    if (isNew) head.push({ kind: 'trick', trickId: id, stage: 'new' });
    const n = kind === 'trick' ? ri(7, 9) : ri(4, 5);
    for (let i = 0; i < n; i++) {
      const c = card(trick.templates[i % trick.templates.length].id, 'use', isNew ? 'new' : 'drill');
      if (i < 2) head.push(c); else rest.push({ ...c, stage: 'mixed' });
    }
  }
  const pickTemplates = picks.flatMap((id) => TRICKS.find((t) => t.id === id)!.templates.map((t) => t.id));
  const pool = [...new Set([...learnedTemplates, ...pickTemplates])];
  const weights = pool.map((id) => Math.max(1, 6 - (db.cards[id]?.box ?? 1)));
  const total = weights.reduce((a, b) => a + b, 0);
  const pickOne = () => { let r = Math.random() * total; for (let j = 0; j < pool.length; j++) if ((r -= weights[j]) < 0) return pool[j]; return pool[pool.length - 1]; };
  const mixedCount = kind === 'mix' ? ri(10, 16) : ri(5, 8);
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

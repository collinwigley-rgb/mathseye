import { TEMPLATES, TRICKS } from './content';
import { DAY, isDue, masteryFraction, newCard } from './scheduler';
import type { Db, QueueItem } from './store';
import { today } from './store';

export const SESSION_MS = 20 * 60 * 1000;
const UNLOCK_EVERY = 3.5 * DAY; // about two new tricks a week

export function unlockedTricks(db: Db, now = Date.now()): string[] {
  return TRICKS.filter(
    (t, i) => db.settings.manuallyUnlocked.includes(t.id) || now >= db.settings.startedOn + i * UNLOCK_EVERY
  ).map((t) => t.id);
}

export function cardsForTrick(db: Db, trickId: string) {
  const trick = TRICKS.find((t) => t.id === trickId)!;
  return trick.templates.map((tpl) => db.cards[tpl.id] ?? newCard(tpl.id, 0));
}

export const trickMastery = (db: Db, trickId: string) => masteryFraction(cardsForTrick(db, trickId));

const seed = () => Math.floor(Math.random() * 2 ** 31);

export function buildQueue(db: Db, now = Date.now()): QueueItem[] {
  const q: QueueItem[] = [];
  const learned = db.settings.introducedTricks;
  const learnedTemplates = Object.keys(TEMPLATES).filter((id) => learned.includes(TEMPLATES[id].trick.id));

  // 1. Warm-up: due review cards (about 3 min)
  const due = learnedTemplates
    .map((id) => db.cards[id])
    .filter((c) => c && isDue(c, now))
    .sort((a, b) => a.box - b.box)
    .slice(0, 6);
  for (const c of due) q.push({ kind: 'card', templateId: c.templateId, type: 'use', stage: 'warmup', seed: seed() });

  // 2. New trick (about 5 min)
  const next = unlockedTricks(db, now).find((id) => !learned.includes(id));
  if (next) {
    const trick = TRICKS.find((t) => t.id === next)!;
    q.push({ kind: 'trick', trickId: next, stage: 'new' });
    for (let i = 0; i < 6; i++)
      q.push({ kind: 'card', templateId: trick.templates[i % trick.templates.length].id, type: 'use', stage: 'new', seed: seed() });
  }

  // 3. Mixed practice (about 7 min), weighted toward lower boxes
  const pool = [...learnedTemplates, ...(next ? TRICKS.find((t) => t.id === next)!.templates.map((t) => t.id) : [])];
  const mixedCount = next ? 8 : 14;
  const weights = pool.map((id) => 6 - (db.cards[id]?.box ?? 1));
  const total = weights.reduce((a, b) => a + b, 0);
  let prev = '';
  for (let i = 0; i < mixedCount && pool.length; i++) {
    let id = prev;
    for (let tries = 0; tries < 5 && (id === prev || !id); tries++) {
      let r = Math.random() * total;
      id = pool[pool.length - 1];
      for (let j = 0; j < pool.length; j++) if ((r -= weights[j]) < 0) { id = pool[j]; break; }
      if (pool.length === 1) break;
    }
    prev = id;
    q.push({ kind: 'card', templateId: id, type: 'mixed', stage: 'mixed', seed: seed() });
  }

  // 5. Finish on a win: the easiest (highest-box) card
  const easiest = pool.slice().sort((a, b) => (db.cards[b]?.box ?? 1) - (db.cards[a]?.box ?? 1))[0];
  if (easiest) q.push({ kind: 'card', templateId: easiest, type: 'use', stage: 'finish', seed: seed() });
  return q;
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

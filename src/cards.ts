// Flash cards: the deck comes from the unit reference sheets (tools/build_cards.py -> cards.generated.json); her progress
// is a small per-card record saved under her own key (like MathFacts) and synced by public/sync.js as the "cards" section.
import gen from './cards.generated.json';
import { DAY, INTERVALS } from './scheduler';
import { activeNs } from './profile';

export type CardDef = { id: string; unit: number; lesson: string; kind: 'term' | 'reverse' | 'idea'; front: string; back: string; extra?: string; tag: string };
/** box 1-5 (same ladder as MathFacts), next = when it is due again, seen = times answered, u = last change (for merging). */
export type CardProg = { box: number; next: number; seen: number; u: number };
export type CardsDb = { cards: Record<string, CardProg> };

export const CARDS_KEY = 'mathseye.cards.v1';
const key = () => CARDS_KEY + activeNs();

export const freshCards = (): CardsDb => ({ cards: {} });
export function loadCards(): CardsDb {
  try { const raw = localStorage.getItem(key()); if (raw) { const o = JSON.parse(raw); if (o && typeof o.cards === 'object') return { cards: o.cards }; } } catch { /* start fresh */ }
  return freshCards();
}
export function saveCards(db: CardsDb) {
  try {
    const raw = JSON.stringify(db);
    if (localStorage.getItem(key()) === raw) return;       // only real changes (a device must not look "newer" just for opening the page)
    localStorage.setItem(key(), raw);
    window.mathseyeSync?.touch();
  } catch { /* storage unavailable */ }
}

type GenLesson = { id: string; title: string; cards: Array<{ id: string; kind: 'term' | 'idea'; term?: string; meaning?: string; example?: string; text?: string }> };
type Gen = { decks: Record<string, { lessons: GenLesson[] }> };

export const lessonsOf = (unit: number): Array<{ id: string; title: string }> => ((gen as Gen).decks[String(unit)]?.lessons ?? []).map((l) => ({ id: l.id, title: l.title }));

/** Every card for a unit (optionally some lessons). Term cards also come back flipped around: the meaning is the front, she names the term. */
export function cardsFor(unit: number, lessonIds?: string[]): CardDef[] {
  const out: CardDef[] = [];
  for (const l of (gen as Gen).decks[String(unit)]?.lessons ?? []) {
    if (lessonIds && lessonIds.length && !lessonIds.includes(l.id)) continue;
    for (const c of l.cards) {
      if (c.kind === 'term') {
        out.push({ id: c.id, unit, lesson: l.id, kind: 'term', front: c.term!, back: c.meaning!, extra: c.example, tag: `Lesson ${l.id} · Word` });
        out.push({ id: c.id + '~r', unit, lesson: l.id, kind: 'reverse', front: c.meaning!, back: c.term!, extra: c.example, tag: `Lesson ${l.id} · What's it called?` });
      } else {
        out.push({ id: c.id, unit, lesson: l.id, kind: 'idea', front: `What's the big idea of Lesson ${l.id}, ${l.title}?`, back: c.text!, tag: `Lesson ${l.id} · Big idea` });
      }
    }
  }
  return out;
}

const shuffle = <T,>(a: T[], rand: () => number): T[] => { const b = a.slice(); for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; };

export function counts(defs: CardDef[], db: CardsDb, now: number) {
  let fresh = 0, due = 0, known = 0;
  for (const d of defs) { const p = db.cards[d.id]; if (!p) fresh++; else if (p.next <= now) due++; if (p && p.box >= 4) known++; }
  return { fresh, due, known, total: defs.length };
}

/** A session: cards that are due come first (weakest first), then ones she has not seen; if there is still room, the ones she knows best. */
export function pickSession(defs: CardDef[], db: CardsDb, now: number, n: number | 'all', rand: () => number = Math.random): CardDef[] {
  const due = shuffle(defs.filter((d) => db.cards[d.id] && db.cards[d.id].next <= now), rand).sort((a, b) => db.cards[a.id].box - db.cards[b.id].box);
  const fresh = shuffle(defs.filter((d) => !db.cards[d.id]), rand);
  const rest = shuffle(defs.filter((d) => db.cards[d.id] && db.cards[d.id].next > now), rand).sort((a, b) => db.cards[a.id].box - db.cards[b.id].box);
  const all = [...due, ...fresh, ...rest];
  const picked = n === 'all' ? all : all.slice(0, n);
  // a flipped-around card never sits right after its own front side: keep a card and its twin apart
  const out: CardDef[] = [];
  for (const c of shuffle(picked, rand)) out.push(c);
  for (let i = 1; i < out.length; i++) if (out[i].id.replace('~r', '') === out[i - 1].id.replace('~r', '')) { const j = (i + 2) % out.length; [out[i], out[j]] = [out[j], out[i]]; }
  return out;
}

/** Got it: up a box (next review later). Not yet: back to box 1 and due right away. Never removes anything else. */
export function gradeCard(db: CardsDb, id: string, got: boolean, now: number): CardsDb {
  const p = db.cards[id] ?? { box: 1, next: now, seen: 0, u: 0 };
  const box = got ? Math.min(5, p.box + 1) : 1;
  return { cards: { ...db.cards, [id]: { box, next: now + (got ? INTERVALS[box] : 0), seen: p.seen + 1, u: now } } };
}

export { DAY };

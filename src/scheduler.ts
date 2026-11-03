import type { CardState } from './types';

export const DAY = 24 * 60 * 60 * 1000;
/** Review interval per box (index = box). Box 1 = same session. */
export const INTERVALS = [0, 0, 1 * DAY, 3 * DAY, 7 * DAY, 14 * DAY];

export function newCard(templateId: string, now: number): CardState {
  return { templateId, box: 1, nextDue: now, lastSeen: 0, attempts: 0, box1Returns: 0 };
}

/**
 * Leitner update from the brief:
 * correct, no clue → up one box; correct with clue 1–2 → stay; wrong or clue 3–4 → Box 1.
 */
export function review(card: CardState, correct: boolean, clueLevel: number, now: number): CardState {
  let box = card.box;
  let box1Returns = card.box1Returns;
  if (!correct || clueLevel >= 3) {
    if (box > 1) box1Returns++;
    box = 1;
  } else if (clueLevel === 0) box = Math.min(5, box + 1);
  return { ...card, box, box1Returns, nextDue: now + INTERVALS[box], lastSeen: now, attempts: card.attempts + 1 };
}

export const isDue = (card: CardState, now: number) => card.nextDue <= now;

/** A trick is mastered when 80% of its cards are in Box 4 or 5. */
export function masteryFraction(cards: CardState[]): number {
  if (!cards.length) return 0;
  return cards.filter((c) => c.box >= 4).length / cards.length;
}

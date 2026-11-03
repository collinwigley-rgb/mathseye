import type { Attempt, CardState, Session, Settings } from './types';

// v1 keeps everything on-device in localStorage (small data, no backend).
// Phase 2 can move this to IndexedDB without changing callers.
const KEY = 'mathseye.mathfacts.v1';

export interface SavedSession {
  date: string;
  queue: QueueItem[];
  index: number;
  startedAt: number;
  sessionId: string;
}

export type QueueItem =
  | { kind: 'trick'; trickId: string; stage: Stage }
  | { kind: 'card'; templateId: string; type: 'use' | 'mixed'; stage: Stage; seed: number };

export type Stage = 'warmup' | 'new' | 'mixed' | 'finish';

export interface Db {
  settings: Settings;
  cards: Record<string, CardState>;
  attempts: Attempt[];
  sessions: Session[];
  inProgress?: SavedSession;
}

const fresh = (): Db => ({
  settings: { startedOn: Date.now(), introducedTricks: [], manuallyUnlocked: [] },
  cards: {},
  attempts: [],
  sessions: [],
});

export function load(): Db {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return { ...fresh(), ...JSON.parse(raw) };
  } catch {
    /* private mode or corrupted: start fresh */
  }
  return fresh();
}

export function save(db: Db) {
  try {
    localStorage.setItem(KEY, JSON.stringify(db));
  } catch {
    /* storage unavailable: progress lives in memory this session */
  }
}

export const today = (t = Date.now()) => {
  const d = new Date(t);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

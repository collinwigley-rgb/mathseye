import type { Attempt, CardState, Session, Settings } from './types';

// v1 keeps everything on-device in localStorage (small data, no backend).
// Phase 2 can move this to IndexedDB without changing callers.
import { activeNs } from './profile';
import unitList from './units.json';
import type { SessionPlan } from './session';
/** The unit everyone starts on (the newest one that is ready), until a unit is picked on purpose. */
export const DEFAULT_UNIT = (unitList.units.find((u) => u.id === unitList.current && u.ready) ?? unitList.units.find((u) => u.ready))?.id ?? 2;
const key = () => 'mathseye.mathfacts.v1' + activeNs();   // one saved db per player

export interface SavedSession {
  date: string;
  queue: QueueItem[];
  index: number;
  startedAt: number;
  sessionId: string;
  plan?: SessionPlan;
}

export type QueueItem =
  | { kind: 'trick'; trickId: string; stage: Stage }
  | { kind: 'card'; templateId: string; type: 'use' | 'mixed'; stage: Stage; seed: number };

export type Stage = 'warmup' | 'new' | 'drill' | 'mixed' | 'finish';

export interface Db {
  settings: Settings;
  cards: Record<string, CardState>;
  attempts: Attempt[];
  sessions: Session[];
  inProgress?: SavedSession;
}

export const fresh = (): Db => ({
  settings: { startedOn: Date.now(), introducedTricks: [], manuallyUnlocked: [], currentUnit: DEFAULT_UNIT, factsMode: 'unit' },
  cards: {},
  attempts: [],
  sessions: [],
});

export function load(): Db {
  try {
    const raw = localStorage.getItem(key());
    if (raw) { const saved = JSON.parse(raw); const settings = { ...fresh().settings, ...saved.settings }; if (!settings.unitPicked) settings.currentUnit = DEFAULT_UNIT; return { ...fresh(), ...saved, settings }; }
  } catch {
    /* private mode or corrupted: start fresh */
  }
  return fresh();
}

export function save(db: Db) {
  try {
    localStorage.setItem(key(), JSON.stringify(db));
    window.mathseyeSync?.touch();
  } catch {
    /* storage unavailable: progress lives in memory this session */
  }
}

export const today = (t = Date.now()) => {
  const d = new Date(t);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

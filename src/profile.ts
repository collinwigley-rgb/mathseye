// Who is using the app. Each player's progress is stored under its own key, so nobody overlaps.
// Everything stays on this device. The first player created adopts any progress saved before profiles existed.
export interface Profile { id: string; name: string; ns: string }

const LIST = 'mathseye.profiles', ACTIVE = 'mathseye.profile';

const read = <T,>(k: string, d: T): T => { try { const v = localStorage.getItem(k); return v ? (JSON.parse(v) as T) : d; } catch { return d; } };
const write = (k: string, v: unknown) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* storage unavailable */ } };

export const profiles = (): Profile[] => read<Profile[]>(LIST, []);
export const activeId = (): string | null => { try { return localStorage.getItem(ACTIVE); } catch { return null; } };
export const activeProfile = (): Profile | null => profiles().find((p) => p.id === activeId()) ?? null;
/** Key suffix for the active player ('' when nobody is chosen, which is the pre-profile storage). */
export const activeNs = (): string => activeProfile()?.ns ?? '';

export function setActive(id: string) { try { localStorage.setItem(ACTIVE, id); } catch { /* ignore */ } }
/** Ask who is using only when nobody has been chosen on this device yet; otherwise stick with the last player. */
export const needsWho = (): boolean => !activeProfile();

export function addProfile(name: string): Profile {
  const list = profiles();
  const clean = name.trim().slice(0, 20) || 'Player';
  const p: Profile = { id: 'p' + Date.now().toString(36), name: clean, ns: list.length === 0 ? '' : '.p' + Date.now().toString(36) };
  write(LIST, [...list, p]);
  return p;
}

const BASE_KEYS = ['mathseye.mathfacts.v1', 'mathseye.unit2.study.v2', 'mathseye.hw.unit2.v1', 'mathseye.cards.v1'];
export function removeProfile(id: string) {
  const p = profiles().find((x) => x.id === id);
  if (!p) return;
  try { for (const k of BASE_KEYS) localStorage.removeItem(k + p.ns); } catch { /* ignore */ }
  write(LIST, profiles().filter((x) => x.id !== id));
  if (activeId() === id) { try { localStorage.removeItem(ACTIVE); } catch { /* ignore */ } }
}

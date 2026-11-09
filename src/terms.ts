// The school calendar (src/terms.json) decides which unit everyone starts on: each unit in src/units.json belongs to a term.
import termData from './terms.json';
import unitList from './units.json';

export type Term = (typeof termData.terms)[number];
/** Local calendar date as YYYY-MM-DD (the iPad's own date, which is what the school day follows). */
export const dateStr = (d: Date = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

/** The term a date falls in. Between terms (a break) it is the term that just ended, so the last unit stays until the next one starts. */
export function termOn(date: string = dateStr()): Term | null {
  const t = termData.terms;
  const inside = t.find((x) => date >= x.start && date <= x.end);
  if (inside) return inside;
  const past = t.filter((x) => x.end < date);
  return past.length ? past[past.length - 1] : (t[0] ?? null);
}
/** The midterm window if the date is inside one. */
export function midtermOn(date: string = dateStr()): { label: string; end: string } | null {
  const t = termOn(date);
  return t && date >= t.midterm.start && date <= t.midterm.end ? { label: t.midterm.label, end: t.midterm.end } : null;
}
/** The unit for a date: the ready unit that belongs to that term, else the list's own current unit, else the newest ready one. */
export function unitForDate(date: string = dateStr()): number {
  const term = termOn(date);
  const byTerm = term && unitList.units.find((u) => u.ready && (u as { term?: number }).term === term.id);
  return (byTerm ?? unitList.units.find((u) => u.id === unitList.current && u.ready) ?? unitList.units.find((u) => u.ready))?.id ?? 2;
}
export const shortDate = (iso: string) => new Date(iso + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

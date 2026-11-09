import { useEffect, useMemo, useRef, useState } from 'react';
import { cardsFor, counts, gradeCard, lessonsOf, loadCards, pickSession, saveCards, type CardDef, type CardsDb } from './cards';

type Phase = 'setup' | 'play' | 'done';

/** Flash cards: pick lessons and a length, flip each card, say whether she knew it. Calm: nothing is ever taken away. */
export default function Cards({ unit, lesson, onBack }: { unit: number; lesson: string | null; onBack: () => void }) {
  const lessons = useMemo(() => lessonsOf(unit), [unit]);
  const [db, setDb] = useState<CardsDb>(() => loadCards());
  const [chosen, setChosen] = useState<string[]>(() => (lesson && lessons.some((l) => l.id === lesson) ? [lesson] : []));
  const [len, setLen] = useState<5 | 10 | 'all'>(10);
  const [phase, setPhase] = useState<Phase>('setup');
  const [queue, setQueue] = useState<CardDef[]>([]);
  const [i, setI] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [knew, setKnew] = useState(0);
  const [again, setAgain] = useState(0);
  const retried = useRef<Record<string, number>>({});
  const defs = useMemo(() => cardsFor(unit, chosen), [unit, chosen]);
  const stat = useMemo(() => counts(defs, db, Date.now()), [defs, db]);
  const toggle = (id: string) => setChosen((c) => (c.includes(id) ? c.filter((x) => x !== id) : [...c, id]));

  const start = () => {
    const q = pickSession(defs, db, Date.now(), len);
    if (!q.length) return;
    retried.current = {}; setQueue(q); setI(0); setFlipped(false); setKnew(0); setAgain(0); setPhase('play');
  };
  const answer = (got: boolean) => {
    const c = queue[i]; if (!c) return;
    const next = gradeCard(db, c.id, got, Date.now()); setDb(next); saveCards(next);
    if (got) setKnew((n) => n + 1); else setAgain((n) => n + 1);
    let q = queue;
    if (!got && (retried.current[c.id] ?? 0) < 1) { retried.current[c.id] = 1; q = [...queue, c]; setQueue(q); }   // a "not yet" card comes back once more this round
    if (i + 1 >= q.length) setPhase('done'); else { setI(i + 1); setFlipped(false); }
  };

  const key = useRef<(e: KeyboardEvent) => void>();
  key.current = (e) => {
    if (phase !== 'play') return;
    if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); setFlipped((f) => !f); }
    else if (flipped && e.key === 'ArrowRight') answer(true);
    else if (flipped && e.key === 'ArrowLeft') answer(false);
  };
  useEffect(() => { const h = (e: KeyboardEvent) => key.current?.(e); document.addEventListener('keydown', h); return () => document.removeEventListener('keydown', h); }, []);

  if (phase === 'setup') {
    return (
      <main className="cardsmod">
        <div className="ctop"><button className="link" onClick={onBack}>{'←'} Home</button></div>
        <header className="chead"><p className="eyebrow">Unit {unit}</p><h2>Flash Cards</h2><p className="ask">Flip each card. Tap Got it or Not yet.</p></header>
        {lessons.length === 0 ? <p className="ask">No cards for this unit yet.</p> : (
          <div className="csetup">
            <section><p className="eyebrow">Which lessons?</p>
              <div className="cchips" role="group" aria-label="Lessons">
                <button type="button" aria-pressed={chosen.length === 0} onClick={() => setChosen([])}>All lessons</button>
                {lessons.map((l) => <button key={l.id} type="button" aria-pressed={chosen.includes(l.id)} onClick={() => toggle(l.id)}>{l.id} <small>{l.title}</small></button>)}
              </div></section>
            <section><p className="eyebrow">How many?</p>
              <div className="cchips" role="group" aria-label="Cards in this round">
                {([5, 10, 'all'] as const).map((n) => <button key={n} type="button" aria-pressed={len === n} onClick={() => setLen(n)}>{n === 'all' ? 'All of them' : `${n} cards`}</button>)}
              </div></section>
            <p className="cstat">{stat.total} cards {'·'} {stat.due} to review {'·'} {stat.fresh} new {'·'} {stat.known} known well</p>
            <button className="primary big" onClick={start} disabled={!defs.length}>Start</button>
          </div>
        )}
      </main>
    );
  }
  if (phase === 'done') {
    return (
      <main className="cardsmod">
        <header className="chead"><p className="eyebrow">That's a wrap</p><h2>{knew} knew it</h2>
          <p className="ask">{again > 0 ? `${again} will come back soon. That's how they stick.` : 'Every one was a clean take.'}</p></header>
        <div className="cdone"><button className="primary big" onClick={() => { setPhase('setup'); }}>Another round</button><button className="link" onClick={onBack}>Back home</button></div>
      </main>
    );
  }
  const c = queue[i];
  return (
    <main className="cardsmod playing">
      <div className="ctop"><button className="link" onClick={() => setPhase('setup')}>{'✕'} Done for now</button><span className="cn">{Math.min(i + 1, queue.length)} of {queue.length}</span></div>
      <button type="button" className={`fcard${flipped ? ' flip' : ''}`} onClick={() => setFlipped((f) => !f)} aria-label={flipped ? 'Show the front' : 'Flip the card'}>
        <span className="face front"><span className="tag">{c.tag}</span><span className={`ftext${c.front.length > 60 ? ' long' : ''}`}>{c.front}</span><span className="hint">Tap to flip</span></span>
        <span className="face back"><span className="tag">{c.tag}</span><span className={`ftext${c.back.length > 60 ? ' long' : ''}`}>{c.back}</span>{c.extra && <span className="fex">For example: {c.extra}</span>}</span>
      </button>
      <div className="cans" aria-live="polite">
        {flipped ? <><button className="notyet" onClick={() => answer(false)}>Not yet</button><button className="gotit" onClick={() => answer(true)}>Got it</button></> : <p className="hint2">Say it in your head first, then flip.</p>}
      </div>
    </main>
  );
}

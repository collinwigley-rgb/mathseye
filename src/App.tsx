import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { TEMPLATES, TRICKS } from './content';
import { checkAnswer } from './answer';
import { GENERATORS, fill, seeded, MINUS } from './generators';
import { newCard, review } from './scheduler';
import { buildQueue, confidence, SESSION_MS, streak, trickMastery, tricksFor, unlockedTricks } from './session';
import Mark from './Mark';
import { BRANDS, MEMBERS, getBrand, setBrand, type BrandId } from './brand';
import { fresh, load, save, today, type Db, type QueueItem } from './store';
import type { Problem } from './types';

type Screen = 'hub' | 'facts' | 'session' | 'summary' | 'grownups';

export default function App() {
  const [db, setDb] = useState<Db>(load);
  const [screen, setScreen] = useState<Screen>('hub');
  const update = (fn: (d: Db) => Db) => setDb((d) => { const n = fn(d); save(n); return n; });

  const startOrResume = () => {
    update((d) => {
      if (d.inProgress && d.inProgress.date === today()) return d;
      const id = String(Date.now());
      return {
        ...d,
        inProgress: { date: today(), queue: buildQueue(d), index: 0, startedAt: Date.now(), sessionId: id },
        sessions: [...d.sessions, { id, date: today(), startedAt: Date.now(), cardsSeen: 0 }],
      };
    });
    setScreen('session');
  };

  if (screen === 'session' && db.inProgress)
    return <SessionView db={db} update={update} onPause={() => setScreen('facts')} onDone={() => setScreen('summary')} />;
  if (screen === 'summary') return <Summary db={db} onHome={() => setScreen('facts')} />;
  if (screen === 'grownups') return <Grownups db={db} update={update} onBack={() => setScreen('hub')} />;
  if (screen === 'facts') return <FactsHome db={db} update={update} onStart={startOrResume} onBack={() => setScreen('hub')} />;
  return <Hub db={db} onFacts={() => setScreen('facts')} onGrownups={() => setScreen('grownups')} />;
}

type Brand = (typeof BRANDS)[number];

function Burst() {
  const bits = useMemo(() => Array.from({ length: 12 }, (_, i) => { const a = (i / 12) * Math.PI * 2 + (i % 3) * 0.15, d = 56 + (i % 4) * 14; return { dx: Math.cos(a) * d, dy: Math.sin(a) * d, alt: i % 2 === 1 }; }), []);
  return (
    <span className="burst" aria-hidden="true">
      {bits.map((b, i) => <i key={i} style={{ background: b.alt ? 'var(--amber)' : 'var(--amber2)', '--dx': `${b.dx}px`, '--dy': `${b.dy}px` } as CSSProperties} />)}
    </span>
  );
}

function ColorPicker({ cur, onPick }: { cur: BrandId; onPick: (id: BrandId) => void }) {
  const label = (b: Brand) => (b.member ? (BRANDS.filter((x) => x.member === b.member).length > 1 ? `${b.member} · ${b.label}` : b.member) : b.label);
  const chip = (b: Brand) => (
    <button key={b.id} className="sw" aria-pressed={cur === b.id} onClick={() => onPick(b.id)}>
      <i style={{ background: b.accent }} />
      <span>{label(b)}</span>
    </button>
  );
  const members = MEMBERS.flatMap((m) => BRANDS.filter((b) => b.member === m));
  const other = BRANDS.filter((b) => !b.member);
  return (
    <div className="picker" role="group" aria-label="Color scheme">
      <div className="swatches six">{members.map(chip)}</div>
      <details className="more" open={other.some((b) => b.id === cur)}>
        <summary>More palettes</summary>
        <div className="swatches">{other.map(chip)}</div>
      </details>
    </div>
  );
}

function Hub({ db, onFacts, onGrownups }: { db: Db; onFacts: () => void; onGrownups: () => void }) {
  const unit = db.settings.currentUnit ?? 2;
  const [cur, setCur] = useState<BrandId>(getBrand());
  const brand = BRANDS.find((b) => b.id === cur)!;
  const mood = brand.member ? `${brand.label} · ${brand.member}'s color` : `${brand.label} palette`;
  return (
    <main className="home">
      <div className="logo"><Mark size={84} /><h1 className="brand">MATHSEYE<small>Unit {unit}</small></h1></div>
      <p className="mood">{mood} ✦</p>
      <nav className="tiles3" aria-label="Sections">
        <button className="tile3" onClick={onFacts}><b>MathFacts</b><span>Quick mental-math practice</span></button>
        <a className="tile3" href={`./study/unit-${unit}.html`}><b>Study Guide</b><span>Get ready for the test</span></a>
        <a className="tile3" href={`./homework/unit-${unit}.html`}><b>Unit Homework</b><span>Help with this unit's worksheets</span></a>
      </nav>
      <section className="pick"><p className="eyebrow">Pick your color</p><ColorPicker cur={cur} onPick={(id) => { setBrand(id); setCur(id); }} /></section>
      <button className="link" onClick={onGrownups}>Grown-ups</button>
    </main>
  );
}

function FactsHome({ db, update, onStart, onBack }: { db: Db; update: (fn: (d: Db) => Db) => void; onStart: () => void; onBack: () => void }) {
  const resumable = db.inProgress?.date === today();
  const doneTonight = db.sessions.some((s) => s.date === today() && s.endedAt);
  const conf = confidence(db);
  const mode = db.settings.factsMode ?? 'unit';
  const unit = db.settings.currentUnit ?? 2;
  const ids = new Set(tricksFor(db).map((t) => t.id));
  const learned = TRICKS.filter((t) => db.settings.introducedTricks.includes(t.id) && ids.has(t.id));
  const setMode = (m: 'unit' | 'general') => update((d) => ({ ...d, settings: { ...d.settings, factsMode: m } }));
  return (
    <main className="home">
      <div className="top"><button className="link" onClick={onBack}>← Home</button></div>
      <button className="logobtn" onClick={onBack} aria-label="Mathseye, back to home"><Mark size={56} /><span className="wm">MATHSEYE</span></button>
      <h1 className="h1">MathFacts</h1>
      <div className="seg" role="group" aria-label="Which facts">
        <button aria-pressed={mode === 'unit'} onClick={() => setMode('unit')}>Unit {unit} facts</button>
        <button aria-pressed={mode === 'general'} onClick={() => setMode('general')}>Any facts</button>
      </div>
      <div className="stats">
        <div><b>{streak(db)}</b><span>night streak</span></div>
        <div><b>{conf === null ? '—' : Math.round(conf * 100) + '%'}</b><span>mental math confidence</span></div>
        <div><b>{learned.length}</b><span>tricks learned</span></div>
      </div>
      <button className="primary big" onClick={onStart}>
        {resumable ? 'Keep going' : doneTonight ? 'Bonus session' : "Start tonight's session"}
      </button>
      {learned.length > 0 && (
        <section className="mastery">
          <h2>Your tricks</h2>
          {learned.map((t) => {
            const m = trickMastery(db, t.id);
            return (
              <div key={t.id} className="mrow">
                <span>{t.name}</span>
                <div className="bar"><i style={{ width: `${Math.max(4, m * 100)}%` }} /></div>
              </div>
            );
          })}
        </section>
      )}
    </main>
  );
}

function makeProblem(item: Extract<QueueItem, { kind: 'card' }>): Problem {
  const { template } = TEMPLATES[item.templateId];
  return GENERATORS[template.generator](seeded(item.seed), template.params);
}

function SessionView({ db, update, onPause, onDone }: {
  db: Db; update: (fn: (d: Db) => Db) => void; onPause: () => void; onDone: () => void;
}) {
  const s = db.inProgress!;
  const item = s.queue[s.index];
  const [now, setNow] = useState(Date.now());
  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(t); }, []);
  const overTime = now - s.startedAt > SESSION_MS;

  const finish = () => {
    update((d) => ({
      ...d,
      inProgress: undefined,
      sessions: d.sessions.map((x) => (x.id === s.sessionId ? { ...x, endedAt: Date.now() } : x)),
    }));
    onDone();
  };

  // Hard stop at 20 minutes: jump to the finishing card.
  useEffect(() => {
    if (overTime && item && item.stage !== 'finish') {
      const fin = s.queue.findIndex((q) => q.stage === 'finish');
      update((d) => ({ ...d, inProgress: { ...s, index: fin >= 0 ? fin : s.queue.length } }));
    }
  }, [overTime, item]);

  useEffect(() => { if (!item) finish(); }, [item]);
  if (!item) return null;

  const advance = (insertSimilar?: QueueItem) =>
    update((d) => {
      const q = d.inProgress!.queue.slice();
      if (insertSimilar) q.splice(s.index + 1, 0, insertSimilar);
      return { ...d, inProgress: { ...d.inProgress!, queue: q, index: s.index + 1 } };
    });

  const stages = ['warmup', 'new', 'mixed', 'finish'].filter((st) => s.queue.some((q) => q.stage === st));
  return (
    <main className="session">
      <header>
        <button className="link" onClick={onPause}>Pause</button>
        <div className="dots">
          {stages.map((st) => (
            <i key={st} className={st === item.stage ? 'on' : stages.indexOf(st) < stages.indexOf(item.stage) ? 'done' : ''} />
          ))}
        </div>
        <span className="stagename">{STAGE_LABEL[item.stage]}</span>
      </header>
      {item.kind === 'trick' ? (
        <TrickCard
          key={s.index}
          trickId={item.trickId}
          onGo={() => {
            update((d) => ({ ...d, settings: { ...d.settings, introducedTricks: [...new Set([...d.settings.introducedTricks, item.trickId])] } }));
            advance();
          }}
        />
      ) : (
        <PracticeCard key={s.index + ':' + item.seed} item={item} db={db} update={update} onNext={advance} />
      )}
    </main>
  );
}

const STAGE_LABEL = { warmup: 'Warm-up', new: 'New trick', mixed: 'Mixed practice', finish: 'Finish on a win' };

function TrickCard({ trickId, onGo }: { trickId: string; onGo: () => void }) {
  const t = TRICKS.find((x) => x.id === trickId)!;
  const [why, setWhy] = useState(false);
  return (
    <section className="trickcard">
      <p className="eyebrow">New trick</p>
      <h2>{t.name}</h2>
      <p className="rule">{t.rule}</p>
      <p className="example">{t.example}</p>
      {why ? <p className="why">{t.why}</p> : <button className="ghost" onClick={() => setWhy(true)}>Show me why</button>}
      <button className="primary" onClick={onGo}>Let's try it</button>
    </section>
  );
}

function PracticeCard({ item, db, update, onNext }: {
  item: Extract<QueueItem, { kind: 'card' }>; db: Db; update: (fn: (d: Db) => Db) => void; onNext: (similar?: QueueItem) => void;
}) {
  const { trick, template } = TEMPLATES[item.templateId];
  const problem = useMemo(() => makeProblem(item), [item]);
  const [input, setInput] = useState('');
  const [clueLevel, setClueLevel] = useState(0);
  const [tries, setTries] = useState(0);
  const [shake, setShake] = useState(false);
  const [solved, setSolved] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const started = useRef(Date.now());
  const recorded = useRef(false);
  useEffect(() => { const t = setInterval(() => setElapsed(Date.now() - started.current), 500); return () => clearInterval(t); }, []);

  const box = db.cards[item.templateId]?.box ?? 1;
  const clues = template.clues.map((c, i) =>
    i === 1 && box >= 4 ? 'Which trick fits?' : fill(c, problem.vars)
  );
  const canShowMe = tries > 0 || elapsed >= 15000;
  const showName = item.type === 'use' && item.stage !== 'finish';

  const record = (correct: boolean, answer: string) => {
    if (recorded.current) return;
    recorded.current = true;
    const t = Date.now();
    update((d) => {
      const card = d.cards[item.templateId] ?? newCard(item.templateId, t);
      return {
        ...d,
        cards: { ...d.cards, [item.templateId]: review(card, correct, clueLevel, t) },
        attempts: [...d.attempts, { templateId: item.templateId, timestamp: t, answer, correct, msToAnswer: t - started.current, clueLevel, cardType: item.type }],
        sessions: d.sessions.map((x) => (x.id === d.inProgress?.sessionId ? { ...x, cardsSeen: x.cardsSeen + 1 } : x)),
      };
    });
  };

  const submit = (value = input) => {
    if (!value || solved) return;
    const ok = checkAnswer(value, problem.answer, template.answerFormat);
    record(ok, value);
    setTries((n) => n + 1);
    if (ok) setSolved(true);
    else { setShake(true); setTimeout(() => setShake(false), 400); setInput(''); }
  };

  const next = () => {
    // After "Show me", follow right away with a similar card she solves alone.
    const similar = clueLevel >= 4 ? { ...item, seed: Math.floor(Math.random() * 90000) + 10000, stage: item.stage } : undefined;
    onNext(similar);
  };

  return (
    <section className="practice">
      <span className="ref" aria-label="Reference number">#{item.templateId}-{item.seed}</span>
      <div className="problem-area">
        {showName && <p className="eyebrow">{trick.name}</p>}
        <div className={`problem ${shake ? 'shake' : ''} ${solved ? 'solved' : ''}`}>{problem.prompt}</div>
        <div className="answer">
          {solved && <Burst />}
          {solved ? <span className="right">{template.answerFormat === 'yesno' ? problem.answer : input} ✓</span> : input || <span className="placeholder">?</span>}
        </div>
        <div className="feedback">
          {solved ? (tries === 1 && clueLevel === 0 ? 'Nice, in your head.' : 'You got it.') : tries > 0 ? 'Try again, or tap the lightbulb.' : ''}
        </div>
        <ol className="clues">{clues.slice(0, clueLevel).map((c, i) => <li key={i}>{c}</li>)}</ol>
      </div>
      <div className="padwrap">
        {solved ? (
          <button className="primary big" onClick={next}>Next</button>
        ) : (
          <>
            <button
              className="clue"
              disabled={clueLevel >= 4 || (clueLevel === 3 && !canShowMe)}
              onClick={() => setClueLevel((l) => l + 1)}
              aria-label="Clue"
            >💡 {clueLevel < 3 ? 'Clue' : clueLevel === 3 ? (canShowMe ? 'Show me' : 'Show me soon') : ''}</button>
            {template.answerFormat === 'yesno' ? (
              <div className="pad yesno">
                <button onClick={() => { setInput('yes'); submit('yes'); }}>Yes</button>
                <button onClick={() => { setInput('no'); submit('no'); }}>No</button>
              </div>
            ) : (
              <NumberPad
                onKey={(k) => setInput((v) => (k === '⌫' ? v.slice(0, -1) : v.length < 10 ? v + k : v))}
                onEnter={() => submit()}
              />
            )}
          </>
        )}
      </div>
    </section>
  );
}

function NumberPad({ onKey, onEnter }: { onKey: (k: string) => void; onEnter: () => void }) {
  const keys = ['7', '8', '9', '4', '5', '6', '1', '2', '3', MINUS, '0', '.', '/', '⌫'];
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (/^[0-9./]$/.test(e.key)) onKey(e.key);
      else if (e.key === '-') onKey(MINUS);
      else if (e.key === 'Backspace') onKey('⌫');
      else if (e.key === 'Enter') onEnter();
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [onKey, onEnter]);
  return (
    <div className="pad">
      {keys.map((k) => <button key={k} onClick={() => onKey(k)}>{k}</button>)}
      <button className="enter" onClick={onEnter}>Check</button>
    </div>
  );
}

function Summary({ db, onHome }: { db: Db; onHome: () => void }) {
  const last = db.sessions[db.sessions.length - 1];
  const attempts = last ? db.attempts.filter((a) => a.timestamp >= last.startedAt) : [];
  const inHead = attempts.filter((a) => a.correct && a.clueLevel === 0).length;
  return (
    <main className="summary">
      <h2>That's a wrap for tonight.</h2>
      <p>{attempts.length} cards · {inHead} straight from your head.</p>
      <p className="muted">Streak: {streak(db)} night{streak(db) === 1 ? '' : 's'}. Sleep well.</p>
      <button className="primary" onClick={onHome}>Done</button>
    </main>
  );
}

function Grownups({ db, update, onBack }: { db: Db; update: (fn: (d: Db) => Db) => void; onBack: () => void }) {
  const [confirmReset, setConfirmReset] = useState(false);
  const unlocked = unlockedTricks(db);
  const sticky = Object.values(db.cards).sort((a, b) => b.box1Returns - a.box1Returns).filter((c) => c.box1Returns > 0).slice(0, 5);
  return (
    <main className="grownups">
      <button className="link" onClick={onBack}>← Back</button>
      <h2>Grown-ups</h2>
      <p className="muted">New tricks unlock about two per week. Unlock one early here.</p>
      {TRICKS.map((t) => (
        <div key={t.id} className="mrow">
          <span>{t.name} <small className="muted">· {t.workbookSection}</small></span>
          <span className="muted">{Math.round(trickMastery(db, t.id) * 100)}% mastered</span>
          {unlocked.includes(t.id) ? <span className="muted">unlocked</span> : (
            <button className="ghost" onClick={() => update((d) => ({ ...d, settings: { ...d.settings, manuallyUnlocked: [...d.settings.manuallyUnlocked, t.id] } }))}>Unlock</button>
          )}
        </div>
      ))}
      <h3>Stickiest cards</h3>
      {sticky.length ? sticky.map((c) => <p key={c.templateId}>{TEMPLATES[c.templateId].trick.name} ({c.templateId}): {c.box1Returns} returns</p>) : <p className="muted">None yet.</p>}
      <p className="muted">{db.sessions.filter((s) => s.endedAt).length} sessions completed.</p>
      <h3>Reset progress</h3>
      {!confirmReset ? (
        <button className="ghost" onClick={() => setConfirmReset(true)}>Reset all progress</button>
      ) : (
        <div className="resetbox">
          <p>Erase all tricks learned, streaks, and history on this device? This can't be undone.</p>
          <button className="primary" onClick={() => { update(() => fresh()); setConfirmReset(false); onBack(); }}>Yes, reset everything</button>
          <button className="ghost" onClick={() => setConfirmReset(false)}>Keep my progress</button>
        </div>
      )}
    </main>
  );
}

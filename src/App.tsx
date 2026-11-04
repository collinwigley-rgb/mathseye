import { Fx } from './Fx';
import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { TEMPLATES, TRICKS } from './content';
import { checkAnswer } from './answer';
import { GENERATORS, fill, seeded, MINUS } from './generators';
import { newCard, review } from './scheduler';
import { buildQueue, confidence, streak, trickMastery, tricksFor, type Focus, type Length, type SessionPlan } from './session';
import { activeProfile, addProfile, needsWho, profiles, removeProfile, setActive, type Profile } from './profile';
import Mark from './Mark';
import factLinks from './factlinks.json';
import { BRANDS, ICONS, MEMBERS, getBrand, setBrand, type BrandId } from './brand';
import { fresh, load, save, today, type Db, type QueueItem } from './store';
import type { Problem } from './types';

type Screen = 'who' | 'hub' | 'facts' | 'setup' | 'session' | 'summary' | 'grownups';

export default function App() {
  const [db, setDb] = useState<Db>(load);
  const factParam = new URLSearchParams(location.search).get('fact');
  const [screen, setScreen] = useState<Screen>(needsWho() || /[?&]who=1/.test(location.search) ? 'who' : factParam && TRICKS.some((t) => t.id === factParam) ? 'setup' : 'hub');
  const [pre, setPre] = useState<string[]>(factParam && TRICKS.some((t) => t.id === factParam) ? [factParam] : []);
  const [, bump] = useState(0);
  const update = (fn: (d: Db) => Db) => setDb((d) => { const n = fn(d); save(n); return n; });

  // With no plan: pick up today's unfinished session. With a plan: start a fresh one.
  const startOrResume = (plan?: SessionPlan) => {
    update((d) => {
      if (!plan && d.inProgress && d.inProgress.date === today()) return d;
      const p = plan ?? { focus: { kind: 'mix' } as Focus, length: { mode: 'continuous' } as Length };
      const id = String(Date.now());
      return {
        ...d,
        settings: { ...d.settings, lastPlan: plan ?? d.settings.lastPlan },
        inProgress: { date: today(), queue: buildQueue(d, Date.now(), p.focus, p.length), index: 0, startedAt: Date.now(), sessionId: id, plan: p },
        sessions: [...d.sessions, { id, date: today(), startedAt: Date.now(), cardsSeen: 0 }],
      };
    });
    setScreen('session');
  };
  const choose = (id: string) => { setActive(id); setDb(load()); setScreen('hub'); void pull(); };
  // Bring this player's progress up to date from the server (and send ours), then refresh what is on screen.
  const pull = () => window.mathseyeSync?.sync().then((r) => { if (r?.changed) setDb(load()); });
  useEffect(() => { if (activeProfile()) void pull(); }, []);

  if (screen === 'who') return <Who onChoose={choose} />;
  let view: JSX.Element;
  if (screen === 'session' && db.inProgress) view =
    <SessionView db={db} update={update} onPause={() => setScreen('facts')} onDone={() => setScreen('summary')} />;
  else if (screen === 'summary') view = <Summary db={db} onHome={() => setScreen('facts')} />;
  else if (screen === 'grownups') view = <Grownups db={db} update={update} onBack={() => setScreen('hub')} onRemoved={() => { bump((n) => n + 1); if (!activeProfile()) setScreen('who'); }} />;
  else if (screen === 'setup') view = <Setup db={db} pre={pre} onStart={startOrResume} onBack={() => setScreen('facts')} />;
  else if (screen === 'facts') view = <FactsHome db={db} update={update} onStart={startOrResume} onSetup={(ids) => { setPre(ids ?? []); setScreen('setup'); }} onWho={() => setScreen('who')} onBack={() => setScreen('hub')} />;
  else view = <Hub db={db} onFacts={() => setScreen('facts')} onGrownups={() => setScreen('grownups')} onWho={() => setScreen('who')} />;

  return <>{view}<PlayerMenu onChoose={choose} /><BackPill /></>;
}

/** Arrived from the study guide's "Practice it": offer a way back to the same problem. */
function BackPill() {
  const [back, setBack] = useState(() => {
    try {
      if (new URLSearchParams(location.search).get('back') === 'study') sessionStorage.setItem('mathseye.back', 'study');
      return sessionStorage.getItem('mathseye.back') === 'study';
    } catch { return false; }
  });
  if (!back) return null;
  return <a className="backpill" href="./study/unit-2.html" onClick={() => { try { sessionStorage.removeItem('mathseye.back'); } catch { /* ignore */ } setBack(false); }}>← Back to my problem</a>;
}

/** "#48 · 99193d0 · Nov 4 15:55": the build, with its time in 24h on this device's clock. */
function buildLabel(): string {
  const d = new Date(__BUILD_AT__);
  if (isNaN(d.getTime())) return __BUILD__;
  const day = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const time = d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false });
  return `${__BUILD__} · ${day} ${time}`;
}

function syncLabel(): string {
  const st = window.mathseyeSync?.status();
  if (!st || !st.at) return st?.ok === false ? 'Not saved to the server yet' : 'Saving to the server…';
  const t = new Date(st.at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false });
  return st.ok === false ? `Offline. Last saved ${t}` : `Saved to the server ${t}`;
}

function PlayerMenu({ onChoose }: { onChoose: (id: string) => void }) {
  const [open, setOpen] = useState(false);
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState('');
  const me = activeProfile();
  const { others } = useServerNames(profiles());
  if (!me) return null;
  const add = () => { if (!name.trim()) return; const p = addProfile(name); setName(''); setAdding(false); setOpen(false); onChoose(p.id); };
  return (
    <div className="pmenu">
      <button className="pchip" aria-haspopup="true" aria-expanded={open} onClick={() => setOpen(!open)}><i>{me.name.charAt(0).toUpperCase()}</i>{me.name} ▾</button>
      {open && (
        <div className="ppop" role="menu">
          <p className="eyebrow">Who's playing?</p>
          {profiles().map((p) => (
            <button key={p.id} role="menuitem" className="pitem" aria-current={p.id === me.id} onClick={() => { setOpen(false); onChoose(p.id); }}>
              <i>{p.name.charAt(0).toUpperCase()}</i><span>{p.name}</span>{p.id === me.id && <b>✓</b>}
            </button>
          ))}
          {others.map((n) => (
            <button key={n} role="menuitem" className="pitem" onClick={() => { setOpen(false); onChoose(addProfile(n).id); }}><i>{n.charAt(0).toUpperCase()}</i><span>{n}</span></button>
          ))}
          {adding ? (
            <form onSubmit={(e) => { e.preventDefault(); add(); }}>
              <input value={name} maxLength={20} autoFocus autoComplete="off" placeholder="Name" aria-label="New player's name" onChange={(e) => setName(e.target.value)} />
              <button className="primary" type="submit" disabled={!name.trim()}>Add</button>
            </form>
          ) : <button className="pitem" onClick={() => setAdding(true)}><i>+</i><span>Add someone</span></button>}
          <p className="build" aria-label="Build number">Build {buildLabel()}</p>
          <p className="build">{syncLabel()}</p>
        </div>
      )}
    </div>
  );
}

/** Names saved on the server that are not on this device yet. Tapping one adds it here and brings its progress. */
function useServerNames(local: Profile[]) {
  const [remote, setRemote] = useState<string[]>([]);
  const [loaded, setLoaded] = useState(false);
  useEffect(() => { void (window.mathseyeSync ? window.mathseyeSync.players() : Promise.resolve([])).then((l) => { setRemote(l.map((p) => p.name)); setLoaded(true); }); }, []);
  const have = new Set(local.map((p) => (window.mathseyeSync?.norm(p.name) ?? p.name.toLowerCase())));
  return { others: remote.filter((n) => !have.has(window.mathseyeSync?.norm(n) ?? n.toLowerCase())), loaded };
}

function Who({ onChoose }: { onChoose: (id: string) => void }) {
  const [list, setList] = useState<Profile[]>(profiles());
  const { others, loaded } = useServerNames(list);
  // Names first: she only types when her name is not in the list (or there are no names anywhere yet).
  const [asked, setAsked] = useState(false);
  const adding = asked || (loaded && list.length === 0 && others.length === 0);
  const setAdding = (v: boolean) => setAsked(v);
  const [name, setName] = useState('');
  const add = () => { if (!name.trim()) return; const p = addProfile(name); setList(profiles()); onChoose(p.id); };
  return (
    <main className="home who">
      <div className="logo"><Mark size={72} /><h1 className="brand">MATHSEYE</h1></div>
      <h1 className="h1">Who's using Mathseye?</h1>
      <p className="muted">Tap your name. Only type one if it isn't here.</p>
      <div className="whogrid">
        {list.map((p) => <button key={p.id} className="whotile" onClick={() => onChoose(p.id)}><i>{p.name.charAt(0).toUpperCase()}</i><span>{p.name}</span></button>)}
        {others.map((n) => <button key={n} className="whotile" onClick={() => onChoose(addProfile(n).id)}><i>{n.charAt(0).toUpperCase()}</i><span>{n}</span></button>)}
        {!adding && loaded && <button className="whotile add" onClick={() => setAdding(true)}><i>+</i><span>New name</span></button>}
      </div>
      {!loaded && list.length === 0 && <p className="muted">Looking for names…</p>}
      {adding && (
        <form className="whoadd" onSubmit={(e) => { e.preventDefault(); add(); }}>
          <label htmlFor="who-name" className="eyebrow">Your name</label>
          <input id="who-name" value={name} maxLength={20} autoFocus autoComplete="off" onChange={(e) => setName(e.target.value)} placeholder="Type a name" />
          <button className="primary big" type="submit" disabled={!name.trim()}>That's me</button>
        </form>
      )}
    </main>
  );
}

const MINUTES = [5, 10, 15, 20, 30];
function Setup({ db, pre, onStart, onBack }: { db: Db; pre: string[]; onStart: (plan: SessionPlan) => void; onBack: () => void }) {
  const last = db.settings.lastPlan;
  const [timed, setTimed] = useState(last?.length.mode === 'timed');
  const [minutes, setMinutes] = useState(last?.length.mode === 'timed' ? last.length.minutes : 15);
  const [pick, setPick] = useState(pre.length > 0);
  const [chosen, setChosen] = useState<string[]>(pre);
  const list = tricksFor(db);
  const toggle = (id: string) => setChosen((c) => (c.includes(id) ? c.filter((x) => x !== id) : [...c, id]));
  const go = () => onStart({
    length: timed ? { mode: 'timed', minutes } : { mode: 'continuous' },
    focus: pick ? { kind: 'picked', trickIds: chosen } : { kind: 'random' },
  });
  return (
    <main className="home setup">
      <div className="top"><button className="link" onClick={onBack}>← Back</button></div>
      <h1 className="h1">Set up your practice</h1>
      <section>
        <p className="eyebrow">How long?</p>
        <div className="seg" role="group" aria-label="How long">
          <button aria-pressed={!timed} onClick={() => setTimed(false)}>Keep going</button>
          <button aria-pressed={timed} onClick={() => setTimed(true)}>Set a time</button>
        </div>
        {timed
          ? <div className="mins" role="group" aria-label="Minutes">{MINUTES.map((m) => <button key={m} aria-pressed={minutes === m} onClick={() => setMinutes(m)}>{m} min</button>)}</div>
          : <p className="muted">Practice until you say you're done.</p>}
        {timed && <p className="muted">We'll line up about {minutes} minutes of practice.</p>}
      </section>
      <section>
        <p className="eyebrow">Which facts?</p>
        <div className="seg" role="group" aria-label="Which facts">
          <button aria-pressed={!pick} onClick={() => setPick(false)}>Surprise me</button>
          <button aria-pressed={pick} onClick={() => setPick(true)}>I'll pick</button>
        </div>
        {pick && (
          <div className="facts">
            {list.map((t) => (
              <button key={t.id} className="factrow" aria-pressed={chosen.includes(t.id)} onClick={() => toggle(t.id)}>
                <span><b>{t.name}</b><small><Fx text={t.rule} /></small></span>
                <span className="fstat">{chosen.includes(t.id) ? '✓' : ''}</span>
              </button>
            ))}
          </div>
        )}
      </section>
      <button className="primary big" disabled={pick && chosen.length === 0} onClick={go}>{pick && chosen.length === 0 ? 'Pick at least one fact' : 'Start'}</button>
    </main>
  );
}

/** Study-guide lessons where a fact helps, e.g. "Unit rates (Lesson 2.1), y = kx (Lesson 2.4)". */
const LINKS = factLinks as Record<string, { sub: string; title: string }[]>;
function helpsWith(id: string, max = 3): string {
  const l = LINKS[id] ?? [];
  const shown = l.slice(0, max).map((e) => `${e.title} (Lesson ${e.sub})`).join(', ');
  return l.length ? shown + (l.length > max ? `, and ${l.length - max} more` : '') : '';
}
function HelpsWith({ id }: { id: string }) {
  const t = helpsWith(id);
  return t ? <small className="helps">Helps with: {t}</small> : null;
}

type Brand = (typeof BRANDS)[number];

function Charm({ name }: { name: string }) {
  return <svg viewBox="0 0 24 24" aria-hidden="true" dangerouslySetInnerHTML={{ __html: ICONS[name] ?? ICONS.sparkle }} />;
}

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
      <i style={{ background: b.accent, '--chip': b.accent } as CSSProperties}><Charm name={b.icon} /></i>
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

function Hub({ db, onFacts, onGrownups, onWho }: { db: Db; onFacts: () => void; onGrownups: () => void; onWho: () => void }) {
  const unit = db.settings.currentUnit ?? 2;
  const [cur, setCur] = useState<BrandId>(getBrand());
  const brand = BRANDS.find((b) => b.id === cur)!;
  const mood = brand.member ? `${brand.label} · ${brand.member}'s color` : `${brand.label} palette`;
  return (
    <main className="home">
      <div className="logo"><Mark size={84} /><h1 className="brand">MATHSEYE<small>Unit {unit}</small></h1></div>
      <p className="mood"><span style={{ '--chip': brand.bg } as CSSProperties}><Charm name={brand.icon} /></span>{mood}</p>
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

function FactsHome({ db, update, onStart, onSetup, onWho, onBack }: { db: Db; update: (fn: (d: Db) => Db) => void; onStart: (plan?: SessionPlan) => void; onSetup: (ids?: string[]) => void; onWho: () => void; onBack: () => void }) {
  const resumable = db.inProgress?.date === today();
  const conf = confidence(db);
  const mode = db.settings.factsMode ?? 'unit';
  const unit = db.settings.currentUnit ?? 2;
  const list = tricksFor(db);
  const isLearned = (id: string) => db.settings.introducedTricks.includes(id);
  const learnedCount = list.filter((t) => isLearned(t.id)).length;
  const setMode = (m: 'unit' | 'general') => update((d) => ({ ...d, settings: { ...d.settings, factsMode: m } }));
  return (
    <main className="home">
      <button className="logobtn" onClick={onBack} aria-label="Mathseye, back to home"><Mark size={56} /><span className="wm">MATHSEYE</span></button>
      <h1 className="h1">MathFacts</h1>
      <div className="seg" role="group" aria-label="Which facts">
        <button aria-pressed={mode === 'unit'} onClick={() => setMode('unit')}>Unit {unit} facts</button>
        <button aria-pressed={mode === 'general'} onClick={() => setMode('general')}>Any facts</button>
      </div>
      <div className="stats">
        <div><b>{streak(db)}</b><span>day streak</span></div>
        <div><b>{conf === null ? '—' : Math.round(conf * 100) + '%'}</b><span>mental math confidence</span></div>
        <div><b>{learnedCount}/{list.length}</b><span>facts learned</span></div>
      </div>
      <div className="row2">
        {resumable && <button className="primary big" onClick={() => onStart()}>Keep going</button>}
        <button className={resumable ? 'ghostbig' : 'primary big'} onClick={() => onSetup()}>Start practice</button>
      </div>
      <section className="facts">
        <h2>All the facts</h2>
        <p className="muted">Everything is open. Tap one to practice just that fact.</p>
        {list.map((t) => (
          <button key={t.id} className="factrow" onClick={() => onSetup([t.id])}>
            <span><b>{t.name}</b><small><Fx text={t.rule} /></small></span>
            <span className="fstat">{isLearned(t.id) ? `${Math.round(trickMastery(db, t.id) * 100)}%` : 'New'}</span>
          </button>
        ))}
      </section>
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
  const plan = s.plan;
  const limit = plan?.length.mode === 'timed' ? plan.length.minutes * 60000 * 1.3 : Infinity;
  const overTime = now - s.startedAt > limit;

  const finish = () => {
    update((d) => ({
      ...d,
      inProgress: undefined,
      sessions: d.sessions.map((x) => (x.id === s.sessionId ? { ...x, endedAt: Date.now() } : x)),
    }));
    onDone();
  };

  // Timed sessions wrap up a little after the time she asked for: jump to the finishing card.
  useEffect(() => {
    if (overTime && item && item.stage !== 'finish') {
      const fin = s.queue.findIndex((q) => q.stage === 'finish');
      update((d) => ({ ...d, inProgress: { ...s, index: fin >= 0 ? fin : s.queue.length } }));
    }
  }, [overTime, item]);

  // Keep going: when a round ends, line up another one (favoring what she needs most).
  useEffect(() => {
    if (!item && plan?.length.mode === 'continuous') {
      update((d) => {
        const more = buildQueue(d, Date.now(), plan.focus, plan.length);
        return more.length ? { ...d, inProgress: { ...d.inProgress!, queue: [...d.inProgress!.queue, ...more] } } : d;
      });
    } else if (!item) finish();
  }, [item]);
  if (!item) return null;

  const advance = (insertSimilar?: QueueItem) =>
    update((d) => {
      const q = d.inProgress!.queue.slice();
      if (insertSimilar) q.splice(s.index + 1, 0, insertSimilar);
      return { ...d, inProgress: { ...d.inProgress!, queue: q, index: s.index + 1 } };
    });

  const stages = ['warmup', 'new', 'drill', 'mixed', 'finish'].filter((st) => s.queue.some((q) => q.stage === st));
  return (
    <main className="session">
      <header>
        <button className="link" onClick={onPause}>Pause</button>
        <div className="dots">
          {stages.map((st) => (
            <i key={st} className={st === item.stage ? 'on' : stages.indexOf(st) < stages.indexOf(item.stage) ? 'done' : ''} />
          ))}
        </div>
        {plan?.length.mode === 'timed' && <span className="stagename">{Math.min(s.index + 1, s.queue.length)} of {s.queue.length}</span>}
        {plan?.length.mode !== 'timed' && <button className="link done" onClick={finish}>I'm done</button>}
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

const STAGE_LABEL = { warmup: 'Warm-up', new: 'New fact', drill: 'Practice', mixed: 'Mixed practice', finish: 'Finish on a win' };

function TrickCard({ trickId, onGo }: { trickId: string; onGo: () => void }) {
  const t = TRICKS.find((x) => x.id === trickId)!;
  const [why, setWhy] = useState(false);
  return (
    <section className="trickcard">
      <p className="eyebrow">New trick</p>
      <h2>{t.name}</h2>
      <p className="rule"><Fx text={t.rule} /></p>
      <p className="example"><Fx text={t.example} /></p>
      {helpsWith(t.id) && <p className="muted">Helps with: {helpsWith(t.id)}. <a href="./study/unit-2.html">Open the study guide</a></p>}
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
      <button className="fbbtn" onClick={() => window.mathseyeFeedback?.open({ ref: `#${item.templateId}-${item.seed}`, text: problem.prompt, where: `MathFacts · ${trick.name}`, extra: { input, tries, clueLevel, solved } })}>⚑ Flag a problem</button>
      <div className="problem-area">
        {showName && <p className="eyebrow">{trick.name}</p>}
        <div className={`problem ${shake ? 'shake' : ''} ${solved ? 'solved' : ''}`}><Fx text={problem.prompt} /></div>
        <div className="answer">
          {solved && <Burst />}
          {solved ? <span className="right">{template.answerFormat === 'yesno' ? problem.answer : input} ✓</span> : input || <span className="placeholder">?</span>}
        </div>
        <div className="feedback">
          {solved ? (tries === 1 && clueLevel === 0 ? 'Nice, in your head.' : 'You got it.') : tries > 0 ? 'Try again, or tap the lightbulb.' : ''}
        </div>
        <ol className="clues">{clues.slice(0, clueLevel).map((c, i) => <li key={i}><Fx text={c} /></li>)}</ol>
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

type Note = { key: string; id: string; at: string; ref: string; text: string; note: string; tags: string[]; player: string; where: string; build: string; image?: string };

/** Notes players flagged. They live on the server; this lists them for a grown-up (newest first). */
function FeedbackList() {
  const fb = window.mathseyeFeedback;
  const [notes, setNotes] = useState<Note[] | null>(null);
  const [state, setState] = useState<'loading' | 'ok' | 'needkey' | 'offline'>('loading');
  const [key, setKey] = useState(() => { try { return localStorage.getItem('mathseye.adminkey') ?? ''; } catch { return ''; } });
  const [msg, setMsg] = useState('');
  const load = async (k = key) => {
    setState('loading');
    try {
      const r = await fetch('/api/feedback', { headers: k ? { 'X-Admin-Key': k } : {}, cache: 'no-store' });
      if (r.status === 401) { setState('needkey'); return; }
      const j = await r.json();
      if (!j.ok) throw new Error('bad');
      setNotes(j.notes as Note[]); setState('ok');
      try { if (k) localStorage.setItem('mathseye.adminkey', k); } catch { /* ignore */ }
    } catch { setState('offline'); }
  };
  useEffect(() => { void fb?.flush().then(() => load()); }, []);
  const remove = async (n: Note) => { await fetch(`/api/feedback?k=${encodeURIComponent(n.key)}`, { method: 'DELETE', headers: key ? { 'X-Admin-Key': key } : {} }); setNotes((l) => (l ?? []).filter((x) => x.key !== n.key)); };
  const text = () => (notes ?? []).map((n) => `${n.ref || '(no ref)'} · ${n.where} · ${n.player} · ${n.at.slice(0, 16).replace('T', ' ')}Z · build ${n.build}\nProblem: ${n.text}\n${n.tags.length ? 'Tags: ' + n.tags.join('; ') + '\n' : ''}${n.image ? 'Picture: ' + n.image + '\n' : ''}Note: ${n.note}`).join('\n\n');
  const copy = async () => { try { await navigator.clipboard.writeText(text()); setMsg('Copied.'); } catch { setMsg('Could not copy.'); } };
  const unsent = fb?.unsent() ?? 0;
  if (state === 'loading') return <p className="muted">Loading notes…</p>;
  if (state === 'needkey') return (
    <form onSubmit={(e) => { e.preventDefault(); void load(key); }}>
      <p className="muted">Enter the grown-up key to read the notes.</p>
      <input value={key} onChange={(e) => setKey(e.target.value)} aria-label="Grown-up key" type="password" autoComplete="off" />
      <button className="ghost" type="submit">Show notes</button>
    </form>
  );
  if (state === 'offline') return <p className="muted">Could not reach the server right now. {unsent > 0 ? `${unsent} note${unsent === 1 ? '' : 's'} waiting on this device.` : ''} <button className="link" onClick={() => void load()}>Try again</button></p>;
  return (
    <div>
      {unsent > 0 && <p className="muted">{unsent} note{unsent === 1 ? '' : 's'} on this device not sent yet. <button className="link" onClick={async () => { await fb?.flush(); void load(); }}>Send now</button></p>}
      {!notes?.length && <p className="muted">No notes yet. Players can tap "Flag a problem" on any problem.</p>}
      {(notes ?? []).map((n) => (
        <div key={n.key} className="mrow note">
          <span><b>{n.ref || n.where}</b> <small className="muted">{n.player} · {n.at.slice(0, 16).replace('T', ' ')}</small><br />{n.tags.length > 0 && <small className="muted">{n.tags.join(' · ')}<br /></small>}{n.image && <small className="muted">Picture: {n.image}<br /></small>}{n.note || <i className="muted">(no note)</i>}</span>
          <button className="ghost" onClick={() => void remove(n)}>Done</button>
        </div>
      ))}
      {!!notes?.length && <div className="row2"><button className="ghost" onClick={copy}>Copy all</button></div>}
      {msg && <p className="muted">{msg}</p>}
    </div>
  );
}

function Grownups({ db, update, onBack, onRemoved }: { db: Db; update: (fn: (d: Db) => Db) => void; onBack: () => void; onRemoved: () => void }) {
  const [confirmReset, setConfirmReset] = useState(false);
  const [removing, setRemoving] = useState<string | null>(null);
  const sticky = Object.values(db.cards).sort((a, b) => b.box1Returns - a.box1Returns).filter((c) => c.box1Returns > 0).slice(0, 5);
  return (
    <main className="grownups">
      <button className="link" onClick={onBack}>← Back</button>
      <h2>Grown-ups</h2>
      <p className="muted">Every fact is open from the start. Here is how each one is going.</p>
      {TRICKS.map((t) => (
        <div key={t.id} className="mrow">
          <span>{t.name} <small className="muted">· {t.workbookSection}</small></span>
          <span className="muted">{Math.round(trickMastery(db, t.id) * 100)}% mastered</span>
        </div>
      ))}
      <h3>Stickiest cards</h3>
      {sticky.length ? sticky.map((c) => <p key={c.templateId}>{TEMPLATES[c.templateId].trick.name} ({c.templateId}): {c.box1Returns} returns</p>) : <p className="muted">None yet.</p>}
      <p className="muted">{db.sessions.filter((s) => s.endedAt).length} sessions completed.</p>
      <h3>Notes from players</h3>
      <FeedbackList />
      <h3>Players on this device</h3>
      {profiles().map((p) => (
        <div key={p.id} className="mrow">
          <span>{p.name}{activeProfile()?.id === p.id ? ' (playing now)' : ''}</span>
          {removing === p.id
            ? <span><button className="primary" onClick={() => { removeProfile(p.id); setRemoving(null); onRemoved(); }}>Yes, erase {p.name}'s progress</button> <button className="ghost" onClick={() => setRemoving(null)}>Keep</button></span>
            : <button className="ghost" onClick={() => setRemoving(p.id)}>Remove</button>}
        </div>
      ))}
      <h3>Reset progress</h3>
      {!confirmReset ? (
        <button className="ghost" onClick={() => setConfirmReset(true)}>Reset all progress</button>
      ) : (
        <div className="resetbox">
          <p>Erase all tricks learned, streaks, and history for the player who is playing now? This can't be undone.</p>
          <button className="primary" onClick={() => { update(() => fresh()); void window.mathseyeSync?.reset('facts'); setConfirmReset(false); onBack(); }}>Yes, reset everything</button>
          <button className="ghost" onClick={() => setConfirmReset(false)}>Keep my progress</button>
        </div>
      )}
    </main>
  );
}

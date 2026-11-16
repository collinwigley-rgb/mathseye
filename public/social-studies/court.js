/* Social Studies 7: Civil & Criminal Court (study guide for the "Bar Exam" Part 2 test).
   The deck, the case-name question maker and the "what does she know" logic. No DOM in here, so it is unit-tested (src/logic.test.ts).
   Progress per card (saved by court.html under mathseye.ss.court.v1 + player suffix, synced as the "court" section):
     { seen: times asked, s: right in a row, m: times missed, l: 'r' | 'w' (last answer), u: when last answered }.
   Statuses: new (never asked) / shaky (last answer was a miss) / getting (right once since) / solid (right twice in a row). */
(function (root) {
  var TOPICS = [
    { id: 'who', label: 'Who brings the case', sub: 'plaintiff, prosecutor, defendant, who can be taken to court' },
    { id: 'wrong', label: 'Crimes and civil wrongs', sub: 'what each kind of court is for' },
    { id: 'proof', label: 'Proof', sub: 'preponderance of evidence vs. beyond a reasonable doubt' },
    { id: 'trial', label: 'Trials and verdicts', sub: 'oaths, pleas, juries and decisions' },
    { id: 'cases', label: 'Case names', sub: 'figure out a case from its name' },
  ];

  /* The 28 true/false statements from the teacher's study guide. t = statement (as on the sheet), a = true or false, why = one calm line. */
  var TF = [
    { n: 1, topic: 'proof', t: 'In a civil case, you need more evidence to win than in a criminal case.', a: false, why: 'It is the other way around. A civil case needs only a preponderance of evidence (more than the other side). A criminal case needs proof beyond a reasonable doubt.' },
    { n: 2, topic: 'who', t: 'There are no prosecutors in a civil case.', a: true, why: 'Prosecutors work for the government and bring criminal cases. A civil case has a plaintiff instead.' },
    { n: 3, topic: 'who', t: 'In both civil and criminal courts, persons who are defending themselves are referred to as defendants.', a: true, why: 'The person defending against the case is the defendant in either court.' },
    { n: 4, topic: 'who', t: 'Only the government (states and federal) can bring a case to criminal court.', a: true, why: 'A crime is against the government, so only the government can bring a criminal case.' },
    { n: 5, topic: 'trial', t: 'If you are a witness who swears to tell the truth and then you lie under oath, you can go to jail or prison.', a: true, why: 'Lying under oath is a crime (perjury).' },
    { n: 6, topic: 'who', t: 'In both civil and criminal courts, persons who bring the case to court are referred to as plaintiffs.', a: false, why: 'Only civil court has a plaintiff. In criminal court the government brings the case, through a prosecutor.' },
    { n: 7, topic: 'wrong', t: 'A person can be found not guilty in a criminal case and still lose a civil case for the same incident.', a: true, why: 'The two courts ask different questions and need different amounts of proof, so the results can differ.' },
    { n: 8, topic: 'who', t: 'You cannot bring a civil case against the United States government.', a: false, why: 'The government can be a party in a civil case too.' },
    { n: 9, topic: 'wrong', t: 'As a legal definition, crimes are against the government and wrongs are against people.', a: true, why: 'A crime is against the government (everyone). A civil wrong is against a person.' },
    { n: 10, topic: 'proof', t: 'The burden of proof in a civil or criminal case is always on the defendant.', a: false, why: 'The burden of proof is on the side that brings the case: the plaintiff or the prosecutor.' },
    { n: 11, topic: 'wrong', t: 'The purpose of a civil trial is to determine if a defendant had committed a crime.', a: false, why: 'A civil trial decides whether a wrong happened. Deciding about a crime is what a criminal trial does.' },
    { n: 12, topic: 'wrong', t: 'A criminal case cannot be brought to court unless it is believed that a crime has been committed.', a: true, why: 'A criminal case starts only when a crime is believed to have happened.' },
    { n: 13, topic: 'who', t: 'The government cannot sue a citizen in a civil court.', a: false, why: 'The government can sue in civil court. The U.S. Postal Service v. Dave Davison on the study guide is one.' },
    { n: 14, topic: 'who', t: 'You cannot bring the state or federal government to criminal court.', a: true, why: 'The government is the one that brings criminal cases, so it cannot be the defendant in one.' },
    { n: 15, topic: 'proof', t: 'To find someone guilty, jury members must be certain beyond a reasonable doubt in both criminal cases and civil cases.', a: false, why: 'Beyond a reasonable doubt is only for criminal cases. Civil cases use preponderance of evidence.' },
    { n: 16, topic: 'who', t: 'A plaintiff seeks a decision that says that some form of wrongdoing did occur.', a: true, why: 'The plaintiff is asking the court to decide that a wrong was done.' },
    { n: 17, topic: 'who', t: 'The prosecutor is the one who brings a case to criminal court.', a: true, why: 'The prosecutor works for the government and brings the criminal case.' },
    { n: 18, topic: 'wrong', t: 'A civil case may be brought to court even if no crime was believed to have been committed.', a: true, why: 'A civil case is about a wrong against a person, which does not have to be a crime.' },
    { n: 19, topic: 'trial', t: 'In a criminal case, the decision reached by the judge or jury is called a verdict.', a: true, why: 'Criminal decision = verdict. Civil decision = judgment.' },
    { n: 20, topic: 'proof', t: 'A preponderance of evidence means a plaintiff needs only to convince the judge or jury more than the other party.', a: true, why: 'Preponderance of evidence just means more convincing than the other side.' },
    { n: 21, topic: 'who', t: 'If you are under 18 you cannot personally take someone to court.', a: true, why: 'Someone under 18 needs a parent or guardian to bring the case for them.' },
    { n: 22, topic: 'proof', t: 'In a criminal case, the jury or judge must be sure beyond a reasonable doubt to find a defendant guilty.', a: true, why: 'Beyond a reasonable doubt is the standard for a criminal case.' },
    { n: 23, topic: 'who', t: 'Companies (like Post or Target), since they are not a person, cannot be taken to civil courts.', a: false, why: 'Companies can be taken to civil court. In the law a company can be sued like a person.' },
    { n: 24, topic: 'proof', t: 'As a member of the jury, you never need all of your doubt removed to find someone guilty.', a: true, why: 'Beyond a reasonable doubt means no reasonable doubt, not no doubt at all.' },
    { n: 25, topic: 'trial', t: 'If a defendant pleads guilty to a crime there is no trial.', a: true, why: 'A guilty plea means no trial is needed.' },
    { n: 26, topic: 'trial', t: 'You cannot go to jail or prison if you lose in a civil case.', a: true, why: 'Losing a civil case usually means paying money or following a court order, not going to jail.' },
    { n: 27, topic: 'wrong', t: 'If a case has been brought to criminal court it cannot also be brought later to a civil court.', a: false, why: 'One incident can go to both courts. That is why #7 can happen.' },
    { n: 28, topic: 'trial', t: 'In a criminal trial, every jury member needs to agree on the verdict or they do the trial over again.', a: true, why: 'A criminal verdict has to be agreed on by the whole jury.' },
  ];

  /* ---------- case-name questions: a fresh made-up case every time ---------- */
  var FIRST = ['Deanna', 'Marcus', 'Priya', 'Tomas', 'Hannah', 'Leo', 'Imani', 'Caleb', 'Sofia', 'Dev', 'Rosa', 'Nolan', 'Mei', 'Jared', 'Talia', 'Owen', 'Camila', 'Ezra', 'Nora', 'Dante'];
  var LAST = ['Swade', 'Okafor', 'Lindqvist', 'Brandt', 'Reyes', 'Hollis', 'Tanaka', 'Whitfield', 'Moreau', 'Castillo', 'Pruitt', 'Navarro', 'Albright', 'Kessler', 'Duarte', 'Fairbanks', 'Yoon', 'Granger', 'Salazar', 'Mercer'];
  var COMPANIES = ['Target', 'Oak Street Bakery', 'Brightway Bank', 'Hartley Motors', 'Sunrise Apartments', 'Fresh Fields Market', 'Bluebird Airlines', 'Summit Sports', 'Riverside Dental', 'Maple Toys Inc.'];
  var AGENCIES = ['U.S. Postal Service', 'The City Water Department', 'The County Parks Department'];
  var GOV = ['The People', 'The State', 'The United States'];
  function pick(list, rnd) { return list[Math.floor(rnd() * list.length) % list.length]; }
  function person(rnd) { return pick(FIRST, rnd) + ' ' + pick(LAST, rnd); }
  /* The two sample cases printed on the study guide. They are asked with exactly the questions the sheet lists, and also turn up now and then in normal rounds. */
  var SAMPLES = {
    swade: { civil: false, a: 'The People', b: 'Deanna Swade', text: 'The People v. Deanna Swade', qs: ['case-civil', 'case-party', 'case-def', 'case-end', 'case-plaintiff', 'case-crime'] },
    davison: { civil: true, a: 'U.S. Postal Service', b: 'Dave Davison', text: 'U.S. Postal Service v. Dave Davison', qs: ['case-civil', 'case-party', 'case-def', 'case-proof', 'case-plaintiff', 'case-crime'] },
  };
  /* A case is { civil, a, b, text } where a is the side that brings it and b is the defendant. */
  function makeCase(rnd, wantCivil) {
    if (wantCivil == null && rnd() < 0.1) return SAMPLES[rnd() < 0.5 ? 'swade' : 'davison'];
    var civil = wantCivil == null ? rnd() < 0.5 : !!wantCivil, a, b;
    if (!civil) { a = pick(GOV, rnd); b = person(rnd); }
    else {
      var r = rnd();
      if (r < 0.3) { a = person(rnd); b = person(rnd); }
      else if (r < 0.55) { a = person(rnd); b = pick(COMPANIES, rnd); }
      else if (r < 0.8) { a = pick(COMPANIES, rnd); b = person(rnd); }
      else { a = pick(AGENCIES, rnd); b = person(rnd); }
    }
    if (a === b) b = person(rnd);
    return { civil: civil, a: a, b: b, text: a + ' v. ' + b };
  }

  var KINDS = {
    'case-civil': { q: 'Is this case civil or criminal?', opts: ['Civil', 'Criminal'], ans: function (c) { return c.civil ? 'Civil' : 'Criminal'; },
      why: function (c) { return c.civil ? 'It is a person or company against another, so it is civil. A criminal case is the government (The People, The State, The United States) against someone.' : 'The government (' + c.a + ') is bringing it, so it is a criminal case.'; } },
    'case-party': { q: 'In this case, will there be a plaintiff or a prosecutor?', opts: ['Plaintiff', 'Prosecutor'], ans: function (c) { return c.civil ? 'Plaintiff' : 'Prosecutor'; },
      why: function (c) { return c.civil ? 'Civil cases have a plaintiff. Prosecutors are only in criminal cases.' : 'Criminal cases have a prosecutor, who works for the government. A plaintiff is only in civil cases.'; } },
    'case-def': { q: 'Who is the defendant in this case?', opts: null, ans: function (c) { return c.b; },
      why: function (c) { return 'The defendant is the one being defended against: the name after the "v." That is ' + c.b + '. The name before the "v." brings the case.'; } },
    'case-end': { q: 'Will there be a verdict or a judgment?', opts: ['Verdict', 'Judgment'], ans: function (c) { return c.civil ? 'Judgment' : 'Verdict'; },
      why: function (c) { return c.civil ? 'A civil case ends in a judgment. A criminal case ends in a verdict.' : 'A criminal case ends in a verdict. A civil case ends in a judgment.'; } },
    'case-plaintiff': { q: 'Is there a plaintiff in this case?', opts: ['Yes', 'No'], ans: function (c) { return c.civil ? 'Yes' : 'No'; },
      why: function (c) { return c.civil ? 'It is civil, and civil cases have a plaintiff: ' + c.a + '.' : 'It is criminal, and criminal cases have a prosecutor, not a plaintiff.'; } },
    'case-proof': { q: 'Will the jury need a preponderance of evidence, or be sure beyond a reasonable doubt?', opts: ['Preponderance of evidence', 'Beyond a reasonable doubt'], ans: function (c) { return c.civil ? 'Preponderance of evidence' : 'Beyond a reasonable doubt'; },
      why: function (c) { return c.civil ? 'Civil cases need only a preponderance of evidence (more convincing than the other side).' : 'Criminal cases need proof beyond a reasonable doubt.'; } },
    'case-crime': { q: 'Did a crime take place?', opts: ['Yes', 'No', "We don't know"], ans: function (c) { return c.civil ? "We don't know" : 'Yes'; },
      why: function (c) { return c.civil ? 'A civil case can be about a wrong that was not a crime, so from the name alone we do not know.' : 'A criminal case only starts when it is believed a crime happened, so yes.'; } },
  };
  var KIND_IDS = Object.keys(KINDS);

  /* The question for a card. Case cards take a seed so the same case can be shown again (and looked up from the #number). */
  function mulberry(seed) { var a = seed >>> 0; return function () { a += 0x6D2B79F5; var t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  function ask(id, seed, fixed) {
    var m = /^tf(\d+)$/.exec(id);
    if (m) {
      var f = TF[Number(m[1]) - 1];
      return { id: id, key: id, ref: '#' + id, kind: 'tf', topic: f.topic, head: 'True or false?', text: f.t, opts: ['True', 'False'], answer: f.a ? 'True' : 'False', why: f.why };
    }
    var k = KINDS[id]; if (!k) return null;
    seed = seed == null ? Math.floor(Math.random() * 99999) + 1 : seed;
    var rnd = mulberry(seed), c = fixed ? SAMPLES[fixed] : makeCase(rnd);
    var opts = k.opts ? k.opts.slice() : [c.a, c.b];
    if (!k.opts && rnd() < 0.5) opts.reverse();
    return { id: id, ref: '#' + id + '-' + (fixed || seed), key: fixed ? id + '@' + fixed : id, kind: 'case', topic: 'cases', head: 'Court case', caseText: c.text, text: k.q, opts: opts, answer: k.ans(c), why: k.why(c) };
  }

  var DECK = TF.map(function (f) { return 'tf' + f.n; }).concat(KIND_IDS);

  /* ---------- what she knows ---------- */
  function statusOf(rec) {
    if (!rec || !rec.seen) return 'new';
    if (rec.l === 'w') return 'shaky';
    return (rec.s || 0) >= 2 ? 'solid' : 'getting';
  }
  function grade(rec, ok, now) {
    var r = rec || { seen: 0, s: 0, m: 0 };
    return { seen: (r.seen || 0) + 1, s: ok ? (r.s || 0) + 1 : 0, m: (r.m || 0) + (ok ? 0 : 1), l: ok ? 'r' : 'w', u: now };
  }
  var WEIGHT = { shaky: 6, new: 3, getting: 2.5, solid: 0.5 };
  /* Pick the next card: favors missed and new cards, still revisits solid ones now and then, never repeats one of the last few.
     mode 'weak' = only what is not solid yet (returns null when everything is solid). */
  function pickNext(ids, recs, o) {
    o = o || {}; var rnd = o.rnd || Math.random, recent = o.recent || [], mode = o.mode || 'all';
    var keep = Math.min(recent.length, Math.max(1, Math.min(6, ids.length - 2)));
    var avoid = recent.slice(-keep);
    var pool = ids.filter(function (id) { return avoid.indexOf(id) < 0; });
    if (!pool.length) pool = ids.slice();
    var w = pool.map(function (id) { var s = statusOf(recs[id]); return mode === 'weak' && s === 'solid' ? 0 : WEIGHT[s]; });
    var total = w.reduce(function (a, b) { return a + b; }, 0);
    if (total <= 0) return null;
    var r = rnd() * total;
    for (var i = 0; i < pool.length; i++) { r -= w[i]; if (r < 0) return pool[i]; }
    return pool[pool.length - 1];
  }
  function tally(ids, recs) {
    var t = { new: 0, shaky: 0, getting: 0, solid: 0, total: ids.length };
    ids.forEach(function (id) { t[statusOf(recs[id])]++; });
    return t;
  }
  function topicOf(id) { var m = /^tf(\d+)$/.exec(id); return m ? TF[Number(m[1]) - 1].topic : 'cases'; }

  var api = { SAMPLES: SAMPLES, TOPICS: TOPICS, TF: TF, KINDS: KINDS, DECK: DECK, ask: ask, makeCase: makeCase, mulberry: mulberry, statusOf: statusOf, grade: grade, pickNext: pickNext, tally: tally, topicOf: topicOf, KEY: 'mathseye.ss.court.v1' };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.courtDeck = api;
})(typeof window !== 'undefined' ? window : globalThis);

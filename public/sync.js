/* Cloud sync of progress. Each player's progress (MathFacts, study guide, homework done-marks) is saved on the
   Worker under their name and merged back on any iPad that opens that name. The device stays the working copy:
   everything works offline and syncs later. The worksheet pack is never synced.
   Merging: things that only grow (solved problems, answers, sessions) are unioned; settings and the "come back" list
   come from whichever side changed last; a reset on one device wins over older progress elsewhere. */
(function (root) {
  var KEYS = { facts: 'mathseye.mathfacts.v1', study: 'mathseye.unit2.study.v2', hw: 'mathseye.hw.unit2.v1' };
  var SECTIONS = ['facts', 'study', 'hw'];

  /* ---------- pure merge helpers (also unit-tested) ---------- */
  function norm(name) { return String(name || '').toLowerCase().replace(/[^a-z0-9' -]/g, '').replace(/\s+/g, ' ').trim().slice(0, 20); }
  function union(a, b) { var o = {}, k; for (k in (a || {})) o[k] = a[k]; for (k in (b || {})) if (!(k in o)) o[k] = b[k]; return o; }
  function uniq(a) { var s = {}, out = []; (a || []).forEach(function (x) { if (!s[x]) { s[x] = 1; out.push(x); } }); return out; }
  function mergeFacts(L, R, localNewer) {
    if (!L) return R; if (!R) return L;
    var base = localNewer ? L : R, out = {}, k;
    for (k in base) out[k] = base[k];
    out.settings = Object.assign({}, base.settings, {
      introducedTricks: uniq(((L.settings || {}).introducedTricks || []).concat((R.settings || {}).introducedTricks || [])),
      manuallyUnlocked: uniq(((L.settings || {}).manuallyUnlocked || []).concat((R.settings || {}).manuallyUnlocked || [])),
    });
    var cards = {}, id, a, b;
    for (id in (L.cards || {})) cards[id] = L.cards[id];
    for (id in (R.cards || {})) { b = R.cards[id]; a = cards[id]; if (!a || b.lastSeen > a.lastSeen || (b.lastSeen === a.lastSeen && b.attempts > a.attempts)) cards[id] = b; }
    out.cards = cards;
    var at = {}; (L.attempts || []).concat(R.attempts || []).forEach(function (x) { at[x.timestamp + '|' + x.templateId] = x; });
    out.attempts = Object.keys(at).map(function (k2) { return at[k2]; }).sort(function (x, y) { return x.timestamp - y.timestamp; }).slice(-1500);
    var ss = {}; (L.sessions || []).concat(R.sessions || []).forEach(function (x) { if (!ss[x.id] || (x.endedAt && !ss[x.id].endedAt)) ss[x.id] = x; });
    out.sessions = Object.keys(ss).map(function (k2) { return ss[k2]; }).sort(function (x, y) { return x.startedAt - y.startedAt; });
    out.inProgress = L.inProgress;            // a half-finished session belongs to this device
    return out;
  }
  function stamp(e) { return (e && (e.u || e.t)) || 0; }
  function mergeMarks(a, b) { var o = {}, k; a = a || {}; b = b || {}; for (k in a) o[k] = a[k]; for (k in b) o[k] = Math.max(o[k] || 0, b[k]); return o; }
  function mergeList(a, b, da, db) {
    a = a || {}; b = b || {}; var marks = mergeMarks(da, db), out = {}, ids = {}, id; for (id in a) ids[id] = 1; for (id in b) ids[id] = 1;
    for (id in ids) {
      var x = a[id], y = b[id], e = !x ? y : !y ? x : (stamp(y) > stamp(x) ? y : stamp(x) > stamp(y) ? x : ((y.c || 0) > (x.c || 0) ? y : x));
      if (marks[id] && marks[id] >= stamp(e)) continue;      // cleared after its last change
      out[id] = e;
    }
    return out;
  }
  function mergeStudy(L, R, localNewer) {
    if (!L) return R; if (!R) return L;
    var base = localNewer ? L : R, out = {}, k;
    for (k in base) out[k] = base[k];
    out.solved = union(L.solved, R.solved); out.clean = union(L.clean, R.clean); out.seen = union(L.seen, R.seen);
    // The come-back lists are merged problem by problem (never "whole list from the newer side"): each entry carries u = when it last changed,
    // and a problem that was cleared (3 clean in a row) leaves a marker, so a stale device can neither undo progress nor bring a cleared problem back.
    out.work = mergeList(L.work, R.work, L.workDone, R.workDone); out.workDone = mergeMarks(L.workDone, R.workDone);
    out.twork = mergeList(L.twork, R.twork, L.tworkDone, R.tworkDone); out.tworkDone = mergeMarks(L.tworkDone, R.tworkDone);
    out.mission = L.mission;                  // the set she is in the middle of belongs to this device
    out.testRun = L.testRun;                  // so does a practice test in progress
    var seen = {}, all = ((L.tests || []).concat(R.tests || [])).filter(function (t) { if (!t || seen[t.t]) return false; seen[t.t] = 1; return true; });
    all.sort(function (a, b) { return b.t - a.t; }); out.tests = all.slice(0, 8);   // finished practice tests: kept from both sides, newest 8
    return out;
  }
  function mergeHw(L, R) {
    if (!L) return R; if (!R) return L;
    var out = Object.assign({}, R, L); out.done = union(L.done, R.done);
    var res = {}, a = (L && L.res) || {}, b = (R && R.res) || {};   // per-problem result {r:'got'|'miss', t}: the newer one wins
    Object.keys(a).concat(Object.keys(b)).forEach(function (k) { var x = a[k], y = b[k]; res[k] = !x ? y : !y ? x : ((y.t || 0) > (x.t || 0) ? y : x); });
    if (Object.keys(res).length) out.res = res; return out;
  }
  var MERGE = { facts: mergeFacts, study: mergeStudy, hw: mergeHw };

  var api = { norm: norm, mergeFacts: mergeFacts, mergeStudy: mergeStudy, mergeHw: mergeHw };
  if (typeof module !== 'undefined' && module.exports) { module.exports = api; return; }

  /* ---------- engine (browser only) ---------- */
  var ls = root.localStorage;
  function get(k) { try { return ls.getItem(k); } catch (e) { return null; } }
  function set(k, v) { try { ls.setItem(k, v); } catch (e) {} }
  function me() { try { var id = get('mathseye.profile'), l = JSON.parse(get('mathseye.profiles') || '[]'); for (var i = 0; i < l.length; i++) if (l[i].id === id) return l[i]; } catch (e) {} return null; }
  function readLocal(ns) { var d = {}; SECTIONS.forEach(function (s) { try { d[s] = JSON.parse(get(KEYS[s] + ns) || 'null'); } catch (e) { d[s] = null; } }); return d; }
  function writeLocal(ns, d, only) { SECTIONS.forEach(function (s) { if (d[s] && (!only || only.indexOf(s) >= 0)) set(KEYS[s] + ns, JSON.stringify(d[s])); }); }
  function localT(ns) { return Number(get('mathseye.sync.t' + ns) || 0); }
  function localRs(ns) { try { return JSON.parse(get('mathseye.sync.rs' + ns) || '{}'); } catch (e) { return {}; } }
  function strip(d) { var c = JSON.parse(JSON.stringify(d)); if (c.facts) delete c.facts.inProgress; if (c.study) c.study.mission = null; return c; }

  var state = { at: 0, ok: null, busy: false };
  function status() { var at = state.at || Number(get('mathseye.sync.last') || 0); return { at: at, ok: state.ok }; }
  var timer = null;
  function touch() { var m = me(); if (!m) return; set('mathseye.sync.t' + m.ns, String(Date.now())); clearTimeout(timer); timer = setTimeout(function () { sync(); }, 8000); }

  /* One round trip: fetch the server copy, merge, save the merge here, send it back. Resolves {ok, changed}. */
  /* Calls queue up: one running, at most one waiting (several waiting calls become a single later run). */
  var tail = Promise.resolve(), waiting = null;
  function sync() {
    if (waiting) return waiting;
    waiting = tail.then(function () { waiting = null; return runOnce(); });
    tail = waiting.then(function () {}, function () {});
    return waiting;
  }
  function runOnce() {
    var m = me(); if (!m) return Promise.resolve({ ok: false, changed: false });
    state.busy = true;
    var name = norm(m.name);
    return fetch('/api/player?name=' + encodeURIComponent(name), { cache: 'no-store' })
      .then(function (r) { return r.json(); })
      .then(function (j) {
        if (!j || !j.ok) throw new Error('bad');
        var L = readLocal(m.ns), rem = j.player, R = rem ? rem.data : {}, rrs = (rem && rem.rs) || {}, lrs = localRs(m.ns);
        var lt = localT(m.ns), rt = (rem && rem.updatedAt) || 0, ln = lt >= rt, merged = {}, changed = false;
        SECTIONS.forEach(function (s) {
          if ((rrs[s] || 0) > (lrs[s] || 0)) { merged[s] = R[s] || null; lrs[s] = rrs[s]; }      // a reset elsewhere wins
          else if ((lrs[s] || 0) > (rrs[s] || 0)) merged[s] = L[s];                                   // a reset here is newer than the server copy
          else merged[s] = MERGE[s](L[s], R[s], ln);
          if (JSON.stringify(merged[s]) !== JSON.stringify(L[s])) changed = true;
        });
        if (changed) writeLocal(m.ns, merged);
        set('mathseye.sync.rs' + m.ns, JSON.stringify(lrs));
        var out = strip(merged), same = rem && JSON.stringify(out) === JSON.stringify(strip(Object.assign({ facts: null, study: null, hw: null }, R)));
        var t = Math.max(lt, rt) || Date.now();
        if (changed) set('mathseye.sync.t' + m.ns, String(t));
        if (same && JSON.stringify(rrs) === JSON.stringify(lrs)) return { ok: true, changed: changed };
        return fetch('/api/player', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: m.name, data: out, updatedAt: t, rs: lrs }) })
          .then(function (r) { return r.json(); }).then(function (p) { if (!p || !p.ok) throw new Error('put'); return { ok: true, changed: changed }; });
      })
      .then(function (r) { state.busy = false; state.ok = true; state.at = Date.now(); set('mathseye.sync.last', String(state.at)); return r; },
            function () { state.busy = false; state.ok = false; return { ok: false, changed: false }; });
  }
  /* After "Reset my progress" on one section, make the reset win over older copies on other devices. */
  function reset(section) { var m = me(); if (!m) return Promise.resolve(); var rs = localRs(m.ns); rs[section] = Date.now(); set('mathseye.sync.rs' + m.ns, JSON.stringify(rs)); set('mathseye.sync.t' + m.ns, String(Date.now())); return sync(); }
  function players() { return fetch('/api/players', { cache: 'no-store' }).then(function (r) { return r.json(); }).then(function (j) { return (j && j.ok && j.players) || []; }).catch(function () { return []; }); }

  root.addEventListener('online', function () { sync(); });
  root.document && root.document.addEventListener('visibilitychange', function () { if (root.document.visibilityState === 'hidden') sync(); });
  root.mathseyeSync = { touch: touch, sync: sync, reset: reset, players: players, status: status, norm: norm };
})(typeof window !== 'undefined' ? window : globalThis);

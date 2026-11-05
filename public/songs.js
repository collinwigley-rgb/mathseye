/* Song rewards for the practice test. The grade -> song mapping comes from a RANKING: she ranks the songs (favorite first) and
   the best grades get her favorites. The suggested starting order is fetched from /api/songs (private repo -> server) and kept on the
   device; her ranking is saved with her progress. pick is deterministic for a given seed, so a test always shows the same song. */
(function (root) {
  var KEY = 'mathseye.songs.v1', GRADES = ['A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D+', 'D', 'D-', 'F'];
  function read() { try { return JSON.parse(root.localStorage.getItem(KEY) || 'null'); } catch (e) { return null; } }
  /* How many songs each grade gets: A+ 1, then 2 each, F takes the rest (27 songs: 1,2,2,2,2,2,2,2,2,2,2,2,4). */
  function sizes(n) {
    if (n >= 24) { var s = [1], i; for (i = 1; i < 12; i++) s.push(2); s.push(n - 23); return s; }
    var base = Math.max(1, Math.floor(n / 13)), out = [], left = n; for (var k = 0; k < 13; k++) { var c = k === 12 ? Math.max(0, left) : Math.min(base, Math.max(0, left)); out.push(c); left -= c; } return out;
  }
  function assign(order) { var sz = sizes(order.length), at = 0, map = {}; GRADES.forEach(function (g, i) { map[g] = order.slice(at, at + sz[i]); at += sz[i]; }); return map; }
  function gradeOfRank(order, title) { var m = assign(order); for (var i = 0; i < GRADES.length; i++) if (m[GRADES[i]].indexOf(title) >= 0) return GRADES[i]; return null; }
  function hashPick(list, seed) { if (!list || !list.length) return null; var h = 0, s = String(seed); for (var i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0; return list[h % list.length]; }
  function songFor(order, letter, seed) { return order && order.length ? hashPick(assign(order)[letter], seed) : null; }
  /* Her saved ranking, kept in step with the current list: songs that were removed drop out, new ones go at the bottom. */
  function reconcile(saved, def) { if (!def || !def.length) return saved || []; if (!saved || !saved.length) return def.slice(); var keep = saved.filter(function (t) { return def.indexOf(t) >= 0; }); def.forEach(function (t) { if (keep.indexOf(t) < 0) keep.push(t); }); return keep; }
  function move(order, from, to) { var o = order.slice(), x = o.splice(from, 1)[0]; o.splice(Math.max(0, Math.min(o.length, to)), 0, x); return o; }
  function load() {
    if (typeof fetch !== 'function') return Promise.resolve(read());
    return fetch('/api/songs', { cache: 'no-store' }).then(function (r) { return r.ok ? r.json() : Promise.reject(r.status); })
      .then(function (d) { if (d && d.order) { try { root.localStorage.setItem(KEY, JSON.stringify(d)); } catch (e) {} } return d; }).catch(function () { return read(); });
  }
  function suggested() { var d = read(); return d && d.order ? d.order : []; }

  /* ---- "My favorite songs" card (browser). She only sees her own order, favorite at the top. host = a container element.
     o = {get(): saved order or undefined, set(order)}. Nothing here says what the order is used for. ---- */
  var CSS = '.sgc .sgp{margin:0;color:var(--muted,#b4aac4)}.sgc .rk{list-style:none;margin:8px 0 0;padding:0;display:flex;flex-direction:column;gap:6px}.sgc .rki{display:flex;align-items:center;gap:10px;padding:8px 10px;border:2px solid var(--line,#40395a);border-radius:12px;background:var(--panel2,var(--panel,#2a2540));position:relative;text-align:left}.sgc .rki.drag{z-index:5;box-shadow:0 6px 18px rgba(0,0,0,.4);border-color:var(--accent,#f3eba0)}.sgc .rkn{width:26px;text-align:right;color:var(--muted,#b4aac4);font-variant-numeric:tabular-nums}.sgc .rkh{cursor:grab;font-size:22px;padding:6px 8px;user-select:none;-webkit-user-select:none;touch-action:none;min-width:44px;min-height:44px;display:grid;place-items:center;box-sizing:border-box}.sgc .rkt{flex:1;font-weight:600}.sgc .rkm{font-size:12px;letter-spacing:.06em;text-transform:uppercase;color:var(--accent,#f3eba0);white-space:nowrap}.sgc .rkb{display:inline-flex;gap:6px}.sgc .rkb button{width:44px;height:44px;border-radius:10px;border:2px solid var(--line,#40395a);background:transparent;color:inherit;font-size:16px;cursor:pointer}.sgc .rkb button:disabled{opacity:.3}.sgc .sgrow{display:flex;gap:10px;flex-wrap:wrap;margin-top:10px}.sgc .sgrow button{min-height:48px;padding:10px 16px;border-radius:12px;border:2px solid var(--line,#40395a);background:transparent;color:inherit;font:inherit;font-weight:600;cursor:pointer}.sgc .sgrow button.sgmain{background:var(--accent,#f3eba0);color:var(--accent-fg,#1a1626);border-color:transparent}';
  function card(host, o) {
    var d = root.document; if (!d.getElementById('sg-css')) { var st = d.createElement('style'); st.id = 'sg-css'; st.textContent = CSS; d.head.appendChild(st); }
    host.classList.add('sgc'); var open = false;
    var esc = function (s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
    var el = function (t, c, h) { var e = d.createElement(t); if (c) e.className = c; if (h != null) e.innerHTML = h; return e; };
    function order() { return reconcile(o.get(), suggested()); }
    function draw() {
      host.innerHTML = ''; host.appendChild(el('p', 'eyebrow', 'My favorite songs'));
      if (!suggested().length) { host.appendChild(el('p', 'sgp', 'Getting the songs…')); load().then(function () { if (suggested().length) draw(); }); return; }
      var ord = order();
      if (!open) {
        host.appendChild(el('p', 'sgp', ord.slice(0, 3).map(function (t, i) { return (i + 1) + '. ' + esc(t); }).join('<br>')));
        var r = el('div', 'sgrow'), b = el('button', 'sgmain', 'Arrange my songs'); b.onclick = function () { open = true; draw(); }; r.appendChild(b); host.appendChild(r); return;
      }
      host.appendChild(el('p', 'sgp', 'Drag the ☰ handles (or tap ▲ ▼) to put your songs in order: favorite at the top, least favorite at the bottom.'));
      var list = el('ol', 'rk');
      ord.forEach(function (t, i) {
        var mark = i === 0 ? 'Favorite' : i === ord.length - 1 ? 'Least favorite' : '';
        var li = el('li', 'rki', '<span class="rkn">' + (i + 1) + '</span><span class="rkh" role="img" aria-label="Drag to move" title="Drag to move">☰</span><span class="rkt">' + esc(t) + '</span><span class="rkm">' + mark + '</span><span class="rkb"><button aria-label="Move ' + esc(t) + ' up"' + (i === 0 ? ' disabled' : '') + '>▲</button><button aria-label="Move ' + esc(t) + ' down"' + (i === ord.length - 1 ? ' disabled' : '') + '>▼</button></span>');
        var bs = li.querySelectorAll('.rkb button');
        bs[0].onclick = function () { o.set(move(ord, i, i - 1)); draw(); }; bs[1].onclick = function () { o.set(move(ord, i, i + 1)); draw(); };
        var hd = li.querySelector('.rkh');
        hd.onpointerdown = function (e) { e.preventDefault(); hd.setPointerCapture(e.pointerId); li.classList.add('drag'); var y0 = e.clientY;
          hd.onpointermove = function (ev) { li.style.transform = 'translateY(' + (ev.clientY - y0) + 'px)'; };
          hd.onpointerup = hd.onpointercancel = function (ev) { hd.onpointermove = hd.onpointerup = hd.onpointercancel = null; li.classList.remove('drag'); li.style.transform = '';
            var items = [].slice.call(list.children), mids = items.map(function (x) { var rc = x.getBoundingClientRect(); return (rc.top + rc.bottom) / 2; }), to = 0;
            for (var k = 0; k < mids.length; k++) if (ev.clientY > mids[k]) to = k; if (ev.clientY <= mids[0]) to = 0;
            if (to !== i) o.set(move(ord, i, to)); draw(); };
        };
        list.appendChild(li);
      });
      host.appendChild(list);
      var row = el('div', 'sgrow'), done = el('button', 'sgmain', 'Done'), reset = el('button', '', 'Start over');
      done.onclick = function () { open = false; draw(); }; reset.onclick = function () { o.set(suggested().slice()); draw(); }; row.appendChild(done); row.appendChild(reset); host.appendChild(row);
    }
    draw();
  }
  /* Where her order is saved when there is no page state to use (the main screen): inside the study progress, so it syncs with the rest. */
  function nsKey() { try { var id = root.localStorage.getItem('mathseye.profile'), l = JSON.parse(root.localStorage.getItem('mathseye.profiles') || '[]'); for (var i = 0; i < l.length; i++) if (l[i].id === id) return 'mathseye.unit2.study.v2' + (l[i].ns || ''); } catch (e) {} return 'mathseye.unit2.study.v2'; }
  function stored() { try { return (JSON.parse(root.localStorage.getItem(nsKey()) || '{}') || {}).songRank; } catch (e) { return undefined; } }
  function store(order) { try { var k = nsKey(), v = JSON.parse(root.localStorage.getItem(k) || '{}') || {}; v.songRank = order; root.localStorage.setItem(k, JSON.stringify(v)); root.mathseyeSync && root.mathseyeSync.touch(); } catch (e) {} }
  var api = { GRADES: GRADES, sizes: sizes, assign: assign, gradeOfRank: gradeOfRank, songFor: songFor, reconcile: reconcile, move: move, load: load, suggested: suggested, card: card, stored: stored, store: store, ready: function () { return !!read(); } };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.mathseyeSongs = api;
})(typeof window !== 'undefined' ? window : {});

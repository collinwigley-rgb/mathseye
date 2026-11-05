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

  /* ---- ranking screen (browser): tap the arrows or drag the handle. host = a container element. ---- */
  function render(host, o) { // o: {get(): order, set(order), onDone()}
    var order = o.get(), el = function (t, c, h) { var e = root.document.createElement(t); if (c) e.className = c; if (h != null) e.innerHTML = h; return e; };
    var esc = function (s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
    function draw() {
      host.innerHTML = ''; var map = assign(order), gl = {}; GRADES.forEach(function (g) { map[g].forEach(function (t) { gl[t] = g; }); });
      var list = el('ol', 'rk');
      order.forEach(function (t, i) {
        var li = el('li', 'rki', '<span class="rkn">' + (i + 1) + '</span><span class="rkh" role="img" aria-label="Drag to move" title="Drag to move">☰</span><span class="rkt">' + esc(t) + '</span><span class="rkg">' + gl[t] + '</span><span class="rkb"><button aria-label="Move ' + esc(t) + ' up"' + (i === 0 ? ' disabled' : '') + '>▲</button><button aria-label="Move ' + esc(t) + ' down"' + (i === order.length - 1 ? ' disabled' : '') + '>▼</button></span>');
        var bs = li.querySelectorAll('.rkb button');
        bs[0].onclick = function () { order = move(order, i, i - 1); o.set(order); draw(); }; bs[1].onclick = function () { order = move(order, i, i + 1); o.set(order); draw(); };
        var hd = li.querySelector('.rkh'); hd.style.touchAction = 'none';
        hd.onpointerdown = function (e) { e.preventDefault(); hd.setPointerCapture(e.pointerId); li.classList.add('drag'); var y0 = e.clientY;
          hd.onpointermove = function (ev) { li.style.transform = 'translateY(' + (ev.clientY - y0) + 'px)'; };
          hd.onpointerup = function (ev) { hd.onpointermove = hd.onpointerup = null; li.classList.remove('drag'); li.style.transform = '';
            var items = [].slice.call(list.children), tops = items.map(function (x) { var r = x.getBoundingClientRect(); return (r.top + r.bottom) / 2; }), to = 0;
            for (var k = 0; k < tops.length; k++) if (ev.clientY > tops[k]) to = k; if (ev.clientY <= tops[0]) to = 0;
            if (to !== i) { order = move(order, i, to); o.set(order); } draw(); };
        };
        list.appendChild(li);
      });
      var tip = el('p', 'rkhint', 'Favorite at the top, least favorite at the bottom. The letter is the grade that earns the song.');
      var row = el('div', 'row'), done = el('button', 'btn primary big', 'Done'), reset = el('button', 'btn quiet', 'Start over with the suggested order');
      done.onclick = function () { o.onDone && o.onDone(); }; reset.onclick = function () { order = suggested().slice(); o.set(order); draw(); };
      host.appendChild(tip); host.appendChild(list); row.appendChild(done); host.appendChild(row); host.appendChild(reset);
    }
    draw();
  }
  var api = { GRADES: GRADES, sizes: sizes, assign: assign, gradeOfRank: gradeOfRank, songFor: songFor, reconcile: reconcile, move: move, load: load, suggested: suggested, render: render, ready: function () { return !!read(); } };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.mathseyeSongs = api;
})(typeof window !== 'undefined' ? window : {});

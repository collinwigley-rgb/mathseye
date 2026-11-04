/* "Flag a problem": a tiny sheet that captures the problem and what she types, saved on this device.
   Shared by the app and the static pages. Notes are posted to the Worker (worker/index.js) and listed in Grown-ups.
   A copy stays on the device under mathseye.feedback.v1 until it has been sent. */
(function () {
  var KEY = 'mathseye.feedback.v1';
  var css = '.fbbtn{position:absolute;top:10px;right:12px;z-index:3;background:none;border:0;padding:10px 10px;color:var(--muted,#8a8498);font:600 14px system-ui,sans-serif;cursor:pointer;text-decoration:underline;text-underline-offset:3px}' +
    '.fbbg{position:fixed;inset:0;z-index:90;background:rgba(10,8,18,.6);display:flex;align-items:flex-end;justify-content:center}' +
    '.fbsheet{background:var(--panel,#1e1a2e);color:var(--fg,var(--text,#f1ecd8));width:100%;max-width:640px;border-radius:28px 28px 0 0;padding:22px 20px calc(24px + env(safe-area-inset-bottom,0px));display:flex;flex-direction:column;gap:12px;font-family:inherit}' +
    '.fbsheet h2{margin:0;font-size:24px}.fbsheet p{margin:0}.fbsheet .fbwhat{font-size:15px;opacity:.8;max-height:3.6em;overflow:hidden}' +
    '.fbtags{display:flex;flex-wrap:wrap;gap:8px}.fbtags button{padding:10px 14px;border-radius:999px;border:1.5px solid currentColor;background:transparent;color:inherit;font:600 15px system-ui,sans-serif;cursor:pointer}' +
    '.fbtags button[aria-pressed=true]{background:var(--accent,#f3eba0);color:var(--accent-fg,#1a1626);border-color:transparent}' +
    '.fbsheet textarea{width:100%;min-height:96px;box-sizing:border-box;padding:12px 14px;border-radius:14px;border:1.5px solid rgba(128,128,128,.5);background:var(--panel2,#2a2540);color:inherit;font:17px/1.4 system-ui,sans-serif;resize:vertical}' +
    '.fbrow{display:flex;gap:10px}.fbrow button{flex:1;min-height:52px;border-radius:16px;border:0;font:700 18px system-ui,sans-serif;cursor:pointer}' +
    '.fbrow .go{background:var(--accent,#f3eba0);color:var(--accent-fg,#1a1626)}.fbrow .no{background:var(--panel2,#2a2540);color:inherit}';
  function inject() { if (document.getElementById('fbcss')) return; var s = document.createElement('style'); s.id = 'fbcss'; s.textContent = css; document.head.appendChild(s); }
  function list() { try { return JSON.parse(localStorage.getItem(KEY) || '[]'); } catch (e) { return []; } }
  function save(l) { try { localStorage.setItem(KEY, JSON.stringify(l)); } catch (e) {} }
  function who() { try { var id = localStorage.getItem('mathseye.profile'), l = JSON.parse(localStorage.getItem('mathseye.profiles') || '[]'); for (var i = 0; i < l.length; i++) if (l[i].id === id) return l[i].name; } catch (e) {} return ''; }
  function stamp() { var d = new Date(window.mathseyeBuildAt || ''); return (window.mathseyeBuild || 'dev') + (isNaN(d.getTime()) ? '' : ' ' + d.toISOString().slice(0, 16).replace('T', ' ') + 'Z'); }
  /* Notes go to the server (the Worker stores them for the grown-ups). If it is offline or not reachable,
     the note stays on the device marked unsent and is retried later. */
  var API = '/api/feedback';
  function configured() { return location.protocol.indexOf('http') === 0; }
  function sendOne(f) {
    return fetch(API, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(f) })
      .then(function (r) { return r.json(); }).then(function (j) { return !!(j && j.ok); }).catch(function () { return false; });
  }
  var flushing = false;
  function flush() {
    if (!configured() || flushing) return Promise.resolve(0);
    var todo = list().filter(function (f) { return !f.sent; });
    if (!todo.length) return Promise.resolve(0);
    flushing = true;
    return todo.reduce(function (p, f) { return p.then(function (n) { return sendOne(f).then(function (ok) { if (ok) { var l = list(); l.forEach(function (x) { if (x.id === f.id) x.sent = true; }); save(l); return n + 1; } return n; }); }); }, Promise.resolve(0))
      .then(function (n) { flushing = false; return n; }, function () { flushing = false; return 0; });
  }
  function unsent() { return list().filter(function (f) { return !f.sent; }).length; }
  window.addEventListener('online', function () { flush(); });
  setTimeout(flush, 1500);
  var TAGS = ['The answer looks wrong', 'Hard to read', "I don't get it", 'Something broke', 'Good idea'];
  function open(ctx) {
    inject(); ctx = ctx || {};
    var bg = document.createElement('div'); bg.className = 'fbbg';
    var picked = [];
    bg.innerHTML = '<div class="fbsheet" role="dialog" aria-modal="true" aria-label="Flag a problem"><h2>Tell us what’s up</h2>' +
      '<p class="fbwhat"></p><div class="fbtags" role="group" aria-label="Quick pick"></div>' +
      '<textarea id="fb-note" aria-label="Your note" placeholder="Type what’s wrong, or what would help"></textarea>' +
      '<div class="fbrow"><button class="no" type="button">Cancel</button><button class="go" type="button">Send note</button></div></div>';
    var what = bg.querySelector('.fbwhat'); what.textContent = (ctx.ref ? ctx.ref + '  ' : '') + (ctx.text || ctx.where || '');
    var tags = bg.querySelector('.fbtags');
    TAGS.forEach(function (t) { var b = document.createElement('button'); b.type = 'button'; b.textContent = t; b.setAttribute('aria-pressed', 'false'); b.onclick = function () { var on = b.getAttribute('aria-pressed') !== 'true'; b.setAttribute('aria-pressed', String(on)); picked = on ? picked.concat(t) : picked.filter(function (x) { return x !== t; }); }; tags.appendChild(b); });
    function close() { if (bg.parentNode) bg.parentNode.removeChild(bg); }
    bg.onclick = function (e) { if (e.target === bg) close(); };
    bg.querySelector('.no').onclick = close;
    bg.querySelector('.go').onclick = function () {
      var note = bg.querySelector('#fb-note').value.trim();
      var l = list(); l.push({ id: Date.now().toString(36), at: new Date().toISOString(), build: stamp(), player: who(), ref: ctx.ref || '', text: ctx.text || '', where: ctx.where || '', extra: ctx.extra || {}, tags: picked, note: note });
      save(l);
      var sheet = bg.querySelector('.fbsheet');
      sheet.innerHTML = '<h2>Thanks, noted.</h2><p>' + 'Sending it to a grown-up\u2026' + '</p>';
      flush().then(function () { var p = sheet.querySelector('p'); if (p) p.textContent = unsent() ? 'Saved. It will be sent when you are back online.' : 'Sent to a grown-up.'; });
      setTimeout(close, 1800);
    };
    document.body.appendChild(bg); bg.querySelector('#fb-note').focus();
  }
  function asText(l) {
    return (l || list()).map(function (f) {
      var x = f.extra || [], ex = Object.keys(f.extra || {}).map(function (k) { return k + '=' + f.extra[k]; }).join(', ');
      return [(f.ref || '(no ref)') + ' · ' + (f.where || '') + (f.player ? ' · ' + f.player : '') + ' · ' + f.at.slice(0, 16).replace('T', ' ') + 'Z · build ' + f.build,
        f.text ? 'Problem: ' + f.text : '', (f.tags && f.tags.length ? 'Tags: ' + f.tags.join('; ') : ''), f.note ? 'Note: ' + f.note : '', ex ? 'State: ' + ex : ''].filter(Boolean).join('\n');
    }).join('\n\n');
  }
  window.mathseyeFeedback = { open: open, flush: flush, unsent: unsent, configured: configured, list: list, text: asText, clear: function () { save([]); }, button: function (ctxFn) { inject(); var b = document.createElement('button'); b.className = 'fbbtn'; b.type = 'button'; b.textContent = '⚑ Flag a problem'; b.onclick = function () { open(ctxFn()); }; return b; } };
})();

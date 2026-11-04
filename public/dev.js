/* Developer shortcuts. Shown only when the player named "collin" is selected (the owner). Not security: this is a
   family-and-friends app, the gate just keeps the buttons off everyone else's screen. Pages register what the buttons do:
   mathseyeDev.set([{label, fn}]) on each screen; set([]) clears. */
(function () {
  function me() { try { var id = localStorage.getItem('mathseye.profile'), l = JSON.parse(localStorage.getItem('mathseye.profiles') || '[]'); for (var i = 0; i < l.length; i++) if (l[i].id === id) return l[i]; } catch (e) {} return null; }
  function isDev() { var m = me(); return !!m && String(m.name || '').trim().toLowerCase() === 'collin'; }
  var acts = [], open = false, box = null;
  var css = '.devchip{position:fixed;left:10px;bottom:10px;z-index:9999;font:600 13px system-ui,sans-serif}.devchip>button{border:2px solid #e8704a;background:#1b1730;color:#fff;border-radius:999px;padding:6px 12px;cursor:pointer;opacity:.85}.devchip .dp{display:flex;flex-direction:column;gap:6px;margin-bottom:6px}.devchip .dp button{border:2px solid #e8704a;background:#fff;color:#1b1730;border-radius:12px;padding:10px 14px;text-align:left;cursor:pointer;font:600 14px system-ui,sans-serif}';
  var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);
  function draw() {
    if (box) { box.remove(); box = null; }
    if (!isDev() || !acts.length) return;
    box = document.createElement('div'); box.className = 'devchip';
    if (open) { var p = document.createElement('div'); p.className = 'dp'; acts.forEach(function (a) { var b = document.createElement('button'); b.textContent = a.label; b.onclick = function () { open = false; try { a.fn(); } catch (e) { console.error(e); } }; p.appendChild(b); }); box.appendChild(p); }
    var t = document.createElement('button'); t.textContent = 'DEV'; t.setAttribute('aria-expanded', String(open)); t.onclick = function () { open = !open; draw(); }; box.appendChild(t);
    document.body.appendChild(box);
  }
  window.mathseyeDev = { is: isDev, set: function (a) { acts = a || []; draw(); } };
})();

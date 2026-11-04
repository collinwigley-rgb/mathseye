/* Per-player storage keys for the static pages: window.mathseyeNs is '' or '.pXXXX' (matches src/profile.ts). */
(function () {
  var ns = '';
  try {
    var id = localStorage.getItem('mathseye.profile'), list = JSON.parse(localStorage.getItem('mathseye.profiles') || '[]');
    for (var i = 0; i < list.length; i++) if (list[i].id === id) ns = list[i].ns || '';
  } catch (e) {}
  window.mathseyeNs = ns;
})();

/* Top-right "who is playing" label on the static pages; tapping it opens the player picker on the home screen. */
document.addEventListener('DOMContentLoaded', function () {
  try {
    var id = localStorage.getItem('mathseye.profile'), list = JSON.parse(localStorage.getItem('mathseye.profiles') || '[]'), me = null;
    for (var i = 0; i < list.length; i++) if (list[i].id === id) me = list[i];
    if (!me) return;
    var a = document.createElement('a'); a.href = '../?who=1'; a.className = 'nofrac';
    a.setAttribute('aria-label', 'Playing as ' + me.name + '. Tap to switch or add a player.');
    a.textContent = me.name + ' ▾';
    a.style.cssText = 'position:fixed;top:10px;right:12px;z-index:50;padding:6px 14px;border-radius:999px;font:600 15px system-ui,sans-serif;text-decoration:none;background:var(--panel2,#2a2540);color:var(--fg,var(--text,#f1ecd8));border:1px solid rgba(128,128,128,.4)';
    document.body.appendChild(a);
  } catch (e) {}
});

/* Small build stamp at the foot of the static pages (from /build.js), so "which version is live?" has an answer. */
document.addEventListener('DOMContentLoaded', function () {
  try {
    var f = document.createElement('p');
    f.textContent = 'Build ' + (window.mathseyeBuild || 'dev');
    f.style.cssText = 'text-align:center;font:13px system-ui,sans-serif;opacity:.6;margin:20px 0 14px;user-select:text;-webkit-user-select:text';
    document.body.appendChild(f);
  } catch (e) {}
});

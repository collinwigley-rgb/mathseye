/* Press feel: a button visibly reacts the instant a finger lands (iPad Safari can skip the :active style). Feedback only: the action still happens
   on release (click), so a finger that starts a scroll never triggers a button. */
(function () {
  var SEL = 'button, a.tile3, a.btn, .item, .tile', cur = null;
  function target(e) { var t = e.target && e.target.closest ? e.target.closest(SEL) : null; return t && !t.disabled ? t : null; }
  document.addEventListener('pointerdown', function (e) { var t = target(e); if (!t) return; cur = t; t.classList.add('pressed'); }, { passive: true });
  function clear() { if (cur) { cur.classList.remove('pressed'); cur = null; } }
  ['pointerup', 'pointercancel', 'pointerleave', 'dragstart', 'scroll'].forEach(function (ev) { document.addEventListener(ev, clear, { passive: true, capture: true }); });
})();

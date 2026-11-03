/* Lets a physical keyboard drive the on-screen number pad (digits, / . ( ) - space, Backspace, Enter). */
document.addEventListener('keydown', function (e) {
  if (e.ctrlKey || e.metaKey || e.altKey) return;
  var t = e.target && e.target.nodeName; if (/^(INPUT|TEXTAREA|SELECT)$/.test(t)) return;
  var k = e.key, map = { '-': '−', ' ': '␣', Backspace: '⌫', '*': '×', x: '×', X: '×' };
  var key = map[k] || k, btn = null;
  if (k === 'Enter') btn = document.querySelector('.pad .go, .pad button[data-k="go"]');
  else if (/^[0-9/.()−⌫␣×÷+]$/.test(key)) btn = document.querySelector('.pad button[data-k="' + key + '"]');
  if (btn) { e.preventDefault(); btn.click(); }
});

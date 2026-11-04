/* Shows n/d as a stacked fraction (numerator over denominator) in the static pages. */
(function () {
  var css = '.frac{display:inline-flex;flex-direction:column;align-items:center;vertical-align:middle;line-height:1.05;margin:0 .12em;font-size:.92em}' +
    '.frac>span{padding:0 .15em}.frac>span:first-child{border-bottom:.09em solid currentColor}';
  var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);
  var N = '(\\d{1,3}(?:,\\d{3})+|\\d+|[xyk])'; // 1,200 counts as one number
  var RE = new RegExp('(?<![\\w./,])' + N + '\\/' + N + '(?![\\w/.])', 'g');
  var SKIP = /^(SCRIPT|STYLE|TEXTAREA|INPUT|SVG|TEXT|TITLE|CODE)$/i;
  function skip(n) {
    for (var p = n.parentNode; p && p.nodeType === 1; p = p.parentNode) {
      if (SKIP.test(p.nodeName) || (p.classList && (p.classList.contains('frac') || p.classList.contains('ref') || p.classList.contains('nofrac')))) return true;
    }
    return false;
  }
  function fix(root) {
    var w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT), hits = [], n;
    while ((n = w.nextNode())) { RE.lastIndex = 0; if (RE.test(n.nodeValue) && !skip(n)) hits.push(n); }
    hits.forEach(function (t) {
      var s = t.nodeValue, f = document.createDocumentFragment(), last = 0, m; RE.lastIndex = 0;
      while ((m = RE.exec(s))) {
        f.appendChild(document.createTextNode(s.slice(last, m.index)));
        var e = document.createElement('span'); e.className = 'frac'; e.setAttribute('aria-label', m[1] + ' over ' + m[2]);
        e.innerHTML = '<span>' + m[1] + '</span><span>' + m[2] + '</span>'; f.appendChild(e); last = m.index + m[0].length;
      }
      f.appendChild(document.createTextNode(s.slice(last))); t.parentNode.replaceChild(f, t);
    });
  }
  var busy = false;
  new MutationObserver(function () { if (busy) return; busy = true; setTimeout(function () { fix(document.body); busy = false; }, 0); })
    .observe(document.documentElement, { childList: true, subtree: true, characterData: true });
  fix(document.body);
})();

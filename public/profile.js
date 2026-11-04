/* Per-player storage keys for the static pages: window.mathseyeNs is '' or '.pXXXX' (matches src/profile.ts). */
(function () {
  var ns = '';
  try {
    var id = localStorage.getItem('mathseye.profile'), list = JSON.parse(localStorage.getItem('mathseye.profiles') || '[]');
    for (var i = 0; i < list.length; i++) if (list[i].id === id) ns = list[i].ns || '';
  } catch (e) {}
  window.mathseyeNs = ns;
})();

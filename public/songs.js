/* Song rewards for the practice test: a better grade gets a more popular song. The list is NOT in this repo: it is fetched
   from /api/songs (private repo -> server) and kept on the device. pick() is deterministic for a given seed, so the same test
   always shows the same song. */
(function (root) {
  var KEY = 'mathseye.songs.v1';
  function read() { try { return JSON.parse(root.localStorage.getItem(KEY) || 'null'); } catch (e) { return null; } }
  function pickFrom(data, letter, seed) {
    var list = data && data.grades && data.grades[letter]; if (!list || !list.length) return null;
    var h = 0, s = String(seed); for (var i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
    return list[h % list.length];
  }
  function load() {
    if (typeof fetch !== 'function') return Promise.resolve(read());
    return fetch('/api/songs', { cache: 'no-store' }).then(function (r) { return r.ok ? r.json() : Promise.reject(r.status); })
      .then(function (d) { if (d && d.grades) { try { root.localStorage.setItem(KEY, JSON.stringify(d)); } catch (e) {} } return d; }).catch(function () { return read(); });
  }
  var api = { pickFrom: pickFrom, pick: function (letter, seed) { return pickFrom(read(), letter, seed); }, load: load, ready: function () { return !!read(); } };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.mathseyeSongs = api;
})(typeof window !== 'undefined' ? window : {});

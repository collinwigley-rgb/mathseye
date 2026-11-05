/* Letter grade and Central Time for the practice test. One place, unit-tested (src/logic.test.ts). */
(function (root) {
  /* Whole-number percent (rounded), then the usual scale: A+ 97, A 93, A- 90, B+ 87, B 83, B- 80, C+ 77, C 73, C- 70, D+ 67, D 63, D- 60, else F. */
  var SCALE = [[97, 'A+'], [93, 'A'], [90, 'A-'], [87, 'B+'], [83, 'B'], [80, 'B-'], [77, 'C+'], [73, 'C'], [70, 'C-'], [67, 'D+'], [63, 'D'], [60, 'D-'], [0, 'F']];
  function gradeOf(right, total) {
    var pct = total ? Math.round(right / total * 100) : 0, g = 'F';
    for (var i = 0; i < SCALE.length; i++) if (pct >= SCALE[i][0]) { g = SCALE[i][1]; break; }
    return { pct: pct, letter: g };
  }
  /* "Nov 4, 11:14 PM CST". The zone is America/Chicago, so daylight saving (CDT in summer, CST in winter) is handled by the browser. */
  var FMT = null;
  function centralTime(t) {
    try { FMT = FMT || new Intl.DateTimeFormat('en-US', { timeZone: 'America/Chicago', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', timeZoneName: 'short' }); return FMT.format(new Date(t)); }
    catch (e) { return new Date(t).toLocaleString(); }
  }
  var api = { gradeOf: gradeOf, centralTime: centralTime };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.mathseyeGrade = api;
})(typeof window !== 'undefined' ? window : {});

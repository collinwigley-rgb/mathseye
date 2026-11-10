#!/usr/bin/env python3
"""(Generic copy for any unit: python3 tools/test_unit_shortcuts.py N reads public/study/unit-N.html.) Checks on the 'Try this in your head' shortcuts in the generated study guide data.
- every line is short and plain (a 12 year old can read it in one glance)
- no shortcut hands over the final answer (its number only appears if the problem already shows it)
- the arithmetic itself is verified at build time (unit2_shortcuts.ok); this checks the wording and the coverage.
"""
import json, re, sys, pathlib
ROOT = pathlib.Path(__file__).resolve().parent.parent
unit = sys.argv[1] if len(sys.argv) > 1 else "3"
s = (ROOT / f"public/study/unit-{unit}.html").read_text()
D = json.JSONDecoder().raw_decode(s[s.index("const DATA = ") + 13:])[0]

def nums(txt):
    return {m.rstrip(".").lstrip("0") or "0" for m in re.findall(r"\d+(?:\.\d+)?", txt)}

bad = checked = withs = 0
for p in D["problems"]:
    for q in [p] + p["variants"]:
        lines = q.get("shortcut") or []
        checked += 1
        if not lines:
            continue
        withs += 1
        ans = q.get("answer")
        shown = nums(q["text"])
        for ln in lines:
            if len(ln) > 150 or not isinstance(ln, str):
                bad += 1; print("TOO LONG / not text:", p["id"], ln)
            if ln.endswith(" ") or "  " in ln:
                bad += 1; print("SPACING:", p["id"], repr(ln))
            if not re.search(r"[.?:)]$", ln):
                bad += 1; print("NO END PUNCTUATION:", p["id"], repr(ln))
        if isinstance(ans, (int, float)):
            a = f"{ans:.10g}"
            if a not in shown and a in nums(" ".join(lines)) and float(a) > 12:
                bad += 1; print("GIVES AWAY THE ANSWER", p["id"], q["text"][:70], "|", a, "|", lines)
print(f"Unit {unit} shortcuts: {withs} of {checked} problems have one; wording problems: {bad}")
sys.exit(1 if bad else 0)

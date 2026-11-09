#!/usr/bin/env python3
"""Independent re-solve gate for any unit that has a SOLVE table (Unit 3 onward): python3 tools/test_unit_variants.py 3
Every variant (and the base problem) is re-solved from its own TEXT with separate arithmetic and compared to the answer the generator computed.
Unit 2 keeps its own gate, tools/test_unit2_variants.py."""
import importlib, pathlib, re, sys
from fractions import Fraction as F
sys.path.insert(0, str(pathlib.Path(__file__).parent))
unit = int(sys.argv[1]) if len(sys.argv) > 1 else 3
U = importlib.import_module(f"units.unit{unit}")
bad = []; checked = 0
for p in U.PROBS:
    pid = p["id"]
    if pid not in U.SOLVE and pid not in getattr(U, "SOLVE_CHOICE", {}): bad.append(f"{pid}: no independent re-solve registered"); continue
    for v in [p] + U.variants(pid):
        if v["kind"] == "choice":
            solver = getattr(U, "SOLVE_CHOICE", {}).get(pid)
            if solver is None: bad.append(f"{pid}: a multiple-choice problem with no independent solver"); continue
            checked += 1
            if solver(v["text"]) != v["correct"]: bad.append(f"{pid}: {v['text'][:70]!r} marks option {v['correct']} but the text works out to option {solver(v['text'])}")
            continue
        try: got = U.SOLVE[pid](v["text"])
        except Exception as e: bad.append(f"{pid}: could not re-solve {v['text'][:60]!r} ({e})"); continue
        checked += 1
        if abs(float(got) - v["answer"]) > 1e-9: bad.append(f"{pid}: {v['text'][:70]!r} answer {v['answer']} but the text solves to {float(got)}")
        # a hint must never state the answer as a result ("... = 36"); steps are shown only after she has tried
        first = str(v["show"]).split()[0].lstrip("$").rstrip("%")
        in_text = first in re.findall(r"\d[\d.,]*", v["text"].replace(",", ""))     # the answer can coincide with a number the problem already shows
        if not in_text and any(("= " + first) in h or ("= $" + first) in h for h in v["hints"]): bad.append(f"{pid}: a hint gives away the answer in {v['text'][:50]!r}")
print(f"Unit {unit}: re-solved {checked} problems and variants from their text across {len(U.GENS)} generators; mismatches: {len(bad)}")
for b in bad[:12]: print("  ", b)
sys.exit(1 if bad else 0)

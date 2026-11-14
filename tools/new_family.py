#!/usr/bin/env python3
"""Scaffold a new Study Guide problem family:  python3 tools/new_family.py 3 3.3 "price after a markup"
Appends a stub to tools/units/unitN_more.py. The stub FAILS the gates until you fill in the numbers, the text, the hints, the steps and the independent re-solver."""
import pathlib, re, sys
unit, sub, name = sys.argv[1], sys.argv[2], " ".join(sys.argv[3:]) or "new family"
fn = "g_" + re.sub(r"\W+", "_", name.lower()).strip("_")
path = pathlib.Path(__file__).parent / "units" / f"unit{unit}_more.py"
if not path.exists(): sys.exit(f"{path.name} does not exist: copy unit3_more.py's header for this unit first")
src = path.read_text()
assert f"def {fn}(" not in src, f"{fn} already exists"
seed = 40 + src.count("@family(") + 1
path.write_text(src.rstrip("\n") + f'''

@family(U, "{sub}", concepts=["TODO-concept"], seed={seed},
        solve=lambda t: TODO_independent_resolve_from_the_text(t))
def {fn}(r):                                                   # {sub}: {name}
    # 1. pick numbers so the answer is clean  2. build the text in your own words  3. return numv(...) with 3 hints (nudge, method, setup) and 2+ steps
    raise NotImplementedError("fill in the family")
''')
print(f"added {fn} to {path.name}. Edit it, then: python3 tools/build_unit.py {unit} && npm run check:all")

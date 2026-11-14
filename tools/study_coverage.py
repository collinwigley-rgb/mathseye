#!/usr/bin/env python3
"""What the Study Guide covers, per lesson, so the next family is chosen on purpose:  python3 tools/study_coverage.py 3"""
import importlib, pathlib, sys
sys.path.insert(0, str(pathlib.Path(__file__).parent))
unit = int(sys.argv[1]) if len(sys.argv) > 1 else 3
U = importlib.import_module(f"units.unit{unit}")
print(f"Unit {unit} Study Guide: {len(U.PROBS)} families")
for sub in U.SUBS:
    fams = [p for p in U.PROBS if p["sub"] == sub]
    print(f"\n{sub} {U.LESSONS[sub]['title']}  ({len(fams)} families)")
    seen = {}
    for p in fams:
        sc = U.shortcut(p["id"], p["text"], p.get("answer"), p.get("show"))
        nv = len(U.variants(p["id"], 10))
        print(f"  {p['id']} {sub}{p['type']} {p['kind']:6} variants {nv:2}  head-shortcut {'yes' if sc else 'no '}  tags {', '.join(U.BASE[(sub, p['type'])])}")
        for c in U.BASE[(sub, p["type"])]: seen[c] = seen.get(c, 0) + 1
    own = [c for c, v in U.CONCEPTS.items() if v[2] == f"Lesson {sub}"]
    gap = [c for c in own if c not in seen]
    print(f"  concepts taught here: {', '.join(own) or '-'};  not yet practiced: {', '.join(gap) or 'none'}")
    thin = [c for c, n in seen.items() if n == 1]
    print(f"  practiced by only one family: {', '.join(thin) or 'none'}")

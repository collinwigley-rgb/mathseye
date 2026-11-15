#!/usr/bin/env python3
"""Shape and variety gate for every Study Guide problem family of a unit: python3 tools/check_families.py 3
(test_unit_variants.py checks the ANSWER is right; this checks the problem is well formed and varied enough to practice with.)"""
import importlib, pathlib, re, sys
sys.path.insert(0, str(pathlib.Path(__file__).parent))
unit = int(sys.argv[1]) if len(sys.argv) > 1 else 3
U = importlib.import_module(f"units.unit{unit}")
bad = []
ids = [p["id"] for p in U.PROBS]
if ids != [f"U{unit}-{i:02d}" for i in range(1, len(ids) + 1)]: bad.append("ids are not U-01, U-02, ... in order with no gaps")
base_texts = [p["text"] for p in U.PROBS]
if len(set(base_texts)) != len(base_texts): bad.append("two families start with the same base problem")
for p in U.PROBS:
    pid = p["id"]; vs = U.variants(pid, 10)
    if len(vs) < 8: bad.append(f"{pid}: only {len(vs)} different variants in 400 tries (need 8): widen the number choices")
    if p["sub"] not in U.LESSONS or p["sub"] not in U.FOCUS: bad.append(f"{pid}: lesson {p['sub']} has no LESSONS/FOCUS entry")
    if (p["sub"], p["type"]) not in U.BASE: bad.append(f"{pid}: no concept tags for {p['sub']}{p['type']}")
    for v in [p] + vs:
        t = v["text"]
        if re.search(r"[{}]", t) or "  " in t or "None" in t: bad.append(f"{pid}: stray placeholder or spacing in {t[:60]!r}")
        if len(t) > 420: bad.append(f"{pid}: text over 420 characters (too long for a 12 year old on one screen)")
        if len(v["hints"]) != 4: bad.append(f"{pid}: needs exactly 4 hints (nudge, method, setup, last-resort check or break-apart), has {len(v['hints'])}")
        if len(v["steps"]) < 2: bad.append(f"{pid}: needs at least 2 solution steps")
        if v["kind"] == "num" and not (v["answer"] > 0): bad.append(f"{pid}: answer must be positive")
        if v["kind"] == "choice" and len(v["options"]) < 2: bad.append(f"{pid}: a choice problem needs options")
        if v["kind"] == "num" and "?" not in t and not re.match(r"(Write|Find|Estimate|Round|Solve|Complete|Name)\b", t): bad.append(f"{pid}: the problem never asks or tells her what to find: {t[:50]!r}")
print(f"Unit {unit}: {len(U.PROBS)} families checked (10 variants each); problems: {len(bad)}")
for b in sorted(set(bad))[:15]: print("  ", b)
sys.exit(1 if bad else 0)

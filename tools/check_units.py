#!/usr/bin/env python3
"""A unit may only offer a section (study guide, homework) that really exists: src/units.json features vs public/<section>/unit-N.html.
Also: the unit list's current unit is ready, and every ready unit has MathFacts tricks tagged for it (so MathFacts is never empty)."""
import json, pathlib, sys
ROOT = pathlib.Path(__file__).resolve().parent.parent
d = json.loads((ROOT / "src" / "units.json").read_text()); bad = []
cur = next((u for u in d["units"] if u["id"] == d["current"]), None)
if not cur or not cur["ready"]: bad.append(f"current unit {d['current']} is not a ready unit")
for u in d["units"]:
    if not u["ready"]: continue
    for sec in ("study", "homework"):
        if u["features"].get(sec) and not (ROOT / "public" / sec / f"unit-{u['id']}.html").exists():
            bad.append(f"Unit {u['id']} offers {sec} but public/{sec}/unit-{u['id']}.html does not exist")
    tagged = [f.name for f in (ROOT / "content" / "tricks").glob("*.json") if u["id"] in (json.loads(f.read_text()).get("units") or [])]
    if u["features"].get("facts") and not tagged: bad.append(f"Unit {u['id']} offers MathFacts but no trick is tagged for it")
import re
sync = (ROOT / "public" / "sync.js").read_text(); sw = (ROOT / "public" / "sw.js").read_text()
m = re.search(r"\[([0-9, ]+)\]\.forEach\(function \(n\)", sync); synced = {int(x) for x in m.group(1).split(",")} if m else set()
for u in d["units"]:
    if u["id"] > 2 and u["ready"] and (u["features"].get("study") or u["features"].get("homework")) and u["id"] not in synced:
        bad.append(f"Unit {u['id']} has pages but public/sync.js does not sync study{u['id']}/hw{u['id']} (add {u['id']} to the unit list near the top)")
    if u["ready"] and u["features"].get("study") and f"./study/unit-{u['id']}.html" not in sw:
        bad.append(f"Unit {u['id']} offers the study guide but public/sw.js does not precache ./study/unit-{u['id']}.html")
print(f"units: {len(d['units'])} listed, current Unit {d['current']}; {len(bad)} problem(s)")
for b in bad: print("  ", b)
sys.exit(1 if bad else 0)

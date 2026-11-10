#!/usr/bin/env python3
"""Generic unit builder: the Study Guide page, the Unit Homework page and the practice data for ONE unit.
    python3 tools/build_unit.py N [scratch-dir] [--out DIR]
The unit's own data and hooks live in tools/units/unitN.py (see unit2.py for the contract); the page templates
(tools/study_template.html, tools/homework_template.html) know nothing about any particular unit.
--out DIR writes everything under DIR instead of the repo (for test builds that must not touch public/)."""
import json, pathlib, sys, re, hashlib, importlib
sys.path.insert(0, str(pathlib.Path(__file__).parent))
from brand_themes import theme_css, brands_json, members_json, icons_json, SWATCH_CSS, FUN_CSS, BURST_JS
from fractions import Fraction as F
REPO = pathlib.Path(__file__).resolve().parent.parent
_args = [a for a in sys.argv[1:] if not a.startswith("--")]
unit = int(_args[0]) if _args else 2
SCR = pathlib.Path(_args[1]) if len(_args) > 1 else pathlib.Path("/tmp")
ROOT = pathlib.Path(sys.argv[sys.argv.index("--out") + 1]) if "--out" in sys.argv else REPO
U = importlib.import_module(f"units.unit{unit}")
assert U.UNIT == unit

# Saved-data names. Unit 2 keeps the names it always had (never renamed); later units follow one pattern.
if unit == 2: KEYS = dict(study="mathseye.unit2.study.v2", hw="mathseye.hw.unit2.v1", pack="mathseye.pack.unit2", sync_study="study", sync_hw="hw")
else: KEYS = dict(study=f"mathseye.unit{unit}.study.v2", hw=f"mathseye.hw.unit{unit}.v1", pack=f"mathseye.pack.unit{unit}", sync_study=f"study{unit}", sync_hw=f"hw{unit}")

def fill(html):
    """Template placeholders that depend on the unit."""
    for k, v in {"__UNIT_LABEL__": U.LABEL, "__STUDY_KEY__": KEYS["study"], "__HW_KEY__": KEYS["hw"], "__PACK_KEY__": KEYS["pack"], "__SYNC_STUDY__": KEYS["sync_study"],
                 "__ORDER__": json.dumps(list(U.SUBS) + ["review", "extra"], separators=(",", ":")), "__UNIT__": str(unit)}.items(): html = html.replace(k, v)
    return html

ORIGIN = {v[2]: k for k, v in {s: (0, 0, f"Lesson {s}") for s in U.SUBS}.items()}
def deps(p):
    cs = U.BASE.get((p["sub"], p["type"]), U.DEFAULT_CONCEPTS)
    earlier = sorted({ORIGIN[U.CONCEPTS[c][2]] for c in cs if U.CONCEPTS[c][2] in ORIGIN and ORIGIN[U.CONCEPTS[c][2]] != p["sub"]})
    level = "foundation" if not earlier else ("builds" if len(earlier) == 1 else "mixed")
    return dict(level=level, concepts=cs, earlier=[dict(sub=e, title=U.LESSONS[e]['title']) for e in earlier])
def nonterm(v):
    from fractions import Fraction as F
    d = F(v).limit_denominator(10**6).denominator
    while d % 2 == 0: d //= 2
    while d % 5 == 0: d //= 5
    return d != 1


REG = ROOT / f"content/units/unit-{unit}/refs.json"   # append-only: a problem keeps its number forever; retired problems stay on file
if not REG.exists() and (REPO / f"content/units/unit-{unit}/refs.json").exists(): REG = REPO / f"content/units/unit-{unit}/refs.json"
reg = json.loads(REG.read_text()) if REG.exists() else {"next": U.REF_START, "items": {}}
_index = {(v["id"], v["h"]): int(k) for k, v in reg["items"].items()}
def ref_for(pid, vi, obj):
    h = hashlib.sha1(json.dumps([obj["text"], obj.get("answer"), obj.get("correct"), obj.get("options"), obj.get("table"), obj.get("graph")], sort_keys=True).encode()).hexdigest()[:10]
    if (pid, h) not in _index:
        n = reg["next"]; reg["next"] += 1; reg["items"][str(n)] = {"id": pid, "v": vi, "h": h, "text": obj["text"][:90]}; _index[(pid, h)] = n
    return _index[(pid, h)]
import json as _json
TRICKS = {t["id"]: t for t in (_json.load(open(f)) for f in sorted((REPO / "content" / "tricks").glob("*.json")))}
PROBS = U.PROBS
out = []
for p in PROBS:
    q = {k: v for k, v in p.items()}
    q["why_focus"] = U.FOCUS[p["sub"]]; q["deps"] = deps(p); q["facts"] = U.facts_for(p); q["shortcut"] = U.shortcut(p["id"], p["text"], p.get("answer"), p.get("show"))
    if q["kind"] == "num": q["tol"] = 0.006 if nonterm(q["answer"]) else 1e-9
    if hasattr(U, "decorate"): U.decorate(q)
    vs = U.variants(p["id"])
    _sig = lambda o: (o["text"], str(o.get("table")), str(o.get("graph")), str(o.get("options")), o["show"])
    vs = [v for v in vs if _sig(v) != _sig(q)]   # "Try a new one" must never repeat the original
    assert vs and all(v["kind"] == p["kind"] for v in vs), p["id"]
    for i, v in enumerate(vs): v["ref"] = ref_for(p["id"], i, v)
    q["variants"] = vs
    for _v in vs: _v["facts"] = U.facts_text(p["id"], _v.get("text", "")); _v["shortcut"] = U.shortcut(p["id"], _v.get("text", ""), _v.get("answer"), _v.get("show"))
    q["ref"] = ref_for(p["id"], -1, q)
    out.append(q)
_all = [o['ref'] for o in out] + [v['ref'] for o in out for v in o['variants']]
assert len(_all) == len(set(_all)), 'duplicate reference numbers'
assert U.REF_START <= reg['next'] < U.REF_LIMIT, f'public refs for Unit {unit} must stay in {U.REF_START}..{U.REF_LIMIT - 1}'
REG.parent.mkdir(parents=True, exist_ok=True)
REG = ROOT / f"content/units/unit-{unit}/refs.json"; REG.parent.mkdir(parents=True, exist_ok=True)
REG.write_text(json.dumps(reg, indent=1, ensure_ascii=False))
links = {}
for _p in out:
    for _t in dict.fromkeys(_p.get("facts", []) + [f for _v in _p.get("variants", []) for f in _v.get("facts", [])]):
        _e = dict(sub=_p["sub"], title=U.LESSONS[_p["sub"]]["title"])
        if _e not in links.setdefault(_t, []): links[_t].append(_e)
for _t in links: links[_t].sort(key=lambda e: e["sub"])
FL = ROOT / "src" / "factlinks.json"; FL.parent.mkdir(parents=True, exist_ok=True)
_fl = _json.loads((REPO / "src" / "factlinks.json").read_text()) if (REPO / "src" / "factlinks.json").exists() else {}
if _fl and not all(k.isdigit() for k in _fl): _fl = {"2": _fl}      # the old file was Unit 2's links on their own
_fl[str(unit)] = links
FL.write_text(_json.dumps(dict(sorted(_fl.items())), indent=1, ensure_ascii=False) + "\n")
DATA = dict(tricks={k: dict(name=v['name'], rule=v['rule'], example=v['example']) for k, v in TRICKS.items()}, problems=out, lessons=U.LESSONS, concepts={k: dict(name=v[0], plain=v[1], origin=v[2]) for k, v in U.CONCEPTS.items()}, subs=U.SUBS)
(ROOT / f"content/units/unit-{unit}").mkdir(parents=True, exist_ok=True)
(ROOT / f"content/units/unit-{unit}/practice.json").write_text(json.dumps(DATA, indent=1, ensure_ascii=False))

HTML = fill((pathlib.Path(__file__).parent / "study_template.html").read_text())
frag = HTML.replace("/*BRAND-THEMES*/", theme_css() + "\n" + SWATCH_CSS + "\n" + FUN_CSS).replace("__BURST__", BURST_JS).replace("__MEMBERS__", members_json()).replace("__ICONS__", icons_json()).replace("__BRANDS__", brands_json()).replace("__DATA__", json.dumps(DATA, ensure_ascii=False))
(ROOT / "public/study").mkdir(parents=True, exist_ok=True)
(ROOT / f"public/study/unit-{unit}.html").write_text('<!doctype html>\n<html lang="en"><head><meta charset="utf-8"></head><body>\n' + frag + '\n</body></html>\n')
(SCR / f"unit{unit}_artifact.html").write_text(frag)

# ---- Unit Homework page (public shell; the worksheet pack is loaded on the device, never deployed)
st = HTML[HTML.index("<style>") + 7 : HTML.index("</style>")]
helpers = HTML[HTML.index("function parseNum(s){") : HTML.index("const visual = ") ]
helpers += HTML[HTML.index("const visual = ") : HTML.index("\n", HTML.index("const visual = "))]
mark = re.search(r"const MARK = `(.*?)`;", HTML, re.S).group(1)
HW = fill((pathlib.Path(__file__).parent / "homework_template.html").read_text())
def _no_solutions(q):      # the Homework page never shows a worked solution or the answer text, so it does not even carry them (it keeps `answer` only to tell her whether a typed try is right)
    return {k: v for k, v in q.items() if k not in ("steps", "show")}
HW_DATA = dict(DATA, problems=[dict(_no_solutions(p), variants=[_no_solutions(v) for v in p["variants"]]) for p in DATA["problems"]])
HW = HW.replace("/*STUDY_STYLE*/", st).replace("/*BRAND-THEMES*/", theme_css() + "\n" + SWATCH_CSS + "\n" + FUN_CSS).replace("__BURST__", BURST_JS).replace("/*HELPERS*/", helpers).replace("__MARK__", mark).replace("__BRANDS__", brands_json()).replace("__DATA__", json.dumps(HW_DATA, ensure_ascii=False))
(ROOT / "public/homework").mkdir(parents=True, exist_ok=True)
(ROOT / f"public/homework/unit-{unit}.html").write_text('<!doctype html>\n<html lang="en"><head><meta charset="utf-8"></head><body>\n' + HW + '\n</body></html>\n')
print("homework page bytes:", len(HW))
print("problems:", len(out), "| bytes:", len(frag))

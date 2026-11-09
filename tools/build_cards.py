#!/usr/bin/env python3
"""Builds the flash-card decks (src/cards.generated.json) from the unit reference sheets in content/units/unit-N/N.x.md.
Each lesson sheet has a "Key concepts and vocabulary" table (Term | Plain meaning | Tiny example) and one "Big idea" line.
They become term cards (term -> meaning + example), reverse cards (meaning -> term; made in the app) and one big-idea card.
Lesson titles come from src/units.json. Run with --check to fail if the generated file is out of date (used by check:all)."""
import json, pathlib, re, sys
ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = ROOT / "src" / "cards.generated.json"

def clean(s):
    s = re.sub(r"\*+", "", s)              # markdown emphasis
    return re.sub(r"\s+", " ", s).strip()

def slug(s):
    return re.sub(r"[^a-z0-9]+", "-", s.lower()).strip("-")[:40]

def lesson_cards(path, lid):
    s = path.read_text()
    cards = []
    m = re.search(r"## Key concepts and vocabulary\n(.*?)(?=\n## |\Z)", s, re.S)
    for line in (m.group(1).splitlines() if m else []):
        if not line.startswith("|") or line.startswith("| ---") or line.lower().startswith("| term"):
            continue
        cells = [clean(c) for c in line.strip().strip("|").split("|")]
        if len(cells) < 2 or not cells[0] or not cells[1]:
            continue
        ex = cells[2] if len(cells) > 2 and not cells[2].lower().startswith("see ") else ""
        card = {"id": f"{lid}:{slug(cells[0])}", "kind": "term", "term": cells[0], "meaning": cells[1]}
        if ex: card["example"] = ex
        cards.append(card)
    b = re.search(r"\*\*Big idea:\*\*\s*(.+)", s)
    if b:
        cards.append({"id": f"{lid}:big", "kind": "idea", "text": clean(b.group(1))})
    return cards

def build():
    units = json.loads((ROOT / "src" / "units.json").read_text())["units"]
    decks = {}
    for u in units:
        d = ROOT / "content" / "units" / f"unit-{u['id']}"
        lessons = []
        for l in u["lessons"]:
            p = d / f"{l['id']}.md"
            cards = lesson_cards(p, l["id"]) if p.exists() else []
            if cards: lessons.append({"id": l["id"], "title": l["title"], "cards": cards})
        if lessons: decks[str(u["id"])] = {"lessons": lessons}
    ids = [c["id"] for dk in decks.values() for l in dk["lessons"] for c in l["cards"]]
    assert len(ids) == len(set(ids)), "duplicate card ids"
    return json.dumps({"decks": decks}, indent=1, ensure_ascii=False) + "\n"

if __name__ == "__main__":
    text = build()
    if "--check" in sys.argv:
        if not OUT.exists() or OUT.read_text() != text:
            OUT.write_text(text); print("ERROR src/cards.generated.json was out of date (regenerated now; commit it)"); sys.exit(1)
        n = sum(len(l["cards"]) for dk in json.loads(text)["decks"].values() for l in dk["lessons"]); print(f"flash cards: {n} cards, up to date")
    else:
        OUT.write_text(text); print("wrote", OUT.relative_to(ROOT))

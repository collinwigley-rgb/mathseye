#!/usr/bin/env python3
"""Builds the Unit 2 study guide: content/units/unit-2/practice.json, public/study/unit-2.html, and an artifact fragment."""
import json, pathlib, sys, re
sys.path.insert(0, str(pathlib.Path(__file__).parent))
from unit2_problems import PROBS
from unit2_variants import variants
from brand_themes import theme_css, brands_json, members_json, SWATCH_CSS, FUN_CSS, BURST_JS
ROOT = pathlib.Path(__file__).resolve().parent.parent
SCR = pathlib.Path(sys.argv[1]) if len(sys.argv) > 1 else pathlib.Path("/tmp")

CONCEPTS = {
 "div-decimals":("Dividing decimals","Divide a money or measurement amount by a whole number.","Grade 6"),
 "mul-decimals":("Multiplying decimals","Multiply a rate like $0.15 by a quantity.","Grade 6"),
 "div-fractions":("Dividing fractions","Keep, change, flip, then cancel.","Grade 6"),
 "mul-fractions":("Multiplying fractions","Multiply across and cancel first.","Grades 5-6"),
 "mixed-numbers":("Mixed numbers","Turn 1 1/2 into 3/2 before you multiply or divide.","Grades 5-6"),
 "equiv-ratios":("Equivalent ratios and ratio tables","Do the same multiply or divide to both rows.","Grade 6"),
 "unit-conversion":("Converting units","Dozens, yards to inches, minutes to hours.","Grades 5-6"),
 "reading-tables":("Reading tables","Pull pairs of numbers out of a table.","Grades 4-6"),
 "coordinate-plane":("Plotting and reading points","(x, y): across, then up.","Grades 5-6"),
 "area-rect":("Area of a rectangle","Length × width.","Grades 3-6"),
 "solve-1step":("Solving one-step equations","Undo multiply with divide to find x.","Grade 6"),
 "compare-order":("Comparing numbers","Decide which decimal or fraction is larger.","Grades 5-6"),
 "multi-step":("Multi-step word problems","Break the story into steps and answer everything asked.","Grade 6"),
 "integer-ops":("Integer operations","Add, subtract, multiply, and divide positive and negative numbers.","Unit 1"),
 "unit-rate":("Unit rates","How much for exactly ONE.","Lesson 2.1"),
 "compare-rates":("Comparing rates","Same units, then decide if bigger or smaller wins.","Lesson 2.1"),
 "fraction-unit-rate":("Unit rates with fractions","Get to ONE when amounts are fractions.","Lesson 2.2"),
 "proportional-test":("Testing for proportional","Same y ÷ x in every row, and 0 gives 0.","Lesson 2.3"),
 "k-const":("Constant of proportionality","k = y ÷ x, the unit rate.","Lesson 2.4"),
 "y-eq-kx":("The equation y = kx","Write and use the proportional equation.","Lesson 2.4"),
 "proportional-graph":("Proportional graphs","Straight line through (0, 0); the point (1, k).","Lesson 2.5"),
 "times-or-plus":("Times or plus?","Decide if it's proportional before using ratios.","Lesson 2.6"),
 "scale-factor":("Scale and scale factor","Actual = k × drawing; area uses real sides.","Lesson 2.8"),
 "new-scale":("Changing the scale","Find the real size first, then the new scale.","Lesson 2.8"),
}
BASE = {
 ("2.1","A"):["unit-rate","div-decimals"],("2.1","B"):["unit-rate","compare-rates","div-decimals"],("2.1","C"):["unit-rate","mul-decimals"],("2.1","D"):["equiv-ratios"],
 ("2.1","E"):["unit-rate","multi-step","mul-decimals"],("2.1","F"):["unit-rate","unit-conversion","div-decimals"],
 ("2.2","A"):["fraction-unit-rate","div-fractions","unit-rate"],("2.2","B"):["fraction-unit-rate","div-fractions","unit-rate","mul-fractions"],
 ("2.2","C"):["fraction-unit-rate","div-fractions","compare-rates","mixed-numbers"],("2.2","D"):["fraction-unit-rate","div-fractions","unit-rate","mixed-numbers"],
 ("2.2","E"):["fraction-unit-rate","div-fractions"],
 ("2.3","A"):["proportional-test","unit-rate"],("2.3","C"):["proportional-test","unit-rate","mul-decimals"],("2.3","F"):["proportional-test","unit-rate","reading-tables"],
 ("2.4","A"):["k-const","unit-rate"],("2.4","B"):["y-eq-kx","k-const","unit-rate"],("2.4","C"):["y-eq-kx","k-const","solve-1step"],("2.4","D"):["y-eq-kx","proportional-test"],
 ("2.4","E"):["y-eq-kx","k-const","unit-rate"],
 ("2.5","A"):["proportional-graph","proportional-test","coordinate-plane"],("2.5","B"):["proportional-graph","k-const","coordinate-plane"],
 ("2.5","C"):["proportional-graph","k-const","coordinate-plane"],("2.5","E"):["proportional-graph","k-const","compare-rates"],
 ("2.6","A"):["times-or-plus","proportional-test"],("2.6","B"):["times-or-plus","equiv-ratios","unit-rate"],("2.6","D"):["equiv-ratios","times-or-plus"],
 ("2.6","E"):["y-eq-kx","unit-conversion","unit-rate"],
 ("2.8","A"):["scale-factor","k-const","mul-decimals"],("2.8","B"):["scale-factor","unit-rate","div-decimals"],("2.8","C"):["scale-factor","area-rect","mul-decimals"],
 ("2.8","D"):["new-scale","scale-factor","k-const","unit-rate"],
}
SUBS = ["2.1","2.2","2.3","2.4","2.5","2.6","2.8"]
FOCUS = {
 "2.1":"Practice getting to ONE, the move every other problem in this unit uses.","2.2":"Practice keep-change-flip to get to ONE when the amounts are fractions.",
 "2.3":"Practice testing EVERY row so a broken pattern can't fool you.","2.4":"Practice finding k and using y = kx to find any amount.",
 "2.5":"Practice the two graph tests: straight, and through (0, 0).","2.6":"Practice deciding times or plus BEFORE you calculate.",
 "2.8":"Practice using the scale, and converting each side before finding area."}
LESSONS = {
 "2.1":dict(title="Unit rates",move="Divide to get to ONE, then multiply to scale up.",hook="Per means divide. Get to 1.",trap="Comparing totals instead of unit rates. Making 9 of 25 shots is worse than 8 of 20.",
   why=dict(goal="Compare deals and speeds fairly by turning any rate into 'how much for ONE.'",supports_future="Every skill after this starts with a unit rate: equations, graphs, scale drawings, and later percent and slope.",why_you_need_it="Totals can fool you. 9 of 25 shots sounds better than 8 of 20, but per shot it's worse.",real_life="Grocery unit prices, miles per hour, steps per mile, pay per hour, phone plans.",building_block="Foundation. The first block of the unit; the rest is built from it.")),
 "2.2":dict(title="Unit rates with fractions",move="Keep, change, flip, then cancel before you multiply.",hook="Flip the bottom.",trap="Flipping the wrong fraction. Only the divisor (the 'per' amount) flips.",
   why=dict(goal="Do the same 'get to ONE' move when the amounts are fractions.",supports_future="Recipes, maps, and scale drawings use fraction rates. Lessons 2.4 and 2.8 depend on this.",why_you_need_it="Real measurements aren't always whole numbers: 3/4 cup, 1/6 hour, 2 1/2 miles.",real_life="Recipes, speed over a short time, fabric per item, map scales, medicine doses.",building_block="Builds on 2.1 plus fraction division from 6th grade.")),
 "2.3":dict(title="Is it proportional?",move="Divide y ÷ x in EVERY row. All the same means proportional.",hook="Every row, same number, or no.",trap="Checking only two rows. One row that breaks the pattern makes it NOT proportional.",
   why=dict(goal="Decide for sure whether two quantities are proportional.",supports_future="You can only use y = kx, a straight line through zero, or a scale factor when a relationship is truly proportional.",why_you_need_it="Lots of things look steady but aren't: a setup fee, or ages. Checking every row keeps you from using the wrong tool.",real_life="Is this a steady price per item, or is there a delivery fee? Phone plans, ride shares, memberships.",building_block="Gatekeeper skill: it decides whether the rest of the unit's tools apply.")),
 "2.4":dict(title="y = kx",move="k = y ÷ x. Then write y = kx and use it.",hook="k is y over x.",trap="Using a group price as k. '3 lemons for $1.80' means k = 0.60, not 1.80.",
   why=dict(goal="Write any proportional relationship as y = kx and use k to find anything.",supports_future="y = kx is your first linear equation. Slope, graphing lines, and Algebra start here.",why_you_need_it="An equation is a shortcut: once you know k, any amount takes one step.",real_life="Pay = hourly rate × hours. Cost = price × quantity. Distance = speed × time.",building_block="Turns the unit rate (2.1) into an equation, and sets up graphs (2.5) and slope later.")),
 "2.5":dict(title="Graphs",move="Proportional = a straight line AND it goes through (0, 0). The point (1, k) shows k.",hook="Straight and through zero.",trap="Calling any straight line proportional. A line that starts at $3 is not.",
   why=dict(goal="Recognize and read proportional relationships on a graph.",supports_future="Graphs of lines, slope, and comparing rates visually in 8th grade and science.",why_you_need_it="A picture shows at a glance whether something is proportional and which rate is bigger (steeper).",real_life="Charts of cost vs. amount, speed graphs, exchange rates, fitness apps.",building_block="Connects the table (2.3) and the equation (2.4) to a picture.")),
 "2.6":dict(title="Times or plus?",move="Decide first: does doubling one double the other? If not, don't use a ratio.",hook="Times? Ratio. Plus? Just add.",trap="Using ratios on ages or on 'more helpers means less time' problems.",
   why=dict(goal="Decide whether a problem is proportional before using ratios, then pick the right tool.",supports_future="Choosing the right model is the heart of word-problem solving in Algebra and science.",why_you_need_it="Not every steady problem is a ratio: ages add, and more helpers means less time.",real_life="Scaling a recipe, splitting work, planning for a crowd, checking a bill.",building_block="Mixes 2.1 to 2.5 into one skill: decide first, then solve.")),
 "2.8":dict(title="Scale drawings",move="Make the scale '1 inch = ? ft', then multiply. For area, convert each side first.",hook="One inch first, then multiply.",trap="Multiplying the drawing's area by the scale. Convert length and width first.",
   why=dict(goal="Use a scale to move between a drawing or map and the real thing, including areas.",supports_future="Similar figures and geometry in 7th and 8th grade; blueprints and maps in real life.",why_you_need_it="Scale is a constant of proportionality: actual = k × drawing. Areas grow by k × k.",real_life="Maps, blueprints, floor plans, model kits, enlarging a photo or poster.",building_block="Applies y = kx (2.4) in geometry, combining unit rates, fractions, and area.")),
}
ORIGIN = {v[2]: k for k, v in {s: (0, 0, f"Lesson {s}") for s in SUBS}.items()}
def deps(p):
    cs = BASE.get((p["sub"], p["type"]), ["unit-rate"])
    earlier = sorted({ORIGIN[CONCEPTS[c][2]] for c in cs if CONCEPTS[c][2] in ORIGIN and ORIGIN[CONCEPTS[c][2]] != p["sub"]})
    level = "foundation" if not earlier else ("builds" if len(earlier) == 1 else "mixed")
    return dict(level=level, concepts=cs)
def nonterm(v):
    from fractions import Fraction as F
    d = F(v).limit_denominator(10**6).denominator
    while d % 2 == 0: d //= 2
    while d % 5 == 0: d //= 5
    return d != 1

out = []
for p in PROBS:
    q = {k: v for k, v in p.items()}
    q["why_focus"] = FOCUS[p["sub"]]; q["deps"] = deps(p)
    if q["kind"] == "num": q["tol"] = 0.006 if nonterm(q["answer"]) else 1e-9
    vs = variants(p["id"])
    assert vs and all(v["kind"] == p["kind"] for v in vs), p["id"]
    q["variants"] = vs
    out.append(q)
DATA = dict(problems=out, lessons=LESSONS, concepts={k: dict(name=v[0], plain=v[1], origin=v[2]) for k, v in CONCEPTS.items()}, subs=SUBS)
(ROOT / "content/units/unit-2").mkdir(parents=True, exist_ok=True)
(ROOT / "content/units/unit-2/practice.json").write_text(json.dumps(DATA, indent=1, ensure_ascii=False))

HTML = (pathlib.Path(__file__).parent / "unit2_template.html").read_text()
frag = HTML.replace("/*BRAND-THEMES*/", theme_css() + "\n" + SWATCH_CSS + "\n" + FUN_CSS).replace("__BURST__", BURST_JS).replace("__MEMBERS__", members_json()).replace("__BRANDS__", brands_json()).replace("__DATA__", json.dumps(DATA, ensure_ascii=False))
(ROOT / "public/study").mkdir(parents=True, exist_ok=True)
(ROOT / "public/study/unit-2.html").write_text('<!doctype html>\n<html lang="en"><head><meta charset="utf-8"></head><body>\n' + frag + '\n</body></html>\n')
(SCR / "unit2_artifact.html").write_text(frag)

# ---- Unit Homework page (public shell; the worksheet pack is loaded on the device, never deployed)
st = HTML[HTML.index("<style>") + 7 : HTML.index("</style>")]
helpers = HTML[HTML.index("function parseNum(s){") : HTML.index("const visual = ") ]
helpers += HTML[HTML.index("const visual = ") : HTML.index("\n", HTML.index("const visual = "))]
mark = re.search(r"const MARK = `(.*?)`;", HTML, re.S).group(1)
HW = (pathlib.Path(__file__).parent / "homework_template.html").read_text()
HW = HW.replace("/*STUDY_STYLE*/", st).replace("/*BRAND-THEMES*/", theme_css() + "\n" + SWATCH_CSS + "\n" + FUN_CSS).replace("__BURST__", BURST_JS).replace("/*HELPERS*/", helpers).replace("__MARK__", mark).replace("__BRANDS__", brands_json()).replace("__DATA__", json.dumps(DATA, ensure_ascii=False))
(ROOT / "public/homework").mkdir(parents=True, exist_ok=True)
(ROOT / "public/homework/unit-2.html").write_text('<!doctype html>\n<html lang="en"><head><meta charset="utf-8"></head><body>\n' + HW + '\n</body></html>\n')
print("homework page bytes:", len(HW))
print("problems:", len(out), "| bytes:", len(frag))

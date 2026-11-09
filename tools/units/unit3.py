"""Unit 3 (percents): the data and hooks the generic builder (tools/build_unit.py) needs. Same contract as unit2.py.
Problem ids are U3-01, U3-02, ... in the order of PROBS, so NEW PROBLEMS ARE ALWAYS APPENDED AT THE END (an id never changes meaning).
Every problem's answer is computed with Fractions; every variant is re-solved from its text by an independent check (tools/test_unit_variants.py 3)."""
import random, re, pathlib, sys
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent.parent))
from fractions import Fraction as F
from units.common import D, fmt, money, mix, numv

UNIT = 3
LABEL = "Unit 3"
REF_START = 10001            # study-guide reference numbers for Unit 3: 10001..14999 (Unit 2 uses 1001..4999, real worksheet problems use 5001+)
REF_LIMIT = 15000
DEFAULT_CONCEPTS = ["percent-of"]
SUBS = ["3.1", "3.2"]

CONCEPTS = {
 "percent-of":        ("Percent of a number", "Write the percent as a decimal, then multiply.", "Lesson 3.1"),
 "over-100":          ("More than 100%", "100% is the whole, so 150% of a number is more than the number.", "Lesson 3.1"),
 "tax-tip":           ("Tax, tip and commission", "A percent of the price. Decide if you need the extra amount or the total.", "Lesson 3.1"),
 "percent-proportion":("The percent proportion", "Part over whole equals P over 100.", "Lesson 3.2"),
 "find-whole":        ("Finding the whole", "When you know the part and the percent, solve part/whole = P/100 for the whole.", "Lesson 3.2"),
 "proportion":        ("Proportions", "Two equal ratios. Multiply both sides to solve.", "Lesson 2.3"),
}
BASE = {
 ("3.1","A"):["percent-of"], ("3.1","B"):["over-100","percent-of"], ("3.1","C"):["tax-tip","percent-of"],
 ("3.2","A"):["percent-proportion","proportion"], ("3.2","B"):["percent-proportion","percent-of"], ("3.2","C"):["find-whole","percent-proportion","proportion"],
}
FOCUS = {
 "3.1":"Practice turning a percent into a decimal and multiplying, and check the size of your answer.",
 "3.2":"Practice the percent proportion: decide what is missing, write part over whole equals P over 100, and solve.",
}
LESSONS = {
 "3.1": dict(title="Percent of a number", move="Percent means 'per 100'. Write the percent as a decimal, then multiply by the whole.",
   hook="Slide the point two places left.", trap="Stopping at the tax or tip when the question asks for the total, or moving the decimal point only one place.",
   why=dict(goal="Find any percent of a number, including percents over 100, and use it for money situations.",
     supports_future="Discounts, tax, interest and percent change all build on finding a percent of an amount.",
     why_you_need_it="Percents are everywhere in real life: sale prices, tips, tax. Doing them in your head saves you from guessing.",
     real_life="A 15% tip, 8% sales tax, 20% off, or a score as a percent of the points possible.",
     building_block="Next lesson connects this to proportions so you can also find the percent or the whole.")),
 "3.2": dict(title="Percent and proportion", move="Part over whole equals P over 100. Find what is missing, then solve.",
   hook="Part over whole equals P over 100.", trap="Putting the numbers in the wrong spots, or forgetting that the percent always sits over 100.",
   why=dict(goal="Solve every kind of percent problem with one proportion: find the part, the percent or the whole.",
     supports_future="Percent change, similar figures and probability all reuse part-to-whole proportions.",
     why_you_need_it="Some questions give you the answer and ask for the percent or the starting amount. The proportion handles all three.",
     real_life="What percent of the games did the team win? A $30 item is 60% of the original price: what was the original?",
     building_block="This is the same proportion idea as Unit 2, with 100 on the bottom of one ratio.")),
}

# ---------------------------------------------------------------- starter problems (appended in order; ids U3-01...)
PROBS = []
GENS = {}
def _add(sub, typ, v): PROBS.append(dict(sub=sub, type=typ, **v))

def g_balcony(r):                                                    # 3.1 A: percent of a number
    W = r.choice([120, 160, 200, 240, 250, 300, 400, 480, 500, 800]); p = r.choice([5, 10, 15, 20, 25, 30, 35, 40, 60, 75, 80])
    who, noun = r.choice([("A theater has {W} seats and {p}% of them are in the balcony. How many seats are in the balcony?", "seats"),
                          ("A school has {W} students and {p}% ride the bus. How many students ride the bus?", "students"),
                          ("A farm has {W} animals and {p}% of them are chickens. How many chickens are there?", "chickens")])
    a = F(p, 100) * W
    return numv(who.format(W=W, p=p), a,
      [f"What is the whole? What is the percent?", f"Write {p}% as a decimal: move the point two places left.", f"Multiply the whole by that decimal."],
      [f"{p}% = {fmt(F(p,100))}", f"{fmt(F(p,100))} × {W} = {fmt(a)}", f"There are {fmt(a)} {noun}."], unit=noun)
def g_grow(r):                                                       # 3.1 B: percent over 100
    W = r.choice([8, 12, 20, 24, 30, 40, 50]); p = r.choice([120, 125, 150, 175, 200, 250, 300])
    a = F(p, 100) * W
    return numv(f"A sunflower is {W} inches tall in June. By August it is {p}% as tall as it was in June. How tall is it in August (in inches)?", a,
      [f"Is {p}% more or less than 100%? So will the answer be taller or shorter than {W}?", f"Write {p}% as a decimal: {fmt(F(p,100))}.", f"Multiply {W} by {fmt(F(p,100))}."],
      [f"{p}% = {fmt(F(p,100))}", f"{fmt(F(p,100))} × {W} = {fmt(a)}", f"The sunflower is {fmt(a)} inches tall."], unit="inches")
def g_tax(r):                                                        # 3.1 C: tax, then total
    price = r.choice([20, 25, 40, 50, 60, 80, 120, 150, 200]); rate = r.choice([4, 5, 6, 7, 8, 10])
    item = r.choice(["jacket", "backpack", "pair of shoes", "game", "lamp"]); tax = F(rate, 100) * price; tot = price + tax
    return numv(f"A {item} costs {money(price)}. The sales tax is {rate}%. What is the total cost, with tax (in dollars)?", tot,
      ["The question wants the TOTAL. What is the tax first?", f"Find {rate}% of {price}.", "Then add the tax to the price."],
      [f"Tax: {fmt(F(rate,100))} × {price} = {fmt(tax)}", f"Total: {price} + {fmt(tax)} = {fmt(tot)}", f"The total cost is {money(tot)}."], unit="dollars", show=money(tot))
def g_percent(r):                                                    # 3.2 A: find the percent
    b = r.choice([20, 25, 40, 50, 80, 200, 250]); p = r.choice([x for x in (5, 10, 12, 15, 20, 25, 30, 35, 40, 45, 60, 65, 70, 75, 80, 85, 90) if (F(x, 100) * b).denominator == 1])
    a = int(F(p, 100) * b); who = r.choice([("students in a class", "brought lunch"), ("games a team played", "won"), ("shots a player took", "made")])
    return numv(f"Out of {b} {who[0]}, {a} {who[1]}. What percent is that?", p,
      ["Which number is the part? Which is the whole?", f"Write part over whole = P over 100: {a}/{b} = P/100.", "Multiply both sides by 100."],
      [f"{a}/{b} = P/100", f"P = {a} × 100 ÷ {b} = {p}", f"{p}% of the {who[0]} {who[1]}."], show=f"{p}%")
def g_part(r):                                                       # 3.2 B: find the part with the proportion
    W = r.choice([12.5, 20, 30, 40, 60, 75, 120, 250]); p = r.choice([10, 20, 30, 35, 40, 60, 70, 75, 80, 150, 175]); a = F(p, 100) * D(W)
    thing = r.choice([("A bike path is {W} miles long. Dana has gone {p}% of the way. How many miles has she gone?", "miles"),
                      ("A bottle holds {W} ounces. It is {p}% full. How many ounces are in it?", "ounces")])
    return numv(thing[0].format(W=fmt(D(W)), p=p), a,
      ["Which number is the whole? What is the percent?", f"Write part/whole = P/100 with the part as n: n/{fmt(D(W))} = {p}/100.", f"Multiply both sides by {fmt(D(W))}."],
      [f"n/{fmt(D(W))} = {p}/100", f"n = {p}/100 × {fmt(D(W))} = {fmt(a)}", f"The answer is {fmt(a)} {thing[1]}."], unit=thing[1])
def g_whole(r):                                                      # 3.2 C: find the whole
    p = r.choice([20, 25, 40, 50, 60, 75, 80, 120, 150, 200]); Wk = r.choice([20, 30, 40, 50, 60, 80, 100, 120, 150, 200]); a = F(p, 100) * Wk
    return numv(f"{fmt(a)} is {p}% of a number. What is the number?", Wk,
      [f"Which number is the part? What is the whole, the thing you don't know?", f"Write {fmt(a)}/w = {p}/100.", "Cross-multiply, then divide."],
      [f"{fmt(a)}/w = {p}/100", f"w = {fmt(a)} × 100 ÷ {p} = {Wk}", f"The number is {Wk}."])

def _problem(sub, typ, gen, seed):
    """The base problem is the generator run once with a fixed seed (so its text and answer are stable forever)."""
    v = gen(random.Random(seed)); _add(sub, typ, v)
for _pid_i, (_sub, _typ, _gen, _seed) in enumerate([("3.1","A",g_balcony,11),("3.1","B",g_grow,12),("3.1","C",g_tax,13),("3.2","A",g_percent,21),("3.2","B",g_part,22),("3.2","C",g_whole,23)], 1):
    PROBS_ID = f"U3-{_pid_i:02d}"; _problem(_sub, _typ, _gen, _seed); PROBS[-1]["id"] = PROBS_ID; GENS[PROBS_ID] = _gen

def variants(pid, n=10):
    rng = random.Random(int(pid.split("-")[1]) * 7919); seen = set(); out = []; tries = 0
    while len(out) < n and tries < 400:
        tries += 1; v = GENS[pid](rng)
        key = (v["text"], str(v.get("table")), str(v.get("graph")), str(v.get("options")), v["show"])
        if key in seen: continue
        seen.add(key); out.append(v)
    return out

def shortcut(pid, text, answer, show): return []         # mental shortcuts for percent families come later (tools/units/unit3_shortcuts.py)
def facts_text(pid, text): return []                     # MathFacts tricks that fit a problem's own numbers: added with Unit 3's own tricks
def facts_for(p): return facts_text(p["id"], p["text"])

# ---------------------------------------------------------------- independent re-solve of each variant from its TEXT (tools/test_unit_variants.py)
def _n(s): return F(s.replace(",", "").replace("$", "").rstrip("."))
SOLVE = {
 "U3-01": lambda t: (lambda m: _n(m[2]) / 100 * _n(m[1]))(re.search(r"(\d+) (?:seats|students|animals) and (\d+)%", t)),
 "U3-02": lambda t: (lambda m: _n(m[2]) / 100 * _n(m[1]))(re.search(r"is (\d+) inches tall in June\. By August it is (\d+)%", t)),
 "U3-03": lambda t: (lambda m: _n(m[1]) * (1 + _n(m[2]) / 100))(re.search(r"costs \$([\d.]+)\. The sales tax is (\d+)%", t)),
 "U3-04": lambda t: (lambda m: _n(m[2]) / _n(m[1]) * 100)(re.search(r"Out of (\d+) [\w ]+?, (\d+) [\w ]+?\. What percent", t)),
 "U3-05": lambda t: (lambda m: _n(m[2]) / 100 * _n(m[1]))(re.search(r"(?:is|holds) ([\d.]+) (?:miles long|ounces)\. (?:\w+ has gone|It is) (\d+)%", t)),
 "U3-06": lambda t: (lambda m: _n(m[1]) / _n(m[2]) * 100)(re.search(r"^([\d.]+) is (\d+)% of a number", t)),
}

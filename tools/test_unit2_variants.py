#!/usr/bin/env python3
"""Independent re-solve of variants from their TEXT (separate arithmetic from the generators)."""
import re, sys, pathlib
from fractions import Fraction as F
sys.path.insert(0, str(pathlib.Path(__file__).parent))
from unit2_variants import GENS, variants
def num(s): return F(s.replace(",", "").replace("$", "").rstrip("."))
def mixed(s):
    m = re.fullmatch(r"(?:(\d+) )?(\d+)/(\d+)|(\d+)", s.strip())
    return F(int(m[4])) if m[4] else (int(m[1] or 0) + F(int(m[2]), int(m[3])))
MX = r"(\d+ \d+/\d+|\d+/\d+|\d+)"
SOLVE = {
 "U2-01": lambda t: num(re.search(r"costs \$([\d.]+)", t)[1]) / int(re.search(r"A (\d+)-pack", t)[1]),
 "U2-03": lambda t: (lambda a: F(a[0]) / F(a[1]) * F(a[2]))(re.search(r"(\d+) \w+ in (\d+) minutes\. At that rate, how many \w+ in (\d+)", t).groups()),
 "U2-04": lambda t: (lambda a: F(a[0]) * F(a[2]) / F(a[1]))(re.search(r"has (\d+) [\w ]+ for every (\d+) [\w ]+\. There are (\d+)", t).groups()),
 "U2-06": lambda t: num(re.search(r"for \$([\d.]+)", t)[1]) / (12 * int(re.search(r"sold (\d+) dozen", t)[1])),
 "U2-16": lambda t: None,
 "U2-21": lambda t: num(re.search(r"y = ([\d.]+)x", t)[1]) * int(re.search(r"x = (\d+)\?", t)[1]),
 "U2-22": lambda t: num(re.search(r"y = ([\d.]+)\?", t)[1]) / num(re.search(r"y = ([\d.]+)x", t)[1]),
 "U2-24": lambda t: num(re.search(r"cost \$([\d.]+) each", t)[1]) * int(re.search(r"What do (\d+) cost", t)[1]),
 "U2-23": lambda t: num(re.search(r"goes up \$([\d.]+)", t)[1]) / int(re.search(r"every (\d+) ", t)[1]),
 "U2-26": lambda t: num(re.search(r"fills ([\d.]+) gallons", t)[1]) / num(re.search(r"in ([\d.]+) minutes", t)[1]) * int(re.search(r"gallons in (\d+) minutes\?", t)[1]),
 "U2-31": lambda t: (lambda a: F(a[1]) / F(a[0]))(re.search(r"\((\d+), 0\) and|\(0, 0\) and \((\d+), (\d+)\)", t) and re.search(r"\(0, 0\) and \((\d+), (\d+)\)", t).groups()),
 "U2-33": lambda t: int(re.search(r"when \w+ is (\d+)\?", t)[1]) + (int(re.search(r"when \w+ is (\d+)\. How", t)[1]) - int(re.search(r"is (\d+) years old when", t)[1])),
 "U2-34": lambda t: (lambda a: F(a[0]) * F(a[1]) / F(a[2]))(re.search(r"(\d+) people [\w ]+ in (\d+) hours\. How many hours would (\d+) people", t).groups()),
 "U2-39": lambda t: num(re.search(r"1 in\. = (\d+) ft", t)[1]) * num(re.search(r"measures ([\d.]+) in\.", t)[1]),
 "U2-40": lambda t: (lambda a: F(a[1]) / F(a[0]) * F(a[2]))(re.search(r"Scale: (\d+) in\. = (\d+) ft\. A \w+ is (\d+) in\.", t).groups()),
 "U2-41": lambda t: (lambda a: F(a[0]) * F(a[2]) * F(a[1]) * F(a[2]))(re.search(r"is (\d+) in\. by (\d+) in\. Scale: 1 in\. = (\d+) ft", t).groups()),
 "U2-42": lambda t: num(re.search(r"real ([\d.]+)-ft", t)[1]) / int(re.search(r"is (\d+) in\. long", t)[1]),
 "U2-44": lambda t: int(re.search(r"1 in\. = (\d+) miles", t)[1]) * mixed(re.search(r"are " + MX + r" in\. apart", t)[1]),
 "U2-37": lambda t: num(re.search(r"cost \$([\d.]+)\. How much do (\d+) yards", t)[1]) / int(re.search(r"^(\d+) inches", t)[1]) * 36 * int(re.search(r"do (\d+) yards", t)[1]),
 "U2-12": lambda t: (lambda a: (num(a[2]) / F(a[0]) * F(a[1])) * mixed(a[3]))(re.search(r"(\d+)/(\d+) inch = (\d+) miles\. How many real miles is " + MX + r" inches", t).groups()) if False else None,
 "U2-10": lambda t: (lambda a: F(a[0]) * F(a[2]) / F(a[1]) * int(a[3]))(re.search(r"(\d+) Calories in (\d+)/(\d+) cup of [\w ]+\. How many Calories are in (\d+) cups", t).groups()) if False else None,
}
def solve10(t):
    a = re.search(r"There are (\d+) Calories in (\d+)/(\d+) cup of [\w ]+\. How many Calories are in (\d+) cups", t).groups()
    return F(int(a[0])) / F(int(a[1]), int(a[2])) * int(a[3])
def solve12(t):
    a = re.search(r"(\d+)/(\d+) inch = (\d+) miles\. How many real miles is " + MX + r" inches", t).groups()
    return F(int(a[2])) / F(int(a[0]), int(a[1])) * mixed(a[3])
def solve9(t):
    a = re.search(r"rides " + MX + r" miles? in 1/(\d+) hour", t).groups(); return mixed(a[0]) * int(a[1])
def solve16(t, v):
    return None
SOLVE["U2-10"] = solve10; SOLVE["U2-12"] = solve12; SOLVE["U2-09"] = solve9
SOLVE["U2-31"] = lambda t: (lambda a: F(a[1]) / F(a[0]))(re.search(r"\(0, 0\) and \((\d+), (\d+)\)", t).groups())
bad = checked = 0
for pid, fn in SOLVE.items():
    if fn is None: continue
    for v in variants(pid, 10):
        if v["kind"] != "num": continue
        want = fn(v["text"])
        if want is None: continue
        checked += 1
        if abs(float(want) - v["answer"]) > 1e-6:
            bad += 1; print("MISMATCH", pid, v["text"], "text-solved:", float(want), "stored:", v["answer"])
barsn = 0
for pid in GENS:
    for v in variants(pid, 10):
        m = v.get("bars")
        if m:
            barsn += 1
            if abs(m["pieces"] / m["chunk"] - v["answer"]) > 1e-6:
                bad += 1; print("BAR MISMATCH", pid, v["text"], m["pieces"], "/", m["chunk"], "vs", v["answer"])
print(f"checked {barsn} bar pictures against their answers")
print(f"re-solved {checked} variants from their text across {sum(1 for f in SOLVE.values() if f)} generators; mismatches: {bad}")
sys.exit(1 if bad else 0)

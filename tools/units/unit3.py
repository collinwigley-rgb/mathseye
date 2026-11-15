"""Unit 3 (percents): the data and hooks the generic builder (tools/build_unit.py) needs. Same contract as unit2.py.
Problem ids are U3-01, U3-02, ... in the order of PROBS, so NEW PROBLEMS ARE ALWAYS APPENDED AT THE END (an id never changes meaning).
Every problem's answer is computed with Fractions; every variant is re-solved from its text by an independent check (tools/test_unit_variants.py 3)."""
import random, re, pathlib, sys
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent.parent))
from fractions import Fraction as F
from units.common import D, fmt, money, mix, numv, chv

UNIT = 3
LABEL = "Unit 3"
REF_START = 10001            # study-guide reference numbers for Unit 3: 10001..14999 (Unit 2 uses 1001..4999, real worksheet problems use 5001+)
REF_LIMIT = 15000
DEFAULT_CONCEPTS = ["percent-of"]
SUBS = ["3.1", "3.2", "3.3"]

CONCEPTS = {
 "percent-of":        ("Percent of a number", "Write the percent as a decimal, then multiply.", "Lesson 3.1"),
 "over-100":          ("More than 100%", "100% is the whole, so 150% of a number is more than the number.", "Lesson 3.1"),
 "tax-tip":           ("Tax, tip and commission", "A percent of the price. Decide if you need the extra amount or the total.", "Lesson 3.1"),
 "percent-proportion":("The percent proportion", "Part over whole equals P over 100.", "Lesson 3.2"),
 "find-whole":        ("Finding the whole", "When you know the part and the percent, solve part/whole = P/100 for the whole.", "Lesson 3.2"),
 "percent-of-what":   ("A percent of WHAT?", "Before you calculate, decide which amount the percent is of, and whether it is a part, a whole or a percent you are finding.", "Lesson 3.3"),
 "proportion":        ("Proportions", "Two equal ratios. Multiply both sides to solve.", "Lesson 2.3"),
}
BASE = {
 ("3.1","A"):["percent-of"], ("3.1","B"):["over-100","percent-of"], ("3.1","C"):["tax-tip","percent-of"],
 ("3.2","A"):["percent-proportion","proportion"], ("3.2","B"):["percent-proportion","percent-of"], ("3.2","C"):["find-whole","percent-proportion","proportion"],
 ("3.1","D"):["find-whole","percent-of"], ("3.1","E"):["percent-of"], ("3.1","F"):["over-100"], ("3.1","G"):["percent-of"],
 ("3.2","D"):["percent-proportion"], ("3.2","E"):["percent-proportion"], ("3.2","F"):["find-whole","percent-proportion"], ("3.2","G"):["percent-proportion"],
 ("3.3","A"):["percent-of-what","percent-proportion"], ("3.3","B"):["tax-tip","percent-of"], ("3.3","C"):["find-whole","percent-of-what"], ("3.3","D"):["percent-of-what","percent-of"],
 ("3.3","E"):["find-whole","percent-of-what"], ("3.3","F"):["find-whole","percent-of-what"], ("3.3","G"):["tax-tip","percent-of"],
}
FOCUS = {
 "3.1":"Practice turning a percent into a decimal and multiplying, and check the size of your answer.",
 "3.2":"Practice the percent proportion: decide what is missing, write part over whole equals P over 100, and solve.",
 "3.3":"Practice percent problems in real settings: decide whether you need the part, the percent or the whole, and which amount the percent is of.",
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
 "3.3": dict(title="Percent problems: tax, tips and commission", move="Decide what you know (part, whole or percent), then multiply by the decimal or use part over whole equals P over 100.",
   hook="Ask: a percent of WHAT?", trap="Taking the percent of the wrong amount, like the original price instead of the new amount, or stopping before the last step.",
   why=dict(goal="Use percents on real money and data questions: find a percent, a part or a whole, and keep track of which amount the percent is of.",
     supports_future="Percent change, markups and discounts, simple interest and probability all start from part, whole and percent.",
     why_you_need_it="Tax, tips, commissions, sales and survey results all come as percents. You need to know what to do with them.",
     real_life="What does a $39.98 shirt really cost with tax? What is a 20% tip?",
     building_block="Lessons 3.1 and 3.2 gave you the two tools. Here you choose between them and use them in steps.")),
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
      [f"What is the whole? What is the percent?", f"Write {p}% as a decimal: move the point two places left.", f"Multiply the whole by that decimal.", f"A friendly check: 10% of {W} is one tenth of it. Use that to see if your answer is about right."],
      [f"{p}% = {fmt(F(p,100))}", f"{fmt(F(p,100))} × {W} = {fmt(a)}", f"There are {fmt(a)} {noun}."], unit=noun)
def g_grow(r):                                                       # 3.1 B: percent over 100
    W = r.choice([8, 12, 20, 24, 30, 40, 50]); p = r.choice([120, 125, 150, 175, 200, 250, 300])
    a = F(p, 100) * W
    return numv(f"A sunflower is {W} inches tall in June. By August it is {p}% as tall as it was in June. How tall is it in August (in inches)?", a,
      [f"Is {p}% more or less than 100%? So will the answer be taller or shorter than {W}?", f"Write {p}% as a decimal: {fmt(F(p,100))}.", f"Multiply {W} by {fmt(F(p,100))}.", f"Break {p}% into 100% + {p-100}%. 100% is {W}. Find the extra {p-100}% and add it on."],
      [f"{p}% = {fmt(F(p,100))}", f"{fmt(F(p,100))} × {W} = {fmt(a)}", f"The sunflower is {fmt(a)} inches tall."], unit="inches")
def g_tax(r):                                                        # 3.1 C: tax, then total
    price = r.choice([20, 25, 40, 50, 60, 80, 120, 150, 200]); rate = r.choice([4, 5, 6, 7, 8, 10])
    item = r.choice(["jacket", "backpack", "pair of shoes", "game", "lamp"]); tax = F(rate, 100) * price; tot = price + tax
    return numv(f"A {item} costs {money(price)}. The sales tax is {rate}%. What is the total cost, with tax (in dollars)?", tot,
      ["The question wants the TOTAL. What is the tax first?", f"Find {rate}% of {price}.", "Then add the tax to the price.", f"Check the size: the tax is a small piece of {price}, so the total is a bit MORE than {price}, never double."],
      [f"Tax: {fmt(F(rate,100))} × {price} = {fmt(tax)}", f"Total: {price} + {fmt(tax)} = {fmt(tot)}", f"The total cost is {money(tot)}."], unit="dollars", show=money(tot))
def g_percent(r):                                                    # 3.2 A: find the percent
    b = r.choice([20, 25, 40, 50, 80, 200, 250]); p = r.choice([x for x in (5, 10, 12, 15, 20, 25, 30, 35, 40, 45, 60, 65, 70, 75, 80, 85, 90) if (F(x, 100) * b).denominator == 1])
    a = int(F(p, 100) * b); who = r.choice([("students in a class", "brought lunch"), ("games a team played", "won"), ("shots a player took", "made")])
    return numv(f"Out of {b} {who[0]}, {a} {who[1]}. What percent is that?", p,
      ["Which number is the part? Which is the whole?", f"Write part over whole = P over 100: {a}/{b} = P/100.", "Multiply both sides by 100.", f"Divide {a} by {b} first, then move the decimal point two places right to make it a percent."],
      [f"{a}/{b} = P/100", f"P = {a} × 100 ÷ {b} = {p}", f"{p}% of the {who[0]} {who[1]}."], show=f"{p}%", pct=True)
def g_part(r):                                                       # 3.2 B: find the part with the proportion
    W = r.choice([12.5, 20, 30, 40, 60, 75, 120, 250]); p = r.choice([10, 20, 30, 35, 40, 60, 70, 75, 80, 150, 175]); a = F(p, 100) * D(W)
    thing = r.choice([("A bike path is {W} miles long. Dana has gone {p}% of the way. How many miles has she gone?", "miles"),
                      ("A bottle holds {W} ounces. It is {p}% full. How many ounces are in it?", "ounces")])
    return numv(thing[0].format(W=fmt(D(W)), p=p), a,
      ["Which number is the whole? What is the percent?", f"Write part/whole = P/100 with the part as n: n/{fmt(D(W))} = {p}/100.", f"Multiply both sides by {fmt(D(W))}.", f"Check the size: is {p}% more or less than the whole? Your answer should be {'bigger' if p > 100 else 'smaller'} than {fmt(D(W))}."],
      [f"n/{fmt(D(W))} = {p}/100", f"n = {p}/100 × {fmt(D(W))} = {fmt(a)}", f"The answer is {fmt(a)} {thing[1]}."], unit=thing[1])
def g_whole(r):                                                      # 3.2 C: find the whole
    p = r.choice([20, 25, 40, 50, 60, 75, 80, 120, 150, 200]); Wk = r.choice([20, 30, 40, 50, 60, 80, 100, 120, 150, 200]); a = F(p, 100) * Wk
    return numv(f"{fmt(a)} is {p}% of a number. What is the number?", Wk,
      [f"Which number is the part? What is the whole, the thing you don't know?", f"Write {fmt(a)}/w = {p}/100.", "Cross-multiply, then divide.", f"Cross-multiply: {p} × w = {fmt(a)} × 100. Then divide both sides by {p}."],
      [f"{fmt(a)}/w = {p}/100", f"w = {fmt(a)} × 100 ÷ {p} = {Wk}", f"The number is {Wk}."])


def g_whole_small(r):                                                # 3.1 D: find the whole from a small percent
    p = r.choice([D("0.5"), D("0.8"), D("0.9"), D("1.5"), D("2.5")]); W = r.choice([200, 400, 500, 800, 1000, 2000, 4000]); N = p / 100 * W
    if N.denominator != 1: return g_whole_small(r)
    return numv(f"{fmt(N)} is {fmt(p)}% of what number?", W,
      [f"Which number is the part? Which one is the whole you are looking for?", f"Write {fmt(N)}/w = {fmt(p)}/100.", f"What do you multiply {fmt(p)} by to get 100? Do the same to {fmt(N)}.", f"Check the size: the whole should be {'bigger' if p < 100 else 'smaller'} than {fmt(N)}, because {fmt(p)}% is {'only a slice of it' if p < 100 else 'more than all of it'}."],
      [f"{fmt(N)}/w = {fmt(p)}/100", f"w = {fmt(N)} × 100 ÷ {fmt(p)} = {W}", f"Check: {fmt(p)}% of {W} = {fmt(N)}."])
def g_pct_dec(r):                                                    # 3.1 E: percent to decimal
    p = r.choice([D("0.4"), D("0.25"), D("0.8"), D("0.6"), D("7"), D("12.5"), D("35"), D("0.05"), D("2.5")]); v = p / 100
    return numv(f"Write {fmt(p)}% as a decimal.", v,
      ["Percent means out of 100. What do you do to the decimal point?", "Move the point two places to the left (put in zeros if you need them).", f"Start from {fmt(p)}.", f"Count the places: start at {fmt(p)}, slide the point two places left (add zeros if you need them), then read your answer as a decimal."],
      [f"{fmt(p)}% = {fmt(p)} ÷ 100", f"= {fmt(v)}"], show=fmt(v))
def g_size(r):                                                       # 3.1 F: size sense
    n = r.choice([5, 8, 12, 20, 44, 60]); p = r.choice([120, 150, 250, 300, 500, 700]); a, b = r.choice([(10, 100), (50, 150), (100, 200), (100, 500)])
    v = F(p, 100) * n
    if v < 1 or v in (a, b): return g_size(r)
    ok = 0 if v < a else (1 if v <= b else 2)
    opts = [f"Less than {a}", f"Between {a} and {b}", f"Greater than {b}"]
    return chv(f"Is {p}% of {n} less than {a}, between {a} and {b}, or greater than {b}?", opts, ok,
      [f"100% of {n} is {n}. Is {p}% more or less than that?", f"{p}% is {fmt(F(p,100))} times as much as {n}.", f"Work out {fmt(F(p,100))} × {n} and compare.", f"Mark {a} and {b} on a number line. Work out {fmt(F(p,100))} × {n} and see where it lands."],
      [f"100% of {n} is {n}, so {p}% is {fmt(F(p,100))} times {n}.", f"{fmt(F(p,100))} × {n} = {fmt(v)}.", f"{fmt(v)} is {opts[ok].lower()}."])
def g_two_step(r):                                                   # 3.1 G: percent of a percent
    W = r.choice([200, 300, 400, 500, 600, 800, 1000]); p1 = r.choice([20, 25, 40, 50, 60, 70, 75]); p2 = r.choice([10, 20, 25, 30, 40, 50])
    first = F(p1, 100) * W
    if first.denominator != 1 or (F(p2, 100) * first).denominator != 1: return g_two_step(r)
    ans = F(p2, 100) * first; grp = r.choice([("students", "are in 7th grade", "play a sport", "students in 7th grade play a sport"), ("members", "are adults", "volunteer", "adult members volunteer")])
    return numv(f"A club has {W} {grp[0]}. {p1}% of them {grp[1]}. Of those, {p2}% {grp[2]}. How many {grp[3]}?", ans,
      ["This takes two steps. What do you find first?", f"First find {p1}% of {W}.", f"Then find {p2}% of THAT number, not of {W}.", f"Write two lines: line 1 = {p1}% of {W}; line 2 = {p2}% of the line 1 answer. Put your line 1 result into line 2."],
      [f"{p1}% of {W} = {fmt(first)}.", f"{p2}% of {fmt(first)} = {fmt(ans)}.", f"The answer is {fmt(ans)}."])
def g_survey(r):                                                     # 3.2 D: add the groups first
    p = r.choice([10, 15, 20, 25, 30, 35, 40, 45, 55, 60]); T = r.choice([200, 400, 500, 800, 1000, 2000]); A = F(p, 100) * T
    if A.denominator != 1: return g_survey(r)
    rest = int(T - A); B = (rest // 3) * 1 or 1; C = rest - B; who = r.choice([("lunch", "pizza", "burgers", "salad"), ("pets", "dogs", "cats", "fish")])
    return numv(f"A survey asked people about their favorite {who[0]}: {int(A)} chose {who[1]}, {B} chose {who[2]}, and {C} chose {who[3]}. What percent chose {who[1]}?", p,
      ["What is the whole? You have to add up all the groups.", f"Write {int(A)}/total = P/100.", "Solve for P.", f"Add the groups to get the whole first. The part is {int(A)}. Then divide the part by the whole and move the point two places right."],
      [f"Whole: {int(A)} + {B} + {C} = {T}.", f"{int(A)}/{T} = P/100.", f"P = {int(A)} × 100 ÷ {T} = {p}."], show=f"{p}%", pct=True)
def g_compare(r):                                                    # 3.2 E: which is the greater percent
    b = r.choice([20, 25, 40, 50]); d = r.choice([x for x in (20, 25, 40, 50, 80) if x != b]); a = r.choice([x for x in range(b // 2, b) if (F(x, b) * 100).denominator == 1]); c = r.choice([x for x in range(d // 2, d) if (F(x, d) * 100).denominator == 1])
    pa, pc = F(a, b) * 100, F(c, d) * 100
    if pa == pc: return g_compare(r)
    t1, t2 = r.choice([("Team A", "Team B"), ("Ana", "Ben"), ("Room 4", "Room 5")])
    return chv(f"{t1} won {a} of {b} games. {t2} won {c} of {d} games. Which has the greater percent of wins?", [t1, t2], 0 if pa > pc else 1,
      ["Totals can fool you. Turn each into a percent of its own games.", f"Write {a}/{b} = P/100 and {c}/{d} = P/100.", "Compare the two percents.", f"Divide each team's wins by its own games ({a} ÷ {b} and {c} ÷ {d}) and compare the two decimals."],
      [f"{t1}: {a}/{b} = {fmt(pa)}%.", f"{t2}: {c}/{d} = {fmt(pc)}%.", f"{(t1 if pa > pc else t2)} has the greater percent."])
def g_original(r):                                                   # 3.2 F: total is a percent of what the store paid
    paid = r.choice([40, 50, 60, 80, 90, 100, 120, 150, 200]); p = r.choice([110, 120, 125, 140, 150, 160, 180]); total = F(p, 100) * paid
    if total.denominator != 1: return g_original(r)
    item = r.choice(["bike", "kayak", "coat", "tablet"])
    return numv(f"A store sells a {item} for {money(total)}. That is {p}% of what the store paid for it. How much did the store pay?", paid,
      ["The store paid the original amount, the whole (100%). Is the selling price more or less than that?", f"Write {fmt(total)}/w = {p}/100.", f"w = {fmt(total)} × 100 ÷ {p}.", f"Cross-multiply: {p} × w = {fmt(total)} × 100, then divide both sides by {p}."],
      [f"{fmt(total)}/w = {p}/100", f"w = {fmt(total)} × 100 ÷ {p} = {paid}", f"The store paid {money(paid)}."], show=money(paid))
def g_which(r):                                                      # 3.2 G: what are you looking for?
    kind = r.choice(["whole", "percent", "part"]); n = r.choice([14, 18, 21, 24, 27]); p = r.choice([30, 40, 45, 56, 60, 75]); T = r.choice([25, 40, 50, 80]); thing = r.choice(["muffins", "sandwiches", "bracelets", "plants"])
    text = {"whole": f"A stand sold {n} {thing} on Saturday. That was {p}% of everything it sold all weekend. Which one does the story leave out: the part, the whole, or the percent?",
            "percent": f"A stand made {T + n} {thing} and sold {n} of them. What percent did it sell? Which one does the story leave out: the part, the whole, or the percent?",
            "part": f"A stand has {T} {thing} and {p}% of them are on sale. How many are on sale? Which one does the story leave out: the part, the whole, or the percent?"}[kind]
    ok = ["The percent", "The part", "The whole"].index({"whole": "The whole", "percent": "The percent", "part": "The part"}[kind])
    return chv(text, ["The percent", "The part", "The whole"], ok,
      ["Which numbers does the story give you? Which one does it NOT give you?", "Part: a piece. Whole: the full amount. Percent: out of 100.", "The one that is missing is what you are looking for.", "Make a list with three rows: part, whole, percent. Check off the ones the story tells you. The row without a check is what you are looking for."],
      [{"whole": f"{n} {thing} is the part and {p}% is the percent, so the total for the weekend (the whole) is missing.", "percent": f"{n} is the part and {T + n} is the whole, so the percent is missing.", "part": f"{T} is the whole and {p}% is the percent, so the part is missing."}[kind], f"You are looking for {['the percent', 'the part', 'the whole'][ok]}."])

# ---- Lesson 3.3: percents in real settings (sale price, tips, commission, steps in a row). Original problems, same skills as the lesson.
def g_sale_pct(r):                                                   # 3.3 A: the sale price is what percent of the regular price?
    R = r.choice([20, 40, 50, 80, 120, 200]); p = r.choice([60, 65, 70, 75, 80, 85, 90]); S = F(p, 100) * R; item = r.choice(["hoodie", "lamp", "scooter", "backpack", "board game"])
    return numv(f"A {item} regularly costs {money(R)}. This week it is {money(S)}. The sale price is what percent of the regular price?", p,
      ["Which price is the whole: the regular price or the sale price?", f"Write {fmt(S)}/{R} = P/100 (part over whole equals P over 100).", "Divide the part by the whole, then move the point two places right.", f"Divide {fmt(S)} by {R}, then move the point two places right. The sale price is less than the regular price, so your percent should be under 100."],
      [f"{fmt(S)}/{R} = P/100", f"{fmt(S)} ÷ {R} = {fmt(S / R)}, which is {p}%", f"The sale price is {p}% of the regular price."], show=f"{p}%", pct=True)
def g_tip(r):                                                        # 3.3 B: a tip on a bill
    B = r.choice([40, 60, 80, 120, 150, 200]); p = r.choice([10, 15, 18, 20, 25]); a = F(p, 100) * B
    return numv(f"Your family's dinner bill is {money(B)}. You leave a {p}% tip on the bill. How much is the tip (in dollars)?", a,
      ["The tip is a percent of the bill. Which number is the whole?", f"Write {p}% as a decimal.", "Multiply the bill by the decimal.", f"Work {p}% of {B} as {p} × {B} ÷ 100: multiply first, then move the point two places left."],
      [f"{p}% = {fmt(F(p,100))}", f"{fmt(F(p,100))} × {B} = {fmt(a)}", f"The tip is {money(a)}."], unit="dollars", show=money(a))
def g_comm_whole(r):                                                 # 3.3 C: find the sale from the commission
    W = r.choice([2000, 4000, 5000, 8000, 12000, 20000]); p = r.choice([2, 4, 5, 6, 8, 10]); c = F(p, 100) * W
    return numv(f"A seller earns {p}% commission on every sale. On one sale the commission was {money(c)}. What was the price of the sale (in dollars)?", W,
      ["Is the commission the part, the whole or the percent? What are you looking for?", f"Write {fmt(c)}/w = {p}/100.", f"w = {fmt(c)} × 100 ÷ {p}.", f"Cross-multiply: {p} × w = {fmt(c)} × 100, then divide both sides by {p}. The sale price should be much bigger than the commission."],
      [f"{fmt(c)}/w = {p}/100", f"w = {fmt(c)} × 100 ÷ {p} = {W}", f"The sale was {money(W)}."], show=money(W))
def g_two_stage(r):                                                  # 3.3 D: a percent of a percent of an amount
    for _ in range(50):
        P = r.choice([100000, 200000, 250000, 300000, 400000, 500000]); a = r.choice([4, 5, 6]); b = r.choice([20, 25, 40, 50])
        fee = F(a, 100) * P; keep = F(b, 100) * fee
        if keep.denominator == 1: break
    return numv(f"A broker's company charges {a}% of the {money(P)} price when a boat is sold. The broker keeps {b}% of what the company charges. How much does the broker keep (in dollars)?", keep,
      ["There are two percent steps. What is the first percent of?", f"Find the company's charge first: {a}% of {P}.", f"The broker's {b}% is of the company's charge, not of the price.", f"Write two lines: line 1 = {a}% of {P}; line 2 = {b}% of the line 1 answer. Put your line 1 result into line 2."],
      [f"Company charge: {fmt(F(a,100))} × {P} = {fmt(fee)}", f"Broker keeps: {fmt(F(b,100))} × {fmt(fee)} = {fmt(keep)}", f"The broker keeps {money(keep)}."], show=money(keep))
def g_pay_equal(r):                                                  # 3.3 E: two pay plans, find where they are equal
    for _ in range(50):
        w = r.choice([12, 15, 18, 20, 25]); h = r.choice([20, 30, 40]); p = r.choice([4, 5, 8, 10]); S = F(w * h * 100, p)
        if S.denominator == 1: break
    return numv(f"A worker can choose how to be paid for {h} hours of work. Plan 1 pays {money(w)} per hour. Plan 2 pays {p}% of the sales the worker makes. How much must the worker sell for the two plans to pay the same (in dollars)?", S,
      [f"First find what Plan 1 pays for {h} hours.", "Plan 2 pays a percent of the sales. You want the sales that make that percent equal the Plan 1 pay.", f"That is a find-the-whole problem: the Plan 1 pay is the part and {p}% is the percent.", f"Write it as: Plan 1 pay = {p}% of the sales. Then sales = Plan 1 pay × 100 ÷ {p}."],
      [f"Plan 1: {h} × {w} = {h*w}", f"{h*w}/s = {p}/100, so s = {h*w} × 100 ÷ {p} = {fmt(S)}", f"The sales must be {money(S)}."], show=money(S))
def g_leftover(r):                                                   # 3.3 F: the leftover is the other percent
    T = r.choice([200, 300, 400, 500, 800, 1200]); p = r.choice([20, 25, 30, 40, 60, 70, 75]); rest = F(100 - p, 100) * T
    where = r.choice([("A school's field", "for the garden", "for the track", "square feet"), ("A farm", "for corn", "for beans", "acres")])
    return numv(f"{where[0]} has {p}% set aside {where[1]}. The remaining {fmt(rest)} {where[3]} is {where[2]}. What is the total area, in {where[3]}?", T,
      [f"If {p}% is one share, what percent is the other share?", f"The {fmt(rest)} goes with that other percent. What are you looking for: the part, the whole or the percent?", "Write part/whole = P/100 with the other percent, and solve for the whole.", f"Cross-multiply: {100-p} × w = {fmt(rest)} × 100, then divide both sides by {100-p}. Test it: {p}% of your total plus {fmt(rest)} should make the total."],
      [f"The other share is 100% − {p}% = {100-p}%.", f"{fmt(rest)}/w = {100-p}/100, so w = {fmt(rest)} × 100 ÷ {100-p} = {T}", f"The total is {T} {where[3]}."], unit=where[3])
def g_gratuity(r):                                                   # 3.3 G: a bill plus a percent charge
    n = r.choice([6, 8, 10]); p = r.choice([15, 18, 20]); B = r.choice([80, 100, 120, 150, 200, 240]); a = F(p, 100) * B
    return numv(f"A cafe adds an automatic {p}% charge to the bill for any group of {n} or more. A group of {n} has a {money(B)} bill. What is the total they pay with the charge added (in dollars)?", B + a,
      ["The question asks for the TOTAL. What is the charge by itself first?", f"Find {p}% of {B}.", "Then add it to the bill.", f"Two steps: find the charge, then add it to the bill. The total should be a bit more than {B}."],
      [f"Charge: {fmt(F(p,100))} × {B} = {fmt(a)}", f"Total: {B} + {fmt(a)} = {fmt(B + a)}", f"They pay {money(B + a)}."], unit="dollars", show=money(B + a))

def _problem(sub, typ, gen, seed):
    """The base problem is the generator run once with a fixed seed (so its text and answer are stable forever)."""
    v = gen(random.Random(seed)); _add(sub, typ, v)
for _pid_i, (_sub, _typ, _gen, _seed) in enumerate([("3.1","A",g_balcony,11),("3.1","B",g_grow,12),("3.1","C",g_tax,13),("3.2","A",g_percent,21),("3.2","B",g_part,22),("3.2","C",g_whole,23),
   ("3.1","D",g_whole_small,14),("3.1","E",g_pct_dec,15),("3.1","F",g_size,16),("3.1","G",g_two_step,17),
   ("3.2","D",g_survey,24),("3.2","E",g_compare,25),("3.2","F",g_original,26),("3.2","G",g_which,27),
   ("3.3","A",g_sale_pct,31),("3.3","B",g_tip,32),("3.3","C",g_comm_whole,33),("3.3","D",g_two_stage,34),("3.3","E",g_pay_equal,35),("3.3","F",g_leftover,36),("3.3","G",g_gratuity,37)], 1):
    PROBS_ID = f"U3-{_pid_i:02d}"; _problem(_sub, _typ, _gen, _seed); PROBS[-1]["id"] = PROBS_ID; GENS[PROBS_ID] = _gen

def variants(pid, n=10):
    rng = random.Random(int(pid.split("-")[1]) * 7919); seen = set(); out = []; tries = 0
    while len(out) < n and tries < 400:
        tries += 1; v = GENS[pid](rng)
        key = (v["text"], str(v.get("table")), str(v.get("graph")), str(v.get("options")), v["show"])
        if key in seen: continue
        seen.add(key); out.append(v)
    return out

from units.unit3_shortcuts import shortcut   # "Try this in your head" lines (tools/units/unit3_shortcuts.py)
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
SOLVE.update({
 "U3-07": lambda t: (lambda m: _n(m[1]) * 100 / _n(m[2]))(re.search(r"^([\d.]+) is ([\d.]+)% of what number", t)),
 "U3-08": lambda t: _n(re.search(r"Write ([\d.]+)% as a decimal", t)[1]) / 100,
 "U3-10": lambda t: (lambda m: _n(m[1]) * _n(m[2]) / 100 * _n(m[3]) / 100)(re.search(r"club has (\d+) \w+\. (\d+)% of them .*? Of those, (\d+)%", t)),
 "U3-11": lambda t: (lambda m: _n(m[1]) * 100 / (_n(m[1]) + _n(m[2]) + _n(m[3])))(re.search(r"favorite \w+: (\d+) chose \w+, (\d+) chose \w+, and (\d+) chose", t)),
 "U3-13": lambda t: (lambda m: _n(m[1]) * 100 / _n(m[2]))(re.search(r"for \$([\d.]+)\. That is (\d+)% of what", t)),
 "U3-15": lambda t: (lambda m: _n(m[2]) / _n(m[1]) * 100)(re.search(r"regularly costs \$([\d.]+)\. This week it is \$([\d.]+)\.", t)),
 "U3-16": lambda t: (lambda m: _n(m[2]) / 100 * _n(m[1]))(re.search(r"dinner bill is \$([\d.]+)\. You leave a (\d+)% tip", t)),
 "U3-17": lambda t: (lambda m: _n(m[2]) * 100 / _n(m[1]))(re.search(r"earns (\d+)% commission on every sale\. On one sale the commission was \$([\d.]+)", t)),
 "U3-18": lambda t: (lambda m: _n(m[2]) / 100 * _n(m[3]) / 100 * _n(m[1]))(re.search(r"charges (\d+)% of the \$([\d,.]+) price.*?keeps (\d+)% of", t)),
 "U3-19": lambda t: (lambda m: _n(m[2]) * _n(m[1]) * 100 / _n(m[3]))(re.search(r"for (\d+) hours of work\. Plan 1 pays \$([\d.]+) per hour\. Plan 2 pays (\d+)%", t)),
 "U3-20": lambda t: (lambda m: _n(m[2]) * 100 / (100 - _n(m[1])))(re.search(r"has (\d+)% set aside .*?The remaining ([\d,.]+) ", t)),
 "U3-21": lambda t: (lambda m: _n(m[2]) * (1 + _n(m[1]) / 100))(re.search(r"automatic (\d+)% charge .*? has a \$([\d.]+) bill", t)),
})
# multiple choice: the index of the right option, worked out from the text
def _size(t):
    m = re.search(r"Is (\d+)% of (\d+) less than (\d+), between \d+ and (\d+)", t); v = _n(m[1]) / 100 * _n(m[2]); a, b = _n(m[3]), _n(m[4])
    return 0 if v < a else (1 if v <= b else 2)
def _compare(t):
    m = re.search(r"won (\d+) of (\d+) games\. .*? won (\d+) of (\d+) games", t); return 0 if _n(m[1]) / _n(m[2]) > _n(m[3]) / _n(m[4]) else 1
def _which(t):
    if "What percent" in t: return 0
    if "How many" in t: return 1
    return 2
SOLVE_CHOICE = {"U3-09": _size, "U3-12": _compare, "U3-14": _which}

import units.unit3_more   # noqa: E402,F401  new families (U3-22 onward) register themselves here, after everything above exists

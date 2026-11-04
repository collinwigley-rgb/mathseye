"""Mental shortcuts for the Unit 2 study guide ("Try this in your head").

Each builder reads the numbers off the problem text (so every "new numbers" version gets its own lines),
writes short plain steps for a 12 year old, and NEVER works out the final answer. Before returning, it
recomputes the whole method with Fractions and checks it against the problem's real answer: a method that
does not land on the answer raises, so a wrong shortcut cannot be published. A problem whose numbers do not
fit a clean method gets no shortcut (an empty list). Problems that are just a yes/no, a graph or a table are
left to the hints.

shortcut(pid, text, answer, show) -> list[str]
"""
import re
from fractions import Fraction as F


def num(s):
    """'$4.68' / '1.5' / '84' -> Fraction."""
    return F(str(s).replace("$", "").replace(",", ""))


def fmt(x):
    """Fraction -> '90' or '22.5'."""
    x = F(x)
    return str(int(x)) if x.denominator == 1 else str(float(x))


def mixed(s):
    """'1 1/2', '5/6', '3', '2.5' -> Fraction."""
    s = s.strip()
    m = re.fullmatch(r"(?:(\d+) )?(\d+)/(\d+)", s)
    if m:
        return F(int(m.group(1) or 0)) + F(int(m.group(2)), int(m.group(3)))
    return num(s)


def ok(value, answer, tol=F(1, 10**6)):
    """The recomputed method must land on the real answer."""
    if answer is None:
        raise AssertionError("no answer to check against")
    a = F(str(answer)).limit_denominator(100000) if not isinstance(answer, F) else answer
    if abs(value - a) > tol:
        raise AssertionError(f"shortcut method gives {float(value)}, answer is {float(a)}")


# ---- ways to divide / multiply in your head. Each entry: (lines, ops), ops multiply out to the operation. ----
def _div_table(D):
    h = "Cut that in half again."
    return {
        2: ([f"Cut {D} in half."], [("div", 2)]),
        4: ([f"Cut {D} in half.", h], [("div", 2), ("div", 2)]),
        5: ([f"Double {D}.", "Then slide the decimal point one place left. That divides by 10."], [("mul", 2), ("div", 10)]),
        6: ["6 is 2 × 3.", f"Divide {D} by 2.", "Then divide that answer by 3."],
        8: ([f"Cut {D} in half.", h, "Cut it in half one more time."], [("div", 2), ("div", 2), ("div", 2)]),
        9: (["9 is 3 × 3.", f"Divide {D} by 3.", "Then divide that answer by 3 again."], [("div", 3), ("div", 3)]),
        10: ([f"Slide the decimal point in {D} one place left."], [("div", 10)]),
        12: (["12 is 3 × 4.", f"Divide {D} by 3.", "Then cut that answer in half twice."], [("div", 3), ("div", 2), ("div", 2)]),
        15: (["15 is 3 × 5.", f"Divide {D} by 3.", "Then double that answer and slide the decimal point one place left."], [("div", 3), ("mul", 2), ("div", 10)]),
        16: ([f"Cut {D} in half four times in a row."], [("div", 2)] * 4),
        14: (["14 is 2 × 7.", f"Cut {D} in half.", "Then divide that answer by 7."], [("div", 2), ("div", 7)]),
        18: (["18 is 2 × 9.", f"Cut {D} in half.", "Then divide that answer by 9."], [("div", 2), ("div", 9)]),
        21: (["21 is 3 × 7.", f"Divide {D} by 3.", "Then divide that answer by 7."], [("div", 3), ("div", 7)]),
        24: (["24 is 4 × 6.", f"Cut {D} in half twice.", "Then divide that answer by 6."], [("div", 2), ("div", 2), ("div", 6)]),
        28: (["28 is 4 × 7.", f"Cut {D} in half twice.", "Then divide that answer by 7."], [("div", 2), ("div", 2), ("div", 7)]),
        32: ([f"Cut {D} in half five times in a row."], [("div", 2)] * 5),
        35: (["35 is 5 × 7.", f"Double {D}, then slide the decimal point one place left.", "Then divide that answer by 7."], [("mul", 2), ("div", 10), ("div", 7)]),
        36: (["36 is 4 × 9.", f"Cut {D} in half twice.", "Then divide that answer by 9."], [("div", 2), ("div", 2), ("div", 9)]),
        45: (["45 is 5 × 9.", f"Double {D}, then slide the decimal point one place left.", "Then divide that answer by 9."], [("mul", 2), ("div", 10), ("div", 9)]),
        20: ([f"Cut {D} in half.", "Then slide the decimal point one place left."], [("div", 2), ("div", 10)]),
        25: ([f"Multiply {D} by 4.", "Then slide the decimal point two places left. That divides by 100."], [("mul", 4), ("div", 100)]),
        30: (["30 is 3 × 10.", f"Divide {D} by 3.", "Then slide the decimal point one place left."], [("div", 3), ("div", 10)]),
        40: ([f"Cut {D} in half twice.", "Then slide the decimal point one place left."], [("div", 2), ("div", 2), ("div", 10)]),
        50: ([f"Double {D}.", "Then slide the decimal point two places left. That divides by 100."], [("mul", 2), ("div", 100)]),
        100: ([f"Slide the decimal point in {D} two places left."], [("div", 100)]),
    }


def _mul_table(X):
    return {
        2: ([f"Double {X}."], [("mul", 2)]),
        3: ([f"Double {X}.", f"Then add {X} one more time."], [("mul", 3)]),
        4: ([f"Double {X}.", "Then double that again."], [("mul", 2), ("mul", 2)]),
        5: ([f"Slide the decimal point in {X} one place right. That multiplies by 10.", "Then cut that in half."], [("mul", 10), ("div", 2)]),
        6: (["6 is 2 × 3.", f"Multiply {X} by 3: double it, then add {X} one more time.", "Then double that answer."], [("mul", 3), ("mul", 2)]),
        8: ([f"Double {X}.", "Double that.", "Then double it one more time."], [("mul", 2)] * 3),
        10: ([f"Slide the decimal point in {X} one place right."], [("mul", 10)]),
        20: ([f"Double {X}.", "Then slide the decimal point one place right."], [("mul", 2), ("mul", 10)]),
        25: ([f"Slide the decimal point in {X} two places right. That multiplies by 100.", "Then cut that in half twice."], [("mul", 100), ("div", 2), ("div", 2)]),
        50: ([f"Slide the decimal point in {X} two places right.", "Then cut that in half."], [("mul", 100), ("div", 2)]),
    }


def _apply(ops, x):
    x = F(x)
    for op, k in ops:
        x = x * k if op == "mul" else x / k
    return x


def div_way(n, D):
    """Lines to divide D by n in your head, or None. Verified: the ops really divide by n."""
    t = _div_table(D)
    e = t.get(int(n))
    if e is None:
        return None
    if isinstance(e, list):   # 6: written out by hand, ops are 2 then 3
        e = (e, [("div", 2), ("div", 3)])
    lines, ops = e
    assert _apply(ops, 1000) == F(1000, int(n)), f"bad divide-by-{n} method"
    return lines


def mul_way(m, X):
    """Lines to multiply X by m in your head, or None. Verified."""
    try:
        e = _mul_table(X).get(int(m)) if F(m).denominator == 1 else None
    except (ValueError, TypeError):
        e = None
    if e is None:
        return None
    lines, ops = e
    assert _apply(ops, 1000) == 1000 * int(m), f"bad multiply-by-{m} method"
    return lines


def plain_div(n, D):
    return [f"Divide {D} by {n}."]


def plain_mul(m, X):
    return [f"Multiply {X} by {m}."]


# ------------------------------------------------------------------------------------ families
def _u01(t, a, show):
    m = re.search(r"(\d+)-pack .*?costs (\$\d+(?:\.\d+)?)", t)
    if not m: return []
    n, cost = m.group(1), m.group(2)
    ok(num(cost) / int(n), a)
    w = div_way(n, cost)
    return ([f"Cost of ONE = {cost} ÷ {n}. Try it in your head:"] + w) if w else []


def _u02(t, a, show):
    items = re.findall(r"([A-Za-z]+(?: [A-Za-z]+)?): (\d+) oz for (\$\d+(?:\.\d+)?)", t)
    if len(items) != 2: return []
    per = [num(p) / int(o) for _, o, p in items]
    best = items[0][0] if per[0] < per[1] else items[1][0]
    if best != show: raise AssertionError(f"compare gives {best}, show says {show}")
    out = []
    for name, oz, price in items:
        w = div_way(oz, price)
        out += [f"{name}: {oz} oz for {price}."] + (w if w else plain_div(oz, price))
    return out + ["The smaller price per ounce is the better deal."]


def _u03(t, a, show):
    m = re.search(r"(\d+) (?:[a-z]+ )*?in (\d+) minutes.*in (\d+) minutes", t)
    if not m: return []
    amount, mins, target = m.groups()
    ok(num(amount) / int(mins) * int(target), a)
    d = div_way(mins, amount) or plain_div(mins, amount)
    mm = mul_way(target, "that answer") or plain_mul(target, "that answer")
    return ["First find the amount in ONE minute."] + d + [f"Now find {target} minutes."] + mm


def _u04(t, a, show):
    m = re.search(r"(\d+) ([\w ]+?) for every (\d+) ([\w ]+?)\. There are (\d+)", t)
    if not m: return []
    x, nx, y, ny, known = m.groups()
    ok(F(int(known), int(y)) * int(x), a)
    return [f"Count the groups: how many {y}s fit in {known}?", f"Each group has {x} {nx}.", f"So multiply the number of groups by {x}."]


def _u05(t, a, show):
    m = re.search(r"(\d+) cups of flour for every (\d+) muffins\. Flour costs (\$\d+(?:\.\d+)?) per cup.*?(\d+) muffins", t)
    if not m: return []
    c, per, price, total = m.groups()
    ok(F(int(total), int(per)) * int(c) * num(price), a)
    return [f"Count the batches: how many {per}s fit in {total}?", f"Each batch uses {c} cups of flour. Multiply to get all the cups.", f"Each cup costs {price}. Multiply the cups by that."]


def _u06(t, a, show):
    m = re.search(r"(\d+) dozen for (\$\d+(?:\.\d+)?)\. What does one", t)
    if not m: return []
    k, price = m.groups()
    count = int(k) * 12                 # "3 dozen" of whatever is sold (pairs of gloves count as one item)
    ok(num(price) / count, a)
    w = div_way(count, price)
    return [f"{k} dozen is {k} × 12 = {count}.", "Now find the cost of ONE."] + (w if w else plain_div(count, price))


def _u07(t, a, show):
    items = re.findall(r"(\w+) types (\d+) words in (\d+) minutes", t)
    if len(items) != 2: return []
    speed = [F(int(w), int(m)) for _, w, m in items]
    best = items[0][0] if speed[0] > speed[1] else items[1][0]
    if best != show: raise AssertionError(f"typing compare gives {best}, show says {show}")
    out = []
    for name, w, m in items:
        d = div_way(m, w)
        out += [f"{name}: {w} words in {m} minutes. Find words in ONE minute."] + (d if d else plain_div(m, w))
    return out + ["The bigger number is faster."]


def _frac_text(s):
    return mixed(s)


def _u08_09(t, a, show):
    m = re.search(r"(?:fills|rides) (a whole \w+|\d+ \d+/\d+|\d+/\d+|\d+)(?: of a \w+| miles?)? in (\d+)/(\d+) (minute|hour)", t)
    if not m: return []
    q, p, r, unit = m.groups()
    qv = F(1) if q.startswith("a whole") else mixed(q)
    ok(qv / F(int(p), int(r)), a)
    amount = "1" if q.startswith("a whole") else q
    if p == "1":
        return [f"How many 1/{r}-{unit} pieces fit in 1 {unit}? {r} of them.", f"So dividing by 1/{r} is the same as multiplying by {r}.", f"Here that means multiply {amount} by {r}."]
    return [f"Flip the second fraction: {p}/{r} becomes {r}/{p}.", "Change the ÷ to ×.", "Cancel what you can, then multiply across."]


def _u10(t, a, show):
    m = re.search(r"(\d+) Calories in (\d+)/(\d+) cup.*?(\d+) cups", t)
    if not m: return []
    x, p, q, n = m.groups()
    ok(F(int(x)) / F(int(p), int(q)) * int(n), a)
    first = [f"{x} Calories is ONE 1/{q}-cup piece."] if p == "1" else [f"{p}/{q} cup is {p} pieces of 1/{q} cup.", f"Split {x} Calories into {p} equal pieces. That is one 1/{q}-cup piece."]
    return first + [f"A whole cup is {q} of those pieces.", f"Then multiply by {n} cups."]


def _u11(t, a, show):
    runs = re.findall(r"(\w+(?: \w+)?) goes (\d+ \d+/\d+|\d+/\d+|\d+) miles in (\d+)/(\d+) hour", t)
    if len(runs) != 2: return []
    sp = [mixed(mi) / F(int(p), int(q)) for _, mi, p, q in runs]
    best = runs[0][0] if sp[0] > sp[1] else runs[1][0]
    if best != show: raise AssertionError(f"runner compare gives {best}, show says {show}")
    return ["Turn any mixed number into a fraction first (1 1/2 = 3/2).", "Speed = miles ÷ hours. Flip the hours fraction and multiply.", "Do that for each runner, then compare the two speeds."]


def _u12(t, a, show):
    m = re.search(r"(\d+)/(\d+) inch = (\d+) miles.*?(\d+ \d+/\d+|\d+/\d+|\d+) inches", t)
    if not m: return []
    p, q, mi, w = m.groups()
    ok(F(int(mi), int(p)) * F(int(q)) * mixed(w), a)
    one = [f"ONE 1/{q}-inch piece is {mi} miles."] if p == "1" else [f"{p}/{q} inch = {mi} miles, so split {mi} miles into {p} equal pieces.", f"That is the miles for ONE 1/{q}-inch piece."]
    return [f"Think in 1/{q}-inch pieces."] + one + [f"Count how many 1/{q}-inch pieces are in {w} inches.", "Multiply that count by the miles for ONE piece."]


def _u13(t, a, show):
    m = re.search(r"(\d+) \w+ in (\d+)/(\d+) hour", t)
    if not m: return []
    n, p, q = m.groups()
    ok(F(int(p), int(q)) / int(n), a)
    return [f"Time for ONE = the total time ÷ {n}.", f"Dividing by {n} is the same as multiplying by 1/{n}.", f"Multiply {p}/{q} × 1/{n}: tops together, bottoms together."]


def _u20(t, a, show):
    m = re.search(r"(\d+) [a-z]+ in (\d+) (?:hours|minutes)", t)
    if not m: return []
    amount, n = m.groups()
    ok(F(int(amount), int(n)), a)
    w = div_way(n, amount)
    return ([f"k = {amount} ÷ {n}. Try it in your head:"] + w) if w else []


def _u21_24(t, a, show):
    k = re.search(r"y = (\d+\.\d+)x", t)
    if not k: return []
    x = re.search(r"x = (\d+)", t) or re.search(r"What do (\d+)", t)
    if not x: return []
    kk, xx = num(k.group(1)), int(x.group(1))
    if kk * 2 % 2 != 1: return []             # only whole-and-a-half numbers
    w = int(kk)
    ok(kk * xx, a)
    return [f"{k.group(1)} is {w} and a half.", f"Do {w} × {xx}.", f"Then add half of {xx}.", "Add the two parts together."]


def _u22(t, a, show):
    m = re.search(r"y = (\d*\.\d+)x\. What is x when y = ([\d.]+)", t)
    if not m: return []
    k, y = m.groups()
    kf = num(k)
    if kf >= 10 or kf.denominator not in (2, 4, 5): return []
    ok(num(y) / kf, a)
    n, d = kf.numerator, kf.denominator
    do = f"Dividing by 1/{d} is the same as multiplying by {d}." if n == 1 else f"Dividing by {n}/{d} means multiply by {d}, then divide by {n}."
    return [f"x = {y} ÷ {k}.", f"{k} is {n}/{d}.", do]


def _u23(t, a, show):
    m = re.search(r"[Ff]or every (\d+) \w+, the cost goes up (\$\d+(?:\.\d+)?)", t)
    if not m: return []
    n, c = m.groups()
    ok(num(c) / int(n), a)
    w = div_way(n, c)
    return ([f"Cost of ONE = {c} ÷ {n}. Try it in your head:"] + w) if w else []


def _u26(t, a, show):
    m = re.search(r"fills ([\d.]+) gallons in ([\d.]+) minutes.*?in (\d+) minutes", t)
    if not m: return []
    g, mins, target = m.groups()
    if (num(mins) * 2).denominator != 1: return []
    ok(num(g) / num(mins) * int(target), a)
    return ["Get rid of the decimal: double both numbers.", f"{g} gallons and {mins} minutes become {fmt(num(g) * 2)} and {fmt(num(mins) * 2)}.", "Divide the gallons by the minutes to get gallons in ONE minute.", f"Then multiply by {target} minutes."]


def _u31(t, a, show):
    m = re.search(r"\((\d+), (\d+)\)\. What is y when x = 1", t)
    if not m: return []
    x, y = m.groups()
    ok(F(int(y), int(x)), a)
    w = div_way(x, y)
    return [f"x = 1 is x = {x} divided by {x}. So divide y = {y} by {x} too."] + (["Try it in your head:"] + w if w else [])


def _u33(t, a, show):
    m = re.search(r"(\w+) is (\d+) years old when (?:her |his |their )?(\w+) is (\d+)\. How old will (?:her |his |their )?(\w+) be when (\w+) is (\d+)", t)
    if not m: return []
    n1, a1, n2, a2, ask, given, new = m.groups()
    ages = {n1: int(a1), n2: int(a2)}
    # the name in the question may be a word like "cousin": work from the two ages
    gap = abs(int(a1) - int(a2))
    if abs(a - (int(new) + gap)) < 1e-9: how = "Add the gap to the new age."
    elif abs(a - (int(new) - gap)) < 1e-9: how = "Take the gap away from the new age."
    else: raise AssertionError("age shortcut does not match the answer")
    return [f"They are always the same number of years apart. Find the gap: {max(ages.values())} − {min(ages.values())}.", how]


def _u34(t, a, show):
    m = re.search(r"(\d+) people .*? in (\d+) hours\. How many hours would (\d+) people", t)
    if not m: return []
    p1, h, p2 = map(int, m.groups())
    ok(F(p1 * h, p2), a)
    if p2 % p1 == 0:
        f = p2 // p1
        return [f"{p2} people is {f} times as many as {p1}.", f"More people means less time, so divide the {h} hours by {f}."]
    if p1 % p2 == 0:
        f = p1 // p2
        return [f"{p2} people is {f} times fewer than {p1}.", f"Fewer people means more time, so multiply the {h} hours by {f}."]
    return [f"The whole job is {p1} × {h} hours of one person's work.", f"Share it between {p2} people: divide by {p2}."]


def _u35(t, a, show):
    m = re.search(r"uses (\d+) [^.]*? for every (\d+) [^.]*?\. You use (\d+)", t)
    if not m: return []
    x, y, n = map(int, m.groups())
    if n % y: return []
    ok(F(n, y) * x, a)
    return [f"Count the groups: how many {y}s fit in {n}?", f"Each group has {x} of the other ingredient. Multiply the number of groups by {x}."]


def _u36(t, a, show):
    m = re.search(r"(\d+) cups of nuts for every (\d+) cups of raisins\. A bag has (\d+) cups of nuts and (\d+) cups of raisins", t)
    if not m: return []
    x, y, nuts, rais = map(int, m.groups())
    if rais % y: return []
    ok(F(rais, y) * x - nuts, a)
    return [f"Use the raisins to count groups: how many {y}s fit in {rais}?", f"Each group needs {x} cups of nuts. Multiply to find the nuts the bag SHOULD have.", f"The bag has {nuts} cups of nuts. Subtract to see how many more it needs."]


def _u37(t, a, show):
    m = re.search(r"(\d+) inches of \w+ cost (\$\d+(?:\.\d+)?)\. How much do (\d+) yards", t)
    if not m: return []
    i, c, y = m.groups()
    ok(num(c) / int(i) * int(y) * 36, a)
    w = div_way(i, c)
    return [f"Make the units match first. 1 yard = 36 inches, so change {y} yards to inches: {y} × 36.", f"Now find the cost of ONE inch: {c} ÷ {i}."] + (w if w else []) + ["Then multiply by the number of inches you need."]


def _u39(t, a, show):
    m = re.search(r"1 in\. = (\d+) ft\. .*? ([\d.]+) in\.", t)
    if not m: return []
    s_, length = m.groups()
    ok(num(length) * int(s_), a)
    w = mul_way(s_, length)
    return ([f"Real length = drawing length × scale = {length} × {s_}. Try it in your head:"] + w) if w else []


def _u40(t, a, show):
    m = re.search(r"(\d+) in\. = (\d+) ft\. .*? (\d+) in\.", t)
    if not m: return []
    i, f, length = m.groups()
    ok(F(int(f), int(i)) * int(length), a)
    w = div_way(i, f)
    return [f"Find the feet for ONE inch: {i} inches = {f} feet."] + (w if w else plain_div(i, f)) + [f"Then multiply by {length} inches."]


def _u41(t, a, show):
    m = re.search(r"(\d+) in\. by (\d+) in\..*1 in\. = (\d+) ft", t)
    if not m: return []
    x, y, s = map(int, m.groups())
    ok(F(x * s * y * s), a)
    return [f"Change each side to real feet first: {x} × {s} and {y} × {s}.", "Multiply the two real sides to get the area.", f"Don't multiply the drawing's area by {s}. Area needs the real sides."]


def _u42(t, a, show):
    m = re.search(r"real (\d+)-ft .*? is (\d+) in\.", t)
    if not m: return []
    ft, i = m.groups()
    ok(F(int(ft), int(i)), a)
    w = div_way(i, ft)
    return ([f"Feet for ONE inch = {ft} ÷ {i}. Try it in your head:"] + w) if w else [f"Feet for ONE inch = {ft} ÷ {i}."]


def _u43(t, a, show):
    m = re.search(r"is (\d+) in\. long at a scale of 1 in\. = (\d+) ft.*redraw it (\d+) in\.", t)
    if not m: return []
    L, s, N = m.groups()
    ok(F(int(L) * int(s), int(N)), a)
    w = div_way(N, "the real length")
    return [f"Find the real length first: {L} × {s}.", f"The new drawing is {N} inches long.", "New scale = real length ÷ new inches."] + (w or [])


def _u44(t, a, show):
    m = re.search(r"1 in\. = (\d+) miles\. .*?(\d+)(?: (\d+)/(\d+))? in\. apart", t)
    if not m: return []
    s_, w, p, q = m.groups()
    if p is None: return []
    s_, w, p, q = int(s_), int(w), int(p), int(q)
    if q not in (2, 4) or (q == 4 and s_ % 4): return []
    ok((w + F(p, q)) * s_, a)
    part = f"half of {s_}" if q == 2 else (f"a quarter of {s_} (cut {s_} in half twice)" if p == 1 else f"{p}/4 of {s_}: find a quarter of {s_} (cut it in half twice), then multiply by {p}")
    return [f"Split {w} {p}/{q} into {w} and {p}/{q}.", f"Do {w} × {s_}.", f"Then find {part}.", "Add the two parts together."]


BUILDERS = {
    "U2-01": _u01, "U2-02": _u02, "U2-03": _u03, "U2-04": _u04, "U2-05": _u05, "U2-06": _u06, "U2-07": _u07,
    "U2-08": _u08_09, "U2-09": _u08_09, "U2-10": _u10, "U2-11": _u11, "U2-12": _u12, "U2-13": _u13,
    "U2-20": _u20, "U2-21": _u21_24, "U2-22": _u22, "U2-23": _u23, "U2-24": _u21_24, "U2-26": _u26,
    "U2-31": _u31, "U2-33": _u33, "U2-34": _u34, "U2-35": _u35, "U2-36": _u36, "U2-37": _u37,
    "U2-39": _u39, "U2-40": _u40, "U2-41": _u41, "U2-42": _u42, "U2-43": _u43, "U2-44": _u44,
}


def shortcut(pid, text, answer, show):
    b = BUILDERS.get(pid)
    if not b:
        return []
    return b(text, answer, show) or []

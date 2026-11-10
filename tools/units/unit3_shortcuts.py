"""Mental shortcuts for Unit 3 ("Try this in your head"). Same contract as tools/unit2_shortcuts.py:
each builder reads the numbers off the problem text (so every new-numbers version gets its own lines), writes short plain steps for a
12 year old, and NEVER states the final answer. Before returning it recomputes the described method with Fractions and raises if that does
not land on the real answer, so a wrong shortcut cannot be published. No clean method (or a choice problem) = no shortcut (an empty list)."""
import re
from fractions import Fraction as F

def num(s): return F(str(s).replace("$", "").replace(",", "").rstrip("."))
def fmt(x):
    x = F(x); return str(int(x)) if x.denominator == 1 else str(float(x))

def _check(got, answer, what):
    if abs(float(got) - float(answer)) > 1e-9: raise AssertionError(f"shortcut for {what} lands on {float(got)}, answer is {answer}")

# percent -> (lines about W, how to compute from W). {W} is filled in with the problem's own whole.
TEN = "Find 10% of {W}: slide the decimal point one place left."
def _recipe(p):
    R = {
     5:   ([TEN, "5% is half of that."], lambda W: W / 10 / 2),
     10:  (["10% means divide by 10: slide the decimal point one place left."], lambda W: W / 10),
     15:  ([TEN, "5% is half of that.", "15% = 10% + 5%, so add them."], lambda W: W / 10 + W / 20),
     20:  ([TEN, "20% is two tens: double it."], lambda W: W / 10 * 2),
     25:  (["25% is a quarter: halve {W}, then halve it again."], lambda W: W / 4),
     30:  ([TEN, "30% is three tens: multiply by 3."], lambda W: W / 10 * 3),
     35:  (["Find 25% of {W}: halve it, then halve again.", "Find 10% of {W}: slide the decimal point one place left.", "35% = 25% + 10%, so add them."], lambda W: W / 4 + W / 10),
     40:  ([TEN, "40% is four tens: multiply by 4."], lambda W: W / 10 * 4),
     50:  (["50% is half: divide {W} by 2."], lambda W: W / 2),
     60:  ([TEN, "60% is six tens: multiply by 6."], lambda W: W / 10 * 6),
     70:  ([TEN, "70% is seven tens: multiply by 7."], lambda W: W / 10 * 7),
     75:  (["Find 25% of {W}: halve it, then halve again.", "75% is three quarters: multiply by 3."], lambda W: W / 4 * 3),
     80:  ([TEN, "80% is eight tens: multiply by 8."], lambda W: W / 10 * 8),
     120: (["100% is {W} itself.", TEN, "The extra 20% is two tens. Add it to {W}."], lambda W: W + W / 10 * 2),
     125: (["100% is {W} itself.", "The extra 25% is a quarter: halve {W}, then halve again.", "Add that to {W}."], lambda W: W + W / 4),
     150: (["100% is {W} itself.", "The extra 50% is half of {W}.", "Add the two."], lambda W: W + W / 2),
     175: (["100% is {W} itself.", "The extra 75% is three quarters of {W}.", "Add the two."], lambda W: W + W / 4 * 3),
     200: (["200% means two wholes: double {W}."], lambda W: W * 2),
     250: (["200% means two wholes: double {W}.", "The other 50% is half of {W}. Add it."], lambda W: W * 2 + W / 2),
     300: (["300% means three wholes: multiply {W} by 3."], lambda W: W * 3),
    }
    return R.get(int(p)) if F(p).denominator == 1 else None

def _percent_of(text, answer, pat):
    m = re.search(pat, text)
    if not m: return []
    W, p = num(m[1]), num(m[2]); r = _recipe(p)
    if not r: return []
    lines, f = r; _check(f(W), answer, text[:40]); return [l.format(W=fmt(W)) for l in lines]

def u3_01(t, a, s): return _percent_of(t, a, r"has (\d+) \w+ and (\d+)%")
def u3_02(t, a, s): return _percent_of(t, a, r"is (\d+) inches tall in June\. By August it is (\d+)%")
def u3_05(t, a, s):
    m = re.search(r"(?:is|holds) ([\d.]+) (?:miles long|ounces)\. (?:\w+ has gone|It is) (\d+)%", t)
    if not m: return []
    return _percent_of(f"has {m[1]} x and {m[2]}%", a, r"has ([\d.]+) \w+ and (\d+)%")
def u3_03(t, a, s):
    m = re.search(r"costs \$([\d.]+)\. The sales tax is (\d+)%", t)
    if not m: return []
    P, r = num(m[1]), num(m[2]); tax = P / 100 * r; _check(P + tax, a, t[:40])
    first = f"Find 1% of ${fmt(P)}: slide the decimal point two places left." if r != 10 else f"Find 10% of ${fmt(P)}: slide the decimal point one place left."
    second = f"The tax is {fmt(r)} of those." if r != 10 else "That is the tax."
    return [first, second, "Add the tax to the price to get the total."]
def u3_04(t, a, s):
    m = re.search(r"Out of (\d+) [\w ]+?, (\d+) [\w ]+?\. What percent", t)
    if not m: return []
    b, p = num(m[1]), num(m[2]); _check(p / b * 100, a, t[:40])
    return [f"Write the part over the whole: {fmt(p)} ÷ {fmt(b)}.", "Slide the decimal point two places right to make it a percent."]
def u3_06(t, a, s):
    m = re.search(r"^([\d.]+) is (\d+)% of a number", t)
    if not m: return []
    N, p = num(m[1]), num(m[2]); _check(N / p * 100, a, t[:40])
    if N == p: return []            # the answer is exactly 100, which the line "multiply by 100" would hand over
    return [f"{fmt(p)}% is {fmt(N)}, so find 1%: divide {fmt(N)} by {fmt(p)}.", "100% is a hundred of those 1%s: multiply by 100."]
def u3_08(t, a, s):
    m = re.search(r"Write ([\d.]+)% as a decimal", t)
    if not m: return []
    _check(num(m[1]) / 100, a, t); return ["Percent means out of 100.", "Slide the decimal point two places left. Add zeros if you need them."]
def u3_10(t, a, s):
    m = re.search(r"club has (\d+) \w+\. (\d+)% of them .*? Of those, (\d+)%", t)
    if not m: return []
    W, p1, p2 = num(m[1]), num(m[2]), num(m[3]); _check(W * p1 / 100 * p2 / 100, a, t[:40])
    return [f"Do two steps. First find {fmt(p1)}% of {fmt(W)}.", f"Then find {fmt(p2)}% of THAT number, not of {fmt(W)}."]
def u3_11(t, a, s):
    m = re.search(r"favorite \w+: (\d+) chose \w+, (\d+) chose \w+, and (\d+) chose", t)
    if not m: return []
    A, B, C = num(m[1]), num(m[2]), num(m[3]); _check(A * 100 / (A + B + C), a, t[:40])
    return ["Add all the groups to get the whole.", f"Then {fmt(A)} ÷ the whole, and slide the decimal point two places right."]
def u3_13(t, a, s):
    m = re.search(r"for \$([\d.]+)\. That is (\d+)% of what", t)
    if not m: return []
    T, p = num(m[1]), num(m[2]); _check(T / p * 100, a, t[:40])
    if T == p: return []
    return [f"{fmt(p)}% is ${fmt(T)}, so find 1%: divide {fmt(T)} by {fmt(p)}.", "100% is a hundred of those 1%s: multiply by 100."]

BUILDERS = {"U3-01": u3_01, "U3-02": u3_02, "U3-03": u3_03, "U3-04": u3_04, "U3-05": u3_05, "U3-06": u3_06, "U3-08": u3_08, "U3-10": u3_10, "U3-11": u3_11, "U3-13": u3_13}
def shortcut(pid, text, answer, show):
    b = BUILDERS.get(pid)
    return (b(text, answer, show) or []) if b else []

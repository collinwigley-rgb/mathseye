"""Unit 3 Study Guide problem families added after the first 21 (U3-22 onward). One block per family; scaffold with: python3 tools/new_family.py 3 <lesson>.
Rules: original wording only (never worksheet text), numbers chosen so the answer is clean, `solve` re-derives the answer from the TEXT with separate arithmetic."""
import re
from units import unit3 as U
from units.family import family
from units.common import numv, chv, money, fmt, F, D

def _n(s): return F(s.replace(",", "").replace("$", "").rstrip("."))

@family(U, "3.3", concepts=["percent-of", "tax-tip"], seed=41,
        solve=lambda t: (lambda m: _n(m[1]) * (1 - _n(m[2]) / 100))(re.search(r"regular price is \$([\d.]+)\. It is (\d+)% off", t)))
def g_discount(r):                                                   # 3.3 H: price after a percent off
    R = r.choice([20, 40, 50, 60, 80, 120, 150, 200]); p = r.choice([10, 15, 20, 25, 30, 40, 50]); item = r.choice(["hoodie", "keyboard", "tent", "pair of headphones", "skateboard"])
    off = F(p, 100) * R; sale = R - off
    return numv(f"The regular price is {money(R)}. It is {p}% off. What is the sale price of the {item} (in dollars)?", sale,
      ["The question asks for the SALE price. How much comes off first?", f"Find {p}% of {R}.", "Then take that amount away from the regular price."],
      [f"Amount off: {fmt(F(p,100))} × {R} = {fmt(off)}", f"Sale price: {R} − {fmt(off)} = {fmt(sale)}", f"The sale price is {money(sale)}.", f"Check: you pay {100-p}% of the regular price."], unit="dollars", show=money(sale))

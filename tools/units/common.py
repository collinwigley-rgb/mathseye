"""Small helpers every unit module uses to write problems and variants (kept separate so a unit never imports another unit's files)."""
from fractions import Fraction as F
from decimal import Decimal as Dec

def D(s): return F(Dec(str(s)))
def fmt(v, as_frac=False):
    v = F(v)
    if v.denominator == 1: return str(v.numerator)
    if as_frac:
        w, r = divmod(v.numerator, v.denominator)
        return f"{w} {r}/{v.denominator}" if w else f"{v.numerator}/{v.denominator}"
    s = f"{float(v):.4f}".rstrip("0").rstrip(".")
    return s if abs(float(v) - round(float(v), 4)) < 1e-9 else f"{float(v):.2f}"
def money(v): return f"${float(v):.2f}"
def nonterm(v):
    d = F(v).limit_denominator(10**6).denominator
    while d % 2 == 0: d //= 2
    while d % 5 == 0: d //= 5
    return d != 1
def mix(v):
    v = F(v); w, r = divmod(v.numerator, v.denominator)
    if not r: return str(w)
    return f"{w} {r}/{v.denominator}" if w else f"{r}/{v.denominator}"
def numv(text, val, hints, steps, show=None, frac=False, unit="", **kw):
    """A typed-number problem or variant. The answer is computed from `val` (a Fraction), never typed by hand."""
    val = F(val); assert val > 0, text
    d = dict(kind="num", text=text, answer=float(val), show=show or (mix(val) if frac else fmt(val)) + (" " + unit if unit else ""), hints=hints, steps=steps,
             tol=0.006 if nonterm(val) else 1e-9, table=None, graph=None); d.update(kw); return d
def chv(text, options, correct, hints, steps, **kw):
    assert 0 <= correct < len(options)
    return dict(kind="choice", text=text, options=options, correct=correct, show=options[correct], hints=hints, steps=steps, table=None, graph=None, **kw)

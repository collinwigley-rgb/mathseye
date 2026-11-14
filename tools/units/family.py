"""The one place a new Study Guide problem FAMILY is registered (any unit from Unit 3 on).

A family = one generator `gen(rng) -> numv(...)/chv(...)` that makes a problem with fresh numbers every call. Registering it
  - gives it the next id (U<N>-NN; ids are append-only, never reused),
  - runs the generator once with a fixed `seed` for the base problem (its text and answer stay stable forever),
  - records its concept tags (the "builds on" chips), its independent re-solver (`solve`/`solve_choice`, used by test_unit_variants.py)
    and an optional "try this in your head" builder (`shortcut`).
Usage (in tools/units/unitN_more.py, scaffolded by tools/new_family.py):

    from units.family import family
    from units.common import numv, money, fmt, F
    @family(U, "3.3", concepts=["percent-of"], seed=41, solve=lambda t: ...)
    def g_discount(r): ...

Gates: tools/test_unit_variants.py N (answer re-solved from the text) and tools/check_families.py N (shape and variety). Report: tools/study_coverage.py N."""
import random, string

def family(U, sub, concepts, seed, solve=None, solve_choice=None, shortcut=None, typ=None):
    """Decorator. `U` is the unit module (units.unitN). Returns the generator unchanged."""
    def deco(gen):
        assert sub in U.SUBS, f"{sub} is not one of {U.SUBS}"
        for c in concepts: assert c in U.CONCEPTS, f"unknown concept {c!r}: add it to CONCEPTS first"
        assert (solve is None) != (solve_choice is None), f"{gen.__name__}: give exactly one of solve= (typed number) or solve_choice= (multiple choice)"
        t = typ or next(c for c in string.ascii_uppercase if (sub, c) not in U.BASE)     # the next free type letter in this lesson
        assert (sub, t) not in U.BASE, f"type {sub}{t} is already taken"
        pid = f"U{U.UNIT}-{len(U.PROBS) + 1:02d}"
        assert pid not in U.GENS
        U.BASE[(sub, t)] = list(concepts)
        v = gen(random.Random(seed)); U.PROBS.append(dict(sub=sub, type=t, **v)); U.PROBS[-1]["id"] = pid; U.GENS[pid] = gen
        if solve: U.SOLVE[pid] = solve
        if solve_choice: U.SOLVE_CHOICE[pid] = solve_choice
        if shortcut:
            from units import unit3_shortcuts as S      # Unit 3's builder table; a later unit passes its own module through U.SHORTCUT_BUILDERS
            getattr(U, "SHORTCUT_BUILDERS", S.BUILDERS)[pid] = shortcut
        gen.pid = pid; gen.sub = sub; gen.typ = t
        return gen
    return deco

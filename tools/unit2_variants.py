"""Fresh-number variants for each Unit 2 practice problem. Every variant keeps the original's skill and trap."""
import random
from fractions import Fraction as F
from unit2_problems import D, fmt, money

GENS = {}
def gen(pid):
    def deco(fn): GENS[pid] = fn; return fn
    return deco
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
    val = F(val); assert val > 0, text
    d = dict(kind="num", text=text, answer=float(val), show=show or (mix(val) if frac else fmt(val)) + (" " + unit if unit else ""), hints=hints, steps=steps,
             tol=0.006 if nonterm(val) else 1e-9, table=None, graph=None); d.update(kw); return d
def chv(text, options, correct, hints, steps, **kw):
    assert 0 <= correct < len(options)
    d = dict(kind="choice", text=text, options=options, correct=correct, show=options[correct], hints=hints, steps=steps, table=None, graph=None); d.update(kw); return d
def S(v): return fmt(v)
def tbl(xs, ys): return dict(x=[mix(v) if isinstance(v, F) and v.denominator != 1 else fmt(v) for v in xs], y=[mix(v) if isinstance(v, F) and v.denominator != 1 else fmt(v) for v in ys])

# ================================================================ 2.1
@gen("U2-01")
def _(r):
    n = r.choice([6,8,10,12,15,20,24]); p = D(r.choice(["0.25","0.35","0.45","0.55","0.65","0.75","0.85","1.25"])); T = n * p
    pl, sg = r.choice([("juice boxes","juice box"),("granola bars","granola bar"),("pencils","pencil"),("stickers","sticker"),("pens","pen")])
    return numv(f"A {n}-pack of {pl} costs {money(T)}. What is the cost of one {sg} (in dollars)?", p,
      [f"You want the cost for ONE {sg}. What do you divide by?","Get to ONE: divide the total cost by the number in the pack.",f"{fmt(T)} ÷ {n} = ?"],
      [f"'Per {sg}' means divide by {n}.", f"{fmt(T)} ÷ {n} = {fmt(p)}", f"One {sg} costs {money(p)}."], unit="dollars")
@gen("U2-02")
def _(r):
    u1 = D(r.choice(["0.21","0.24","0.27","0.30","0.33","0.36"])); u2 = u1 + r.choice([D("0.01"),D("-0.01"),D("0.02"),D("-0.02")])
    o1, o2 = r.sample([12,16,18,20,24,30,36], 2); a, b = r.choice([("Brand X","Brand Y"),("Store brand","Name brand"),("Pack A","Pack B")])
    c = 0 if u1 < u2 else 1
    return chv(f"{a}: {o1} oz for {money(u1*o1)}. {b}: {o2} oz for {money(u2*o2)}. Which costs less per ounce?", [a,b], c,
      ["Compare the cost of ONE ounce for each.","Divide each price by its ounces.",f"{fmt(u1*o1)} ÷ {o1} and {fmt(u2*o2)} ÷ {o2}. Which is smaller?"],
      [f"{a}: {fmt(u1*o1)} ÷ {o1} = {fmt(u1)} per ounce.", f"{b}: {fmt(u2*o2)} ÷ {o2} = {fmt(u2)} per ounce.", "The smaller price per ounce is the better deal."])
@gen("U2-03")
def _(r):
    rate = r.choice([8,12,14,15,16,18,20,25]); m = r.choice([3,4,5,6,8,10]); n = r.choice([12,15,20,25,30,40])
    while n == m: n = r.choice([12,15,20,25,30,40])
    th, un = r.choice([("prints","pages"),("makes","cards"),("packs","boxes"),("sews","patches")]); who = r.choice(["A printer","A machine","A factory robot"])
    return numv(f"{who} {th} {rate*m} {un} in {m} minutes. At that rate, how many {un} in {n} minutes?", rate*n,
      [f"First, how many {un} in ONE minute?",f"{rate*m} ÷ {m} gives {un} per minute.",f"Then multiply by {n} minutes."],
      [f"{rate*m} ÷ {m} = {rate} {un} per minute.", f"{rate} × {n} = {rate*n}"], unit=un)
@gen("U2-04")
def _(r):
    a, b = r.choice([(4,5),(2,3),(3,4),(3,5),(5,6),(2,5)]); k = r.randint(3,9); x, y = r.choice([("boys","girls"),("guitars","drums"),("red beads","blue beads"),("cats","dogs")])
    return numv(f"A group has {a} {x} for every {b} {y}. There are {b*k} {y}. How many {x}?", a*k,
      ["Make a ratio table: one row for each.",f"How do you get from {b} {y} to {b*k} {y}?",f"Do the same to the {a} {x}."],
      [f"{b} × {k} = {b*k}, so multiply the {x} by {k} too.", f"{a} × {k} = {a*k}"], unit=x)
@gen("U2-05")
def _(r):
    c = r.choice([2,3,4]); m = r.choice([12,24]); k = r.randint(2,5); price = D(r.choice(["0.25","0.40","0.50","0.60","0.80"])); cost = c*k*price
    return numv(f"A recipe uses {c} cups of flour for every {m} muffins. Flour costs {money(price)} per cup. What does the flour cost for {m*k} muffins (in dollars)?", cost,
      ["Two steps: cups of flour first, then cost.",f"{m*k} muffins is {k} times as many as {m}.",f"Cups × {money(price)}."],
      [f"{m*k} ÷ {m} = {k}, so {c} × {k} = {c*k} cups of flour.", f"{c*k} × {fmt(price)} = {fmt(cost)}", f"The flour costs {money(cost)}."], unit="dollars")
@gen("U2-06")
def _(r):
    z = r.choice([2,3,4,5]); p = D(r.choice(["0.50","0.75","1.25","1.50","2","2.50"])); T = 12*z*p
    nn, sg = r.choice([("Cookies","cookie"),("Pencils","pencil"),("Gloves","pair of gloves"),("Stickers","sticker")])
    return numv(f"{nn} are sold {z} dozen for {money(T)}. What does one {sg} cost (in dollars)?", p,
      [f"How many single {sg}s are in {z} dozen?",f"1 dozen is 12, so {z} dozen is {12*z}.",f"{fmt(T)} ÷ {12*z}"],
      [f"{z} dozen = {z} × 12 = {12*z}.", f"{fmt(T)} ÷ {12*z} = {fmt(p)}", f"One costs {money(p)}."], unit="dollars")
@gen("U2-07")
def _(r):
    while True:
        s1, s2 = r.randint(26,48), r.randint(26,48); m1, m2 = r.sample([4,5,6,8,10], 2)
        if s1 != s2: break
    n1, n2 = r.sample(["Ava","Ben","Maya","Leo","Zoe","Sam"], 2)
    return chv(f"{n1} types {s1*m1} words in {m1} minutes. {n2} types {s2*m2} words in {m2} minutes. Who types faster?", [n1,n2], 0 if s1 > s2 else 1,
      ["Faster means more words in ONE minute.","Divide words by minutes for each person.",f"{s1*m1} ÷ {m1} and {s2*m2} ÷ {m2}."],
      [f"{n1}: {s1*m1} ÷ {m1} = {s1} words per minute.", f"{n2}: {s2*m2} ÷ {m2} = {s2} words per minute.", "More words per minute is faster."])
# ================================================================ 2.2
Q22 = [(2,1),(3,1),(4,1),(1,2),(3,2),(5,2),(6,1),(1,3),(4,3),(5,1)]
DIV22 = [(1,2),(1,3),(2,3),(1,4),(3,4),(1,6),(5,6)]
def frac_pair(r, need_le_one=False):
    for _ in range(200):
        (c,d), (qn,qd) = r.choice(DIV22), r.choice(Q22); a = F(qn*c, qd*d)
        if 0 < a <= (1 if need_le_one else 3) and a.numerator <= 12 and a.denominator <= 12 and a != F(c,d): return (c,d), F(qn,qd), a
    return (1,2), F(3,2), F(3,4)
@gen("U2-08")
def _(r):
    (c,d), q, a = frac_pair(r, True); thing = r.choice([("bucket","A hose fills","buckets"),("tank","A pump fills","tanks"),("pool","A tap fills","pools")])
    amt = "a whole" if a == 1 else f"{mix(a)} of a"
    return numv(f"{thing[1]} {amt} {thing[0]} in {c}/{d} minute. How many {thing[2]} per minute?", q,
      ["Per minute: what has to be 1?",f"Divide: ({mix(a)}) ÷ ({c}/{d}).",f"Keep, change, flip: {mix(a)} × {d}/{c}."],
      [f"({mix(a)}) ÷ ({c}/{d}) = {mix(a)} × {d}/{c}", f"= {mix(q)}", f"That is {mix(q)} {thing[2]} per minute."], frac=True, unit=f"{thing[2]} per minute")
@gen("U2-09")
def _(r):
    s = r.randint(4,30); d = r.choice([6,8,10,12]); dist = F(s, d)
    return numv(f"A cyclist rides {mix(dist)} {'miles' if dist > 1 else 'mile'} in 1/{d} hour. What is the speed in miles per hour?", s,
      ["Miles per hour: hours go on the bottom.",f"({mix(dist)}) ÷ (1/{d})","Flip the 1/%d and cancel." % d],
      [f"({mix(dist)}) ÷ (1/{d}) = {mix(dist)} × {d}", f"= {s}", f"{s} miles per hour."], unit="mph")
@gen("U2-10")
def _(r):
    a, b = r.choice([(1,2),(2,3),(3,4),(1,3),(1,4)]); t = r.randint(15,50); cal = a*t; per = b*t; n = r.randint(2,4); food = r.choice(["cereal","granola","oatmeal","trail mix"])
    return numv(f"There are {cal} Calories in {a}/{b} cup of {food}. How many Calories are in {n} cups?", per*n,
      ["Find Calories in 1 cup first.",f"{cal} ÷ {a}/{b} = {cal} × {b}/{a}.",f"Then multiply by {n} cups."],
      [f"{cal} ÷ {a}/{b} = {cal} × {b}/{a} = {per} Calories per cup.", f"{per} × {n} = {per*n}"], unit="Calories")
@gen("U2-11")
def _(r):
    while True:
        s1, s2 = F(r.randint(8,20),2), F(r.randint(8,20),2); d1, d2 = r.sample([2,3,4,6], 2)
        if s1 != s2: break
    n1, n2 = r.sample(["Runner A","Runner B","Ana","Jo","Kim","Max"], 2); x1, x2 = s1/d1, s2/d2
    return chv(f"{n1} goes {mix(x1)} miles in 1/{d1} hour. {n2} goes {mix(x2)} miles in 1/{d2} hour. Who is faster?", [n1,n2], 0 if s1 > s2 else 1,
      ["Find miles per ONE hour for each.","Turn mixed numbers into fractions.",f"({mix(x1)}) ÷ (1/{d1}) and ({mix(x2)}) ÷ (1/{d2})."],
      [f"{n1}: {mix(x1)} × {d1} = {mix(s1)} mph.", f"{n2}: {mix(x2)} × {d2} = {mix(s2)} mph.", "Bigger speed wins."])
@gen("U2-12")
def _(r):
    P = r.choice([8,12,16,20,24]); a, b = r.choice([(1,2),(1,4),(3,4)]); x = r.choice([F(9,4),F(5,2),F(7,4),F(3,2),F(11,4)]); miles = P*F(a,b)
    return numv(f"On a map, {a}/{b} inch = {fmt(miles)} miles. How many real miles is {mix(x)} inches on the map?", P*x,
      ["Find miles for ONE inch first.",f"{fmt(miles)} ÷ {a}/{b} = {fmt(miles)} × {b}/{a}.",f"Then multiply by {mix(x)}."],
      [f"{fmt(miles)} ÷ {a}/{b} = {P} miles per inch.", f"{P} × {mix(x)} = {fmt(P*x)}"], unit="miles")
@gen("U2-13")
def _(r):
    a, b = r.choice([(2,3),(3,4),(1,2),(5,6),(3,5)]); n = r.choice([3,4,5,6,8]); q = F(a,b)/n; thing = r.choice(["parts","cookies","cards","beads"])
    return numv(f"A machine makes {n} {thing} in {a}/{b} hour. How many hours does ONE take? (Fraction or decimal.)", q,
      [f"Hours per one: {thing} go on the bottom.",f"({a}/{b}) ÷ {n}",f"Dividing by {n} is multiplying by 1/{n}."],
      [f"({a}/{b}) ÷ {n} = {a}/{b} × 1/{n}", f"= {mix(q)} hour."], show=f"{mix(q)} hour", frac=True)
# ================================================================ 2.3
def table_problem(r, force=None):
    k = D(r.choice(["3.5","2.5","4","6","1.5","0.75","5.5","2.4","7"])); xs = [F(v) for v in r.choice([[2,4,6,8],[3,6,9,12],[5,10,15,20],[1,2,3,4],[4,8,12,16]])]
    ys = [k*x for x in xs]; yes = (r.random() < .5) if force is None else force
    if not yes: i = r.choice([1,2,3]); ys[i] += r.choice([1,2,-1]) * (D("0.5") if k < 2 else 1)
    steps = [f"{fmt(y)}/{fmt(x)} = {fmt(y/x)}" for x, y in zip(xs, ys)]
    return k, xs, ys, yes, steps
@gen("U2-14")
def _(r):
    k, xs, ys, yes, steps = table_problem(r)
    return chv("Is the relationship between x and y proportional?", ["Yes","No"], 0 if yes else 1,
      ["Divide y ÷ x in EVERY column, including the last.","Work out y ÷ x for each column.","Are they all the same?"],
      [", ".join(steps) + ".", "Every column matches, so it IS proportional." if yes else "One column breaks the pattern, so it is NOT proportional."], table=tbl(xs, ys))
@gen("U2-15")
def _(r):
    k, xs, ys, yes, steps = table_problem(r, force=False)
    return chv("Is the relationship between x and y proportional?", ["Yes","No"], 1,
      ["Divide y ÷ x in EVERY column, including the last.","Work out y ÷ x for each column.","Do they all match?"],
      [", ".join(steps) + ".", "One column breaks the pattern, so it is NOT proportional."], table=tbl(xs, ys))
@gen("U2-16")
def _(r):
    k = D(r.choice(["2.4","1.5","3.2","0.8","4.5","2.5","6.5"])); xs = r.choice([[2,4,6],[5,10,15],[3,6,9]]); x2 = r.choice([7,8,9,11,12]); xs = [F(v) for v in xs]
    return numv("This table is proportional. What is y when x = %d?" % x2, k*x2,
      ["First find y ÷ x.",f"{fmt(k*xs[0])} ÷ {fmt(xs[0])} = {fmt(k)}","Multiply %d by that." % x2],
      [f"Every column gives {fmt(k)}, so k = {fmt(k)}.", f"y = {fmt(k)} × {x2} = {fmt(k*x2)}"], table=tbl(xs, [k*x for x in xs]))
@gen("U2-17")
def _(r):
    rate = r.choice([2,3,4,5]); fee = r.choice([2,3,4,5,6]); no_fee = r.random() < .3; where = r.choice(["game center","skate park","trampoline park"])
    if no_fee:
        costs = [rate*i for i in (1,2,3)]; txt = f"A {where} charges ${rate} per game and nothing else. The cost for 1, 2, 3 games is ${costs[0]}, ${costs[1]}, ${costs[2]}. Is the cost proportional to the number of games?"
        return chv(txt, ["Yes","No"], 0, ["Divide cost ÷ games for each.","What would 0 games cost?",f"{costs[0]} ÷ 1, {costs[1]} ÷ 2, {costs[2]} ÷ 3"],
          [f"Every ratio is {rate}, and 0 games costs $0.", "So it IS proportional."])
    costs = [fee + rate*i for i in (1,2,3)]; txt = f"A {where} charges ${fee} to get in plus ${rate} per game. The cost for 1, 2, 3 games is ${costs[0]}, ${costs[1]}, ${costs[2]}. Is the cost proportional to the number of games?"
    return chv(txt, ["Yes","No"], 1, ["Divide cost ÷ games for each.","What would 0 games cost?",f"{costs[0]} ÷ 1, {costs[1]} ÷ 2, {costs[2]} ÷ 3"],
      [f"{costs[0]}/1 = {costs[0]}, {costs[1]}/2 = {fmt(F(costs[1],2))}, {costs[2]}/3 ≈ {float(F(costs[2],3)):.2f}. Not equal.", f"There is a ${fee} starting fee, so it is NOT proportional."])
@gen("U2-18")
def _(r):
    k = r.choice([2,3,4,5,6]); xs = r.choice([[F(1,2),F(2),F(3)],[F(1,4),F(1),F(2)],[F(1,3),F(3),F(6)],[F(1,2),F(4),F(6)]]); x2 = r.choice([5,7,8,9])
    return numv("This table is proportional. What is y when x = %d?" % x2, k*x2,
      ["Find y ÷ x using one column.",f"{fmt(k*xs[0]) if xs[0].denominator==1 else mix(k*xs[0])} ÷ ({mix(xs[0])}) = {k}","Multiply %d by that." % x2],
      [f"Every column gives {k}, so k = {k}.", f"y = {k} × {x2} = {k*x2}"], table=tbl(xs, [k*x for x in xs]))
@gen("U2-19")
def _(r):
    a = r.choice([2,3,4,5]); d = r.choice([1,2]); good = f"x: 1, 2, 3 and y: {a}, {2*a}, {3*a}"; bad = f"x: 1, 2, 3 and y: {a}, {a+d+1}, {a+2*d+2}"
    opts = [good, bad]; r.shuffle(opts)
    return chv("Which table is proportional?", opts, opts.index(good),
      ["Check y ÷ x for each table.","The proportional table gives the same number every time.",f"{a}, {2*a}, {3*a} divided by 1, 2, 3."],
      [f"Table with {a}, {2*a}, {3*a}: {a}/1 = {2*a}/2 = {3*a}/3 = {a}. Always the same.", f"The other: {a}/1 = {a}, {a+d+1}/2 = {fmt(F(a+d+1,2))}, {a+2*d+2}/3 ≈ {float(F(a+2*d+2,3)):.2f}. Not the same."])
# ================================================================ 2.4
@gen("U2-20")
def _(r):
    who, unit, unit2, pace, ks = r.choice([("A hiker walks","miles","hours","mph",["2.5","3","3.5","4"]),("A cyclist rides","miles","hours","mph",["8","10","12","12.5"]),("A tap runs","gallons","minutes","gallons per minute",["1.5","2.5","4","4.5"])])
    k = D(r.choice(ks)); h = r.choice([2,4,6,8,10])
    return numv(f"{who} {fmt(k*h)} {unit} in {h} {unit2} at a steady pace. What is the constant of proportionality k ({unit} per {unit2[:-1]})?", k,
      ["k is y over x. What is y here, and what is x?",f"y = {unit}, x = {unit2}.",f"{fmt(k*h)} ÷ {h}"], [f"k = y ÷ x = {fmt(k*h)} ÷ {h}", f"k = {fmt(k)} {unit} per {unit2[:-1]}."], unit=pace)
@gen("U2-21")
def _(r):
    k = D(r.choice(["6.5","4.5","7.5","3.5","2.5","8.5"])); x = r.choice([12,14,16,18,15])
    return numv(f"y = {fmt(k)}x. What is y when x = {x}?", k*x, ["Replace x with %d." % x, f"y = {fmt(k)} × {x}", f"Break apart: {fmt(k)} × 10 + {fmt(k)} × {x-10}."],
      [f"y = {fmt(k)}({x})", f"{fmt(k*10)} + {fmt(k*(x-10))} = {fmt(k*x)}"])
@gen("U2-22")
def _(r):
    k = D(r.choice(["0.4","0.5","0.25","0.2","1.5","2.5"])); x = r.choice([20,24,30,40,45,50,60]); y = k*x
    return numv(f"y = {fmt(k)}x. What is x when y = {fmt(y)}?", x, ["You know y. What undoes 'times %s'?" % fmt(k), f"Divide both sides by {fmt(k)}.", f"{fmt(y)} ÷ {fmt(k)}"],
      [f"{fmt(y)} = {fmt(k)}x", f"x = {fmt(y)} ÷ {fmt(k)}", f"x = {x}"])
@gen("U2-23")
def _(r):
    n = r.choice([4,5,6,8,10]); p = D(r.choice(["3.5","4.5","6.5","7.25","2.5","8"])); T = n*p; thing = r.choice(["tickets","bracelets","notebooks","slices"])
    return numv(f"For every {n} {thing}, the cost goes up {money(T)}. What is the cost of ONE (that's k)?", p,
      [f"Is {money(T)} the price of one?",f"Get to ONE: divide by {n}.",f"{fmt(T)} ÷ {n}"], [f"k = y ÷ x = {fmt(T)} ÷ {n}", f"k = {fmt(p)}, so one costs {money(p)}."], unit="dollars")
@gen("U2-24")
def _(r):
    p = D(r.choice(["4.5","6.5","7.5","8.25","9","5.5"])); m = r.choice([6,8,12,15]); thing = r.choice(["Tickets","Books","Shirts","Tacos"])
    return numv(f"{thing} cost {money(p)} each. The equation is y = {fmt(p)}x. What do {m} cost (in dollars)?", p*m,
      [f"Use y = kx with x = {m}.",f"{fmt(p)} × {m}","Break it apart if that helps."], [f"y = {fmt(p)}({m})", f"= {fmt(p*m)}", f"{m} cost {money(p*m)}."], unit="dollars")
@gen("U2-25")
def _(r):
    k = r.choice(["0.4","3","0.5","2.5","1.2","6"]); right = f"y = {k}x"; opts = [f"y = {k}x + 1", f"y = x + {k}", right, f"y = {k}/x"]; r.shuffle(opts)
    return chv("Which equation shows a proportional relationship?", opts, opts.index(right),
      ["A proportional equation is exactly y = (number) × x.","Look for a plus or minus, or x on the bottom.","Which one has nothing added?"],
      [f"y = {k}x + 1 and y = x + {k} add a number, so no.", f"y = {k}/x has x on the bottom, so no.", f"y = {k}x is y = kx with k = {k}."])
@gen("U2-26")
def _(r):
    rate = r.choice([20,30,12,15,24]); t1 = D(r.choice(["1.5","2.5","3.5","4.5"])); T = r.choice([6,8,10,12]); thing = r.choice(["A pool","A tub","A tank"])
    return numv(f"{thing} fills {fmt(rate*t1)} gallons in {fmt(t1)} minutes at a steady rate. How many gallons in {T} minutes?", rate*T,
      ["Find gallons per ONE minute first.",f"{fmt(rate*t1)} ÷ {fmt(t1)} = {rate}",f"Then multiply by {T}."], [f"k = {fmt(rate*t1)} ÷ {fmt(t1)} = {rate} gallons per minute", f"y = {rate} × {T} = {rate*T}"], unit="gallons")
# ================================================================ 2.5
def G(lines, dots, xmax=5, ymax=12): return dict(lines=lines, xmax=xmax, ymax=ymax, xl="x", yl="y", dots=dots)
@gen("U2-27")
def _(r):
    y = r.choice([4,6,8,10,12])
    return chv("Is this graph a proportional relationship?", ["Yes","No"], 0, ["Two tests: is it straight? Does it go through (0, 0)?","Look at where the line starts.","It starts at the origin and it's straight."],
      ["The line is straight.", "It passes through (0, 0).", "Both tests pass, so it is proportional."], graph=G([dict(pts=[[0,0],[4,y]], label="")], [[4,y]]))
@gen("U2-28")
def _(r):
    k = r.choice([1,1.5,2,2.5,3]); y = 4*k
    return numv("Use the graph. What is the constant of proportionality k?", F(str(k)), ["k = y ÷ x for any point except (0, 0).", f"The point (4, {fmt(F(str(y)))}) is on the line.", f"{fmt(F(str(y)))} ÷ 4"],
      [f"k = y ÷ x = {fmt(F(str(y)))} ÷ 4", f"k = {k}, so the point (1, {k}) is also on the line."], graph=G([dict(pts=[[0,0],[4,y]], label="")], [[4,y]]))
@gen("U2-29")
def _(r):
    b = r.choice([2,3,4]); y = r.choice([b+6, b+8, b+5])
    return chv("Is this graph a proportional relationship?", ["Yes","No"], 1, ["Check both tests: straight? through (0, 0)?","Where does the line cross the y-axis?",f"It starts at {b}, not 0."],
      ["The line is straight, but it starts at (0, %d)." % b, "It does not pass through the origin, so it is NOT proportional."], graph=G([dict(pts=[[0,b],[4,y]], label="")], [[0,b],[4,y]]))
@gen("U2-30")
def _(r):
    kind = r.choice(["sq","sq","cube"]); c = r.choice([0.25, 0.5, 0.75]) if kind == "sq" else r.choice([0.1, 0.15, 0.18])
    pts = [[i/4, c*(i/4)**(2 if kind == "sq" else 3)] for i in range(0,17)]
    return chv("Is this graph a proportional relationship?", ["Yes","No"], 1, ["Check both tests.","It does pass through (0, 0). Is it straight?","It bends upward."],
      ["It passes through (0, 0), but it is a curve, not a straight line.", "Both tests must pass. So it is NOT proportional."], graph=G([dict(pts=pts, label="")], []))
@gen("U2-31")
def _(r):
    n = r.choice([4,5,6,8]); k = r.choice([3,4,6,7,9])
    return numv(f"A proportional graph is a straight line through (0, 0) and ({n}, {n*k}). What is y when x = 1?", k, ["The point (1, k) shows the constant of proportionality.", f"k = y ÷ x using ({n}, {n*k}).", f"{n*k} ÷ {n}"],
      [f"k = {n*k} ÷ {n} = {k}", f"So the point is (1, {k}), and y = {k} when x = 1."])
@gen("U2-32")
def _(r):
    ka, kb = r.choice([(1.5,2.5),(2,3),(1,2.5),(3,2),(2.5,1.5),(2,1),(3,1.5)]); L = ["Line A","Line B"]; ya, yb = 4*ka, 4*kb
    return chv("Two proportional graphs, Line A and Line B, both start at (0, 0). Which line has the bigger constant of proportionality k?", L, 0 if ka > kb else 1,
      ["Find k for each: y ÷ x at the end point.", f"A ends at (4, {ya:g}) and B ends at (4, {yb:g}).", f"{ya:g} ÷ 4 and {yb:g} ÷ 4."],
      [f"A: k = {ya:g} ÷ 4 = {ka:g}.", f"B: k = {yb:g} ÷ 4 = {kb:g}.", "The steeper line has the bigger k."], graph=G([dict(pts=[[0,0],[4,ya]], label="A"), dict(pts=[[0,0],[4,yb]], label="B")], [[4,ya],[4,yb]]))
# ================================================================ 2.6
@gen("U2-33")
def _(r):
    n1, n2 = r.sample(["Mia","Eli","Nora","Sam","Ivy","Leo"], 2); a = r.randint(3,8); g = r.choice([4,5,6,8]); a3 = a + r.randint(3,6)
    return numv(f"{n1} is {a} years old when {n2} is {a+g}. How old will {n2} be when {n1} is {a3}?", a3+g,
      ["Times or plus? Will they ever be the same age gap apart?","Their ages keep a constant DIFFERENCE.",f"{n2} is always {g} years older."],
      [f"{n1}'s age + {g} = {n2}'s age (a plus, not a times).", f"{a3} + {g} = {a3+g}", "This is NOT a proportional problem."], unit="years old")
@gen("U2-34")
def _(r):
    p = r.choice([2,3,4,5,6]); k = r.choice([2,3]); h = k*r.choice([2,3,4]) ; job = r.choice(["paint a fence","clean a gym","stack chairs","weed a garden"])
    return numv(f"{p} people {job} in {h} hours. How many hours would {p*k} people take, working at the same rate?", F(h, k),
      ["More people: more time, or less time?", f"Total work stays the same: {p} × {h} = {p*h} person-hours.", f"{p*h} ÷ {p*k}"],
      ["More helpers means LESS time, so this is not a simple ratio.", f"{p} × {h} = {p*h} person-hours of work.", f"{p*h} ÷ {p*k} = {h//k} hours."], unit="hours")
@gen("U2-35")
def _(r):
    a, b = r.choice([(2,3),(3,4),(1,2),(3,5),(2,5),(4,5)]); k = r.randint(3,8); x, y = r.choice([("cups of berries","cups of yogurt"),("cups of juice","cups of water"),("scoops of blue paint","scoops of white paint")])
    return numv(f"A mix uses {a} {x} for every {b} {y}. You use {b*k} {y}. How many {x}?", a*k,
      ["Times or plus? Doubling the recipe doubles both.", f"How many groups of {b} are in {b*k}?", f"{b*k} ÷ {b} = {k} groups."],
      [f"{b*k} ÷ {b} = {k} batches.", f"{a} × {k} = {a*k}", f"Check: {a*k} : {b*k} simplifies to {a} : {b}."], unit=x)
@gen("U2-36")
def _(r):
    a, b = r.choice([(4,7),(3,5),(2,3),(5,8),(3,4),(2,5)]); k = r.randint(3,6); t = r.randint(1,4)
    return numv(f"Trail mix should have {a} cups of nuts for every {b} cups of raisins. A bag has {a*k-t} cups of nuts and {b*k} cups of raisins. How many MORE cups of nuts does it need?", t,
      ["Match the ratio to the amount of raisins.", f"{b*k} ÷ {b} = {k} groups of raisins.", f"{k} groups need {k} × {a} nuts."],
      [f"{b*k} ÷ {b} = {k} groups, so the mix needs {k} × {a} = {a*k} cups of nuts.", f"It has {a*k-t}, so it needs {a*k} − {a*k-t} = {t} more."], unit="cups")
@gen("U2-37")
def _(r):
    u = D(r.choice(["0.10","0.15","0.20","0.25","0.30"])); I = r.choice([20,24,30,40,45]); y = r.choice([2,3,4]); thing = r.choice(["ribbon","rope","fabric"])
    return numv(f"{I} inches of {thing} cost {money(I*u)}. How much do {y} yards cost (in dollars)? (1 yard = 36 inches)", u*36*y,
      ["Make the units match first.", f"{y} yards = {y} × 36 inches.", f"Cost per inch: {fmt(I*u)} ÷ {I}."],
      [f"{y} yards = {36*y} inches.", f"{fmt(I*u)} ÷ {I} = {fmt(u)} per inch.", f"{fmt(u)} × {36*y} = {fmt(u*36*y)}"], unit="dollars")
@gen("U2-38")
def _(r):
    fee = r.choice([3,4,5,6]); rate = r.choice([1,2,3]); no_fee = r.random() < .3; thing = r.choice([("taxi","mile"),("scooter rental","hour"),("kayak rental","hour")])
    if no_fee:
        return chv(f"A {thing[0]} costs ${rate} per {thing[1]} and nothing else. Is the cost proportional to the number of {thing[1]}s?", ["Yes","No"], 0,
          [f"What does 0 {thing[1]}s cost?","Is there a starting fee?","Check cost ÷ amount."], [f"1 {thing[1]}: ${rate}, 2: ${2*rate}. Both ratios are {rate}.", "No starting fee, so it IS proportional."])
    return chv(f"A {thing[0]} charges ${fee} plus ${rate} per {thing[1]}. Is the cost proportional to the number of {thing[1]}s?", ["Yes","No"], 1,
      [f"What does a 0-{thing[1]} ride cost?","Is there a starting fee?",f"Check cost ÷ {thing[1]}s for 1 and 2."],
      [f"1 {thing[1]}: ${fee+rate}, 2 {thing[1]}s: ${fee+2*rate}. {fee+rate} ÷ 1 ≠ {fee+2*rate} ÷ 2.", f"There is a ${fee} starting fee, so it is NOT proportional."])
# ================================================================ 2.8
@gen("U2-39")
def _(r):
    s = r.choice([2,3,4,5,6,8,10]); d = D(r.choice(["4.5","6","7.5","8","9.5","12"])); thing = r.choice(["wall","fence","room","bridge"])
    return numv(f"Scale: 1 in. = {s} ft. A {thing} measures {fmt(d)} in. on the drawing. How many feet long is the real {thing}?", s*d,
      ["Does the real one come out bigger or smaller than the drawing?", f"Each inch stands for {s} feet.", f"{fmt(d)} × {s}"], ["actual = scale × drawing", f"{s} × {fmt(d)} = {fmt(s*d)}"], unit="ft")
@gen("U2-40")
def _(r):
    a, b = r.choice([(2,9),(2,5),(3,12),(4,10),(2,7)]); d = r.choice([3,5,6,7]); thing = r.choice(["room","hallway","stage","garden"])
    return numv(f"Scale: {a} in. = {b} ft. A {thing} is {d} in. long on the drawing. How many feet long is the real {thing}?", F(b,a)*d,
      ["First make the scale 'ONE inch = ? ft'.", f"{b} ÷ {a} = {fmt(F(b,a))} ft per inch.", f"Then multiply by {d}."],
      [f"1 in. = {b} ÷ {a} = {fmt(F(b,a))} ft.", f"{fmt(F(b,a))} × {d} = {fmt(F(b,a)*d)}"], unit="ft")
@gen("U2-41")
def _(r):
    w, l = r.sample([2,3,4,5,6], 2); s = r.choice([3,4,5,6,8])
    return numv(f"A drawing of a rectangle is {w} in. by {l} in. Scale: 1 in. = {s} ft. What is the REAL area in square feet?", (w*s)*(l*s),
      [f"Do not multiply the drawing's area by {s}.", "Find the real length and the real width first.", "Then multiply them."],
      [f"Real width: {w} × {s} = {w*s} ft. Real length: {l} × {s} = {l*s} ft.", f"Area = {w*s} × {l*s} = {w*s*l*s} square feet."], unit="sq ft")
@gen("U2-42")
def _(r):
    s = D(r.choice(["2.5","3.5","4.5","6","7.5"])); d = r.choice([6,8,10,12]); thing = r.choice(["boat","bus","bridge","tree"])
    return numv(f"A real {fmt(s*d)}-ft {thing} is {d} in. long in a scale drawing. 1 in. = how many feet?", s,
      ["Scale means real size ÷ drawing size.", "You want feet for ONE inch.", f"{fmt(s*d)} ÷ {d}"], [f"{fmt(s*d)} ft ÷ {d} in. = {fmt(s)} ft per inch", f"Scale: 1 in. = {fmt(s)} ft."], unit="ft per inch")
@gen("U2-43")
def _(r):
    for _ in range(100):
        L1, s1, L2 = r.choice([4,6,8,5]), r.choice([3,4,5,6]), r.choice([8,10,12,15,16,20]); real = L1*s1
        if not nonterm(F(real, L2)) and F(real, L2) != s1 and L2 != L1: break
    return numv(f"A logo drawing is {L1} in. long at a scale of 1 in. = {s1} ft. You redraw it {L2} in. long. What is the new scale (feet per inch)?", F(real, L2),
      ["Find the REAL length first.", f"{L1} × {s1} = {real} ft.", "Real length ÷ new drawing length."], [f"Real length: {L1} × {s1} = {real} ft.", f"New scale: {real} ft ÷ {L2} in. = {fmt(F(real, L2))} ft per inch."], unit="ft per inch")
@gen("U2-44")
def _(r):
    s = r.choice([10,15,20,25,40,50]); x = r.choice([F(5,2),F(7,2),F(9,2),F(9,4),F(15,4),F(11,2),F(13,2)])
    return numv(f"Map scale: 1 in. = {s} miles. Two towns are {mix(x)} in. apart on the map. How many real miles apart are they?", s*x,
      [f"Each inch stands for {s} miles.", f"{mix(x)} = {fmt(x)}", f"{s} × {fmt(x)}"], [f"{s} × {fmt(x)} = {fmt(s*x)} miles."], unit="miles")

def variants(pid, n=10):
    rng = random.Random(int(pid.split("-")[1]) * 7919); seen = set(); out = []; tries = 0
    while len(out) < n and tries < 400:
        tries += 1; v = GENS[pid](rng)
        key = (v["text"], str(v.get("table")), str(v.get("graph")), str(v.get("options")), v["show"])
        if key in seen: continue
        seen.add(key); out.append(v)
    return out
if __name__ == "__main__":
    for pid in sorted(GENS):
        vs = variants(pid, 3); print(pid, len(variants(pid)), "|", vs[0]["text"][:100], "=>", vs[0]["show"])

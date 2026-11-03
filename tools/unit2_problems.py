"""Original Unit 2 practice problems. Answers are COMPUTED here (Fractions), never typed by hand."""
from fractions import Fraction as F
from decimal import Decimal as Dec
import json

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

PROBS = []
def num(sub, typ, text, val, hints, steps, show=None, frac=False, unit="", **kw):
    PROBS.append(dict(sub=sub, type=typ, kind="num", text=text, answer=float(F(val)), show=show or (fmt(val, frac) + (" " + unit if unit else "")),
                      hints=hints, steps=steps, **kw))
def choice(sub, typ, text, options, correct, hints, steps, **kw):
    PROBS.append(dict(sub=sub, type=typ, kind="choice", text=text, options=options, correct=correct, show=options[correct], hints=hints, steps=steps, **kw))

# ---------------------------------------------------------------- 2.1
a = D("4.68") / 12
num("2.1","A","A 12-pack of juice boxes costs $4.68. What is the cost of one juice box (in dollars)?", a,
    ["You want the cost for ONE box. What do you divide by?","Get to ONE: divide the total cost by the number of boxes.","4.68 ÷ 12 = ?"],
    ["'Per box' means divide by the 12 boxes.", f"4.68 ÷ 12 = {fmt(a)}", f"One juice box costs {money(a)}."], unit="dollars")
x, y = D("5.04")/18, D("8.10")/30
choice("2.1","B","Brand X: 18 oz for $5.04. Brand Y: 30 oz for $8.10. Which costs less per ounce?", ["Brand X","Brand Y"], 1 if y < x else 0,
    ["Compare the cost of ONE ounce for each brand.","Divide each price by its ounces.","5.04 ÷ 18 and 8.10 ÷ 30. Which is smaller?"],
    [f"Brand X: 5.04 ÷ 18 = {fmt(x)} per ounce.", f"Brand Y: 8.10 ÷ 30 = {fmt(y)} per ounce.", "The smaller price per ounce is the better deal."])
p = F(84,6)*25
num("2.1","C","A printer prints 84 pages in 6 minutes. At that rate, how many pages in 25 minutes?", p,
    ["First, how many pages in ONE minute?","84 ÷ 6 gives pages per minute.","Then multiply by 25 minutes."],
    ["84 ÷ 6 = 14 pages per minute.", f"14 × 25 = {fmt(p)}"], unit="pages")
b = F(4,5)*0 + F(35*4,5)
num("2.1","D","A class has 4 boys for every 5 girls. There are 35 girls. How many boys?", b,
    ["Make a ratio table: boys on one row, girls on the other.","How do you get from 5 girls to 35 girls?","Do the same to the 4 boys."],
    ["5 × 7 = 35, so multiply the boys by 7 too.", f"4 × 7 = {fmt(b)}"], unit="boys")
c = F(3,12)*60 * D("0.40")
num("2.1","E","A recipe uses 3 cups of flour for every 12 muffins. Flour costs $0.40 per cup. What does the flour cost for 60 muffins (in dollars)?", c,
    ["Two steps: cups of flour first, then cost.","60 muffins is 5 times as many as 12 muffins.","Cups × $0.40."],
    ["60 ÷ 12 = 5, so 3 × 5 = 15 cups of flour.", f"15 × 0.40 = {fmt(c)}", f"The flour costs {money(c)}."], unit="dollars")
g = F(54) / (3*12)
num("2.1","F","Gloves are sold 3 dozen for $54. What does one pair cost (in dollars)?", g,
    ["How many single pairs are in 3 dozen?","1 dozen is 12, so 3 dozen is 36.","54 ÷ 36"],
    ["3 dozen = 3 × 12 = 36 pairs.", f"54 ÷ 36 = {fmt(g)}", f"One pair costs {money(g)}."], unit="dollars")
av, bn = F(195,5), F(224,7)
choice("2.1","B","Ava types 195 words in 5 minutes. Ben types 224 words in 7 minutes. Who types faster?", ["Ava","Ben"], 0 if av > bn else 1,
    ["Faster means more words in ONE minute.","Divide words by minutes for each person.","195 ÷ 5 and 224 ÷ 7."],
    [f"Ava: 195 ÷ 5 = {fmt(av)} words per minute.", f"Ben: 224 ÷ 7 = {fmt(bn)} words per minute.", "More words per minute is faster."])
# ---------------------------------------------------------------- 2.2
q = F(3,4)/F(1,2)
num("2.2","A","A hose fills 3/4 of a bucket in 1/2 minute. How many buckets per minute?", q,
    ["Per minute: what has to be 1?","Divide: (3/4) ÷ (1/2).","Keep, change, flip: 3/4 × 2/1."],
    ["(3/4) ÷ (1/2) = 3/4 × 2/1", "= 6/4 = 3/2", "That is 1 1/2 buckets per minute."], frac=True, unit="buckets per minute")
q = F(5,6)/F(1,12)
num("2.2","A","A cyclist rides 5/6 mile in 1/12 hour. What is the speed in miles per hour?", q,
    ["Miles per hour: hours go on the bottom.","(5/6) ÷ (1/12)","Flip the 1/12 and cancel."],
    ["(5/6) ÷ (1/12) = 5/6 × 12/1", "Cancel 6 and 12: 5 × 2 = 10", "10 miles per hour."], unit="mph")
q = F(120)/F(2,3)*2
num("2.2","B","There are 120 Calories in 2/3 cup of cereal. How many Calories are in 2 cups?", q,
    ["Find Calories in 1 cup first.","120 ÷ (2/3) = 120 × 3/2.","Then multiply by 2 cups."],
    ["120 ÷ 2/3 = 120 × 3/2 = 180 Calories per cup.", f"180 × 2 = {fmt(q)}"], unit="Calories")
ra, rb = F(3,2)/F(1,4), F(9,4)/F(1,3)
choice("2.2","C","Runner A goes 1 1/2 miles in 1/4 hour. Runner B goes 2 1/4 miles in 1/3 hour. Who is faster?", ["Runner A","Runner B"], 0 if ra > rb else 1,
    ["Find miles per ONE hour for each runner.","Turn mixed numbers into fractions: 3/2 and 9/4.","(3/2) ÷ (1/4) and (9/4) ÷ (1/3)."],
    [f"A: (3/2) ÷ (1/4) = 3/2 × 4 = {fmt(ra)} mph.", f"B: (9/4) ÷ (1/3) = 9/4 × 3 = 27/4 = {fmt(rb)} mph.", "Bigger speed wins."])
q = F(6)/F(3,8)*F(9,4)
num("2.2","D","On a map, 3/8 inch = 6 miles. How many real miles is 2 1/4 inches on the map?", q,
    ["Find miles for ONE inch first.","6 ÷ 3/8 = 6 × 8/3.","Then multiply by 2 1/4 (that's 9/4)."],
    ["6 ÷ 3/8 = 6 × 8/3 = 16 miles per inch.", f"16 × 9/4 = {fmt(q)}"], unit="miles")
q = F(2,3)/5
num("2.2","E","A machine makes 5 parts in 2/3 hour. How many hours does ONE part take? (Fraction or decimal.)", q,
    ["Hours per part: parts go on the bottom.","(2/3) ÷ 5","Dividing by 5 is multiplying by 1/5."],
    ["(2/3) ÷ 5 = 2/3 × 1/5", "= 2/15 of an hour (about 0.13 hour, or 8 minutes)."], show="2/15 hour", frac=True)
# ---------------------------------------------------------------- 2.3
def tbl(xs, ys): return dict(x=[str(v) for v in xs], y=[str(v) for v in ys])
choice("2.3","A","Is the relationship between x and y proportional?", ["Yes","No"], 0,
    ["Divide y ÷ x in EVERY column.","7 ÷ 2, 14 ÷ 4, 21 ÷ 6, 28 ÷ 8.","Are they all the same?"],
    ["7/2 = 3.5, 14/4 = 3.5, 21/6 = 3.5, 28/8 = 3.5.", "Every row gives 3.5, so it is proportional (k = 3.5)."], table=tbl([2,4,6,8],[7,14,21,28]))
choice("2.3","A","Is the relationship between x and y proportional?", ["Yes","No"], 1,
    ["Divide y ÷ x in EVERY column, including the last.","5 ÷ 3, 10 ÷ 6, 15 ÷ 9, 21 ÷ 12.","Do they all match?"],
    ["5/3 ≈ 1.67, 10/6 ≈ 1.67, 15/9 ≈ 1.67, but 21/12 = 1.75.", "The last column breaks the pattern, so it is NOT proportional."], table=tbl([3,6,9,12],[5,10,15,21]))
q = F(12,5)*8
num("2.3","C","This table is proportional. What is y when x = 8?", q,
    ["First find y ÷ x.","12 ÷ 5 = 2.4","Multiply 8 by that."],
    ["12 ÷ 5 = 2.4, and 24/10 = 2.4, 36/15 = 2.4, so k = 2.4.", f"y = 2.4 × 8 = {fmt(q)}"], table=tbl([5,10,15],[12,24,36]))
choice("2.3","A","A game center charges $4 to get in plus $3 per game. The cost for 1, 2, 3 games is $7, $10, $13. Is the cost proportional to the number of games?", ["Yes","No"], 1,
    ["Divide cost ÷ games for each.","What would 0 games cost?","7 ÷ 1, 10 ÷ 2, 13 ÷ 3"],
    ["7/1 = 7, 10/2 = 5, 13/3 ≈ 4.33. The ratios are not equal.", "Also, 0 games still costs $4. A starting fee means NOT proportional."])
q = F(2)*5
num("2.3","C","This table is proportional. What is y when x = 5?", q,
    ["Find y ÷ x using a column.","1 ÷ (1/2) = 2","Multiply 5 by that."],
    ["(1) ÷ (1/2) = 2; 4 ÷ 2 = 2; 6 ÷ 3 = 2, so k = 2.", f"y = 2 × 5 = {fmt(q)}"], table=dict(x=["1/2","2","3"], y=["1","4","6"]))
choice("2.3","F","Which table is proportional?", ["x: 1, 2, 3 and y: 3, 6, 9","x: 1, 2, 3 and y: 3, 5, 7"], 0,
    ["Check y ÷ x for each table.","First table: 3, 3, 3. Second table?","The second one has 3, 2.5, 2.33."],
    ["First table: 3/1 = 6/2 = 9/3 = 3, always the same.", "Second table: 3/1 = 3, 5/2 = 2.5, 7/3 ≈ 2.33. Not the same."])
# ---------------------------------------------------------------- 2.4
q = F(14,4)
num("2.4","A","A hiker walks 14 miles in 4 hours at a steady pace. What is the constant of proportionality k (miles per hour)?", q,
    ["k is y over x. What is y here, and what is x?","y = miles, x = hours.","14 ÷ 4"], ["k = y ÷ x = 14 ÷ 4", f"k = {fmt(q)} miles per hour."], unit="mph")
q = D("6.5")*14
num("2.4","C","y = 6.5x. What is y when x = 14?", q, ["Replace x with 14.","y = 6.5 × 14","Break apart: 6.5 × 10 + 6.5 × 4."], ["y = 6.5(14)", f"6.5 × 14 = 65 + 26 = {fmt(q)}"])
q = F(18)/D("0.4")
num("2.4","C","y = 0.4x. What is x when y = 18?", q, ["You know y. What undoes 'times 0.4'?","Divide both sides by 0.4.","18 ÷ 0.4 = 180 ÷ 4"], ["18 = 0.4x", "x = 18 ÷ 0.4 = 180 ÷ 4", f"x = {fmt(q)}"])
q = D("32.5")/5
num("2.4","B","For every 5 tickets, the cost goes up $32.50. What is the cost of ONE ticket (that's k)?", q,
    ["Is $32.50 the price of one ticket?","Get to ONE: divide by 5.","32.50 ÷ 5"], ["k = y ÷ x = 32.50 ÷ 5", f"k = {fmt(q)}, so one ticket is {money(q)}."], unit="dollars")
q = D("6.5")*12
num("2.4","B","Tickets cost $6.50 each. The equation is y = 6.5x. What do 12 tickets cost (in dollars)?", q,
    ["Use y = kx with x = 12.","6.5 × 12","6.5 × 10 + 6.5 × 2"], ["y = 6.5(12)", f"65 + 13 = {fmt(q)}", f"12 tickets cost {money(q)}."], unit="dollars")
choice("2.4","D","Which equation shows a proportional relationship?", ["y = 4x + 1","y = x + 4","y = 0.4x","y = 4/x"], 2,
    ["A proportional equation is exactly y = (number) × x.","Look for a plus or minus.","Which one has nothing added?"],
    ["y = 4x + 1 and y = x + 4 add a number, so no.", "y = 4/x has x on the bottom, so no.", "y = 0.4x is y = kx with k = 0.4."])
q = F(45)/D("1.5")*8
num("2.4","E","A pool fills 45 gallons in 1.5 minutes at a steady rate. How many gallons in 8 minutes?", q,
    ["Find gallons per ONE minute first.","45 ÷ 1.5 = 30","Then multiply by 8."], ["k = 45 ÷ 1.5 = 30 gallons per minute", f"y = 30 × 8 = {fmt(q)}"], unit="gallons")
# ---------------------------------------------------------------- 2.5
G1 = dict(lines=[dict(pts=[[0,0],[4,10]], label="")], xmax=5, ymax=12, xl="x", yl="y", dots=[[4,10]])
choice("2.5","A","Is this graph a proportional relationship?", ["Yes","No"], 0,
    ["Two tests: is it straight? Does it go through (0, 0)?","Look at where the line starts.","It starts at the origin and it's straight."],
    ["The line is straight.", "It passes through (0, 0).", "Both tests pass, so it is proportional."], graph=G1)
num("2.5","B","Use the same graph. What is the constant of proportionality k?", F(10,4),
    ["k = y ÷ x for any point except (0, 0).","The point (4, 10) is on the line.","10 ÷ 4"], ["k = y ÷ x = 10 ÷ 4", "k = 2.5, so the point (1, 2.5) is also on the line."], graph=G1)
choice("2.5","A","Is this graph a proportional relationship?", ["Yes","No"], 1,
    ["Check both tests: straight? through (0, 0)?","Where does the line cross the y-axis?","It starts at 3, not 0."],
    ["The line is straight, but it starts at (0, 3).", "It does not pass through the origin, so it is NOT proportional."],
    graph=dict(lines=[dict(pts=[[0,3],[4,11]], label="")], xmax=5, ymax=12, xl="x", yl="y", dots=[[0,3],[4,11]]))
curve = [[i/4, (i/4)**2/2] for i in range(0, 17)]
choice("2.5","A","Is this graph a proportional relationship?", ["Yes","No"], 1,
    ["Check both tests.","It does pass through (0, 0). Is it straight?","It bends upward."],
    ["It passes through (0, 0), but it is a curve, not a straight line.", "Both tests must pass. So it is NOT proportional."],
    graph=dict(lines=[dict(pts=curve, label="")], xmax=5, ymax=12, xl="x", yl="y", dots=[]))
num("2.5","C","A proportional graph is a straight line through (0, 0) and (5, 35). What is y when x = 1?", F(35,5),
    ["The point (1, k) shows the constant of proportionality.","k = y ÷ x using (5, 35).","35 ÷ 5"], ["k = 35 ÷ 5 = 7", "So the point is (1, 7), and y = 7 when x = 1."])
choice("2.5","E","Two proportional graphs, Line A and Line B, both start at (0, 0). Which line has the bigger constant of proportionality k?", ["Line A","Line B"], 1,
    ["Find k for each: y ÷ x at the end point.","A ends at (4, 6) and B ends at (4, 10).","6 ÷ 4 and 10 ÷ 4."],
    ["A: k = 6 ÷ 4 = 1.5.", "B: k = 10 ÷ 4 = 2.5.", "The steeper line has the bigger k."],
    graph=dict(lines=[dict(pts=[[0,0],[4,6]], label="A"), dict(pts=[[0,0],[4,10]], label="B")], xmax=5, ymax=12, xl="x", yl="y", dots=[[4,6],[4,10]]))
# ---------------------------------------------------------------- 2.6
num("2.6","A","Mia is 4 years old when her cousin is 10. How old will her cousin be when Mia is 9?", 15,
    ["Times or plus? Will they ever be the same age gap apart?","Their ages keep a constant DIFFERENCE.","The cousin is always 6 years older."],
    ["Mia's age + 6 = cousin's age (a plus, not a times).", "9 + 6 = 15", "This is NOT a proportional problem."], unit="years old")
num("2.6","A","4 people paint a fence in 6 hours. How many hours would 8 people take, working at the same rate?", 3,
    ["More people: more time, or less time?","Total work stays the same: 4 × 6 = 24 person-hours.","24 ÷ 8"],
    ["More helpers means LESS time, so this is not a simple ratio.", "4 × 6 = 24 person-hours of work.", "24 ÷ 8 = 3 hours."], unit="hours")
num("2.6","B","A smoothie uses 2 cups of berries for every 3 cups of yogurt. You use 15 cups of yogurt. How many cups of berries?", F(2,3)*15,
    ["Times or plus? Doubling the recipe doubles both.","How many groups of 3 cups of yogurt are in 15?","15 ÷ 3 = 5 groups."],
    ["15 ÷ 3 = 5 batches.", "5 × 2 = 10 cups of berries.", "Check: 10 : 15 simplifies to 2 : 3."], unit="cups")
num("2.6","D","Trail mix should have 4 cups of nuts for every 7 cups of raisins. A bag has 12 cups of nuts and 28 cups of raisins. How many MORE cups of nuts does it need?", F(28,7)*4-12,
    ["Match the ratio to the bigger amount of raisins.","28 ÷ 7 = 4 groups of raisins.","4 groups need 4 × 4 nuts."],
    ["28 ÷ 7 = 4 groups, so the mix needs 4 × 4 = 16 cups of nuts.", "It has 12, so it needs 16 − 12 = 4 more."], unit="cups")
q = D("4.50")/30*3*36
num("2.6","E","30 inches of ribbon cost $4.50. How much do 3 yards cost (in dollars)? (1 yard = 36 inches)", q,
    ["Make the units match first.","3 yards = 3 × 36 inches.","Cost per inch: 4.50 ÷ 30."],
    ["3 yards = 108 inches.", "$4.50 ÷ 30 = $0.15 per inch.", f"0.15 × 108 = {fmt(q)}"], unit="dollars")
choice("2.6","A","A taxi charges $5 plus $2 per mile. Is the cost proportional to the number of miles?", ["Yes","No"], 1,
    ["What does a 0-mile ride cost?","Is there a starting fee?","Check cost ÷ miles for 1 and 2 miles."],
    ["1 mile: $7, 2 miles: $9. 7 ÷ 1 ≠ 9 ÷ 2.", "There is a $5 starting fee, so it is NOT proportional."])
# ---------------------------------------------------------------- 2.8
num("2.8","A","Scale: 1 in. = 4 ft. A wall measures 7.5 in. on the drawing. How many feet long is the real wall?", D("7.5")*4,
    ["Does the real wall come out bigger or smaller than the drawing?","Each inch stands for 4 feet.","7.5 × 4"], ["actual = scale × drawing", f"4 × 7.5 = {fmt(D('7.5')*4)}"], unit="ft")
q = F(9,2)*5
num("2.8","B","Scale: 2 in. = 9 ft. A room is 5 in. long on the drawing. How many feet long is the real room?", q,
    ["First make the scale 'ONE inch = ? ft'.","9 ÷ 2 = 4.5 ft per inch.","Then multiply by 5."], ["1 in. = 9 ÷ 2 = 4.5 ft.", f"4.5 × 5 = {fmt(q)}"], unit="ft")
q = (3*6)*(5*6)
num("2.8","C","A drawing of a rectangle is 3 in. by 5 in. Scale: 1 in. = 6 ft. What is the REAL area in square feet?", q,
    ["Do not multiply the drawing's area by 6.","Find the real length and the real width first.","Then multiply them."],
    ["Real width: 3 × 6 = 18 ft. Real length: 5 × 6 = 30 ft.", f"Area = 18 × 30 = {fmt(q)} square feet."], unit="sq ft")
num("2.8","B","A real 36-ft boat is 8 in. long in a scale drawing. 1 in. = how many feet?", F(36,8),
    ["Scale means real size ÷ drawing size.","You want feet for ONE inch.","36 ÷ 8"], ["36 ft ÷ 8 in. = 4.5 ft per inch", "Scale: 1 in. = 4.5 ft."], unit="ft per inch")
num("2.8","D","A logo drawing is 6 in. long at a scale of 1 in. = 5 ft. You redraw it 10 in. long. What is the new scale (feet per inch)?", F(30,10),
    ["Find the REAL length first.","6 × 5 = 30 ft.","Real length ÷ new drawing length."], ["Real length: 6 × 5 = 30 ft.", "New scale: 30 ft ÷ 10 in. = 3 ft per inch."], unit="ft per inch")
q = F(25)*F(7,2)
num("2.8","A","Map scale: 1 in. = 25 miles. Two towns are 3 1/2 in. apart on the map. How many real miles apart are they?", q,
    ["Each inch stands for 25 miles.","3 1/2 = 3.5","25 × 3.5"], ["25 × 3.5 = 75 + 12.5", f"= {fmt(q)} miles."], unit="miles")

for i, p in enumerate(PROBS, 1): p["id"] = f"U2-{i:02d}"
if __name__ == "__main__":
    for p in PROBS: print(p["id"], p["sub"], p["type"], "|", p["text"][:70], "=>", p["show"])

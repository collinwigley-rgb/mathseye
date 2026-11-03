#!/usr/bin/env python3
"""Builds the Unit 2 study guide: content/units/unit-2/practice.json, public/study/unit-2.html, and an artifact fragment."""
import json, pathlib, sys, re
sys.path.insert(0, str(pathlib.Path(__file__).parent))
from unit2_problems import PROBS
ROOT = pathlib.Path(__file__).resolve().parent.parent
SCR = pathlib.Path(sys.argv[1]) if len(sys.argv) > 1 else pathlib.Path("/tmp")

CONCEPTS = {
 "div-decimals":("Dividing decimals","Divide a money or measurement amount by a whole number.","Grade 6"),
 "mul-decimals":("Multiplying decimals","Multiply a rate like $0.15 by a quantity.","Grade 6"),
 "div-fractions":("Dividing fractions","Keep, change, flip, then cancel.","Grade 6"),
 "mul-fractions":("Multiplying fractions","Multiply across and cancel first.","Grades 5-6"),
 "mixed-numbers":("Mixed numbers","Turn 1 1/2 into 3/2 before you multiply or divide.","Grades 5-6"),
 "equiv-ratios":("Equivalent ratios and ratio tables","Do the same multiply or divide to both rows.","Grade 6"),
 "unit-conversion":("Converting units","Dozens, yards to inches, minutes to hours.","Grades 5-6"),
 "reading-tables":("Reading tables","Pull pairs of numbers out of a table.","Grades 4-6"),
 "coordinate-plane":("Plotting and reading points","(x, y): across, then up.","Grades 5-6"),
 "area-rect":("Area of a rectangle","Length × width.","Grades 3-6"),
 "solve-1step":("Solving one-step equations","Undo multiply with divide to find x.","Grade 6"),
 "compare-order":("Comparing numbers","Decide which decimal or fraction is larger.","Grades 5-6"),
 "multi-step":("Multi-step word problems","Break the story into steps and answer everything asked.","Grade 6"),
 "unit-rate":("Unit rates","How much for exactly ONE.","Lesson 2.1"),
 "compare-rates":("Comparing rates","Same units, then decide if bigger or smaller wins.","Lesson 2.1"),
 "fraction-unit-rate":("Unit rates with fractions","Get to ONE when amounts are fractions.","Lesson 2.2"),
 "proportional-test":("Testing for proportional","Same y ÷ x in every row, and 0 gives 0.","Lesson 2.3"),
 "k-const":("Constant of proportionality","k = y ÷ x, the unit rate.","Lesson 2.4"),
 "y-eq-kx":("The equation y = kx","Write and use the proportional equation.","Lesson 2.4"),
 "proportional-graph":("Proportional graphs","Straight line through (0, 0); the point (1, k).","Lesson 2.5"),
 "times-or-plus":("Times or plus?","Decide if it's proportional before using ratios.","Lesson 2.6"),
 "scale-factor":("Scale and scale factor","Actual = k × drawing; area uses real sides.","Lesson 2.8"),
 "new-scale":("Changing the scale","Find the real size first, then the new scale.","Lesson 2.8"),
}
BASE = {
 ("2.1","A"):["unit-rate","div-decimals"],("2.1","B"):["unit-rate","compare-rates","div-decimals"],("2.1","C"):["unit-rate","mul-decimals"],("2.1","D"):["equiv-ratios"],
 ("2.1","E"):["unit-rate","multi-step","mul-decimals"],("2.1","F"):["unit-rate","unit-conversion","div-decimals"],
 ("2.2","A"):["fraction-unit-rate","div-fractions","unit-rate"],("2.2","B"):["fraction-unit-rate","div-fractions","unit-rate","mul-fractions"],
 ("2.2","C"):["fraction-unit-rate","div-fractions","compare-rates","mixed-numbers"],("2.2","D"):["fraction-unit-rate","div-fractions","unit-rate","mixed-numbers"],
 ("2.2","E"):["fraction-unit-rate","div-fractions"],
 ("2.3","A"):["proportional-test","unit-rate"],("2.3","C"):["proportional-test","unit-rate","mul-decimals"],("2.3","F"):["proportional-test","unit-rate","reading-tables"],
 ("2.4","A"):["k-const","unit-rate"],("2.4","B"):["y-eq-kx","k-const","unit-rate"],("2.4","C"):["y-eq-kx","k-const","solve-1step"],("2.4","D"):["y-eq-kx","proportional-test"],
 ("2.4","E"):["y-eq-kx","k-const","unit-rate"],
 ("2.5","A"):["proportional-graph","proportional-test","coordinate-plane"],("2.5","B"):["proportional-graph","k-const","coordinate-plane"],
 ("2.5","C"):["proportional-graph","k-const","coordinate-plane"],("2.5","E"):["proportional-graph","k-const","compare-rates"],
 ("2.6","A"):["times-or-plus","proportional-test"],("2.6","B"):["times-or-plus","equiv-ratios","unit-rate"],("2.6","D"):["equiv-ratios","times-or-plus"],
 ("2.6","E"):["y-eq-kx","unit-conversion","unit-rate"],
 ("2.8","A"):["scale-factor","k-const","mul-decimals"],("2.8","B"):["scale-factor","unit-rate","div-decimals"],("2.8","C"):["scale-factor","area-rect","mul-decimals"],
 ("2.8","D"):["new-scale","scale-factor","k-const","unit-rate"],
}
SUBS = ["2.1","2.2","2.3","2.4","2.5","2.6","2.8"]
FOCUS = {
 "2.1":"Practice getting to ONE, the move every other problem in this unit uses.","2.2":"Practice keep-change-flip to get to ONE when the amounts are fractions.",
 "2.3":"Practice testing EVERY row so a broken pattern can't fool you.","2.4":"Practice finding k and using y = kx to find any amount.",
 "2.5":"Practice the two graph tests: straight, and through (0, 0).","2.6":"Practice deciding times or plus BEFORE you calculate.",
 "2.8":"Practice using the scale, and converting each side before finding area."}
LESSONS = {
 "2.1":dict(title="Unit rates",move="Divide to get to ONE, then multiply to scale up.",hook="Per means divide. Get to 1.",trap="Comparing totals instead of unit rates. Making 9 of 25 shots is worse than 8 of 20.",
   why=dict(goal="Compare deals and speeds fairly by turning any rate into 'how much for ONE.'",supports_future="Every skill after this starts with a unit rate: equations, graphs, scale drawings, and later percent and slope.",why_you_need_it="Totals can fool you. 9 of 25 shots sounds better than 8 of 20, but per shot it's worse.",real_life="Grocery unit prices, miles per hour, steps per mile, pay per hour, phone plans.",building_block="Foundation. The first block of the unit; the rest is built from it.")),
 "2.2":dict(title="Unit rates with fractions",move="Keep, change, flip, then cancel before you multiply.",hook="Flip the bottom.",trap="Flipping the wrong fraction. Only the divisor (the 'per' amount) flips.",
   why=dict(goal="Do the same 'get to ONE' move when the amounts are fractions.",supports_future="Recipes, maps, and scale drawings use fraction rates. Lessons 2.4 and 2.8 depend on this.",why_you_need_it="Real measurements aren't always whole numbers: 3/4 cup, 1/6 hour, 2 1/2 miles.",real_life="Recipes, speed over a short time, fabric per item, map scales, medicine doses.",building_block="Builds on 2.1 plus fraction division from 6th grade.")),
 "2.3":dict(title="Is it proportional?",move="Divide y ÷ x in EVERY row. All the same means proportional.",hook="Every row, same number, or no.",trap="Checking only two rows. One row that breaks the pattern makes it NOT proportional.",
   why=dict(goal="Decide for sure whether two quantities are proportional.",supports_future="You can only use y = kx, a straight line through zero, or a scale factor when a relationship is truly proportional.",why_you_need_it="Lots of things look steady but aren't: a setup fee, or ages. Checking every row keeps you from using the wrong tool.",real_life="Is this a steady price per item, or is there a delivery fee? Phone plans, ride shares, memberships.",building_block="Gatekeeper skill: it decides whether the rest of the unit's tools apply.")),
 "2.4":dict(title="y = kx",move="k = y ÷ x. Then write y = kx and use it.",hook="k is y over x.",trap="Using a group price as k. '3 lemons for $1.80' means k = 0.60, not 1.80.",
   why=dict(goal="Write any proportional relationship as y = kx and use k to find anything.",supports_future="y = kx is your first linear equation. Slope, graphing lines, and Algebra start here.",why_you_need_it="An equation is a shortcut: once you know k, any amount takes one step.",real_life="Pay = hourly rate × hours. Cost = price × quantity. Distance = speed × time.",building_block="Turns the unit rate (2.1) into an equation, and sets up graphs (2.5) and slope later.")),
 "2.5":dict(title="Graphs",move="Proportional = a straight line AND it goes through (0, 0). The point (1, k) shows k.",hook="Straight and through zero.",trap="Calling any straight line proportional. A line that starts at $3 is not.",
   why=dict(goal="Recognize and read proportional relationships on a graph.",supports_future="Graphs of lines, slope, and comparing rates visually in 8th grade and science.",why_you_need_it="A picture shows at a glance whether something is proportional and which rate is bigger (steeper).",real_life="Charts of cost vs. amount, speed graphs, exchange rates, fitness apps.",building_block="Connects the table (2.3) and the equation (2.4) to a picture.")),
 "2.6":dict(title="Times or plus?",move="Decide first: does doubling one double the other? If not, don't use a ratio.",hook="Times? Ratio. Plus? Just add.",trap="Using ratios on ages or on 'more helpers means less time' problems.",
   why=dict(goal="Decide whether a problem is proportional before using ratios, then pick the right tool.",supports_future="Choosing the right model is the heart of word-problem solving in Algebra and science.",why_you_need_it="Not every steady problem is a ratio: ages add, and more helpers means less time.",real_life="Scaling a recipe, splitting work, planning for a crowd, checking a bill.",building_block="Mixes 2.1 to 2.5 into one skill: decide first, then solve.")),
 "2.8":dict(title="Scale drawings",move="Make the scale '1 inch = ? ft', then multiply. For area, convert each side first.",hook="One inch first, then multiply.",trap="Multiplying the drawing's area by the scale. Convert length and width first.",
   why=dict(goal="Use a scale to move between a drawing or map and the real thing, including areas.",supports_future="Similar figures and geometry in 7th and 8th grade; blueprints and maps in real life.",why_you_need_it="Scale is a constant of proportionality: actual = k × drawing. Areas grow by k × k.",real_life="Maps, blueprints, floor plans, model kits, enlarging a photo or poster.",building_block="Applies y = kx (2.4) in geometry, combining unit rates, fractions, and area.")),
}
ORIGIN = {v[2]: k for k, v in {s: (0, 0, f"Lesson {s}") for s in SUBS}.items()}
def deps(p):
    cs = BASE.get((p["sub"], p["type"]), ["unit-rate"])
    earlier = sorted({ORIGIN[CONCEPTS[c][2]] for c in cs if CONCEPTS[c][2] in ORIGIN and ORIGIN[CONCEPTS[c][2]] != p["sub"]})
    level = "foundation" if not earlier else ("builds" if len(earlier) == 1 else "mixed")
    return dict(level=level, concepts=cs)
def nonterm(v):
    from fractions import Fraction as F
    d = F(v).limit_denominator(10**6).denominator
    while d % 2 == 0: d //= 2
    while d % 5 == 0: d //= 5
    return d != 1

out = []
for p in PROBS:
    q = {k: v for k, v in p.items()}
    q["why_focus"] = FOCUS[p["sub"]]; q["deps"] = deps(p)
    if q["kind"] == "num": q["tol"] = 0.006 if nonterm(q["answer"]) else 1e-9
    out.append(q)
DATA = dict(problems=out, lessons=LESSONS, concepts={k: dict(name=v[0], plain=v[1], origin=v[2]) for k, v in CONCEPTS.items()}, subs=SUBS)
(ROOT / "content/units/unit-2").mkdir(parents=True, exist_ok=True)
(ROOT / "content/units/unit-2/practice.json").write_text(json.dumps(DATA, indent=1, ensure_ascii=False))

HTML = r'''<title>Unit 2 Study Guide</title>
<meta name="claude:viewport-fit-sides" content="cover">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,500;12..96,700&family=Figtree:wght@400;500;600&display=swap">
<style>
/* Layout: one calm column on a dark stage. Tabs on top, one problem at a time, tools (hint, why, dependencies) beside the work. */
:root{--bg:#16131f;--panel:#201c2e;--panel2:#2b2640;--fg:#efe6d8;--muted:#b0a6c0;--accent:#f4b860;--accent-fg:#2a1d08;--good:#9fd3a8;--line:#3a3354;--focus:#f4b860;
 --display:"Bricolage Grotesque","Avenir Next",system-ui,sans-serif;--body:"Figtree",system-ui,-apple-system,sans-serif;color-scheme:dark}
@media (prefers-color-scheme:light){:root:not([data-theme="dark"]){--bg:#f4f2f8;--panel:#ffffff;--panel2:#e9e5f3;--fg:#241f35;--muted:#625a78;--accent:#a3600a;--accent-fg:#ffffff;--good:#2d7a45;--line:#d2cce2;--focus:#a3600a;color-scheme:light}}
:root[data-theme="light"]{--bg:#f4f2f8;--panel:#ffffff;--panel2:#e9e5f3;--fg:#241f35;--muted:#625a78;--accent:#a3600a;--accent-fg:#ffffff;--good:#2d7a45;--line:#d2cce2;--focus:#a3600a;color-scheme:light}
*{box-sizing:border-box;-webkit-tap-highlight-color:transparent}
body{background:var(--bg);color:var(--fg);font:17px/1.5 var(--body);padding-block:20px 56px;padding-left:max(16px,env(safe-area-inset-left,0px));padding-right:max(16px,env(safe-area-inset-right,0px));user-select:none;-webkit-user-select:none}
.wrap{max-width:760px;margin:0 auto;display:flex;flex-direction:column;gap:18px;min-width:0}
h1,h2,h3{font-family:var(--display);line-height:1.15;margin:0;text-wrap:balance}
h1{font-size:clamp(28px,6vw,40px);letter-spacing:-.5px} h2{font-size:22px} h3{font-size:18px}
.sub{color:var(--muted);margin:4px 0 0}
button{font:inherit;color:inherit;border:0;cursor:pointer;touch-action:manipulation;border-radius:14px}
button:focus-visible,a:focus-visible{outline:3px solid var(--focus);outline-offset:2px}
.tabs{display:flex;gap:8px;flex-wrap:wrap}.tabs button{background:var(--panel);padding:12px 18px;font-weight:600;min-height:48px}
.tabs button[aria-selected=true]{background:var(--accent);color:var(--accent-fg)}
.card{background:var(--panel);border-radius:20px;padding:20px;display:flex;flex-direction:column;gap:12px;min-width:0}
.eyebrow{color:var(--accent);text-transform:uppercase;letter-spacing:.12em;font-size:12.5px;font-weight:600;margin:0}
.move{font-size:19px;margin:0}.hook{margin:0;padding:10px 14px;background:var(--panel2);border-radius:12px;font-weight:600}
.trap{margin:0;color:var(--muted)} .row{display:flex;gap:10px;flex-wrap:wrap;align-items:center}
.btn{background:var(--panel2);padding:12px 16px;min-height:48px;font-weight:500}.btn.primary{background:var(--accent);color:var(--accent-fg);font-weight:600}
.btn[aria-expanded=true]{outline:2px solid var(--accent)} .btn:disabled{opacity:.45;cursor:default}
.chips{display:flex;gap:8px;flex-wrap:wrap}.chips button{background:var(--panel);padding:8px 14px;min-height:40px;font-weight:500}
.chips button[aria-pressed=true]{background:var(--panel2);outline:2px solid var(--accent)}
.problem{font-size:clamp(20px,4.4vw,26px);font-weight:500;margin:0}
.meta{display:flex;justify-content:space-between;color:var(--muted);font-size:14px}
table.t{border-collapse:collapse;font-variant-numeric:tabular-nums;font-size:19px}table.t th,table.t td{border:1px solid var(--line);padding:8px 16px;text-align:center}table.t th{background:var(--panel2);font-family:var(--display)}
.tw{overflow-x:auto}
.answer{font-size:30px;min-height:48px;padding:6px 14px;background:var(--panel2);border-radius:14px;font-variant-numeric:tabular-nums;color:var(--accent);display:flex;align-items:center;gap:8px;flex-wrap:wrap}
.answer .ph{color:var(--muted);font-size:17px}
.pad{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;max-width:420px}.pad button{background:var(--panel2);min-height:60px;font-size:24px;font-variant-numeric:tabular-nums}
.pad .go{grid-column:span 2;background:var(--accent);color:var(--accent-fg);font-weight:700;font-size:20px}
.opts{display:flex;flex-direction:column;gap:10px}.opts button{background:var(--panel2);padding:16px;text-align:left;font-size:19px;min-height:56px}
.opts button[aria-pressed=true]{outline:3px solid var(--accent)}
.fb{margin:0;min-height:26px;color:var(--muted)}.fb.good{color:var(--good);font-weight:600}
.clues{margin:0;padding:0;list-style:none;display:flex;flex-direction:column;gap:8px}.clues li{background:var(--panel2);border-left:3px solid var(--accent);border-radius:10px;padding:10px 14px}
.steps{margin:0;padding-left:22px;display:flex;flex-direction:column;gap:6px}
.panel{background:var(--panel2);border-radius:14px;padding:14px 16px;display:flex;flex-direction:column;gap:10px}
.panel dt{font-family:var(--display);font-weight:700;color:var(--accent);font-size:14px;text-transform:uppercase;letter-spacing:.08em}.panel dd{margin:0 0 6px}
.lvl{display:inline-block;padding:4px 12px;border-radius:99px;background:var(--accent);color:var(--accent-fg);font-weight:600;font-size:14px}
.cl{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:8px}.cl li{display:flex;gap:10px;justify-content:space-between;align-items:flex-start;flex-wrap:wrap}.cl small{color:var(--muted)}
.tag{font-size:12.5px;padding:2px 10px;border-radius:99px;border:1px solid var(--line);color:var(--muted);white-space:nowrap}
svg.g{width:100%;max-width:380px;height:auto}.g .ax{stroke:var(--muted);stroke-width:1.5}.g .gr{stroke:var(--line);stroke-width:1}.g text{fill:var(--muted);font:12px var(--body)}
.g .ln{stroke:var(--accent);stroke-width:3;fill:none}.g .ln2{stroke:var(--good);stroke-width:3;fill:none}.g .dot{fill:var(--accent)}.g .lb{fill:var(--fg);font-weight:600}
.bar{height:8px;background:var(--panel2);border-radius:6px;overflow:hidden}.bar i{display:block;height:100%;background:var(--accent)}
.res{display:flex;flex-direction:column;gap:10px}.res .it{background:var(--panel2);border-radius:14px;padding:12px 14px;display:flex;flex-direction:column;gap:4px}
.ok{color:var(--good);font-weight:600}.rv{color:var(--accent);font-weight:600}
@media (prefers-reduced-motion:no-preference){.clues li{animation:f .3s}@keyframes f{from{opacity:0;transform:translateY(4px)}}}
</style>
<div class="wrap" id="app"></div>
<script>
const DATA = __DATA__;
const KEY = "mathseye.unit2.study.v1";
let save = {solved:{}}; try { save = Object.assign(save, JSON.parse(localStorage.getItem(KEY) || "{}")); } catch(e) {}
const persist = () => { try { localStorage.setItem(KEY, JSON.stringify(save)); } catch(e) {} };
const $ = (h) => { const t = document.createElement("template"); t.innerHTML = h.trim(); return t.content.firstChild; };
const esc = (s) => String(s).replace(/[&<>"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const LV = {foundation:"Base skill", builds:"Builds on one earlier lesson", mixed:"Mixes several lessons"};
const LVTXT = {foundation:"This problem mostly uses this lesson's skill plus skills from earlier grades.", builds:"This problem uses this lesson's skill together with one earlier lesson from this unit.", mixed:"This problem combines several lessons from this unit. Try the earlier ones first if you get stuck."};
const S = {tab:"toolkit", filter:"all", idx:0, cur:null, test:null};
function parseNum(s){ s = String(s).trim().replace(/[−–]/g,"-").replace(/[$,]/g,"").replace(/\s+/g," ");
  let m = s.match(/^(-?)(\d+) (\d+)\/(\d+)$/); if (m) return (m[1]?-1:1)*(+m[2] + m[3]/m[4]);
  m = s.match(/^(-?\d+(?:\.\d+)?)\/(\d+(?:\.\d+)?)$/); if (m) return m[1]/m[2];
  if (/^-?(\d+\.?\d*|\.\d+)$/.test(s)) return parseFloat(s); return NaN; }
const isRight = (p, v) => p.kind === "choice" ? v === p.correct : Math.abs(parseNum(v) - p.answer) <= (p.tol || 1e-9);
function graphSVG(g){ const W=380,H=270,L=46,B=38,T=14,R=18,pw=W-L-R,ph=H-T-B,X=v=>L+v/g.xmax*pw,Y=v=>T+ph-v/g.ymax*ph; let s=`<svg class="g" viewBox="0 0 ${W} ${H}" role="img" aria-label="Graph">`;
  for(let i=0;i<=g.xmax;i++) s+=`<line class="gr" x1="${X(i)}" y1="${T}" x2="${X(i)}" y2="${T+ph}"/><text x="${X(i)}" y="${T+ph+18}" text-anchor="middle">${i}</text>`;
  const ys = g.ymax>10?2:1; for(let i=0;i<=g.ymax;i+=ys) s+=`<line class="gr" x1="${L}" y1="${Y(i)}" x2="${L+pw}" y2="${Y(i)}"/><text x="${L-8}" y="${Y(i)+4}" text-anchor="end">${i}</text>`;
  s+=`<line class="ax" x1="${L}" y1="${T+ph}" x2="${L+pw}" y2="${T+ph}"/><line class="ax" x1="${L}" y1="${T}" x2="${L}" y2="${T+ph}"/>`;
  g.lines.forEach((ln,i)=>{ s+=`<polyline class="${i?'ln2':'ln'}" points="${ln.pts.map(p=>X(p[0])+','+Y(p[1])).join(' ')}"/>`; if(ln.label){const e=ln.pts[ln.pts.length-1]; s+=`<text class="lb" x="${X(e[0])+6}" y="${Y(e[1])+4}">${ln.label}</text>`;}});
  (g.dots||[]).forEach(d=>{ s+=`<circle class="dot" cx="${X(d[0])}" cy="${Y(d[1])}" r="5"/><text class="lb" x="${X(d[0])-8}" y="${Y(d[1])-10}" text-anchor="end">(${d[0]}, ${d[1]})</text>`;});
  return s+`<text x="${L+pw/2}" y="${H-4}" text-anchor="middle">${g.xl}</text><text x="12" y="${T+ph/2}" transform="rotate(-90 12 ${T+ph/2})" text-anchor="middle">${g.yl}</text></svg>`; }
const tableHTML = (t) => `<div class="tw"><table class="t"><tr><th>x</th>${t.x.map(v=>`<td>${esc(v)}</td>`).join("")}</tr><tr><th>y</th>${t.y.map(v=>`<td>${esc(v)}</td>`).join("")}</tr></table></div>`;
function whyHTML(p){ const w = DATA.lessons[p.sub].why; return `<div class="panel" role="region" aria-label="Why"><p style="margin:0"><b>${esc(p.why_focus)}</b></p><dl style="margin:0"><dt>The goal</dt><dd>${esc(w.goal)}</dd><dt>How it helps later</dt><dd>${esc(w.supports_future)}</dd><dt>Why you need it</dt><dd>${esc(w.why_you_need_it)}</dd><dt>Where you'll see it</dt><dd>${esc(w.real_life)}</dd><dt>Building block</dt><dd>${esc(w.building_block)}</dd></dl></div>`; }
function depsHTML(p){ const d=p.deps; return `<div class="panel" role="region" aria-label="Dependencies"><div><span class="lvl">${LV[d.level]}</span></div><p style="margin:0">${LVTXT[d.level]}</p><ul class="cl">${d.concepts.map(c=>{const k=DATA.concepts[c];return `<li><span><b>${esc(k.name)}</b><br><small>${esc(k.plain)}</small></span><span class="tag">${esc(k.origin)}</span></li>`}).join("")}</ul></div>`; }

function lessonCard(sub){ const L = DATA.lessons[sub]; const c = $(`<section class="card"><p class="eyebrow">Lesson ${sub}</p><h2>${esc(L.title)}</h2><p class="move">${esc(L.move)}</p><p class="hook">${esc(L.hook)}</p><p class="trap"><b>Watch out:</b> ${esc(L.trap)}</p><div class="row"><button class="btn" aria-expanded="false">Why this matters</button><button class="btn go">Practice ${sub}</button></div><div class="slot"></div></section>`);
  const [why, go] = c.querySelectorAll("button"); why.onclick = () => { const open = why.getAttribute("aria-expanded")==="true"; why.setAttribute("aria-expanded", !open); c.querySelector(".slot").innerHTML = open ? "" : whyHTML({sub, why_focus: L.hook}); };
  go.onclick = () => { S.tab="practice"; S.filter=sub; S.idx=0; S.cur=null; render(); window.scrollTo(0,0); }; return c; }
function toolkit(root){ root.append($(`<div class="card"><p class="eyebrow">Your toolkit</p><h2>One move per lesson</h2><p class="move">Proportional means y is always the same number times x. That number is k, and it is the unit rate.</p></div>`)); DATA.subs.forEach(s => root.append(lessonCard(s))); }

function pool(){ return DATA.problems.filter(p => S.filter==="all" || p.sub===S.filter); }
function practice(root){
  const chips = $(`<div class="chips" role="group" aria-label="Lesson filter">${["all",...DATA.subs].map(s=>`<button aria-pressed="${S.filter===s}" data-s="${s}">${s==="all"?"All lessons":s}</button>`).join("")}</div>`);
  chips.onclick = e => { const b=e.target.closest("button"); if(!b) return; S.filter=b.dataset.s; S.idx=0; S.cur=null; render(); }; root.append(chips);
  const ps = pool(); const done = ps.filter(p=>save.solved[p.id]).length; root.append($(`<div><div class="meta"><span>${done} of ${ps.length} solved</span><span>Problem ${S.idx+1} of ${ps.length}</span></div><div class="bar"><i style="width:${ps.length?done/ps.length*100:0}%"></i></div></div>`));
  const p = ps[S.idx]; if (!S.cur || S.cur.id !== p.id) S.cur = {id:p.id, input:"", pick:null, tries:0, hints:0, solved:!!save.solved[p.id], steps:false, why:false, deps:false};
  root.append(problemCard(p, S.cur, ps)); }
function problemCard(p, st, ps){
  const card = $(`<section class="card"><div class="meta"><span class="eyebrow">Lesson ${p.sub}</span><span>${LV[p.deps.level]}</span></div><p class="problem">${esc(p.text)}</p><div class="vis"></div><div class="in"></div><p class="fb" aria-live="polite"></p><ul class="clues"></ul><div class="row tools"></div><div class="slot"></div></section>`);
  const vis = card.querySelector(".vis"), inp = card.querySelector(".in"), fb = card.querySelector(".fb"), clues = card.querySelector(".clues"), tools = card.querySelector(".tools"), slot = card.querySelector(".slot");
  if (p.graph) vis.innerHTML = graphSVG(p.graph); if (p.table) vis.innerHTML = tableHTML(p.table);
  function draw(){
    inp.innerHTML = ""; 
    if (p.kind==="choice") { const o=$(`<div class="opts">${p.options.map((t,i)=>`<button aria-pressed="${st.pick===i}" data-i="${i}">${esc(t)}</button>`).join("")}</div>`); o.onclick=e=>{const b=e.target.closest("button"); if(!b||st.solved) return; st.pick=+b.dataset.i; draw(); }; inp.append(o); inp.append($(`<div class="row" style="margin-top:10px"><button class="btn primary chk">Check</button></div>`)); inp.querySelector(".chk").onclick=()=>check(st.pick); }
    else { inp.append($(`<div class="answer" aria-live="polite">${st.solved?esc(p.show):(st.input?esc(st.input):'<span class="ph">Your answer</span>')}</div>`));
      if(!st.solved){ const keys=["7","8","9","⌫","4","5","6","−","1","2","3","/","0",".","␣"]; const pad=$(`<div class="pad">${keys.map(k=>`<button data-k="${k}" aria-label="${k==='⌫'?'Delete':k==='␣'?'Space':k}">${k==="␣"?"space":k}</button>`).join("")}<button class="go" data-k="go">Check</button></div>`);
        pad.onclick=e=>{const b=e.target.closest("button"); if(!b) return; const k=b.dataset.k; if(k==="go") return check(st.input); st.input = k==="⌫"?st.input.slice(0,-1):(st.input.length<14?st.input+(k==="␣"?" ":k):st.input); draw(); }; inp.append(pad); } }
    clues.innerHTML = p.hints.slice(0,st.hints).map(h=>`<li>${esc(h)}</li>`).join("");
    tools.innerHTML = ""; const mk=(t,fn,dis,exp)=>{const b=$(`<button class="btn"${dis?" disabled":""}${exp!==undefined?` aria-expanded="${exp}"`:""}>${t}</button>`); b.onclick=fn; tools.append(b); return b;};
    if(!st.solved) mk(st.hints<3?`Hint ${st.hints+1} of 3`:"No more hints", ()=>{st.hints++; draw();}, st.hints>=3);
    if(!st.solved) mk("Show the steps", ()=>{st.steps=!st.steps; draw();}, !(st.tries>0||st.hints>=3), st.steps); else mk("See the steps", ()=>{st.steps=!st.steps; draw();}, false, st.steps);
    mk("Why", ()=>{st.why=!st.why; draw();}, false, st.why); mk("Dependencies", ()=>{st.deps=!st.deps; draw();}, false, st.deps);
    slot.innerHTML = (st.steps?`<div class="panel"><b>Worked steps</b><ol class="steps">${p.steps.map(s=>`<li>${esc(s)}</li>`).join("")}</ol><p style="margin:0"><b>Answer:</b> ${esc(p.show)}</p></div>`:"") + (st.why?whyHTML(p):"") + (st.deps?depsHTML(p):"");
    if(st.solved){ const nx=$(`<button class="btn primary">${S.idx+1<ps.length?"Next problem":"Back to the first"}</button>`); nx.onclick=()=>{S.idx=(S.idx+1)%ps.length; S.cur=null; render(); window.scrollTo(0,0);}; tools.append(nx); }
  }
  function check(v){ if(v===null||v===""||v===undefined){ fb.textContent = p.kind==="choice"?"Pick an answer first.":"Type an answer first."; return; }
    st.tries++; if(isRight(p,v)){ st.solved=true; save.solved[p.id]=true; persist(); fb.className="fb good"; fb.textContent = st.tries===1&&st.hints===0?"Nice, you got that on your own.":"You got it."; }
    else { fb.className="fb"; fb.textContent = "Not yet. Try again, or take a hint."; st.input=""; }
    draw(); }
  draw(); if(st.solved){ fb.className="fb good"; fb.textContent="You got it."; } return card; }

function startTest(){ const picks=[]; DATA.subs.forEach(s=>{ const a=DATA.problems.filter(p=>p.sub===s).sort(()=>Math.random()-.5).slice(0,2); picks.push(...a); }); S.test={list:picks.sort(()=>Math.random()-.5), i:0, ans:[], input:"", pick:null, done:false}; }
function testView(root){
  if(!S.test){ root.append($(`<div class="card"><p class="eyebrow">Practice test</p><h2>14 mixed problems, no hints</h2><p class="move">Two from each lesson, in a mixed order, like the real test. You see how you did at the end, and which lessons to go back to.</p><div class="row"><button class="btn primary" id="st">Start the test</button></div></div>`)); root.querySelector("#st").onclick=()=>{startTest(); render();}; return; }
  const T=S.test;
  if(T.done){ const right=T.list.filter((p,i)=>isRight(p,T.ans[i])).length; const rev=[...new Set(T.list.filter((p,i)=>!isRight(p,T.ans[i])).map(p=>p.sub))];
    root.append($(`<div class="card"><p class="eyebrow">Finished</p><h2>${right} of ${T.list.length} on your own</h2><p class="move">${rev.length?"Lessons to look at again: "+rev.map(s=>"<b>"+s+"</b>").join(", ")+".":"Every lesson looks solid. Nice work."}</p><div class="row">${rev.map(s=>`<button class="btn" data-s="${s}">Practice ${s}</button>`).join("")}<button class="btn primary" id="again">Try a new test</button></div></div>`));
    root.querySelectorAll("[data-s]").forEach(b=>b.onclick=()=>{S.tab="practice";S.filter=b.dataset.s;S.idx=0;S.cur=null;render();}); root.querySelector("#again").onclick=()=>{S.test=null;render();};
    const res=$(`<div class="res"></div>`); T.list.forEach((p,i)=>{ const ok=isRight(p,T.ans[i]); const mine=p.kind==="choice"?(T.ans[i]===null?"(no answer)":p.options[T.ans[i]]):(T.ans[i]||"(no answer)"); res.append($(`<div class="it"><span>${esc(p.text)}</span><span>Your answer: ${esc(mine)}</span>${ok?'<span class="ok">Got it ✓</span>':`<span class="rv">Revisit lesson ${p.sub}. Answer: ${esc(p.show)}</span>`}</div>`)); }); root.append(res); return; }
  const p=T.list[T.i]; root.append($(`<div><div class="meta"><span>Question ${T.i+1} of ${T.list.length}</span></div><div class="bar"><i style="width:${T.i/T.list.length*100}%"></i></div></div>`));
  const c=$(`<section class="card"><p class="problem">${esc(p.text)}</p><div class="vis"></div><div class="in"></div><div class="row"><button class="btn primary nx">${T.i+1<T.list.length?"Next":"Finish"}</button></div></section>`);
  if(p.graph) c.querySelector(".vis").innerHTML=graphSVG(p.graph); if(p.table) c.querySelector(".vis").innerHTML=tableHTML(p.table); const inp=c.querySelector(".in");
  const draw=()=>{ inp.innerHTML=""; if(p.kind==="choice"){ const o=$(`<div class="opts">${p.options.map((t,i)=>`<button aria-pressed="${T.pick===i}" data-i="${i}">${esc(t)}</button>`).join("")}</div>`); o.onclick=e=>{const b=e.target.closest("button"); if(b){T.pick=+b.dataset.i; draw();}}; inp.append(o); }
    else { inp.append($(`<div class="answer">${T.input?esc(T.input):'<span class="ph">Your answer</span>'}</div>`)); const keys=["7","8","9","⌫","4","5","6","−","1","2","3","/","0",".","␣"]; const pad=$(`<div class="pad">${keys.map(k=>`<button data-k="${k}">${k==="␣"?"space":k}</button>`).join("")}</div>`); pad.onclick=e=>{const b=e.target.closest("button"); if(!b) return; const k=b.dataset.k; T.input=k==="⌫"?T.input.slice(0,-1):(T.input.length<14?T.input+(k==="␣"?" ":k):T.input); draw();}; inp.append(pad); } };
  draw(); c.querySelector(".nx").onclick=()=>{ T.ans[T.i]=p.kind==="choice"?T.pick:T.input; T.input=""; T.pick=null; if(T.i+1<T.list.length) T.i++; else T.done=true; render(); window.scrollTo(0,0); }; root.append(c); }

function render(){ const app=document.getElementById("app"); app.innerHTML="";
  app.append($(`<header><h1>Unit 2 Study Guide</h1><p class="sub">Proportional relationships, lessons 2.1 to 2.8</p></header>`));
  const tabs=$(`<div class="tabs" role="tablist">${[["toolkit","Toolkit"],["practice","Practice"],["test","Practice test"]].map(([k,t])=>`<button role="tab" aria-selected="${S.tab===k}" data-k="${k}">${t}</button>`).join("")}</div>`); tabs.onclick=e=>{const b=e.target.closest("button"); if(b){S.tab=b.dataset.k; render();}}; app.append(tabs);
  const body=$(`<div style="display:flex;flex-direction:column;gap:16px;min-width:0"></div>`); app.append(body);
  ({toolkit,practice,test:testView})[S.tab](body); }
render();
</script>'''
frag = HTML.replace("__DATA__", json.dumps(DATA, ensure_ascii=False))
(ROOT / "public/study").mkdir(parents=True, exist_ok=True)
(ROOT / "public/study/unit-2.html").write_text('<!doctype html>\n<html lang="en"><head><meta charset="utf-8"></head><body>\n' + frag + '\n</body></html>\n')
(SCR / "unit2_artifact.html").write_text(frag)
print("problems:", len(out), "| bytes:", len(frag))

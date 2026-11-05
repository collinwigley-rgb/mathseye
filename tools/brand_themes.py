#!/usr/bin/env python3
"""Single source for the color schemes. Writes src/brand.ts and the theme CSS block in src/styles.css.
Static pages (study guide, homework) import theme_css() / brands_json() from here via build_unit2_study.py.
Palettes are inspired by seasonal color-analysis boards; swatch colors for Dark Spring and Light Autumn were
sampled from the reference images, the others were matched by eye."""
import json, pathlib
ROOT = pathlib.Path(__file__).resolve().parent.parent
MEMBERS = ["Sophia", "Manon", "Daniela", "Lara", "Megan", "Yoonchae"]  # order shown in the picker
# id, label, member (or None = unassigned, shown under "More palettes"),
#   dark(bg, panel, panel2, line, accent, accent2), light(bg, panel, panel2, line, accent, accent-fg)   (light accent2 is derived)
THEMES = [
 # --- member signature colors (from the owner's written list of official member colors)
 ("purple",       "Purple",       "Sophia",   ("#150f24", "#201836", "#2e2350", "#473a78", "#c4a1f0", "#f7a8e0"), ("#f3effb", "#ffffff", "#e6dcf7", "#d6c9ee", "#4b2b8a", "#efe6ff")),
 ("pastel-yellow","Pastel Yellow","Manon",    ("#17140c", "#231f12", "#342d19", "#54482a", "#fceeaa", "#ffc98a"), ("#fdf9e0", "#fffef6", "#f4ecbe", "#e3d9a0", "#6b5600", "#fff6c4")),
 ("sky-blue",     "Sky Blue",     "Daniela",  ("#0e1623", "#162235", "#20314d", "#34507a", "#9bd0ff", "#b9f0e6"), ("#edf6fd", "#ffffff", "#d9eaf8", "#c3dcef", "#164a78", "#e3f2ff")),
 ("pastel-green", "Pastel Green", "Lara",     ("#0f1a14", "#172a20", "#223d2e", "#36604a", "#b5e8c6", "#e6f58f"), ("#eef8f1", "#ffffff", "#dbefe2", "#c4e2cf", "#1f5c3b", "#e0f6e8")),
 ("peach",        "Peach",        "Megan",    ("#1e1210", "#2c1b17", "#402822", "#6a4238", "#ffb59e", "#ff8fa3"), ("#fdf1ec", "#ffffff", "#f9dfd5", "#efd0c4", "#8a3a1f", "#ffe9e0")),
 ("pink",         "Pink",         "Yoonchae", ("#1c0f18", "#2a1824", "#3f2536", "#67405a", "#ff9fcb", "#c4a1f0"), ("#fdeef5", "#ffffff", "#f9d9e8", "#eec6d9", "#8a1f56", "#ffe3f0")),
 # --- unassigned: the original brand and the six seasonal palettes (assign a member by replacing None)
 ("classic",      "Original",     None,       ("#14111f", "#1e1a2e", "#2a2540", "#40395a", "#fceeaa", "#c8b6ff"), ("#f8f5dc", "#fffef6", "#efe9c4", "#ddd6a8", "#2c2358", "#f6f1b5")),
 ("dark-winter",  "Dark Winter",  None,       ("#0f0f24", "#191937", "#252556", "#3a3a78", "#a9a4f0", "#6ab5b0"), ("#eeeffa", "#ffffff", "#dcdef4", "#c5c8e8", "#2f3190", "#e8e9ff")),
 ("light-summer", "Light Summer", None,       ("#111823", "#1a2433", "#263449", "#3a4c66", "#c6f6ea", "#b8b8ff"), ("#eaf8f4", "#ffffff", "#d4efe8", "#bfe3da", "#20606a", "#e0fbf5")),
 ("dark-summer",  "Dark Summer",  None,       ("#171018", "#231a26", "#33263a", "#4d3a56", "#f0b4c8", "#7ad4de"), ("#fbeef2", "#ffffff", "#f4dbe3", "#e8c8d2", "#8a3a58", "#ffe6ee")),
 ("light-spring", "Light Spring", None,       ("#12170f", "#1b2317", "#27321f", "#3d4d2e", "#d6ef8c", "#f4c9a0"), ("#f4f9e0", "#fffff4", "#e6f0c0", "#d4e3a4", "#4b6a10", "#f0fbcf")),
 ("dark-spring",  "Dark Spring",  None,       ("#1a130e", "#261b14", "#37271b", "#54402e", "#e3a574", "#a3d75c"), ("#fbf0e6", "#fffaf5", "#f1dcc8", "#e6cdb4", "#8a4018", "#ffe8d6")),
 ("light-autumn", "Light Autumn", None,       ("#170d21", "#231433", "#321d49", "#4d3068", "#e6c072", "#e49ac4"), ("#f6eefa", "#ffffff", "#e8d9f1", "#d8c4e6", "#560e28", "#ffe9c4")),
]
def _rgb(h): h = h.lstrip("#"); return [int(h[i:i+2], 16) for i in (0, 2, 4)]
def rgba(h, a): r, g, b = _rgb(h); return f"rgba({r},{g},{b},{a})"
def _lum(h):
    c = [x / 255 for x in _rgb(h)]; c = [x / 12.92 if x <= 0.03928 else ((x + 0.055) / 1.055) ** 2.4 for x in c]; return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]
def _ratio(a, b):
    la, lb = sorted((_lum(a), _lum(b)), reverse=True); return (la + 0.05) / (lb + 0.05)
def accent2_light(ac2, fg, need=5.0):
    """Darken the second accent until light-mode button text stays readable on it."""
    import colorsys
    r, g, b = [x / 255 for x in _rgb(ac2)]; h, l, sat = colorsys.rgb_to_hls(r, g, b)
    while l > 0.12:
        rr, gg, bb = colorsys.hls_to_rgb(h, l, sat); cand = "#%02x%02x%02x" % (round(rr * 255), round(gg * 255), round(bb * 255))
        if _ratio(fg, cand) >= need: return cand
        l -= 0.02
    return ac2

# Original charm icons (24x24, drawn for this project). Filled shapes use currentColor; details use var(--chip) (the swatch color).
ICONS = {
 "moon": '<path d="M15.2 3.4A8.9 8.9 0 1 0 20.6 15.6 7 7 0 0 1 15.2 3.4Z" fill="currentColor"/>',
 "sun": '<circle cx="12" cy="12" r="4.6" fill="currentColor"/><g stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M12 2.8v2.6M12 18.6v2.6M2.8 12h2.6M18.6 12h2.6M5.5 5.5l1.8 1.8M16.7 16.7l1.8 1.8M18.5 5.5l-1.8 1.8M7.3 16.7l-1.8 1.8"/></g>',
 "cloud": '<path d="M7 18.6a4.3 4.3 0 0 1-.4-8.6 5.9 5.9 0 0 1 11.2 1.4 3.6 3.6 0 0 1-.9 7.2Z" fill="currentColor"/>',
 "leaf": '<path d="M4.6 19.4C4.4 11 9.8 4.8 19.6 4.4c.3 9.2-5.2 15-15 15Z" fill="currentColor"/><path d="M5.2 19c3-4.4 6-7.2 9.6-9.4" fill="none" stroke="var(--chip)" stroke-width="1.7" stroke-linecap="round"/>',
 "heart": '<path d="M12 20.4C5.6 16 3 12.6 3 9.3 3 6.7 5 4.8 7.4 4.8c1.7 0 3.3 1 4.6 2.8 1.3-1.8 2.9-2.8 4.6-2.8C19 4.8 21 6.7 21 9.3c0 3.3-2.6 6.7-9 11.1Z" fill="currentColor"/>',
 "butterfly": '<path d="M12 11.2C10.6 4.6 4.8 2.2 3.2 5.5c-1.3 2.9 2.4 6.2 8.8 5.7Zm0 0c1.4-6.6 7.2-9 8.8-5.7 1.3 2.9-2.4 6.2-8.8 5.7Z" fill="currentColor"/><path d="M12 12.6c-3.8-.1-7.4 2-6.2 5.4 1 2.6 4.6 1.6 6.2-5.4Zm0 0c3.8-.1 7.4 2 6.2 5.4-1 2.6-4.6 1.6-6.2-5.4Z" fill="currentColor"/><path d="M12 8.8v9" fill="none" stroke="var(--chip)" stroke-width="1.5" stroke-linecap="round"/><path d="M11.3 7.2 9.7 3.8M12.7 7.2l1.6-3.4" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>',
 "sparkle": '<path d="M12 2.6Q13 10.8 21.4 12 13 13.2 12 21.4 11 13.2 2.6 12 11 10.8 12 2.6Z" fill="currentColor"/>',
}
ICON_BY_ID = {"purple": "moon", "pastel-yellow": "sun", "sky-blue": "cloud", "pastel-green": "leaf", "peach": "heart", "pink": "butterfly"}
def icon_of(id_): return ICON_BY_ID.get(id_, "sparkle")
DEFAULT = "classic"
def theme_css():
    """For pages with light + dark modes."""
    out = []
    for id_, _, _m, (bg, pn, p2, ln, ac, ac2), (lbg, lpn, lp2, lln, lac, lfg) in THEMES:
        sel = f'[data-brand="{id_}"]'
        dark = f"--bg:{bg};--panel:{pn};--panel2:{p2};--line:{ln};--accent:{ac};--accent2:{ac2};--accent-fg:#1a1626;--focus:{ac};--glow:{rgba(ac, .16)};--dust:{rgba(ac, .10)}"
        light = f"--bg:{lbg};--panel:{lpn};--panel2:{lp2};--line:{lln};--accent:{lac};--accent2:{accent2_light(ac2, lfg)};--accent-fg:{lfg};--focus:{lac};--glow:{rgba(lac, .10)};--dust:{rgba(lac, .10)};color-scheme:light"
        out += [f":root{sel}{{{dark}}}", f':root[data-theme="dark"]{sel}{{{dark}}}',
                f'@media (prefers-color-scheme:light){{:root:not([data-theme="dark"]){sel}{{{light}}}}}', f':root[data-theme="light"]{sel}{{{light}}}']
    return "\n".join(out)
def app_css():
    """The MathFacts app is dark only."""
    return "\n".join(f':root[data-brand="{t[0]}"] {{ --bg: {t[3][0]}; --panel: {t[3][1]}; --panel2: {t[3][2]}; --amber: {t[3][4]}; --amber2: {t[3][5]}; --amber-dim: {t[3][4]}99; --glow: {rgba(t[3][4], .16)}; --dust: {rgba(t[3][4], .10)}; }}' for t in THEMES)
SWATCH_CSS = """.swatches{display:flex;gap:12px;flex-wrap:wrap;justify-content:center}
.sw{display:flex;flex-direction:column;align-items:center;gap:6px;background:none;border:0;color:var(--muted);font-size:14px;min-width:84px;padding:4px;cursor:pointer;font-family:inherit}
.sw i{width:56px;height:56px;border-radius:16px;border:3px solid transparent;box-shadow:0 0 0 2px var(--line, #3a3354);display:grid;place-items:center;color:#1a1626}
.sw i svg{width:30px;height:30px}.mood svg{width:18px;height:18px;vertical-align:-3px;margin-right:4px;color:var(--amber, var(--accent))}
.sw[aria-pressed=true] i{border-color:var(--bg);box-shadow:0 0 0 3px var(--text, var(--fg))}
.sw[aria-pressed=true]{color:var(--text, var(--fg))}
.grp{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:12px;width:100%}
.mem{background:var(--panel2);border-radius:18px;padding:12px 8px;display:flex;flex-direction:column;align-items:center;gap:6px}
.mname{margin:0;font-family:var(--display);font-weight:700;font-size:18px;color:var(--amber, var(--accent))}
.swatches.six{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:8px;width:100%}.swatches.six .sw{min-width:0}@media (max-width:520px){.swatches.six{grid-template-columns:repeat(3,minmax(0,1fr))}}
.more{width:100%;text-align:center}.more summary{cursor:pointer;color:var(--muted);padding:12px;min-height:48px;font-weight:600}.more .swatches{padding-top:6px}"""

FUN_CSS = """body{background-color:var(--bg);background-image:radial-gradient(900px 420px at 50% -120px,var(--glow),transparent 70%),radial-gradient(var(--dust) 1.4px,transparent 1.9px),radial-gradient(var(--dust) 1.4px,transparent 1.9px);background-size:auto,44px 44px,44px 44px;background-position:0 0,0 0,22px 22px}
.btn.primary,.primary{background:linear-gradient(135deg,var(--accent,var(--amber)),var(--accent2,var(--amber2,var(--accent,var(--amber)))))}
.bar i{background:linear-gradient(90deg,var(--accent,var(--amber)),var(--accent2,var(--amber2,var(--accent,var(--amber)))))}
.dots i.on:nth-child(even){background:var(--accent2,var(--amber2))}
button:active{transform:scale(.98)}
.pressed{transform:scale(.96);filter:brightness(.88);transition:transform .08s ease-out,filter .08s}
@media (prefers-reduced-motion:reduce){.pressed{transform:none}}
.say{position:relative}.burst{position:absolute;left:28px;top:50%;width:0;height:0;pointer-events:none;z-index:2}
.burst i{position:absolute;left:-7px;top:-7px;width:14px;height:14px;clip-path:polygon(50% 0,62% 38%,100% 50%,62% 62%,50% 100%,38% 62%,0 50%,38% 38%)}
@media (prefers-reduced-motion:no-preference){.burst i{animation:fly .85s ease-out forwards}@keyframes fly{from{transform:translate(0,0) scale(.3);opacity:1}to{transform:translate(var(--dx),var(--dy)) scale(1.1);opacity:0}}}
@media (prefers-reduced-motion:reduce){.burst{display:none}}"""
BURST_JS = """function burst(host){ if (!host || matchMedia("(prefers-reduced-motion: reduce)").matches) return; const w = document.createElement("span"); w.className = "burst"; w.setAttribute("aria-hidden", "true");
  for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2 + Math.random() * .5, d = 50 + Math.random() * 60, s = document.createElement("i"); s.style.cssText = `--dx:${Math.cos(a) * d}px;--dy:${Math.sin(a) * d}px;background:${i % 2 ? "var(--accent)" : "var(--accent2, var(--accent))"}`; w.append(s); }
  host.append(w); setTimeout(() => w.remove(), 1000); }"""
def burst_js():
    return BURST_JS
def brands_json():
    return json.dumps([dict(id=t[0], label=t[1], member=t[2], icon=icon_of(t[0]), bg=t[3][0], accent=t[3][4], accent2=t[3][5]) for t in THEMES])
def icons_json():
    return json.dumps(ICONS)
def members_json():
    return json.dumps(MEMBERS)
def write_ts():
    items = ",\n".join(f"  {{ id: '{t[0]}', label: '{t[1]}', member: {repr(t[2]) if t[2] else 'null'}, icon: '{icon_of(t[0])}', bg: '{t[3][0]}', accent: '{t[3][4]}', accent2: '{t[3][5]}' }}" for t in THEMES)
    members = ", ".join(f"'{m}'" for m in MEMBERS)
    (ROOT / "src" / "brand.ts").write_text(f"""// GENERATED by tools/brand_themes.py. Do not edit by hand.
export const MEMBERS = [{members}] as const;\nexport const ICONS: Record<string, string> = {json.dumps(ICONS)};
export const BRANDS = [
{items},
] as const;
export type BrandId = (typeof BRANDS)[number]['id'];
const KEY = 'mathseye.brand';
export function getBrand(): BrandId {{
  try {{ const v = localStorage.getItem(KEY); if (v && BRANDS.some((b) => b.id === v)) return v as BrandId; }} catch {{ /* private mode */ }}
  return '{DEFAULT}';
}}
export function applyBrand(id: BrandId = getBrand()) {{
  document.documentElement.dataset.brand = id;
  const bg = BRANDS.find((b) => b.id === id)?.bg;
  const meta = document.querySelector('meta[name="theme-color"]');
  if (bg && meta) meta.setAttribute('content', bg);
}}
export function setBrand(id: BrandId) {{ try {{ localStorage.setItem(KEY, id); }} catch {{ /* ignore */ }} applyBrand(id); }}
""")
    css = ROOT / "src" / "styles.css"; s = css.read_text(); a, b = "/* BRAND-THEMES START */", "/* BRAND-THEMES END */"
    block = f"{a}\n{app_css()}\n{SWATCH_CSS}\n{FUN_CSS}\n{b}"
    s = (s[:s.index(a)] + block + s[s.index(b) + len(b):]) if a in s else s + "\n" + block + "\n"
    css.write_text(s)
if __name__ == "__main__": write_ts(); print("themes:", [t[0] for t in THEMES])

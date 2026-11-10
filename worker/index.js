// Mathseye server: players' progress (synced by name) and "Flag a problem" notes in Workers KV. Everything else is the static site.
// Older note: stores "Flag a problem" notes in Workers KV for the grown-ups. Everything else is the static site.
// POST /api/feedback        a player's note (open to everyone)
// GET  /api/feedback        list notes, newest first (needs X-Admin-Key if the ADMIN_KEY secret is set)
// DELETE /api/feedback?k=…  remove one note (same key rule)
const json = (o, status = 200) => new Response(JSON.stringify(o), { status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });
const clip = (v, n) => String(v ?? '').slice(0, n);
const isAdmin = (req, env) => !env.ADMIN_KEY || req.headers.get('X-Admin-Key') === env.ADMIN_KEY;

export default {
  async fetch(req, env) {
    const url = new URL(req.url);
    if (url.pathname === '/api/pack') return pack(req, env, url);
    if (url.pathname === '/api/check') return check(req, env);
    if (url.pathname === '/api/img') return img(req, env, url);
    if (url.pathname === '/api/songs') return songs(req, env);
    if (url.pathname === '/api/players' || url.pathname === '/api/player') return players(req, env, url);
    if (url.pathname !== '/api/feedback') return env.ASSETS.fetch(req);
    if (!env.NOTES) return json({ ok: false, error: 'storage not set up' }, 503);

    if (req.method === 'POST') {
      let b;
      try { b = await req.json(); } catch { return json({ ok: false, error: 'bad json' }, 400); }
      const at = new Date().toISOString();
      const id = clip(b.id, 24).replace(/[^a-z0-9]/gi, '') || Math.random().toString(36).slice(2, 10);
      const note = {
        id, at, clientAt: clip(b.at, 40), build: clip(b.build, 80), player: clip(b.player, 40), ref: clip(b.ref, 60),
        text: clip(b.text, 1500), image: clip(b.image, 120), where: clip(b.where, 200), note: clip(b.note, 2000),
        tags: Array.isArray(b.tags) ? b.tags.slice(0, 8).map((t) => clip(t, 60)) : [],
        extra: b.extra && typeof b.extra === 'object' ? JSON.parse(clip(JSON.stringify(b.extra), 600) || '{}') : {},
      };
      const key = `note:${clip(b.at, 40) || at}:${id}`;
      await env.NOTES.put(key, JSON.stringify(note), { expirationTtl: 60 * 60 * 24 * 365 });
      return json({ ok: true, id });
    }

    if (!isAdmin(req, env)) return json({ ok: false, error: 'needs the grown-up key' }, 401);

    if (req.method === 'GET') {
      const keys = (await env.NOTES.list({ prefix: 'note:', limit: 1000 })).keys.map((k) => k.name).sort().reverse().slice(0, 200);
      const notes = (await Promise.all(keys.map(async (k) => { const v = await env.NOTES.get(k); return v ? { key: k, ...JSON.parse(v) } : null; }))).filter(Boolean);
      return json({ ok: true, notes });
    }
    if (req.method === 'DELETE') {
      const k = url.searchParams.get('k') || '';
      if (!k.startsWith('note:')) return json({ ok: false, error: 'bad key' }, 400);
      await env.NOTES.delete(k);
      return json({ ok: true });
    }
    return json({ ok: false, error: 'method not allowed' }, 405);
  },
};

// ---- players: progress saved by name (no password, by the owner's decision). Key = the name, lowercased. ----
const normName = (n) => String(n ?? '').toLowerCase().replace(/[^a-z0-9' -]/g, '').replace(/\s+/g, ' ').trim().slice(0, 20);

async function players(req, env, url) {
  if (!env.NOTES) return json({ ok: false, error: 'storage not set up' }, 503);
  if (url.pathname === '/api/players') {
    // every name saved on the server (the "who's playing" list)
    const list = await env.NOTES.list({ prefix: 'p:', limit: 1000 });
    return json({ ok: true, players: list.keys.map((k) => ({ key: k.name.slice(2), name: k.metadata?.name || k.name.slice(2), updatedAt: k.metadata?.updatedAt || 0 })) });
  }
  if (req.method === 'GET') {
    const key = normName(url.searchParams.get('name'));
    if (!key) return json({ ok: false, error: 'name needed' }, 400);
    const v = await env.NOTES.get('p:' + key);
    return json({ ok: true, player: v ? JSON.parse(v) : null });
  }
  if (req.method === 'PUT') {
    let b;
    try { b = await req.json(); } catch { return json({ ok: false, error: 'bad json' }, 400); }
    const key = normName(b.name);
    if (!key || !b.data || typeof b.data !== 'object') return json({ ok: false, error: 'bad request' }, 400);
    // An older copy of the app does not know every section (e.g. flash cards) and would send a body without it: keep what the server already has for any section the body leaves out.
    let prevData = {}; try { const prev = await env.NOTES.get('p:' + key); if (prev) prevData = (JSON.parse(prev).data) || {}; } catch { /* no previous copy */ }
    const doc = { name: String(b.name).trim().slice(0, 20), updatedAt: Number(b.updatedAt) || Date.now(), rs: b.rs && typeof b.rs === 'object' ? b.rs : {}, data: { ...prevData, ...b.data } };
    const body = JSON.stringify(doc);
    if (body.length > 2_000_000) return json({ ok: false, error: 'too big' }, 413);
    // Safety net: before the first overwrite each hour, keep the previous copy (30 days). Lets us put a player's progress back if anything ever goes wrong.
    const snap = 'ph:' + key + ':' + new Date().toISOString().slice(0, 13).replace(/[-T]/g, '');
    if (!(await env.NOTES.get(snap))) { const prev = await env.NOTES.get('p:' + key); if (prev) await env.NOTES.put(snap, prev, { expirationTtl: 60 * 60 * 24 * 30 }); }
    await env.NOTES.put('p:' + key, body, { metadata: { name: doc.name, updatedAt: doc.updatedAt } });
    return json({ ok: true });
  }
  return json({ ok: false, error: 'method not allowed' }, 405);
}

// ---- homework pack: the real worksheet text. NEVER in the repo. Kept in KV (key `pack:unit-N`) and uploaded by hand
// (mathseye-content/tools/publish_pack.py). The homework page fetches it by itself. Family-and-friends app: no key. ----
async function pack(req, env, url) {
  if (req.method !== 'GET') return json({ ok: false, error: 'method not allowed' }, 405);
  if (!env.NOTES) return json({ ok: false, error: 'storage not set up' }, 503);
  const unit = String(url.searchParams.get('unit') || '').replace(/[^0-9]/g, '');
  if (!unit) return json({ ok: false, error: 'unit needed' }, 400);
  const v = await env.NOTES.get(`pack:unit-${unit}`);
  if (!v) return json({ ok: false, error: 'no pack for that unit yet' }, 404);
  return new Response(v, { headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });
}

// ---- worksheet pictures (cropped from the printed pages; NEVER in the repo). KV key `img:<file>`, uploaded by
// mathseye-content/tools/publish_images.py. The file name is the only thing taken from the request, and only a safe shape is allowed. ----
async function img(req, env, url) {
  if (req.method !== 'GET') return json({ ok: false, error: 'method not allowed' }, 405);
  if (!env.NOTES) return json({ ok: false, error: 'storage not set up' }, 503);
  const f = String(url.searchParams.get('f') || '');
  if (!/^[0-9A-Za-z._-]{3,60}\.(png|jpg)$/.test(f) || f.includes('..')) return json({ ok: false, error: 'bad name' }, 400);
  const v = await env.NOTES.get(`img:${f}`, 'arrayBuffer');
  if (!v) return json({ ok: false, error: 'no such picture' }, 404);
  return new Response(v, { headers: { 'Content-Type': f.endsWith('.jpg') ? 'image/jpeg' : 'image/png', 'Cache-Control': 'public, max-age=3600' } });
}

// ---- song rewards for the practice test (titles only). Kept in KV (key `songs:rewards`), uploaded from the private repo
// (mathseye-content/rewards/songs.json via tools/ship.py), so the titles are not in this public repo. ----
async function songs(req, env) {
  if (req.method !== 'GET') return json({ ok: false, error: 'method not allowed' }, 405);
  if (!env.NOTES) return json({ ok: false, error: 'storage not set up' }, 503);
  const v = await env.NOTES.get('songs:rewards');
  if (!v) return json({ ok: false, error: 'no songs yet' }, 404);
  return new Response(v, { headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });
}

// ---- Homework "Check my work": her typed answer goes in, only "matches" or "not quite yet" comes out. ----
// The real answers live in KV (`check:unit-N`, uploaded by mathseye-content/tools/ship.py) and are NEVER sent to a device (owner rule: the Homework section never gives an answer).
const checkCache = new Map();
async function loadChecks(env, unit) {
  const c = checkCache.get(unit); if (c && Date.now() - c.at < 60_000) return c.v;
  const raw = await env.NOTES.get(`check:unit-${unit}`); const v = raw ? JSON.parse(raw) : null;
  checkCache.set(unit, { at: Date.now(), v }); return v;
}
/** 72, 72%, $72, 1,234, 3/4, 1 1/2, .5, -3 (also the typographic minus) -> a number, or null. */
export function parseTyped(raw) {
  const s = String(raw).trim().replace(/[−–]/g, '-').replace(/[$,%]/g, '').replace(/\s+/g, ' ');
  let m = s.match(/^(-?)(\d+) (\d+)\/(\d+)$/); if (m) return (m[1] ? -1 : 1) * (Number(m[2]) + Number(m[3]) / Number(m[4]));
  m = s.match(/^(-?\d+(?:\.\d+)?)\/(\d+(?:\.\d+)?)$/); if (m) return Number(m[2]) === 0 ? null : Number(m[1]) / Number(m[2]);
  return /^-?(\d+\.?\d*|\.\d+)$/.test(s) ? Number(s) : null;
}
const norm = (t) => String(t).toLowerCase().replace(/[$,%]/g, '').replace(/[^a-z0-9./= ]+/g, ' ').replace(/\s+/g, ' ').trim();
const hasWord = (t, kw) => new RegExp('(^|[^a-z0-9.])' + norm(kw).replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '($|[^a-z0-9.])').test(t);
const eqNorm = (t) => String(t).toLowerCase().replace(/\s+/g, '').replace(/×/g, '*').replace(/[a-z?]/g, 'w');
export function checkOne(spec, typed) {
  if (!spec || spec.t === 'none') return null;
  if (typed == null || String(typed).trim() === '') return false;
  if (spec.t === 'num') {
    const g = parseTyped(typed); if (g === null) return false;
    return spec.v.some((e) => Math.abs(g - e) <= (spec.tol ?? (Math.abs(e) >= 1 ? 0.005 : Math.abs(e) * 0.001)));
  }
  if (spec.t === 'eq') {
    const g = eqNorm(typed), swap = (x) => x.split('=').reverse().join('=');
    return spec.v.some((e) => { const w = eqNorm(e); return g === w || g === swap(w); });
  }
  const t = norm(typed);
  if (spec.v.some((a) => norm(a) === t)) return true;
  return !!(spec.any && spec.any.length && spec.any.every((group) => group.some((kw) => hasWord(t, kw))));
}
async function check(req, env) {
  if (req.method !== 'POST') return json({ ok: false, error: 'method not allowed' }, 405);
  let b; try { b = await req.json(); } catch { return json({ ok: false, error: 'bad json' }, 400); }
  const unit = Number(b.unit), id = String(b.id || ''), parts = Array.isArray(b.parts) ? b.parts.slice(0, 8).map((x) => String(x).slice(0, 80)) : [];
  if (!Number.isInteger(unit) || unit < 1 || unit > 99 || !id || id.length > 20) return json({ ok: false, error: 'bad request' }, 400);
  const all = await loadChecks(env, unit); const spec = all && all[id];
  if (!spec) return json({ ok: true, auto: false });
  const specs = spec.p || [spec];
  const res = specs.map((sp, i) => checkOne(sp, parts[i]));
  if (res.every((r) => r === null)) return json({ ok: true, auto: false });
  return json({ ok: true, auto: true, parts: res, result: res.every((r) => r === null || r === true) });
}

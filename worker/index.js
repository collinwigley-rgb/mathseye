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
        text: clip(b.text, 1500), where: clip(b.where, 200), note: clip(b.note, 2000),
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
    const doc = { name: String(b.name).trim().slice(0, 20), updatedAt: Number(b.updatedAt) || Date.now(), rs: b.rs && typeof b.rs === 'object' ? b.rs : {}, data: b.data };
    const body = JSON.stringify(doc);
    if (body.length > 2_000_000) return json({ ok: false, error: 'too big' }, 413);
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

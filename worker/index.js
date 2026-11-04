// Mathseye server: stores "Flag a problem" notes in Workers KV for the grown-ups. Everything else is the static site.
// POST /api/feedback        a player's note (open to everyone)
// GET  /api/feedback        list notes, newest first (needs X-Admin-Key if the ADMIN_KEY secret is set)
// DELETE /api/feedback?k=…  remove one note (same key rule)
const json = (o, status = 200) => new Response(JSON.stringify(o), { status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });
const clip = (v, n) => String(v ?? '').slice(0, n);
const isAdmin = (req, env) => !env.ADMIN_KEY || req.headers.get('X-Admin-Key') === env.ADMIN_KEY;

export default {
  async fetch(req, env) {
    const url = new URL(req.url);
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

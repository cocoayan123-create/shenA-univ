// 深A女性向大学 — Cloudflare Worker 入口
//
// 静态资源由 Cloudflare 资源层「优先」服务：所有页面（index.html / apply.html …）
// 仍按原来的干净 URL 直接命中，不经过这里。
// 本 Worker 只接管 /api/*：把课程互动 + 在册计数搬到 Cloudflare D1（同域、国内无需 VPN 可达，
// 取代被墙的 supabase.co）。其余请求回退给资源层。
// D1 无免费休眠问题，故不再需要保活 cron。

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};
const J = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', ...CORS },
  });
const s = (v, n) => String(v == null ? '' : v).slice(0, n);

async function handleApi(request, env, url) {
  if (request.method === 'OPTIONS') return new Response(null, { headers: CORS });
  if (!env.DB) return J({ error: 'db unbound' }, 500);
  const p = url.pathname;
  const body = request.method === 'POST' ? await request.json().catch(() => ({})) : {};
  try {
    if (p === '/api/gen_count') {
      const r = await env.DB.prepare('SELECT COUNT(*) AS n FROM generations').first();
      return J(r ? r.n : 0);
    }
    if (p === '/api/gen') {
      const r = await env.DB
        .prepare('INSERT INTO generations (kind, anon_id) VALUES (?,?) RETURNING id')
        .bind(s(body.kind || 'gen', 40), s(body.anon_id, 80))
        .first();
      return J({ seq: r ? r.id : null });
    }
    if (p === '/api/stats') {
      const cid = s(body.cid, 80);
      const ck = await env.DB.prepare('SELECT COUNT(*) AS n FROM checkins WHERE course_id=?').bind(cid).first();
      const cm = await env.DB.prepare('SELECT COUNT(*) AS n FROM comments WHERE course_id=?').bind(cid).first();
      const rt = await env.DB.prepare('SELECT COUNT(*) AS n, AVG(stars) AS a FROM ratings WHERE course_id=?').bind(cid).first();
      return J({
        checkin_count: ck.n,
        comment_count: cm.n,
        rating_count: rt.n,
        rating_avg: rt.a != null ? Math.round(rt.a * 10) / 10 : null,
      });
    }
    if (p === '/api/checkin') {
      await env.DB
        .prepare('INSERT OR IGNORE INTO checkins (course_id, anon_id) VALUES (?,?)')
        .bind(s(body.course_id, 80), s(body.anon_id, 80))
        .run();
      return J({ ok: true });
    }
    if (p === '/api/rate') {
      const stars = Math.max(1, Math.min(5, parseInt(body.stars, 10) || 0));
      await env.DB
        .prepare('INSERT INTO ratings (course_id, anon_id, stars) VALUES (?,?,?) ON CONFLICT(course_id,anon_id) DO UPDATE SET stars=excluded.stars')
        .bind(s(body.course_id, 80), s(body.anon_id, 80), stars)
        .run();
      return J({ ok: true });
    }
    if (p === '/api/comments') {
      const rs = await env.DB
        .prepare('SELECT body, created_at FROM comments WHERE course_id=? ORDER BY id DESC LIMIT 200')
        .bind(s(url.searchParams.get('cid'), 80))
        .all();
      return J(rs.results || []);
    }
    if (p === '/api/comment') {
      const txt = s(body.body, 500).trim();
      if (!txt) return J({ error: 'empty' }, 400);
      await env.DB
        .prepare('INSERT INTO comments (course_id, body, anon_id) VALUES (?,?,?)')
        .bind(s(body.course_id, 80), txt, s(body.anon_id, 80))
        .run();
      return J({ ok: true });
    }
    return J({ error: 'not found' }, 404);
  } catch (e) {
    return J({ error: String((e && e.message) || e) }, 500);
  }
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname.startsWith('/api/')) return handleApi(request, env, url);
    return env.ASSETS.fetch(request);
  },
};

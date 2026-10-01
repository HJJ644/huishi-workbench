/* Supabase 服务端代理（v1.11.1）
 * 背景：国内网络无法直连 *.supabase.co（DNS 被污染），但本站（Vercel）可达。
 * 前端 supabase-js 配置自定义 fetch，把请求改写到 /api/sb?p=<path>，由这里转发。
 *
 * 需要环境变量（Vercel Project Settings → Environment Variables）：
 *   SUPABASE_URL      如 https://xxxx.supabase.co
 *   SUPABASE_ANON_KEY publishable key（sb_publishable_... 或 eyJ...）
 *
 * 安全说明：本接口只做透明转发（方法/头/体原样传递），匿名 key 由服务端注入；
 * 用户身份靠客户端携带的 Authorization: Bearer <user_jwt> 透传，配合数据库 RLS 隔离，
 * 任何用户只能读写自己的行。 */
const SB_URL = (process.env.SUPABASE_URL || '').trim().replace(/\/$/, '');
const SB_KEY = (process.env.SUPABASE_ANON_KEY || '').trim();

module.exports = async (req, res) => {
  if (!SB_URL || !SB_KEY) {
    res.status(500).json({ error: 'server_not_configured', hint: 'Vercel 需配置 SUPABASE_URL 与 SUPABASE_ANON_KEY' });
    return;
  }
  const p = (req.query && req.query.p) || '';
  if (!p || !/^[\w\-./?=&%,~:]*$/.test(p)) {
    res.status(400).json({ error: 'bad_path' });
    return;
  }
  const target = SB_URL + '/' + p;

  const headers = {
    'Content-Type': req.headers['content-type'] || 'application/json',
    'apikey': SB_KEY
  };
  // supabase-js 对已登录请求自带 Authorization: Bearer <user_jwt>，必须透传（RLS 依赖）
  headers['Authorization'] = req.headers['authorization'] || ('Bearer ' + SB_KEY);
  // 透传 PostgREST 语义头：upsert 依赖 Prefer: resolution=merge-duplicates，丢了会退化为纯 INSERT 撞主键 409
  ['prefer', 'accept', 'content-profile', 'accept-profile', 'range'].forEach(h => {
    const v = req.headers[h];
    if (v) headers[h] = Array.isArray(v) ? v.join(', ') : v;
  });

  let body;
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    const chunks = [];
    for await (const c of req) chunks.push(c);
    if (chunks.length) body = Buffer.concat(chunks);
  }

  try {
    const r = await fetch(target, {
      method: req.method,
      headers,
      body
    });
    const txt = await r.text();
    res.statusCode = r.status;
    res.setHeader('Content-Type', r.headers.get('content-type') || 'application/json');
    res.send(txt);
  } catch (e) {
    const cause = e && e.cause ? (' / cause: ' + (e.cause.code || e.cause.message || e.cause)) : '';
    res.status(502).json({ error: 'upstream_error', detail: String(e && e.message || e) + cause, targetHost: SB_URL.replace(/^https:\/\//, '') });
  }
};

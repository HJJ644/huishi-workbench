/* Vercel Serverless：校验邮箱验证码（服务端比对，验证码不落前端） */
const crypto = require('crypto');
function secret() { return process.env.VCODE_SECRET || 'huishi-vcode-dev-secret'; }
function sign(payload) { return crypto.createHmac('sha256', secret()).update(payload).digest('base64url'); }
function safeEq(a, b) {
  a = String(a || ''); b = String(b || '');
  if (a.length !== b.length) return false;
  let d = 0;
  for (let i = 0; i < a.length; i++) d |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return d === 0;
}
function allowOrigin(req) {
  const o = req.headers && req.headers.origin;
  if (!o) return '*';
  const list = (process.env.ALLOWED_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean);
  try {
    const h = new URL(o).hostname;
    if (list.indexOf(o) >= 0) return o;
    if (h === 'localhost' || h === '127.0.0.1') return o;
    if (h.endsWith('.vercel.app')) return o;
  } catch (e) {}
  return list[0] || o;
}

module.exports = async function handler(req, res) {
  const ao = allowOrigin(req);
  res.setHeader('Access-Control-Allow-Origin', ao);
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Vary', 'Origin');
  if (req.method === 'OPTIONS') { res.status(204).end(); return; }
  if (req.method !== 'POST') { res.status(405).json({ ok: false, msg: '仅支持 POST' }); return; }

  let body = req.body;
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch (e) { body = {}; } }
  body = body || {};
  const email = String(body.email || '').trim();
  const code = String(body.code || '').trim();
  const token = String(body.token || '');
  if (!token) { res.status(400).json({ ok: false, msg: '请先获取验证码' }); return; }

  const idx = token.lastIndexOf('.');
  if (idx < 0) { res.status(400).json({ ok: false, msg: '凭证无效，请重新获取验证码' }); return; }
  const payload = token.slice(0, idx), sig = token.slice(idx + 1);
  if (!safeEq(sig, sign(payload))) { res.status(400).json({ ok: false, msg: '凭证无效，请重新获取验证码' }); return; }

  let data;
  try { data = JSON.parse(Buffer.from(payload, 'base64').toString('utf8')); }
  catch (e) { res.status(400).json({ ok: false, msg: '凭证无效，请重新获取验证码' }); return; }

  if (String(data.e || '') !== email) { res.status(400).json({ ok: false, msg: '验证码与邮箱不匹配，请重新获取' }); return; }
  if (Date.now() > Number(data.x || 0)) { res.status(400).json({ ok: false, msg: '验证码已过期，请重新获取' }); return; }
  if (!safeEq(data.c, code)) { res.status(200).json({ ok: false, msg: '验证码不正确' }); return; }

  res.status(200).json({ ok: true });
};

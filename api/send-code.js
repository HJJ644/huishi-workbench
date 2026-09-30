/* Vercel Serverless：发送邮箱验证码
   环境变量（Vercel 项目 → Settings → Environment Variables）：
     EMAILJS_SERVICE_ID   必填
     EMAILJS_TEMPLATE_ID  必填
     EMAILJS_PRIVATE_KEY  推荐（服务端私钥）
     EMAILJS_PUBLIC_KEY   可留空（无私钥时用它）
     VCODE_SECRET         可选，验证码签名密钥（多实例部署建议设置）
     ALLOWED_ORIGINS      可选，逗号分隔的允许来源域名，如 https://xxx.vercel.app
   说明：验证码不会返回给前端，只返回一个 HMAC 签名 token，校验在服务端完成。
*/
const crypto = require('crypto');
const TTL = 5 * 60 * 1000;
/* 环境变量在每次请求时读取，便于部署后修改配置立即生效 */
function cfg() {
  return {
    service:  process.env.EMAILJS_SERVICE_ID  || '',
    template: process.env.EMAILJS_TEMPLATE_ID || '',
    privkey:  process.env.EMAILJS_PRIVATE_KEY || '',
    pubkey:   process.env.EMAILJS_PUBLIC_KEY  || '',
    secret:   process.env.VCODE_SECRET        || 'huishi-vcode-dev-secret'
  };
}

/* 简易内存限流（按实例生效，够挡普通刷量） */
const hits = new Map();
function allow(key, max, win) {
  const now = Date.now();
  const arr = (hits.get(key) || []).filter(t => now - t < win);
  arr.push(now);
  hits.set(key, arr);
  if (hits.size > 5000) hits.clear();
  return arr.length <= max;
}

function b64url(s) { return Buffer.from(s).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); }
function sign(payload, secret) { return crypto.createHmac('sha256', secret).update(payload).digest('base64url'); }

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
  const purpose = String(body.purpose || '验证码');
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    res.status(400).json({ ok: false, msg: '邮箱格式不正确' }); return;
  }
  const ip = (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || 'unknown';
  if (!allow('email:' + email, 1, 60 * 1000)) { res.status(429).json({ ok: false, msg: '发送太频繁，请 60 秒后再试' }); return; }
  if (!allow('email10:' + email, 5, 10 * 60 * 1000)) { res.status(429).json({ ok: false, msg: '该邮箱请求过多，请稍后再试' }); return; }
  if (!allow('ip:' + ip, 40, 60 * 60 * 1000)) { res.status(429).json({ ok: false, msg: '请求过于频繁，请稍后再试' }); return; }

  const c = cfg();
  if (!c.service || !c.template || !(c.privkey || c.pubkey)) {
    res.status(500).json({ ok: false, msg: '服务端未配置 EmailJS 环境变量' }); return;
  }
  const code = String(Math.floor(100000 + Math.random() * 900000));
  const sendBody = {
    service_id: c.service,
    template_id: c.template,
    template_params: {
      to_email: email,
      code,
      time: new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' }),
      purpose
    }
  };
  if (c.privkey) sendBody.accessToken = c.privkey; else sendBody.user_id = c.pubkey;

  try {
    const r = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(sendBody)
    });
    if (!r.ok) {
      const t = await r.text().catch(() => '');
      console.error('emailjs fail', r.status, t);
      res.status(502).json({ ok: false, msg: '邮件服务发送失败，请稍后再试' }); return;
    }
  } catch (e) {
    console.error('emailjs error', e);
    res.status(502).json({ ok: false, msg: '无法连接邮件服务' }); return;
  }

  const payload = b64url(JSON.stringify({ e: email, c: code, x: Date.now() + TTL }));
  res.status(200).json({ ok: true, token: payload + '.' + sign(payload, c.secret), ttl: TTL });
};

# 部署说明（GitHub + Vercel + 后端验证码）

站点是静态单页（`index.html`）+ 两个 Node Serverless 函数（`api/` 目录），零构建、零依赖。

## 一、Vercel 导入 GitHub 仓库

1. 把本目录推到你的 GitHub 仓库（仓库名随意）
2. 打开 https://vercel.com/new → **Import Git Repository** → 选该仓库
3. Framework 留空（`null`）/ 选 Other，其余默认 → **Deploy**
4. 之后每次 `git push` 到 GitHub，Vercel 自动重新部署

## 二、必须配置的环境变量

Vercel 项目 → **Settings → Environment Variables**，逐条添加（填完记得 Redeploy）：

| 变量名 | 说明 |
|---|---|
| `EMAILJS_SERVICE_ID` | EmailJS 的 Service ID（`service_` 开头） |
| `EMAILJS_TEMPLATE_ID` | EmailJS 的 Template ID（`template_` 开头） |
| `EMAILJS_PRIVATE_KEY` | **推荐**：EmailJS Account 页的 Private Key（服务端专用，不要填 Public Key） |
| `EMAILJS_PUBLIC_KEY` | 没有 Private Key 时才填，二者留其一即可 |
| `VCODE_SECRET` | 可选，验证码签名密钥（一串随机字符）；多实例部署建议设置，否则用内置默认值 |
| `ALLOWED_ORIGINS` | 可选，额外允许调用接口的前端来源，逗号分隔，如 `https://xxx.vercel.app` |

> 环境变量只存在服务端，**不会出现在页面源码里**。前端只需调用同域 `/api/send-code`、`/api/verify-code`。

## 三、验证码的后端流程

1. `POST /api/send-code` `{email, purpose}` → 服务端生成 6 位码 → 调 EmailJS 发送 → 只返回 **HMAC 签名 token**（验证码本身不下发到前端）
2. `POST /api/verify-code` `{email, code, token}` → 服务端校验签名、有效期、比对验证码 → 返回 `{ok:true/false}`
3. 内置限流：同一邮箱 60 秒 1 次、10 分钟 5 次；同一 IP 每小时 40 次

前端会按环境自动选择模式：
- **线上（http/https）** → 后端接口模式（默认）
- **本地 `file://` 打开** → 本地直发模式（用页面里填的 EmailJS 三件套）
- **都没配置** → 开发模式（验证码弹窗显示，仅供测试）

想在线上强制走本地直发：个人设置 → 用户信息 → 邮箱验证码服务 →「后端接口地址」填 `off`。

## 四、本地跑一遍后端（可选）

```bash
npm i -g vercel
vercel dev        # 会读 .env.local，按提示登录一次即可
# 然后访问 http://localhost:3000
```

## 五、注意事项

- 数据仍存在浏览器 `localStorage`，按登录邮箱隔离，**换域名 / 换端口会被当成新环境**。上线后请固定用同一个地址访问，需要迁移数据用顶栏「导出数据 / 导入数据」。
- 仓库里的 `huishi-restore.json`（个人数据备份）已在 `.gitignore` 中排除，不会上传。

## 六、绑定自己的域名（以 lambstar.top 为例）

Vercel 免费版支持自定义域名（含根域名，不限量），接入后自动签发 HTTPS 证书，无需再续原来的阿里云服务器。

1. Vercel 项目 → **Settings → Domains → Add Domain**，填入：
   - `lambstar.top`（根域名）
   - `www.lambstar.top`（建议一并加，避免少一个入口）
2. 页面会给出需要添加的 DNS 记录。**到阿里云「云解析 DNS」控制台**（注意是 DNS，不是 ECS），把原来指向过期阿里云服务器的记录删掉 / 改掉，换成：

   | 主机记录 | 记录类型 | 记录值 |
   |---|---|---|
   | `@`（或留空） | **A** | `76.76.21.21` |
   | `www` | **CNAME** | `cname.vercel-dns.com` |
   | `_vercel` | **TXT**（验证用，按 Add Domain 后的提示填内容） | 页面给出的内容 |

   > 根域名用 **A 记录**指向 `76.76.21.21`（Vercel 全球边缘），子域名用 CNAME。TXT 验证记录按网页提示照搬即可。
3. 等 DNS 生效（通常几分钟，最多几十分钟），浏览器打开 `https://lambstar.top` 即可访问。Vercel 会自动把 `www` 重定向到根域名并签发证书。

> 换到自定义域名后，浏览器 `localStorage` 按 `origin`（域名）隔离：原来在 `file://` 或旧地址下的订单数据**不会**自动跟过来。上线后请固定用 `https://lambstar.top` 访问，旧数据用顶栏「导出数据 / 导入数据」迁移。

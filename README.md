# 绘事工作台

画师约稿管理工具，支持订单管理、排期日历、制品库、费用配置与数据概览。

## 技术栈

- React 19 + TypeScript
- Vite 8
- Tailwind CSS 4
- React Router
- Recharts（图表）
- date-fns（日期处理）
- Lucide React（图标）
- Supabase（云同步，按需加载）

## 本地开发

```bash
npm install
npm run dev
```

## 构建

```bash
npm run build
```

构建产物输出到 `dist/` 目录。除 `index.html` 外会额外生成一份内容相同的 `404.html`，供 GitHub Pages 做 SPA 路由兜底。

## 部署

### Vercel（推荐）

1. 将本项目推送到 GitHub。
2. 登录 [Vercel](https://vercel.com)，点击 **Add New Project** 并选择该仓库。
3. Vercel 会自动识别 Vite 项目，直接 Deploy 即可。
4. 部署后会得到一个免费的 `*.vercel.app` 域名；若日后想用自己的域名，在 Settings → Domains 中绑定。

> 项目已包含 `vercel.json`，用于支持 React Router 的前端路由刷新。

### GitHub Pages（可选备份站点）

1. 推送代码后，在仓库 **Settings → Pages → Source** 选择 **GitHub Actions**。
2. 每次推送到 `main` 会触发 `.github/workflows/deploy.yml` 自动构建发布。
3. 站点地址形如 `https://<用户名>.github.io/<仓库名>/`。构建时工作流会通过 `BASE_PATH` 环境变量自动注入子路径，无需手动改配置。

## 云同步

数据默认保存在浏览器 `localStorage`，刷新不会丢失。开启云同步后可跨设备使用：

1. 在 [Supabase](https://supabase.com) 创建免费项目，进入 **SQL Editor** 执行「设置 → 云同步」里提供的建表 SQL。
2. 在项目 **Settings → API** 复制 Project URL 和 anon public key。
3. 回到本站「设置 → 云同步」填入并保存。
4. 通过侧边栏「云同步」注册或登录邮箱账号，数据会自动备份；换设备登录即可拉取。

Supabase SDK 采用动态导入，未配置云同步时不会下载，不占用首屏体积。

> 部署上线后，记得把站点地址填到 Supabase 后台 **Authentication → URL Configuration → Site URL**，否则邮箱验证链接会跳回 localhost。

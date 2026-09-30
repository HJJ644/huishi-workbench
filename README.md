# 美工接单助手（meigong-assistant）

设计师 / 画师约稿管理网站，喜茶式手绘涂鸦视觉风格。主体是单文件 `index.html`（CSS/JS 全内联），零构建；另有 `api/` 下两个 Serverless 函数负责邮箱验证码。

## 特性
- 约稿订单管理、客户管理、作品仓库、收据小票、概览统计。
- 自定义订单模板（字段可加「逻辑设置」：选某选项→显示后续题 / 跳转并聚焦指定题）。
- 首页真实黄历（建除十二神 + 宜忌）与运势签。
- 多套主题切换（含喜茶手绘风 `sketch`）。
- 数据存浏览器 `localStorage`，**按登录邮箱分账户**；支持导出 / 导入 JSON 备份。
- 注册与修改密码走**邮箱验证码**：线上部署时由后端接口发信与校验，密钥不落前端。

## 本地预览
```bash
python -m http.server 8100 --directory .
# 打开 http://127.0.0.1:8100/index.html
```
> 注意：数据绑定到「源(origin)」。想保留数据请固定用同一个地址（同一端口 / 同一域名），不要双击 `file://` 打开。

## 部署到 GitHub + Vercel
1. **推到 GitHub**：把本目录推到你自己的仓库。
2. **Vercel 导入**：打开 https://vercel.com/new → Import Git Repository → 选该仓库 → Framework 留空 → Deploy。
3. **配置环境变量**（必须）：见 [DEPLOY.md](./DEPLOY.md)，至少填 `EMAILJS_SERVICE_ID`、`EMAILJS_TEMPLATE_ID`、`EMAILJS_PRIVATE_KEY`。
4. **绑定自有域名**（可选）：Vercel 项目 → Settings → Domains → 添加域名，按提示加一条 `CNAME` 指向 `cname.vercel-dns.com`。

## 数据说明
数据仍存放在浏览器本地，**没有云端同步**。换设备 / 换浏览器数据不互通；请用顶栏「导出数据」定期备份。

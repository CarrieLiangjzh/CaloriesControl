# 热量控制（web）

Vite + TypeScript（无 React）。四个 Tab + 主屏幕 Manifest + 快捷指令回跳 + 饮食日记 + 建议引擎 + 周训练清单。

## 本机预览

```bash
cd web
npm install
npm run dev
```

电脑浏览器打开终端里的 Local 地址。要在 **iPhone 同一 Wi-Fi** 试：用终端打印的 Network 地址（例如 `http://192.168.x.x:5173`），必须用 **Safari** 打开，不要用微信。

`vite.config.ts` 已设 `server.host: true`。

局域网 `http` 只能看界面和手填；相机、主屏幕独立窗口、快捷指令回跳需要 **HTTPS** 部署。

## 构建静态站

```bash
npm test
npm run build
```

产物在 `web/dist/`。

## GitHub Pages（免费 HTTPS）

推送到 `main` 后，Actions 会构建并发布。站点地址：

`https://carrieliangjzh.github.io/CaloriesControl/`

工程已设 `base: './'`，适合项目站点路径。日记和 API Key 仍只存在手机浏览器，不会进 GitHub。

免费档要求仓库为 **公开**（源代码可见；个人数据不在仓库里）。

第一次：仓库 Settings → Pages → Build and deployment → Source 选 **GitHub Actions**（若工作流已跑过通常会自动选上）。

## 加到主屏幕（部署 HTTPS 之后）

Safari 打开站点 → 分享 → 添加到主屏幕，名称「热量控制」。打开后应没有 Safari 地址栏。

## 路由

| 路径 | 页面 |
|---|---|
| `#/today` | 今日（目标、建议、手表） |
| `#/food` | 饮食（拍照 / 相册 / 手填；确认后再写入） |
| `#/workout` | 本周训练清单 |
| `#/profile` | 我的 |
| `#/sync?activeKcal=&date=&workouts=` | 快捷指令回跳 |

# Gemini

浏览器直连 `gemini-2.5-flash`。Key 存在本机 `localStorage`，请求不经过自建后端。

- 最长边压缩到 1280，JPEG 质量 0.82；照片不落盘
- 食物识别：菜名、克数、热量、宏量、confidence
- 建议润色：只改中文 `detail`，不改 `action` / `reason`
- 无 Key、额度用尽或失败时：手填饮食 + 规则建议仍可用

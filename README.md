# Explain This - AI 网页解释助手

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
![Chrome Extension](https://img.shields.io/badge/Chrome-Extension-blue)

一个轻量的 Chrome 扩展：划词即解释，支持多 API、双语界面、极速/详细模式、数学符号适配、历史缓存与安全过滤。

---

## 功能特性

- **划词即解释**：网页选中内容后弹出浮动按钮，一键解释。
- **快捷键固定**：`Ctrl/Cmd + E` 快速打开解释弹窗。
- **双语 UI**：界面可切换中/英文（与解释语言同步）。
- **多 API 支持**：DeepSeek / Gemini 切换，独立 API Key。
- **极速/详细模式**：极速版更短更快，详细版更完整。
- **数学符号适配**：`\( \)`、`\[ \]`、`\frac`、上下标等格式渲染。
- **历史与缓存**：本地缓存，命中后直接展示，最近 5 条可展开。
- **安全输出**：模型输出经过 HTML 转义 + 白名单过滤。
- **暗色模式**：自动跟随系统主题。

---

## 安装使用（开发者模式）

1. 下载本仓库源码（或 `git clone`）。
2. 打开 Chrome 浏览器，访问 `chrome://extensions/`。
3. 开启右上角“开发者模式”。
4. 点击“加载已解压的扩展程序”，选择项目根目录。
5. 插件图标出现在工具栏，点击即可使用。

---

## 配置说明

1. 点击插件图标 → 右上角 ⚙️ 进入设置。
2. 选择服务商（DeepSeek 或 Gemini）。
3. 填入对应 API Key，点击“测试连接”验证。
4. 保存后即可使用。

---

## 使用提示

- **语言切换**：弹窗右侧语言按钮（ZH/EN）。
- **速度切换**：速度开关（快/详）。
- **历史记录**：结果区域下方“最近记录”，点击展开查看缓存解释。

---

## 安全性说明

- 模型输出经过 **HTML 转义 + 白名单过滤**。
- 仅允许有限标签与 class 渲染（`strong/em/code/br/span/div/sub/sup`）。
- 建议不要在输出中插入可执行脚本或外部链接。

---

## 技术栈

- **核心语言**：JavaScript (ES6+)
- **扩展 API**：Chrome Extensions (Manifest V3)
- **样式**：CSS3（布局、过渡、暗色）
- **AI 服务**：DeepSeek API / Gemini API
- **存储**：`chrome.storage.local`

---

## 项目结构

- `manifest.json`：扩展清单
- `content.js`：网页划词与浮动按钮
- `popup.html` / `popup.js` / `styles.css`：主弹窗 UI
- `settings.html` / `settings.js`：设置页 UI
- `api-service.js`：AI 请求与格式化渲染
- `background.js`：后台脚本

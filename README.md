# Explain This - AI 网页解释助手

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
![Chrome Web Store](https://img.shields.io/badge/Chrome-Extension-blue)

一个轻量级的 Chrome 扩展，让你在浏览网页时随时划词选中不懂的内容，通过 AI 获得通俗易懂的解释。支持快捷键、自动填充、多种动画效果。

![演示截图](screenshots/demo.png) <!-- 建议放一张界面截图或 GIF -->

---

## 功能特性

- **划词即解释**：在任意网页选中文字，自动弹出浮动按钮，点击即可调用 AI 解释。
- **优雅的动画**：按钮出现时有淡入上浮效果，悬停时放大并提升阴影，反馈细腻。
- **快捷键支持**：选中文字后按 `Ctrl+E`（Mac：`Cmd+E`）快速打开解释弹窗。
- **自动填充**：点击按钮或使用快捷键，选中的文字自动填充到输入框，无需粘贴。
- **设置面板**：可配置 DeepSeek API 密钥，查看使用统计。
- **暗色模式**：跟随系统主题自动切换深/浅色界面。
- **历史记录**：自动保存最近 10 次查询（本地存储）。

---

## 🚀 安装使用

### 从源码安装（开发者模式）
1. 下载本仓库源码（或 `git clone`）。
2. 打开 Chrome 浏览器，访问 `chrome://extensions/`。
3. 开启右上角的“开发者模式”。
4. 点击“加载已解压的扩展程序”，选择项目文件夹。
5. 插件图标将出现在工具栏，点击即可使用。

### 从 Chrome 商店安装（即将上架）
*待上架后提供链接*

---

## 🛠️ 技术栈

- **核心语言**：JavaScript (ES6+)
- **扩展 API**：Chrome Extensions (Manifest V3)
- **样式**：CSS3 (Flexbox, 过渡动画, 暗色模式)
- **AI 服务**：DeepSeek API (支持替换其他 API)
- **存储**：`chrome.storage.local`

---

## 📸 屏幕截图

| 划词按钮 | 解释弹窗 | 设置页面 |
|---------|---------|---------|
| ![button](screenshots/button.png) | ![popup](screenshots/popup.png) | ![settings](screenshots/settings.png) |

*(请将截图放入仓库的 `screenshots/` 文件夹，并替换文件名)*

---

## 🔧 配置说明

1. 点击插件图标 → 右上角 ⚙️ 进入设置。
2. 在 [DeepSeek 官网](https://platform.deepseek.com/) 注册并创建 API Key。
3. 将密钥粘贴到设置页面，点击“测试连接”验证。
4. 保存后即可开始使用。

---

## 🧩 项目结构

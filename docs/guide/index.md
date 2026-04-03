# 什么是 easy-live2d

`easy-live2d` 是一个围绕 `Live2DSprite` 封装的 Live2D Web 库，将常见的 Live2D 接入流程压缩为简洁的用户 API。

面向业务侧需要关心的公开入口：

- `Live2DSprite`：加载模型、加入 Pixi 舞台、响应点击和拖拽、播放动作和表情、控制语音。
- `Config`：全局运行配置，如鼠标跟随、idle 动作组、日志级别、视图边界。
- `CubismSetting`：手动提供 `model3.json` 内容或重写资源 URL 时使用。

## 解决什么问题

直接使用官方 Cubism Web SDK，你需要自己组织模型资源、初始化渲染上下文、做坐标换算、管理命中检测、处理动作与表情，再和 Pixi.js 拼接起来。`easy-live2d` 的核心价值：

- 把模型包装成一个 Pixi `Sprite`，融入已有的 Pixi 渲染流程。
- 用少量 API 覆盖常见交互需求。
- 保留对模型路径、资源重写和全局行为的控制权。

## 使用模型

1. 你创建 Pixi `Application` 和 `canvas`。
2. 在页面入口引入官方 `live2dcubismcore.js`。
3. 创建 `Live2DSprite`，传入 `modelPath` 或 `modelSetting`。
4. 加入 `app.stage`，通过 `onLive2D('ready')` 监听模型就绪。

它更像一个"以 Pixi 为宿主的 Live2D 组件"，而非接管整个渲染生命周期的独立框架。

## 适用场景

- 在 Pixi.js 项目中快速接入 Live2D 角色。
- 需要命中区域点击、拖拽、动作切换、表情切换、语音播放等基础交互。
- 在 Vue、React 等 CSR 前端项目里复用同一套渲染封装。

## 运行前提

- 浏览器环境（依赖 `document`、`fetch`、`Image`、`ResizeObserver`、`AudioContext`）。
- Pixi.js + WebGL。
- Live2D 官方 Core 脚本。

不适合在 SSR 阶段执行，需在客户端生命周期中初始化。

## 许可说明

- 本仓库代码许可证：`MPL-2.0`。
- Live2D Cubism Core 和模型资源遵循各自的官方许可与分发要求。

下一步：[安装配置](/guide/installation) → [快速开始](/guide/getting-started)。

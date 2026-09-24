<div align="center">
  <p align="center">
      <img src="https://github.com/user-attachments/assets/4ebc2d19-2ebe-4490-b214-e6ac8b350ce0" alt="easy-live2d" width="300px">
  </p>

  <h1>easy-live2d</h1>

让 Live2D 集成更简单！一个基于 Pixi.js 轻量、开发者友好的 Live2D Web SDK 封装库。

让你的 Live2D 和操控 pixi sprite 一样简单！

  <div align="center">
      <img src="https://img.shields.io/badge/node-%5E18.0.0%20%7C%7C%20%3E%3D20.0.0-brightgreen" alt="Node.js">
      <img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="license">
  </div>
</div>

中文 | [English](README.md)

[使用文档](https://panzer-jack.github.io/easy-live2d/) · [在线演示](https://stackblitz.com/~/github.com/Panzer-Jack/easy-live2d-playground?file=src/App.vue)

## 简介

`easy-live2d` 将 Live2D 模型封装成 Pixi.js 的 `Sprite`。你可以把角色加入已有舞台，控制位置、尺寸和缩放，并通过统一 API 加载模型、播放动作、切换表情、处理点击与拖动。

- 支持 `modelPath` 和 `CubismSetting` 两种资源接入方式，可自定义资源 URL。
- 支持动作优先级、表情、鼠标跟随、物理效果及模型参数控制。
- 支持语音播放与口型同步，多模型的语音和资源独立管理。
- 提供 TypeScript 类型、ESM 和 CommonJS 产物。

## 安装

```bash
pnpm add easy-live2d pixi.js
# 或 npm install easy-live2d pixi.js
# 或 yarn add easy-live2d pixi.js
```

## 运行要求

- **Pixi.js 8**，本项目使用 8.17.1 验证。
- 支持 **WebGL 2** 的浏览器；不支持 WebGL 1 或 WebGPU 渲染。
- **Cubism 5 SDK for Web R5** 的官方 Core，以及模型的 `model3.json`、`.moc3`、纹理和相关资源。

库内已包含配套 Framework 和着色器，Core 需要按 [Live2D 官方许可下载](https://www.live2d.com/en/sdk/download/web/)并单独引入。Core 与库必须配套使用；从旧版升级请参阅 [R5 迁移指南](docs/guide/cubism-r5-migration.md)。

**旧版兼容：** 如果需要继续使用旧版 Cubism Core SDK，请将 easy-live2d 回退并固定为 `0.4.4`，搭配项目原先验证可用的 Core；不要与 1.0.0 混用。

在 Vue、React 等框架中，请在客户端挂载后初始化，避免在 SSR 阶段运行。

## 快速开始

以 Vite + TypeScript 项目为例，在入口 HTML 中准备画布并先加载 Core：

```html
<canvas id="live2d" style="display: block; width: 100vw; height: 100vh;"></canvas>
<script src="/Core/live2dcubismcore.min.js"></script>
<!-- 然后加载你的应用入口 -->
```

在应用入口中创建 Pixi Application 和模型：

```ts
import { Application } from 'pixi.js'
import { Config, Live2DSprite, Priority } from 'easy-live2d'

Config.MotionGroupIdle = 'Idle'

const canvas = document.querySelector<HTMLCanvasElement>('#live2d')!
const app = new Application()
await app.init({
  canvas,
  backgroundAlpha: 0,
  resizeTo: window,
  autoDensity: true,
  resolution: window.devicePixelRatio || 1,
})

const sprite = new Live2DSprite({
  modelPath: '/Resources/Hiyori/Hiyori.model3.json',
  draggable: true,
})
sprite.width = canvas.clientWidth
sprite.height = canvas.clientHeight
app.stage.addChild(sprite)

try {
  await sprite.ready
  sprite.onLive2D('hit', ({ hitAreaName }) => {
    console.log(hitAreaName)
    void sprite.startMotion({ group: 'TapBody', no: 0, priority: Priority.Normal })
      .catch(console.error)
  })
} catch (error) {
  console.error(error)
  sprite.destroy()
  app.destroy()
}
```

示例中的 `Idle`、`TapBody` 来自 Hiyori 模型，接入其他模型时请按实际配置调整。Pixi 默认优先使用 WebGL 2，无需额外指定渲染选项，也无需向 `Live2DSprite` 传入 `ticker`。

## 常用操作

以下操作在模型就绪后调用；动作、表情和音频路径需替换为自己的资源：

```ts
// 动作 / Motion
await sprite.startMotion({ group: 'TapBody', no: 0, priority: Priority.Normal })

// 表情 / Expression
sprite.setExpression({ expressionId: 'smile' })

// 语音与口型 / Voice and lip sync
await sprite.playVoice({ voicePath: '/audio/hello.mp3' })
sprite.stopVoice()

// 模型参数 / Model parameters
sprite.setParameterValueById('ParamAngleX', 15)
const range = sprite.getParameterValueRangeById('ParamAngleX')

// 可用动作与表情 / Available motions and expressions
const motions = sprite.getMotions()
const expressions = sprite.getExpressions()
```

语音建议由点击等用户操作触发。支持浏览器可解码的音频格式，口型同步需要模型配置 `LipSync` 参数；停止一个模型的语音不会打断其他模型。

页面或组件卸载时释放资源；只有不再使用宿主 Application 时才销毁它：

```ts
sprite.destroy()
app.destroy()
```

## 进一步使用

- [安装配置](docs/guide/installation.md)：Core、运行环境与资源目录。
- [快速开始](docs/guide/getting-started.md)：完整页面与 Vue 示例。
- [基本用法](docs/guide/basic-usage.md)：多模型、资源重定向、动作、语音和参数控制。
- [API 参考](docs/api/index.md)：`Live2DSprite`、`Config`、`CubismSetting`、`Priority` 和 `LogLevel`。
- [本地开发与贡献](CONTRIBUTING.md)。

## 许可证

项目自身代码采用 [MIT](LICENSE)。Live2D Cubism Core、Framework 与模型资源遵循各自官方许可。

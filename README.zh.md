<div align="center">
  <p align="center">
      <img src="https://github.com/user-attachments/assets/4ebc2d19-2ebe-4490-b214-e6ac8b350ce0" alt="feuse-mcp" width="300px">
  </p>
  
  <h1>easy-live2d</h1>
  
  让 Live2D 集成更简单！一个基于 Pixi.js 轻量、开发者友好的 Live2D Web SDK 封装库。
  
  让你的 Live2D 和操控 pixi sprite 一样简单！
  
  <div align="center">
      <img src="https://img.shields.io/badge/node-%5E22.0.0-brightgreen" alt="license">
      <img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="license">
  </div>
</div>

中文 | [English](/README.md)

你能够直接用这个 云IDE [StackBlitz](https://stackblitz.com/~/github.com/Panzer-Jack/easy-live2d-playground) 在你的浏览器上直接体验到 easy-live2d 的魅力！😋

---

## 📖 文档

👉 [easy-live2d 官方文档](https://panzer-jack.github.io/easy-live2d)

## 概述

`easy-live2d` 将 Live2D 模型封装为 Pixi.js `Sprite` 对象，提供精简的 API 覆盖模型加载、命中检测、拖拽、动作播放、表情切换、语音播放与口型同步。

公开导出：

- `Live2DSprite` — 核心类，继承自 Pixi `Sprite`
- `Config` — 全局运行配置
- `CubismSetting` — 手动模型配置，支持路径重定向
- `Priority` — 动作优先级枚举
- `LogLevel` — Cubism 日志级别枚举

## 安装

```bash
pnpm add easy-live2d pixi.js
# 或
npm install easy-live2d pixi.js
# 或
yarn add easy-live2d pixi.js
```

## 前置条件

1. 在页面入口引入官方 `live2dcubismcore.js`
2. 浏览器环境（不支持 SSR）
3. 可访问的 Live2D `model3.json` 模型文件

```html
<script src="/Core/live2dcubismcore.js"></script>
```

## 快速开始

```html
<!doctype html>
<html>
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>easy-live2d</title>
    <style>
      html, body { margin: 0; width: 100%; height: 100%; }
      #live2d { display: block; width: 100vw; height: 100vh; }
    </style>
  </head>
  <body>
    <canvas id="live2d"></canvas>
    <script src="/Core/live2dcubismcore.js"></script>
    <script type="module">
      import { Application, Ticker } from 'pixi.js'
      import { Config, Live2DSprite, Priority } from 'easy-live2d'

      Config.MotionGroupIdle = 'Idle'
      Config.MouseFollow = true

      const canvas = document.getElementById('live2d')
      const app = new Application()

      await app.init({
        canvas,
        backgroundAlpha: 0,
        autoDensity: true,
        resolution: Math.max(window.devicePixelRatio || 1, 1),
      })

      const sprite = new Live2DSprite({
        modelPath: '/Resources/Hiyori/Hiyori.model3.json',
        ticker: Ticker.shared,
      })

      sprite.width = canvas.clientWidth
      app.stage.addChild(sprite)

      // 方式一：事件回调（既有 API）
      sprite.onLive2D('ready', async () => {
        await sprite.startMotion({
          group: 'TapBody',
          no: 0,
          priority: Priority.Normal,
        })
      })

      // 方式二：async/await（新 API）
      // await sprite.ready
      // await sprite.startMotion({ group: 'TapBody', no: 0, priority: Priority.Normal })
    </script>
  </body>
</html>
```

## 功能一览

```ts
import { Config, CubismSetting, Live2DSprite, LogLevel, Priority } from 'easy-live2d'

Config.CubismLoggingLevel = LogLevel.LogLevel_Warning

// 配置纹理图片的 crossOrigin，防止 WebGL 纹理上传时触发 SecurityError。
// 默认值为 "anonymous"，适用于大多数 CDN 跨域场景。
// 如果服务器需要凭证，可设置为 "use-credentials"。
// 设置为 undefined 可关闭此功能（不推荐用于跨域资源）。
// 注意：服务器必须返回正确的 Access-Control-Allow-Origin 响应头。
Config.crossOrigin = 'anonymous'

const sprite = new Live2DSprite({
  modelPath: '/Resources/Hiyori/Hiyori.model3.json',
  draggable: true,
})

// 命中检测
sprite.onLive2D('hit', ({ hitAreaName }) => {
  console.log(hitAreaName)
})

// 拖拽事件
sprite.onLive2D('dragMove', ({ x, y }) => {
  console.log(x, y)
})

// 动作播放
await sprite.startMotion({
  group: 'TapBody',
  no: 0,
  priority: Priority.Force,
})

// 表情切换
sprite.setExpression({ expressionId: 'smile' })

// 语音播放（带口型同步）
await sprite.playVoice({
  voicePath: '/Resources/Hiyori/sounds/test.mp3',
})

// 获取模型所有动作列表
const motions = sprite.getMotions()
// => [{ group: 'Idle', no: 0, name: 'Idle_0' }, { group: 'TapBody', no: 0, name: 'TapBody_0' }, ...]

// 获取模型所有表情列表
const expressions = sprite.getExpressions()
// => [{ name: 'smile' }, { name: 'angry' }, ...]
```

语音解码基于 Web Audio `decodeAudioData()`，支持浏览器可解码的音频格式（wav、mp3、ogg 等）。口型同步需要模型配置 `LipSync` 参数映射。

## 文档

- 中文：https://panzer-jack.github.io/easy-live2d
- English：https://panzer-jack.github.io/easy-live2d/en

## 在线演示

- [StackBlitz Playground](https://stackblitz.com/~/github.com/Panzer-Jack/easy-live2d-playground?file=src/App.vue)

## 许可证

- 仓库代码：`MPL-2.0`
- Live2D Cubism Core 与模型资源遵循各自官方许可

<div align="center">
  <p align="center">
    <img src="https://github.com/user-attachments/assets/4ebc2d19-2ebe-4490-b214-e6ac8b350ce0" alt="easy-live2d" width="260">
  </p>

  <h1>easy-live2d</h1>

Making Live2D integration easier! A lightweight, developer-friendly Live2D Web SDK wrapper library based on Pixi.js.

Make your Live2D as easy to control as a pixi sprite!

  <div align="center">
      <img src="https://img.shields.io/badge/node-%5E18.0.0%20%7C%7C%20%3E%3D20.0.0-brightgreen" alt="Node.js">
      <img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="license">
      <img src="https://api.oosmetrics.com/api/v1/badge/achievement/7756c2c0-a022-49fa-b32c-b3cc0916f1bf.svg" alt="oosmetrics">
  </div>
</div>

English | [中文](README.zh.md)

[Documentation](https://panzer-jack.github.io/easy-live2d/en/) · [Live demo](https://stackblitz.com/~/github.com/Panzer-Jack/easy-live2d-playground?file=src/App.vue)

## Overview

`easy-live2d` wraps Live2D models as Pixi.js `Sprite` objects. Add a character to an existing stage, control its position, size, and scale, and use a consistent API for loading, motions, expressions, hit detection, and dragging.

- Load models through `modelPath` or `CubismSetting`, with custom resource URLs.
- Control motion priorities, expressions, mouse tracking, physics, and model parameters.
- Play voice audio with lip sync; each model manages its own voice and resources.
- Use TypeScript types, ESM, or CommonJS builds.

## Installation

```bash
pnpm add easy-live2d pixi.js
# or npm install easy-live2d pixi.js
# or yarn add easy-live2d pixi.js
```

## Requirements

- **Pixi.js 8**, tested with 8.17.1.
- A browser with **WebGL 2**. WebGL 1 and WebGPU rendering are unsupported.
- Official Core from **Cubism 5 SDK for Web R5**, plus your model's `model3.json`, `.moc3`, textures, and related assets.

The matching Framework and shaders are bundled with the library. Download Core under the [official Live2D license](https://www.live2d.com/en/sdk/download/web/) and load it separately. Core and the library must be compatible; see the [R5 migration guide](docs/en/guide/cubism-r5-migration.md) when upgrading an older integration.

**Older SDK compatibility:** To keep using an older Cubism Core SDK, downgrade and pin easy-live2d to `0.4.4` with the Core previously validated in your project. Do not combine an older Core with easy-live2d 1.0.0.

In Vue, React, or similar frameworks, initialize after client-side mounting, outside SSR.

## Quick Start

In a Vite + TypeScript project, prepare a canvas in your entry HTML and load Core before your application:

```html
<canvas id="live2d" style="display: block; width: 100vw; height: 100vh;"></canvas>
<script src="/Core/live2dcubismcore.min.js"></script>
<!-- Load your application entry next -->
```

Create a Pixi Application and attach the model:

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

The `Idle` and `TapBody` groups belong to the Hiyori sample. Adjust them to your model's configuration. Pixi defaults to WebGL 2; no extra renderer options or `ticker` argument are required.

## Common Operations

Call these methods after the model is ready, using motions, expressions, and audio paths from your own assets:

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

Trigger voice playback through a user interaction such as a click. Audio formats depend on browser decoding support, and lip sync requires `LipSync` parameters in the model. Stopping one model's voice does not interrupt other models.

Release resources when the page or component is removed. Destroy the host Application only when it is no longer needed:

```ts
sprite.destroy()
app.destroy()
```

## Learn More

- [Installation](docs/en/guide/installation.md): Core, environment, and asset setup.
- [Getting started](docs/en/guide/getting-started.md): Complete page and Vue examples.
- [Basic usage](docs/en/guide/basic-usage.md): Multiple models, URL redirection, motions, voice, and parameters.
- [API reference](docs/en/api/index.md): `Live2DSprite`, `Config`, `CubismSetting`, `Priority`, and `LogLevel`.
- [Development and contributing](CONTRIBUTING.md) (Chinese).

## License

Project code uses [MIT](LICENSE). Live2D Cubism Core, Framework, and model assets retain their respective official licenses.

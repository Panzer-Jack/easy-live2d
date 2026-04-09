<div align="center">
  <p align="center">
    <img src="https://github.com/user-attachments/assets/4ebc2d19-2ebe-4490-b214-e6ac8b350ce0" alt="easy-live2d" width="260">
  </p>
  
  <h1>easy-live2d</h1>
  
  Making Live2D integration easier! A lightweight, developer-friendly Live2D Web SDK wrapper library based on Pixi.js.
  
  Make your Live2D as easy to control as a pixi sprite!
  
  <div align="center">
      <img src="https://img.shields.io/badge/node-%5E22.0.0-brightgreen" alt="license">
      <img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="license">
  </div>
</div>

English | [中文](/README.zh.md)

You can directly experience the charm of easy-live2d in your browser using this cloud IDE [StackBlitz](https://stackblitz.com/~/github.com/Panzer-Jack/easy-live2d-playground)! 😋

---

## 📖 Documentation

👉 [easy-live2d Official Documentation](https://panzer-jack.github.io/easy-live2d/en)

## Overview

`easy-live2d` wraps Live2D models as Pixi.js `Sprite` objects, providing a compact API for model loading, hit detection, dragging, motions, expressions, voice playback, and lip sync.

Public exports:

- `Live2DSprite` — Core class, extends Pixi `Sprite`
- `Config` — Global runtime configuration
- `CubismSetting` — Manual model config with path redirection
- `Priority` — Motion priority enum
- `LogLevel` — Cubism log level enum

## Installation

```bash
pnpm add easy-live2d pixi.js
# or
npm install easy-live2d pixi.js
# or
yarn add easy-live2d pixi.js
```

## Prerequisites

1. Download and load the official `live2dcubismcore.js` in your entry HTML
2. Browser environment (not SSR)
3. An accessible Live2D `model3.json`

```html
<script src="/Core/live2dcubismcore.js"></script>
```

## Quick Start

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

      // Option 1: event callback (existing API)
      sprite.onLive2D('ready', async () => {
        await sprite.startMotion({
          group: 'TapBody',
          no: 0,
          priority: Priority.Normal,
        })
      })

      // Option 2: async/await (new API)
      // await sprite.ready
      // await sprite.startMotion({ group: 'TapBody', no: 0, priority: Priority.Normal })
    </script>
  </body>
</html>
```

## Features at a Glance

```ts
import { Config, CubismSetting, Live2DSprite, LogLevel, Priority } from 'easy-live2d'

Config.CubismLoggingLevel = LogLevel.LogLevel_Warning

// Configure crossOrigin for WebGL texture loading.
// Default is "anonymous", which works for most CDN scenarios.
// Set to "use-credentials" if your server requires credentials.
// Set to undefined to disable (not recommended for cross-origin assets).
// The server must respond with a valid Access-Control-Allow-Origin header.
Config.crossOrigin = 'anonymous'

const sprite = new Live2DSprite({
  modelPath: '/Resources/Hiyori/Hiyori.model3.json',
  draggable: true,
})

// Hit detection
sprite.onLive2D('hit', ({ hitAreaName }) => {
  console.log(hitAreaName)
})

// Drag events
sprite.onLive2D('dragMove', ({ x, y }) => {
  console.log(x, y)
})

// Motions
await sprite.startMotion({
  group: 'TapBody',
  no: 0,
  priority: Priority.Force,
})

// Expressions
sprite.setExpression({ expressionId: 'smile' })

// Voice with lip sync
await sprite.playVoice({
  voicePath: '/Resources/Hiyori/sounds/test.mp3',
})
```

Voice decoding uses Web Audio `decodeAudioData()`, supporting any browser-decodable audio format (wav, mp3, ogg, etc.). Lip sync requires `LipSync` parameter mapping in the model.

## Documentation

- English: https://panzer-jack.github.io/easy-live2d/en
- 中文: https://panzer-jack.github.io/easy-live2d

## Live Demo

- [StackBlitz Playground](https://stackblitz.com/~/github.com/Panzer-Jack/easy-live2d-playground?file=src/App.vue)

## License

- Repository code: `MPL-2.0`
- Live2D Cubism Core and model assets follow their official licenses

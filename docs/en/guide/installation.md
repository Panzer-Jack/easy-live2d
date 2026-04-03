# Installation

## Install

::: code-group

```bash [pnpm]
pnpm add easy-live2d pixi.js
```

```bash [npm]
npm install easy-live2d pixi.js
```

```bash [yarn]
yarn add easy-live2d pixi.js
```

:::

Application code should import from `easy-live2d`. `@easy-live2d/core` is the internal monorepo package, used only during repository development.

## Prerequisites

### 1. Load the Official Cubism Core

The library does not include Live2D Core. You need to download and host `live2dcubismcore.js` yourself per Live2D licensing:

```html
<script src="/Core/live2dcubismcore.js"></script>
```

### 2. Browser Environment

Depends on these browser APIs:

- `document` / `fetch` / `Image`
- `ResizeObserver`
- `AudioContext`
- `WebGL`

Not suitable for SSR. Initialize `Live2DSprite` after client mount.

### 3. Pixi.js as Host

You create the Pixi `Application` and add `Live2DSprite` to the stage. `easy-live2d` does not create the canvas or own the app lifecycle.

## Model Assets

### Option 1: `modelPath`

```ts
const sprite = new Live2DSprite({
  modelPath: '/Resources/Hiyori/Hiyori.model3.json',
})
```

The library uses the `model3.json` directory as the base path to load moc, textures, motions, expressions, physics, pose, and user data.

### Option 2: `CubismSetting`

```ts
const modelJSON = await fetch('/Resources/Hiyori/Hiyori.model3.json').then(r => r.json())

const setting = new CubismSetting({
  modelJSON,
  prefixPath: '/Resources/Hiyori/',
})
```

Best for:

- `model3.json` requires authentication
- Assets are on a CDN
- Asset URLs need rule-based rewriting

## Smallest Runnable Page

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
      import { Live2DSprite } from 'easy-live2d'

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
    </script>
  </body>
</html>
```

## Next

- [Getting Started](/en/guide/getting-started) — Run the minimal example
- [Basic Usage](/en/guide/basic-usage) — Motions, expressions, dragging, voice
- [API Reference](/en/api/) — Full public API

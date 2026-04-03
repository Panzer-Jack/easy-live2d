# Getting Started

## Before You Start

1. Install `easy-live2d` and `pixi.js` (see [Installation](/en/guide/installation))
2. Load `live2dcubismcore.js` in your entry HTML
3. Have an accessible `model3.json` model file ready

## Minimal Example

```html
<!doctype html>
<html>
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>easy-live2d example</title>
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

      // Global config (set before creating instances)
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

      // Play a motion after the model is ready
      sprite.onLive2D('ready', async () => {
        console.log('model ready')

        await sprite.startMotion({
          group: 'TapBody',
          no: 0,
          priority: Priority.Normal,
        })
      })
    </script>
  </body>
</html>
```

## What This Code Does

- `Config` sets global behavior before the sprite is created.
- `Live2DSprite` uses `modelPath` to point to the model entry file.
- Pixi `Application` owns the canvas and render loop.
- `sprite.width` sets the display width; internally it calculates the scale ratio from the model's original canvas size.
- The `ready` event fires after model assets, textures, and interaction setup are all complete — the safe point to operate on the model.

## Vue 3 Example

```vue
<script setup lang="ts">
import { Config, Live2DSprite } from 'easy-live2d'
import { Application, Ticker } from 'pixi.js'
import { onMounted, onUnmounted, ref } from 'vue'

const canvasRef = ref<HTMLCanvasElement | null>(null)
const app = new Application()

Config.MotionGroupIdle = 'Idle'
Config.MouseFollow = false

const sprite = new Live2DSprite({
  modelPath: '/Resources/Hiyori/Hiyori.model3.json',
  ticker: Ticker.shared,
  draggable: true,
})

onMounted(async () => {
  if (!canvasRef.value)
    return

  await app.init({
    canvas: canvasRef.value,
    backgroundAlpha: 0,
    autoDensity: true,
    resolution: Math.max(window.devicePixelRatio || 1, 1),
  })

  sprite.width = canvasRef.value.clientWidth
  app.stage.addChild(sprite)

  sprite.onLive2D('ready', () => {
    console.log('model ready')
  })
})

onUnmounted(() => {
  sprite.destroy()
})
</script>

<template>
  <canvas ref="canvasRef" class="live2d-canvas" />
</template>

<style scoped>
.live2d-canvas {
  width: 100%;
  height: 100%;
  display: block;
}
</style>
```

::: tip
You still need `live2dcubismcore.js` in your entry HTML. `Live2DSprite` depends on browser APIs — do not initialize during SSR.
:::

## Next

- [Basic Usage](/en/guide/basic-usage) — Motions, expressions, dragging, voice
- [API Reference](/en/api/) — Full public API

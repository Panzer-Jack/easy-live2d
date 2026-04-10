# 快速开始

## 准备工作

1. 安装 `easy-live2d` 和 `pixi.js`（见 [安装配置](/guide/installation)）
2. 在页面入口引入 `live2dcubismcore.js`
3. 准备一个可访问的 `model3.json` 模型文件

## 最小示例

```html
<!doctype html>
<html>
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>easy-live2d 示例</title>
    <style>
      html,
      body {
        margin: 0;
        width: 100%;
        height: 100%;
      }
      #live2d {
        display: block;
        width: 100vw;
        height: 100vh;
      }
    </style>
  </head>
  <body>
    <canvas id="live2d"></canvas>
    <script src="/Core/live2dcubismcore.js"></script>
    <script type="module">
      import { Application, Ticker } from 'pixi.js'
      import { Config, Live2DSprite, Priority } from 'easy-live2d'

      // 全局配置（在创建实例前设置）
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

      // 模型就绪后播放动作
      sprite.onLive2D('ready', async () => {
        console.log('模型已就绪')

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

## 代码说明

- `Config` 在实例创建前设置全局行为。
- `Live2DSprite` 通过 `modelPath` 指向模型入口文件。
- Pixi `Application` 负责 canvas 和渲染循环。
- `sprite.width` 设置模型显示宽度，内部会根据模型原始尺寸换算缩放比。
- `ready` 事件在模型资源、纹理和交互层全部初始化完成后触发，是操作模型的安全时机。

## Vue 3 接入

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
    console.log('模型已就绪')
  })
})

onUnmounted(() => {
  sprite.destroy()
})
</script>

<template>
  <canvas
    ref="canvasRef"
    class="live2d-canvas"
  />
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
仍然需要在应用入口 HTML 中引入 `live2dcubismcore.js`。`Live2DSprite` 依赖浏览器 API，不要在 SSR 阶段初始化。
:::

## 下一步

- [基本用法](/guide/basic-usage) — 动作、表情、拖拽、语音
- [API 参考](/api/) — 完整公开 API

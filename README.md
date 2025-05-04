# EasyLive2D (Under active development...)

Making Live2D integration easier! A lightweight, developer-friendly Live2D Web SDK wrapper library based on Pixi.js.

---

## 📖 Documentation

👉 [EasyLive2D Official Documentation](https://panzer-jack.github.io/easy-live2d/en/)

---

## TODO
- (✅) Transfer Core capabilities to Sprite
- (✅) Read model paths
- (✅) Configuration file migration
- (✅) Direct control of expressions and actions
- (✅) Expose various event functions
- Voice functionality
- Mouth synchronization
- WebGL rendering mounting issues (tentative)

## ✨ Features

- ⚡️ Support for Pixi.js v8 and Cubism 5 (both latest versions)
- 🌟 Ultra-lightweight, removing redundant features
- 🚀 Simpler API interface
- 🛠️ Compatible with official Live2D Web SDK
- 📦 Adaptable to modern frontend frameworks (like Vue, React)

---

## 📦 Installation

```bash
pnpm add easy-live2d
# or
npm install easy-live2d
# or
yarn add easy-live2d
```

---

## 🛠️ Quick Start

```vue
<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import { Config, Live2DSprite, LogLevel, Priority } from 'easy-live2d'
import { Application, Ticker } from 'pixi.js'
import { initDevtools } from '@pixi/devtools'

const canvasRef = ref<HTMLCanvasElement>()
const app = new Application()

// Set default Config configuration
Config.MotionGroupIdle = 'Idle' // Set default idle motion group
Config.MouseFollow = false // Disable mouse following
Config.CubismLoggingLevel = LogLevel.LogLevel_Off // Set logging level


// Create Live2D sprite and initialize
const live2DSprite = new Live2DSprite()
live2DSprite.init({
  modelPath: '/Resources/Hiyori/Hiyori.model3.json',
  ticker: Ticker.shared
});

// Listen for click events
live2DSprite.onLive2D('hit', ({ hitAreaName, x, y }) => {
  console.log('hit', hitAreaName, x, y);
})

// You can also initialize directly like this
// const live2DSprite = new Live2DSprite({
//   modelPath: '/Resources/Huusya/Huusya.model3.json',
//   ticker: Ticker.shared
// })

onMounted(async () => {
  await app.init({
    view: canvasRef.value,
    backgroundAlpha: 0, // Set alpha to 0 for transparency if needed
  })
  if (canvasRef.value) {

    // Live2D sprite size and position settings
    live2DSprite.x = -300
    live2DSprite.y = -300
    live2DSprite.width = canvasRef.value.clientWidth * window.devicePixelRatio
    live2DSprite.height = canvasRef.value.clientHeight * window.devicePixelRatio
    app.stage.addChild(live2DSprite);

    // Set expression
    live2DSprite.setExpression({
      expressionId: 'normal',
    })

    // Set motion
    live2DSprite.startMotion({
      group: 'test',
      no: 0,
      priority: 3,
    })
  }
})

onUnmounted(() => {
  // Release instance
  live2DSprite.destroy()
})

</script>

<template>
  <div class="test">
  </div>
  <canvas
    ref="canvasRef"
    id="live2d"
  />
</template>

<style>
#live2d {
  position: absolute;
  top: 0%;
  right: 0%;
  width: 100%;
  height: 100%;
}

.test {
  display: inline-block;
  position: absolute;
  width: 100%;
  height: 70%;
  background-color: pink;
}
</style>

```

---

## 🤝 Contributing

PRs and Issues are welcome! Please read the [contribution guidelines](#) before participating in development.

--- 

## 📄 License

[MIT](./LICENSE)
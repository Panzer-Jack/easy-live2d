# Getting Started

This page will guide you on how to quickly get started with easy-live2d, integrating a Live2D model into your web application in just a few minutes.

## Recommended Configuration

- Node.js >= 18
- Pixi.js >= 8
- Cubism 5 models

## Installation

Install easy-live2d using your preferred package manager:

::: code-group
```bash [npm]
npm install easy-live2d
```

```bash [yarn]
yarn add easy-live2d
```

```bash [pnpm]
pnpm add easy-live2d
```
:::

## Basic Usage

Here's a simple example showing how to load and display a Live2D model in a web page:

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>easy-live2d Example</title>
  <style>
    body {
      margin: 0;
      overflow: hidden;
    }
    canvas {
      width: 100vw;
      height: 100vh;
    }
  </style>
</head>
<body>
  <canvas id="live2d"></canvas>
  <!-- Important!! Always include Cubism Core in your index.html -->
  <script src="/Core/live2dcubismcore.js"></script>
  <script type="module">
    import { Application, Ticker } from 'pixi.js';
    import { Live2DSprite, Config, Priority } from 'easy-live2d';

    // Configure basic settings
    Config.MotionGroupIdle = 'Idle'; // Set default idle motion group
    Config.MouseFollow = false; // Disable mouse following
    // Create Live2D sprite
    const live2dSprite = new Live2DSprite();
    live2dSprite.init({
      modelPath: '/Resources/Hiyori/Hiyori.model3.json',
      ticker: Ticker.shared
    });

    const init = async () => {
      // Create application
      const app = new Application();
      await app.init({
        view: document.getElementById('live2d'),
        backgroundAlpha: 0, // Set alpha to 0 for transparency if needed
      });
      // Live2D sprite size
      live2DSprite.width = canvasRef.value.clientWidth * window.devicePixelRatio
      live2DSprite.height = canvasRef.value.clientHeight * window.devicePixelRatio
      // Add to stage
      app.stage.addChild(live2dSprite);
      console.log('easy-live2d initialized successfully!');
    }
    init()
  </script>
</body>
</html>
```

## Integration with Vue

Here's an example of integrating easy-live2d in a Vue 3 project:
(Please note that you must import Cubism Core in your index.html entry file)

```vue
<template>
  <canvas ref="canvasRef" id="live2d" />
</template>

<script setup>
import { onMounted, onUnmounted, ref } from 'vue'
import { Application, Ticker } from 'pixi.js'
import { Live2DSprite, Config, Priority } from 'easy-live2d'

const canvasRef = ref(null);
const app = new Application();
const live2DSprite = new Live2DSprite();

// Configure basic settings
Config.MotionGroupIdle = 'Idle'; // Set default idle motion group
Config.MouseFollow = false; // Disable mouse following

// Initialize Live2D sprite
live2DSprite.init({
  modelPath: '/public/path/to/your/model/Model.model3.json',
  ticker: Ticker.shared
});

// Add click event listener
live2DSprite.onLive2D('hit', ({ hitAreaName, x, y }) => {
  console.log('Clicked area:', hitAreaName, 'at', x, y);
});

onMounted(async () => {
  if (canvasRef.value) {
    await app.init({
      view: canvasRef.value,
      backgroundAlpha: 0, // Transparent background
    });
    
    // Adjust size and add to stage
    live2DSprite.width = canvasRef.value.clientWidth * window.devicePixelRatio;
    live2DSprite.height = canvasRef.value.clientHeight * window.devicePixelRatio;
    app.stage.addChild(live2DSprite);
    
    // Set expression
    live2DSprite.setExpression({
      expressionId: 'normal'
    });
  }
});

onUnmounted(() => {
  // Release resources
  live2DSprite.destroy();
});
</script>

<style scoped>
#live2d {
  position: absolute;
  top: 0;
  right: 0;
  width: 100%;
  height: 100%;
}
</style>
```

## Next Steps

- Check out [Installation and Configuration](/en/guide/installation) for more detailed installation information
- Read [Basic Usage](/en/guide/basic-usage) to learn more basic features
- Refer to the [API Documentation](/en/api/) for complete interface descriptions
- Explore [Examples](/en/examples/basic) to learn more advanced usage
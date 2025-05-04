# Quick Start

This page will guide you through getting started with easy-live2d, allowing you to integrate Live2D models into your web applications in just a few minutes.

## Prerequisites

Before you begin, ensure your development environment meets the following requirements:

- Node.js 14.x or higher
- npm, yarn, or pnpm package manager
- Basic knowledge of JavaScript/TypeScript

## Installation

Install easy-live2d using your preferred package manager:

::: code-group
```bash [npm]
npm install easylive2d
```

```bash [yarn]
yarn add easylive2d
```

```bash [pnpm]
pnpm add easylive2d
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
  <script type="module">
    import { Application, Ticker } from 'pixi.js';
    import { Live2DSprite, Config, Priority } from 'easylive2d';

    // Create a Pixi application
    const app = new Application();
    app.init({
      view: document.getElementById('live2d'),
      backgroundAlpha: 0, // Transparent background
    });

    // Create a Live2D sprite
    const live2DSprite = new Live2DSprite();
    
    // Initialize the sprite, set the model path
    live2DSprite.init({
      modelPath: '/path/to/your/model/Model.model3.json',
      ticker: Ticker.shared
    });

    // Add event listener
    live2DSprite.onLive2D('hit', ({ hitAreaName, x, y }) => {
      console.log('Clicked on model part:', hitAreaName, 'position:', x, y);
    });

    // Add the Live2D sprite to the stage
    app.stage.addChild(live2DSprite);
    
    // Set expression
    live2DSprite.setExpression({
      expressionId: 'normal'
    });
  </script>
</body>
</html>
```

## Vue Integration

Here's an example of integrating easy-live2d in a Vue 3 project:

```vue
<template>
  <canvas ref="canvasRef" id="live2d" />
</template>

<script setup>
import { onMounted, onUnmounted, ref } from 'vue'
import { Application, Ticker } from 'pixi.js'
import { Live2DSprite, Config, Priority } from 'easylive2d'

const canvasRef = ref(null);
const app = new Application();
const live2DSprite = new Live2DSprite();

// Configure basic settings
Config.MotionGroupIdle = 'Idle'; // Set default idle motion group
Config.MouseFollow = false; // Disable mouse following

// Initialize Live2D sprite
live2DSprite.init({
  modelPath: '/path/to/your/model/Model.model3.json',
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

- Check out [Installation](/en/guide/installation) for more detailed installation information
- Read [Basic Usage](/en/guide/basic-usage) to learn about more basic functions
- Refer to the [API Documentation](/en/api/) for complete interface descriptions
- Explore [Examples](/en/examples/basic) to learn about more advanced usage
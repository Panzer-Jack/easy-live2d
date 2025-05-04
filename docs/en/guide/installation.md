# Installation

This page will guide you through the installation and configuration of EasyLive2D.

## Installation

EasyLive2D can be installed through various package managers:

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

## Dependencies

EasyLive2D requires the following dependencies:

- [Pixi.js](https://pixijs.com/) v8.0.0+
- [Live2D Cubism](https://www.live2d.com/en/download/cubism-sdk/) SDK Core

## Environment Setup

### Basic Configuration

Before using EasyLive2D, you need to ensure that you have properly configured Pixi.js and Live2D Cubism SDK.

1. **Include Live2D Cubism Core**

   Make sure to include Live2D Cubism Core in your HTML file:

   ```html
   <script src="/Core/live2dcubismcore.js"></script>
   ```

   Or use a CDN:

   ```html
   <script src="https://cdn.jsdelivr.net/gh/dylanNew/live2d/webgl/Live2D/lib/live2d.min.js"></script>
   ```

2. **Set up Canvas**

   Add a canvas element as the rendering target:

   ```html
   <canvas id="live2d"></canvas>
   ```

### Style Settings

To display Live2D models correctly, it's recommended to add the following CSS styles:

```css
html, body {
  overflow: hidden;
  margin: 0;
}

canvas {
  position: absolute;
  width: 100%;
  height: 100%;
}
```

### Model File Structure

It's recommended to organize your Live2D model files according to the official structure:

```
public/
  Resources/
    ModelName/
      ModelName.model3.json
      *.moc3
      *.physics3.json
      textures/
        *.png
      motions/
        *.motion3.json
      expressions/
        *.exp3.json
```

## Verify Installation

After installation, you can verify that EasyLive2D has been correctly installed and configured with the following simple code:

```js
import { Application, Ticker } from 'pixi.js';
import { Live2DSprite } from 'easylive2d';

const init = async () => {
  // Create application
  const app = new Application();
  await app.init({
    view: document.getElementById('live2d'),
    backgroundAlpha: 0, // Set to 0 for transparency if needed
  });

  // Create Live2D sprite
  const live2dSprite = new Live2DSprite();
  live2dSprite.init({
    modelPath: '/Resources/Hiyori/Hiyori.model3.json',
    ticker: Ticker.shared
  });
  
  // Set Live2D sprite size
  live2dSprite.width = canvasRef.value.clientWidth * window.devicePixelRatio
  live2dSprite.height = canvasRef.value.clientHeight * window.devicePixelRatio

  // Add to stage
  app.stage.addChild(live2dSprite);

  console.log('EasyLive2D initialized successfully!');
}

init()
```

If you can see the model loading and displaying correctly, the installation and configuration have been successful.

## Common Issues

### Model Fails to Load

- Check if the path is correct
- Confirm that Live2D Cubism Core has been loaded correctly
- Check the browser console for error messages

### WebGL Compatibility Issues

EasyLive2D depends on WebGL. If you encounter rendering issues, please ensure:

- You are using a modern browser that supports WebGL
- Your graphics card drivers are updated

If you have other issues, please refer to the [API Documentation](/en/api/) or submit a [GitHub Issue](https://github.com/Panzer-Jack/easy-live2d/issues).
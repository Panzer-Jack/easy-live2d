# API Reference

This section provides a complete API reference documentation for easy-live2d, helping you understand all the functionality and usage of the library.

## Core Class

The core of easy-live2d is the `Live2DSprite` class, which inherits from Pixi.js's `Sprite` class, allowing you to handle Live2D models just like regular Pixi sprites.

```ts
class Live2DSprite extends Sprite {
  // Properties and methods
}
```

## Main Components

### Live2DSprite

`Live2DSprite` is the main entry class for easy-live2d, providing functions for model loading, rendering, event handling, and more. For details, see [Live2DSprite API](/en/api/live2d-sprite).

### Configuration System

The `Config` object provides global configuration options for setting default behaviors. For details, see [Configuration Options](/en/api/config).

### Event System

An extension of the Pixi.js event system, providing Live2D-specific event types and handling mechanisms. For details, see [Event Types](/en/api/events).

### Managers

The manager system is responsible for managing and coordinating resources such as models, motions, and expressions. For details, see [Managers](/en/api/managers).

## Type Definitions

easy-live2d is written in TypeScript and provides complete type definitions, which helps to get good type support and code hints during development. The main type definitions include:

### Live2DSpriteInit

Configuration options for initializing Live2DSprite.

```ts
interface Live2DSpriteInit {
  modelPath: string;      // Model path
  ticker?: Ticker;        // Pixi.js Ticker instance
}
```

### Event Types

```ts
// Live2D specific event type definitions
interface Live2DSpriteEvents {
  // Click event, returns the name of the clicked area and coordinates
  hit: [{ hitAreaName: string; x: number; y: number }];
}
```

### Priority Enum

Used to set the priority of motions and expressions.

```ts
enum Priority {
  None = 0,
  Idle = 1,
  Normal = 2,
  Force = 3
}
```

### Log Level Enum

Controls the log output level.

```ts
enum LogLevel {
  LogLevel_Verbose = 0,
  LogLevel_Debug = 1,
  LogLevel_Info = 2,
  LogLevel_Warning = 3,
  LogLevel_Error = 4,
  LogLevel_Off = 5
}
```

## Example Usage

Here's a simple usage example:

```html
<!doctype html>
<html lang="">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" href="/favicon.ico" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Vite App</title>
    <style>
      html,
      body {
        overflow: hidden;
        margin: 0;
      }
    </style>
  </head>

  <body>
    <div id="app"></div>
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

In the following pages, we will introduce the various components and features of easy-live2d in detail. (To be completed)
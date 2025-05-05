# Basic Usage

This page introduces how to use the basic features of easy-live2d, helping you quickly master the core usage of the library.

## Include Cubism Core in HTML:

Make sure to include Cubism Core in your index.html:

You can download it directly from the Live2D Cubism official website: [Live2D Cubism SDK for Web](https://www.live2d.com/en/sdk/download/web/)

```html
<!doctype html>
<html lang="">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" href="/favicon.ico" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Vite App</title>
  </head>

  <body>
    <div id="app"></div>
    <!-- Critical! -->
    <script src="/Core/live2dcubismcore.js"></script>
    <script type="module">

    </script>
  </body>
</html>
```

## Create a Live2D Sprite

The first step to using easy-live2d is to create a Live2DSprite instance and initialize it:

```js
import { Live2DSprite } from 'easy-live2d';
import { Ticker } from 'pixi.js';

// Create Live2D sprite
const live2dSprite = new Live2DSprite();

// Initialize sprite and set model path
live2dSprite.init({
  modelPath: '/path/to/your/model/Model.model3.json',
  ticker: Ticker.shared
});
```

## Add to Scene

After creation, you need to add the Live2D sprite to a Pixi.js stage:

```js
import { Application } from 'pixi.js';

// Create Pixi application
const app = new Application();
const init = async () => {
  await app.init({
    view: document.getElementById('canvas'),
    backgroundAlpha: 0  // Transparent background
  });
  // Add sprite to stage
  app.stage.addChild(live2dSprite);
}
init()
```

## Set Position and Size

You can set the position and size of the Live2D sprite just like you would with a regular Pixi.js sprite:

```js
// Set position and size
live2dSprite.x = 400;
live2dSprite.y = 300;
live2DSprite.width = 1400
live2DSprite.height = 900
```

## Play Motions

easy-live2d provides simple methods to play model motions:

```js
import { Priority } from 'easy-live2d';

// Play a specific motion
live2dSprite.startMotion({
  group: 'Tap',    // Motion group name
  no: 0,           // Motion index
  priority: Priority.Force  // Motion priority
});

// Priority explanation:
// Priority.None = 0: No priority, won't interrupt other motions
// Priority.Idle = 1: Idle priority, lowest level
// Priority.Normal = 2: Normal priority
// Priority.Force = 3: Force priority, will interrupt any other motions
```

## Set Expressions

Switching model expressions is also very simple:

```js
// Set a specific expression
live2dSprite.setExpression({ 
  expressionId: 'smile' 
});

// Randomly select an expression
live2dSprite.setRandomExpression();
```

## Listen for Events

easy-live2d provides an event system that can respond to interactions on the model:

```js
// Listen for click events
live2dSprite.onLive2D('hit', ({ hitAreaName, x, y }) => {
  console.log(`Clicked on the model's ${hitAreaName} area, coordinates: (${x}, ${y})`);
  
  // You can trigger different actions based on the clicked area
  if (hitAreaName === 'Head') {
    live2dSprite.startMotion({
      group: 'Tap',
      no: 0,
      priority: Priority.Force
    });
  }
});
```

## Configuration Options

You can set global configurations through the Config object:

```js
import { Config, LogLevel } from 'easy-live2d';

// Set log level
Config.CubismLoggingLevel = LogLevel.LogLevel_Warning;

// Enable/disable mouse following
Config.MouseFollow = true;

// Set default idle motion group
Config.MotionGroupIdle = 'Idle';

// Enable/disable eye blinking effect
Config.EyeBlinkEnabled = true;

// Enable/disable breathing effect
Config.BreathingEnabled = true;
```

## Resource Release

When the Live2D sprite is no longer needed, you should release the resources it occupies:

```js
// Destroy resources
live2dSprite.destroy();
```

In frameworks like Vue or React, this operation should be performed when the component is unmounted.

## Complete Example
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

## Next Steps
- Explore more [Model Loading](/en/guide/model-loading) options
- Learn advanced usage of [Motion Control](/en/guide/motion-control)
- Understand the details of [Expression Control](/en/guide/expression-control)
- Master the complete functionality of the [Event System](/en/guide/events)
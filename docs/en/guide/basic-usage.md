# Basic Usage

This page covers the basic usage of EasyLive2D, helping you quickly master the core functionality of the library.

## Creating a Live2D Sprite

The first step to using EasyLive2D is creating a Live2DSprite instance and initializing it:

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

## Adding to the Scene

After creation, you need to add the Live2D sprite to the Pixi.js stage:

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

## Setting Position and Size

You can set the position and size of the Live2D sprite just like any regular Pixi.js sprite:

```js
// Set position and size
live2dSprite.x = 400;
live2dSprite.y = 300;
live2dSprite.width = 1400;
live2dSprite.height = 900;
```

## Playing Motions

EasyLive2D provides simple methods to play model motions:

```js
import { Priority } from 'easy-live2d';

// Play specific motion
live2dSprite.startMotion({
  group: 'Tap',    // Motion group name
  no: 0,           // Motion index
  priority: Priority.Force  // Motion priority
});

// Priority explanation:
// Priority.None = 0: No priority, won't interrupt other motions
// Priority.Idle = 1: Idle priority, lowest level
// Priority.Normal = 2: Normal priority
// Priority.Force = 3: Force priority, will interrupt any other motion
```

## Setting Expressions

Switching model expressions is also very simple:

```js
// Set specific expression
live2dSprite.setExpression({ 
  expressionId: 'smile' 
});

// Choose a random expression
live2dSprite.setRandomExpression();
```

## Listening to Events

EasyLive2D provides an event system to respond to interactions with the model:

```js
// Listen for hit events
live2dSprite.onLive2D('hit', ({ hitAreaName, x, y }) => {
  console.log(`Clicked on model's ${hitAreaName} area, coordinates: (${x}, ${y})`);
  
  // You can trigger different actions based on the hit area
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
import { Config, LogLevel } from 'easylive2d';

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

## Resource Cleanup

When the Live2D sprite is no longer needed, you should release its resources:

```js
// Destroy resources
live2dSprite.destroy();
```

In frameworks like Vue or React, this should be done when the component unmounts.

## Responsive Window Size

Here's a simple example of responding to window size changes:

```js
// Initial adjustment
function resizeModel() {
  live2dSprite.x = window.innerWidth / 2;
  live2dSprite.y = window.innerHeight / 2;
  
  // Adjust size based on window proportion
  const scale = Math.min(
    window.innerWidth / live2dSprite.width,
    window.innerHeight / live2dSprite.height
  ) * 0.8; // 80% of window size
  
  live2dSprite.scale.set(scale);
}

// Listen for window resize events
window.addEventListener('resize', resizeModel);
resizeModel();
```

## Complete Example

Here's a basic example integrating all the above features:

```js
import { Application, Ticker } from 'pixi.js';
import { Live2DSprite, Config, Priority, LogLevel } from 'easylive2d';

// Configuration
Config.CubismLoggingLevel = LogLevel.LogLevel_Warning;
Config.MouseFollow = true;

// Create application
const app = new Application();
await app.init({
  view: document.getElementById('canvas'),
  backgroundAlpha: 0,
  resizeTo: window
});

// Create and initialize Live2D sprite
const live2dSprite = new Live2DSprite();
await live2dSprite.init({
  modelPath: '/Resources/Hiyori/Hiyori.model3.json',
  ticker: Ticker.shared
});

// Add to stage
app.stage.addChild(live2dSprite);

// Set position and anchor
live2dSprite.anchor.set(0.5, 0.5);
live2dSprite.x = app.screen.width / 2;
live2dSprite.y = app.screen.height / 2;

// Add hit event listener
live2dSprite.onLive2D('hit', ({ hitAreaName }) => {
  console.log(`Clicked on ${hitAreaName}`);
  
  // Play corresponding motion
  live2dSprite.startMotion({
    group: 'Tap',
    no: 0,
    priority: Priority.Force
  });
  
  // Set expression
  live2dSprite.setExpression({ expressionId: 'smile' });
});

// Responsive window size
window.addEventListener('resize', () => {
  live2dSprite.x = app.screen.width / 2;
  live2dSprite.y = app.screen.height / 2;
});

// Cleanup function
function cleanup() {
  window.removeEventListener('resize', resizeHandler);
  live2dSprite.destroy();
}
```

## Next Steps

- Explore more options for [Model Loading](/en/guide/model-loading)
- Learn advanced usage of [Motion Control](/en/guide/motion-control)
- Understand the details of [Expression Control](/en/guide/expression-control)
- Master the complete functionality of the [Event System](/en/guide/events)
# Basic Usage

This page introduces how to use the basic features of EasyLive2d, helping you quickly master the core functionality of the library.

## Creating a Live2D Sprite

The first step to using EasyLive2d is to create a Live2DSprite instance and initialize it:

```js
import { Live2DSprite } from 'easy-live2d';
import { Ticker } from 'pixi.js';

// Create a Live2D sprite
const live2dSprite = new Live2DSprite();

// Initialize the sprite and set the model path
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

You can set the position and size of the Live2D sprite just like a regular Pixi.js sprite:

```js
// Set position and size
live2dSprite.x = 400;
live2dSprite.y = 300;
live2DSprite.width = 1400
live2DSprite.height = 900
```

## Playing Motions

EasyLive2d provides simple methods to play model motions:

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
// Priority.Force = 3: Force priority, will interrupt any other motion
```

## Setting Expressions

Switching model expressions is also very simple:

```js
// Set a specific expression
live2dSprite.setExpression({ 
  expressionId: 'smile' 
});

// Randomly select an expression
live2dSprite.setRandomExpression();
```

## Listening to Events

EasyLive2d provides an event system that can respond to interactions on the model:

```js
// Listen for click events
live2dSprite.onLive2D('hit', ({ hitAreaName, x, y }) => {
  console.log(`Clicked on the ${hitAreaName} area of the model, coordinates: (${x}, ${y})`);
  
  // Can trigger different actions based on the clicked area
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

## Adapting to Window Size

Here's a simple example of responding to window size changes:

```js
// Initial adjustment
function resizeModel() {
  live2dSprite.x = window.innerWidth / 2;
  live2dSprite.y = window.innerHeight / 2;
  
  // Adjust size based on window ratio
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

Here is a basic example integrating all of the above functionality:

```js
import { Application, Ticker } from 'pixi.js';
import { Live2DSprite, Config, Priority, LogLevel } from 'easylive2d';

// Configuration
Config.CubismLoggingLevel = LogLevel.LogLevel_Warning;
Config.MouseFollow = true;

// Create application
const init = async () => {
  const app = new Application();
  await app.init({
    view: document.getElementById('canvas'),
    backgroundAlpha: 0,
    resizeTo: window
  });
  // Add to stage
  app.stage.addChild(live2dSprite);
}


// Create and initialize Live2D sprite
const live2dSprite = new Live2DSprite();
live2dSprite.init({
  modelPath: '/Resources/Hiyori/Hiyori.model3.json',
  ticker: Ticker.shared
});



// Set position and anchor
live2dSprite.anchor.set(0.5, 0.5);
live2dSprite.x = app.screen.width / 2;
live2dSprite.y = app.screen.height / 2;

// Add click event listener
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

// Adapt to window size
window.addEventListener('resize', () => {
  live2dSprite.x = app.screen.width / 2;
  live2dSprite.y = app.screen.height / 2;
});


// Initialize
init()

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
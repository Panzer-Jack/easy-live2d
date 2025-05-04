# Basic Examples

This page provides common usage examples of easy-live2d to help you quickly master the basic features of the library.

## Basic Model Loading

Here's the most basic example of loading and displaying a Live2D model:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>easy-live2d Basic Example</title>
  <style>
    html, body {
      margin: 0;
      padding: 0;
      width: 100%;
      height: 100%;
      overflow: hidden;
    }
    #canvas {
      width: 100%;
      height: 100%;
    }
  </style>
</head>
<body>
  <canvas id="canvas"></canvas>

  <script type="module">
    import { Application, Ticker } from 'pixi.js';
    import { Live2DSprite, Config, LogLevel } from 'easylive2d';

    // Set configuration options
    Config.CubismLoggingLevel = LogLevel.LogLevel_Warning; // Only show warnings and above

    // Create Pixi application
    const app = new Application();
    await app.init({
      view: document.getElementById('canvas'),
      backgroundAlpha: 0, // Transparent background
      resizeTo: window, // Auto resize
    });

    // Create Live2D sprite
    const live2dSprite = new Live2DSprite();
    await live2dSprite.init({
      modelPath: './models/Hiyori/Hiyori.model3.json',
      ticker: Ticker.shared
    });

    // Add to stage
    app.stage.addChild(live2dSprite);

    // Center the model
    live2dSprite.x = app.screen.width / 2;
    live2dSprite.y = app.screen.height / 2;
    
    // Set anchor point for centering
    live2dSprite.anchor.set(0.5, 0.5);

    // Adapt to window size changes
    window.addEventListener('resize', () => {
      live2dSprite.x = app.screen.width / 2;
      live2dSprite.y = app.screen.height / 2;
    });
  </script>
</body>
</html>
```

## Responding to Click Events

The following example shows how to respond to model click events:

```js
// Use the onLive2D method to listen for hit events
live2dSprite.onLive2D('hit', ({ hitAreaName, x, y }) => {
  console.log(`Clicked on ${hitAreaName}, coordinates: (${x}, ${y})`);
  
  // Play different motions based on the clicked area
  switch (hitAreaName.toLowerCase()) {
    case 'head':
      live2dSprite.startMotion({
        group: 'Tap',
        no: 0,
        priority: Priority.Force
      });
      break;
    case 'body':
      live2dSprite.startMotion({
        group: 'Tap',
        no: 1,
        priority: Priority.Force
      });
      break;
    // More areas...
  }
});
```

## Switching Expressions

The following code shows how to switch model expressions:

```js
// Set specific expression
function setExpression(expressionId) {
  live2dSprite.setExpression({ expressionId });
}

// Examples: Set different expressions
setExpression('normal'); // Set normal expression
setExpression('smile');  // Set smile expression
setExpression('angry');  // Set angry expression

// Switch to a random expression
function setRandomExpression() {
  live2dSprite.setRandomExpression();
}

// Create a simple UI to switch expressions
const expressionButtons = [
  { id: 'normal', label: 'Normal' },
  { id: 'smile', label: 'Smile' },
  { id: 'angry', label: 'Angry' },
  { id: 'sad', label: 'Sad' }
];

const buttonContainer = document.createElement('div');
buttonContainer.style.position = 'fixed';
buttonContainer.style.bottom = '20px';
buttonContainer.style.left = '20px';

expressionButtons.forEach(button => {
  const btn = document.createElement('button');
  btn.textContent = button.label;
  btn.onclick = () => setExpression(button.id);
  buttonContainer.appendChild(btn);
});

const randomBtn = document.createElement('button');
randomBtn.textContent = 'Random';
randomBtn.onclick = setRandomExpression;
buttonContainer.appendChild(randomBtn);

document.body.appendChild(buttonContainer);
```

## Motion Control

The following example demonstrates how to control model motions:

```js
// Play a specific motion
function playMotion(group, index, priority) {
  live2dSprite.startMotion({
    group,
    no: index,
    priority
  });
}

// Examples: Play different motions
playMotion('Idle', 0, Priority.Idle);      // Play idle motion
playMotion('Tap', 0, Priority.Normal);     // Play tap motion
playMotion('Special', 0, Priority.Force);  // Play special motion with forced priority

// Create a simple UI to control motions
const motionButtons = [
  { group: 'Idle', index: 0, label: 'Idle', priority: Priority.Idle },
  { group: 'Tap', index: 0, label: 'Nod', priority: Priority.Normal },
  { group: 'Tap', index: 1, label: 'Shake', priority: Priority.Normal },
  { group: 'Special', index: 0, label: 'Special', priority: Priority.Force }
];

const motionContainer = document.createElement('div');
motionContainer.style.position = 'fixed';
motionContainer.style.bottom = '60px';
motionContainer.style.left = '20px';

motionButtons.forEach(button => {
  const btn = document.createElement('button');
  btn.textContent = button.label;
  btn.onclick = () => playMotion(button.group, button.index, button.priority);
  motionContainer.appendChild(btn);
});

document.body.appendChild(motionContainer);
```

## Configuration Settings

The following example shows how to configure easy-live2d:

```js
// Import necessary types
import { Config, LogLevel, Priority } from 'easylive2d';

// Basic configuration
Config.MotionGroupIdle = 'Idle';       // Set default idle motion group
Config.MotionGroupTapBody = 'Tap';     // Set motion group for body taps
Config.HitAreaNameHead = 'Head';       // Set name for head hit area
Config.HitAreaNameBody = 'Body';       // Set name for body hit area

// Behavior configuration
Config.MouseFollow = true;             // Enable mouse following
Config.BreathingEnabled = true;        // Enable breathing effect
Config.EyeBlinkEnabled = true;         // Enable eye blinking

// Performance and debugging configuration
Config.CubismLoggingLevel = LogLevel.LogLevel_Warning; // Set log level
Config.UseHighPrecisionMatrix = true;   // Use high precision matrices (may affect performance)
```

## Advanced: Custom Rendering

If you need more control over the rendering process, you can add custom rendering logic:

```js
// Add custom post-processing effects on top of standard Pixi.js renderer

// Import necessary filters
import { BlurFilter, ColorMatrixFilter } from 'pixi.js';

// Create filters
const blurFilter = new BlurFilter(2);
const colorMatrix = new ColorMatrixFilter();
colorMatrix.brightness(1.2); // Increase brightness

// Apply filters to Live2D sprite
live2dSprite.filters = [blurFilter, colorMatrix];

// Create animation effects
let time = 0;
app.ticker.add(() => {
  time += 0.01;
  
  // Create breathing effect
  const scale = 1 + Math.sin(time) * 0.01;
  live2dSprite.scale.set(scale);
  
  // Adjust blur effect
  blurFilter.blur = 1 + Math.sin(time * 0.5) * 0.5;
});
```

## Next Steps

- Check out [Motion & Expression Examples](/en/examples/motion-expression) to learn more about interaction controls
- Learn about [Event Handling Examples](/en/examples/events) to implement more complex interaction effects
- Refer to [Framework Integration Examples](/en/examples/vue-integration) to learn how to use with modern frontend frameworks
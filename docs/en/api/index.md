# API Reference

This section provides comprehensive API documentation for easy-live2d, helping you understand all the features and usage methods of the library.

## Core Classes

The core of easy-live2d is the `Live2DSprite` class, which inherits from Pixi.js's `Sprite` class, allowing you to handle Live2D models just like regular Pixi sprites.

```ts
class Live2DSprite extends Sprite {
  // Properties and methods
}
```

## Main Components

### Live2DSprite

`Live2DSprite` is the main entry point class for easy-live2d, providing model loading, rendering, event handling, and other functionalities. For details, see [Live2DSprite API](/en/api/live2d-sprite).

### Configuration System

The `Config` object provides global configuration options for setting default behaviors. For details, see [Configuration Options](/en/api/config).

### Event System

An extension of the Pixi.js event system, providing Live2D-specific event types and handling mechanisms. For details, see [Event Types](/en/api/events).

### Managers

The manager system is responsible for managing resources like models, motions, expressions, and coordinating between them. For details, see [Managers](/en/api/managers).

## Type Definitions

easy-live2d is written in TypeScript, providing complete type definitions that help achieve good type support and code completion during development. The main type definitions include:

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
// Live2D-specific event type definitions
interface Live2DSpriteEvents {
  // Click event, returns the clicked area name and coordinates
  hit: [{ hitAreaName: string; x: number; y: number }];
  // Model loaded event
  load: [];
  // More events...
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

Controls the level of log output.

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

## Function Naming Conventions

easy-live2d's function naming follows these conventions:

- `init` and `initialize` prefixes are used for initialization methods
- `set` prefix is used for methods that set values
- `get` prefix is used for methods that get values
- `release` and `destroy` are used for methods that release resources
- `on` prefix is used for event listener related methods

## Example Usage

Here's a simple usage example:

```ts
import { Live2DSprite, Config, Priority } from 'easylive2d';
import { Application, Ticker } from 'pixi.js';

// Create application
const app = new Application();
app.init({ view: document.getElementById('canvas') });

// Create and initialize model
const live2d = new Live2DSprite();
live2d.init({
  modelPath: './models/Hiyori/Hiyori.model3.json',
  ticker: Ticker.shared
});

// Add to stage
app.stage.addChild(live2d);

// Set expression
live2d.setExpression({ expressionId: 'smile' });

// Play motion
live2d.startMotion({
  group: 'Tap',
  no: 0,
  priority: Priority.Force
});

// Listen for events
live2d.onLive2D('hit', ({ hitAreaName }) => {
  console.log(`Clicked on ${hitAreaName}`);
});
```

In the following pages, we will introduce the components and features of easy-live2d in detail.
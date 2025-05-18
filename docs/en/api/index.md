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

In the following pages, we will introduce the various components and features of easy-live2d in detail. (To be completed)
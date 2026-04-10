# API Reference

## Export Overview

```ts
export { Live2DSprite } from './Live2DSprite'
export { Config, ConfigType, LogLevel, Priority } from './utils/config'
export { CubismSetting } from './utils/cubismSetting'
```

Application code imports from the root package:

```ts
import {
  Config,
  CubismSetting,
  Live2DSprite,
  LogLevel,
  Priority,
  type ConfigType,
} from 'easy-live2d'
```

---

## Live2DSprite

Extends Pixi `Sprite`. The core facade class of the library.

### Constructor

```ts
new Live2DSprite(initConfig?: Live2DSpriteInit)
```

### init

```ts
sprite.init(config: Live2DSpriteInit): boolean
```

`Live2DSpriteInit`:

```ts
interface Live2DSpriteInit {
  modelPath?: string
  modelSetting?: CubismSetting
  ticker?: Ticker
  draggable?: boolean
}
```

| Field | Type | Description |
| --- | --- | --- |
| `modelPath` | `string` | Path to the model `.model3.json` |
| `modelSetting` | `CubismSetting` | Manually constructed model setting |
| `ticker` | `Ticker` | Pixi Ticker reference |
| `draggable` | `boolean` | Enable dragging. Default `false` |

- At least one of `modelPath` or `modelSetting` is required.
- If both are present, `modelPath` takes precedence.
- Model loading is triggered on Pixi's first render, not at construction time.

### Public Properties

| Property | Type | Description |
| --- | --- | --- |
| `modelPath` | `string \| null` | Model path |
| `modelSetting` | `CubismSetting \| null` | Model setting object |
| `ticker` | `Ticker \| null` | Ticker reference |
| `renderer` | `Renderer` | Pixi renderer, available after first render |
| `draggable` | `boolean` | Whether dragging is enabled |
| `width` | `number` | Logical model width (read/write) |
| `height` | `number` | Logical model height (read/write) |
| `ready` | `Promise<void>` | Stable Promise that resolves once the sprite is ready (see below) |

Inherited Pixi `Sprite` properties also work: `x`, `y`, `anchor`, `scale`, `rotation`, `visible`, etc.

### Promise-based Ready API

In addition to the event-based `onLive2D('ready', callback)` pattern, the instance exposes one async/await-friendly API: `ready`, which resolves when the model, textures, and interaction layer have finished loading.

#### ready

```ts
sprite.ready: Promise<void>
```

A stable `Promise` that resolves once the sprite becomes ready. The **same Promise instance** is returned on every access, so awaiting it multiple times does not attach extra listeners.

```ts
await sprite.ready
sprite.startMotion({ group: 'TapBody', no: 0, priority: Priority.Normal })
```

### Events

```ts
sprite.onLive2D(eventName, callback)
```

| Event | Callback Args | Description |
| --- | --- | --- |
| `ready` | `()` | Model, textures, and interaction initialized |
| `hit` | `({ hitAreaName, x, y })` | Click hit a model hit area |
| `dragStart` | `({ x, y, deltaX, deltaY })` | Drag started |
| `dragMove` | `({ x, y, deltaX, deltaY })` | Dragging |
| `dragEnd` | `({ x, y, deltaX, deltaY })` | Drag ended |

- `hit` `x`, `y` are model-view coordinates.
- `drag*` `x`, `y` are sprite position.

### Motion Control

#### startMotion

```ts
sprite.startMotion(params: MotionParams): Promise<CubismMotionQueueEntryHandle>
```

```ts
interface MotionParams {
  group: string
  no: number
  priority: number
  onStarted?: (motion: any) => void
  onFinished?: (motion: any) => void
}
```

Plays a specific motion by group and index. Calls before `ready` are automatically queued.

#### startRandomMotion

```ts
sprite.startRandomMotion(params: Omit<MotionParams, 'no'>): Promise<CubismMotionQueueEntryHandle>
```

Plays a random motion from the specified group.

#### releaseMotions

```ts
sprite.releaseMotions(): void
```

Releases cached motion data.

#### getMotions

```ts
sprite.getMotions(): MotionInfo[]
```

```ts
interface MotionInfo {
  group: string
  no: number
  name: string
}
```

Returns all available motions of the model. Each entry contains the group name, index, and a combined name. Returns an empty array if called before the model is ready.

### Expression Control

#### setExpression

```ts
sprite.setExpression(params: { expressionId: string } | { index: number }): void
```

Sets the specified expression. Pass either `expressionId` or `index`. Logs a warning if the value does not exist.

#### setRandomExpression

```ts
sprite.setRandomExpression(): void
```

Switches to a random expression.

#### releaseExpressions

```ts
sprite.releaseExpressions(): void
```

Releases cached expression data.

#### getExpressions

```ts
sprite.getExpressions(): ExpressionInfo[]
```

```ts
interface ExpressionInfo {
  name: string
}
```

Returns all available expressions of the model. Returns an empty array if called before the model is ready.

### Parameter Control

#### setParameterValueById

```ts
sprite.setParameterValueById(id: string, value: number, weight?: number): void
```

Sets a model parameter value by its string ID. `weight` is the blend weight (default `1`). Calls before `ready` are automatically queued.

```ts
sprite.setParameterValueById('ParamAngleX', 15.0)

// With weight
sprite.setParameterValueById('ParamMouthOpenY', 1.0, 0.8)
```

#### setParameterValueByIndex

```ts
sprite.setParameterValueByIndex(index: number, value: number, weight?: number): void
```

Sets a model parameter value by its numeric index. `weight` is the blend weight (default `1`). Calls before `ready` are automatically queued.

```ts
sprite.setParameterValueByIndex(0, 0.5)
```

#### getParameterValueRangeById

```ts
sprite.getParameterValueRangeById(id: string): { min: number, max: number } | null
```

Returns the value range of a model parameter by its string ID. Returns `null` if the model is not ready or the parameter does not exist.

```ts
const range = sprite.getParameterValueRangeById('ParamAngleX')
// range => { min: -30, max: 30 }
```

#### getParameterValueRangeByIndex

```ts
sprite.getParameterValueRangeByIndex(index: number): { min: number, max: number } | null
```

Returns the value range of a model parameter by its numeric index. Returns `null` if the model is not ready or the index is out of range.

```ts
const range = sprite.getParameterValueRangeByIndex(0)
// range => { min: -30, max: 30 }
```

### Voice Control

#### playVoice

```ts
sprite.playVoice(params: VoiceParams): Promise<void>
```

```ts
interface VoiceParams {
  voicePath: string
  immediate?: boolean
}
```

- `voicePath`: Audio resource path. Supports browser-decodable formats.
- `immediate`: Default `true`. Stops current voice before playing the new one.
- Lip sync requires `LipSync` parameter mapping in the model.

#### stopVoice

```ts
sprite.stopVoice(): void
```

Stops current voice playback.

### Size and Lifecycle

#### getModelCanvasSize

```ts
sprite.getModelCanvasSize(): { width: number, height: number, pixelsPerUnit: number } | null
```

Returns the model's original canvas size. Returns `null` if the model is not ready.

#### getSize

```ts
sprite.getSize(out?: Size): Size
```

Returns the current display size.

#### setSize

```ts
sprite.setSize(value: number | { width: number, height?: number }, height?: number): void
```

Sets the display size.

#### onResize

```ts
sprite.onResize(): void
```

Manually triggers view recalculation. Usually not needed — the internal `ResizeObserver` handles this.

#### destroy

```ts
sprite.destroy(options?: DestroyOptions): void
```

Cleans up all resources: pointer events, ResizeObserver, WebGL textures, Live2D context, Cubism lifecycle.

---

## Config

Global configuration singleton. Set before creating `Live2DSprite` instances.

```ts
import { Config, LogLevel } from 'easy-live2d'

Config.MotionGroupIdle = 'Idle'
Config.MouseFollow = true
Config.CubismLoggingLevel = LogLevel.LogLevel_Warning
```

### Fields

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `ViewScale` | `number` | `1.0` | Initial view scale |
| `ViewMaxScale` | `number` | `2.0` | Maximum scale |
| `ViewMinScale` | `number` | `0.8` | Minimum scale |
| `ViewLogicalLeft` | `number` | `-1.0` | Logical view left bound |
| `ViewLogicalRight` | `number` | `1.0` | Logical view right bound |
| `ViewLogicalBottom` | `number` | `-1.0` | Logical view bottom bound |
| `ViewLogicalTop` | `number` | `1.0` | Logical view top bound |
| `ViewLogicalMaxLeft` | `number` | `-2.0` | Max movement left bound |
| `ViewLogicalMaxRight` | `number` | `2.0` | Max movement right bound |
| `ViewLogicalMaxBottom` | `number` | `-2.0` | Max movement bottom bound |
| `ViewLogicalMaxTop` | `number` | `2.0` | Max movement top bound |
| `MotionGroupIdle` | `string` | `'Idle'` | Idle motion group to fall back to |
| `MOCConsistencyValidationEnable` | `boolean` | `true` | moc consistency validation |
| `DebugLogEnable` | `boolean` | `true` | Enable Cubism logging |
| `DebugTouchLogEnable` | `boolean` | `false` | Log touch coordinates |
| `CubismLoggingLevel` | `LogLevel` | `LogLevel_Verbose` | Cubism log level |
| `MouseFollow` | `boolean` | `true` | Model follows mouse |
| `crossOrigin` | `string \| undefined` | `'anonymous'` | The `crossOrigin` attribute applied to all texture images before upload via `texImage2D`. Prevents WebGL canvas tainting and `SecurityError`. Accepted values: `'anonymous'`, `'use-credentials'`, or `undefined` (disabled, not recommended). |

### crossOrigin Details

`Config.crossOrigin` sets `img.crossOrigin` on every texture image before it is uploaded to WebGL, preventing the browser from marking the canvas as "tainted" and avoiding:

```
SecurityError: The operation is insecure.
```

**Type and accepted values:**

| Value | Description |
| --- | --- |
| `'anonymous'` | Sends an anonymous cross-origin request (no cookies/credentials). The server must return `Access-Control-Allow-Origin`. *(Default)* |
| `'use-credentials'` | Sends credentials (cookies, client certificates, etc.). The server must return `Access-Control-Allow-Credentials: true` and `Access-Control-Allow-Origin` must not be `*`. |
| `undefined` | Disables the attribute. Cross-origin textures may cause a WebGL upload failure. **Not recommended.** |

**Usage example:**

```ts
import { Config } from 'easy-live2d'

// Default — usually no change needed
Config.crossOrigin = 'anonymous'

// When credentials (e.g. cookies) must be sent
Config.crossOrigin = 'use-credentials'

// Disabled (not recommended — cross-origin resources may throw SecurityError)
Config.crossOrigin = undefined
```

> **Notes**
> - Set this option before creating any `Live2DSprite` instance so that all texture loads are affected.
> - The asset server must return a valid `Access-Control-Allow-Origin` header. When using `'use-credentials'`, the server must also return `Access-Control-Allow-Credentials: true`, and `Access-Control-Allow-Origin` must not be the wildcard `*`.
> - Setting this to `undefined` may cause WebGL to throw a `SecurityError` when loading cross-origin textures.

### resetConfig

```ts
Config.resetConfig(): void
```

Restores all fields to defaults.

---

## ConfigType

TypeScript type definition for the `Config` object. Type-only, no runtime value.

---

## Priority

Motion priority enum.

```ts
enum Priority {
  None = 0,   // No preemption
  Idle = 1,   // Idle motion
  Normal = 2, // Normal motion
  Force = 3,  // Force-interrupt current motion
}
```

---

## LogLevel

Log level enum re-exported from Cubism Framework. Used with `Config.CubismLoggingLevel`.

| Member | Description |
| --- | --- |
| `LogLevel.LogLevel_Verbose` | Verbose logging |
| `LogLevel.LogLevel_Debug` | Debug logging |
| `LogLevel.LogLevel_Info` | Info logging |
| `LogLevel.LogLevel_Warning` | Warning logging |
| `LogLevel.LogLevel_Error` | Error logging |
| `LogLevel.LogLevel_Off` | Logging disabled |

---

## CubismSetting

Model configuration wrapper. Use when receiving `model3.json` at runtime and controlling asset paths.

### Constructor

```ts
new CubismSetting({ modelJSON: any, prefixPath?: string })
```

| Field | Description |
| --- | --- |
| `modelJSON` | Parsed `model3.json` object |
| `prefixPath` | Shared prefix for relative asset paths |

### redirectPath

```ts
setting.redirectPath(redirFn: ({ file: string }) => string): void
```

Rewrites paths for moc, textures, physics, pose, expressions, motions, and user data. Takes precedence over `prefixPath`.

```ts
const setting = new CubismSetting({
  modelJSON,
  prefixPath: '/Resources/Hiyori/',
})

setting.redirectPath(({ file }) => {
  return `https://cdn.example.com/live2d/hiyori/${file}`
})
```

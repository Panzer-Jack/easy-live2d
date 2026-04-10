# Basic Usage

## Create an Instance

### Option 1: Pass `modelPath`

```ts
import { Live2DSprite } from 'easy-live2d'
import { Ticker } from 'pixi.js'

const sprite = new Live2DSprite({
  modelPath: '/Resources/Hiyori/Hiyori.model3.json',
  ticker: Ticker.shared,
})
```

### Option 2: Create First, Then `init()`

```ts
const sprite = new Live2DSprite()

sprite.init({
  modelPath: '/Resources/Hiyori/Hiyori.model3.json',
  ticker: Ticker.shared,
  draggable: true,
})
```

### Option 3: Use `CubismSetting`

```ts
import { CubismSetting, Live2DSprite } from 'easy-live2d'
import { Ticker } from 'pixi.js'

const modelJSON = await fetch('/Resources/Hiyori/Hiyori.model3.json').then(r => r.json())

const modelSetting = new CubismSetting({
  modelJSON,
  prefixPath: '/Resources/Hiyori/',
})

// Optional: rewrite asset paths (takes precedence over prefixPath)
modelSetting.redirectPath(({ file }) => {
  return `https://cdn.example.com/live2d/hiyori/${file}`
})

const sprite = new Live2DSprite({
  modelSetting,
  ticker: Ticker.shared,
})
```

You must provide at least `modelPath` or `modelSetting`. If both are present, `modelPath` takes precedence.

## Add to a Pixi Scene

```ts
import { Application } from 'pixi.js'

const canvas = document.getElementById('live2d') as HTMLCanvasElement
const app = new Application()

await app.init({
  canvas,
  backgroundAlpha: 0,
  autoDensity: true,
  resolution: Math.max(window.devicePixelRatio || 1, 1),
})

sprite.width = canvas.clientWidth
app.stage.addChild(sprite)
```

`Live2DSprite` extends Pixi `Sprite`, so all standard properties work:

```ts
sprite.x = 40
sprite.y = -80
sprite.anchor.set(0.5)
sprite.scale.set(0.8)
```

## Wait for Model Ready

The `ready` event fires after internal initialization completes:

```ts
sprite.onLive2D('ready', () => {
  console.log('model ready')
  console.log(sprite.getModelCanvasSize())
})
```

Operations that depend on model state — getting the original canvas size, playing the first motion, etc. — should go in the `ready` callback.

::: tip
Calling `startMotion()`, `setExpression()`, `playVoice()`, etc. before `ready` is safe — requests are automatically queued and executed after initialization.
:::

## Hit Areas

```ts
import { Priority } from 'easy-live2d'

sprite.onLive2D('hit', async ({ hitAreaName, x, y }) => {
  console.log('hit area:', hitAreaName, x, y)

  if (hitAreaName === 'Head') {
    await sprite.startMotion({
      group: 'TapBody',
      no: 0,
      priority: Priority.Force,
    })
  }
})
```

- `hitAreaName` comes from the model's `HitAreas` config.
- `x`, `y` are transformed model-view coordinates, not DOM pixel coordinates.

## Drag the Model

```ts
const sprite = new Live2DSprite({
  modelPath: '/Resources/Hiyori/Hiyori.model3.json',
  draggable: true,
})

sprite.onLive2D('dragStart', ({ x, y }) => {
  console.log('drag start', x, y)
})

sprite.onLive2D('dragMove', ({ x, y, deltaX, deltaY }) => {
  console.log('dragging', x, y, deltaX, deltaY)
})

sprite.onLive2D('dragEnd', ({ x, y }) => {
  console.log('drag end', x, y)
})
```

- Drag events only fire when `draggable: true`.
- `x`, `y` in drag events are the sprite position, not pointer coordinates.

## Play Motions

```ts
import { Priority } from 'easy-live2d'

// Play a specific motion
await sprite.startMotion({
  group: 'TapBody',
  no: 0,
  priority: Priority.Normal,
})

// Play a random motion from the group
await sprite.startRandomMotion({
  group: 'TapBody',
  priority: Priority.Normal,
})
```

`Priority` values:

| Value             | Description                        |
| ----------------- | ---------------------------------- |
| `Priority.None`   | No preemption                      |
| `Priority.Idle`   | Idle motion                        |
| `Priority.Normal` | Normal motion                      |
| `Priority.Force`  | Force-interrupt the current motion |

After a motion finishes, the runtime falls back to the idle group specified by `Config.MotionGroupIdle`.

## Change Expressions

```ts
// By expressionId
sprite.setExpression({ expressionId: 'smile' })

// By index
sprite.setExpression({ index: 0 })

sprite.setRandomExpression()
```

A warning is logged if the `expressionId` or `index` does not exist.

## Voice and Lip Sync

```ts
// Play voice
await sprite.playVoice({
  voicePath: '/Resources/Hiyori/sounds/test.wav',
})

// immediate: true stops current voice before playing
await sprite.playVoice({
  voicePath: '/Resources/Hiyori/sounds/test.mp3',
  immediate: true,
})

// Stop voice
sprite.stopVoice()
```

- Voice decoding uses Web Audio `decodeAudioData` — supports any browser-decodable audio format (wav, mp3, ogg, etc.).
- Lip sync requires `LipSync` parameter mapping in the model.

## Size Control

```ts
// Set width and height directly
sprite.width = 420
sprite.height = 760

// Set via setSize
sprite.setSize(420, 760)

// Get current size
const size = sprite.getSize()

// Get original model canvas size
const canvasSize = sprite.getModelCanvasSize()
// => { width, height, pixelsPerUnit } | null
```

`width` / `height` can be set before the model loads — they are applied automatically after initialization.

## Global Config

```ts
import { Config, LogLevel } from 'easy-live2d'

Config.MotionGroupIdle = 'Idle'
Config.MouseFollow = true
Config.DebugTouchLogEnable = false
Config.CubismLoggingLevel = LogLevel.LogLevel_Warning
```

Common fields:

| Field                            | Default            | Description                                                                         |
| -------------------------------- | ------------------ | ----------------------------------------------------------------------------------- |
| `MotionGroupIdle`                | `'Idle'`           | Idle motion group to fall back to                                                   |
| `MouseFollow`                    | `true`             | Model follows mouse movement                                                        |
| `MotionSound`                    | `true`             | Whether to automatically play motion-bound sound effects when calling `startMotion` |
| `DebugLogEnable`                 | `true`             | Enable Cubism logging                                                               |
| `DebugTouchLogEnable`            | `false`            | Log touch coordinates                                                               |
| `CubismLoggingLevel`             | `LogLevel_Verbose` | Cubism Framework log level                                                          |
| `MOCConsistencyValidationEnable` | `true`             | Enable moc consistency validation                                                   |

Use `Config.resetConfig()` to restore all defaults.

## Parameter Control

```ts
// Set a parameter value by ID (persists across frames — re-applied every render cycle)
sprite.setParameterValueById('ParamAngleX', 15.0)

// With blend weight
sprite.setParameterValueById('ParamMouthOpenY', 1.0, 0.8)

// Set a parameter value by index
sprite.setParameterValueByIndex(0, 0.5)

// Get the value range of a parameter by ID
const range = sprite.getParameterValueRangeById('ParamAngleX')
// range => { min: -30, max: 30 }

// Get the value range of a parameter by index
const rangeByIndex = sprite.getParameterValueRangeByIndex(0)
// rangeByIndex => { min: -30, max: 30 }
```

- Values set via `setParameterValueById` / `setParameterValueByIndex` **persist across frames** — they are re-applied every render cycle without needing to be called again each frame.
- Calls before `ready` are automatically queued and executed after initialization.
- `getParameterValueRangeById` / `getParameterValueRangeByIndex` return `null` if the model is not ready or the parameter does not exist.

## Release Resources

```ts
sprite.destroy()
```

Cleans up pointer listeners, `ResizeObserver`, WebGL texture cache, Live2D context, and Cubism lifecycle. Call this on component unmount in Vue, React, etc.

## Multiple Instances

Each `Live2DSprite` holds its own context and event bus, supporting multiple instances in the same Pixi scene:

```ts
const spriteA = new Live2DSprite({
  modelPath: '/Resources/Hiyori/Hiyori.model3.json',
  ticker: Ticker.shared,
})

const spriteB = new Live2DSprite({
  modelPath: '/Resources/Mark/Mark.model3.json',
  ticker: Ticker.shared,
})

spriteA.width = 300
spriteB.width = 300
spriteB.x = 400

app.stage.addChild(spriteA)
app.stage.addChild(spriteB)
```

# 基本用法

## 创建实例

### 方式一：直接传 `modelPath`

```ts
import { Live2DSprite } from 'easy-live2d'
import { Ticker } from 'pixi.js'

const sprite = new Live2DSprite({
  modelPath: '/Resources/Hiyori/Hiyori.model3.json',
  ticker: Ticker.shared,
})
```

### 方式二：先创建，再 `init()`

```ts
const sprite = new Live2DSprite()

sprite.init({
  modelPath: '/Resources/Hiyori/Hiyori.model3.json',
  ticker: Ticker.shared,
  draggable: true,
})
```

### 方式三：使用 `CubismSetting`

```ts
import { CubismSetting, Live2DSprite } from 'easy-live2d'
import { Ticker } from 'pixi.js'

const modelJSON = await fetch('/Resources/Hiyori/Hiyori.model3.json').then(r => r.json())

const modelSetting = new CubismSetting({
  modelJSON,
  prefixPath: '/Resources/Hiyori/',
})

// 可选：重写资源路径（优先级高于 prefixPath）
modelSetting.redirectPath(({ file }) => {
  return `https://cdn.example.com/live2d/hiyori/${file}`
})

const sprite = new Live2DSprite({
  modelSetting,
  ticker: Ticker.shared,
})
```

`modelPath` 和 `modelSetting` 至少提供一个。两者同时存在时优先使用 `modelPath`。

## 加入 Pixi 场景

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

`Live2DSprite` 继承自 Pixi `Sprite`，支持所有标准属性：

```ts
sprite.x = 40
sprite.y = -80
sprite.anchor.set(0.5)
sprite.scale.set(0.8)
```

## 监听模型就绪

模型完成内部初始化后触发 `ready` 事件：

```ts
sprite.onLive2D('ready', () => {
  console.log('模型已就绪')
  console.log(sprite.getModelCanvasSize())
})
```

获取模型原始尺寸、播放首个动作等依赖模型状态的操作，应放在 `ready` 回调中。

::: tip
在 `ready` 之前调用 `startMotion()`、`setExpression()`、`playVoice()` 等方法时，请求会自动排队，待模型初始化完成后执行。
:::

## 点击命中区域

```ts
import { Priority } from 'easy-live2d'

sprite.onLive2D('hit', async ({ hitAreaName, x, y }) => {
  console.log('命中区域:', hitAreaName, x, y)

  if (hitAreaName === 'Head') {
    await sprite.startMotion({
      group: 'TapBody',
      no: 0,
      priority: Priority.Force,
    })
  }
})
```

- `hitAreaName` 来自模型 `HitAreas` 配置。
- `x`、`y` 是变换后的模型视图坐标，不是 DOM 像素坐标。

## 拖拽模型

```ts
const sprite = new Live2DSprite({
  modelPath: '/Resources/Hiyori/Hiyori.model3.json',
  draggable: true,
})

sprite.onLive2D('dragStart', ({ x, y }) => {
  console.log('开始拖拽', x, y)
})

sprite.onLive2D('dragMove', ({ x, y, deltaX, deltaY }) => {
  console.log('拖拽中', x, y, deltaX, deltaY)
})

sprite.onLive2D('dragEnd', ({ x, y }) => {
  console.log('拖拽结束', x, y)
})
```

- 需要 `draggable: true` 才会触发拖拽事件。
- 拖拽事件中的 `x`、`y` 是精灵位置，不是指针坐标。

## 播放动作

```ts
import { Priority } from 'easy-live2d'

// 播放指定动作
await sprite.startMotion({
  group: 'TapBody',
  no: 0,
  priority: Priority.Normal,
})

// 随机播放
await sprite.startRandomMotion({
  group: 'TapBody',
  priority: Priority.Normal,
})
```

`Priority` 枚举值：

| 值 | 说明 |
| --- | --- |
| `Priority.None` | 不主动抢占 |
| `Priority.Idle` | 空闲动作 |
| `Priority.Normal` | 普通动作 |
| `Priority.Force` | 强制打断当前动作 |

动作结束后会自动回落到 `Config.MotionGroupIdle` 指定的 idle 动作组。

## 切换表情

```ts
// 通过 expressionId
sprite.setExpression({ expressionId: 'smile' })

// 通过 index
sprite.setExpression({ index: 0 })

sprite.setRandomExpression()
```

`expressionId` 或 `index` 不存在时会在控制台输出警告。

## 语音与口型同步

```ts
// 播放语音
await sprite.playVoice({
  voicePath: '/Resources/Hiyori/sounds/test.wav',
})

// immediate: true 会先停止当前语音再播放
await sprite.playVoice({
  voicePath: '/Resources/Hiyori/sounds/test.mp3',
  immediate: true,
})

// 停止语音
sprite.stopVoice()
```

- 语音解码使用 Web Audio `decodeAudioData`，支持浏览器可解码的音频格式（wav、mp3、ogg 等）。
- 口型同步依赖模型中配置的 `LipSync` 参数映射。

## 尺寸控制

```ts
// 直接设置宽高
sprite.width = 420
sprite.height = 760

// 通过 setSize 设置
sprite.setSize(420, 760)

// 获取尺寸
const size = sprite.getSize()

// 获取模型原始画布尺寸
const canvasSize = sprite.getModelCanvasSize()
// => { width, height, pixelsPerUnit } | null
```

`width` / `height` 可以在模型加载前设置，内部会在初始化完成后自动应用。

## 全局配置

```ts
import { Config, LogLevel } from 'easy-live2d'

Config.MotionGroupIdle = 'Idle'
Config.MouseFollow = true
Config.DebugTouchLogEnable = false
Config.CubismLoggingLevel = LogLevel.LogLevel_Warning
```

常用配置项：

| 字段 | 默认值 | 说明 |
| --- | --- | --- |
| `MotionGroupIdle` | `'Idle'` | 动作结束后回落的 idle 动作组 |
| `MouseFollow` | `true` | 模型是否跟随鼠标移动 |
| `DebugLogEnable` | `true` | 是否启用 Cubism 日志 |
| `DebugTouchLogEnable` | `false` | 是否输出点击坐标日志 |
| `CubismLoggingLevel` | `LogLevel_Verbose` | Cubism Framework 日志级别 |
| `MOCConsistencyValidationEnable` | `true` | 是否开启 moc 一致性校验 |

使用 `Config.resetConfig()` 可恢复所有默认值。

## 释放资源

```ts
sprite.destroy()
```

销毁时会清理指针事件监听、`ResizeObserver`、WebGL 纹理缓存、Live2D 上下文和 Cubism 生命周期。在 Vue、React 等框架中应在组件卸载时调用。

## 多实例

每个 `Live2DSprite` 持有独立的上下文和事件总线，支持在同一个 Pixi 场景中创建多个实例：

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

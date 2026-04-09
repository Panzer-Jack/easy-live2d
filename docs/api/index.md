# API 参考

## 导出总览

```ts
export { Live2DSprite } from './Live2DSprite'
export { Config, ConfigType, LogLevel, Priority } from './utils/config'
export { CubismSetting } from './utils/cubismSetting'
```

业务代码从根包导入：

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

继承自 Pixi `Sprite`，是库的核心门面类。

### 构造函数

```ts
new Live2DSprite(initConfig?: Live2DSpriteInit)
```

### init

```ts
sprite.init(config: Live2DSpriteInit): boolean
```

`Live2DSpriteInit` 定义：

```ts
interface Live2DSpriteInit {
  modelPath?: string
  modelSetting?: CubismSetting
  ticker?: Ticker
  draggable?: boolean
}
```

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `modelPath` | `string` | 模型 `.model3.json` 路径 |
| `modelSetting` | `CubismSetting` | 手动构造的模型设置对象 |
| `ticker` | `Ticker` | Pixi Ticker 引用 |
| `draggable` | `boolean` | 是否允许拖拽，默认 `false` |

- `modelPath` 和 `modelSetting` 至少提供一个。
- 两者同时存在时优先使用 `modelPath`。
- 模型加载在 Pixi 首次渲染时触发，而非构造时立即执行。

### 公开属性

| 属性 | 类型 | 说明 |
| --- | --- | --- |
| `modelPath` | `string \| null` | 模型路径 |
| `modelSetting` | `CubismSetting \| null` | 模型设置对象 |
| `ticker` | `Ticker \| null` | Ticker 引用 |
| `renderer` | `Renderer` | Pixi 渲染器，首次渲染后可用 |
| `draggable` | `boolean` | 是否允许拖拽 |
| `width` | `number` | 模型逻辑宽度（可读写） |
| `height` | `number` | 模型逻辑高度（可读写） |
| `ready` | `Promise<void>` | 模型就绪后 resolve 的稳定 Promise（见下方说明） |

继承自 Pixi `Sprite` 的属性同样可用：`x`、`y`、`anchor`、`scale`、`rotation`、`visible` 等。

### 基于 Promise 的 Ready API

除事件回调方式 `onLive2D('ready', callback)` 外，实例还提供了一个 async/await 友好的 API：`ready`，在模型、纹理及交互层加载完成后 resolve。

#### ready

```ts
sprite.ready: Promise<void>
```

一个稳定的 `Promise`，在精灵就绪后 resolve。每次访问返回**同一个 Promise 实例**，多次 await 不会重复挂载监听器。

```ts
await sprite.ready
sprite.startMotion({ group: 'TapBody', no: 0, priority: Priority.Normal })
```

### 事件

```ts
sprite.onLive2D(eventName, callback)
```

| 事件名 | 回调参数 | 说明 |
| --- | --- | --- |
| `ready` | `()` | 模型、纹理和交互层初始化完成 |
| `hit` | `({ hitAreaName, x, y })` | 点击命中模型 hit area |
| `dragStart` | `({ x, y, deltaX, deltaY })` | 开始拖拽 |
| `dragMove` | `({ x, y, deltaX, deltaY })` | 拖拽移动中 |
| `dragEnd` | `({ x, y, deltaX, deltaY })` | 拖拽结束 |

- `hit` 的 `x`、`y` 是模型视图坐标。
- `drag*` 的 `x`、`y` 是精灵位置。

### 动作控制

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

按动作组和索引播放指定动作。`ready` 前调用会自动排队。

#### startRandomMotion

```ts
sprite.startRandomMotion(params: Omit<MotionParams, 'no'>): Promise<CubismMotionQueueEntryHandle>
```

从指定动作组中随机播放一个动作。

#### releaseMotions

```ts
sprite.releaseMotions(): void
```

释放已加载的动作缓存。

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

获取模型所有可用动作列表。返回每个动作的分组名、索引和名称。模型就绪前调用返回空数组。

### 表情控制

#### setExpression

```ts
sprite.setExpression(params: { expressionId: string } | { index: number }): void
```

设置指定表情。支持通过 `expressionId` 或 `index` 指定，二选一。不存在时控制台输出警告。

#### setRandomExpression

```ts
sprite.setRandomExpression(): void
```

随机切换表情。

#### releaseExpressions

```ts
sprite.releaseExpressions(): void
```

释放已加载的表情缓存。

#### getExpressions

```ts
sprite.getExpressions(): ExpressionInfo[]
```

```ts
interface ExpressionInfo {
  name: string
}
```

获取模型所有可用表情列表。模型就绪前调用返回空数组。

### 语音控制

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

- `voicePath`：音频资源路径，支持浏览器可解码的格式。
- `immediate`：默认 `true`，先停止当前语音再播放新语音。
- 口型同步依赖模型中的 `LipSync` 参数映射。

#### stopVoice

```ts
sprite.stopVoice(): void
```

停止当前语音。

### 尺寸与生命周期

#### getModelCanvasSize

```ts
sprite.getModelCanvasSize(): { width: number, height: number, pixelsPerUnit: number } | null
```

返回模型原始画布尺寸。模型未就绪时返回 `null`。

#### getSize

```ts
sprite.getSize(out?: Size): Size
```

返回当前显示尺寸。

#### setSize

```ts
sprite.setSize(value: number | { width: number, height?: number }, height?: number): void
```

设置显示尺寸。

#### onResize

```ts
sprite.onResize(): void
```

手动触发视图重算。通常不需要调用，内部 `ResizeObserver` 会自动处理。

#### destroy

```ts
sprite.destroy(options?: DestroyOptions): void
```

清理所有资源：指针事件、ResizeObserver、WebGL 纹理、Live2D 上下文、Cubism 生命周期。

---

## Config

全局配置单例，建议在创建 `Live2DSprite` 之前设置。

```ts
import { Config, LogLevel } from 'easy-live2d'

Config.MotionGroupIdle = 'Idle'
Config.MouseFollow = true
Config.CubismLoggingLevel = LogLevel.LogLevel_Warning
```

### 字段

| 字段 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `ViewScale` | `number` | `1.0` | 初始视图缩放 |
| `ViewMaxScale` | `number` | `2.0` | 最大缩放 |
| `ViewMinScale` | `number` | `0.8` | 最小缩放 |
| `ViewLogicalLeft` | `number` | `-1.0` | 逻辑视图左边界 |
| `ViewLogicalRight` | `number` | `1.0` | 逻辑视图右边界 |
| `ViewLogicalBottom` | `number` | `-1.0` | 逻辑视图下边界 |
| `ViewLogicalTop` | `number` | `1.0` | 逻辑视图上边界 |
| `ViewLogicalMaxLeft` | `number` | `-2.0` | 视图移动最大左边界 |
| `ViewLogicalMaxRight` | `number` | `2.0` | 视图移动最大右边界 |
| `ViewLogicalMaxBottom` | `number` | `-2.0` | 视图移动最大下边界 |
| `ViewLogicalMaxTop` | `number` | `2.0` | 视图移动最大上边界 |
| `MotionGroupIdle` | `string` | `'Idle'` | 动作结束后回落的 idle 动作组 |
| `MOCConsistencyValidationEnable` | `boolean` | `true` | moc 一致性校验 |
| `DebugLogEnable` | `boolean` | `true` | 启用 Cubism 日志 |
| `DebugTouchLogEnable` | `boolean` | `false` | 输出点击坐标日志 |
| `CubismLoggingLevel` | `LogLevel` | `LogLevel_Verbose` | Cubism 日志级别 |
| `MouseFollow` | `boolean` | `true` | 模型跟随鼠标 |
| `crossOrigin` | `string \| undefined` | `'anonymous'` | 纹理图片的 `crossOrigin` 属性，用于避免 WebGL 跨域纹理导致的 `SecurityError`。可设为 `'anonymous'`、`'use-credentials'` 或 `undefined`（禁用，不推荐）。 |

### crossOrigin 说明

`Config.crossOrigin` 会在所有纹理图片（用于 `texImage2D` 的 `<img>`）加载前统一设置 `img.crossOrigin`，避免浏览器将 WebGL 画布标记为 "tainted"，从而防止出现以下错误：

```
SecurityError: The operation is insecure.
```

**类型与取值：**

| 取值 | 说明 |
| --- | --- |
| `'anonymous'` | 发起匿名跨域请求（不携带 Cookie/证书），服务端需返回 `Access-Control-Allow-Origin`（默认值） |
| `'use-credentials'` | 携带凭据（Cookie、客户端证书等），服务端 `Access-Control-Allow-Origin` 不能为 `*`，且需设置 `Access-Control-Allow-Credentials: true` |
| `undefined` | 不设置 `crossOrigin`，跨域纹理可能导致 WebGL 上传失败，**不推荐** |

**使用示例：**

```ts
import { Config } from 'easy-live2d'

// 默认值，通常无需手动设置
Config.crossOrigin = 'anonymous'

// 若需携带 Cookie 等凭据
Config.crossOrigin = 'use-credentials'

// 禁用（不推荐，跨域资源可能引发 SecurityError）
Config.crossOrigin = undefined
```

> **注意事项**
> - 请在创建 `Live2DSprite` 实例之前设置此项，以确保所有纹理加载均生效。
> - 资源服务器必须返回正确的 `Access-Control-Allow-Origin` 响应头；使用 `'use-credentials'` 时，服务端还需返回 `Access-Control-Allow-Credentials: true`，且 `Access-Control-Allow-Origin` 不能为通配符 `*`。
> - 若将此项设为 `undefined`，加载跨域纹理时 WebGL 可能抛出 `SecurityError`。

### resetConfig

```ts
Config.resetConfig(): void
```

恢复所有字段为默认值。

---

## ConfigType

`Config` 对象的 TypeScript 类型定义，仅用于类型标注。

---

## Priority

动作优先级枚举。

```ts
enum Priority {
  None = 0,   // 不主动抢占
  Idle = 1,   // 空闲动作
  Normal = 2, // 普通动作
  Force = 3,  // 强制打断当前动作
}
```

---

## LogLevel

从 Cubism Framework 透出的日志级别枚举，用于 `Config.CubismLoggingLevel`。

| 成员 | 说明 |
| --- | --- |
| `LogLevel.LogLevel_Verbose` | 详细日志 |
| `LogLevel.LogLevel_Debug` | 调试日志 |
| `LogLevel.LogLevel_Info` | 信息日志 |
| `LogLevel.LogLevel_Warning` | 警告日志 |
| `LogLevel.LogLevel_Error` | 错误日志 |
| `LogLevel.LogLevel_Off` | 关闭日志 |

---

## CubismSetting

模型配置包装类，适合运行时接收 `model3.json` 内容并控制资源路径。

### 构造函数

```ts
new CubismSetting({ modelJSON: any, prefixPath?: string })
```

| 字段 | 说明 |
| --- | --- |
| `modelJSON` | 已解析的 `model3.json` 对象 |
| `prefixPath` | 资源公共前缀路径 |

### redirectPath

```ts
setting.redirectPath(redirFn: ({ file: string }) => string): void
```

对 moc、纹理、物理、姿态、表情、动作、用户数据的路径逐项改写。改写优先级高于 `prefixPath`。

```ts
const setting = new CubismSetting({
  modelJSON,
  prefixPath: '/Resources/Hiyori/',
})

setting.redirectPath(({ file }) => {
  return `https://cdn.example.com/live2d/hiyori/${file}`
})
```

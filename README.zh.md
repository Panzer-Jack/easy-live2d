<div align="center">
  <p align="center">
      <img src="https://github.com/user-attachments/assets/4ebc2d19-2ebe-4490-b214-e6ac8b350ce0" alt="feuse-mcp" width="300px">
  </p>

  <h1>easy-live2d</h1>

让 Live2D 集成更简单！一个基于 Pixi.js 轻量、开发者友好的 Live2D Web SDK 封装库。

让你的 Live2D 和操控 pixi sprite 一样简单！

  <div align="center">
      <img src="https://img.shields.io/badge/node-%5E18.0.0%20%7C%7C%20%3E%3D20.0.0-brightgreen" alt="Node.js">
      <img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="license">
  </div>
</div>

中文 | [English](/README.md)

你能够直接用这个 云IDE [StackBlitz](https://stackblitz.com/~/github.com/Panzer-Jack/easy-live2d-playground) 在你的浏览器上直接体验到 easy-live2d 的魅力！😋

---

## 📖 文档

👉 [easy-live2d 官方文档](https://panzer-jack.github.io/easy-live2d)

## 概述

`easy-live2d` 将 Live2D 模型封装为 Pixi.js `Sprite` 对象，提供精简的 API 覆盖模型加载、命中检测、拖拽、动作播放、表情切换、语音播放与口型同步。

公开导出：

- `Live2DSprite` — 核心类，继承自 Pixi `Sprite`
- `Config` — 全局运行配置
- `CubismSetting` — 手动模型配置，支持路径重定向
- `Priority` — 动作优先级枚举
- `LogLevel` — Cubism 日志级别枚举

## 版本与 Cubism 兼容性

**本分支的 R5 改动（计划版本 `easy-live2d@1.0.0-uat.0`）仅支持配套使用 Cubism 5 SDK for Web R5 的 Core 和 Framework，运行环境必须支持 WebGL 2。** 升级时请同步替换页面加载的 `live2dcubismcore.js` 并更新缓存版本，不能只升级 npm 包后继续使用旧 Core。

如果项目需要继续使用旧版 Cubism SDK / Core，请将 easy-live2d 回退并固定到 **`0.4.4`**，同时保留或恢复该项目原先配套、已验证可用的 Core：

```bash
pnpm add --save-exact easy-live2d@0.4.4
# 或
npm install --save-exact easy-live2d@0.4.4
# 或
yarn add --exact easy-live2d@0.4.4
```

`0.4.4` 是本次 R5 升级前的版本，不代表支持所有历史 Cubism SDK / Core 的任意组合。不要混用新版 Framework 与旧版 Core。

这里的版本要求针对 **SDK / Core**。已有旧 `.moc3` 模型通常可以继续由 R5 加载，无需仅因模型导出版本较旧而回退 easy-live2d；升级后仍需验证模型表现。

本地包版本号仍是 `0.4.4`，本轮尚未执行发布；本文描述待发布的 R5 实现。版本记录见 [更新日志](docs/changelog.md)，升级步骤见 [R5 迁移说明](docs/guide/cubism-r5-migration.md)。不指定版本的 npm 安装命令获取的是已发布包，可能与本分支不同；验证当前代码请使用下方本地开发流程。

## 安装

```bash
pnpm add easy-live2d pixi.js
# 或
npm install easy-live2d pixi.js
# 或
yarn add easy-live2d pixi.js
```

## 前置条件

1. 在页面入口引入 **Cubism 5 SDK for Web R5** 的 `live2dcubismcore.js`（[Live2D Cubism SDK for Web](https://www.live2d.com/en/sdk/download/web/)）
2. 支持 WebGL 2 的浏览器环境（不支持 SSR）
3. 可访问的 Live2D `model3.json` 模型文件

```html
<script src="/Core/live2dcubismcore.js"></script>
```

## 快速开始

```html
<!doctype html>
<html>
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>easy-live2d</title>
    <style>
      html,
      body {
        margin: 0;
        width: 100%;
        height: 100%;
      }
      #live2d {
        display: block;
        width: 100vw;
        height: 100vh;
      }
    </style>
  </head>
  <body>
    <canvas id="live2d"></canvas>
    <script src="/Core/live2dcubismcore.js"></script>
    <script type="module">
      import { Application } from 'pixi.js'
      import { Config, Live2DSprite, Priority } from 'easy-live2d'

      Config.MotionGroupIdle = 'Idle'
      Config.MouseFollow = true

      const canvas = document.getElementById('live2d')
      const app = new Application()

      await app.init({
        canvas,
        backgroundAlpha: 0,
        autoDensity: true,
        resolution: Math.max(window.devicePixelRatio || 1, 1),
      })

      const sprite = new Live2DSprite({
        modelPath: '/Resources/Hiyori/Hiyori.model3.json',
      })

      sprite.width = canvas.clientWidth
      app.stage.addChild(sprite)

      try {
        await sprite.ready
        await sprite.startMotion({ group: 'TapBody', no: 0, priority: Priority.Normal })
      } catch (error) {
        console.error('模型初始化或动作加载失败', error)
      }
    </script>
  </body>
</html>
```

## 运行行为

- Pixi 默认优先使用 WebGL 2，无需额外填写渲染选项或 `ticker`；`ticker` 仅保留接口兼容。
- 使用 `await sprite.ready` 处理初始化失败。已声明资源加载失败时尽可能提供 URL、HTTP 状态，失败后不会每帧重试。
- 同步 `ready` 回调抛错只记录回调错误，不会释放模型；异步回调中的错误仍需自行捕获。
- 语音归每个精灵独立持有，停止或销毁会取消待完成语音操作，不打断其他模型；播放和口型共用一次下载、解码。
- 首帧时间间隔为 0，长时间暂停后单次最多推进 100ms；所属页面卸载时应销毁精灵。

## 功能一览

```ts
import { Config, CubismSetting, Live2DSprite, LogLevel, Priority } from 'easy-live2d'

Config.CubismLoggingLevel = LogLevel.LogLevel_Warning

// 关闭动作自动播放音效（默认开启）
// Config.MotionSound = false

// 配置纹理图片的 crossOrigin，防止 WebGL 纹理上传时触发 SecurityError。
// 默认值为 "anonymous"，适用于大多数 CDN 跨域场景。
// 如果服务器需要凭证，可设置为 "use-credentials"。
// 设置为 undefined 可关闭此功能（不推荐用于跨域资源）。
// 注意：服务器必须返回正确的 Access-Control-Allow-Origin 响应头。
Config.crossOrigin = 'anonymous'

const sprite = new Live2DSprite({
  modelPath: '/Resources/Hiyori/Hiyori.model3.json',
  draggable: true,
})

// 命中检测
sprite.onLive2D('hit', ({ hitAreaName }) => {
  console.log(hitAreaName)
})

// 拖拽事件
sprite.onLive2D('dragMove', ({ x, y }) => {
  console.log(x, y)
})

// 动作播放
await sprite.startMotion({
  group: 'TapBody',
  no: 0,
  priority: Priority.Force,
})

// 表情切换（通过 expressionId）
sprite.setExpression({ expressionId: 'smile' })

// 表情切换（通过 index）
sprite.setExpression({ index: 0 })

// 语音播放（带口型同步）
await sprite.playVoice({
  voicePath: '/Resources/Hiyori/sounds/test.mp3',
})

// 获取模型所有动作列表
const motions = sprite.getMotions()
// => [{ group: 'Idle', no: 0, name: 'Idle_0' }, { group: 'TapBody', no: 0, name: 'TapBody_0' }, ...]

// 获取模型所有表情列表
const expressions = sprite.getExpressions()
// => [{ name: 'smile' }, { name: 'angry' }, ...]

// 通过参数 ID 设置驱动参数值（持久生效，每帧自动重新写入）
sprite.setParameterValueById('ParamAngleX', 15.0)
sprite.setParameterValueById('ParamMouthOpenY', 1.0, 0.8) // 带混合权重

// 通过参数索引设置驱动参数值
sprite.setParameterValueByIndex(0, 0.5)

// 通过参数 ID / 索引获取驱动参数的取值范围
const range = sprite.getParameterValueRangeById('ParamAngleX')
// range => { min: -30, max: 30 }
const rangeByIndex = sprite.getParameterValueRangeByIndex(0)
// rangeByIndex => { min: -30, max: 30 }
```

语音解码基于 Web Audio `decodeAudioData()`，支持浏览器可解码的音频格式（wav、mp3、ogg 等）。口型同步需要模型配置 `LipSync` 参数映射。

## 文档

- 中文：https://panzer-jack.github.io/easy-live2d
- English：https://panzer-jack.github.io/easy-live2d/en

## 在线演示

- [StackBlitz Playground](https://stackblitz.com/~/github.com/Panzer-Jack/easy-live2d-playground?file=src/App.vue)

## 本地开发

如果你想在本地开发或参与贡献本项目：

1. 克隆仓库时带上子模块：

```bash
git clone --recursive https://github.com/Panzer-Jack/easy-live2d.git
```

如果已经克隆但没有带 `--recursive`，手动初始化子模块：

```bash
git submodule sync
git submodule update --init --recursive
```

这会拉取 `packages/cubism/Framework`（Cubism Web Framework）。

2. 安装固定版本 **Cubism 5 SDK for Web R5** 的 Core 和模型资源：

```bash
pnpm install --frozen-lockfile
pnpm setup:cubism
pnpm build
pnpm exec playwright install chromium
pnpm test:browser
```

已有官方压缩包可使用 `pnpm setup:cubism /path/CubismSdkForWeb-5-r.5.zip`。Core 和模型资源继续由 Git 忽略；着色器已随库内置。运行环境必须支持 WebGL 2。详见 [R5 迁移说明](docs/guide/cubism-r5-migration.md)。

浏览器验证：**25 项测试通过**，覆盖四种模型及运行边界。详见 [验证报告](docs/reports/cubism-r5-validation.md) 中的环境和覆盖限制。

## 许可证

- 项目自身代码：[MIT](LICENSE)
- Live2D Cubism Core、Framework 与模型资源遵循各自官方许可

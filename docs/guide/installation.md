# 安装配置

## 安装

::: code-group

```bash [pnpm]
pnpm add easy-live2d pixi.js
```

```bash [npm]
npm install easy-live2d pixi.js
```

```bash [yarn]
yarn add easy-live2d pixi.js
```

:::

业务代码统一从 `easy-live2d` 导入。`@easy-live2d/core` 是 monorepo 内部包，仅在仓库开发时使用。

## 前置条件

### 1. 引入官方 Cubism Core

库本身不包含 Live2D Core。你需要按 Live2D 官方许可自行下载，并在页面入口引入：

```html
<script src="/Core/live2dcubismcore.js"></script>
```

### 2. 浏览器环境

依赖以下浏览器 API：

- `document` / `fetch` / `Image`
- `ResizeObserver`
- `AudioContext`
- `WebGL`

不适合 SSR，需在客户端挂载后初始化 `Live2DSprite`。

### 3. Pixi.js 作为宿主

你需要自己创建 Pixi `Application` 并把 `Live2DSprite` 加入 `stage`。`easy-live2d` 不会创建 canvas，也不接管应用生命周期。

## 模型资源

### 方式一：`modelPath`

```ts
const sprite = new Live2DSprite({
  modelPath: '/Resources/Hiyori/Hiyori.model3.json',
})
```

库会以 `model3.json` 所在目录为基路径，自动加载 moc、纹理、动作、表情、物理、姿态等资源。

### 方式二：`CubismSetting`

```ts
const modelJSON = await fetch('/Resources/Hiyori/Hiyori.model3.json').then(r => r.json())

const setting = new CubismSetting({
  modelJSON,
  prefixPath: '/Resources/Hiyori/',
})
```

适用于：

- `model3.json` 需要鉴权后获取
- 模型资源部署在 CDN
- 资源 URL 需要按规则重写

## 最小可运行页面

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
      import { Application, Ticker } from 'pixi.js'
      import { Live2DSprite } from 'easy-live2d'

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
        ticker: Ticker.shared,
      })

      sprite.width = canvas.clientWidth
      app.stage.addChild(sprite)
    </script>
  </body>
</html>
```

## 下一步

- [快速开始](/guide/getting-started) — 跑通最小示例
- [基本用法](/guide/basic-usage) — 动作、表情、拖拽、语音
- [API 参考](/api/) — 完整公开 API

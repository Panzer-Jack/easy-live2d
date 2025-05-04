# 安装配置

本页将指导你如何安装和配置 EasyLive2d。

## 安装

EasyLive2d 可以通过多种包管理器进行安装：

::: code-group
```bash [npm]
npm install easy-live2d
```

```bash [yarn]
yarn add easy-live2d
```

```bash [pnpm]
pnpm add easy-live2d
```
:::

## 依赖项

EasyLive2d 需要以下依赖：

- [Pixi.js](https://pixijs.com/) v8.0.0+
- [Live2D Cubism](https://www.live2d.com/en/download/cubism-sdk/) SDK Core 

## 环境配置

### 基本设置

在使用 EasyLive2d 之前，你需要确保已经正确配置了 Pixi.js 和 Live2D Cubism SDK。

1. **引入 Live2D Cubism Core**

   确保在你的 HTML 文件中引入了 Live2D Cubism Core：

   ```html
   <script src="/Core/live2dcubismcore.js"></script>
   ```

   或者使用 CDN：

   ```html
   <script src="https://cdn.jsdelivr.net/gh/dylanNew/live2d/webgl/Live2D/lib/live2d.min.js"></script>
   ```

2. **设置 Canvas**

   添加一个 canvas 元素作为渲染目标：

   ```html
   <canvas id="live2d"></canvas>
   ```

### 样式设置

为了正确显示 Live2D 模型，建议添加以下 CSS 样式：

```css
html, body {
  overflow: hidden;
  margin: 0;
}

canvas {
  position: absolute;
  width: 100%;
  height: 100%;
}
```

### 模型文件结构

建议按照官方推荐的结构组织你的 Live2D 模型文件：

```
public/
  Resources/
    ModelName/
      ModelName.model3.json
      *.moc3
      *.physics3.json
      textures/
        *.png
      motions/
        *.motion3.json
      expressions/
        *.exp3.json
```

## 验证安装

安装完成后，你可以使用以下简单代码验证 EasyLive2d 是否正确安装和配置：

```js
import { Application, Ticker } from 'pixi.js';
import { Live2DSprite } from 'easylive2d';

const init = async () => {
  // 创建应用
  const app = new Application();
  await app.init({
    view: document.getElementById('live2d'),
    backgroundAlpha: 0, // 如果需要透明，可以设置alpha为0
  });

  // 创建 Live2D 精灵
  const live2dSprite = new Live2DSprite();
  live2dSprite.init({
    modelPath: '/Resources/Hiyori/Hiyori.model3.json',
    ticker: Ticker.shared
  });
    // Live2D精灵大小
  live2DSprite.width = canvasRef.value.clientWidth * window.devicePixelRatio
  live2DSprite.height = canvasRef.value.clientHeight * window.devicePixelRatio

  // 添加到舞台
  app.stage.addChild(live2dSprite);

  console.log('EasyLive2d 初始化成功!');
}

init()

```

如果你能看到模型正确加载并显示，说明安装和配置已成功。

## 常见问题

### 模型无法加载

- 检查路径是否正确
- 确认 Live2D Cubism Core 已正确加载
- 检查浏览器控制台是否有错误信息

### WebGL 兼容性问题

EasyLive2d 依赖于 WebGL。如果遇到渲染问题，请确保：

- 使用支持 WebGL 的现代浏览器
- 显卡驱动已更新

如果还有其他问题，请查阅 [API 文档](/api/) 或提交 [GitHub Issues](https://github.com/Panzer-Jack/easy-live2d/issues)。
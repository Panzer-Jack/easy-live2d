# 快速开始

本页将指导您快速上手 easy-live2d，在几分钟内将 Live2D 模型集成到您的网页应用中。

## 推荐配置

- Node.js >= 18
- Pixi.js >= 8
- Cubism 5 模型

## 安装

使用您喜欢的包管理器安装 easy-live2d：

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

## 基础使用

下面是一个最简单的示例，展示如何在网页中加载和显示一个 Live2D 模型：

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>easy-live2d 示例</title>
  <style>
    body {
      margin: 0;
      overflow: hidden;
    }
    canvas {
      width: 100vw;
      height: 100vh;
    }
  </style>
</head>
<body>
  <canvas id="live2d"></canvas>
  <!-- 重要！！一定要在index.html 引入Cubism Core -->
  <script src="/Core/live2dcubismcore.js"></script>
  <script type="module">
    import { Application, Ticker } from 'pixi.js';
    import { Live2DSprite, Config, Priority } from 'easy-live2d';

    // 配置基本设置
    Config.MotionGroupIdle = 'Idle'; // 设置默认的空闲动作组
    Config.MouseFollow = false; // 禁用鼠标跟随
    // 创建 Live2D 精灵
    const live2dSprite = new Live2DSprite();
    live2dSprite.init({
      modelPath: '/Resources/Hiyori/Hiyori.model3.json',
      ticker: Ticker.shared
    });

    const init = async () => {
      // 创建应用
      const app = new Application();
      await app.init({
        view: document.getElementById('live2d'),
        backgroundAlpha: 0, // 如果需要透明，可以设置alpha为0
      });
      // Live2D精灵大小
      live2DSprite.width = canvasRef.value.clientWidth * window.devicePixelRatio
      live2DSprite.height = canvasRef.value.clientHeight * window.devicePixelRatio
      // 添加到舞台
      app.stage.addChild(live2dSprite);
      console.log('easy-live2d 初始化成功!');
    }
    init()
  </script>
</body>
</html>
```

## 与 Vue 集成

下面是在 Vue 3 项目中集成 easy-live2d 的示例：
（请注意一定要在index.html入口引入Cubism Core哦）

```vue
<template>
  <canvas ref="canvasRef" id="live2d" />
</template>

<script setup>
import { onMounted, onUnmounted, ref } from 'vue'
import { Application, Ticker } from 'pixi.js'
import { Live2DSprite, Config, Priority } from 'easy-live2d'

const canvasRef = ref(null);
const app = new Application();
const live2DSprite = new Live2DSprite();

// 配置基本设置
Config.MotionGroupIdle = 'Idle'; // 设置默认的空闲动作组
Config.MouseFollow = false; // 禁用鼠标跟随

// 初始化 Live2D 精灵
live2DSprite.init({
  modelPath: '/public/path/to/your/model/Model.model3.json',
  ticker: Ticker.shared
});

// 添加点击事件监听
live2DSprite.onLive2D('hit', ({ hitAreaName, x, y }) => {
  console.log('点击区域:', hitAreaName, 'at', x, y);
});

onMounted(async () => {
  if (canvasRef.value) {
    await app.init({
      view: canvasRef.value,
      backgroundAlpha: 0, // 透明背景
    });
    
    // 调整大小并添加到舞台
    live2DSprite.width = canvasRef.value.clientWidth * window.devicePixelRatio;
    live2DSprite.height = canvasRef.value.clientHeight * window.devicePixelRatio;
    app.stage.addChild(live2DSprite);
    
    // 设置表情
    live2DSprite.setExpression({
      expressionId: 'normal'
    });
  }
});

onUnmounted(() => {
  // 释放资源
  live2DSprite.destroy();
});
</script>

<style scoped>
#live2d {
  position: absolute;
  top: 0;
  right: 0;
  width: 100%;
  height: 100%;
}
</style>
```

## 下一步
(待完成)
- 查看 [安装配置](/guide/installation) 获取更详细的安装信息
- 阅读 [基本用法](/guide/basic-usage) 了解更多基础功能
- 参考 [API 文档](/api/) 获取完整的接口说明
- 探索 [示例](/examples/basic) 学习更多高级用法
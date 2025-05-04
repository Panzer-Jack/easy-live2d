# 基础示例

本页面提供了一些常见的 easy-live2d 使用示例，帮助您快速掌握库的基本功能。

## 原生

下面是加载并显示 Live2D 模型的最基本示例：

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
  <script type="module">
    import { Application, Ticker } from 'pixi.js';
    import { Live2DSprite, Config, Priority } from 'easylive2d';

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
      console.log('EasyLive2d 初始化成功!');
    }
    init()
  </script>
</body>
</html>
```

## Vue3

```vue
<template>
  <canvas ref="canvasRef" id="live2d" />
</template>

<script setup>
import { onMounted, onUnmounted, ref } from 'vue'
import { Application, Ticker } from 'pixi.js'
import { Live2DSprite, Config, Priority } from 'easylive2d'

const canvasRef = ref(null);
const app = new Application();
const live2DSprite = new Live2DSprite();

// 配置基本设置
Config.MotionGroupIdle = 'Idle'; // 设置默认的空闲动作组
Config.MouseFollow = false; // 禁用鼠标跟随

// 初始化 Live2D 精灵
live2DSprite.init({
  modelPath: '/path/to/your/model/Model.model3.json',
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

## 表情切换

以下代码展示了如何切换模型的表情：

```js
// 设置特定表情
function setExpression(expressionId) {
  live2dSprite.setExpression({ expressionId });
}

// 示例：设置不同的表情
setExpression('normal'); // 设置普通表情
setExpression('smile');  // 设置微笑表情
setExpression('angry');  // 设置生气表情

// 随机切换表情
function setRandomExpression() {
  live2dSprite.setRandomExpression();
}

// 创建一个简单的 UI 来切换表情
const expressionButtons = [
  { id: 'normal', label: '普通' },
  { id: 'smile', label: '微笑' },
  { id: 'angry', label: '生气' },
  { id: 'sad', label: '悲伤' }
];

const buttonContainer = document.createElement('div');
buttonContainer.style.position = 'fixed';
buttonContainer.style.bottom = '20px';
buttonContainer.style.left = '20px';

expressionButtons.forEach(button => {
  const btn = document.createElement('button');
  btn.textContent = button.label;
  btn.onclick = () => setExpression(button.id);
  buttonContainer.appendChild(btn);
});

const randomBtn = document.createElement('button');
randomBtn.textContent = '随机';
randomBtn.onclick = setRandomExpression;
buttonContainer.appendChild(randomBtn);

document.body.appendChild(buttonContainer);
```

## 动作控制

以下示例展示了如何控制模型的动作：

```js
// 播放指定动作
function playMotion(group, index, priority) {
  live2dSprite.startMotion({
    group,
    no: index,
    priority
  });
}

// 示例：播放不同的动作
playMotion('Idle', 0, Priority.Idle);      // 播放空闲动作
playMotion('Tap', 0, Priority.Normal);     // 播放点击动作
playMotion('Special', 0, Priority.Force);  // 播放特殊动作，强制优先级

// 创建一个简单的 UI 来控制动作
const motionButtons = [
  { group: 'Idle', index: 0, label: '空闲', priority: Priority.Idle },
  { group: 'Tap', index: 0, label: '点头', priority: Priority.Normal },
  { group: 'Tap', index: 1, label: '摇头', priority: Priority.Normal },
  { group: 'Special', index: 0, label: '特殊', priority: Priority.Force }
];

const motionContainer = document.createElement('div');
motionContainer.style.position = 'fixed';
motionContainer.style.bottom = '60px';
motionContainer.style.left = '20px';

motionButtons.forEach(button => {
  const btn = document.createElement('button');
  btn.textContent = button.label;
  btn.onclick = () => playMotion(button.group, button.index, button.priority);
  motionContainer.appendChild(btn);
});

document.body.appendChild(motionContainer);
```

## 配置项设置

以下示例展示了如何配置 easy-live2d：

```js
// 导入必要的类型
import { Config, LogLevel, Priority } from 'easylive2d';

// 基本配置
Config.MotionGroupIdle = 'Idle';       // 设置默认的空闲动作组
Config.MotionGroupTapBody = 'Tap';     // 设置点击身体时的动作组
Config.HitAreaNameHead = 'Head';       // 设置头部点击区域的名称
Config.HitAreaNameBody = 'Body';       // 设置身体点击区域的名称

// 行为配置
Config.MouseFollow = true;             // 启用鼠标跟随
Config.BreathingEnabled = true;        // 启用呼吸效果
Config.EyeBlinkEnabled = true;         // 启用眨眼效果

// 性能和调试配置
Config.CubismLoggingLevel = LogLevel.LogLevel_Warning; // 设置日志级别
Config.UseHighPrecisionMatrix = true;   // 使用高精度矩阵（可能影响性能）
```

## 下一步

- 查看 [动作与表情示例](/examples/motion-expression) 了解更多交互操作
- 了解 [事件处理示例](/examples/events) 实现更复杂的交互效果
- 参考 [框架集成示例](/examples/vue-integration) 学习如何与现代前端框架结合使用
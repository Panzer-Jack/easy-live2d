# 基础示例

本页面提供了一些常见的 easy-live2d 使用示例，帮助您快速掌握库的基本功能。

## 基本模型加载

下面是加载并显示 Live2D 模型的最基本示例：

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>easy-live2d 基础示例</title>
  <style>
    html, body {
      margin: 0;
      padding: 0;
      width: 100%;
      height: 100%;
      overflow: hidden;
    }
    #canvas {
      width: 100%;
      height: 100%;
    }
  </style>
</head>
<body>
  <canvas id="canvas"></canvas>

  <script type="module">
    import { Application, Ticker } from 'pixi.js';
    import { Live2DSprite, Config, LogLevel } from 'easylive2d';

    // 设置配置项
    Config.CubismLoggingLevel = LogLevel.LogLevel_Warning; // 只显示警告及以上日志

    // 创建 Pixi 应用
    const app = new Application();
    await app.init({
      view: document.getElementById('canvas'),
      backgroundAlpha: 0, // 透明背景
      resizeTo: window, // 自动调整大小
    });

    // 创建 Live2D 精灵
    const live2dSprite = new Live2DSprite();
    await live2dSprite.init({
      modelPath: './models/Hiyori/Hiyori.model3.json',
      ticker: Ticker.shared
    });

    // 添加到舞台
    app.stage.addChild(live2dSprite);

    // 居中模型
    live2dSprite.x = app.screen.width / 2;
    live2dSprite.y = app.screen.height / 2;
    
    // 设置锚点，使模型居中
    live2dSprite.anchor.set(0.5, 0.5);

    // 自适应窗口大小变化
    window.addEventListener('resize', () => {
      live2dSprite.x = app.screen.width / 2;
      live2dSprite.y = app.screen.height / 2;
    });
  </script>
</body>
</html>
```

## 响应点击事件

下面的示例展示了如何响应模型的点击事件：

```js
// 使用 onLive2D 方法监听 hit 事件
live2dSprite.onLive2D('hit', ({ hitAreaName, x, y }) => {
  console.log(`点击了 ${hitAreaName}，坐标: (${x}, ${y})`);
  
  // 根据不同的点击区域播放不同的动作
  switch (hitAreaName.toLowerCase()) {
    case 'head':
      live2dSprite.startMotion({
        group: 'Tap',
        no: 0,
        priority: Priority.Force
      });
      break;
    case 'body':
      live2dSprite.startMotion({
        group: 'Tap',
        no: 1,
        priority: Priority.Force
      });
      break;
    // 更多区域...
  }
});
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

## 进阶：自定义渲染

如果您需要更多控制渲染过程，可以添加自定义渲染逻辑：

```js
// 在使用标准 Pixi.js 渲染器的基础上添加自定义后处理效果

// 导入必要的滤镜
import { BlurFilter, ColorMatrixFilter } from 'pixi.js';

// 创建滤镜
const blurFilter = new BlurFilter(2);
const colorMatrix = new ColorMatrixFilter();
colorMatrix.brightness(1.2); // 增加亮度

// 将滤镜应用到 Live2D 精灵
live2dSprite.filters = [blurFilter, colorMatrix];

// 创建动画效果
let time = 0;
app.ticker.add(() => {
  time += 0.01;
  
  // 创建呼吸效果
  const scale = 1 + Math.sin(time) * 0.01;
  live2dSprite.scale.set(scale);
  
  // 调整模糊效果
  blurFilter.blur = 1 + Math.sin(time * 0.5) * 0.5;
});
```

## 下一步

- 查看 [动作与表情示例](/examples/motion-expression) 了解更多交互操作
- 了解 [事件处理示例](/examples/events) 实现更复杂的交互效果
- 参考 [框架集成示例](/examples/vue-integration) 学习如何与现代前端框架结合使用
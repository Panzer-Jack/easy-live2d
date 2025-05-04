# 基本用法

本页面介绍如何使用 EasyLive2d 的基本功能，帮助你快速掌握库的核心用法。

## 创建 Live2D 精灵

使用 EasyLive2d 的第一步是创建一个 Live2DSprite 实例并初始化它：

```js
import { Live2DSprite } from 'easy-live2d';
import { Ticker } from 'pixi.js';

// 创建 Live2D 精灵
const live2dSprite = new Live2DSprite();

// 初始化精灵并设置模型路径
live2dSprite.init({
  modelPath: '/path/to/your/model/Model.model3.json',
  ticker: Ticker.shared
});
```

## 添加到场景

创建完成后，你需要将 Live2D 精灵添加到 Pixi.js 的舞台中：

```js
import { Application } from 'pixi.js';

// 创建 Pixi 应用
const app = new Application();
const init = async () => {
  await app.init({
    view: document.getElementById('canvas'),
    backgroundAlpha: 0  // 透明背景
  });
  // 将精灵添加到舞台
  app.stage.addChild(live2dSprite);
}
init()
```

## 设置位置和大小

你可以像操作普通 Pixi.js 精灵一样设置 Live2D 精灵的位置和大小：

```js
// 设置位置和大小
live2dSprite.x = 400;
live2dSprite.y = 300;
live2DSprite.width = 1400
live2DSprite.height = 900
```

## 播放动作

EasyLive2d 提供了简单的方法来播放模型的动作：

```js
import { Priority } from 'easy-live2d';

// 播放指定的动作
live2dSprite.startMotion({
  group: 'Tap',    // 动作组名称
  no: 0,           // 动作索引
  priority: Priority.Force  // 动作优先级
});

// 优先级说明：
// Priority.None = 0：无优先级，不会打断其他动作
// Priority.Idle = 1：空闲优先级，最低级别
// Priority.Normal = 2：普通优先级
// Priority.Force = 3：强制优先级，会打断任何其他动作
```

## 设置表情

切换模型表情也非常简单：

```js
// 设置特定表情
live2dSprite.setExpression({ 
  expressionId: 'smile' 
});

// 随机选择表情
live2dSprite.setRandomExpression();
```

## 监听事件

EasyLive2d 提供了事件系统，可以响应模型上的交互：

```js
// 监听点击事件
live2dSprite.onLive2D('hit', ({ hitAreaName, x, y }) => {
  console.log(`点击了模型的 ${hitAreaName} 区域，坐标: (${x}, ${y})`);
  
  // 可以根据点击区域触发不同动作
  if (hitAreaName === 'Head') {
    live2dSprite.startMotion({
      group: 'Tap',
      no: 0,
      priority: Priority.Force
    });
  }
});
```

## 配置选项

你可以通过 Config 对象设置全局配置：

```js
import { Config, LogLevel } from 'easylive2d';

// 设置日志级别
Config.CubismLoggingLevel = LogLevel.LogLevel_Warning;

// 启用/禁用鼠标跟随
Config.MouseFollow = true;

// 设置默认的空闲动作组
Config.MotionGroupIdle = 'Idle';

// 启用/禁用眨眼效果
Config.EyeBlinkEnabled = true;

// 启用/禁用呼吸效果
Config.BreathingEnabled = true;
```

## 资源释放

当不再需要 Live2D 精灵时，应该释放其占用的资源：

```js
// 销毁资源
live2dSprite.destroy();
```

在 Vue 或 React 等框架中，应该在组件卸载时执行这个操作。

## 自适应窗口大小

以下是一个响应窗口大小变化的简单示例：

```js
// 初始调整
function resizeModel() {
  live2dSprite.x = window.innerWidth / 2;
  live2dSprite.y = window.innerHeight / 2;
  
  // 根据窗口比例调整大小
  const scale = Math.min(
    window.innerWidth / live2dSprite.width,
    window.innerHeight / live2dSprite.height
  ) * 0.8; // 80% 的窗口大小
  
  live2dSprite.scale.set(scale);
}

// 监听窗口大小变化
window.addEventListener('resize', resizeModel);
resizeModel();
```

## 完整示例

下面是一个整合以上功能的基础示例：

```js
import { Application, Ticker } from 'pixi.js';
import { Live2DSprite, Config, Priority, LogLevel } from 'easylive2d';

// 配置
Config.CubismLoggingLevel = LogLevel.LogLevel_Warning;
Config.MouseFollow = true;

// 创建应用
const init = async () => {
  const app = new Application();
  await app.init({
    view: document.getElementById('canvas'),
    backgroundAlpha: 0,
    resizeTo: window
  });
  // 添加到舞台
  app.stage.addChild(live2dSprite);
}


// 创建并初始化 Live2D 精灵
const live2dSprite = new Live2DSprite();
live2dSprite.init({
  modelPath: '/Resources/Hiyori/Hiyori.model3.json',
  ticker: Ticker.shared
});



// 设置位置和锚点
live2dSprite.anchor.set(0.5, 0.5);
live2dSprite.x = app.screen.width / 2;
live2dSprite.y = app.screen.height / 2;

// 添加点击事件监听
live2dSprite.onLive2D('hit', ({ hitAreaName }) => {
  console.log(`点击了 ${hitAreaName}`);
  
  // 播放对应动作
  live2dSprite.startMotion({
    group: 'Tap',
    no: 0,
    priority: Priority.Force
  });
  
  // 设置表情
  live2dSprite.setExpression({ expressionId: 'smile' });
});

// 自适应窗口大小
window.addEventListener('resize', () => {
  live2dSprite.x = app.screen.width / 2;
  live2dSprite.y = app.screen.height / 2;
});


// 初始化
init()

// 清理函数
function cleanup() {
  window.removeEventListener('resize', resizeHandler);
  live2dSprite.destroy();
}
```

## 下一步

- 探索[模型加载](/guide/model-loading)的更多选项
- 学习[动作控制](/guide/motion-control)的高级用法
- 了解[表情控制](/guide/expression-control)的细节
- 掌握[事件系统](/guide/events)的完整功能
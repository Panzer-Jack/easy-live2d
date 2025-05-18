# 基本用法

本页面介绍如何使用 easy-live2d 的基本功能，帮助你快速掌握库的核心用法。

## 在html中引入 Cubism Core：

一定请在 index.html 中引入 Cubism Core：

你直接去Live2d Cubism 官网下载: [Live2D Cubism SDK for Web](https://www.live2d.com/zh-CHS/sdk/download/web/)

```html
<!doctype html>
<html lang="">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" href="/favicon.ico" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Vite App</title>
  </head>

  <body>
    <div id="app"></div>
    <!-- 关键！ -->
    <script src="/Core/live2dcubismcore.js"></script>
    <script type="module">

    </script>
  </body>
</html>
```

## 创建 Live2D 精灵

使用 easy-live2d 的第一步是创建一个 Live2DSprite 实例并初始化它：

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

## 角色说话（口型同步）
当前音嘴同步 仅支持wav格式

首先确保live2d模型已设置 MouthMovement，没有参考下面方法

### 方法1:

在Live2D模型编辑器 中开启口型同步 设置 MouthMovement

这里方法可以参看[官方文档](https://docs.live2d.com/zh-CHS/cubism-sdk-tutorials/lipsync-cocos/)

### 方法2:

在模型的 xx.model3.json 中 找到 “Groups” 中 那个 `"Name": "LipSync"` 的部分，添加：`"Ids":"ParamMouthOpenY"`, 参考如下
```json
{
	"Version": 3,
	"FileReferences": {
		"Moc": "xx.moc3",
		"Textures": [
			"xx.2048/texture_00.png"
		],
		"Physics": "xx.physics3.json",
		"DisplayInfo": "xx.cdi3.json",
		"Motions": {
			"test": [],
			"idle": []
		},
		"Expressions": []
	},
	"Groups": [
		{
			"Target": "Parameter",
			"Name": "EyeBlink",
			"Ids": []
		},
		{
			"Target": "Parameter",
			"Name": "LipSync",
			"Ids": [
				"ParamMouthOpenY"
			]
		}
	],
	"HitAreas": []
}
```

### 角色说话
```js
// 播放声音
live2DSprite.playVoice({
  // 当前音嘴同步 仅支持wav格式
  voicePath: '/Resources/Huusya/voice/test.wav',
})

// 停止声音
// live2DSprite.stopVoice()

setTimeout(() => {
  // 播放声音
  live2DSprite.playVoice({
    voicePath: '/Resources/Huusya/voice/test.wav',
    immediate: true // 是否立即播放: 默认为true，会把当前正在播放的声音停止并立即播放新的声音
  })
}, 10000)
```


## 播放动作

easy-live2d 提供了简单的方法来播放模型的动作：

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

easy-live2d 提供了事件系统，可以响应模型上的交互：

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
import { Config, LogLevel } from 'easy-live2d';

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

## 完整示例
```html
<!doctype html>
<html lang="">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" href="/favicon.ico" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Vite App</title>
    <style>
      html,
      body {
        overflow: hidden;
        margin: 0;
      }
    </style>
  </head>

  <body>
    <div id="app"></div>
    <script src="/Core/live2dcubismcore.js"></script>
    <script type="module">
      import { Application, Ticker } from 'pixi.js';
      import { Live2DSprite, Config, Priority } from 'easy-live2d';

      // Configure basic settings
      Config.MotionGroupIdle = 'Idle'; // Set default idle motion group
      Config.MouseFollow = false; // Disable mouse following
      // Create Live2D sprite
      const live2dSprite = new Live2DSprite();
      live2dSprite.init({
        modelPath: '/Resources/Hiyori/Hiyori.model3.json',
        ticker: Ticker.shared
      });

      const init = async () => {
        // Create application
        const app = new Application();
        await app.init({
          view: document.getElementById('live2d'),
          backgroundAlpha: 0, // Set alpha to 0 for transparency if needed
        });
        // Live2D sprite size
        live2DSprite.width = canvasRef.value.clientWidth * window.devicePixelRatio
        live2DSprite.height = canvasRef.value.clientHeight * window.devicePixelRatio
        // Add to stage
        app.stage.addChild(live2dSprite);
        console.log('easy-live2d initialized successfully!');
      }
      init()
    </script>
  </body>
</html>
```

## 下一步
(待完成)
- 探索[模型加载](/guide/model-loading)的更多选项
- 学习[动作控制](/guide/motion-control)的高级用法
- 了解[表情控制](/guide/expression-control)的细节
- 掌握[事件系统](/guide/events)的完整功能
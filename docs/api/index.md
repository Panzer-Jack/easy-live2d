# API 参考

本节提供 easy-live2d 的完整 API 参考文档，帮助您了解库的全部功能和使用方法。

## 核心类

easy-live2d 的核心是 `Live2DSprite` 类，它继承自 Pixi.js 的 `Sprite` 类，使您可以像处理普通 Pixi 精灵一样处理 Live2D 模型。

```ts
class Live2DSprite extends Sprite {
  // 属性和方法
}
```

## 主要组件

### Live2DSprite

`Live2DSprite` 是 easy-live2d 的主要入口类，提供了模型加载、渲染、事件处理等功能。详情请参阅 [Live2DSprite API](/api/live2d-sprite)。

### 配置系统

`Config` 对象提供全局配置选项，用于设置默认行为。详情请参阅 [配置选项](/api/config)。

### 事件系统

基于 Pixi.js 的事件系统扩展，提供了 Live2D 特有的事件类型和处理机制。详情请参阅 [事件类型](/api/events)。

### 管理器

管理器系统负责模型、动作、表情等资源的管理和协调。详情请参阅 [管理器](/api/managers)。

## 类型定义

easy-live2d 使用 TypeScript 编写，提供了完整的类型定义，有助于在开发过程中获得良好的类型支持和代码提示。主要的类型定义包括：

### Live2DSpriteInit

用于初始化 Live2DSprite 的配置选项。

```ts
interface Live2DSpriteInit {
  modelPath: string;      // 模型路径
  ticker?: Ticker;        // Pixi.js Ticker 实例
}
```

### 事件类型

```ts
// Live2D 特有事件类型定义
interface Live2DSpriteEvents {
  // 点击事件，返回点击区域名称和坐标
  hit: [{ hitAreaName: string; x: number; y: number }];
}
```

### 优先级枚举

用于设置动作和表情的优先级。

```ts
enum Priority {
  None = 0,
  Idle = 1,
  Normal = 2,
  Force = 3
}
```

### 日志级别枚举

控制日志输出级别。

```ts
enum LogLevel {
  LogLevel_Verbose = 0,
  LogLevel_Debug = 1,
  LogLevel_Info = 2,
  LogLevel_Warning = 3,
  LogLevel_Error = 4,
  LogLevel_Off = 5
}
```

## 示例用法

下面是一个简单的使用示例：

```ts
import { Live2DSprite, Config, Priority } from 'easy-live2d';
import { Application, Ticker } from 'pixi.js';

// 创建应用
const app = new Application();
app.init({ view: document.getElementById('canvas') });

// 创建并初始化模型
const live2d = new Live2DSprite();
live2d.init({
  modelPath: './models/Hiyori/Hiyori.model3.json',
  ticker: Ticker.shared
});

// 添加到舞台
app.stage.addChild(live2d);

// 设置表情
live2d.setExpression({ expressionId: 'smile' });

// 播放动作
live2d.startMotion({
  group: 'Tap',
  no: 0,
  priority: Priority.Force
});

// 监听事件
live2d.onLive2D('hit', ({ hitAreaName }) => {
  console.log(`点击了 ${hitAreaName}`);
});
```

在接下来的各个页面中，我们将详细介绍 easy-live2d 的各个组件和功能。
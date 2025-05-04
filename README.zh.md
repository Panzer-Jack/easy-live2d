# EasyLive2D（还在加紧开发中。。。）

让 Live2D 集成更简单！一个轻量、开发者友好的 Live2D Web SDK 封装库。

---

## TODO
- （✅）将Core能力转移成Sprite
  - 可以如同Sprite一样 自由控制x、y、大小等 

- （✅）读取模型路径
- （✅）配置文件迁移
- （✅）可以直接控制表情、动作
- （✅）各种事件函数暴露
- 语音
- 嘴巴同步
- webgl渲染挂载问题 （暂定）


## ✨ 特性

- ⚡️ 支持Pixi.js v8 和 Cubism 5 （ 均为当前最新版本 ）
- 🌟 极致轻量，去除冗余功能
- 🚀 更简单的 API 接口
- 🛠️ 兼容官方 Live2D Web SDK
- 🎯 支持自定义加载与渲染
- 📦 适配现代前端框架（如 Vue、React）

---

## 📦 安装

```bash
pnpm add easylive2d
# 或者
npm install easylive2d
# 或
yarn add easylive2d
```

---

## 🛠️ 快速上手

```vue
<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import { Config, Live2DSprite, LogLevel, Priority } from '@easy-live2d/core'
import { Application, Ticker } from 'pixi.js'
import { initDevtools } from '@pixi/devtools'

const canvasRef = ref<HTMLCanvasElement>()
const app = new Application()

// 设置 Config 默认配置
Config.MotionGroupIdle = 'Idle' // 设置默认的空闲动作组
Config.MouseFollow = false // 禁用鼠标跟随
Config.CubismLoggingLevel = LogLevel.LogLevel_Off // 设置日志级别


// 创建Live2D精灵 并初始化
const live2DSprite = new Live2DSprite()
live2DSprite.init({
  modelPath: '/Resources/Hiyori/Hiyori.model3.json',
  ticker: Ticker.shared
});

// 监听点击事件
live2DSprite.onLive2D('hit', ({ hitAreaName, x, y }) => {
  console.log('hit', hitAreaName, x, y);
})

// 你也可以直接这样初始化
// const live2DSprite = new Live2DSprite({
//   modelPath: '/Resources/Huusya/Huusya.model3.json',
//   ticker: Ticker.shared
// })

onMounted(async () => {
  await app.init({
    view: canvasRef.value,
    backgroundAlpha: 0, // 如果需要透明，可以设置alpha为0
  })
  if (canvasRef.value) {

    // live2DSprite.x = -300
    // live2DSprite.y = -300
    live2DSprite.width = canvasRef.value.clientWidth * window.devicePixelRatio
    live2DSprite.height = canvasRef.value.clientHeight * window.devicePixelRatio
    app.stage.addChild(live2DSprite);

    live2DSprite.setExpression({
      expressionId: 'normal',
    })

    // live2DSprite.startMotion({
    //   group: 'test',
    //   no: 0,
    //   priority: 3,
    // })
  }

  initDevtools({ app: app })
})

onUnmounted(() => {
  // 释放实例
  live2DSprite.destroy()
})

</script>

<template>
  <div class="test">
  </div>
  <canvas
    ref="canvasRef"
    id="live2d"
  />
</template>

<style>
#live2d {
  position: absolute;
  top: 0%;
  right: 0%;
  width: 100%;
  height: 100%;
}

.test {
  display: inline-block;
  position: absolute;
  width: 100%;
  height: 70%;
  background-color: pink;
}
</style>

```

---

## 📖 文档

👉 [使用指南（正在完善）](#)

---

## 🤝 贡献

欢迎 PR 和 Issue！请阅读 [贡献指南](#) 后参与开发。

---

## 📄 License

[MIT](./LICENSE)

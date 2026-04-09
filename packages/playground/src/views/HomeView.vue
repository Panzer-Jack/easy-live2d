<script setup lang="ts">
import { Config, CubismSetting, Live2DSprite, LogLevel } from '@easy-live2d/core'
import { Application, Ticker } from 'pixi.js'
import { onMounted, onUnmounted, ref } from 'vue'

const canvasRef = ref<HTMLCanvasElement>()
const app = new Application()

// 设置 Config 默认配置
Config.MotionGroupIdle = 'Idle' // 设置默认的空闲动作组
// Config.MouseFollow = false // 禁用鼠标跟随
Config.CubismLoggingLevel = LogLevel.LogLevel_Off // 设置日志级别

// 创建Live2D精灵 并初始化
const live2DSprite = new Live2DSprite()
live2DSprite.init({
  modelPath: '/Resources/Hiyori/Hiyori.model3.json',
  ticker: Ticker.shared,
  draggable: true,
})

const live2DSprit2 = new Live2DSprite()
live2DSprit2.init({
  modelPath: '/Resources/Cub3/ING.model3.json',
  ticker: Ticker.shared,
  draggable: true,
})

// 监听点击事件
live2DSprite.onLive2D('hit', ({ hitAreaName, x, y }) => {
  console.log('hit', hitAreaName, x, y)
})

live2DSprite.onLive2D('dragMove', ({ x, y }) => {
  console.log('dragMove', x, y)
})

// 你也可以直接这样初始化
// const live2DSprite = new Live2DSprite({
//   modelPath: '/Resources/Hiyori/Hiyori.model3.json',
//   ticker: Ticker.shared
// })

onMounted(async () => {
  const resolution = Math.max(window.devicePixelRatio || 1, 1)

  // 你同时又可以直接这样初始化
  const model2Json = await (await fetch('/Resources/Hiyori/Hiyori.model3.json')).json()
  const modelSetting = new CubismSetting({
    prefixPath: '/Resources/Hiyori/',
    modelJSON: model2Json,
  })
  live2DSprite.init({
    modelSetting,
    ticker: Ticker.shared,
  })

  live2DSprite.x = 20
  live2DSprite.y = -100

  await app.init({
    canvas: canvasRef.value,
    backgroundAlpha: 0,
    autoDensity: true,
    resizeTo: window, // 自动跟随窗口大小
    resolution,
  })

  if (canvasRef.value) {
    live2DSprite.width = canvasRef.value.clientWidth
    live2DSprite.height = canvasRef.value.clientHeight

    live2DSprit2.width = canvasRef.value.clientWidth
    live2DSprit2.height = canvasRef.value.clientHeight

    app.stage.addChild(live2DSprite)
    app.stage.addChild(live2DSprit2)

    // 模型加载完成后，打印原始尺寸信息
    live2DSprit2.onLive2D('ready', () => {
      const size = live2DSprite.getModelCanvasSize()

      console.log(live2DSprit2.getExpressions())

      console.log(live2DSprit2.getMotions())
      if (size) {
        console.log('模型原始尺寸:', size.width, 'x', size.height)
      }
    })

    live2DSprite.setExpression({
      expressionId: 'normal',
    })

    // // 播放声音
    // live2DSprite.playVoice({
    //   // 当前音嘴同步 仅支持wav格式
    //   voicePath: '/Resources/Hiyori/sounds/test3.wav',
    // })

    // 播放网络声音
    // live2DSprite.playVoice({
    //   // 当前音嘴同步 仅支持wav格式
    //   voicePath: 'https://cdn.pixabay.com/audio/2025/05/17/audio_3882df0036.mp3',
    // })

    // 停止声音
    // live2DSprite.stopVoice()

    setTimeout(() => {
      // 播放声音
      live2DSprite.playVoice({
        voicePath: '/Resources/Hiyori/sounds/test.wav',
        immediate: true, // 是否立即播放: 默认为true，会把当前正在播放的声音停止并立即播放新的声音
      })
    }, 10000)

    live2DSprite.startMotion({
      group: 'TapBody',
      no: 0,
      priority: 3,
    })
  }
})

onUnmounted(() => {
  // 释放实例
  live2DSprite.destroy()
})
</script>

<template>
  <div class="container">
    <canvas
      id="live2d"
      ref="canvasRef"
    />
    <div class="pink" />
  </div>
</template>

<style scoped>
.container {
  position: relative;
  width: 100vw;
  height: 100vh;
}

.pink {
  width: 100vw;
  height: 100vh;
  background-color: pink;
}

#live2d {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: auto;
  z-index: 1;
}
</style>

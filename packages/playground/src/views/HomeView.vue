<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import { Config, CubismSetting, Live2DSprite, LogLevel, Priority } from '@easy-live2d/core'
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
  modelPath: '/Resources/Huusya/Huusya.model3.json',
  ticker: Ticker.shared
});

// // 监听点击事件
live2DSprite.onLive2D('hit', ({ hitAreaName, x, y }) => {
  console.log('hit', hitAreaName, x, y);
})

// 你也可以直接这样初始化
// const live2DSprite = new Live2DSprite({
//   modelPath: '/Resources/Huusya/Huusya.model3.json',
//   ticker: Ticker.shared
// })

onMounted(async () => {
  // const path = '/Resources/Huusya/Huusya.model3.json'
  // const model2Json = await (await fetch(path)).json()
  // console.log('model2Json', JSON.parse(JSON.stringify(model2Json)))

  // const modelSetting = new CubismSetting({
  //   modelJSON: model2Json,
  // })

  // // 更改模型的所有默认资源路径，file为文件名
  // // 例如：file为"expressions/angry.exp3.json"，则会将路径更改为"/Resources/Huusya/expressions/angry.exp3.json"
  // // 优先度最高
  // modelSetting.redirectPath(({file}) => {
  //   return `/Resources/Huusya/${file}`
  // })

  // console.log('modelSetting', modelSetting)
  
  // live2DSprite.init({
  //   // modelPath: path,
  //   modelSetting,
  //   ticker: Ticker.shared,
  // })
  
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
      expressionId: 'happy',
    })

    live2DSprite.startMotion({
      group: 'idle',
      no: 0,
      priority: 3,
    })

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

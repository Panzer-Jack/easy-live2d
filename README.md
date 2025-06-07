<div align="center">
<p align="center">
    <img src="https://github.com/user-attachments/assets/4ebc2d19-2ebe-4490-b214-e6ac8b350ce0" alt="feuse-mcp" width="300px">
</p>

<h1>easy-live2d</h1>

Making Live2D integration easier! A lightweight, developer-friendly Live2D Web SDK wrapper library based on Pixi.js.

Make your Live2D as easy to control as a pixi sprite!

<div align="center">
    <img src="https://img.shields.io/badge/node-%5E22.0.0-brightgreen" alt="license">
    <img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="license">
</div>
</div>  

English | [中文](/README.zh.md)

You can directly experience the charm of easy-live2d in your browser using this cloud IDE [StackBlitz](https://stackblitz.com/~/github.com/Panzer-Jack/easy-live2d-playground)! 😋
---

## 📖 Documentation

👉 [easy-live2d Official Documentation](https://panzer-jack.github.io/easy-live2d)

---

## TODO
- (✅) Transfer Core capabilities to Sprite
- (✅) Read model paths
- (✅) Configuration file migration
- (✅) Direct control of expressions and motions
- (✅) Exposure of various event functions
- (✅) Voice support
- (✅ -) Voice lip-sync - Currently only supports wav format
- WebGL rendering mounting issues (TBD)

## ✨ Features

- ⚡️ Supports Pixi.js v8 and Cubism 5 (both latest versions)
- 🌟 Ultra-lightweight, removes redundant features
- 🚀 Simpler API interface
- 🛠️ Compatible with official Live2D Web SDK
- 📦 Adapts to modern frontend frameworks (like Vue, React)

---

## ⛵️ For Developers

Due to Live2D policies, you need to download from Live2D Cubism official website: [Live2D Cubism SDK for Web](https://www.live2d.com/en/sdk/download/web/)
and place its Core directory under /packages/cubism directory

---

## 📦 Installation

```bash
pnpm add easy-live2d
# or
npm install easy-live2d
# or
yarn add easy-live2d
```

---

## 🛠️ Quick Start

You can also refer to the code in [StackBlitz](https://stackblitz.com/~/github.com/Panzer-Jack/easy-live2d-playground) cloud IDE

Please make sure to include Cubism Core in index.html:
You can download it directly from Live2D Cubism official website: [Live2D Cubism SDK for Web](https://www.live2d.com/en/sdk/download/web/)

Native HTML
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

      // Set Config default configuration
      Config.MotionGroupIdle = 'Idle' // Set default idle motion group
      Config.MouseFollow = false // Disable mouse following
      Config.CubismLoggingLevel = LogLevel.LogLevel_Off // Set logging level

      // Create Live2D sprite and initialize
      const live2DSprite = new Live2DSprite()
      live2DSprite.init({
        modelPath: '/Resources/Huusya/Huusya.model3.json',
        ticker: Ticker.shared
      });

      // Listen to click events
      live2DSprite.onLive2D('hit', ({ hitAreaName, x, y }) => {
        console.log('hit', hitAreaName, x, y);
      })

      // You can also initialize directly like this
      // const live2DSprite = new Live2DSprite({
      //   modelPath: '/Resources/Huusya/Huusya.model3.json',
      //   ticker: Ticker.shared
      // })

      // Create application
      const init = async () => {
        // You can also initialize directly like this
        // const model2Json = await (await fetch(path)).json()
        // const modelSetting = new CubismSetting({
        //   prefixPath: '/Resources/Hiyori/',
        //   modelJSON: model2Json,
        // })
        // Change all default resource paths of the model, file is the filename
        // For example: file is "expressions/angry.exp3.json", it will change the path to "/Resources/Huusya/expressions/angry.exp3.json"
        // Highest priority
        // modelSetting.redirectPath(({file}) => {
        //   return `/Resources/Huusya/${file}`
        // })
        // live2DSprite.init({
        //   modelSetting,
        //   ticker: Ticker.shared,
        // })
        const app = new Application();
        await app.init({
          view: document.getElementById('live2d'),
          backgroundAlpha: 0, // Set alpha to 0 for transparency if needed
        });
        // Live2D sprite size and coordinate settings
        live2DSprite.x = -300
        live2DSprite.y = -300
        live2DSprite.width = canvasRef.value.clientWidth * window.devicePixelRatio
        live2DSprite.height = canvasRef.value.clientHeight * window.devicePixelRatio
        app.stage.addChild(live2DSprite);

        // Set expression
        live2DSprite.setExpression({
          expressionId: 'normal',
        })

        // Play voice
        live2DSprite.playVoice({
          // Current lip-sync only supports wav format
          voicePath: '/Resources/Huusya/voice/test.wav',
        })

        // Stop voice
        // live2DSprite.stopVoice()

        setTimeout(() => {
          // Play voice
          live2DSprite.playVoice({
            voicePath: '/Resources/Huusya/voice/test.wav',
            immediate: true // Whether to play immediately: default is true, will stop the currently playing sound and immediately play the new sound
          })
        }, 10000)

        // Set motion
        live2DSprite.startMotion({
          group: 'test',
          no: 0,
          priority: 3,
        })
      }
      init()
    </script>
  </body>
</html>
```

Vue3 Demo: (Please make sure to include Cubism Core in the index.html entry file)

```vue
<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import { Config, Live2DSprite, LogLevel, Priority } from 'easy-live2d'
import { Application, Ticker } from 'pixi.js'
import { initDevtools } from '@pixi/devtools'

const canvasRef = ref<HTMLCanvasElement>()
const app = new Application()

// Set Config default configuration
Config.MotionGroupIdle = 'Idle' // Set default idle motion group
Config.MouseFollow = false // Disable mouse following
Config.CubismLoggingLevel = LogLevel.LogLevel_Off // Set logging level

// Create Live2D sprite and initialize
const live2DSprite = new Live2DSprite()
live2DSprite.init({
  modelPath: '/Resources/Hiyori/Hiyori.model3.json',
  ticker: Ticker.shared
});

// Listen to click events
live2DSprite.onLive2D('hit', ({ hitAreaName, x, y }) => {
  console.log('hit', hitAreaName, x, y);
})

// You can also initialize directly like this
// const live2DSprite = new Live2DSprite({
//   modelPath: '/Resources/Huusya/Huusya.model3.json',
//   ticker: Ticker.shared
// })

onMounted(async () => {
  // You can also initialize directly like this

  // const model2Json = await (await fetch(path)).json()
  // const modelSetting = new CubismSetting({
  //   prefixPath: '/Resources/Hiyori/',
  //   modelJSON: model2Json,
  // })
  
  // Change all default resource paths of the model, file is the filename
  // For example: file is "expressions/angry.exp3.json", it will change the path to "/Resources/Huusya/expressions/angry.exp3.json"
  // Highest priority
  // modelSetting.redirectPath(({file}) => {
  //   return `/Resources/Huusya/${file}`
  // })

  // live2DSprite.init({
  //   modelSetting,
  //   ticker: Ticker.shared,
  // })
  await app.init({
    view: canvasRef.value,
    backgroundAlpha: 0, // If transparency is needed, set alpha to 0
  })
  if (canvasRef.value) {

    // Live2D sprite size and coordinate settings
    live2DSprite.x = -300
    live2DSprite.y = -300
    live2DSprite.width = canvasRef.value.clientWidth * window.devicePixelRatio
    live2DSprite.height = canvasRef.value.clientHeight * window.devicePixelRatio
    app.stage.addChild(live2DSprite);

    // Set expression
    live2DSprite.setExpression({
      expressionId: 'normal',
    })

    // Play voice
    live2DSprite.playVoice({
      // Current lip-sync only supports wav format
      voicePath: '/Resources/Huusya/voice/test.wav',
    })

    // Stop voice
    // live2DSprite.stopVoice()

    setTimeout(() => {
      // Play voice
      live2DSprite.playVoice({
        voicePath: '/Resources/Huusya/voice/test.wav',
        immediate: true // Whether to play immediately: default is true, will stop the currently playing sound and immediately play the new sound
      })
    }, 10000)

    // Set motion
    live2DSprite.startMotion({
      group: 'test',
      no: 0,
      priority: 3,
    })
  }
})

onUnmounted(() => {
  // Release instance
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

## Voice Lip-Sync

Method 1:

Enable lip-sync in Live2D model editor, set MouthMovement

You can refer to the [official documentation](https://docs.live2d.com/en/cubism-sdk-tutorials/lipsync-cocos/) for this method

Method 2:
In the model's xx.model3.json file, find the "Groups" section with `"Name": "LipSync"`, add: `"Ids":"ParamMouthOpenY"`, as shown below:
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

## 🤝 Contributing

PRs and Issues are welcome! Please read the [Contributing Guide](#) before participating in development.

---

## 📄 License

[MIT](./LICENSE)

---
layout: home

hero:
  name: easy-live2d
  text: 基于 Pixi.js 封装的 轻量级 Live2D Web SDK
  tagline: 让 Live2D 集成变得更简单！
  actions:
    - theme: brand
      text: 快速开始
      link: /guide/getting-started
    - theme: alt
      text: API 参考
      link: /api/
    - theme: alt
      text: GitHub
      link: https://github.com/Panzer-Jack/easy-live2d
    - theme: alt
      text: 在线演示
      link: https://stackblitz.com/~/github.com/Panzer-Jack/easy-live2d-playground?file=src/App.vue
  image:
    src: /easy-live2d.png
    alt: easy-live2d

features:
  - icon: ⚙️
    title: API 精简
    details: 核心导出仅 Live2DSprite、Config、CubismSetting 和两个枚举，上手成本低。
  - icon: 🧩
    title: 无缝集成 Pixi.js
    details: Live2DSprite 继承自 Pixi Sprite，可直接加入 stage，像普通精灵一样管理位置、缩放和锚点。
  - icon: 🎭
    title: 覆盖常见交互
    details: 模型加载、命中检测、拖拽、动作播放、表情切换、语音播放与口型同步，开箱即用。
  - icon: 📌
    title: 运行要求明确
    details: 浏览器环境 + Pixi.js + WebGL + 官方 live2dcubismcore.js，适合 CSR 场景。

---

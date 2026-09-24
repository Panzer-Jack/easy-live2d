import { Config, CubismSetting, Live2DSprite, Priority } from '#runtime'
import { Application, Graphics, Sprite, Texture } from 'pixi.js'

Config.MotionSound = false
Config.MotionGroupIdle = '__manual__'
Config.DebugLogEnable = true

const app = new Application()
// 此文件是浏览器测试入口，需要等待 WebGL 上下文就绪。
// eslint-disable-next-line antfu/no-top-level-await
await app.init({ width: 640, height: 640, ...(new URLSearchParams(location.search).has('webgl1') ? { preference: 'webgl', preferWebGLVersion: 1 } : {}), backgroundAlpha: 0, preserveDrawingBuffer: true, autoStart: false })
document.body.appendChild(app.canvas)
const sprites = []
let began = 0
let finished = 0

window.regression = {
  Live2DSprite,
  Pixi: { Graphics, Sprite, Texture },
  async load(path, redirected = false, destroyOnReady = false) {
    const options = { modelPath: path }
    if (redirected) {
      const modelJSON = await (await fetch(path)).json()
      const setting = new CubismSetting({ modelJSON })
      setting.redirectPath(({ file }) => path.slice(0, path.lastIndexOf('/') + 1) + file)
      options.modelPath = undefined
      options.modelSetting = setting
    }
    const sprite = new Live2DSprite(options)
    if (destroyOnReady)
      sprite.onLive2D('ready', () => sprite.destroy())
    sprite.width = 640
    sprite.height = 640
    sprite._ctx.timeManager.update = () => {}
    sprite._ctx.timeManager._deltaTime = 0
    app.stage.addChild(sprite)
    sprites.push(sprite)
    app.render()
    await sprite.ready
    if (destroyOnReady)
      return { destroyed: sprite.destroyed }
    this.step(1)
    return {
      motions: sprite.getMotions(),
      expressions: sprite.getExpressions(),
      size: sprite.getModelCanvasSize(),
      mocVersion: sprite._model._moc.getMocVersion(),
      offscreens: sprite._model.getModel().getOffscreenCount?.() ?? 0,
    }
  },
  step(frames = 60) {
    for (let i = 0; i < frames; i++) {
      for (const sprite of sprites) sprite._model.update(1 / 60)
      app.render()
    }
    const gl = app.renderer.gl
    const pixels = new Uint8Array(gl.drawingBufferWidth * gl.drawingBufferHeight * 4)
    gl.readPixels(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight, gl.RGBA, gl.UNSIGNED_BYTE, pixels)
    let visible = 0
    for (let i = 3; i < pixels.length; i += 4) {
      if (pixels[i] > 0)
        visible++
    }
    const model = sprites[0]._model.getModel()
    return { visible, error: gl.getError(), parameters: Array.from({ length: model.getParameterCount() }, (_, i) => model.getParameterValueByIndex(i)), began, finished }
  },
  async motion() {
    const sprite = sprites[0]
    const { group, no } = sprite.getMotions()[0]
    await sprite.startMotion({ group, no, priority: Priority.Force, onStarted: () => began++, onFinished: () => finished++ })
  },
  expression(index = 1) {
    const model = sprites[0]._model
    const parameters = () => Array.from({ length: model.getModel().getParameterCount() }, (_, i) => model.getModel().getParameterValueByIndex(i))
    const before = parameters()
    model.expressionCtrl.setExpressionByIndex(index)
    // 第一帧建立淡入起点，再推进一帧才能观察到表情权重变化。
    model._expressionManager.updateMotion(model.getModel(), 0)
    model._expressionManager.updateMotion(model.getModel(), 1)
    return { before, after: parameters() }
  },
  drag(x, y) {
    sprites[0]._model.setDragging(x, y)
  },
  override() {
    sprites[0].setParameterValueByIndex(0, 7)
    return 7
  },
  resize() {
    app.renderer.resize(800, 500)
    sprites[0].width = 420
    sprites[0].height = 480
    sprites[0].position.set(100, 10)
  },
  overlay() {
    app.stage.addChild(new Graphics().rect(5, 5, 30, 30).fill(0xFF0000))
  },
  get app() {
    return app
  },
  get sprites() {
    return sprites
  },
}

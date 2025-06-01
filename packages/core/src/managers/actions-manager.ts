import { Live2DManager } from './live2d-manager'
import { StagesManager } from './stages-manager'
import { TextureManager } from './texture-manager'
import { ToolManager } from './tool-manager'
import { WebGLManager } from './webgl-manager'
import { Live2DSprite } from '../index'
import { TModelAssets } from './model-manager'

/**
 * 汇总有关Canvas操作的类
 */
class ActionsManager {
  /**
   * 构造函数
   */
  public constructor() {
    this._canvas = null
    this._live2DSprite = null
    this._glManager = new WebGLManager()
    this._textureManager = new TextureManager()
    this.live2dManager = new Live2DManager()
    this._view = new StagesManager()
    this._frameBuffer = null
    this._captured = false
  }

  /**
   * 相当于析构函数的处理
   */
  public release(): void {
    this._resizeObserver.unobserve(this._canvas)
    this._resizeObserver.disconnect()
    this._resizeObserver = null

    this.live2dManager.release()
    this.live2dManager = null

    this._view.release()
    this._view = null

    this._textureManager.release()
    this._textureManager = null

    this._glManager.release()
    this._glManager = null
  }

  /**
   * 初始化应用程序所需内容。
   */
  public async initialize(live2DSprite: Live2DSprite) {
    this._live2DSprite = live2DSprite
    this._canvas = live2DSprite.renderer.canvas
    this.modelAssets = live2DSprite.modelPath ?? live2DSprite.modelSetting

    if (!this._glManager.initialize(this._canvas)) {
      return false
    }
    this.resizeCanvas()
    this._textureManager.setGlManager(this._glManager)

    const gl = this._glManager.getGl()

    if (!this._frameBuffer) {
      this._frameBuffer = gl.getParameter(gl.FRAMEBUFFER_BINDING)
    }

    // 透明度设置
    gl.enable(gl.BLEND)
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)

    // AppView的初始化
    this._view.initialize(this)

    await this.live2dManager.initialize(this)

    this._resizeObserver = new ResizeObserver(
      (entries: ResizeObserverEntry[], observer: ResizeObserver) =>
        // eslint-disable-next-line no-useless-call
        this.resizeObserverCallback.call(this, entries, observer),
    )
    this._resizeObserver.observe(this._canvas)

    return true
  }

  /**
   * 调整画布大小并重新初始化视图。
   */
  public onResize(): void {
    this.resizeCanvas()
    this._view.initialize(this)
  }

  private resizeObserverCallback(
    // eslint-disable-next-line unused-imports/no-unused-vars
    entries: ResizeObserverEntry[],
    // eslint-disable-next-line unused-imports/no-unused-vars
    observer: ResizeObserver,
  ): void {
    this._needResize = true
  }

  /**
   * 循环处理
   */
  public update(): void {
    if (this._glManager.getGl().isContextLost()) {
      return
    }

    // 如果画布大小已更改，执行调整大小所需的处理。
    if (this._needResize) {
      this.onResize()
      this._needResize = false
    }

    const gl = this._glManager.getGl()

    // 初始化屏幕
    gl.clearColor(0.0, 0.0, 0.0, 0.0);

    // 启用深度测试
    gl.enable(gl.DEPTH_TEST)

    // 近处物体遮挡远处物体
    gl.depthFunc(gl.LEQUAL)

    // 清除颜色缓冲区和深度缓冲区
    gl.clear(gl.COLOR_BUFFER_BIT)
    gl.clearDepth(1.0)

    // 透明度设置
    gl.enable(gl.BLEND)
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)

    // 更新绘制
    this._view.render()
  }

  /**
   * 注册着色器。
   */
  public createShader(): WebGLProgram {
    const gl = this._glManager.getGl()

    // 编译顶点着色器
    const vertexShaderId = gl.createShader(gl.VERTEX_SHADER)

    if (vertexShaderId == null) {
      ToolManager.printMessage('创建顶点着色器失败')
      return null
    }

    const vertexShader: string
      = 'precision mediump float;'
      // eslint-disable-next-line style/indent-binary-ops
      + 'attribute vec3 position;'
      + 'attribute vec2 uv;'
      + 'varying vec2 vuv;'
      + 'void main(void)'
      + '{'
      + '   gl_Position = vec4(position, 1.0);'
      + '   vuv = uv;'
      + '}'

    gl.shaderSource(vertexShaderId, vertexShader)
    gl.compileShader(vertexShaderId)

    // 编译片段着色器
    const fragmentShaderId = gl.createShader(gl.FRAGMENT_SHADER)

    if (fragmentShaderId == null) {
      ToolManager.printMessage('创建片段着色器失败')
      return null
    }

    const fragmentShader: string
      = 'precision mediump float;'
      // eslint-disable-next-line style/indent-binary-ops
      + 'varying vec2 vuv;'
      + 'uniform sampler2D texture;'
      + 'void main(void)'
      + '{'
      + '   gl_FragColor = texture2D(texture, vuv);'
      + '}'

    gl.shaderSource(fragmentShaderId, fragmentShader)
    gl.compileShader(fragmentShaderId)

    // 创建程序对象
    const programId = gl.createProgram()
    gl.attachShader(programId, vertexShaderId)
    gl.attachShader(programId, fragmentShaderId)

    gl.deleteShader(vertexShaderId)
    gl.deleteShader(fragmentShaderId)

    // 链接
    gl.linkProgram(programId)
    gl.useProgram(programId)

    return programId
  }

  public getTextureManager(): TextureManager {
    return this._textureManager
  }

  public getFrameBuffer(): WebGLFramebuffer {
    return this._frameBuffer
  }

  public getLive2DSprite() {
    return this._live2DSprite
  }

  public getGlManager(): WebGLManager {
    return this._glManager
  }

  public getLive2DManager(): Live2DManager {
    return this.live2dManager
  }

  /**
   * 调整画布大小以填满屏幕。
   */
  private resizeCanvas(): void {
    this._canvas.width = this._canvas.clientWidth * window.devicePixelRatio
    this._canvas.height = this._canvas.clientHeight * window.devicePixelRatio

    const gl = this._glManager.getGl()

    gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight)
  }

  /**
   * 鼠标按下、触摸按下时调用。
   */
  public onPointBegan(pageX: number, pageY: number): void {
    if (!this._view) {
      ToolManager.printMessage('未找到视图')
      return
    }
    this._captured = true

    const rect = this._canvas.getBoundingClientRect();
    const localX: number = pageX - rect.left
    const localY: number = pageY - rect.top
    this._view.onTouchesBegan(localX, localY)
  }

  /**
   * 鼠标指针移动时调用。
   */
  public onPointMoved(pageX: number, pageY: number): void {
    if (!this._captured) {
      return
    }
    const rect = this._canvas.getBoundingClientRect();
    const localX: number = pageX - rect.left
    const localY: number = pageY - rect.top
    this._view.onTouchesMoved(localX, localY)
  }

  /**
   * 点击结束时调用。
   */
  public onPointEnded(pageX: number, pageY: number): void {
    this._captured = false

    if (!this._view) {
      ToolManager.printMessage('未找到视图')
      return
    }

    const rect = this._canvas.getBoundingClientRect();
    const localX: number = pageX - rect.left
    const localY: number = pageY - rect.top
    this._view.onTouchesEnded(localX, localY)
  }

  /**
   * 触摸取消时调用。
   */
  public onTouchCancel(pageX: number, pageY: number): void {
    this._captured = false

    if (!this._view) {
      ToolManager.printMessage('未找到视图')
      return
    }

    const rect = this._canvas.getBoundingClientRect();
    const localX: number = pageX - rect.left
    const localY: number = pageY - rect.top
    this._view.onTouchesEnded(localX, localY)
  }

  public isContextLost(): boolean {
    return this._glManager.getGl().isContextLost()
  }

  private _canvas: HTMLCanvasElement

  private _live2DSprite: Live2DSprite


  /**
   * 视图信息
   */
  private _view: StagesManager

  /**
   * 纹理管理器
   */
  private _textureManager: TextureManager
  private _frameBuffer: WebGLFramebuffer
  private _glManager: WebGLManager
  public live2dManager: Live2DManager

  /**
   * ResizeObserver
   */
  private _resizeObserver: ResizeObserver

  /**
   * 是否正在点击
   */
  private _captured: boolean

  private _needResize: boolean

  // 模型路径
  public modelAssets: TModelAssets
}

// const actionsManager: ActionsManager = new ActionsManager()
// instance = actionsManager

export {
  ActionsManager,
  // actionsManager,
}

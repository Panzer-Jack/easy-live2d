import type {
  BeganMotionCallback,
  FinishedMotionCallback,
} from '@Framework/motion/acubismmotion'
import type { CubismMotionQueueEntryHandle } from '@Framework/motion/cubismmotionqueuemanager'
import type { DestroyOptions, Renderer, Size, Ticker } from 'pixi.js'
import type {
  ExpressionInfo,
  ExpressionParams,
  Live2DSpriteEvents,
  Live2DSpriteInit,
  MotionInfo,
  MotionParams,
  ParameterValueRange,
  Viewport,
  VoiceParams,
} from './core/types'
import type { CubismSetting } from './utils/cubismSetting'
import { InvalidMotionQueueEntryHandleValue } from '@Framework/motion/cubismmotionqueuemanager'
import { Sprite } from 'pixi.js'
import { acquireCubism, releaseCubism } from './core/initializeCubism'
import { Live2DContext } from './core/Live2DContext'
import { PointerHandler } from './interaction/PointerHandler'
import { ModelLoader } from './loader/ModelLoader'
import { TextureLoader } from './loader/TextureLoader'
import { Live2DModel } from './model/Live2DModel'
import { ModelRenderer } from './rendering/ModelRenderer'

/**
 * Easy Live2D 核心门面类
 * 薄壳，委托给 Live2DContext + Live2DModel
 */
export class Live2DSprite extends Sprite {
  private _ctx: Live2DContext
  private _model: Live2DModel | null = null
  private _modelRenderer: ModelRenderer | null = null
  private _pointerHandler: PointerHandler | null = null
  private _textureLoader: TextureLoader | null = null
  private _resizeObserver: ResizeObserver | null = null
  private _cubismInitialized = false
  private _renderInitialized = false
  private _renderInitializing = false
  private _renderFailed = false
  private _disposed = false
  private _loadAbort = new AbortController()
  private _requestedWidth: number | null = null
  private _requestedHeight: number | null = null
  private _currentViewport: Viewport | null = null
  private _draggable = false

  public renderer!: Renderer
  public modelPath: string | null = null
  public modelSetting: CubismSetting | null = null
  /** @deprecated 保留用于兼容；模型更新跟随 Pixi 渲染，无需传入 ticker。 */
  public ticker: Ticker | null = null

  private _preQueue = new Set<() => unknown>()

  /** Stable Promise that resolves once the sprite is ready. */
  private _readyPromise!: Promise<void>
  /** Resolver captured from the _readyPromise constructor; cleared after resolving. */
  private _readyResolve: (() => void) | null = null
  private _readyReject: ((reason: unknown) => void) | null = null

  override get width(): number {
    return Math.abs(this.scale.x) * this.getLocalModelWidth()
  }

  override set width(value: number) {
    this._requestedWidth = value
    this.applyRequestedSize()
  }

  override get height(): number {
    return Math.abs(this.scale.y) * this.getLocalModelHeight()
  }

  override set height(value: number) {
    this._requestedHeight = value
    this.applyRequestedSize()
  }

  get draggable(): boolean {
    return this._draggable
  }

  set draggable(value: boolean) {
    this._draggable = value
  }

  /**
   * A stable Promise that resolves when the sprite finishes loading and
   * becomes ready. If the sprite is already ready, the Promise is already
   * resolved.
   *
   * The same Promise instance is returned on every access, so it is safe to
   * await multiple times without attaching extra listeners.
   *
   * @example
   * ```ts
   * await sprite.ready
   * sprite.startMotion({ group: 'TapBody', no: 0, priority: Priority.Normal })
   * ```
   */
  get ready(): Promise<void> {
    return this._readyPromise
  }

  constructor(initConfig?: Live2DSpriteInit) {
    super()
    this._ctx = new Live2DContext()
    this.renderable = false
    // Create the stable ready promise and capture its resolver.
    this._readyPromise = new Promise<void>((resolve, reject) => {
      this._readyResolve = resolve
      this._readyReject = reject
    })
    // 仅通过 ready 事件使用的调用方也不会产生未处理的 Promise rejection。
    void this._readyPromise.catch(() => {})

    if (initConfig)
      this.init(initConfig)

    this.onRender = (renderer: Renderer) => {
      void this.renderFrame(renderer)
    }
  }

  init(config: Live2DSpriteInit): boolean {
    if (config.modelPath)
      this.modelPath = config.modelPath
    if (config.modelSetting)
      this.modelSetting = config.modelSetting
    if (config.ticker)
      this.ticker = config.ticker
    if (typeof config.draggable === 'boolean')
      this.draggable = config.draggable
    return true
  }

  onLive2D<K extends keyof Live2DSpriteEvents>(
    eventName: K,
    callback: (...args: Live2DSpriteEvents[K]) => void,
  ): void {
    this._ctx.eventBus.on(eventName, callback)
  }

  async startMotion(params: MotionParams): Promise<CubismMotionQueueEntryHandle> {
    const fn = () => this._model!.motionCtrl.startMotion(
      params.group,
      params.no,
      params.priority,
      params.onFinished as FinishedMotionCallback,
      params.onStarted as BeganMotionCallback,
    )
    if (!this._model?.isReady) {
      this._preQueue.add(() => {
        void fn()
      })
      return InvalidMotionQueueEntryHandleValue
    }
    return fn()
  }

  startRandomMotion(params: Omit<MotionParams, 'no'>): Promise<CubismMotionQueueEntryHandle> {
    const fn = () => this._model!.motionCtrl.startRandomMotion(
      params.group,
      params.priority,
      params.onFinished as FinishedMotionCallback,
      params.onStarted as BeganMotionCallback,
    )
    if (!this._model?.isReady) {
      this._preQueue.add(() => {
        void fn()
      })
      return Promise.resolve(InvalidMotionQueueEntryHandleValue)
    }
    return fn()
  }

  setExpression(params: ExpressionParams): void {
    const fn = () => {
      if ('index' in params && params.index !== undefined) {
        this._model!.expressionCtrl.setExpressionByIndex(params.index)
      } else {
        this._model!.expressionCtrl.setExpression(params.expressionId!)
      }
    }
    if (!this._model?.isReady) {
      this._preQueue.add(fn)
      return
    }
    fn()
  }

  setRandomExpression(): void {
    const fn = () => this._model!.expressionCtrl.setRandomExpression()
    if (!this._model?.isReady) {
      this._preQueue.add(fn)
      return
    }
    fn()
  }

  async playVoice(params: VoiceParams): Promise<void> {
    const fn = () => this._model!.effectCtrl.playVoice(params.voicePath, params.immediate ?? true)
    if (!this._model?.isReady) {
      this._preQueue.add(fn)
      return
    }
    await fn()
  }

  stopVoice(): void {
    this._model?.effectCtrl.stopVoice()
  }

  releaseMotions(): void {
    this._model?.motionCtrl.releaseMotions()
  }

  releaseExpressions(): void {
    this._model?.expressionCtrl.releaseExpressions()
  }

  getMotions(): MotionInfo[] {
    return this._model?.getMotionInfos() ?? []
  }

  getExpressions(): ExpressionInfo[] {
    return this._model?.getExpressionInfos() ?? []
  }

  setParameterValueById(id: string, value: number, weight?: number): void {
    const fn = () => this._model!.setParameterValueById(id, value, weight)
    if (!this._model?.isReady) {
      this._preQueue.add(fn)
      return
    }
    fn()
  }

  setParameterValueByIndex(index: number, value: number, weight?: number): void {
    const fn = () => this._model!.setParameterValueByIndex(index, value, weight)
    if (!this._model?.isReady) {
      this._preQueue.add(fn)
      return
    }
    fn()
  }

  getParameterValueRangeById(id: string): ParameterValueRange | null {
    return this._model?.getParameterValueRangeById(id) ?? null
  }

  getParameterValueRangeByIndex(index: number): ParameterValueRange | null {
    return this._model?.getParameterValueRangeByIndex(index) ?? null
  }

  onResize(): void {
    const viewport = this.getRenderViewport()
    if (viewport) {
      this._ctx.reinitializeView(viewport)
      this._currentViewport = viewport
    }
  }

  /**
   * 获取模型原始画布尺寸（像素）
   * 需要在模型加载完成后调用
   */
  getModelCanvasSize(): { width: number, height: number, pixelsPerUnit: number } | null {
    const cubismModel = this._model?.getModel()
    if (!cubismModel)
      return null
    const ppu = cubismModel.getPixelsPerUnit()
    return {
      width: cubismModel.getCanvasWidth() * ppu,
      height: cubismModel.getCanvasHeight() * ppu,
      pixelsPerUnit: ppu,
    }
  }

  override getSize(out?: Size): Size {
    const size = out ?? { width: 0, height: 0 }
    size.width = this.width
    size.height = this.height
    return size
  }

  override setSize(value: number | { width: number, height?: number }, height?: number): void {
    if (typeof value === 'object') {
      this.width = value.width
      this.height = value.height ?? value.width
      return
    }

    this.width = value
    this.height = height ?? value
  }

  protected override updateBounds(): void {
    const width = this.getLocalModelWidth()
    const height = this.getLocalModelHeight()
    const anchorX = this.anchor?._x ?? 0
    const anchorY = this.anchor?._y ?? 0

    this._bounds.minX = -anchorX * width
    this._bounds.maxX = this._bounds.minX + width
    this._bounds.minY = -anchorY * height
    this._bounds.maxY = this._bounds.minY + height
  }

  destroy(options?: DestroyOptions): void {
    if (this._disposed)
      return
    this._disposed = true
    this._loadAbort.abort()
    this._readyReject?.(new Error('Live2DSprite was destroyed before it became ready.'))
    this._readyResolve = null
    this._readyReject = null
    // 正在加载的模型由 renderFrame 的 finally 释放，避免异步回调使用已释放的 Core。
    if (!this._renderInitializing)
      this.releaseResources()
    super.destroy(options)
  }

  private releaseResources(): void {
    this._pointerHandler?.detach()
    this._pointerHandler = null
    this._resizeObserver?.disconnect()
    this._resizeObserver = null
    this._preQueue.clear()
    this._model?.release()
    this._model = null
    this._textureLoader?.release()
    this._textureLoader = null
    this._modelRenderer?.release()
    this._modelRenderer = null
    this._ctx.dispose()
    if (this._cubismInitialized) {
      releaseCubism()
      this._cubismInitialized = false
    }
  }

  // --- 内部方法 ---

  private async renderFrame(renderer: Renderer): Promise<void> {
    if (this._renderFailed || this._disposed)
      return
    this.renderer = renderer
    if (!this._renderInitialized) {
      if (this._renderInitializing)
        return
      this._renderInitializing = true

      try {
        this.initCubism()
        await this.initModel()
        if (this._disposed)
          return
        this.initInteraction()
        this.flushPreQueue()
        // Resolve the stable ready Promise exactly once; clear the resolver to free memory.
        // Single-resolution is intentional: a sprite instance initializes at most once.
        this._readyResolve?.()
        this._readyResolve = null
        this._readyReject = null
        this._renderInitialized = true
      } catch (error) {
        this._renderFailed = true
        this._loadAbort.abort()
        this._readyReject?.(error)
        this._readyResolve = null
        this._readyReject = null
        if (!this._disposed)
          console.error('[easy-live2d] Initialization failed:', error)
      } finally {
        this._renderInitializing = false
        if (this._disposed || this._renderFailed)
          this.releaseResources()
      }

      // 用户回调的异常不属于初始化失败，也不能触发资源释放。
      if (!this._disposed && !this._renderFailed) {
        try {
          this._ctx.eventBus.emit('ready')
        } catch (error) {
          console.error('[easy-live2d] ready listener failed:', error)
        }
      }
    }

    if (this._disposed || this._renderFailed)
      return

    const viewport = this.syncViewport()
    this.update(viewport)
  }

  private initCubism(): void {
    acquireCubism()
    this._cubismInitialized = true
  }

  private async initModel(): Promise<void> {
    const canvas = this.renderer.canvas as HTMLCanvasElement
    const rendererGl = 'gl' in this.renderer ? this.renderer.gl : null
    if (!this._ctx.initialize(canvas, this.getCanvasViewport(), rendererGl)) {
      throw new Error('Cubism R5 requires a Pixi WebGL 2 renderer. WebGL 1 and WebGPU are not supported.')
    }

    this._model = new Live2DModel(this._ctx.eventBus)
    this._textureLoader = new TextureLoader(this._ctx.webgl)
    this._modelRenderer = new ModelRenderer(this._ctx.viewTransform)
    this._modelRenderer.setFrameBuffer(this._ctx.frameBuffer)
    this._modelRenderer.setGl(this._ctx.webgl.getGl())

    const loader = new ModelLoader()
    const assets = this.modelPath ?? this.modelSetting
    if (!assets) {
      throw new Error('modelPath or modelSetting is required before rendering')
    }
    await loader.load(assets, this._model, this._textureLoader, this._ctx.webgl.getGl(), this._loadAbort.signal)
    if (this._disposed)
      return
    this.applyRequestedSize()
    this.onViewUpdate()

    this.setupResizeObserver(canvas)
  }

  private initInteraction(): void {
    this._pointerHandler = new PointerHandler(
      this._ctx.viewTransform,
      this._modelRenderer!,
      () => this.getRenderViewport(),
      () => this.renderer?.canvas as HTMLCanvasElement | null,
      () => this.renderer?.resolution ?? 1,
      () => this.draggable,
      (deltaX, deltaY) => {
        this.x += deltaX
        this.y += deltaY
        return { x: this.x, y: this.y }
      },
      () => ({ x: this.x, y: this.y }),
      (eventName, payload) => {
        this._ctx.eventBus.emit(eventName, payload)
      },
    )
    this._pointerHandler.setModel(this._model!)
    this._pointerHandler.attach()
  }

  private update(viewport: Viewport | null): void {
    if (!this._model?.isReady || !this._modelRenderer || !viewport)
      return
    try {
      this._modelRenderer.render(this._model, viewport, this._ctx.timeManager)
    } finally {
      // 通知 Pixi 重新绑定缓存的 GL 状态，避免后续精灵沿用 Cubism 修改过的绑定。
      if ('gl' in this.renderer) {
        this.renderer.texture.resetState()
        this.renderer.geometry.resetState()
        this.renderer.shader.resetState()
      }
    }
  }

  private getCanvasViewport(): Viewport {
    const canvas = this.renderer?.canvas as HTMLCanvasElement | undefined
    return {
      width: canvas?.width || 0,
      height: canvas?.height || 0,
      x: 0,
      y: 0,
    }
  }

  private flushPreQueue(): void {
    this._preQueue.forEach(fn => fn())
    this._preQueue.clear()
  }

  private setupResizeObserver(canvas: HTMLCanvasElement): void {
    this._resizeObserver = new ResizeObserver(() => this.onResize())
    this._resizeObserver.observe(canvas)
  }

  private getLocalModelWidth(): number {
    return this.getModelCanvasSize()?.width ?? 0
  }

  private getLocalModelHeight(): number {
    return this.getModelCanvasSize()?.height ?? 0
  }

  private applyRequestedSize(): void {
    const localWidth = this.getLocalModelWidth()
    const localHeight = this.getLocalModelHeight()

    if (this._requestedWidth !== null) {
      this._setWidth(this._requestedWidth, localWidth)
    }

    if (this._requestedHeight !== null) {
      this._setHeight(this._requestedHeight, localHeight)
    }
  }

  private syncViewport(): Viewport | null {
    const viewport = this.getRenderViewport()
    if (!viewport)
      return null

    if (
      !this._currentViewport
      || this._currentViewport.x !== viewport.x
      || this._currentViewport.y !== viewport.y
      || this._currentViewport.width !== viewport.width
      || this._currentViewport.height !== viewport.height
    ) {
      this._ctx.reinitializeView(viewport)
      this._currentViewport = viewport
    }

    return viewport
  }

  private getRenderViewport(): Viewport | null {
    const canvas = this.renderer?.canvas as HTMLCanvasElement | undefined
    if (!canvas)
      return null

    const modelWidth = this.getLocalModelWidth()
    const modelHeight = this.getLocalModelHeight()
    if (modelWidth <= 0 || modelHeight <= 0) {
      return this.getCanvasViewport()
    }

    const resolution = 'resolution' in this.renderer && typeof this.renderer.resolution === 'number'
      ? this.renderer.resolution
      : 1
    const bounds = this.getBounds()
    const minX = bounds.minX * resolution
    const minY = bounds.minY * resolution
    const maxX = bounds.maxX * resolution
    const maxY = bounds.maxY * resolution

    return {
      x: Math.floor(minX),
      y: Math.floor(minY),
      width: Math.max(0, Math.ceil(maxX - minX)),
      height: Math.max(0, Math.ceil(maxY - minY)),
    }
  }
}

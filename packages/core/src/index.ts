/* eslint-disable new-cap */
/* eslint-disable no-new */

import {
  CubismFramework,
  Option,
} from '@Framework/live2dcubismframework'
import { csmVector } from '@Framework/type/csmvector'
import { CubismLogError } from '@Framework/utils/cubismdebug'
import { ActionsManager } from './managers/actions-manager'
import { ToolManager } from './managers/tool-manager'
import { Sprite, Renderer, type Ticker, DestroyOptions } from 'pixi.js'
import { Config, ConfigType, LogLevel, Priority } from './utils/config'
import { ModelManager } from './managers/model-manager'
import type {
  BeganMotionCallback,
  FinishedMotionCallback,
} from '@Framework/motion/acubismmotion'
import { CubismMotionQueueEntryHandle } from '@Framework/motion/cubismmotionqueuemanager'
import { EventManager, eventManager } from './managers/event-manager'
import { Live2DSpriteEvents } from './types/events'
import { CubismSetting } from './utils/cubsmSetting'
import { ICubismModelSetting } from '@Framework/icubismmodelsetting'


interface Live2DSpriteInit {
  modelPath?: string
  modelSetting?: ICubismModelSetting
  ticker?: Ticker
}


/**
 * Easy Live2D 核心
 * 主入口
 */
class Live2DSprite extends Sprite {
  public modelPath: string
  public modelSetting: ICubismModelSetting
  public renderer: Renderer
  public ticker: Ticker | null = null
  private _initialized = false;
  private _model: ModelManager
  private _boundUpdate: () => void;  // 存储绑定后的update函数

  // 预加载 表情动作函数的缓冲区
  private _preQueue = new Set<Function>()

  constructor(initConfig?: Live2DSpriteInit) {
    super()
    this._cubismOption = new Option()
    this._actionsManager = new csmVector<ActionsManager>()
    this._eventManager = eventManager
    this._boundUpdate = this.update.bind(this);
    if (initConfig) {
      this.init(initConfig)
    }
    this.onRender = (renderer: Renderer) => {
      this.render(renderer)
    }
  }

  public onLive2D<K extends keyof Live2DSpriteEvents>(
    eventName: K,
    event: (...args: Live2DSpriteEvents[K]) => void
  ): void {
    this._eventManager.on(
      eventName,
      event
    );
  }

  private render: (renderer: Renderer) => void = async (renderer: Renderer) => {
    this.renderer = renderer
    if (this._initialized === false) {
      console.log('easy-live2dCore initializing')
      this._initialized = true;
      this.initCubism()
      await this.initActionsManager()
      this.initEventListener()
      this.ticker.add(this._boundUpdate)
      // 预加载表情动作
      this._preQueue.forEach((func) => {
        func()
      })
    }
  }

  // override async 

  override destroy(options?: DestroyOptions): void {
    this.release()
    super.destroy(options)
  }

  /**
   * 初始化
   */
  public init(initConfig: Live2DSpriteInit): boolean {
    const { modelPath, ticker, modelSetting } = initConfig
    this.modelPath = modelPath
    this.modelSetting = modelSetting
    this.ticker = ticker
    return true
  }

  /**
   * 开始播放指定的声音
   * @param voicePath 声音路径
   * @param immediate 是否立即播放: 默认为true，会把当前正在播放的声音停止并立即播放新的声音
   */
  public async playVoice({
    voicePath,
    immediate = true
  }: {
    voicePath: string
    immediate?: boolean
  }) {
    if (this._initialized === false) {
      this._preQueue.add(() => this.playVoice({ voicePath }))
      return null
    }
    return this._model.playVoice(voicePath, immediate)
  }

  /**
   * 停止播放声音
   */
  public stopVoice() {
    if (this._initialized === false) {
      this._preQueue.add(() => this.stopVoice())
      return null
    }
    return this._model.stopVoice()
  }

  /**
   * 设置指定的表情动作
   *
   * @param expressionId 表情动作的ID
   */
  public setExpression({
    expressionId
  }: {
    expressionId: string
  }) {
    if (this._initialized === false) {
      this._preQueue.add(() => this.setExpression({ expressionId }))
      return null
    }
    return this._model.setExpression(expressionId)
  }

  /**
   * 设置随机选择的表情动作
   */
  public setRandomExpression() {
    if (this._initialized === false) {
      this._preQueue.add(() => this.setRandomExpression())
      return null
    }
    return this._model.setRandomExpression()
  }

  /**
   * 开始播放指定的动作
   * @param group 动作组名称
   * @param no 组内编号
   * @param priority 优先级
   * @param onFinishedMotionHandler 动作播放结束时调用的回调函数
   * @return 返回开始的动作标识号。用于判断单个动作是否结束的isFinished()函数的参数。无法开始时返回[-1]
   */
  public startMotion({
    group,
    no,
    priority,
    onFinishedMotionHandler,
    onBeganMotionHandler
  }: {
    group: string,
    no: number,
    priority: Priority,
    onFinishedMotionHandler?: FinishedMotionCallback,
    onBeganMotionHandler?: BeganMotionCallback,
  }): CubismMotionQueueEntryHandle {
    if (this._initialized === false) {
      this._preQueue.add(() => this.startMotion({
        group,
        no,
        priority,
        onFinishedMotionHandler,
        onBeganMotionHandler
      }))
      return null
    }
    return this._model.startMotion(
      group,
      no,
      priority,
      onFinishedMotionHandler,
      onBeganMotionHandler
    )
  }

  /**
   * 开始播放随机选择的动作
   * @param group 动作组名称
   * @param priority 优先级
   * @param onFinishedMotionHandler 动作播放结束时调用的回调函数
   * @return 返回开始的动作标识号。用于判断单个动作是否结束的isFinished()函数的参数。无法开始时返回[-1]
   */
  public startRandomMotion({
    group,
    priority,
    onFinishedMotionHandler,
    onBeganMotionHandler
  }: {
    group: string,
    priority: Priority,
    onFinishedMotionHandler?: FinishedMotionCallback,
    onBeganMotionHandler?: BeganMotionCallback,
  }): CubismMotionQueueEntryHandle {
    if (this._initialized === false) {
      this._preQueue.add(() => this.startRandomMotion({
        group,
        priority,
        onFinishedMotionHandler,
        onBeganMotionHandler
      }))
      return null
    }
    return this._model.startRandomMotion(
      group,
      priority,
      onFinishedMotionHandler,
      onBeganMotionHandler
    )
  }

  /**
   * 释放所有动作数据
   */
  public releaseMotions(): void {
    return this._model._motions.clear()
  }

  /**
   * 释放所有表情数据
   */
  public releaseExpressions(): void {
    return this._model._expressions.clear()
  }

  /**
   * 执行处理。
   */
  private update(): void {
    // 更新时间
    ToolManager.updateTime();

    // 更新所有子代理
    const size = this._actionsManager.getSize();
    for (let i = 0; i < size; i++) {
      this._actionsManager.at(i).update();
    }
  }

  /**
   * 初始化ActionManager
   */
  private async initActionsManager() {
    this._actionsManager.prepareCapacity(1)
    const actionManager = new ActionsManager()

    await actionManager.initialize(this)
    this._actionsManager.pushBack(actionManager)
    this._model = this._actionsManager.at(0).live2dManager._models.at(0)

    if (this._actionsManager.at(0).isContextLost()) {
      new CubismLogError(
        `索引为${0}的Canvas上下文丢失，可能是因为达到了WebGLRenderingContext的获取限制。`,
      )
    }
  }

  /**
   * 当指针变为活动状态时调用。
   */
  private onPointerBegan(e: PointerEvent): void {
    for (
      let ite = this._actionsManager.begin();
      ite.notEqual(this._actionsManager.end());
      ite.preIncrement()
    ) {
      ite.ptr().onPointBegan(e.pageX, e.pageY)
    }
  }

  /**
   * 当指针移动时调用。
   */
  private onPointerMoved(e: PointerEvent): void {
    for (
      let ite = this._actionsManager.begin();
      ite.notEqual(this._actionsManager.end());
      ite.preIncrement()
    ) {
      ite.ptr().onPointMoved(e.pageX, e.pageY)
    }
  }

  /**
   * 当指针不再活动时调用。
   */
  private onPointerEnded(e: PointerEvent): void {
    for (
      let ite = this._actionsManager.begin();
      ite.notEqual(this._actionsManager.end());
      ite.preIncrement()
    ) {
      ite.ptr().onPointEnded(e.pageX, e.pageY)
    }
  }

  /**
   * 当指针被取消时调用。
   */
  private onPointerCancel(e: PointerEvent): void {
    for (
      let ite = this._actionsManager.begin();
      ite.notEqual(this._actionsManager.end());
      ite.preIncrement()
    ) {
      ite.ptr().onTouchCancel(e.pageX, e.pageY)
    }
  }

  /**
   * 重新调整画布大小并重新初始化视图。
   */
  public onResize(): void {
    for (let i = 0; i < this._actionsManager.getSize(); i++) {
      this._actionsManager.at(i).onResize()
    }
  }

  /**
   * 释放资源。
   */
  public release(): void {
    this.ticker.remove(this._boundUpdate)
    this.releaseEventListener()
    this.releaseActionsManager()

    // 释放Cubism SDK
    CubismFramework.dispose()

    this._cubismOption = null
  }

  /**
   * 解除事件监听器。
   */
  private releaseEventListener(): void {
    this.removeAllListeners()
    this._eventManager.clear()

    this.pointBeganEventListener = null
    this.pointMovedEventListener = null
    this.pointEndedEventListener = null
    this.pointCancelEventListener = null
  }

  /**
   * 释放Subdelegate 
   */
  private releaseActionsManager(): void {
    for (
      let ite = this._actionsManager.begin();
      ite.notEqual(this._actionsManager.end());
      ite.preIncrement()
    ) {
      ite.ptr().release()
    }

    this._actionsManager.clear()
    this._actionsManager = null
  }

  /**
   * 设置事件监听器。
   */
  private initEventListener(): void {
    this.pointBeganEventListener = this.onPointerBegan.bind(this)
    this.pointMovedEventListener = this.onPointerMoved.bind(this)
    this.pointEndedEventListener = this.onPointerEnded.bind(this)
    this.pointCancelEventListener = this.onPointerCancel.bind(this)

    // 确保精灵可交互
    this.eventMode = 'static';

    // 使用PIXI的事件系统
    this.on('pointerdown', this.pointBeganEventListener);
    this.on('pointermove', this.pointMovedEventListener);
    this.on('pointerup', this.pointEndedEventListener);
    this.on('pointercancel', this.pointCancelEventListener);
    this.on('hit', () => console.log('hit'));

    // 自定义事件注册到Pixi
    this._eventManager.events.forEach((event, key) => {
      this.on(key as string, (...args) => event(...args))
    })

  }

  /**
   * 初始化Cubism SDK
   */
  private initCubism(): void {
    ToolManager.updateTime()

    // 设置cubism
    this._cubismOption.logFunction = ToolManager.printMessage
    this._cubismOption.loggingLevel = Config.CubismLoggingLevel
    CubismFramework.startUp(this._cubismOption)

    // 初始化cubism
    CubismFramework.initialize()
  }

  /**
   * Cubism SDK 选项
   */
  private _cubismOption: Option

  /**
   * ActionsManager
   */
  private _actionsManager: csmVector<ActionsManager>

  /**
   * EventManager
   */

  private _eventManager: EventManager

  /**
   * 已注册的事件监听器函数对象
   */
  private pointBeganEventListener: (this: Document, ev: PointerEvent) => void

  /**
   * 已注册的事件监听器函数对象
   */
  private pointMovedEventListener: (this: Document, ev: PointerEvent) => void

  /**
   * 已注册的事件监听器函数对象
   */
  private pointEndedEventListener: (this: Document, ev: PointerEvent) => void

  /**
   * 已注册的事件监听器函数对象
   */
  private pointCancelEventListener: (this: Document, ev: PointerEvent) => void
}


export {
  Live2DSprite,
  CubismSetting,
  Config,
  ConfigType,
  LogLevel,
  Priority
}

import type { ActionsManager } from './actions-manager'
import { CubismMatrix44 } from '@Framework/math/cubismmatrix44'
import { CubismViewMatrix } from '@Framework/math/cubismviewmatrix'
import { Config } from '../utils/config'
import { ToolManager } from './tool-manager'
import { TouchManager } from './touch-manager'

/**
 * 舞台管理器。
 */
class StagesManager {
  /**
   * 构造函数
   */
  public constructor() {
    this._programId = null
    // 触摸相关的事件管理
    this._touchManager = new TouchManager()

    // 用于从设备坐标转换到屏幕坐标
    this._deviceToScreen = new CubismMatrix44()

    // 用于处理屏幕显示的缩放和移动变换的矩阵
    this._viewMatrix = new CubismViewMatrix()
  }

  /**
   * 初始化。
   */
  public initialize(subdelegate: ActionsManager): void {
    this._subdelegate = subdelegate
    const { width, height, x, y } = subdelegate.getLive2DSprite()

    const ratio: number = width / height
    const left: number = -ratio
    const right: number = ratio
    const bottom: number = Config.ViewLogicalLeft
    const top: number = Config.ViewLogicalRight

    this._viewMatrix.setScreenRect(left, right, bottom, top) // 对应设备的屏幕范围。X的左边界，X的右边界，Y的下边界，Y的上边界
    this._viewMatrix.scale(Config.ViewScale, Config.ViewScale)

    // 鼠标坐标相关逻辑
    this._deviceToScreen.loadIdentity()
    if (width > height) {
      const screenW: number = Math.abs(right - left)
      this._deviceToScreen.scaleRelative(screenW / width, -screenW / width)
    } else {
      const screenH: number = Math.abs(top - bottom)
      this._deviceToScreen.scaleRelative(screenH / height, -screenH / height)
    }
    this._deviceToScreen.translateRelative(-width * 0.5 - x, -height * 0.5 - y)

    // 设置显示范围
    this._viewMatrix.setMaxScale(Config.ViewMaxScale) // 最大缩放率
    this._viewMatrix.setMinScale(Config.ViewMinScale) // 最小缩放率

    // 可以显示的最大范围
    this._viewMatrix.setMaxScreenRect(
      Config.ViewLogicalMaxLeft,
      Config.ViewLogicalMaxRight,
      Config.ViewLogicalMaxBottom,
      Config.ViewLogicalMaxTop,
    )
  }

  /**
   * 释放资源
   */
  public release(): void {
    this._viewMatrix = null
    this._touchManager = null
    this._deviceToScreen = null

    this._subdelegate.getGlManager().getGl().deleteProgram(this._programId)
    this._programId = null
  }

  /**
   * 绘制。
   */
  public render(): void {
    this._subdelegate.getGlManager().getGl().useProgram(this._programId)

    this._subdelegate.getGlManager().getGl().flush()

    const lapplive2dmanager = this._subdelegate.getLive2DManager()
    if (lapplive2dmanager != null) {
      lapplive2dmanager.setViewMatrix(this._viewMatrix)

      lapplive2dmanager.onUpdate()
    }
  }

  /**
   * 触摸开始时调用。
   *
   * @param pointX 屏幕X坐标
   * @param pointY 屏幕Y坐标
   */
  public onTouchesBegan(pointX: number, pointY: number): void {
    this._touchManager.touchesBegan(
      pointX * window.devicePixelRatio,
      pointY * window.devicePixelRatio,
    )
  }

  /**
   * 触摸时指针移动时调用。
   *
   * @param pointX 屏幕X坐标
   * @param pointY 屏幕Y坐标
   */
  public onTouchesMoved(pointX: number, pointY: number): void {
    const posX = pointX * window.devicePixelRatio
    const posY = pointY * window.devicePixelRatio

    const lapplive2dmanager = this._subdelegate.getLive2DManager()

    const viewX: number = this.transformViewX(this._touchManager.getX())
    const viewY: number = this.transformViewY(this._touchManager.getY())

    this._touchManager.touchesMoved(posX, posY)

    lapplive2dmanager.onDrag(viewX, viewY)
  }

  /**
   * 触摸结束时调用。
   *
   * @param pointX 屏幕X坐标
   * @param pointY 屏幕Y坐标
   */
  public onTouchesEnded(pointX: number, pointY: number): void {
    const posX = pointX * window.devicePixelRatio
    const posY = pointY * window.devicePixelRatio
    const lapplive2dmanager = this._subdelegate.getLive2DManager()

    // 触摸结束
    lapplive2dmanager.onDrag(0.0, 0.0)

    // 单击
    const x: number = this.transformViewX(posX)
    const y: number = this.transformViewY(posY)

    if (Config.DebugTouchLogEnable) {
      ToolManager.printMessage(`[APP]touchesEnded x: ${x} y: ${y}`)
    }
    lapplive2dmanager.onTap(x, y)
  }

  /**
   * 将X坐标转换为View坐标。
   *
   * @param deviceX 设备X坐标
   */
  public transformViewX(deviceX: number): number {
    const screenX: number = this._deviceToScreen.transformX(deviceX) // 获取逻辑坐标转换后的坐标。
    return this._viewMatrix.invertTransformX(screenX) // 放大、缩小、移动后的值。
  }

  /**
   * 将Y坐标转换为View坐标。
   *
   * @param deviceY 设备Y坐标
   */
  public transformViewY(deviceY: number): number {
    const screenY: number = this._deviceToScreen.transformY(deviceY) // 获取逻辑坐标转换后的坐标。
    return this._viewMatrix.invertTransformY(screenY)
  }

  /**
   * 将X坐标转换为Screen坐标。
   * @param deviceX 设备X坐标
   */
  public transformScreenX(deviceX: number): number {
    return this._deviceToScreen.transformX(deviceX)
  }

  /**
   * 将Y坐标转换为Screen坐标。
   *
   * @param deviceY 设备Y坐标
   */
  public transformScreenY(deviceY: number): number {
    return this._deviceToScreen.transformY(deviceY)
  }

  _touchManager: TouchManager // 触摸管理器
  _deviceToScreen: CubismMatrix44 // 设备到屏幕的矩阵
  _viewMatrix: CubismViewMatrix // 视图矩阵
  _programId: WebGLProgram // 着色器ID
  _changeModel: boolean // 模型切换标志
  _isClick: boolean // 点击中
  private _subdelegate: ActionsManager
}



export {
  StagesManager
}

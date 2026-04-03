import type { Viewport } from '../core/types'
import { CubismMatrix44 } from '@Framework/math/cubismmatrix44'
import { CubismViewMatrix } from '@Framework/math/cubismviewmatrix'
import { TouchTracker } from '../interaction/TouchTracker'
import { Config } from '../utils/config'

/**
 * 视图变换
 * 管理视图矩阵、设备到屏幕的坐标转换
 * 合并原 StagesManager 的坐标逻辑
 */
export class ViewTransform {
  readonly touchTracker = new TouchTracker()
  private _deviceToScreen = new CubismMatrix44()
  private _viewMatrix = new CubismViewMatrix()

  get viewMatrix(): CubismViewMatrix {
    return this._viewMatrix
  }

  initialize(viewport: Viewport): void {
    const { width, height, x, y } = viewport
    const ratio = width / height
    const left = -ratio
    const right = ratio
    const bottom = Config.ViewLogicalLeft
    const top = Config.ViewLogicalRight

    this._viewMatrix.setScreenRect(left, right, bottom, top)
    this._viewMatrix.scale(Config.ViewScale, Config.ViewScale)

    this._deviceToScreen.loadIdentity()
    if (width > height) {
      const screenW = Math.abs(right - left)
      this._deviceToScreen.scaleRelative(screenW / width, -screenW / width)
    } else {
      const screenH = Math.abs(top - bottom)
      this._deviceToScreen.scaleRelative(screenH / height, -screenH / height)
    }
    this._deviceToScreen.translateRelative(-width * 0.5 - x, -height * 0.5 - y)

    this._viewMatrix.setMaxScale(Config.ViewMaxScale)
    this._viewMatrix.setMinScale(Config.ViewMinScale)
    this._viewMatrix.setMaxScreenRect(
      Config.ViewLogicalMaxLeft,
      Config.ViewLogicalMaxRight,
      Config.ViewLogicalMaxBottom,
      Config.ViewLogicalMaxTop,
    )
  }

  transformViewX(deviceX: number): number {
    const screenX = this._deviceToScreen.transformX(deviceX)
    return this._viewMatrix.invertTransformX(screenX)
  }

  transformViewY(deviceY: number): number {
    const screenY = this._deviceToScreen.transformY(deviceY)
    return this._viewMatrix.invertTransformY(screenY)
  }

  transformScreenX(deviceX: number): number {
    return this._deviceToScreen.transformX(deviceX)
  }

  transformScreenY(deviceY: number): number {
    return this._deviceToScreen.transformY(deviceY)
  }

  release(): void {
    this._viewMatrix = null!
    this._deviceToScreen = null!
  }
}

import type { ICubismModelSetting } from '@Framework/icubismmodelsetting'
import type { CubismIdHandle } from '@Framework/id/cubismid'
import type { EventBus } from '../core/EventBus'

/**
 * 碰撞检测辅助
 * 从指定 ID 的顶点列表计算矩形，判断坐标是否在范围内
 */
export class HitTestHelper {
  private _eventBus: EventBus

  constructor(eventBus: EventBus) {
    this._eventBus = eventBus
  }

  /**
   * 碰撞检测
   * @param setting 模型设置
   * @param opacity 模型透明度
   * @param isHitFn CubismUserModel.isHit 方法引用
   * @param x 要判断的 X 坐标
   * @param y 要判断的 Y 坐标
   */
  test(
    setting: ICubismModelSetting,
    opacity: number,
    isHitFn: (drawId: CubismIdHandle, x: number, y: number) => boolean,
    x: number,
    y: number,
  ): boolean {
    const hitAreaName = this.findHitArea(setting, opacity, isHitFn, x, y)
    if (hitAreaName) {
      this._eventBus.emit('hit', { hitAreaName, x, y })
      return true
    }
    return false
  }

  hasHit(
    setting: ICubismModelSetting,
    opacity: number,
    isHitFn: (drawId: CubismIdHandle, x: number, y: number) => boolean,
    x: number,
    y: number,
  ): boolean {
    return this.findHitArea(setting, opacity, isHitFn, x, y) !== null
  }

  private findHitArea(
    setting: ICubismModelSetting,
    opacity: number,
    isHitFn: (drawId: CubismIdHandle, x: number, y: number) => boolean,
    x: number,
    y: number,
  ): string | null {
    if (opacity < 1)
      return null

    const count = setting.getHitAreasCount()
    for (let i = 0; i < count; i++) {
      const hitAreaName = setting.getHitAreaName(i)
      const drawId = setting.getHitAreaId(i)
      if (isHitFn(drawId, x, y)) {
        return hitAreaName
      }
    }
    return null
  }
}

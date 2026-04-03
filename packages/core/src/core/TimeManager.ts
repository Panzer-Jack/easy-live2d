/**
 * 时间管理器
 * 每个 Live2DSprite 实例持有独立的 TimeManager，替代 ToolManager 的静态状态
 */
export class TimeManager {
  private currentFrame = 0
  private lastFrame = 0
  private _deltaTime = 0

  get deltaTime(): number {
    return this._deltaTime
  }

  update(): void {
    this.currentFrame = Date.now()
    this._deltaTime = (this.currentFrame - this.lastFrame) / 1000
    this.lastFrame = this.currentFrame
  }

  reset(): void {
    this.currentFrame = 0
    this.lastFrame = 0
    this._deltaTime = 0
  }
}

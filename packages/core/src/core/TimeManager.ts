/**
 * 时间管理器
 * 每个 Live2DSprite 实例持有独立的 TimeManager，替代 ToolManager 的静态状态
 */
export class TimeManager {
  private lastFrame: number | null = null
  private _deltaTime = 0

  get deltaTime(): number {
    return this._deltaTime
  }

  update(): void {
    const now = performance.now()
    // 首帧只建立基准；后台恢复等长间隔最多推进 100ms，避免动作和物理突跳。
    this._deltaTime = this.lastFrame === null ? 0 : Math.min(0.1, Math.max(0, (now - this.lastFrame) / 1000))
    this.lastFrame = now
  }

  reset(): void {
    this.lastFrame = null
    this._deltaTime = 0
  }
}

import type { CubismExpressionMotionManager } from '@Framework/motion/cubismexpressionmotionmanager'
import { ACubismMotion } from '@Framework/motion/acubismmotion'

/**
 * 表情控制器
 * 负责表情的设置、随机设置和释放
 */
export class ExpressionController {
  private _expressions = new Map<string, ACubismMotion | null>()
  private _expressionManager: CubismExpressionMotionManager

  // 由 Live2DModel 注入
  private _loadExpressionFn: (buf: ArrayBuffer, size: number, name: string) => ACubismMotion | null

  constructor(
    expressionManager: CubismExpressionMotionManager,
    loadExpressionFn: typeof ExpressionController.prototype._loadExpressionFn,
  ) {
    this._expressionManager = expressionManager
    this._loadExpressionFn = loadExpressionFn
  }

  get expressions(): Map<string, ACubismMotion | null> {
    return this._expressions
  }

  loadExpressionData(name: string, buf: ArrayBuffer): void {
    const motion = this._loadExpressionFn(buf, buf.byteLength, name)
    const existing = this._expressions.get(name)
    if (existing != null) {
      ACubismMotion.delete(existing)
    }
    this._expressions.set(name, motion)
  }

  setExpression(expressionId: string): void {
    const motion = this._expressions.get(expressionId)
    if (motion != null) {
      this._expressionManager.startMotion(motion, false)
    } else {
      console.warn(`Expression '${expressionId}' not found`)
    }
  }

  setExpressionByIndex(index: number): void {
    if (index < 0 || index >= this._expressions.size) {
      console.warn(`Expression index ${index} out of range (0-${this._expressions.size - 1})`)
      return
    }
    const name = Array.from(this._expressions.keys())[index]
    this.setExpression(name)
  }

  setRandomExpression(): void {
    if (this._expressions.size === 0)
      return
    this.setExpressionByIndex(Math.floor(Math.random() * this._expressions.size))
  }

  releaseExpressions(): void {
    this._expressions.clear()
  }

  dispose(): void {
    for (const motion of this._expressions.values()) {
      if (motion)
        ACubismMotion.delete(motion)
    }
    this._expressions.clear()
  }
}

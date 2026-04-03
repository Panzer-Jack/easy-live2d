import type { CubismExpressionMotionManager } from '@Framework/motion/cubismexpressionmotionmanager'
import { ACubismMotion } from '@Framework/motion/acubismmotion'
import { csmMap as CsmMap } from '@Framework/type/csmmap'

/**
 * 表情控制器
 * 负责表情的设置、随机设置和释放
 */
export class ExpressionController {
  private _expressions = new CsmMap<string, ACubismMotion | null>()
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

  get expressions(): CsmMap<string, ACubismMotion | null> {
    return this._expressions
  }

  loadExpressionData(name: string, buf: ArrayBuffer): void {
    const motion = this._loadExpressionFn(buf, buf.byteLength, name)
    const existing = this._expressions.getValue(name)
    if (existing !== null) {
      ACubismMotion.delete(existing)
    }
    this._expressions.setValue(name, motion)
  }

  setExpression(expressionId: string): void {
    const motion = this._expressions.getValue(expressionId)
    if (motion !== null) {
      this._expressionManager.startMotion(motion, false)
    } else {
      console.warn(`Expression '${expressionId}' not found`)
    }
  }

  setRandomExpression(): void {
    if (this._expressions.getSize() === 0)
      return

    const no = Math.floor(Math.random() * this._expressions.getSize())
    let i = 0
    for (
      let iter = this._expressions.begin();
      iter.notEqual(this._expressions.end());
      iter.preIncrement()
    ) {
      if (i === no) {
        const name = iter.ptr().first
        this.setExpression(name)
        return
      }
      i++
    }
  }

  releaseExpressions(): void {
    this._expressions.clear()
  }
}

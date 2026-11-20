import type { CubismModel } from '@Framework/model/cubismmodel'
import type { CubismMotionManager } from '@Framework/motion/cubismmotionmanager'
import type { BeforePhysicsCallback, Live2DFrameParameters } from '../core/types'

export class BeforePhysicsHook {
  callback: BeforePhysicsCallback | null = null

  private indices: Map<string, number> | null = null
  private activeModel: CubismModel | null = null
  private activeMotions: CubismMotionManager | null = null

  private readonly parameters: Live2DFrameParameters = {
    getParameterValueById: (id) => {
      const index = this.indices?.get(id)
      return index === undefined ? null : this.activeModel?.getParameterValueByIndex(index) ?? null
    },
    setParameterValueById: (id, value, weight) => {
      const index = this.indices?.get(id)
      if (index !== undefined)
        this.activeModel?.setParameterValueByIndex(index, value, weight)
    },
    addParameterValueById: (id, value, weight) => {
      const index = this.indices?.get(id)
      if (index !== undefined)
        this.activeModel?.addParameterValueByIndex(index, value, weight)
    },
    isMotionFinished: () => this.activeMotions?.isFinished() ?? true,
  }

  run(model: CubismModel, motions: CubismMotionManager, deltaTime: number): void {
    const callback = this.callback
    if (!callback)
      return

    if (!this.indices) {
      // 只索引模型实际声明的参数，避免 Cubism 为未知 ID 创建跨帧保存的虚拟参数。
      this.indices = new Map(model.getModel().parameters.ids.map((id, index) => [id, index]))
    }
    this.activeModel = model
    this.activeMotions = motions
    try {
      callback(this.parameters, deltaTime)
    } catch (error) {
      console.error('[easy-live2d] onBeforePhysics callback failed:', error)
    } finally {
      this.activeModel = null
      this.activeMotions = null
    }
  }

  clear(): void {
    this.callback = null
    this.indices = null
    this.activeModel = null
    this.activeMotions = null
  }
}

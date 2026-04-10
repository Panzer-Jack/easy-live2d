/**
 * 持久化参数覆盖表
 *
 * 存储用户通过 setParameterValueById / setParameterValueByIndex 写入的参数值。
 * 每帧 update() 末尾统一应用到 CubismModel，保证最高优先级且跨帧持久有效。
 */

type ParameterOverride = { value: number, weight: number | undefined }

export class ParameterOverrideMap {
  private _byId = new Map<string, ParameterOverride>()
  private _byIndex = new Map<number, ParameterOverride>()

  /** 设置（或更新）指定 ID 的覆盖值 */
  setById(id: string, value: number, weight?: number): void {
    this._byId.set(id, { value, weight })
  }

  /** 设置（或更新）指定索引的覆盖值 */
  setByIndex(index: number, value: number, weight?: number): void {
    this._byIndex.set(index, { value, weight })
  }

  /** 将所有覆盖值写入模型 */
  applyToModel(
    model: {
      setParameterValueById: (handle: unknown, value: number, weight?: number) => void
      setParameterValueByIndex: (index: number, value: number, weight?: number) => void
    },
    getIdHandle: (id: string) => unknown,
  ): void {
    for (const [id, { value, weight }] of this._byId) {
      model.setParameterValueById(getIdHandle(id), value, weight)
    }
    for (const [index, { value, weight }] of this._byIndex) {
      model.setParameterValueByIndex(index, value, weight)
    }
  }
}

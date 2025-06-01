/* eslint-disable new-cap */
import type { ACubismMotion } from '@Framework/motion/acubismmotion'
import type { ActionsManager } from './actions-manager'
import { CubismMatrix44 } from '@Framework/math/cubismmatrix44'

import { csmVector } from '@Framework/type/csmvector'
import { Config, Priority } from '../utils/config'
import { ModelManager, TModelAssets } from './model-manager'
import { ToolManager } from './tool-manager'
import { eventManager, EventManager } from './event-manager'

/**
 * 在示例应用程序中管理Cubism模型的类
 * 执行模型的生成和销毁、处理点击事件、模型切换等操作。
 */
export class Live2DManager {
  /**
   * 释放当前场景中保存的所有模型
   */
  private releaseAllModel(): void {
    this._models.clear()
  }

  /**
   * 屏幕拖动时的处理
   *
   * @param x 屏幕的X坐标
   * @param y 屏幕的Y坐标
   */
  public onDrag(x: number, y: number): void {
    const model: ModelManager = this._models.at(0)
    if (model && Config.MouseFollow) {
      // 视线跟随鼠标
      model.setDragging(x, y)
    }
  }

  /**
   * 屏幕点击时的处理
   *
   * @param x 屏幕的X坐标
   * @param y 屏幕的Y坐标
   */
  public onTap(x: number, y: number): void {
    if (Config.DebugLogEnable) {
      ToolManager.printMessage(
        `[APP]tap point: {x: ${x.toFixed(2)} y: ${y.toFixed(2)}}`,
      )
    }

    const model: ModelManager = this._models.at(0)
    const count = model._modelSetting.getHitAreasCount()
    for (let i = 0; i < count; i++) {
      const hitAreaName = model._modelSetting.getHitAreaName(i)
      if (model.hitTest(hitAreaName, x, y)) {
        if (Config.DebugLogEnable) {
          ToolManager.printMessage(
            `[APP]hit area: [${hitAreaName}]`,
          )
        }
      }
    }
  }

  /**
   * 屏幕更新时的处理
   * 执行模型的更新处理和绘制处理
   */
  public onUpdate(): void {
    const { width, height } = this._subdelegate.getLive2DSprite()

    const projection: CubismMatrix44 = new CubismMatrix44()
    const model: ModelManager = this._models.at(0)

    if (model.getModel()) {
      if (model.getModel().getCanvasWidth() > 1.0 && width < height) {
        // 在纵向窗口显示横向长模型时，根据模型的横向尺寸计算缩放比例
        model.getModelMatrix().setWidth(2.0)
        projection.scale(1.0, width / height)
      } else {
        projection.scale(height / width, 1.0)
      }

      // 如有必要，在此处进行乘法运算
      if (this._viewMatrix != null) {
        projection.multiplyByMatrix(this._viewMatrix)
      }
    }

    model.update()
    model.draw(projection) // 引用传递，因此projection会被修改。
  }

  /**
   * 切换到下一个场景
   * 在示例应用程序中进行模型集的切换。
   */
  public async nextScene() {
    const no: number = (this._sceneIndex + 1)
    await this.changeScene(no)
  }

  /**
   * 切换场景
   * 在示例应用程序中进行模型集的切换。
   * @param index
   */
  private async changeScene(index: number) {
    this._sceneIndex = index

    if (Config.DebugLogEnable) {
      ToolManager.printMessage(`[APP]model index: ${this._sceneIndex}`)
    }

    this.releaseAllModel()
    const instance = new ModelManager()
    instance.setSubdelegate(this._subdelegate)
    await instance.loadAssets(this._modelAssets)
    this._models.pushBack(instance)
  }

  public setViewMatrix(m: CubismMatrix44) {
    for (let i = 0; i < 16; i++) {
      this._viewMatrix.getArray()[i] = m.getArray()[i]
    }
  }

  /**
   * 添加模型
   */
  public async addModel(sceneIndex: number = 0) {
    this._sceneIndex = sceneIndex
    await this.changeScene(this._sceneIndex)
  }

  /**
   * 构造函数
   */
  public constructor() {
    this._subdelegate = null
    this._viewMatrix = new CubismMatrix44()
    this._models = new csmVector<ModelManager>()
    this._sceneIndex = 0
  }

  /**
   * 释放资源。
   */
  public release(): void { }

  /**
   * 初始化。
   * @param subdelegate
   */
  public async initialize(subdelegate: ActionsManager) {
    this._subdelegate = subdelegate
    this._modelAssets = subdelegate.modelAssets
    await this.changeScene(this._sceneIndex)
  }

  /**
   * 自身所属的Subdelegate
   */
  private _subdelegate: ActionsManager

  _viewMatrix: CubismMatrix44 // 用于模型绘制的视图矩阵
  _models: csmVector<ModelManager> // 模型实例的容器
  private _sceneIndex: number // 显示场景的索引值

  private _modelAssets: TModelAssets

  // 动作播放开始的回调函数
  beganMotion = (self: ACubismMotion): void => {
    ToolManager.printMessage('Motion Began:')
    console.log(self)
  }

  // 动作播放结束的回调函数
  finishedMotion = (self: ACubismMotion): void => {
    ToolManager.printMessage('Motion Finished:')
    console.log(self)
  }
}

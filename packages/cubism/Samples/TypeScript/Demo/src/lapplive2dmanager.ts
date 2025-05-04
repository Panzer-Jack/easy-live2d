/**
 * Copyright(c) Live2D Inc. All rights reserved.
 *
 * 使用此源代码受Live2D开源软件许可证的约束，
 * 该许可证可在https://www.live2d.com/eula/live2d-open-software-license-agreement_en.html找到。
 */

import { CubismMatrix44 } from '@framework/math/cubismmatrix44';
import { ACubismMotion } from '@framework/motion/acubismmotion';
import { csmVector } from '@framework/type/csmvector';

import * as LAppDefine from './lappdefine';
import { LAppModel } from './lappmodel';
import { LAppPal } from './lapppal';
import { LAppSubdelegate } from './lappsubdelegate';

/**
 * 在示例应用程序中管理Cubism模型的类
 * 执行模型的生成和销毁、处理点击事件、模型切换等操作。
 */
export class LAppLive2DManager {
  /**
   * 释放当前场景中保存的所有模型
   */
  private releaseAllModel(): void {
    this._models.clear();
  }

  /**
   * 屏幕拖动时的处理
   *
   * @param x 屏幕的X坐标
   * @param y 屏幕的Y坐标
   */
  public onDrag(x: number, y: number): void {
    const model: LAppModel = this._models.at(0);
    if (model) {
      model.setDragging(x, y);
    }
  }

  /**
   * 屏幕点击时的处理
   *
   * @param x 屏幕的X坐标
   * @param y 屏幕的Y坐标
   */
  public onTap(x: number, y: number): void {
    if (LAppDefine.DebugLogEnable) {
      LAppPal.printMessage(
        `[APP]tap point: {x: ${x.toFixed(2)} y: ${y.toFixed(2)}}`
      );
    }

    const model: LAppModel = this._models.at(0);

    if (model.hitTest(LAppDefine.HitAreaNameHead, x, y)) {
      if (LAppDefine.DebugLogEnable) {
        LAppPal.printMessage(`[APP]hit area: [${LAppDefine.HitAreaNameHead}]`);
      }
      model.setRandomExpression();
    } else if (model.hitTest(LAppDefine.HitAreaNameBody, x, y)) {
      if (LAppDefine.DebugLogEnable) {
        LAppPal.printMessage(`[APP]hit area: [${LAppDefine.HitAreaNameBody}]`);
      }
      model.startRandomMotion(
        LAppDefine.MotionGroupTapBody,
        LAppDefine.PriorityNormal,
        this.finishedMotion,
        this.beganMotion
      );
    }
  }

  /**
   * 屏幕更新时的处理
   * 执行模型的更新处理和绘制处理
   */
  public onUpdate(): void {
    const { width, height } = this._subdelegate.getCanvas();

    const projection: CubismMatrix44 = new CubismMatrix44();
    const model: LAppModel = this._models.at(0);

    if (model.getModel()) {
      if (model.getModel().getCanvasWidth() > 1.0 && width < height) {
        // 在纵向窗口显示横向长模型时，根据模型的横向尺寸计算缩放比例
        model.getModelMatrix().setWidth(2.0);
        projection.scale(1.0, width / height);
      } else {
        projection.scale(height / width, 1.0);
      }

      // 如有必要，在此处进行乘法运算
      if (this._viewMatrix != null) {
        projection.multiplyByMatrix(this._viewMatrix);
      }
    }

    model.update();
    model.draw(projection); // 引用传递，因此projection会被修改。
  }

  /**
   * 切换到下一个场景
   * 在示例应用程序中进行模型集的切换。
   */
  public nextScene(): void {
    const no: number = (this._sceneIndex + 1) % LAppDefine.ModelDirSize;
    this.changeScene(no);
  }

  /**
   * 切换场景
   * 在示例应用程序中进行模型集的切换。
   * @param index
   */
  private changeScene(index: number): void {
    this._sceneIndex = index;

    if (LAppDefine.DebugLogEnable) {
      LAppPal.printMessage(`[APP]model index: ${this._sceneIndex}`);
    }

    // 从ModelDir[]中保存的目录名
    // 决定model3.json的路径。
    // 保持目录名和model3.json的名称一致。
    const model: string = LAppDefine.ModelDir[index];
    const modelPath: string = LAppDefine.ResourcesPath + model + '/';
    let modelJsonName: string = LAppDefine.ModelDir[index];
    modelJsonName += '.model3.json';

    this.releaseAllModel();
    const instance = new LAppModel();
    instance.setSubdelegate(this._subdelegate);
    instance.loadAssets(modelPath, modelJsonName);
    this._models.pushBack(instance);
  }

  public setViewMatrix(m: CubismMatrix44) {
    for (let i = 0; i < 16; i++) {
      this._viewMatrix.getArray()[i] = m.getArray()[i];
    }
  }

  /**
   * 添加模型
   */
  public addModel(sceneIndex: number = 0): void {
    this._sceneIndex = sceneIndex;
    this.changeScene(this._sceneIndex);
  }

  /**
   * 构造函数
   */
  public constructor() {
    this._subdelegate = null;
    this._viewMatrix = new CubismMatrix44();
    this._models = new csmVector<LAppModel>();
    this._sceneIndex = 0;
  }

  /**
   * 释放资源。
   */
  public release(): void {}

  /**
   * 初始化。
   * @param subdelegate
   */
  public initialize(subdelegate: LAppSubdelegate): void {
    this._subdelegate = subdelegate;
    this.changeScene(this._sceneIndex);
  }

  /**
   * 自身所属的Subdelegate
   */
  private _subdelegate: LAppSubdelegate;

  _viewMatrix: CubismMatrix44; // 用于模型绘制的视图矩阵
  _models: csmVector<LAppModel>; // 模型实例的容器
  private _sceneIndex: number; // 显示场景的索引值

  // 动作播放开始的回调函数
  beganMotion = (self: ACubismMotion): void => {
    LAppPal.printMessage('Motion Began:');
    console.log(self);
  };
  // 动作播放结束的回调函数
  finishedMotion = (self: ACubismMotion): void => {
    LAppPal.printMessage('Motion Finished:');
    console.log(self);
  };
}

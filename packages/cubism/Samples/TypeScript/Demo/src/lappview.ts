/**
 * Copyright(c) Live2D Inc. All rights reserved.
 *
 * 使用此源代码受Live2D开源软件许可证的约束，
 * 该许可证可在https://www.live2d.com/eula/live2d-open-software-license-agreement_en.html找到。
 */

import { CubismMatrix44 } from '@framework/math/cubismmatrix44';
import { CubismViewMatrix } from '@framework/math/cubismviewmatrix';

import * as LAppDefine from './lappdefine';
import { LAppDelegate } from './lappdelegate';
import { LAppPal } from './lapppal';
import { LAppSprite } from './lappsprite';
import { TextureInfo } from './lapptexturemanager';
import { TouchManager } from './touchmanager';
import { LAppSubdelegate } from './lappsubdelegate';

/**
 * 绘制类。
 */
export class LAppView {
  /**
   * 构造函数
   */
  public constructor() {
    this._programId = null;
    this._back = null;
    this._gear = null;

    // 触摸相关的事件管理
    this._touchManager = new TouchManager();

    // 用于从设备坐标转换到屏幕坐标
    this._deviceToScreen = new CubismMatrix44();

    // 用于处理屏幕显示的缩放和移动变换的矩阵
    this._viewMatrix = new CubismViewMatrix();
  }

  /**
   * 初始化。
   */
  public initialize(subdelegate: LAppSubdelegate): void {
    this._subdelegate = subdelegate;
    const { width, height } = subdelegate.getCanvas();

    const ratio: number = width / height;
    const left: number = -ratio;
    const right: number = ratio;
    const bottom: number = LAppDefine.ViewLogicalLeft;
    const top: number = LAppDefine.ViewLogicalRight;

    this._viewMatrix.setScreenRect(left, right, bottom, top); // 对应设备的屏幕范围。X的左边界，X的右边界，Y的下边界，Y的上边界
    this._viewMatrix.scale(LAppDefine.ViewScale, LAppDefine.ViewScale);

    this._deviceToScreen.loadIdentity();
    if (width > height) {
      const screenW: number = Math.abs(right - left);
      this._deviceToScreen.scaleRelative(screenW / width, -screenW / width);
    } else {
      const screenH: number = Math.abs(top - bottom);
      this._deviceToScreen.scaleRelative(screenH / height, -screenH / height);
    }
    this._deviceToScreen.translateRelative(-width * 0.5, -height * 0.5);

    // 设置显示范围
    this._viewMatrix.setMaxScale(LAppDefine.ViewMaxScale); // 最大缩放率
    this._viewMatrix.setMinScale(LAppDefine.ViewMinScale); // 最小缩放率

    // 可以显示的最大范围
    this._viewMatrix.setMaxScreenRect(
      LAppDefine.ViewLogicalMaxLeft,
      LAppDefine.ViewLogicalMaxRight,
      LAppDefine.ViewLogicalMaxBottom,
      LAppDefine.ViewLogicalMaxTop
    );
  }

  /**
   * 释放资源
   */
  public release(): void {
    this._viewMatrix = null;
    this._touchManager = null;
    this._deviceToScreen = null;

    this._gear.release();
    this._gear = null;

    this._back.release();
    this._back = null;

    this._subdelegate.getGlManager().getGl().deleteProgram(this._programId);
    this._programId = null;
  }

  /**
   * 绘制。
   */
  public render(): void {
    this._subdelegate.getGlManager().getGl().useProgram(this._programId);

    if (this._back) {
      this._back.render(this._programId);
    }
    if (this._gear) {
      this._gear.render(this._programId);
    }

    this._subdelegate.getGlManager().getGl().flush();

    const lapplive2dmanager = this._subdelegate.getLive2DManager();
    if (lapplive2dmanager != null) {
      lapplive2dmanager.setViewMatrix(this._viewMatrix);

      lapplive2dmanager.onUpdate();
    }
  }

  /**
   * 初始化图像。
   */
  public initializeSprite(): void {
    const width: number = this._subdelegate.getCanvas().width;
    const height: number = this._subdelegate.getCanvas().height;
    const textureManager = this._subdelegate.getTextureManager();
    const resourcesPath = LAppDefine.ResourcesPath;

    let imageName = '';

    // 初始化背景图像
    imageName = LAppDefine.BackImageName;

    // 异步操作，创建回调函数
    const initBackGroundTexture = (textureInfo: TextureInfo): void => {
      const x: number = width * 0.5;
      const y: number = height * 0.5;

      const fwidth = textureInfo.width * 2.0;
      const fheight = height * 0.95;
      this._back = new LAppSprite(x, y, fwidth, fheight, textureInfo.id);
      this._back.setSubdelegate(this._subdelegate);
    };

    textureManager.createTextureFromPngFile(
      resourcesPath + imageName,
      false,
      initBackGroundTexture
    );

    // 初始化齿轮图像
    imageName = LAppDefine.GearImageName;
    const initGearTexture = (textureInfo: TextureInfo): void => {
      const x = width - textureInfo.width * 0.5;
      const y = height - textureInfo.height * 0.5;
      const fwidth = textureInfo.width;
      const fheight = textureInfo.height;
      this._gear = new LAppSprite(x, y, fwidth, fheight, textureInfo.id);
      this._gear.setSubdelegate(this._subdelegate);
    };

    textureManager.createTextureFromPngFile(
      resourcesPath + imageName,
      false,
      initGearTexture
    );

    // 创建着色器
    if (this._programId == null) {
      this._programId = this._subdelegate.createShader();
    }
  }

  /**
   * 触摸开始时调用。
   *
   * @param pointX 屏幕X坐标
   * @param pointY 屏幕Y坐标
   */
  public onTouchesBegan(pointX: number, pointY: number): void {
    this._touchManager.touchesBegan(
      pointX * window.devicePixelRatio,
      pointY * window.devicePixelRatio
    );
  }

  /**
   * 触摸时指针移动时调用。
   *
   * @param pointX 屏幕X坐标
   * @param pointY 屏幕Y坐标
   */
  public onTouchesMoved(pointX: number, pointY: number): void {
    const posX = pointX * window.devicePixelRatio;
    const posY = pointY * window.devicePixelRatio;

    const lapplive2dmanager = this._subdelegate.getLive2DManager();

    const viewX: number = this.transformViewX(this._touchManager.getX());
    const viewY: number = this.transformViewY(this._touchManager.getY());

    this._touchManager.touchesMoved(posX, posY);

    lapplive2dmanager.onDrag(viewX, viewY);
  }

  /**
   * 触摸结束时调用。
   *
   * @param pointX 屏幕X坐标
   * @param pointY 屏幕Y坐标
   */
  public onTouchesEnded(pointX: number, pointY: number): void {
    const posX = pointX * window.devicePixelRatio;
    const posY = pointY * window.devicePixelRatio;

    const lapplive2dmanager = this._subdelegate.getLive2DManager();

    // 触摸结束
    lapplive2dmanager.onDrag(0.0, 0.0);

    // 单击
    const x: number = this.transformViewX(posX);
    const y: number = this.transformViewY(posY);

    if (LAppDefine.DebugTouchLogEnable) {
      LAppPal.printMessage(`[APP]touchesEnded x: ${x} y: ${y}`);
    }
    lapplive2dmanager.onTap(x, y);

    // 检查是否点击了齿轮
    if (this._gear.isHit(posX, posY)) {
      lapplive2dmanager.nextScene();
    }
  }

  /**
   * 将X坐标转换为View坐标。
   *
   * @param deviceX 设备X坐标
   */
  public transformViewX(deviceX: number): number {
    console.log('transformViewX', deviceX);
    const screenX: number = this._deviceToScreen.transformX(deviceX); // 获取逻辑坐标转换后的坐标。
    console.log('transformViewX', screenX);
    return this._viewMatrix.invertTransformX(screenX); // 放大、缩小、移动后的值。
  }

  /**
   * 将Y坐标转换为View坐标。
   *
   * @param deviceY 设备Y坐标
   */
  public transformViewY(deviceY: number): number {
    console.log('transformViewY', deviceY);
    const screenY: number = this._deviceToScreen.transformY(deviceY); // 获取逻辑坐标转换后的坐标。
    console.log('transformViewY', screenY);
    return this._viewMatrix.invertTransformY(screenY);
  }

  /**
   * 将X坐标转换为Screen坐标。
   * @param deviceX 设备X坐标
   */
  public transformScreenX(deviceX: number): number {
    return this._deviceToScreen.transformX(deviceX);
  }

  /**
   * 将Y坐标转换为Screen坐标。
   *
   * @param deviceY 设备Y坐标
   */
  public transformScreenY(deviceY: number): number {
    return this._deviceToScreen.transformY(deviceY);
  }

  _touchManager: TouchManager; // 触摸管理器
  _deviceToScreen: CubismMatrix44; // 设备到屏幕的矩阵
  _viewMatrix: CubismViewMatrix; // 视图矩阵
  _programId: WebGLProgram; // 着色器ID
  _back: LAppSprite; // 背景图像
  _gear: LAppSprite; // 齿轮图像
  _changeModel: boolean; // 模型切换标志
  _isClick: boolean; // 点击中
  private _subdelegate: LAppSubdelegate;
}

/**
 * Copyright(c) Live2D Inc. All rights reserved.
 *
 * 使用此源代码受Live2D开源软件许可证的约束，
 * 该许可证可在https://www.live2d.com/eula/live2d-open-software-license-agreement_en.html找到。
 */

export class TouchManager {
  /**
   * 构造函数
   */
  constructor() {
    this._startX = 0.0;
    this._startY = 0.0;
    this._lastX = 0.0;
    this._lastY = 0.0;
    this._lastX1 = 0.0;
    this._lastY1 = 0.0;
    this._lastX2 = 0.0;
    this._lastY2 = 0.0;
    this._lastTouchDistance = 0.0;
    this._deltaX = 0.0;
    this._deltaY = 0.0;
    this._scale = 1.0;
    this._touchSingle = false;
    this._flipAvailable = false;
  }

  public getCenterX(): number {
    return this._lastX;
  }

  public getCenterY(): number {
    return this._lastY;
  }

  public getDeltaX(): number {
    return this._deltaX;
  }

  public getDeltaY(): number {
    return this._deltaY;
  }

  public getStartX(): number {
    return this._startX;
  }

  public getStartY(): number {
    return this._startY;
  }

  public getScale(): number {
    return this._scale;
  }

  public getX(): number {
    return this._lastX;
  }

  public getY(): number {
    return this._lastY;
  }

  public getX1(): number {
    return this._lastX1;
  }

  public getY1(): number {
    return this._lastY1;
  }

  public getX2(): number {
    return this._lastX2;
  }

  public getY2(): number {
    return this._lastY2;
  }

  public isSingleTouch(): boolean {
    return this._touchSingle;
  }

  public isFlickAvailable(): boolean {
    return this._flipAvailable;
  }

  public disableFlick(): void {
    this._flipAvailable = false;
  }

  /**
   * 触摸开始时事件
   * @param deviceX 触摸屏幕的x值
   * @param deviceY 触摸屏幕的y值
   */
  public touchesBegan(deviceX: number, deviceY: number): void {
    this._lastX = deviceX;
    this._lastY = deviceY;
    this._startX = deviceX;
    this._startY = deviceY;
    this._lastTouchDistance = -1.0;
    this._flipAvailable = true;
    this._touchSingle = true;
  }

  /**
   * 拖动时的事件
   * @param deviceX 触摸屏幕的x值
   * @param deviceY 触摸屏幕的y值
   */
  public touchesMoved(deviceX: number, deviceY: number): void {
    this._lastX = deviceX;
    this._lastY = deviceY;
    this._lastTouchDistance = -1.0;
    this._touchSingle = true;
  }

  /**
   * 测量滑动距离
   * @return 滑动距离
   */
  public getFlickDistance(): number {
    return this.calculateDistance(
      this._startX,
      this._startY,
      this._lastX,
      this._lastY
    );
  }

  /**
   * 计算点1到点2的距离
   *
   * @param x1 第一个触摸点的x值
   * @param y1 第一个触摸点的y值
   * @param x2 第二个触摸点的x值
   * @param y2 第二个触摸点的y值
   */
  public calculateDistance(
    x1: number,
    y1: number,
    x2: number,
    y2: number
  ): number {
    return Math.sqrt((x1 - x2) * (x1 - x2) + (y1 - y2) * (y1 - y2));
  }

  /**
   * 从两个值中计算移动量。
   * 如果方向不同则移动量为0。如果方向相同，则参考绝对值较小的值。
   *
   * @param v1 第一个移动量
   * @param v2 第二个移动量
   *
   * @return 较小的移动量
   */
  public calculateMovingAmount(v1: number, v2: number): number {
    if (v1 > 0.0 != v2 > 0.0) {
      return 0.0;
    }

    const sign: number = v1 > 0.0 ? 1.0 : -1.0;
    const absoluteValue1 = Math.abs(v1);
    const absoluteValue2 = Math.abs(v2);
    return (
      sign * (absoluteValue1 < absoluteValue2 ? absoluteValue1 : absoluteValue2)
    );
  }

  _startY: number; // 开始触摸时的x值
  _startX: number; // 开始触摸时的y值
  _lastX: number; // 单点触摸时的x值
  _lastY: number; // 单点触摸时的y值
  _lastX1: number; // 双点触摸时第一个点的x值
  _lastY1: number; // 双点触摸时第一个点的y值
  _lastX2: number; // 双点触摸时第二个点的x值
  _lastY2: number; // 双点触摸时第二个点的y值
  _lastTouchDistance: number; // 两指或更多指触摸时的手指距离
  _deltaX: number; // 从上次值到当前值的x移动距离
  _deltaY: number; // 从上次值到当前值的y移动距离
  _scale: number; // 此帧中乘以的放大比例。非放大操作时为1。
  _touchSingle: boolean; // 单点触摸时为true
  _flipAvailable: boolean; // 滑动是否有效
}

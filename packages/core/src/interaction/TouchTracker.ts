/**
 * 触摸追踪器
 * 纯数据类，追踪触摸坐标和手势状态
 * 原 TouchManager 重命名
 */
export class TouchTracker {
  private _startX = 0
  private _startY = 0
  private _lastX = 0
  private _lastY = 0
  private _lastX1 = 0
  private _lastY1 = 0
  private _lastX2 = 0
  private _lastY2 = 0
  private _lastTouchDistance = 0
  private _deltaX = 0
  private _deltaY = 0
  private _scale = 1.0
  private _touchSingle = false
  private _flickAvailable = false

  get centerX(): number {
    return this._lastX
  }

  get centerY(): number {
    return this._lastY
  }

  get deltaX(): number {
    return this._deltaX
  }

  get deltaY(): number {
    return this._deltaY
  }

  get startX(): number {
    return this._startX
  }

  get startY(): number {
    return this._startY
  }

  get scale(): number {
    return this._scale
  }

  get x(): number {
    return this._lastX
  }

  get y(): number {
    return this._lastY
  }

  get x1(): number {
    return this._lastX1
  }

  get y1(): number {
    return this._lastY1
  }

  get x2(): number {
    return this._lastX2
  }

  get y2(): number {
    return this._lastY2
  }

  get isSingleTouch(): boolean {
    return this._touchSingle
  }

  get isFlickAvailable(): boolean {
    return this._flickAvailable
  }

  disableFlick(): void {
    this._flickAvailable = false
  }

  touchesBegan(deviceX: number, deviceY: number): void {
    this._lastX = deviceX
    this._lastY = deviceY
    this._startX = deviceX
    this._startY = deviceY
    this._lastTouchDistance = -1.0
    this._flickAvailable = true
    this._touchSingle = true
  }

  touchesMoved(deviceX: number, deviceY: number): void {
    this._lastX = deviceX
    this._lastY = deviceY
    this._lastTouchDistance = -1.0
    this._touchSingle = true
  }

  getFlickDistance(): number {
    return this.calculateDistance(
      this._startX,
      this._startY,
      this._lastX,
      this._lastY,
    )
  }

  calculateDistance(x1: number, y1: number, x2: number, y2: number): number {
    return Math.sqrt((x1 - x2) * (x1 - x2) + (y1 - y2) * (y1 - y2))
  }

  calculateMovingAmount(v1: number, v2: number): number {
    if ((v1 > 0.0) !== (v2 > 0.0))
      return 0.0
    const sign = v1 > 0.0 ? 1.0 : -1.0
    const abs1 = Math.abs(v1)
    const abs2 = Math.abs(v2)
    return sign * (abs1 < abs2 ? abs1 : abs2)
  }
}

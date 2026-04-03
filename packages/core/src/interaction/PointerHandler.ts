import type { Live2DSpriteDragEvent, Viewport } from '../core/types'
import type { Live2DModel } from '../model/Live2DModel'
import type { ModelRenderer } from '../rendering/ModelRenderer'
import type { ViewTransform } from '../rendering/ViewTransform'
import { Config } from '../utils/config'

/**
 * 指针事件处理器
 * 管理 document 级别的 pointer 事件绑定和解绑
 * 替代原 Live2DSprite 中的事件监听逻辑
 */
export class PointerHandler {
  private static readonly DRAG_THRESHOLD_PX = 6

  private _viewTransform: ViewTransform
  private _modelRenderer: ModelRenderer
  private _getViewport: () => Viewport | null
  private _getCanvas: () => HTMLCanvasElement | null
  private _getResolution: () => number
  private _isDraggable: () => boolean
  private _moveSpriteBy: (deltaX: number, deltaY: number) => { x: number, y: number }
  private _getSpritePosition: () => { x: number, y: number }
  private _emitDragEvent: (
    eventName: 'dragStart' | 'dragMove' | 'dragEnd',
    payload: Live2DSpriteDragEvent,
  ) => void

  private _model: Live2DModel | null = null
  private _captured = false
  private _isDraggingSprite = false
  private _dragStartPoint: { x: number, y: number } | null = null
  private _lastDragPoint: { x: number, y: number } | null = null

  private _onBegan: (ev: PointerEvent) => void
  private _onMoved: (ev: PointerEvent) => void
  private _onEnded: (ev: PointerEvent) => void
  private _onCancel: (ev: PointerEvent) => void

  constructor(
    viewTransform: ViewTransform,
    modelRenderer: ModelRenderer,
    getViewport: () => Viewport | null,
    getCanvas: () => HTMLCanvasElement | null,
    getResolution: () => number,
    isDraggable: () => boolean,
    moveSpriteBy: (deltaX: number, deltaY: number) => { x: number, y: number },
    getSpritePosition: () => { x: number, y: number },
    emitDragEvent: (
      eventName: 'dragStart' | 'dragMove' | 'dragEnd',
      payload: Live2DSpriteDragEvent,
    ) => void,
  ) {
    this._viewTransform = viewTransform
    this._modelRenderer = modelRenderer
    this._getViewport = getViewport
    this._getCanvas = getCanvas
    this._getResolution = getResolution
    this._isDraggable = isDraggable
    this._moveSpriteBy = moveSpriteBy
    this._getSpritePosition = getSpritePosition
    this._emitDragEvent = emitDragEvent

    this._onBegan = this.onPointerBegan.bind(this)
    this._onMoved = this.onPointerMoved.bind(this)
    this._onEnded = this.onPointerEnded.bind(this)
    this._onCancel = this.onPointerCancel.bind(this)
  }

  setModel(model: Live2DModel): void {
    this._model = model
  }

  attach(): void {
    document.addEventListener('pointerdown', this._onBegan, { passive: true })
    document.addEventListener('pointermove', this._onMoved, { passive: true })
    document.addEventListener('pointerup', this._onEnded, { passive: true })
    document.addEventListener('pointercancel', this._onCancel, { passive: true })
  }

  detach(): void {
    document.removeEventListener('pointerdown', this._onBegan)
    document.removeEventListener('pointermove', this._onMoved)
    document.removeEventListener('pointerup', this._onEnded)
    document.removeEventListener('pointercancel', this._onCancel)
  }

  private onPointerBegan(ev: PointerEvent): void {
    const point = this.getCanvasPoint(ev)
    const viewport = this._getViewport()

    if (!point || !viewport || !this.isPointInViewport(point.x, point.y, viewport)) {
      this._captured = false
      this.resetDragState()
      return
    }

    if (this._isDraggable() && this._model) {
      const viewX = this._viewTransform.transformViewX(point.x)
      const viewY = this._viewTransform.transformViewY(point.y)

      if (!this._model.canStartDrag(viewX, viewY)) {
        this._captured = false
        this.resetDragState()
        return
      }
    }

    this._captured = true
    this._viewTransform.touchTracker.touchesBegan(point.x, point.y)
    this._dragStartPoint = point
    this._lastDragPoint = point
    this._isDraggingSprite = false
  }

  private onPointerMoved(ev: PointerEvent): void {
    if (!this._captured || !this._model)
      return

    const point = this.getCanvasPoint(ev)
    if (!point)
      return

    const tracker = this._viewTransform.touchTracker
    tracker.touchesMoved(point.x, point.y)

    if (this._isDraggable() && this._dragStartPoint && this._lastDragPoint) {
      if (!this._isDraggingSprite && this.hasExceededDragThreshold(point)) {
        this._isDraggingSprite = true
        this._emitDragEvent('dragStart', this.createDragEventPayload(0, 0))
      }

      if (this._isDraggingSprite) {
        const resolution = this._getResolution() || 1
        const deltaX = (point.x - this._lastDragPoint.x) / resolution
        const deltaY = (point.y - this._lastDragPoint.y) / resolution
        this._lastDragPoint = point

        if (deltaX !== 0 || deltaY !== 0) {
          const position = this._moveSpriteBy(deltaX, deltaY)
          this._emitDragEvent('dragMove', {
            x: position.x,
            y: position.y,
            deltaX,
            deltaY,
          })
        }

        this._modelRenderer.onDrag(this._model, 0.0, 0.0)
        return
      }
    }

    const viewX = this._viewTransform.transformViewX(tracker.x)
    const viewY = this._viewTransform.transformViewY(tracker.y)

    this._modelRenderer.onDrag(this._model, viewX, viewY)
  }

  private onPointerEnded(ev: PointerEvent): void {
    const wasDraggingSprite = this._isDraggingSprite
    this._captured = false
    if (!this._model) {
      this.resetDragState()
      return
    }

    const point = this.getCanvasPoint(ev)
    if (!point) {
      if (wasDraggingSprite) {
        this._emitDragEvent('dragEnd', this.createDragEventPayload(0, 0))
      }
      this.resetDragState()
      return
    }
    const viewport = this._getViewport()

    this._modelRenderer.onDrag(this._model, 0.0, 0.0)
    if (wasDraggingSprite) {
      this._emitDragEvent('dragEnd', this.createDragEventPayload(0, 0))
      this.resetDragState()
      return
    }

    this.resetDragState()
    if (!viewport || !this.isPointInViewport(point.x, point.y, viewport))
      return

    const x = this._viewTransform.transformViewX(point.x)
    const y = this._viewTransform.transformViewY(point.y)

    if (Config.DebugTouchLogEnable) {
      console.log(`[APP]touchesEnded x: ${x} y: ${y}`)
    }

    this._modelRenderer.onTap(this._model, x, y)
  }

  private onPointerCancel(_ev: PointerEvent): void {
    const wasDraggingSprite = this._isDraggingSprite
    this._captured = false
    if (this._model) {
      this._modelRenderer.onDrag(this._model, 0.0, 0.0)
    }
    if (wasDraggingSprite) {
      this._emitDragEvent('dragEnd', this.createDragEventPayload(0, 0))
    }
    this.resetDragState()
  }

  private getCanvasPoint(ev: PointerEvent): { x: number, y: number } | null {
    const canvas = this._getCanvas()
    if (!canvas)
      return null

    const rect = canvas.getBoundingClientRect()
    if (rect.width <= 0 || rect.height <= 0)
      return null

    return {
      x: (ev.clientX - rect.left) * (canvas.width / rect.width),
      y: (ev.clientY - rect.top) * (canvas.height / rect.height),
    }
  }

  private isPointInViewport(x: number, y: number, viewport: Viewport): boolean {
    return x >= viewport.x
      && x <= viewport.x + viewport.width
      && y >= viewport.y
      && y <= viewport.y + viewport.height
  }

  private hasExceededDragThreshold(point: { x: number, y: number }): boolean {
    if (!this._dragStartPoint)
      return false

    const resolution = this._getResolution() || 1
    const threshold = PointerHandler.DRAG_THRESHOLD_PX * resolution
    const deltaX = point.x - this._dragStartPoint.x
    const deltaY = point.y - this._dragStartPoint.y

    return (deltaX * deltaX + deltaY * deltaY) >= threshold * threshold
  }

  private createDragEventPayload(deltaX: number, deltaY: number): Live2DSpriteDragEvent {
    const position = this._getSpritePosition()
    return {
      x: position.x,
      y: position.y,
      deltaX,
      deltaY,
    }
  }

  private resetDragState(): void {
    this._isDraggingSprite = false
    this._dragStartPoint = null
    this._lastDragPoint = null
  }
}

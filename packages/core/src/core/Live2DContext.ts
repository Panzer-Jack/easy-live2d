import type { Viewport } from './types'
import { ViewTransform } from '../rendering/ViewTransform'
import { WebGLBackend } from '../rendering/WebGLBackend'
import { EventBus } from './EventBus'
import { TimeManager } from './TimeManager'

/**
 * Live2D 实例级上下文容器
 * 每个 Live2DSprite 持有一个独立的 Live2DContext
 * 替代原 ActionsManager 的"上帝对象"角色
 */
export class Live2DContext {
  readonly eventBus = new EventBus()
  readonly timeManager = new TimeManager()
  readonly webgl = new WebGLBackend()
  readonly viewTransform = new ViewTransform()

  canvas: HTMLCanvasElement | null = null
  frameBuffer: WebGLFramebuffer | null = null

  initialize(
    canvas: HTMLCanvasElement,
    viewport: Viewport,
    context?: WebGLRenderingContext | WebGL2RenderingContext | null,
  ): boolean {
    this.canvas = canvas

    if (!this.webgl.initialize(canvas, context)) {
      return false
    }

    this.webgl.setupBlend()
    this.frameBuffer = this.webgl.getFrameBuffer()
    this.viewTransform.initialize(viewport)

    return true
  }

  reinitializeView(viewport: Viewport): void {
    this.viewTransform.initialize(viewport)
  }

  dispose(): void {
    this.viewTransform.release()
    this.webgl.release()
    this.eventBus.clear()
    this.timeManager.reset()
    this.canvas = null
    this.frameBuffer = null
  }
}

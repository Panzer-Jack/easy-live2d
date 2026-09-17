/**
 * WebGL 后端
 * 管理 WebGL 上下文的获取和释放
 */
export class WebGLBackend {
  private _gl: WebGL2RenderingContext | null = null

  initialize(
    canvas: HTMLCanvasElement,
    context?: WebGLRenderingContext | WebGL2RenderingContext | null,
  ): boolean {
    const gl = context ?? canvas.getContext('webgl2')
    if (!gl || typeof (gl as WebGL2RenderingContext).blitFramebuffer !== 'function') {
      this._gl = null
      return false
    }
    this._gl = gl as WebGL2RenderingContext
    return true
  }

  getGl(): WebGL2RenderingContext {
    return this._gl!
  }

  getFrameBuffer(): WebGLFramebuffer | null {
    const gl = this._gl!
    return gl.getParameter(gl.FRAMEBUFFER_BINDING)
  }

  release(): void {
    this._gl = null
  }
}

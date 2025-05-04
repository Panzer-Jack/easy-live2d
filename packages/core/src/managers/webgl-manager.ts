/**
 * WebGL管理器
 */
class WebGLManager {
  public constructor() {
    this._gl = null
  }

  public initialize(canvas: HTMLCanvasElement): boolean {
    // 初始化gl上下文
    this._gl = canvas.getContext('webgl2')

    if (!this._gl) {
      this._gl = null
      // document.body.innerHTML =
      //   'This browser does not support the <code>&lt;canvas&gt;</code> element.';
      return false
    }
    return true
  }

  /**
   * 释放资源。
   */
  public release(): void { }

  public getGl(): WebGLRenderingContext | WebGL2RenderingContext {
    return this._gl
  }

  private _gl: WebGLRenderingContext | WebGL2RenderingContext = null
}

export {
  WebGLManager
}
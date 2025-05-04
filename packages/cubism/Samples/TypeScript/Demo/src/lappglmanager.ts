/**
 * Copyright(c) Live2D Inc. All rights reserved.
 *
 * 使用此源代码受Live2D开源软件许可证的约束，
 * 该许可证可在https://www.live2d.com/eula/live2d-open-software-license-agreement_en.html找到。
 */

/**
 * 在Cubism SDK示例中用于管理WebGL的类
 */
export class LAppGlManager {
  public constructor() {
    this._gl = null;
  }

  public initialize(canvas: HTMLCanvasElement): boolean {
    // 初始化gl上下文
    this._gl = canvas.getContext('webgl2');

    if (!this._gl) {
      // gl初始化失败
      alert('无法初始化WebGL。此浏览器不支持。');
      this._gl = null;
      // document.body.innerHTML =
      //   'This browser does not support the <code>&lt;canvas&gt;</code> element.';
      return false;
    }
    return true;
  }

  /**
   * 释放资源。
   */
  public release(): void {}

  public getGl(): WebGLRenderingContext | WebGL2RenderingContext {
    return this._gl;
  }

  private _gl: WebGLRenderingContext | WebGL2RenderingContext = null;
}

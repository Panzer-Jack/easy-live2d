import type { TimeManager } from '../core/TimeManager'
import type { Viewport } from '../core/types'
import type { Live2DModel } from '../model/Live2DModel'
import type { ViewTransform } from './ViewTransform'
import { CubismMatrix44 } from '@Framework/math/cubismmatrix44'
import { Config } from '../utils/config'

/**
 * 模型渲染编排
 * 负责投影矩阵计算和模型渲染调度
 * 合并原 Live2DManager.onUpdate 的渲染逻辑
 */
export class ModelRenderer {
  private _viewTransform: ViewTransform
  private _frameBuffer: WebGLFramebuffer | null = null
  private _gl: WebGLRenderingContext | WebGL2RenderingContext | null = null

  constructor(viewTransform: ViewTransform) {
    this._viewTransform = viewTransform
  }

  setFrameBuffer(frameBuffer: WebGLFramebuffer | null): void {
    this._frameBuffer = frameBuffer
  }

  setGl(gl: WebGLRenderingContext | WebGL2RenderingContext): void {
    this._gl = gl
  }

  render(model: Live2DModel, viewport: Viewport, timeManager: TimeManager): void {
    if (!model?.isReady)
      return
    if (viewport.width <= 0 || viewport.height <= 0)
      return

    timeManager.update()
    model.update(timeManager.deltaTime)

    const projection = new CubismMatrix44()
    const cubismModel = model.getModel()

    if (cubismModel) {
      if (viewport.width < viewport.height) {
        // 竖屏：压缩纵向，保持横向
        projection.scale(1.0, viewport.width / viewport.height)
      } else {
        // 横屏：压缩横向，保持纵向
        projection.scale(viewport.height / viewport.width, 1.0)
      }

      projection.multiplyByMatrix(this._viewTransform.viewMatrix)
    }

    const gl = this._gl
    if (gl) {
      this._saveGlState(gl)
      const glViewport = this._toGlViewport(gl, viewport)
      const scissorViewport = this._getScissorViewport(gl, glViewport)
      if (scissorViewport.width <= 0 || scissorViewport.height <= 0) {
        this._restoreGlState(gl)
        return
      }

      this._prepareFrame(gl, glViewport, scissorViewport)
      model.draw(projection, this._frameBuffer!, glViewport)
      this._restoreGlState(gl)
    } else {
      model.draw(projection, this._frameBuffer!, viewport)
    }
  }

  /** 保存 Live2D 渲染前的 GL 状态 */
  private _savedState: {
    viewport: Int32Array
    scissorBox: Int32Array
    clearColor: Float32Array
    clearDepth: number
    blend: boolean
    scissorTest: boolean
    depthTest: boolean
    cullFace: boolean
    frontFace: number
    depthFunc: number
    activeTexture: number
    currentProgram: WebGLProgram | null
    framebuffer: WebGLFramebuffer | null
    arrayBuffer: WebGLBuffer | null
    elementArrayBuffer: WebGLBuffer | null
    blendSrcRGB: number
    blendDstRGB: number
    blendSrcAlpha: number
    blendDstAlpha: number
    colorMask: boolean[]
  } | null = null

  private _saveGlState(gl: WebGLRenderingContext): void {
    this._savedState = {
      viewport: gl.getParameter(gl.VIEWPORT),
      scissorBox: gl.getParameter(gl.SCISSOR_BOX),
      clearColor: gl.getParameter(gl.COLOR_CLEAR_VALUE),
      clearDepth: gl.getParameter(gl.DEPTH_CLEAR_VALUE),
      blend: gl.isEnabled(gl.BLEND),
      scissorTest: gl.isEnabled(gl.SCISSOR_TEST),
      depthTest: gl.isEnabled(gl.DEPTH_TEST),
      cullFace: gl.isEnabled(gl.CULL_FACE),
      frontFace: gl.getParameter(gl.FRONT_FACE),
      depthFunc: gl.getParameter(gl.DEPTH_FUNC),
      activeTexture: gl.getParameter(gl.ACTIVE_TEXTURE),
      currentProgram: gl.getParameter(gl.CURRENT_PROGRAM),
      framebuffer: gl.getParameter(gl.FRAMEBUFFER_BINDING),
      arrayBuffer: gl.getParameter(gl.ARRAY_BUFFER_BINDING),
      elementArrayBuffer: gl.getParameter(gl.ELEMENT_ARRAY_BUFFER_BINDING),
      blendSrcRGB: gl.getParameter(gl.BLEND_SRC_RGB),
      blendDstRGB: gl.getParameter(gl.BLEND_DST_RGB),
      blendSrcAlpha: gl.getParameter(gl.BLEND_SRC_ALPHA),
      blendDstAlpha: gl.getParameter(gl.BLEND_DST_ALPHA),
      colorMask: gl.getParameter(gl.COLOR_WRITEMASK),
    }
  }

  private _restoreGlState(gl: WebGLRenderingContext): void {
    const s = this._savedState
    if (!s)
      return

    gl.viewport(s.viewport[0], s.viewport[1], s.viewport[2], s.viewport[3])
    gl.scissor(s.scissorBox[0], s.scissorBox[1], s.scissorBox[2], s.scissorBox[3])
    gl.clearColor(s.clearColor[0], s.clearColor[1], s.clearColor[2], s.clearColor[3])
    gl.clearDepth(s.clearDepth)
    gl.frontFace(s.frontFace)
    gl.depthFunc(s.depthFunc)

    s.blend ? gl.enable(gl.BLEND) : gl.disable(gl.BLEND)
    s.scissorTest ? gl.enable(gl.SCISSOR_TEST) : gl.disable(gl.SCISSOR_TEST)
    s.depthTest ? gl.enable(gl.DEPTH_TEST) : gl.disable(gl.DEPTH_TEST)
    s.cullFace ? gl.enable(gl.CULL_FACE) : gl.disable(gl.CULL_FACE)

    gl.blendFuncSeparate(s.blendSrcRGB, s.blendDstRGB, s.blendSrcAlpha, s.blendDstAlpha)
    gl.colorMask(s.colorMask[0], s.colorMask[1], s.colorMask[2], s.colorMask[3])
    gl.activeTexture(s.activeTexture)
    gl.useProgram(s.currentProgram)
    gl.bindFramebuffer(gl.FRAMEBUFFER, s.framebuffer)
    gl.bindBuffer(gl.ARRAY_BUFFER, s.arrayBuffer)
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, s.elementArrayBuffer)

    this._savedState = null
  }

  /**
   * 为当前 Live2D 视口准备 GL 状态。
   * 这里只清理 depth，避免擦除同一帧内其他 Pixi 内容。
   */
  private _prepareFrame(
    gl: WebGLRenderingContext,
    viewport: Viewport,
    scissorViewport: Viewport,
  ): void {
    gl.bindFramebuffer(gl.FRAMEBUFFER, this._frameBuffer)
    gl.viewport(viewport.x, viewport.y, viewport.width, viewport.height)
    gl.enable(gl.SCISSOR_TEST)
    gl.scissor(
      scissorViewport.x,
      scissorViewport.y,
      scissorViewport.width,
      scissorViewport.height,
    )
    gl.clearDepth(1.0)
    gl.enable(gl.DEPTH_TEST)
    gl.depthFunc(gl.LEQUAL)
    gl.clear(gl.DEPTH_BUFFER_BIT)
    gl.enable(gl.BLEND)
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)
  }

  private _toGlViewport(
    gl: WebGLRenderingContext | WebGL2RenderingContext,
    viewport: Viewport,
  ): Viewport {
    return {
      ...viewport,
      y: gl.drawingBufferHeight - viewport.y - viewport.height,
    }
  }

  private _getScissorViewport(
    gl: WebGLRenderingContext | WebGL2RenderingContext,
    viewport: Viewport,
  ): Viewport {
    const minX = Math.max(0, viewport.x)
    const minY = Math.max(0, viewport.y)
    const maxX = Math.min(gl.drawingBufferWidth, viewport.x + viewport.width)
    const maxY = Math.min(gl.drawingBufferHeight, viewport.y + viewport.height)

    return {
      x: minX,
      y: minY,
      width: Math.max(0, maxX - minX),
      height: Math.max(0, maxY - minY),
    }
  }

  /**
   * 处理拖拽（鼠标跟随）
   */
  onDrag(model: Live2DModel, x: number, y: number): void {
    if (model && Config.MouseFollow) {
      model.setDragging(x, y)
    }
  }

  /**
   * 处理点击
   */
  onTap(model: Live2DModel, x: number, y: number): void {
    if (!model)
      return
    model.hitTest(x, y)
  }
}

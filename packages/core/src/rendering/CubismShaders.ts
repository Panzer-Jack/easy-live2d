import { CubismShaderManager_WebGL, CubismShaderSet } from '@Framework/rendering/cubismshader_webgl'
import fragshadersrcalphablend from '../../../cubism/Framework/Shaders/WebGL/fragshadersrcalphablend.frag'
import fragshadersrccolorblend from '../../../cubism/Framework/Shaders/WebGL/fragshadersrccolorblend.frag'
import fragshadersrccopy from '../../../cubism/Framework/Shaders/WebGL/fragshadersrccopy.frag'
import fragshadersrcmaskinvertedpremultipliedalpha from '../../../cubism/Framework/Shaders/WebGL/fragshadersrcmaskinvertedpremultipliedalpha.frag'
import fragshadersrcmaskpremultipliedalpha from '../../../cubism/Framework/Shaders/WebGL/fragshadersrcmaskpremultipliedalpha.frag'
import fragshadersrcpremultipliedalpha from '../../../cubism/Framework/Shaders/WebGL/fragshadersrcpremultipliedalpha.frag'
import fragshadersrcpremultipliedalphablend from '../../../cubism/Framework/Shaders/WebGL/fragshadersrcpremultipliedalphablend.frag'
import fragshadersrcsetupmask from '../../../cubism/Framework/Shaders/WebGL/fragshadersrcsetupmask.frag'
import vertshadersrc from '../../../cubism/Framework/Shaders/WebGL/vertshadersrc.vert'
import vertshadersrcblend from '../../../cubism/Framework/Shaders/WebGL/vertshadersrcblend.vert'
import vertshadersrccopy from '../../../cubism/Framework/Shaders/WebGL/vertshadersrccopy.vert'
import vertshadersrcmasked from '../../../cubism/Framework/Shaders/WebGL/vertshadersrcmasked.vert'
import vertshadersrcsetupmask from '../../../cubism/Framework/Shaders/WebGL/vertshadersrcsetupmask.vert'

/** R5 官方着色器随包内置，避免运行时依赖部署目录或异步请求。 */
export function initializeCubismShaders(gl: WebGL2RenderingContext): void {
  const shader = CubismShaderManager_WebGL.getInstance().getShader(gl)
  if (shader._isShaderLoaded)
    return

  // 对应固定版本 R5 的 generateShaders 初始化步骤；不改动上游 SDK。
  Object.assign(shader, {
    _vertShaderSrc: vertshadersrc,
    _vertShaderSrcMasked: vertshadersrcmasked,
    _vertShaderSrcSetupMask: vertshadersrcsetupmask,
    _fragShaderSrcSetupMask: fragshadersrcsetupmask,
    _fragShaderSrcPremultipliedAlpha: fragshadersrcpremultipliedalpha,
    _fragShaderSrcMaskPremultipliedAlpha: fragshadersrcmaskpremultipliedalpha,
    _fragShaderSrcMaskInvertedPremultipliedAlpha: fragshadersrcmaskinvertedpremultipliedalpha,
    _vertShaderSrcCopy: vertshadersrccopy,
    _fragShaderSrcCopy: fragshadersrccopy,
    _fragShaderSrcColorBlend: fragshadersrccolorblend,
    _fragShaderSrcAlphaBlend: fragshadersrcalphablend,
    _vertShaderSrcBlend: vertshadersrcblend,
    _fragShaderSrcBlend: fragshadersrcpremultipliedalphablend,
  })
  shader._shaderSets = Array.from({ length: shader._shaderCount }, () => new CubismShaderSet())
  shader.registerShader()
  shader.registerBlendShader()
  // 部分槽位由上游保留；编译失败返回 0，未使用的槽位为 undefined。
  if (shader._shaderSets.some(set => set.shaderProgram !== undefined && !set.shaderProgram)) {
    shader.releaseShaderProgram()
    throw new Error('Failed to compile Cubism R5 shaders.')
  }
  shader._isShaderLoaded = true
}

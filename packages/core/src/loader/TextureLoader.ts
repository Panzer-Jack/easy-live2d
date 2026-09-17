import type { WebGLBackend } from '../rendering/WebGLBackend'
import { Config } from '../utils/config'

/**
 * 纹理信息
 */
export class TextureInfo {
  img: HTMLImageElement | null = null
  id: WebGLTexture = null!
  width = 0
  height = 0
  usePremultiply = false
  fileName = ''
}

/**
 * 纹理加载器
 * 负责 PNG 纹理的加载、WebGL 纹理创建和缓存管理
 */
export class TextureLoader {
  private _textures: TextureInfo[] = []
  private _webgl: WebGLBackend

  constructor(webgl: WebGLBackend) {
    this._webgl = webgl
  }

  async load(fileName: string, usePremultiply: boolean, signal?: AbortSignal): Promise<TextureInfo> {
    signal?.throwIfAborted()
    const findCached = () => this._textures.find(t => t.fileName === fileName && t.usePremultiply === usePremultiply)
    const cached = findCached()
    if (cached)
      return cached

    return new Promise((resolve, reject) => {
      const img = new Image()
      if (Config.crossOrigin !== undefined)
        img.crossOrigin = Config.crossOrigin
      function cleanup() {
        img.onload = null
        img.onerror = null
        signal?.removeEventListener('abort', abort)
      }
      function abort() {
        cleanup()
        img.src = ''
        reject(signal?.reason ?? new Error('Texture loading aborted.'))
      }
      img.onload = () => {
        cleanup()
        try {
          // 同一模型的重复纹理槽可能并发加载，只上传一次。
          resolve(findCached() ?? this.createGlTexture(img, fileName, usePremultiply))
        } catch (error) {
          reject(error)
        }
      }
      img.onerror = () => {
        cleanup()
        reject(new Error(`Failed to load texture: ${fileName}`))
      }
      signal?.addEventListener('abort', abort, { once: true })
      img.src = fileName
    })
  }

  private createGlTexture(img: HTMLImageElement, fileName: string, usePremultiply: boolean): TextureInfo {
    const gl = this._webgl.getGl()
    const binding = gl.getParameter(gl.TEXTURE_BINDING_2D)
    const premultiply = gl.getParameter(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL)
    const flipY = gl.getParameter(gl.UNPACK_FLIP_Y_WEBGL)
    const tex = gl.createTexture()
    if (!tex)
      throw new Error(`Failed to create texture: ${fileName}`)

    try {
      gl.bindTexture(gl.TEXTURE_2D, tex)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
      gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, usePremultiply ? 1 : 0)
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 0)
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img)
      gl.generateMipmap(gl.TEXTURE_2D)
    } catch (error) {
      gl.deleteTexture(tex)
      throw error
    } finally {
      gl.bindTexture(gl.TEXTURE_2D, binding)
      gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, premultiply ? 1 : 0)
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, flipY ? 1 : 0)
    }

    const info = new TextureInfo()
    Object.assign(info, { fileName, width: img.width, height: img.height, id: tex, img, usePremultiply })
    this._textures.push(info)
    return info
  }

  release(): void {
    const gl = this._webgl.getGl()
    for (const texture of this._textures)
      gl.deleteTexture(texture.id)
    this._textures = []
  }
}

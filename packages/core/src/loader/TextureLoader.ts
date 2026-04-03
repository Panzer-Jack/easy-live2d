import type { WebGLBackend } from '../rendering/WebGLBackend'

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

  createTextureFromPngFile(
    fileName: string,
    usePremultiply: boolean,
    callback: (textureInfo: TextureInfo) => void,
  ): void {
    // 搜索已加载的纹理缓存
    const cached = this._textures.find(
      t => t.fileName === fileName && t.usePremultiply === usePremultiply,
    )
    if (cached) {
      cached.img = new Image()
      cached.img.addEventListener('load', () => callback(cached), { passive: true })
      cached.img.src = fileName
      return
    }

    const img = new Image()
    img.addEventListener('load', () => {
      const textureInfo = this.createGlTexture(img, fileName, usePremultiply)
      callback(textureInfo)
    }, { passive: true })
    img.src = fileName
  }

  private createGlTexture(
    img: HTMLImageElement,
    fileName: string,
    usePremultiply: boolean,
  ): TextureInfo {
    const gl = this._webgl.getGl()
    const tex = gl.createTexture()!

    gl.bindTexture(gl.TEXTURE_2D, tex)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)

    if (usePremultiply) {
      gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, 1)
    }

    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img)
    gl.generateMipmap(gl.TEXTURE_2D)
    gl.bindTexture(gl.TEXTURE_2D, null)

    const textureInfo = new TextureInfo()
    textureInfo.fileName = fileName
    textureInfo.width = img.width
    textureInfo.height = img.height
    textureInfo.id = tex
    textureInfo.img = img
    textureInfo.usePremultiply = usePremultiply
    this._textures.push(textureInfo)

    return textureInfo
  }

  releaseTextures(): void {
    const gl = this._webgl.getGl()
    for (const tex of this._textures) {
      gl.deleteTexture(tex.id)
    }
    this._textures = []
  }

  releaseTextureByTexture(texture: WebGLTexture): void {
    const gl = this._webgl.getGl()
    const idx = this._textures.findIndex(t => t.id === texture)
    if (idx !== -1) {
      gl.deleteTexture(this._textures[idx].id)
      this._textures.splice(idx, 1)
    }
  }

  releaseTextureByFilePath(fileName: string): void {
    const gl = this._webgl.getGl()
    const idx = this._textures.findIndex(t => t.fileName === fileName)
    if (idx !== -1) {
      gl.deleteTexture(this._textures[idx].id)
      this._textures.splice(idx, 1)
    }
  }

  release(): void {
    this.releaseTextures()
  }
}

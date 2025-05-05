import type { iterator } from '@Framework/type/csmvector'
import type { WebGLManager } from './webgl-manager'
import { csmVector } from '@Framework/type/csmvector'

/**
 * 纹理管理器
 * 执行图像加载和管理的类。
 */
class TextureManager {
  /**
   * 构造函数
   */
  public constructor() {
    // eslint-disable-next-line new-cap
    this._textures = new csmVector<TextureInfo>()
  }

  /**
   * 释放资源。
   */
  public release(): void {
    for (
      let ite: iterator<TextureInfo> = this._textures.begin();
      ite.notEqual(this._textures.end());
      ite.preIncrement()
    ) {
      this._glManager.getGl().deleteTexture(ite.ptr().id)
    }
    this._textures = null
  }

  /**
   * 图像加载
   *
   * @param fileName 要加载的图像文件路径名
   * @param usePremultiply 是否启用预乘处理
   * @return 图像信息，加载失败时返回null
   */
  public createTextureFromPngFile(
    fileName: string,
    usePremultiply: boolean,
    callback: (textureInfo: TextureInfo) => void,
  ): void {
    // 搜索已加载的纹理
    for (
      let ite: iterator<TextureInfo> = this._textures.begin();
      ite.notEqual(this._textures.end());
      ite.preIncrement()
    ) {
      if (
        ite.ptr().fileName === fileName
        && ite.ptr().usePremultply === usePremultiply
      ) {
        // 第二次及以后将使用缓存(无等待时间)
        // 在WebKit中，要再次调用相同Image的onload，需要重新实例化
        // 详情：https://stackoverflow.com/a/5024181
        ite.ptr().img = new Image()
        ite
          .ptr()
          .img
          .addEventListener('load', (): void => callback(ite.ptr()), {
            passive: true,
          })
        ite.ptr().img.src = fileName
        return
      }
    }

    // 以数据加载为触发器
    const img = new Image()
    img.addEventListener(
      'load',
      (): void => {
        // 创建纹理对象
        const tex: WebGLTexture = this._glManager.getGl().createTexture()

        // 选择纹理
        this._glManager
          .getGl()
          .bindTexture(this._glManager.getGl().TEXTURE_2D, tex)

        // 设置纹理参数
        this._glManager
          .getGl()
          .texParameteri(
            this._glManager.getGl().TEXTURE_2D,
            this._glManager.getGl().TEXTURE_MIN_FILTER,
            this._glManager.getGl().LINEAR_MIPMAP_LINEAR,
          )
        this._glManager
          .getGl()
          .texParameteri(
            this._glManager.getGl().TEXTURE_2D,
            this._glManager.getGl().TEXTURE_MAG_FILTER,
            this._glManager.getGl().LINEAR,
          )

        // 执行预乘处理
        if (usePremultiply) {
          this._glManager
            .getGl()
            .pixelStorei(
              this._glManager.getGl().UNPACK_PREMULTIPLY_ALPHA_WEBGL,
              1,
            )
        }

        // 将像素写入纹理
        this._glManager
          .getGl()
          .texImage2D(
            this._glManager.getGl().TEXTURE_2D,
            0,
            this._glManager.getGl().RGBA,
            this._glManager.getGl().RGBA,
            this._glManager.getGl().UNSIGNED_BYTE,
            img,
          )

        // 生成多级纹理
        this._glManager
          .getGl()
          .generateMipmap(this._glManager.getGl().TEXTURE_2D)

        // 绑定纹理
        this._glManager
          .getGl()
          .bindTexture(this._glManager.getGl().TEXTURE_2D, null)

        const textureInfo: TextureInfo = new TextureInfo()
        if (textureInfo != null) {
          textureInfo.fileName = fileName
          textureInfo.width = img.width
          textureInfo.height = img.height
          textureInfo.id = tex
          textureInfo.img = img
          textureInfo.usePremultply = usePremultiply
          if (this._textures != null) {
            this._textures.pushBack(textureInfo)
          }
        }

        callback(textureInfo)
      },
      { passive: true },
    )
    img.src = fileName
  }

  /**
   * 释放图像
   *
   * 释放数组中存在的所有图像。
   */
  public releaseTextures(): void {
    for (let i = 0; i < this._textures.getSize(); i++) {
      this._glManager.getGl().deleteTexture(this._textures.at(i).id)
      this._textures.set(i, null)
    }

    this._textures.clear()
  }

  /**
   * 释放图像
   *
   * 释放指定纹理的图像。
   * @param texture 要释放的纹理
   */
  public releaseTextureByTexture(texture: WebGLTexture): void {
    for (let i = 0; i < this._textures.getSize(); i++) {
      if (this._textures.at(i).id !== texture) {
        continue
      }

      this._glManager.getGl().deleteTexture(this._textures.at(i).id)
      this._textures.set(i, null)
      this._textures.remove(i)
      break
    }
  }

  /**
   * 释放图像
   *
   * 释放指定名称的图像。
   * @param fileName 要释放的图像文件路径名
   */
  public releaseTextureByFilePath(fileName: string): void {
    for (let i = 0; i < this._textures.getSize(); i++) {
      if (this._textures.at(i).fileName === fileName) {
        this._glManager.getGl().deleteTexture(this._textures.at(i).id)
        this._textures.set(i, null)
        this._textures.remove(i)
        break
      }
    }
  }

  /**
   * setter
   * @param glManager
   */
  public setGlManager(glManager: WebGLManager): void {
    this._glManager = glManager
  }

  _textures: csmVector<TextureInfo>
  private _glManager: WebGLManager
}

/**
 * 图像信息结构体
 */
class TextureInfo {
  img: HTMLImageElement // 图像
  id: WebGLTexture = null // 纹理
  width = 0 // 宽度
  height = 0 // 高度
  usePremultply: boolean // 是否启用预乘处理
  fileName: string // 文件名
}

export {
  TextureInfo,
  TextureManager,
}

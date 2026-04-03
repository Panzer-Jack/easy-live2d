/**
 * 通用文件加载工具
 * 替代 ToolManager.loadFileAsBytes 的静态方法
 */
export class FileLoader {
  static async loadArrayBuffer(filePath: string): Promise<ArrayBuffer> {
    const response = await fetch(filePath)
    return response.arrayBuffer()
  }

  static async loadJson(filePath: string): Promise<any> {
    const response = await fetch(filePath)
    return response.json()
  }

  static loadArrayBufferCallback(
    filePath: string,
    callback: (arrayBuffer: ArrayBuffer, size: number) => void,
  ): void {
    fetch(filePath)
      .then(response => response.arrayBuffer())
      .then(arrayBuffer => callback(arrayBuffer, arrayBuffer.byteLength))
  }

  /**
   * 安全加载，失败时返回空 ArrayBuffer
   */
  static async fetchSafe(url: string): Promise<ArrayBuffer> {
    try {
      const response = await fetch(url)
      if (response.ok)
        return response.arrayBuffer()
      console.error(`Failed to load file: ${url}`)
    } catch (error) {
      console.error(`Failed to fetch: ${url}`, error)
    }
    return new ArrayBuffer(0)
  }
}

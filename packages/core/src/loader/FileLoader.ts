/** 加载配置中声明的资源；HTTP 错误和取消均由调用方处理。 */
export class FileLoader {
  static async loadArrayBuffer(filePath: string, signal?: AbortSignal): Promise<ArrayBuffer> {
    const response = await fetch(filePath, { signal })
    if (!response.ok)
      throw new Error(`Failed to load ${filePath}: HTTP ${response.status} ${response.statusText}`)
    return response.arrayBuffer()
  }
}

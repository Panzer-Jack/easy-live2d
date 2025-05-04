/**
 * 工具管理器
 * 抽象化平台依赖功能的Cubism平台抽象层。
 * 汇集文件读取和时间获取等依赖于平台的函数。
 */
class ToolManager {
  /**
   * 将文件读取为字节数据
   *
   * @param filePath 要读取的目标文件路径
   * @return
   * {
   *      buffer,   读取的字节数据
   *      size        文件大小
   * }
   */
  public static loadFileAsBytes(
    filePath: string,
    callback: (arrayBuffer: ArrayBuffer, size: number) => void,
  ): void {
    fetch(filePath)
      .then(response => response.arrayBuffer())
      .then(arrayBuffer => callback(arrayBuffer, arrayBuffer.byteLength))
  }

  /**
   * 获取增量时间（与前一帧的差异）
   * @return 增量时间[ms]
   */
  public static getDeltaTime(): number {
    return this.deltaTime
  }

  public static updateTime(): void {
    this.currentFrame = Date.now()
    this.deltaTime = (this.currentFrame - this.lastFrame) / 1000
    this.lastFrame = this.currentFrame
  }

  /**
   * 输出消息
   * @param message 字符串
   */
  public static printMessage(message: string): void {
    console.log(message)
  }

  static lastUpdate = Date.now()

  static currentFrame = 0.0
  static lastFrame = 0.0
  static deltaTime = 0.0
}

export {
  ToolManager,
}

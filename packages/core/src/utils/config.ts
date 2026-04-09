import { LogLevel } from '@Framework/live2dcubismframework'

export enum Priority {
  None = 0,
  Idle = 1,
  Normal = 2,
  Force = 3,
}

/**
 * 定义配置接口
 */
export interface ConfigType {
  // 视图
  ViewScale: number
  ViewMaxScale: number
  ViewMinScale: number
  ViewLogicalLeft: number
  ViewLogicalRight: number
  ViewLogicalBottom: number
  ViewLogicalTop: number
  ViewLogicalMaxLeft: number
  ViewLogicalMaxRight: number
  ViewLogicalMaxBottom: number
  ViewLogicalMaxTop: number

  // 模型定义
  MotionGroupIdle: string

  // MOC3一致性验证
  MOCConsistencyValidationEnable: boolean

  // 调试选项
  DebugLogEnable: boolean
  DebugTouchLogEnable: boolean
  CubismLoggingLevel: LogLevel

  // 鼠标跟随
  MouseFollow: boolean

  /**
   * 纹理图片跨域设置（crossOrigin）
   * 用于防止 WebGL 纹理上传时因跨域限制触发 SecurityError。
   * 设置为 "anonymous" 时，图片请求会携带 CORS 头但不含凭证；
   * 设置为 "use-credentials" 时，图片请求会携带凭证（Cookie 等）；
   * 设置为 undefined 时，不设置 crossOrigin（不推荐用于跨域场景）。
   *
   * 注意：服务器必须返回正确的 Access-Control-Allow-Origin 响应头，
   * 否则即使设置了 crossOrigin 也会导致加载失败。
   *
   * Texture image cross-origin setting.
   * Prevents `SecurityError` during WebGL `texImage2D` caused by tainted images.
   * - "anonymous": CORS request without credentials (suitable for most CDN scenarios)
   * - "use-credentials": CORS request with credentials (cookies, etc.)
   * - undefined: no crossOrigin attribute set (not recommended for cross-origin assets)
   *
   * The server must respond with a valid `Access-Control-Allow-Origin` header.
   */
  crossOrigin: string | undefined

  // 重制默认配置
  resetConfig: () => void
}

// 默认配置
const DefaultConfig: Omit<ConfigType, 'resetConfig'> = {
  // 视图
  ViewScale: 1.0,
  ViewMaxScale: 2.0,
  ViewMinScale: 0.8,
  ViewLogicalLeft: -1.0,
  ViewLogicalRight: 1.0,
  ViewLogicalBottom: -1.0,
  ViewLogicalTop: 1.0,
  ViewLogicalMaxLeft: -2.0,
  ViewLogicalMaxRight: 2.0,
  ViewLogicalMaxBottom: -2.0,
  ViewLogicalMaxTop: 2.0,

  // 模型定义
  MotionGroupIdle: 'Idle', // 空闲状态

  // MOC3一致性验证选项
  MOCConsistencyValidationEnable: true,

  // 调试日志显示选项
  DebugLogEnable: true,
  DebugTouchLogEnable: false,

  // 鼠标跟随
  MouseFollow: true,

  // 纹理图片跨域设置，默认 "anonymous" 以兼容常见 CDN 跨域场景
  crossOrigin: 'anonymous' as string | undefined,

  // 框架输出日志级别设置
  CubismLoggingLevel: LogLevel.LogLevel_Verbose,
}

// 导出可修改的配置对象
export const Config: ConfigType = {
  ...DefaultConfig,
  resetConfig: () => {
    Object.assign(Config, DefaultConfig)
  },
}

export {
  LogLevel,
}

import { CubismFramework, Option } from '@Framework/live2dcubismframework'
import { Config } from '../utils/config'

let modelUsers = 0

export function acquireCubism(): void {
  initializeCubism()
  modelUsers++
}

export function releaseCubism(): void {
  if (modelUsers === 0)
    return
  if (--modelUsers === 0)
    CubismFramework.dispose()
}

/** R5 的 JSON 解析器和模型共享 Framework 初始化，配置解析也必须在初始化之后。 */
export function initializeCubism(): void {
  if (typeof Live2DCubismCore === 'undefined'
    || Live2DCubismCore.MocVersion_53 === undefined) {
    throw new Error('easy-live2d requires Cubism 5 SDK for Web R5 Core. Load its live2dcubismcore.js before the library.')
  }
  if (CubismFramework.isInitialized())
    return
  const option = new Option()
  option.logFunction = Config.DebugLogEnable ? console.log : () => {}
  option.loggingLevel = Config.CubismLoggingLevel
  CubismFramework.startUp(option)
  CubismFramework.initialize()
}

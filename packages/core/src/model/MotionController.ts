import type { ICubismModelSetting } from '@Framework/icubismmodelsetting'
import type { CubismIdHandle } from '@Framework/id/cubismid'
import type {
  BeganMotionCallback,
  FinishedMotionCallback,
} from '@Framework/motion/acubismmotion'
import type { CubismMotion } from '@Framework/motion/cubismmotion'
import type { CubismMotionManager } from '@Framework/motion/cubismmotionmanager'
import type { CubismMotionQueueEntryHandle } from '@Framework/motion/cubismmotionqueuemanager'
import type { IRedirectPath } from '../utils/cubismSetting'
import { ACubismMotion } from '@Framework/motion/acubismmotion'
import {
  InvalidMotionQueueEntryHandleValue,
} from '@Framework/motion/cubismmotionqueuemanager'
import { FileLoader } from '../loader/FileLoader'
import { Config, Priority } from '../utils/config'

/**
 * 动作控制器
 * 负责动作的播放、随机播放、预加载和释放
 */
export class MotionController {
  private _motions = new Map<string, ACubismMotion | null>()
  private _loadAbort = new AbortController()
  private _motionManager: CubismMotionManager
  private _eyeBlinkIds: CubismIdHandle[]
  private _lipSyncIds: CubismIdHandle[]

  // 以下引用由 Live2DModel 注入
  private _loadMotionFn: (buf: ArrayBuffer, size: number, name: string, onFinished?: FinishedMotionCallback, onBegan?: BeganMotionCallback, setting?: ICubismModelSetting, group?: string, no?: number) => CubismMotion
  private _playVoiceFn: (voicePath: string, immediate: boolean) => Promise<void>

  private _modelSetting!: ICubismModelSetting
  private _modelHomeDir!: string
  private _redirPath: IRedirectPath = {
    Moc: '',
    Textures: [],
    Physics: '',
    Pose: '',
    Expressions: [],
    Motions: {},
    MotionSounds: {},
    UserData: '',
  }

  constructor(
    motionManager: CubismMotionManager,
    eyeBlinkIds: CubismIdHandle[],
    lipSyncIds: CubismIdHandle[],
    loadMotionFn: typeof MotionController.prototype._loadMotionFn,
    playVoiceFn: typeof MotionController.prototype._playVoiceFn,
  ) {
    this._motionManager = motionManager
    this._eyeBlinkIds = eyeBlinkIds
    this._lipSyncIds = lipSyncIds
    this._loadMotionFn = loadMotionFn
    this._playVoiceFn = playVoiceFn
  }

  setContext(setting: ICubismModelSetting, homeDir: string, redirPath: IRedirectPath): void {
    this._modelSetting = setting
    this._modelHomeDir = homeDir
    this._redirPath = redirPath
  }

  get motions(): Map<string, ACubismMotion | null> {
    return this._motions
  }

  async startMotion(
    group: string,
    no: number,
    priority: Priority,
    onFinished?: FinishedMotionCallback,
    onBegan?: BeganMotionCallback,
  ): Promise<CubismMotionQueueEntryHandle> {
    if (priority === Priority.Force) {
      this._motionManager.setReservePriority(priority)
    } else if (!this._motionManager.reserveMotion(priority)) {
      return InvalidMotionQueueEntryHandleValue
    }

    const name = `${group}_${no}`
    let motion = this._motions.get(name) as CubismMotion
    let autoDelete = false

    if (motion == null) {
      const fileName = this._modelSetting.getMotionFileName(group, no)
      const hasRedir = Object.keys(this._redirPath.Motions).length > 0
      const url = (hasRedir && this._redirPath.Motions[group]?.[no])
        || `${this._modelHomeDir}${fileName}`
      try {
        const buf = await FileLoader.loadArrayBuffer(url, this._loadAbort.signal)
        this._loadAbort.signal.throwIfAborted()
        motion = this._loadMotionFn(buf, buf.byteLength, name, onFinished, onBegan, this._modelSetting, group, no)
        if (!motion)
          throw new Error(`Could not load motion: ${name}`)
        motion.setEffectIds(this._eyeBlinkIds, this._lipSyncIds)
        autoDelete = true
      } catch (error) {
        // 失败的加载不能占住预约优先级，阻止后续正常动作。
        if (this._motionManager.getReservePriority() === priority)
          this._motionManager.setReservePriority(Priority.None)
        throw error
      }
    } else {
      motion.setBeganMotionHandler(onBegan)
      motion.setFinishedMotionHandler(onFinished)
    }

    if (Config.MotionSound) {
      const soundFileName = this._modelSetting.getMotionSoundFileName(group, no)
      if (soundFileName) {
        const soundUrl = this._redirPath.MotionSounds[group]?.[no]
          || `${this._modelHomeDir}${soundFileName}`
        if (Config.DebugLogEnable) {
          console.log(`[MotionController] Playing motion sound: ${soundUrl}`)
        }
        this._playVoiceFn(soundUrl, true).catch((err) => {
          console.warn(`[MotionController] Failed to play motion sound: ${soundFileName}`, err)
        })
      }
    }

    return this._motionManager.startMotionPriority(motion, autoDelete, priority)
  }

  /**
   * 检查模型配置中是否存在指定动作分组。
   * 避免直接调用 SDK 在缺失 Motions 节点时可能抛错的路径。
   */
  private _hasMotionGroup(group: string): boolean {
    if (!this._modelSetting)
      return false
    const count = this._modelSetting.getMotionGroupCount()
    for (let i = 0; i < count; i++) {
      if (this._modelSetting.getMotionGroupName(i) === group)
        return true
    }
    return false
  }

  startRandomMotion(
    group: string,
    priority: Priority,
    onFinished?: FinishedMotionCallback,
    onBegan?: BeganMotionCallback,
  ): Promise<CubismMotionQueueEntryHandle> {
    if (!this._hasMotionGroup(group))
      return Promise.resolve(InvalidMotionQueueEntryHandleValue)
    const count = this._modelSetting.getMotionCount(group)
    if (count === 0)
      return Promise.resolve(InvalidMotionQueueEntryHandleValue)
    const no = Math.floor(Math.random() * count)
    return this.startMotion(group, no, priority, onFinished, onBegan)
  }

  loadMotionData(
    group: string,
    no: number,
    buf: ArrayBuffer,
    setting: ICubismModelSetting,
  ): void {
    const name = `${group}_${no}`
    const motion = this._loadMotionFn(buf, buf.byteLength, name, undefined, undefined, setting, group, no) as CubismMotion
    if (motion) {
      motion.setEffectIds(this._eyeBlinkIds, this._lipSyncIds)
      const existing = this._motions.get(name)
      if (existing != null) {
        ACubismMotion.delete(existing)
      }
      this._motions.set(name, motion)
    }
  }

  releaseMotions(): void {
    this._motions.clear()
  }

  dispose(): void {
    this._loadAbort.abort()
    for (const motion of this._motions.values()) {
      if (motion)
        ACubismMotion.delete(motion)
    }
    this._motions.clear()
  }

  update(): boolean {
    return this._motionManager.isFinished()
  }
}

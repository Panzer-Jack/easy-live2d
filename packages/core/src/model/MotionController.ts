import type { ICubismModelSetting } from '@Framework/icubismmodelsetting'
import type { CubismIdHandle } from '@Framework/id/cubismid'
import type {
  BeganMotionCallback,
  FinishedMotionCallback,
} from '@Framework/motion/acubismmotion'
import type { CubismMotion } from '@Framework/motion/cubismmotion'
import type { CubismMotionManager } from '@Framework/motion/cubismmotionmanager'
import type { CubismMotionQueueEntryHandle } from '@Framework/motion/cubismmotionqueuemanager'
import type { csmVector } from '@Framework/type/csmvector'
import type { IRedirectPath } from '../utils/cubismSetting'
import { ACubismMotion } from '@Framework/motion/acubismmotion'
import {
  InvalidMotionQueueEntryHandleValue,
} from '@Framework/motion/cubismmotionqueuemanager'
import { csmMap as CsmMap } from '@Framework/type/csmmap'
import { FileLoader } from '../loader/FileLoader'
import { Config, Priority } from '../utils/config'

/**
 * 动作控制器
 * 负责动作的播放、随机播放、预加载和释放
 */
export class MotionController {
  private _motions = new CsmMap<string, ACubismMotion | null>()
  private _motionManager: CubismMotionManager
  private _eyeBlinkIds: csmVector<CubismIdHandle>
  private _lipSyncIds: csmVector<CubismIdHandle>

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
    eyeBlinkIds: csmVector<CubismIdHandle>,
    lipSyncIds: csmVector<CubismIdHandle>,
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

  get motions(): CsmMap<string, ACubismMotion | null> {
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
    let motion = this._motions.getValue(name) as CubismMotion
    let autoDelete = false

    if (motion === null) {
      const fileName = this._modelSetting.getMotionFileName(group, no)
      const hasRedir = Object.keys(this._redirPath.Motions).length > 0
      const url = (hasRedir && this._redirPath.Motions[group]?.[no])
        || `${this._modelHomeDir}${fileName}`
      const buf = await FileLoader.fetchSafe(url)

      motion = this._loadMotionFn(buf, buf.byteLength, name, onFinished, onBegan, this._modelSetting, group, no)
      if (motion) {
        motion.setEffectIds(this._eyeBlinkIds, this._lipSyncIds)
        autoDelete = true
      }
    } else {
      if (onBegan)
        motion.setBeganMotionHandler(onBegan)
      if (onFinished)
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

  startRandomMotion(
    group: string,
    priority: Priority,
    onFinished?: FinishedMotionCallback,
    onBegan?: BeganMotionCallback,
  ): Promise<CubismMotionQueueEntryHandle> {
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
      const existing = this._motions.getValue(name)
      if (existing !== null) {
        ACubismMotion.delete(existing)
      }
      this._motions.setValue(name, motion)
    }
  }

  releaseMotions(): void {
    this._motions.clear()
  }

  update(): boolean {
    return this._motionManager.isFinished()
  }
}

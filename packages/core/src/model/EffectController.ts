import type { ICubismModelSetting } from '@Framework/icubismmodelsetting'
import type { CubismIdHandle } from '@Framework/id/cubismid'
import { CubismDefaultParameterId } from '@Framework/cubismdefaultparameterid'
import {
  BreathParameterData,
  CubismBreath,
} from '@Framework/effect/cubismbreath'
import { CubismEyeBlink } from '@Framework/effect/cubismeyeblink'
import { CubismFramework } from '@Framework/live2dcubismframework'
import { csmVector as CsmVector } from '@Framework/type/csmvector'
import { sound } from '@pixi/sound'
import { SoundLoader } from '../loader/SoundLoader'

/**
 * 效果控制器
 * 管理眨眼、呼吸、唇形同步、拖拽跟随
 */
export class EffectController {
  private _eyeBlink: CubismEyeBlink | null = null
  private _breath: CubismBreath | null = null
  private _eyeBlinkIds = new CsmVector<CubismIdHandle>()
  private _lipSyncIds = new CsmVector<CubismIdHandle>()
  private _soundLoader = new SoundLoader()

  // 拖拽相关参数 ID
  private _idParamAngleX: CubismIdHandle
  private _idParamAngleY: CubismIdHandle
  private _idParamAngleZ: CubismIdHandle
  private _idParamEyeBallX: CubismIdHandle
  private _idParamEyeBallY: CubismIdHandle
  private _idParamBodyAngleX: CubismIdHandle

  get eyeBlinkIds(): CsmVector<CubismIdHandle> {
    return this._eyeBlinkIds
  }

  get lipSyncIds(): CsmVector<CubismIdHandle> {
    return this._lipSyncIds
  }

  get soundLoader(): SoundLoader {
    return this._soundLoader
  }

  constructor() {
    const idMgr = CubismFramework.getIdManager()
    this._idParamAngleX = idMgr.getId(CubismDefaultParameterId.ParamAngleX)
    this._idParamAngleY = idMgr.getId(CubismDefaultParameterId.ParamAngleY)
    this._idParamAngleZ = idMgr.getId(CubismDefaultParameterId.ParamAngleZ)
    this._idParamEyeBallX = idMgr.getId(CubismDefaultParameterId.ParamEyeBallX)
    this._idParamEyeBallY = idMgr.getId(CubismDefaultParameterId.ParamEyeBallY)
    this._idParamBodyAngleX = idMgr.getId(CubismDefaultParameterId.ParamBodyAngleX)
  }

  setupEyeBlink(setting: ICubismModelSetting): void {
    if (setting.getEyeBlinkParameterCount() > 0) {
      this._eyeBlink = CubismEyeBlink.create(setting)
    }
    for (let i = 0; i < setting.getEyeBlinkParameterCount(); i++) {
      this._eyeBlinkIds.pushBack(setting.getEyeBlinkParameterId(i))
    }
  }

  setupBreath(): void {
    this._breath = CubismBreath.create()
    const params: CsmVector<BreathParameterData> = new CsmVector()
    const idMgr = CubismFramework.getIdManager()
    params.pushBack(new BreathParameterData(idMgr.getId(CubismDefaultParameterId.ParamAngleX), 0.0, 15.0, 6.5345, 0.5))
    params.pushBack(new BreathParameterData(idMgr.getId(CubismDefaultParameterId.ParamAngleY), 0.0, 8.0, 3.5345, 0.5))
    params.pushBack(new BreathParameterData(idMgr.getId(CubismDefaultParameterId.ParamAngleZ), 0.0, 10.0, 5.5345, 0.5))
    params.pushBack(new BreathParameterData(idMgr.getId(CubismDefaultParameterId.ParamBodyAngleX), 0.0, 4.0, 15.5345, 0.5))
    params.pushBack(new BreathParameterData(CubismFramework.getIdManager().getId(CubismDefaultParameterId.ParamBreath), 0.5, 0.5, 3.2345, 0.5))
    this._breath.setParameters(params)
  }

  setupLipSyncIds(setting: ICubismModelSetting): void {
    for (let i = 0; i < setting.getLipSyncParameterCount(); i++) {
      this._lipSyncIds.pushBack(setting.getLipSyncParameterId(i))
    }
  }

  updateEffects(
    model: any,
    deltaTime: number,
    motionUpdated: boolean,
    dragX: number,
    dragY: number,
    lipsync: boolean,
  ): void {
    // 眨眼
    if (!motionUpdated && this._eyeBlink) {
      this._eyeBlink.updateParameters(model, deltaTime)
    }

    // 拖拽跟随
    model.addParameterValueById(this._idParamAngleX, dragX * 30)
    model.addParameterValueById(this._idParamAngleY, dragY * 30)
    model.addParameterValueById(this._idParamAngleZ, dragX * dragY * -30)
    model.addParameterValueById(this._idParamBodyAngleX, dragX * 10)
    model.addParameterValueById(this._idParamEyeBallX, dragX)
    model.addParameterValueById(this._idParamEyeBallY, dragY)

    // 呼吸
    if (this._breath) {
      this._breath.updateParameters(model, deltaTime)
    }

    // 唇形同步
    if (lipsync) {
      this._soundLoader.update(deltaTime)
      const value = this._soundLoader.getRms()
      for (let i = 0; i < this._lipSyncIds.getSize(); i++) {
        model.addParameterValueById(this._lipSyncIds.at(i), value, 3)
      }
    }
  }

  async playVoice(voicePath: string, immediate: boolean): Promise<void> {
    if (!voicePath)
      return
    if (immediate)
      this.stopVoice()
    sound.add('voice', voicePath)
    this._soundLoader.start(voicePath)
    await sound.play('voice')
  }

  stopVoice(): void {
    if (sound.exists('voice')) {
      sound.stop('voice')
      sound.remove('voice')
      this._soundLoader.releasePcmData()
    }
  }
}

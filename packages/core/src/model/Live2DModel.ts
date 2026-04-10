import type { ICubismModelSetting } from '@Framework/icubismmodelsetting'
import type { CubismMatrix44 } from '@Framework/math/cubismmatrix44'
import type { EventBus } from '../core/EventBus'
import type { ExpressionInfo, MotionInfo, ParameterValueRange, Viewport } from '../core/types'
import type { IRedirectPath } from '../utils/cubismSetting'
import { CubismFramework } from '@Framework/live2dcubismframework'
import { CubismUserModel } from '@Framework/model/cubismusermodel'
import { csmMap as CsmMap } from '@Framework/type/csmmap'
import { sound } from '@pixi/sound'
import { Config, Priority } from '../utils/config'
import { EffectController } from './EffectController'
import { ExpressionController } from './ExpressionController'
import { HitTestHelper } from './HitTestHelper'
import { MotionController } from './MotionController'

const EMPTY_REDIR_PATH: IRedirectPath = {
  Moc: '',
  Textures: [],
  Physics: '',
  Pose: '',
  Expressions: [],
  Motions: {},
  MotionSounds: {},
  UserData: '',
}

/**
 * Live2D 模型包装
 * 继承 CubismUserModel，持有模型数据，委托给各 Controller
 */
export class Live2DModel extends CubismUserModel {
  private _modelSettingRef!: ICubismModelSetting
  private _modelHomeDir = ''
  private _redirPath: IRedirectPath = EMPTY_REDIR_PATH
  private _userTimeSeconds = 0
  private _ready = false

  readonly motionCtrl: MotionController
  readonly expressionCtrl: ExpressionController
  readonly effectCtrl: EffectController
  readonly hitTestHelper: HitTestHelper

  constructor(eventBus: EventBus) {
    super()
    sound.disableAutoPause = true

    this.effectCtrl = new EffectController()
    this.motionCtrl = new MotionController(
      this._motionManager,
      this.effectCtrl.eyeBlinkIds,
      this.effectCtrl.lipSyncIds,
      this.loadMotion.bind(this),
      this.effectCtrl.playVoice.bind(this.effectCtrl),
    )
    this.expressionCtrl = new ExpressionController(
      this._expressionManager,
      this.loadExpression.bind(this),
    )
    this.hitTestHelper = new HitTestHelper(eventBus)

    if (Config.MOCConsistencyValidationEnable) {
      this._mocConsistency = true
    }
  }

  get modelSetting(): ICubismModelSetting {
    return this._modelSettingRef
  }

  get isReady(): boolean {
    return this._ready
  }

  setModelSetting(setting: ICubismModelSetting, homeDir: string, redirPath: IRedirectPath): void {
    this._modelSettingRef = setting
    this._modelHomeDir = homeDir
    this._redirPath = redirPath
    this.motionCtrl.setContext(setting, homeDir, redirPath)
  }

  loadMocModel(buf: ArrayBuffer): void {
    this.loadModel(buf, this._mocConsistency)
  }

  loadExpressionData(name: string, buf: ArrayBuffer): void {
    this.expressionCtrl.loadExpressionData(name, buf)
  }

  loadPhysicsData(buf: ArrayBuffer): void {
    this.loadPhysics(buf, buf.byteLength)
  }

  loadPoseData(buf: ArrayBuffer): void {
    this.loadPose(buf, buf.byteLength)
  }

  loadUserDataData(buf: ArrayBuffer): void {
    this.loadUserData(buf, buf.byteLength)
  }

  loadMotionData(group: string, no: number, buf: ArrayBuffer, setting: ICubismModelSetting): void {
    this.motionCtrl.loadMotionData(group, no, buf, setting)
  }

  setupEffects(setting: ICubismModelSetting): void {
    this.effectCtrl.setupEyeBlink(setting)
    this.effectCtrl.setupBreath()
    this.effectCtrl.setupLipSyncIds(setting)
  }

  setupLayout(setting: ICubismModelSetting): void {
    const layout = new CsmMap<string, number>()
    if (setting.getLayoutMap(layout)) {
      this.getModelMatrix().setupFromLayout(layout)
    }
  }

  finalizeMotionSetup(): void {
    this._motionManager.stopAllMotions()
    this._updating = false
    this._initialized = false
  }

  initializeRenderer(gl: WebGLRenderingContext | WebGL2RenderingContext): void {
    this.createRenderer()
    this.getRenderer().startUp(gl)
    this.getRenderer().setIsPremultipliedAlpha(true)
  }

  bindTexture(index: number, textureId: WebGLTexture): void {
    this.getRenderer().bindTexture(index, textureId)
  }

  setReady(value: boolean): void {
    this._ready = value
    this._initialized = value
  }

  update(deltaTime: number): void {
    if (!this._ready)
      return
    this._userTimeSeconds += deltaTime

    this._dragManager.update(deltaTime)
    const dragX = this._dragManager.getX()
    const dragY = this._dragManager.getY()

    this._model.loadParameters()
    const motionFinished = this.motionCtrl.update()
    if (motionFinished) {
      this.motionCtrl.startRandomMotion(Config.MotionGroupIdle, Priority.Idle)
    } else {
      this._motionManager.updateMotion(this._model, deltaTime)
    }
    this._model.saveParameters()

    // 表情更新
    this._expressionManager.updateMotion(this._model, deltaTime)

    this.effectCtrl.updateEffects(
      this._model,
      deltaTime,
      !motionFinished,
      dragX,
      dragY,
      this._lipsync,
    )

    if (this._pose)
      this._pose.updateParameters(this._model, deltaTime)
    if (this._physics)
      this._physics.evaluate(this._model, deltaTime)

    this._model.update()
  }

  draw(matrix: CubismMatrix44, frameBuffer: WebGLFramebuffer, viewport: Viewport): void {
    if (!this._model || !this._ready)
      return
    matrix.multiplyByMatrix(this._modelMatrix)
    this.getRenderer().setMvpMatrix(matrix)
    this.getRenderer().setRenderState(frameBuffer, [viewport.x, viewport.y, viewport.width, viewport.height])
    this.getRenderer().drawModel()
  }

  hitTest(x: number, y: number): boolean {
    return this.hitTestHelper.test(
      this._modelSettingRef,
      this._opacity,
      this.isHit.bind(this),
      x,
      y,
    )
  }

  canStartDrag(x: number, y: number): boolean {
    if (!this._modelSettingRef)
      return false

    if (this._modelSettingRef.getHitAreasCount() <= 0)
      return true

    return this.hitTestHelper.hasHit(
      this._modelSettingRef,
      this._opacity,
      this.isHit.bind(this),
      x,
      y,
    )
  }

  getMotionInfos(): MotionInfo[] {
    const setting = this._modelSettingRef
    if (!setting)
      return []

    const result: MotionInfo[] = []
    const groupCount = setting.getMotionGroupCount()
    for (let i = 0; i < groupCount; i++) {
      const group = setting.getMotionGroupName(i)
      const count = setting.getMotionCount(group)
      for (let no = 0; no < count; no++) {
        result.push({ group, no, name: `${group}_${no}` })
      }
    }
    return result
  }

  getExpressionInfos(): ExpressionInfo[] {
    const setting = this._modelSettingRef
    if (!setting)
      return []

    const result: ExpressionInfo[] = []
    const count = setting.getExpressionCount()
    for (let i = 0; i < count; i++) {
      result.push({ name: setting.getExpressionName(i) })
    }
    return result
  }

  setParameterValueById(id: string, value: number, weight?: number): void {
    if (!this._model)
      return
    const handle = CubismFramework.getIdManager().getId(id)
    this._model.setParameterValueById(handle, value, weight)
  }

  setParameterValueByIndex(index: number, value: number, weight?: number): void {
    if (!this._model)
      return
    this._model.setParameterValueByIndex(index, value, weight)
  }

  getParameterValueRangeById(id: string): ParameterValueRange | null {
    if (!this._model)
      return null
    const handle = CubismFramework.getIdManager().getId(id)
    const index = this._model.getParameterIndex(handle)
    if (index < 0 || index >= this._model.getParameterCount())
      return null
    return {
      min: this._model.getParameterMinimumValue(index),
      max: this._model.getParameterMaximumValue(index),
    }
  }

  getParameterValueRangeByIndex(index: number): ParameterValueRange | null {
    if (!this._model)
      return null
    if (index < 0 || index >= this._model.getParameterCount())
      return null
    return {
      min: this._model.getParameterMinimumValue(index),
      max: this._model.getParameterMaximumValue(index),
    }
  }
}

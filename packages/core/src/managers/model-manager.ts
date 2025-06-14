/* eslint-disable no-new */
/* eslint-disable new-cap */
import type { ICubismModelSetting } from '@Framework/icubismmodelsetting'
import type { CubismIdHandle } from '@Framework/id/cubismid'
import type { CubismMatrix44 } from '@Framework/math/cubismmatrix44'
import type {
  BeganMotionCallback,
  FinishedMotionCallback,
} from '@Framework/motion/acubismmotion'
import type { CubismSetting, IRedirectPath } from '../utils/cubsmSetting'
import type { CubismMotion } from '@Framework/motion/cubismmotion'
import type { CubismMotionQueueEntryHandle } from '@Framework/motion/cubismmotionqueuemanager'
import type { csmRect } from '@Framework/type/csmrectf'
import type { csmString } from '@Framework/type/csmstring'
import type { ActionsManager } from './actions-manager'
import type { TextureInfo } from './texture-manager'
import { CubismDefaultParameterId } from '@Framework/cubismdefaultparameterid'
import { CubismModelSettingJson } from '@Framework/cubismmodelsettingjson'
import {
  BreathParameterData,
  CubismBreath,
} from '@Framework/effect/cubismbreath'
import { CubismEyeBlink } from '@Framework/effect/cubismeyeblink'
import { CubismFramework } from '@Framework/live2dcubismframework'
import { CubismMoc } from '@Framework/model/cubismmoc'
import { CubismUserModel } from '@Framework/model/cubismusermodel'
import { ACubismMotion } from '@Framework/motion/acubismmotion'
import { InvalidMotionQueueEntryHandleValue } from '@Framework/motion/cubismmotionqueuemanager'
import { csmMap } from '@Framework/type/csmmap'
import { csmVector } from '@Framework/type/csmvector'
import {
  CSM_ASSERT,
  CubismLogError,
  CubismLogInfo,
} from '@Framework/utils/cubismdebug'
import { Config, Priority } from '../utils/config'
import { SoundManager } from './sound-manager'
import { ToolManager } from './tool-manager'
import { eventManager, EventManager } from './event-manager'
import { sound } from '@pixi/sound'


enum LoadStep {
  LoadAssets,
  LoadModel,
  WaitLoadModel,
  LoadExpression,
  WaitLoadExpression,
  LoadPhysics,
  WaitLoadPhysics,
  LoadPose,
  WaitLoadPose,
  SetupEyeBlink,
  SetupBreath,
  LoadUserData,
  WaitLoadUserData,
  SetupEyeBlinkIds,
  SetupLipSyncIds,
  SetupLayout,
  LoadMotion,
  WaitLoadMotion,
  CompleteInitialize,
  CompleteSetupModel,
  LoadTexture,
  WaitLoadTexture,
  CompleteSetup,
}

export type TModelAssets = CubismSetting | string

/**
 * 用户实际使用的模型实现类
 * 负责模型生成、功能组件生成、更新处理和渲染调用。
 */
export class ModelManager extends CubismUserModel {
  /**
   * @param modelAssets 模型数据来源，可以是ICubismModelSetting实例或模型文件路径
   */
  public async loadAssets(modelAssets: TModelAssets) {
    let setting: ICubismModelSetting
    try {
      if (typeof modelAssets === 'string') {
        this._modelHomeDir = modelAssets.slice(0, modelAssets.lastIndexOf('/')) + '/'
        const response = await fetch(modelAssets)
        const arrayBuffer = await response.arrayBuffer()
        setting = new CubismModelSettingJson(
          arrayBuffer,
          arrayBuffer.byteLength,
        )
      } else {
        // 如果是ICubismModelSetting实例
        setting = modelAssets
        this._modelHomeDir = modelAssets.prefixPath
        this._redirPath = modelAssets.redirPath
      }
      // 更新状态
      this._state = LoadStep.LoadModel
      // 保存结果
      await this.setupModel(setting)
    } catch (error) {
      // 在model3.json读取发生错误时无法进行绘制，因此不进行setup，直接捕获错误不做任何处理
      CubismLogError(
        `Failed to load file ${modelAssets}`,
        error,
      )
    }
  }

  private async modelSettingOnload() {
    // 表情
    const loadCubismExpression = async () => {
      if (this._modelSetting.getExpressionCount() > 0) {
        const count: number = this._modelSetting.getExpressionCount()

        for (let i = 0; i < count; i++) {
          const expressionName = this._modelSetting.getExpressionName(i)
          const expressionFileName
            = this._modelSetting.getExpressionFileName(i)
          this._state = LoadStep.WaitLoadExpression

          try {
            let response: Response
            const redirectPathExpressions = this._redirPath.Expressions
            if (redirectPathExpressions.length > 0) {
              response = await fetch(redirectPathExpressions[i])
            } else {
              response = await fetch(`${this._modelHomeDir}${expressionFileName}`)
            }

            let arrayBuffer: ArrayBuffer
            if (response.ok) {
              arrayBuffer = await response.arrayBuffer()
            } else if (response.status >= 400) {
              new CubismLogError(
                `Failed to load file ${this._modelHomeDir}${expressionFileName}`,
              )
              // 即使文件不存在，response也不会返回null，因此使用空的ArrayBuffer处理
              arrayBuffer = new ArrayBuffer(0)
            }

            const motion: ACubismMotion = this.loadExpression(
              arrayBuffer,
              arrayBuffer.byteLength,
              expressionName,
            )

            if (this._expressions.getValue(expressionName) !== null) {
              ACubismMotion.delete(
                this._expressions.getValue(expressionName),
              )
              this._expressions.setValue(expressionName, null)
            }
            this._expressions.setValue(expressionName, motion)
            this._expressionCount++
            if (this._expressionCount >= count) {
              this._state = LoadStep.LoadPhysics
            }
          } catch (error) {
            console.error(error)
          }
        }
      } else {
        this._state = LoadStep.LoadPhysics
      }
    }

    // 物理
    const loadCubismPhysics = async () => {
      if (this._modelSetting.getPhysicsFileName() !== '') {
        const physicsFileName = this._modelSetting.getPhysicsFileName()
        this._state = LoadStep.WaitLoadPhysics

        let response: Response
        const redirectPath = this._redirPath.Physics
        if (redirectPath) {
          response = await fetch(redirectPath)
        } else {
          response = await fetch(`${this._modelHomeDir}${physicsFileName}`)
        }

        let arrayBuffer: ArrayBuffer
        if (response.ok) {
          arrayBuffer = await response.arrayBuffer()
        } else if (response.status >= 400) {
          new CubismLogError(
            `Failed to load file ${this._modelHomeDir}${physicsFileName}`,
          )
          arrayBuffer = new ArrayBuffer(0)
        }

        this.loadPhysics(arrayBuffer, arrayBuffer.byteLength)
        this._state = LoadStep.LoadPose
      } else {
        this._state = LoadStep.LoadPose
      }
    }

    // 姿势
    const loadCubismPose = async () => {
      if (this._modelSetting.getPoseFileName() !== '') {
        const poseFileName = this._modelSetting.getPoseFileName()
        this._state = LoadStep.WaitLoadPose

        let response: Response
        const redirectPath = this._redirPath.Pose
        if (redirectPath) {
          response = await fetch(redirectPath)
        } else {
          response = await fetch(`${this._modelHomeDir}${poseFileName}`)
        }
        let arrayBuffer: ArrayBuffer
        if (response.ok) {
          arrayBuffer = await response.arrayBuffer()
        } else if (response.status >= 400) {
          CubismLogError(
            `Failed to load file ${this._modelHomeDir}${poseFileName}`,
          )
          arrayBuffer = new ArrayBuffer(0)
        }

        this.loadPose(arrayBuffer, arrayBuffer.byteLength)
        this._state = LoadStep.SetupEyeBlink
      } else {
        this._state = LoadStep.SetupEyeBlink
      }
    }

    // 眨眼
    const setupEyeBlink = async () => {
      if (this._modelSetting.getEyeBlinkParameterCount() > 0) {
        this._eyeBlink = CubismEyeBlink.create(this._modelSetting)
        this._state = LoadStep.SetupBreath
      }
    }

    // 呼吸
    const setupBreath = async () => {
      this._breath = CubismBreath.create()

      const breathParameters: csmVector<BreathParameterData> = new csmVector()
      breathParameters.pushBack(
        new BreathParameterData(this._idParamAngleX, 0.0, 15.0, 6.5345, 0.5),
      )
      breathParameters.pushBack(
        new BreathParameterData(this._idParamAngleY, 0.0, 8.0, 3.5345, 0.5),
      )
      breathParameters.pushBack(
        new BreathParameterData(this._idParamAngleZ, 0.0, 10.0, 5.5345, 0.5),
      )
      breathParameters.pushBack(
        new BreathParameterData(this._idParamBodyAngleX, 0.0, 4.0, 15.5345, 0.5),
      )
      breathParameters.pushBack(
        new BreathParameterData(
          CubismFramework.getIdManager().getId(
            CubismDefaultParameterId.ParamBreath,
          ),
          0.5,
          0.5,
          3.2345,
          1,
        ),
      )

      this._breath.setParameters(breathParameters)
      this._state = LoadStep.LoadUserData
    }

    // 用户数据
    const loadUserData = async () => {
      if (this._modelSetting.getUserDataFile() !== '') {
        const userDataFile = this._modelSetting.getUserDataFile()

        let response: Response
        const redirectPath = this._redirPath.UserData
        if (redirectPath) {
          response = await fetch(redirectPath)
        } else {
          response = await fetch(`${this._modelHomeDir}${userDataFile}`)
        }

        this._state = LoadStep.WaitLoadUserData

        let arrayBuffer: ArrayBuffer
        if (response.ok) {
          arrayBuffer = await response.arrayBuffer()
        } else if (response.status >= 400) {
          new CubismLogError(
            `Failed to load file ${this._modelHomeDir}${userDataFile}`,
          )
          arrayBuffer = new ArrayBuffer(0)
        }

        this.loadUserData(arrayBuffer, arrayBuffer.byteLength)
        this._state = LoadStep.SetupEyeBlinkIds
      } else {
        this._state = LoadStep.SetupEyeBlinkIds
      }
    }

    // 眨眼ID
    const setupEyeBlinkIds = async () => {
      const eyeBlinkIdCount: number
        = this._modelSetting.getEyeBlinkParameterCount()

      for (let i = 0; i < eyeBlinkIdCount; ++i) {
        this._eyeBlinkIds.pushBack(
          this._modelSetting.getEyeBlinkParameterId(i),
        )
      }

      this._state = LoadStep.SetupLipSyncIds
    }

    // 唇形同步ID
    const setupLipSyncIds = async () => {
      const lipSyncIdCount = this._modelSetting.getLipSyncParameterCount()

      for (let i = 0; i < lipSyncIdCount; ++i) {
        this._lipSyncIds.pushBack(this._modelSetting.getLipSyncParameterId(i))
      }
      this._state = LoadStep.SetupLayout
    }

    // 布局
    const setupLayout = async () => {
      const layout: csmMap<string, number> = new csmMap<string, number>()

      if (this._modelSetting === null || this._modelMatrix === null) {
        new CubismLogError('Failed to setupLayout().')
        return
      }

      this._modelSetting.getLayoutMap(layout)
      this._modelMatrix.setupFromLayout(layout)
      this._state = LoadStep.LoadMotion
    }

    // 动作
    const loadCubismMotion = async () => {
      this._state = LoadStep.WaitLoadMotion
      this._model.saveParameters()
      this._allMotionCount = 0
      this._motionCount = 0
      const group: string[] = []

      const motionGroupCount: number = this._modelSetting.getMotionGroupCount()

      // 计算动作总数
      for (let i = 0; i < motionGroupCount; i++) {
        group[i] = this._modelSetting.getMotionGroupName(i)
        this._allMotionCount += this._modelSetting.getMotionCount(group[i])
      }
      // 加载动作
      const workers = []
      for (let i = 0; i < motionGroupCount; i++) {
        workers.push(this.preLoadMotionGroup(group[i]))
      }

      // 等待加载动作完成
      await Promise.all([...workers])

      // 如果没有动作
      if (motionGroupCount === 0) {
        this._state = LoadStep.LoadTexture

        // 停止所有动作
        this._motionManager.stopAllMotions()

        this._updating = false
        this._initialized = true

        this.createRenderer()
        this.setupTextures()
        this.getRenderer().startUp(this._subdelegate.getGlManager().getGl())
      }
    }

    // 顺序执行链
    await loadCubismExpression()
    await loadCubismPhysics()
    await loadCubismPose()
    await setupEyeBlink()
    await setupBreath()
    await loadUserData()
    await setupEyeBlinkIds()
    await setupLipSyncIds()
    await setupLayout()
    await loadCubismMotion()
  }

  /**
   * 根据model3.json生成模型。
   * 按照model3.json的描述进行模型生成、动作、物理演算等组件的生成。
   *
   * @param setting ICubismModelSetting的实例
   */
  private async setupModel(setting: ICubismModelSetting) {
    this._updating = true
    this._initialized = false

    this._modelSetting = setting

    // CubismModel
    if (this._modelSetting.getModelFileName() !== '') {
      const modelFileName = this._modelSetting.getModelFileName()
      this._state = LoadStep.WaitLoadModel

      let response: Response
      const redirectPath = this._redirPath.Moc
      if (redirectPath) {
        response = await fetch(redirectPath)
      } else {
        response = await fetch(`${this._modelHomeDir}${modelFileName}`)
      }


      let arrayBuffer: ArrayBuffer
      if (response.ok) {
        arrayBuffer = await response.arrayBuffer()
      } else if (response.status >= 400) {
        new CubismLogError(
          `Failed to load file ${this._modelHomeDir}${modelFileName}`,
        )
        arrayBuffer = new ArrayBuffer(0)
      }

      this.loadModel(arrayBuffer, this._mocConsistency)
      this._state = LoadStep.LoadExpression
      await this.modelSettingOnload()
    } else {
      ToolManager.printMessage('模型数据不存在。')
    }
  }

  /**
   * 在纹理单元上加载纹理
   */
  private setupTextures(): void {
    // 在iPhone上为提高alpha质量，TypeScript版本采用premultipliedAlpha
    const usePremultiply = true

    if (this._state === LoadStep.LoadTexture) {
      // 用于纹理加载
      const textureCount: number = this._modelSetting.getTextureCount()
      const isRedir = this._redirPath.Textures.length > 0

      for (
        let modelTextureNumber = 0;
        modelTextureNumber < textureCount;
        modelTextureNumber++
      ) {
        // 如果纹理名称为空字符串，则跳过加载和绑定处理
        if (this._modelSetting.getTextureFileName(modelTextureNumber) === '') {
          console.log('getTextureFileName null')
          continue
        }

        // 在WebGL的纹理单元上加载纹理
        let texturePath
          = this._modelSetting.getTextureFileName(modelTextureNumber)
        texturePath = isRedir ? this._redirPath.Textures[modelTextureNumber] : this._modelHomeDir + texturePath

        // 加载完成时调用的回调函数
        const onLoad = (textureInfo: TextureInfo): void => {
          this.getRenderer().bindTexture(modelTextureNumber, textureInfo.id)

          this._textureCount++

          if (this._textureCount >= textureCount) {
            // 加载完成
            this._state = LoadStep.CompleteSetup
          }
        }

        // 加载
        this._subdelegate
          .getTextureManager()
          .createTextureFromPngFile(texturePath, usePremultiply, onLoad)
        this.getRenderer().setIsPremultipliedAlpha(usePremultiply)
      }

      this._state = LoadStep.WaitLoadTexture
    }
  }

  /**
   * 重建渲染器
   */
  public reloadRenderer(): void {
    this.deleteRenderer()
    this.createRenderer()
    this.setupTextures()
  }

  /**
   * 更新
   */
  public update(): void {
    if (this._state !== LoadStep.CompleteSetup)
      return

    const deltaTimeSeconds: number = ToolManager.getDeltaTime()
    this._userTimeSeconds += deltaTimeSeconds

    this._dragManager.update(deltaTimeSeconds)
    this._dragX = this._dragManager.getX()
    this._dragY = this._dragManager.getY()

    // 是否有通过动作更新参数
    let motionUpdated = false

    // --------------------------------------------------------------------------
    this._model.loadParameters() // 加载前一次保存的状态
    if (this._motionManager.isFinished()) {
      // 如果没有动作播放，从待机动作中随机选择一个播放
      this.startRandomMotion(
        Config.MotionGroupIdle,
        Priority.Idle,
      )
    } else {
      motionUpdated = this._motionManager.updateMotion(
        this._model,
        deltaTimeSeconds,
      ) // 更新动作
    }
    this._model.saveParameters() // 保存状态
    // --------------------------------------------------------------------------

    // 眨眼
    if (!motionUpdated) {
      if (this._eyeBlink !== null) {
        // 当没有主要动作更新时
        this._eyeBlink.updateParameters(this._model, deltaTimeSeconds) // 眨眼
      }
    }

    if (this._expressionManager !== null) {
      this._expressionManager.updateMotion(this._model, deltaTimeSeconds) // 通过表情更新参数（相对变化）
    }

    // 由拖动引起的变化
    // 调整面部朝向
    this._model.addParameterValueById(this._idParamAngleX, this._dragX * 30) // 添加-30到30的值
    this._model.addParameterValueById(this._idParamAngleY, this._dragY * 30)
    this._model.addParameterValueById(
      this._idParamAngleZ,
      this._dragX * this._dragY * -30,
    )

    // 调整身体朝向
    this._model.addParameterValueById(
      this._idParamBodyAngleX,
      this._dragX * 10,
    ) // 添加-10到10的值

    // 调整眼睛方向
    this._model.addParameterValueById(this._idParamEyeBallX, this._dragX) // 添加-1到1的值
    this._model.addParameterValueById(this._idParamEyeBallY, this._dragY)

    // 呼吸等
    if (this._breath !== null) {
      this._breath.updateParameters(this._model, deltaTimeSeconds)
    }

    // 物理演算设置
    if (this._physics !== null) {
      this._physics.evaluate(this._model, deltaTimeSeconds)
    }

    // 唇形同步设置
    if (this._lipsync) {
      let value = 0.0 // 在实时唇形同步中，从系统获取音量，并在0~1范围内输入值。

      this._wavFileHandler.update(deltaTimeSeconds)
      value = this._wavFileHandler.getRms()
      for (let i = 0; i < this._lipSyncIds.getSize(); ++i) {
        this._model.addParameterValueById(this._lipSyncIds.at(i), value, 3)
      }
    }

    // 姿势设置
    if (this._pose !== null) {
      this._pose.updateParameters(this._model, deltaTimeSeconds)
    }

    this._model.update()
  }

  /**
   * 开始播放指定的声音
   * @param voicePath 声音路径
   */
  public async playVoice(
    voicePath: string,
    immediate: boolean,
  ) {
    if (voicePath !== '') {
      if (immediate) {
        this.stopVoice()
      }
      sound.add('voice', voicePath)
      this._wavFileHandler.start(voicePath)
      await sound.play('voice')
    }
  }

  /**
   * 停止播放指定的声音
   */
  public stopVoice() {
    if (sound.exists('voice')) {
      sound.stop('voice')
      sound.remove('voice')
      this._wavFileHandler.releasePcmData()
    }
  }

  /**
   * 开始播放指定的动作
   * @param group 动作组名称
   * @param no 组内编号
   * @param priority 优先级
   * @param onFinishedMotionHandler 动作播放结束时调用的回调函数
   * @return 返回开始的动作标识号。用于判断单个动作是否结束的isFinished()函数的参数。无法开始时返回[-1]
   */
  public async startMotion(
    group: string,
    no: number,
    priority: Priority,
    onFinishedMotionHandler?: FinishedMotionCallback,
    onBeganMotionHandler?: BeganMotionCallback,
  ): Promise<CubismMotionQueueEntryHandle> {
    if (priority === Priority.Force) {
      this._motionManager.setReservePriority(priority)
    } else if (!this._motionManager.reserveMotion(priority)) {
      if (this._debugMode) {
        ToolManager.printMessage('[APP]无法开始动作。')
      }
      return InvalidMotionQueueEntryHandleValue
    }

    const motionFileName = this._modelSetting.getMotionFileName(group, no)

    // 例如) idle_0
    const name = `${group}_${no}`
    let motion: CubismMotion = this._motions.getValue(name) as CubismMotion
    let autoDelete = false

    if (motion === null) {

      let response: Response
      const isRedir = Object.entries(this._redirPath.Motions).length > 0
      if (isRedir) {
        const redirectPathGroup = this._redirPath.Motions[group]
        response = await fetch(redirectPathGroup[no])
      } else {
        response = await fetch(`${this._modelHomeDir}${motionFileName}`)
      }

      let arrayBuffer: ArrayBuffer
      if (response.ok) {
        arrayBuffer = await response.arrayBuffer()
      } else if (response.status >= 400) {
        new CubismLogError(
          `Failed to load file ${this._modelHomeDir}${motionFileName}`,
        )
        arrayBuffer = new ArrayBuffer(0)
      }

      motion = this.loadMotion(
        arrayBuffer,
        arrayBuffer.byteLength,
        null,
        onFinishedMotionHandler,
        onBeganMotionHandler,
        this._modelSetting,
        group,
        no,
      )
      if (motion !== null) {
        motion.setEffectIds(this._eyeBlinkIds, this._lipSyncIds)
        autoDelete = true // 结束时从内存中删除
      }

    } else {
      motion.setBeganMotionHandler(onBeganMotionHandler)
      motion.setFinishedMotionHandler(onFinishedMotionHandler)
    }

    if (this._debugMode) {
      ToolManager.printMessage(`[APP]开始动作: [${group}_${no}`)
    }
    return this._motionManager.startMotionPriority(
      motion,
      autoDelete,
      priority,
    )
  }

  /**
   * 开始播放随机选择的动作
   * @param group 动作组名称
   * @param priority 优先级
   * @param onFinishedMotionHandler 动作播放结束时调用的回调函数
   * @return 返回开始的动作标识号。用于判断单个动作是否结束的isFinished()函数的参数。无法开始时返回[-1]
   */
  public startRandomMotion(
    group: string,
    priority: Priority,
    onFinishedMotionHandler?: FinishedMotionCallback,
    onBeganMotionHandler?: BeganMotionCallback,
  ): CubismMotionQueueEntryHandle {
    if (this._modelSetting.getMotionCount(group) === 0) {
      return InvalidMotionQueueEntryHandleValue
    }

    const no: number = Math.floor(
      Math.random() * this._modelSetting.getMotionCount(group),
    )

    return this.startMotion(
      group,
      no,
      priority,
      onFinishedMotionHandler,
      onBeganMotionHandler,
    )
  }

  /**
   * 设置指定的表情动作
   *
   * @param expressionId 表情动作的ID
   */
  public setExpression(expressionId: string): void {
    const motion: ACubismMotion = this._expressions.getValue(expressionId)
    if (this._debugMode) {
      ToolManager.printMessage(`[APP]表情: [${expressionId}]`)
    }

    if (motion !== null) {
      this._expressionManager.startMotion(motion, false)
    } else {
      if (this._debugMode) {
        ToolManager.printMessage(`[APP]表情[${expressionId}]为空`)
      }
    }
  }

  /**
   * 设置随机选择的表情动作
   */
  public setRandomExpression(): void {
    if (this._expressions.getSize() === 0) {
      return
    }

    const no: number = Math.floor(Math.random() * this._expressions.getSize())

    for (let i = 0; i < this._expressions.getSize(); i++) {
      if (i === no) {
        const name: string = this._expressions._keyValues[i].first
        this.setExpression(name)
        return
      }
    }
  }

  /**
   * 接收事件触发
   */
  public motionEventFired(eventValue: csmString): void {
    CubismLogInfo('{0} is fired on LAppModel!!', eventValue.s)
  }

  /**
   * 碰撞检测测试
   * 从指定ID的顶点列表计算矩形，并判断坐标是否在矩形范围内。
   *
   * @param hitAreaName 要测试碰撞检测的目标ID
   * @param x 要判断的X坐标
   * @param y 要判断的Y坐标
   */
  public hitTest(hitAreaName: string, x: number, y: number): boolean {
    // 透明时无碰撞检测
    if (this._opacity < 1) {
      return false
    }

    const count: number = this._modelSetting.getHitAreasCount()

    for (let i = 0; i < count; i++) {
      if (this._modelSetting.getHitAreaName(i) === hitAreaName) {
        const drawId: CubismIdHandle = this._modelSetting.getHitAreaId(i)
        const res = this.isHit(drawId, x, y)
        if (res) {
          console.log(hitAreaName, x, y)
          this._eventManager.emit('hit', { hitAreaName, x, y })
        }
        return res
      }
    }

    return false
  }

  /**
   * 从组名批量加载动作数据。
   * 动作数据的名称在内部从ModelSetting获取。
   *
   * @param group 动作数据的组名
   */
  public async preLoadMotionGroup(group: string) {
    for (let i = 0; i < this._modelSetting.getMotionCount(group); i++) {
      const motionFileName = this._modelSetting.getMotionFileName(group, i)

      // 例如) idle_0
      const name = `${group}_${i}`
      if (this._debugMode) {
        ToolManager.printMessage(`[APP]加载动作: ${motionFileName} => [${name}]`)
      }
      let response: Response
      const isRedir = Object.entries(this._redirPath.Motions).length > 0
      if (isRedir) {
        const redirectPathGroup = this._redirPath.Motions[group]
        response = await fetch(redirectPathGroup[i])
      } else {
        response = await fetch(`${this._modelHomeDir}${motionFileName}`)
      }

      let arrayBuffer: ArrayBuffer

      if (response.ok) {
        arrayBuffer = await response.arrayBuffer()
      } else if (response.status >= 400) {
        new CubismLogError(
          `Failed to load file ${this._modelHomeDir}${motionFileName}`,
        )
        arrayBuffer = new ArrayBuffer(0)
      }

      const tmpMotion: CubismMotion = this.loadMotion(
        arrayBuffer,
        arrayBuffer.byteLength,
        name,
        null,
        null,
        this._modelSetting,
        group,
        i,
      )

      if (tmpMotion !== null) {
        tmpMotion.setEffectIds(this._eyeBlinkIds, this._lipSyncIds)

        if (this._motions.getValue(name) !== null) {
          ACubismMotion.delete(this._motions.getValue(name))
        }

        this._motions.setValue(name, tmpMotion)

        this._motionCount++
        if (this._motionCount >= this._allMotionCount) {
          this._state = LoadStep.LoadTexture

          // 停止所有动作
          this._motionManager.stopAllMotions()

          this._updating = false
          this._initialized = true

          this.createRenderer()
          this.setupTextures()
          this.getRenderer().startUp(
            this._subdelegate.getGlManager().getGl(),
          )
        }
      } else {
        // 如果无法加载动作，动作总数会不一致，所以减少1个
        this._allMotionCount--
      }

    }
  }

  /**
   * 释放所有动作数据
   */
  public releaseMotions(): void {
    this._motions.clear()
  }

  /**
   * 释放所有表情数据
   */
  public releaseExpressions(): void {
    this._expressions.clear()
  }

  /**
   * 绘制模型的处理。传递绘制模型空间的View-Projection矩阵。
   */
  public doDraw(): void {
    if (this._model === null)
      return

    // 传递画布大小
    const sprite = this._subdelegate.getLive2DSprite()
    const viewport: number[] = [sprite.x, sprite.y, sprite.width, sprite.height]

    this.getRenderer().setRenderState(
      this._subdelegate.getFrameBuffer(),
      viewport,
    )
    this.getRenderer().drawModel()
  }

  /**
   * 绘制模型的处理。传递绘制模型空间的View-Projection矩阵。
   */
  public draw(matrix: CubismMatrix44): void {
    if (this._model === null) {
      return
    }

    // 各加载结束后
    if (this._state === LoadStep.CompleteSetup) {
      matrix.multiplyByMatrix(this._modelMatrix)

      this.getRenderer().setMvpMatrix(matrix)

      this.doDraw()
    }
  }

  public async hasMocConsistencyFromFile() {
    CSM_ASSERT(this._modelSetting.getModelFileName().localeCompare(``))

    // CubismModel
    if (this._modelSetting.getModelFileName() !== '') {
      const modelFileName = this._modelSetting.getModelFileName()

      let response: Response
      const redirectPath = this._redirPath.Moc
      if (redirectPath) {
        response = await fetch(redirectPath)
      } else {
        response = await fetch(`${this._modelHomeDir}${modelFileName}`)
      }

      const arrayBuffer = await response.arrayBuffer()
      this._consistency = CubismMoc.hasMocConsistency(arrayBuffer)

      if (!this._consistency) {
        CubismLogInfo('MOC3不一致。')
      } else {
        CubismLogInfo('MOC3一致。')
      }

      return this._consistency
    } else {
      ToolManager.printMessage('模型数据不存在。')
    }
  }

  public setSubdelegate(subdelegate: ActionsManager): void {
    this._subdelegate = subdelegate
  }

  /**
   * 构造函数
   */
  public constructor() {
    super()

    sound.disableAutoPause = true

    this._modelSetting = null
    this._modelHomeDir = ''
    this._redirPath = {
      Moc: '',
      Textures: [],
      Motions: {},
      Expressions: [],
      Physics: '',
      Pose: '',
      UserData: '',
    }
    this._userTimeSeconds = 0.0

    this._eyeBlinkIds = new csmVector<CubismIdHandle>()
    this._lipSyncIds = new csmVector<CubismIdHandle>()

    this._motions = new csmMap<string, ACubismMotion>()
    this._expressions = new csmMap<string, ACubismMotion>()

    this._hitArea = new csmVector<csmRect>()
    this._userArea = new csmVector<csmRect>()

    this._idParamAngleX = CubismFramework.getIdManager().getId(
      CubismDefaultParameterId.ParamAngleX,
    )
    this._idParamAngleY = CubismFramework.getIdManager().getId(
      CubismDefaultParameterId.ParamAngleY,
    )
    this._idParamAngleZ = CubismFramework.getIdManager().getId(
      CubismDefaultParameterId.ParamAngleZ,
    )
    this._idParamEyeBallX = CubismFramework.getIdManager().getId(
      CubismDefaultParameterId.ParamEyeBallX,
    )
    this._idParamEyeBallY = CubismFramework.getIdManager().getId(
      CubismDefaultParameterId.ParamEyeBallY,
    )
    this._idParamBodyAngleX = CubismFramework.getIdManager().getId(
      CubismDefaultParameterId.ParamBodyAngleX,
    )

    if (Config.MOCConsistencyValidationEnable) {
      this._mocConsistency = true
    }

    this._state = LoadStep.LoadAssets
    this._expressionCount = 0
    this._textureCount = 0
    this._motionCount = 0
    this._allMotionCount = 0
    this._wavFileHandler = new SoundManager()
    this._eventManager = eventManager
    this._consistency = false
  }

  private _subdelegate: ActionsManager
  private _eventManager: EventManager // 事件管理器

  _redirPath: IRedirectPath // 重定向路径信息
  _modelSetting: ICubismModelSetting // 模型设置信息
  _modelHomeDir: string // 存放模型设置的目录
  _userTimeSeconds: number // 增量时间的累计值[秒]

  _eyeBlinkIds: csmVector<CubismIdHandle> // 模型设置的眨眼功能参数ID
  _lipSyncIds: csmVector<CubismIdHandle> // 模型设置的唇形同步功能参数ID

  _motions: csmMap<string, ACubismMotion> // 已加载的动作列表
  _expressions: csmMap<string, ACubismMotion> // 已加载的表情列表

  _hitArea: csmVector<csmRect>
  _userArea: csmVector<csmRect>

  _idParamAngleX: CubismIdHandle // 参数ID: ParamAngleX
  _idParamAngleY: CubismIdHandle // 参数ID: ParamAngleY
  _idParamAngleZ: CubismIdHandle // 参数ID: ParamAngleZ
  _idParamEyeBallX: CubismIdHandle // 参数ID: ParamEyeBallX
  _idParamEyeBallY: CubismIdHandle // 参数ID: ParamEyeBallY
  _idParamBodyAngleX: CubismIdHandle // 参数ID: ParamBodyAngleX

  _state: LoadStep // 当前状态管理
  _expressionCount: number // 表情数据计数
  _textureCount: number // 纹理计数
  _motionCount: number // 动作数据计数
  _allMotionCount: number // 动作总数
  _wavFileHandler: SoundManager // wav文件处理器
  _consistency: boolean // MOC3一致性检查管理
}

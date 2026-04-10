import type { ICubismModelSetting } from '@Framework/icubismmodelsetting'
import type { ModelAssets } from '../core/types'
import type { Live2DModel } from '../model/Live2DModel'
import type { CubismSetting, IRedirectPath } from '../utils/cubismSetting'
import type { TextureLoader } from './TextureLoader'
import { CubismModelSettingJson } from '@Framework/cubismmodelsettingjson'
import { CubismLogError as logCubismError } from '@Framework/utils/cubismdebug'
import { FileLoader } from './FileLoader'

interface ResolvedSetting {
  setting: ICubismModelSetting
  homeDir: string
  redir: IRedirectPath
}

const EMPTY_REDIR: IRedirectPath = {
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
 * 模型资源加载器
 * 用 async/await 替代原 22 步 LoadStep 状态机
 */
export class ModelLoader {
  async load(
    modelAssets: ModelAssets,
    model: Live2DModel,
    textureLoader: TextureLoader,
    gl: WebGLRenderingContext | WebGL2RenderingContext,
  ): Promise<void> {
    try {
      const ctx = await this.resolveSetting(modelAssets)
      model.setModelSetting(ctx.setting, ctx.homeDir, ctx.redir)

      await this.loadMoc(model, ctx)
      await this.loadExpressions(model, ctx)
      await this.loadPhysics(model, ctx)
      await this.loadPose(model, ctx)
      model.setupEffects(ctx.setting)
      await this.loadUserData(model, ctx)
      model.setupLayout(ctx.setting)
      await this.loadMotions(model, ctx)

      model.initializeRenderer(gl)
      await this.loadTextures(model, ctx, textureLoader)
      model.setReady(true)
    } catch (error) {
      logCubismError(`Failed to load model: ${error}`)
    }
  }

  private async resolveSetting(assets: ModelAssets): Promise<ResolvedSetting> {
    if (typeof assets === 'string') {
      const homeDir = `${assets.slice(0, assets.lastIndexOf('/'))}/`
      const buf = await FileLoader.loadArrayBuffer(assets)
      return { setting: new CubismModelSettingJson(buf, buf.byteLength), homeDir, redir: EMPTY_REDIR }
    }
    const s = assets as CubismSetting
    return { setting: s as unknown as ICubismModelSetting, homeDir: s.prefixPath, redir: s.redirPath }
  }

  private resolveUrl(redir: string | undefined, homeDir: string, fileName: string): string {
    return redir || `${homeDir}${fileName}`
  }

  private async loadMoc(model: Live2DModel, ctx: ResolvedSetting): Promise<void> {
    const fileName = ctx.setting.getModelFileName()
    if (!fileName)
      return
    const buf = await FileLoader.fetchSafe(this.resolveUrl(ctx.redir.Moc, ctx.homeDir, fileName))
    model.loadMocModel(buf)
  }

  private async loadExpressions(model: Live2DModel, ctx: ResolvedSetting): Promise<void> {
    const count = ctx.setting.getExpressionCount()
    for (let i = 0; i < count; i++) {
      const name = ctx.setting.getExpressionName(i)
      const url = this.resolveUrl(ctx.redir.Expressions[i], ctx.homeDir, ctx.setting.getExpressionFileName(i))
      const buf = await FileLoader.fetchSafe(url)
      model.loadExpressionData(name, buf)
    }
  }

  private async loadPhysics(model: Live2DModel, ctx: ResolvedSetting): Promise<void> {
    const fileName = ctx.setting.getPhysicsFileName()
    if (!fileName)
      return
    const buf = await FileLoader.fetchSafe(this.resolveUrl(ctx.redir.Physics, ctx.homeDir, fileName))
    model.loadPhysicsData(buf)
  }

  private async loadPose(model: Live2DModel, ctx: ResolvedSetting): Promise<void> {
    const fileName = ctx.setting.getPoseFileName()
    if (!fileName)
      return
    const buf = await FileLoader.fetchSafe(this.resolveUrl(ctx.redir.Pose, ctx.homeDir, fileName))
    model.loadPoseData(buf)
  }

  private async loadUserData(model: Live2DModel, ctx: ResolvedSetting): Promise<void> {
    const fileName = ctx.setting.getUserDataFile()
    if (!fileName)
      return
    const buf = await FileLoader.fetchSafe(this.resolveUrl(ctx.redir.UserData, ctx.homeDir, fileName))
    model.loadUserDataData(buf)
  }

  private async loadMotions(model: Live2DModel, ctx: ResolvedSetting): Promise<void> {
    const groupCount = ctx.setting.getMotionGroupCount()
    const groups: string[] = []
    for (let i = 0; i < groupCount; i++) {
      groups.push(ctx.setting.getMotionGroupName(i))
    }
    await Promise.all(groups.map(g => this.loadMotionGroup(model, ctx, g)))
    model.finalizeMotionSetup()
  }

  private async loadMotionGroup(model: Live2DModel, ctx: ResolvedSetting, group: string): Promise<void> {
    const count = ctx.setting.getMotionCount(group)
    const hasRedir = Object.keys(ctx.redir.Motions).length > 0
    for (let i = 0; i < count; i++) {
      const fileName = ctx.setting.getMotionFileName(group, i)
      const url = (hasRedir && ctx.redir.Motions[group]?.[i]) || `${ctx.homeDir}${fileName}`
      const buf = await FileLoader.fetchSafe(url)
      model.loadMotionData(group, i, buf, ctx.setting)
    }
  }

  private async loadTextures(
    model: Live2DModel,
    ctx: ResolvedSetting,
    textureLoader: TextureLoader,
  ): Promise<void> {
    const count = ctx.setting.getTextureCount()
    const hasRedir = ctx.redir.Textures.length > 0
    const promises: Promise<void>[] = []

    for (let i = 0; i < count; i++) {
      const fileName = ctx.setting.getTextureFileName(i)
      if (!fileName)
        continue
      const url = (hasRedir && ctx.redir.Textures[i]) || `${ctx.homeDir}${fileName}`
      promises.push(new Promise((resolve) => {
        textureLoader.createTextureFromPngFile(url, true, (info) => {
          model.bindTexture(i, info.id)
          resolve()
        })
      }))
    }
    await Promise.all(promises)
  }
}

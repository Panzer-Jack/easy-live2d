import type { ICubismModelSetting } from '@Framework/icubismmodelsetting'
import type { ModelAssets } from '../core/types'
import type { Live2DModel } from '../model/Live2DModel'
import type { CubismSetting, IRedirectPath } from '../utils/cubismSetting'
import type { TextureLoader } from './TextureLoader'
import { CubismModelSettingJson } from '@Framework/cubismmodelsettingjson'
import { FileLoader } from './FileLoader'

interface ResolvedSetting {
  setting: ICubismModelSetting
  homeDir: string
  redir: IRedirectPath
  signal?: AbortSignal
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
    gl: WebGL2RenderingContext,
    signal?: AbortSignal,
  ): Promise<void> {
    const ctx = await this.resolveSetting(modelAssets, signal)
    model.setModelSetting(ctx.setting, ctx.homeDir, ctx.redir)

    await this.loadMoc(model, ctx)
    await this.loadExpressions(model, ctx)
    await this.loadPhysics(model, ctx)
    await this.loadPose(model, ctx)
    model.setupEffects(ctx.setting)
    await this.loadUserData(model, ctx)
    model.setupLayout(ctx.setting)
    await this.loadMotions(model, ctx)

    signal?.throwIfAborted()
    model.initializeRenderer(gl)
    await this.loadTextures(model, ctx, textureLoader)
    model.setReady(true)
  }

  private async resolveSetting(assets: ModelAssets, signal?: AbortSignal): Promise<ResolvedSetting> {
    if (typeof assets === 'string') {
      const homeDir = `${assets.slice(0, assets.lastIndexOf('/'))}/`
      const buf = await FileLoader.loadArrayBuffer(assets, signal)
      return { setting: new CubismModelSettingJson(buf, buf.byteLength), homeDir, redir: EMPTY_REDIR, signal }
    }
    const s = assets as CubismSetting
    return { setting: s as unknown as ICubismModelSetting, homeDir: s.prefixPath, redir: s.redirPath, signal }
  }

  private resolveUrl(redir: string | undefined, homeDir: string, fileName: string): string {
    return redir || `${homeDir}${fileName}`
  }

  private async loadMoc(model: Live2DModel, ctx: ResolvedSetting): Promise<void> {
    const fileName = ctx.setting.getModelFileName()
    if (!fileName)
      throw new Error('Model settings must specify a MOC3 file.')
    const buf = await FileLoader.loadArrayBuffer(this.resolveUrl(ctx.redir.Moc, ctx.homeDir, fileName), ctx.signal)
    model.loadMocModel(buf)
  }

  private async loadExpressions(model: Live2DModel, ctx: ResolvedSetting): Promise<void> {
    const count = ctx.setting.getExpressionCount()
    for (let i = 0; i < count; i++) {
      const name = ctx.setting.getExpressionName(i)
      const url = this.resolveUrl(ctx.redir.Expressions[i], ctx.homeDir, ctx.setting.getExpressionFileName(i))
      const buf = await FileLoader.loadArrayBuffer(url, ctx.signal)
      model.loadExpressionData(name, buf)
    }
  }

  private async loadPhysics(model: Live2DModel, ctx: ResolvedSetting): Promise<void> {
    const fileName = ctx.setting.getPhysicsFileName()
    if (!fileName)
      return
    const buf = await FileLoader.loadArrayBuffer(this.resolveUrl(ctx.redir.Physics, ctx.homeDir, fileName), ctx.signal)
    model.loadPhysicsData(buf)
  }

  private async loadPose(model: Live2DModel, ctx: ResolvedSetting): Promise<void> {
    const fileName = ctx.setting.getPoseFileName()
    if (!fileName)
      return
    const buf = await FileLoader.loadArrayBuffer(this.resolveUrl(ctx.redir.Pose, ctx.homeDir, fileName), ctx.signal)
    model.loadPoseData(buf)
  }

  private async loadUserData(model: Live2DModel, ctx: ResolvedSetting): Promise<void> {
    const fileName = ctx.setting.getUserDataFile()
    if (!fileName)
      return
    const buf = await FileLoader.loadArrayBuffer(this.resolveUrl(ctx.redir.UserData, ctx.homeDir, fileName), ctx.signal)
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
      const buf = await FileLoader.loadArrayBuffer(url, ctx.signal)
      ctx.signal?.throwIfAborted()
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
      promises.push(textureLoader.load(url, true, ctx.signal).then((info) => {
        ctx.signal?.throwIfAborted()
        model.bindTexture(i, info.id)
      }))
    }
    await Promise.all(promises)
  }
}

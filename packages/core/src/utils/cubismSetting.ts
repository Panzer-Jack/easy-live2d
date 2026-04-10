import { CubismModelSettingJson } from '@Framework/cubismmodelsettingjson'
import { json2ArrayBuffer } from './json2ArrayBuffer'

const enum EFilename {
  moc = 'Moc',
  textures = 'Textures',
  physics = 'Physics',
  pose = 'Pose',
  expressions = 'Expressions',
  motions = 'Motions',
  motionSounds = 'MotionSounds',
  userData = 'UserData',
}

export interface IRedirectPath {
  [EFilename.moc]: string
  [EFilename.textures]: string[]
  [EFilename.physics]: string
  [EFilename.pose]: string
  [EFilename.expressions]: string[]
  [EFilename.motions]: { [groupName: string]: string[] }
  /**
   * Redirected URLs for motion sound files, keyed by group name then motion index.
   * When populated via `redirectPath()`, `MotionController` will use these URLs
   * instead of resolving sound files relative to the model home directory.
   */
  [EFilename.motionSounds]: { [groupName: string]: string[] }
  [EFilename.userData]: string
}

export class CubismSetting extends CubismModelSettingJson {
  prefixPath: string
  redirPath: IRedirectPath = {
    [EFilename.moc]: '',
    [EFilename.textures]: [],
    [EFilename.physics]: '',
    [EFilename.pose]: '',
    [EFilename.expressions]: [],
    [EFilename.motions]: {},
    [EFilename.motionSounds]: {},
    [EFilename.userData]: '',
  }

  constructor({ modelJSON, prefixPath = '' }: { modelJSON: any, prefixPath?: string }) {
    super(json2ArrayBuffer(modelJSON), json2ArrayBuffer(modelJSON).byteLength)
    this.prefixPath = prefixPath
  }

  redirectPath(redirFn: ({ file }: { file: string }) => string): void {
    this.redirPath[EFilename.moc] = redirFn({ file: this.getModelFileName() })

    for (let i = 0; i < this.getTextureCount(); i++) {
      this.redirPath[EFilename.textures][i] = redirFn({ file: this.getTextureFileName(i) })
    }

    if (this.getPhysicsFileName() !== '') {
      this.redirPath[EFilename.physics] = redirFn({ file: this.getPhysicsFileName() })
    }

    if (this.getPoseFileName() !== '') {
      this.redirPath[EFilename.pose] = redirFn({ file: this.getPoseFileName() })
    }

    for (let i = 0; i < this.getExpressionCount(); i++) {
      this.redirPath[EFilename.expressions][i] = redirFn({ file: this.getExpressionFileName(i) })
    }

    for (let i = 0; i < this.getMotionGroupCount(); i++) {
      const groupName = this.getMotionGroupName(i)
      const motionCount = this.getMotionCount(groupName)
      this.redirPath[EFilename.motions][groupName] = []
      this.redirPath[EFilename.motionSounds][groupName] = []
      for (let j = 0; j < motionCount; j++) {
        this.redirPath[EFilename.motions][groupName][j] = redirFn({
          file: this.getMotionFileName(groupName, j),
        })
        const soundFile = this.getMotionSoundFileName(groupName, j)
        if (soundFile) {
          this.redirPath[EFilename.motionSounds][groupName][j] = redirFn({ file: soundFile })
        }
      }
    }

    if (this.getUserDataFile() !== '') {
      this.redirPath[EFilename.userData] = redirFn({ file: this.getUserDataFile() })
    }
  }
}

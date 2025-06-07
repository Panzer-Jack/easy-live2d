import { CubismModelSettingJson } from "@Framework/cubismmodelsettingjson";
import { json2ArrayBuffer } from "./json2ArrayBuffer"


const enum EFilename {
  moc = 'Moc',
  textures = 'Textures',
  physics = 'Physics',
  pose = 'Pose',
  expressions = 'Expressions',
  motions = 'Motions',
  userData = 'UserData'
}

interface IRedirectPath {
  [EFilename.moc]: string;
  [EFilename.textures]: string[];
  [EFilename.physics]: string;
  [EFilename.pose]: string;
  [EFilename.expressions]: string[];
  [EFilename.motions]: any[];
  [EFilename.userData]: string;
}

class CubismSetting extends CubismModelSettingJson {

  prefixPath: string;
  redirPath: IRedirectPath = {
    [EFilename.moc]: "",
    [EFilename.textures]: [],
    [EFilename.physics]: "",
    [EFilename.pose]: "",
    [EFilename.expressions]: [],
    [EFilename.motions]: [],
    [EFilename.userData]: ""
  }

  constructor({
    modelJSON,
    prefixPath = "",
  }: {
    modelJSON: any,
    prefixPath?: string
  }) {
    super(json2ArrayBuffer(modelJSON), json2ArrayBuffer(modelJSON).byteLength)
    this.prefixPath = prefixPath
  }

  redirectPath(redirFn: ({ file }: { file: string }) => string) {
    this.redirPath[EFilename.moc] = redirFn({ file: this.getModelFileName() })

    for (let i = 0; i < this.getTextureCount(); i++) {
      this.redirPath[EFilename.textures][i] = redirFn({ file: this.getTextureFileName(i) })
    }

    if (this.getPhysicsFileName() !== "") {
      this.redirPath[EFilename.physics] = redirFn({ file: this.getPhysicsFileName() })
    }

    if (this.getPoseFileName() !== "") {
      this.redirPath[EFilename.pose] = redirFn({ file: this.getPoseFileName() })
    }

    for (let i = 0; i < this.getExpressionCount(); i++) {
      this.redirPath[EFilename.expressions][i] = redirFn({ file: this.getExpressionFileName(i) })
    }

    for (let i = 0; i < this.getMotionGroupCount(); i++) {
      const groupName = this.getMotionGroupName(i);
      const motionCount = this.getMotionCount(groupName);
      this.redirPath[EFilename.motions][groupName] = [];
      for (let j = 0; j < motionCount; j++) {
        this.redirPath[EFilename.motions][groupName][j] = redirFn({ file: this.getMotionFileName(groupName, j) });
      }
    }

    if (this.getUserDataFile() !== "") {
      this.redirPath[EFilename.userData] = redirFn({ file: this.getUserDataFile() });
    }
  }
}

export { CubismSetting, EFilename, IRedirectPath };

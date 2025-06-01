import { CubismModelSettingJson } from "@Framework/cubismmodelsettingjson";
import { json2ArrayBuffer } from "./json2ArrayBuffer"

class CubismSetting extends CubismModelSettingJson {

  prefixPath: string;

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
}

export { CubismSetting }
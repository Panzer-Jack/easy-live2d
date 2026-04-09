import type { Ticker } from 'pixi.js'
import type { CubismSetting } from '../utils/cubismSetting'

/**
 * Live2DSprite 事件类型定义
 */
export interface Live2DSpriteDragEvent {
  x: number
  y: number
  deltaX: number
  deltaY: number
}

export interface Live2DSpriteEvents {
  hit: [{ hitAreaName: string, x: number, y: number }]
  ready: []
  dragStart: [Live2DSpriteDragEvent]
  dragMove: [Live2DSpriteDragEvent]
  dragEnd: [Live2DSpriteDragEvent]
}

/**
 * Live2DSprite 初始化配置
 */
export interface Live2DSpriteInit {
  modelPath?: string
  modelSetting?: CubismSetting
  ticker?: Ticker
  draggable?: boolean
}

/**
 * 模型资源来源类型
 */
export type ModelAssets = CubismSetting | string

/**
 * 动作播放参数
 */
export interface MotionParams {
  group: string
  no: number
  priority: number
  onStarted?: (motion: any) => void
  onFinished?: (motion: any) => void
}

/**
 * 表情设置参数
 */
export interface ExpressionParams {
  expressionId: string
}

/**
 * 语音播放参数
 */
export interface VoiceParams {
  voicePath: string
  immediate?: boolean
}

/**
 * 动作信息
 */
export interface MotionInfo {
  group: string
  no: number
  name: string
}

/**
 * 表情信息
 */
export interface ExpressionInfo {
  name: string
}

/**
 * 视口信息
 */
export interface Viewport {
  width: number
  height: number
  x: number
  y: number
}

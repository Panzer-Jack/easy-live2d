import { LogLevel } from '@Framework/live2dcubismframework'

export enum Priority {
    None = 0,
    Idle = 1,
    Normal = 2,
    Force = 3
}

/**
 * 定义配置接口
 */
export interface ConfigType {
    // 视图
    ViewScale: number;
    ViewMaxScale: number;
    ViewMinScale: number;
    ViewLogicalLeft: number;
    ViewLogicalRight: number;
    ViewLogicalBottom: number;
    ViewLogicalTop: number;
    ViewLogicalMaxLeft: number;
    ViewLogicalMaxRight: number;
    ViewLogicalMaxBottom: number;
    ViewLogicalMaxTop: number;

    // 模型定义
    MotionGroupIdle: string;

    // MOC3一致性验证
    MOCConsistencyValidationEnable: boolean;

    // 调试选项
    DebugLogEnable: boolean;
    DebugTouchLogEnable: boolean;
    CubismLoggingLevel: LogLevel;

    // 鼠标跟随
    MouseFollow: boolean;

    // 重制默认配置
    resetConfig: () => void;
}


// 默认配置
const DefaultConfig = {
    // 视图
    ViewScale: 1.0,
    ViewMaxScale: 2.0,
    ViewMinScale: 0.8,
    ViewLogicalLeft: -1.0,
    ViewLogicalRight: 1.0,
    ViewLogicalBottom: -1.0,
    ViewLogicalTop: 1.0,
    ViewLogicalMaxLeft: -2.0,
    ViewLogicalMaxRight: 2.0,
    ViewLogicalMaxBottom: -2.0,
    ViewLogicalMaxTop: 2.0,

    // 模型定义
    MotionGroupIdle: 'Idle', // 空闲状态

    // 动作优先级常量
    PriorityNone: 0,
    PriorityIdle: 1,
    PriorityNormal: 2,
    PriorityForce: 3,

    // MOC3一致性验证选项
    MOCConsistencyValidationEnable: true,

    // 调试日志显示选项
    DebugLogEnable: true,
    DebugTouchLogEnable: false,

    // 鼠标跟随
    MouseFollow: true,

    // 框架输出日志级别设置
    CubismLoggingLevel: LogLevel.LogLevel_Verbose
}

// 导出可修改的配置对象
export const Config: ConfigType = {
    ...DefaultConfig,
    resetConfig: () => {
        for (const key in DefaultConfig) {
            if (Object.prototype.hasOwnProperty.call(DefaultConfig, key)) {
                Config[key] = DefaultConfig[key];
            }
        }
    },
};

export {
    LogLevel
}
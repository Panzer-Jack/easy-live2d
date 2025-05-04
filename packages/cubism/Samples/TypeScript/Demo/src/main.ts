/**
 * Copyright(c) Live2D Inc. All rights reserved.
 *
 * 使用此源代码受Live2D开源软件许可证的约束，
 * 该许可证可在https://www.live2d.com/eula/live2d-open-software-license-agreement_en.html找到。
 */

import { LAppDelegate } from './lappdelegate';
import * as LAppDefine from './lappdefine';

/**
 * 浏览器加载后的处理
 */
window.addEventListener(
  'load',
  (): void => {
    // 初始化WebGL并创建应用程序实例
    if (!LAppDelegate.getInstance().initialize()) {
      return;
    }

    LAppDelegate.getInstance().run();
  },
  { passive: true }
);

/**
 * 退出时的处理
 */
window.addEventListener(
  'beforeunload',
  (): void => LAppDelegate.releaseInstance(),
  { passive: true }
);

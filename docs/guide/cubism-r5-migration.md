# Cubism R5 升级

本分支使用官方 Cubism 5 SDK for Web R5（2026-04-02）。Framework 子模块固定在 `198a376`（官方 `5-r.5` 标签），Core、Framework 必须配套升级；不要继续使用旧版 Core，也不要依赖自动变化的 latest CDN 地址。改动尚未发布，计划版本为 `1.0.0-uat.0`，本地包版本号仍是 `0.4.4`。

## 使用方

1. 用 R5 SDK 的 `Core/live2dcubismcore.js`（或 min.js）替换部署的旧文件，并更新缓存版本。
2. 升级 easy-live2d。Pixi 默认优先使用 WebGL 2，无需额外填写渲染配置；若应用自行指定了 WebGL 1 或 WebGPU，需要恢复为 WebGL 2。
3. 加入舞台后，在 `try/catch` 中通过 `await sprite.ready` 检查加载结果；加载失败会 reject，且不再每帧重试。若 Pixi 停止自动渲染，需先调用 `app.render()` 触发加载。WebGL 1 不再回退。
4. R5 的 13 个官方着色器已内置库产物，无需额外部署 Shaders 目录。

模型由 Pixi 渲染循环驱动，无需传入 `ticker`；该字段仅保留接口兼容。首帧时间间隔为 0，后台恢复等长间隔最多推进 100ms。配置中未声明的可选资源会跳过；已经声明的资源加载失败时，`ready` 会拒绝并提供 URL、HTTP 状态等诊断信息。

用户的同步 `ready` 回调抛错会记录为回调错误，模型仍保持就绪；异步回调的 rejection 需自行捕获。语音由每个精灵独立管理，播放和口型共用一次下载、解码结果；停止或销毁只影响本实例，并取消未完成的语音操作。`immediate: false` 保留本实例已经开始播放的语音，新的待加载请求会替代旧的待加载请求。

旧的 `.moc3` 资源无需仅为 SDK 升级而重新导出。应回归动作、表情、物理、遮罩、颜色、尺寸和指针交互；不保证不同 SDK 版本的浮点结果完全相同。Cubism 2 的 `.moc` 不在支持范围内。

若必须保留旧 SDK / Core，请使用之前已验证的 `0.4.4` 发布包与配套 Core；该版本不保证所有历史 SDK 组合均可用。

## 开发与验证

```bash
git submodule sync
git submodule update --init --recursive
pnpm install --frozen-lockfile
pnpm setup:cubism
pnpm build
pnpm exec playwright install chromium
pnpm test:browser
pnpm dev:playground
```

已有 SDK 压缩包时：`pnpm setup:cubism /absolute/path/CubismSdkForWeb-5-r.5.zip`。安装脚本依赖 `curl` 和 `unzip`，校验固定 SHA-256，将 Core 安装至 `packages/cubism/Core` 和 `packages/playground/public/Core`，将官方模型放入 `packages/playground/public/SdkResources`，不覆盖已有的 `public/Resources`，也不会准备 Tauri 资源。Core 和模型仍不提交 Git，沿用官方许可。

浏览器回归使用 Hiyori（动作、物理）、Haru（表情和资源 URL 重定向）、Rice（旧格式样例）及 Ren（MOC3 v6、离屏绘制），检查非空画面、参数变化、参数持久覆盖、GL 错误、缩放和 Pixi 叠加渲染。截图存于 `test-results/`。可设置 `PLAYWRIGHT_CHROMIUM_EXECUTABLE` 使用本机 Chromium。

25 项浏览器测试还覆盖真实计时、回调异常、Pixi stencil 遮罩、纹理上传与语音生命周期。测试环境及覆盖限制见 [验证报告](../reports/cubism-r5-validation.md)；尚未验证移动设备、Safari、Firefox 或真实 GPU 性能。

迁移保留原有参数更新顺序：动作、表情、效果、姿势、物理、用户参数覆盖。R5 新增的更新调度器不替换现有业务行为。

## 多模型生命周期

Framework 按存活/加载中的精灵计数。销毁一个精灵只释放它的模型、动作、表情、纹理和 VAO；最后一个实例结束后才释放共享 Framework。重复销毁不会重复减引用。加载中销毁会中断请求并拒绝 ready，待异步清理完成后释放实例。初始化失败也会清理已分配资源。

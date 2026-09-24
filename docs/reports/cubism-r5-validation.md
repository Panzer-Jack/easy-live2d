# Cubism R5 升级验证记录

验证日期：2026-09-17。

## 版本与资源

- 升级前：主仓库 `f271559`，Framework fork `4624e43`（源码为 R3 一代）；Core 来自用户提供的 easy-live2d-playground 仓库。
- 升级后：官方 Framework `5-r.5`，提交 `198a3769c26ca3d7b600e932590433badd392edd`；SDK 压缩包 `CubismSdkForWeb-5-r.5.zip`，运行时报告 Core `06.00.0001`。Core 自身版本号与 SDK 的 R 编号不同。
- 压缩包 SHA-256：`67064a7fb1812cf502f5c4a03bfe12cc638c75a621bb4acf06bb28763df06ba0`。
- Hiyori 的 `.moc3` 与用户提供的线上仓库文件 SHA-256 相同：`0323f5f377b9afef54318be09e9b4eea2a8cb266190ff9d2f843f95ecb77716c`。
- Core 和样例文件安装在本地且保持 Git 忽略；通过 `pnpm setup:cubism` 可恢复。

## 升级前后对比

同一浏览器、相同资源、固定随机值 0.5、固定 1/60 秒时间步。Hiyori/Haru 分别比较初始状态与动作加拖拽跟随后的状态，Haru 另比较 F02 表情。保留原有物理与参数更新顺序。

| 场景 | 模型参数最大绝对差 | PNG 文件 SHA-256 对比 |
| --- | ---: | --- |
| Hiyori 初始 | 0 | 完全一致 |
| Hiyori 动作与跟随 | 0 | 完全一致 |
| Haru 初始 | 0 | 完全一致 |
| Haru 动作与跟随 | 0 | 完全一致 |
| Haru F02 表情 | 0 | 完全一致 |

本次本地原始数据与前后截图位于 `.cache/r5-comparison/`，不作为发布资源提交。

## 浏览器回归

最初的 12 项模型回归已通过；全面优化后增加运行边界验证，见下方补充记录。

- Hiyori、Haru、Rice、Ren：模型可见、动作开始回调、参数变化且无 NaN、持久参数覆盖、缩放、Pixi 图形叠加与 GL 错误检查。
- Haru：资源 URL 重定向；Haru/Ren：表情淡入后确实改变参数。
- Ren：确认 MOC3 版本为 6，存在离屏对象，覆盖新版绘制路径。
- WebGL 1：明确拒绝加载。
- 旧 Core 能力缺失：模拟缺少 `MocVersion_53`，验证错误提示。
- 损坏模型：ready 拒绝，后续渲染不反复请求。
- 两个模型共用画布。
- 销毁一个模型后另一模型继续播放；验证模型和纹理释放；重复销毁安全；全部销毁后重新加载。
- 加载途中销毁：中断请求、拒绝 ready、清理模型，其他模型继续显示。
- 纹理请求失败：ready 拒绝而非一直等待。
- ready 事件内销毁：已完成的 ready Promise 保持成功。

截图位于 `test-results/`。本次使用 macOS 上的 Chrome 152、WebGL 2 / SwiftShader；未覆盖 Safari、Firefox、移动设备真机、真实 GPU 性能和长时间压力运行。

## 构建与静态检查

- `pnpm install --frozen-lockfile --offline`：通过。
- `pnpm build`：ESM、CJS、类型声明通过。
- `pnpm -C packages/playground build`：类型检查和构建通过；有超过 500 kB 的包体积提示。
- `pnpm docs:build`：通过。
- 修改涉及的核心代码、安装脚本、浏览器测试与测试配置 ESLint：通过。
- `git diff --check`：通过。

复现浏览器验证：先 `pnpm setup:cubism`，再 `pnpm exec playwright install chromium` 与 `pnpm test:browser`。本机已有 Chromium 时可设置 `PLAYWRIGHT_CHROMIUM_EXECUTABLE`。

本次未发布 npm 包，也未修改远程 playground 仓库。部署时需同步替换该站点的 Core 文件，详见 [迁移说明](../guide/cubism-r5-migration.md)。

## 全面优化后的补充验证

最终 **25 项 Playwright 测试全部通过（44.5 秒）**，包括原有 12 项模型回归和新增 13 项运行边界验证。核心 ESM/CJS/类型声明构建、Playground 类型与生产构建、文档构建、ESLint 和差异格式检查均通过。Ren 缩放后的截图已目视检查，模型与 Pixi 叠加图形显示正常。

原模型回归使用固定时间步并关闭语音，适合比较模型表现，但不能覆盖真实计时与音频生命周期。新增 `tests/browser/runtime.spec.ts` 补充这些场景：

- `ready` 同步回调抛错后模型仍可绘制、交互；初始化失败后指针和 resize 监听完整释放。
- 使用真实 TimeManager 和 Pixi ticker 验证首帧为 0、连续更新正常；模拟长时间后台暂停后，单次推进不超过 100ms。
- 绘制前后 stencil 状态保持一致，后续 Pixi 圆形遮罩能裁剪图形。
- 缓存纹理不再创建 Image；异步上传恢复纹理绑定、活动纹理单元、预乘透明度与 Y 翻转状态；上传异常后删除未完成的 GPU 纹理。
- 同一缓存动作再次播放时，不会沿用上次的开始或结束回调。
- 使用生成的 WAV 验证语音播放、PCM/RMS、每次播放只下载一次、多模型互不打断、`immediate: false` 保留正在播放的语音、停止/销毁和自然播放结束时释放音频。
- 延迟真实音频解码结果，验证销毁后的异步结果不会启动音频或恢复 PCM 数据。
- 已声明的配置、物理资源 HTTP 失败时，错误包含资源 URL 与状态码。
- 动态动作加载失败会释放预约优先级，重试后能正常播放。

清理内容包括无用的模型字段、重复 JSON 编码、纹理回调转 Promise 的包装、未使用的文件加载接口与依赖。`ticker` 公共字段保留并标记废弃，示例不再传入；英文安装文档同步 R5 / WebGL 2 要求。

此前的五组截图对比记录对应升级阶段的固定时间步验证；不用于宣称真实音频、真实 GPU 或所有设备表现完全一致。

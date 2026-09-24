# 本地开发与维护

## 准备环境

建议使用 Node.js 22（至少 22.13）和 `package.json` 指定的 pnpm 版本。

```bash
git clone --recursive https://github.com/Panzer-Jack/easy-live2d.git
cd easy-live2d
pnpm install --frozen-lockfile
pnpm setup:cubism
pnpm build
pnpm dev:playground
```

已有检出目录需先执行 `git submodule sync` 和 `git submodule update --init --recursive`，使用仓库固定的 Framework 提交。已有官方 R5 SDK 压缩包时，可执行 `pnpm setup:cubism /absolute/path/CubismSdkForWeb-5-r.5.zip`，安装脚本会校验 SHA-256。

Core 与模型资源不提交 Git。安装脚本准备 Web playground 的资源，不会覆盖已有 `Resources`，也不会准备 Tauri 示例资源。详见 [R5 迁移指南](docs/guide/cubism-r5-migration.md)。

## 检查改动

```bash
pnpm build
pnpm -C packages/playground build
pnpm docs:build
pnpm exec playwright install chromium
pnpm test:browser
```

浏览器测试可通过 `PLAYWRIGHT_CHROMIUM_EXECUTABLE` 指定已有 Chromium。按改动范围运行 ESLint；文档变更需同步中英文版本。已有模型验证的环境与覆盖范围见 [R5 验证记录](docs/reports/cubism-r5-validation.md)。

## 发布

发布前准备好 R5 Core，完成上述检查，并同步中英文更新日志。提交待发布的代码，保持工作区干净，在已与远端同步的 `main` 分支发布，并使用个人 Git 姓名和邮箱。

统一在仓库根目录使用 `pnpm release`。release-it 依次更新 `package.json`、构建并发布 npm 包、创建版本提交和 `v版本号` 标签、推送 Git，最后创建同名 GitHub Release。Release 说明由 GitHub 自动生成；中英文文档更新日志仍需手动维护。npm 的 `prepublishOnly` 只执行构建，不要另行运行一次 `npm publish`。

### 认证

首次发布或登录过期时，完成 npm 和 GitHub CLI 登录（已登录可跳过）：

```bash
npm login --auth-type=web --registry=https://registry.npmjs.org
gh auth login --hostname github.com
```

在执行发布的同一个终端中设置 GitHub token：

```bash
export GITHUB_TOKEN="$(gh auth token --hostname github.com)"
npm whoami --registry=https://registry.npmjs.org
gh auth status --hostname github.com
```

GitHub 账号需要有该仓库的写入权限。也可以通过环境变量提供有仓库发布权限的 personal access token，不要将 token 写入配置或提交到 Git。未设置 `GITHUB_TOKEN` 时，release-it 会退回到打开网页手动创建 Release，无法自动发布。Git 推送仍使用仓库现有的 SSH 认证。

浏览器认证（Passkey / Touch ID / 安全密钥）需要正常的交互终端。仓库使用 release-it 20.2.1 或更高的 20.x 版本，发布时由 npm 显示认证链接；按提示打开浏览器完成验证后，终端会继续发布。不要为本地浏览器认证添加 `--ci`，也不要把发布命令的输入输出重定向到管道或文件。浏览器登录成功后，发布时仍可能需要再次验证。

### 正式版

当前版本为 `1.0.0-uat.0`，准备发布 `1.0.0` 正式版时，先预演，再按确认结果执行实际发布：

```bash
pnpm release 1.0.0 --dry-run
pnpm release 1.0.0
```

实际发布时按提示确认 npm 发布、Git 提交/标签/推送和 GitHub Release；npm 要求二次验证时按提示完成。成功后核对 [npm](https://www.npmjs.com/package/easy-live2d) 和 [GitHub Releases](https://github.com/Panzer-Jack/easy-live2d/releases)。

后续可使用 `pnpm release` 交互选择版本，或使用 `pnpm release patch` / `pnpm release minor` / `pnpm release major` 分别发布修复、小版本和大版本。

### 预发布

如果还需要继续验证 1.0.0，可明确指定下一个 UAT 版本和 npm 标签：

```bash
pnpm release 1.0.0-uat.1 --npm.tag=uat --dry-run
pnpm release 1.0.0-uat.1 --npm.tag=uat
```

预发布会自动标记为 GitHub Pre-release，不会替换 GitHub 的 Latest；npm 使用 `uat` 标签，通过 `pnpm add easy-live2d@uat` 安装，不影响默认的 `latest`。实际版本号应替换为尚未发布的版本。

### 注意事项与失败恢复

- 发布目标固定为公共 npm registry。
- 正式版本默认使用 npm 的 `latest` 标签，并创建 GitHub Latest Release。
- npm 预检超时设为 120 秒（release-it 默认 10 秒），保留 registry、登录和包发布权限检查。若仍在预检阶段超时，可分别执行 `npm ping --registry=https://registry.npmjs.org`、`npm whoami --registry=https://registry.npmjs.org` 和 `npm view easy-live2d@uat version --registry=https://registry.npmjs.org` 定位慢请求；登录失效时重新执行 `npm login`，不要通过跳过认证检查来正式发布。
- dry-run 不修改版本、提交、标签或上传包，但会执行 npm 认证检查及打包预演，可能生成本地构建产物；它不触发 npm 发布的浏览器二次验证，也不验证 GitHub token 的实际发布权限。由于版本修改被跳过，打包预演可能仍显示当前旧版本。
- 正常发布保留 release-it 的干净工作区检查；不要照搬验证配置时临时使用的跳过检查参数。
- 直接执行 `npm publish` 只会构建并发布当前版本，不会自动升版。
- npm 认证阶段取消发布时，release-it 可能自动还原本次版本修改。重试前先检查 `package.json`、Git 标签和 npm 上的版本：若已还原到旧版本，重新执行原发布命令；若目标版本已保留并提交、但尚未发布且没有对应 Git 标签，使用 `pnpm release --no-increment` 继续当前版本。
- 若发布在 npm 上传后、Git 推送前中断，应先核对 registry 和 Git 状态，再恢复缺失步骤，避免重复升版或重复上传。
- 若 npm 发布和 Git 标签推送均已成功，只缺 GitHub Release，可在确认对应 Release 尚不存在后，执行 `gh release create v1.0.0 --verify-tag --title v1.0.0 --generate-notes` 补建（替换为实际版本；预发布需加 `--prerelease`）。不要重新执行完整发布流程。
- `.github/workflows/deploy.yml` 只部署文档站点；推送到 `main` 会触发文档部署，普通推送不会发布 npm 包或创建 GitHub Release。

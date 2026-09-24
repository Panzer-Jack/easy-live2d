# easy-live2d Web Playground

Vue 3 / Vite sample for the current Cubism R5 implementation. Run the setup commands from the **repository root**:

```bash
git submodule sync
git submodule update --init --recursive
pnpm install --frozen-lockfile
pnpm setup:cubism
pnpm build
pnpm dev:playground
```

The setup script installs R5 Core at `public/Core` and official models at `public/SdkResources` inside this package. The sample uses Hiyori and Haru. Core and model assets are git-ignored; prepare them again after a fresh clone. They remain subject to their official licenses.

Pixi defaults to WebGL 2. No extra renderer options or `ticker` argument are needed. The renderer requires WebGL 2 and matching R5 Core. Await `sprite.ready` to handle loading failure; destroy sprites when their owning view is removed.

## Build and Test

From the repository root:

```bash
pnpm -C packages/playground build
pnpm exec playwright install chromium
pnpm test:browser
```

The browser suite has 25 tests covering four models, rendering, failures, timing, texture state, and voice lifecycles. Set `PLAYWRIGHT_CHROMIUM_EXECUTABLE` to use an existing Chromium browser. Regression resources are separate from the normal Vue UI.

- [R5 migration](../../docs/en/guide/cubism-r5-migration.md)
- [Validation report](../../docs/reports/cubism-r5-validation.md)
- [Public API](../../docs/en/api/index.md)

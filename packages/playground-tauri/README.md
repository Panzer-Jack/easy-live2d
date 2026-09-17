# easy-live2d Tauri Sample

Vue 3 / Tauri 2 desktop integration example. This sample uses the current library API but **has not been validated as a packaged Tauri application in the R5 browser regression run**. Its WebView must provide WebGL 2.

## Prepare the Workspace

Run from the repository root:

```bash
git submodule sync
git submodule update --init --recursive
pnpm install --frozen-lockfile
pnpm setup:cubism
pnpm build
```

`setup:cubism` prepares Core and assets for the web playground, not this package. Before running this sample:

1. Place R5 `live2dcubismcore.js` at `packages/playground-tauri/public/Core/live2dcubismcore.js`, matching the script URL in `index.html`.
2. Supply the model assets referenced by `src/App.vue`: `/Resources/Hiyori/Hiyori.model3.json` and `/Resources/Cub3/ING.model3.json`. The Cub3 model is not included in the official SDK. Alternatively, update the sample paths and `prefixPath` to models you provide.
3. Prepare the Rust and platform tooling required by Tauri before launching the native application.

Core and model assets retain their own licenses. Pixi selects WebGL 2 by default; `ticker` is not required by Live2DSprite. Handle initialization failures through `sprite.ready`, and release sprites and the host Pixi Application when their view is removed.

## Commands

From the repository root:

```bash
# Browser frontend preview
pnpm -C packages/playground-tauri dev

# Native desktop development (requires Tauri platform setup)
pnpm -C packages/playground-tauri tauri dev
```

See the [R5 migration guide](../../docs/en/guide/cubism-r5-migration.md) and [browser validation scope](../../docs/reports/cubism-r5-validation.md).

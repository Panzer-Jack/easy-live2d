# Cubism R5 Migration

This branch uses **Cubism 5 SDK for Web R5** (2026-04-02). Framework is pinned to the official `5-r.5` tag, commit `198a376`. Core and Framework must be upgraded together. The changes are pending release, with `1.0.0-uat.0` as the planned version; the local package version remains `0.4.4`.

## Application Upgrade

1. Replace your deployed Core script with R5's `Core/live2dcubismcore.js` or minified equivalent, and update its cache version.
2. Upgrade easy-live2d to the matching R5 implementation. Pixi defaults to WebGL 2, so no extra renderer options are required. Remove any explicit WebGL 1 or WebGPU selection.
3. Add the sprite to the stage, then await `sprite.ready` inside `try/catch`. Loading errors reject instead of retrying each frame. If the Pixi ticker is stopped, call `app.render()` to trigger loading.
4. The 13 official R5 shaders are bundled into the library. No separate Shaders deployment is needed.

The `ticker` argument is unused and retained only for compatibility. Model updates follow Pixi rendering. The first time step is zero, and long pauses advance at most 100ms per update.

Optional resources absent from model settings are skipped. Resources declared in the settings must load successfully; HTTP failures include the URL and status. Synchronous ready listener errors are logged without destroying the model. Handle rejections inside async listeners yourself.

Older `.moc3` files do not need to be re-exported solely for this SDK upgrade. Recheck motions, expressions, physics, clipping, color, sizing, and pointer interaction. Cubism 2 `.moc` files are unsupported. To retain an older SDK/Core, use the previously validated `0.4.4` package/Core combination; that version does not guarantee every historical SDK combination.

## Local Development and Verification

Run from the repository root:

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

An existing official archive can be used with `pnpm setup:cubism /absolute/path/CubismSdkForWeb-5-r.5.zip`. The script verifies SHA-256, installs Core in `packages/cubism/Core` and `packages/playground/public/Core`, and installs official models under `packages/playground/public/SdkResources`. It does not overwrite an existing `Resources` directory or prepare Tauri assets. The installer uses `curl` and `unzip`. Core and model assets remain git-ignored and subject to their own licenses.

The 25 browser tests cover Hiyori, Haru, Rice, Ren, real timing, callback errors, Pixi stencil masks, texture uploads, and voice lifecycles. Screenshots are stored under `test-results/`. Set `PLAYWRIGHT_CHROMIUM_EXECUTABLE` to use an existing Chromium executable. See the [validation report (Chinese)](../../reports/cubism-r5-validation.md) for measurements and limitations. Mobile devices, Safari, Firefox, and real GPU performance have not been validated.

## Shared Resources and Destruction

Each sprite owns its model, motions, expressions, textures, VAO, and voice resources. Destroying one sprite preserves the others. Shared Framework resources are released only when the last active/loading sprite finishes. Repeated destruction is safe; destruction during loading cancels requests and rejects unresolved readiness.

Playback and lip sync share one audio download/decode. Stop/destroy only affects the owning sprite and prevents pending operations from starting audio later. `immediate: false` preserves voices already playing on that sprite; a newer pending request replaces an older pending request.

The update order remains motions, expressions, effects, pose, physics, then user parameter overrides. The new R5 update scheduler does not replace that behavior.

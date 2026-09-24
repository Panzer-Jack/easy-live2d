# Changelog

User-facing changes to easy-live2d, listed by version in descending order. Historical entries are reconstructed from repository tags and commits. Dates refer to the tagged commits, not necessarily npm publication dates.

## Unreleased — planned 1.0.0-uat.0

Pending Cubism R5 upgrade and runtime fixes. The local package version is still `0.4.4`; this work has not performed a release.

### Compatibility

- Upgrade Core, Framework, and the integration layer together to Cubism 5 SDK for Web R5. Framework is pinned to the official `5-r.5` tag (`198a376`).
- Require WebGL 2, with no WebGL 1 fallback. Replace the deployed Core file and update its cache version when upgrading.
- Existing `.moc3` models do not need to be re-exported solely for this SDK upgrade. See the [R5 migration guide](./guide/cubism-r5-migration.md).

### Added

- Bundle the official R5 shaders into the library; no separate Shaders directory deployment is required.
- Add `pnpm setup:cubism` to verify and install pinned Core and official sample resources.
- Add browser regression coverage for older models, offscreen rendering, multiple models, and loading failures.
- Add Chinese and English changelogs with documentation navigation links.

### Fixed

- Keep the shared Framework alive when one model is destroyed while others remain; allow loading again after all models are destroyed.
- Clean up resources on destruction during loading, repeated destruction, and initialization failure; cancel requests when destroyed during loading.
- Reject `ready` when model or texture loading fails instead of waiting indefinitely or retrying every frame. Destruction inside the ready event preserves the successful Promise result.
- Restore WebGL state and synchronize Pixi caches after Cubism rendering to fix overlay rendering.

- Keep loaded models alive when synchronous ready listeners throw; fully remove interaction and resize listeners after initialization failures.
- Restore stencil and texture-upload state, and delete incomplete GPU textures on upload errors.
- Initialize the first frame with a zero time step and bound updates after long pauses to 100ms.
- Give each sprite independent voice resources. Share one download/decode for playback and lip sync, cancel pending work on stop/destroy, and release completed sounds.
- Clear callbacks when replaying cached motions; release priority reservations after dynamic loading failures.
- Report URLs and HTTP status for failed resources declared in model settings.

### Simplified

- Reuse cached textures directly and remove redundant loading wrappers, unused model fields, duplicate JSON encoding, and unused runtime dependencies.
- Deprecate the unused `ticker` field while preserving compatibility; remove it from examples. Pixi defaults to WebGL 2 without extra renderer options.
- Synchronize both languages of README, guides, API docs, and migration instructions; update sample READMEs.
- Align package metadata and documentation with the root MIT `LICENSE` for project code; retain third-party licenses.

### Validation

- All 25 browser tests pass: 12 model regressions and 13 runtime edge cases. The upgrade-stage fixed-step comparisons for Hiyori and Haru produced five matching screenshot/parameter pairs; these comparisons do not cover audio or all devices.
- Ren offscreen rendering passes. See the [validation report (Chinese)](../reports/cubism-r5-validation.md) for the environment and coverage limits.

## 0.4.4 — 2026-04-15

- Guard missing motion groups and debounce idle motion requests to prevent per-frame Promise rejection floods.

## 0.4.3 — 2026-04-11

- Automatically play motion sounds, controlled by `Config.MotionSound`.
- Support motion sound URLs in `redirectPath` and add the missing `MotionSounds` field to the default redirect structure.
- Add parameter value methods to `Live2DSprite`; make `setParameterValueById` / `setParameterValueByIndex` overrides persist across frames.
- Document parameter control, motion sounds, and local Core / submodule setup.

## 0.4.2 — 2026-04-09

- Add the Promise-based `sprite.ready` API for awaiting model loading.
- Add methods for retrieving model motions and expressions.
- Support selecting expressions by index.

## 0.4.1 — 2026-04-09

- Add `Config.crossOrigin` to configure cross-origin WebGL texture loading.
- Fix the package version format and document the new configuration.

## 0.4.0 — 2026-04-04

- Refactor the core integration around `Live2DSprite` and Pixi.
- Convert Cubism Framework to a Git submodule.
- Update the audio loader to support general audio decoding.
- Add a Vue-based Tauri sample application.

## 0.4.0-1 — 2025-06-14

- Continue refactoring model rendering.

## 0.4.0-0 — 2025-06-14

- Refactor rendering inside `onRender`.

## 0.3.3 — 2025-06-14

- Fix resource redirection through `redirectPath`.

## 0.3.2 — 2025-06-07

- Adjust the parameter weight used for voice lip sync.

## 0.3.1 — 2025-06-07

- Add `redirectPath` to override default model resource paths.

## 0.3.0 — 2025-06-02

- Add model initialization using model configuration content.

## 0.2.1 / 0.2.0 — 2025-05-19

- Add character voice playback and lip sync.
- Both tags point to the same commit, with no separate code changes between them.

## 0.1.1 — 2025-05-05

- Adjust package configuration; the available tag records do not describe a separate feature update.

## 0.1.0 — 2025-05-05

- Early version tag providing a basic Live2D Web wrapper.

## Maintaining this page

Add changes under Unreleased, using Compatibility, Added, Fixed, and Documentation as needed. At release time, move the entries under the actual version and date, and update the Chinese changelog as well. Describe user-visible changes, migration steps, and relevant validation. Keep unreleased changes out of existing version entries.

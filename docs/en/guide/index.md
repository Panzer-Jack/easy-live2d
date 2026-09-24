# What Is easy-live2d

`easy-live2d` is a Live2D Web library built around `Live2DSprite`, compressing the common Live2D integration path into a concise user-facing API.

Public entry points for application code:

- `Live2DSprite`: Load models, attach to a Pixi stage, handle hit and drag interaction, control motions, expressions, and voice.
- `Config`: Global runtime configuration — mouse follow, idle motion group, logging level, view bounds.
- `CubismSetting`: Use when you want to provide `model3.json` content manually or rewrite asset URLs.

## What It Solves

Using the official Cubism Web SDK directly means handling resource organization, render initialization, coordinate transforms, hit testing, motion management, and Pixi integration yourself. `easy-live2d` reduces that work by:

- Wrapping the model as a Pixi `Sprite` that fits into existing Pixi render pipelines.
- Exposing a small set of APIs for common interactions.
- Preserving control over model paths, asset redirection, and global behavior.

## Usage Model

1. You create the Pixi `Application` and `canvas`.
2. You load `live2dcubismcore.js` from Cubism 5 SDK for Web R5 in your entry HTML.
3. You create `Live2DSprite` with either `modelPath` or `modelSetting`.
4. You add it to `app.stage` and await `sprite.ready` inside `try/catch` to handle readiness or loading failure.

It behaves as a Live2D component hosted by Pixi, not a framework that owns the entire render lifecycle.

## Good Fit Scenarios

- Pixi.js projects that need quick Live2D integration.
- Apps requiring hit-area clicks, dragging, motion switching, expression switching, and voice playback.
- CSR projects in Vue, React, or similar stacks reusing the same runtime wrapper.

## Runtime Requirements

This guide covers the easy-live2d 1.0.0 API and R5 runtime. Read the [R5 migration guide](/en/guide/cubism-r5-migration) before upgrading an existing project.

- Browser environment (depends on `document`, `fetch`, `Image`, `ResizeObserver`, `AudioContext`).
- Pixi.js + WebGL 2.
- Official Cubism 5 SDK for Web R5 Core script.

Not intended for SSR. Initialize on the client side.

## Licensing

- Project code is licensed under [MIT](https://github.com/Panzer-Jack/easy-live2d/blob/main/LICENSE).
- Live2D Cubism Core and model assets follow their own official licensing and distribution requirements.

Next: [Installation](/en/guide/installation) → [Getting Started](/en/guide/getting-started).

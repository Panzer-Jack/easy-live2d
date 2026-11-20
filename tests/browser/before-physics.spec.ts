import type { Live2DFrameParameters } from 'easy-live2d'
import { expect, test } from '@playwright/test'

const modelPath = '/SdkResources/Hiyori/Hiyori.model3.json'

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    Math.random = () => 0.5
  })
  await page.goto('/regression/')
  await page.waitForFunction(() => !!(window as any).regression)
})

test('layered head turns drive Hiyori hair physics while final overrides preserve their priority', async ({ page }) => {
  const result = await page.evaluate(async (path) => {
    const { app, Live2DSprite } = (window as any).regression
    const sprites = Array.from({ length: 3 }, () => new Live2DSprite({ modelPath: path }))
    for (const sprite of sprites) {
      sprite._ctx.timeManager.update = () => {}
      app.stage.addChild(sprite)
    }
    app.render()
    await Promise.all(sprites.map(sprite => sprite.ready))
    await Promise.all(sprites.map(sprite => sprite.startMotion({ ...sprite.getMotions()[0], priority: 3 })))

    const [reference, layered, overridden] = sprites
    const [base, early, late] = sprites.map(sprite => sprite._model.getModel().getModel().parameters)
    const head = base.ids.indexOf('ParamAngleX')
    const hair = base.ids.indexOf('ParamHairFront')
    let offset = 0
    let inputHead = 0
    let poseHead = 0
    let count = 0
    let playing = true
    layered.onBeforePhysics((frame: Live2DFrameParameters) => {
      count++
      playing &&= !frame.isMotionFinished()
      inputHead = frame.getParameterValueById('ParamAngleX')!
      frame.addParameterValueById('ParamAngleX', offset)
    })
    const pose = layered._model._pose
    const updatePose = pose.updateParameters.bind(pose)
    pose.updateParameters = (...args: unknown[]) => {
      poseHead = early.values[head]
      updatePose(...args)
    }

    let inputDifference = 0
    let poseDifference = 0
    let finalDifference = 0
    let layeredHairDifference = 0
    let overriddenHairDifference = 0
    for (let i = 0; i < 120; i++) {
      offset = 12 * Math.sin(2 * Math.PI * i / 90)
      reference._model.update(1 / 60)
      layered._model.update(1 / 60)
      overridden.setParameterValueById('ParamAngleX', base.values[head] + offset)
      overridden._model.update(1 / 60)

      inputDifference = Math.max(inputDifference, Math.abs(inputHead - base.values[head]))
      poseDifference = Math.max(poseDifference, Math.abs(poseHead - late.values[head]))
      finalDifference = Math.max(finalDifference, Math.abs(early.values[head] - late.values[head]))
      layeredHairDifference = Math.max(layeredHairDifference, Math.abs(early.values[hair] - base.values[hair]))
      overriddenHairDifference = Math.max(overriddenHairDifference, Math.abs(late.values[hair] - base.values[hair]))
    }
    layered.onBeforePhysics(null)
    reference._model.update(1 / 60)
    layered._model.update(1 / 60)
    const restored = early.values[head] - base.values[head]
    return { count, playing, inputDifference, poseDifference, finalDifference, layeredHairDifference, overriddenHairDifference, restored }
  }, modelPath)

  expect(result).toMatchObject({ count: 120, playing: true, inputDifference: 0, poseDifference: 0, finalDifference: 0, overriddenHairDifference: 0, restored: 0 })
  expect(result.layeredHairDifference).toBeGreaterThan(0.01)
})

test('registration during load, scoped parameter writes and callback errors work without a physics rig', async ({ page }) => {
  await page.route('**/Hiyori.model3.json', async (route) => {
    const response = await route.fetch()
    const json = await response.json()
    delete json.FileReferences.Pose
    delete json.FileReferences.Physics
    await route.fulfill({ json })
  })
  const diagnostics: string[] = []
  page.on('console', message => diagnostics.push(message.text()))
  const result = await page.evaluate(async (path) => {
    const { app, Live2DSprite } = (window as any).regression
    const sprite = new Live2DSprite({ modelPath: path })
    sprite._ctx.timeManager.update = () => {}
    let replacedCalls = 0
    sprite.onBeforePhysics(() => replacedCalls++)
    app.stage.addChild(sprite)
    app.render()

    const deltas: number[] = []
    let retained!: Live2DFrameParameters
    let weighted: number | null = null
    let missing: number | null = null
    let idle = false
    sprite.onBeforePhysics((frame: Live2DFrameParameters, deltaTime: number) => {
      retained = frame
      deltas.push(deltaTime)
      idle = frame.isMotionFinished()
      frame.setParameterValueById('ParamAngleX', 2)
      frame.setParameterValueById('ParamAngleX', 10, 0.5)
      frame.addParameterValueById('ParamAngleX', 4, 0.25)
      weighted = frame.getParameterValueById('ParamAngleX')
      frame.setParameterValueById('MissingParameter', 7)
      frame.addParameterValueById('MissingParameter', 2)
      missing = frame.getParameterValueById('MissingParameter')
      if (deltas.length === 1)
        throw new Error('consumer failure')
    })
    await sprite.ready
    sprite.setParameterValueById('ParamAngleX', -8)
    sprite._ctx.timeManager._deltaTime = 1 / 60
    app.render()
    retained.setParameterValueById('ParamAngleX', 30)
    const afterCallback = retained.getParameterValueById('ParamAngleX')
    const { values, ids } = sprite._model.getModel().getModel().parameters
    const finalHead = values[ids.indexOf('ParamAngleX')]
    sprite.onBeforePhysics(null)
    app.render()
    return { replacedCalls, deltas, idle, weighted, missing, afterCallback, finalHead, ready: sprite._model.isReady }
  }, modelPath)

  expect(result).toEqual({ replacedCalls: 0, deltas: [0, 1 / 60], idle: true, weighted: 7, missing: null, afterCallback: null, finalHead: -8, ready: true })
  expect(diagnostics.filter(message => message.includes('onBeforePhysics callback failed'))).toHaveLength(1)
})

test('a sprite can be destroyed inside its frame callback', async ({ page }) => {
  const destroyed = await page.evaluate(async (path) => {
    const r = (window as any).regression
    await r.load(path)
    const sprite = r.sprites[0]
    sprite.onBeforePhysics((frame: Live2DFrameParameters) => {
      sprite.destroy()
      frame.addParameterValueById('ParamAngleX', 1)
    })
    await sprite.renderFrame(r.app.renderer)
    return sprite.destroyed && sprite._model === null
  }, modelPath)
  expect(destroyed).toBe(true)
})

import { expect, test } from '@playwright/test'

for (const name of ['Hiyori', 'Haru', 'Rice', 'Ren']) {
  test(`${name}: renders, animates, resizes and shares the Pixi context`, async ({ page }, testInfo) => {
    const errors: string[] = []
    page.on('pageerror', e => errors.push(e.message))
    page.on('console', (msg) => {
      if (msg.type() === 'error')
        errors.push(msg.text())
    })
    await page.addInitScript(() => {
      Math.random = () => 0.5
    })
    await page.goto('/regression/')
    await page.waitForFunction(() => !!(window as any).regression)
    const info = await page.evaluate(name => (window as any).regression.load(`/SdkResources/${name}/${name}.model3.json`, name === 'Haru'), name)
    expect(info.size.width).toBeGreaterThan(0)
    if (name === 'Ren') {
      expect(info.mocVersion).toBe(6)
      expect(info.offscreens).toBeGreaterThan(0)
    }
    const initial = await page.evaluate(() => (window as any).regression.step(30))
    expect(initial.visible).toBeGreaterThan(10000)
    expect(initial.error).toBe(0)
    await page.screenshot({ path: testInfo.outputPath(`${name}-initial.png`) })
    await page.evaluate(async () => {
      const r = (window as any).regression
      await r.motion()
      r.drag(0.7, -0.5)
    })
    const moved = await page.evaluate(() => (window as any).regression.step(120))
    expect(moved.parameters).not.toEqual(initial.parameters)
    expect(moved.parameters.every(Number.isFinite)).toBe(true)
    expect(moved.error).toBe(0)
    expect(moved.began).toBe(1)
    if (info.expressions.length) {
      const applied = await page.evaluate(() => (window as any).regression.expression())
      expect(applied.after).not.toEqual(applied.before)
      const expression = await page.evaluate(() => (window as any).regression.step(60))
      expect(expression.parameters).not.toEqual(moved.parameters)
    }
    await page.evaluate(() => {
      const r = (window as any).regression
      r.override()
      r.resize()
      r.overlay()
    })
    const resized = await page.evaluate(() => (window as any).regression.step(60))
    expect(resized.parameters[0]).toBe(7)
    expect(resized.visible).toBeGreaterThan(10000)
    expect(resized.error).toBe(0)
    const red = await page.evaluate(() => {
      const gl = (window as any).regression.app.renderer.gl
      const pixel = new Uint8Array(4)
      gl.readPixels(10, gl.drawingBufferHeight - 10, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, pixel)
      return Array.from(pixel)
    })
    expect(red).toEqual([255, 0, 0, 255])
    await page.screenshot({ path: testInfo.outputPath(`${name}-resized.png`) })
    await testInfo.attach('measurements', { body: JSON.stringify({ info, initial, moved, resized }, null, 2), contentType: 'application/json' })
    expect(errors).toEqual([])
  })
}

test('WebGL 1 rejects ready instead of rendering or retrying', async ({ page }) => {
  await page.goto('/regression/?webgl1')
  await page.waitForFunction(() => !!(window as any).regression)
  const error = await page.evaluate(async () => {
    try {
      await (window as any).regression.load('/SdkResources/Hiyori/Hiyori.model3.json')
      return null
    } catch (error) {
      return String(error)
    }
  })
  expect(error).toContain('WebGL 2')
})

test('old Core capability is rejected with an actionable message', async ({ page }) => {
  await page.goto('/regression/')
  await page.waitForFunction(() => !!(window as any).regression)
  const error = await page.evaluate(async () => {
    delete (window as any).Live2DCubismCore.MocVersion_53
    try {
      await (window as any).regression.load('/SdkResources/Hiyori/Hiyori.model3.json')
      return null
    } catch (error) {
      return String(error)
    }
  })
  expect(error).toContain('R5 Core')
})

test('invalid model rejects ready and is not fetched again on each frame', async ({ page }) => {
  let attempts = 0
  await page.route('**/Hiyori.moc3', (route) => {
    attempts++
    return route.fulfill({ body: 'invalid moc', contentType: 'application/octet-stream' })
  })
  await page.goto('/regression/')
  await page.waitForFunction(() => !!(window as any).regression)
  const error = await page.evaluate(async () => {
    const r = (window as any).regression
    try {
      await r.load('/SdkResources/Hiyori/Hiyori.model3.json')
      return null
    } catch (error) {
      for (let i = 0; i < 10; i++) r.app.render()
      return String(error)
    }
  })
  expect(error).toBeTruthy()
  expect(attempts).toBe(1)
})

test('two models share one canvas', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', e => errors.push(e.message))
  await page.goto('/regression/')
  await page.waitForFunction(() => !!(window as any).regression)
  await page.evaluate(async () => {
    const r = (window as any).regression
    await r.load('/SdkResources/Hiyori/Hiyori.model3.json')
    await r.load('/SdkResources/Haru/Haru.model3.json')
    r.sprites[0].width = 320
    r.sprites[1].width = 320
    r.sprites[1].x = 320
  })
  const result = await page.evaluate(() => {
    const r = (window as any).regression
    const state = r.step(60)
    return { ...state, ready: r.sprites.every((s: any) => s._model.isReady) }
  })
  expect(result.ready).toBe(true)
  expect(result.visible).toBeGreaterThan(10000)
  expect(result.error).toBe(0)
  expect(errors).toEqual([])
})

test('destroying one model preserves the survivor; last destroy allows reinitialization', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', e => errors.push(e.message))
  await page.goto('/regression/')
  await page.waitForFunction(() => !!(window as any).regression)
  const result = await page.evaluate(async () => {
    const r = (window as any).regression
    await r.load('/SdkResources/Hiyori/Hiyori.model3.json')
    await r.load('/SdkResources/Haru/Haru.model3.json')
    const first = r.sprites.shift()
    const nativeModel = first._model
    const gl = r.app.renderer.gl
    const texture = first._textureLoader._textures[0].id
    first.destroy()
    first.destroy() // 重复销毁不重复减引用。
    const survivor = r.step(60)
    r.expression()
    await r.motion()
    const animated = r.step(120)
    const released = nativeModel._moc === null && !gl.isTexture(texture)
    r.sprites.shift().destroy()
    await r.load('/SdkResources/Hiyori/Hiyori.model3.json')
    return { survivor, animated, released, restarted: r.step(30) }
  })
  expect(result.released).toBe(true)
  expect(result.survivor.visible).toBeGreaterThan(10000)
  expect(result.animated.parameters).not.toEqual(result.survivor.parameters)
  expect(result.animated.error).toBe(0)
  expect(result.restarted.visible).toBeGreaterThan(10000)
  expect(result.restarted.error).toBe(0)
  expect(errors).toEqual([])
})

test('destroy during loading cancels work without reviving the sprite or breaking another model', async ({ page }) => {
  let releaseRequest!: () => void
  const held = new Promise<void>((resolve) => {
    releaseRequest = resolve
  })
  await page.route('**/Haru.moc3', async (route) => {
    await held
    await route.abort().catch(() => {})
  })
  await page.goto('/regression/')
  await page.waitForFunction(() => !!(window as any).regression)
  await page.evaluate(() => (window as any).regression.load('/SdkResources/Hiyori/Hiyori.model3.json'))
  const requested = page.waitForRequest('**/Haru.moc3')
  await page.evaluate(() => {
    const r = (window as any).regression
    r.pending = r.load('/SdkResources/Haru/Haru.model3.json').catch(String)
  })
  await requested
  const result = await page.evaluate(async () => {
    const r = (window as any).regression
    r.removed = r.sprites.pop()
    r.removed.destroy()
    return await r.pending
  })
  releaseRequest()
  expect(result).toContain('destroyed')
  await page.waitForFunction(() => (window as any).regression.removed._model === null)
  const state = await page.evaluate(() => (window as any).regression.step(60))
  expect(state.visible).toBeGreaterThan(10000)
  expect(state.error).toBe(0)
})

test('a missing texture rejects ready instead of leaving loading pending', async ({ page }) => {
  await page.route('**/texture_00.png', route => route.fulfill({ status: 404, body: '' }))
  await page.goto('/regression/')
  await page.waitForFunction(() => !!(window as any).regression)
  const error = await page.evaluate(async () => {
    try {
      await (window as any).regression.load('/SdkResources/Hiyori/Hiyori.model3.json')
      return null
    } catch (error) {
      return String(error)
    }
  })
  expect(error).toContain('Failed to load texture')
})

test('destroying from the ready event preserves the resolved ready promise', async ({ page }) => {
  await page.goto('/regression/')
  await page.waitForFunction(() => !!(window as any).regression)
  const result = await page.evaluate(() => (window as any).regression.load('/SdkResources/Hiyori/Hiyori.model3.json', false, true))
  expect(result.destroyed).toBe(true)
})

import { Buffer } from 'node:buffer'
import { expect, test } from '@playwright/test'

const modelPath = '/SdkResources/Hiyori/Hiyori.model3.json'

function wave(seconds = 3): Buffer {
  const rate = 8000
  const samples = Math.round(rate * seconds)
  const data = Buffer.alloc(44 + samples * 2)
  data.write('RIFF', 0)
  data.writeUInt32LE(data.length - 8, 4)
  data.write('WAVEfmt ', 8)
  data.writeUInt32LE(16, 16)
  data.writeUInt16LE(1, 20)
  data.writeUInt16LE(1, 22)
  data.writeUInt32LE(rate, 24)
  data.writeUInt32LE(rate * 2, 28)
  data.writeUInt16LE(2, 32)
  data.writeUInt16LE(16, 34)
  data.write('data', 36)
  data.writeUInt32LE(samples * 2, 40)
  for (let i = 0; i < samples; i++)
    data.writeInt16LE(Math.round(Math.sin(i * 440 * 2 * Math.PI / rate) * 8000), 44 + i * 2)
  return data
}

test.beforeEach(async ({ page }) => {
  await page.goto('/regression/')
  await page.waitForFunction(() => !!(window as any).regression)
  await page.evaluate(path => (window as any).regression.load(path), modelPath)
})

test('ready listener errors leave the loaded model usable', async ({ page }) => {
  const errors: string[] = []
  const diagnostics: string[] = []
  page.on('pageerror', e => errors.push(e.message))
  page.on('console', msg => diagnostics.push(msg.text()))
  const result = await page.evaluate(async (path) => {
    const r = (window as any).regression
    const sprite = new r.Live2DSprite({ modelPath: path })
    sprite.onLive2D('ready', () => {
      throw new Error('consumer failure')
    })
    r.app.stage.addChild(sprite)
    r.app.render()
    await sprite.ready
    r.app.render()
    document.dispatchEvent(new PointerEvent('pointerup', { clientX: 10, clientY: 10 }))
    sprite.onResize()
    const result = { ready: sprite._model.isReady, failed: sprite._renderFailed, error: r.app.renderer.gl.getError() }
    sprite.destroy()
    return result
  }, modelPath)
  expect(result).toEqual({ ready: true, failed: false, error: 0 })
  expect(diagnostics.some(s => s.includes('ready listener failed'))).toBe(true)
  expect(errors).toEqual([])
})

test('initialization failure removes interaction and resize listeners', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', e => errors.push(e.message))
  const result = await page.evaluate(async (path) => {
    const r = (window as any).regression
    const sprite = new r.Live2DSprite({ modelPath: path })
    const initialize = sprite.initInteraction.bind(sprite)
    sprite.initInteraction = () => {
      initialize()
      throw new Error('interaction initialization failed')
    }
    r.app.stage.addChild(sprite)
    r.app.render()
    const error = await sprite.ready.then(() => '', String)
    document.dispatchEvent(new PointerEvent('pointerup', { clientX: 10, clientY: 10 }))
    const released = sprite._pointerHandler === null && sprite._resizeObserver === null && sprite._model === null
    sprite.destroy()
    return { error, released }
  }, modelPath)
  expect(result.error).toContain('interaction initialization failed')
  expect(result.released).toBe(true)
  expect(errors).toEqual([])
})

test('native timing starts at zero and bounds long pauses while Pixi drives updates', async ({ page }) => {
  const first = await page.evaluate(async (path) => {
    const r = (window as any).regression
    const sprite = new r.Live2DSprite({ modelPath: path })
    r.app.stage.addChild(sprite)
    r.app.render()
    await sprite.ready
    const timer = sprite._ctx.timeManager
    const first = timer.deltaTime
    timer.lastFrame -= 60000 // 模拟后台恢复，不替换计时实现。
    r.app.render()
    const resumed = timer.deltaTime
    const update = sprite._model.update.bind(sprite._model)
    r.nativeDeltas = []
    sprite._model.update = (delta: number) => {
      r.nativeDeltas.push(delta)
      update(delta)
    }
    r.nativeSprite = sprite
    r.app.start()
    return { first, resumed }
  }, modelPath)
  expect(first.first).toBe(0)
  expect(first.resumed).toBeGreaterThan(0)
  expect(first.resumed).toBeLessThanOrEqual(0.1)
  await page.waitForFunction(() => (window as any).regression.nativeDeltas.length >= 5)
  const deltas = await page.evaluate(() => {
    const r = (window as any).regression
    r.app.stop()
    r.nativeSprite.destroy()
    return r.nativeDeltas as number[]
  })
  expect(deltas.every(value => value >= 0 && value <= 0.1)).toBe(true)
  expect(deltas.some(value => value > 0)).toBe(true)
})

test('Cubism restores stencil and Pixi masks still clip subsequent graphics', async ({ page }) => {
  const result = await page.evaluate(() => {
    const r = (window as any).regression
    const sprite = r.sprites[0]
    const gl = r.app.renderer.gl
    gl.enable(gl.STENCIL_TEST)
    sprite.update(sprite.getRenderViewport())
    const restored = gl.isEnabled(gl.STENCIL_TEST)
    gl.disable(gl.STENCIL_TEST)
    const mask = new r.Pixi.Graphics().circle(600, 30, 10).fill(0xFFFFFF)
    const square = new r.Pixi.Graphics().rect(580, 10, 40, 40).fill(0xFF0000)
    square.mask = mask
    r.app.stage.addChild(square, mask)
    r.app.render()
    const pixel = (x: number, y: number) => {
      const value = new Uint8Array(4)
      gl.readPixels(x, gl.drawingBufferHeight - y, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, value)
      return Array.from(value)
    }
    return { restored, inside: pixel(600, 30), outside: pixel(583, 13), error: gl.getError() }
  })
  expect(result.restored).toBe(true)
  expect(result.inside).toEqual([255, 0, 0, 255])
  expect(result.outside).not.toEqual([255, 0, 0, 255])
  expect(result.error).toBe(0)
})

test('cached textures skip image loading; async uploads preserve shared GL state', async ({ page }) => {
  const result = await page.evaluate(async () => {
    const r = (window as any).regression
    const loader = r.sprites[0]._textureLoader
    const cached = loader._textures[0]
    const ImageCtor = window.Image
    let images = 0
    window.Image = class extends ImageCtor {
      constructor() {
        super()
        images++
      }
    }
    const hit = await loader.load(cached.fileName, true)
    window.Image = ImageCtor
    const gl = r.app.renderer.gl
    const binding = gl.createTexture()
    gl.activeTexture(gl.TEXTURE3)
    gl.bindTexture(gl.TEXTURE_2D, binding)
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, 0)
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1)
    await loader.load(`${cached.fileName}?upload`, true)
    const result = {
      images,
      sameTexture: hit.id === cached.id,
      binding: gl.getParameter(gl.TEXTURE_BINDING_2D) === binding,
      premultiply: gl.getParameter(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL),
      flipY: gl.getParameter(gl.UNPACK_FLIP_Y_WEBGL),
      active: gl.getParameter(gl.ACTIVE_TEXTURE) === gl.TEXTURE3,
      error: gl.getError(),
    }
    gl.deleteTexture(binding)
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 0)
    return result
  })
  expect(result).toEqual({ images: 0, sameTexture: true, binding: true, premultiply: false, flipY: true, active: true, error: 0 })
})

test('texture upload errors restore state and delete the incomplete GPU texture', async ({ page }) => {
  const result = await page.evaluate(async () => {
    const r = (window as any).regression
    const loader = r.sprites[0]._textureLoader
    const gl = r.app.renderer.gl
    const binding = gl.createTexture()
    gl.bindTexture(gl.TEXTURE_2D, binding)
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, 0)
    const upload = gl.texImage2D.bind(gl)
    let incomplete: WebGLTexture | null = null
    gl.texImage2D = () => {
      incomplete = gl.getParameter(gl.TEXTURE_BINDING_2D)
      throw new DOMException('upload denied', 'SecurityError')
    }
    const error = await loader.load(`${loader._textures[0].fileName}?failure`, true).then(() => '', String)
    gl.texImage2D = upload
    const result = { error, deleted: !gl.isTexture(incomplete), binding: gl.getParameter(gl.TEXTURE_BINDING_2D) === binding, premultiply: gl.getParameter(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL) }
    gl.deleteTexture(binding)
    return result
  })
  expect(result.error).toContain('upload denied')
  expect(result).toMatchObject({ deleted: true, binding: true, premultiply: false })
})

test('replaying a cached motion does not reuse callbacks from the previous call', async ({ page }) => {
  const result = await page.evaluate(async () => {
    const r = (window as any).regression
    const sprite = r.sprites[0]
    const motion = sprite.getMotions()[0]
    let started = 0
    let finished = 0
    const advance = () => {
      for (let i = 0; i < 1800; i++) sprite._model.update(1 / 60)
    }
    await sprite.startMotion({ ...motion, priority: 3, onStarted: () => started++, onFinished: () => finished++ })
    advance()
    const first = { started, finished }
    await sprite.startMotion({ ...motion, priority: 3 })
    advance()
    return { first, second: { started, finished } }
  })
  expect(result.first).toEqual({ started: 1, finished: 1 })
  expect(result.second).toEqual(result.first)
})

test('voices are isolated, decoded once per request, and released on stop or destroy', async ({ page }) => {
  let requests = 0
  await page.route('**/*.wav', (route) => {
    requests++
    return route.fulfill({ body: wave(), contentType: 'audio/wav' })
  })
  await page.evaluate(path => (window as any).regression.load(path), modelPath)
  const result = await page.evaluate(async () => {
    const r = (window as any).regression
    const [a, b] = r.sprites
    const effectA = a._model.effectCtrl
    const effectB = b._model.effectCtrl
    await a.playVoice({ voicePath: '/first.wav' })
    await b.playVoice({ voicePath: '/second.wav' })
    effectB._soundLoader.update(0.1)
    const rms = effectB._soundLoader.getRms()
    a.stopVoice()
    const independent = effectA._voices.size === 0 && effectB._voices.size === 1 && [...effectB._voices][0].isPlaying
    await a.playVoice({ voicePath: '/third.wav' })
    await a.playVoice({ voicePath: '/fourth.wav', immediate: false })
    const overlapping = effectA._voices.size
    a.destroy()
    const survivor = [...effectB._voices][0].isPlaying
    b.destroy()
    return { independent, overlapping, survivor, rms, released: effectA._voices.size === 0 && effectB._voices.size === 0 }
  })
  expect(result).toMatchObject({ independent: true, overlapping: 2, survivor: true, released: true })
  expect(result.rms).toBeGreaterThan(0)
  expect(requests).toBe(4)
})

test('a decode completing after destroy cannot start audio or restore PCM data', async ({ page }) => {
  await page.route('**/*.wav', route => route.fulfill({ body: wave(), contentType: 'audio/wav' }))
  await page.evaluate(() => {
    const r = (window as any).regression
    const decode = AudioContext.prototype.decodeAudioData
    AudioContext.prototype.decodeAudioData = async function (...args) {
      const buffer = await decode.apply(this, args)
      return new Promise<AudioBuffer>((resolve) => {
        r.finishDecode = () => resolve(buffer)
      })
    }
    r.pendingVoice = r.sprites[0].playVoice({ voicePath: '/pending.wav' })
  })
  await page.waitForFunction(() => !!(window as any).regression.finishDecode)
  const result = await page.evaluate(async () => {
    const r = (window as any).regression
    const effect = r.sprites[0]._model.effectCtrl
    r.sprites[0].destroy()
    r.finishDecode()
    await r.pendingVoice
    return { voices: effect._voices.size, pcm: effect._soundLoader._pcmData }
  })
  expect(result).toEqual({ voices: 0, pcm: null })
})

test('completed audio releases its instance without waiting for sprite destruction', async ({ page }) => {
  await page.route('**/*.wav', route => route.fulfill({ body: wave(0.05), contentType: 'audio/wav' }))
  await page.evaluate(async () => {
    const r = (window as any).regression
    await r.sprites[0].playVoice({ voicePath: '/short.wav' })
    const voice = [...r.sprites[0]._model.effectCtrl._voices][0] as any
    await voice.context.audioContext.resume()
  })
  await page.waitForFunction(() => (window as any).regression.sprites[0]._model.effectCtrl._voices.size === 0)
})

for (const resource of ['Hiyori.model3.json', 'Hiyori.physics3.json']) {
  test(`HTTP failures report the URL and status for ${resource}`, async ({ page }) => {
    await page.route(`**/${resource}`, route => route.fulfill({ status: 403, body: 'forbidden' }))
    const error = await page.evaluate(path => (window as any).regression.load(path).then(() => '', String), modelPath)
    expect(error).toContain(resource)
    expect(error).toContain('HTTP 403')
  })
}

test('failed dynamic motion loads release their priority reservation', async ({ page }) => {
  await page.route('**/*.motion3.json', route => route.fulfill({ status: 503, body: 'unavailable' }))
  const failed = await page.evaluate(async () => {
    const r = (window as any).regression
    const sprite = r.sprites[0]
    const motion = sprite.getMotions()[0]
    sprite.releaseMotions()
    return sprite.startMotion({ ...motion, priority: 2 }).then(() => '', String)
  })
  expect(failed).toContain('HTTP 503')
  await page.unroute('**/*.motion3.json')
  const started = await page.evaluate(async () => {
    const r = (window as any).regression
    const sprite = r.sprites[0]
    let began = false
    await sprite.startMotion({
      ...sprite.getMotions()[0],
      priority: 2,
      onStarted: () => {
        began = true
      },
    })
    r.step(2)
    return began
  })
  expect(started).toBe(true)
})

import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { cp, mkdir, mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { resolve } from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('../', import.meta.url))
const name = 'CubismSdkForWeb-5-r.5'
const checksum = '67064a7fb1812cf502f5c4a03bfe12cc638c75a621bb4acf06bb28763df06ba0'
const temp = await mkdtemp(resolve(tmpdir(), 'easy-live2d-r5-'))
try {
  const zip = process.argv[2] ? resolve(process.argv[2]) : resolve(temp, `${name}.zip`)
  if (!process.argv[2]) {
    console.log('Downloading official Cubism 5 SDK for Web R5…')
    execFileSync('curl', ['-fL', '--retry', '2', `https://cubism.live2d.com/sdk-web/bin/${name}.zip`, '-o', zip], { stdio: 'inherit' })
  }
  const actual = createHash('sha256').update(await readFile(zip)).digest('hex')
  if (actual !== checksum)
    throw new Error(`R5 archive checksum mismatch: ${actual}`)
  execFileSync('unzip', ['-q', zip, '-d', temp])
  const sdk = resolve(temp, name)
  await cp(resolve(sdk, 'Core'), resolve(root, 'packages/cubism/Core'), { recursive: true })
  await mkdir(resolve(root, 'packages/playground/public'), { recursive: true })
  await cp(resolve(sdk, 'Core'), resolve(root, 'packages/playground/public/Core'), { recursive: true })
  // 官方样例单独命名，避免覆盖使用者已有模型。
  await cp(resolve(sdk, 'Samples/Resources'), resolve(root, 'packages/playground/public/SdkResources'), { recursive: true })
  console.log('Installed pinned R5 Core and official sample models. Core/resources remain git-ignored.')
} finally {
  await rm(temp, { recursive: true, force: true })
}

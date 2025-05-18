import { defineConfig } from 'tsup'
import { TsconfigPathsPlugin } from '@esbuild-plugins/tsconfig-paths'

export default defineConfig({
    entry: ['src/index.ts'], // 入口文件
    format: ['esm', 'cjs'], // 输出格式：ESM 和 CJS
    dts: true, // 生成类型声明文件 .d.ts
    sourcemap: true, // 开启源映射
    outDir: 'dist', // 输出目录
    clean: true, // 清理旧的输出文件
    treeshake: true, // 启用摇树优化

    // 不打包的外部依赖
    external: [
        '@Framework/*',
        '@easy-live2d/*',
        '@tweenjs/tween.js',
        'dayjs',
        'localforage',
        'pixi-filters',
        'pixi.js'
    ],
    esbuildPlugins: [
        TsconfigPathsPlugin({ tsconfig: './tsconfig.json' }),
    ],
})
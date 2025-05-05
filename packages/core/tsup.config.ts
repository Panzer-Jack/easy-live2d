import { TsconfigPathsPlugin } from '@esbuild-plugins/tsconfig-paths'
import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts'], // 入口文件
  format: ['esm', 'cjs'], // 输出格式：ESM 和 CJS
  dts: true, // 生成类型声明文件 .d.ts
  sourcemap: true, // 开启源映射
  outDir: 'dist', // 输出目录
  clean: true, // 清理旧的输出文件

  external: [], // 不打包的外部依赖

  treeshake: true,
  esbuildPlugins: [
    TsconfigPathsPlugin({ tsconfig: './tsconfig.json' }),
  ],
})

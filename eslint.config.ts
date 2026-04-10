import panzerjack from '@panzerjack/eslint-config'

export default panzerjack({
  vue: true,
  typescript: true,
  pnpm: true,
  formatters: true,
  ignores: [
    'node_modules',
    '**/node_modules/**',
    'dist',
    '**/dist/**',
    'docs/.vitepress/**',
    'src/services/figma/**',
    'CLAUDE.md',
    './packages/cubism/**',
    '**/public/**',
  ],
  rules: {
    'pnpm/json-enforce-catalog': 'off',
    'ts/consistent-type-definitions': 'off',
  },
})

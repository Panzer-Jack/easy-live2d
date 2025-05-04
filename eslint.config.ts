import antfu from '@antfu/eslint-config'

export default antfu({
  unocss: true,
  formatters: true,
  pnpm: true,
  // 添加自定义风格规则
  stylistic: {
    indent: 2, // 设置缩进为2个空格
    quotes: 'single', // 设置使用单引号
    semi: false, // 设置使用分号
  },
}, {
  ignores: ['node_modules', '**/node_modules/**', 'dist', '**/dist/**'],
  rules: {
    'ts/no-explicit-any': 'off',
    'no-console': 'off',
    'brace-style': ['error', '1tbs'],
    'style/brace-style': ['error', '1tbs'],
  },
})

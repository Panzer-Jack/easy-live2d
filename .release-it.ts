import type { Config } from 'release-it'

export default {
  git: {
    commitMessage: 'v${version}',
    tagName: 'v${version}',
  },
  npm: {
    publish: false,
  },
} satisfies Config
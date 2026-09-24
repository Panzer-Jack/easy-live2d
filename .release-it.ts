import type { Config } from 'release-it'

export default {
  git: {
    commitMessage: `v\${version}`,
    tagName: `v\${version}`,
  },
  npm: {
    publish: true,
    timeout: 120,
  },
  github: {
    release: true,
    releaseName: `v\${version}`,
    autoGenerate: true,
  },
} satisfies Config

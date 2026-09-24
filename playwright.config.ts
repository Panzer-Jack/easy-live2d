import process from 'node:process'
import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './tests/browser',
  timeout: 60000,
  workers: 1,
  use: { baseURL: 'http://127.0.0.1:4178', viewport: { width: 850, height: 700 }, launchOptions: { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] } },
  webServer: { command: 'pnpm -C packages/playground exec vite --config vite.regression.config.ts', url: 'http://127.0.0.1:4178/regression/', reuseExistingServer: false },
})

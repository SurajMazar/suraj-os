import { defineConfig } from '@playwright/test'
import { existsSync } from 'node:fs'
import { homedir } from 'node:os'

// Reuse a Chromium that is already on disk when the bundled revision is not installed.
const cached = `${homedir()}/Library/Caches/ms-playwright/chromium-1248/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing`
const executablePath = process.env.PW_CHROMIUM_PATH ?? (existsSync(cached) ? cached : undefined)

export default defineConfig({
  testDir: 'tests',
  timeout: 45_000,
  fullyParallel: true,
  reporter: [['list']],
  use: {
    baseURL: 'http://localhost:5299',
    launchOptions: executablePath ? { executablePath } : {},
  },
  webServer: {
    command: 'npx vite --port 5299 --strictPort',
    port: 5299,
    reuseExistingServer: true,
  },
})

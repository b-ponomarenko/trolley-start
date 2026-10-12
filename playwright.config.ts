import { defineConfig, devices } from '@playwright/test';

const MOCK_API = 'http://127.0.0.1:4010';
const APP = 'http://127.0.0.1:4173';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: 'list',
  use: {
    baseURL: APP,
    trace: 'retain-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: [
    {
      command: 'node e2e/mock-api.mjs',
      url: `${MOCK_API}/health`,
      reuseExistingServer: !process.env.CI,
    },
    {
      // A production build pointed at the mock API: `VITE_*` is inlined into the client bundle and
      // read from the environment by the server.
      command: 'npm run build && npx vite preview --port 4173 --strictPort',
      url: APP,
      env: { VITE_RICK_AND_MORTY_API_URL: `${MOCK_API}/api` },
      reuseExistingServer: !process.env.CI,
      timeout: 180_000,
    },
  ],
});

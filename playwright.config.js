const { defineConfig, devices } = require('@playwright/test');

// Keep full coverage in Chromium and exercise the main visitor journeys in
// other engines without tripling browser-specific performance diagnostics.
const crossBrowserTests = [
  '**/portfolio-interactions.spec.js',
  '**/portfolio-dashboard-viewer.spec.js',
  '**/portfolio-workbench.spec.js',
  '**/portfolio-legal.spec.js',
];

module.exports = defineConfig({
  testDir: './tests',
  testMatch: '**/*.spec.js',
  timeout: 15000,
  forbidOnly: !!process.env.CI,
  retries: 0,
  reporter: 'list',
  webServer: {
    command: 'node scripts/serve.cjs',
    url: 'http://127.0.0.1:4173',
    reuseExistingServer: !process.env.CI,
  },
  use: {
    headless: true,
    viewport: { width: 1280, height: 800 },
    baseURL: 'http://127.0.0.1:4173',
    trace: process.env.CI ? 'retain-on-failure' : 'off',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', testMatch: crossBrowserTests, timeout: 20000, use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', testMatch: crossBrowserTests, timeout: 20000, use: { ...devices['Desktop Safari'] } },
  ],
});

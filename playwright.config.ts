import { defineConfig, devices } from '@playwright/test';

/**
 * Read environment variables from file.
 * https://github.com/motdotla/dotenv
 */
import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(__dirname, '.env.local') });

/**
 * Playwright storage state path (cookies and others)
 */
export const STORAGE_STATE = path.join(__dirname, 'playwright-report/.auth/user.json');

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testDir: './tests',
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: 2,
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : undefined,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: 'html',
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: 'http://localhost:3000',

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',

    extraHTTPHeaders: {
      // Default options for Gatekeeper API interaction
      'Accept': 'application/json',
      'X-Api-Key': process.env.DATAMAP_API_KEY,
      'X-Api-Secret': process.env.DATAMAP_API_SECRET,
    },
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'web-auth-setup',
      testMatch: '**/auth.setup.ts',
    },
    {
      name: 'app',
      testMatch: '**/app/*.spec.ts',
      dependencies: ['web-auth-setup'],
      use: {
        ...devices['Desktop Chrome'],
        storageState: STORAGE_STATE,
        trace: 'on-all-retries',
      },
    },
    {
      name: 'home',
      testMatch: '**/public/*.spec.ts',
      use: {
        ...devices['Desktop Chrome'],
        trace: 'on-all-retries',
      },
    },
    {
      name: 'api',
      testMatch: '**/api/*.spec.ts',
      use: {
        ...devices['Desktop Chrome'],
        trace: 'on-all-retries',
        extraHTTPHeaders: {
          // Default options for Gatekeeper API interaction
          'Accept': 'application/json',
          'X-Api-Key': process.env.DATAMAP_API_KEY,
          'X-Api-Secret': process.env.DATAMAP_API_SECRET,
        },
      },
    },

    // {
    //   name: 'firefox',
    //   use: {
    //     ...devices['Desktop Firefox'],
    //     storageState: 'tests/.auth/user.json',
    //   },
    // },

    // {
    //   name: 'webkit',
    //   use: {
    //     ...devices['Desktop Safari'],
    //     storageState: 'tests/.auth/user.json',
    //   },
    // },

    /* Test against mobile viewports. */
    // {
    //   name: 'Mobile Chrome',
    //   use: { ...devices['Pixel 5'] },
    // },
    // {
    //   name: 'Mobile Safari',
    //   use: { ...devices['iPhone 12'] },
    // },

    /* Test against branded browsers. */
    // {
    //   name: 'Microsoft Edge',
    //   use: { ...devices['Desktop Edge'], channel: 'msedge' },
    // },
    // {
    //   name: 'Google Chrome',
    //   use: { ...devices['Desktop Chrome'], channel: 'chrome' },
    // },
  ],

  /* Run your local dev server before starting the tests */
  // webServer: {
  //   command: 'npm run start',
  //   url: 'http://127.0.0.1:3000',
  //   reuseExistingServer: !process.env.CI,
  // },
});

import { defineConfig, devices } from "@playwright/test";

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:3000";

export default defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ["list"],
    ["html", { open: "never", outputFolder: "playwright-report" }]
  ],
  use: {
    ...devices["Desktop Chrome"],
    baseURL,
    trace: "on-first-retry"
  },
  webServer: process.env.PLAYWRIGHT_SKIP_WEBSERVER
    ? undefined
    : {
        command: "npm run start:standalone",
        env: {
          PORT: "3000",
          HOSTNAME: "127.0.0.1"
        },
        url: baseURL,
        reuseExistingServer: !process.env.CI,
        timeout: 120_000
      }
});

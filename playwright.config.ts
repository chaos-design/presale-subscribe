import { defineConfig, devices } from "@playwright/test"

const port = process.env.PLAYWRIGHT_PORT ?? "3100"
const baseURL = `http://127.0.0.1:${port}`

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  workers: 1,
  // The suite runs against a production build; the raised budgets absorb slow CI runners
  // instead of the default 30s test and 5s expect limits.
  timeout: 90_000,
  expect: {
    timeout: 15_000,
  },
  retries: process.env.CI ? 2 : 0,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  // Build once, then serve the real production output. Running against `next dev` instead
  // would compile routes on demand and leave the assertions at the mercy of HMR timing.
  // The build uses the default `.next` directory, so running E2E replaces a local build;
  // rebuild with `pnpm build` when returning to production-mode checks.
  webServer: {
    command: `pnpm build && pnpm exec next start --port ${port}`,
    url: `${baseURL}/`,
    reuseExistingServer: false,
    timeout: 300_000,
    env: {
      NEXT_PUBLIC_SUPABASE_URL: "",
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "",
    },
  },
})

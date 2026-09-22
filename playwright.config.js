const { defineConfig, devices } = require('@playwright/test');


module.exports = defineConfig({
    testDir: './tests/playwright/specs',
    fullyParallel: true,
    // Several regionSelector specs navigate many times in a single test
    // (once per dashboard, sometimes nested); the 30s default is too tight.
    timeout: 60000,
    // The dev server's first request for any given route recompiles and
    // dependency-scans on demand (a documented Vite dev-server characteristic),
    // which can outrun the 5s default under concurrent load.
    expect: {
        timeout: 10000,
    },
    // A first-time route visit against the dev server can occasionally be
    // slow enough to miss the expect timeout; one local retry absorbs
    // that without masking a genuinely broken assertion.
    retries: process.env.CI ? 2 : 1,
    // Uncapped local parallelism overloads the single shared dev server
    // enough to cause real navigation stalls, not just slow first loads.
    workers: process.env.CI ? 2 : 4,
    reporter: process.env.CI ? 'github' : 'line',
    use: {
        baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000',
        trace: 'on-first-retry',
    },
    webServer: {
        // npm start, not watch:app alone - a fresh checkout has no compiled
        // CSS yet (src/components/views/css/ is gitignored), and watch:app on
        // its own never runs the Stylus build that produces it.
        command: 'npm start',
        url: 'http://localhost:3000',
        reuseExistingServer: !process.env.CI,
    },
    // Chromium only, matching the nightwatch.conf.js we migrated from
    // (`desiredCapabilities: { browserName: 'chrome' }` in both of its
    // environments) - this migration ports that existing coverage, it doesn't
    // expand it.
    projects: [
        {
            name: 'chromium',
            use: { ...devices['Desktop Chrome'] },
            testIgnore: '**/jsDisabled.spec.js',
        },
        {
            name: 'chromium-no-js',
            use: { ...devices['Desktop Chrome'], javaScriptEnabled: false },
            testMatch: '**/jsDisabled.spec.js',
        },
    ],
});

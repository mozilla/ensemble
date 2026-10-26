const path = require('path');
const fs = require('fs');
const base = require('@playwright/test');


// Recorded by scripts/recordPlaywrightFixtures.js, mirroring the URL paths
// under datasetsPrefix.
const fixturesDirectory = path.join(__dirname, 'fixtures');
const datasetsPrefix = 'https://data.firefox.com/datasets/desktop/';

function fixturePath(url) {
    return path.join(fixturesDirectory, decodeURIComponent(new URL(url).pathname.slice(new URL(datasetsPrefix).pathname.length)));
}

// Only a few regions are recorded. A metric request for any other region gets
// the dashboard's default-region recording of the same metric, so specs can
// choose any region the selector offers. A missing metric or dashboard is
// still reported as unrecorded.
function regionFallbackPath(filename) {
    const [dashboardKey, , slug, basename] = path.relative(fixturesDirectory, filename).split(path.sep);
    if (!basename) return null;

    const indexFilename = path.join(fixturesDirectory, dashboardKey, 'index.json');
    if (!fs.existsSync(indexFilename)) return null;

    const index = JSON.parse(fs.readFileSync(indexFilename, 'utf8'));
    const defaultRegion = index.defaultCategory || index.categories[0];
    const fallback = path.join(fixturesDirectory, dashboardKey, defaultRegion, slug, basename);
    return fs.existsSync(fallback) ? fallback : null;
}

// Read a recorded file by its path under fixtures/, for example
// readFixture('hardware/index.json').
function readFixture(relativePath) {
    return JSON.parse(fs.readFileSync(path.join(fixturesDirectory, relativePath), 'utf8'));
}

// A `test` whose page answers every data.firefox.com dataset request from the
// recording, answers other third-party requests (Google Analytics) with an
// empty response, and fails the test on any page error, console error, or
// request with no recording. A spec that expects errors matches them with
// test.use({ allowedErrors: /pattern/ }). It is a single RegExp because
// test.use() reads an array as a [value, options] pair.
//
// With the liveData option (the live-data project in playwright.config.js),
// the page is left alone and requests go to the real data.firefox.com.
const test = base.test.extend({
    allowedErrors: [null, { option: true }],
    liveData: [false, { option: true }],

    page: async ({ page, baseURL, allowedErrors, liveData }, use) => {
        if (liveData) {
            await use(page);
            return;
        }

        const errors = [];
        const unrecordedURLs = [];

        page.on('pageerror', error => errors.push(error.message));
        page.on('console', message => {
            if (message.type() === 'error') errors.push(message.text());
        });

        await page.route('**/*', async route => {
            const url = route.request().url();

            if (url.startsWith(datasetsPrefix)) {
                const filename = fixturePath(url);
                const recordedFilename = fs.existsSync(filename) ? filename : regionFallbackPath(filename);
                if (recordedFilename) {
                    await route.fulfill({ path: recordedFilename, contentType: 'application/json' });
                } else {
                    unrecordedURLs.push(url);
                    await route.fulfill({ status: 404, json: { error: 'Not recorded' } });
                }
            } else if (new URL(url).origin === new URL(baseURL).origin) {
                await route.fallback();
            } else {
                await route.fulfill({ status: 200, body: '' });
            }
        });

        await use(page);

        base.expect(unrecordedURLs, 'Requests with no recording in tests/playwright/fixtures').toEqual([]);
        const unexpectedErrors = errors.filter(error => !(allowedErrors && allowedErrors.test(error)));
        base.expect(unexpectedErrors, 'Page and console errors').toEqual([]);
    },
});

module.exports = {
    test,
    expect: base.expect,
    readFixture,
};

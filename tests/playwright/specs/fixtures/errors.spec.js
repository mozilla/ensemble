const { test, expect, readFixture } = require('../../fixtureData');


// The browser logs the failed request, and the container logs the reason.
test.use({ allowedErrors: /status of 500|Internal Server Error/ });

const internalServerError = { status: 500, json: { error: 'Internal Server Error' } };

test('A dashboard whose data fails to load shows #dashboard-fetch-error', async ({ page }) => {
    await page.route('https://data.firefox.com/datasets/desktop/user-activity/index.json', route => route.fulfill(internalServerError));

    await page.goto('/dashboard/user-activity');

    await expect(page.locator('#dashboard-fetch-error')).toBeVisible();
});

test('A metric that fails to load shows #metric-overview-fetch-error while the others render', async ({ page }) => {
    const dashboard = readFixture('user-activity/index.json');
    const [firstSlug, secondSlug] = dashboard.metrics;
    const secondMetric = readFixture(`user-activity/${dashboard.defaultCategory}/${secondSlug}/index.json`);
    await page.route(
        url => decodeURIComponent(url.pathname).endsWith(`/user-activity/${dashboard.defaultCategory}/${firstSlug}/index.json`),
        route => route.fulfill(internalServerError)
    );

    await page.goto('/dashboard/user-activity');

    await expect(page.locator('#metric-overview-fetch-error')).toBeVisible();
    await expect(page.locator('#metric-overview-2 h4')).toHaveText(secondMetric.title);
});

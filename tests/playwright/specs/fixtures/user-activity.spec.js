const { test, expect, readFixture } = require('../../fixtureData');


const dashboard = readFixture('user-activity/index.json');

test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard/user-activity');
});

test('Dashboard and metric titles come from the data, in order', async ({ page }) => {
    await expect(page.locator('#dashboard-title')).toHaveText(dashboard.title);

    for (const [index, slug] of dashboard.metrics.entries()) {
        const metric = readFixture(`user-activity/${dashboard.defaultCategory}/${slug}/index.json`);
        await expect(page.locator(`#metric-overview-${index + 1} h4`)).toHaveText(metric.title);
    }
});

test('Every metric draws a line chart', async ({ page }) => {
    for (const index of dashboard.metrics.keys()) {
        await expect(page.locator(`#metric-overview-${index + 1} path.mg-line1`).first()).toBeVisible();
    }
});

test('The region selector starts on the default region', async ({ page }) => {
    await expect(page.locator('#region-selector')).toHaveValue(dashboard.defaultCategory);
});

test('Choosing a region loads every metric for it and remembers the choice', async ({ page }) => {
    await expect(page.locator('#metric-overview-1 path.mg-line1').first()).toBeVisible();

    const germanyRequests = dashboard.metrics.map(slug => page.waitForResponse(response => (
        decodeURIComponent(response.url()).endsWith(`/user-activity/Germany/${slug}/index.json`) && response.ok()
    )));
    await page.selectOption('#region-selector', 'Germany');
    await Promise.all(germanyRequests);

    await expect(page.locator('#region-selector')).toHaveValue('Germany');
    await expect(page.locator('#metric-overview-1 path.mg-line1').first()).toBeVisible();
    expect(await page.evaluate(() => sessionStorage.getItem('preferredRegion'))).toBe('Germany');

    await page.reload();
    await expect(page.locator('#region-selector')).toHaveValue('Germany');
});

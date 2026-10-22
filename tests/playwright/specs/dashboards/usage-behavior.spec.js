const { test, expect } = require('../../fixtureData');
const { linkWorks, flagForUpdate, metricTitleIsCorrect, changeRegionAndWaitForMetrics } = require('../../utils');


test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard/usage-behavior');
});

test('Dashboard loads', async ({ page }) => {
    await expect(page.locator('#dashboard')).toBeVisible();
});

test('Page <title> is correct', async ({ page }) => {
    await expect(page.locator('#dashboard')).toBeVisible();
    await expect(page).toHaveTitle('Usage Behavior | Firefox Public Data Report');
});

test('Dashboard title is correct', async ({ page }) => {
    await expect(page.locator('#dashboard')).toBeVisible();
    await expect(page.locator('#dashboard-title')).toHaveText('Usage Behavior');
});

test('Metric titles and order are correct', async ({ page }) => {
    await metricTitleIsCorrect(page, '#metric-overview-1 h4', 'Top Languages');
    await metricTitleIsCorrect(page, '#metric-overview-2 h4', 'Has Add-on');
    await metricTitleIsCorrect(page, '#metric-overview-3 h4', 'Top Add-ons');

    await flagForUpdate(page, '.metric-overview', 'metrics in the usage dashboard', 3);
});

// Any drawn line counts: a population with a single data point draws a
// zero-size line path (metrics-graphics shows it as a dot instead), so the
// first population's line alone isn't a reliable signal.
test('Charts render', async ({ page }) => {
    await expect(page.locator('#metric-overview-1 svg')).toBeVisible();
    await expect(page.locator('#metric-overview-1 path.mg-main-line').filter({ visible: true }).first()).toBeVisible();

    await expect(page.locator('#metric-overview-2 svg')).toBeVisible();
    await expect(page.locator('#metric-overview-2 path.mg-main-line').filter({ visible: true }).first()).toBeVisible();

    await flagForUpdate(page, '.chart', 'charts in the usage dashboard', 2);
});

test('Table renders', async ({ page }) => {
    await expect(page.locator('.data-table')).toBeVisible();

    await expect(page.locator('#metric-overview-3 table')).toBeVisible();
    await expect(page.locator('#metric-overview-3 tbody tr:first-child td:nth-child(2)')).toBeVisible();

    await flagForUpdate(page, '.metric-overview table', 'table in the usage dashboard', 1);
});

test('The "proceed button" appears', async ({ page }) => {
    await expect(page.locator('.next-button')).toBeVisible();
});

test('The "proceed button" text is correct', async ({ page }) => {
    await expect(page.locator('.next-button')).toHaveText('Proceed to Hardware');
});

test('The "proceed button" works', async ({ page }) => {
    await expect(page.locator('.next-button')).toBeVisible();
    await linkWorks(page, '.next-button a');
});

test('Page does not crash when region selector is used', async ({ page }) => {
    await expect(page.locator('#region-selector')).toBeVisible();

    await changeRegionAndWaitForMetrics(page, 0, 3);
    await expect(page.locator('#dashboard')).toBeVisible();

    await changeRegionAndWaitForMetrics(page, 1, 3);
    await expect(page.locator('#dashboard')).toBeVisible();

    await changeRegionAndWaitForMetrics(page, 2, 3);
    await expect(page.locator('#dashboard')).toBeVisible();
});

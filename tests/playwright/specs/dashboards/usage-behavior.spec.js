const { test, expect } = require('@playwright/test');
const { linkWorks, linksWork, flagForUpdate, metricTitleIsCorrect } = require('../../utils');


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

    await flagForUpdate(page, '.metric', 'metrics in the usage dashboard', 3);
});

test('Charts render', async ({ page }) => {
    await expect(page.locator('#metric-overview-1 svg')).toBeVisible();
    await expect(page.locator('#metric-overview-1 path.mg-line1').first()).toBeVisible();

    await expect(page.locator('#metric-overview-2 svg')).toBeVisible();
    await expect(page.locator('#metric-overview-2 path.mg-line1').first()).toBeVisible();

    await flagForUpdate(page, '.chart', 'charts in the usage dashboard', 2);
});

test('Table renders', async ({ page }) => {
    await expect(page.locator('.data-table')).toBeVisible();

    await expect(page.locator('#metric-overview-3 table')).toBeVisible();
    await expect(page.locator('#metric-overview-3 tbody tr:first-child td:nth-child(2)')).toBeVisible();

    await flagForUpdate(page, '.metric-overview table', 'table in the usage dashboard', 1);
});

test('All metric description links work', async ({ page }) => {
    // Not every metric description contains a link, so this doesn't assert
    // one is present first - linksWork is a no-op if the selector matches
    // nothing.
    await linksWork(page, '.metric-description a');
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
    const effectWait = 5000;

    await expect(page.locator('#region-selector')).toBeVisible();

    await page.selectOption('#region-selector', { index: 0 });
    await page.waitForTimeout(effectWait);
    await expect(page.locator('#dashboard')).toBeVisible();

    await page.selectOption('#region-selector', { index: 1 });
    await page.waitForTimeout(effectWait);
    await expect(page.locator('#dashboard')).toBeVisible();

    await page.selectOption('#region-selector', { index: 2 });
    await page.waitForTimeout(effectWait);
    await expect(page.locator('#dashboard')).toBeVisible();
});

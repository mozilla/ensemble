const { test, expect } = require('@playwright/test');
const { linkWorks, flagForUpdate, metricTitleIsCorrect } = require('../../utils');


test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard/user-activity');
});

test('Dashboard loads', async ({ page }) => {
    await expect(page.locator('#dashboard')).toBeVisible();
});

test('Page <title> is correct', async ({ page }) => {
    await expect(page.locator('#dashboard')).toBeVisible();
    await expect(page).toHaveTitle('User Activity | Firefox Public Data Report');
});

test('Dashboard title is correct', async ({ page }) => {
    await expect(page.locator('#dashboard')).toBeVisible();
    await expect(page.locator('#dashboard-title')).toHaveText('User Activity');
});

test('Chart titles and order are correct', async ({ page }) => {
    await metricTitleIsCorrect(page, '#metric-overview-1 h4', 'Monthly Active Users');
    await metricTitleIsCorrect(page, '#metric-overview-2 h4', 'Daily Usage');
    await metricTitleIsCorrect(page, '#metric-overview-3 h4', 'Average Intensity');
    await metricTitleIsCorrect(page, '#metric-overview-4 h4', 'New Profile Rate');
    await metricTitleIsCorrect(page, '#metric-overview-5 h4', 'Latest Version');

    await flagForUpdate(page, '.metric', 'metrics in the activity dashboard', 5);
});

test('Charts render', async ({ page }) => {
    await expect(page.locator('#metric-overview-1 svg')).toBeVisible();
    await expect(page.locator('#metric-overview-1 path.mg-line1').first()).toBeVisible();

    await expect(page.locator('#metric-overview-2 svg')).toBeVisible();
    await expect(page.locator('#metric-overview-2 path.mg-line1').first()).toBeVisible();

    await expect(page.locator('#metric-overview-3 svg')).toBeVisible();
    await expect(page.locator('#metric-overview-3 path.mg-line1').first()).toBeVisible();

    await expect(page.locator('#metric-overview-4 svg')).toBeVisible();
    await expect(page.locator('#metric-overview-4 path.mg-line1').first()).toBeVisible();

    await expect(page.locator('#metric-overview-5 svg')).toBeVisible();
    await expect(page.locator('#metric-overview-5 path.mg-line1').first()).toBeVisible();

    await flagForUpdate(page, '.metric', 'metrics in the activity dashboard', 5);
});

test('The "proceed button" appears', async ({ page }) => {
    await expect(page.locator('.next-button')).toBeVisible();
});

test('The "proceed button" text is correct', async ({ page }) => {
    await expect(page.locator('.next-button')).toHaveText('Proceed to Usage Behavior');
});

test('The "proceed button" works', async ({ page }) => {
    await expect(page.locator('.next-button')).toBeVisible();
    await linkWorks(page, '.next-button a');
});

test('Page does not crash when region selector is used', async ({ page }) => {
    const effectWait = 10000;

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

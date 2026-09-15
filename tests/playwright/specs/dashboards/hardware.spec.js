const { test, expect } = require('@playwright/test');
const { flagForUpdate, metricTitleIsCorrect } = require('../../utils');


test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard/hardware');
});

test('Dashboard loads', async ({ page }) => {
    await expect(page.locator('#dashboard')).toBeVisible();
});

test('Page <title> is correct', async ({ page }) => {
    await expect(page.locator('#dashboard')).toBeVisible();
    await expect(page).toHaveTitle('Hardware Across the Web | Firefox Public Data Report');
});

test('Dashboard title is correct', async ({ page }) => {
    await expect(page.locator('#dashboard')).toBeVisible();
    await expect(page.locator('#dashboard-title')).toHaveText('Hardware Across the Web');
});

test('Section titles and order are correct', async ({ page }) => {
    await expect(page.locator('#dashboard')).toBeVisible();

    await expect(page.locator('#dashboard-sections .dashboard-section:nth-child(1) h4')).toHaveText('Graphics');
    await expect(page.locator('#dashboard-sections .dashboard-section:nth-child(2) h4')).toHaveText('Processor');
    await expect(page.locator('#dashboard-sections .dashboard-section:nth-child(3) h4')).toHaveText('Operating System');
    await expect(page.locator('#dashboard-sections .dashboard-section:nth-child(4) h4')).toHaveText('Plugins');

    await flagForUpdate(page, '#dashboard-sections .dashboard-section', 'sections in the hardware dashboard', 4);
});

test('Metric titles and order are correct', async ({ page }) => {
    await metricTitleIsCorrect(page, '#dashboard-sections .dashboard-section:nth-child(1) #graphics-metric-overview-1 h5', 'GPU Model');
    await metricTitleIsCorrect(page, '#dashboard-sections .dashboard-section:nth-child(1) #graphics-metric-overview-2 h5', 'GPU Vendor');
    await metricTitleIsCorrect(page, '#dashboard-sections .dashboard-section:nth-child(1) #graphics-metric-overview-3 h5', 'Display Resolution');
    await metricTitleIsCorrect(page, '#dashboard-sections .dashboard-section:nth-child(2) #processor-metric-overview-1 h5', 'CPU Vendor');
    await metricTitleIsCorrect(page, '#dashboard-sections .dashboard-section:nth-child(2) #processor-metric-overview-2 h5', 'CPU Cores');
    await metricTitleIsCorrect(page, '#dashboard-sections .dashboard-section:nth-child(2) #processor-metric-overview-3 h5', 'CPU Speeds');
    await metricTitleIsCorrect(page, '#dashboard-sections .dashboard-section:nth-child(2) #processor-metric-overview-4 h5', 'Memory');
    await metricTitleIsCorrect(page, '#dashboard-sections .dashboard-section:nth-child(3) #operating-system-metric-overview-1 h5', 'Operating System');
    await metricTitleIsCorrect(page, '#dashboard-sections .dashboard-section:nth-child(3) #operating-system-metric-overview-2 h5', 'Browsers by Architecture');
    await metricTitleIsCorrect(page, '#dashboard-sections .dashboard-section:nth-child(3) #operating-system-metric-overview-3 h5', 'Operating Systems by Architecture');
    await metricTitleIsCorrect(page, '#dashboard-sections .dashboard-section:nth-child(4) #plugins-metric-overview-1 h5', 'Has Flash');

    await flagForUpdate(page, '.metric', 'metrics in the hardware dashboard', 11);
});

test('Charts render', async ({ page }) => {
    await expect(page.locator('#graphics-metric-overview-1 svg')).toBeVisible();
    await expect(page.locator('#graphics-metric-overview-1 path.mg-line1').first()).toBeVisible();

    await expect(page.locator('#graphics-metric-overview-2 svg')).toBeVisible();
    await expect(page.locator('#graphics-metric-overview-2 path.mg-line1').first()).toBeVisible();

    await expect(page.locator('#graphics-metric-overview-3 svg')).toBeVisible();
    await expect(page.locator('#graphics-metric-overview-3 path.mg-line1').first()).toBeVisible();

    await expect(page.locator('#processor-metric-overview-1 svg')).toBeVisible();
    await expect(page.locator('#processor-metric-overview-1 path.mg-line1').first()).toBeVisible();

    await expect(page.locator('#processor-metric-overview-2 svg')).toBeVisible();
    await expect(page.locator('#processor-metric-overview-2 path.mg-line1').first()).toBeVisible();

    await expect(page.locator('#processor-metric-overview-3 svg')).toBeVisible();
    await expect(page.locator('#processor-metric-overview-3 path.mg-line1').first()).toBeVisible();

    await expect(page.locator('#processor-metric-overview-4 svg')).toBeVisible();
    await expect(page.locator('#processor-metric-overview-4 path.mg-line1').first()).toBeVisible();

    await expect(page.locator('#operating-system-metric-overview-1 svg')).toBeVisible();
    await expect(page.locator('#operating-system-metric-overview-1 path.mg-line1').first()).toBeVisible();

    await expect(page.locator('#operating-system-metric-overview-2 svg')).toBeVisible();
    await expect(page.locator('#operating-system-metric-overview-2 path.mg-line1').first()).toBeVisible();

    await expect(page.locator('#operating-system-metric-overview-3 svg')).toBeVisible();
    await expect(page.locator('#operating-system-metric-overview-3 path.mg-line1').first()).toBeVisible();

    await expect(page.locator('#plugins-metric-overview-1 svg')).toBeVisible();
    await expect(page.locator('#plugins-metric-overview-1 path.mg-line1').first()).toBeVisible();

    await flagForUpdate(page, '.chart', 'charts in the hardware dashboard', 11);
});

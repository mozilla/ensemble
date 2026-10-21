const { test, expect, readFixture } = require('../../fixtureData');


const dashboard = readFixture('hardware/index.json');

test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard/hardware');
});

test('Sections and their metrics come from the data, in order', async ({ page }) => {
    const sections = page.locator('#dashboard-sections .dashboard-section');
    await expect(sections.locator('h4.dashboard-section-title')).toHaveText(dashboard.sections.map(section => section.title));

    for (const section of dashboard.sections) {
        for (const [index, slug] of section.metrics.entries()) {
            const metric = readFixture(`hardware/default/${slug}/index.json`);
            await expect(page.locator(`#${section.key}-metric-overview-${index + 1} h5`)).toHaveText(metric.title);
        }
    }
});

test('There is no region selector', async ({ page }) => {
    await expect(page.locator('#dashboard-title')).toHaveText(dashboard.title);
    await expect(page.locator('#region-selector')).toHaveCount(0);
});

test('Each summary metric draws bars labelled with the largest population first', async ({ page }) => {
    const summaryMetrics = page.locator('#summary-metrics .summary-metric');
    await expect(summaryMetrics).toHaveCount(dashboard.summaryMetrics.length);

    const mostRecentDate = dashboard.dates[0];
    for (const [index, slug] of dashboard.summaryMetrics.entries()) {
        const metric = readFixture(`hardware/default/${slug}/index.json`);
        const summaryMetric = summaryMetrics.nth(index);

        await expect(summaryMetric.locator('h4')).toHaveText(metric.title);
        await expect(summaryMetric.locator('rect.bar').first()).toBeVisible();

        const populations = Object.entries(metric.data.populations);
        if (populations.length > 1) {
            const [largestName] = populations
                .map(([populationName, points]) => [populationName, (points.find(point => point.x === mostRecentDate) || { y: 0 }).y])
                .sort((a, b) => b[1] - a[1])[0];
            await expect(summaryMetric.locator('text.bar-label').first()).toContainText(largestName);
        }
    }
});

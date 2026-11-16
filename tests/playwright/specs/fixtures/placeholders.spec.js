const { test, expect, readFixture } = require('../../fixtureData');
const { holdRequests } = require('../../utils');


async function box(locator) {
    await expect(locator).toBeVisible();
    return locator.boundingBox();
}

function expectSameBox(actual, expected) {
    for (const side of ['x', 'y', 'width', 'height']) {
        expect(Math.abs(actual[side] - expected[side]), side).toBeLessThan(1);
    }
}

for (const width of [375, 1280]) {
    test(`A chart's placeholder and spinner take the chart's space at ${width}px`, async ({ page }) => {
        const dashboard = readFixture('user-activity/index.json');
        const slug = dashboard.metrics[0];
        const metricPath = `/user-activity/${dashboard.defaultCategory}/${slug}/index.json`;
        // One population, so there is no legend, and no description, so the
        // chart is all there is below the title.
        const metric = readFixture(`user-activity/${dashboard.defaultCategory}/${slug}/index.json`);
        delete metric.description;
        await page.setViewportSize({ width, height: 900 });

        const releaseMetric = await holdRequests(
            page,
            url => decodeURIComponent(url.pathname).endsWith(metricPath),
            route => route.fulfill({ json: metric })
        );
        const releaseChartCode = await holdRequests(page, url => url.pathname.includes('ChartContainer'));
        await page.goto('/dashboard/user-activity');

        const placeholder = await box(page.locator('.metric-overview-placeholder').first());

        releaseMetric();
        const metricOverview = page.locator('#metric-overview-1');
        await expect(metricOverview.locator('.metric-and-legend > .spinner')).toBeAttached();
        expectSameBox(await box(metricOverview), placeholder);

        releaseChartCode();
        await expect(metricOverview.locator('g.chart-line path').filter({ visible: true }).first()).toBeVisible();
        expectSameBox(await box(metricOverview), placeholder);
    });

    test(`A summary metric's placeholder takes the summary metric's space at ${width}px`, async ({ page }) => {
        const dashboard = readFixture('hardware/index.json');
        const slug = dashboard.summaryMetrics[0];
        await page.setViewportSize({ width, height: 900 });

        const releaseSummaryMetric = await holdRequests(
            page,
            url => decodeURIComponent(url.pathname).endsWith(`/hardware/default/${slug}/index.json`)
        );
        await page.goto('/dashboard/hardware');

        const firstSummaryMetric = page.locator('#summary-metrics .summary-metric').first();
        await expect(firstSummaryMetric).toHaveAttribute('aria-hidden', 'true');
        const placeholder = await box(firstSummaryMetric);

        releaseSummaryMetric();
        await expect(firstSummaryMetric.locator('rect.bar').first()).toBeAttached();
        expectSameBox(await box(firstSummaryMetric), placeholder);
    });
}

test('While a dashboard loads, the footer stays below the window', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    const releaseDashboard = await holdRequests(page, url => decodeURIComponent(url.pathname).endsWith('/hardware/index.json'));
    await page.goto('/dashboard/hardware');
    await expect(page.locator('main > .spinner')).toBeAttached();

    const { y } = await page.locator('footer').boundingBox();
    expect(y).toBeGreaterThanOrEqual(900);

    releaseDashboard();
    await expect(page.locator('#dashboard')).toBeVisible();
});

const { test, expect, readFixture } = require('../../fixtureData');


const dashboard = readFixture('user-activity/index.json');
const slug = dashboard.metrics[0];

async function serveFirstMetricWith(page, populations) {
    const metric = readFixture(`user-activity/${dashboard.defaultCategory}/${slug}/index.json`);
    await page.route(
        url => decodeURIComponent(url.pathname).endsWith(`/user-activity/${dashboard.defaultCategory}/${slug}/index.json`),
        route => route.fulfill({ json: { ...metric, axes: {}, data: { populations } } })
    );
}

test('A population with a single data point is drawn as a dot', async ({ page }) => {
    // The single point has the highest value, so it is population 1 - the
    // case that live hardware data hit with a one-week "NULL" CPU speed.
    await serveFirstMetricWith(page, {
        Solo: [{ x: dashboard.dates[0], y: 900 }],
        Steady: dashboard.dates.map((date, index) => ({ x: date, y: 400 + index })),
    });

    await page.goto('/dashboard/user-activity');

    const metricOverview = page.locator('#metric-overview-1');
    const dot = metricOverview.locator('circle.mg-line-rollover-circle.mg-line1');
    await expect(dot).toBeVisible();
    expect(Number(await dot.getAttribute('r'))).toBeGreaterThan(0);
    await expect(metricOverview.locator('path.mg-main-line.mg-line2')).toBeVisible();
    await expect(metricOverview.locator('.legend span')).toHaveText([/Solo/, /Steady/]);
});

test.describe('A metric whose populations are all null', () => {
    // Pinned as current behavior, not as a design: react-metrics-graphics
    // throws on a chart with no points, and the error boundary around the chart
    // shows its generic "Load error". React logs the caught error too.
    test.use({ allowedErrors: /Cannot read properties of undefined \(reading 'x'\)|The above error occurred/ });

    test('shows "Load error" in place of its chart, and the other metrics still render', async ({ page }) => {
        await serveFirstMetricWith(page, {
            Empty: dashboard.dates.map(date => ({ x: date, y: null })),
            AlsoEmpty: dashboard.dates.map(date => ({ x: date, y: null })),
        });

        await page.goto('/dashboard/user-activity');

        await expect(page.locator('#metric-overview-1 .error')).toContainText('Load error');
        await expect(page.locator('#metric-overview-1 svg')).toHaveCount(0);
        await expect(page.locator('#metric-overview-2 path.mg-main-line').filter({ visible: true }).first()).toBeVisible();
    });
});

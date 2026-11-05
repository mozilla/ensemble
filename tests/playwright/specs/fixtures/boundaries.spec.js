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
    const dot = metricOverview.locator('g.chart-point circle');
    await expect(dot).toBeVisible();
    expect(Number(await dot.getAttribute('r'))).toBeGreaterThan(0);
    await expect(metricOverview.locator('g.chart-line path')).toHaveCount(2);
    await expect(metricOverview.locator('.legend span')).toHaveText([/Solo/, /Steady/]);
});

test('A metric whose populations are all null shows a message in place of its chart, and the other metrics still render', async ({ page }) => {
    await serveFirstMetricWith(page, {
        Empty: dashboard.dates.map(date => ({ x: date, y: null })),
        AlsoEmpty: dashboard.dates.map(date => ({ x: date, y: null })),
    });

    await page.goto('/dashboard/user-activity');

    await expect(page.locator('#metric-overview-1 .chart-empty')).toHaveText('No data to show for this metric.');
    await expect(page.locator('#metric-overview-1 svg')).toHaveCount(0);
    await expect(page.locator('#metric-overview-2 g.chart-line path').first()).toBeVisible();
});

test('A chart that had no data draws once a region with data is chosen', async ({ page }) => {
    await serveFirstMetricWith(page, {
        Empty: dashboard.dates.map(date => ({ x: date, y: null })),
    });
    await page.route(
        url => decodeURIComponent(url.pathname).endsWith(`/user-activity/Germany/${slug}/index.json`),
        route => route.fulfill({ json: {
            ...readFixture(`user-activity/${dashboard.defaultCategory}/${slug}/index.json`),
            axes: {},
            data: { populations: { Present: dashboard.dates.map((date, index) => ({ x: date, y: 100 + index })) } },
        } })
    );

    await page.goto('/dashboard/user-activity');
    await expect(page.locator('#metric-overview-1 .chart-empty')).toBeVisible();

    await page.selectOption('#region-selector', 'Germany');

    await expect(page.locator('#metric-overview-1 g.chart-line path')).toHaveCount(1);
    await expect(page.locator('#metric-overview-1 .chart-empty')).toHaveCount(0);
});

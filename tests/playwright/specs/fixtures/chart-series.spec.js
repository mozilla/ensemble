const { test, expect, readFixture } = require('../../fixtureData');


const dashboard = readFixture('user-activity/index.json');
const slug = dashboard.metrics[0];

// Listed out of order on purpose: the chart orders populations by their
// highest value. The ranges don't overlap, so each line's vertical position
// identifies which data it drew.
const populationRanges = {
    Charlie: [50, 100],
    Alpha: [250, 300],
    Bravo: [150, 200],
};
const expectedOrder = ['Alpha', 'Bravo', 'Charlie'];

test.beforeEach(async ({ page }) => {
    const metric = readFixture(`user-activity/${dashboard.defaultCategory}/${slug}/index.json`);
    const populations = Object.fromEntries(Object.entries(populationRanges).map(([populationName, [low, high]]) => (
        [populationName, dashboard.dates.map((date, index) => ({ x: date, y: index % 2 ? low : high }))]
    )));

    await page.route(
        url => decodeURIComponent(url.pathname).endsWith(`/user-activity/${dashboard.defaultCategory}/${slug}/index.json`),
        route => route.fulfill({ json: { ...metric, axes: {}, data: { populations } } })
    );

    await page.goto('/dashboard/user-activity');
});

test('Every population is drawn once, in order, with a matching legend entry', async ({ page }) => {
    const metricOverview = page.locator('#metric-overview-1');
    const lines = metricOverview.locator('path.mg-main-line');

    await expect(lines.filter({ visible: true })).toHaveCount(expectedOrder.length);
    await expect(metricOverview.locator('.legend span')).toHaveText(expectedOrder.map(populationName => new RegExp(populationName)));

    let previousTop = -Infinity;
    const colors = new Set();
    for (const [index, populationName] of expectedOrder.entries()) {
        const lineNumber = index + 1;
        const legendEntry = metricOverview.locator(`.legend .mg-line${lineNumber}-legend-color`);
        const line = metricOverview.locator(`path.mg-main-line.mg-line${lineNumber}`);

        await expect(legendEntry).toHaveText(new RegExp(populationName));

        const legendColor = await legendEntry.evaluate(element => getComputedStyle(element).color);
        const lineColor = await line.evaluate(element => getComputedStyle(element).stroke);
        expect(lineColor, `${populationName}'s line and legend entry share a color`).toBe(legendColor);
        colors.add(lineColor);

        // Higher values are drawn nearer the top of the chart.
        const lineTop = (await line.boundingBox()).y;
        expect(lineTop, `${populationName} is drawn below the population with higher values`).toBeGreaterThan(previousTop);
        previousTop = lineTop;
    }

    expect(colors.size, 'Each population has its own color').toBe(expectedOrder.length);
});

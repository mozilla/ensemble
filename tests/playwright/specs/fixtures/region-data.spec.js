const { test, expect, readFixture } = require('../../fixtureData');


const dashboard = readFixture('user-activity/index.json');
const slug = dashboard.metrics[0];

// Deliberately different data per region, so the chart can only show one of
// them: different population names and values two orders of magnitude apart.
const populationsByRegion = {
    Worldwide: { 'Worldwide high': 1000, 'Worldwide low': 500 },
    Germany: { 'Germany high': 50, 'Germany low': 20 },
};

test.beforeEach(async ({ page }) => {
    const metric = readFixture(`user-activity/${dashboard.defaultCategory}/${slug}/index.json`);

    for (const [region, values] of Object.entries(populationsByRegion)) {
        const populations = Object.fromEntries(Object.entries(values).map(([populationName, value]) => (
            [populationName, dashboard.dates.map(date => ({ x: date, y: value }))]
        )));

        await page.route(
            url => decodeURIComponent(url.pathname).endsWith(`/user-activity/${region}/${slug}/index.json`),
            route => route.fulfill({ json: { ...metric, axes: {}, data: { populations } } })
        );
    }

    await page.goto('/dashboard/user-activity');
});

async function hoveredValue(page) {
    const chart = page.locator('#metric-overview-1 svg.chart-svg');
    const box = await chart.boundingBox();
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 3);
    const readout = page.locator('#metric-overview-1 .chart-readout');
    await expect(readout).not.toBeEmpty();
    return readout.textContent();
}

test('Changing the region redraws the chart with that region\'s data', async ({ page }) => {
    const legend = page.locator('#metric-overview-1 .legend .legend-entry');

    await expect(legend).toHaveText([/Worldwide high/, /Worldwide low/]);
    expect(await hoveredValue(page)).toMatch(/: (1,000|500)$/);

    await page.selectOption('#region-selector', 'Germany');

    await expect(legend).toHaveText([/Germany high/, /Germany low/]);
    expect(await hoveredValue(page)).toMatch(/: (50|20)$/);
});

test.describe('Hovering a chart', () => {
    async function readoutAt(page, line) {
        const path = page.locator('#metric-overview-1 g.chart-line path').nth(line);
        const box = await path.boundingBox();
        // Just below a flat line, so its points are nearer than the other line's.
        await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2 + 5);
        const readout = page.locator('#metric-overview-1 .chart-readout');
        await expect(readout).not.toBeEmpty();
        return readout.textContent();
    }

    test('shows the value of the point nearest the pointer', async ({ page }) => {
        expect(await readoutAt(page, 0)).toMatch(/^Worldwide high — .*: 1,000$/);
        expect(await readoutAt(page, 1)).toMatch(/^Worldwide low — .*: 500$/);
    });

    test('shows a value from a corner of the chart, and clears when the pointer leaves', async ({ page }) => {
        const chart = page.locator('#metric-overview-1 svg.chart-svg');
        const readout = page.locator('#metric-overview-1 .chart-readout');
        await chart.scrollIntoViewIfNeeded();
        const box = await chart.boundingBox();
        const lineBox = await page.locator('#metric-overview-1 g.chart-line path').first().boundingBox();

        // The bottom-left corner of the plotting area, above the x-axis.
        await page.mouse.move(lineBox.x + 2, box.y + box.height - 35);
        await expect(readout).not.toBeEmpty();

        await page.mouse.move(box.x + box.width / 2, box.y - 150);
        await expect(readout).toBeEmpty();
    });

    test('keeps a clicked value until the next click', async ({ page }) => {
        const pinned = await readoutAt(page, 0);
        await page.mouse.down();
        await page.mouse.up();

        const box = await page.locator('#metric-overview-1 g.chart-line path').nth(1).boundingBox();
        await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2 + 5);
        await expect(page.locator('#metric-overview-1 .chart-readout')).toHaveText(pinned);

        await page.mouse.down();
        await page.mouse.up();
        await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2 + 6);
        await expect(page.locator('#metric-overview-1 .chart-readout')).toHaveText(/Worldwide low/);
    });
});

for (const width of [1280, 375]) {
    test.describe(`At ${width}px wide`, () => {
        test.use({ viewport: { width, height: 800 } });

        test('hovering and clicking a chart doesn\'t move anything on the page', async ({ page }) => {
            const metric = readFixture(`user-activity/${dashboard.defaultCategory}/${slug}/index.json`);
            const longName = 'A population with a name long enough to wrap on a phone';
            await page.route(
                url => decodeURIComponent(url.pathname).endsWith(`/user-activity/${dashboard.defaultCategory}/${slug}/index.json`),
                route => route.fulfill({ json: { ...metric, axes: {}, data: { populations: {
                    [longName]: dashboard.dates.map(date => ({ x: date, y: 1000 })),
                    Short: dashboard.dates.map(date => ({ x: date, y: 500 })),
                } } } })
            );
            await page.reload();

            const chart = page.locator('#metric-overview-1 svg.chart-svg');
            const nextMetric = page.locator('#metric-overview-2');
            await chart.scrollIntoViewIfNeeded();
            const chartTop = (await chart.boundingBox()).y;
            const nextMetricTop = (await nextMetric.boundingBox()).y;

            const line = await page.locator('#metric-overview-1 g.chart-line path').first().boundingBox();
            await page.mouse.move(line.x + line.width / 2, line.y + 3);
            await expect(page.locator('#metric-overview-1 .chart-readout')).toContainText(longName);
            expect((await chart.boundingBox()).y).toBe(chartTop);
            expect((await nextMetric.boundingBox()).y).toBe(nextMetricTop);

            await page.mouse.down();
            await page.mouse.up();
            expect((await chart.boundingBox()).y).toBe(chartTop);
            expect((await nextMetric.boundingBox()).y).toBe(nextMetricTop);
        });
    });
}

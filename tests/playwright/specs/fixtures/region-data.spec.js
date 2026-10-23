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
    const chart = page.locator('#metric-overview-1 svg').first();
    const box = await chart.boundingBox();
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 3);
    const datapoint = page.locator('#metric-overview-1 .mg-active-datapoint');
    await expect(datapoint).not.toBeEmpty();
    return datapoint.textContent();
}

test('Changing the region redraws the chart with that region\'s data', async ({ page }) => {
    const legend = page.locator('#metric-overview-1 .legend span');

    await expect(legend).toHaveText([/Worldwide high/, /Worldwide low/]);
    expect(await hoveredValue(page)).toMatch(/: (1,000|500)$/);

    await page.selectOption('#region-selector', 'Germany');

    await expect(legend).toHaveText([/Germany high/, /Germany low/]);
    expect(await hoveredValue(page)).toMatch(/: (50|20)$/);
});

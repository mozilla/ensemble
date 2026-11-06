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

// Plot sets each line's stroke as an attribute, and the legend sets each
// entry's color inline; both compute to the same rgb() string when they match.
async function lineWithColor(metricOverview, color) {
    const lines = metricOverview.locator('g.chart-line path');
    for (const line of await lines.all()) {
        if (await line.evaluate(element => getComputedStyle(element).stroke) === color) return line;
    }
    return null;
}

test('Every population is drawn once, in order, with a matching legend entry', async ({ page }) => {
    const metricOverview = page.locator('#metric-overview-1');

    await expect(metricOverview.locator('g.chart-line path')).toHaveCount(expectedOrder.length);
    await expect(metricOverview.locator('.legend span')).toHaveText(expectedOrder.map(populationName => new RegExp(populationName)));

    let previousTop = -Infinity;
    const colors = new Set();
    for (const [index, populationName] of expectedOrder.entries()) {
        const legendEntry = metricOverview.locator('.legend .legend-entry').nth(index);
        await expect(legendEntry).toHaveText(new RegExp(populationName));

        const legendColor = await legendEntry.evaluate(element => getComputedStyle(element).color);
        const line = await lineWithColor(metricOverview, legendColor);
        expect(line, `${populationName}'s line and legend entry share a color`).not.toBeNull();
        colors.add(legendColor);

        // Higher values are drawn nearer the top of the chart.
        const lineTop = (await line.boundingBox()).y;
        expect(lineTop, `${populationName} is drawn below the population with higher values`).toBeGreaterThan(previousTop);
        previousTop = lineTop;
    }

    expect(colors.size, 'Each population has its own color').toBe(expectedOrder.length);
});

async function reloadWithFirstMetric(page, populations) {
    const metric = readFixture(`user-activity/${dashboard.defaultCategory}/${slug}/index.json`);
    await page.route(
        url => decodeURIComponent(url.pathname).endsWith(`/user-activity/${dashboard.defaultCategory}/${slug}/index.json`),
        route => route.fulfill({ json: { ...metric, axes: {}, data: { populations } } })
    );
    await page.reload();
}

test('A population with no data keeps its legend entry, and every line matches its legend color', async ({ page }) => {
    await reloadWithFirstMetric(page, {
        High: dashboard.dates.map(date => ({ x: date, y: 300 })),
        Missing: dashboard.dates.map(date => ({ x: date, y: null })),
        Low: dashboard.dates.map(date => ({ x: date, y: 100 })),
    });
    const metricOverview = page.locator('#metric-overview-1');

    // A population with no points sorts last, as if its highest value were 0.
    await expect(metricOverview.locator('.legend .legend-entry')).toHaveText([/High/, /Low/, /Missing/]);
    await expect(metricOverview.locator('g.chart-line path')).toHaveCount(2);

    for (const populationName of ['High', 'Low']) {
        const legendEntry = metricOverview.locator('.legend .legend-entry').filter({ hasText: populationName });
        const legendColor = await legendEntry.evaluate(element => getComputedStyle(element).color);
        expect(await lineWithColor(metricOverview, legendColor), `${populationName}'s line matches its legend entry`).not.toBeNull();
    }
});

test('A line is drawn in date order even when its data is not', async ({ page }) => {
    // Stepping through the dates 5 at a time visits each of the 12 once, out
    // of order.
    const shuffledDates = dashboard.dates.map((date, index) => dashboard.dates[(index * 5) % dashboard.dates.length]);
    await reloadWithFirstMetric(page, {
        Only: shuffledDates.map((date, index) => ({ x: date, y: 100 + index })),
    });

    const chart = page.locator('#metric-overview-1 svg.chart-svg');
    const readout = page.locator('#metric-overview-1 .chart-readout');
    const box = await chart.boundingBox();
    const readoutDates = [];
    for (const fraction of [.1, .3, .5, .7, .9]) {
        await page.mouse.move(box.x + box.width * fraction, box.y + box.height / 2);
        await expect(readout).not.toBeEmpty();
        readoutDates.push(Date.parse((await readout.textContent()).match(/— (.*):/)[1]));
    }

    readoutDates.slice(1).forEach((date, index) => expect(date).toBeGreaterThan(readoutDates[index]));
});

test('A line breaks across weeks its population is missing from, and a point left on its own is a dot', async ({ page }) => {
    // Oldest first. Sparse is missing two runs of weeks, leaving one week on
    // its own between them.
    const oldestFirst = dashboard.dates.toSorted();
    const sparseWeeks = oldestFirst.filter((date, index) => ![3, 4, 6, 7].includes(index));
    await reloadWithFirstMetric(page, {
        Steady: oldestFirst.map(date => ({ x: date, y: 300 })),
        Sparse: sparseWeeks.map(date => ({ x: date, y: 100 })),
    });
    const metricOverview = page.locator('#metric-overview-1');
    const sparseColor = await metricOverview.locator('.legend .legend-entry').filter({ hasText: 'Sparse' })
        .evaluate(element => getComputedStyle(element).color);

    const sparseLine = await lineWithColor(metricOverview, sparseColor);
    const visiblePieces = (await sparseLine.getAttribute('d')).split('M').filter(piece => /[LC]/.test(piece));
    expect(visiblePieces, 'the line is drawn in two pieces, either side of the gaps').toHaveLength(2);

    const dot = metricOverview.locator('g.chart-point circle');
    await expect(dot).toHaveCount(1);
    expect(await dot.evaluate(element => getComputedStyle(element).fill)).toBe(sparseColor);
});

test('Hovering a legend entry fades every other line until the pointer leaves', async ({ page }) => {
    const metricOverview = page.locator('#metric-overview-1');
    const opacities = () => metricOverview.locator('g.chart-line path')
        .evaluateAll(paths => paths.map(path => getComputedStyle(path).strokeOpacity));

    await expect(metricOverview.locator('g.chart-line path')).toHaveCount(expectedOrder.length);
    expect(await opacities()).toEqual(['1', '1', '1']);

    const bravo = metricOverview.locator('.legend .legend-entry').filter({ hasText: 'Bravo' });
    const bravoColor = await bravo.evaluate(element => getComputedStyle(element).color);
    await bravo.hover();

    await expect.poll(opacities).toContain('0.15');
    const bravoLine = await lineWithColor(metricOverview, bravoColor);
    expect(await bravoLine.evaluate(element => getComputedStyle(element).strokeOpacity)).toBe('1');
    expect((await opacities()).filter(opacity => opacity === '0.15')).toHaveLength(2);

    await page.mouse.move(0, 0);
    await expect.poll(opacities).toEqual(['1', '1', '1']);
});

test.describe('On a narrow screen', () => {
    test.use({ viewport: { width: 375, height: 800 } });

    test('A long population name is cut short in the readout, but the date and value are not', async ({ page }) => {
        const longName = 'gen12-tigerlake-gt2 integrated graphics on Windows 11';
        await reloadWithFirstMetric(page, {
            [longName]: dashboard.dates.map(date => ({ x: date, y: 12.5 })),
            Other: dashboard.dates.map(date => ({ x: date, y: 1 })),
        });

        const metricOverview = page.locator('#metric-overview-1');
        const box = await metricOverview.locator('svg.chart-svg').boundingBox();
        // The top of the chart is nearest the long-named population's line.
        await page.mouse.move(box.x + box.width / 2, box.y + 30);

        const readout = metricOverview.locator('.chart-readout');
        const population = readout.locator('.chart-readout-population');
        const value = readout.locator('.chart-readout-value');
        await expect(population).toHaveText(longName);
        await expect(population).toHaveAttribute('title', longName);
        await expect(value).toHaveText(/^ — \w+ \d+, \d{4}: 12\.500$/);

        const [readoutBox, populationBox, valueBox] = await Promise.all([readout.boundingBox(), population.boundingBox(), value.boundingBox()]);
        expect([readoutBox.height, populationBox.height, valueBox.height], 'the readout is one full-height line').toEqual([28, 28, 28]);
        expect(valueBox.x, 'the date and value start inside the readout').toBeGreaterThanOrEqual(readoutBox.x);
        expect(valueBox.x + valueBox.width).toBeLessThanOrEqual(readoutBox.x + readoutBox.width + 1);
        expect(populationBox.width, 'the name is cut short').toBeLessThan(await population.evaluate(element => element.scrollWidth));
        expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(375);
    });
});

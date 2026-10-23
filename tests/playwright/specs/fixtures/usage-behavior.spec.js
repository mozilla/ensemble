const { test, expect, readFixture } = require('../../fixtureData');
const { formatPercent } = require('../../utils');


const dashboard = readFixture('usage-behavior/index.json');
const tableIndex = dashboard.metrics.indexOf('top10addons') + 1;

// What the table should show for a region: the most recent date's rows,
// highest value first.
function expectedRanking(region) {
    const metric = readFixture(`usage-behavior/${region}/top10addons/index.json`);
    const mostRecentDate = Object.keys(metric.data.dates).sort().reverse()[0];
    const rows = metric.data.dates[mostRecentDate].rows.slice().sort((a, b) => b.value - a.value);
    return {
        title: metric.title,
        rows: rows.map((row, index) => [String(index + 1), row.name, formatPercent(row.value)]),
    };
}

test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard/usage-behavior');
});

test('The Top Add-ons table ranks the most recent date\'s rows by value', async ({ page }) => {
    const expected = expectedRanking(dashboard.defaultCategory);
    const table = page.locator(`#metric-overview-${tableIndex}`);

    await expect(table.locator('h4')).toHaveText(expected.title);
    const rows = table.locator('tbody tr');
    await expect(rows).toHaveCount(expected.rows.length);
    for (const [index, cells] of expected.rows.entries()) {
        await expect(rows.nth(index).locator('td')).toHaveText(cells);
    }
});

test('Choosing a region shows that region\'s complete ranking', async ({ page }) => {
    const worldwide = expectedRanking(dashboard.defaultCategory).rows;
    const germany = expectedRanking('Germany').rows;
    const rows = page.locator(`#metric-overview-${tableIndex} tbody tr`);

    expect(germany, 'The recording needs regions with different rankings').not.toEqual(worldwide);
    await expect(rows.first().locator('td')).toHaveText(worldwide[0]);

    await page.selectOption('#region-selector', 'Germany');

    await expect(rows).toHaveCount(germany.length);
    for (const [index, cells] of germany.entries()) {
        await expect(rows.nth(index).locator('td')).toHaveText(cells);
    }
});

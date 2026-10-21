const { test, expect, readFixture } = require('../../fixtureData');


const dashboard = readFixture('usage-behavior/index.json');
const tableIndex = dashboard.metrics.indexOf('top10addons') + 1;

// The rows the table should show for a region: the most recent date's rows,
// highest value first.
function expectedTopRow(region) {
    const metric = readFixture(`usage-behavior/${region}/top10addons/index.json`);
    const mostRecentDate = Object.keys(metric.data.dates).sort().reverse()[0];
    const rows = metric.data.dates[mostRecentDate].rows.slice().sort((a, b) => b.value - a.value);
    return { title: metric.title, firstName: rows[0].name, numRows: rows.length };
}

test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard/usage-behavior');
});

test('The Top Add-ons table ranks the most recent date\'s rows by value', async ({ page }) => {
    const expected = expectedTopRow(dashboard.defaultCategory);
    const table = page.locator(`#metric-overview-${tableIndex}`);

    await expect(table.locator('h4')).toHaveText(expected.title);
    await expect(table.locator('tbody tr')).toHaveCount(expected.numRows);
    await expect(table.locator('tbody tr').first().locator('td')).toHaveText(['1', expected.firstName, /^\d+\.\d{3}%$/]);
});

test('Choosing a region shows that region\'s table', async ({ page }) => {
    const worldwide = expectedTopRow(dashboard.defaultCategory);
    const germany = expectedTopRow('Germany');
    const firstName = page.locator(`#metric-overview-${tableIndex} tbody tr:first-child td:nth-child(2)`);

    expect(germany.firstName, 'The recording needs regions with different top add-ons').not.toBe(worldwide.firstName);
    await expect(firstName).toHaveText(worldwide.firstName);

    await page.selectOption('#region-selector', 'Germany');

    await expect(firstName).toHaveText(germany.firstName);
});

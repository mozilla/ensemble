const { test, expect, readFixture } = require('../../fixtureData');
const { formatPercent } = require('../../utils');

test('Choosing another summary date redraws the summary bars with that date\'s values', async ({ page }) => {
    const dashboard = readFixture('hardware/index.json');
    const slug = dashboard.summaryMetrics[0];
    const metric = readFixture(`hardware/default/${slug}/index.json`);
    const [newestDate, olderDate] = dashboard.dates;

    await page.route(
        url => decodeURIComponent(url.pathname).endsWith(`/hardware/default/${slug}/index.json`),
        route => route.fulfill({
            json: {
                ...metric,
                title: 'Controlled Vendors',
                data: {
                    populations: {
                        Intel: [{ x: newestDate, y: 60 }, { x: olderDate, y: 30 }],
                        AMD: [{ x: newestDate, y: 40 }, { x: olderDate, y: 70 }],
                    },
                },
            },
        })
    );
    await page.goto('/dashboard/hardware');
    const bar = page.locator('#summary-metrics .summary-metric').filter({ hasText: 'Controlled Vendors' });
    await expect(bar.locator('text.bar-label:visible')).toHaveText(['Intel (60%)']);

    await page.locator('#summary-metrics #date-selector').selectOption(olderDate);

    await expect(bar.locator('text.bar-label:visible')).toHaveText(['AMD (70%)']);
    await expect(bar.locator('text.bar-label')).toHaveText(['AMD (70%)', 'Intel (30%)']);
});

test('Choosing another table date shows that date\'s complete ranking', async ({ page }) => {
    const dashboard = readFixture('usage-behavior/index.json');
    const tableNumber = dashboard.metrics.indexOf('top10addons') + 1;
    const metric = readFixture(`usage-behavior/${dashboard.defaultCategory}/top10addons/index.json`);
    const olderDate = Object.keys(metric.data.dates).sort().reverse()[1];
    const expectedRows = metric.data.dates[olderDate].rows.slice()
        .sort((a, b) => b.value - a.value)
        .map((row, index) => [String(index + 1), row.name, formatPercent(row.value)]);

    await page.goto('/dashboard/usage-behavior');
    const table = page.locator(`#metric-overview-${tableNumber}`);
    await expect(table.locator('tbody tr')).not.toHaveCount(0);

    await table.locator('#date-selector').selectOption(olderDate);

    const rows = table.locator('tbody tr');
    await expect(rows).toHaveCount(expectedRows.length);
    for (const [index, cells] of expectedRows.entries()) {
        await expect(rows.nth(index).locator('td')).toHaveText(cells);
    }
});

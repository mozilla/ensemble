const { test, expect, readFixture } = require('../../fixtureData');


const dashboard = readFixture('hardware/index.json');
const slug = dashboard.summaryMetrics[0];

test.beforeEach(async ({ page }) => {
    const metric = readFixture(`hardware/default/${slug}/index.json`);
    const onActiveDate = value => [{ x: dashboard.dates[0], y: value }];

    await page.route(
        url => decodeURIComponent(url.pathname).endsWith(`/hardware/default/${slug}/index.json`),
        route => route.fulfill({
            json: {
                ...metric,
                title: 'Controlled Vendors',
                data: {
                    populations: {
                        Intel: onActiveDate(50),
                        AMD: onActiveDate(30),
                        NVIDIA: onActiveDate(15),
                        VIA: onActiveDate(2),
                        Matrox: onActiveDate(3),
                    },
                },
            },
        })
    );

    await page.goto('/dashboard/hardware');
});

function summaryBar(page) {
    return page.locator('#summary-metrics .summary-metric').filter({ hasText: 'Controlled Vendors' });
}

test('The largest segment\'s label shows first', async ({ page }) => {
    const bar = summaryBar(page);

    await expect(bar.locator('text.bar-label', { hasText: 'Intel (50%)' })).toBeVisible();
    await expect(bar.locator('text.bar-label:visible')).toHaveCount(1);
});

test('Hovering a segment shows its label and hides the previous one', async ({ page }) => {
    const bar = summaryBar(page);
    await expect(bar.locator('text.bar-label', { hasText: 'Intel (50%)' })).toBeVisible();

    await bar.locator('rect.bar').nth(1).hover();

    await expect(bar.locator('text.bar-label', { hasText: 'AMD (30%)' })).toBeVisible();
    await expect(bar.locator('text.bar-label', { hasText: 'Intel (50%)' })).toBeHidden();
    await expect(bar.locator('text.bar-label:visible')).toHaveCount(1);
});

test('Clicking a segment shows its label and hides the previous one', async ({ page }) => {
    const bar = summaryBar(page);
    await bar.locator('rect.bar').nth(1).hover();
    await expect(bar.locator('text.bar-label', { hasText: 'AMD (30%)' })).toBeVisible();

    await bar.locator('rect.bar').last().click();

    await expect(bar.locator('text.bar-label', { hasText: 'Other (5%)' })).toBeVisible();
    await expect(bar.locator('text.bar-label', { hasText: 'AMD (30%)' })).toBeHidden();
    await expect(bar.locator('text.bar-label:visible')).toHaveCount(1);
});

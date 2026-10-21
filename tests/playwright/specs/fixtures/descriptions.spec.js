const { test, expect, readFixture } = require('../../fixtureData');


test('Metric descriptions render Markdown links and escape raw HTML', async ({ page }) => {
    const dashboard = readFixture('user-activity/index.json');
    const slug = dashboard.metrics[0];
    const metric = readFixture(`user-activity/${dashboard.defaultCategory}/${slug}/index.json`);
    await page.route(
        url => decodeURIComponent(url.pathname).endsWith(`/user-activity/${dashboard.defaultCategory}/${slug}/index.json`),
        route => route.fulfill({
            json: {
                ...metric,
                description: ['See the [methodology](https://example.com/methodology).', '<img src=x onerror=alert(1)> stays text.'],
            },
        })
    );

    await page.goto('/dashboard/user-activity');

    const description = page.locator('#metric-overview-1 .metric-description');
    await expect(description.getByRole('link', { name: 'methodology' })).toHaveAttribute('href', 'https://example.com/methodology');
    await expect(description).toContainText('<img src=x onerror=alert(1)> stays text.');
    await expect(description.locator('img')).toHaveCount(0);
});

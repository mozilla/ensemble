const { test, expect, readFixture } = require('../../fixtureData');
const { holdRequests } = require('../../utils');


test('A dashboard asks for its data before its code has arrived', async ({ page }) => {
    const releaseCode = await holdRequests(page, url => url.pathname.includes('DashboardContainer'));
    const dataRequested = page.waitForRequest(
        request => request.url().endsWith('/user-activity/index.json'),
        { timeout: 10000 }
    );

    await page.goto('/dashboard/user-activity', { waitUntil: 'commit' });
    await dataRequested;
    releaseCode();

    await expect(page.locator('#dashboard-title')).toHaveText(readFixture('user-activity/index.json').title);
});

const { test, expect, readFixture } = require('../../fixtureData');


test('The proceed buttons walk from the home page through every dashboard', async ({ page }) => {
    await page.goto('/');

    for (const key of ['user-activity', 'usage-behavior', 'hardware']) {
        await page.locator('.next-button a').click();

        await expect(page).toHaveURL(`/dashboard/${key}`);
        await expect(page.locator('#dashboard-title')).toHaveText(readFixture(`${key}/index.json`).title);
    }

    await expect(page.locator('.next-button')).toHaveCount(0);
});

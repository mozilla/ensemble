const { test, expect, readFixture } = require('../../fixtureData');
const { nextButtons } = require('../../../../src/config.json');


test('The proceed buttons walk from the home page through every dashboard', async ({ page }) => {
    await page.goto('/');

    for (const { from, to, text } of nextButtons) {
        await expect(page).toHaveURL(from);
        // Wait for this page's button, not the previous page's, before clicking.
        const button = page.locator('.next-button a');
        await expect(button).toHaveText(text);

        await button.click();

        await expect(page).toHaveURL(to);
        await expect(page.locator('#dashboard-title')).toHaveText(readFixture(`${to.replace('/dashboard/', '')}/index.json`).title);
    }

    await expect(page.locator('.next-button')).toHaveCount(0);
});

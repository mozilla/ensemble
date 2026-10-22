const { test, expect } = require('../fixtureData');


test.beforeEach(async ({ page }) => {
    await page.goto('/');
});

test('Footer appears', async ({ page }) => {
    await expect(page.locator('footer')).toBeVisible();
});

const { test, expect } = require('../fixtureData');


test.beforeEach(async ({ page }) => {
    await page.goto('/contact');
});

test('Page loads', async ({ page }) => {
    await expect(page.locator('#contact')).toBeVisible();
});

test('Page <title> is correct', async ({ page }) => {
    await expect(page.locator('#contact')).toBeVisible();
    await expect(page).toHaveTitle('Contact | Firefox Public Data Report');
});

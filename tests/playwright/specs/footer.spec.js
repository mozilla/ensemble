const { test, expect } = require('@playwright/test');


test.beforeEach(async ({ page }) => {
    await page.goto('/');
});

test('Footer appears', async ({ page }) => {
    await expect(page.locator('footer')).toBeVisible();
});

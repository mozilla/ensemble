const { test, expect } = require('@playwright/test');


test.beforeEach(async ({ page }) => {
    await page.goto('/');
});

test('React app renders', async ({ page }) => {
    await expect(page.locator('#application')).toBeVisible();
});

test('Site <h1> is correct', async ({ page }) => {
    await expect(page.locator('h1')).toHaveText('Firefox Public Data Report');
});

test('<noscript> message is not displayed', async ({ page }) => {
    await expect(page.locator('#enable-javascript')).toHaveCount(0);
    await expect(page.locator('body')).not.toContainText('JavaScript');
});

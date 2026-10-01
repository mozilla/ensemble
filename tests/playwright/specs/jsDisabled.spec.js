const { test, expect } = require('@playwright/test');


test.beforeEach(async ({ page }) => {
    await page.goto('/');
});

test('Page <title> is correct when JavaScript is disabled', async ({ page }) => {
    await expect(page.locator('title')).toBeAttached();

    // Ensure that React does *not* load. We already test that React sets the
    // correct title (see home.spec.js), but here we want to ensure the title
    // is correct in index.html to begin with.
    await expect(page.locator('#application')).toHaveCount(0);

    await expect(page).toHaveTitle('Firefox Public Data Report');
});

test('Correct <noscript> message is displayed when JavaScript is disabled', async ({ page }) => {
    await expect(page.locator('#enable-javascript')).toBeVisible();
    await expect(page.locator('#enable-javascript')).toHaveText('You need to enable JavaScript to run this app.');
});

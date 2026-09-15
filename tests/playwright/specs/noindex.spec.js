const { test, expect } = require('@playwright/test');


const selector = 'meta[name="robots"][content="noindex"]';

test('noindex meta tag is not present for valid paths', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator(selector)).toHaveCount(0);

    await page.goto('/dashboard/user-activity');
    await expect(page.locator(selector)).toHaveCount(0);

    await page.goto('/dashboard/usage-behavior');
    await expect(page.locator(selector)).toHaveCount(0);

    await page.goto('/dashboard/hardware');
    await expect(page.locator(selector)).toHaveCount(0);
});

test('noindex meta tag is present for invalid paths', async ({ page }) => {
    await page.goto('/some-long-url-that-will-never-ever-exist');
    await expect(page.locator(selector)).toHaveCount(1);
});

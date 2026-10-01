const { test, expect } = require('@playwright/test');


test('Not Found page loads for paths with superfluous suffixes', async ({ page }) => {
    await page.goto('/dashboard/user-activity/some-extra-directory-that-will-never-exist');
    await expect(page.locator('#not-found')).toBeVisible();

    await page.goto('/dashboard/usage-behavior/some-extra-directory-that-will-never-exist');
    await expect(page.locator('#not-found')).toBeVisible();

    await page.goto('/dashboard/hardware/some-extra-directory-that-will-never-exist');
    await expect(page.locator('#not-found')).toBeVisible();
});

test('Not Found page loads for non-existent URLs', async ({ page }) => {
    await page.goto('/some-long-url-that-will-never-ever-exist');
    await expect(page.locator('#not-found')).toBeVisible();
});

const { test, expect } = require('@playwright/test');
const { linksWork } = require('../utils');


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

test('All links work', async ({ page }) => {
    await expect(page.locator('#contact')).toBeVisible();
    await linksWork(page, '#contact a');
});

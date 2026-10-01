const { test, expect } = require('@playwright/test');
const { linksWork, flagForUpdate } = require('../utils');


test.beforeEach(async ({ page }) => {
    await page.goto('/');
});

test('The correct menu links appear in the correct order', async ({ page }) => {
    await expect(page.locator('#main-navigation li:nth-child(1) a')).toHaveText('User Activity');
    await expect(page.locator('#main-navigation li:nth-child(2) a')).toHaveText('Usage Behavior');
    await expect(page.locator('#main-navigation li:nth-child(3) a')).toHaveText('Hardware');
    await expect(page.locator('#main-navigation li:nth-child(4) a')).toHaveText('Contact');

    await flagForUpdate(page, '#main-navigation li a', 'menu items', 4);
});

test('All menu links work', async ({ page }) => {
    await linksWork(page, '#main-navigation a');
});

const { test } = require('@playwright/test');
const { linksWork } = require('../utils');


test.beforeEach(async ({ page }) => {
    await page.goto('/');
});

test('All footer links work', async ({ page }) => {
    await page.locator('footer').waitFor({ state: 'visible' });
    await linksWork(page, 'footer a');
});

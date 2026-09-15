const { test, expect } = require('@playwright/test');
const { linkWorks, linksWork } = require('../utils');


test.beforeEach(async ({ page }) => {
    await page.goto('/');
});

test('Page <title> is correct', async ({ page }) => {
    // Wait for the homepage to load before checking the title. This test
    // would technically pass without this line because Home.jsx uses the
    // same <title> as the static index.html, but it wouldn't be a proper
    // test - it would pass even if Home.jsx wrongly changed the <title> to
    // something else.
    await expect(page.locator('#introduction')).toBeVisible();

    await expect(page).toHaveTitle('Firefox Public Data Report');
});

test('All introduction links work', async ({ page }) => {
    await expect(page.locator('#introduction')).toBeVisible();
    await linksWork(page, '#introduction a');
});

test('The "proceed button" appears', async ({ page }) => {
    await expect(page.locator('.next-button')).toBeVisible();
});

test('The "proceed button" text is correct', async ({ page }) => {
    await expect(page.locator('.next-button')).toHaveText('Proceed to User Activity');
});

test('The "proceed button" works', async ({ page }) => {
    await expect(page.locator('.next-button')).toBeVisible();
    await linkWorks(page, '.next-button a');
});

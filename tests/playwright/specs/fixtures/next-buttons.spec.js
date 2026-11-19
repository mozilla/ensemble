const { test, expect, readFixture } = require('../../fixtureData');
const { holdRequests } = require('../../utils');
const { nextButtons } = require('../../../../src/config.json');


test('The proceed buttons walk from the home page through every dashboard', async ({ page }) => {
    await page.goto('/');

    for (const { from, to, text } of nextButtons) {
        await expect(page).toHaveURL(from);
        // Wait for this page's button, not the previous page's, before clicking.
        const button = page.locator('.next-button a');
        await expect(button).toHaveText(text);

        await button.click();

        await expect(page).toHaveURL(to);
        await expect(page.locator('#dashboard-title')).toHaveText(readFixture(`${to.replace('/dashboard/', '')}/index.json`).title);
    }

    await expect(page.locator('.next-button')).toHaveCount(0);
});

test('A dashboard\'s proceed button waits for the dashboard, rather than jumping down the page when it arrives', async ({ page }) => {
    const releaseData = await holdRequests(page, url => url.pathname.endsWith('/user-activity/index.json'));
    await page.goto('/dashboard/user-activity');

    // The dashboard's own spinner, which the button follows, not the one
    // shown while the dashboard's code loads.
    const button = page.locator('main > .spinner + .next-button');
    await expect(button).toBeAttached();
    await expect(button).toBeHidden();

    releaseData();
    await expect(page.locator('#dashboard-title')).toBeVisible();
    await expect(page.locator('.next-button')).toBeVisible();
});

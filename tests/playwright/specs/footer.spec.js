const { test, expect } = require('../fixtureData');


test('Footer appears', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('footer')).toBeVisible();
});

// The 375px window is tall enough to fit the header, the page, and the footer,
// which on a phone is taller than many phone screens.
for (const [width, height] of [[1280, 900], [375, 1000]]) {
    for (const path of ['/contact', '/this-page-does-not-exist']) {
        test(`On a page shorter than the window, the footer sits at the bottom of the window (${path} at ${width}×${height})`, async ({ page }) => {
            await page.setViewportSize({ width, height });
            await page.goto(path);
            const footer = page.locator('footer');
            await expect(footer).toBeVisible();

            const { y, height: footerHeight } = await footer.boundingBox();
            expect(Math.abs(y + footerHeight - height)).toBeLessThan(1);
        });
    }
}

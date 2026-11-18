const { test, expect } = require('../fixtureData');


test('Footer appears', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('footer')).toBeVisible();
});

const notFoundPaths = ['/this-page-does-not-exist', '/dashboard/not-a-dashboard'];

// The 375px window is tall enough to fit the header, the page, and the footer,
// which on a phone is taller than many phone screens.
for (const [width, height] of [[1280, 900], [375, 1000]]) {
    for (const path of ['/contact', ...notFoundPaths]) {
        test(`On a page shorter than the window, the footer sits at the bottom of the window (${path} at ${width}×${height})`, async ({ page }) => {
            test.skip(
                notFoundPaths.includes(path) && Boolean(process.env.PLAYWRIGHT_BASE_URL),
                'A deployed site answers unknown paths with Cloud Storage\'s own 404, not the app'
            );
            await page.setViewportSize({ width, height });
            await page.goto(path);
            const footer = page.locator('footer');
            await expect(footer).toBeVisible();

            const { y, height: footerHeight } = await footer.boundingBox();
            expect(Math.abs(y + footerHeight - height)).toBeLessThan(1);
        });
    }
}

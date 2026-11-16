const { test, expect } = require('../fixtureData');


test.beforeEach(async ({ page }) => {
    await page.goto('/');
});

test('Body links use the accessible link colour and change on hover', async ({ page }) => {
    const link = page.locator('main a').first();

    await expect(link).toHaveCSS('color', 'rgb(0, 96, 223)');
    await expect(link).toHaveCSS('text-decoration-line', 'none');

    await link.hover();
    await expect(link).toHaveCSS('color', 'rgb(2, 80, 187)');
    await expect(link).toHaveCSS('text-decoration-line', 'underline');
});

test('Header navigation links are underlined on hover', async ({ page }) => {
    const link = page.locator('#main-navigation a').first();

    await expect(link).toHaveCSS('text-decoration-line', 'none');
    await link.hover();
    await expect(link).toHaveCSS('text-decoration-line', 'underline');
});

test('Next button uses the Flare primary button colours', async ({ page }) => {
    const link = page.locator('.next-button a');

    await expect(link).toHaveCSS('background-color', 'rgb(117, 67, 227)');
    await expect(link).toHaveCSS('color', 'rgb(255, 255, 255)');
    await link.hover();
    await expect(link).toHaveCSS('background-color', 'rgb(97, 50, 188)');
});

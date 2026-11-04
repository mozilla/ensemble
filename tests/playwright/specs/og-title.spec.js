const { test, expect } = require('../fixtureData');


const pages = [
    ['/', 'Firefox Public Data Report'],
    ['/contact', 'Contact | Firefox Public Data Report'],
    ['/dashboard/hardware', 'Hardware Across the Web | Firefox Public Data Report'],
];

for (const [path, title] of pages) {
    test(`${path} replaces the static og:title with its own`, async ({ page }) => {
        await page.goto(path);
        await expect(page).toHaveTitle(title);

        const ogTitle = page.locator('meta[property="og:title"]');
        await expect(ogTitle).toHaveCount(1);
        await expect(ogTitle).toHaveAttribute('content', title);
    });
}

test('Navigating between pages keeps a single og:title', async ({ page }) => {
    await page.goto('/contact');
    await page.locator('#main-navigation a', { hasText: 'Hardware' }).click();
    await expect(page).toHaveTitle('Hardware Across the Web | Firefox Public Data Report');

    const ogTitle = page.locator('meta[property="og:title"]');
    await expect(ogTitle).toHaveCount(1);
    await expect(ogTitle).toHaveAttribute('content', 'Hardware Across the Web | Firefox Public Data Report');
});

const { test, expect } = require('../../fixtureData');

const plausibleURL = /^https:\/\/pa\.firefox\.com\//;

test('Plausible\'s script is requested, and told to send events to pa.firefox.com', async ({ page }) => {
    const scriptRequest = page.waitForRequest(/^https:\/\/pa\.firefox\.com\/js\/pa-[^/]+\.js$/);

    await page.goto('/');

    await scriptRequest;
    expect(await page.evaluate(() => window.plausible.o)).toEqual({ endpoint: 'https://pa.firefox.com/api/event' });
});

for (const [signal, setSignal] of [
    ['Global Privacy Control', () => Object.defineProperty(navigator, 'globalPrivacyControl', { value: true })],
    ['Do Not Track', () => Object.defineProperty(navigator, 'doNotTrack', { value: '1' })],
]) {
    test(`Plausible is not loaded when ${signal} is on`, async ({ page }) => {
        const requestedURLs = [];
        page.on('request', request => requestedURLs.push(request.url()));
        await page.addInitScript(setSignal);

        await page.goto('/');

        await expect(page.locator('#introduction')).toBeVisible();
        expect(requestedURLs.filter(url => plausibleURL.test(url))).toEqual([]);
        expect(await page.evaluate(() => window.plausible)).toBeUndefined();
    });
}

test.describe('With the analytics module blocked, as a content blocker might', () => {
    test.use({ allowedErrors: /Failed to load resource|Failed to fetch dynamically imported module/ });

    test('the site still loads', async ({ page }) => {
        await page.route(/\/lib\/measure\.js/, route => route.abort('blockedbyclient'));

        await page.goto('/');

        await expect(page.locator('#introduction')).toBeVisible();
        expect(await page.evaluate(() => window.plausible)).toBeUndefined();
    });
});

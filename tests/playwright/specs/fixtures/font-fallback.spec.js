const { test, expect } = require('../../fixtureData');
const { holdRequests } = require('../../utils');


for (const [path, ready] of [['/', '#introduction'], ['/dashboard/user-activity', '#dashboard-title']]) {
    // At 412px the navigation wraps differently in other fonts, so a fallback
    // the wrong width moves most of the page.
    for (const width of [375, 412, 1280]) {
        test(`${path} barely moves when the webfonts arrive, at ${width}px`, async ({ page }) => {
            await page.setViewportSize({ width, height: 900 });
            await page.addInitScript(() => {
                window.layoutShift = 0;
                new PerformanceObserver(list => {
                    for (const entry of list.getEntries()) window.layoutShift += entry.value;
                }).observe({ type: 'layout-shift', buffered: true });
            });
            const releaseFonts = await holdRequests(page, url => url.pathname.endsWith('.woff2'));
            // Fonts in use hold up the load event.
            await page.goto(path, { waitUntil: 'domcontentloaded' });
            await expect(page.locator(ready)).toBeVisible();
            await expect(page.locator('.spinner, .metric-overview-placeholder')).toHaveCount(0);
            const before = await page.evaluate(() => window.layoutShift);

            releaseFonts();
            await page.waitForLoadState('load');
            await page.evaluate(() => document.fonts.ready);
            await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));

            const shift = await page.evaluate(() => window.layoutShift) - before;
            expect(shift).toBeLessThan(0.01);
        });
    }
}

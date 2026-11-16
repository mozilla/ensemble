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

test.describe('Footer content', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/');
    });

    test('Footer sections and logo are correct', async ({ page }) => {
        await expect(page.locator('.c-footer-heading')).toHaveText(['Mozilla', 'Firefox']);
        await expect(page.locator('.c-footer-primary-logo a')).toHaveAttribute('href', 'https://www.firefox.com/');
    });

    test('Footer Mozilla links are correct', async ({ page }) => {
        const links = page.locator('.c-footer-section:nth-child(1) .c-footer-list > li > a');

        await expect(links).toHaveText(['Mozilla.org', 'About', 'Donate', 'Data Privacy Principles']);
        expect(await links.evaluateAll(els => els.map(el => el.getAttribute('href')))).toEqual([
            'https://www.mozilla.org/',
            'https://www.mozilla.org/about/',
            'https://donate.mozilla.org/',
            'https://www.mozilla.org/privacy/principles/',
        ]);
    });

    test('Footer Firefox links are correct', async ({ page }) => {
        const links = page.locator('.c-footer-section:nth-child(2) .c-footer-list > li > a');

        await expect(links).toHaveText(['Download Firefox', 'Release Notes', 'Support', 'Firefox Privacy Notice']);
        expect(await links.evaluateAll(els => els.map(el => el.getAttribute('href')))).toEqual([
            'https://www.firefox.com/',
            'https://www.firefox.com/firefox/notes/',
            'https://support.mozilla.org/',
            'https://www.mozilla.org/privacy/firefox/',
        ]);
    });

    test('Footer social and legal links are correct', async ({ page }) => {
        const hrefs = selector => page.locator(selector).evaluateAll(els => els.map(el => el.getAttribute('href')));

        expect(await hrefs('.c-footer-links-social a')).toEqual([
            'https://bsky.app/profile/mozilla.org',
            'https://www.instagram.com/mozilla/',
            'https://www.linkedin.com/company/mozilla-corporation/',
            'https://www.tiktok.com/@mozilla',
            'https://open.spotify.com/show/0vT7LJMeVDxyQ2ZamHKu08?si=_uDRD6bRR_6M5YZyISGXgA',
            'https://bsky.app/profile/firefox.com',
            'https://www.instagram.com/firefox/',
            'https://www.youtube.com/user/firefoxchannel',
            'https://www.tiktok.com/@firefox',
        ]);
        expect(await hrefs('.c-footer-terms a')).toEqual([
            'https://www.mozilla.org/privacy/',
            'https://www.mozilla.org/privacy/websites/#cookies',
            'https://www.mozilla.org/about/legal/',
            'https://www.mozilla.org/about/legal/fraud-report/',
            'https://github.com/mozilla/ensemble',
        ]);
    });

    test('Footer links open in a new tab', async ({ page }) => {
        const links = page.locator('footer a');
        await expect(links.first()).toHaveAttribute('target', '_blank');
        expect(await links.evaluateAll(els => els.every(el => el.target === '_blank' && el.rel === 'noopener noreferrer'))).toBe(true);
    });
});

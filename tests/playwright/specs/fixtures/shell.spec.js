const { test, expect } = require('../../fixtureData');
const { holdRequests } = require('../../utils');


// The copy of the header that index.html shows until React renders.
async function shellMarkup(request) {
    const html = await (await request.get('/')).text();
    return html.match(/<div class="app-shell">.*?<\/main><\/div>/s)[0];
}

const headerBoxes = page => page.locator('#main-header, #main-header h1, #main-header li').evaluateAll(
    elements => elements.map(element => {
        const { x, y, width, height } = element.getBoundingClientRect();
        return { x, y, width, height };
    })
);

test('The header in index.html has the markup React renders', async ({ page, request }) => {
    const shellHeader = (await shellMarkup(request)).match(/<header.*<\/header>/s)[0];
    await page.goto('/');

    // react-router marks its links with data-discover, which the copy has no use for.
    const renderedHeader = await page.locator('#application #main-header').evaluate(
        header => header.outerHTML.replaceAll(' data-discover="true"', '')
    );
    expect(renderedHeader).toBe(shellHeader);
});

for (const width of [375, 1280]) {
    test(`The header in index.html sits where React's does at ${width}px`, async ({ page, request }) => {
        const shell = await shellMarkup(request);
        await page.setViewportSize({ width, height: 900 });
        await page.goto('/');
        await expect(page.locator('#application')).toBeAttached();
        await page.evaluate(() => document.fonts.ready);
        const rendered = await headerBoxes(page);

        // The development server adds the styles with the scripts, so swap the
        // copy back in once they're on the page.
        await page.evaluate(markup => {
            document.getElementById('root').innerHTML = markup;
        }, shell);
        const shown = await headerBoxes(page);

        expect(shown).toEqual(rendered);
        const footerTop = page.locator('footer');
        await expect(footerTop).toHaveCount(0);
        expect(await page.locator('.app-shell main').evaluate(main => main.getBoundingClientRect().bottom))
            .toBeGreaterThanOrEqual(900);
    });
}

test('The footer stays below the window while the home page\'s code loads', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 800 });
    const releaseCode = await holdRequests(page, url => url.pathname.endsWith('/views/Home.jsx'));
    await page.goto('/', { waitUntil: 'commit' });

    await expect(page.locator('main > .spinner')).toBeAttached();
    expect(await page.locator('footer').evaluate(footer => footer.getBoundingClientRect().top))
        .toBeGreaterThanOrEqual(800);

    releaseCode();
    await expect(page.locator('#introduction')).toBeVisible();
});

test('The header in index.html is styled before the scripts run', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    const releaseScripts = await holdRequests(page, url => url.pathname === '/src/index.jsx');
    // Module scripts run before DOMContentLoaded, so that waits for them too.
    await page.goto('/', { waitUntil: 'commit' });
    await expect(page.locator('.app-shell #main-header')).toHaveCSS('display', 'flex');
    await page.evaluate(() => document.fonts.ready);
    const shown = await headerBoxes(page);

    releaseScripts();
    await expect(page.locator('#application')).toBeAttached();
    await page.evaluate(() => document.fonts.ready);
    expect(await headerBoxes(page)).toEqual(shown);
});

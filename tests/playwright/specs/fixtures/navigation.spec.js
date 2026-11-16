const { test, expect, readFixture } = require('../../fixtureData');
const { holdRequests } = require('../../utils');


const loadingSelector = '.spinner, .metric-overview-placeholder, .summary-metric[aria-hidden="true"]';

const pages = {
    'Hardware': '/dashboard/hardware',
    'User Activity': '/dashboard/user-activity',
    'Usage Behavior': '/dashboard/usage-behavior',
    'Contact': '/contact',
    'Home': '/',
};

async function waitUntilShown(page, linkText) {
    await expect(page).toHaveURL(pages[linkText]);
    if (linkText === 'Contact') {
        await expect(page.locator('#contact')).toBeVisible();
        return;
    }
    if (linkText === 'Home') {
        await expect(page.locator('#introduction')).toBeVisible();
        return;
    }

    const dashboard = readFixture(`${pages[linkText].split('/').at(-1)}/index.json`);
    const metricCount = dashboard.sections
        ? dashboard.sections.flatMap(section => section.metrics).length
        : dashboard.metrics.length;
    await expect(page.locator('.metric-and-legend').locator('svg.chart-svg, .customizable-date')).toHaveCount(metricCount);
    await expect(page.locator('#summary-metrics .summary-metric:not([aria-hidden]):has(rect.bar)')).toHaveCount((dashboard.summaryMetrics || []).length);
    await expect(page.locator(loadingSelector)).toHaveCount(0);
}

async function navigateTo(page, linkText) {
    const link = linkText === 'Home'
        ? page.locator('#main-header h1 a')
        : page.locator('#main-navigation a', { hasText: linkText });
    await link.click();
    await waitUntilShown(page, linkText);
}

test('Going back to a page already visited shows it without loading anything', async ({ page }) => {
    const datasetRequests = [];
    page.on('request', request => {
        if (request.url().includes('/datasets/')) datasetRequests.push(request.url());
    });

    await page.goto(pages['Hardware']);
    await waitUntilShown(page, 'Hardware');
    await navigateTo(page, 'User Activity');
    await navigateTo(page, 'Contact');

    // Record every loading state added from here on, including one inside a
    // larger piece of the page added at once.
    await page.evaluate(selector => {
        window.loadingStatesShown = [];
        new MutationObserver(records => {
            for (const record of records) {
                for (const node of record.addedNodes) {
                    if (node.nodeType !== Node.ELEMENT_NODE) continue;
                    const shown = [...(node.matches(selector) ? [node] : []), ...node.querySelectorAll(selector)];
                    window.loadingStatesShown.push(...shown.map(element => element.className));
                }
            }
        }).observe(document.querySelector('#application'), { childList: true, subtree: true });
    }, loadingSelector);
    datasetRequests.length = 0;

    for (const linkText of ['Hardware', 'Contact', 'User Activity', 'Hardware']) {
        await navigateTo(page, linkText);
    }

    expect(await page.evaluate(() => window.loadingStatesShown)).toEqual([]);
    expect(datasetRequests).toEqual([]);
});

test('The Next button opens the next page at the top, even when it was visited before', async ({ page }) => {
    await page.goto(pages['Hardware']);
    await waitUntilShown(page, 'Hardware');
    await navigateTo(page, 'Usage Behavior');

    const nextButton = page.getByRole('link', { name: 'Proceed to Hardware' });
    await nextButton.scrollIntoViewIfNeeded();
    expect(await page.evaluate(() => window.scrollY)).toBeGreaterThan(0);
    // Chromium happens to land at the top on its own, but Firefox and Safari
    // keep the old position, so also check that the page asks for the top.
    await page.evaluate(() => {
        window.scrolledTo = [];
        const originalScrollTo = window.scrollTo.bind(window);
        window.scrollTo = (...position) => {
            window.scrolledTo.push(position);
            originalScrollTo(...position);
        };
    });
    await nextButton.click();
    await waitUntilShown(page, 'Hardware');

    expect(await page.evaluate(() => window.scrolledTo)).toContainEqual([0, 0]);
    expect(await page.evaluate(() => window.scrollY)).toBe(0);
});

function focusedElement(page) {
    return page.evaluate(() => {
        const element = document.activeElement;
        return element.id ? `#${element.id}` : element.tagName.toLowerCase();
    });
}

test('The first page leaves focus where the browser puts it', async ({ page }) => {
    await page.goto(pages['Hardware']);
    await waitUntilShown(page, 'Hardware');

    expect(await focusedElement(page)).toBe('body');
});

test('A header link moves focus to the new page\'s heading, and Tab continues from there', async ({ page }) => {
    await page.goto(pages['Hardware']);
    await waitUntilShown(page, 'Hardware');
    await navigateTo(page, 'Contact');

    await expect(page.getByRole('heading', { name: 'Contact' })).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(page.locator('#contact a[href^="mailto:"]')).toBeFocused();
});

test('A page with no heading of its own gives focus to main', async ({ page }) => {
    await page.goto(pages['Contact']);
    await waitUntilShown(page, 'Contact');
    await navigateTo(page, 'Home');

    await expect(page.locator('main')).toBeFocused();
});

test('On a first visit, main holds focus until the dashboard\'s heading arrives and takes it', async ({ page }) => {
    await page.goto(pages['Usage Behavior']);
    await waitUntilShown(page, 'Usage Behavior');
    const releaseDashboard = await holdRequests(page, url => decodeURIComponent(url.pathname).endsWith('/hardware/index.json'));

    await page.getByRole('link', { name: 'Proceed to Hardware' }).click();
    await expect(page.locator('main > .spinner')).toBeAttached();
    await expect(page.locator('main')).toBeFocused();

    releaseDashboard();
    await waitUntilShown(page, 'Hardware');
    await expect(page.locator('#dashboard-title')).toBeFocused();
    expect(await page.evaluate(() => window.scrollY)).toBe(0);
});

test('A heading that arrives after the reader has moved focus leaves focus where it is', async ({ page }) => {
    await page.goto(pages['Contact']);
    await waitUntilShown(page, 'Contact');
    const releaseDashboard = await holdRequests(page, url => decodeURIComponent(url.pathname).endsWith('/hardware/index.json'));

    await page.locator('#main-navigation a', { hasText: 'Hardware' }).click();
    await expect(page.locator('main')).toBeFocused();
    await page.keyboard.press('Tab');
    const movedTo = await focusedElement(page);
    expect(movedTo).not.toBe('main');

    releaseDashboard();
    await waitUntilShown(page, 'Hardware');
    expect(await focusedElement(page)).toBe(movedTo);
});

test('On a revisit, the Next button moves focus straight to the heading, and Back focuses the earlier page\'s heading without scrolling to the top', async ({ page }) => {
    await page.goto(pages['Hardware']);
    await waitUntilShown(page, 'Hardware');
    await navigateTo(page, 'Usage Behavior');

    const nextButton = page.getByRole('link', { name: 'Proceed to Hardware' });
    await nextButton.scrollIntoViewIfNeeded();
    await nextButton.click();
    await expect(page.locator('#dashboard-title')).toBeFocused();
    await expect(page.locator(loadingSelector)).toHaveCount(0);

    await page.goBack();
    await waitUntilShown(page, 'Usage Behavior');
    await expect(page.locator('#dashboard-title')).toHaveText(readFixture('usage-behavior/index.json').title);
    await expect(page.locator('#dashboard-title')).toBeFocused();
    expect(await page.evaluate(() => window.scrollY)).toBeGreaterThan(0);
});

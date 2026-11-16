const { test, expect, readFixture } = require('../../fixtureData');


const loadingSelector = '.spinner, .metric-overview-placeholder, .summary-metric[aria-hidden="true"]';

const pages = {
    'Hardware': '/dashboard/hardware',
    'User Activity': '/dashboard/user-activity',
    'Usage Behavior': '/dashboard/usage-behavior',
    'Contact': '/contact',
};

async function waitUntilShown(page, linkText) {
    await expect(page).toHaveURL(pages[linkText]);
    if (linkText === 'Contact') {
        await expect(page.locator('#contact')).toBeVisible();
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
    await page.locator('#main-navigation a', { hasText: linkText }).click();
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

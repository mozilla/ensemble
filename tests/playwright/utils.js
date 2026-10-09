const { expect } = require('@playwright/test');


// External links aren't checked: third-party bot walls, outages, and rate
// limits made them fail for reasons unrelated to this repository's code.
// Loading a URL the React app manages itself doesn't return a 404 - it
// displays a "Not Found" message instead, so a booted app is confirmed via
// #application before checking #not-found is absent (otherwise a page that
// never booted at all would also lack #not-found and look like a pass).
async function loadsSuccessfully(page, url) {
    if (new URL(url).origin !== new URL(page.url()).origin) return;

    await page.goto(url);
    await expect(page.locator('#application'), `App booted for: ${url}`).toBeVisible();
    await expect(page.locator('#not-found'), `Loaded successfully: ${url}`).not.toBeVisible();
    await page.goBack();
}

async function linkWorks(page, selector) {
    const href = await page.locator(selector).evaluate(el => el.href);
    await loadsSuccessfully(page, href);
}

async function linksWork(page, selector) {
    const hrefs = await page.locator(selector).evaluateAll(els => els.map(el => el.href));

    for (const href of hrefs) {
        await loadsSuccessfully(page, href);
    }
}

// If a test assumes that a certain number of elements exist, but a different
// number of elements exist, fail the test and explain why.
async function flagForUpdate(page, selector, collectiveName, numExpectedElements) {
    const numActualElements = await page.locator(selector).count();

    if (numActualElements !== numExpectedElements) {
        const isAreExpected = numExpectedElements === 1 ? 'is' : 'are';
        const isAreActual = numActualElements === 1 ? 'is' : 'are';

        throw new Error(`This test needs to be updated. It assumes that there ${isAreExpected} ${numExpectedElements} ${collectiveName}, but there ${isAreActual} actually ${numActualElements}.`);
    }
}

async function metricTitleIsCorrect(page, selector, title) {
    await expect(page.locator(selector)).toBeVisible();
    await expect(page.locator(selector)).toHaveText(title);
}

// Selecting a region triggers a refetch of every visible metric for the new
// region, but MetricOverviewContainer withholds its re-render until each
// fetch resolves (see its shouldComponentUpdate) - there's no DOM signal to
// wait on, only the underlying network requests.
async function changeRegionAndWaitForMetrics(page, index, numMetrics) {
    const region = await page.locator('#region-selector option').nth(index).getAttribute('value');

    let matched = 0;
    const metricsLoaded = page.waitForResponse(response => {
        if (response.ok() && response.url().includes(`/${region}/`)) {
            matched += 1;
        }
        return matched >= numMetrics;
    });

    await page.selectOption('#region-selector', { index });
    await metricsLoaded;
}

module.exports = {
    linkWorks,
    linksWork,
    flagForUpdate,
    metricTitleIsCorrect,
    changeRegionAndWaitForMetrics,
};

const { test, expect, readFixture } = require('../../fixtureData');


const dashboard = readFixture('hardware/index.json');
// Hardware has no regions; its only category is "default".
const region = dashboard.defaultCategory || dashboard.categories[0];

// Chart wrapper ids restart in every dashboard section, so select every chart
// by the element MetricsGraphics.jsx draws it into.
const chartSelector = '.metricsGraphicsCon > svg';

// The recording keeps only 12 dates, and the cost of redrawing a line grows
// with its length, so serve five years of weekly points like the live data.
// They count back from the dashboard's newest date, so the summary bars, which
// read the same files, still find a value for every date they look up.
const weekCount = 260;
const newestDate = Date.parse(dashboard.dates[0]);
const dates = Array.from({ length: weekCount }, (unused, index) => (
    new Date(newestDate - index * 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
));

// On the dev server this resize sequence blocks the main thread for about
// 150 ms. Animating the lines on resize took it to about 6 s, and redrawing on
// every resize event to about 1.5 s.
const longTaskBudget = 1000;

test.beforeEach(async ({ page }) => {
    await page.route(
        url => new RegExp(`/hardware/${region}/[^/]+/index.json$`).test(decodeURIComponent(url.pathname)),
        route => {
            const slug = decodeURIComponent(new URL(route.request().url()).pathname).split('/').at(-2);
            const metric = readFixture(`hardware/${region}/${slug}/index.json`);
            const populations = Object.fromEntries(Object.keys(metric.data.populations).map((populationName, populationIndex) => (
                [populationName, dates.map((date, index) => ({ x: date, y: 10 + populationIndex + Math.sin(index / 5) }))]
            )));
            return route.fulfill({ json: { ...metric, data: { populations } } });
        }
    );
});

test('Hardware charts redraw to the new width after a resize without blocking the page', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto('/dashboard/hardware');
    await expect(page.locator(chartSelector)).toHaveCount(dashboard.metrics.length);
    await expect(page.locator(chartSelector).last()).toBeVisible();

    await page.evaluate(() => {
        window.longTaskTotal = 0;
        new PerformanceObserver(list => {
            for (const entry of list.getEntries()) window.longTaskTotal += entry.duration;
        }).observe({ type: 'longtask' });
    });

    for (const width of [1180, 1080, 980, 880, 800, 880, 960]) {
        await page.setViewportSize({ width, height: 900 });
        await page.waitForTimeout(50);
    }

    await expect.poll(() => page.evaluate(selector => {
        const mainWidth = document.querySelector('#application > main').offsetWidth;
        return [...document.querySelectorAll(selector)].every(svg => Number(svg.getAttribute('width')) === mainWidth);
    }, chartSelector)).toBe(true);

    // Long-task entries are reported after the task ends.
    await page.waitForTimeout(1000);
    expect(await page.evaluate(() => window.longTaskTotal)).toBeLessThan(longTaskBudget);
});

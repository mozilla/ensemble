const { test, expect, readFixture } = require('../../fixtureData');


const dashboard = readFixture('hardware/index.json');
// Hardware has no regions; its only category is "default".
const region = dashboard.defaultCategory || dashboard.categories[0];

// Chart wrapper ids restart in every dashboard section, so select every chart
// by the SVG that Chart.jsx has Observable Plot draw.
const chartSelector = '.observable-plot svg.chart-svg';

// The recording keeps only 12 dates, and the cost of redrawing a line grows
// with its length, so serve five years of weekly points like the live data.
// They count back from the dashboard's newest date, so the summary bars, which
// read the same files, still find a value for every date they look up.
const weekCount = 260;
const newestDate = Date.parse(dashboard.dates[0]);
const dates = Array.from({ length: weekCount }, (unused, index) => (
    new Date(newestDate - index * 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
));

// ObservablePlot.jsx replaces a chart's SVG on every redraw, so counting the
// SVGs added catches charts redrawing on every resize event, however fast the
// runner is.
//
// Tracing slows each viewport change past ChartContainer's resize debounce, so
// on a traced retry every chart would redraw at every width.
test.use({ trace: 'off' });

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

test('Hardware charts redraw once after a series of resizes', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto('/dashboard/hardware');
    await expect(page.locator(chartSelector)).toHaveCount(dashboard.metrics.length);
    await expect(page.locator(chartSelector).last()).toBeVisible();

    await page.evaluate(() => {
        window.redraws = new Map();
        new MutationObserver(records => {
            for (const record of records) {
                const chart = record.target.closest('.observable-plot');
                if (!chart) continue;
                for (const node of record.addedNodes) {
                    if (node.matches?.('svg.chart-svg')) {
                        window.redraws.set(chart, (window.redraws.get(chart) || 0) + 1);
                    }
                }
            }
        }).observe(document.querySelector('#application'), { subtree: true, childList: true });
    });

    for (const width of [1180, 1080, 980, 880, 800, 880, 960]) {
        await page.setViewportSize({ width, height: 900 });
        await page.waitForTimeout(50);
    }

    await expect.poll(() => page.evaluate(selector => {
        const mainWidth = document.querySelector('#application > main').offsetWidth;
        return [...document.querySelectorAll(selector)].every(svg => Number(svg.getAttribute('width')) === mainWidth);
    }, chartSelector)).toBe(true);

    // Long enough for any trailing debounced redraw.
    await page.waitForTimeout(1000);
    const redraws = await page.evaluate(() => [...document.querySelectorAll('.observable-plot')].map(chart => (
        window.redraws.get(chart) || 0
    )));
    expect(redraws).toEqual(redraws.map(() => 1));
});

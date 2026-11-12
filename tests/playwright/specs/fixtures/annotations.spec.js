const { test, expect, readFixture } = require('../../fixtureData');


const dashboard = readFixture('user-activity/index.json');
const slug = dashboard.metrics[0];

async function serveFirstMetricWithAnnotations(page, annotations) {
    const metric = readFixture(`user-activity/${dashboard.defaultCategory}/${slug}/index.json`);
    const populations = { Only: dashboard.dates.map((date, index) => ({ x: date, y: 100 + index })) };
    await page.route(
        url => decodeURIComponent(url.pathname).endsWith(`/user-activity/${dashboard.defaultCategory}/${slug}/index.json`),
        route => route.fulfill({ json: { ...metric, axes: {}, annotations, data: { populations } } })
    );
}

function overlaps(boxA, boxB) {
    return boxA.x < boxB.x + boxB.width && boxB.x < boxA.x + boxA.width
        && boxA.y < boxB.y + boxB.height && boxB.y < boxA.y + boxA.height;
}

// Labels at the newest and oldest dates, where a label centered on its date
// would run past the edge of the chart.
async function expectEdgeLabelsInsideChart(page) {
    const newestFirst = dashboard.dates;
    await serveFirstMetricWithAnnotations(page, [
        { date: newestFirst[0], label: 'Firefox 150' },
        { date: newestFirst.at(-1), label: 'Firefox 140' },
    ]);
    await page.goto('/dashboard/user-activity');

    const metricOverview = page.locator('#metric-overview-1');
    const labels = metricOverview.locator('g.chart-marker-label text');
    await expect(labels).toHaveCount(2);
    const chartBox = await metricOverview.locator('svg.chart-svg').boundingBox();
    for (const label of await labels.all()) {
        const box = await label.boundingBox();
        const labelText = await label.textContent();
        expect(box.x, `"${labelText}" starts inside the chart`).toBeGreaterThanOrEqual(chartBox.x);
        expect(box.x + box.width, `"${labelText}" ends inside the chart`).toBeLessThanOrEqual(chartBox.x + chartBox.width);
    }
}

test('Labels at the newest and oldest dates stay inside the chart', async ({ page }) => {
    await expectEdgeLabelsInsideChart(page);
});

test('Only annotations inside the chart\'s dates are drawn, clear of the hovered value', async ({ page }) => {
    await serveFirstMetricWithAnnotations(page, [
        { date: dashboard.dates[5], label: 'Inside' },
        { date: '2020-01-01', label: 'Outside' },
    ]);
    await page.goto('/dashboard/user-activity');

    const metricOverview = page.locator('#metric-overview-1');
    await expect(metricOverview.locator('g.chart-marker line')).toHaveCount(1);
    await expect(metricOverview.locator('g.chart-marker-label text')).toHaveText(['Inside']);

    const chart = metricOverview.locator('svg.chart-svg');
    const box = await chart.boundingBox();
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    const readout = metricOverview.locator('.chart-readout');
    await expect(readout).not.toBeEmpty();

    const readoutText = await readout.evaluate(element => {
        const range = document.createRange();
        range.selectNodeContents(element);
        const { x, y, width, height } = range.getBoundingClientRect();
        return { x, y, width, height };
    });
    const labelBox = await metricOverview.locator('g.chart-marker-label text').boundingBox();
    expect(overlaps(readoutText, labelBox), 'the hovered value and the annotation label overlap').toBe(false);
});

test.describe('On a narrow screen', () => {
    test.use({ viewport: { width: 375, height: 800 } });

    test('labels at the newest and oldest dates stay inside the chart', async ({ page }) => {
        await expectEdgeLabelsInsideChart(page);
    });

    test('neighboring annotation labels don\'t overlap', async ({ page }) => {
        await serveFirstMetricWithAnnotations(page, [
            { date: dashboard.dates[6], label: 'Firefox 150' },
            { date: dashboard.dates[5], label: 'Firefox 151' },
            { date: dashboard.dates[4], label: 'Firefox 152' },
        ]);
        await page.goto('/dashboard/user-activity');

        const labels = page.locator('#metric-overview-1 g.chart-marker-label text');
        await expect(labels).toHaveCount(3);
        const boxes = await Promise.all((await labels.all()).map(label => label.boundingBox()));
        for (let first = 0; first < boxes.length; first++) {
            for (let second = first + 1; second < boxes.length; second++) {
                expect(overlaps(boxes[first], boxes[second]), `labels ${first + 1} and ${second + 1} overlap`).toBe(false);
            }
        }
    });
});

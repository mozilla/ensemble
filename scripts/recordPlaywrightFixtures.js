// Records the transposer JSON the Playwright fixture specs serve in place of
// data.firefox.com. Run it again to refresh the recording; it replaces the
// whole fixtures directory.
//
//     node scripts/recordPlaywrightFixtures.js

const path = require('path');
const fs = require('fs');

const { dashboards } = require(path.join(__dirname, '..', 'src', 'config.json'));


const fixturesDirectory = path.join(__dirname, '..', 'tests', 'playwright', 'fixtures');
const datasetsPrefix = 'https://data.firefox.com/datasets/desktop/';

// Besides the default region, record this one so region changes can be tested.
const secondRegion = 'Germany';

// Keep only the most recent dates. The full history makes the hardware
// fixtures several megabytes, and the specs only need recent data.
const numDatesToKeep = 12;

async function fetchJSON(url) {
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`${response.status} ${response.statusText} for ${url}`);
    }
    return response.json();
}

function write(url, json) {
    const relativePath = decodeURIComponent(url.slice(datasetsPrefix.length));
    const filename = path.join(fixturesDirectory, relativePath);

    fs.mkdirSync(path.dirname(filename), { recursive: true });
    fs.writeFileSync(filename, JSON.stringify(json, null, 4) + '\n');

    // eslint-disable-next-line no-console
    console.log(`Wrote ${path.relative(process.cwd(), filename)}`);
}

function isRecent(date, oldestDateToKeep) {
    return !Number.isNaN(Date.parse(date)) && date >= oldestDateToKeep;
}

function trimMetric(metric, oldestDateToKeep) {
    if (metric.data.populations) {
        const populations = {};
        Object.entries(metric.data.populations).forEach(([populationName, points]) => {
            const recentPoints = points.filter(point => (
                Number.isNaN(Date.parse(point.x)) || isRecent(point.x, oldestDateToKeep)
            ));
            if (recentPoints.length) populations[populationName] = recentPoints;
        });
        metric.data.populations = populations;
    }

    if (metric.data.dates) {
        metric.data.dates = Object.fromEntries(
            Object.entries(metric.data.dates).filter(([date]) => isRecent(date, oldestDateToKeep))
        );
    }

    if (metric.annotations) {
        metric.annotations = metric.annotations.filter(annotation => isRecent(annotation.date, oldestDateToKeep));
    }

    return metric;
}

async function recordDashboard(dashboard) {
    const indexURL = `${dashboard.source}/index.json`;
    const index = await fetchJSON(indexURL);

    index.dates = index.dates.slice().sort().reverse().slice(0, numDatesToKeep);
    const oldestDateToKeep = index.dates.at(-1);
    write(indexURL, index);

    const defaultRegion = index.categories.length > 1
        ? index.defaultCategory || index.categories[0]
        : index.categories[0];
    const regions = [defaultRegion];
    if (dashboard.supportsRegions && index.categories.includes(secondRegion)) {
        regions.push(secondRegion);
    }

    const slugs = new Set([...index.metrics, ...(index.summaryMetrics || [])]);

    for (const region of regions) {
        for (const slug of slugs) {
            const metricURL = `${dashboard.source}/${region}/${slug}/index.json`;
            const metric = await fetchJSON(encodeURI(metricURL));
            write(metricURL, trimMetric(metric, oldestDateToKeep));
        }
    }
}

async function main() {
    fs.rmSync(fixturesDirectory, { recursive: true, force: true });

    for (const dashboard of dashboards) {
        if (!dashboard.source.startsWith(datasetsPrefix)) {
            throw new Error(`Unexpected source for ${dashboard.key}: ${dashboard.source}`);
        }
        await recordDashboard(dashboard);
    }
}

main().catch(error => {
    // eslint-disable-next-line no-console
    console.error(error);
    process.exitCode = 1;
});

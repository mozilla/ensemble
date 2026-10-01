const { test, expect } = require('@playwright/test');
const { dashboards } = require('../../../src/config.json');


const defaultRegion = 'Worldwide';

const regionedDashboards = dashboards.filter(d => d.supportsRegions).map(d => d.key);
const regionlessDashboards = dashboards.filter(d => !d.supportsRegions).map(d => d.key);

async function clearSessionStorage(page) {
    await page.evaluate(() => sessionStorage.clear());
}

test.beforeEach(async ({ page }) => {
    // Navigate first - sessionStorage isn't accessible from the default
    // about:blank page every test starts on. Clearing it here, since it
    // plays a role in this feature.
    await page.goto('/');
    await clearSessionStorage(page);
});

test('Dashboards that support regions use the default region on initial page load', async ({ page }) => {
    for (const dashboardKey of regionedDashboards) {
        await page.goto(`/dashboard/${dashboardKey}`);
        await expect(page.locator('#region-selector')).toHaveValue(defaultRegion);
    }
});

test('The preferred region is only remembered for the current session', async ({ page }) => {
    for (const dashboardKey of regionedDashboards) {
        const dashboardURL = `/dashboard/${dashboardKey}`;

        await page.goto(dashboardURL);
        await expect(page.locator('#region-selector')).toBeVisible();
        await page.selectOption('#region-selector', 'India');
        await clearSessionStorage(page);
        await page.reload();
        await expect(page.locator('#region-selector')).toHaveValue(defaultRegion);

        await page.goto(dashboardURL);
        await expect(page.locator('#region-selector')).toBeVisible();
        await page.selectOption('#region-selector', 'India');
        await page.selectOption('#region-selector', 'Russia');
        await page.selectOption('#region-selector', 'France');
        await clearSessionStorage(page);
        await page.reload();
        await expect(page.locator('#region-selector')).toHaveValue(defaultRegion);

        await page.goto(dashboardURL);
        await expect(page.locator('#region-selector')).toBeVisible();
        await page.selectOption('#region-selector', 'India');
        await clearSessionStorage(page);
        await page.reload();
        await expect(page.locator('#region-selector')).toBeVisible();
        await page.selectOption('#region-selector', 'Russia');
        await clearSessionStorage(page);
        await page.reload();
        await expect(page.locator('#region-selector')).toBeVisible();
        await page.selectOption('#region-selector', 'France');
        await clearSessionStorage(page);
        await page.reload();
        await expect(page.locator('#region-selector')).toHaveValue(defaultRegion);
    }
});

test('If the user selects a region, that region will be used when the page is reloaded', async ({ page }) => {
    for (const dashboardKey of regionedDashboards) {
        const dashboardURL = `/dashboard/${dashboardKey}`;

        await page.goto(dashboardURL);
        await expect(page.locator('#region-selector')).toBeVisible();
        await page.selectOption('#region-selector', 'India');
        await page.reload();
        await expect(page.locator('#region-selector')).toHaveValue('India');

        await page.goto(dashboardURL);
        await expect(page.locator('#region-selector')).toBeVisible();
        await page.selectOption('#region-selector', 'India');
        await page.selectOption('#region-selector', 'Russia');
        await page.selectOption('#region-selector', 'France');
        await page.reload();
        await expect(page.locator('#region-selector')).toHaveValue('France');
    }
});

test('If the user selects a region, that region will be used on other dashboards that support regions', async ({ page }) => {
    for (const dashboardBeingTestedKey of regionedDashboards) {
        const dashboardBeingTestedURL = `/dashboard/${dashboardBeingTestedKey}`;

        const otherRegionedDashboards = regionedDashboards.filter(otherRegionedDashboardKey => {
            return otherRegionedDashboardKey !== dashboardBeingTestedKey;
        });

        // Choose a region and then check other regioned dashboards.
        await page.goto(dashboardBeingTestedURL);
        await expect(page.locator('#region-selector')).toBeVisible();
        await page.selectOption('#region-selector', 'India');

        for (const otherRegionedDashboardKey of otherRegionedDashboards) {
            await page.goto(`/dashboard/${otherRegionedDashboardKey}`);
            await expect(page.locator('#region-selector')).toHaveValue('India');
        }

        // Choose multiple regions and then check other regioned dashboards.
        await page.goto(dashboardBeingTestedURL);
        await expect(page.locator('#region-selector')).toBeVisible();
        await page.selectOption('#region-selector', 'India');
        await page.selectOption('#region-selector', 'Russia');
        await page.selectOption('#region-selector', 'France');

        for (const otherRegionedDashboardKey of otherRegionedDashboards) {
            await page.goto(`/dashboard/${otherRegionedDashboardKey}`);
            await expect(page.locator('#region-selector')).toHaveValue('France');
        }

        // Choose a region, go to the homepage, and then check all regioned
        // dashboards, including the one we started on.
        await page.goto(dashboardBeingTestedURL);
        await expect(page.locator('#region-selector')).toBeVisible();
        await page.selectOption('#region-selector', 'India');
        await page.goto('/');

        for (const regionedDashboardKey of regionedDashboards) {
            await page.goto(`/dashboard/${regionedDashboardKey}`);
            await expect(page.locator('#region-selector')).toHaveValue('India');
        }

        // Choose multiple regions, go to the homepage, and then check all
        // regioned dashboards, including the one we started on.
        await page.goto(dashboardBeingTestedURL);
        await expect(page.locator('#region-selector')).toBeVisible();
        await page.selectOption('#region-selector', 'India');
        await page.selectOption('#region-selector', 'Russia');
        await page.selectOption('#region-selector', 'France');
        await page.goto('/');

        for (const regionedDashboardKey of regionedDashboards) {
            await page.goto(`/dashboard/${regionedDashboardKey}`);
            await expect(page.locator('#region-selector')).toHaveValue('France');
        }

        // Choose a region, go to regionless dashboards, and then check all
        // regioned dashboards, including the one we started on.
        await page.goto(dashboardBeingTestedURL);
        await expect(page.locator('#region-selector')).toBeVisible();
        await page.selectOption('#region-selector', 'India');

        for (const regionlessDashboardKey of regionlessDashboards) {
            await page.goto(`/dashboard/${regionlessDashboardKey}`);
        }

        for (const regionedDashboardKey of regionedDashboards) {
            await page.goto(`/dashboard/${regionedDashboardKey}`);
            await expect(page.locator('#region-selector')).toHaveValue('India');
        }

        // Choose multiple regions, go to regionless dashboards, and then check
        // all regioned dashboards, including the one we started on.
        await page.goto(dashboardBeingTestedURL);
        await expect(page.locator('#region-selector')).toBeVisible();
        await page.selectOption('#region-selector', 'India');
        await page.selectOption('#region-selector', 'Russia');
        await page.selectOption('#region-selector', 'France');

        for (const regionlessDashboardKey of regionlessDashboards) {
            await page.goto(`/dashboard/${regionlessDashboardKey}`);
        }

        for (const regionedDashboardKey of regionedDashboards) {
            await page.goto(`/dashboard/${regionedDashboardKey}`);
            await expect(page.locator('#region-selector')).toHaveValue('France');
        }
    }
});

test('Metrics load successfully on regionless dashboards if a region was previously selected elsewhere', async ({ page }) => {
    for (const regionedDashboardKey of regionedDashboards) {
        const regionedDashboardURL = `/dashboard/${regionedDashboardKey}`;

        async function testRegionlessDashboards() {
            for (const regionlessDashboardKey of regionlessDashboards) {
                await page.goto(`/dashboard/${regionlessDashboardKey}`);
                await expect(page.locator('.metric').first()).toBeVisible();
            }
        }

        await page.goto(regionedDashboardURL);
        await expect(page.locator('#region-selector')).toBeVisible();
        await page.selectOption('#region-selector', 'India');

        await testRegionlessDashboards();

        await page.goto(regionedDashboardURL);
        await expect(page.locator('#region-selector')).toBeVisible();
        await page.selectOption('#region-selector', 'India');
        await page.selectOption('#region-selector', 'Russia');
        await page.selectOption('#region-selector', 'France');

        await testRegionlessDashboards();
    }
});

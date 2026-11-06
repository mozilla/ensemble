const { test, expect } = require('../fixtureData');


// @spa-fallback: these need the server to answer unknown paths with
// index.html so React can render NotFound. The dev server does; the deployed
// bucket returns a plain 404 instead, so the deploy smoke test skips them
// (npm run test:playwright:deployed) and checks the status code itself.
test('Not Found page loads for paths with superfluous suffixes', { tag: '@spa-fallback' }, async ({ page }) => {
    await page.goto('/dashboard/user-activity/some-extra-directory-that-will-never-exist');
    await expect(page.locator('#not-found')).toBeVisible();

    await page.goto('/dashboard/usage-behavior/some-extra-directory-that-will-never-exist');
    await expect(page.locator('#not-found')).toBeVisible();

    await page.goto('/dashboard/hardware/some-extra-directory-that-will-never-exist');
    await expect(page.locator('#not-found')).toBeVisible();
});

test('Not Found page loads for non-existent URLs', { tag: '@spa-fallback' }, async ({ page }) => {
    await page.goto('/some-long-url-that-will-never-ever-exist');
    await expect(page.locator('#not-found')).toBeVisible();
});

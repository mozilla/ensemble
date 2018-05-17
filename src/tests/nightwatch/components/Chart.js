module.exports = {
    beforeEach: browser => {
        browser.url(`${browser.launchUrl}/dashboard/hardware`);
    },

    // This test assumes that the first chart in the Hardware Report has a
    // marker.
    'Markers are hidden upon chart hover': browser => {
        const chartSelector = '#graphics #graphics-metric-overview-1 .metricsGraphicsCon';
        browser.waitForElementPresent(chartSelector);
        browser.assert.visible(`${chartSelector} .mg-markers`);
        browser.moveToElement(chartSelector, 0, 0);
        browser.assert.hidden(`${chartSelector} .mg-markers`);
    },
};

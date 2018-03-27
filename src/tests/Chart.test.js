module.exports = {

    // This test assumes that the first chart in the Hardware Report has a
    // marker.
    'Markers are hidden upon chart hover': browser => {
        browser.url(`${browser.launchUrl}/dashboard/hardware`);

        const chartSelector = '.metric-wrappers:first-of-type .metric-wrapper:first-child .metricsGraphicsCon';
        browser.waitForElementVisible(chartSelector);
        browser.assert.visible(`${chartSelector} .mg-markers`);
        browser.moveToElement(chartSelector, 0, 0);
        browser.assert.hidden(`${chartSelector} .mg-markers`);
    },

};

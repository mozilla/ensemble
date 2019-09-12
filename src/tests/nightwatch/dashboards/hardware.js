const { flagForUpdate, metricTitleIsCorrect } = require('../utils');


module.exports = {
    before: browser => {
        browser.url(`${browser.launchUrl}/dashboard/hardware`);
    },

    'Dashboard loads': browser => {
        browser.expect.element('#dashboard').to.be.visible;
    },

    'Page <title> is correct': browser => {
        browser.waitForElementVisible('#dashboard');
        browser.getTitle(title => browser.assert.equal(title, `Hardware Across the Web | ${browser.globals.baseTitle}`));
    },

    'Dashboard title is correct': browser => {
        browser.waitForElementVisible('#dashboard');
        browser.expect.element('#dashboard-title').text.to.be.equal('Hardware Across the Web');
    },

    'Section titles and order are correct': browser => {
        browser.waitForElementVisible('#dashboard');

        browser.expect.element('#dashboard-sections .dashboard-section:nth-child(1) h4').text.to.be.equal('Graphics');
        browser.expect.element('#dashboard-sections .dashboard-section:nth-child(2) h4').text.to.be.equal('Processor');
        browser.expect.element('#dashboard-sections .dashboard-section:nth-child(3) h4').text.to.be.equal('Operating System');
        browser.expect.element('#dashboard-sections .dashboard-section:nth-child(4) h4').text.to.be.equal('Plugins');

        flagForUpdate(browser, '#dashboard-sections .dashboard-section', 'sections in the hardware dashboard', 4);
    },

    'Metric titles and order are correct': browser => {
        metricTitleIsCorrect(browser, '#dashboard-sections .dashboard-section:nth-child(1) #graphics-metric-overview-1 h5', 'GPU Model');
        metricTitleIsCorrect(browser, '#dashboard-sections .dashboard-section:nth-child(1) #graphics-metric-overview-2 h5', 'GPU Vendor');
        metricTitleIsCorrect(browser, '#dashboard-sections .dashboard-section:nth-child(1) #graphics-metric-overview-3 h5', 'Display Resolution');
        metricTitleIsCorrect(browser, '#dashboard-sections .dashboard-section:nth-child(2) #processor-metric-overview-1 h5', 'CPU Vendor');
        metricTitleIsCorrect(browser, '#dashboard-sections .dashboard-section:nth-child(2) #processor-metric-overview-2 h5', 'CPU Cores');
        metricTitleIsCorrect(browser, '#dashboard-sections .dashboard-section:nth-child(2) #processor-metric-overview-3 h5', 'CPU Speeds');
        metricTitleIsCorrect(browser, '#dashboard-sections .dashboard-section:nth-child(2) #processor-metric-overview-4 h5', 'Memory');
        metricTitleIsCorrect(browser, '#dashboard-sections .dashboard-section:nth-child(3) #operating-system-metric-overview-1 h5', 'Operating System');
        metricTitleIsCorrect(browser, '#dashboard-sections .dashboard-section:nth-child(3) #operating-system-metric-overview-2 h5', 'Browsers by Architecture');
        metricTitleIsCorrect(browser, '#dashboard-sections .dashboard-section:nth-child(3) #operating-system-metric-overview-3 h5', 'Operating Systems by Architecture');
        metricTitleIsCorrect(browser, '#dashboard-sections .dashboard-section:nth-child(4) #plugins-metric-overview-1 h5', 'Has Flash');

        flagForUpdate(browser, '.metric', 'metrics in the hardware dashboard', 11);
    },

    'Charts render': browser => {
        browser.expect.element('#graphics-metric-overview-1 svg').to.be.visible;
        browser.expect.element('#graphics-metric-overview-1 path.mg-line1').to.be.visible;

        browser.expect.element('#graphics-metric-overview-2 svg').to.be.visible;
        browser.expect.element('#graphics-metric-overview-2 path.mg-line1').to.be.visible;

        browser.expect.element('#graphics-metric-overview-3 svg').to.be.visible;
        browser.expect.element('#graphics-metric-overview-3 path.mg-line1').to.be.visible;

        browser.expect.element('#processor-metric-overview-1 svg').to.be.visible;
        browser.expect.element('#processor-metric-overview-1 path.mg-line1').to.be.visible;

        browser.expect.element('#processor-metric-overview-2 svg').to.be.visible;
        browser.expect.element('#processor-metric-overview-2 path.mg-line1').to.be.visible;

        browser.expect.element('#processor-metric-overview-3 svg').to.be.visible;
        browser.expect.element('#processor-metric-overview-3 path.mg-line1').to.be.visible;

        browser.expect.element('#processor-metric-overview-4 svg').to.be.visible;
        browser.expect.element('#processor-metric-overview-4 path.mg-line1').to.be.visible;

        browser.expect.element('#operating-system-metric-overview-1 svg').to.be.visible;
        browser.expect.element('#operating-system-metric-overview-1 path.mg-line1').to.be.visible;

        browser.expect.element('#operating-system-metric-overview-2 svg').to.be.visible;
        browser.expect.element('#operating-system-metric-overview-2 path.mg-line1').to.be.visible;

        browser.expect.element('#operating-system-metric-overview-3 svg').to.be.visible;
        browser.expect.element('#operating-system-metric-overview-3 path.mg-line1').to.be.visible;

        browser.expect.element('#plugins-metric-overview-1 svg').to.be.visible;
        browser.expect.element('#plugins-metric-overview-1 path.mg-line1').to.be.visible;

        flagForUpdate(browser, '.chart', 'charts in the hardware dashboard', 11);
    },
};

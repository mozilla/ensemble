const { linkWorks, linksWork, flagForUpdate } = require('../utils');


module.exports = {
    beforeEach: browser => {
        browser.url(`${browser.launchUrl}/dashboard/usage-behavior`);
    },

    'Dashboard loads': browser => {
        browser.expect.element('#dashboard').to.be.present;
    },

    'Page <title> is correct': browser => {
        browser.waitForElementVisible('#dashboard');
        browser.assert.title('Usage Behavior | Firefox Public Data Report');
    },

    'Dashboard title is correct': browser => {
        browser.expect.element('#dashboard-title').text.to.be.equal('Usage Behavior');
    },

    'Metric titles and order are correct': browser => {
        // Wait for the metrics to load
        browser.waitForElementVisible('.chart');
        browser.waitForElementVisible('.data-table');

        flagForUpdate(browser, '.metric', 'metrics in the usage dashboard', 4);

        browser.expect.element('#metric-overview-1 h5').text.to.be.equal('Top Languages');
        browser.expect.element('#metric-overview-2 h5').text.to.be.equal('Always On Tracking Protection');
        browser.expect.element('#metric-overview-3 h5').text.to.be.equal('Has Add-on');
        browser.expect.element('#metric-overview-4 h5').text.to.be.equal('Top Add-ons');
    },

    'Charts render': browser => {
        // Wait for the charts to load
        browser.waitForElementVisible('.chart');

        flagForUpdate(browser, '.chart', 'charts in the usage dashboard', 3);

        browser.expect.element('#metric-overview-1 svg').to.be.visible;
        browser.expect.element('#metric-overview-1 path.mg-line1').to.be.visible;

        browser.expect.element('#metric-overview-2 svg').to.be.visible;
        browser.expect.element('#metric-overview-2 path.mg-line1').to.be.visible;

        browser.expect.element('#metric-overview-3 svg').to.be.visible;
        browser.expect.element('#metric-overview-3 path.mg-line1').to.be.visible;
    },

    'Table renders': browser => {
        // Wait for the table to load
        browser.waitForElementVisible('.data-table');

        flagForUpdate(browser, '.metric-overview table', 'table in the usage dashboard', 1);

        browser.expect.element('#metric-overview-4 table').to.be.visible;
        browser.expect.element('#metric-overview-4 tbody tr:first-child td:nth-child(2)').to.be.visible;
    },

    'All metric description links work': browser => {
        linksWork(browser, '.metric-description a');
    },

    'The next button works': browser => {
        linkWorks(browser, '.next-button a');
    },
};

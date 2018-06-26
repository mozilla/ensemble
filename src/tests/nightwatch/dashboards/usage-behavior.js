const { linkWorks, linksWork, flagForUpdate } = require('../utils');


module.exports = {
    before: browser => {
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
        browser.waitForElementVisible('.chart');
        browser.waitForElementVisible('.data-table');

        flagForUpdate(browser, '.metric', 'metrics in the usage dashboard', 4);

        browser.expect.element('#metric-overview-1 h5').text.to.be.equal('Top Languages');
        browser.expect.element('#metric-overview-2 h5').text.to.be.equal('Always On Tracking Protection');
        browser.expect.element('#metric-overview-3 h5').text.to.be.equal('Has Add-on');
        browser.expect.element('#metric-overview-4 h5').text.to.be.equal('Top Add-ons');
    },

    'Charts render': browser => {
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
        browser.waitForElementVisible('.data-table');

        flagForUpdate(browser, '.metric-overview table', 'table in the usage dashboard', 1);

        browser.expect.element('#metric-overview-4 table').to.be.visible;
        browser.expect.element('#metric-overview-4 tbody tr:first-child td:nth-child(2)').to.be.visible;
    },

    'All metric description links work': browser => {
        browser.waitForElementVisible('.metric-description a');
        linksWork(browser, '.metric-description a');
    },

    'The "proceed button" appears': browser => {
        browser.expect.element('.next-button').to.be.present;
    },

    'The "proceed button" text is correct': browser => {
        browser.expect.element('.next-button').text.to.equal('Proceed to Hardware');
    },

    'The "proceed button" works': browser => {
        browser.waitForElementVisible('.next-button');
        linkWorks(browser, '.next-button a');
    },
};

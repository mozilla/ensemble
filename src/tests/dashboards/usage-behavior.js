const { flagForUpdate } = require('../utils');


module.exports = {
    before: browser => {
        browser.url(`${browser.launchUrl}/dashboard/usage-behavior`);
    },

    'Dashboard loads': browser => {
        browser.expect.element('#dashboard').to.be.present;
    },

    'Dashboard title is correct': browser => {
        browser.expect.element('#dashboard-title').text.to.be.equal('Usage Behavior');
    },

    'Chart titles and order are correct': browser => {
        flagForUpdate(browser, '.metric-overview', 'metrics in the usage dashboard', 4);

        browser.expect.element('#metric-overview-1 .mg-chart-title').text.to.be.equal('Top Languages');
        browser.expect.element('#metric-overview-2 .mg-chart-title').text.to.be.equal('Tracking Protection');
        browser.expect.element('#metric-overview-3 .mg-chart-title').text.to.be.equal('Has Add-on');
        browser.expect.element('#metric-overview-4 h3').text.to.be.equal('Top Add-ons');
    },

    'Charts render': browser => {
        flagForUpdate(browser, '.metricsGraphicsCon', 'charts in the usage dashboard', 3);

        browser.expect.element('#metric-overview-1 svg').to.be.visible;
        browser.expect.element('#metric-overview-1 path.mg-line1').to.be.visible;

        browser.expect.element('#metric-overview-2 svg').to.be.visible;
        browser.expect.element('#metric-overview-2 path.mg-line1').to.be.visible;

        browser.expect.element('#metric-overview-3 svg').to.be.visible;
        browser.expect.element('#metric-overview-3 path.mg-line1').to.be.visible;
    },

    'Table renders': browser => {
        flagForUpdate(browser, '.metric-overview table', 'table in the usage dashboard', 1);

        browser.expect.element('#metric-overview-4 table').to.be.visible;
        browser.expect.element('#metric-overview-4 tbody tr:first-child td:nth-child(2)').to.be.visible;
    },
};

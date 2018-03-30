const { flagForUpdate } = require('../utils');


module.exports = {
    before: browser => {
        browser.url(`${browser.launchUrl}/dashboard/user-activity`);
    },

    'Dashboard loads': browser => {
        browser.expect.element('#dashboard').to.be.present;
    },

    'Dashboard title is correct': browser => {
        browser.expect.element('#dashboard-title').text.to.be.equal('User Activity');
    },

    'Chart titles and order are correct': browser => {
        flagForUpdate(browser, '.metric', 'metrics in the activity dashboard', 6);

        browser.expect.element('#metric-overview-1 h3').text.to.be.equal('Yearly Active Users');
        browser.expect.element('#metric-overview-2 h3').text.to.be.equal('Monthly Active Users');
        browser.expect.element('#metric-overview-3 h3').text.to.be.equal('Daily Usage');
        browser.expect.element('#metric-overview-4 h3').text.to.be.equal('Average Intensity');
        browser.expect.element('#metric-overview-5 h3').text.to.be.equal('New Users Percentage');
        browser.expect.element('#metric-overview-6 h3').text.to.be.equal('Latest Version');
    },

    'Charts render': browser => {
        flagForUpdate(browser, '.metric', 'metrics in the activity dashboard', 6);

        browser.expect.element('#metric-overview-1 svg').to.be.visible;
        browser.expect.element('#metric-overview-1 path.mg-line1').to.be.visible;

        browser.expect.element('#metric-overview-2 svg').to.be.visible;
        browser.expect.element('#metric-overview-2 path.mg-line1').to.be.visible;

        browser.expect.element('#metric-overview-3 svg').to.be.visible;
        browser.expect.element('#metric-overview-3 path.mg-line1').to.be.visible;

        browser.expect.element('#metric-overview-4 svg').to.be.visible;
        browser.expect.element('#metric-overview-4 path.mg-line1').to.be.visible;

        browser.expect.element('#metric-overview-5 svg').to.be.visible;
        browser.expect.element('#metric-overview-5 path.mg-line1').to.be.visible;

        browser.expect.element('#metric-overview-6 svg').to.be.visible;
        browser.expect.element('#metric-overview-6 path.mg-line1').to.be.visible;
    }
};

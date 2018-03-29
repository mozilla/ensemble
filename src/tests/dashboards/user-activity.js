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
        browser.expect.element('#metric-wrapper-1 .mg-chart-title').text.to.be.equal('Yearly Active Users');
        browser.expect.element('#metric-wrapper-2 .mg-chart-title').text.to.be.equal('Monthly Active Users');
        browser.expect.element('#metric-wrapper-3 .mg-chart-title').text.to.be.equal('Daily Usage');
        browser.expect.element('#metric-wrapper-4 .mg-chart-title').text.to.be.equal('Average Intensity');
        browser.expect.element('#metric-wrapper-5 .mg-chart-title').text.to.be.equal('New Users Percentage');
        browser.expect.element('#metric-wrapper-6 .mg-chart-title').text.to.be.equal('Latest Version');
    },

    'Charts render': browser => {
        browser.expect.element('#metric-wrapper-1 svg').to.be.visible;
        browser.expect.element('#metric-wrapper-1 path.mg-line1').to.be.visible;

        browser.expect.element('#metric-wrapper-2 svg').to.be.visible;
        browser.expect.element('#metric-wrapper-2 path.mg-line1').to.be.visible;

        browser.expect.element('#metric-wrapper-3 svg').to.be.visible;
        browser.expect.element('#metric-wrapper-3 path.mg-line1').to.be.visible;

        browser.expect.element('#metric-wrapper-4 svg').to.be.visible;
        browser.expect.element('#metric-wrapper-4 path.mg-line1').to.be.visible;

        browser.expect.element('#metric-wrapper-5 svg').to.be.visible;
        browser.expect.element('#metric-wrapper-5 path.mg-line1').to.be.visible;

        browser.expect.element('#metric-wrapper-6 svg').to.be.visible;
        browser.expect.element('#metric-wrapper-6 path.mg-line1').to.be.visible;
    }
};

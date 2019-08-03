const { linkWorks, flagForUpdate, metricTitleIsCorrect } = require('../utils');


module.exports = {
    before: browser => {
        browser.url(`${browser.launchUrl}/dashboard/user-activity`);
    },

    'Dashboard loads': browser => {
        browser.expect.element('#dashboard').to.be.visible;
    },

    'Page <title> is correct': browser => {
        browser.waitForElementVisible('#dashboard');
        browser.getTitle(title => browser.assert.equal(title, `User Activity | ${browser.globals.baseTitle}`));
    },

    'Dashboard title is correct': browser => {
        browser.waitForElementVisible('#dashboard');
        browser.expect.element('#dashboard-title').text.to.be.equal('User Activity');
    },

    'Chart titles and order are correct': browser => {
        metricTitleIsCorrect(browser, '#metric-overview-1 h4', 'Yearly Active Users');
        metricTitleIsCorrect(browser, '#metric-overview-2 h4', 'Monthly Active Users');
        metricTitleIsCorrect(browser, '#metric-overview-3 h4', 'Daily Usage');
        metricTitleIsCorrect(browser, '#metric-overview-4 h4', 'Average Intensity');
        metricTitleIsCorrect(browser, '#metric-overview-5 h4', 'New Profile Rate');
        metricTitleIsCorrect(browser, '#metric-overview-6 h4', 'Latest Version');

        flagForUpdate(browser, '.metric', 'metrics in the activity dashboard', 6);
    },

    'Charts render': browser => {
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

        flagForUpdate(browser, '.metric', 'metrics in the activity dashboard', 6);
    },

    'The "proceed button" appears': browser => {
        browser.expect.element('.next-button').to.be.present;
    },

    'The "proceed button" text is correct': browser => {
        browser.expect.element('.next-button').text.to.equal('Proceed to Usage Behavior');
    },

    'The "proceed button" works': browser => {
        browser.waitForElementVisible('.next-button');
        linkWorks(browser, '.next-button a');
    },

    'Page does not crash when region selector is used': browser => {
        const effectWait = 10000;

        browser.waitForElementVisible('#region-selector');

        browser.click('#region-selector option:nth-child(1)');
        browser.pause(effectWait);
        browser.expect.element('#dashboard').to.be.visible;

        browser.click('#region-selector option:nth-child(2)');
        browser.pause(effectWait);
        browser.expect.element('#dashboard').to.be.visible;

        browser.click('#region-selector option:nth-child(3)');
        browser.pause(effectWait);
        browser.expect.element('#dashboard').to.be.visible;
    },
};

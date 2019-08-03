const { linkWorks, linksWork, flagForUpdate, metricTitleIsCorrect } = require('../utils');


module.exports = {
    before: browser => {
        browser.url(`${browser.launchUrl}/dashboard/usage-behavior`);
    },

    'Dashboard loads': browser => {
        browser.expect.element('#dashboard').to.be.visible;
    },

    'Page <title> is correct': browser => {
        browser.waitForElementVisible('#dashboard');
        browser.getTitle(title => browser.assert.equal(title, `Usage Behavior | ${browser.globals.baseTitle}`));
    },

    'Dashboard title is correct': browser => {
        browser.waitForElementVisible('#dashboard');
        browser.expect.element('#dashboard-title').text.to.be.equal('Usage Behavior');
    },

    'Metric titles and order are correct': browser => {
        metricTitleIsCorrect(browser, '#metric-overview-1 h4', 'Top Languages');
        metricTitleIsCorrect(browser, '#metric-overview-2 h4', 'Always On Tracking Protection');
        metricTitleIsCorrect(browser, '#metric-overview-3 h4', 'Has Add-on');
        metricTitleIsCorrect(browser, '#metric-overview-4 h4', 'Top Add-ons');

        flagForUpdate(browser, '.metric', 'metrics in the usage dashboard', 4);
    },

    'Charts render': browser => {
        browser.expect.element('#metric-overview-1 svg').to.be.visible;
        browser.expect.element('#metric-overview-1 path.mg-line1').to.be.visible;

        browser.expect.element('#metric-overview-2 svg').to.be.visible;
        browser.expect.element('#metric-overview-2 path.mg-line1').to.be.visible;

        browser.expect.element('#metric-overview-3 svg').to.be.visible;
        browser.expect.element('#metric-overview-3 path.mg-line1').to.be.visible;

        flagForUpdate(browser, '.chart', 'charts in the usage dashboard', 3);
    },

    'Table renders': browser => {
        browser.waitForElementVisible('.data-table');

        browser.expect.element('#metric-overview-4 table').to.be.visible;
        browser.expect.element('#metric-overview-4 tbody tr:first-child td:nth-child(2)').to.be.visible;

        flagForUpdate(browser, '.metric-overview table', 'table in the usage dashboard', 1);
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

    'Page does not crash when region selector is used': browser => {
        const effectWait = 5000;

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

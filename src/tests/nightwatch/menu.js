const { linksWork, flagForUpdate } = require('./utils');


module.exports = {
    before: browser => {
        browser.url(browser.launchUrl);
    },

    'The correct menu links appear in the correct order': browser => {
        browser.expect.element('#main-navigation li:nth-child(1) a').text.to.equal('User Activity');
        browser.expect.element('#main-navigation li:nth-child(2) a').text.to.equal('Usage Behavior');
        browser.expect.element('#main-navigation li:nth-child(3) a').text.to.equal('Hardware');
        browser.expect.element('#main-navigation li:nth-child(4) a').text.to.equal('Contact');

        flagForUpdate(browser, '#main-navigation li a', 'menu items', 4);
    },

    'All menu links work': browser => {
        linksWork(browser, '#main-navigation a');
    },
};

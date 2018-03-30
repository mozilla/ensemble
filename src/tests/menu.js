const { linksWork, flagForUpdate } = require('./utils');


module.exports = {
    before: browser => {
        browser.url(browser.launchUrl);
    },

    'Menu items appear in correct order': browser => {
        flagForUpdate(browser, '#main-navigation a', 'menu items', 3);

        browser.expect.element('#main-navigation li:nth-child(1) a').text.to.equal('User Activity');
        browser.expect.element('#main-navigation li:nth-child(2) a').text.to.equal('Usage Behavior');
        browser.expect.element('#main-navigation li:nth-child(3) a').text.to.equal('Hardware');
    },

    'All menu links work': browser => {
        linksWork(browser, '#main-navigation a');
    },
};

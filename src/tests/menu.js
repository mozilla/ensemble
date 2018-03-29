const { linkWorks } = require('./utils');


module.exports = {
    before: browser => {
        browser.url(browser.launchUrl);
    },

    'Menu items appear in correct order': browser => {
        browser.expect.element('#main-navigation li:nth-child(1) a').text.to.equal('User Activity');
        browser.expect.element('#main-navigation li:nth-child(2) a').text.to.equal('Usage Behavior');
        browser.expect.element('#main-navigation li:nth-child(3) a').text.to.equal('Hardware');
    },

    'Menu links work': browser => {
        browser.getAttribute('#main-navigation li:nth-child(1) a', 'href', result => linkWorks(browser, result));
        browser.getAttribute('#main-navigation li:nth-child(2) a', 'href', result => linkWorks(browser, result));
        browser.getAttribute('#main-navigation li:nth-child(3) a', 'href', result => linkWorks(browser, result));
    },
};

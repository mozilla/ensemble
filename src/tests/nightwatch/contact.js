const { linksWork } = require('./utils');


module.exports = {
    before: browser => {
        browser.url(`${browser.launchUrl}/contact`);
    },

    'Page loads': browser => {
        browser.expect.element('#contact').to.be.visible;
    },

    'Page <title> is correct': browser => {
        browser.waitForElementVisible('#contact');
        browser.getTitle(title => browser.assert.equal(title, `Contact | ${browser.globals.siteTitle}`));
    },

    'All links work': browser => {
        browser.waitForElementVisible('#contact');
        linksWork(browser, '#contact a');
    },
};

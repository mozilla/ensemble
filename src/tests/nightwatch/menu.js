const { linksWork, flagForUpdate } = require('./utils');


module.exports = {
    before: browser => {
        browser.url(browser.launchUrl);
    },

    'Upon page load, all menu links are hidden': browser => {
        browser.expect.element('#main-navigation a').to.not.be.visible;
    },

    'Upon page load, no message is displayed beneath the word Mobile': browser => {
        browser.expect.element('.navigation-coming-soon-message').to.not.be.visible;
    },

    'When hovering over the word Desktop, the Desktop menu links appear': browser => {
        browser.moveToElement('#navigation-desktop', 0, 0);
        browser.expect.element('#navigation-desktop a').to.be.visible;
    },

    'When hovering over the word Mobile, the phrase "Coming soon" appears': browser => {
        browser.moveToElement('#navigation-mobile', 0, 0);
        browser.expect.element('.navigation-coming-soon-message').to.be.visible;
        browser.expect.element('.navigation-coming-soon-message').text.to.equal('Coming soon');
    },

    'There are no Mobile menu links': browser => {
        // NB: We use present here. We don't just want to ensure that Mobile
        // links are not visible (even Desktop links are not visible to start
        // with), we want to ensure that they do not exist at all.
        browser.expect.element('#navigation-mobile a').to.not.be.present;
    },

    'The correct Desktop menu links appear in the correct order': browser => {
        browser.moveToElement('#navigation-desktop', 0, 0);

        browser.expect.element('#navigation-desktop li:nth-child(1) a').text.to.equal('User Activity');
        browser.expect.element('#navigation-desktop li:nth-child(2) a').text.to.equal('Usage Behavior');
        browser.expect.element('#navigation-desktop li:nth-child(3) a').text.to.equal('Hardware');

        flagForUpdate(browser, '#navigation-desktop a', 'menu items', 3);
    },

    'All Desktop menu links work': browser => {
        browser.moveToElement('#navigation-desktop', 0, 0);
        browser.waitForElementVisible('#navigation-desktop .navigation-section-members');
        linksWork(browser, '#navigation-desktop a');
    },
};

const { linkWorks, linksWork } = require('./utils');


module.exports = {
    before: browser => {
        browser.url(browser.launchUrl);
    },

    'Page <title> is correct': browser => {
        // Wait for the homepage to load before checking the title. This test
        // would technically pass without this line because Home.js uses the
        // same <title> as the static index.html, but it wouldn't be a proper
        // test. If this line were ommitted, this test would pass even if
        // Home.js wrongly changed the <title> to something else.
        browser.waitForElementVisible('#introduction');

        browser.getTitle(title => browser.assert.equal(title, browser.globals.baseTitle));
    },

    'All introduction links work': browser => {
        browser.waitForElementVisible('#introduction');
        linksWork(browser, '#introduction a');
    },

    'The "proceed button" appears': browser => {
        browser.expect.element('.next-button').to.be.present;
    },

    'The "proceed button" text is correct': browser => {
        browser.expect.element('.next-button').text.to.equal('Proceed to User Activity');
    },

    'The "proceed button" works': browser => {
        browser.waitForElementVisible('.next-button');
        linkWorks(browser, '.next-button a');
    },
};

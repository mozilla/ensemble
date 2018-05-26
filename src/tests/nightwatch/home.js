const { linkWorks, linksWork } = require('./utils');


module.exports = {
    beforeEach: browser => {
        browser.url(browser.launchUrl);
    },

    'Page <title> is correct': browser => {
        // Wait for the homepage to load before checking the title. This test
        // would technically pass without this line because Home.js uses the
        // same <title> as the static index.js, but it wouldn't be a proper
        // test. If this line were ommitted, this test would pass even if
        // Home.js wrongly changed the <title> to something else.
        browser.waitForElementVisible('#introduction');
        browser.assert.title('Firefox Public Data Report');
    },

    'All introduction links work': browser => {
        linksWork(browser, '#introduction a');
    },

    'The next button works': browser => {
        linkWorks(browser, '.next-button a');
    },
};

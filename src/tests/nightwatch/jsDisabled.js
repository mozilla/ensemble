module.exports = {
    before: browser => {
        browser.url(browser.launchUrl);
    },

    'Page <title> is correct when JavaScript is disabled': browser => {
        browser.waitForElementPresent('title');

        // Ensure that React does *not* load. We already test that React sets
        // the correct title (see home.js), but in this test, we want to ensure
        // that the title is correct in index.html to begin with.
        browser.waitForElementNotPresent('#application');

        browser.assert.title('Firefox Public Data Report');
    },

    // For some reason, browser.expect.element('body').text is an empty string
    // when the <noscript> element contains only text. When the <noscript>
    // element has a child <p> which wraps the text, it works as expected.
    'Correct <noscript> message is displayed when JavaScript is disabled': browser => {
        browser.expect.element('#enable-javascript').to.be.visible;
        browser.expect.element('body').text.to.equal('You need to enable JavaScript to run this app.');
    },
};

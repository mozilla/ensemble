module.exports = {
    beforeEach: browser => {
        browser.url(browser.launchUrl);
    },

    'React app renders': browser => {
        browser.expect.element('#application').to.be.present;
    },

    'Site <h1> is correct': browser => {
        browser.expect.element('h1').text.to.be.equal('Firefox Public Data Report');
    },

    '<noscript> message is not displayed': browser => {
        browser.expect.element('#enable-javascript').to.not.be.present;
        browser.expect.element('body').text.to.not.contain('You need to enable JavaScript to run this app.');
    },
};

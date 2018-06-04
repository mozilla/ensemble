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
};

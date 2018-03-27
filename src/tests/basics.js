module.exports = {
    before: browser => {
        browser.url(browser.launchUrl);
    },

    'React app renders': browser => {
        browser.expect.element('#application').to.be.visible;
    },

    'HTML <title> is correct': browser => {
        browser.assert.title('Firefox Public Data Report');
    },

    'Site <h1> is correct': browser => {
        browser.expect.element('h1').text.to.be.equal('Firefox Public Data Report');
    },
};

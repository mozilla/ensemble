module.exports = {
    'React app renders': browser => {
        browser.url(browser.launchUrl);
        browser.expect.element('#application').to.be.present;
        browser.expect.element('#application').to.be.visible;
    },
};

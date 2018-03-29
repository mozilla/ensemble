module.exports = {
    before: browser => {
        browser.url(browser.launchUrl + '/some-long-url-that-will-never-ever-exist');
    },

    'React app renders': browser => {
        browser.expect.element('#not-found').to.be.present;
    },
};

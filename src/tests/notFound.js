module.exports = {
    before: browser => {
        browser.url(browser.launchUrl + '/some-long-url-that-will-never-ever-exist');
    },

    'Not Found page loads for non-existent URLs': browser => {
        browser.expect.element('#not-found').to.be.present;
    },
};

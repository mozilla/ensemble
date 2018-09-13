const selector = 'meta[name="robots"][content="noindex"]';

module.exports = {
    'noindex meta tag is not present for valid paths': browser => {
        browser
            .url(browser.launchUrl)
            .expect.element(selector).to.not.be.present;

        browser
            .url(browser.launchUrl + '/dashboard/user-activity')
            .expect.element(selector).to.not.be.present;

        browser
            .url(browser.launchUrl + '/dashboard/usage-behavior')
            .expect.element(selector).to.not.be.present;

        browser
            .url(browser.launchUrl + '/dashboard/hardware')
            .expect.element(selector).to.not.be.present;
    },

    'noindex meta tag is present for invalid paths': browser => {
        browser
            .url(browser.launchUrl + '/some-long-url-that-will-never-ever-exist')
            .expect.element(selector).to.be.present;
    },
};

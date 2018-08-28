module.exports = {
    'Not Found page loads for paths with superflous suffixes': browser => {
        browser
            .url(browser.launchUrl + '/dashboard/user-activity/some-extra-directory-that-will-never-exist')
            .expect.element('#not-found').to.be.present;

        browser
            .url(browser.launchUrl + '/dashboard/usage-behavior/some-extra-directory-that-will-never-exist')
            .expect.element('#not-found').to.be.present;

        browser
            .url(browser.launchUrl + '/dashboard/hardware/some-extra-directory-that-will-never-exist')
            .expect.element('#not-found').to.be.present;
    },

    'Not Found page loads for non-existent URLs': browser => {
        browser
            .url(browser.launchUrl + '/some-long-url-that-will-never-ever-exist')
            .expect.element('#not-found').to.be.present;
    },
};

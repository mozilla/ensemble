module.exports = {
    before: browser => {
        browser.url(browser.launchUrl);
    },

    'Menu items appear in correct order': browser => {
        browser.expect.element('#main-navigation li:nth-child(1) a').text.to.equal('User Activity');
        browser.expect.element('#main-navigation li:nth-child(2) a').text.to.equal('Usage Behavior');
        browser.expect.element('#main-navigation li:nth-child(3) a').text.to.equal('Hardware');
    },

    'Menu links work': browser => {
        function linkWorks(result) {
            browser.url(result.value);
            browser.expect.element('#not-found').to.not.be.present;
        }

        browser.getAttribute('#main-navigation li:nth-child(1) a', 'href', linkWorks);
        browser.getAttribute('#main-navigation li:nth-child(2) a', 'href', linkWorks);
        browser.getAttribute('#main-navigation li:nth-child(3) a', 'href', linkWorks);
    }
};

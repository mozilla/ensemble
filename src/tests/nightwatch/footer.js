const { linksWork } = require('./utils');


module.exports = {
    before: browser => {
        browser.url(browser.launchUrl);
    },

    'All footer links work': browser => {
        browser.waitForElementVisible('footer');
        linksWork(browser, 'footer a');
    },
};

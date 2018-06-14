const { linksWork } = require('./utils');


module.exports = {
    beforeEach: browser => {
        browser.url(browser.launchUrl);
    },

    'All footer links work': browser => {
        linksWork(browser, 'footer a');
    },
};

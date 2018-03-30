const { linksWork } = require('./utils');


module.exports = {
    before: browser => {
        browser.url(browser.launchUrl);
    },

    'All introduction links work': browser => {
        linksWork(browser, '#introduction a');
    },
};

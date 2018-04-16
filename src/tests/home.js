const { linkWorks, linksWork } = require('./utils');


module.exports = {
    beforeEach: browser => {
        browser.url(browser.launchUrl);
    },

    'All introduction links work': browser => {
        linksWork(browser, '#introduction a');
    },

    'The next button works': browser => {
        linkWorks(browser, '.next-button a');
    },
};

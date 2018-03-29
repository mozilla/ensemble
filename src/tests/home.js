const { linkWorks } = require('./utils');


module.exports = {
    before: browser => {
        browser.url(browser.launchUrl);
    },

    'Homepage links work': browser => {
        browser.getAttribute('article a:nth-of-type(1)', 'href', result => linkWorks(browser, result));
        browser.getAttribute('article a:nth-of-type(2)', 'href', result => linkWorks(browser, result));
        browser.getAttribute('article a:nth-of-type(3)', 'href', result => linkWorks(browser, result));
    },
};

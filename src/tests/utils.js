module.exports.linkWorks = function(browser, result) {
    browser.url(result.value);
    browser.expect.element('#not-found').to.not.be.present;
    browser.back();
}

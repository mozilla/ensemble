function linkWorks(browser, url) {
    browser.url(url);
    browser.expect.element('#not-found').to.not.be.present;
    browser.back();
}

// This is pretty wonky, but it works.
//
// Special care is needed to collect the URLs before navigating, otherwise
// Nightwatch will lose references to elements and get confused.
//
// This Stack Overflow answer sort of explains it, although the author's
// solution isn't perfect:
// https://stackoverflow.com/a/36096623/4297741
function linksWork(browser, selector) {
    browser.elements('css selector', selector, elements => {
        const urls = [];
        const elementIds = elements.value.map(el => el.ELEMENT);

        elementIds.forEach((eid, index) => {
            browser.elementIdAttribute(eid, 'href', result => {
                urls.push(result.value);

                if (index === (elementIds.length - 1)) {
                    urls.forEach(url => {
                        linkWorks(browser, url);
                    });
                }
            });
        });
    });
};

module.exports = {
    linksWork,
}

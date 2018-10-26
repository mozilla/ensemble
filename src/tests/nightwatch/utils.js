const request = require('request');


const acceptedHTTPStatusCodes = [200, 301, 302, 304];

function requestWithRetry(browser, url, attemptNumber = 1) {
    if (url.startsWith('mailto:')) return;

    const maxAttempts = 3;
    const waitSeconds = Math.pow(5, (attemptNumber - 1));

    setTimeout(() => {
        request(url, (error, response) => {
            if (!error && response && acceptedHTTPStatusCodes.includes(response.statusCode)) {
                browser.assert.ok(`Loaded successfully: ${url}`);
            } else {
                if (attemptNumber === maxAttempts) {
                    browser.assert.fail(`${url} did not load successfully after ${attemptNumber} attempts`);
                } else {
                    requestWithRetry(browser, url, attemptNumber + 1);
                }
            }
        });
    }, waitSeconds * 1000);
}

function loadsSuccessfully(browser, url) {
    // URLs that the React app manages. These don't return a 404 but instead
    // display a "Not Found" message.
    if (url.startsWith('http://localhost:3000')) {
        browser.url(url);
        browser.waitForElementNotPresent('#not-found', `Loaded successfully: ${url}`);
        browser.back();
    }

    // External URLs. These should return 404 if they're invalid.
    else {
        requestWithRetry(browser, url);
    }
}

function linkWorks(browser, selector) {
    browser.element('css selector', selector, element => {
        browser.elementIdAttribute(element.value.ELEMENT, 'href', result => {
            loadsSuccessfully(browser, result.value);
        });
    });
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
                        loadsSuccessfully(browser, url);
                    });
                }
            });
        });
    });
}

// If a test assumes that a certain number of elements exist, but a different
// number of elements exist, fail the test and print an explanation.
//
// For example, imagine a test that assumes there are 3 menu items. It checks
// the label of each menu item individually to verify that it is correct. If
// someone later adds another menu item, the label of that menu item should also
// be tested.
//
// To flag this, the person writing the test can add the following line:
//
//     flagForUpdate(browser, '#menu a', 'menu items', 3);
//
// When a fourth menu item is added, the test will fail and a message like the
// following will be printed:
//
//     This test needs to be updated. It assumes that there are 3 menu items,
//     but there are actually 4.
function flagForUpdate(browser, selector, collectiveName, numExpectedElements) {
    browser.elements('css selector', selector, elements => {
        const numActualElements = elements.value.length;

        const isAreExpected = numExpectedElements === 1 ? 'is' : 'are';
        const isAreActual = numActualElements === 1 ? 'is' : 'are';

        if (numActualElements !== numExpectedElements) {
            browser.assert.fail(`This test needs to be updated. It assumes that there ${isAreExpected} ${numExpectedElements} ${collectiveName}, but there ${isAreActual} actually ${numActualElements}.`);
        }
    });
}

function metricTitleIsCorrect(browser, selector, title) {
    browser.waitForElementVisible(selector);
    browser.expect.element(selector).text.to.be.equal(title);
}

module.exports = {
    linkWorks,
    linksWork,
    flagForUpdate,
    metricTitleIsCorrect,
};

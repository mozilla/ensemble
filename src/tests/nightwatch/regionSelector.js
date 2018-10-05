// Many of these tests delete the browser session before checking anything
// because session storage plays a role in which region is applied

const defaultRegion = 'Worldwide';

const regionedDashboards = [
    'user-activity',
    'usage-behavior',
];

const regionlessDashboards = [
    'hardware',
];

function navigationLinksHaveCorrectRegion(browser, region) {
    browser.elements('css selector', '#main-navigation a', elements => {
        const elementIds = elements.value.map(el => el.ELEMENT);

        elementIds.forEach(eid => {
            browser.elementIdAttribute(eid, 'href', attribute => {
                const dashboardKey = /\/dashboard\/(.*?)(\?|\/|$)/.exec(attribute.value)[1];

                if (regionlessDashboards.includes(dashboardKey)) {
                    if (attribute.value.includes('region=')) {
                        browser.assert.fail(`Dashboard ${dashboardKey} does not support regions, but navigation link to it includes "region="`);
                    } else {
                        browser.assert.ok(`Dashboard ${dashboardKey} does not support regions and navigation link to it does not include "region="`);
                    }
                } else {
                    if (attribute.value.includes(`region=${region}`)) {
                        browser.assert.ok(`Dashboard ${dashboardKey} supports regions and ${attribute.value} includes "region=${region}"`);
                    } else {
                        browser.assert.fail(`Dashboard ${dashboardKey} supports regions, but ${attribute.value} does not include "region=${region}"`);
                    }
                }
            });
        });
    });
}

module.exports = {
    'The default region is applied when no ?region query parameter is present': browser => {
        regionedDashboards.forEach(dashboardKey => {
            browser.session('delete')
                   .url(`${browser.launchUrl}/dashboard/${dashboardKey}`)
                   .expect.element('#region-selector').to.have.value.that.equals(defaultRegion);

            browser.session('delete')
                .url(`${browser.launchUrl}/dashboard/${dashboardKey}?some-other-qp=true`)
                .expect.element('#region-selector').to.have.value.that.equals(defaultRegion);

            browser.session('delete')
                .url(`${browser.launchUrl}/dashboard/${dashboardKey}?some-other-qp=true&yet-another-qp=true`)
                .expect.element('#region-selector').to.have.value.that.equals(defaultRegion);
        });
    },

    'The correct region is applied when navigating directly to a page with a valid ?region query parameter': browser => {
        regionedDashboards.forEach(dashboardKey => {
            browser.session('delete')
                   .url(`${browser.launchUrl}/dashboard/${dashboardKey}?region=India`)
                   .expect.element('#region-selector').to.have.value.that.equals('India');

            browser.session('delete')
                   .url(`${browser.launchUrl}/dashboard/${dashboardKey}?region=France`)
                   .expect.element('#region-selector').to.have.value.that.equals('France');

            browser.session('delete')
                   .url(`${browser.launchUrl}/dashboard/${dashboardKey}?region=Russia`)
                   .expect.element('#region-selector').to.have.value.that.equals('Russia');

            browser.session('delete')
                   .url(`${browser.launchUrl}/dashboard/${dashboardKey}?region=India&some-other-qp=true`)
                   .expect.element('#region-selector').to.have.value.that.equals('India');

            browser.session('delete')
                   .url(`${browser.launchUrl}/dashboard/${dashboardKey}?region=France&some-other-qp=true`)
                   .expect.element('#region-selector').to.have.value.that.equals('France');

            browser.session('delete')
                   .url(`${browser.launchUrl}/dashboard/${dashboardKey}?region=Russia&some-other-qp=true`)
                   .expect.element('#region-selector').to.have.value.that.equals('Russia');

            browser.session('delete')
                   .url(`${browser.launchUrl}/dashboard/${dashboardKey}?some-other-qp=true&region=India`)
                   .expect.element('#region-selector').to.have.value.that.equals('India');

            browser.session('delete')
                   .url(`${browser.launchUrl}/dashboard/${dashboardKey}?some-other-qp=true&region=France`)
                   .expect.element('#region-selector').to.have.value.that.equals('France');

            browser.session('delete')
                   .url(`${browser.launchUrl}/dashboard/${dashboardKey}?some-other-qp=true&region=Russia`)
                   .expect.element('#region-selector').to.have.value.that.equals('Russia');
        });
    },

    'The default region is applied when navigating directly to a page with an invalid ?region value': browser => {
        regionedDashboards.forEach(dashboardKey => {
            browser.session('delete')
                   .url(`${browser.launchUrl}/dashboard/${dashboardKey}?region=Tatooine`)
                   .expect.element('#region-selector').to.have.value.that.equals(defaultRegion);

            browser.session('delete')
                   .url(`${browser.launchUrl}/dashboard/${dashboardKey}?region=Hoth`)
                   .expect.element('#region-selector').to.have.value.that.equals(defaultRegion);

            browser.session('delete')
                   .url(`${browser.launchUrl}/dashboard/${dashboardKey}?region=Jakku`)
                   .expect.element('#region-selector').to.have.value.that.equals(defaultRegion);

            browser.session('delete')
                   .url(`${browser.launchUrl}/dashboard/${dashboardKey}?region=Bespin&some-other-qp=true`)
                   .expect.element('#region-selector').to.have.value.that.equals(defaultRegion);

            browser.session('delete')
                   .url(`${browser.launchUrl}/dashboard/${dashboardKey}?some-other-qp=true&region=Bespin`)
                   .expect.element('#region-selector').to.have.value.that.equals(defaultRegion);

            browser.session('delete')
                   .url(`${browser.launchUrl}/dashboard/${dashboardKey}?region`)
                   .expect.element('#region-selector').to.have.value.that.equals(defaultRegion);

            browser.session('delete')
                   .url(`${browser.launchUrl}/dashboard/${dashboardKey}?region=`)
                   .expect.element('#region-selector').to.have.value.that.equals(defaultRegion);

            browser.session('delete')
                   .url(`${browser.launchUrl}/dashboard/${dashboardKey}?some-other-qp=true&region`)
                   .expect.element('#region-selector').to.have.value.that.equals(defaultRegion);

            browser.session('delete')
                   .url(`${browser.launchUrl}/dashboard/${dashboardKey}?some-other-qp=true&region=`)
                   .expect.element('#region-selector').to.have.value.that.equals(defaultRegion);
        });
    },

    'When navigating directly to a page with a ?region query parameter, navigation links get the correct ?region query parameter': browser => {
        regionedDashboards.forEach(dashboardKey => {
            browser.session('delete')
                   .url(`${browser.launchUrl}/dashboard/${dashboardKey}?region=India`);
            navigationLinksHaveCorrectRegion(browser, 'India');

            browser.session('delete')
                   .url(`${browser.launchUrl}/dashboard/${dashboardKey}?region=France`);
            navigationLinksHaveCorrectRegion(browser, 'France');

            browser.session('delete')
                   .url(`${browser.launchUrl}/dashboard/${dashboardKey}?region=Russia`);
            navigationLinksHaveCorrectRegion(browser, 'Russia');
        });
    },

    'When the region selector is used, navigation links get the correct ?region query parameter': browser => {
        regionedDashboards.forEach(dashboardKey => {
            browser.session('delete')
                   .url(`${browser.launchUrl}/dashboard/${dashboardKey}`)
                   .click('#region-selector option[value=India]');
            navigationLinksHaveCorrectRegion(browser, 'India');

            browser.session('delete')
                   .url(`${browser.launchUrl}/dashboard/${dashboardKey}`)
                   .click('#region-selector option[value=France]');
            navigationLinksHaveCorrectRegion(browser, 'France');

            browser.session('delete')
                   .url(`${browser.launchUrl}/dashboard/${dashboardKey}`)
                   .click('#region-selector option[value=Russia]')
            navigationLinksHaveCorrectRegion(browser, 'Russia');

            browser.session('delete')
                   .url(`${browser.launchUrl}/dashboard/${dashboardKey}`)
                   .click('#region-selector option[value=India]')
                   .click('#region-selector option[value=France]');
            navigationLinksHaveCorrectRegion(browser, 'France');

            browser.session('delete')
                   .url(`${browser.launchUrl}/dashboard/${dashboardKey}`)
                   .click('#region-selector option[value=India]')
                   .click('#region-selector option[value=France]')
                   .click('#region-selector option[value=Russia]');
            navigationLinksHaveCorrectRegion(browser, 'Russia');
        });
    },
};

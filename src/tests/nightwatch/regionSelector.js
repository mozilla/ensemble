const dashboards = require('../../../config/dashboards.json');


const defaultRegion = 'Worldwide';

const regionedDashboards = dashboards.sections.reduce((acc, section) => {
    if (!section.members) return acc;

    section.members.forEach(member => {
        if (member.supportsRegions === true) {
            acc.push(member.key);
        }
    });

    return acc;
}, []);

const regionlessDashboards = dashboards.sections.reduce((acc, section) => {
    if (!section.members) return acc;

    section.members.forEach(member => {
        if (!member.supportsRegions || member.supportsRegions !== true) {
            acc.push(member.key);
        }
    });

    return acc;
}, []);

function clearSessionStorage() {
    sessionStorage.clear();
}

module.exports = {
    before: browser => {
        // Clear session storage, since it plays a role in this feature
        browser.execute(clearSessionStorage);
    },

    'Dashboards that support regions use the default region on initial page load': browser => {
        regionedDashboards.forEach(dashboardKey => {
            browser.url(`${browser.launchUrl}/dashboard/${dashboardKey}`)
                   .expect.element('#region-selector').to.have.value.that.equals(defaultRegion);
        });
    },

    'The preferred region is only remembered for the current session': browser => {
        regionedDashboards.forEach(dashboardKey => {
            const dashboardURL = `${browser.launchUrl}/dashboard/${dashboardKey}`;

            browser.url(dashboardURL)
                   .waitForElementVisible('#region-selector')
                   .click('#region-selector option[value=India]')
                   .execute(clearSessionStorage)
                   .refresh()
                   .expect.element('#region-selector').to.have.value.that.equals(defaultRegion);

            browser.url(dashboardURL)
                   .waitForElementVisible('#region-selector')
                   .click('#region-selector option[value=India]')
                   .click('#region-selector option[value=Russia]')
                   .click('#region-selector option[value=France]')
                   .execute(clearSessionStorage)
                   .refresh()
                   .expect.element('#region-selector').to.have.value.that.equals(defaultRegion);

            browser.url(dashboardURL)
                   .waitForElementVisible('#region-selector')
                   .click('#region-selector option[value=India]')
                   .execute(clearSessionStorage)
                   .refresh()
                   .waitForElementVisible('#region-selector')
                   .click('#region-selector option[value=Russia]')
                   .execute(clearSessionStorage)
                   .refresh()
                   .waitForElementVisible('#region-selector')
                   .click('#region-selector option[value=France]')
                   .execute(clearSessionStorage)
                   .refresh()
                   .expect.element('#region-selector').to.have.value.that.equals(defaultRegion);
        });
    },

    'If the user selects a region, that region will be used when the page is reloaded': browser => {
        regionedDashboards.forEach(dashboardKey => {
            const dashboardURL = `${browser.launchUrl}/dashboard/${dashboardKey}`;

            browser.url(dashboardURL)
                   .waitForElementVisible('#region-selector')
                   .click('#region-selector option[value=India]')
                   .refresh()
                   .expect.element('#region-selector').to.have.value.that.equals('India');

            browser.url(dashboardURL)
                   .waitForElementVisible('#region-selector')
                   .click('#region-selector option[value=India]')
                   .click('#region-selector option[value=Russia]')
                   .click('#region-selector option[value=France]')
                   .refresh()
                   .expect.element('#region-selector').to.have.value.that.equals('France');
        });
    },

    'If the user selects a region, that region will be used on other dashboards that support regions': browser => {
        regionedDashboards.forEach(dashboardBeingTestedKey => {
            const dashboardBeingTestedURL = `${browser.launchUrl}/dashboard/${dashboardBeingTestedKey}`;

            const otherRegionedDashboards = regionedDashboards.filter(otherRegionedDashboardKey => {
                return otherRegionedDashboardKey !== dashboardBeingTestedKey;
            });

            // The anonymous blocks don't actually do anything here. They just
            // help us to group sub-tests.

            // Choose a region and then check other regioned dashboards
            {
                browser.url(dashboardBeingTestedURL)
                       .waitForElementVisible('#region-selector')
                       .click('#region-selector option[value=India]');

                otherRegionedDashboards.forEach(otherRegionedDashboardKey => {
                    browser.url(`${browser.launchUrl}/dashboard/${otherRegionedDashboardKey}`)
                           .expect.element('#region-selector').to.have.value.that.equals('India');
                });
            }

            // Choose multiple regions and then check other regioned dashboards
            {
                browser.url(dashboardBeingTestedURL)
                       .waitForElementVisible('#region-selector')
                       .click('#region-selector option[value=India]')
                       .click('#region-selector option[value=Russia]')
                       .click('#region-selector option[value=France]');

                otherRegionedDashboards.forEach(otherRegionedDashboardKey => {
                    browser.url(`${browser.launchUrl}/dashboard/${otherRegionedDashboardKey}`)
                        .expect.element('#region-selector').to.have.value.that.equals('France');
                });
            }

            // Choose a region, go to the homepage, and then check all regioned
            // dashboards, including the one we started on
            {
                browser.url(dashboardBeingTestedURL)
                       .waitForElementVisible('#region-selector')
                       .click('#region-selector option[value=India]')
                       .url(browser.launchUrl);

                regionedDashboards.forEach(regionedDashboardKey => {
                    browser.url(`${browser.launchUrl}/dashboard/${regionedDashboardKey}`)
                        .expect.element('#region-selector').to.have.value.that.equals('India');
                });
            }

            // Choose multiple regions, go to the homepage, and then check all
            // regioned dashboards, including the one we started on
            {
                browser.url(dashboardBeingTestedURL)
                       .waitForElementVisible('#region-selector')
                       .click('#region-selector option[value=India]')
                       .click('#region-selector option[value=Russia]')
                       .click('#region-selector option[value=France]')
                       .url(browser.launchUrl);

                regionedDashboards.forEach(regionedDashboardKey => {
                    browser.url(`${browser.launchUrl}/dashboard/${regionedDashboardKey}`)
                        .expect.element('#region-selector').to.have.value.that.equals('France');
                });
            }

            // Choose a region, go to regionless dashboards, and then check all
            // regioned dashboards, including the one we started on
            {
                browser.url(dashboardBeingTestedURL)
                       .waitForElementVisible('#region-selector')
                       .click('#region-selector option[value=India]');

                regionlessDashboards.forEach(regionlessDashboardKey => {
                    browser.url(`${browser.launchUrl}/dashboard/${regionlessDashboardKey}`);
                });

                regionedDashboards.forEach(regionedDashboardKey => {
                    browser.url(`${browser.launchUrl}/dashboard/${regionedDashboardKey}`)
                        .expect.element('#region-selector').to.have.value.that.equals('India');
                });
            }

            // Choose multiple regions, go to regionless dashboards, and then
            // check all regioned dashboards, including the one we started on
            {
                browser.url(dashboardBeingTestedURL)
                       .waitForElementVisible('#region-selector')
                       .click('#region-selector option[value=India]')
                       .click('#region-selector option[value=Russia]')
                       .click('#region-selector option[value=France]');

                regionlessDashboards.forEach(regionlessDashboardKey => {
                    browser.url(`${browser.launchUrl}/dashboard/${regionlessDashboardKey}`);
                });

                regionedDashboards.forEach(regionedDashboardKey => {
                    browser.url(`${browser.launchUrl}/dashboard/${regionedDashboardKey}`)
                           .expect.element('#region-selector').to.have.value.that.equals('France');
                });
            }
        });
    },

    "Metrics load successfully on regionless dashboards if a region was previously selected elsewhere": browser => {
        regionedDashboards.forEach(regionedDashboardKey => {
            const regionedDashboardURL = `${browser.launchUrl}/dashboard/${regionedDashboardKey}`;

            function testRegionlessDashboards() {
                regionlessDashboards.forEach(regionlessDashboardKey => {
                    browser.url(`${browser.launchUrl}/dashboard/${regionlessDashboardKey}`);
                    browser.expect.element('.metric').to.be.present;
                });
            }

            browser.url(regionedDashboardURL)
                   .waitForElementVisible('#region-selector')
                   .click('#region-selector option[value=India]');

            testRegionlessDashboards();

            browser.url(regionedDashboardURL)
                   .waitForElementVisible('#region-selector')
                   .click('#region-selector option[value=India]')
                   .click('#region-selector option[value=Russia]')
                   .click('#region-selector option[value=France]');

            testRegionlessDashboards();
        });
    },
};

const { flagForUpdate } = require('../utils');


module.exports = {
    beforeEach: browser => {
        browser.url(`${browser.launchUrl}/dashboard/hardware`);
    },

    'Dashboard loads': browser => {
        browser.expect.element('#dashboard').to.be.present;
    },

    'Dashboard title is correct': browser => {
        browser.expect.element('#dashboard-title').text.to.be.equal('Hardware Across the Web');
    },

    'Section titles and order are correct': browser => {
        // Wait for the dashboard to load
        browser.waitForElementVisible('#dashboard');

        flagForUpdate(browser, '#dashboard-sections .dashboard-section', 'sections in the hardware dashboard', 4);

        browser.expect.element('#dashboard-sections .dashboard-section:nth-child(1) h3').text.to.be.equal('Graphics');
        browser.expect.element('#dashboard-sections .dashboard-section:nth-child(2) h3').text.to.be.equal('Processor');
        browser.expect.element('#dashboard-sections .dashboard-section:nth-child(3) h3').text.to.be.equal('Operating System');
        browser.expect.element('#dashboard-sections .dashboard-section:nth-child(4) h3').text.to.be.equal('Plugins');
    },

    'Chart titles and order are correct': browser => {
        // Wait for the dashboard to load
        browser.waitForElementVisible('#dashboard');

        flagForUpdate(browser, '.chart', 'charts in the hardware dashboard', 12);

        browser.expect.element('#dashboard-sections .dashboard-section:nth-child(1) #graphics-metric-overview-1 h3').text.to.be.equal('GPU Model');
        browser.expect.element('#dashboard-sections .dashboard-section:nth-child(1) #graphics-metric-overview-2 h3').text.to.be.equal('GPU Vendor');
        browser.expect.element('#dashboard-sections .dashboard-section:nth-child(1) #graphics-metric-overview-3 h3').text.to.be.equal('Display Resolution');
        browser.expect.element('#dashboard-sections .dashboard-section:nth-child(2) #processor-metric-overview-1 h3').text.to.be.equal('CPU Vendor');
        browser.expect.element('#dashboard-sections .dashboard-section:nth-child(2) #processor-metric-overview-2 h3').text.to.be.equal('CPU Cores');
        browser.expect.element('#dashboard-sections .dashboard-section:nth-child(2) #processor-metric-overview-3 h3').text.to.be.equal('CPU Speeds');
        browser.expect.element('#dashboard-sections .dashboard-section:nth-child(2) #processor-metric-overview-4 h3').text.to.be.equal('Memory');
        browser.expect.element('#dashboard-sections .dashboard-section:nth-child(3) #operatingsystem-metric-overview-1 h3').text.to.be.equal('Operating System');
        browser.expect.element('#dashboard-sections .dashboard-section:nth-child(3) #operatingsystem-metric-overview-2 h3').text.to.be.equal('Browsers by Architecture');
        browser.expect.element('#dashboard-sections .dashboard-section:nth-child(3) #operatingsystem-metric-overview-3 h3').text.to.be.equal('Operating Systems by Architecture');
        browser.expect.element('#dashboard-sections .dashboard-section:nth-child(4) #plugins-metric-overview-1 h3').text.to.be.equal('Has Flash');
        browser.expect.element('#dashboard-sections .dashboard-section:nth-child(4) #plugins-metric-overview-2 h3').text.to.be.equal('Has Unity');
    },

    'Charts render': browser => {
        // Wait for the dashboard to load
        browser.waitForElementVisible('#dashboard');

        flagForUpdate(browser, '.chart', 'charts in the hardware dashboard', 12);

        browser.expect.element('#graphics-metric-overview-1 svg').to.be.visible;
        browser.expect.element('#graphics-metric-overview-1 path.mg-line1').to.be.visible;

        browser.expect.element('#graphics-metric-overview-2 svg').to.be.visible;
        browser.expect.element('#graphics-metric-overview-2 path.mg-line1').to.be.visible;

        browser.expect.element('#graphics-metric-overview-3 svg').to.be.visible;
        browser.expect.element('#graphics-metric-overview-3 path.mg-line1').to.be.visible;

        browser.expect.element('#processor-metric-overview-1 svg').to.be.visible;
        browser.expect.element('#processor-metric-overview-1 path.mg-line1').to.be.visible;

        browser.expect.element('#processor-metric-overview-2 svg').to.be.visible;
        browser.expect.element('#processor-metric-overview-2 path.mg-line1').to.be.visible;

        browser.expect.element('#processor-metric-overview-3 svg').to.be.visible;
        browser.expect.element('#processor-metric-overview-3 path.mg-line1').to.be.visible;

        browser.expect.element('#processor-metric-overview-4 svg').to.be.visible;
        browser.expect.element('#processor-metric-overview-4 path.mg-line1').to.be.visible;

        browser.expect.element('#operatingsystem-metric-overview-1 svg').to.be.visible;
        browser.expect.element('#operatingsystem-metric-overview-1 path.mg-line1').to.be.visible;

        browser.expect.element('#operatingsystem-metric-overview-2 svg').to.be.visible;
        browser.expect.element('#operatingsystem-metric-overview-2 path.mg-line1').to.be.visible;

        browser.expect.element('#operatingsystem-metric-overview-3 svg').to.be.visible;
        browser.expect.element('#operatingsystem-metric-overview-3 path.mg-line1').to.be.visible;

        browser.expect.element('#plugins-metric-overview-1 svg').to.be.visible;
        browser.expect.element('#plugins-metric-overview-1 path.mg-line1').to.be.visible;

        browser.expect.element('#plugins-metric-overview-2 svg').to.be.visible;
        browser.expect.element('#plugins-metric-overview-2 path.mg-line1').to.be.visible;
    },
};

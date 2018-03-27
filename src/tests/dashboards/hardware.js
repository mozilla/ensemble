module.exports = {
    before: browser => {
        browser.url(`${browser.launchUrl}/dashboard/hardware`);
    },

    'Dashboard title is correct': browser => {
        browser.expect.element('#dashboard-title').text.to.be.equal('Hardware Across the Web');
    },

    'Section titles and order are correct': browser => {
        browser.expect.element('#dashboard-sections section:nth-child(1) h3').text.to.be.equal('Graphics');
        browser.expect.element('#dashboard-sections section:nth-child(2) h3').text.to.be.equal('Processor');
        browser.expect.element('#dashboard-sections section:nth-child(3) h3').text.to.be.equal('Operating System');
        browser.expect.element('#dashboard-sections section:nth-child(4) h3').text.to.be.equal('Plugins');
    },

    'Chart titles and order are correct': browser => {
        browser.expect.element('#dashboard-sections section:nth-child(1) #graphics-metric-wrapper-1 .mg-chart-title').text.to.be.equal('GPU Model');
        browser.expect.element('#dashboard-sections section:nth-child(1) #graphics-metric-wrapper-2 .mg-chart-title').text.to.be.equal('GPU Vendor');
        browser.expect.element('#dashboard-sections section:nth-child(1) #graphics-metric-wrapper-3 .mg-chart-title').text.to.be.equal('Display Resolution');
        browser.expect.element('#dashboard-sections section:nth-child(2) #processor-metric-wrapper-1 .mg-chart-title').text.to.be.equal('CPU Vendor');
        browser.expect.element('#dashboard-sections section:nth-child(2) #processor-metric-wrapper-2 .mg-chart-title').text.to.be.equal('CPU Cores');
        browser.expect.element('#dashboard-sections section:nth-child(2) #processor-metric-wrapper-3 .mg-chart-title').text.to.be.equal('CPU Speeds');
        browser.expect.element('#dashboard-sections section:nth-child(2) #processor-metric-wrapper-4 .mg-chart-title').text.to.be.equal('Memory');
        browser.expect.element('#dashboard-sections section:nth-child(3) #operatingsystem-metric-wrapper-1 .mg-chart-title').text.to.be.equal('Operating System');
        browser.expect.element('#dashboard-sections section:nth-child(3) #operatingsystem-metric-wrapper-2 .mg-chart-title').text.to.be.equal('Browsers by Architecture');
        browser.expect.element('#dashboard-sections section:nth-child(3) #operatingsystem-metric-wrapper-3 .mg-chart-title').text.to.be.equal('Operating Systems by Architecture');
        browser.expect.element('#dashboard-sections section:nth-child(4) #plugins-metric-wrapper-1 .mg-chart-title').text.to.be.equal('Flash');
        browser.expect.element('#dashboard-sections section:nth-child(4) #plugins-metric-wrapper-2 .mg-chart-title').text.to.be.equal('Unity');
    },
};

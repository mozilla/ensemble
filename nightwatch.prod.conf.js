const nightwatch_config = require('./nightwatch.local.conf.js');

nightwatch_config.test_settings.default.launch_url = 'https://data.firefox.com';
nightwatch_config.test_settings.default.globals.siteTitle = 'Firefox Public Data Report';

module.exports = nightwatch_config;

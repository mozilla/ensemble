const nightwatch_config = require('./nightwatch.local.conf.js');

nightwatch_config.test_settings.default.launch_url = 'https://data-ensemble.stage.mozaws.net';
nightwatch_config.test_settings.default.globals.siteTitle = 'Firefox Public Data Report (Stage)';

module.exports = nightwatch_config;

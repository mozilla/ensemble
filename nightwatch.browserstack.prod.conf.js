const nightwatch_config = require('./nightwatch.browserstack.local.conf.js');

for(const envName in nightwatch_config.test_settings) {
    const envConfig = nightwatch_config.test_settings[envName];
    envConfig.launch_url = 'https://data.firefox.com';
}

module.exports = nightwatch_config;

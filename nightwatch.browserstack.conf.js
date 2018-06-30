/**
 * Nightwatch configuration file for BrowserStack.
 *
 * Based on:
 * https://www.browserstack.com/automate/nightwatch
 */

const localConfig = require('./nightwatch.local.conf.js');


const nightwatch_config = {
    src_folders: localConfig.src_folders,

    selenium : {
        start_process: false,
        host: 'hub-cloud.browserstack.com',
        port: 80,
    },

    test_settings: {
        default: {
            launch_url: localConfig.test_settings.default.launch_url,
            exclude: localConfig.test_settings.default.exclude,
            globals: localConfig.test_settings.default.globals,
            desiredCapabilities: {
                'browserstack.user': process.env.BSUSER,
                'browserstack.key': process.env.BSKEY,
                'browserstack.local': true,
                browser: 'chrome',
            },
        },
        jsDisabled: {
            desiredCapabilities: {
                browser: 'firefox',
                'moz:firefoxOptions': {
                    args: ['-headless'],
                    prefs: {
                        'javascript.enabled': false,
                    },
                },
            },
        },
    },
};

// Code to copy seleniumhost/port into test settings
for(const i in nightwatch_config.test_settings){
    const config = nightwatch_config.test_settings[i];
    config['selenium_host'] = nightwatch_config.selenium.host;
    config['selenium_port'] = nightwatch_config.selenium.port;
}

module.exports = nightwatch_config;

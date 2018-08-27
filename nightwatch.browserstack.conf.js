/**
 * Nightwatch configuration file for BrowserStack.
 *
 * Based on:
 * https://www.browserstack.com/automate/nightwatch
 */

const localConfig = require('./nightwatch.local.conf.js');
const packageJSON = require('./package.json');


const nightwatch_config = {
    src_folders: localConfig.src_folders,

    selenium : {
        start_process: false,
        host: 'hub-cloud.browserstack.com',
        port: 80,
    },

    common_capabilities: {
        'browserstack.user': process.env.BSUSER,
        'browserstack.key': process.env.BSKEY,
        'browserstack.local': true,
        'browserstack.selenium_version': '3.10.0',
        project: packageJSON.name,
        build: packageJSON.version,
    },

    common_settings: {
        launch_url: localConfig.test_settings.default.launch_url,
        exclude: localConfig.test_settings.default.exclude,
        skip_testcases_on_fail: true,
        globals: {
            waitForConditionTimeout: 25000,
        },
    },

    test_settings: {
        jsDisabled: {
            desiredCapabilities: {
                browserName: 'firefox',
                'moz:firefoxOptions': {
                    args: ['-headless'],
                    prefs: {
                        'javascript.enabled': false,
                    },
                },
            },
        },
        ie: {
            desiredCapabilities: {
                os: 'Windows',
                os_version: '7',
                browserName: 'IE',
                browser_version: '11.0',
            },
        },
        edge: {
            desiredCapabilities: {
                os: 'Windows',
                os_version: '10',
                browserName: 'Edge',
                browser_version: '15.0',
            },
        },
        safari: {
            desiredCapabilities: {
                os: 'OS X',
                os_version: 'Sierra',
                browserName: 'Safari',
                browser_version: '10.0',
            },
        },
        firefoxWin7: {
            desiredCapabilities: {
                os: 'Windows',
                os_version: '7',
                browserName: 'Firefox',
                browser_version: '58.0',
            },
        },
        firefoxSierra: {
            desiredCapabilities: {
                os: 'OS X',
                os_version: 'Sierra',
                browserName: 'Firefox',
                browser_version: '58.0',
            },
        },
        chromeWin7: {
            desiredCapabilities: {
                os: 'Windows',
                os_version: '7',
                browserName: 'Chrome',
                browser_version: '63.0',
            },
        },
        chromeSierra: {
            desiredCapabilities: {
                os: 'OS X',
                os_version: 'Sierra',
                browserName: 'Chrome',
                browser_version: '63.0',
            },
        },
    },
};

for(const envName in nightwatch_config.test_settings) {
    const envConfig = nightwatch_config.test_settings[envName];

    // Copy global Selenium settings into this env's settings
    // https://www.browserstack.com/automate/nightwatch
    envConfig['selenium_host'] = nightwatch_config.selenium.host;
    envConfig['selenium_port'] = nightwatch_config.selenium.port;

    // Support common_capabilities, which helps us run tests in parallel
    // https://www.browserstack.com/automate/nightwatch
    envConfig['desiredCapabilities'] = envConfig['desiredCapabilities'] || {};
    for(const ccName in nightwatch_config.common_capabilities) {
        envConfig['desiredCapabilities'][ccName] =
            envConfig['desiredCapabilities'][ccName] ||
            nightwatch_config.common_capabilities[ccName];
    }

    // Support common_settings, which also helps us run tests in parallel. This
    // is needed for the same reason the code block above is needed, although
    // it's not discussed in the BrowserStack docs.
    for(const csName in nightwatch_config.common_settings) {
        envConfig[csName] = envConfig[csName] ||
            nightwatch_config.common_settings[csName];
    }
}

module.exports = nightwatch_config;

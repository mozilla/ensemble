const packageJSON = require('./package.json');

const runOnBrowserStack = process.env.BS === 'true'; // cast to boolean

const launchURL = process.env.NIGHTWATCH_LAUNCH_URL;
const siteTitle = process.env.NIGHTWATCH_SITE_TITLE;
const timeout = runOnBrowserStack ? 25000 : 10000;

const config = {
    src_folders: ['./src/tests/nightwatch'],

    test_settings: {
        chrome: {
            webdriver: {
                server_path: 'node_modules/.bin/chromedriver',
                port: 9515,
            },
            desiredCapabilities: {
                browserName: 'chrome',
                chromeOptions: {
                    args: ['headless'],
                },
            },
        },

        // Tests fail in this environment when they seemingly should not. Also,
        // versions of geckodriver greater than 1.12.2 don't run at all for some
        // reason.
        //
        // firefox: {
        //     webdriver: {
        //         server_path: 'node_modules/.bin/geckodriver',
        //         port: 4444,
        //     },
        //     desiredCapabilities: {
        //         browserName: 'firefox',
        //         alwaysMatch: {
        //             'moz:firefoxOptions': {
        //                 args: ['-headless'],
        //             },
        //         },
        //     },
        // },

        // Tests fail in this environment when they seemingly should not.
        //
        // safari: {
        //     webdriver: {
        //         server_path: '/usr/bin/safaridriver',
        //         port: 9616,
        //         cli_args: [
        //             "--port", "9616",
        //         ],
        //     },
        //     desiredCapabilities: {
        //         browserName: 'safari',
        //     },
        // },

        // Tests fail in this environment when they seemingly should not. Also,
        // versions of geckodriver greater than 1.12.2 don't run at all for some
        // reason.
        //
        // jsDisabled: {
        //     filter: 'jsDisabled.js',
        //     exclude: null,
        //     desiredCapabilities: {
        //         browserName: 'firefox',
        //         alwaysMatch: {
        //             'moz:firefoxOptions': {
        //                 args: ['-headless'],
        //                 prefs: {
        //                     'javascript.enabled': false,
        //                 },
        //             },
        //         },
        //     },
        // },

        'BrowserStack:ie': {
            desiredCapabilities: {
                os: 'Windows',
                os_version: '7',
                browserName: 'IE',
                browser_version: '11.0',
            },
        },

        'BrowserStack:edge': {
            desiredCapabilities: {
                os: 'Windows',
                os_version: '10',
                browserName: 'Edge',
                browser_version: '15.0',
            },
        },

        // Tests fail in this environment when they seemingly should not.
        //
        // 'BrowserStack:safari': {
        //     desiredCapabilities: {
        //         os: 'OS X',
        //         os_version: 'Sierra',
        //         browserName: 'Safari',
        //         browser_version: '10.0',
        //     },
        // },

        'BrowserStack:firefoxWin7': {
            desiredCapabilities: {
                os: 'Windows',
                os_version: '7',
                browserName: 'Firefox',
                browser_version: '58.0',
            },
        },

        'BrowserStack:firefoxSierra': {
            desiredCapabilities: {
                os: 'OS X',
                os_version: 'Sierra',
                browserName: 'Firefox',
                browser_version: '58.0',
            },
        },

        'BrowserStack:chromeWin7': {
            desiredCapabilities: {
                os: 'Windows',
                os_version: '7',
                browserName: 'Chrome',
                browser_version: '63.0',
            },
        },

        'BrowserStack:chromeSierra': {
            desiredCapabilities: {
                os: 'OS X',
                os_version: 'Sierra',
                browserName: 'Chrome',
                browser_version: '63.0',
            },
        },
    },
};

/**
 * Inject the "selenium" or the "webdriver" configuration depending on whether
 * BrowserStack is being used. We only want one configuration object to be
 * present at a time because BrowserStack will get confused if the "webdriver"
 * configuration is present.
 */
function addDriver() {
    if (runOnBrowserStack) {
        config.selenium = {
            start_process: false,
        };
    } else {
        config.webdriver = {
            start_process: true,
        };
    }
}

/**
 * Inject common configuration options into all environments. We could have a
 * "default" environment with these values, but that environment would also need
 * to have a desiredCapabilities.webdriver configuration object, which would
 * then be applied to all BrowserStack environments, once again confusing
 * BrowserStack.
 */
function addDefaultEnvironmentSettings() {
    for (const environmentName of Object.keys(config.test_settings)) {
        const environment = config.test_settings[environmentName];

        environment.launch_url = launchURL;
        environment.exclude = ['runners', 'utils.js', 'jsDisabled.js'];
        environment.globals = {
            waitForConditionTimeout: timeout,
            siteTitle,
        };
    }
}

/**
 * Inject needed configurations into all BrowserStack environments. This is
 * easier than manually adding these same configurations to all BrowserStack
 * environments.
 *
 * We could create a separate nightwatch.browserstack.conf.js file with all of
 * these values in the "default" environment, but BrowserStack ignores the
 * "default" environment when running tests in parallel for some reason. To run
 * tests in parallel, all of these values need to be directly in each
 * BrowserStack environment configuration object.
 *
 * This is based on the following documentation:
 * https://www.browserstack.com/automate/nightwatch
 */
function addBrowserStackSettings() {
    const browserStackPrefix = 'BrowserStack:';

    const browserStackEnvironmentNames = Object.keys(
        config.test_settings
    ).filter(e => e.startsWith(browserStackPrefix));

    for (const environmentName of browserStackEnvironmentNames) {
        const environment = config.test_settings[environmentName];

        // Selenium settings
        environment['selenium_host'] = 'hub-cloud.browserstack.com';
        environment['selenium_port'] = 80;

        // BrowserStack settings
        environment.desiredCapabilities['browserstack.user'] = process.env.BSUSER;
        environment.desiredCapabilities['browserstack.key'] = process.env.BSKEY;
        environment.desiredCapabilities['browserstack.local'] = true;
        environment.desiredCapabilities['browserstack.selenium_version'] = '3.14.0';
        environment.desiredCapabilities.project = packageJSON.name;
        environment.desiredCapabilities.build = packageJSON.version;
    }
}

addDriver();
addDefaultEnvironmentSettings();
addBrowserStackSettings();

module.exports = config;

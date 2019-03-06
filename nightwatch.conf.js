// See https://www.browserstack.com/automate/nightwatch-integration
require('browserstack-automate').Nightwatch();

const port = process.env.NIGHTWATCH_PORT || 3000;
const launchURL = process.env.NIGHTWATCH_LAUNCH_URL || `http://localhost:${port}`;
const siteTitle = process.env.NIGHTWATCH_SITE_TITLE || 'Firefox Public Data Report';
const timeout = process.env.NIGHTWATCH_TIMEOUT || 10000;

module.exports = {
    src_folders: ['./src/tests/nightwatch'],

    webdriver: {
        start_process: true,
    },

    test_settings: {
        default: {
            launch_url: launchURL,
            exclude: ['runners', 'utils.js', 'jsDisabled.js'],
            globals: {
                waitForConditionTimeout: timeout,
                siteTitle,
            },
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

        // At the time of this writing, geckodriver doesn't support concurrency.
        // As a result, this environment is never used.
        //
        // I have also found that the latest version of the geckodriver Node
        // module that works is 1.12.2. Newer versions seem to get stuck in an
        // infinite loop.
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
        // }

        // Again, geckodriver cannot be run concurrently.
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

        // BrowserStack tests are disabled due to this issue:
        // https://github.com/browserstack/browserstack-integration-nodejs/issues/11

        // 'BrowserStack:ie': {
        //     desiredCapabilities: {
        //         os: 'Windows',
        //         os_version: '7',
        //         browserName: 'IE',
        //         browser_version: '11.0',
        //     },
        // },

        // 'BrowserStack:edge': {
        //     desiredCapabilities: {
        //         os: 'Windows',
        //         os_version: '10',
        //         browserName: 'Edge',
        //         browser_version: '15.0',
        //     },
        // },

        // For some unkown reason, many tests fail when run against Safari using
        // BrowserStack Automate. These same tests pass when run against Safari
        // locally. The website also functions correctly in Safari on
        // BrowserStack Live.
        //
        // A support issue with BrowserStack was not able to resolve the issue.
        // It's possible that the tests will stop failing once BrowserStack
        // provides and we use a newer version of Selenium. We currently use
        // Selenium 3.10.0. See the common_capabilities section above.
        //
        // 'BrowserStack:safari': {
        //     desiredCapabilities: {
        //         os: 'OS X',
        //         os_version: 'Sierra',
        //         browserName: 'Safari',
        //         browser_version: '10.0',
        //     },
        // },

        // 'BrowserStack:firefoxWin7': {
        //     desiredCapabilities: {
        //         os: 'Windows',
        //         os_version: '7',
        //         browserName: 'Firefox',
        //         browser_version: '58.0',
        //     },
        // },

        // 'BrowserStack:firefoxSierra': {
        //     desiredCapabilities: {
        //         os: 'OS X',
        //         os_version: 'Sierra',
        //         browserName: 'Firefox',
        //         browser_version: '58.0',
        //     },
        // },

        // 'BrowserStack:chromeWin7': {
        //     desiredCapabilities: {
        //         os: 'Windows',
        //         os_version: '7',
        //         browserName: 'Chrome',
        //         browser_version: '63.0',
        //     },
        // },

        // 'BrowserStack:chromeSierra': {
        //     desiredCapabilities: {
        //         os: 'OS X',
        //         os_version: 'Sierra',
        //         browserName: 'Chrome',
        //         browser_version: '63.0',
        //     },
        // },
    },
};

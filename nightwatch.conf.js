const settings = {
    dev: {
        baseURL: 'http://localhost:3000',
        baseTitle: 'Firefox Public Data Report',
    },
    stage: {
        baseURL: 'https://data-ensemble.stage.mozaws.net',
        baseTitle: 'Firefox Public Data Report (Stage)',
    },
    prod: {
        baseURL: 'https://data.firefox.com',
        baseTitle: 'Firefox Public Data Report',
    },
}[process.env.NIGHTWATCH_TARGET];

module.exports = {
    src_folders: ['./src/tests/nightwatch'],

    webdriver: {
        start_process: true,
    },

    test_settings: {
        jsDisabled: {
            launch_url: settings.baseURL,
            globals: {
                baseTitle: settings.baseTitle,
                waitForConditionTimeout: 10000,
            },
            webdriver: {
                server_path: 'node_modules/.bin/chromedriver',
                port: 9515,
            },
            filter: './src/tests/nightwatch/jsDisabled.js',
            desiredCapabilities: {
                browserName: 'chrome',

                // For some reason, JavaScript isn't disabled when Chrome is
                // headless.
                chromeOptions: {
                    prefs: {
                        'profile.managed_default_content_settings.javascript': 2,
                    },
                },
            },
        },

        // This environment could be named "default" and the "jsDisabled"
        // environment could simply be a set of overrides to those defaults, but
        // for some reason, when I do that, I can't turn off headless mode. And
        // due to another apparent bug, JS isn't disabled in headless mode.
        chrome: {
            launch_url: settings.baseURL,
            exclude: [
                'utils.js',
                'jsDisabled.js',
            ],
            globals: {
                baseTitle: settings.baseTitle,
                waitForConditionTimeout: 10000,
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
    },
};

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
        default: {
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

        jsDisabled: {
            exclude: null,
            filter: './src/tests/nightwatch/jsDisabled.js',
            desiredCapabilities: {
                chromeOptions: {
                    // JavaScript cannot be disabled in headless mode.
                    // https://stackoverflow.com/a/47538023/4297741
                    args: ['disable-headless-mode'],
                    prefs: {
                        'profile.managed_default_content_settings.javascript': 2,
                    },
                },
            },
        },
    },
};

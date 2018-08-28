module.exports = {
    src_folders: ['./src/tests/nightwatch'],
    output_folder: false,

    selenium: {
        server_path: require('selenium-server-standalone-jar').path,
        start_process: true,
        log_path: '',
        host: '127.0.0.1',
        port: 4444,
        cli_args: {
            'webdriver.gecko.driver': './node_modules/geckodriver/bin/geckodriver',
        },
    },

    test_settings: {
        default: {
            launch_url : 'http://localhost:3000',
            exclude: ['config', 'runners', 'utils.js'],
            globals: {
                waitForConditionTimeout: 10000,
            },
            desiredCapabilities: {
                browserName: 'firefox',
                'moz:firefoxOptions': {
                    args: ['-headless'],
                },
            },
        },
        chrome: {
            desiredCapabilities: {
                browserName: 'chrome',
                chromeOptions: {
                    args: ['--headless'],
                },
            },
        },
        safari: {
            desiredCapabilities: {
                browserName: 'safari',
            },
        },
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
    },
};

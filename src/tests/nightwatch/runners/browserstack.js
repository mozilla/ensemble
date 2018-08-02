#!/usr/bin/env node

/**
 * A Nightwatch runner that can test local sites in BrowserStack
 *
 * Based on:
 * https://www.browserstack.com/automate/nightwatch
 */

const nightwatch = require('nightwatch');
const browserstack = require('browserstack-local');


if (!process.env.BSUSER || !process.env.BSKEY) {
    if (!process.env.BSUSER) {
        // eslint-disable-next-line no-console
        console.error('BSUSER is not set');
    }

    if (!process.env.BSKEY) {
        // eslint-disable-next-line no-console
        console.error('BSKEY is not set');
    }

    process.exit(1);
}

let bs_local;

process.mainModule.filename = './node_modules/.bin/nightwatch';

// Code to start browserstack local before start of test
// eslint-disable-next-line no-console
console.log('Connecting local...');
nightwatch.bs_local = bs_local = new browserstack.Local();
bs_local.start({ key: process.env.BSKEY, onlyAutomate: true }, error => {
    if (error) {
        // eslint-disable-next-line no-console
        console.log('There was an error while starting the test runner:');
        process.stderr.write(error);
        process.stderr.write(error.stack + '\n');
        process.exit(2);
    }

    // eslint-disable-next-line no-console
    console.log('Connected. Now testing...');
    nightwatch.cli(argv => {
        nightwatch.CliRunner(argv)
            .setup(null, () => {
                // Code to stop browserstack local after end of parallel test
                bs_local.stop(() => {});
            })
            .runTests(() => {
                // Code to stop browserstack local after end of single test
                bs_local.stop(() => {});
            });
    });
});

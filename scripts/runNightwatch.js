/* eslint-disable no-shadow */

const path = require('path');
const { spawn } = require('child_process');
const nightwatchConfig = require('../nightwatch.conf.js');


const serverName = getServerName(); // dev, stage, or prod
const useBrowserStack = getUseBrowserStack(); // boolean

const siteDetails = getSiteDetails(serverName);
const enabledNightwatchEnvironmentNames = getEnabledNightwatchEnvironmentNames(useBrowserStack);

runTests(siteDetails, enabledNightwatchEnvironmentNames);

function getServerName() {
    return process.argv[2];
}

function getUseBrowserStack() {
    return process.argv[3] === 'true'; // cast to boolean
}

function getSiteDetails(serverName) {
    return {
        dev: {
            NIGHTWATCH_LAUNCH_URL: `http://localhost:${process.env.NIGHTWATCH_PORT || 3000}`,
            NIGHTWATCH_SITE_TITLE: 'Firefox Public Data Report',
        },
        stage: {
            NIGHTWATCH_LAUNCH_URL: 'https://data-ensemble.stage.mozaws.net',
            NIGHTWATCH_SITE_TITLE: 'Firefox Public Data Report (Stage)',
        },
        prod: {
            NIGHTWATCH_LAUNCH_URL: 'https://data.firefox.com',
            NIGHTWATCH_SITE_TITLE: 'Firefox Public Data Report',
        },
    }[serverName];
}

function getEnabledNightwatchEnvironmentNames(useBrowserStack) {
    const allNightwatchEnvironmentNames = Object.keys(nightwatchConfig.test_settings);
    const browserStackPrefix = 'BrowserStack';

    let enabledNightwatchEnvironmentNames;
    if (useBrowserStack) {
        enabledNightwatchEnvironmentNames = allNightwatchEnvironmentNames.filter(e => {
            return e.startsWith(browserStackPrefix);
        });
    } else {
        enabledNightwatchEnvironmentNames = allNightwatchEnvironmentNames.filter(e => {
            return !e.startsWith(browserStackPrefix);
        });
    }

    return enabledNightwatchEnvironmentNames;
}

/**
 * To ensure that only one test is run at a time, this is a recursive function
 * where the recursive call is made only when a command completes and there are
 * more commands that need to be run.
 */
function runTests(siteDetails, nightwatchEnvironmentNames) {
    const thisNightwatchEnvironmentName = nightwatchEnvironmentNames.shift();

    // Add these environment variables, but let anything in process.env take
    // precedence
    const shellEnvironment = Object.assign({}, {
        NIGHTWATCH_LAUNCH_URL: siteDetails.NIGHTWATCH_LAUNCH_URL,
        NIGHTWATCH_SITE_TITLE: siteDetails.NIGHTWATCH_SITE_TITLE,
    }, process.env);

    const proc = spawn('nightwatch', ['--env', thisNightwatchEnvironmentName], {
        cwd: path.join(__dirname, '..'),
        env: shellEnvironment,
    });

    // eslint-disable-next-line no-console
    proc.stdout.pipe(process.stdout);

    // eslint-disable-next-line no-console
    proc.stderr.pipe(process.stderr);

   proc.on('close', code => {
       if (code === 0) {
           if (nightwatchEnvironmentNames.length !== 0) {
               runTests(siteDetails, nightwatchEnvironmentNames);
           }
       } else {
           // eslint-disable-next-line no-console
           console.error(`Nightwatch tests failed for environment "${
               thisNightwatchEnvironmentName
           }" when run ${useBrowserStack ? 'on BrowserStack' : 'locally'}.`);
       }
    });
}

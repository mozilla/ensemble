/* eslint-disable no-shadow */

const path = require('path');
const { spawn } = require('child_process');
const nightwatchConfig = require('../nightwatch.conf.js');


const serverName = process.argv[2]; // dev, stage, or prod
const useBrowserStack = process.env.BS === 'true'; // cast to boolean

const siteDetails = getSiteDetails(serverName);
const enabledNightwatchEnvironmentNames = getEnabledNightwatchEnvironmentNames(useBrowserStack);

runTests(siteDetails, enabledNightwatchEnvironmentNames, useBrowserStack);

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
 * This function runs all Nightwatch environments sequentially. geckodriver
 * refuses to be run in parallel (like --env chrome,firefox) and although we
 * might be able to spawn multiple single-env Nightwatch commands at one time
 * without geckodriver complaining, the output would be unreadable.
 *
 * As a result, this is written as a recursive function where the recursive call
 * is made only when a command completes and when there are more commands to
 * run.
 */
function runTests(siteDetails, nightwatchEnvironmentNames, useBrowserStack, passingEnvironments = []) {
    const thisNightwatchEnvironmentName = nightwatchEnvironmentNames.shift();

    // Add these environment variables, but let anything in process.env take
    // precedence
    const shellEnvironment = Object.assign({}, {
        NIGHTWATCH_LAUNCH_URL: siteDetails.NIGHTWATCH_LAUNCH_URL,
        NIGHTWATCH_SITE_TITLE: siteDetails.NIGHTWATCH_SITE_TITLE,
    }, process.env);

    let command, args;
    if (useBrowserStack) {
        command = 'node';
        args = [
            'src/tests/nightwatch/runners/browserStackRunner.js',
            '--env',
            thisNightwatchEnvironmentName,
        ];
    } else {
        command = 'nightwatch';
        args = [
            '--env',
            thisNightwatchEnvironmentName,
        ];
    }

    const proc = spawn(command, args, {
        // const proc = spawn(command, ['--env', thisNightwatchEnvironmentName], {
        cwd: path.join(__dirname, '..'),
        env: shellEnvironment,
    });

    // eslint-disable-next-line no-console
    proc.stdout.pipe(process.stdout);

    // eslint-disable-next-line no-console
    proc.stderr.pipe(process.stderr);

   proc.on('close', code => {
       const where = useBrowserStack ? 'on BrowserStack' : 'locally';

       function printPassingEnvironments(passingEnvironments) {
           if (passingEnvironments.length === 0) return;

           // eslint-disable-next-line no-console
           console.log(`The following environments passed ${where}: ${
               passingEnvironments.map(e => `"${e}"`).join(',')
           }`);
       }

       if (code === 0) {
           passingEnvironments.push(thisNightwatchEnvironmentName);

           if (nightwatchEnvironmentNames.length === 0) {
               // eslint-disable-next-line no-console
               console.log();

               printPassingEnvironments(passingEnvironments);
           } else {
               runTests(siteDetails, nightwatchEnvironmentNames, useBrowserStack, passingEnvironments);
           }
       } else {
           // eslint-disable-next-line no-console
           console.log();

           printPassingEnvironments(passingEnvironments);

           // eslint-disable-next-line no-console
           console.error(`The following environment failed ${where}: "${
               thisNightwatchEnvironmentName
           }"`);
       }
    });
}

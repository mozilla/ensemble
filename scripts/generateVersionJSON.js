const childProcess = require('child_process');
const fs = require('fs');


const outFilename = './build/ops/version.json';

const versionJSON = {
    source: "https://github.com/mozilla/ensemble",
    commit: process.env.SOURCE_VERSION || childProcess.execSync('git rev-parse HEAD').toString().trim(),
};

fs.writeFile(outFilename, JSON.stringify(versionJSON, null, 4), error => {
    if (error) {
        console.error(error);
    }

    console.log('Wrote ' + outFilename);
});

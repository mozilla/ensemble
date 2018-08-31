Ensemble is the platform that powers the [Firefox Public Data
Report](https://data.firefox.com), a weekly public report on the activity,
behavior, and hardware configuration of Firefox Desktop users.

Ensemble fetches data from
[ensemble-transposer](https://github.com/mozilla/ensemble-transposer), a JSON
server that adds metadata to the raw data hosted by Mozilla data engineers.

Ensemble is written in React with the help of the wonderful
[create-react-app](https://github.com/facebook/create-react-app) tool from
Facebook.

## Run

### For development

Run `npm start`

Any of the environment variables in *.env* can be overridden. For example:

`REACT_APP_SITE_TITLE='Firefox Public Lore Report' npm start`

### In production

See the [create-react-app documentation on
deployment](https://github.com/facebook/create-react-app/blob/master/packages/react-scripts/template/README.md#deployment).

Any of the environment variables in *.env* can be overridden.

## Development

### Testing

To run Jest, Nightwatch, and ESLint tests locally, run `npm test`.

Nightwatch tests can optionally be run against the staging and production sites.
Run `npm run test:nightwatch:stage` or `npm run test:nightwatch:prod`
respectively.

#### BrowserStack

Follow these steps to run Nightwatch tests against even more browsers and
operating systems using BrowserStack.

1. Sign up for a BrowserStack account which supports automated testing (for
   example, an Automate Pro account). Note that automated testing is not
   available with free accounts.
2. Follow the instructions in the *Live (using other browsers); Automate; App
   Automate* section of [this page](https://www.browserstack.com/local-testing)
   to download, install, and run the BrowserStackLocal executable.
    * BrowserStack tells users to use the command-line executable for automated
      testing, but you may actually have better luck using the GUI app, which is
      linked from the *Live* section.
3. [Start Ensemble](#run)
4. Run `BSUSER=username BSKEY=key npm run test:nightwatch:browserstack:local`

Alternatively, the tests can be run against staging or production. Just change
*local* to *stage* or *prod* in the command above.

This command will print a ton of output. If any tests fail, the errors will be
printed and subsequent browsers will be skipped. If the command finishes
printing output and the last thing that was printed was not an error, you can
rest assured that all tests passed in all configured browsers. We'd like to find
a better way of presenting this information in the future.

If you get an error about local testing through BrowserStack not being
connected, wait about 30 seconds and try again. If it keeps happening, try
stopping and re-starting the BrowserStackLocal process.

### Analyzing

To analyze the size of the JavaScript bundle that will be served, run `npm run
size`.

### Notes

#### Versioning

To adhere to [Dockerflow](https://github.com/mozilla-services/Dockerflow), we
maintain a version number for this project. We try to update it when we deploy
new code. The version number is specified in package.json.

The number looks like a semantic version number, but [semver isn't suitable for
applications](https://softwareengineering.stackexchange.com/a/255201). We
instead follow this basic guideline: the first number is incremented for major
changes, the second number is incremented for medium changes, and the third
number is incremented for small changes.

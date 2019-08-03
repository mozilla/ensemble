Ensemble is the platform that powers the [Firefox Public Data
Report](https://data.firefox.com), a weekly public report on the activity,
behavior, and hardware configuration of Firefox Desktop users.

Ensemble fetches data from
[ensemble-transposer](https://github.com/mozilla/ensemble-transposer), a JSON
server that adds metadata to the raw data hosted by Mozilla data engineers.

Ensemble is written in React with the help of the wonderful
[create-react-app](https://github.com/facebook/create-react-app) tool from
Facebook. See the [create-react-app documentation](https://facebook.github.io/create-react-app/docs/getting-started)
for more information. Some highlights and some additional information are
provided here.

## Run

### For development

Run `npm start`

Any of the environment variables in *.env* can be overridden. For example:

`REACT_APP_SITE_TITLE='Firefox Public Lore Report' npm start`

### In production

See the [create-react-app documentation on
deployment](https://facebook.github.io/create-react-app/docs/deployment).

Any of the environment variables in *.env* can be overridden.

## Development

### Testing

To run Jest, Nightwatch, and ESLint tests locally, run the following:

1. `safaridriver --enable`
2. `npm test`

Nightwatch tests can optionally be run against the staging and production sites.
Run `npm run test:nightwatch:stage` or `npm run test:nightwatch:prod`
respectively.

### Analyzing

To analyze the size of the JavaScript bundle that will be served, run `npm run
size`.

### Notes

#### Versioning

We maintain a version number for this project. We try to update it when we
deploy new code. The version number is specified in package.json.

The number looks like a semantic version number, but [semver isn't suitable for
applications](https://softwareengineering.stackexchange.com/a/255201). We
instead follow this basic guideline: the first number is incremented for major
changes, the second number is incremented for medium changes, and the third
number is incremented for small changes.

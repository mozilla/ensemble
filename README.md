Ensemble is the platform that powers the Firefox Public Data Report, a weekly
public report on the activity, behavior, and hardware configuration of Firefox
Desktop users.

Ensemble fetches data from
[ensemble-transposer](https://github.com/mozilla/ensemble-transposer), a JSON
server that adds metadata to the raw data hosted by Mozilla data engineers.

Ensemble is written in React with the help of the wonderful
[create-react-app](https://github.com/facebook/create-react-app) tool from
Facebook.

## Development

### Notes

This project features two servers: one for use during development and one for
use on production. The development server features hot reloading whereas the
production server does not. The development server uses client-side rendering
whereas the production server renders content on the server for improved
performance, improved SEO, and more.

### Install

1. [Install Yarn](https://yarnpkg.com/lang/en/docs/install/)
2. Run `yarn`

### Run

#### Development server

To run the development server, which features hot reloading, run `yarn dev`.

##### Production server

To run the production server, run `yarn start`.

### Test

#### Development server

Testing against the development server is often more convenient, since the
development server does not need the project to be built first.

1. Run `yarn dev`
2. In another terminal, run `yarn validate` (**NB:** not `yarn test`; although
   `yarn test` does run some tests, `yarn validate` does additional quality
   assurance like linting JavaScript and checking for security vulnerabilities)

#### Production server

If you want to be even more thorough, follow these steps to test the site as
rendered by the production server.

1. Run `PORT=3000 yarn start`
2. In another terminal, run `yarn validate` (**NB:** not `yarn test`; although
   `yarn test` does run some tests, `yarn validate` does additional quality
   assurance like linting JavaScript and checking for security vulnerabilities)

### Analyze

To analyze the size of the JavaScript bundle that will be served, run `yarn
size`.
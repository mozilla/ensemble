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

### Install

1. [Install Yarn](https://yarnpkg.com/lang/en/docs/install/)
2. Run `yarn`

### Run

Run `yarn start`

### Test

Run `yarn validate` (**NB:** not `yarn test`; although `yarn test` does run some
tests, `yarn validate` does additional quality assurance like linting JavaScript
and checking for security vulnerabilities)

### Analyze

To analyze the size of the JavaScript bundle that will be served, run `yarn
size`.

### Notes

#### Adding new pages

When adding a new page, be sure to update the `routes` object of *static.json*
accordingly. For example, if an */about* page is added, the following property
should be added to the `routes` object:

```javascript
"/about": "index.html"
```

If this is not done, the page will 404 on production.

We could use a wildcard in *static.json* to send all unknown paths to
*index.html*, but that would mean even non-existent paths would render
successfully and the server would never return a 404.
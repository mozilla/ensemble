# Frontend

This file describes how this repository's own code is organized: a React single-page application
built with Vite, that renders data it fetches at runtime and stores none of its own. For the system
beyond this repository, see `system-overview.md` and `data-pipeline.md` in this directory; for how
to build, test, and change this code, see `CONTRIBUTING.md` at the repository root.

## `src/config.json` is the spine

Confirmed by reading the file directly: `src/config.json` has two arrays, and almost every
structural change to this application starts by editing one of them.

`dashboards` currently has three entries (`user-activity`, `usage-behavior`, `hardware`), each
shaped `{ key, menuTitle, source, supportsRegions }`. `key` drives the route
`/dashboard/<key>` in `src/components/views/Main.jsx` and the navigation entry in
`src/components/views/Header.jsx`; `source` is an absolute production URL — confirmed, all three
currently point at `https://data.firefox.com/datasets/desktop/<key>`, which is exactly the bucket
path `data-pipeline.md` describes the transposer writing to. There is no environment variable for
the data source: you cannot point this application at a local transposer instance without editing
this file directly. **Adding a dashboard is adding one entry to this array.**

`nextButtons` has three entries shaped `{ from, to, text }`, each driving one "Proceed to …"
call-to-action via `src/components/decorators/withNextButton.jsx`.

## Data flow

This application has no state library, no hooks-based state, and no Redux — state lives in
`this.state` on class-based container components, plus one `sessionStorage` key,
`preferredRegion`, set in `DashboardContainer.jsx`. Three containers do all of the data fetching:

| Container | Fetches | Notes |
|---|---|---|
| `containers/DashboardContainer.jsx` | `${source}/index.json` | title, description, metaDescription, sections, dates, metrics, summaryMetrics, `categories` (the region list), defaultCategory |
| `containers/MetricOverviewContainer.jsx` | `${dashboardSource}/${activeRegion}/${slug}/index.json` | title, description, `type: 'line'` or `'table'`, axes, columns, data, annotations |
| `containers/SummaryMetricContainer.jsx` | the same per-metric endpoint | buckets any population under 5% into an "Other" bucket |

`react-refetch@3.0.1`'s `connect()` higher-order component is the entire data-fetching layer and is
used in exactly those three files. Each one handles its fetch's pending, rejected, and fulfilled
states itself and renders `views/Spinner.jsx` or `views/Error.jsx` accordingly. All reshaping of
fetched data happens client-side in each container's `formatData` method — `ChartContainer` sorts
its populations by maximum y-value and drops nulls; `DataTableContainer` sorts rows by value,
descending.

## Rendering metric descriptions: a real sanitization boundary

Metric `description` strings are rendered as inline Markdown and inserted via
`dangerouslySetInnerHTML` — React's own escape hatch for inserting raw HTML, named the way it is
specifically to make a reader stop and check what's flowing into it. Confirmed by reading every call
site (`grep -rn "dangerouslySetInnerHTML" src/components/`): there are exactly four, two in
`views/Dashboard.jsx` (lines 57 and 65) and two in `views/MetricOverview.jsx` (lines 34 and 40).

The two files configure their `markdown-it` parser independently of each other, not from one shared
configuration — worth knowing before changing either, since a change to one does not affect the
other. Confirmed by reading both: `Dashboard.jsx` uses `markdownIt('zero').enable(['emphasis'])`;
`MetricOverview.jsx` uses `markdownIt('zero').use(markdownItSup).enable(['link', 'entity'])`.
Together, across the two files, exactly `link`, `entity`, `emphasis`, and `sup` are enabled on top
of the `zero` preset (which starts with every rule disabled, including raw HTML passthrough).
`src/tests/jest/MetricOverview.test.jsx` exists specifically to guard this — never widen either
file's enabled-rule list without extending that test to match.

### Security posture, as of this writing

`npm audit` reports 17 vulnerabilities against a fresh install (3 moderate, 14 high, 0 critical).
This is down from an earlier, much worse baseline of 251 (21 of them critical), confirmed at the
time by tracing all 21 critical-severity package names through `npm ls <name>`: every one resolved
through exactly one of four build-only dependency roots — `react-scripts`, `nightwatch`, `request`,
or `npm-run-all` — none of which was imported by any file under `src/`, so none of them shipped to
the browser. All four have since been removed from this repository entirely (`react-scripts` and
`npm-run-all` replaced, `nightwatch` and `request` no longer used at all), which is why the critical
count is now zero.

Of the advisories that do affect packages actually bundled into the shipped build, each sits behind
a code path this application doesn't exercise: `markdown-it`'s flagged `linkify`/`smartquotes` rules
are the ones disabled by the `zero` preset described above; a flagged `d3-color` ReDoS advisory
needs an attacker-controlled color string, and this application has none; a flagged `react-router`
regex advisory needs parameterized routes, and this application's four routes
(`/`, `/contact`, `/dashboard/<key>`, and a catch-all) are all static.

The one real, structural gap: **there is no Content-Security-Policy**, and the four
`dangerouslySetInnerHTML` sites above rely entirely on `markdown-it`'s `html: false` default
holding — true as of this writing, but not enforced by any test or header. Adding a CSP is a genuine
piece of security work, not something this documentation pass does on its own.

## Three confirmed code defects, not yet filed as issues

Found while verifying this repository's own claims about itself, and confirmed by reading the exact
lines named:

- `views/Chart.jsx` line 112 checks `props.suggestedYMax`, but line 113 reads
  `props.suggestedMax` — a prop name that does not exist anywhere else in the codebase. This is
  currently latent because no live metric sets a `suggestedYMax`, but it will silently produce the
  wrong chart y-axis maximum the moment one does.
- `views/SummaryMetric.jsx` line 46 sets `this.arrowIgnoreThreshold = 4` in the constructor, but
  line 131 reads `this.ignoreThreshold` — a property that is never set anywhere. The "hide the
  arrow on small bars" logic this line implements has never worked.
- `views/SummaryMetric.jsx` line 67 defines a `_handleResize` method that is never attached to any
  event listener anywhere in the file (confirmed: no `addEventListener` call exists in it at all).
  The four hardware summary bars this component renders do not respond to window resize.

None of these three are filed as GitHub issues as of this writing. Whoever picks one up should file
it as an issue first — these are exactly the kind of finding that belongs in the tracker, not as a
permanent list in this file, for the same reason the wider issue backlog isn't summarized in
`system-overview.md`.

## File layout

    src/
    ├── index.jsx                    entry: ReactDOM.render + BrowserRouter
    ├── config.json                  the route/dashboard table + next-button flow (above)
    ├── registerServiceWorker.js     only unregister() is called
    ├── setupTests.js                enzyme adapter; puts React and shallow on the global object
    ├── components/
    │   ├── containers/              6 stateful, data-fetching .jsx files (above)
    │   ├── decorators/              withTracker.jsx (react-ga), withNextButton.jsx
    │   └── views/                   19 presentational .jsx files
    │       ├── styl/                Stylus source, hand-edited; includes/lib.styl holds shared variables
    │       ├── css/                 generated from styl/, gitignored — see CONTRIBUTING.md
    │       ├── fonts/FiraSans/      8 weights/styles of webfonts
    │       └── img/                 3 assets
    ├── lib/
    │   ├── lazyLoad.jsx             wraps a dynamic import() in React.lazy
    │   ├── LazyBoundary.jsx         error boundary + Suspense fallback, paired with lazyLoad.jsx
    │   └── utils.js                 bumpSort, isFloat, prettifyNumber, getPageTitle
    └── tests/
        └── jest/                    2 unit test files, run by Vitest (see CONTRIBUTING.md)

    tests/
    └── playwright/                  end-to-end specs, run by Playwright (see CONTRIBUTING.md);
                                      deliberately at the repository root, not under src/

There is no `pages/`, `store/`, `hooks/`, `api/`, or `locales/` directory — this is a small enough
application that none has been needed. `public/` holds static files served as-is (`manifest.json`,
`contribute.json`, `img/`); `index.html` itself lives at the repository root, Vite's convention.
`build/` is gitignored output. Routes are exactly `/`, `/contact`, `/dashboard/<key>`, and a
catch-all not-found page.

## The dependency ceiling on modernizing this application

Worth knowing before attempting any React upgrade: confirmed by reading their installed
`package.json` files directly, both `react-metrics-graphics` (this application's charting library)
and `react-refetch` (its entire data-fetching layer, described above) declare a `peerDependencies`
constraint that caps React at version 16 (`^15||^16` and an equivalent range respectively). Neither
has shipped a release since 2019, and the charting library's own upstream, `metrics-graphics`, has
been stuck on a never-promoted 3.0 beta since 2022.

**This application cannot move past React 16 without first replacing its chart-rendering and
data-fetching layers.** That is a legitimate, large, separate initiative in its own right — not
something to bundle into routine maintenance or into any build-tooling change. Any plan touching
this application's build tooling should leave the React version, `react-router-dom`, and
`react-refetch` untouched, and say so explicitly, rather than assume they're in scope.

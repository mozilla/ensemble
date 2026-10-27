# Upgrade to React 18 and react-router 7, replace react-refetch, and clear the way to React 19

This ExecPlan is a living document. The sections `Progress`, `Surprises & Discoveries`,
`Decision Log`, and `Outcomes & Retrospective` must be kept up to date as work proceeds. It is
maintained in accordance with `.claude/skills/execplans/references/PLANS.md`, including its
"Ensemble addendum", which overrides the upstream text where the two disagree.

## Purpose / Big Picture

The site runs on React 16.14, released in 2020. Its data layer (react-refetch) and its chart
wrapper (react-metrics-graphics) are abandoned, and both refuse any React newer than 16. Its
analytics library (react-ga) sends Universal Analytics hits, which Google stopped processing, so the
site has no working page-view tracking. Each month this lasts, Dependabot has more updates it can't
land and the next maintainer has an older React to learn.

After this work the site runs on React 18 and react-router 7, and no dependency pins React to an
old major. Fetching and chart drawing run on small local modules the team owns. Page views go to
Google Analytics 4 once a real measurement ID is configured. To a visitor, nothing changes: every
dashboard, chart, region selector, title, and Not Found page behaves as it does today.

The plan set out to reach React 19. Every dependency now allows it, but React 19 made charts appear
about 600 ms later (see Surprises), so the user chose to stay on React 18 until the lazy loading is
restructured. That restructure and the React 19 bump are follow-up work.

To see it working, run `npm start`, open <http://localhost:3000/dashboard/hardware>, and change the
region. The charts redraw. Then run `npm ls react` and see `react@18.3.1` with no `invalid` or
`overridden` markers.

Out of scope: React 19 (see above); react-router 8, which needs React 19.2.7; converting class
components to hooks beyond what the router requires; React StrictMode; a real GA4 measurement ID;
and a consent banner.

## Progress

- [x] (2026-10-26) Drafted the plan on branch `react-18-upgrade` (first named `react-19-upgrade`), cut from `major-updates`.
      Baseline from the improve-tests plan's outcome: Vitest 14 files, 80 tests.
- [x] (2026-10-26) Milestone 1: replaced react-refetch with `src/lib/withFetch.jsx`. Vitest
      passes 15 files, 84 tests; recorded Playwright 70 passed; live Playwright 46 passed; lint
      clean; build succeeds; `d3-transition` still nested under `d3@4`. Turning the stale-response
      guard off fails exactly the new "Ignores a response that arrives after a newer request has
      started" test.
- [x] (2026-10-26) Milestone 2: replaced react-metrics-graphics with
      `src/components/views/MetricsGraphics.jsx`. Vitest 15 files, 84 tests; recorded Playwright
      70 passed, and the dev server no longer logs the `componentWillReceiveProps` warning; lint
      clean; build succeeds; `d3-transition` still nested. Live Playwright had 1 failure (a
      `toBeVisible` timeout) on the first run and 46 passed on the immediate re-run, so it was not
      this change.
- [x] (2026-10-26) Milestone 3: react-router-dom 5.3.4 to 6.30.6. Vitest 15 files, 84 tests;
      recorded Playwright 70 passed; lint clean; build succeeds; `d3-transition` still nested. Live
      Playwright 45 passed, 1 flaky: the hardware "Charts render" flake described in Surprises,
      which happens on `major-updates` too.
- [x] (2026-10-26) Milestone 4: React 18.3.1, `@testing-library/react` 16.3.3,
      `@testing-library/dom` 10.4.2, `@testing-library/jest-dom` 7.0.1, `createRoot`, and the
      automatic JSX runtime. Vitest 15 files, 84 tests, exit 0; recorded Playwright 70 passed, and
      68 of 68 chromium specs passed with retries off on a cold `vite --force` server with no 504s;
      live Playwright 46 passed; lint clean; build succeeds; `d3-transition` still nested.
- [x] (2026-10-26) Milestone 5: react-router-dom 6.30.6 to react-router 7.18.4, imported from
      `react-router`. Vitest 15 files, 84 tests, exit 0, no warnings; recorded Playwright 70
      passed; live Playwright 46 passed; lint clean; build succeeds; `d3-transition` still nested.
      The future-flag pass on v6 was skipped: no routes use relative links or nested splats, and
      the full suites on v7, which has both flags on by default, are the same check.
- [x] (2026-10-26) Milestone 6, revised: react-helmet-async 3.0.0 and GA4 through react-ga4
      3.0.1, on React 18.3.1. Vitest 15 files, 84 tests, exit 0; recorded Playwright 70 passed with
      retries off in 12.8 s; live Playwright 46 passed; lint clean; build succeeds; `d3-transition`
      still nested. In a browser against the dev server: one `<title>` in `<head>`, the noindex tag
      on `/nope`, and one GA4 `page_view` per route (`/`, then `/dashboard/hardware` after a click).
- [x] (2026-10-26) Tried React 19.3.1 in Milestone 6. All suites passed, but charts appeared about
      600 ms later (see Surprises). Reverted to React 18.3.1 at the user's choice.
- [ ] Follow-up, not in this plan: restructure lazy loading so React 19's Suspense throttle doesn't
      delay the charts, then move to React 19 and react-router 8.

## Surprises & Discoveries

- Observation: once `withFetch` reads `window.fetch` per request, the container tests need no
  hoisting. `vi.spyOn(window, 'fetch')` in `beforeEach` works, and `setupTests.js`'s
  `vi.restoreAllMocks()` removes it after each test. Do not call `mockReset()` on that spy: in
  current Vitest, resetting a spy restores the real implementation, so the next request would go to
  the network.
  Evidence: all five converted files pass unchanged apart from the stub setup.
- Observation: on React 18, a test that waits with `vi.waitFor`, or returns while a lazy route is
  still loading, fails the whole Vitest run. Every test still passes, but React logs "A suspended
  resource finished loading inside a test, but the event was not wrapped in act(...)" when the
  `React.lazy` chunk resolves. `setupTests.js` throws on that `console.error` outside any test, and
  Vitest reports it as an unhandled rejection and exits 1. React Testing Library's `waitFor` and
  `findBy*` turn off React's act environment while waiting, so they don't trigger it.
  Evidence: `Routes.test.jsx` produced 12 unhandled rejections with "Tests 84 passed" and exit 1.
  Switching its three `vi.waitFor` calls to RTL's `waitFor`, and making the header-links test wait
  for the page, brought it to exit 0.
- Observation: the dev server pre-bundles dependencies correctly once the classic-runtime
  `optimizeDeps` workaround is gone. On React 18 the dependency scan finds `react/jsx-dev-runtime`.
  Evidence: `npx vite --force` then the chromium Playwright project, retries off: 68 passed, and no
  "Outdated Optimize Dep" or re-optimization in the server log.
- Observation: React 19 makes charts appear about 600 ms later, and the cause is in this app's
  lazy loading, not a bug. Once a `Suspense` boundary has shown its fallback, React 19 waits until
  at least 300 ms after that fallback before revealing the content. A dashboard goes through two of
  those: the lazily loaded route in `views/Main.jsx` and each metric's lazily loaded chart in
  `views/MetricOverview.jsx`. The dashboard's `index.json` fetch only starts once the first one
  ends, because `withFetch` fetches when the container mounts. The tests showed it first:
  `regionSelector.spec.js` took 28 s instead of a few, because each `toBeVisible` that missed the
  first poll waited for Playwright's next one, around 850 ms later.
  Evidence: time from navigation start to the first `path.mg-main-line`, 5 loads each, recorded
  data, production build (`vite preview`): React 18.3.1, hardware 80–113 ms and user-activity
  42–55 ms; React 19.3.1, hardware 680–735 ms and user-activity 637–645 ms. A DOM trace on React 19
  showed the spinner at 72 ms, every route module loaded by 117 ms, and the `index.json` request at
  389 ms. Making the route components lazy only once, at module scope, didn't help, because
  `page.goto` is a full page load that starts with nothing cached.
- Observation: on React 19, react-helmet-async 3 doesn't manage `<head>` at all. It renders plain
  `<title>` and `<meta>` elements and leaves the hoisting to React, and `HelmetProvider` does
  nothing. So it can't deduplicate tags on React 19, which was the reason given for choosing it.
  On React 18 it manages tags itself, as react-helmet did, and needs a `HelmetProvider` above every
  `<Helmet>`, in tests too.
  Evidence: `node_modules/react-helmet-async/README.md`, section "React 19". In a browser on React
  18, `head title` counts 1 and the title changes on each navigation.
- Observation: the live hardware "Charts render" spec sometimes times out waiting for
  `#graphics-metric-overview-1 svg`. It happens on this branch's base as well, and never on
  recorded data, so it comes from live-data latency, not this work. Retries absorb it in CI.
  Evidence: with `--retries=0`, live: 1 of 8 failed on Milestone 3 and 1 of 16 failed on
  `major-updates`, both on that locator. Recorded: 20 of 20 passed.

## Decision Log

- Decision: one plan covering all three upgrades, done in dependency order on one branch,
  `react-18-upgrade` (first named `react-19-upgrade`), opened as a single pull request stacked on `major-updates`.
  Rationale: each upgrade blocks the next. React 18 needs react-refetch,
  react-metrics-graphics, and React Testing Library 12 gone. React 19 needs react-ga and
  react-helmet gone. The user chose the single stacked branch. There is no issue yet, so the branch
  has no issue-number prefix, at the user's request.
  Date/Author: 2026-10-26, Stephanie Hobson.
- Decision: remove both React-16-only dependencies while still on React 16 (Milestones 1 and 2),
  then move the router to v6 (Milestone 3), before touching React itself.
  Rationale: every one of those changes can be proved against today's test suite on a React
  version known to work. That way, if Milestone 4 fails, the cause is React 18 and nothing else.
  Date/Author: 2026-10-26, Stephanie Hobson.
- Decision: replace react-refetch with a local higher-order component that keeps react-refetch's
  `dataFetch` prop shape, rather than adopting a fetching library or rewriting the containers as
  hooks.
  Rationale: the three containers and their tests depend on exact behaviors (listed in Context
  and Orientation). Keeping the prop shape means the containers change only in their import and
  their `export default` line, and the existing container tests prove the replacement.
  Date/Author: 2026-10-26, Stephanie Hobson.
- Decision: replace react-metrics-graphics with a local component rather than raising its peer
  range with an npm `overrides` entry.
  Rationale: the package is about 30 lines. It uses `componentWillReceiveProps`, which React 18
  and 19 warn about, and it hasn't been published since 2018. An override would hide a warning in
  code nobody maintains.
  Date/Author: 2026-10-26, Stephanie Hobson.
- Decision: take the router to 6, then to 7, and stop there.
  Rationale: v6 runs on React 16.8 and later, so the API rewrite can land before React changes.
  v7 needs React 18 and is a small step from v6. v8 needs React 19.2.7 and came out in October
  2026, which is too new under the repository's 7-day release-age habit. The user chose this.
  Date/Author: 2026-10-26, Stephanie Hobson.
- Decision: replace react-ga with react-ga4, and rename `VITE_GA_TRACKING_ID` to
  `VITE_GA_MEASUREMENT_ID`, with a placeholder value in `.env`.
  Rationale: react-ga caps React at 18 and sends Universal Analytics hits, which Google no longer
  processes. The user chose GA4 over removing analytics. A real measurement ID and any consent
  banner belong to the deploy, which happens outside this repository, so this plan leaves the ID as
  a placeholder.
  Date/Author: 2026-10-26, Stephanie Hobson.
- Decision: replace react-helmet with react-helmet-async rather than React 19's built-in
  `<title>` and `<meta>` hoisting.
  Rationale: React 19 hoists those tags into `<head>` but does not deduplicate them.
  `index.html` already holds a static `<title>`, and pages nest, so the built-in hoisting would
  leave two titles and repeated meta tags. react-helmet-async supports React 16 through 19 and
  replaces tags the way react-helmet does now.
  Date/Author: 2026-10-26, Stephanie Hobson.
- Decision: in `views/Main.jsx`, keep creating the lazy route components inside render rather than
  hoisting them to module scope, as Milestone 3 first planned.
  Rationale: `React.lazy` caches a rejected import for good. Recreating it on each navigation
  (`Main` re-renders only when the location changes) is what lets a route whose chunk failed to
  load retry when visited again, which `LazyBoundary`'s pathname key exists to support. Hoisting
  would buy stable component types that the pathname key throws away anyway.
  Date/Author: 2026-10-26, Stephanie Hobson.
- Decision: write `withNextButton` and `withTracker` as function components that call
  `useLocation()`, with `withTracker` sending its page view from a `useEffect` on the pathname,
  rather than class components behind a hook wrapper.
  Rationale: neither needs state of its own, and the effect states "track when the path changes"
  directly. It also moves the page view out of `getDerivedStateFromProps`, which runs during
  render and can run more than once under React 18.
  Date/Author: 2026-10-26, Stephanie Hobson.

- Decision: stay on React 18.3.1. Keep react-helmet-async and GA4, which are what React 19 needed
  out of the way, and leave the React 19 bump to a follow-up.
  Rationale: React 19 passed every suite, but it delayed the charts by about 600 ms on fast
  connections (see Surprises). That is a visible regression. The fix means restructuring lazy
  loading, which is a design change in its own right. The user chose this over accepting the delay
  or attempting the restructure here. Dependabot keeps ignoring React majors, with a comment giving
  the reason.
  Date/Author: 2026-10-26, Stephanie Hobson.
- Decision: on React 18, use react-helmet-async rather than keeping react-helmet.
  Rationale: react-helmet's react-side-effect caps React at 18, so it would block the React 19
  follow-up. react-helmet-async works on 16 through 19 with the same `<Helmet>` API. On React 19 it
  becomes a thin pass-through to React's own tag hoisting (see Surprises). At that point the
  follow-up can drop it, after checking the static `<title>` in `index.html`. This replaces the
  rationale in the earlier react-helmet-async entry, which assumed it would deduplicate tags on
  React 19.
  Date/Author: 2026-10-26, Stephanie Hobson.
- Decision: configure GA4 with `send_page_view: false` and send every page view from
  `withTracker`.
  Rationale: gtag sends a page view by itself when it is configured. `withTracker` also sends one
  on mount, so without this the first page would count twice. In a browser, the data layer shows
  one `page_view` per route.
  Date/Author: 2026-10-26, Stephanie Hobson.

## Outcomes & Retrospective

(2026-10-26, after Milestone 6.)

**Achieved.**
- The site runs on React 18.3.1 and react-router 7.18.4. React Testing Library is 16 and the JSX
  runtime is automatic.
- No dependency caps React below 19: react-refetch, react-metrics-graphics, react-helmet, and
  react-ga are gone.
- Fetching and chart drawing run through two small local modules, `src/lib/withFetch.jsx` and
  `src/components/views/MetricsGraphics.jsx`.
- Page views go to GA4 through react-ga4, one per route, once a real measurement ID replaces the
  placeholder in `.env`.
- Every suite passes: Vitest 15 files and 84 tests, recorded Playwright 70, and live Playwright
  46, apart from the existing live hardware flake.

**Not achieved.** React 19, the plan's original goal. It works, but it draws charts about 600 ms
later, because its Suspense throttle stacks on this app's two levels of lazy loading. The user
chose to stay on React 18. The next piece of work is to restructure that lazy loading. One option
is to load the chart chunk with the dashboard rather than per metric, and to start route chunks
before the first render. Then measure with the method in Surprises, move to React 19, and consider
react-router 8.

**Lessons.**
- The suites caught every functional break, but nothing in them watches speed. The React 19
  regression only showed up because one spec got slower. For the React 19 follow-up, add a
  timing check: first chart within a budget, on recorded data, against the production build.
- Read a package's notes for the target React version before picking it. react-helmet-async's
  behaviour on React 19 undid the reason the plan gave for choosing it.
- Removing the React-16-only packages while still on React 16 worked as intended. Each React
  bump then failed only for React's own reasons: act warnings on 18, and the throttle on 19.

## Context and Orientation

This builds on `docs/execplans/2026-10-21-improve-tests.md`, which added the tests this plan relies
on to catch regressions. Read its Context section for the test layout. This section restates what
this plan needs.

**The app.** `ensemble` is the client-side React app behind <https://data.firefox.com/>. It holds
no data. Every number comes from JSON that a separate service, ensemble-transposer, serves from
`https://data.firefox.com/datasets/desktop/...`. `src/config.json` lists the dashboards, and each
one has a `key` (the URL slug) and a `source` (the base URL of its JSON).

**Entry and routing.** `src/index.jsx` mounts `src/components/views/Application.jsx` inside
react-router 5's `BrowserRouter`, using `ReactDOM.render`. That is the only removed React API
anywhere in `src/`. Application renders Header, Main, and Footer. `src/components/views/Main.jsx`
holds the route table, exported through react-router 5's `withRouter`:

- `/` renders Home, wrapped in `withTracker(withNextButton(...))`.
- `/contact` renders Contact, wrapped in `withTracker(...)`.
- One `/dashboard/<key>` route per dashboard, built from `config.json` with `render={...}`. Each
  creates a `DashboardContainer` with `source={dashboard.source}`.
- A catch-all renders NotFound.

Every route uses `exact`. Main wraps the routes in `LazyBoundary` (`src/lib/LazyBoundary.jsx`, an
error boundary around `React.Suspense`) keyed on `location.pathname`. Main also calls `lazyLoad`,
`withTracker`, and `withNextButton` inside its render. That creates new component types on every
render, which remounts the page each time.

**Decorators.** `src/components/decorators/` holds two higher-order components (functions that
take a component and return a wrapped one).

- `withTracker.jsx` calls `reactGA.initialize(import.meta.env.VITE_GA_TRACKING_ID)` at import. It
  sends a page view on mount, and again from `getDerivedStateFromProps` when `props.location.pathname`
  changes.
- `withNextButton.jsx` reads `this.props.location.pathname`, finds the matching `nextButtons` entry
  in `config.json`, and renders a "Proceed to ..." link below the page.

Both get `location` only because react-router 5's `Route` injects it as a prop. react-router 6
does not.

**The container/view split.** `src/components/containers/` holds the stateful components, which
fetch and reshape data. `src/components/views/` holds presentational components that receive
formatted props.

**react-refetch's `connect()`.** react-refetch 3.0.1 is the whole data layer, used only in
`containers/DashboardContainer.jsx`, `containers/MetricOverviewContainer.jsx`, and
`containers/SummaryMetricContainer.jsx`. Each does
`export default connect(props => ({ dataFetch: { url: ... } }))(Component)`. The wrapped component
receives `props.dataFetch`, a "PromiseState" object with `pending`, `rejected`, `fulfilled`,
`value` (the parsed JSON), and `reason` (an `Error`). The containers rely on these behaviors, read
from `node_modules/react-refetch/lib/components/connect.js` and `lib/utils/buildRequest.js`:

1. It calls `fetch(new Request(url, { method: 'GET', credentials: 'same-origin', mode: 'cors' }))`.
   The tests read `.url` off the `Request` they receive.
2. A non-2xx response rejects. The reason's message comes from the parsed JSON body (the `error`
   or `message` field, falling back to the status text). A 204 or empty body fulfills with
   `undefined`.
3. It refetches in `componentDidUpdate` only when the URL string changes.
4. On a refetch it first resets `dataFetch` to pending. `MetricOverviewContainer`'s
   `shouldComponentUpdate` returns false while pending. That is how the previous region's chart
   stays on screen while the new region loads. `MetricOverviewContainer.test.jsx` checks this.
5. It ignores a response that arrives after a newer request has started.
6. It reads `window.fetch` once, when `connect()` runs, which is at module import. The five tests
   that stub `fetch` therefore install the stub inside `vi.hoisted(...)`, with a comment saying why.

Region choice is saved in `sessionStorage` under `preferredRegion` by
`DashboardContainer._onRegionChange`. Changing it changes `activeRegion`, which changes the metric
containers' URLs, which triggers behavior 3.

`MetricOverviewContainer.jsx` carries a comment citing issue #313: the host answers a missing
metric with a 200 HTML page rather than a 404, so its rejected branch never runs in production.
Behavior 2 makes that 200 a JSON parse failure, which also rejects. Keep that comment accurate.

**react-metrics-graphics.** `views/Chart.jsx` renders `<MetricsGraphics {...options} />` from
react-metrics-graphics 1.1.2. That package is a 30-line class, minified in
`node_modules/react-metrics-graphics/build/MetricsGraphics.js`. It:

- renders `<div className="metricsGraphicsCon">` with a callback ref;
- filters its props to metrics-graphics' known option names;
- calls `MG.data_graphic({ target: div, ...options })` in `componentDidMount`, and again in
  `componentDidUpdate` after copying the new props in `componentWillReceiveProps`;
- imports `metrics-graphics/dist/metricsgraphics.css`.

metrics-graphics itself (2.15.6) stays: 3.0.0-beta1 is an incompatible rewrite, recorded in
`.claude/skills/update-deps/denied.md`. `src/tests/jest/Chart.test.jsx` mocks the
`react-metrics-graphics` module and asserts on the options Chart passes it.

**Head tags.** `views/Application.jsx`, `Home.jsx`, `Contact.jsx`, `Dashboard.jsx`, and
`NotFound.jsx` each render a react-helmet `<Helmet>` with `<title>`, `og:*` and `description`
meta, or (NotFound) `<meta name="robots" content="noindex">`. `index.html` has a static
`<title>Firefox Public Data Report</title>`. The Playwright specs `noindex.spec.js`,
`home.spec.js`, `contact.spec.js`, and the three `dashboards/*.spec.js` check these tags.
react-helmet depends on react-side-effect, which caps React at 18.

**The console.error trap.** `src/setupTests.js` fails any Vitest test that calls `console.error`
unexpectedly. React reports deprecations through `console.error`, so a React upgrade warning
becomes a test failure. That is deliberate. Fix the cause; do not loosen the trap.

**The classic JSX runtime.** React 16 has no `react/jsx-runtime`. So `vite.config.mjs` sets
`jsxRuntime: 'classic'` on the React plugin and repeats it under
`optimizeDeps.rolldownOptions.transform.jsx`. `src/setupTests.js` sets `global.React`, and every
file with JSX does `import React from 'react'`. All of this can go once React is 17 or later.

**Test libraries.** `@testing-library/react` is pinned to 12.1.5, the last version that supports
React 16, and `@testing-library/dom` to 8.20.1. `@testing-library/jest-dom` is 6.9.1.
`.github/dependabot.yml` ignores majors of all three, and of react, react-dom,
react-router-dom, and metrics-graphics, with a comment on each.

**The d3-transition trap.** `npm update` once hoisted the `d3-transition` nested under `d3@4` to
the top level. There it patched a different `d3-selection` copy, and charts stopped redrawing on
region change (commit `0bcc86c`). After any change to `package-lock.json`, run
`npm ls d3-transition` and confirm it is still nested under `d3`, and run the Playwright
`region-data` spec.

**Commands.** These run in this repository today, from its root:

    npm install
    npm run build:css                  # compiled CSS is gitignored; Vitest fails without it
    npm run lint                       # ESLint plus stylint; must be clean
    npm run test:jest                  # Vitest
    npm run build                      # Vite production build plus build/version.json
    npm run test:playwright:recorded   # Playwright on tests/playwright/fixtures/ (CI-required)
    npm run test:playwright:live       # Playwright on live data (not required; may fail on upstream data)

Every dependency in `package.json` is pinned exactly, with no `^` or `~`. Keep it that way. Use
`npm install --save-exact pkg@version`.

## Plan of Work

Each milestone leaves lint, Vitest, the build, and recorded Playwright green, and is its own commit.
Each one updates the docs and comments it makes stale (AGENTS.md, CONTRIBUTING.md,
`docs/architecture/frontend.md`, `.github/dependabot.yml`, `public/contribute.json`, and code
comments), plus this plan's living sections, in the same commit.

### Milestone 1: replace react-refetch with a local `withFetch`

At the end, react-refetch is gone. The three containers fetch through
`src/lib/withFetch.jsx`, and their existing tests pass with only stub-setup changes.

1. Create `src/lib/withFetch.jsx`. It default-exports
   `mapPropsToUrl => WrappedComponent => class`. The class:
   - fetches in `componentDidMount`, and in `componentDidUpdate` when `mapPropsToUrl(props)` differs
     from the last URL;
   - sets `dataFetch` to `{ pending: true }` before each request;
   - calls `window.fetch(new Request(url, { credentials: 'same-origin', mode: 'cors' }))`, reading
     `window.fetch` at call time;
   - rejects on a non-2xx response with an `Error` whose message comes from the JSON body's `error`
     or `message`, falling back to `response.statusText`;
   - parses JSON otherwise, treating a 204 or empty body as `undefined`;
   - ignores results from any request older than the latest by comparing a request counter, and
     ignores everything after unmount;
   - renders `<WrappedComponent {...this.props} dataFetch={this.state.dataFetch} />`, where
     `dataFetch` is `{ pending, rejected, fulfilled, value, reason }`.
2. In each container, replace `import { connect } from 'react-refetch'` with
   `import withFetch from '../../lib/withFetch'`. Replace the export with
   `export default withFetch(props => <same url>)(Container)`.
3. In the five test files that stub `fetch` (`Routes`, `DashboardContainer`,
   `MetricOverviewContainer`, `SummaryMetricContainer`, `SummaryMetric`), move the stub from
   `vi.hoisted` to `vi.spyOn(window, 'fetch')` in `beforeEach`, and delete the import-time comments.
4. Add `src/tests/jest/withFetch.test.jsx`. It covers:
   - one request per URL, with a refetch only on a URL change;
   - pending before fulfilled;
   - a 500 with a JSON body rejecting with that body's message;
   - a slow first response that arrives after a fast second one being ignored.
5. Run `npm uninstall react-refetch`.
6. Update the docs: AGENTS.md's data-flow paragraph and its "Stubbing the network" bullet,
   CONTRIBUTING.md, `docs/architecture/frontend.md`, the React comment in `.github/dependabot.yml`,
   and `public/contribute.json`'s keyword list.

### Milestone 2: replace react-metrics-graphics with a local component

At the end, `views/Chart.jsx` draws through `src/components/views/MetricsGraphics.jsx`, and
react-metrics-graphics is gone.

1. Create `src/components/views/MetricsGraphics.jsx`, a class component with
   `this.chartElement = React.createRef()`. It renders
   `<div className="metricsGraphicsCon" ref={this.chartElement} />`. In `componentDidMount` and
   `componentDidUpdate` it calls `MG.data_graphic({ ...this.props, target: this.chartElement.current })`,
   with `MG` from `metrics-graphics`. It imports `metrics-graphics/dist/metricsgraphics.css`, which
   `Chart.jsx` already imports too; keep one import.

   Do not copy the option-name filter. Chart passes only metrics-graphics options. Confirm this by
   reading `views/Chart.jsx`, and if it passes anything else, strip it there and say so in Surprises.
2. Point `Chart.jsx` at it. In `Chart.test.jsx`, mock `'../../components/views/MetricsGraphics'`
   instead of `react-metrics-graphics`.
3. Run `npm uninstall react-metrics-graphics`. Update `denied.md`'s metrics-graphics reason ("an
   incompatible rewrite of the 2.x API that `views/MetricsGraphics.jsx` calls"), the Dependabot
   comment, AGENTS.md, CONTRIBUTING.md, and `docs/architecture/frontend.md`.
4. The `fixtures/chart-series`, `region-data`, `dates`, and `boundaries` specs are the proof that
   charts still draw and redraw.

### Milestone 3: react-router-dom 5 to 6

At the end, the app runs on react-router-dom 6.30.x, still on React 16, with no `location` prop
threading.

1. Run `npm install --save-exact react-router-dom@6.30.x`, using the newest 6.30 patch at least 7
   days old.
2. `Main.jsx`:
   - Move the `lazyLoad(...)` calls, and the `withTracker`/`withNextButton` wrapping of Home,
     Contact, NotFound, and one dashboard component per `config.json` entry, to module scope, so the
     component types stay stable.
   - Render `<Routes>` with `<Route path="/" element={<TrackedHome />} />` and so on. v6 matches
     exactly by default, so drop `exact`. The catch-all becomes `path="*"`.
   - Replace `withRouter` with `const location = useLocation()` for the `LazyBoundary` key.
     `Main` is a function component, so the hook is allowed.
3. `withTracker.jsx`: track in `componentDidMount`, and in `componentDidUpdate` when the pathname
   changes, instead of in `getDerivedStateFromProps`, which runs during render. Export a function
   component that calls `useLocation()` and renders the class with `location`.
4. `withNextButton.jsx`: same wrapper pattern, or make it a function component that calls
   `useLocation()`. Choose whichever reads more simply and record why.
5. `withNextButton.test.jsx`: render
   `<MemoryRouter initialEntries={[path]}><Routes><Route path="*" element={<PageWithNextButton />} /></Routes></MemoryRouter>`.
   `Routes.test.jsx` should pass unchanged. If it doesn't, record why in Surprises.
6. Remove the Dependabot ignore for react-router-dom majors and add one for majors above 6, with the
   comment "v7 requires React 18". Update AGENTS.md's routing notes.

### Milestone 4: React 18 and the automatic JSX runtime

At the end, the app and tests run on React 18.3.1 with the automatic JSX runtime.

1. Run
   `npm install --save-exact react@18.3.1 react-dom@18.3.1 @testing-library/react@16.x @testing-library/dom@10.x @testing-library/jest-dom@7.x`.
   Use the newest patches at least 7 days old. jest-dom 7 needs `@testing-library/dom` 10, and RTL
   16 supports React 18 and 19.
2. `src/index.jsx`: `createRoot(document.getElementById('root')).render(...)`, with `createRoot`
   from `react-dom/client`.
3. `vite.config.mjs`: delete `jsxRuntime: 'classic'`, the whole `optimizeDeps` block, and their
   comments. `src/setupTests.js`: delete `global.React` and its comment.
4. Delete `import React from 'react'` wherever only JSX used it. Keep it, or switch to named
   imports, where `React.Component`, `React.Fragment`, `React.lazy`, `React.createRef`, or
   `React.cloneElement` appear.
5. `eslint.config.js`: add `react.configs.flat['jsx-runtime']` after `recommended`. Remove the
   `React` global from the test-file override.
6. Run Vitest and fix whatever the console.error trap surfaces. Expect act warnings around user
   events and Suspense. Fix them with `await`/`findBy`, not by silencing them.
7. Update the Dependabot ignores: drop the RTL, `@testing-library/dom`, and jest-dom entries, and
   keep React majors ignored, with the comment "React 19 needs react-ga and react-helmet replaced".
   Update AGENTS.md and CONTRIBUTING.md wherever they say React 16, RTL 12, the classic runtime, or
   "test files don't import React". Also update the "pure client-side React 16 SPA" line.

### Milestone 5: react-router 7

At the end, the app imports from `react-router` 7.x.

1. On v6 first, opt into the v7 future flags on `BrowserRouter` and `MemoryRouter`
   (`v7_startTransition`, `v7_relativeSplatPath`), and confirm no warnings remain.
2. `npm uninstall react-router-dom && npm install --save-exact react-router@7.x`. Change every
   import from `react-router-dom` to `react-router` (`src/index.jsx`, `Main.jsx`, `Header.jsx`,
   `NextButton.jsx`, `Home.jsx`, the decorators, and two tests). Remove the future flags, which are
   the default in v7.
3. Change the Dependabot ignore to react-router majors, with the comment "v8 requires React 19.2.7".

### Milestone 6: react-helmet-async and GA4 (React 19 deferred)

At the end, no installed dependency caps React below 19, and the app still runs on React 18. Step
3 was carried out and then reverted. See the Decision Log.

1. Replace react-helmet with react-helmet-async 3.x. Swap the five imports, wrap the app in
   `<HelmetProvider>` in `src/index.jsx`, and do the same in any test that renders a Helmet
   (`Routes.test.jsx` and others; grep for it). Proof is that the `noindex`, `home`, `contact`, and
   `dashboards/*` title and meta specs pass.
2. Replace react-ga with react-ga4:
   - In `withTracker.jsx`, use `ReactGA.initialize(import.meta.env.VITE_GA_MEASUREMENT_ID)` and
     `ReactGA.send({ hitType: 'pageview', page })`. Drop `set`.
   - In `.env`, rename the variable to `VITE_GA_MEASUREMENT_ID='G-XXXXXXXXXX'`.
   - Update the mock and the page-view assertion in `Routes.test.jsx`.
   - Check that recorded-mode Playwright still answers the GA4 hosts (`googletagmanager.com`,
     `google-analytics.com`) with its empty 200.
3. Run `npm install --save-exact react@19.x react-dom@19.x`, using the newest patch at least 7 days
   old. Fix whatever Vitest surfaces.
4. Keep the Dependabot React-major ignore, with a comment explaining the chart delay. Update
   AGENTS.md, CONTRIBUTING.md, and `docs/architecture/frontend.md` for react-helmet-async,
   react-ga4, and the env var, and add the React 19 constraint to the architecture doc.
5. Run every command in Concrete Steps, including live Playwright. Write Outcomes &
   Retrospective.

## Concrete Steps

Run from the repository root after each milestone:

    npm install
    npm ls d3-transition             # expect it nested under d3@4.x, not at the top level
    npm ls react                     # expect no "invalid" or "overridden"
    npm run build:css
    npm run lint                     # expect no errors
    npm run test:jest                # expect all pass; record files/tests in Progress
    npm run build                    # expect "built in" and build/version.json
    npm run test:playwright:recorded # expect all pass with retries
    npm run test:playwright:live     # record the result; re-run once before blaming the commit

If port 3000 is taken, start `npx vite --port 3001 --strictPort` and set
`PLAYWRIGHT_BASE_URL=http://localhost:3001`.

## Validation and Acceptance

After each milestone, start `npm start` and check:

1. <http://localhost:3000/dashboard/hardware>: the charts draw. Changing the region keeps the old
   chart visible until the new data arrives, then redraws it.
2. <http://localhost:3000/dashboard/usage-behavior>: the summary bars draw, and changing the date
   changes them.
3. <http://localhost:3000/nope>: shows Not Found, and the page's `<head>` has
   `<meta name="robots" content="noindex">`.
4. Moving between Home, Contact, and a dashboard changes the tab title each time, and the
   "Proceed to ..." button points at the next page.
5. After Milestone 6, the network panel shows a request to `googletagmanager.com` for the placeholder
   ID on each navigation.

Milestone 1's new `withFetch.test.jsx` stale-response test must fail if the request-counter check
is removed. Try it once and record the result.

## Idempotence and Recovery

Every step is a source edit or an exact-pinned `npm install`. To back out a milestone, run
`git revert` on its commit, then `npm install`. After switching branches, always run
`npm install` before trusting a result, because `node_modules` may hold another branch's
packages. If `npm ls d3-transition` shows it hoisted, restore `package-lock.json` from the previous
commit and redo the install with only the intended package names, rather than running `npm update`.

## Artifacts and Notes

None yet.

## Interfaces and Dependencies

At the end of the plan:

- `src/lib/withFetch.jsx` default-exports `mapPropsToUrl => WrappedComponent => Component`.
  `mapPropsToUrl(props)` returns a URL string. The wrapped component receives
  `dataFetch: { pending: boolean, rejected: boolean, fulfilled: boolean, value?: any, reason?: Error }`.
- `src/components/views/MetricsGraphics.jsx` default-exports a class component that takes
  metrics-graphics options as props and draws into its own `<div className="metricsGraphicsCon">`.
- The dependencies that change:
  - removed: `react-refetch`, `react-metrics-graphics`, `react-router-dom`, `react-helmet`,
    `react-ga`;
  - added: `react-router` 7.x, `react-helmet-async` 3.x, `react-ga4` 3.x;
  - upgraded: `react` and `react-dom` to 18.3.1, `@testing-library/react` to 16.x,
    `@testing-library/dom` to 10.x, `@testing-library/jest-dom` to 7.x.

---

Revision note (2026-10-26): Milestone 6 moved to React 19, measured a chart delay of about 600 ms,
and reverted to React 18 at the user's choice. The title, Purpose, Milestone 6, Interfaces, and the
living sections now describe a plan that ends on React 18, with React 19 cleared of dependency
blockers but deferred.

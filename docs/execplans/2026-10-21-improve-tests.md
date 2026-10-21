# Broaden the CI test suite so a stack upgrade can't break the site unnoticed

This ExecPlan is a living document. The sections `Progress`, `Surprises & Discoveries`,
`Decision Log`, and `Outcomes & Retrospective` must be kept up to date as work proceeds. It is
maintained in accordance with `.claude/skills/execplans/references/PLANS.md`, including its
"Ensemble addendum", which overrides the upstream text where the two disagree.

## Purpose / Big Picture

The next few weeks will bring large changes to the stack: React 16 to 18 or 19, react-router 5 to
6 or later, and a replacement for react-refetch. Today almost nothing would catch a regression from
those changes before it merged. The unit suite is 4 tests. The end-to-end suite runs only against
live production data, so it can't assert on specific values and can go red for reasons no commit
caused.

After this work, every pull request runs a test suite that checks what the site does, not how it
is built:

- Unit tests render real components and assert on the DOM.
- Container tests stub the network and assert on the URLs requested and what renders.
- Routing tests cover every route in `src/config.json`.
- A set of Playwright specs runs on recorded data, so it can assert exact values and exercise
  error paths.
- CI builds the production bundle.

The tests touch only the DOM, `fetch`, and URLs, and those are the surfaces a migration should
preserve. So the same tests should pass before and after each upgrade. A failure then means
behavior changed.

To see it working: run `npm run test:jest` and `npm run test:playwright` locally, or open a pull
request and watch the two "CI" checks.

Out of scope:

- A smoke test against `vite preview`. The preview server doesn't work yet.
- Coverage thresholds.
- Browsers other than Chromium.
- Changing the existing live-data Playwright specs.
- Issue #313. For a metric path that doesn't exist, data.firefox.com answers HTTP 200 with the
  app's HTML instead of a 404, so the fetch never reports a failure. That needs a hosting change,
  not a client fix. This plan fixes only the case where the server does report a failure.

## Progress

- [x] (2026-10-21) Drafted the plan. Baseline: `npm run test:jest` passes 2 files, 4 tests.
- [x] (2026-10-21) Revised after review: Milestone 3 now fixes `MetricOverviewContainer` so a
      failed metric fetch shows its error.
- [x] (2026-10-21) Milestone 1: unit harness moved from Enzyme to React Testing Library. Vitest
      passes 2 files, 4 tests. Lint is clean, Zizmor reports no findings, and `npm ls enzyme
      react-test-renderer` prints `(empty)`. Breaking the sanitizer fails both MetricOverview
      tests.
- [x] (2026-10-21) Milestone 2: unit tests for pure logic and data shaping. Vitest passes 8
      files, 29 tests. Five deliberate breakages each failed exactly one test: `bumpSort`'s bump,
      ChartContainer's sort direction, SummaryMetricContainer's "Other" threshold,
      DataTableContainer's sort direction, and CustomizableDate's UTC flag.
- [x] (2026-10-21) Milestone 3: routing and fetch behavior tests in jsdom, plus the
      `MetricOverviewContainer` fix. Vitest passes 12 files, 54 tests. Before the fix, the two
      rejected-fetch cases in `MetricOverviewContainer.test.jsx` failed and the other three passed.
      Deliberate breakages that each failed tests: removing the catch-all route (4 failed), dropping
      `exact` from the dashboard routes (1), not saving `preferredRegion` (1), reverting the fix
      (2), and never setting LazyBoundary's error state (3).
- [x] (2026-10-21) Milestone 4: Playwright specs on recorded fixtures. Thirteen specs across six
      files pass, 65/65 over `--repeat-each=5` and 13/13 on three cold servers, all with retries
      off. With data.firefox.com mapped to a dead address the fixture specs still pass and the live
      hardware spec fails, which shows the fixture specs don't use the network. The full suite
      passes 60 of 61. The one failure is the live hardware "Charts render", caused by upstream
      data (see Surprises). It failed on the first attempt and the retry, and fails the same way
      without this branch's changes.
- [x] (2026-10-21) Milestone 5: "Build" step in `lint-and-test`, Zizmor clean. On pull request
      #460, "Lint and test" passed with `vite build` in its log.
- [ ] Both CI checks green on #460 (remaining). "End-to-end tests" ran 59 passed, 1 flaky, 1
      failed. The failure is the live hardware "Charts render", caused by the upstream `"NULL"`
      CPU-speed data (see Surprises). The flaky test was the live usage-behavior "Metric titles and
      order", which saw 1 of 3 metrics on its first attempt. Every fixture spec passed. Getting the
      check green needs either the upstream data fixed, or a decision on how the live spec or
      ChartContainer should handle single-point populations. That's a scope call for the user.

## Surprises & Discoveries

- Observation: a failed metric fetch never shows `#metric-overview-fetch-error`. The metric stays
  blank on first load, and after a region change it keeps showing the previous region's data.
  `MetricOverviewContainer.shouldComponentUpdate` returns `nextProps.dataFetch.fulfilled`, so React
  skips the render for the rejected state. The rejected branch in `render()` is unreachable.
  Evidence: an Enzyme `mount` probe with `fetch` stubbed to answer HTTP 500 printed
  `PROBE rejected=true errorShown=false html=""`.
- Observation: the newest `@testing-library/jest-dom` and `@testing-library/dom` releases don't
  work with RTL 12, and npm quietly installs a second copy of `@testing-library/dom`.
  - `@testing-library/jest-dom` 6.10 and 7.x declare a peer dependency on
    `@testing-library/dom >=10 <11`. RTL 12 depends on `^8`. 6.9.1 has no peer dependency.
  - `@testing-library/user-event` declares `@testing-library/dom` as a peer, and npm auto-installed
    10.x at the top level while RTL kept 8.x nested.
  Evidence: `npm ls @testing-library/dom` showed `8.20.1` under RTL and `10.4.2` under user-event.
  Pinning `@testing-library/dom@8.20.1` as a direct dev dependency makes both share it (`deduped`).
- Observation: `markdownIt('zero', { html: true })` alone doesn't let raw HTML through. The `zero`
  preset also disables the `html_inline` rule. A mutation check of the sanitizer has to add
  `'html_inline'` to the `.enable([...])` list as well. With only the option set, all 4 tests still
  passed. With both, the 2 MetricOverview tests failed.
- Observation: react-refetch captures `window.fetch` when `connect()` runs, at module import. A
  stub assigned inside a test is never called, and the container makes a real network request.
  Evidence: a probe that set `window.fetch` inside the test recorded `lateStubCalls=0` and failed
  with `Unexpected console.error: fetch failed`. Test files install the stub in `vi.hoisted(...)`,
  which runs before imports.
- Observation: the `no-shadow` rule with `builtinGlobals` rejects `import { screen } from
  '@testing-library/react'`, because `screen` is a browser global. The test-file ESLint block
  allows that one name.
- Observation: the CustomizableDate UTC mutation only fails where the local time zone is behind
  UTC. In CI (UTC) dropping the UTC flag changes nothing. The test still documents the intended
  output, and it failed locally in America/Vancouver.
- Observation: Vite's dependency scan has been failing on every dev-server start. The React plugin
  sets the classic JSX runtime for transforms but not for the scan. The scan then assumes the
  automatic runtime, can't resolve `react/jsx-dev-runtime` (React 16 has none), and skips
  pre-bundling. Dependencies are then discovered one page at a time, answering `504 (Outdated
  Optimize Dep)` and reloading. That was the "first visit can 504" footgun in `AGENTS.md`, and the
  fixture specs' console-error check made it fail them on a cold server.
  Evidence: `(!) Failed to run dependency scan. Skipping dependency pre-bundling. ...
  react/jsx-dev-runtime (imported by .../views/Chart.jsx)`. Setting
  `optimizeDeps.rolldownOptions.transform.jsx.runtime: 'classic'` in `vite.config.mjs` removed the
  error. Three cold starts (`vite --force`) then ran the fixture specs 13/13 with retries off and no
  504s in the log.
- Observation: as of the week of 2026-10-12, the live hardware data has a `"NULL"` CPU-speed
  population with a single point at about 48%. ChartContainer sorts populations by maximum y, so
  that single point becomes `path.mg-line1`, which has no visible length. The live
  `dashboards/hardware.spec.js` "Charts render" test then fails on
  `#processor-metric-overview-3 path.mg-line1`. Those specs are designed to break when upstream data
  changes. The same test also fails with the branch's Vite change reverted. A 48% "NULL" bucket
  looks like an ETL problem worth raising with the data owners. The recording includes it.
  Evidence: `[["NULL",48.13],["2.3 GHz to 2.69 GHz",24.51],...]` from the live
  `hardware/default/cpuSpeed/index.json`.
- Observation: `test.use({ option: [a, b] })` reads the array as a `[value, options]` pair, so an
  array-valued option arrived as just its first element (`allowedErrors.some is not a function`).
  `allowedErrors` is a single RegExp instead.
- Observation: no recorded metric description contains a Markdown link. `descriptions.spec.js`
  substitutes a description with one, plus raw HTML, in a single response.
- Observation: port 3000 on this machine was serving an unrelated site (Mozilla Protocol). Locally
  `reuseExistingServer` reused it and every spec failed. Local runs used
  `npx vite --port 3001 --strictPort` and `PLAYWRIGHT_BASE_URL=http://localhost:3001`.
- Observation: the footer also renders a `<nav>`, so `getByRole('navigation')` finds two elements.
  The header test selects `#main-navigation`, the same landmark the Playwright specs use.
- Observation: adding `src/setupTests.js` to the ESLint block for test files breaks lint. That
  block declares `React` as a global, so the file's own `import React` trips `no-shadow` with
  `builtinGlobals`. The file gets its own block with only the Vitest globals.

## Decision Log

- Decision: Use React Testing Library (RTL) for unit tests, port the two existing Enzyme files, and
  remove Enzyme entirely.
  Rationale: Enzyme has no adapter for React 17 or later, so the current harness would itself block
  the React upgrade. RTL 12.x supports React 16, and the same test code works on RTL 13+ with React
  18. RTL renders the real DOM rather than a shallow tree, so tests stay valid when a component's
  internals change.
  Date/Author: 2026-10-21, Stephanie Hobson.

- Decision: Add new Playwright specs on recorded JSON fixtures, and leave the existing live-data
  specs unchanged.
  Rationale: Recorded data makes the new specs deterministic and lets them assert exact values and
  simulate failed requests. The live specs still catch upstream changes to the data's shape.
  Date/Author: 2026-10-21, Stephanie Hobson.

- Decision: CI builds the production bundle but doesn't run browser tests against it.
  Rationale: The `vite preview` server doesn't work yet. A build-only step still catches bundling
  failures.
  Date/Author: 2026-10-21, Stephanie Hobson.

- Decision: The branch stays `improve-tests`, with no issue number, and the plan's slug matches it.
  Rationale: There is no tracking issue for this work.
  Date/Author: 2026-10-21, Stephanie Hobson.

- Decision: Unit tests fail on any unexpected `console.error`.
  Rationale: React reports deprecations and misuse through `console.error`. Failing on them turns
  the warnings from a React upgrade into a visible failure instead of noise. A test that expects an
  error (for example a container's rejected-fetch path, which logs the reason) spies on
  `console.error` itself.
  Date/Author: 2026-10-21, Claude, under the approved plan.

- Decision: Fix `MetricOverviewContainer` so a rejected fetch renders, instead of dropping the
  error-path assertions.
  Rationale: An adversarial review found that the planned rejected-fetch assertions in Milestones 3
  and 4 could not pass against the current code (see Surprises). The bug is user-visible: a failed
  metric is blank, or shows the wrong region's data. The fix is one condition and keeps the reason
  the component skips renders, which is to avoid a spinner and scroll jump while new data loads.
  Date/Author: 2026-10-21, Stephanie Hobson.

- Decision: Pin `@testing-library/dom` 8.20.1 and `@testing-library/jest-dom` 6.9.1, and have
  Dependabot ignore major updates to `@testing-library/react` and `@testing-library/dom`. Drop the
  Dependabot entry for `react-test-renderer`, which has been removed.
  Rationale: RTL 13+ requires React 18, and newer versions of the other two require
  `@testing-library/dom` 10 (see Surprises). Those majors belong to the React upgrade. The
  Dependabot comment that tied the React ignores to Enzyme now names the actual reasons.
  Date/Author: 2026-10-21, Claude, under the approved plan.

- Decision: Fix the Vite dependency scan in `vite.config.mjs`, outside the plan's original scope.
  Rationale: CI starts a cold dev server on every run. Without the fix, the first visits fail with
  504s, and only the retries hid that. A one-setting change removes the cause, so the fixture specs
  can keep failing on any console error rather than allow-listing Vite's errors. `npm run build`
  is unaffected.
  Date/Author: 2026-10-21, Claude, under the approved plan.

- Decision: Implement the fixture behavior as a Playwright `test.extend` in
  `tests/playwright/fixtureData.js`, rather than the `useFixtureData`/`failOnPageErrors` helpers in
  `utils.js` that the plan named.
  Rationale: An extended `test` applies the routing and the error check to every fixture spec
  automatically, and runs the check after the test body, so a spec can't forget either part.
  Date/Author: 2026-10-21, Claude, under the approved plan.

- Decision: The recorder keeps only the 12 most recent dates, and drops populations left with no
  points.
  Rationale: Unbounded, the hardware files are 200–330 KB each. Trimmed, all 30 files total
  292 KB. The specs only look at recent data.
  Date/Author: 2026-10-21, Claude, under the approved plan.

## Outcomes & Retrospective

(2026-10-21) Every milestone landed. The one thing left is a green end-to-end check, which is
blocked by upstream data rather than by this branch.

The CI suite now covers:

- Vitest grew from 2 files / 4 tests to 12 files / 54 tests, all on React Testing Library. They
  cover `lib/utils.js`, data shaping in ChartContainer, DataTableContainer and
  SummaryMetricContainer, `withNextButton`, CustomizableDate, the fetch states of DashboardContainer
  and MetricOverviewContainer (including region persistence), every route in `config.json`, the
  Google Analytics page view, and LazyBoundary.
- Thirteen Playwright specs run on 292 KB of recorded data. They don't use the network, and they
  fail on any page or console error.
- CI builds the production bundle.

Each group of tests was checked by breaking the code it covers and watching a test fail. The tests
reach the app only through the DOM, `fetch`, URLs and `sessionStorage`. Most should survive the
React, router and react-refetch upgrades unchanged. The exceptions are known:

- `Routes.test.jsx`'s `renderAt` and the `MemoryRouter` in `withNextButton.test.jsx` change with
  the router.
- The hoisted `window.fetch` stub works for anything that calls `fetch`, but it is only *needed*
  because of react-refetch.
- The `vi.mock` of `views/Chart` and `views/SummaryMetric` assumes the container/view split
  survives.

The work also fixed two real bugs:

- A failed metric fetch now shows its error. Before, the metric stayed blank or showed stale data.
- The dev server's dependency pre-bundling works. It had failed on every start, causing the
  first-visit 504s.

It also found an upstream data problem: a 48% `"NULL"` CPU-speed bucket that breaks the live
hardware chart spec.

Lessons:

- A strict "no console errors" check finds things the old specs never would. The Vite scan failure
  and the 504s were invisible to assertions that only looked for elements.
- Recorded data and live data catch different failures. Keep both.
- On this machine, port 3000 was taken by another site, and Playwright's `reuseExistingServer`
  silently tested that site instead.

## Context and Orientation

`ensemble` is the React single-page app behind <https://data.firefox.com/>, the Firefox Public Data
Report. It holds no data. Every number is fetched in the browser from JSON files under
`https://data.firefox.com/datasets/desktop/<dashboard>/`, which a separate service
(ensemble-transposer) publishes.

**`src/config.json`** has two arrays:

- `dashboards`: each entry has a `key` (`user-activity`, `usage-behavior`, `hardware`), a
  `menuTitle`, an absolute `source` URL, and `supportsRegions`.
- `nextButtons`: each entry has `from`, `to`, and `text`. They drive the "Proceed to …" button at
  the bottom of `/`, `/dashboard/user-activity`, and `/dashboard/usage-behavior`.

**Routing.** `src/index.jsx` wraps `src/components/views/Application.jsx` in react-router 5's
`BrowserRouter`. Application renders Header, Main and Footer inside `<div id="application">`.

`src/components/views/Main.jsx` defines a `Switch` with these routes:

- `/` renders Home.
- `/contact` renders Contact.
- `/dashboard/<key>` renders DashboardContainer, one route per `dashboards` entry.
- A catch-all renders NotFound: `<section id="not-found">` plus a `robots: noindex` meta tag.

Every route component is loaded with `src/lib/lazyLoad.jsx`, a `React.lazy` wrapper, inside
`src/lib/LazyBoundary.jsx`. LazyBoundary is an error boundary that shows a Spinner while a chunk
loads, or an Error titled "Error" with the message "Load error" if loading throws. Each route is
also wrapped in two higher-order components ("decorators"):

- `decorators/withTracker.jsx` sends Google Analytics page views through react-ga.
- `decorators/withNextButton.jsx` appends `views/NextButton.jsx` when `location.pathname` matches a
  `nextButtons.from`.

**The container/view split.** Files in `src/components/containers/` hold state and fetching, then
render a presentational file from `src/components/views/` with props they have already formatted.
Examples: `ChartContainer` renders `views/Chart`, and `DataTableContainer` renders
`views/DataTable`. That boundary is the seam the data-shaping tests use. They render a container
with its view replaced by a stub, then check the props the stub received.

**react-refetch's `connect()`** is the whole data layer. It is a higher-order component, used in
three containers, that calls `window.fetch` for a URL computed from props. It passes the result in
as a `dataFetch` prop with `pending`, `rejected` (plus `reason`), or `fulfilled` (plus `value`).

- `DashboardContainer.jsx` fetches `${source}/index.json`.
  - Pending: renders `views/Spinner`.
  - Rejected: renders `views/Error` with `id="dashboard-fetch-error"`.
  - Fulfilled: renders `views/Dashboard`.
  - If the dashboard has more than one region ("category"), the active region is the first of
    `sessionStorage.preferredRegion`, component state, `defaultCategory`, and `categories[0]`.
    Changing `#region-selector` writes `preferredRegion`.
- `MetricOverviewContainer.jsx` and `SummaryMetricContainer.jsx` both fetch
  `${dashboardSource}/${activeRegion}/${slug}/index.json`.
  - Pending: render nothing.
  - Rejected: render an Error with `id="metric-overview-fetch-error"` or
    `id="summary-metric-fetch-error"`.
  - `MetricOverviewContainer` also defines `shouldComponentUpdate`, so that when its URL changes
    (a region change) it keeps the old metric on screen until new data arrives instead of flashing
    empty. It currently returns `nextProps.dataFetch.fulfilled`, which also blocks the rejected
    render, so its error never appears. Milestone 3 fixes this.

Because react-refetch calls `fetch`, stubbing `global.fetch` drives it in jsdom. The same stub
keeps working if react-refetch is replaced by any other code that calls `fetch`.

**Data shaping**, all client-side:

- `ChartContainer.formatData` sorts populations by their maximum y value, highest first. It drops
  points whose y is `null` and turns parseable x strings into `Date`s. ChartContainer renders
  nothing until it has measured `#application > main`, and it re-measures on `resize`.
- `DataTableContainer.formatData` sorts the active date's rows by `value`, descending. It sorts in
  place, so it mutates its input.
- `SummaryMetricContainer.formatData` covers two cases:
  - One population: the data is a true/false split, so it emits "True" (y) and "False" (100 − y).
  - More than one: populations under 5% at the active date are summed into "Other", which sorts
    last. The rest sort by value, descending.

**`src/lib/utils.js`** exports four pure helpers: `bumpSort`, `isFloat`, `prettifyNumber` (which
uses `import.meta.env.VITE_VALUE_DECIMAL_PLACES`, `3` in the checked-in `.env`), and `getPageTitle`
(which uses `VITE_SITE_TITLE`, "Firefox Public Data Report").

**Metric descriptions** are rendered as inline Markdown with `markdown-it('zero')`. Only `link` and
`entity` rules are enabled, plus `markdown-it-sup`, and the output goes in via
`dangerouslySetInnerHTML`. `src/tests/jest/MetricOverview.test.jsx` guards that this escapes raw
HTML. Its assertions must not get weaker.

**The gitignored compiled CSS.** Styles are written in Stylus under
`src/components/views/styl/` and compiled to `src/components/views/css/` by `npm run build:css`.
That output is gitignored. Every view does a side-effect import like `import './css/Dashboard.css'`.
Vitest and Vite fail to resolve those imports until `npm run build:css` has run.

**Unit tests today.**

- Vitest, configured in the `test` block of `vite.config.mjs`: `jsdom`, `globals: true`,
  `include: ['src/tests/jest/**/*.test.jsx']`, `setupFiles: ['./src/setupTests.js']`. The `jest`
  directory name is a leftover from before Vitest.
- `src/setupTests.js` configures Enzyme's React 16 adapter and puts `React` and `shallow` on
  `global`.
- `eslint.config.js` declares those two globals for test files.
- There are two files: `Dashboard.test.jsx` (whether `#dashboard-description` renders) and
  `MetricOverview.test.jsx` (description sanitization).
- The Vite React plugin uses the classic JSX runtime, so `React` must be in scope wherever JSX
  appears. The `React` global covers that in tests.

**Playwright today.**

- `playwright.config.js` starts `npm start` on `:3000` and has two Chromium projects: `chromium`
  runs everything except `jsDisabled.spec.js`, and `chromium-no-js` runs only that spec.
- The specs live in `tests/playwright/specs/`, are written in CommonJS, and all run against live
  data.
- Helpers are in `tests/playwright/utils.js`.
  - `flagForUpdate` deliberately throws when an element count differs from what a test assumes, to
    force a human to look.
  - `changeRegionAndWaitForMetrics` waits for the refetches a region change triggers.
- Use `.first()` on `path.mg-line1`. metrics-graphics also puts that class on invisible hover
  paths.

**CI.** `.github/workflows/ci.yml` runs two jobs on pushes to `main` and on pull requests:

- `lint-and-test`: `npm ci`, `npm run build:css`, `npm run lint`, `npm run test:jest`.
- `e2e`: installs Chromium, runs `build:css`, then `npm run test:playwright`.

Any workflow change must be checked with Zizmor (`AGENTS.md`).

**Documents to keep in sync.** These describe the test setup and go stale with it:

- `AGENTS.md`: the src tree, the Build and Test commands, the ESLint paragraph, Testing Guidelines.
- `CONTRIBUTING.md`: Testing guidelines.
- `docs/architecture/frontend.md`: the file layout.
- `.github/dependabot.yml`: a comment that ties the React major-version ignore to Enzyme.
- `public/contribute.json`: the keyword list.

## Plan of Work

### Milestone 1: move the unit harness from Enzyme to React Testing Library

At the end of this milestone, the two existing unit tests run on RTL with the same assertions, and
Enzyme is gone from the dependency tree.

1. Install exact-pinned dev dependencies: `@testing-library/react@12.1.5`,
   `@testing-library/dom@8.20.1`, `@testing-library/jest-dom@6.9.1`, and
   `@testing-library/user-event@14.6.8`. Check that `package.json` has no `^` or `~`, and that
   `npm ls @testing-library/dom` shows a single 8.x copy.
2. Remove `enzyme`, `enzyme-adapter-react-16`, and the `overrides.enzyme` block. Remove
   `react-test-renderer` too, since only the Enzyme adapter used it.
3. Rewrite `src/setupTests.js`:
   - Import `@testing-library/jest-dom/vitest`.
   - Keep `global.React`, because the classic JSX runtime needs it.
   - Call RTL's `cleanup` after each test, because RTL 12 only auto-cleans when the runner exposes
     an `afterEach` global, and relying on that is fragile.
   - Make `console.error` throw unless a test has replaced it.
4. Port `Dashboard.test.jsx` and `MetricOverview.test.jsx` to `render` and `container.querySelector`
   / `screen` queries. MetricOverview's `.html()` assertions become assertions on
   `.metric-description`'s `innerHTML`, with the same expected strings. MetricOverview without a
   `type` lazy-loads nothing, so it renders synchronously.
5. In `eslint.config.js`, drop the `shallow` global. Give `src/setupTests.js` its own block with
   the Vitest globals.
6. Update the documents listed under "Documents to keep in sync".

Acceptance: `npm run test:jest` passes 2 files, 4 tests. `npm run lint` is clean.
`npm ls enzyme react-test-renderer` prints `(empty)`.

### Milestone 2: unit-test pure logic and data shaping

Add these test files to `src/tests/jest/`:

- `utils.test.jsx` covers `bumpSort` (bumped value first, rest sorted, input unchanged, missing
  value), `isFloat`, `prettifyNumber` (integers get thousands separators, floats get exactly 3
  decimal places), and `getPageTitle` (with and without a subtitle). The `.jsx` extension matches
  the `include` glob.
- `ChartContainer.test.jsx` mocks `../../components/views/Chart` with `vi.mock` as a stub that
  records its props. Before rendering, it gives `#application > main` a non-zero `offsetWidth`
  (jsdom reports 0), so the container renders. It checks legend order by max y, that null y points
  are dropped, that x strings become `Date`s, `showLegend` for one population versus several,
  annotation markers, and that width follows the parent width.
- `DataTableContainer.test.jsx` checks that rows render in descending value order through the real
  `views/DataTable`.
- `SummaryMetricContainer.test.jsx` mocks `views/SummaryMetric` and stubs `fetch`. It checks the
  True/False split, the "Other" bucket (summed and sorted last), and that populations missing the
  active date are skipped.
- `withNextButton.test.jsx` checks each `nextButtons` entry renders its text linking to its `to`,
  and that `/contact` gets no button. It uses `MemoryRouter` because NextButton renders a `Link`.
- `CustomizableDate.test.jsx` checks that the date selector shows dates formatted as `longDate` in
  UTC (for example "January 1, 2026"), that the first date is selected by default, and that
  changing the selection passes the new `activeDate` to children.

Acceptance: `npm run test:jest` passes, and the plan records the new file and test counts.

### Milestone 3: routing and fetch behavior in jsdom

1. `DashboardContainer.test.jsx`:
   - Stubs `global.fetch` with `vi.fn` returning Responses built inline.
   - Pending: a `.spinner` renders.
   - Rejected: `#dashboard-fetch-error` renders, with a spy on `console.error`.
   - Fulfilled: `#dashboard-title` shows the title.
   - Region priority with `sessionStorage` set or unset.
   - Changing `#region-selector` writes `preferredRegion` and requests the new region's metric URLs.
   - Single-category dashboards show no selector.
   - It mocks `views/Chart` so jsdom never runs metrics-graphics.
2. Fix and test `MetricOverviewContainer`'s rejected state.
   - Write `MetricOverviewContainer.test.jsx` first. It checks:
     - The exact requested URL.
     - The title renders when fulfilled.
     - On first load, an HTTP 500 shows `#metric-overview-fetch-error`.
     - After a successful load, changing `activeRegion` keeps the old title on screen while the new
       request is pending.
     - When that new request then fails with HTTP 500, `#metric-overview-fetch-error` replaces the
       old content.
   - Run it and confirm the two error cases fail against the current code.
   - Change `shouldComponentUpdate` in `src/components/containers/MetricOverviewContainer.jsx` to
     return `nextProps.dataFetch.fulfilled || nextProps.dataFetch.rejected`. Update its comment so
     it says rejected states also render.
   - Leave the separate `#313` comment in `render()` alone. It describes a hosting problem the fix
     doesn't touch.
   - Confirm all five cases pass.
3. `Routes.test.jsx` renders `views/Application` inside `MemoryRouter` with `initialEntries`. It
   checks `/` (Home and the Proceed button), `/contact`, each `/dashboard/<key>` (the dashboard's
   `index.json` is requested from its `source`), an unknown path (`#not-found`), and
   `/dashboard/hardware/extra` (`#not-found`). It stubs `fetch` and mocks `react-ga` so no
   analytics run. One local `renderAt(path)` function holds the router setup, so a router upgrade
   changes one place.
4. `LazyBoundary.test.jsx` checks that a lazily loaded child whose import rejects shows "Load
   error". React logs caught boundary errors to `console.error`, so the test spies on it.

Acceptance: `npm run test:jest` passes. Breaking the catch-all route in `Main.jsx` fails
`Routes.test.jsx`.

### Milestone 4: Playwright specs on recorded fixtures

1. Add `scripts/recordPlaywrightFixtures.js`, a Node script using global `fetch`. For each
   dashboard in `src/config.json`, it saves `index.json`, plus every metric and summary metric for
   the default region and for one other region when the dashboard supports regions. It writes them
   under `tests/playwright/fixtures/<dashboard>/…`, mirroring the URL path, and prints what it
   wrote. Re-running it overwrites the files.
2. Add helpers to `tests/playwright/utils.js`:
   - `useFixtureData(page)` routes `https://data.firefox.com/datasets/desktop/**` to the matching
     file. It answers 404 when no fixture exists, and the request URL appears in the test failure.
   - `failOnPageErrors(page)` collects `pageerror` and `console` error events and makes the test
     fail if any occurred.
3. Add specs in `tests/playwright/specs/fixtures/`, asserting values read from the fixture files:
   - A line chart renders.
   - The data table's rows are in order.
   - Summary metrics render.
   - A region change refetches and shows the new region.
   - A metric request answered with HTTP 500 shows `#metric-overview-fetch-error`. This depends
     on the Milestone 3 fix.
   - Description links render as anchors.
   - The next-button flow walks Home → User Activity → Usage Behavior → Hardware.
4. Update the Playwright parts of `AGENTS.md` and `CONTRIBUTING.md`, including how to re-record
   fixtures and that the fixture specs never touch the network.

Acceptance: `npx playwright test specs/fixtures` passes. It still passes with data.firefox.com
blocked, which proves the specs use the fixtures. `npm run test:playwright` passes overall.

### Milestone 5: production build in CI

1. Add a "Build" step (`npm run build`) after the unit tests in the `lint-and-test` job of
   `.github/workflows/ci.yml`. `build:version.json` needs git, and `actions/checkout` provides it.
2. Run Zizmor on the workflow.
3. Push the branch and open the pull request. Confirm both CI jobs are green.
4. Update the CI description in `AGENTS.md`.

Acceptance: both checks are green on the pull request, and the job log shows `vite build` output.

## Concrete Steps

Run everything from the repository root, `/Users/shobson/Sites/ensemble`.

    npm ci
    npm run build:css
    npm run lint
    npm run test:jest
    npx playwright test specs/fixtures
    npm run test:playwright
    npm run build

Baseline before any change:

    $ npm run test:jest
     Test Files  2 passed (2)
          Tests  4 passed (4)

## Validation and Acceptance

The work is done when all of the following hold:

- `npm run lint` is clean.
- `npm run test:jest` passes, with the file and test counts recorded in Outcomes.
- `npx playwright test specs/fixtures` passes with no requests reaching data.firefox.com.
- `npm run test:playwright` passes. If a live spec fails, re-run it once and say whether upstream
  data caused it.
- `npm run build` succeeds.
- Both CI jobs are green on the pull request.

Prove the tests catch real breakage by making each of these temporary changes, confirming a test
fails, and reverting:

- Make `bumpSort` stop bumping.
- Delete the catch-all `<Route>` in `Main.jsx`.
- Turn on raw HTML in MetricOverview's markdown parser. That means passing `{ html: true }` to
  `markdownIt('zero', …)` and adding `'html_inline'` to the `.enable([...])` list.
- Revert `MetricOverviewContainer.shouldComponentUpdate` to return only `fulfilled`.

## Idempotence and Recovery

Every step is additive and can be re-run. The fixture recorder overwrites its own output, so
re-running it after upstream data changes is the intended way to refresh. If fixture-based
assertions then fail, update the expected values from the new files. If a dependency install goes
wrong, `git checkout package.json package-lock.json && npm ci` restores the previous state.

## Artifacts and Notes

None yet.

## Interfaces and Dependencies

New dev dependencies, all exact-pinned:

- `@testing-library/react` 12.1.5: the last line that supports React 16.
- `@testing-library/dom` 8.20.1: the version RTL 12 uses, pinned so user-event shares it.
- `@testing-library/jest-dom` 6.9.1: DOM matchers, registered for Vitest. It is the newest release
  without a `@testing-library/dom` 10 peer dependency.
- `@testing-library/user-event` 14.6.8: realistic select changes and clicks.

Removed: `enzyme`, `enzyme-adapter-react-16`, `react-test-renderer`, and the `cheerio` override.

Playwright fixture support (see the Decision Log for why this isn't in `utils.js`):

    tests/playwright/fixtureData.js exports:
        test          // @playwright/test's test, extended: serves fixtures/, fails on errors and unrecorded requests
                      // option: allowedErrors (RegExp or null)
        expect        // @playwright/test's expect
        readFixture(relativePath)   // parsed JSON from tests/playwright/fixtures/<relativePath>

New script: `scripts/recordPlaywrightFixtures.js`, run with `node scripts/recordPlaywrightFixtures.js`.

## Revision notes

- 2026-10-21: An adversarial review found that `MetricOverviewContainer` never renders its
  rejected state. The rejected-fetch assertions in Milestones 3 and 4 could not have passed. Added
  the fix and its tests to Milestone 3, linked the Milestone 4 spec to it, and recorded the finding
  in Surprises and the Decision Log. Also marked issue #313 out of scope.

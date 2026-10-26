# Repository Guidelines

## Project Structure & Module Organization

`ensemble` (v1.2.1, `private: true`, MPL-2.0, `git@github.com:mozilla/ensemble.git`) is the React app behind <https://data.firefox.com/> — the **Firefox Public Data Report**. It is a **pure client-side React 16 SPA, built with Vite, and it contains no data of its own.** Every metric is fetched at runtime from **[ensemble-transposer](https://github.com/mozilla/ensemble-transposer)** (separate repo), which reformats Mozilla's public telemetry and serves JSON from the same `data.firefox.com` domain. If a number on the site looks wrong, the bug is usually not here.

**`src/config.json` is the spine.** Two arrays, and almost every structural change starts by editing one of them:

| Array | Shape | Drives |
|---|---|---|
| `dashboards` | `key`, `menuTitle`, `source`, `supportsRegions` | The route table in `src/components/views/Main.jsx` (`/dashboard/<key>`), the nav in `src/components/views/Header.jsx`, and the dashboard's data `source` |
| `nextButtons` | `from`, `to`, `text` | The "Proceed to …" CTA via `src/components/decorators/withNextButton.jsx` |

**Adding a dashboard is adding one entry to `dashboards`.** The `source` values are **absolute production URLs baked into the repo** — there is no env var for the data source, so you cannot point the app at a local transposer without editing `config.json`.

**Data flow** (no state library, no hooks, no Redux — `this.state` in class containers, plus a `sessionStorage` key `preferredRegion` set in `DashboardContainer.jsx`):

| Container | Fetches | Notes |
|---|---|---|
| `containers/DashboardContainer.jsx` | `${source}/index.json` | title, description, metaDescription, sections, dates, metrics, summaryMetrics, `categories` (= regions), defaultCategory |
| `containers/MetricOverviewContainer.jsx` | `${dashboardSource}/${activeRegion}/${slug}/index.json` | title, description, `type: 'line'｜'table'`, axes, columns, data, annotations |
| `containers/SummaryMetricContainer.jsx` | same per-metric endpoint | buckets populations under 5% into "Other" |

`src/lib/withFetch.jsx` **is the entire data layer** and is used in exactly those three files: `withFetch(props => url)(Container)` passes a `dataFetch` prop (`pending`, `rejected`, `fulfilled`, `value`, `reason`), refetches when the URL changes (back to pending first), rejects on non-2xx, and drops a response that arrives after a newer request started. Each one handles `dataFetch.pending` / `.rejected` / `.fulfilled` itself and renders `views/Spinner.jsx` or `views/Error.jsx`. All reshaping is client-side in each container's `formatData` (`ChartContainer` sorts populations by max y and drops nulls; `DataTableContainer` sorts rows by value descending).

Metric `description` strings are rendered as inline Markdown through `markdown-it('zero')` with only `link`/`entity`/`emphasis`/`sup` enabled, via `dangerouslySetInnerHTML`. `src/tests/jest/MetricOverview.test.jsx` exists **specifically to guard that sanitization** — never widen the enabled-rules list without extending that test.

```
src/
├── index.jsx                    entry: ReactDOM.render + BrowserRouter
├── config.json                  the route/dashboard table + next-button flow
├── registerServiceWorker.js     create-react-app leftover; only unregister() is called (SW deliberately off)
├── setupTests.js                Vitest setup: puts React on global, jest-dom matchers, fails on console.error
├── components/
│   ├── containers/              6 stateful/data-fetching .jsx
│   ├── decorators/              withTracker.jsx (react-ga), withNextButton.jsx
│   └── views/                   20 presentational .jsx
│       ├── styl/                Stylus SOURCE (hand-edited); includes/lib.styl
│       ├── css/                 GENERATED, GITIGNORED — holds only a README stub
│       ├── fonts/FiraSans/      8 weights/styles of webfonts
│       └── img/                 3 assets
├── lib/
│   ├── lazyLoad.jsx             React.lazy wrapper
│   ├── LazyBoundary.jsx         error boundary + spinner for lazy-loaded components
│   ├── withFetch.jsx            the data layer: fetches JSON and passes `dataFetch` to containers
│   └── utils.js                 bumpSort, isFloat, prettifyNumber, getPageTitle
└── tests/
    └── jest/                    unit tests, run by Vitest (the directory name predates Vitest)
tests/playwright/
├── specs/                       e2e specs (.spec.js, CommonJS), incl. dashboards/ and fixtures/; run on the recording and on live data
├── fixtures/                    recorded transposer JSON, written by `npm run record:fixtures`
├── fixtureData.js               `test` that serves fixtures/ (or live data, with liveData) and fails on page/console errors; readFixture
└── utils.js                     shared helpers: linkWorks, linksWork, flagForUpdate, metricTitleIsCorrect
```

There is no `pages/`, `store/`, `hooks/`, `api/`, `locales/`, or `data/`. `index.html` at the repository root is Vite's entry point (with a hardcoded `og:image` and the `<noscript>` message). `public/` holds static files copied as-is: `manifest.json`, `contribute.json`, a Search Console verification file, and `img/`. `build/` is gitignored output. `docs/architecture/` describes the frontend and the data pipeline. Routes are exactly `/`, `/contact`, `/dashboard/<key>`, and a catch-all `NotFound`.

## Current state: read this before estimating anything

MozMEAO is taking this repo over. Before that work started there were 810 commits — 515 in 2018, 92 in 2020, **nothing in 2021–2024**, three in 2025, the last `f655559` on 2025-05-07. The toolchain has since been replaced (#441): create-react-app, Jest and Nightwatch gave way to Vite, Vitest and Playwright, and two ESLint configs became one. Code outside the toolchain has barely been exercised since 2020.

- **CI runs on GitHub Actions; there is no CD.** `.github/workflows/ci.yml` runs lint, the Vitest unit tests, a production build (`npm run build`, not browser-tested), and the Playwright end-to-end tests on every push to `main` and every pull request. The Playwright specs run twice: on recorded data in "End-to-end tests", which the `main` ruleset requires, and on live data in "Live data tests", which it doesn't. There is no `.circleci/`, `Dockerfile`, `docker-compose`, or `Jenkinsfile` — earlier automation was deliberately removed: CircleCI disabled 2018-02-22 (`433a465`), Docker/Dockerflow removed 2018-08-23 (`d3bb561`), `.github/dependabot.yml` deleted 2020-07-29 (`7c7006f`, "Disable non-security updates from Dependabot").
- **The deploy is a static build on Google Cloud Storage** (confirmed by `x-goog-*` headers on the live site). `https://data.firefox.com/version.json` reports `1.2.1` / commit `f655559`, so **the deployed site predates the Vite toolchain on `main`**; nothing built by Vite has shipped yet. The mechanism that pushes `build/` to GCS is **not in this repo and is currently unknown** — finding and documenting it is takeover work, not something to guess at.
- **Node 24.** `.nvmrc` holds `24` and `engines` requires `^24.15.0`. A plain `npm install` works with no flags.
- **A fresh clone will not render styles until you compile Stylus.** `src/components/views/css/*` is gitignored and every component does a side-effect `import './css/Foo.css';` — run `npm run build:css` or the app, and Vitest, fail to resolve those imports. `npm start` compiles it for you.
- **Headline known bug: issue #409** — the hardware dashboard takes >10 s to re-render on resize/zoom and can trigger Firefox's slow-script dialog. Most user-visible defect; lives in the d3/metrics-graphics redraw path (`views/SummaryMetric.jsx`, `containers/ChartContainer.jsx`, `views/Chart.jsx`).
- About 30 open issues, oldest from 2018. Other notables: #313 (`MetricOverviewContainer` does not reject when metric data 404s — cited in an inline comment there), #245 (React code-splitting), #46 (localize content). #333 (replace `@babel/polyfill`) is still open, but the polyfill was removed in #441. The remote also carries about 30 stale `dependabot/npm_and_yarn/*` branches and three `%archive-*` branches.
- Upstream data is **live and current** — transposer `dates` arrays are sorted newest-first and are updated weekly. The app is unmaintained; the data is not.

## Build, Test, and Development Commands

`CONTRIBUTING.md` is the fuller reference for these.

```bash
npm install
npx playwright install chromium      # one-time browser download; needed before test:playwright

npm start                            # npm-run-all --parallel watch:css watch:app -> Vite dev server :3000
npm run build:css                    # one-shot Stylus compile

npm run lint                         # lint:js (flat-config ESLint, .js and .jsx) + lint:styl (stylint)
npm run test:jest                    # vitest run (React Testing Library)
npm run test:playwright              # every Playwright project; starts the dev server itself if :3000 is free
npm run test:playwright:recorded     # specs on tests/playwright/fixtures/ (CI's required "End-to-end tests")
npm run test:playwright:live         # the same specs on real data.firefox.com (CI's non-required "Live data tests")
npm run record:fixtures              # re-record tests/playwright/fixtures/ from data.firefox.com
npm test                             # lint -> test:jest -> test:playwright

npm run build:app                    # vite build
npm run build:version.json           # writes build/version.json; must run after build:app, needs git on PATH
npm run size                         # source-map-explorer on build/assets/index-*.js (needs a prior build)
```

Run one Vitest file: `npx vitest run src/tests/jest/Dashboard.test.jsx`. Run one Playwright spec: `npx playwright test contact.spec.js`.

**Environment:** `.env` **is checked into git** and holds only public build-time config — `VITE_GA_TRACKING_ID='UA-00000000-0'` (placeholder), `VITE_SITE_TITLE='Firefox Public Data Report'`, `VITE_VALUE_DECIMAL_PLACES=3`. Consumed through `import.meta.env` by `decorators/withTracker.jsx` and `lib/utils.js`. Override inline: `VITE_SITE_TITLE='…' npm start`.

## Coding Style & Naming Conventions

- **`.jsx` for any file containing JSX** — including `src/index.jsx` and `*.test.jsx`. Plain `.js` only for non-JSX modules (`lib/utils.js`, `setupTests.js`, `registerServiceWorker.js`, the Playwright specs and helpers, and the config files at the repository root).
- **PascalCase filenames matching the default-exported component.** Decorators are camelCase with a `with` prefix; `lib/lazyLoad.jsx` and `lib/withFetch.jsx` are camelCase because they are helpers, not components.
- **One component per file, always `export default`.** There are no named component exports anywhere in the repo; the only named exports at all are the four helpers in `lib/utils.js`.
- **The container/view split is the organizing principle.** `containers/X.jsx` holds state and fetching and renders `views/X.jsx` with formatted props (`ChartContainer`→`Chart`, `DataTableContainer`→`DataTable`). Keep new state out of `views/`.
- Function components are the default (15 of 20 views), written as anonymous default-exported arrows — `export default props => (...)` — with no `displayName` (hence `react/display-name: off`). Use a class only where state, refs, or lifecycle are genuinely needed: all 6 containers plus `SummaryMetric.jsx` (d3 + `React.createRef`), `MetricsGraphics.jsx` (metrics-graphics + `React.createRef`), `Spinner.jsx`, `MetricOverview.jsx`, `Footer.jsx`, and `lib/LazyBoundary.jsx` (error boundaries must be classes).
- Leading underscore for private class-property handlers (`_onRegionChange`, `_drawChart`, `_setChartWidth`) — applied inconsistently (`setChartSize` in `ChartContainer.jsx`); prefer the underscore in new code.
- Locals named `maybeX` hold a JSX fragment **or `null`** (`maybeDescription`, `maybeSummaryMetrics`, `maybeRegion`, `maybeGraphURL`). Keep the idiom.
- Styles attach via a global CSS side-effect import of the **generated** file at the top of the component: `import './css/Dashboard.css';`. Some components import several (`Chart.jsx` pulls `metrics-graphics/dist/metricsgraphics.css`, `./css/Chart.css`, `./css/Metric.css`). `Metric.css` and `LabelledSelector.css` are shared partials with no component of their own.
- No TypeScript, no PropTypes, no CSS-in-JS or CSS Modules, no Prettier, no i18n. **No MPL license headers on source files** (unlike springfield/bedrock) — do not add them.
- `.editorconfig`: LF, final newline, trim trailing whitespace, 4-space indent for `py,yml,html,css,styl,js,json,md`. `.jsx` is missing from that list but 4-space is the de facto convention. No max line length is configured anywhere.
- Every dependency is **exact-pinned** — no `^` or `~` in `package.json`. Keep it that way.

**ESLint is one flat config, `eslint.config.js`, covering `.js` and `.jsx`.** `npm run lint:js` runs `eslint .`; the build does not lint. Warnings don't fail the run.

Errors: `eqeqeq`, `no-var`, `prefer-const`, `no-console`, `no-global-assign`, `no-redeclare` and `no-shadow` — the latter two with `builtinGlobals: true`, so **do not name a variable `name`, `status`, `history`, `event`, etc.** Warnings: `semi: always`, `prefer-arrow-callback`, `comma-dangle` (trailing commas **required** for multiline arrays/objects/imports/exports, **never** for function args/params). Off: `react/prop-types`, `react/display-name`, `jsx-a11y/no-onchange`. `react/no-unescaped-entities` forbids only `>` and `}`. `jsx-a11y/recommended` is on, so a11y violations are errors; `jsx-a11y/label-has-associated-control` requires `htmlFor`. `settings.react.version` is `'detect'`. `src/tests/jest/**/*.test.jsx` also gets `@vitest/eslint-plugin`'s recommended rules, the `React` global, and a `no-shadow` exception for React Testing Library's `screen` (which otherwise collides with `window.screen`). **Quote style is not enforced** (there is no `quotes` rule) — single quotes by convention. The config's own `ignores` excludes `build`.

## Styling: Stylus, outside Vite

`src/components/views/styl/*.styl` → `src/components/views/css/*.css` via the `stylus` CLI (`build:css` / `watch:css`). Vite never sees the Stylus. One `.styl` per component (PascalCase, mirroring the component), plus `Application.styl` (global reset, Fira Sans `@font-face`, body type, ~217 lines) and shared partials `Metric.styl` and `LabelledSelector.styl`.

Shared variables live in `src/components/views/styl/includes/lib.styl` and it is nearly empty — `$base-tablet`, `$base-desktop`, `$link-color-normal = #0070ff`, and a `// TODO: padding/margin spacing.`. Import it per-file with `@import 'includes/lib'`; it is not globally injected. **No mixins file; most colors are hardcoded hex inline** (stylint's `colors` check is off).

**Not BEM.** ID selectors carry the page landmarks — `#application`, `#main-header`, `#main-navigation`, `#dashboard`, `#dashboard-sections`, `#summary-metrics`, `#region`, `#introduction` — with flat lowercase-dash classes for repeated pieces (`.metric-overview`, `.dashboard-section`, `.data-table-wrapper`, `.labelled-selector`, `.next-button`, `.striped`, `.highlighted`, `.bar-label`). Descendant nesting with `&` for states; responsive via `@media $base-tablet` / `@media $base-desktop` blocks at the bottom of each file. **Those element IDs are also the Playwright selectors — renaming one breaks the e2e tests.**

stylint (`.stylintrc`) runs with `maxErrors: 0` and `maxWarnings: 0`, so any finding fails the lint. It enforces the **CSS-like** Stylus dialect, not the terse indented syntax: 4-space indent, single quotes, `brackets: always`, `colons: always`, `semicolons: always`. Also `noImportant: true`, `leadingZero: false` (`.5`, not `0.5`), `zeroUnits: never` (`0`, not `0px`), `universal: never` (no `*`), `prefixVarsWithDollar: always`, `namingConvention: lowercase-dash` with `namingConventionStrict: true`, `zIndexNormalize: 10`. Escape hatches are `// @stylint off` / `on` / `ignore` comments — see the `@font-face` block in `Application.styl`.

## Writing code for the next reader

Code is read far more often than it is written, and in this repo the next reader is arriving after a five-year gap. Optimise for them.

- Use full, descriptive names. No single letters, no invented abbreviations. `activeRegion`, not `r`.
- Comments explain **what and why**, briefly, and only where the logic is non-obvious. Well-named code needs none. Delete comments that restate the code.
- **Comments must stand on their own.** Never reference a spec, a plan document, a requirement label, or a ticket ID *as* the explanation — the comment must make sense to someone who has only the file in front of them. A cross-reference alongside a self-contained explanation is fine; that is how the `metrics-graphics` workaround notes in `views/Chart.jsx` read.
- Never describe code that no longer exists. After a refactor, delete the comments it falsified — this repo already has several. Prefer deleting an obsolete comment, branch, or test over leaving it beside its replacement.

## Writing for people

This applies to everything written for a person to read: ExecPlans, PR descriptions, commit messages, documentation, issue comments, and chat replies.

- Put the point first. Lead with the conclusion or the action, then give the reason.
- Keep sentences short, one idea each. If a sentence needs a semicolon or a second "which", split it.
- Use active voice and say who does what: "Vitest fails without the compiled CSS", not "a failure was observed".
- Use the plain word: "use", "start", "before", "if", "about" — not "utilise", "commence", "prior to", "in the event that", "approximately".
- Cut hedges and filler: "it should be noted that", "in order to", "verified directly, not assumed".
- Number steps the reader has to follow in order.

## Testing Guidelines

**Vitest + React Testing Library**, configured in the `test` block of `vite.config.mjs` (`jsdom`, `globals: true`, `include: ['src/tests/jest/**/*.test.jsx']`). Files live in `src/tests/jest/`, named `PascalCase.test.jsx` — **not colocated, no `__tests__` directories.** `@testing-library/react` is pinned to 12.x, the last line that supports React 16; `@testing-library/dom` is pinned to the 8.x it uses so `@testing-library/user-event` shares the same copy. `src/setupTests.js` puts `React` on `global` (the classic JSX runtime needs it in scope), so **test files don't import React**; they import `render` and `screen` from `@testing-library/react`. It also registers the jest-dom matchers (`toHaveTextContent`, `toBeInTheDocument`), and **fails any test that calls `console.error` unexpectedly**, so React warnings surface as failures — a test that expects an error replaces `console.error` with `vi.spyOn(console, 'error').mockImplementation(() => {})`. Tests render the real component tree into jsdom and assert on the DOM (`container.querySelector('#dashboard-description')`, or `innerHTML` where the markup itself is the point, as in the sanitization test). Existing style is top-level `it(...)` with long descriptive sentences. No snapshots.

- **Stubbing the network:** `withFetch` calls `window.fetch(new Request(url, …))` each time it fetches. Stub it with `fetchMock = vi.spyOn(window, 'fetch')` in `beforeEach` (`setupTests.js`'s `vi.restoreAllMocks()` undoes it) and read URLs from `fetchMock.mock.calls[n][0].url`. The container tests (`SummaryMetricContainer.test.jsx` is the simplest) show the pattern.
- **Testing data shaping:** containers that hand formatted props to a view that needs real layout (`views/Chart` → metrics-graphics, `views/SummaryMetric` → d3) are tested by replacing the view with `vi.mock('../../components/views/Chart', () => ({ default: vi.fn(() => null) }))` and asserting on the props it was last called with. Views that are plain markup (`views/DataTable`) render for real.
- **Testing chart views:** `Chart.test.jsx` renders the real `views/Chart` with `vi.mock('../../components/views/MetricsGraphics', () => ({ default: vi.fn(() => null) }))` and asserts on the options it computes (bounds, units, UTC formatting, legend, markers, colors). `SummaryMetric.test.jsx` renders the real d3 summary bar inside `<div id="application"><main>`, with `vi.spyOn(HTMLElement.prototype, 'offsetWidth', 'get').mockReturnValue(490)` — jsdom reports 0px, and at 490px the bar draws at its 450px maximum, so segment widths are predictable.
- **Routing:** `Routes.test.jsx` renders `views/Application` inside `MemoryRouter` through one `renderAt(path)` function — the only place a router upgrade has to touch — and mocks `react-ga` so no analytics load. Its cases are generated from `config.json`, so adding a dashboard adds a route test.

**Playwright** specs in `tests/playwright/specs/` are **`camelCase.spec.js` or `kebab-case.spec.js`, CommonJS**. Every spec except `jsDisabled.spec.js` imports `test`, `expect` (and, where needed, `readFixture`) from **`tests/playwright/fixtureData.js`**, not `@playwright/test`. `tests/playwright/utils.js` exports `linkWorks`, `linksWork`, `metricTitleIsCorrect`, `changeRegionAndWaitForMetrics`, and `flagForUpdate` — which **deliberately fails when an element count changes**, to force a human to look.

**The same specs run in two modes**, chosen by Playwright project in `playwright.config.js`:

| Project | Data | CI check | Required to merge |
|---|---|---|---|
| `chromium` (all but `jsDisabled`) + `chromium-no-js` (`jsDisabled` only, `javaScriptEnabled: false`) | The recording in `tests/playwright/fixtures/` | "End-to-end tests" (`npm run test:playwright:recorded`) | Yes |
| `live-data` (all but `fixtures/` and `jsDisabled`) | The real data.firefox.com | "Live data tests" (`npm run test:playwright:live`) | No |

In recorded mode, `fixtureData.js`'s `test` answers every `https://data.firefox.com/datasets/desktop/**` request from `tests/playwright/fixtures/` (paths mirror the URL), answers other third-party requests (Google Analytics) with an empty 200, and **fails the test on any page error, console error, or dataset request with no recording**. Only the default region and `Germany` are recorded; a metric request for any other region is served the default region's file for the same metric, so specs can pick any region — a missing metric or dashboard still fails. A spec that expects errors sets `test.use({ allowedErrors: /pattern/ })` — a single RegExp, because `test.use()` reads an array as a `[value, options]` pair. Override one response with a later `page.route()`, which takes precedence (`errors.spec.js`, `descriptions.spec.js`). Specs about what a chart draws — `chart-series`, `region-data`, `summary-bars`, `dates`, `boundaries` — serve a small controlled JSON body for one metric this way, so their assertions don't depend on what was recorded. The `fixtures/` specs read expected values from the recording with `readFixture('hardware/index.json')`; the `dashboards/` specs hardcode exact titles and ordering, which matches the recording and is what the live job checks against reality. In `live-data` mode the page is left alone.

**The live check breaks by design** when upstream data changes (weekly). A red "Live data tests" means the recording is stale, not that the change is broken: fix it by re-recording in a separate pull request.

- **Run against live data:** `npm run test:playwright:live` (dev server + real data). Against a deployed site: `PLAYWRIGHT_BASE_URL=https://data.firefox.com npm run test:playwright:live`. If `:3000` is taken by something else, Playwright silently reuses it — start `npx vite --port 3001 --strictPort` and set `PLAYWRIGHT_BASE_URL=http://localhost:3001`.
- **Update the recording:** (1) `npm run record:fixtures` (each dashboard's `index.json`, plus every metric and summary metric for the default region and `Germany`, trimmed to the 12 most recent dates); (2) `git diff --stat tests/playwright/fixtures` and skim for new/removed metrics, regions, titles, or odd populations; (3) `npm run test:playwright:recorded` — `fixtures/` failures mean the data's shape changed, `dashboards/` failures mean titles or ordering changed, so update those hardcoded expectations; (4) `npm run test:playwright:live` should now agree; (5) commit the recording and spec updates together ("Re-record Playwright fixtures").

**Tests describe the code as it is now.** Assert what the code does; never add a test whose purpose is to prove that removed behaviour is absent — a negative assertion about history passes forever while documenting nothing. Each test builds only the data it needs; no shared mega-fixture. Keep assertions at the point where the thing is rendered rather than behind a `_getElement(wrapper)`-style indirection layer, so a failure points straight at the markup it cares about.

## Footguns

| Trap | What happens |
|---|---|
| Switching branches without reinstalling | `node_modules` can still hold another branch's packages. Run `npm install` after a branch switch before trusting any result. |
| Gitignored `src/components/views/css/` | Fresh clone cannot resolve the CSS imports until `npm run build:css` runs. Never hand-edit `css/` — edit `styl/`. |
| Renaming a landmark ID | Breaks Playwright selectors silently. |
| `path.mg-line1` in a Playwright locator | metrics-graphics puts the class on many invisible hover paths too, and a population with one data point draws a zero-size line (shown as a dot instead). To check a chart drew, use `path.mg-main-line` with `.filter({ visible: true }).first()`. |
| `build:version.json` | Needs `build/` to already exist and `git` on PATH; must follow `build:app`. |
| `no-shadow` / `no-redeclare` with `builtinGlobals` | Naming a local `name`, `status`, `history`, `event` is a hard error. |

**Known rot, for recognition only — this file is not a roadmap:** `registerServiceWorker.js` exists but only `unregister()` is called, and its registration path still reads create-react-app's `process.env.PUBLIC_URL`; `dateformat@3.0.3` is several majors behind, because newer majors change its export shape (see `docs/architecture/frontend.md`).

## Workflow guidelines

- Work on a dedicated branch named `<issue-number>--kebab-case-summary` (e.g. `409--hardware-resize-performance`).
- If the issue ID is not obvious from the request, **ask for it**, along with a short summary for the branch name. Then fetch <https://github.com/mozilla/ensemble/issues/ISSUE_ID> and read the description before writing code — many of these issues are 5+ years old and the discussion carries context the title does not.
- When the work looks complete, **offer to run the tests**. Say which suites are actually runnable in the current environment rather than claiming a green run you could not produce.

### ExecPlans

Work that spans more than one session — #409's redraw path, broadening test coverage — gets an **ExecPlan**: a self-contained Markdown design document, written before the code, committed with it, and kept current as the work moves. The specification is `.claude/skills/execplans/references/PLANS.md`; the `execplans` skill loads it on demand, so read it there rather than guessing at the shape.

Plans live in `docs/execplans/`, named `YYYY-MM-DD-kebab-case-summary.md` (`2026-09-14-eslint-unification.md`), and ship on the branch with the change so a reviewer reads the plan and the diff together. Update the plan in the same commit as the work it describes — a plan that lags the tree is worse than no plan.

A single-file fix does not need one. Neither does anything you could put in a commit title.

## Commit & Pull Request Guidelines

Keep commit titles short and imperative, and reference the issue when there is one (`Display times using UTC timezone`, `Fix hardware resize thrash (#409)`).

The project maintains a hand-managed version number in `package.json` that is **not semver** — first digit for major changes, second for medium, third for small — historically bumped at deploy time. Do not bump it casually; ask.

### Writing PR descriptions

There is no `.github/PULL_REQUEST_TEMPLATE.md` in this repo, so use these four headings every time: **One-line summary**, **Significant changes and points to review**, **Issue / Bugzilla link**, **Testing**. Answer one that doesn't apply with `n/a` — one word is a complete answer, and inventing content to fill a heading is worse than admitting it is empty.

A description directs the reviewer's attention. It does not restate the diff, and it does not explain this codebase back to the team that owns it. Check what actually changed (`git diff --stat main...`, plus a scan for config, fixtures, and deletions — the categories most likely to hide a consequence a stat diff won't show) before writing, so the description matches reality.

Take length out of describing the change.

**One-line summary.** One or two sentences: what the change does, and why where the title does not already make that obvious. Compress rather than qualify. "Debounce the hardware chart resize handler" beats "Add a single shared, debounced resize listener across all ChartContainer instances instead of one unthrottled listener per chart, since redrawing every chart independently on every resize event is what makes the hardware dashboard hang" — say the point once, and let the bullets below carry the rest.

**Significant changes and points to review.** Short bullets, most significant first, one clause each. Nest a sub-bullet where a consequence needs one; never go past two levels. A single sentence is right where the change is one idea; a short paragraph is right where the reviewer needs domain context the diff can't give.

Name a file where the file is the point — "Remove the unused `BrowserHacks.styl`", "Add a debounced handler to `ChartContainer.jsx`" — and prefer the bare filename when it identifies the thing on its own.

Rejected, as a first draft might read:

> - **Debounced resize handler** (`ChartContainer.jsx`) — the hardware dashboard was thrashing on every resize. **This is the most critical part to review** — it's the redraw path every chart on the site shares.

Replacement, as it should read:

> - Replace one unthrottled `resize` listener per chart with a single, debounced listener shared across all `ChartContainer` instances.
> - The hardware dashboard's 11 charts no longer each trigger their own redraw on every resize event (#409).

- Say what changed. Add why only where the change does not already imply it.
- Do not rate your own change. No "low risk", "mechanical", "straightforward", and never a reflexive "this is the most critical part to review" — most PRs have no such thing, and a rating carries nothing a reviewer can act on.
- Do flag a change that is genuinely high-risk or wide blast radius, in one line, stating its reach as a fact rather than a rating: a change to the `markdown-it` sanitization allowlist (reaches every metric description on the site, not just the one you're editing), a renamed landmark ID (breaks the Playwright suite silently), or anything that touches `config.json`'s shape rather than just its content. A metric-title tweak or a Stylus color change earns none of this.
- A side-effect worth knowing about but not risky — a duplicate file deleted, a stray import removed — is a plain bullet like everything else.
- Fold low-risk, mechanical fallout — a regenerated lockfile, a renamed CSS class, a fixture update — into its own short item, kept brief and after the substantive bullets, so it doesn't crowd out what the reviewer actually needs to think about.
- Flag genuine uncertainty about your own work — "I'm not sure this handles the region-selector edge case" — distinct from rating risk. Risk-rating is banned above; naming a real unknown is not, and is often the most useful sentence in the description.
- Never explain mechanics the team already knows: why `withFetch` isn't mocked in a test, how the container/view split works, what `flagForUpdate` does.
- Never describe your own process. Not which approach you tried first, not what a review caught, not that the branch is stacked on another. Two things that look similar but are worth keeping: deliberately deferred scope — "Ports the Nightwatch specs as-is; re-baselining the stale content assertions is a separate pass" — and a change's provenance if it matters — "Matches the Playwright config shape already used in mozmeao/springfield and mozmeao/bedrock".

**Issue / Bugzilla link.** The full tracker URL, or `n/a`. List all of them where a change closes more than one, and give the context on a cross-reference: "Follow-up to #409, addressing the WebKit-specific slowness noted while porting the e2e suite."

**Testing.** What a reviewer does by hand to check this. The one section worth expanding.

- Open with prerequisites where there are any: "Run `npm run build:css` first" or "Run `npx playwright install chromium` first."
- Include setup commands a reviewer must run to see the change at all. Leave out test and lint commands — `npm test`, `npm run lint`, `npx playwright test` — those only re-check what CI already checks.
- Give the URL to load — `http://localhost:3000/dashboard/hardware`, not just "the hardware dashboard" — and the expected result once there.
- One step per thing to verify, phrased as a check — "Check the dashboard doesn't hang on resize", not "resize the window → dashboard redraws instantly". `- [ ]` checkboxes where the reviewer is working through a list.
- Ask plainly for a close look when you want one: "Look closely at the region-selector change, please — it touches sessionStorage across every dashboard."

Here's the shape to aim for — a description for the real ESLint-unification work:

> ## One-line summary
>
> Replace the two disjoint ESLint configs with one flat config that actually covers `.jsx`.
>
> ## Significant changes and points to review
>
> - Add `eslint.config.js`: one flat config, `.js` and `.jsx`, structured like bedrock/springfield's rule-bundle pattern.
> - Every deliberate rule choice from `.eslintrc.extra.js` carries forward — `eqeqeq`, `no-var`, `no-shadow`/`no-redeclare` with `builtinGlobals`, the narrowed `react/no-unescaped-entities`.
> - `settings.react.version` is now `'detect'`, not hardcoded — the old config pinned `"16.4.2"` against an actually-installed `16.13.1`.
> - Fixes a real bug along the way: the old config's test-globals override targeted `src/tests/jest/*.js`, but the actual files are `.jsx` — it never matched.
> - Not adopting Prettier, even though bedrock/springfield's config ends with `eslint-config-prettier` — that would mean reformatting the whole `src/` tree as a side effect of this change.
> - Drops `eslint-plugin-jest` and `eslint-plugin-json` (unused now — the project is on Vitest, and JSON linting wasn't in scope here).
> - `npx eslint .` surfaced 9 previously-invisible findings on `.jsx` files that had never been linted by anything in this repo — all trivial `semi`/`comma-dangle` warnings, fixed via `--fix`.
>
> ## Issue / Bugzilla link
>
> n/a
>
> ## Testing
>
> - `npm install`
> - `npm run lint` — should exit clean
> - Introduce a stray `var` in any `.jsx` file and confirm `npm run lint` now catches it (it wouldn't have before this change)
> - `npm run build:app && npm run test:jest` — confirm neither regressed

## Security & Configuration Tips

- Keep secrets out of version control.
- Configuration follows the 12-Factor App pattern via `.env` — but note that **this repo's `.env` is deliberately checked in**, because it holds only public build-time values and a placeholder GA ID. A real credential does not go in that file.
- This is a fully client-side bundle: anything in a `VITE_*` variable ships to the browser in plain text.
- If a changeset adds a GitHub Action or Workflow, check it with [Zizmor](https://zizmor.sh/) before considering the work complete.

## LLM assistance

* When committing code, do not list the LLM as a co-author - it is a tool, not a developer. All code committed is the responsibility of the human developer using the LLM. This is in line with <https://firefox-source-docs.mozilla.org/contributing/ai-coding.html>

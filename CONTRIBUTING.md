# Contributing to ensemble

This is the canonical reference for building, testing, and changing this repository. For what the
system is and how its pieces fit together, see `docs/architecture/` instead — this file is about
how to work in the code, not what the code is.

## Build, test, and development commands

    npm install                          # confirmed clean on Node 24; no special flag needed
    npx playwright install chromium      # one-time browser download; needed before test:playwright

    npm start                            # npm-run-all --parallel watch:css watch:app -> Vite dev
                                          # server on :3000
    npm run build:css                    # one-shot Stylus compile; confirmed working, no flags needed

    npm run lint                         # lint:js (flat-config ESLint, covers .js and .jsx) + lint:styl
    npm run test:jest                    # vitest run; confirmed passing, no flags
    npm test                             # lint -> test:jest -> test:playwright

    npm run build:app                    # vite build; confirmed working, no flags needed
    npm run build:version.json           # writes build/version.json; must run after build:app, needs git on PATH
    npm run size                         # source-map-explorer on build/assets/index-*.js (needs a prior build)
    npm run test:playwright              # every Playwright project; starts the dev server itself if
                                          # one isn't already running on :3000
    npm run test:playwright:recorded     # specs on the recording (CI's required check)
    npm run test:playwright:live         # the same specs on live data (CI's non-required check)
    npm run record:fixtures              # re-record tests/playwright/fixtures/

Run one Vitest file directly: `npx vitest run src/tests/jest/Dashboard.test.jsx` (confirmed
working). Run one Playwright spec directly: `npx playwright test contact.spec.js`.

**Environment:** `.env` is checked into git and holds only public build-time config —
`VITE_GA_TRACKING_ID='UA-00000000-0'` (a placeholder),
`VITE_SITE_TITLE='Firefox Public Data Report'`, `VITE_VALUE_DECIMAL_PLACES=3`. These are consumed by
`src/components/decorators/withTracker.jsx` and `src/lib/utils.js` via `import.meta.env.VITE_*` —
Vite's own convention, not Node's `process.env` (which is not populated in the browser bundle at
all, except for the one special-cased `process.env.NODE_ENV` expression Vite replaces for
library-compatibility reasons). Override any of them inline: `VITE_SITE_TITLE='…' npm start`. This
repository is a fully client-side bundle — anything in a `VITE_*` variable ships to the browser in
plain text, so a real credential never belongs in one, and this `.env` file deliberately holds none.

## Coding style and naming conventions

- `.jsx` for any file containing JSX — including `src/index.jsx` and `*.test.jsx`. Plain `.js` only
  for non-JSX modules (`lib/utils.js`, `setupTests.js`, `registerServiceWorker.js`, and the
  Playwright helper/config files under `tests/playwright/` and at the repository root).
- PascalCase filenames matching the default-exported component. Decorators are camelCase with a
  `with` prefix; `lib/lazyLoad.jsx` and `lib/LazyBoundary.jsx` are the exceptions (a small loader
  helper and an error-boundary component, not components themselves in the first case).
- One component per file, always `export default`. There are no named component exports anywhere in
  this repository; the only named exports at all are the four helpers in `lib/utils.js`.
- The container/view split is the organizing principle — see `docs/architecture/frontend.md`.
  `containers/X.jsx` holds state and fetching and renders `views/X.jsx` with formatted props
  (`ChartContainer` → `Chart`, `DataTableContainer` → `DataTable`). Keep new state out of `views/`.
- Function components are the default (17 of 19 views), written as anonymous default-exported
  arrows — `export default props => (...)` — with no `displayName` (hence `react/display-name:
  off`). Use a class only where state, refs, or lifecycle are genuinely needed: all 6 containers
  plus `SummaryMetric.jsx` (d3 + `React.createRef`), `Spinner.jsx`, `MetricOverview.jsx`,
  `Footer.jsx`, and `LazyBoundary.jsx` (an error boundary, which must be a class component).
- Leading underscore for private class-property handlers (`_onRegionChange`, `_drawChart`,
  `_setChartWidth`) — applied inconsistently (`setChartSize` in `ChartContainer.jsx`); prefer the
  underscore in new code.
- Locals named `maybeX` hold a JSX fragment or `null` (`maybeDescription`, `maybeSummaryMetrics`,
  `maybeRegion`, `maybeGraphURL`). Keep the idiom.
- Styles attach via a global CSS side-effect import of the generated file at the top of the
  component: `import './css/Dashboard.css';`. Some components import several (`Chart.jsx` pulls
  `metrics-graphics/dist/metricsgraphics.css`, `./css/Chart.css`, `./css/Metric.css`). `Metric.css`
  and `LabelledSelector.css` are shared partials with no component of their own.
- No TypeScript, no PropTypes, no CSS-in-JS or CSS Modules, no Prettier, no i18n. No MPL license
  headers on source files (unlike other MozMEAO repositories) — do not add them.
- `.editorconfig`: LF, final newline, trim trailing whitespace, 4-space indent for
  `py,yml,html,css,styl,js,json,md`. `.jsx` is missing from that list but 4-space is the de facto
  convention. No max line length is configured anywhere.
- Every dependency is exact-pinned — no `^` or `~` in `package.json`. Keep it that way.

**ESLint — one flat-config file, `eslint.config.js` at the repository root, covering both `.js` and
`.jsx`.** `npm run lint:js` runs `eslint .` with no other flags; there is no separate config for
`.jsx` and no invisible bundled config supplying one either (unlike the old create-react-app-era
setup, which linted `.jsx` invisibly through `react-scripts`). Errors: `eqeqeq`, `no-var`,
`prefer-const`, `no-console`, `no-global-assign`, `no-redeclare` and `no-shadow` — the latter two
with `builtinGlobals: true`, so do not name a variable `name`, `status`, `history`, `event`, etc.
Warnings: `semi: always`, `prefer-arrow-callback`, `comma-dangle` (trailing commas required for
multiline arrays, objects, imports, and exports; never for function args or params). Off:
`react/prop-types`, `react/display-name`, `jsx-a11y/no-onchange`. `react/no-unescaped-entities`
forbids only `>` and `}`. `settings.react.version` is `'detect'` (reads the installed React version
automatically, rather than a hardcoded string). `src/tests/jest/**/*.test.jsx` additionally gets
`@vitest/eslint-plugin`'s recommended rules and Vitest's ambient globals (`it`, `expect`,
`beforeAll`, etc. — the same globals `src/setupTests.js` attaches for the tests themselves). Quote
style is not enforced (there is no `quotes` rule) — single quotes by convention. The `build`
directory is excluded via the config's own `ignores` array (flat config's replacement for
`.eslintignore`, which no longer exists).

## Styling: Stylus, outside webpack

`src/components/views/styl/*.styl` compiles to `src/components/views/css/*.css` via the `stylus`
CLI (`npm run build:css` / `watch:css`). Vite never sees the Stylus — this pipeline predates the
build tool and remains fully independent of it. One `.styl` file per component (PascalCase,
mirroring the component), plus `Application.styl` (global reset, Fira Sans `@font-face`, body type,
roughly 217 lines) and shared partials `Metric.styl` and `LabelledSelector.styl`.

Shared variables live in `src/components/views/styl/includes/lib.styl`, and it is nearly empty:
`$base-tablet`, `$base-desktop`, `$link-color-normal = #0070ff`, and a `// TODO: padding/margin
spacing.` comment. Import it per-file with `@import 'includes/lib'` — it is not globally injected.
There is no mixins file; most colors are hardcoded hex inline (stylint's `colors` check is off).

This styling is not BEM. ID selectors carry the page landmarks — `#application`, `#main-header`,
`#main-navigation`, `#dashboard`, `#dashboard-sections`, `#summary-metrics`, `#region`,
`#introduction` — with flat lowercase-dash classes for repeated pieces (`.metric-overview`,
`.dashboard-section`, `.data-table-wrapper`, `.labelled-selector`, `.next-button`, `.striped`,
`.highlighted`, `.bar-label`). Descendant nesting with `&` handles states; responsive rules live in
`@media $base-tablet` / `@media $base-desktop` blocks at the bottom of each file. **Those element
IDs are also the end-to-end test selectors — renaming one breaks those tests silently.**

stylint (`.stylintrc`) runs with `maxErrors: 0` and `maxWarnings: 0`, so any finding fails the lint.
It enforces the CSS-like Stylus dialect, not the terse indented syntax: 4-space indent, single
quotes, `brackets: always`, `colons: always`, `semicolons: always`. Also `noImportant: true`,
`leadingZero: false` (`.5`, not `0.5`), `zeroUnits: never` (`0`, not `0px`), `universal: never` (no
`*`), `prefixVarsWithDollar: always`, `namingConvention: lowercase-dash` with
`namingConventionStrict: true`, `zIndexNormalize: 10`. Escape hatches are `// @stylint off` / `on` /
`ignore` comments — see the `@font-face` block in `Application.styl`.

## Writing code for the next reader

Code is read far more often than it is written, and in this repository the next reader is often
arriving after a long gap. Optimize for them.

- Use full, descriptive names. No single letters, no invented abbreviations. `activeRegion`, not
  `r`.
- Comments explain what and why, briefly, and only where the logic is non-obvious. Well-named code
  needs none. Delete comments that restate the code.
- Comments must stand on their own. Never reference a spec, a plan document, a requirement label, or
  a ticket ID as the explanation — the comment must make sense to someone who has only the file in
  front of them. A cross-reference alongside a self-contained explanation is fine; that is how the
  `metrics-graphics` workaround notes in `views/Chart.jsx` read.
- Never describe code that no longer exists. After a refactor, delete the comments it falsified.
  Prefer deleting an obsolete comment, branch, or test over leaving it beside its replacement.

## Testing guidelines

**Vitest + React Testing Library**, configured in the `test` block of `vite.config.mjs` (the same file that
configures the Vite build) — `environment: 'jsdom'`, `globals: true`, `setupFiles:
['./src/setupTests.js']`, scoped to `include: ['src/tests/jest/**/*.test.jsx']` specifically so
Vitest's own default file-discovery glob doesn't also try to run Playwright's `.spec.js` files.
Test files live in `src/tests/jest/`, named `PascalCase.test.jsx` (the directory is still
named `jest` even though Vitest is what actually runs these — a naming leftover from before this
repository's toolchain migration, not worth a rename on its own). `@testing-library/react` is pinned
to 12.x, the last line that supports React 16, and `@testing-library/dom` is pinned to the 8.x it
uses so `@testing-library/user-event` shares the same copy. `src/setupTests.js` puts `React` on the
global object, because the classic JSX runtime needs it in scope, so test files don't import it.
They import `render` and `screen` from `@testing-library/react` and assert on the rendered DOM —
`container.querySelector('#dashboard-description')`, or `innerHTML` where the markup itself is the
point, as in the sanitization test. The setup file also registers the jest-dom matchers
(`toHaveTextContent`, `toBeInTheDocument`) and fails any test that calls `console.error`
unexpectedly, so React warnings show up as failures. A test that expects an error replaces it first
with `vi.spyOn(console, 'error').mockImplementation(() => {})`. The existing style is top-level
`it(...)` with long descriptive sentences. No snapshots.

`react-refetch` captures `window.fetch` when `connect()` runs, which is at module import, so a stub
set inside a test is silently ignored and the container goes to the real network. Install it with
`vi.hoisted(() => { const mock = vi.fn(); window.fetch = mock; return mock; })` so it exists before
the imports, and `mockReset()` it in `beforeEach`; `SummaryMetricContainer.test.jsx` is the
simplest example. Containers whose view needs real layout (`views/Chart` uses metrics-graphics,
`views/SummaryMetric` draws with d3) are tested by replacing that view with `vi.mock` and asserting
on the props it received. Plain-markup views such as `views/DataTable` render for real.
`Chart.test.jsx` renders the real `views/Chart` with `react-metrics-graphics` replaced by
`vi.mock('react-metrics-graphics', () => ({ default: vi.fn(() => null) }))`, and asserts on the
options it computes. `SummaryMetric.test.jsx` renders the real d3 summary bar inside
`<div id="application"><main>`, with `HTMLElement.prototype.offsetWidth` spied to 490: jsdom
reports 0px, and at 490px the bar draws at its 450px maximum, so segment widths are predictable.
`Routes.test.jsx` renders `views/Application` inside `MemoryRouter` through a single `renderAt(path)`
function, so a router upgrade changes one place, and mocks `react-ga`. Its route cases come from
`config.json`. ESLint
allows the name `screen` in test files despite `no-shadow`'s `builtinGlobals`, because importing
React Testing Library's `screen` is that library's documented idiom.

**Playwright** specs live in `tests/playwright/specs/`, configured by `playwright.config.js` at the
repository root. Specs are `camelCase.spec.js` or `kebab-case.spec.js` (matching the component or
page under test), CommonJS. Every spec except `jsDisabled.spec.js` imports `test`, `expect` and,
where needed, `readFixture` from `tests/playwright/fixtureData.js` rather than from
`@playwright/test` — for example `test('Page loads', async ({ page }) => { await
expect(page.locator('#contact')).toBeVisible(); })`. Shared helpers (`linkWorks`, `linksWork`,
`flagForUpdate`, `metricTitleIsCorrect`, `changeRegionAndWaitForMetrics`) live in
`tests/playwright/utils.js`. `linkWorks` and `linksWork` check only links within the app and skip
external URLs, which failed too often for reasons outside this repository. `flagForUpdate`
deliberately fails when an element count changes, to force a human to look. Playwright starts the
dev server itself (`webServer: { command: 'npm start', ... }`) if one isn't already running on
`:3000`, reusing an existing one when there is one — so if something unrelated is on `:3000`, the
suite silently tests that instead.

The same specs run in two modes, chosen by Playwright project:

- **Recorded**, the `chromium` project (every spec but `jsDisabled.spec.js`) plus `chromium-no-js`
  (`jsDisabled.spec.js` only, with `javaScriptEnabled: false`; Chromium-only because the Nightwatch
  suite it replaced only tested Chrome). `npm run test:playwright:recorded` runs these, and so does
  CI's "End-to-end tests" check, which the `main` ruleset requires before merging.
  `fixtureData.js`'s `test` answers every `https://data.firefox.com/datasets/desktop/**` request
  from `tests/playwright/fixtures/`, whose paths mirror the URLs, and answers other third-party
  requests (Google Analytics) with an empty response. It fails the test on any page error, any
  console error, or any dataset request with no recording. Only the default region and `Germany`
  are recorded; a metric request for another region is served the default region's file for the
  same metric, so specs can pick any region, while a missing metric or dashboard still fails.
- **Live**, the `live-data` project: the same specs, minus `fixtures/` (which read their expected
  values from the recording) and `jsDisabled.spec.js`, against the real data.firefox.com with no
  interception. `npm run test:playwright:live` runs these, and so does CI's "Live data tests"
  check, which is **not** required. `npm run test:playwright` runs every project.

A spec that expects errors allows them with `test.use({ allowedErrors: /pattern/ })`. That takes a
single RegExp because `test.use()` reads an array as a `[value, options]` pair. To change one
response, register a later `page.route()`, which takes precedence, as `errors.spec.js` and
`descriptions.spec.js` do. The specs about what charts draw (`chart-series`, `region-data`,
`summary-bars`, `dates`, `boundaries`) serve a small controlled JSON body for one metric this way,
so their assertions don't depend on what was recorded. The `fixtures/` specs read expected values with `readFixture(...)`; the
`dashboards/*.spec.js` specs hardcode exact metric titles and section ordering. Those hardcoded
values match the recording, and the live check compares them with reality — so upstream data
changes break the live check by design. That is not a bug in the tests: a red "Live data tests"
means the recording is stale, and the fix is to update it in a separate pull request.

### Running the tests against live data

1. Run `npx playwright install chromium` once.
2. Run `npm run test:playwright:live`. It starts the local dev server and runs the specs against
   data.firefox.com.
3. To test a deployed site instead, run
   `PLAYWRIGHT_BASE_URL=https://data.firefox.com npm run test:playwright:live`. Any other
   environment works the same way; with `PLAYWRIGHT_BASE_URL` set, no local server is started.
4. If port 3000 is already in use by something else, start `npx vite --port 3001 --strictPort` in
   another terminal and run with `PLAYWRIGHT_BASE_URL=http://localhost:3001`.
5. Expect failures when upstream data has changed. Read them as "the recording is stale", not "the
   code is broken". The hardware dashboard renders slowly on the full live data (#409), so its
   "Charts render" test can need the retry.

### Updating the recorded data

1. Run `npm run record:fixtures`. It replaces `tests/playwright/fixtures/` with each dashboard's
   `index.json`, plus every metric and summary metric for the default region and for `Germany`
   where the dashboard supports regions, trimmed to the 12 most recent dates (the full hardware
   history runs to several megabytes).
2. Run `git diff --stat tests/playwright/fixtures` and skim it for unexpected changes: new or
   removed metrics, regions, titles, or odd populations such as a `"NULL"` bucket.
3. Run `npm run test:playwright:recorded`.
   - Failures in the `fixtures/` specs mean the data's shape changed, because those specs read
     their expected values from the recording.
   - Failures in the hardcoded-title specs (`dashboards/`) mean titles or ordering changed. Update
     the hardcoded expectations to match.
4. Run `npm run test:playwright:live`. It should now agree with the recorded run.
5. Commit the recording and any spec updates together, in one commit titled like "Re-record
   Playwright fixtures".

Tests describe the code as it is now. Assert what the code does; never add a test whose purpose is
to prove that removed behavior is absent — a negative assertion about history passes forever while
documenting nothing. Each test builds only the data it needs; there is no shared mega-fixture. Keep
assertions at the point where the thing is rendered rather than behind a `_getElement(wrapper)`-
style indirection layer, so a failure points straight at the markup it cares about.

## Footguns

| Trap | What happens |
|---|---|
| Switching branches without reinstalling | `node_modules` is not tied to git state. A branch switch can leave it holding packages from a different branch's `package.json` (a missing binary, a wrong dependency version resolved) that look like genuine bugs. Run `npm install` after every branch switch before trusting any command's output. |
| Gitignored `src/components/views/css/` | A fresh clone cannot resolve the CSS imports until `npm run build:css` runs. Never hand-edit `css/` — edit `styl/`. |
| Renaming a landmark ID | Breaks Playwright selectors silently. |
| `build:version.json` | Needs `build/` to already exist and `git` on PATH; must follow `build:app`. |
| `no-shadow` / `no-redeclare` with `builtinGlobals` | Naming a local `name`, `status`, `history`, `event` is a hard error. |
| `metrics-graphics` charts and `path.mg-line1` | Each chart renders many invisible `.mg-voronoi` hover paths that also carry the `mg-line1` class (confirmed: 292 matches for one chart), and a population with a single data point draws a zero-size line path, shown as a dot instead. To check that a chart drew a line, use `path.mg-main-line` with `.filter({ visible: true }).first()`. |

Known rot, recorded for recognition only, not as a roadmap: `react-app-polyfill` and
`babel-polyfill`, plus a `browserslist` of `>0.2%, not dead, not ie <= 10, not op_mini all`, were
IE11-era targeting — both removed in the Vite migration, since IE11 support was already effectively
dead. `dateformat@3.0.3` is several majors behind current, but the newer majors change its module
export shape in a way that needs call-site changes, not just a version bump — deliberately left
alone (see `docs/architecture/frontend.md`'s dependency-ceiling section). `distinct-colors@3.0.0`
has no newer major.

## Git workflow

Work on a dedicated branch named `<issue-number>--kebab-case-summary` (for example,
`409--hardware-resize-performance`). If the issue ID is not obvious from the request, ask for it,
along with a short summary for the branch name, then read
`https://github.com/mozilla/ensemble/issues/ISSUE_ID` before writing any code — many of these
issues are years old, and the discussion carries context the title doesn't.

Work that will not finish in one session, or that touches several files, a migration, or a tooling
replacement, gets a written design document — an ExecPlan — committed to `docs/execplans/` alongside
the change it describes. See that directory's own `README.md` for the shape; a single-file fix or
anything a commit title already describes does not need one.

## Commit and pull request guidelines

Keep commit titles short and imperative, and reference the issue when there is one (`Display times
using UTC timezone`, `Fix hardware resize thrash (#409)`).

This project maintains a hand-managed version number in `package.json` that is not semver — the
first digit for major changes, the second for medium, the third for small — historically bumped at
deploy time. Do not bump it casually; ask.

If a changeset adds a GitHub Action or workflow (there are none today), check it with
[Zizmor](https://zizmor.sh/) before considering the work complete.

### Writing PR descriptions

There is no `.github/PULL_REQUEST_TEMPLATE.md` in this repository, so use these four headings every
time: **One-line summary**, **Significant changes and points to review**, **Issue / Bugzilla
link**, **Testing**. Answer one that doesn't apply with `n/a` — one word is a complete answer, and
inventing content to fill a heading is worse than admitting it is empty.

A description directs the reviewer's attention. It does not restate the diff, and it does not
explain this codebase back to the team that owns it. Check what actually changed
(`git diff --stat main...`, plus a scan for config, fixtures, and deletions) before writing, so the
description matches reality.

Take length out of describing the change.

**One-line summary.** One or two sentences: what the change does, and why, where the title does not
already make that obvious. Compress rather than qualify. "Debounce the hardware chart resize
handler" beats a long sentence explaining the whole mechanism and its motivation — say the point
once, and let the bullets below carry the rest.

**Significant changes and points to review.** Short bullets, most significant first, one clause
each. Nest a sub-bullet only where a consequence needs one; never go past two levels. Name a file
where the file is the point — "Remove the unused `BrowserHacks.styl`" — and prefer the bare filename
when it identifies the thing on its own.

Rejected, as a first draft might read:

> - **Debounced resize handler** (`ChartContainer.jsx`) — the hardware dashboard was thrashing on
>   every resize. **This is the most critical part to review** — it's the redraw path every chart on
>   the site shares.

Replacement, as it should read:

> - Replace one unthrottled `resize` listener per chart with a single, debounced listener shared
>   across all `ChartContainer` instances.
> - The hardware dashboard's 11 charts no longer each trigger their own redraw on every resize event
>   (#409).

- Say what changed. Add why only where the change does not already imply it.
- Do not rate your own change. No "low risk," "mechanical," "straightforward," and never a reflexive
  "this is the most critical part to review" — most PRs have no such thing, and a rating carries
  nothing a reviewer can act on.
- Do flag a change that is genuinely high-risk or wide blast radius, in one line, stating its reach
  as a fact rather than a rating: a change to the `markdown-it` sanitization allowlist (reaches every
  metric description on the site), a renamed landmark ID (breaks the end-to-end suite silently), or
  anything touching `config.json`'s shape rather than just its content.
- A side-effect worth knowing about but not risky — a duplicate file deleted, a stray import removed
  — is a plain bullet like everything else.
- Fold low-risk, mechanical fallout — a regenerated lockfile, a renamed CSS class, a fixture update
  — into its own short item after the substantive bullets, so it doesn't crowd out what the reviewer
  actually needs to think about.
- Flag genuine uncertainty about your own work — distinct from rating risk. Naming a real unknown is
  often the most useful sentence in the description.
- Never explain mechanics the team already knows: why `react-refetch` isn't mocked in a test, how
  the container/view split works, what `flagForUpdate` does.
- Never describe your own process — not which approach you tried first, not what a review caught,
  not that the branch is stacked on another. Deliberately deferred scope is worth stating
  ("Ports the Nightwatch specs as-is; re-baselining the stale content assertions is a separate
  pass"), as is a change's provenance where it matters ("Matches the Playwright config shape already
  used in mozmeao/springfield and mozmeao/bedrock").

**Issue / Bugzilla link.** The full tracker URL, or `n/a`. List all of them where a change closes
more than one, and give context on a cross-reference: "Follow-up to #409, addressing the
WebKit-specific slowness noted while porting the end-to-end suite."

**Testing.** What a reviewer does by hand to check this. The one section worth expanding.

- Open with prerequisites where there are any: "Run `npm run build:css` first."
- Include setup commands a reviewer must run to see the change at all. Leave out test and lint
  commands (`npm test`, `npm run lint`) — those only re-check what CI already checks.
- Give the URL to load — `http://localhost:3000/dashboard/hardware`, not just "the hardware
  dashboard" — and the expected result once there.
- One step per thing to verify, phrased as a check — "Check the dashboard doesn't hang on resize,"
  not "resize the window → dashboard redraws instantly." `- [ ]` checkboxes where the reviewer is
  working through a list.
- Ask plainly for a close look when you want one.

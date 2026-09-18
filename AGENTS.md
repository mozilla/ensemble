# Repository Guidelines

## Project Structure & Module Organization

`ensemble` (v1.2.1, `private: true`, MPL-2.0, `git@github.com:mozilla/ensemble.git`) is the React app behind <https://data.firefox.com/> — the **Firefox Public Data Report**. It is a **pure client-side create-react-app SPA and it contains no data of its own.** Every metric is fetched at runtime from **[ensemble-transposer](https://github.com/mozilla/ensemble-transposer)** (separate repo), which reformats Mozilla's public telemetry and serves JSON from the same `data.firefox.com` domain. If a number on the site looks wrong, the bug is usually not here.

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

`react-refetch@3.0.1`'s `connect()` HOC **is the entire data layer** and is used in exactly those three files. Each one handles `dataFetch.pending` / `.rejected` / `.fulfilled` itself and renders `views/Spinner.jsx` or `views/Error.jsx`. All reshaping is client-side in each container's `formatData` (`ChartContainer` sorts populations by max y and drops nulls; `DataTableContainer` sorts rows by value descending).

Metric `description` strings are rendered as inline Markdown through `markdown-it('zero')` with only `link`/`entity`/`emphasis`/`sup` enabled, via `dangerouslySetInnerHTML`. `src/tests/jest/MetricOverview.test.jsx` exists **specifically to guard that sanitization** — never widen the enabled-rules list without extending that test.

```
src/
├── index.jsx                    entry: ReactDOM.render + BrowserRouter
├── config.json                  the route/dashboard table + next-button flow
├── registerServiceWorker.js     CRA helper; only unregister() is called (SW deliberately off)
├── setupTests.js                enzyme adapter; puts React and shallow on global
├── components/
│   ├── containers/              6 stateful/data-fetching .jsx
│   ├── decorators/              withTracker.jsx (react-ga), withNextButton.jsx
│   └── views/                   19 presentational .jsx
│       ├── styl/                Stylus SOURCE (hand-edited); includes/lib.styl
│       ├── css/                 GENERATED, GITIGNORED — holds only a README stub
│       ├── fonts/FiraSans/      8 weights/styles of webfonts
│       └── img/                 3 assets
├── lib/
│   ├── lazyLoad.jsx             react-loadable wrapper (spinner + error fallback)
│   └── utils.js                 bumpSort, isFloat, prettifyNumber, getPageTitle
└── tests/
    ├── jest/                    2 unit tests
    └── nightwatch/              13 e2e specs (.js, CommonJS), incl. dashboards/
```

There is no `pages/`, `store/`, `hooks/`, `api/`, `locales/`, or `data/`. `public/` is CRA's checked-in static template (`index.html` with `%PUBLIC_URL%` placeholders and a hardcoded `og:image`, `manifest.json`, `contribute.json`, a Search Console verification file, favicons). `build/` is gitignored output. Routes are exactly `/`, `/contact`, `/dashboard/<key>`, and a catch-all `NotFound`.

## Current state: read this before estimating anything

MozMEAO is taking this repo over. 810 commits — 515 in 2018, 92 in 2020, **nothing in 2021–2024**, three in 2025. Last commit `f655559`, 2025-05-07. Assume nothing has been exercised recently.

- **No CI/CD of any kind exists.** No `.github/`, `.circleci/`, `Dockerfile`, `docker-compose`, `Jenkinsfile`. This is not a quirk of your clone — it was all deliberately removed: CircleCI disabled 2018-02-22 (`433a465`), Docker/Dockerflow removed 2018-08-23 (`d3bb561`), `.github/dependabot.yml` deleted 2020-07-29 (`7c7006f`, "Disable non-security updates from Dependabot"). Issue #79 ("enable CI") is still open.
- **The deploy is a static build on Google Cloud Storage** (confirmed by `x-goog-*` headers on the live site). `https://data.firefox.com/version.json` reports `1.2.1` / commit `f655559`, so **the deployed site matches current `main`**. The mechanism that pushes `build/` to GCS is **not in this repo and is currently unknown** — finding and documenting it is takeover work, not something to guess at.
- **`npm install` fails outright on an Apple Silicon (arm64) Mac.** Confirmed: `chromedriver@84.0.1`'s postinstall exits with `Only Mac 64 bits supported` and takes the whole install down with it. Use `npm install --ignore-scripts` to get a working `node_modules` (you lose the chromedriver binary, which you can't use anyway — see the Nightwatch bullet below). This is a harder failure than "chromedriver's download URL changed"; it doesn't even try to download on this architecture.
- **Confirmed on Node v24.19.0:** `npm run build:app` (and therefore `npm run build`) fails with `ERR_OSSL_EVP_UNSUPPORTED` — webpack 4's chunk hashing uses MD4, which OpenSSL 3 (Node ≥17) rejects — and succeeds once prefixed with `NODE_OPTIONS=--openssl-legacy-provider`. `npm start` compiles through the same webpack pipeline, so expect to need the same prefix. **`npm run lint` and `npm run test:jest` both pass clean with no flag at all** — Jest never invokes webpack, so it never hits the MD4 path. The repo's only Node signal is `engines: node >=8`; there is **no `.nvmrc`**, and historical CI pinned Node 8.
- **`npm install` on npm ≥7 rewrites `package-lock.json` from lockfileVersion 1 to 3.** Confirmed: a ~22,000-line diff. Revert it after installing; don't let it ride along in an unrelated commit.
- **Nightwatch cannot run at all right now.** Its `chromedriver@84.0.1` dependency doesn't install (see above), so there is no chromedriver binary in `node_modules/.bin` to point Nightwatch at. Even setting that aside, Chrome 84 is mid-2020 and chromedriver must major-version-match the installed Chrome. Treat the whole e2e suite as blocked until this is deliberately fixed.
- **A fresh clone will not render styles until you compile Stylus.** `src/components/views/css/*` is gitignored and every component does a side-effect `import './css/Foo.css';` — run `npm run build:css` (confirmed working, no flags needed) or the app fails to resolve those imports.
- **Headline known bug: issue #409** — the hardware dashboard takes >10 s to re-render on resize/zoom and can trigger Firefox's slow-script dialog. Most user-visible defect; lives in the d3/metrics-graphics redraw path (`views/SummaryMetric.jsx`, `containers/ChartContainer.jsx`, `views/Chart.jsx`).
- ~40 open issues, oldest from 2018. Other notables: #313 (`MetricOverviewContainer` does not reject when metric data 404s — cited in an inline comment there), #395 (replace `request`), #333 (replace `@babel/polyfill`), #245 (React code-splitting), #46 (localize content). The remote also carries ~35 stale `dependabot/npm_and_yarn/*` branches and three `%archive-*` branches.
- Upstream data is **live and current** — transposer `dates` arrays are sorted newest-first and currently run to 2026-08-31. The app is unmaintained; the data is not.

## Build, Test, and Development Commands

```bash
npm install --ignore-scripts         # plain `npm install` fails on Apple Silicon; see Current State
                                      # expect package-lock.json to be rewritten v1 -> v3; revert it after

NODE_OPTIONS=--openssl-legacy-provider npm start
                                      # npm-run-all --parallel watch:css watch:app -> CRA dev server :3000
                                      # .env sets BROWSER=firefox, so this opens Firefox
npm run build:css                    # one-shot Stylus compile; confirmed working, no flags needed

npm run lint                         # lint:js-extra (standalone ESLint) + lint:styl (stylint); confirmed clean, no flags
npm run test:jest                    # CI=true react-scripts test (Jest + enzyme, 2 files); confirmed passing, no flags
npm test                             # lint -> test:jest -> test:nightwatch:dev; the Nightwatch leg cannot run today

NODE_OPTIONS=--openssl-legacy-provider npm run build:app     # confirmed required on Node >=17; fails with ERR_OSSL_EVP_UNSUPPORTED otherwise
npm run build:version.json           # writes build/version.json; must run after build:app, needs git on PATH
npm run size                         # source-map-explorer on build/static/js/main.* (needs a prior build)
```

Run one Jest file by passing a path through: `CI=true npx react-scripts test src/tests/jest/Dashboard.test.jsx` (confirmed working).

**Environment:** `.env` **is checked into git** and holds only public build-time config — `BROWSER=firefox`, `NODE_ENV=development`, `REACT_APP_GA_TRACKING_ID='UA-00000000-0'` (placeholder), `REACT_APP_SITE_TITLE='Firefox Public Data Report'`, `REACT_APP_VALUE_DECIMAL_PLACES=3`. Consumed by `decorators/withTracker.jsx` and `lib/utils.js`. Override inline: `REACT_APP_SITE_TITLE='…' npm start`.

## Coding Style & Naming Conventions

- **`.jsx` for any file containing JSX** — including `src/index.jsx` and `*.test.jsx`. Plain `.js` only for non-JSX modules (`lib/utils.js`, `setupTests.js`, `registerServiceWorker.js`, all Nightwatch specs).
- **PascalCase filenames matching the default-exported component.** Decorators are camelCase with a `with` prefix; `lib/lazyLoad.jsx` is camelCase.
- **One component per file, always `export default`.** There are no named component exports anywhere in the repo; the only named exports at all are the four helpers in `lib/utils.js`.
- **The container/view split is the organizing principle.** `containers/X.jsx` holds state and fetching and renders `views/X.jsx` with formatted props (`ChartContainer`→`Chart`, `DataTableContainer`→`DataTable`). Keep new state out of `views/`.
- Function components are the default (17 of 19 views), written as anonymous default-exported arrows — `export default props => (...)` — with no `displayName` (hence `react/display-name: off`). Use a class only where state, refs, or lifecycle are genuinely needed: all 6 containers plus `SummaryMetric.jsx` (d3 + `React.createRef`), `Spinner.jsx`, `MetricOverview.jsx`, `Footer.jsx`.
- Leading underscore for private class-property handlers (`_onRegionChange`, `_drawChart`, `_setChartWidth`) — applied inconsistently (`setChartSize` in `ChartContainer.jsx`); prefer the underscore in new code.
- Locals named `maybeX` hold a JSX fragment **or `null`** (`maybeDescription`, `maybeSummaryMetrics`, `maybeRegion`, `maybeGraphURL`). Keep the idiom.
- Styles attach via a global CSS side-effect import of the **generated** file at the top of the component: `import './css/Dashboard.css';`. Some components import several (`Chart.jsx` pulls `metrics-graphics/dist/metricsgraphics.css`, `./css/Chart.css`, `./css/Metric.css`). `Metric.css` and `LabelledSelector.css` are shared partials with no component of their own.
- No TypeScript, no PropTypes, no CSS-in-JS or CSS Modules, no Prettier, no i18n. **No MPL license headers on source files** (unlike springfield/bedrock) — do not add them.
- `.editorconfig`: LF, final newline, trim trailing whitespace, 4-space indent for `py,yml,html,css,styl,js,json,md`. `.jsx` is missing from that list but 4-space is the de facto convention. No max line length is configured anywhere.
- Every dependency is **exact-pinned** — no `^` or `~` in `package.json`. Keep it that way.

**ESLint — there are two of them, and neither sees everything.** `.eslintrc.extra.js` is a standalone config run only by `npm run lint:js-extra`, and that script is `npx eslint --config .eslintrc.extra.js --ext .js --ext .json .` — **`.jsx` is not in the `--ext` list, so the bulk of the application code is never linted by it.** Separately, `react-scripts` 3.4.1 lints during `start`/`build` using its own bundled `eslint-config-react-app`, which appears nowhere in this repo and has no `eslintConfig` key in `package.json`. **Consequence: a change can pass `npm run lint` and still fail `npm run build`, and vice versa.** Run both.

`.eslintrc.extra.js` errors: `eqeqeq`, `no-var`, `prefer-const`, `no-console`, `no-global-assign`, `no-redeclare` and `no-shadow` — the latter two with `builtinGlobals: true`, so **do not name a variable `name`, `status`, `history`, `event`, etc.** Warnings: `semi: always`, `prefer-arrow-callback`, `comma-dangle` (trailing commas **required** for multiline arrays/objects/imports/exports, **never** for function args/params). Off: `react/prop-types`, `react/display-name`, `jsx-a11y/no-onchange`. `react/no-unescaped-entities` forbids only `>` and `}`. `jsx-a11y/recommended` is on, so a11y violations are errors. **Quote style is not enforced** (there is no `quotes` rule) — single quotes by convention. `.eslintignore` covers `build` and `package-lock.json`.

## Styling: Stylus, outside webpack

`src/components/views/styl/*.styl` → `src/components/views/css/*.css` via the `stylus` CLI (`build:css` / `watch:css`). Webpack never sees the Stylus. One `.styl` per component (PascalCase, mirroring the component), plus `Application.styl` (global reset, Fira Sans `@font-face`, body type, ~217 lines), `BrowserHacks.styl`, and shared partials `Metric.styl` and `LabelledSelector.styl`.

Shared variables live in `src/components/views/styl/includes/lib.styl` and it is nearly empty — `$base-tablet`, `$base-desktop`, `$link-color-normal = #0070ff`, and a `// TODO: padding/margin spacing.`. Import it per-file with `@import 'includes/lib'`; it is not globally injected. **No mixins file; most colors are hardcoded hex inline** (stylint's `colors` check is off).

**Not BEM.** ID selectors carry the page landmarks — `#application`, `#main-header`, `#main-navigation`, `#dashboard`, `#dashboard-sections`, `#summary-metrics`, `#region`, `#introduction` — with flat lowercase-dash classes for repeated pieces (`.metric-overview`, `.dashboard-section`, `.data-table-wrapper`, `.labelled-selector`, `.next-button`, `.striped`, `.highlighted`, `.bar-label`). Descendant nesting with `&` for states; responsive via `@media $base-tablet` / `@media $base-desktop` blocks at the bottom of each file. **Those element IDs are also the Nightwatch selectors — renaming one breaks the e2e tests.**

stylint (`.stylintrc`) runs with `maxErrors: 0` and `maxWarnings: 0`, so any finding fails the lint. It enforces the **CSS-like** Stylus dialect, not the terse indented syntax: 4-space indent, single quotes, `brackets: always`, `colons: always`, `semicolons: always`. Also `noImportant: true`, `leadingZero: false` (`.5`, not `0.5`), `zeroUnits: never` (`0`, not `0px`), `universal: never` (no `*`), `prefixVarsWithDollar: always`, `namingConvention: lowercase-dash` with `namingConventionStrict: true`, `zIndexNormalize: 10`. Escape hatches are `// @stylint off` / `on` / `ignore` comments — see the `@font-face` block in `Application.styl`.

## Writing code for the next reader

Code is read far more often than it is written, and in this repo the next reader is arriving after a five-year gap. Optimise for them.

- Use full, descriptive names. No single letters, no invented abbreviations. `activeRegion`, not `r`.
- Comments explain **what and why**, briefly, and only where the logic is non-obvious. Well-named code needs none. Delete comments that restate the code.
- **Comments must stand on their own.** Never reference a spec, a plan document, a requirement label, or a ticket ID *as* the explanation — the comment must make sense to someone who has only the file in front of them. A cross-reference alongside a self-contained explanation is fine; that is how the `metrics-graphics` workaround notes in `views/Chart.jsx` read.
- Never describe code that no longer exists. After a refactor, delete the comments it falsified — this repo already has several. Prefer deleting an obsolete comment, branch, or test over leaving it beside its replacement.

## Testing Guidelines

**Jest + enzyme**, through CRA's built-in Jest, with no `jest` config block. Only two files, both in `src/tests/jest/`, named `PascalCase.test.jsx` — **not colocated, no `__tests__` directories.** `src/setupTests.js` puts `React` and `shallow` on `global`, so **test files import neither**: they `import Dashboard from '../../components/views/Dashboard';` and call bare `shallow(<Dashboard … />)`. Existing style is top-level `it(...)` with long descriptive sentences, a `beforeAll` that builds a `requiredProps` object, and assertions via `.find(selector).exists()` and `.html()).toContain(...)`. Shallow rendering only; no snapshots; `react-refetch` is never mocked; there are no container tests.

**Nightwatch** specs in `src/tests/nightwatch/` are **lowercase `.js`, CommonJS**: `module.exports = { before: browser => …, 'Test name as a sentence': browser => … }`. `nightwatch.conf.js` reads `NIGHTWATCH_TARGET` (`dev` = localhost:3000, `stage` = data-ensemble.stage.mozaws.net, `prod` = data.firefox.com) and **throws if it is unset** — it destructures `undefined`. The `default` env is headless Chrome and excludes `utils.js` and `jsDisabled.js`; the `jsDisabled` env runs only `jsDisabled.js` and must be **non-headless** (JS cannot be disabled in headless Chrome), asserting on the `id="enable-javascript"` `<noscript>` block in `public/index.html`. `src/tests/nightwatch/utils.js` exports `linkWorks`, `linksWork`, `metricTitleIsCorrect`, and `flagForUpdate` — which **deliberately fails when an element count changes**, to force a human to look. The `dashboards/*.js` specs assert exact metric titles and section ordering **against live production data**, so upstream data changes break them by design. `test:nightwatch:dev` does **not** start the dev server; `npm start` must already be running in another shell. None of this can run today — see Current State.

**Tests describe the code as it is now.** Assert what the code does; never add a test whose purpose is to prove that removed behaviour is absent — a negative assertion about history passes forever while documenting nothing. Each test builds only the data it needs; no shared mega-fixture. Keep assertions at the point where the thing is rendered rather than behind a `_getElement(wrapper)`-style indirection layer, so a failure points straight at the markup it cares about.

## Footguns

| Trap | What happens |
|---|---|
| `npm install` on Apple Silicon | Fails outright — chromedriver@84 postinstall: `Only Mac 64 bits supported`. Use `--ignore-scripts`. |
| Two linters, disjoint coverage | `npm run lint` only covers `.js`/`.json`; CRA lints `.jsx` during `build`. Green lint ≠ green build. Run both. |
| Gitignored `src/components/views/css/` | Fresh clone cannot resolve the CSS imports until `npm run build:css` runs. Never hand-edit `css/` — edit `styl/`. |
| Renaming a landmark ID | Breaks Nightwatch selectors silently until the e2e suite runs — and it can't run at all right now. |
| `NIGHTWATCH_TARGET` unset | `nightwatch.conf.js` throws on load, before any test runs. |
| `build:version.json` | Needs `build/` to already exist and `git` on PATH; must follow `build:app`. |
| `.eslintrc.extra.js` override glob | Declares the `React`/`shallow` globals for `src/tests/jest/*.js`, but the files are `.jsx` — **the override never matches**. |
| `no-shadow` / `no-redeclare` with `builtinGlobals` | Naming a local `name`, `status`, `history`, `event` is a hard error. |
| `npm install` on npm ≥7 | Rewrites `package-lock.json` v1 → v3. |

**Known rot, for recognition only — this file is not a roadmap:** `.eslintrc.extra.js` sets `parser: './node_modules/babel-eslint'` (a hard relative path into a *transitive* dependency) and `settings.react.version: "16.4.2"` while React 16.13.1 is installed; `eslint` is not a direct dependency, so `lint:js-extra` goes through `npx` and relies on a hoisted transitive `eslint@6.8.0`; `babel-polyfill` + `react-app-polyfill` and a `browserslist` of `>0.2%, not dead, not ie <= 10, not op_mini all` are IE11-era targeting; `request@2.88.2` is deprecated (#395); `registerServiceWorker.js` exists but only `unregister()` is called.

## Workflow guidelines

- Work on a dedicated branch named `<issue-number>--kebab-case-summary` (e.g. `409--hardware-resize-performance`).
- If the issue ID is not obvious from the request, **ask for it**, along with a short summary for the branch name. Then fetch <https://github.com/mozilla/ensemble/issues/ISSUE_ID> and read the description before writing code — many of these issues are 5+ years old and the discussion carries context the title does not.
- When the work looks complete, **offer to run the tests**. Say which suites are actually runnable in the current environment rather than claiming a green run you could not produce.

### ExecPlans

Work that spans more than one session — the ESLint unification, replacing the blocked Nightwatch suite, #409's redraw path — gets an **ExecPlan**: a self-contained Markdown design document, written before the code, committed with it, and kept current as the work moves. The specification is `.claude/skills/execplans/references/PLANS.md`; the `execplans` skill loads it on demand, so read it there rather than guessing at the shape.

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
- Never explain mechanics the team already knows: why `react-refetch` isn't mocked in a test, how the container/view split works, what `flagForUpdate` does.
- Never describe your own process. Not which approach you tried first, not what a review caught, not that the branch is stacked on another. Two things that look similar but are worth keeping: deliberately deferred scope — "Ports the Nightwatch specs as-is; re-baselining the stale content assertions is a separate pass" — and a change's provenance if it matters — "Matches the Playwright config shape already used in mozmeao/springfield and mozmeao/bedrock".

**Issue / Bugzilla link.** The full tracker URL, or `n/a`. List all of them where a change closes more than one, and give the context on a cross-reference: "Follow-up to #409, addressing the WebKit-specific slowness noted while porting the e2e suite."

**Testing.** What a reviewer does by hand to check this. The one section worth expanding.

- Open with prerequisites where there are any: "Run `npm run build:css` first" or "Needs `tests/playwright/` installed separately — see its README."
- Include setup commands a reviewer must run to see the change at all. Leave out test and lint commands — `npm test`, `npm run lint`, `npx playwright test` — those only re-check what CI (once it exists) already checks.
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
- This is a fully client-side bundle: anything in a `REACT_APP_*` variable ships to the browser in plain text.
- If a changeset adds a GitHub Action or Workflow (there are none today), check it with [Zizmor](https://zizmor.sh/) before considering the work complete.

## LLM assistance

* When committing code, do not list the LLM as a co-author - it is a tool, not a developer. All code committed is the responsibility of the human developer using the LLM. This is in line with <https://firefox-source-docs.mozilla.org/contributing/ai-coding.html>

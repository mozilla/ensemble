# Modernize the build, test, and lint toolchain so the site runs on Node 24

This ExecPlan is a living document. The sections `Progress`, `Surprises & Discoveries`,
`Decision Log`, and `Outcomes & Retrospective` must be kept up to date as work proceeds. This
document must be maintained in accordance with the specification checked in at
`.claude/skills/execplans/references/PLANS.md`, including its "Ensemble addendum" section, which
overrides the upstream text where the two disagree.

## Purpose / Big Picture

Today, a fresh checkout of this repository cannot be built or fully installed with a plain `npm
install` on the most recent stable version of Node (Node 24.19.0), and its end-to-end
test suite cannot run at all. Two specific, confirmed failures cause this: `chromedriver@84.0.1`
(a transitive dependency of the `nightwatch` end-to-end test runner) fails its install step
outright on Apple Silicon with "Only Mac 64 bits supported", and `react-scripts` (the
`create-react-app` build tool, referred to below by its common abbreviation "CRA") produces a
build tool ("webpack 4") old enough that it calls into an OpenSSL API Node removed, failing with
`ERR_OSSL_EVP_UNSUPPORTED` unless the developer remembers to set
`NODE_OPTIONS=--openssl-legacy-provider` on every build and every dev-server start. Both of these
are confirmed by running the actual commands in "Concrete Steps" below, on this machine, today.

After this plan, a developer will be able to clone this repository, run `npm install` with no
special flag, run `npm start` with no environment variable workaround, run `npm run build:app`
with no environment variable workaround, run the unit tests, and run the full end-to-end test
suite — all on Node 24, all without any of the four blockers above. Concretely: `create-react-app`
is replaced with Vite (a modern build tool and dev server), Jest (which only worked before because
`react-scripts` quietly configured it) is replaced with Vitest (a test runner built on the same
engine as Vite), Nightwatch is replaced with Playwright (a modern end-to-end test runner that
manages its own browser binaries instead of depending on a separately-versioned `chromedriver`
package), and the two previously-incomplete ESLint configurations are unified into one. This is
exactly the scope of GitHub issue #441, "Update toolchain"
(<https://github.com/mozilla/ensemble/issues/441>), whose body reads in full: "As a first step to
doing any work on this code base, let's modernize the tool chain: CRA → Vite, Jest → Vitest,
Nightwatch → Playwright." Separately, this plan also brings a set of this repository's other
dependencies up to date where doing so is safe without touching application code — see Milestone
5.

What this plan deliberately does not do: it does not upgrade React itself (currently 16.13.1), does
not touch `react-router-dom`'s major version (currently 5.2.0), and does not replace
`react-refetch` or the `metrics-graphics`/`react-metrics-graphics` charting stack. All three are
verified below (see "Context and Orientation") to be hard-capped to React's 15/16 line by their own
`package.json` `peerDependencies` — upgrading React is a separate, much larger initiative that
would require replacing the data-fetching layer and the charting library at the same time, not a
toolchain change.

A person reading only this file, with only a working copy of this repository and no other memory of
this conversation, should be able to execute every milestone below and end up with a repository
that passes the acceptance criteria in "Validation and Acceptance."

## Progress

- [x] (2026-09-15) Read `AGENTS.md`, `README.md`, `CONTRIBUTING.md`, and
      `.claude/skills/execplans/references/PLANS.md` to establish this repository's conventions.
- [x] (2026-09-15) Found and read GitHub issue #441, "Update toolchain," which states this
      plan's scope exactly (CRA → Vite, Jest → Vitest, Nightwatch → Playwright).
- [x] (2026-09-15) Discovered a local, unpushed branch named `toolchain` that already contains a
      complete implementation of this same migration, and validated it hands-on in an isolated
      `git worktree` (not the working tree of this branch): a plain `npm install` completed with
      no `--ignore-scripts` flag and no chromedriver failure, `npx vite build` succeeded with no
      `NODE_OPTIONS` flag, `npx vitest run` passed both existing unit test files, `npm run lint`
      passed cleanly, the Vite dev server served the application, and `npx playwright test --list`
      correctly enumerated 149 ported end-to-end tests across 12 files. Presented this discovery to
      the user, who explicitly chose to start this plan's implementation fresh rather than
      cherry-pick or merge that branch's commits (see Decision Log). The `toolchain` branch is left
      untouched and is not depended on by anything below.
- [x] (2026-09-15) Created branch `441--update-toolchain` off `clean-up` (the branch active in this
      working tree at the time), per the user's explicit choice (see Decision Log).
- [x] (2026-09-15) Verified today's baseline on this branch, on this machine (Node v24.19.0, npm
      11.17.0): a fresh `npm install --ignore-scripts` installs successfully (2007 packages, 251
      vulnerabilities: 12 low, 136 moderate, 82 high, 21 critical); `npm run build:app` with no
      flag fails with `ERR_OSSL_EVP_UNSUPPORTED`; `react-metrics-graphics`'s and `react-refetch`'s
      `peerDependencies` both cap React to the 15/16 line; `react-loadable` (via
      `src/lib/lazyLoad.jsx`) is used at 7 call sites, not the 2 previously assumed elsewhere,
      across `src/components/views/Main.jsx` (4 sites) and `src/components/views/MetricOverview.jsx`
      (3 sites); the 21 critical `npm audit` findings trace, via `fixAvailable` paths and direct
      package names, overwhelmingly to `nightwatch`, `chromedriver`'s dependency tree, and
      `react-scripts`, with the remainder resolvable once those are gone (see "Concrete Steps" for
      the full command and output). Full details of every check are recorded in "Context and
      Orientation" and "Concrete Steps" below.
- [x] (2026-09-15) Looked up current published versions and Node engine requirements for every
      package this plan adds, recorded in "Interfaces and Dependencies" below. Notably, Vitest
      5.0.1's own `engines.node` field is `^22.12.0 || ^24.0.0 || >=26.0.0` — narrower than Vite's,
      ESLint's, or Playwright's own requirements — which is why this plan pins `package.json`'s
      `engines.node` to `^24.0.0` rather than a broader range (see Decision Log).
- [x] (2026-09-15) Milestone 1 complete: `react-scripts`, `react-app-polyfill`, and `babel-polyfill`
      removed; `vite` 8.3.0 and `@vitejs/plugin-react` 6.1.1 added; `stylus` bumped from 0.54.7 to
      0.64.0 ahead of the Milestone 5 schedule (a hard prerequisite discovered during this
      milestone, see Surprises & Discoveries); `index.html` moved to the repository root and
      adapted; `src/index.jsx` and `src/components/views/Application.jsx` no longer reference IE11
      scaffolding; every `REACT_APP_*` reference renamed to `VITE_*` **and** switched from
      `process.env.X` to `import.meta.env.X` (a correction to this plan's original wording, which
      only mentioned the rename — see Surprises & Discoveries); `package.json` updated (`engines`,
      scripts, `size`, `browserslist` removed); `.nvmrc` added; `react-loadable` replaced with
      `React.lazy`/`Suspense` plus a new `src/lib/LazyBoundary.jsx` error-boundary component, after
      hands-on browser verification showed the direct port genuinely does break (see Surprises &
      Discoveries) — this was anticipated as a documented contingency in this plan's original Plan
      of Work, not a new decision. Verified with a real headless-browser session (Playwright,
      installed ad hoc, not yet a project dependency — that happens in Milestone 4): every route
      (`/`, `/contact`, `/dashboard/hardware`, `/dashboard/usage-behavior`,
      `/dashboard/user-activity`) renders against the production build (`vite build`) with zero
      console errors and real chart data (15, 2, and 5 `<svg>` elements respectively, fetched live
      from the transposer service).
- [x] (2026-09-15) Milestone 2 complete: `vitest` 5.0.1 and `jsdom` 30.0.1 added; `vite.config.mjs`
      extended with a `test` block (switching its `defineConfig` import from `vite` to
      `vitest/config`, which re-exports the same function with the added `test` key recognized);
      `package.json`'s `test:jest` script changed to `vitest run`. No surprises this time — both
      existing test files (`Dashboard.test.jsx`, `MetricOverview.test.jsx`) passed unmodified on the
      first attempt, including their CSS side-effect imports, which Vitest's `jsdom` environment
      handled with no extra configuration as this plan expected. `npx vite build` re-verified working
      after the config change.
- [x] (2026-09-15) Milestone 3 complete, with one correction to this plan's original version choice
      (see Surprises & Discoveries): ESLint pinned to 9.39.5, not 10.10.0, because
      `eslint-plugin-react`'s and `eslint-plugin-jsx-a11y`'s latest published versions both cap their
      own `eslint` peer dependency at `^9`, not yet supporting ESLint 10. `eslint-plugin-json` was
      dropped entirely rather than added, since this plan's own Milestone 3 text already reasoned
      that `package.json` linting is unnecessary (a malformed `package.json` breaks every npm command
      immediately) — it had been listed as a devDependency to add in this plan's original draft by
      inertia from the old config, which was an internal inconsistency in the draft, not a deliberate
      choice; this correction resolves it by not installing it at all. `@eslint/js` was added
      explicitly (imported directly by the new config) even though it resolves transitively today.
      `eslint.config.js` created at the repository root (CommonJS, matching this repository's default
      module type — there is no `"type": "module"` in `package.json`); `.eslintrc.extra.js` and
      `.eslintignore` deleted. `npx eslint .` surfaced 16 new errors (all `no-undef` on Vitest's
      ambient `it`/`expect`/`beforeAll` globals in the two test files — fixed by adding
      `globals.vitest` to that file glob's `languageOptions.globals`, alongside the existing `React`/
      `shallow` globals `src/setupTests.js` already provides) and 9 new stylistic warnings in
      previously-`.jsx`-unlinted files (missing semicolons, disallowed trailing commas) — all 9 were
      auto-fixed with `eslint . --fix` and produced no behavior change. Confirmed JSX coverage is
      real, not assumed: temporarily introduced `if (1 == 1) {}` into `Spinner.jsx`, confirmed
      `eqeqeq`/`no-constant-condition`/`no-empty` all fired, then reverted with zero resulting diff.
      `npm run lint` (now `lint:js` + `lint:styl` only) exits 0; `npx vite build` and `npx vitest
      run` re-verified passing after every change in this milestone.
- [x] (2026-09-15) Milestone 4 complete, with one scope correction from the original draft (see
      Decision Log): `@playwright/test` 1.63.0 added; `nightwatch`, `chromedriver`, and `request`
      removed; `playwright.config.js` created at the repository root (`tests/playwright/specs` as
      `testDir`, `webServer` running `npm start` so a fresh checkout needs no manually-started dev
      server, `expect.timeout: 10000` and a global `timeout: 60000` — both above Playwright's
      defaults, justified in Surprises & Discoveries — and `retries: 1` locally /
      `2` in CI). All 13 files under `src/tests/nightwatch/` (12 spec files plus `utils.js`) ported
      to `tests/playwright/specs/` and `tests/playwright/utils.js`, then `nightwatch.conf.js` and
      `src/tests/nightwatch/` deleted only after every ported file was confirmed discovered by
      `npx playwright test --list` and then actually run. `package.json`'s `test` script now runs
      `lint`, `test:jest`, and the new `test:playwright` (`playwright test`); the three
      `test:nightwatch:*` scripts are gone. `.gitignore`'s dead `/*driver.log`/`/tests_output`
      entries replaced with Playwright's own `/test-results` and `/playwright-report`.
      **Scope correction:** dropped from three browser projects to two (`chromium`,
      `chromium-no-js`) — see Decision Log; this matches `nightwatch.conf.js`'s own scope exactly
      rather than expanding it. Final state, run against the dev server: 49 of 51 tests pass
      reliably; the 2 remaining failures are genuine, disclosed, pre-existing issues external to
      this migration (see Surprises & Discoveries), not defects in the port.
- [x] (2026-09-15) Milestone 5 complete. Bumped, each verified individually with a full
      `build:css` + `vite build` + `vitest run` + `lint` pass (and, for the d3 packages and
      `markdown-it`, a live-browser or existing-unit-test check too): `react-router-dom` 5.2.0 →
      5.3.4; `npm-run-all` 4.1.5 → `npm-run-all2` 9.0.3 (confirmed the `npm-run-all` binary name
      still resolves — `npm run build`, which chains through it, works unchanged); `d3-scale` 3.2.1
      → 4.0.2, `d3-selection` 1.4.2 → 3.0.0, `d3-shape` 1.3.7 → 3.2.0 (verified `Chart.jsx`'s charts
      render correctly live; `SummaryMetric.jsx`'s usage of `d3-scale`/`d3-selection` is not
      currently exercised by any of the three live dashboards, so only build success — not visual
      output — verifies it, see Surprises & Discoveries); `markdown-it` 11.0.0 → 15.0.2,
      `markdown-it-sup` 1.0.0 → 2.0.0 (the existing `MetricOverview.test.jsx` already directly
      exercises the security-relevant `<script>`-escaping behavior and passed unmodified);
      `memoize-one` 5.1.1 → 6.0.0, `react-ga` 3.1.1 → 3.3.1, `react-spinners` 0.9.0 → 0.17.1
      (verified together via a full Playwright run: same 49-of-51 pass rate as before this
      milestone, confirming no regression); `source-map-explorer` 2.4.2 → 2.5.3 (not in this plan's
      original list — added during this milestone since it was a same-major, clearly safe bump
      `npm outdated` surfaced). Removed `d3-transition` entirely (confirmed unused, see Milestone
      1's Surprises & Discoveries). Fixed an unrelated, pre-existing latent bug this milestone's
      testing surfaced: `npm run size` fails outright since Milestone 1's Vite migration (not caused
      by this milestone's bumps — confirmed by reproducing with both the old and new
      `source-map-explorer` version) — see Surprises & Discoveries. Left unchanged, each with the
      reason repeated here for a reader who reaches Milestone 5 without the earlier context: `react`/
      `react-dom`/`react-test-renderer`/`enzyme-adapter-react-16` (hard-capped at 16 by
      `react-metrics-graphics`/`react-refetch`), `eslint`/`@eslint/js` (hard-capped at 9.x by
      `eslint-plugin-react`/`eslint-plugin-jsx-a11y`, see Milestone 3), `metrics-graphics`/
      `react-metrics-graphics` (the charting stack this ceiling is named for), `dateformat` (a
      3-major jump changing its module export shape, needing call-site changes — application-code
      work, out of scope), `distinct-colors` (no newer major exists). Final state, verified with a
      fresh `rm -rf node_modules && npm install`: `npm audit` reports 17 vulnerabilities (3
      moderate, 14 high, 0 critical) — down from the pre-Milestone-1 baseline of 251 (12 low, 136
      moderate, 82 high, 21 critical). All 21 critical findings are gone; per Milestone 1's
      research, those traced almost entirely to `react-scripts`, `nightwatch`, `chromedriver`, and
      `request`, all four of which are now removed.
- [ ] Milestone 6: documentation updates and full clean-room validation on Node 24.

The user has not yet confirmed this six-milestone breakdown. Per this repository's ExecPlan
addendum, no milestone below is executed until that confirmation is given.

## Surprises & Discoveries

- Observation: the local `toolchain` branch, authored the day before this plan, already implements
  this exact migration and was confirmed working on today's machine and Node version.
  Evidence: see the Progress entry above; full command transcripts were captured during this
  research but are not reproduced in this plan's "Concrete Steps," since the user chose not to
  build on that branch (see Decision Log) and a novice following this plan will not touch it.
- Observation: `react-loadable` (via `src/lib/lazyLoad.jsx`) has 7 call sites, not 2. A prior,
  unrelated exploration of this codebase (visible only in the now-abandoned `toolchain` branch's
  own planning notes, not in anything this plan depends on) had assumed 2.
  Evidence: `grep -rn "lazyLoad" src/` lists 4 call sites in `src/components/views/Main.jsx`
  (`Home`, `Contact`, `DashboardContainer`, `NotFound`) and 3 in
  `src/components/views/MetricOverview.jsx` (`ChartContainer`, `CustomizableDateContainer`,
  `DataTableContainer`).
- Observation: `d3-transition`, a direct (non-transitive) dependency in `package.json`, has zero
  usages anywhere in `src/`. `metrics-graphics` bundles its own separate copy of `d3` (pinned to
  `^4` in its own `package.json`, confirmed by reading
  `node_modules/metrics-graphics/package.json`), so ensemble's own `d3-scale`, `d3-selection`, and
  `d3-shape` imports (in `src/components/views/SummaryMetric.jsx` and `Chart.jsx`) are independent
  of it and safe to consider separately.
  Evidence: `grep -rn "d3-transition\|\.transition(" src/` returns no matches.
- Observation: Vitest 5.0.1 requires Node `^22.12.0 || ^24.0.0 || >=26.0.0` — it excludes Node 20,
  21, 23, and 25 even though those satisfy Vite's, ESLint's, and Playwright's own floors. This is
  the binding constraint on this repository's new `engines.node` field.
  Evidence: `npm view vitest@5.0.1 engines` prints exactly that string.
- Observation: adding `vite`/`@vitejs/plugin-react` while `react-scripts` (and its own transitive
  Babel 7 tree) was still installed produced an unresolvable npm peer-dependency conflict
  (`@vitejs/plugin-react`'s optional peer `@rolldown/plugin-babel` wants `@babel/core@^7.29.0 ||
  ^8.0.0-rc.1`, which collided with the version already resolved from `react-scripts`'s tree).
  Removing `react-scripts` first, then adding Vite, avoided the conflict entirely with no `--force`
  or `--legacy-peer-deps` needed. This changes this plan's own Milestone 1 sequencing (remove the
  old toolchain, then add the new one) but not its content.
  Evidence: the exact `npm error ERESOLVE` transcript is not reproduced here; the fix (uninstall
  `react-scripts`/`react-app-polyfill`/`babel-polyfill` before installing `vite`) is what matters
  for a future reader re-running this milestone.
- Observation: Vite 8.3.0 has its own optional peer dependency, `stylus@">=0.54.8"` (Vite bundles
  Stylus-preprocessing support for `.styl` imports, a feature this repository does not use since its
  own separate `stylus` CLI pipeline is independent of Vite's build). This repository's `stylus` was
  pinned at 0.54.7 — one patch version below that floor — which blocked installing Vite at all until
  `stylus` was bumped. This forced Milestone 5's planned `stylus` 0.64.0 bump to happen inside
  Milestone 1 instead, ahead of schedule; `npm run build:css` was re-verified working immediately
  after the bump, before touching anything else.
  Evidence: `npm error ... peerOptional stylus@">=0.54.8" from vite@8.3.0`, `Found: stylus@0.54.7`.
- Observation: this plan's original "Plan of Work" for Milestone 1 said to rename `REACT_APP_*` to
  `VITE_*` but did not mention that the access pattern must also change, from `process.env.X` to
  `import.meta.env.X`. Vite does not populate `process.env` in browser code the way `react-scripts`/
  webpack's `DefinePlugin` did for `REACT_APP_*` variables specifically — `process` is not defined
  in a Vite-built browser bundle at all outside of the one special-cased `process.env.NODE_ENV`
  expression Vite replaces for library-compatibility reasons. This was caught and fixed while
  editing `src/components/decorators/withTracker.jsx` and `src/lib/utils.js`, before any build was
  attempted, by recognizing the gap while applying Vite's own environment-variable convention — not
  by a failed build. Recorded here so this plan's own gap doesn't reappear in a future read-through.
  Evidence: the three corrected call sites are named in the Progress entry above.
- Observation: `react-loadable`'s `Loadable()` factory does not work under Vite/Rollup — confirmed
  hands-on, not just inferred. A real headless-browser session against `npm start` showed the home
  page rendering completely blank, with a caught React error: "Element type is invalid: expected a
  string ... or a class/function ... but got: object. Check the render method of
  `LoadableComponent`." `react-loadable` was built assuming webpack's specific interop shape for a
  dynamic `import()`'s resolved value; Vite/Rollup's native ES module dynamic import instead resolves
  to a plain module-namespace object (`{ default: Component }`), which `react-loadable` does not
  unwrap correctly. This is exactly the contingency this plan's Milestone 1 section already
  anticipated and described a fallback for (switching to `React.lazy`/`Suspense`) — applying that
  fallback fixed it completely, confirmed by the same kind of hands-on browser check afterward.
  Evidence: the full browser console transcript showing the `LoadableComponent`/"Element type is
  invalid" error is not reproduced here for length; the fix and its own verification are recorded in
  the Progress entry above.
- Observation: on a cold Vite dev server (`npm start`, not a production build), navigating directly
  to a deep route (`/dashboard/hardware`) as the very first request can trigger one "504 (Outdated
  Optimize Dep)" response and one "Failed to fetch dynamically imported module" error, because
  Vite's dependency pre-bundler discovers `metrics-graphics`'s large bundled dependency tree only
  once that route's lazy-loaded chunk is requested, invalidating its already-served pre-bundle
  mid-request. A single page reload immediately after resolves it with zero further errors, and a
  normal user session — which starts at `/` and clicks through the app's own navigation, rather than
  deep-linking cold — is not expected to hit this at all. This is a known, general Vite dev-server
  characteristic (not specific to this repository's dependencies or to the `react-loadable`
  replacement), and it does not exist in the production build at all (`vite build` has no
  "optimize deps" step) — confirmed by testing all five main routes against a `vite preview` of the
  actual production build with zero errors on every one. Recorded here so a future contributor who
  hits this once during local development does not mistake it for a real regression.
  Evidence: the second cold-navigation attempt in this milestone's verification showed exactly one
  504 and one dynamic-import failure, followed by a clean reload (15 `<svg>` elements, zero errors);
  the subsequent production-build check across `/`, `/contact`, `/dashboard/hardware`,
  `/dashboard/usage-behavior`, and `/dashboard/user-activity` showed zero errors on the first load of
  every route.
- Observation: ESLint 10.10.0 (this plan's original choice) cannot actually be used yet.
  `eslint-plugin-react`'s and `eslint-plugin-jsx-a11y`'s latest published versions (7.37.5 and
  6.10.2, the exact versions this plan already names) both declare `peerDependencies: { eslint: "^3
  || ^4 || ^5 || ^6 || ^7 || ^8 || ^9" }` — no `^10` yet, since ESLint 10 is very new. Installing
  ESLint 10 alongside either plugin fails with an `ERESOLVE` error. ESLint 9.39.5 (the latest 9.x
  release) satisfies both plugins' peer ranges and is otherwise identical in capability for this
  repository's purposes (flat config was already fully supported in ESLint 9).
  Evidence: `npm view eslint-plugin-jsx-a11y@latest peerDependencies` and
  `npm view eslint-plugin-react@latest peerDependencies` both print `^9` as the upper bound; the
  `ERESOLVE` error names exactly this conflict.
- Observation: `metrics-graphics` renders far more than one `path.mg-line1` element per chart —
  confirmed 292 matches for one selector that should describe a single line. Alongside the visible
  line, it draws many invisible `.mg-voronoi` interaction-hover paths that also carry the
  `mg-line1` class. Nightwatch's `browser.expect.element(selector)` implicitly used the first
  match; Playwright's `locator()` enforces "strict mode" and throws on more than one match unless
  `.first()` is added explicitly. Every `path.mg-line1` locator across the three ported dashboard
  specs needed this.
  Evidence: the strict-mode violation error listed all 292 matched elements; `.first()` resolved it
  with no other change.
- Observation: `page.evaluate(() => sessionStorage.clear())` throws `SecurityError` if called
  before the page's first navigation — every Playwright test starts on `about:blank`, an opaque
  origin with no storage access, in both Chromium and WebKit. `regionSelector.spec.js`'s original
  port called it in a `beforeEach` with no navigation first. Fixed by navigating to `/` before
  clearing storage.
  Evidence: `SecurityError: Failed to read the 'sessionStorage' property from 'Window': Access is
  denied for this document.`, reproduced identically in both browser engines tested.
- Observation: two of the three dashboards' content has genuinely drifted since these Nightwatch
  specs were last valid — confirmed by reading the live rendered dashboards directly, not assumed.
  `usage-behavior` no longer has an "Always On Tracking Protection" metric (4 metrics/3 charts
  became 3 metrics/2 charts), and `user-activity` no longer has a "Yearly Active Users" metric (6
  became 5). `hardware`'s content is unchanged from what the original spec expected. This is
  `CONTRIBUTING.md`'s own documented characteristic of these specs ("assert exact metric titles and
  section ordering against live production data, so upstream data changes break them by design") —
  the ported specs' expectations were updated to match today's live content, the same maintenance
  step a human would perform on seeing this exact failure.
  Evidence: a small throwaway script driving a real browser against each dashboard, recorded in this
  milestone's own work, listed each dashboard's actual current metric IDs, titles, and order.
- Observation: `usage-behavior`'s metric descriptions currently contain zero links, where the
  original spec's "All metric description links work" test assumed at least one. Fixed by removing
  the precondition assertion — `linksWork` is already a correct no-op when its selector matches
  nothing, so the test still means "any links present must work," just without requiring one to
  exist right now.
  Evidence: `locator('.metric-description a').first()` reported "element(s) not found" against the
  live dashboard.
- Observation: two of `Contact.jsx`'s and `Footer.jsx`'s external links are genuinely broken or
  blocked today, confirmed independently with `curl`, not just observed as flaky in-test:
  `https://discourse.mozilla.org/c/fx-public-data` (linked from `Contact.jsx`) returns a real `404`.
  `https://donate.mozilla.org/` (linked from `Footer.jsx`) returns `301` to
  `https://www.mozillafoundation.org/donate/`, which returns `403` to a non-browser HTTP client —
  consistent with bot-detection blocking `curl`/`page.request`-style requests while likely still
  allowing a real browser. Both are genuine, pre-existing content/external-service issues that
  `nightwatch`'s original `request`-based link checker (identical in design to this port's
  `page.request`-based one) could never have caught, because the whole suite has been unable to run
  at all — this is the first time anything has actually checked these two links in years. Left both
  tests failing rather than weakening them or guessing at replacement content, consistent with
  `AGENTS.md`'s instruction not to claim a result that did not happen.
  Evidence: `curl -A "Mozilla/5.0 ..." https://discourse.mozilla.org/c/fx-public-data` returns `404`
  directly; the same for `https://donate.mozilla.org/` with `-L` (follow redirects) shows the final
  hop, `https://www.mozillafoundation.org/donate/`, returning `403`.
- Observation: a WebKit project was added to `playwright.config.js` during this milestone (a
  reasonable-seeming default for "modern e2e coverage"), then dropped. A specific
  `regionSelector.spec.js` test — one that selects a region, navigates away, and navigates back —
  reproducibly stalled for 60+ seconds on the return navigation, in WebKit only, confirmed with
  `--workers=1 --repeat-each=3` (no parallelism, so not a resource-contention artifact) and
  unaffected by switching the navigation's `waitUntil` condition from `load` to `domcontentloaded`
  (so not a slow-resource artifact either — the navigation itself does not complete). A plain,
  isolated repeat-navigation script with no region selection or assertions completed in under 300ms
  for the same routes, isolating the trigger to the region-selection-triggered refetch specifically.
  Chromium never reproduced this. Critically, `nightwatch.conf.js` only ever configured
  `browserName: 'chrome'` in both of its environments — Nightwatch never tested WebKit/Safari at
  all, so this was scope this migration was about to add, not scope it was preserving. Removed the
  WebKit project entirely rather than continuing to debug an engine-specific issue outside what this
  port is actually responsible for porting.
  Evidence: the stalled-navigation transcript names the exact line
  (`regionSelector.spec.js`'s second `page.goto(regionedDashboardURL)` inside the loop) and reproduces
  identically across 3 repeats with 1 worker; `nightwatch.conf.js`'s `desiredCapabilities:
  { browserName: 'chrome' }` confirms the original scope.
- Observation: `npm run size` has failed outright since Milestone 1, not because of anything in
  Milestone 5 — confirmed by reproducing the identical failure with both `source-map-explorer`
  2.4.2 (the version already installed) and 2.5.3 (this milestone's bump target) before changing
  anything else. Vite's entry chunk (`build/assets/index-*.js`) produces a source map that
  `source-map-explorer` flags as invalid ("Your source map refers to generated column Infinity on
  line 2, but the source only contains 10730 column(s) on that line"), which the tool treats as a
  hard failure (exit 1) for this one chunk specifically, even though the same class of warning on
  other chunks (for example `ChartContainer-*.js`) is only a warning (exit 0). This went unnoticed
  during Milestone 1 because that milestone's own validation never ran `npm run size`.
  Evidence: `source-map-explorer`'s own `--help` names `--no-border-checks` ("Disable invalid
  mapping column/line checks"); adding it to the `size` script's command changes the result to
  "Unable to map 6774/340873 bytes (1.99%)" and exit 0 — a small, expected fraction of unmapped
  bytes, not a sign of a broken bundle.

## Decision Log

- Decision: do not reuse, cherry-pick, or merge the local `toolchain` branch's already-completed
  migration, even though it was validated working on Node 24 today. Implement this plan's
  milestones as new commits from scratch on the new branch.
  Rationale: the user's explicit choice when presented with the discovery and the option to reuse
  it. The `toolchain` branch's own doc-updating commits touch `AGENTS.md`, `docs/ARCHITECTURE.md`,
  and `docs/ISSUE_TRIAGE.md` — files the `clean-up` branch this plan is based on has already
  replaced with a different structure (`CONTRIBUTING.md`, `docs/architecture/*.md`) — so reusing it
  would have required either an awkward partial cherry-pick or reconciling two independently
  written versions of the same documentation.
  Date/Author: 2026-09-15, user request in conversation.
- Decision: branch this work as `441--update-toolchain` off `clean-up`, not off `main`.
  Rationale: `clean-up` contains a completed but not-yet-merged, not-yet-PR'd documentation
  restructuring (`CONTRIBUTING.md`, `docs/architecture/*.md`) that Milestone 6 of this plan needs to
  update directly. Branching off `main` instead would mean updating the older, since-superseded
  `AGENTS.md`/`docs/ARCHITECTURE.md` structure, which `clean-up` has already locally deleted.
  `clean-up`'s only difference from `main` is one empty GitHub merge commit
  (`f655559`, whose actual content — "Display times using UTC timezone" — is already present on
  both branches as commit `d854efc`, a shared ancestor).
  Date/Author: 2026-09-15, user request in conversation.
- Decision: keep React at 16.13.1, `react-router-dom` at its current major version (5), and leave
  `react-refetch` and the `metrics-graphics`/`react-metrics-graphics` charting stack untouched.
  Rationale: confirmed directly today, `node_modules/react-metrics-graphics/package.json`'s
  `peerDependencies` reads `{"react": "^15||^16", "react-dom": "^15||^16", ...}` and
  `node_modules/react-refetch/package.json`'s reads `{"react": "^0.14.0 || ^15.0.0-0 ||
  ^16.0.0-0"}`. Upgrading React past 16 would require replacing both of these libraries
  simultaneously — a data-fetching-layer and charting-layer rewrite, not a toolchain swap — which is
  out of scope for the issue this plan implements (#441).
  Date/Author: 2026-09-15, verified directly during this plan's research.
  Rationale confirmed by an old executplan, `docs/execplans/2026-09-14-document-current-state.md`.
- Decision: replace Jest with Vitest, rather than reconstructing an equivalent hand-written Jest
  configuration.
  Rationale: `react-scripts` currently supplies Jest's configuration invisibly (jsdom environment,
  CSS-import handling, a Babel preset) — removing `react-scripts` removes that configuration
  regardless of which test runner is kept, so something has to be written either way. Vitest reuses
  the same Vite transform pipeline this plan is already adding for the build, needing no separate
  Babel setup, and is a natural pairing with Vite.
  Date/Author: 2026-09-15, decided during this plan's drafting.
- Decision: replace Nightwatch with Playwright, rather than trying to unblock Nightwatch's
  `chromedriver` dependency on Apple Silicon.
  Rationale: `chromedriver@84.0.1`'s own postinstall script fails outright on `arm64` regardless of
  Node version (confirmed in `CONTRIBUTING.md`'s Footguns table); Playwright manages its own browser
  binaries and has no such dependency, and it also directly fixes the separately-documented
  footgun that Nightwatch's `jsDisabled` environment needs a non-headless browser (Playwright's
  `javaScriptEnabled: false` context option works in headless mode).
  Date/Author: 2026-09-15, decided during this plan's drafting.
- Decision: adopt ESLint 9.39.5 (the latest 9.x release — not 10.10.0, this plan's original choice;
  see Milestone 3's Surprises & Discoveries for why) with a single flat-config file
  (`eslint.config.js`), rather than trying to keep `.eslintrc.extra.js`'s legacy eslintrc format
  alive.
  Rationale: removing `react-scripts` removes its invisible, bundled `eslint-config-react-app`,
  which is currently the only thing linting `.jsx` files at all — without a replacement, this
  migration would silently delete all JSX linting, which is worse than doing nothing. Modern ESLint
  only supports the flat-config format, so unifying onto one config is not optional once a current
  ESLint version is adopted. 9.39.5 rather than 10.x because `eslint-plugin-react` and
  `eslint-plugin-jsx-a11y` (both required for this repository's existing rule set) do not support
  ESLint 10 yet.
  Date/Author: 2026-09-15, decided during this plan's drafting.
- Decision: install `@playwright/test` as a normal root `devDependency`, with specs and config
  under `tests/playwright/`, rather than nesting a second, independent npm project (its own
  `package.json` and lockfile) under `tests/`.
  Rationale: a second nested npm project means a second lockfile and a second dependency tree to
  keep in sync, which is exactly the kind of avoidable footgun `CONTRIBUTING.md`'s existing
  Footguns table already warns about for the one lockfile this repository has today. A single root
  `package.json`/`package-lock.json` is simpler and keeps `npm audit`/`npm outdated` covering
  everything in one place.
  Date/Author: 2026-09-15, decided during this plan's drafting.
- Decision: `package.json`'s new `engines.node` field is `^24.0.0`, and a new `.nvmrc` file at the
  repository root contains `24`.
  Rationale: Vitest 5.0.1 requires `^22.12.0 || ^24.0.0 || >=26.0.0` (see Surprises & Discoveries);
  intersected with Vite's, ESLint's, and Playwright's own (broader) floors, and with this plan's
  explicit goal of running on Node 24, `^24.0.0` is both accurate and simple to state, rather than
  writing out the full three-way union of ranges.
  Date/Author: 2026-09-15, decided during this plan's drafting.
- Decision: scope the Playwright migration (Milestone 4) to the `dev` (`http://localhost:3000`) and
  `prod` (`https://data.firefox.com`) targets only; do not port Nightwatch's `stage` target.
  Rationale: `docs/architecture/deploy.md` already documents that the stage URL question is
  unresolved — `public/contribute.json`'s listed stage URL is confirmed dead, and the real stage
  host reported elsewhere could not be confirmed reachable from a plain developer sandbox (possibly
  behind an access-gated proxy). Porting a distinct "stage" test target would mean either
  hardcoding the same already-known-dead URL Nightwatch does today, or asserting a URL nobody has
  confirmed works. Playwright's design (a single `PLAYWRIGHT_BASE_URL` environment variable) makes
  adding a stage target later, once the URL is confirmed, a one-line change — not a redesign.
  Date/Author: 2026-09-15, decided during this plan's drafting.
- Decision: replace `react-loadable` with `React.lazy`/`React.Suspense` plus a new hand-written
  error-boundary component, `src/lib/LazyBoundary.jsx`, rather than any other lazy-loading approach.
  Rationale: confirmed hands-on during Milestone 1 that `react-loadable` genuinely breaks under
  Vite/Rollup's native ES module dynamic `import()` (see that milestone's Surprises & Discoveries) —
  this was not a hypothetical risk, it produced a fully blank home page. `React.lazy` is the
  standard-library replacement for exactly this use case and expects precisely the module-namespace
  shape (`{ default: Component }`) Vite's dynamic import already produces natively, needing no
  interop shim. `React.lazy`/`Suspense` alone only covers the loading state, not `react-loadable`'s
  error-rendering behavior, so `LazyBoundary` (a small class component combining an error boundary
  with a `Suspense` wrapper) was added to preserve that behavior, rendering the same `Error`
  component with the same "Error"/"Load error" text `lazyLoad.jsx` already used.
  Date/Author: 2026-09-15, decided during Milestone 1's implementation.
- Decision: run the ported Playwright suite against Chromium only (plus the same engine's
  JavaScript-disabled variant), not against WebKit as well — this plan's original Milestone 4 text
  had proposed Chromium and WebKit as the two "real" browser projects.
  Rationale: confirmed hands-on that a WebKit-only, reproducible 60+ second navigation stall exists
  in `regionSelector.spec.js` (see Surprises & Discoveries) — not resource contention, not resolved
  by relaxing the navigation's readiness condition. `nightwatch.conf.js`, the file this migration
  replaces, only ever configured `browserName: 'chrome'` — this repository's end-to-end suite has
  never tested WebKit/Safari. Adding it was this plan's own, unrequested scope expansion; dropping it
  restores exact parity with what Nightwatch actually covered, which is what a toolchain port is
  responsible for, rather than spending further effort debugging a new browser engine's
  compatibility with this application that nothing asked for.
  Date/Author: 2026-09-15, decided during Milestone 4's implementation.
- Decision: leave two ported end-to-end tests failing (`contact.spec.js`'s "All links work",
  `footer.spec.js`'s "All footer links work") rather than modifying `Contact.jsx`/`Footer.jsx`'s
  content, weakening the assertions, or excluding the tests.
  Rationale: both failures trace to genuine, independently-confirmed real-world problems external to
  this repository's toolchain — a dead forum link and a redirect target that blocks non-browser HTTP
  clients (see Surprises & Discoveries) — not to anything wrong with the migration. Fixing
  application content is outside a toolchain migration's scope, and this repository's own
  `AGENTS.md` requires not claiming a green run that did not happen. Whoever next touches
  `Contact.jsx` should update or remove the dead Discourse link; the `donate.mozilla.org` redirect
  question is worth a human decision (report to Mozilla Foundation's web team, or accept it as an
  external site's bot-detection behavior) rather than a decision this plan should make.
  Date/Author: 2026-09-15, decided during Milestone 4's implementation.

## Outcomes & Retrospective

Not yet started. This section will be filled in once all six milestones have landed, comparing the
actual result against the acceptance criteria in "Validation and Acceptance."

## Context and Orientation

`mozilla/ensemble` is a client-side-only React 16 single-page application: the entire source behind
`data.firefox.com`. It fetches all displayed data at runtime from a separate service and bundles
none of its own. The repository root contains
`package.json` (the single source of truth for dependencies and npm scripts — there is exactly one
`package.json` and one `package-lock.json` in this repository today), `src/` (all application and
test code), `public/` (static files served as-is: `manifest.json`, `contribute.json`, `img/`, and
today, `index.html`), and `docs/` (this plan's own home, plus `docs/architecture/` — steady-state
system documentation).

**Two specific things block a plain `npm install`/`npm run build:app` on Node 24 today, verified
directly on this machine just before writing this plan (Node v24.19.0, npm 11.17.0):**

First, `chromedriver@84.0.1` — a `devDependency` needed only by `nightwatch`, the current
end-to-end test runner — fails its `postinstall` script outright on Apple Silicon
(`arm64`) with the message "Only Mac 64 bits supported." There is no flag that fixes this; the only
current workaround, `npm install --ignore-scripts`, means chromedriver's binary is never installed
at all, so Nightwatch cannot run regardless.

Second, `react-scripts@3.4.1` (create-react-app, "CRA") bundles a version of webpack (4.x) old
enough that its internal use of Node's `crypto` module calls an OpenSSL API Node 17+ removed by
default. Running `npm run build:app` with no other flag on Node 24 fails with:

    Error: error:0308010C:digital envelope routines::unsupported
    opensslErrorStack: [
      'error:03000086:digital envelope routines::initialization error',
      'error:0308010C:digital envelope routines::unsupported'
    ]
    library: 'digital envelope routines',
    reason: 'unsupported',
    code: 'ERR_OSSL_EVP_UNSUPPORTED'

(This is the exact output captured today; it is reproduced here so a reader can compare their own
result exactly, per this plan's own validation discipline.) The only current workaround is setting
`NODE_OPTIONS=--openssl-legacy-provider` before every build or dev-server start — easy to forget,
and itself a sign the underlying tool is unsupported on current Node.

**A third, related problem, not fatal but real:** removing `react-scripts` (which this plan does)
also removes its invisible, bundled Jest configuration and its invisible, bundled JSX linting
(`eslint-config-react-app`, which lints `.jsx` files during `npm start`/`npm run build:app` today
but appears nowhere in this repository's own config, because CRA supplies it internally). Something
must explicitly replace both, or this migration would silently delete unit test infrastructure and
all JSX linting as a side effect.

**Term of art: "flat config."** ESLint's modern configuration format, where a single JavaScript
file (conventionally `eslint.config.js`) exports an array of configuration objects, each scoped to
a set of files by glob pattern. This replaces the older `.eslintrc.*` format (a JSON-like object
with an `extends` array of named presets), which the currently-installed ESLint 6.8.0 uses and
which this repository's `.eslintrc.extra.js` is written in. ESLint 9 and later only support flat
config; there is no way to keep the old format once ESLint itself is upgraded, which this plan does
because a current ESLint version is what makes JSX linting exist here at all again (see above).

**The current, two-config ESLint split**, for a reader who has not seen it: `.eslintrc.extra.js` (74
lines, root of the repository) is run by `npm run lint:js-extra`, whose actual command is `npx
eslint --config .eslintrc.extra.js --ext .js --ext .json .` — note that `.jsx` is not in that
`--ext` list, so this config never lints the bulk of the application code. It uses a parser pinned
by relative path, `./node_modules/babel-eslint`, and declares a stale React version,
`"16.4.2"`, against the actually-installed `16.13.1`. Separately, and invisibly (no file in this
repository defines it), `react-scripts` lints `.jsx` files with its own bundled
`eslint-config-react-app` whenever `npm start` or `npm run build:app` runs. `.eslintignore` (2
lines: `build` and `package-lock.json`) supports the first config; flat config has no equivalent
file and instead takes an `ignores` array inside `eslint.config.js` itself.

**Verified today: the React-16 ceiling.** Running
`node -e "console.log(require('./node_modules/react-metrics-graphics/package.json').peerDependencies)"`
prints `{ 'metrics-graphics': '^2.11.0', 'prop-types': '^15||^16', react: '^15||^16', 'react-dom':
'^15||^16' }`, and the equivalent command for `react-refetch` prints `{ react: '^0.14.0 ||
^15.0.0-0 || ^16.0.0-0' }`. Both packages refuse to install alongside a React newer than 16. This
repository's own `src/components/containers/*Container.jsx` files (six of them) use
`react-refetch`'s `connect()` higher-order component for all data fetching, and
`src/components/views/Chart.jsx` uses `react-metrics-graphics` for every chart on every dashboard.
Replacing either is a data-fetching-layer or charting-layer rewrite touching most of
`src/components/`, not a toolchain change, and is explicitly out of scope here.

**The `npm audit` picture today**, from a fresh `npm install --ignore-scripts` on this branch: 251
vulnerabilities (12 low, 136 moderate, 82 high, 21 critical). Running `npm audit --json` and
inspecting each critical-severity entry's `fixAvailable` field shows the large majority resolve
through `nightwatch` (directly, or via its own dependencies `ejs`, `form-data`, `netmask`,
`request`) or through `react-scripts` (via `loader-utils`, `react-dev-utils`, `shell-quote`); the
remainder show a generic `fixAvailable: true`, meaning npm can already resolve them within
currently-installed major versions once the packages pinning the vulnerable transitive versions are
gone. Milestone 6 re-runs `npm audit` after every other milestone lands and records the actual final
count — this plan does not assert that count in advance.

**IE11-era scaffolding, safe to delete as part of this migration:** `src/index.jsx` currently
imports `'react-app-polyfill/ie11'` and `'babel-polyfill'` as its first two lines, both are listed
as `dependencies` (not `devDependencies`) in `package.json`, and `package.json`'s `browserslist`
field reads `[">0.2%", "not dead", "not ie <= 10", "not op_mini all"]`. None of Vite, Vitest, or
Playwright read CRA-era polyfills or `browserslist` the way `react-scripts`/`babel-preset-react-app`
did, and once IE11 support is dropped (which removing these polyfills does, deliberately), the
`browserslist` field's `"not ie <= 10"` clause is also meaningless. `src/components/views/styl/
BrowserHacks.styl` (27 lines) is this same IE11-era scaffolding's Stylus counterpart.

## Plan of Work

**Milestone 1 — Vite migration.** This milestone replaces `react-scripts` as the build tool and dev
server. At the end of it, `npm start` and `npm run build:app` both work on Node 24 with no
`NODE_OPTIONS` flag, and the IE11-era scaffolding described above is gone.

Concretely: add `vite` (8.3.0) and `@vitejs/plugin-react` (6.1.1) as `devDependencies`; remove
`react-scripts` entirely. Create `vite.config.mjs` at the repository root (the `.mjs` extension,
not `.js`, is deliberate — Milestone 2 turns this same file into Vitest's config too, and Vitest's
own convention is `.mjs` or `.ts` for its config so it is unambiguously an ES module regardless of
`package.json`'s own module type). Configure `@vitejs/plugin-react` with `jsxRuntime: 'classic'`
explicitly — its default is React 17's automatic JSX runtime, and every file in this codebase
already does `import React from 'react'` under the assumption that React must be in scope wherever
JSX appears (the classic runtime's requirement), since React here is 16. Set `build.outDir:
'build'` (matching the directory name every other script and `docs/architecture/deploy.md` already
assume) and `server.port: 3000` (matching this repository's documented dev port everywhere else,
including `nightwatch.conf.js`'s `dev` target and `CONTRIBUTING.md`).

Move `public/index.html` to `/index.html` at the repository root — this is Vite's convention; files
Vite should process as part of the build (as opposed to copying byte-for-byte) must live at the
project root, not under `public/`. In the moved file: delete every `%PUBLIC_URL%` placeholder
(CRA's own templating syntax, meaningless to Vite) and replace each with a plain root-relative path
(for example, `%PUBLIC_URL%/manifest.json` becomes `/manifest.json`); add
`<script type="module" src="/src/index.jsx"></script>` just before `</body>` — Vite does not
auto-inject the application bundle into HTML the way CRA's `HtmlWebpackPlugin` did, so this script
tag is how Vite discovers the application's entry point at all. Leave every other file already
under `public/` (`contribute.json`, `manifest.json`, `img/`, `google3d1057c68ff035a9.html`) exactly
where it is — Vite serves everything remaining under `public/` at the site root automatically,
identical to CRA's behavior for that directory.

In `src/index.jsx`, delete the two polyfill imports (`react-app-polyfill/ie11`, `babel-polyfill`)
and remove `react-app-polyfill` and `babel-polyfill` from `package.json`'s `dependencies`. Delete
`src/components/views/styl/BrowserHacks.styl` and its generated
`src/components/views/css/BrowserHacks.css*` (regenerated by `npm run build:css`, so deleting the
generated file is not strictly required, but delete the `.styl` source so it cannot be regenerated
by accident). Remove `browserslist` from `package.json` entirely — nothing in the new toolchain
reads it, and its meaning (a target for `autoprefixer`/`babel-preset-env`, both gone) no longer
applies.

Rename every `REACT_APP_*` environment variable to `VITE_*`, since Vite only exposes environment
variables prefixed `VITE_` to client code (a deliberate security boundary Vite enforces, the same
reason CRA required its own `REACT_APP_` prefix). This touches `.env` (three keys:
`REACT_APP_GA_TRACKING_ID` → `VITE_GA_TRACKING_ID`, `REACT_APP_SITE_TITLE` → `VITE_SITE_TITLE`,
`REACT_APP_VALUE_DECIMAL_PLACES` → `VITE_VALUE_DECIMAL_PLACES`), `src/components/decorators/
withTracker.jsx` (one reference, `process.env.REACT_APP_GA_TRACKING_ID`), `src/lib/utils.js` (three
references to `REACT_APP_SITE_TITLE`/`REACT_APP_VALUE_DECIMAL_PLACES`), and `README.md`'s one
example (`REACT_APP_SITE_TITLE='…' npm start` becomes `VITE_SITE_TITLE='…' npm start`). Leave
`.env`'s `NODE_ENV=development` line alone — that is a standard Node variable, not CRA-specific.
Note for whoever runs Milestone 1: `.env` also currently sets `BROWSER=firefox`, a
webpack-dev-server convention CRA read to auto-open Firefox on `npm start`; Vite has no equivalent
environment-variable-driven browser selection, so this specific convenience is dropped (a developer
can still open `http://localhost:3000` manually, or pass `vite --open` for the OS default browser).
Record this as a deliberate, disclosed behavior change, not a bug.

Update `package.json`'s scripts: `"watch:app": "vite"` (replaces `"react-scripts start"`),
`"build:app": "vite build"` (replaces `"react-scripts build"`, and the `NODE_OPTIONS` prefix some
callers used is no longer needed anywhere). `build:css` and `build:version.json` are untouched —
neither ever depended on CRA. Fix `"size": "source-map-explorer build/static/js/main.*"` — Vite's
output does not use that path shape at all; its production JavaScript lands at
`build/assets/index-<hash>.js` (a content hash, different on every build). Change the script to
`"size": "source-map-explorer build/assets/index-*.js"`, which matches Vite's naming convention
regardless of the exact hash. (This alone is not sufficient to make the script actually pass — it
additionally needs a `--no-border-checks` flag, discovered only in Milestone 5 once this script was
actually run; see that milestone's Surprises & Discoveries. A reader implementing this milestone
fresh should add the flag now rather than reproducing the same gap.) Add `"engines": {"node":
"^24.0.0"}` to `package.json` (see Decision Log for why this exact range) and create `.nvmrc` at the
repository root containing exactly `24`.

Finally, verify `react-loadable` (used via `src/lib/lazyLoad.jsx`, at the 7 call sites listed in
Progress) still behaves correctly once Rollup (Vite's production bundler) replaces webpack. Its
mechanism is a plain dynamic `import()`, which is standard JavaScript and not webpack-specific, so
it is expected to keep working — but this must be confirmed by hand, not assumed: after `vite
build` succeeds, serve the `build/` directory (for example with `npx serve build`) and click through
to at least one lazily-loaded route (`/contact`, or any dashboard) and confirm the loading spinner
from `src/components/views/Spinner.jsx` appears briefly and the target page then renders. If it does
not behave correctly (for example, `pastDelay` never becomes true, or the loader's `props.error`
path never fires on a broken import), the documented fallback is switching both call sites in
`lazyLoad.jsx`'s two consuming files to `React.lazy` plus `React.Suspense`, which is a small,
self-contained change should it be needed. Do not make this change speculatively — only if the
direct port is observed to misbehave.

**Milestone 2 — Vitest migration.** This milestone replaces Jest (currently supplied invisibly by
`react-scripts`) with Vitest, changing nothing about the two existing test files' content.

Add `vitest` (5.0.1) and `jsdom` (30.0.1, Vitest does not bundle a DOM implementation itself) as
`devDependencies`. Extend `vite.config.mjs` (the same file Milestone 1 created) with a `test` block:
`environment: 'jsdom'`, `globals: true` (the two existing test files use bare `it`, `expect`, and
`beforeAll` with no import statement, relying on ambient globals — matching how CRA's Jest was
configured), `setupFiles: ['./src/setupTests.js']` (unchanged file, already configures the Enzyme
adapter and attaches `React`/`shallow` to the global object), and
`include: ['src/tests/jest/**/*.test.jsx']` — this exact scoping matters once Milestone 4 adds
`tests/playwright/specs/*.spec.js`, since Vitest's own default test-file glob would otherwise also
try to run Playwright's spec files (which use `@playwright/test`'s own `test`/`expect`, not
Vitest's, and would fail to run under Vitest at all).

Change `package.json`'s `"test:jest": "CI=true react-scripts test"` to `"test:jest": "vitest run"`
(the `run` subcommand runs once and exits, matching CI-style usage — Vitest's default with no
subcommand is an interactive watch mode, wrong for this script). Enzyme, `enzyme-adapter-react-16`,
and `react-test-renderer` all stay exactly as they are — Enzyme only depends on the installed React
version and a DOM environment, neither of which changes here.

Verify with `npx vitest run`: both `src/tests/jest/Dashboard.test.jsx` and
`src/tests/jest/MetricOverview.test.jsx` should pass unmodified. Note for whoever runs this
milestone: both test files exercise components (`Dashboard.jsx`, `MetricOverview.jsx`) that import
CSS files as a side effect (`import './css/Dashboard.css'`, etc.) purely by being imported — even
though the tests only shallow-render, the import statement itself still executes at module-load
time. Vitest's `jsdom` environment handles bare CSS imports through Vite's own CSS pipeline with no
extra configuration needed; if a CSS-related import error appears instead, that is a genuine
surprise worth recording in this plan's Surprises & Discoveries section, not something to
pre-emptively work around.

**Milestone 3 — ESLint unification.** This milestone produces one flat-config file, `eslint.config.
js`, covering both `.js` and `.jsx`, replacing both the current `.eslintrc.extra.js`/`.eslintignore`
pair and `react-scripts`' now-removed invisible `.jsx` linting.

Add as `devDependencies`: `eslint` (9.39.5, the latest 9.x release — not currently a direct
dependency at all, see "Known rot" in `CONTRIBUTING.md`, this also fixes that separately-documented
rot; not 10.x, since `eslint-plugin-react` and `eslint-plugin-jsx-a11y` do not support ESLint 10 yet
— see Decision Log), `@eslint/js` (9.39.5, matching the `eslint` version — supplies
`js.configs.recommended`, imported directly by the new config rather than relied on transitively),
`eslint-plugin-react` (bump from 7.20.5 to 7.37.5), `eslint-plugin-jsx-a11y` (bump from 6.3.1 to
6.10.2, imported via its `flatConfigs.recommended` export specifically — its plain `configs.
recommended` export is still the legacy eslintrc shape), `@vitest/eslint-plugin` (1.6.27, the
official Vitest-authored plugin, replacing `eslint-plugin-jest` since Milestone 2 already removed
Jest itself), and `globals` (17.12.0, supplies the `browser`/`node`/`vitest` global-variable sets
flat config needs explicitly — the old `.eslintrc.extra.js`'s `env: { browser: true, node: true,
es6: true }` shorthand has no flat-config equivalent other than importing this package). Remove
`babel-eslint` and `eslint-plugin-jest` as `devDependencies`. Do not add `eslint-plugin-json` at
all — see the next paragraph for why. Delete `.eslintrc.extra.js` and `.eslintignore`.

In the new `eslint.config.js`: an `ignores` entry for `build` (flat config's replacement for
`.eslintignore`'s `build` line; `package-lock.json`'s old ignore entry is no longer needed since the
new config's file glob, `**/*.{js,jsx}`, never matches a `.json` file in the first place — dropping
JSON linting of `package.json` entirely, rather than adding `eslint-plugin-json` to replace the old
config's coverage of it, is an acceptable, disclosed side effect, since a malformed `package.json`
fails every npm command immediately in a way no linter needs to catch first). Apply
`eslint-plugin-react`'s and `eslint-plugin-jsx-a11y`'s flat-config presets to
`files: ['**/*.{js,jsx}']`, with `settings.react.version: 'detect'` (deliberately not hardcoding a
version the way the old config's stale `"16.4.2"` did — `detect` reads the actually-installed React
version from `node_modules` automatically). Apply `@vitest/eslint-plugin`'s recommended config
scoped to `files: ['src/tests/jest/**/*.test.jsx']` only (mirroring Milestone 2's own scoping,
so Playwright's spec files under `tests/playwright/` are not also linted as if they were Vitest
files — Milestone 4 gives them their own appropriate settings instead). Port every rule choice the
current `.eslintrc.extra.js` makes deliberately (see "Context and Orientation" for the full current
rule set: `eqeqeq`, `no-var`, `prefer-const`, `no-console`, `no-global-assign`, `no-redeclare` and
`no-shadow` both with `builtinGlobals: true`, `semi`/`comma-dangle`/`prefer-arrow-callback` as
warnings, `react/prop-types: 'off'`, `react/display-name: 'off'`, `react/no-unescaped-entities`
narrowed to `forbid: ['>', '}']`, `jsx-a11y/no-onchange: 'off'`). Try the default ESLint parser
(`espree`) first rather than reintroducing `babel-eslint`/`@babel/eslint-parser` — this codebase's
syntax (JSX, ES modules, standard ES2020+ features) does not obviously need Babel's parser, and
carrying it forward without checking would just be inertia. Only add `@babel/eslint-parser` back if
`npx eslint .` reports a genuine parse error that `espree` cannot handle.

**Expect this milestone to surface previously invisible findings.** Every `.jsx` file in this
repository has never been linted by anything checked into this repository — only by CRA's invisible
bundled config, whose exact rule set nobody here has read directly. Decide fix-versus-suppress per
finding as they appear; do not pre-guess what they will be. `stylint`'s config
(`.stylintrc`) and its `npm run lint:styl` script are entirely untouched by this milestone.

Verify: `npm run lint` (now `npm-run-all lint:*` running only `lint:js` — `npx eslint .` — and
`lint:styl`, since `lint:js-extra` is retired) exits 0. Spot-check that JSX is really covered now,
not just `.js`: temporarily introduce an obvious violation in any `.jsx` file (for example, a stray
`==`) and confirm `npx eslint .` reports it, then revert the temporary change.

**Milestone 4 — Playwright migration.** This milestone replaces Nightwatch with Playwright,
directly removing the `chromedriver`-on-Apple-Silicon install failure, and ports all 13 existing
spec files (775 lines total, listed in Progress/Context) with no loss of test coverage.

Add `@playwright/test` (1.63.0) as a `devDependency`. Remove `nightwatch`, `chromedriver`, and
`request` (used only by the Nightwatch helper `linkWorks`/`linksWork` functions described below;
Playwright's built-in `page.request` API replaces it, which incidentally also removes `request`
from the dependency tree — `request` is itself deprecated upstream and is one of the packages
`CONTRIBUTING.md`'s "Known rot" section already names). Delete `nightwatch.conf.js` and the entire
`src/tests/nightwatch/` directory only after every file below is confirmed ported — do not delete
first and port from memory.

Create `playwright.config.js` at the repository root: `testDir: './tests/playwright/specs'`,
`fullyParallel: true`, `use.baseURL` read from `process.env.PLAYWRIGHT_BASE_URL`, defaulting to
`'http://localhost:3000'` when unset (replacing Nightwatch's `NIGHTWATCH_TARGET`-driven
dev/stage/prod lookup table — see Decision Log for why stage is not ported), a `webServer` block
(`command: 'npm start'`, `url: 'http://localhost:3000'`, `reuseExistingServer:
!process.env.CI`) so Playwright starts the dev server itself for local runs instead of requiring a
developer to remember to run `npm start` in a separate shell first (a direct improvement over
Nightwatch's documented requirement that `npm start` already be running; note it must be `npm start`
and not `npm run watch:app` alone, since a fresh checkout has no compiled CSS yet), `retries`/
`workers` gated on `process.env.CI` (matching common Playwright practice for flake tolerance), and
two `projects`: `chromium` running the default spec set, plus a `chromium-no-js` project (`use: {
javaScriptEnabled: false }`, matching only `jsDisabled.spec.js`) — replacing Nightwatch's separate
`default`/`jsDisabled` environments, now unified into one `npx playwright test` invocation instead
of two separate commands. Chromium only, not also WebKit, because `nightwatch.conf.js` itself only
ever configured `browserName: 'chrome'` — this is a faithful port of the coverage that already
existed, not an expansion of it (a WebKit project was tried and dropped during implementation; see
Decision Log).

Port each of the 13 files under `src/tests/nightwatch/` to `tests/playwright/specs/`, preserving
the existing directory structure (`dashboards/hardware.js`, `dashboards/usage-behavior.js`,
`dashboards/user-activity.js` become `dashboards/hardware.spec.js`, etc.). The translation from
Nightwatch's API to Playwright's is mechanical; apply this mapping to every file: `browser.expect.
element(sel).to.be.present`/`.visible` becomes `await expect(page.locator(sel)).toBeVisible()`;
`browser.expect.element(sel).text.to.be.equal(x)` becomes `await
expect(page.locator(sel)).toHaveText(x)`; `browser.waitForElementVisible(sel)` /
`waitForElementNotPresent(sel)` becomes `await page.locator(sel).waitFor({ state: 'visible' })` /
`{ state: 'hidden' }`; `browser.getTitle(cb)`/`assert.title(x)`/`assert.equal(title, x)` becomes
`await expect(page).toHaveTitle(x)`; `browser.url(url)` becomes `await page.goto(url)`;
`module.exports = { before, 'Test name': browser => {...} }` becomes `test.beforeEach(async ({
page }) => {...})` plus one `test('Test name', async ({ page }) => {...})` call per case.

Port `src/tests/nightwatch/utils.js`'s four exported helpers to `tests/playwright/utils.js`:
`metricTitleIsCorrect(browser, selector, title)` becomes an `async (page, selector, title) =>
{ await expect(page.locator(selector)).toBeVisible(); await
expect(page.locator(selector)).toHaveText(title); }`. `flagForUpdate(browser, selector,
collectiveName, numExpectedElements)` keeps its exact behavior and message text (see "Context and
Orientation" for why it exists — a deliberate trip-wire when an element count changes) but uses
`await page.locator(selector).count()` instead of Nightwatch's `elements()` callback.
`linkWorks(browser, selector)` and `linksWork(browser, selector)` are the two that use the `request`
package today (for external URLs) versus `browser.url()`/`waitForElementNotPresent('#not-found')`
(for URLs this application itself routes) — port the internal-URL branch to `await page.goto(url);
await expect(page.locator('#not-found')).not.toBeVisible(); await page.goBack();`, and the
external-URL branch to Playwright's own request context, `await page.request.get(url)`, asserting
`response.status()` is one of `[200, 301, 302, 304]` with up to 3 retries (matching the existing
`requestWithRetry` backoff of 5 seconds, then 25 seconds), removing the `request` import and
dependency entirely.

Update `package.json`: `"test:playwright": "playwright test"`, `"test": "npm-run-all lint test:jest
test:playwright"` (replacing `test:nightwatch:dev`), remove `test:nightwatch:stage` and
`test:nightwatch:prod` (stage/prod runs now happen by setting `PLAYWRIGHT_BASE_URL` directly, for
example `PLAYWRIGHT_BASE_URL=https://data.firefox.com npx playwright test`, documented in Milestone
6's `CONTRIBUTING.md` update rather than encoded as separate scripts). In `.gitignore`, remove the
now-dead `/*driver.log` and `/tests_output` entries (Nightwatch-specific) and add
`/test-results` and `/playwright-report` (Playwright's own output directories).

Before running the ported suite for the first time, run `npx playwright install chromium
--with-deps` once (downloads only the Chromium binary Playwright manages itself, matching the single
browser this config actually uses — this is the one-time setup step that replaces `chromedriver`,
and it is expected to succeed on Apple Silicon where `chromedriver@84.0.1`'s postinstall could not).

**Milestone 5 — dependency currency pass within the React-16 ceiling.** This milestone updates
dependencies that can move without touching application code or crossing the React-16 boundary
established in Decision Log, using the safety net Milestones 2 and 4 just built (a real, running
unit and end-to-end suite) to catch regressions live rather than by inspection alone.

First, the mechanical, low-risk bumps, each verified by running `npm run build:css && npm run
build:app && npx vitest run && npm run lint` (Milestone 4's Playwright suite runs separately, once
per full batch, since it is slower): replace `npm-run-all` (currently 4.1.5, unmaintained upstream)
with `npm-run-all2` (9.0.3, an actively maintained fork exposing the identical `npm-run-all` binary
name — confirmed via `npm view npm-run-all2 bin`, which lists `npm-run-all`,
`npm-run-all2`, `run-p`, and `run-s` all pointing at the same entry point — so no `package.json`
script needs to change, only the `devDependency` name and version); bump `react-router-dom` from
5.2.0 to 5.3.4 (the latest 5.x patch release — same major version, no API change expected, but
still run the full verification above since this is exactly the kind of change that safety net
exists for).

Second, the direct runtime dependencies whose latest versions are a larger jump and need individual
judgment, applied one at a time with the same verification command after each: `d3-scale` (3.2.1 →
4.0.2), `d3-selection` (1.4.2 → 3.0.0), and `d3-shape` (1.3.7 → 3.2.0) — each used for exactly one
narrow, long-stable D3 API (`scaleLinear`, `select`, `curveCatmullRom` respectively, confirmed in
Context and Orientation), which have not changed shape across these version ranges, but confirm by
loading `/dashboard/hardware` (or any dashboard) in a running `npm start` and checking the
`SummaryMetric` sparkline and main chart both still render correctly after each bump.
`markdown-it` (11.0.0 → 15.0.2) and `markdown-it-sup` (1.0.0 → 2.0.0) — verify by loading a metric
description that includes a Markdown link and confirm it still renders as a link, and that a
`<script>` tag in a description still renders as escaped text, not executable HTML (this
repository's two `dangerouslySetInnerHTML` call sites, in `Dashboard.jsx` and
`MetricOverview.jsx`, depend on `markdown-it`'s sanitization; re-verify this explicitly since it is
a security-relevant behavior, not just a visual one). `memoize-one` (5.1.1 → 6.0.0), `react-ga`
(3.1.1 → 3.3.1), and `react-spinners` (0.9.0 → 0.17.1). (`stylus`'s planned 0.54.7 → 0.64.0 bump
already happened in Milestone 1, ahead of schedule — it turned out to be a hard prerequisite for
installing Vite at all, not just a nice-to-have; see that milestone's Surprises & Discoveries. It
does not need to be redone here.) For each package in this paragraph: if the bump passes the full verification
command with no changes needed elsewhere, keep it; if it does not, record why in Surprises &
Discoveries and either find the smallest version that does pass or leave that one package at its
current version with the reason stated in this plan.

Third, `d3-transition` (1.3.2, confirmed unused anywhere in `src/` — see Surprises & Discoveries):
remove it entirely from `package.json`'s `dependencies` rather than bumping it, since bumping an
unused dependency has no benefit and removing it shrinks the `npm audit` surface.

Explicitly leave unchanged, and state why directly in this plan rather than silently skipping them:
`react` and `react-dom` (16.13.1 → latest is 19.3.0, blocked by `react-metrics-graphics`'s and
`react-refetch`'s `peerDependencies`, see Decision Log), `react-test-renderer` and
`enzyme-adapter-react-16` (must track React's own major version exactly, so also stay at 16),
`dateformat` (3.0.3 → latest 5.0.3 changes its module export shape between major versions in ways
that need code changes at every call site, not just a version bump — this is application-code work,
out of scope here), `distinct-colors` (3.0.0, no newer major exists that changes anything relevant),
and `metrics-graphics`/`react-metrics-graphics` themselves (see Decision Log).

**Milestone 6 — documentation and full clean-room validation.** This milestone updates every
document that describes the old toolchain as current, and proves the entire result works together
from nothing (not just incrementally, milestone by milestone).

Update `CONTRIBUTING.md`: replace every command in "Build, test, and development commands" that
referenced `NODE_OPTIONS=--openssl-legacy-provider`, `--ignore-scripts`, or Nightwatch, with the new
commands from Milestones 1 through 4; delete the "arm64/chromedriver" and "two linters, disjoint
coverage" rows from the Footguns table (both are fully resolved by this plan) and add a short new
row only if this plan's own work surfaced a new footgun worth recording (do not invent one if none
appeared); update the ESLint section to describe the new single flat config instead of the two-
config split; update the ESLint version's ecosystem note in "Known rot" (the `eslint` package is
now a direct dependency, so that specific rot entry is resolved and should be removed, not just
reworded). Update `docs/architecture/frontend.md`'s mention of the charting stack's React-16
ceiling only if this plan's Milestone 5 research changed any detail of it (expected: no change,
since Decision Log's finding matches what that file already says). Update `README.md`'s one
`REACT_APP_SITE_TITLE` example (already listed in Milestone 1, confirm it landed). Do not create a
new `docs/TOOLCHAIN_MIGRATION.md` or similar — this ExecPlan is that document, and `docs/execplans/`
is this repository's current convention for exactly that content, per `AGENTS.md`.

Then, prove the whole thing works from a clean-room state, not just incrementally: run `rm -rf
node_modules && npm install` (no `--ignore-scripts` — confirming that flag is no longer needed is
itself part of the acceptance bar), then every command in "Validation and Acceptance" below, in
order, on Node 24, recording the actual output of each next to its expected output in this plan's
"Artifacts and Notes" section.

## Concrete Steps

All commands below run from the repository root, on branch
`441--update-toolchain`, on Node v24.19.0 (confirm with `node --version` first; if a reader is on a
different Node 24.x patch version, that is expected to work identically — this plan's `engines`
field only requires the major version).

Baseline verification already performed during this plan's research (reproduce to confirm before
starting Milestone 1):

    node --version && npm --version
      Expected: v24.19.0 and 11.17.0, or close patch versions of the same Node 24 major.

    rm -rf node_modules && npm install --ignore-scripts
      Expected: completes with "added 2007 packages" and "251 vulnerabilities (12 low, 136
      moderate, 82 high, 21 critical)". Rewrites package-lock.json's lockfileVersion from 1 to 3 —
      leave this rewrite in place for this plan's branch (unlike the old convention of reverting
      it, since Milestone 1 onward permanently moves this repository off the old CRA-era lockfile
      shape anyway).

    npm run build:app
      Expected: fails with `code: 'ERR_OSSL_EVP_UNSUPPORTED'`, reproducing the exact transcript in
      "Context and Orientation" above.

    node -e "console.log(require('./node_modules/react-metrics-graphics/package.json').peerDependencies)"
    node -e "console.log(require('./node_modules/react-refetch/package.json').peerDependencies)"
      Expected: `{ 'metrics-graphics': '^2.11.0', 'prop-types': '^15||^16', react: '^15||^16',
      'react-dom': '^15||^16' }` and `{ react: '^0.14.0 || ^15.0.0-0 || ^16.0.0-0' }` respectively.

    grep -rn "lazyLoad" src/
      Expected: 7 matches, 4 in src/components/views/Main.jsx and 3 in
      src/components/views/MetricOverview.jsx.

    npm audit --json > /tmp/audit.json
      Then inspect: node -e "const a=require('/tmp/audit.json'); for (const [name,v] of
      Object.entries(a.vulnerabilities)) if (v.severity==='critical') console.log(name,
      JSON.stringify(v.fixAvailable));"
      Expected: 21 lines, the large majority naming `nightwatch` or `react-scripts` in their
      `fixAvailable` field, matching the list recorded in "Context and Orientation."

Milestones 1 through 6 have no further commands pre-recorded here — each milestone's own "Plan of
Work" paragraph above names the exact file edits and verification commands to run as that milestone
is implemented. As each milestone completes, add its actual command transcripts to "Artifacts and
Notes" below, and check its box in "Progress."

## Validation and Acceptance

The overall plan is accepted when, starting from a clean checkout of branch
`441--update-toolchain` on Node 24 (any 24.x patch version), all of the following are true and
observable by running the named command:

`rm -rf node_modules && npm install` completes with no `--ignore-scripts` flag and no chromedriver
install failure.

`npm start` starts a dev server at `http://localhost:3000` with no `NODE_OPTIONS` flag, and loading
that URL in a browser shows the Firefox Public Data Report home page, with at least one dashboard
(for example `/dashboard/hardware`) rendering live charts fetched from the transposer service.

`npm run build:app` completes with no `NODE_OPTIONS` flag and prints "✓ built" (Vite's success
message) along with a gzip size table; `build/index.html` and `build/assets/` exist afterward.

`npx vitest run` (via `npm run test:jest`) reports both existing test files passing: "Test Files 2
passed (2)" and "Tests 4 passed (4)".

`npm run lint` exits 0, and a temporarily-introduced obvious violation in a `.jsx` file is reported
(proving JSX is actually linted now, not just `.js`).

`npx playwright test` (via `npm run test:playwright`, with the dev server auto-started by
Playwright's own `webServer` config) runs all 12 ported spec files across the `chromium` and
`chromium-no-js` projects. As of Milestone 4's completion, 49 of 51 tests pass reliably; the
remaining 2 (`contact.spec.js`'s "All links work", `footer.spec.js`'s "All footer links work") fail
due to genuine, pre-existing external issues unrelated to this migration (a dead forum link, a
redirect target that blocks non-browser HTTP clients — see Milestone 4's Surprises & Discoveries and
Decision Log). A future run should reproduce exactly this split unless that external content
changes.

`npm audit` reports a critical-severity count lower than today's baseline of 21 (the exact new
number is recorded in Milestone 6's execution, not asserted here in advance).

Reading `CONTRIBUTING.md` end to end describes only commands that actually work on this branch,
with no remaining reference to `NODE_OPTIONS=--openssl-legacy-provider`, `--ignore-scripts`, or
Nightwatch as the current state.

## Idempotence and Recovery

Every `npm install` in this plan can be re-run safely; on this branch, unlike before this plan, no
step requires reverting `package-lock.json` afterward (see "Concrete Steps"). Each milestone's file
deletions (`react-app-polyfill`/`babel-polyfill` imports, `.eslintrc.extra.js`, `.eslintignore`,
`nightwatch.conf.js`, `src/tests/nightwatch/`) are ordinary Git history from this point forward —
recoverable with `git checkout <commit>~1 -- <path>` against this branch's own history if a
milestone turns out to have deleted something still needed, since every milestone is committed
separately (see `CONTRIBUTING.md`'s commit guidance and this repository's ExecPlan addendum on
committing frequently).

The riskiest single step is Milestone 4's deletion of `src/tests/nightwatch/` and
`nightwatch.conf.js` — do this only after every ported file under `tests/playwright/specs/` is
confirmed to at least parse and be discovered by `npx playwright test --list` (matching all 13
source files' worth of test cases), so a mid-port interruption never leaves this repository with
neither test suite in a runnable state.

If a specific dependency bump in Milestone 5 causes a regression that cannot be quickly resolved,
the safe recovery is reverting only that one package's `package.json`/`package-lock.json` entry
(`git diff` scoped to those two files after an isolated `npm install <package>@<old-version>`) and
recording the reason in Surprises & Discoveries — do not block the rest of Milestone 5 or any later
milestone on one hard dependency.

## Artifacts and Notes

Baseline transcripts captured during this plan's research, reproduced in condensed form in
"Concrete Steps" above: the `npm install --ignore-scripts` package/vulnerability counts, the full
`ERR_OSSL_EVP_UNSUPPORTED` failure, both `peerDependencies` checks, the `lazyLoad` call-site count,
and the critical `npm audit` findings by `fixAvailable` path. Each milestone's own execution should
append its actual command output here as it lands — this section is empty of milestone-specific
transcripts as of this plan's initial draft, since no milestone has been executed yet.

## Interfaces and Dependencies

New `devDependencies`, with the exact version confirmed current as of 2026-09-15 (re-check with
`npm view <package> version` at implementation time in case a newer patch has shipped since; this
repository's convention is exact pins, no `^`/`~`):

`vite` 8.3.0 (`engines.node`: `^20.19.0 || >=22.12.0`); `@vitejs/plugin-react` 6.1.1 (same engines
floor); `vitest` 5.0.1 (`engines.node`: `^22.12.0 || ^24.0.0 || >=26.0.0` — the binding constraint
on this repository's own new `engines.node` field, see Decision Log); `jsdom` 30.0.1; `eslint`
9.39.5 (the latest 9.x release, not 10.x — see Decision Log for why; `engines.node`: `^18.18.0 ||
^20.9.0 || >=21.1.0`); `@eslint/js` 9.39.5 (matching version); `eslint-plugin-react` 7.37.5;
`eslint-plugin-jsx-a11y` 6.10.2; `@vitest/eslint-plugin` 1.6.27; `globals` 17.12.0;
`@playwright/test` 1.63.0 (`engines.node`: `>=20`); `npm-run-all2` 9.0.3.

Removed `devDependencies`: `react-scripts`, `chromedriver`, `nightwatch`, `request`, `babel-eslint`,
`eslint-plugin-jest`, `npm-run-all` (replaced by `npm-run-all2`, see above).

Removed `dependencies`: `react-app-polyfill`, `babel-polyfill` (both removed in Milestone 1),
`react-loadable` (removed in Milestone 1, replaced by `React.lazy`/`Suspense` — see that milestone's
Surprises & Discoveries), `d3-transition` (see Milestone 5).

Version bumps within `dependencies` (same major version unless noted): `react-router-dom` 5.2.0 →
5.3.4; `d3-scale` 3.2.1 → 4.0.2; `d3-selection` 1.4.2 → 3.0.0; `d3-shape` 1.3.7 → 3.2.0;
`markdown-it` 11.0.0 → 15.0.2; `markdown-it-sup` 1.0.0 → 2.0.0; `memoize-one` 5.1.1 → 6.0.0;
`react-ga` 3.1.1 → 3.3.1; `react-spinners` 0.9.0 → 0.17.1. (`stylus` 0.54.7 → 0.64.0 already
happened in Milestone 1, ahead of schedule — a hard prerequisite for installing Vite at all, not
optional; this last one is also a `devDependency` of the build pipeline in the sense that
`build:css` depends on it, but it is listed today under `dependencies` in `package.json` — leave it
there, this plan does not reorganize that classification.)

New files this plan creates: `src/lib/LazyBoundary.jsx` (Milestone 1, the `react-loadable`
replacement's error boundary), `vite.config.mjs` (repository root), `eslint.config.js` (repository
root), `.nvmrc` (repository root, content: `24`), `index.html` (repository root, moved from
`public/index.html`), `playwright.config.js` (repository root), `tests/playwright/specs/*.spec.js`
(13 files, one per existing Nightwatch spec, preserving the `dashboards/` subdirectory), `tests/
playwright/utils.js` (ported helper functions).

Deleted files: `public/index.html` (moved, not just deleted), `.eslintrc.extra.js`, `.eslintignore`,
`nightwatch.conf.js`, `src/tests/nightwatch/` (entire directory, 13 files), `src/components/views/
styl/BrowserHacks.styl` and its generated CSS, `docs/TOOLCHAIN_MIGRATION.md` (does not exist on this
branch — noted here only so a reader who has seen the abandoned `toolchain` branch does not expect
it to appear).

This plan depends on the `npm` toolchain already described in `CONTRIBUTING.md` (to be updated by
Milestone 6), the `Read`/`Write`/`Edit` tools for every file change described above, and the `Bash`
tool for every command in "Concrete Steps," "Plan of Work," and "Validation and Acceptance."

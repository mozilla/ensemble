# Run lint and tests on GitHub Actions for every push to main and every pull request

This ExecPlan is a living document. The sections `Progress`, `Surprises & Discoveries`,
`Decision Log`, and `Outcomes & Retrospective` must be kept up to date as work proceeds. It is
maintained in accordance with `.claude/skills/execplans/references/PLANS.md`, including its
"Ensemble addendum", which overrides the upstream text where the two disagree.

## Purpose / Big Picture

Nothing checks a commit in this repository today. Contributors run lint and the tests by hand, or
don't. After this change, every push to `main` and every pull request runs a GitHub Actions
workflow named "CI". It reports two checks on the commit and the pull request: "CI / Lint and test"
and "CI / End-to-end tests". A contributor sees a red or green mark without running anything
locally.

To see it working, open a pull request from this branch on `mozilla/ensemble` and watch both checks
go green in the pull request's Checks tab.

Out of scope: a branch-protection rule that makes the checks required (a repository setting, not a
file), Dependabot (deliberately turned off in 2020), and automated deploy.

## Progress

- [x] (2026-10-08) Drafted the plan.
- [x] (2026-10-08) Milestone 1: `.github/workflows/ci.yml` with the `lint-and-test` job, Zizmor
      clean (online mode), docs updated. Locally: lint clean, Vitest 2 files / 4 tests passed.
- [x] (2026-10-08) Milestone 2: `e2e` job added, external link checks removed from the Playwright
      suite, docs updated. Zizmor clean. Locally: Playwright 49 passed against a dev server on
      :3001 (see Surprises).
- [x] (2026-10-08) Milestone 3: both jobs green on pull request #447.

## Surprises & Discoveries

These come from an earlier attempt at this issue, first pushed to pull request #447. That attempt
is kept on the local branches `79--github-actions-ci` and `79--github-actions-ci-rewrite`. They are
restated here so this plan stands alone.

- Observation: `npm run test:jest` fails outright without the compiled CSS.
  Evidence: "Failed to resolve import './css/MetricOverview.css'". The unit-test job must run
  `npm run build:css` first. The end-to-end job does not, because Playwright starts `npm start`,
  which compiles the Stylus.
- Observation: `playwright.config.js` already adapts to CI. GitHub Actions sets `CI=true`, and the
  config then uses the `github` reporter (inline annotations on the pull request), 2 retries, 2
  workers, and refuses to reuse an existing server. The workflow needs to configure none of this.
- Observation: external link checks fail on GitHub's runners for reasons no commit can fix.
  Evidence: `donate.mozilla.org` redirects to a page that returns 403 to non-browser clients,
  `facebook.com` blocks GitHub's runner IP ranges, and `x.com` returns 403 to headless Chromium.

- Observation: locally, Playwright silently tests whatever already listens on port 3000.
  Evidence: outside CI, `reuseExistingServer` is true, so an unrelated server on :3000 (here, a
  Fractal server from another project) made 45 of 49 specs fail with "#not-found ... element(s) not
  found". Check with `lsof -i :3000`. To test without stopping that server, run
  `npx vite --port 3001 --strictPort` and then
  `PLAYWRIGHT_BASE_URL=http://localhost:3001 npx playwright test`. CI is unaffected.

## Decision Log

- Decision: model the workflow on `mozmeao/springfield`'s `unit_tests.yml`. Trigger on `push` to
  `main` and on every `pull_request`. Cancel stale runs with a concurrency group keyed on the pull
  request number. Grant only `permissions: contents: read`. Guard each job with
  `if: github.repository == 'mozilla/ensemble'` so forks don't spend minutes on it.
  Rationale: MozMEAO maintains this repository alongside springfield and bedrock, and matching them
  keeps the three familiar. Bedrock's copy uses unpinned actions, which Zizmor rejects, so
  springfield is the model.
  Date/Author: 2026-09-18, the user's request on the earlier attempt; carried forward.
- Decision: depart from springfield in three places. Set `persist-credentials: false` on
  `actions/checkout`. Read the Node version from `.nvmrc` with `node-version-file`. Pin both actions
  to the full commit SHA of their latest release, with the tag in a trailing comment.
  Rationale: Zizmor flags persisted credentials and unpinned actions, and `AGENTS.md` requires a
  Zizmor-clean workflow. A literal Node version in the workflow would drift from `.nvmrc`.
  Date/Author: 2026-10-08.
- Decision: one workflow file with two jobs. Use `npm ci`. Install only Chromium for Playwright.
  Rationale: one "CI" entry in the Actions tab reads more easily than two workflows. `npm ci`
  installs exactly what `package-lock.json` says. Both Playwright projects use Chromium.
  Date/Author: 2026-10-08.
- Decision: stop checking links that leave the app's own origin. Internal links stay checked.
  Rationale: the user chose this on the earlier attempt, after a per-host exception for
  `donate.mozilla.org` was followed by `facebook.com` and then `x.com` failing the same way.
  Internal links are the ones this repository can break. The accepted cost is that external link
  rot, the kind #448 fixed, is no longer caught automatically.
  Date/Author: 2026-10-01, the user's decision on the earlier attempt; reconfirmed 2026-10-08.

- Decision: reuse pull request #447 for this work rather than open a new one. Force-push this
  branch to `mozilla/79--github-actions-ci` and track that remote branch from here.
  Rationale: the user's choice. It keeps one pull request for issue #79 and its review history.
  Date/Author: 2026-10-08, the user's decision.

## Outcomes & Retrospective

Shipped on pull request #447. Both jobs passed on the first run
(<https://github.com/mozilla/ensemble/actions/runs/37879164574>): "Lint and test" in 17s and
"End-to-end tests" in 1m32s. Playwright reported 47 passed and 2 flaky. The flaky specs were the
title-and-order tests in `dashboards/usage-behavior.spec.js` and `dashboards/user-activity.spec.js`,
which passed on retry. Both load live data from `data.firefox.com`, so expect this now and then.
If a dashboard spec flakes on most runs, investigate it rather than raising the retry count.

Still open, outside this plan: no branch protection, so a red check doesn't block a merge. External
link rot is no longer caught by anything.

## Context and Orientation

Issue #79 (<https://github.com/mozilla/ensemble/issues/79>) was opened in 2018, when a pull request
got no CI feedback. It asks for CI that lints and runs the tests on every commit. The repository
once had CircleCI, but it was turned off in February 2018 (`433a465`), and nothing replaced it.
There is no `.github/` directory today.

The toolchain the workflow drives was replaced in #441 and is recorded in
`docs/execplans/2026-09-15-update-toolchain.md`. What this plan relies on: Node 24, pinned in
`.nvmrc`; and these npm scripts in `package.json`, all of which run with no flags on a clean
checkout.

    npm ci
    npm run build:css         # compiles src/components/views/styl/*.styl into the gitignored css/
    npm run lint              # ESLint (eslint.config.js) plus stylint (.stylintrc)
    npm run test:jest         # Vitest; 2 files in src/tests/jest/
    npm run test:playwright   # Playwright; starts `npm start` on :3000 itself

"The compiled CSS" means `src/components/views/css/`. It is gitignored, and every component imports
a file from it, so Vitest and the dev server fail until `npm run build:css` has run.

The Playwright specs live in `tests/playwright/specs/`. Several of them call `linkWorks` or
`linksWork` from `tests/playwright/utils.js`. Both helpers pass every link to `loadsSuccessfully` in
the same file. For a link inside the app, it navigates there and checks that `#application` renders
and `#not-found` does not. For an external link, it opens the URL in a new browser page and expects
HTTP 200, with three attempts and backoff, plus a redirect-only special case for
`donate.mozilla.org`. `footer.spec.js` and the "All links work" test in `contact.spec.js` check only
external and `mailto:` links. The `dashboards/*.spec.js` specs assert exact metric titles against
live production data on `data.firefox.com`, so a failure there can come from upstream data changing.

Zizmor (<https://zizmor.sh/>) is a static checker for GitHub Actions workflows. It flags things like
unpinned actions, persisted checkout credentials, and template injection. It is not installed
globally on the author's machine; `uvx zizmor` runs it without installing.

Docs that will go stale: `AGENTS.md` says "No CI/CD of any kind exists" (the "Current state"
section) and "what CI (once it exists) already checks" (the PR-description "Testing" guidance).
`CONTRIBUTING.md` says "what CI, once it exists, already checks" and describes `linkWorks` and
`linksWork` without saying they skip external links.

## Plan of Work

### Milestone 1: lint and unit tests

At the end of this milestone, `.github/workflows/ci.yml` exists with one job, `lint-and-test`,
displayed as "Lint and test". Zizmor reports nothing.

1. Look up the latest release tag of `actions/checkout` and `actions/setup-node`, and the full
   commit SHA each tag points to. On 2026-10-08 those were checkout v7.0.1
   (`3d3c42e5aac5ba805825da76410c181273ba90b1`) and setup-node v7.1.0
   (`949feb2413d6458794dcd2491c4babbbce0c15c1`).
2. Create `.github/workflows/ci.yml` with the triggers, concurrency group, and permissions from the
   Decision Log. The `lint-and-test` job runs on `ubuntu-latest`, carries the repository guard, and
   has these steps: checkout with `persist-credentials: false`; setup-node with
   `node-version-file: '.nvmrc'` and `cache: npm`; then `npm ci`, `npm run build:css`,
   `npm run lint`, and `npm run test:jest`, each as a named step. Use 4-space indentation, which
   `.editorconfig` sets for `yml`.
3. Run Zizmor and fix anything it reports.
4. Update the docs this milestone makes stale. In `AGENTS.md`, rewrite the "No CI/CD of any kind
   exists" bullet to say CI runs on GitHub Actions in `.github/workflows/ci.yml` and there is still
   no CD; keep the history of what was removed and when. Drop "(once it exists)" from the
   PR-description guidance. In `CONTRIBUTING.md`, drop ", once it exists,". Describe the jobs that
   exist at this point; Milestone 2 adds the end-to-end job to the same sentence.

### Milestone 2: end-to-end tests

At the end of this milestone, `ci.yml` has a second job, `e2e`, displayed as "End-to-end tests",
and the Playwright suite no longer reaches outside the app.

1. In `tests/playwright/utils.js`, make `loadsSuccessfully` return early for any URL whose origin
   differs from the current page's. This also covers `mailto:`, whose origin is `null`. Delete the
   now-unused status-code constants, the `donate.mozilla.org` special case, the retry loop, and the
   comment lines that described them. Replace them with one comment saying external links are not
   checked and why.
2. Delete `tests/playwright/specs/footer.spec.js`. Delete the "All links work" test and the
   `linksWork` import from `tests/playwright/specs/contact.spec.js`. Both checked only external and
   `mailto:` links, so they would now pass while checking nothing.
3. Add the `e2e` job to `ci.yml`: same checkout, setup-node, guard, and `npm ci` as Milestone 1,
   then `npx playwright install --with-deps chromium` and `npm run test:playwright`.
4. Run Zizmor again.
5. Update the docs. In `AGENTS.md`, add the end-to-end tests to the CI bullet. In
   `CONTRIBUTING.md`, add the same, and say that `linkWorks` and `linksWork` check only links
   within the app. Check the "Testing Guidelines" section of `AGENTS.md` for the same helper
   description and update it if it implies external links are checked.

### Milestone 3: prove it on GitHub

The workflow only runs on GitHub, so local checks cannot prove it. This branch is pushed to the
remote branch `79--github-actions-ci`, replacing the earlier attempt there, so it appears as pull
request #447 against `main` on `mozilla/ensemble`. Wait for both checks to finish. If the
end-to-end job fails, re-run it once before investigating, because the dashboard specs depend on
live data. Record which it was. Then fill in `Outcomes & Retrospective`.

## Concrete Steps

From the repository root, `/Users/shobson/Sites/ensemble` on the author's machine:

    npm ci
    npm run build:css
    npm run lint
    npm run test:jest
    npm run test:playwright
    GH_TOKEN=$(gh auth token) uvx zizmor --pedantic .github/workflows/ci.yml

Without `GH_TOKEN`, Zizmor runs offline and skips the audits that query GitHub, such as checking
that a pinned SHA matches its tag comment.

Expected: `npm run lint` exits 0 with no errors. `npm run test:jest` reports 2 test files passed.
`npm run test:playwright` passes, possibly with retries on the dashboard specs. Zizmor prints:

    No findings to report. Good job!

## Validation and Acceptance

Accept the work when all of these hold:

1. Zizmor reports no findings for `.github/workflows/ci.yml`.
2. `npm run lint`, `npm run test:jest`, and `npm run test:playwright` pass locally on the branch.
3. On a pull request against `mozilla/ensemble`, "CI / Lint and test" and "CI / End-to-end tests"
   both appear in the Checks tab and both pass.
4. `grep -rn "once it exists\|No CI/CD" AGENTS.md CONTRIBUTING.md` prints nothing.

## Idempotence and Recovery

Every local command above is safe to repeat. Re-running a failed job on GitHub
(`gh run rerun <run-id> --failed`) is safe and changes nothing in the repository. To back the work
out, delete `.github/workflows/ci.yml`; nothing else depends on it.

## Interfaces and Dependencies

Future branch protection should require the check names "CI / Lint and test" and "CI / End-to-end
tests". GitHub builds those names from the workflow's `name` and each job's `name`, so keep both
stable. The job keys `lint-and-test` and `e2e` are what `needs:` and the API refer to; keep them
stable too.

The workflow depends on `actions/checkout` and `actions/setup-node`, both pinned by SHA, and on
`ubuntu-latest` having network access to npm, the Playwright browser CDN, and `data.firefox.com`.

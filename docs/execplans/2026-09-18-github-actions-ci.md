# Add a GitHub Actions workflow that lints and tests every commit and pull request

This ExecPlan is a living document. The sections `Progress`, `Surprises & Discoveries`,
`Decision Log`, and `Outcomes & Retrospective` must be kept up to date as work proceeds. This
document must be maintained in accordance with the specification checked in at
`.claude/skills/execplans/references/PLANS.md`, including its "Ensemble addendum" section, which
overrides the upstream text where the two disagree.

## Purpose / Big Picture

Today, nothing checks a commit or a pull request against this repository's own rules. A
contributor has to remember to run `npm run lint`, `npm run test:jest`, and `npm run
test:playwright` by hand, on their own machine, before anyone reviews their change. If they forget,
or their machine happens to hide a problem a clean checkout would show, nothing stops a broken
commit from landing. "Continuous integration" (usually shortened to "CI") means the opposite of
that: an automated system, running on infrastructure nobody has to maintain, that repeats those same
checks itself every time code changes, and reports the result back where a human will see it without
being asked.

After this plan, every push to this repository's `main` branch and every pull request against it —
regardless of which branch it comes from — triggers exactly that. Concretely: open this repository on
GitHub, click the "Actions" tab, and a workflow run named "CI" appears for the triggering commit,
made of two jobs, "Lint and test" and "End-to-end tests." A few minutes later each job shows a green
check or a red X. On a pull request, the same two checks appear directly on the PR's page, and GitHub
will not let anyone claim the PR is ready to merge while either one is red. Push a commit that adds a
real ESLint violation (a stray `var`, a missing semicolon under the `semi` rule) and the "Lint and
test" job goes red, with the exact rule and file/line shown inline in the job's log, in the same
place a developer would see it running `npm run lint` locally. This is the entire scope of GitHub
issue #79, <https://github.com/mozilla/ensemble/issues/79>, "Implement a CI to do linting and run
tests for each commit," opened in 2018. Its full body, verbatim: "As far as I can tell it isn't
currently enabled, because I'm not seeing any CI bots running against the current LICENSE PR." The
one reply, from a maintainer the same year: "You're right, it's not currently enabled. Good catch. We
should do this." Nothing else has been said on it since, and it has stayed open the entire time.

What this plan deliberately does not do: it does not configure a GitHub branch-protection rule that
makes these checks mandatory before a pull request can merge. That is a separate, one-click change
in this repository's own Settings on GitHub, not a file this plan can add, and it is a policy
decision (who can override a red check, and when) that deserves its own explicit go-ahead rather than
being folded silently into "add CI." It also does not touch deploy: this repository has no automated
way to publish a build to `data.firefox.com` today, a separate and long-standing gap, and adding one
is not what issue #79 asks for.

## Progress

- [x] (2026-09-18) Read this branch's `AGENTS.md`, `README.md`, `CONTRIBUTING.md`, and
      `.claude/skills/execplans/references/PLANS.md` before drafting anything.
- [x] (2026-09-18) Fetched and read GitHub issue #79 in full, including its one reply, quoted above
      in "Purpose / Big Picture."
- [x] (2026-09-18) Discovered that `main` does not yet have the Vite/Vitest/Playwright/flat-ESLint
      toolchain this workflow needs — it is still on the pre-modernization stack (create-react-app,
      Jest, Nightwatch), which is why `main`'s own `npm run lint` and `npm install` are broken on this
      machine's architecture today. That modernization is open, unmerged pull request #444
      (`441--update-toolchain`). Presented this, and two alternative branch bases, to the user, who
      explicitly chose to branch off `441--update-toolchain` (see Decision Log).
- [x] (2026-09-18) Created branch `79--github-actions-ci` off the local `441--update-toolchain`
      branch, which is confirmed identical to `mozilla/441--update-toolchain` (no diff between the
      two). Confirmed this base branch already includes `AGENTS.md`, `CLAUDE.md`, and the
      `.claude/skills/execplans/` skill files this plan itself depends on to exist.
- [x] (2026-09-18) On this exact branch, from a clean `node_modules` (`rm -rf node_modules && npm
      ci`), verified directly rather than assumed: `npm ci` installs 634 packages with no flag and no
      error; `npm run build:css` compiles every `.styl` file with no error; `npm run lint` (ESLint's
      flat config plus stylint) exits 0; `npm run test:jest` (Vitest) reports "Test Files 2 passed
      (2)" / "Tests 4 passed (4)"; `npm run build:app` (Vite) reports "✓ built" with no environment
      variable needed; `npx playwright test --list` enumerates 51 tests across 12 spec files; a full
      `npx playwright test` run exits 0 (all 51 pass, using the retry budget `playwright.config.js`
      already allocates). Full transcripts are in "Artifacts and Notes."
- [x] (2026-09-18) Discovered this branch's own `AGENTS.md` is a stale, pre-migration snapshot that
      contradicts the verified results above in several places (still describes create-react-app,
      webpack, a missing `.nvmrc`, and two disjoint ESLint configs). Recorded as a Surprise below;
      not fixed by this plan (out of scope — see Decision Log).
- [x] (2026-09-18) Fetched and read the actual, current GitHub Actions workflows from two sibling
      MozMEAO repositories, `mozilla/bedrock` and `mozmeao/springfield`
      (`.github/workflows/unit_tests.yml` and `.github/workflows/ensure_pre_commit_standards.yml` in
      each), per the user's explicit request to model this workflow on their house style. Extracted
      the reusable patterns into this plan's own workflow design — see "Context and Orientation" and
      "Decision Log" for exactly what was kept, what was adapted, and why.
- [x] (2026-09-18) Drafted the exact workflow YAML below and validated it directly with `uvx zizmor`
      (no separate installation step needed — `uvx`, already present on this machine, downloads and
      runs the tool in one command), iterating twice until a `--pedantic` run reported "No findings to
      report. Good job!" `CONTRIBUTING.md`'s Security & Configuration Tips section requires this
      check for any new workflow, and it has now actually been run, not assumed.
- [x] (2026-09-18) User confirmed the two-milestone breakdown and asked to proceed with
      implementation.
- [x] (2026-09-18) Milestone 1: created `.github/workflows/ci.yml` with the `lint-and-test` job
      exactly as specified in "Plan of Work," and validated it with `uvx zizmor --pedantic
      .github/workflows/ci.yml`, which reported "No findings to report. Good job!" Not yet pushed —
      pushing to the shared `mozilla/ensemble` remote is a separate, explicit-confirmation step (see
      Concrete Steps), and the real GitHub Actions run this milestone's acceptance depends on has not
      happened yet.
- [ ] Milestone 1, remaining: push the branch, observe a real, passing "CI / Lint and test" check run
      via `gh run watch`, and record the result here.
- [ ] Milestone 2 (add the `e2e` job; update the now-stale "CI doesn't exist" doc lines): not yet
      started.

## Surprises & Discoveries

- Observation: `main` does not have the toolchain modernization that PR #444 (`441--update-toolchain`)
  already implements, even though this session's working tree — before this plan's branch was
  created — locally combined that PR's content with two other unmerged PRs (#443, "Add AGENTS file
  and execplan Claude skill"; #446, "Document data pipeline"). Running `git diff --stat
  main...441--update-toolchain` shows the full create-react-app-to-Vite migration as a real,
  outstanding diff; `git log --oneline --all --grep=vite -i` shows the migration's milestone commits
  exist only on `441--update-toolchain` (and branches built from it), not on `main`.
  Evidence: `gh pr list --repo mozilla/ensemble --state all` shows PR #444 ("Update toolchain (Fix
  #441)") as `OPEN`, not merged.
- Observation: this branch's `AGENTS.md` (at the repository root) is internally stale — it still
  says "`npm install` fails outright on an Apple Silicon (arm64) Mac," "there is no `.nvmrc`," and
  describes a two-config, `.jsx`-blind ESLint setup left over from create-react-app — none of which
  matches this same branch's actual, verified state: a plain `npm ci` installs cleanly, `.nvmrc`
  exists and contains `24`, and `npm run lint` runs one flat-config ESLint pass that does cover
  `.jsx`. `CONTRIBUTING.md` and `README.md`, by contrast, already describe the real, current state
  correctly. This means whoever wrote PR #444's Milestone 6 (which explicitly rewrote
  `CONTRIBUTING.md` and `README.md`) never touched `AGENTS.md`, leaving one governing document
  out of sync with the two it was supposed to be consistent with.
  Evidence: reading `AGENTS.md` lines 56–64 directly against this session's own command transcripts
  in "Artifacts and Notes" below, which contradict it point for point.
- Observation: the ExecPlans skill's own reference document
  (`.claude/skills/execplans/references/PLANS.md`, "Ensemble addendum," section "Validation commands
  that actually work") is itself stale relative to this branch: it says `npm run lint` "currently
  fails outright" and warns never to write a `test:nightwatch` command into a plan because Nightwatch
  cannot run. On this branch, verified directly in this session, `npm run lint` exits 0, and
  Nightwatch does not exist in this repository at all anymore — it was fully replaced by Playwright
  in PR #444. This plan uses the commands actually verified in this session (recorded in "Artifacts
  and Notes"), not that document's text, per this repository's own `AGENTS.md` rule against claiming
  a result that was not actually produced. Reconciling that skill document with the post-#441 world
  is its own piece of housekeeping, not something this plan takes on.
- Observation: `playwright.config.js` already anticipates running inside GitHub Actions with zero
  workflow-side configuration. Its `reporter` option switches to `'github'` (GitHub's own
  check-annotation format, which prints failures as inline annotations on the diff, not just plain
  text) whenever `process.env.CI` is set; `retries` doubles to `2` and `workers` drops to `2` under
  the same condition. GitHub Actions sets `CI=true` on every runner automatically — this plan's
  workflow does not need to set it, reference it, or configure any of the three options; they were
  already wired up as part of PR #444.
  Evidence: `playwright.config.js` lines defining `reporter`, `retries`, and `workers`, quoted in
  "Context and Orientation" below.
- Observation: `npm run test:jest` fails outright, not just cosmetically, if
  `src/components/views/css/` (gitignored, Stylus-generated) does not already exist — confirmed by
  moving that directory aside and re-running the command, which failed both existing test files with
  "Failed to resolve import './css/....css'. Does the file exist?" `npm run build:css` is therefore a
  hard prerequisite for the unit-test job in CI, not merely a nicety for a production build, and this
  plan's `lint-and-test` job runs it explicitly before `npm run lint`/`npm run test:jest` rather than
  assuming either tolerates its absence.
  Evidence: the exact Vitest error transcript is reproduced in "Artifacts and Notes."
- Observation: `mozilla/bedrock` and `mozmeao/springfield` — the two sibling MozMEAO repositories the
  user asked this plan to model — already converge on a specific, current house style for exactly
  this kind of workflow (their `unit_tests.yml` and `ensure_pre_commit_standards.yml`): restrict the
  `push` trigger to `branches: [main]` rather than every branch, rely on `pull_request` (with no
  `branches` filter, so it fires for a PR targeting any branch) to cover feature-branch commits,
  set a `concurrency` group keyed on the PR number when one exists and the ref otherwise
  (`${{ github.workflow }}-${{ github.event.pull_request.number || github.ref }}`) so a new push
  cancels a stale in-flight run instead of piling up, declare `permissions: contents: read` at the
  workflow level, and guard every job with `if: github.repository == '<org>/<repo>'` so a fork's copy
  of the workflow does not run against the fork itself. `springfield`'s copy pins `actions/checkout`
  and `actions/setup-node` to a commit SHA with a trailing `# vX.Y.Z` comment; `bedrock`'s copy of the
  same workflow still uses the unpinned, mutable tag `actions/checkout@v6` — the two have drifted from
  each other, and `springfield`'s stricter form is also the only one of the two that would pass this
  repository's own Zizmor requirement (an unpinned `uses:` is exactly what Zizmor's `unpinned-uses`
  audit flags). This plan follows `springfield`'s stricter form throughout, for that reason.
  Evidence: `gh api repos/mozmeao/springfield/contents/.github/workflows/unit_tests.yml` and the
  equivalent for `mozilla/bedrock`, fetched and read directly in this session; full content quoted in
  "Context and Orientation."
- Observation: neither sibling repository sets `persist-credentials: false` on its `actions/checkout`
  step. Running `uvx zizmor` against a workflow that omits it produces a medium-severity
  `artipacked` finding ("does not set persist-credentials: false") — a real, if low-confidence
  (Zizmor's own label), finding about a checked-out `.git/config` continuing to carry a usable
  repository-write credential for the rest of the job, which a later, unrelated step (or a compromised
  dependency's install script) could read. This repository's own `CONTRIBUTING.md` requires a new
  workflow to pass Zizmor before being considered complete, which is a stricter bar than "matches the
  sibling repos" wherever the two disagree — this plan sets `persist-credentials: false` even though
  neither sibling does, and a final `uvx zizmor --pedantic` run against the complete two-job workflow
  (both jobs, both checkout steps) reports "No findings to report. Good job!"
  Evidence: the zizmor transcript before and after adding `persist-credentials: false`, both
  reproduced in "Artifacts and Notes."

## Decision Log

- Decision: base branch `79--github-actions-ci` on the open, unmerged `441--update-toolchain` branch
  (PR #444), not on `main` and not on the `do-not-push` branch this session's working tree started on.
  Rationale: the user's explicit choice, given all three options with their trade-offs in
  conversation. This workflow's own commands (`npm run test:jest` via Vitest, `npm run
  test:playwright` via Playwright, one flat-config ESLint pass) only exist post-#441; `main` still has
  the pre-migration stack, on which `npm install` fails outright on this machine's architecture and
  Nightwatch cannot run at all, so a workflow targeting `main` today could not do what issue #79 asks
  without redoing #441's work first. `do-not-push` would have worked functionally (it already
  contains #444's content) but its history also carries two other unmerged, unrelated PRs' worth of
  documentation changes (#443, #446), which would show up as unrelated-looking ancestry in this
  branch's own diff against `main` once #444 eventually merges.
  Date/Author: 2026-09-18, user's explicit choice in conversation.
- Decision: model the workflow's structure directly on `mozmeao/springfield`'s
  `.github/workflows/unit_tests.yml` and `ensure_pre_commit_standards.yml`, reconciling against
  `mozilla/bedrock`'s slightly older copies of the same two files where the two disagree, rather than
  designing the trigger/concurrency/permissions shape from scratch.
  Rationale: the user's explicit request in conversation, and a real, substantive reason to want it:
  these are the two other MozMEAO frontend repositories a future ensemble contributor is likely to
  have also touched, so matching their shape lowers the cost of reading this workflow for the first
  time. Concretely adopted: `push` restricted to `branches: [main]` (not every branch) with an
  unfiltered `pull_request` trigger to cover feature-branch commits; the PR-number-aware
  `concurrency` group; workflow-level `permissions: contents: read`; and a
  `github.repository == 'mozilla/ensemble'` guard on each job. Concretely adapted rather than copied
  verbatim: `springfield`'s literal `node-version: 24` becomes `node-version-file: '.nvmrc'` here,
  because ensemble (unlike, as far as this research found, either sibling) already has an `.nvmrc`
  file for exactly this purpose (added by PR #444, see that PR's own Decision Log) — pointing at it
  avoids a second, driftable copy of the same version number. `persist-credentials: false` is added
  even though neither sibling sets it, because this repository's own `CONTRIBUTING.md` requires a
  Zizmor-clean workflow and Zizmor flags its absence (see Surprises & Discoveries) — a repository's
  own written rule wins over "match the siblings" wherever the two conflict.
  Date/Author: 2026-09-18, decided during this plan's drafting, following the user's explicit
  request to lean on the sibling repositories' house style.
- Decision: one workflow file, `.github/workflows/ci.yml`, containing two jobs (`lint-and-test`,
  `e2e`) rather than two separate workflow files.
  Rationale: both `bedrock` and `springfield` put conceptually related checks (their two flavors of
  "unit tests," JS and Python) in one `unit_tests.yml` file rather than splitting per-language; the
  same reasoning applies here — "lint and test on every commit" is one coherent piece of automation
  from a reviewer's point of view, and a single workflow file gets a single, obvious name ("CI") in
  the Actions tab and on a PR's checks list, rather than two separately-named workflows a reader has
  to mentally group together.
  Date/Author: 2026-09-18, decided during this plan's drafting.
- Decision: pin `actions/checkout` to `3d3c42e5aac5ba805825da76410c181273ba90b1` (tagged `v7.0.1`) and
  `actions/setup-node` to `820762786026740c76f36085b0efc47a31fe5020` (tagged `v7.0.0`) — the current
  latest release of each as of this writing — rather than either an unpinned tag or `springfield`'s
  own pinned versions (`v7.0.1` for checkout, matching exactly, but `v6.5.0` for setup-node, one minor
  behind the current latest).
  Rationale: `CONTRIBUTING.md` requires a Zizmor-clean workflow, and Zizmor's `unpinned-uses` audit
  treats any mutable tag (`@v7`, `@main`) as a finding regardless of which tag; a pinned commit SHA is
  the only form that passes outright. Using the current latest release of each action, rather than
  freezing to whatever `springfield` happens to have pinned on the day this plan was written, avoids
  starting this repository's very first workflow already one version behind — `springfield`'s own pin
  will keep moving forward independently of this repository regardless of which version is chosen
  today.
  Date/Author: 2026-09-18, decided during this plan's drafting.
- Decision: include the Playwright end-to-end suite (`npm run test:playwright`) as a required job in
  this same workflow, not as a separate, non-blocking, or deferred piece of work.
  Rationale: `playwright.config.js` is already written as if this were coming (see Surprises &
  Discoveries — its `reporter`/`retries`/`workers` options are all conditioned on `process.env.CI`,
  which only GitHub Actions or an equivalent CI system would ever set); a real run of the full suite
  in this session passed outright (51 of 51, exit code 0); and issue #79 asks for "linting and
  running tests," not "linting and running some of the tests." The known risk, recorded here rather
  than smoothed over: two of these specs (`contact.spec.js`'s "All links work",
  `footer.spec.js`'s "All footer links work") check real, live external URLs and have, in the past
  (documented in PR #444's own `docs/execplans/2026-09-15-update-toolchain.md`), failed for reasons
  external to this repository — a dead forum link, a redirect target that blocks non-browser HTTP
  clients. Both passed cleanly in this session's own run. If either becomes a recurring source of a
  red check unrelated to the commit that triggered it, the fix is to make that specific assertion
  non-blocking or to fix/remove the dead link it is checking — not to weaken CI's coverage as a
  reflex the first time it happens.
  Date/Author: 2026-09-18, decided during this plan's drafting.
- Decision: use `npm ci`, not `npm install` (the command `CONTRIBUTING.md` documents for local
  development), inside the workflow.
  Rationale: `npm ci` deletes `node_modules` first and installs exactly what `package-lock.json`
  specifies, with no possibility of silently drifting from the lockfile the way a plain `npm install`
  can — the standard, narrower tool for a one-shot CI install rather than an iterative local one.
  Verified directly on this branch, from a clean `node_modules`, that `npm ci` succeeds with no flag
  and no error (see Progress).
  Date/Author: 2026-09-18, decided during this plan's drafting.
- Decision: do not add a GitHub branch-protection rule requiring these checks before merging, and do
  not add a `.github/dependabot.yml` or any other automation beyond the one workflow file, even though
  both would be natural, related follow-ups.
  Rationale: a branch-protection rule is a repository Settings change, not a file in this diff — it
  is a policy decision (can anyone override a red check, and under what circumstance) that deserves
  its own explicit request rather than being bundled into "add a CI workflow." Dependabot was
  deliberately disabled here in 2020 (`AGENTS.md`'s "Current state" section, and this repository's own
  git history) — reviving it is a separate decision with its own trade-offs (a returning flood of
  automated PRs), not implied by issue #79's text.
  Date/Author: 2026-09-18, decided during this plan's drafting.

## Outcomes & Retrospective

Not started. This plan has been drafted, its commands verified directly in this session, and its
draft workflow validated with Zizmor — but no milestone below has been executed yet, and this section
will be filled in once they have, per this repository's requirement not to claim a result before it
exists.

## Context and Orientation

`mozilla/ensemble` is a client-side-only React 16 single-page application: the entire source behind
`data.firefox.com`, the Firefox Public Data Report. It fetches every number it displays at runtime
from a separate service and bundles none of its own — nothing in this plan touches that data layer at
all. The repository root (`/Users/shobson/Sites/ensemble` on this machine) holds `package.json` and
`package-lock.json` (the one dependency manifest and lockfile in this repository), `.nvmrc`
(containing exactly `24`), `playwright.config.js`, `vite.config.mjs`, and, as of this branch,
`AGENTS.md`, `CLAUDE.md`, and `.claude/skills/execplans/` (all three added by the still-open PR #443,
folded into this branch's base — see "Surprises & Discoveries" for why `AGENTS.md` specifically is
stale). `src/` holds all application and unit-test code; `tests/playwright/specs/` holds the 12
end-to-end spec files. **There is no `.github/` directory anywhere in this repository today** —
confirmed directly with `ls -la .github`, which reports "No such file or directory" — so this plan
creates that directory for the first time, along with everything under it.

**Term of art: "GitHub Actions."** GitHub's own, built-in automation system, included free for public
repositories, requiring nothing to install or host. A YAML file placed at `.github/workflows/<any
name>.yml` describes one "workflow." Pushing a commit, or opening/updating a pull request, to a
repository that has such a file causes GitHub itself to provision a brand-new virtual machine (a
"runner") on its own infrastructure, check out the repository's code onto it, and carry out whatever
the workflow file says, entirely automatically — no server of this repository's own is involved, and
the runner is thrown away afterward. A workflow is made of one or more "jobs" (independent units of
work; this plan's workflow has two, `lint-and-test` and `e2e`), and each job is made of "steps," which
run in order, top to bottom, on the same runner, and share that runner's filesystem. A step that says
`uses: someone/some-action@some-ref` runs a reusable, packaged step someone else wrote and published
(this plan uses two, both published by GitHub itself: `actions/checkout`, which clones this repository
onto the runner, and `actions/setup-node`, which installs a specific Node.js version onto it); a step
that says `run: <shell command>` just runs that command directly, exactly as if typed at a terminal on
the runner.

**Term of art: "pin an action to a commit SHA."** `uses: actions/checkout@v7` names a tag — a human-
readable label its publisher can move to point at different code over time (accidentally, or if the
publisher's account or repository is ever compromised, maliciously). `uses:
actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1 # v7.0.1` names an exact, immutable commit
instead, so the workflow always runs literally the same code regardless of what the `v7` tag points
to later; the `# v7.0.1` is a plain comment, ignored by GitHub, that lets a human reading the file
still tell which release that commit corresponds to.

**Term of art: "Zizmor."** A static-analysis tool — meaning it reads a workflow file's text and
reasons about it, without ever actually running the workflow — that looks for exactly this kind of
GitHub-Actions-specific security mistake (an unpinned action, a checkout step that leaves a
repository-write credential sitting in place after it is no longer needed, a workflow trigger that
lets an outside contributor's pull-request title or body run as if it were a trusted shell command).
This repository's own `CONTRIBUTING.md`, in its "Security & Configuration Tips" section, already
requires "if a changeset adds a GitHub Action or workflow (there are none today), check it with
Zizmor before considering the work complete." It runs as `uvx zizmor <path-to-workflow-file>` — `uvx`,
a companion to the `uv` Python tool already installed on this machine, downloads Zizmor (a Python
package) and runs it in one step, with nothing to install ahead of time. `uvx zizmor --version`,
confirmed directly in this session, reports `zizmor 1.30.1`.

**What is verified, directly, on this branch, in this session** (superseding this branch's own
`AGENTS.md`, which is stale — see "Surprises & Discoveries"): from a clean `node_modules` (`rm -rf
node_modules && npm ci`), a plain `npm ci` installs 634 packages with no flag and no error (17
vulnerabilities reported: 3 moderate, 14 high, 0 critical — a pre-existing count unrelated to this
plan). `npm run build:css` runs the `stylus` CLI over every `.styl` file under
`src/components/views/styl/` and writes the compiled result to the gitignored
`src/components/views/css/` directory; every component's own `import './css/Foo.css';` depends on
that directory already existing, and moving it aside and re-running `npm run test:jest` reproduces
"Failed to resolve import './css/Dashboard.css' from 'src/components/views/Dashboard.jsx'. Does the
file exist?" — confirming this is a hard prerequisite, not a nicety. `npm run lint` runs `eslint .`
(one flat-config file, `eslint.config.js`, covering both `.js` and `.jsx`) and then `stylint
src/components/views/styl`, and exits 0. `npm run test:jest` runs `vitest run` and reports "Test Files
2 passed (2)" / "Tests 4 passed (4)." `npm run build:app` runs `vite build` and reports "✓ built" with
no environment variable needed. `npx playwright test --list` enumerates 51 tests across 12 files
(11 in a `chromium` project, 2 more in a `chromium-no-js` project that disables JavaScript); a full
`npx playwright test` run, executed directly in this session, exits 0.

**`playwright.config.js` is already written expecting to run in CI.** Quoting the three relevant
lines directly:

    retries: process.env.CI ? 2 : 1,
    workers: process.env.CI ? 2 : 4,
    reporter: process.env.CI ? 'github' : 'line',

`process.env.CI` is not something this plan's workflow needs to set — every GitHub Actions runner
sets the environment variable `CI=true` automatically, on every job, with no configuration. Once this
plan's `e2e` job exists at all, these three lines start behaving differently (more retries, fewer
parallel workers, and — the most visible difference — GitHub's own annotation format instead of a
plain-text report, meaning a failing assertion shows up as an inline comment directly on the
offending line of the diff, the same way a human reviewer's comment would) with no further change
needed.

**Restating GitHub issue #79 in full**, since it is old enough (2018) and short enough that summarizing
it any further would lose information rather than compress it: the issue's title is "Implement a CI
to do linting and run tests for each commit." Its entire body: "As far as I can tell it isn't
currently enabled, because I'm not seeing any CI bots running against the current LICENSE PR." One
reply exists, from a maintainer, the same day: "You're right, it's not currently enabled. Good catch.
We should do this." No further discussion exists on the issue; it has remained open since.

**How `mozilla/bedrock` and `mozmeao/springfield` structure the equivalent workflow**, fetched and
read directly in this session via `gh api repos/mozmeao/springfield/contents/.github/workflows/
unit_tests.yml` and the equivalent path in `mozilla/bedrock` (both public repositories, no
authentication beyond this session's existing `gh` login needed). Both are Django applications with a
JS test layer alongside the Python one, which is why their `unit_tests.yml` has a `test-python` job
this repository has no equivalent of — the relevant parts, common to both repositories' current
files, are the trigger, concurrency, and permissions shape:

    on:
      push:
        branches:
          - 'main'
      pull_request:
      merge_group:

    concurrency:
      group: ${{ github.workflow }}-${{ github.event.pull_request.number || github.ref }}
      cancel-in-progress: true

    permissions:
      contents: read

    jobs:
      test-js:
        runs-on: ubuntu-latest
        if: github.repository == 'mozmeao/springfield'
        steps:
          - uses: actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1 # v7.0.1
          - uses: actions/setup-node@249970729cb0ef3589644e2896645e5dc5ba9c38 # v6.5.0
            with:
              node-version: 24
              cache: npm
          - name: "Install JS dependencies"
            run: npm ci
          - name: "Run JS tests"
            run: xvfb-run npm test

`merge_group:` is a trigger this repository has no equivalent need for — it only fires as part of
GitHub's "merge queue" feature, which neither `bedrock`/`springfield` nor this repository currently
has enabled; this plan omits it rather than adding an unused trigger. `xvfb-run` (a virtual display,
needed for a browser-launching test that expects a real screen to exist) has no equivalent need here
either — Playwright's own headless mode does not need a virtual display. `bedrock`'s copy of this same
file still pins `actions/checkout@v6` unpinned (a mutable tag, not a commit SHA) — the two
repositories' copies have drifted from each other since springfield's was last updated; this plan
follows springfield's stricter, fully-pinned form throughout, since that is also the only form that
satisfies this repository's own Zizmor requirement.

## Plan of Work

**Milestone 1 — Add `.github/workflows/ci.yml` with a fast, fully hermetic `lint-and-test` job.**
At the end of this milestone, pushing any commit to this repository's `main` branch, or opening or
updating any pull request against it, produces a visible, named check ("CI / Lint and test") in
GitHub's own UI — on the commit itself, and on the pull request's page if one exists — within a
couple of minutes, with no dev server, no browser, and no live external network access beyond `npm
ci`'s own package downloads.

Concretely: create the directory `.github/workflows/` (git creates it automatically the moment a file
is added under that path — there is no separate "make a directory" step) and, inside it, the file
`ci.yml`, with this exact content:

    name: CI

    on:
      push:
        branches:
          - main
      pull_request:

    concurrency:
      group: ${{ github.workflow }}-${{ github.event.pull_request.number || github.ref }}
      cancel-in-progress: true

    permissions:
      contents: read

    jobs:
      lint-and-test:
        name: Lint and test
        runs-on: ubuntu-latest
        if: github.repository == 'mozilla/ensemble'
        steps:
          - uses: actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1 # v7.0.1
            with:
              persist-credentials: false
          - uses: actions/setup-node@820762786026740c76f36085b0efc47a31fe5020 # v7.0.0
            with:
              node-version-file: '.nvmrc'
              cache: npm
          - name: "Install dependencies"
            run: npm ci
          - name: "Compile Stylus"
            run: npm run build:css
          - name: "Run lint"
            run: npm run lint
          - name: "Run unit tests"
            run: npm run test:jest

Every choice in this file is explained where it was decided (see "Decision Log") or in "Context and
Orientation" above; nothing here should be treated as boilerplate copied without a reason. After
creating the file, run `uvx zizmor --pedantic .github/workflows/ci.yml` from the repository root and
confirm it prints "No findings to report. Good job!" before committing — this exact file, checked in
this session, already does (see "Artifacts and Notes").

Commit the file with a plain, imperative message (for example, "Add CI workflow for lint and unit
tests (#79)"). Pushing this commit to `mozilla/ensemble` is the step that actually causes GitHub to
run it for the first time — pushing is a visible, shared-state action on a real upstream repository,
so do this only after confirming with whoever is driving the session, regardless of anything else
this plan says, exactly as this session's own operating rules require. Once pushed, `gh run list
--repo mozilla/ensemble --branch 79--github-actions-ci --limit 5` should show a run named "CI" for the
new commit; `gh run watch --repo mozilla/ensemble <run-id>` (the run ID is the leftmost column of the
`run list` output) follows it live until it finishes.

**Milestone 2 — Add the `e2e` job to the same workflow, then retire the now-false "CI doesn't exist"
doc lines.** At the end of this milestone, the same "CI" workflow run also includes a second check,
"CI / End-to-end tests," running the full 51-test Playwright suite against a dev server the workflow
starts for itself — and, once that has been observed passing for real (not assumed), the two places in
this branch's documentation that currently say CI does not exist yet are corrected, because by then it
demonstrably does.

Concretely: edit `.github/workflows/ci.yml`, adding a second job below `lint-and-test` (same file,
same triggers, same concurrency group — both jobs run together as one workflow run):

      e2e:
        name: End-to-end tests
        runs-on: ubuntu-latest
        if: github.repository == 'mozilla/ensemble'
        steps:
          - uses: actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1 # v7.0.1
            with:
              persist-credentials: false
          - uses: actions/setup-node@820762786026740c76f36085b0efc47a31fe5020 # v7.0.0
            with:
              node-version-file: '.nvmrc'
              cache: npm
          - name: "Install dependencies"
            run: npm ci
          - name: "Install Playwright browsers"
            run: npx playwright install --with-deps chromium
          - name: "Run end-to-end tests"
            run: npm run test:playwright

The two spaces before `e2e:` above matter: they place it as a sibling of `lint-and-test:` under
`jobs:`, at the same indentation `lint-and-test:` itself already has — not as a new top-level key of
the workflow file. Reconstructing the full file this way and validating it (see "Artifacts and
Notes") confirms it parses as two jobs under one `jobs:` map, not one job plus a stray, meaningless
top-level `e2e:` key.

Only the `chromium` browser is installed (not the default "every browser Playwright knows about") —
`playwright.config.js`'s two projects, `chromium` and `chromium-no-js`, both use the same underlying
Chromium binary (the second only changes a context option, `javaScriptEnabled: false`; it does not
need a second browser). No separate step compiles Stylus in this job: `npm run test:playwright` runs
`playwright test`, whose `webServer.command` (in `playwright.config.js`) is `npm start`, which itself
runs `watch:css` (a one-shot Stylus compile, then a watcher) in parallel with the Vite dev server —
the CSS this job needs gets compiled as a side effect of starting the server Playwright already
needs, so adding a second, redundant compile step here would do nothing but waste a few seconds.
Re-run `uvx zizmor --pedantic .github/workflows/ci.yml` against the two-job file and confirm it still
reports "No findings to report. Good job!" (it does — see "Artifacts and Notes") before committing.

Commit this addition, push it (again, only with explicit confirmation first — see Milestone 1), and
watch the resulting run the same way. Once — and only once — `gh run view --repo mozilla/ensemble
<run-id>` shows both jobs with a `success` conclusion for a real, pushed commit, make the doc
correction, in exactly three places, no more: in `AGENTS.md`'s "Current state" bullet, which
currently reads "Issue #79 (\"enable CI\") is still open." — change it to state plainly that a GitHub
Actions workflow now runs lint and both test suites on every push and pull request, and remove the
now-inapplicable claim that no `.github/` directory exists. Separately, in that same file's PR-
description guidance section, and in `CONTRIBUTING.md`'s own copy of the equivalent "Testing"
guidance, both currently read "those only re-check what CI (once it exists) already checks" (
`AGENTS.md` line 209) or "those only re-check what CI, once it exists, already checks"
(`CONTRIBUTING.md` line 287) — drop the "once it exists" hedge from both, since it now does. Do not
attempt to fix `AGENTS.md`'s other, unrelated staleness (its create-react-app/webpack claims, its
missing-`.nvmrc` claim) while touching this file — that is pre-existing scope from PR #444's own
incomplete Milestone 6, not this issue's job, and conflating the two would make this commit's diff
misleading about what issue #79's own work actually changed.

## Concrete Steps

All commands below run from the repository root, `/Users/shobson/Sites/ensemble`, on branch
`79--github-actions-ci` (already created, based on `441--update-toolchain`, per this plan's own
Progress section).

Milestone 1:

    mkdir -p .github/workflows
    (create .github/workflows/ci.yml with the Milestone 1 content shown above)
    uvx zizmor --pedantic .github/workflows/ci.yml
      # expect: "No findings to report. Good job!"
    git add .github/workflows/ci.yml
    git commit -m "Add CI workflow for lint and unit tests (#79)"
    # confirm with whoever is driving the session before this next step:
    git push mozilla 79--github-actions-ci
    gh run list --repo mozilla/ensemble --branch 79--github-actions-ci --limit 5
    gh run watch --repo mozilla/ensemble <run-id-from-previous-command>
      # expect: conclusion "success" for the "Lint and test" job

Milestone 2:

    (edit .github/workflows/ci.yml, adding the e2e job shown above)
    uvx zizmor --pedantic .github/workflows/ci.yml
      # expect: "No findings to report. Good job!"
    git add .github/workflows/ci.yml
    git commit -m "Add end-to-end test job to CI workflow (#79)"
    # confirm with whoever is driving the session before this next step:
    git push mozilla 79--github-actions-ci
    gh run list --repo mozilla/ensemble --branch 79--github-actions-ci --limit 5
    gh run watch --repo mozilla/ensemble <run-id-from-previous-command>
      # expect: conclusion "success" for both "Lint and test" and "End-to-end tests"
    (edit AGENTS.md and CONTRIBUTING.md as described in the Milestone 2 narrative above)
    git add AGENTS.md CONTRIBUTING.md
    git commit -m "Note that CI now exists (#79)"
    # confirm with whoever is driving the session before this next step:
    git push mozilla 79--github-actions-ci

## Validation and Acceptance

Milestone 1 is complete when all of the following are true, observed directly rather than assumed:
running `uvx zizmor --pedantic .github/workflows/ci.yml` from the repository root prints "No findings
to report. Good job!"; after pushing, `gh run list --repo mozilla/ensemble --branch
79--github-actions-ci --limit 1` shows a run named "CI" whose `status` column reads `completed` and
whose conclusion (visible via `gh run view --repo mozilla/ensemble <run-id>`) reads `success` for the
job named "Lint and test"; and visiting `https://github.com/mozilla/ensemble/actions` in a browser
shows that same run with a green check.

As a deliberate negative check — proving the workflow actually catches something, not merely that it
runs — temporarily introduce a real ESLint violation (for example, add `var x = 1;` near the top of
any `.jsx` file, which trips both `no-var` and, since `x` is never used, `no-unused-vars`), push it on
a throwaway commit, and confirm the "Lint and test" check turns red with those exact rule names shown
in the job's log at the correct file and line — then revert that commit before continuing; it must
never reach `main`.

Milestone 2 is complete when the same workflow run also includes a job named "End-to-end tests" with
conclusion `success`, and its log shows all 51 tests passing (a "51 passed" line, or 51 passed plus
some number retried-and-passed, from the `github` reporter's own summary) — matching the same-session
local result already recorded in "Artifacts and Notes" below, not merely assumed to still hold. After
both jobs are confirmed green on a real, pushed commit, `git log -p -- AGENTS.md CONTRIBUTING.md` on
the doc-correction commit should show only the three specific hedge/claim removals described in the
Milestone 2 narrative (two in `AGENTS.md`, one in `CONTRIBUTING.md`) — nothing else in either file.

## Idempotence and Recovery

Every step in both milestones is purely additive to this repository's own files, and safe to repeat.
Re-running `uvx zizmor` any number of times only reads the file and never modifies it (this plan does
not use its `--fix` flag). Re-pushing the same commit content a second time is a no-op refused by git
(`Everything up-to-date`) rather than a duplicate action. If a pushed run fails for a reason unrelated
to the workflow itself (a transient npm registry hiccup, a momentarily-unreachable external link one
of the two live-network Playwright specs checks — see this plan's Decision Log for exactly which
two), the correct recovery is to re-run only the failed job from GitHub's own UI ("Re-run failed
jobs") or `gh run rerun --repo mozilla/ensemble <run-id> --failed`, not to edit the workflow reflexively;
only change the workflow itself if the same job fails the same way twice in a row with no unrelated
change in between. Nothing in either milestone deletes, overwrites, or has any effect on data outside
this repository's own two edited files (`.github/workflows/ci.yml`, and, in Milestone 2's second
commit, `AGENTS.md`/`CONTRIBUTING.md`) — there is no database, no external service state, and no
generated artifact this plan is responsible for cleaning up afterward.

## Artifacts and Notes

Full transcript, `npm ci` from a clean `node_modules` on this branch:

    added 634 packages, and audited 635 packages in 2s
    167 packages are looking for funding
    17 vulnerabilities (3 moderate, 14 high)

`npm run test:jest` with `src/components/views/css/` deliberately moved aside first, proving
`npm run build:css` is a hard prerequisite:

    FAIL  src/tests/jest/MetricOverview.test.jsx [ src/tests/jest/MetricOverview.test.jsx ]
    Error: Failed to resolve import "./css/MetricOverview.css" from
    "src/components/views/MetricOverview.jsx". Does the file exist?
    Test Files  2 failed (2)
         Tests  no tests

`npm run test:jest` again, immediately after restoring that directory:

    Test Files  2 passed (2)
         Tests  4 passed (4)

`npm run lint`, from a clean install:

    > ensemble@1.2.1 lint:js
    > eslint .

    > ensemble@1.2.1 lint:styl
    > stylint src/components/views/styl
    (exit 0, no output — clean)

`npm run build:app`:

    ✓ built in 493ms

`npx playwright test --list`:

    Total: 51 tests in 12 files

A full `npx playwright test` run, executed directly in this session: exited with code 0 (all 51
tests passed; the run's own progress log showed at least one test needing its configured retry before
passing, consistent with `playwright.config.js`'s documented, expected behavior — not a new problem).

`uvx zizmor` against an early draft of the Milestone 1 job, before `persist-credentials: false` was
added:

    warning[artipacked]: credential persistence through GitHub Actions artifacts
      --> .github/workflows/ci.yml:14:9
       |
    14 |       - uses: actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1 # v7.0.1
       |         does not set persist-credentials: false
    3 findings (2 suppressed, 1 unsafe fixes): 0 informational, 0 low, 1 medium, 0 high

`uvx zizmor --pedantic` against the same draft, before the job was named and before a `concurrency`
block existed:

    info[anonymous-definition]: workflow or action definition without a name
    help[concurrency-limits]: insufficient job-level concurrency limits
    2 findings: 1 informational, 1 low, 0 medium, 0 high

`uvx zizmor --pedantic` against the final, complete two-job workflow shown in "Plan of Work" above,
run last, in this session, against the exact content this plan specifies:

    No findings to report. Good job!

This plan's own two YAML fragments (Milestone 1's full file, Milestone 2's `e2e:` addition) were
themselves mechanically reconstructed into one file exactly as a reader would splice them — Milestone
1's block followed directly by Milestone 2's, byte for byte, no manual re-indentation — and re-run
through both a YAML parser (confirming `jobs:` contains exactly `lint-and-test` and `e2e` as siblings,
not `e2e` as a stray top-level key) and `uvx zizmor --pedantic` one final time, which again reported
"No findings to report. Good job!" This caught a real indentation bug in an earlier draft of this
plan (the `e2e:` fragment was two spaces short, which would have made `e2e` a meaningless top-level
key of the workflow instead of its second job) before it could reach whoever implements this plan.

## Interfaces and Dependencies

This plan's one deliverable is `.github/workflows/ci.yml`, a workflow named `CI` (GitHub displays this
exact string in the Actions tab and on every PR's checks list — any future reference to this
workflow, such as a branch-protection rule naming a required check, should name it as `CI / Lint and
test` and `CI / End-to-end tests`, GitHub's own concatenation of the workflow name and each job's
`name:` field). It defines two jobs, `lint-and-test` and `e2e` (the YAML keys — stable identifiers a
future edit should keep even if the human-readable `name:` fields change), both running on GitHub's
`ubuntu-latest` runner image with no other infrastructure of this repository's own. It depends on two
actions published by GitHub — `actions/checkout` pinned to commit `3d3c42e5aac5ba805825da76410c181273ba90b1`
(tag `v7.0.1`) and `actions/setup-node` pinned to commit `820762786026740c76f36085b0efc47a31fe5020`
(tag `v7.0.0`) — and on this repository's own `.nvmrc` (read by `setup-node`'s `node-version-file`
option) and `package-lock.json` (read by `npm ci`). It runs four existing `package.json` scripts
verbatim (`build:css`, `lint`, `test:jest`, `test:playwright`) and introduces no new one. Validating
any future edit to this file requires only `uvx zizmor --pedantic .github/workflows/ci.yml`, run from
the repository root — no separate installation, account, or credential is needed for that check.

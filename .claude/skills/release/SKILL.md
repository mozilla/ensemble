---
name: release
description: Release ensemble to prod — check stage, bump the version in a PR, publish the GitHub release, watch the deploy, and confirm what's live
disable-model-invocation: true
argument-hint: "[<version>]"
allowed-tools:
  - Bash(gh run list *)
  - Bash(gh run view *)
  - Bash(gh run watch *)
  - Bash(gh release list *)
  - Bash(gh release view *)
  - Bash(gh pr list *)
  - Bash(gh pr view *)
  - Bash(git fetch *)
  - Bash(git log *)
  - Bash(git status *)
  - Bash(curl -s https://data.firefox.com/version.json)
  - Read
  - Grep
---

# /release — Release to prod

The steps are in "Releasing to prod" in `docs/architecture/deploy.md`. Read that section and
follow it; this file only adds what an agent needs to decide and when to stop for the user. If the
two disagree, the doc and `.github/workflows/deploy.yml` win; say so and suggest fixing this file.

## Before anything

1. `git fetch mozilla` (the remote is `mozilla`, not `origin`), then show:
   - the latest release (`gh release list --limit 1`) and what prod reports
     (`curl -s https://data.firefox.com/version.json`);
   - the commits on `mozilla/main` since that release's tag, which are what this release ships;
   - open PRs the user may want in first (`gh pr list`).
2. Check the stage deploy of `mozilla/main`'s tip. If it or its smoke test failed, find out why from
   `gh run view <id> --log-failed` before going on. A failed smoke test doesn't undo a deploy, so
   stage may be serving the code even though the run is red.

## Choosing the version

If no version was given, propose one. Use the README's "Versioning" scheme, which isn't semver: the
first digit for major changes, the second for medium, the third for small. Explain the choice from
the commits since the last release. The user decides; the version number is hand-managed, so never
bump it without asking.

## The bump PR

Branch off `mozilla/main` as `bump-version-<version>`, change only the three files the doc lists,
and open a PR titled "Bump version to <version>" in the shape of #513. Leave the merge to the user.

## Publishing

Publishing the release deploys to prod, which every visitor sees. Before running
`gh release create`, confirm with the user that the bump PR is merged and that `mozilla/main`'s tip
is the commit they want, and get an explicit go-ahead. Never pass `--prerelease`.

## After

Watch the run to the end, including the smoke test, then check `version.json` reports the new
version and commit. Report the result plainly. If the smoke test fails, the deploy still happened:
read the failing tests and say whether the site or the test is at fault. Suggest a rollback
(re-running the deploy from the previous tag) only if the site itself is broken, and only run one
with the user's go-ahead.

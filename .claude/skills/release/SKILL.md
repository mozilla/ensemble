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
  - Bash(git remote -v)
  - Bash(git fetch *)
  - Bash(git rev-parse *)
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

1. Find the remote for `github.com/mozilla/ensemble` with `git remote -v`. It is often `mozilla`
   rather than `origin`; this file calls it `<remote>`. Fetch it, then show:
   - the latest prod release, leaving out drafts and pre-releases, which never reach prod
     (`gh release list --exclude-drafts --exclude-pre-releases --limit 1`), and what prod reports
     (`curl -s https://data.firefox.com/version.json`);
   - the commits on `<remote>/main` since that release's tag, which are what this release ships;
   - open PRs the user may want in first (`gh pr list`).
2. Check the stage deploy of `<remote>/main`'s tip. If it or its smoke test failed, find out why from
   `gh run view <id> --log-failed` before going on. A failed smoke test doesn't undo a deploy, so
   stage may be serving the code even though the run is red.

## Choosing the version

If no version was given, propose one. Use the README's "Versioning" scheme, which isn't semver: the
first digit for major changes, the second for medium, the third for small. Explain the choice from
the commits since the last release. The user decides; the version number is hand-managed, so never
bump it without asking.

## The bump PR

Branch off `<remote>/main` as `bump-version-<version>`, change only the three files the doc lists,
and open a PR titled "Bump version to <version>" in the shape of #513. Leave the merge to the user.

## Publishing

Once the bump PR is merged, fetch again and take the SHA to release, usually the bump's merge commit.
Show the user any other commits that reached `main` since the version was chosen. Wait until that
SHA's stage deploy and smoke test have passed (`gh run list --workflow=deploy.yml --commit <sha>`).

Publishing the release deploys to prod, which every visitor sees. Get an explicit go-ahead naming
the version and the SHA, then publish with `--target <sha>`, never `--target main`, which may have
moved on. Never pass `--prerelease`.

## After

Wait for the deploy run whose branch is the new tag, as the doc shows. Don't take the newest
release run straight after publishing; it may still be the previous release's. Check that run's
`headSha` is the SHA you released, then watch it to the end, including the smoke test. Check
`version.json` reports the new version and that SHA. Report the result plainly. If the smoke test
fails, the deploy still happened: read the failing tests and say whether the site or the test is at
fault. Suggest a rollback (re-running the deploy from the previous tag) only if the site itself is
broken, and only run one with the user's go-ahead.

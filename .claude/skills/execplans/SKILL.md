---
name: execplans
description: Write and maintain an ExecPlan — a self-contained, committed Markdown design document in docs/execplans/ — for work that spans more than one session or touches several files or subsystems. Use for a refactor crossing the container/view split, a tooling or dependency migration, replacing the blocked Nightwatch e2e suite, unpicking the two ESLint configs, restoring CI, or any change whose decisions and progress must survive a context reset. Also use when resuming or revising a plan already in docs/execplans/. Invoke with /execplans.
---

# ExecPlans

An ExecPlan is a Markdown design document that lives on disk and carries a piece of work from
design through implementation. It is the durable record: someone holding only the working tree and
the plan file can pick the work up and finish it. Write one instead of relying on the built-in
plan/todo tools whenever the work meets the threshold below — those tools don't survive a context
reset, and this repo's near-term work (restoring CI, unifying the two ESLint configs, replacing the
blocked Nightwatch suite) is exactly the kind that needs to.

Plans in this repository go in `docs/execplans/` and are committed on the working branch. **Read
`references/PLANS.md` in full before writing or revising one** — it is the specification, and its
final section, "Ensemble addendum", overrides the upstream text wherever the two disagree. The
upstream text's own opening instruction to keep plans outside the repository is one of the things
the addendum overrides — do not follow it.

## When to use one

- The work will not finish in one session.
- It touches several files, or crosses the container/view split, the Stylus pipeline, or the build
  config.
- It is a migration or a tooling replacement.
- The approach has real unknowns worth proving with a throwaway milestone first.

Skip it for a single-file fix, a copy change, or anything a commit title already describes.

## Working sequence

1. Confirm the branch. Work happens on `<issue-number>--kebab-case-summary`. Ask for the issue
   number if the request doesn't carry one, and read
   `https://github.com/mozilla/ensemble/issues/<id>` before drafting — `AGENTS.md` requires both.
2. Read `references/PLANS.md`, then start from its skeleton.
3. Create `docs/execplans/YYYY-MM-DD-<slug>.md`, where `<slug>` is the branch's kebab summary. Cite
   `.claude/skills/execplans/references/PLANS.md` in the plan's header. Write no triple backticks —
   see the addendum.
4. Fill in real repository context before writing any code: actual paths, actual commands, and
   acceptance a human can observe by running something.
5. Present the milestone breakdown to the user and get explicit confirmation before executing any
   of them. This is a one-time gate at the plan/execution boundary, not a per-milestone check-in —
   see the addendum's "Committing" section for the exact scope.
6. Commit the plan on its own, before the first implementation commit. Then implement, updating
   `Progress`, `Surprises & Discoveries`, and `Decision Log` in the same commits as the work.
7. Write `Outcomes & Retrospective` when the work lands, and commit that too.

## Resuming

If `docs/execplans/` already holds a plan for this branch, read it and continue it. Never open a
second plan for the same work. A `Progress` section that disagrees with `git log` is a bug in the
plan — fix that before doing anything else.

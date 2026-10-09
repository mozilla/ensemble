# Codex Execution Plans (ExecPlans):

This document describes the requirements for an execution plan ("ExecPlan"), a design document that a coding agent can follow to deliver a working feature or system change. Treat the reader as a beginner to this repository, but a moderately experienced developer: they have only the current working tree and the single ExecPlan file you provide.

## How to use ExecPlans and PLANS.md

When authoring an executable specification (ExecPlan), follow PLANS.md _to the letter_. If it is not in your context, refresh your memory by reading the entire PLANS.md file. Be thorough in reading (and re-reading) source material to produce an accurate specification. When creating a spec, start from the skeleton and flesh it out as you do your research.

After you have created the executable specification (ExecPlan) the first time and have clear milestones, prompt the user to review it.

When implementing an executable specification (ExecPlan), do not prompt the user for "next steps"; simply proceed to the next milestone. Keep all sections up to date, add or split entries in the list at every stopping point to affirmatively state the progress made and next steps. Resolve technical ambiguities autonomously, and commit frequently. Scope and policy choices are not yours to resolve: reducing what a test covers, weakening an assertion, or anything visible outside the repository goes to the user, and the answer goes in the Decision Log.

When discussing an executable specification (ExecPlan), record decisions in a log in the spec for posterity; it should be unambiguously clear why any change to the specification was made. ExecPlans are living documents, and it should always be possible to restart from _only_ the ExecPlan and no other work.

When researching a design with challenging requirements or significant unknowns, use milestones to implement proof of concepts, "toy implementations", etc., that allow validating whether the user's proposal is feasible. Read the source code of libraries by finding or acquiring them, research deeply, and include prototypes to guide a fuller implementation.

## Requirements

NON-NEGOTIABLE REQUIREMENTS:

* Every ExecPlan must be fully self-contained. Self-contained means that in its current form it contains all knowledge and instructions needed for a developer to succeed.
* Every ExecPlan is a living document. Contributors are required to revise it as progress is made, as discoveries occur, and as design decisions are finalized. Each revision must remain fully self-contained.
* Every ExecPlan must enable a developer to implement the feature end-to-end without prior knowledge of this repo.
* Every milestone must assess whether its own changes leave any documentation or code comment stale, and update it as part of that milestone — never deferred to a separate final step. See "Milestones" below.
* Every ExecPlan must produce a demonstrably working behavior, not merely code changes to "meet a definition".
* Every ExecPlan must define every term specific to this repository, or specialist enough that a competent web developer might not know it, in plain language — or not use it.

Purpose and intent come first. Begin by explaining, in a few sentences, why the work matters from a user's perspective: what someone can do after this change that they could not do before, and how to see it working. Then guide the reader through the exact steps to achieve that outcome, including what to edit, what to run, and what they should observe.

The agent executing your plan can list files, read files, search, run the project, and run tests. It does not know any prior context and cannot infer what you meant from earlier milestones. Repeat any assumption you rely on. Do not point to external blogs or docs; if knowledge is required, embed it in the plan itself in your own words. If an ExecPlan builds upon a prior ExecPlan and that file is checked in, incorporate it by reference. If it is not, you must include all relevant context from that plan.

## Formatting

Format and envelope are simple and strict. Each ExecPlan must be one single fenced code block labeled as `md` that begins and ends with triple backticks. Do not nest additional triple-backtick code fences inside; when you need to show commands, transcripts, diffs, or code, present them as indented blocks within that single fence. Use indentation for clarity rather than code fences inside an ExecPlan to avoid prematurely closing the ExecPlan's code fence. Use two newlines after every heading, use # and ## and so on, and correct syntax for ordered and unordered lists.

When writing an ExecPlan to a Markdown (.md) file where the content of the file *is only* the single ExecPlan, you should omit the triple backticks.

Write in plain prose. Prefer sentences over lists. Avoid checklists, tables, and long enumerations unless brevity would obscure meaning. Checklists are permitted only in the `Progress` section, where they are mandatory. Steps the reader must follow in order, in `Plan of Work` and `Concrete Steps`, are numbered lists. Purpose, Context, and the Decision Log remain prose-first.

## Guidelines

Self-containment and plain language are paramount. Assume the reader knows web development generally — npm scripts, React, CI, git — and define what is particular to this repository ("the container/view split", "react-refetch's `connect()`", "`flagForUpdate`", "the gitignored compiled CSS") the first time it appears, naming the files or commands where it shows up. Define each term once, in `Context and Orientation`, then use it. Do not say "according to the architecture doc"; put the needed explanation in the plan.

Avoid common failure modes. Do not rely on undefined jargon. Do not describe "the letter of a feature" so narrowly that the resulting code compiles but does nothing meaningful. Do not outsource key decisions to the reader. When ambiguity exists, resolve it in the plan itself and explain why you chose that path. Err on the side of over-explaining user-visible effects and under-specifying incidental implementation details.

Anchor the plan with observable outcomes. State what the user can do after implementation, the commands to run, and the outputs they should see. Acceptance should be phrased as behavior a human can verify ("after starting the server, navigating to [http://localhost:8080/health](http://localhost:8080/health) returns HTTP 200 with body OK") rather than internal attributes ("added a HealthCheck struct"). If a change is internal, explain how its impact can still be demonstrated (for example, by running tests that fail before and pass after, and by showing a scenario that uses the new behavior).

Specify repository context explicitly. Name files with full repository-relative paths, name functions and modules precisely, and describe where new files should be created. If touching multiple areas, include a short orientation paragraph that explains how those parts fit together so a newcomer can navigate confidently. When running commands, show the working directory and exact command line. When outcomes depend on environment, state the assumptions and provide alternatives when reasonable.

Be idempotent and safe. Write the steps so they can be run multiple times without causing damage or drift. If a step can fail halfway, include how to retry or adapt. If a migration or destructive operation is necessary, spell out backups or safe fallbacks. Prefer additive, testable changes that can be validated as you go.

Validation is not optional. Include instructions to run tests, to start the system if applicable, and to observe it doing something useful. Describe comprehensive testing for any new features or capabilities. Include expected outputs and error messages so the reader can tell success from failure. Where possible, show how to prove that the change is effective beyond compilation (for example, through a small end-to-end scenario, a CLI invocation, or an HTTP request/response transcript). State the exact test commands appropriate to the project’s toolchain and how to interpret their results.

Capture evidence. When your steps produce terminal output, short diffs, or logs, include them inside the single fenced block as indented examples. Keep them concise and focused on what proves success. If you need to include a patch, prefer file-scoped diffs or small excerpts that a reader can recreate by following your instructions rather than pasting large blobs.

## Milestones

Milestones are narrative, not bureaucracy. If you break the work into milestones, introduce each with a brief paragraph that describes the scope, what will exist at the end of the milestone that did not exist before, the commands to run, the acceptance you expect to observe, and whether that milestone's own changes leave any documentation or code comment stale — update it within the same milestone, or state plainly that nothing needed updating. Keep it readable as a story: goal, work, result, proof. Progress and milestones are distinct: milestones tell the story, progress tracks granular work. Both must exist. Include what someone needs to carry out and check the milestone; leave out what they could work out from the code or `git log`.

Each milestone must be independently verifiable and incrementally implement the overall goal of the execution plan.

## Living plans and design decisions

* ExecPlans are living documents. As you make key design decisions, update the plan to record both the decision and the thinking behind it. Record all decisions in the `Decision Log` section.
* ExecPlans must contain and maintain a `Progress` section, a `Surprises & Discoveries` section, a `Decision Log`, and an `Outcomes & Retrospective` section. These are not optional.
* When you discover optimizer behavior, performance tradeoffs, unexpected bugs, or inverse/unapply semantics that shaped your approach, capture those observations in the `Surprises & Discoveries` section with short evidence snippets (test output is ideal).
* If you change course mid-implementation, document why in the `Decision Log` and reflect the implications in `Progress`. Plans are guides for the next contributor as much as checklists for you.
* At completion of a major task or the full plan, write an `Outcomes & Retrospective` entry summarizing what was achieved, what remains, and lessons learned.

# Prototyping milestones and parallel implementations

It is acceptable—-and often encouraged—-to include explicit prototyping milestones when they de-risk a larger change. Examples: adding a low-level operator to a dependency to validate feasibility, or exploring two composition orders while measuring optimizer effects. Keep prototypes additive and testable. Clearly label the scope as “prototyping”; describe how to run and observe results; and state the criteria for promoting or discarding the prototype.

Prefer additive code changes followed by subtractions that keep tests passing. Parallel implementations (e.g., keeping an adapter alongside an older path during migration) are fine when they reduce risk or enable tests to continue passing during a large migration. Describe how to validate both paths and how to retire one safely with tests. When working with multiple new libraries or feature areas, consider creating spikes that evaluate the feasibility of these features _independently_ of one another, proving that the external library performs as expected and implements the features we need in isolation.

## Skeleton of a Good ExecPlan

    # <Short, action-oriented description>

    This ExecPlan is a living document. The sections `Progress`, `Surprises & Discoveries`, `Decision Log`, and `Outcomes & Retrospective` must be kept up to date as work proceeds.

    If PLANS.md file is checked into the repo, reference the path to that file here from the repository root and note that this document must be maintained in accordance with PLANS.md.

    ## Purpose / Big Picture

    Explain in a few sentences what someone gains after this change and how they can see it working. State the user-visible behavior you will enable.

    ## Progress

    Use a list with checkboxes to summarize granular steps. Every stopping point must be documented here, even if it requires splitting a partially completed task into two (“done” vs. “remaining”). This section must always reflect the actual current state of the work.

    - [x] (2025-10-01 13:00Z) Example completed step.
    - [ ] Example incomplete step.
    - [ ] Example partially completed step (completed: X; remaining: Y).

    Use timestamps to measure rates of progress.

    ## Surprises & Discoveries

    Document unexpected behaviors, bugs, optimizations, or insights discovered during implementation. Provide concise evidence.

    - Observation: …
      Evidence: …

    ## Decision Log

    Record every decision made while working on the plan in the format:

    - Decision: …
      Rationale: …
      Date/Author: …

    ## Outcomes & Retrospective

    Summarize outcomes, gaps, and lessons learned at major milestones or at completion. Compare the result against the original purpose.

    ## Context and Orientation

    Describe the current state relevant to this task for someone new to this repository. Name the key files and modules by full path. Define any repository-specific term you will use. If this work builds on a checked-in ExecPlan, cite it by path and summarize only what this plan relies on.

    ## Plan of Work

    Describe, in prose, the sequence of edits and additions. For each edit, name the file and location (function, module) and what to insert or change. Keep it concrete and minimal. If the work is broken into milestones, each milestone's description must say whether it leaves documentation or code comments stale and what was done about it (see "Milestones" above).

    ## Concrete Steps

    State the exact commands to run and where to run them (working directory). When a command generates output, show a short expected transcript so the reader can compare. This section must be updated as work proceeds.

    ## Validation and Acceptance

    Describe how to start or exercise the system and what to observe. Phrase acceptance as behavior, with specific inputs and outputs. If tests are involved, say "run <project’s test command> and expect <N> passed; the new test <name> fails before the change and passes after>".

    ## Idempotence and Recovery

    If steps can be repeated safely, say so. If a step is risky, provide a safe retry or rollback path. Keep the environment clean after completion.

    ## Artifacts and Notes

    Include the most important transcripts, diffs, or snippets as indented examples. Keep them concise and focused on what proves success.

    ## Interfaces and Dependencies

    Be prescriptive. Name the libraries, modules, and services to use and why. Specify the types, traits/interfaces, and function signatures that must exist at the end of the milestone. Prefer stable names and paths such as `crate::module::function` or `package.submodule.Interface`. E.g.:

    In crates/foo/planner.rs, define:

        pub trait Planner {
            fn plan(&self, observed: &Observed) -> Vec<Action>;
        }

If you follow the guidance above, a single, stateless agent -- or a developer new to this repository -- can read your ExecPlan from top to bottom and produce a working, observable result. That is the bar: SELF-CONTAINED, SELF-SUFFICIENT, NEWCOMER-GUIDING, OUTCOME-FOCUSED.

When you revise a plan, you must ensure your changes are comprehensively reflected across all sections, including the living document sections. When a revision changes the approach or scope, write a note at the bottom of the plan describing the change and the reason why; bookkeeping fixes don't need one. ExecPlans must describe not just the what but the why for almost everything.

---

# Ensemble addendum

Everything above is the upstream ExecPlan specification, published by OpenAI at
<https://cookbook.openai.com/articles/codex_exec_plans/>, adapted for this repository: the reader
is pitched at a competent developer who is new to this repository rather than a complete novice,
and a plan may cite a checked-in ExecPlan instead of restating it. This section is local to
`mozilla/ensemble` and **overrides the text above wherever the two disagree.** The repository's own
conventions are in `AGENTS.md` at the repository root; read that too. Plans follow its "Writing for
people" section.

## Where plans live

Plans go in the repository, at `docs/execplans/YYYY-MM-DD-<slug>.md`, committed on the working
branch. There is nowhere else for them here, and a plan that is not in the pull request is not
reviewable.

`<slug>` is the kebab-case summary from the branch name, so the two line up: branch
`409--hardware-resize-performance`, plan `docs/execplans/2026-09-20-hardware-resize-performance.md`.
The date is the day the plan was started and does not change when the plan is revised.

This specification is checked in at `.claude/skills/execplans/references/PLANS.md`. Cite that path
in the plan's header, as the skeleton above requires.

## No code fences

Upstream says an ExecPlan is "one single fenced code block labeled as `md`", then says to omit the
backticks when the file holds only the plan. Plans here always go to a file and never into a chat
message, so the rule is the simple one: **no triple backticks anywhere — not around the document,
not inside it.** Present commands, transcripts, and diffs as four-space indented blocks, the way the
skeleton above does.

The cost is that GitHub renders an indented block without syntax highlighting. Take it. A rule with
an exception is what made this ambiguous upstream, and a fence-free plan can be dropped into a fence
later without rewriting it.

Do not paste a plan into a chat message. Summarize it and name the file.

## Validation commands that actually work

`Concrete Steps` and `Validation and Acceptance` must name commands that run in this repository
today. These do:

    npm ci
    npm run build:css         # required before Vitest on a fresh clone; the compiled CSS is gitignored
    npm run lint              # ESLint flat config (.js and .jsx) plus stylint
    npm run test:jest         # Vitest
    npm run test:playwright   # Playwright, against the Vite dev server and live data.firefox.com
    npm run build             # Vite production build plus version.json
    npm test                  # lint, then Vitest, then Playwright

The Playwright dashboard specs assert against live production data, so a failure there can come
from upstream data changing rather than from the commit. Re-run once before investigating, and say
which it was.

`AGENTS.md`'s toolchain description still predates the move to Vite; where it disagrees with the
commands above, these win. Run each command and report the actual result; never claim a pass you
did not observe. State the expected result, not just the command: "`npm run test:jest` — 2 files, 4
tests passing" beats "run the tests".

## Record what matters, not what happened

The living sections are for the next person to make the next decision, not a log of the session.

* `Progress` records milestone-level state: what is done, what is partly done, what is next.
* `Decision Log` records choices someone might otherwise undo, and why they were made.
* `Surprises & Discoveries` records facts that cost time to find and would cost the next person the
  same.

Leave out routine operations: pushes, rebases, force-pushes, resetting local branches, changed
commit SHAs, CI re-runs, and the steps of reading the issue or the docs. `git log` and the pull
request already hold those. When a later finding shows an earlier Surprise was wrong, replace the
earlier entry rather than adding a correction beneath it.

## Committing

Commit frequently, as upstream says, on the branch `AGENTS.md` describes
(`<issue-number>--kebab-case-summary`). Two local rules on top:

* **Do not list the LLM as a co-author.** No `Co-Authored-By` trailer for Claude, Codex, or any
  other model, on plan commits or code commits. See `AGENTS.md`, "LLM assistance".
* Commit the plan before the first implementation commit, and update it in the same commit as the
  work it describes. A plan brought up to date in a trailing "update plan" commit has stopped being
  a record of how the work went.

Upstream also says not to prompt the user for next steps. That holds **between** milestones, once
execution is under way — do not stop after each one to ask whether to continue. It does not hold
for the transition from planning to executing: after drafting the plan and identifying its
milestones, present the milestone breakdown to the user and get explicit confirmation before
starting work on the first one. Treat that confirmation as a one-time gate, not something to repeat
before every later milestone. It also does not override `AGENTS.md`: still ask for the issue number
when it is not obvious, and still offer to run the tests when the work looks complete rather than
claiming a green run you could not produce.

## Never cite the plan from the code

`AGENTS.md` forbids a code comment that explains itself by pointing at a spec, a plan document, or a
ticket. That applies to ExecPlans with full force: no `// see docs/execplans/…`, no "per the plan",
no milestone numbers in comments. A comment has to make sense to someone holding only that one file.
The plan is where the reasoning lives; the code carries its own explanation or none.

## Reading the issues

Upstream says not to point at external documentation, and to embed what the reader needs. Follow
that, with one local exception: link the GitHub issue, because it is the tracker of record — then
restate its content in `Context and Orientation` in your own words. Most of these issues are five or
more years old and describe a codebase that has since moved. A plan that says only "see #409" is
neither self-contained nor, probably, correct.

## The plan and the pull request

The plan file is part of the diff, so name it in the PR's **Significant changes and points to
review** as one plain bullet — "Adds `docs/execplans/2026-09-14-eslint-unification.md`" — and stop
there. The description keeps its four headings (One-line summary; Significant changes and points to
review; Issue / Bugzilla link; Testing) and does not become a second copy of the plan. `AGENTS.md`'s
ban on describing your own process still applies: the plan records how the work went, the
description says what changed.

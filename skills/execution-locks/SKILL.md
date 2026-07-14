---
name: execution-locks
description: Use when deciding whether to switch, continue, defer, block, or resume work across features, phases, or workstreams.
---

# Execution Locks

## Active Feature Lock

A feature item holds the active lock when its state is `active`.

- While a feature is `active`, the agent is locked to it.
- Do not edit files, run tests, or inspect code for any other feature or task until the active feature is resolved (either `passing`, `blocked`, or `deferred`).
- You cannot start a new feature while one is `active`.

## Active Phase Lock

A phase holds the active lock when it is the current phase and contains feature items that are not `passing`.

- Do not switch to a subsequent phase (e.g. from Phase 1 to Phase 2) or work on features belonging to another phase while the current phase has unchecked (non-`passing`) features.
- A phase lock is released only when all features in that phase are `passing` (or explicitly marked `blocked`/`deferred` with approved reason in resume notes).

## Selection Algorithm

1. Inspect `docs/roadmap-discipline/features.md` for any open locks.
2. If there is a feature in the `active` state, resume that feature immediately.
3. If no feature is `active`, find the first feature in the current phase with a state of `not_started` or `blocked`.
4. Transition its state to `active` in `features.md` before writing any implementation code.
5. If that item is marked `[parallel: subagents recommended]`, collect other unchecked same-phase items with the same marker as a batch for parallel delegation. Use `subagent-roadmap-coordination` before dispatch.
6. The parallel marker does not release the execution lock. Each marked item remains locked until its own work and verification are complete.

## Deferral and Blocking

Valid deferral or blocking requires:

- Setting the feature state to `blocked` or `deferred` in `features.md`.
- In **Resume Notes**, document:
  - *Known blockers:* The specific blocker, external dependency, or reason.
  - *Next action:* Exactly when/how to return.
- Do not use deferral to skip implementation, verification, or cleanup work when no blocker exists.

## Explicit Redirects

A direct user request is not automatically a redirect. A valid redirect names the different feature, phase, or workstream and explicitly instructs to supersede the current lock.

## Red Flags

- "The active feature has some bugs, so I will start the next one."
- "I will work on a Phase 2 item because it's easier, even though Phase 1 has unfinished features."
- "The feature is basically done, so I can start something else before running the verification command."
- "Known blockers is None, but I can skip the active feature."

---
name: tracking-phased-work
description: Use when tracking feature/phase progress. Defines the feature triple, legal states, verification gating, parallel markers, and write-through recovery checkpoints.
---

# Tracking Phased Work

`docs/roadmap-discipline/features.md` is the system of record, not a memo.

## Feature primitive

Every feature has:

1. Behavior.
2. Verification command/inspection.
3. State.
4. Evidence.

Legal states:

- `not_started` — backlog;
- `active` — currently executing;
- `blocked` — external dependency prevents progress;
- `deferred` — intentionally postponed under user/project permission;
- `passing` — verification succeeded and evidence is recorded.

A checked feature should be `passing` or an explicitly approved `deferred` item. A `passing` item without evidence is inconsistent.

## Verification gate

`active -> passing` requires fresh execution/inspection of the feature's exact verification, successful result, and recorded evidence. Code edits alone never prove `passing`.

## Parallel work

Multiple active features are allowed only when every concurrent item is marked `[parallel: subagents recommended]` and write scopes do not overlap.

Recovery State records:

```text
active_features = every active feature
focus_feature = the current parent/agent focus, or None
```

## Required flow

1. Run `task-start-roadmap-check`.
2. Repair/migrate Recovery State when needed.
3. Resolve locks and select focus.
4. Set selected feature(s) `active` and checkpoint before implementation.
5. Implement within allowed scope.
6. Checkpoint meaningful partial/decision/verification transitions.
7. Run `roadmap-verification`.
8. Record evidence/state and checkpoint the exact next action.

## Checkpoint cadence

Checkpoint after feature selection, coherent partial edits, durable decisions, changed approach, verification pass/fail, accepted subagent output, blocker/deferral/redirect, and completion/handoff.

The next agent should never need the previous agent's conversation to understand why the repository is in its current state.

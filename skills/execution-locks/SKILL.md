---
name: execution-locks
description: Use when deciding whether to switch, continue, defer, block, or resume work across roadmap features, phases, workstreams, or parallel agents.
---

# Execution Locks

## Active feature lock

A feature in state `active` holds an execution lock.

- Resume active work before unrelated work.
- Do not silently abandon active work.
- One agent/parent has one `focus_feature`.
- Multiple active features are allowed only for deliberate parallel execution where every concurrent feature is marked `[parallel: subagents recommended]` and scopes do not overlap.

Recovery State must mirror feature state:

```text
active_features == every feature whose State is active
focus_feature == current parent/agent focus, or None
```

## Active phase lock

The current phase remains locked while required features are unresolved. Do not advance simply because a later item is easier.

A phase may advance when its required features are `passing`, or are explicitly `blocked`/`deferred` under allowed rules with durable return conditions.

## Selection algorithm

1. Read `features.md` + Recovery State.
2. If active feature(s) exist, resume them.
3. If parallel actives exist, keep/select one parent `focus_feature` and coordinate others through `subagent-roadmap-coordination`.
4. If none are active, select the first allowed `not_started` feature in the current phase.
5. Change it to `active`.
6. Checkpoint active/focus state and exact next action before implementation.
7. If selection is ambiguous, resolve it here; helpers must not guess across workstreams.

## Blocking / deferral

`blocked` or `deferred` requires durable state containing the reason, current partial state, return condition/action, and relevant files/evidence.

A failed verification is not automatically a blocker. If diagnosis can continue, remain `active`.

## Redirects

A valid redirect explicitly names the new feature/phase/workstream and supersedes current focus. Checkpoint unfinished state before switching.

## Concurrency

Only one writer should update shared `features.md` at a time. With concurrent agents, use Recovery State `revision` and helper `--expected-revision`. A conflict requires reread/reconciliation, never force overwrite.

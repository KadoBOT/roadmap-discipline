---
name: subagent-roadmap-coordination
description: Use when spawning or reviewing subagents for roadmap-backed implementation or verification. Defines parallel scope, shared-roadmap write ownership, and checkpoint-safe handoffs.
---

# Subagent Roadmap Coordination

## Parent responsibilities

Run the task-start gate and resolve execution locks before dispatch.

The parent owns roadmap selection, focus/active feature state, shared `features.md` consistency, and acceptance/rejection of worker decisions/evidence.

Do not ask workers to choose the next roadmap feature.

## Parallel eligibility

Parallelize only features marked `[parallel: subagents recommended]` with non-overlapping write scopes or read-only scopes.

Parallel execution may produce multiple `active` features. Recovery State must list all and retain one parent `focus_feature`.

## Worker prompt

Include:

- feature-list path;
- observed Recovery State revision;
- current phase and exact feature ID;
- behavior + verification command;
- allowed read/write scope;
- relevant canonical `reload` paths;
- partial-state facts to preserve;
- instruction not to switch feature/phase/workstream or revert other agents;
- required verification;
- return format below.

## Worker return format

Require:

- status: `passing`, `active/partial`, `blocked`, or `deferred`;
- files/artifacts changed and what changed;
- verification command/inspection and exact result;
- durable decisions/discoveries;
- blockers/unknowns;
- exact recommended next action + reason;
- unexpected changes outside assigned scope.

The return should be directly translatable into Recovery State without reconstructing worker chat.

## Shared roadmap writes

Default: workers do not edit `features.md`. Parent reviews and checkpoints accepted state.

Delegate roadmap editing only when exactly one worker is sole writer. If helper exists, require `--expected-revision <observed revision>`. Revision conflict returns to parent reconciliation.

Do not let several accepted worker results accumulate only in parent conversation memory; checkpoint accepted state promptly.

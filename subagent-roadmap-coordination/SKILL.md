---
name: subagent-roadmap-coordination
description: Use when spawning or reviewing subagents for roadmap-backed feature implementation or verification.
---

# Subagent Roadmap Coordination

## Parent Responsibilities

Run the task-start gate before dispatch. The parent agent owns roadmap selection, active feature locking, and feature list updates unless it explicitly delegates a single feature update to one worker.

Do not dispatch a subagent to choose the next task. Dispatch only after the active feature and verification command are known.

When unchecked same-phase features are marked `[parallel: subagents recommended]`, prefer dispatching them to separate subagents when subagent tools are available and their write scopes do not overlap. The marker is a recommendation, not a lock release: keep the same verification and parent review requirements.

## Worker Prompt Requirements

Every roadmap worker prompt must include:

- active feature list path (`docs/roadmap-discipline/features.md`);
- current phase and feature ID (e.g. `F1.2`);
- exact assigned behavior description and verification command;
- allowed write scope (directories/files);
- instruction not to switch features or tasks;
- required verification execution and expected evidence;
- required final summary format.

## Final Summary Format

Ask workers to return:

- assigned feature status (`passing`, `blocked`, `deferred`);
- files changed;
- verification command run and its output/result;
- blockers or follow-up;
- recommended feature list update.

## Review After Return

1. Read the worker summary.
2. Inspect changed files or artifacts.
3. Run the verification command locally to confirm success.
4. Use `roadmap-verification` before marking the feature `passing` and checking it off.

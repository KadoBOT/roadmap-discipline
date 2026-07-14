---
name: roadmap-discipline
description: Keep phased roadmap work ordered, resumable, and anchored to disk state instead of chat memory. Use at session start, when resuming or continuing work, before planning or delegating, when creating or updating the feature list, and before claiming any roadmap item is complete.
---

# Roadmap Discipline

`.agents/skills/roadmap-discipline/` is a plugin bundle of skills for feature lists, startup readiness checklists, and roadmaps. Disk state is the source of truth — not chat memory, task plans, or parent checklists. All roadmap artifacts live in `docs/roadmap-discipline/`.

## The Rule

**Invoke a roadmap-discipline skill BEFORE selecting, executing, delegating, or completing roadmap work.**

Run Phase 0: Initialization immediately upon starting a task. Do not inspect implementation files, pick business feature work, or claim completion until the initialization gate completes and the feature list is established.

## Skill Catalog

| Skill | Invoke when |
| --- | --- |
| [using-roadmap-discipline](using-roadmap-discipline/SKILL.md) | Any conversation or task that may touch phased roadmap work — the front door and routing guide |
| [task-start-roadmap-check](task-start-roadmap-check/SKILL.md) | Starting, resuming, continuing, redirecting, or delegating a task |
| [tracking-phased-work](tracking-phased-work/SKILL.md) | You need the end-to-end flow for ordered phased work |
| [phase-ledger-maintenance](phase-ledger-maintenance/SKILL.md) | Creating, updating, or repairing the feature list `features.md` and readiness checklist |
| [execution-locks](execution-locks/SKILL.md) | Deciding whether to continue, switch, defer, block, or resume across features, phases, or queues |
| [subagent-roadmap-coordination](subagent-roadmap-coordination/SKILL.md) | Spawning or reviewing subagents for roadmap-backed work |
| [roadmap-verification](roadmap-verification/SKILL.md) | About to claim a feature item, phase, or roadmap is complete |

When in doubt: `using-roadmap-discipline` → `task-start-roadmap-check` → follow what the feature list says.

## Session Lifecycle

```text
1. task-start-roadmap-check     — find readiness checklist and features; verify environment
2. execution-locks              — only if multiple phases, workstreams, or features apply
3. do the work                  — stay within the active lock and assigned feature item
4. roadmap-verification         — run verification command to get evidence before marking passing
5. phase-ledger-maintenance     — check items, update states, and record evidence/resume notes
```

## Core Artifacts

All files are stored in `docs/roadmap-discipline/`:

**1. Startup Readiness Checklist** (`docs/roadmap-discipline/readiness-checklist.md`):
Tracks the 4 conditions required for any agent session to operate the project: Can Start, Can Test, Can See Progress, Can Pick Up Next Steps.

**2. Feature List** (`docs/roadmap-discipline/features.md`):
The single source of truth for the features. Every entry must have the triple: (behavior description, verification command, current state).
Standard states: `not_started`, `active`, `blocked`, `passing`.

## Skill Priority

1. `task-start-roadmap-check` — gate before any task work, starting with Phase 0: Initialization.
2. `execution-locks` — when choosing between features or phases.
3. `phase-ledger-maintenance` — keep the features and readiness files up-to-date on disk.
4. `subagent-roadmap-coordination` — when delegating parallel features to subagents.
5. `roadmap-verification` — run verification command before any completion claim.

## Red Flags

| Thought | Reality |
| --- | --- |
| "This is just a quick fix." | Quick fixes are roadmap work too. Run the task-start gate. |
| "I remember what comes next." | Read the feature list from disk. |
| "I will inspect the code first." | The initialization gate comes before implementation files. |
| "Tests passed, so the feature is complete." | No completion claim without executing the verification command and getting evidence. |
| "I will update the feature list later." | Update before moving on. |

## Quick Start

1. Read [using-roadmap-discipline/SKILL.md](using-roadmap-discipline/SKILL.md) for the routing flow.
2. Inspect the repository's `docs/roadmap-discipline/` directory for `readiness-checklist.md` and `features.md`.
3. If they don't exist, create them immediately (Phase 0: Initialization).
4. Run verification commands to transition states from `active` to `passing`.
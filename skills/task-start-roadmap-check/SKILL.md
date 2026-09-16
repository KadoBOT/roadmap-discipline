---
name: task-start-roadmap-check
description: Use at the start of any new, resumed, continued, follow-up, redirected, or context-recovered task. Runs Phase 0 when needed and verifies that current work can be resumed from disk alone.
---

# Task-Start Roadmap Check

## Gate

Before implementation, establish what disk says is active and whether recovery state is sufficient.

Allowed before the gate completes:

- load project/skill instructions;
- locate `docs/roadmap-discipline/readiness-checklist.md` and `features.md`;
- initialize them when missing;
- read Recovery State and its `reload` references;
- inspect minimal Git metadata needed to reconcile recorded partial state.

Do not broadly inspect implementation, select unrelated work, edit code, or dispatch workers until the gate completes.

## Phase 0: Initialization

If roadmap files are missing:

1. verify install/start commands;
2. verify the test/verification framework;
3. create `readiness-checklist.md` covering Can Start, Can Test, Can See Progress, Can Pick Up Next Steps;
4. create `features.md` with Phase 0 feature triples;
5. make the next action explicit on disk;
6. create Recovery State revision 1 before business implementation begins;
7. create a clean Git checkpoint when project rules allow it.

## Existing roadmap recovery

1. Read readiness + features from disk.
2. If the helper exists, run `resume`; otherwise parse Recovery State manually.
3. Confirm `active_features`, `focus_feature`, current phase, partial state, verification, blockers, and exact next action.
4. Load only the canonical paths listed in `reload`, plus anything strictly necessary to validate them.
5. Reconcile Git HEAD/dirty-state drift if the checkpoint reports or implies it.
6. If Recovery State is missing, stale, contradictory, or too vague, repair it before implementation.
7. Use `execution-locks` if feature selection is ambiguous or multiple active features exist.
8. Briefly tell the user what state was recovered, then execute the recorded next action.

## Recovery quality gate

A fresh agent must know from disk:

- goal;
- phase and focus feature;
- complete vs partial state;
- decisions/constraints;
- files/artifacts involved;
- actual verification state;
- blockers/unknowns;
- exact next action and reason;
- minimum context to reload.

If any answer requires chat memory, the gate is not complete.

## Redirects

A generic “continue”, “quick fix”, or “also do this” does not supersede an active lock. An explicit redirect names the feature/phase/workstream to supersede current focus. Checkpoint unfinished state before switching.

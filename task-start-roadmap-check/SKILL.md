---
name: task-start-roadmap-check
description: Use at the start of any new, resumed, continued, follow-up, or redirected task. Triggers Phase 0: Initialization immediately to verify startup readiness.
---

# Task-Start Roadmap Check

## Gate

Before doing any task work, check whether a roadmap or feature list already decides what comes next.

Only these actions are allowed before the gate completes:

- load required instructions and relevant skills;
- locate `docs/roadmap-discipline/features.md` and `docs/roadmap-discipline/readiness-checklist.md`;
- perform Phase 0: Initialization if they do not exist.

Do not inspect implementation files, select business feature work, run tests, edit files, spawn task workers, or answer with next steps before this gate completes.

## Initialization Phase (Phase 0)

If `docs/roadmap-discipline/` does not exist or files are missing, run Phase 0: Initialization immediately:

1. **Verify Environment:** Check if dependencies can be installed and the app can run (e.g. `bun install` or equivalent).
2. **Verify Testing:** Run tests to confirm the test framework is active and baseline tests pass.
3. **Create Readiness Checklist:** Create `docs/roadmap-discipline/readiness-checklist.md` covering the 4 conditions:
   - *Can Start* (install and run commands documented and verified)
   - *Can Test* (test execution command verified and passing)
   - *Can See Progress* (pointer to `features.md`)
   - *Can Pick Up Next Steps* (clear active/not_started items in `features.md`)
4. **Create Feature List:** Create `docs/roadmap-discipline/features.md`. Define initialization tasks as Phase 0 features (F0.1, F0.2, etc.).
5. **Git Checkpoint:** Make a clean Git commit checkpoint.

If the user creates a design plan or spec later in the session, update `features.md` with the new feature triples (F1.1, F1.2, etc.) at that time.

## Steps for Existing Roadmaps

If the roadmap files already exist:

1. **Read Roadmap State:** Read `docs/roadmap-discipline/readiness-checklist.md` and `docs/roadmap-discipline/features.md`.
2. **Handle Locks:** If multiple features or phases are active, use `execution-locks` to decide where to work.
3. **Identify Active Item:** Find the first unchecked, non-blocked feature item (State: `active` or first `not_started`).
4. **Notify User:** Briefly tell the user what roadmap state you found before doing task work.

## Explicit Redirects

A generic request such as "continue", "next", "quick fix", "also do this", "work on another item", or an issue title is not an explicit redirect. An explicit redirect names the different feature, phase, or workstream and says it should supersede the current lock.

## Read-Only Work

Reviews, status checks, and investigation still run this gate. Update the feature list only if execution state changes.

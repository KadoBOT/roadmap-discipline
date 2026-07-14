---
name: tracking-phased-work
description: Use when tracking features, phases, and roadmap progress. Establishes the feature list as a harness primitive with a strict triple structure and verification gating.
---

# Tracking Phased Work

## Purpose

Keep roadmap-driven work ordered, resumable, and anchored to disk state instead of chat memory.

## The Feature List Primitive

The feature list in `docs/roadmap-discipline/features.md` is not a human memo; it is the system of record. Every feature item must follow the **Triple Structure**:

1. **Behavior Description:** Exactly what the user can do or what the system does.
2. **Verification Command:** The exact test or shell command used to verify the behavior.
3. **Current State:** One of the four standard states:
   - `not_started`: Item is in the backlog.
   - `active`: Current item being worked on (maximum one active item per workstream/agent).
   - `blocked`: Cannot proceed due to an external blocker (must list blocker in resume notes).
   - `passing`: Verification command ran successfully, and evidence was recorded.

## Pass-State Gating (The Verification Gate)

An agent **cannot** directly mark a feature as `passing` based on code edits alone. The transition from `active` to `passing` is gated by the verification command:

- You must execute the verification command in the shell.
- It must pass successfully.
- Record the output or git commit hash as **evidence** in the feature entry.
- Once marked `passing`, the transition is locked.

## Required Flow

1. **Initialize/Start:** Use `task-start-roadmap-check` before selecting or executing work. Perform Phase 0: Initialization if needed.
2. **Select/Lock:** Identify the active feature. If multiple features apply, use `execution-locks`.
3. **Delegate (Optional):** If using subagents for parallel features, use `subagent-roadmap-coordination`.
4. **Implement & Verify:** Write code, then run the verification command via `roadmap-verification`.
5. **Update State:** Record the evidence and update state to `passing` using `phase-ledger-maintenance`.

## Common Triggers

- "continue", "resume", "next", "start the next item"
- "quick fix", "also do this", "work on another item"
- a resumed session with a roadmap, plan, or features file on disk

## Red Flags

- "I remember what comes next."
- "I will inspect the code first and check the features after."
- "The user did not mention the feature list."
- "This is a new request, so the old roadmap reset."
- "Known blockers is None, but I can skip the unchecked item."

The fix is always to run the task-start gate and follow the checked state on disk.

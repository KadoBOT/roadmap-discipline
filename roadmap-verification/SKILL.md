---
name: roadmap-verification
description: Use before claiming a feature, phase, or roadmap is complete, and after finishing task work before moving to another roadmap item.
---

# Roadmap Verification

## Core Rule

No completion claim without executing the verification command and recording fresh evidence in `features.md`.

## Verification Gate

Before transitioning a feature's state from `active` to `passing`:

1. **Reread Feature List:** Load `docs/roadmap-discipline/features.md` from disk.
2. **Execute Command:** Run the exact verification command specified in the feature triple (e.g. `bun test <file>` or `curl ...`).
3. **Verify Success:** Confirm the command returns success (exit code 0 or matches expected output/log).
4. **Collect Evidence:** Copy the run summary, test log count, or Git commit hash.
5. **Update State on Disk:**
   - Update state to `passing`.
   - Update `Evidence` field with the collected output/commit.
   - For `[parallel: subagents recommended]` items, verify and update each feature separately.
6. **Phase Check:** Check a global phase only after every feature-local item in that phase is `passing`.
7. **Sync Diagram:** Update `## Phase Roadmap` styling to reflect the current phase correctly.
8. **Update Notes:** Update `Resume Notes` with `Last completed`, `Next action`, and `Known blockers`.

## Evidence Examples

| State Claim | Required Evidence |
| --- | --- |
| `passing` | Output from the verification command (e.g. "5 tests passed"), CLI logs, or Git commit hash |
| `blocked` | Reference to the open issue, failing external API, or project blocker |
| `deferred` | Reference to user directive or project instruction permitting deferral |

## If Verification Fails

Do not mark the item `passing`. Set state to `active` or `blocked` as appropriate. Update resume notes with the failure details and next steps to debug.

## Red Flags

- "The feature is basically complete, so I'll check it off."
- "Tests passed locally inside the IDE, so I don't need to run the verification command."
- "I will record evidence later when the whole phase is done."
- "I remember the verification command output from the last session."

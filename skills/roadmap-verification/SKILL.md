---
name: roadmap-verification
description: Use before marking a feature passing, completing a phase/roadmap, or moving to another roadmap item. Requires fresh verification evidence plus current Recovery State.
---

# Roadmap Verification

## Core rule

No `passing` or completion claim without fresh verification, concrete evidence, feature-list consistency, and Recovery State describing the post-verification situation.

## Verification gate

Before `active -> passing`:

1. Reread `features.md` or run helper `resume`.
2. Confirm the feature is active and allowed by execution locks.
3. Run the exact verification in its feature triple.
4. Record command/inspection, status, concrete result, and what it proves.
5. If verification fails:
   - do not mark `passing`;
   - normally keep the feature `active`;
   - checkpoint the failure, partial state, and exact diagnostic/repair next action.
6. If verification succeeds and behavior criteria are satisfied:
   - record Evidence;
   - set feature `passing` and check it;
   - select/update next allowed focus;
   - checkpoint the post-verification state.
7. Complete a phase only after all required features resolve.
8. Validate roadmap state before advancing/switching.

When the helper exists, use revision-checked checkpointing and then `check`.

## Evidence

Valid evidence includes test result/count, successful command summary, concrete artifact inspection, or a commit SHA only when the commit itself proves the required behavior.

Remembered earlier output is not fresh evidence.

## Failed verification is recovery state

Record failures immediately. A fresh agent should know what was tried, why it failed, and what exact repair/diagnostic action is next.

Do not turn an ordinary debuggable failure into `blocked`.

## Revision conflicts

If checkpointing reports a conflict, reread/reconcile newer state with your verification result and retry against the new revision. Never overwrite blindly.

## Handoff safety

Before ending a response after durable state changed or moving to another feature, ensure Recovery State contains the newest evidence and exact next action.

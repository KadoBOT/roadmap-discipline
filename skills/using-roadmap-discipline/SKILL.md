---
name: using-roadmap-discipline
description: Use at the start of any conversation or task. Routes the roadmap-discipline skills and requires initialization/recovery from disk before selecting, executing, delegating, or completing work.
---

# Using Roadmap Discipline

This is the front door.

## Rule

Before roadmap work, recover durable state from `docs/roadmap-discipline/`. Do not choose work from memory or chat summaries.

Treat a new session, context compaction, agent handoff, uncertain memory, crash recovery, or generic “continue” as a cold start.

Recovery order:

```text
readiness-checklist.md
→ features.md
→ Recovery State
→ minimum reload context
→ minimal Git-state reconciliation
→ exact next action
```

When the helper exists, prefer:

```bash
node <roadmap-discipline-skill>/scripts/roadmap.mjs resume --root <workspace>
```

If Recovery State is missing/stale/contradictory, use `phase-ledger-maintenance` to repair it before implementation.

## Routing

| Situation | Skill |
| --- | --- |
| Starting/resuming/continuing/redirecting/delegating/recovering | `task-start-roadmap-check` |
| Understanding the feature-state lifecycle | `tracking-phased-work` |
| Creating/updating/repairing roadmap files or checkpoint state | `phase-ledger-maintenance` |
| Choosing allowed feature/phase/workstream | `execution-locks` |
| Dispatching/reviewing subagents | `subagent-roadmap-coordination` |
| About to mark work `passing` or complete a phase | `roadmap-verification` |

## Priority

1. `task-start-roadmap-check`
2. `phase-ledger-maintenance` when recovery state needs repair
3. `execution-locks` when selection is ambiguous
4. `subagent-roadmap-coordination` when delegating
5. `roadmap-verification` before completion claims

## Write-through rule

Checkpoint durable state when it becomes true, not at the end of a long session. Verification failures, partial edits, accepted worker output, redirects, and blockers are recovery state too.

## Red flags

- “I remember what comes next.”
- “The next agent can inspect the diff.”
- “Compaction preserved enough context.”
- “I will update features.md later.”
- “Tests passed, so I can move on without recording evidence.”

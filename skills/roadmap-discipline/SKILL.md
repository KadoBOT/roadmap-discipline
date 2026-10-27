---
name: roadmap-discipline
description: Keep phased roadmap work ordered, resumable, and recoverable from disk without relying on chat context. Use at session start, after context loss/compaction, before planning or delegating, when maintaining features.md, and before claiming roadmap work complete.
---

# Roadmap Discipline

Roadmap Discipline makes repository state, not conversation memory, the source of truth.

Portable project state lives at:

```text
docs/roadmap-discipline/readiness-checklist.md
docs/roadmap-discipline/features.md          # index and current recovery checkpoint
docs/roadmap-discipline/phases/*.md          # feature ledgers
```

`features.md` is a compact index and current execution checkpoint. Linked phase ledgers hold feature details and evidence. Existing single-file roadmaps remain supported. See `phase-ledger-maintenance` for the format and migration.

## Core invariant

**Chat context is a cache. Disk state must be enough to resume.**

Do not allow more than one meaningful state transition to exist only in chat memory. Checkpoint immediately after changes that a future agent would otherwise have to infer: feature selection, coherent partial edits, durable decisions, discoveries that change approach, verification results, accepted subagent output, blockers/deferrals/redirects, or completion.

A cold-start agent must be able to answer from disk:

- What phase and feature(s) are active?
- What exactly is partial or intentionally unfinished?
- What decisions/constraints must be preserved?
- What files/artifacts are involved?
- What verification ran and what did it prove/fail?
- What blockers/unknowns remain?
- What exact action happens next, and why?
- What minimum canonical context must be reloaded?

If any answer requires chat memory, checkpoint before doing more implementation work.

## Policy vs mechanics

The skills define policy. This skill also bundles an optional helper:

```text
scripts/roadmap.mjs
```

When Node or Bun is available, prefer:

```bash
node <this-skill>/scripts/roadmap.mjs resume --root <workspace>
node <this-skill>/scripts/roadmap.mjs checkpoint --root <workspace> ...
node <this-skill>/scripts/roadmap.mjs check --root <workspace>
```

The helper does not select work or replace the skills. It reads linked ledgers, writes Recovery State, checks revisions and Git drift, and validates consistency. Revision checks do not serialize concurrent writers. If unavailable, follow the same contract manually.

## Recovery State v1

The `features.md` index of an active roadmap should contain this section (feature entries may live in linked phase ledgers):

````markdown
## Recovery State

```json
{
  "version": 1,
  "revision": 1,
  "phase": "Phase 1: Core persistent modeling",
  "active_features": ["F1.1"],
  "focus_feature": "F1.1",
  "goal": "Implement the persistence behavior defined by F1.1.",
  "done_when": "F1.1 verification succeeds and evidence is recorded.",
  "last_completed": "Phase 0 initialization verified.",
  "in_progress": "F1.1 selected; no implementation edits yet.",
  "next": {
    "action": "Open the F1.1 implementation surface and implement the first failing case.",
    "reason": "F1.1 is the first unfinished feature in the current phase."
  },
  "files": [],
  "repository": {
    "branch": "feature/example",
    "head": "0123456789ab",
    "dirty": [],
    "dirty_hash": "<sha256>"
  },
  "verification": {
    "required": "bun test path/to/test",
    "last_run": "",
    "status": "not_run",
    "detail": ""
  },
  "blockers": [],
  "reload": ["docs/roadmap-discipline/features.md", "docs/roadmap-discipline/phases/phase-1.md"]
}
```
````

Rules:

- `revision` monotonically increases on each checkpoint.
- `active_features` must equal every feature whose state is `active`.
- `focus_feature` is the current parent/agent focus, or `None`.
- Multiple active features are allowed only for intentional parallel work marked `[parallel: subagents recommended]` with non-overlapping scopes.
- `next.action` must be executable, not “continue” or “finish task”.
- `verification.required` mirrors the focus feature's verification command.
- `verification.status` is `not_run`, `passed`, `failed`, or `unknown`.
- `repository` is a checkpoint observation, not a claim that the tree must remain clean. On resume, reconcile drift before trusting partial-state notes.
- `reload` lists the minimum canonical files needed to continue correctly: the index and the focus feature's ledger. `checkpoint` adds the focus ledger when it is missing; pass `--reload` to set the list explicitly.

## Revision safety

Use one roadmap writer at a time. Before a write, check the revision you read:

```bash
node <this-skill>/scripts/roadmap.mjs checkpoint \
  --root <workspace> \
  --expected-revision <revision-you-read> \
  ...
```

A conflict means the checkpoint changed since it was read. Reread, reconcile, and retry. This check is not an atomic lock; do not run concurrent writers.

## Skill routing

Use `using-roadmap-discipline` as the front door. The normal lifecycle is:

```text
task-start-roadmap-check
→ recover/checkpoint disk state
→ execution-locks when selection is ambiguous
→ subagent-roadmap-coordination when delegating
→ implement within active scope
→ checkpoint meaningful transitions
→ roadmap-verification
→ checkpoint the post-verification state
```

## Cold-start test

Before ending a response after durable state changed, assume the conversation disappears immediately. A fresh agent should be able to run/read recovery state and execute the recorded next action without asking what happened earlier.

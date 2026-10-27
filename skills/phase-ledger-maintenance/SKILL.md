---
name: phase-ledger-maintenance
description: Use when creating, updating, repairing, or checkpointing docs/roadmap-discipline/features.md, readiness-checklist.md, or structured Recovery State.
---

# Feature List & Recovery Maintenance

## Source of truth

Project roadmap state lives in:

```text
docs/roadmap-discipline/readiness-checklist.md
docs/roadmap-discipline/features.md
```

`features.md` is a compact index with status, current phase, links to feature ledgers, and `## Recovery State`. Keep current recovery information concise: replace superseded details instead of appending a running log. Record only evidence needed to substantiate state; link to existing artifacts for extensive output. Git history provides checkpoint history.

Put feature entries in separate Markdown ledgers under `phases/`, normally one per phase. Split a large phase into several files when useful. In `features.md`, list each ledger exactly once under this heading, using relative links on their own list lines, inside the roadmap directory (other lines in the section are ignored):

```markdown
## Phase Ledgers

- [Phase 1: Core](phases/phase-1.md)
- [Phase 2: Integration](phases/phase-2.md)
```

Each ledger uses `### Phase 1: Core` headings above its feature entries; use the same phase identity as Current Phase. The helper reads all links in this section and also supports feature entries in the index. Do not duplicate feature IDs across files. Keep phase order in the index and feature selection order in the ledgers. Add another ledger rather than letting a file grow without practical bound. Revision checks and the working-tree drift fingerprint cover the index only: ledger files are excluded from the fingerprint, and edits to them do not change `revision`. Read only the index and relevant ledgers during ordinary recovery (`resume` prints the focus feature's ledger); use the helper for whole-roadmap consistency checks.

A minimal index:

````markdown
# Roadmap

**Status:** In Progress
**Current Phase:** Phase 1: Core

## Phase Ledgers

- [Phase 1: Core](phases/phase-1.md)

## Recovery State

```json
{ "version": 1, "revision": 1, "...": "see roadmap-discipline" }
```
````

The helper reads the bold `Status` and `Current Phase` fields and the Phase Ledgers links from the index. Finished phases stay in their ledger; mark the phase complete in the ledger heading or feature states rather than deleting entries.

## Readiness checklist

A fresh session must be able to prove:

- **Can Start** — install/start commands are known and verified;
- **Can Test** — verification framework/commands are known and runnable;
- **Can See Progress** — `features.md` exists and reflects current work;
- **Can Pick Up Next Steps** — Recovery State identifies current focus/partial state/next action.

## Feature list format

Use feature entries such as:

```markdown
- [ ] **F1.1** (State: `active` | Verification: `bun test path/to/test`)
  - *Behavior:* Persist interrupted jobs for deterministic recovery.
  - *Evidence:* None
```

Parallel candidates may include `[parallel: subagents recommended]` after the feature ID.

Legal states: `not_started`, `active`, `blocked`, `deferred`, `passing`.

## Recovery State

Maintain the v1 JSON contract documented by `roadmap-discipline`.

Required operational fields:

- schema `version` and monotonically increasing `revision`;
- current `phase`;
- `active_features` and parent/agent `focus_feature`;
- `goal` and `done_when`;
- `last_completed` and exact `in_progress` partial state;
- executable `next.action` and `next.reason`;
- `files` with path + current role/state;
- Git `repository` snapshot/fingerprint;
- `verification.required`, `last_run`, `status`, `detail`;
- `blockers`/unknowns;
- minimal canonical `reload` paths.

When the helper is available, prefer revision-checked writes:

```bash
node <roadmap-discipline-skill>/scripts/roadmap.mjs checkpoint \
  --root <workspace> \
  --expected-revision <revision-read> \
  --in-progress "<exact partial state>" \
  --next "<one executable action>" \
  --why "<why this is next>"
```

Then validate:

```bash
node <roadmap-discipline-skill>/scripts/roadmap.mjs check --root <workspace>
```

If the helper is unavailable, increment revision and maintain the same fields manually.

## Write-through triggers

Checkpoint after:

1. selecting/changing focus;
2. meaningful partial edits;
3. durable decisions/discoveries;
4. approach changes;
5. verification pass/fail;
6. accepting/rejecting worker output;
7. blocker/unblock/redirect/deferral;
8. feature/phase completion;
9. ending a response/handoff after state changed.

## Legacy migration

Existing single-file roadmaps remain valid. When next maintained, split a large `features.md` into linked ledgers, preserving feature order, states, evidence, phase headings, and Recovery State. Verify the links and run `check`; the first `checkpoint` of a roadmap without Recovery State needs an explicit `--next`, since the default next action is rejected as vague; do not migrate inactive roadmaps just for formatting. Do not discard history or evidence merely to reduce file size.

If an older roadmap has only Resume Notes:

1. read feature/readiness state;
2. inspect minimal Git state needed to explain current partial work;
3. identify active/next feature;
4. convert known resume facts into Recovery State revision 1;
5. mark unknown facts as `Unknown` rather than inventing them;
6. resolve decision-critical unknowns before implementation;
7. validate and resume.

Do not rewrite inactive historical roadmaps solely for formatting. Migrate them when next activated.

## Update rules

Feature state/evidence, parallel markers, Recovery State, checkboxes, and visual current-phase styling may be updated to reflect execution reality. Global phase scope/order changes require explicit approval rather than silent mutation.

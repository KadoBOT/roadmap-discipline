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

`features.md` owns feature/phase state and embeds `## Recovery State` for volatile execution state.

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

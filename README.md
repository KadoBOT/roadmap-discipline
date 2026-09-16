# Roadmap Discipline Skills

A bundle of Agent Skills for keeping phased work ordered, verifiable, and recoverable from repository state instead of chat memory.

Install all eight skills:

```bash
npx skills add KadoBOT/roadmap-discipline
```

Or install selected skills with `--skill`.

## Architecture

Roadmap Discipline separates policy from mechanics:

- the **skills** define initialization, feature selection, locking, checkpoint cadence, delegation, and verification policy;
- `docs/roadmap-discipline/features.md` remains the portable human-readable system of record;
- `features.md` embeds a versioned `## Recovery State` JSON checkpoint for execution state that must survive context loss;
- the main `roadmap-discipline` skill includes an optional zero-dependency helper at `scripts/roadmap.mjs`.

The helper does not replace the skills or Markdown. It makes the mechanical parts deterministic: `resume`, `checkpoint`, revision conflict detection, Git drift detection, and consistency checking.

The continuity target is simple:

> If the conversation disappears after a meaningful state transition, a fresh agent can recover from disk, load only the recorded canonical context, and execute the exact next action without reconstructing intent from chat history.

## Consuming-project artifacts

Every project using the discipline stores state under:

```text
docs/roadmap-discipline/readiness-checklist.md
docs/roadmap-discipline/features.md
```

`readiness-checklist.md` proves a fresh session can start, test, see progress, and pick up the next step.

`features.md` contains feature triples:

1. **Behavior** — what the system/user can do.
2. **Verification** — the exact command or inspection that proves it.
3. **State** — `not_started`, `active`, `blocked`, `deferred`, or `passing`.
4. **Evidence** — concrete evidence for `passing`, blocker/defer evidence when applicable.

It also contains `## Recovery State`, which records the current phase, all active feature IDs, the parent/focus feature, partial state, exact next action and reason, files involved, Git snapshot/fingerprint, verification status, blockers, and minimum context to reload.

## Optional recovery helper

When the main skill is installed, resolve its installed directory and run:

```bash
node <roadmap-discipline-skill>/scripts/roadmap.mjs resume --root <workspace>
node <roadmap-discipline-skill>/scripts/roadmap.mjs checkpoint --root <workspace> ...
node <roadmap-discipline-skill>/scripts/roadmap.mjs check --root <workspace>
```

The same script runs under Bun.

`resume` emits a compact cold-start packet and reports Git state drift.

`checkpoint` writes the structured state, increments `revision`, and supports `--expected-revision` optimistic concurrency.

`check` rejects contradictions such as active-state mismatches, passing items without evidence, stale focus features, invalid reload references, vague next actions, or completion claims inconsistent with feature state.

Legacy `features.md` files remain readable and produce a migration warning until they are next activated and checkpointed.

Run the bundled self-test with:

```bash
node <roadmap-discipline-skill>/scripts/roadmap.self-test.mjs
```

## Skill catalog

| Skill | Purpose |
| --- | --- |
| `roadmap-discipline` | Overview, continuity invariant, Recovery State contract, helper usage |
| `using-roadmap-discipline` | Front door and routing guide |
| `task-start-roadmap-check` | Phase 0/session-start and cold-start recovery gate |
| `tracking-phased-work` | Feature triples, states, transitions, checkpoint cadence |
| `phase-ledger-maintenance` | Creates/repairs roadmap files and Recovery State |
| `execution-locks` | Chooses allowed feature/phase/workstream and prevents unsafe switching |
| `subagent-roadmap-coordination` | Parallel/delegated work and checkpoint-safe handoffs |
| `roadmap-verification` | Fresh evidence gate before `passing` or phase completion |

## Repository layout

The main skill intentionally lives under `skills/roadmap-discipline/`. A root `SKILL.md` would cause `npx skills` to treat the repository as one flat skill and shadow the other skills.

## License

MIT.

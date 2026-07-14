# Roadmap Discipline Skills

A plugin bundle of agent skills designed to keep phased, roadmap-driven work ordered, resumable, and anchored to disk state instead of chat memory.

These skills are compatible with the Vercel **Agent Skills** specification and can be installed into any compatible AI agent (such as Claude Code, Cursor, Windsurf, Roo Code, etc.) using `npx skills`.

---

## Installation

You can install all or any of these skills using the `skills` CLI:

### 1. Install via `npx skills add` (Recommended)
To add these skills to your current project, run:
```bash
npx skills add KadoBOT/roadmap-discipline
```

The CLI will fetch the repository, discover all **8 skills** defined under the `skills/` directory, and prompt you to choose which skills you want to install and which agents you want to install them to (e.g., local project configuration like `.agents/skills` or `.claude/skills`).

- **Install specific skills:**
  If you only want to install a subset of the skills, you can specify them with the `--skill` flag:
  ```bash
  npx skills add KadoBOT/roadmap-discipline --skill task-start-roadmap-check --skill roadmap-verification
  ```
- **Install globally:**
  To make these skills available across all your local projects, add the `-g` flag:
  ```bash
  npx skills add -g KadoBOT/roadmap-discipline
  ```

### 2. Run without installing (On-demand)
You can instruct your agent to use a specific skill on-demand without installing it:
```bash
npx skills use KadoBOT/roadmap-discipline@task-start-roadmap-check
```

---

## Repository Layout & npx skills Compatibility

To ensure compatibility with the `npx skills` CLI, the skills are organized in a **Flat Layout** inside a dedicated [skills/](skills/) folder:

```text
roadmap-discipline/
├── README.md                              # This file
├── docs/roadmap-discipline/               # Where the project's roadmap state is stored
│   ├── readiness-checklist.md
│   └── features.md
└── skills/                                # Scanned by the skills CLI
    ├── roadmap-discipline/                # Overview & main routing skill
    │   └── SKILL.md
    ├── using-roadmap-discipline/          # Setup and general usage routing
    │   └── SKILL.md
    ├── task-start-roadmap-check/          # Gate run at session startup
    │   └── SKILL.md
    ├── tracking-phased-work/              # Feature list & verification rules
    │   └── SKILL.md
    ├── phase-ledger-maintenance/          # Creating/updating features.md
    │   └── SKILL.md
    ├── execution-locks/                   # Concurrency/priority lock manager
    │   └── SKILL.md
    ├── subagent-roadmap-coordination/    # Subagent coordination rules
    │   └── SKILL.md
    └── roadmap-verification/              # Verification & evidence-gathering gate
        └── SKILL.md
```

> [!NOTE]
> Having a `SKILL.md` at the root of the repository causes the `npx skills` CLI to treat the repository as a single flat skill and shadow all nested subdirectory skills. To resolve this and make all 8 skills discoverable, the main `roadmap-discipline` skill has been placed inside [skills/roadmap-discipline/SKILL.md](skills/roadmap-discipline/SKILL.md).

---

## Skill Catalog

The bundle includes the following skills:

| Skill | Folder | Purpose / When to Invoke |
| --- | --- | --- |
| **roadmap-discipline** | [skills/roadmap-discipline/](skills/roadmap-discipline/) | The main skill containing an overview of the discipline. |
| **using-roadmap-discipline** | [skills/using-roadmap-discipline/](skills/using-roadmap-discipline/) | The entry point and routing guide to find the other skills. |
| **task-start-roadmap-check** | [skills/task-start-roadmap-check/](skills/task-start-roadmap-check/) | Run immediately when starting, resuming, or delegating a task to check the active roadmap phase/item. |
| **tracking-phased-work** | [skills/tracking-phased-work/](skills/tracking-phased-work/) | Defines the structure of the feature list and state transitions. |
| **phase-ledger-maintenance** | [skills/phase-ledger-maintenance/](skills/phase-ledger-maintenance/) | Guide for creating or updating `features.md` and `readiness-checklist.md` on disk. |
| **execution-locks** | [skills/execution-locks/](skills/execution-locks/) | Used to manage locks when switching workstreams or resuming features. |
| **subagent-roadmap-coordination** | [skills/subagent-roadmap-coordination/](skills/subagent-roadmap-coordination/) | Establishes communication protocols and rules when delegating tasks to subagents. |
| **roadmap-verification** | [skills/roadmap-verification/](skills/roadmap-verification/) | Invoked before marking a feature or phase complete, ensuring verification commands are run. |

---

## Quick Start & Session Lifecycle

The discipline relies on a structured lifecycle that connects disk state to your active workspace:

1. **Start the session:** An agent must run `task-start-roadmap-check` immediately upon starting a task. This enforces **Phase 0: Initialization** to create or verify the existence of:
   - `docs/roadmap-discipline/readiness-checklist.md`
   - `docs/roadmap-discipline/features.md`
2. **Consult execution locks:** If multiple features or phases are active, run `execution-locks` to acquire the correct lock.
3. **Execute work:** Code is written and tested within the bounds of the active feature and phase.
4. **Run verification:** Before completing work, run `roadmap-verification` to run the feature's verification command and record evidence.
5. **Update the ledger:** Run `phase-ledger-maintenance` to update feature statuses and log verification evidence in `features.md`.

---

## License

This project is open-source and licensed under the MIT License.

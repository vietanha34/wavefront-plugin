---
name: epic-taskization
description: Use when turning a requirements document into a development plan - break software into epics, phases, waves and tasks with per-task prompts, contracts, review gates and a parallelism assessment. Also use when orchestrating the execution of such a plan across parallel worker sessions, including several epics at once.
---

# Epic Taskization

Turn requirements into an executable, reviewable development plan, then (when an orchestrator harness is available) orchestrate its execution. Distilled from a real 3-phase / 50-PR project.

**Output language rule:** every document, prompt and report this skill produces follows the language of the INPUT requirements document. Code, SQL, commit messages, PR titles/bodies and identifiers stay English.

## The hierarchy

```
SOFTWARE
└── EPIC   = one large independent feature (e.g. "Event Analytics"). Has an overall spec.
    └── PHASE = one complete user-visible increment. Has its own spec, approved by the user.
        └── WAVE = a batch of tasks opened together. Opens ONLY when the previous wave's gate is green.
            └── TASK = one PR, one worker, a CLOSED list of files it may touch.
```

**Task naming (mandatory):** `<EPIC>-P<phase>-W<wave>-T<n>-<role>[-<slug>]`, e.g. `EA-P3-W2-T6-fe-comparison-table`. Git branch: lowercase of the same. Every worker report MUST open with the full task ID in brackets — this is what makes multi-epic routing possible.

**Role token (closed vocabulary — it selects the prompt template AND the review gate):**
`spec` (planning/spec-only), `ctr` (contract/schemas), `be` (backend/service), `fe` (frontend/UI), `int` (integration test — forbidden from product code), `vis` (visual/E2E verify), `fix` (bug fix — acceptance is existing red tests turning green with zero assertion edits), `docs` (acceptance docs), `ops` (infrastructure: merges to dev/main, CI, release — no TDD). Cross-wave work uses `<EPIC>-OPS-<slug>` (e.g. `RR-OPS-merge-dev`) instead of an ad-hoc name.

## Inputs

Accepted forms and how to handle each:

1. **Requirements file on disk** — read it, cite by section (`§5.2 says …`).
2. **Text pasted in chat** — save it VERBATIM to a file first, point workers at the file (relay by message garbles text), and copy it verbatim into the spec's Appendix as the permanent reference.
3. **Design source** (an Artifact canvas / Figma / images) — the design must already be EXPORTED into the repo before any design-dependent task is handed out: a worker session has no Artifact tool and design tokens expire within hours, so a prompt pointing at the design's origin is a dead task. Point each task at the exported file by path (`.wavefront/epics/<CODE>/P<n>/design/<Screen>.dc.html`) and put that path in its closed file list; the per-state list the visual-verify task needs is `design.yaml` → `states`. Pin EXACT names, list the easily-confused siblings (older canvases, `uploads/` copies) with a "do not read" warning. The port and its export rule: `${CLAUDE_PLUGIN_ROOT}/adapters/design/README.md`.
4. **Existing codebase** — review it into the spec's "Current state" section: a findings table with severities.
5. **User decisions made in conversation** — record as Decisions ("user confirmed, do not reopen"). Unresolved points become Questions for the user; once answered, convert to Decisions and delete the question.
6. **A work-item envelope from a tracker adapter** (the host framework's
   `${CLAUDE_PLUGIN_ROOT}/schemas/work-item.schema.json`) — the normal input when this skill runs under an
   orchestrator. Read `spec_markdown` as the requirements document and `epic.code` /
   `epic.base_branch` as the branch topology; they are already settled, so do not re-ask.
   Two fields change behaviour and must be honoured:
   `gate` — anything other than `agent-ready` means STOP and report; and
   `tracker.auto_close_on_pr_merge` — when true, every PR carries ONLY the smallest
   item's id (never a parent's), and the parent's state is re-read after each merge.
   Never reason about a named tracker (Linear, Jira, ClickUp, Monday…): the envelope is
   the only shape this skill knows, which is what makes swapping trackers an adapter
   change rather than a change here.

Precedence: requirements + Decisions are binding; design is binding for UI but when it conflicts with requirements, requirements win and the spec records the divergence as deliberate. Ambiguity is never guessed: it becomes an Assumption (with alternatives) or a Question.

**Branch topology (settle BEFORE execution starts):** identify (1) the MAIN branch, (2) the DEV/integration branch — where a finished epic's feature base merges, often `dev`, not main — and (3) each epic's feature base branch. Ask the user whenever this is not explicit; record the answer as a Decision. A finished epic merges to the dev/integration branch unless the user says otherwise, and CI side effects of that branch (e.g. a docker build triggered on push) are called out before pushing.

If the input is not yet a coherent requirements document, suggest the user run `prd-development` (or `doc-coauthoring`) first — do not reinvent that step here.

## The process (B1–B7)

```
B1  Read all inputs → enumerate requirements R1..Rn, each tagged with its source location.
B2  Split into EPICs → one-sentence goal + explicit non-goals per epic.
B3  Split each epic into PHASEs → each phase independently usable; later phases build on earlier.
B4  Split each phase into WAVEs by FIXED law:
      W0     = CONTRACT (schemas/types/stubs) — mandatory whenever the phase changes an interface.
      W1..n  = implementation. BE and FE split into separate tasks BY DEFAULT —
               split when each side is ≥ ~half a day of work OR the two sides verify
               against different surfaces (real datastore vs design render). A thin
               end-to-end slice (a few lines each side) MAY be one task spanning both,
               with the closed file list explicitly naming both sides — two workers
               and two gates for ten lines is overhead, not rigor.
               Backend before frontend when FE needs real data, parallel when W0
               stubs let FE run early.
      W-last = INTEGRATION TEST (hand-computed numbers) + VISUAL/E2E VERIFY — mandatory, every phase.
B5  Split each wave into TASKs → each with a closed file list, measurable acceptance, a prompt,
      and a MODEL TIER (cheap / default / strong — rules in the orchestrator adapter;
      skip the column when the harness cannot pick a model per task).
      SIZE each task to finish in ≤ ~150 worker API calls (~45 min active). Every call
      re-reads the whole context, so cost grows ~quadratically with session length: in
      I18N-P1 the 9 tasks over 200 calls were 64 % of worker cost. Split by area/screen
      group, not by layer. Don't split below ~50 calls — each extra task pays a ~52k
      prefix, a re-read of prompt + spec, one more gate and one more review.
B6  Assess parallel vs sequential with the matrix below, then run `wave-plan.mjs`
      (Kernel scripts) on the closed file lists → draw the run diagram + merge order.
B7  Emit the spec document (structure in ${CLAUDE_PLUGIN_ROOT}/skills/epic-taskization/references/lessons.md §Spec) → USER APPROVES → only then create tasks.
```

**Final message of a planning run:** the last message you send MUST carry the wave table
itself, not a pointer to a file — one row per task: wave (`W0` / `W1..n` / last wave) ·
task ID in the mandatory format · role · its closed file list · model tier when the harness
picks one — followed by the merge order. Reviewers and any automated check read the LAST
message only; a plan that exists only inside files reads as no plan at all.

## Kernel scripts (deterministic — run these, never re-derive by judgement)

`${CLAUDE_PLUGIN_ROOT}` is the plugin root. The **Read tool does not expand variables**:
either resolve it once (`echo $CLAUDE_PLUGIN_ROOT`) and Read absolute paths, or run the
scripts through Bash, which does expand it. No install step — each script is self-contained.

**wave-plan** — wave assignment from closed file lists (B4/B6). Run from the REPO ROOT:
surface globs are checked against real files.

```bash
node ${CLAUDE_PLUGIN_ROOT}/scripts/wave-plan.mjs tasks.json [--json]
```

`tasks.json` = `{ "contract_surface": [glob], "shared_surface": [glob], "tasks": [{ "id", "role", "closed_files": [path] }] }`.
Take both surface lists from `.wavefront/config.yaml` → `surfaces.contract` / `surfaces.shared`.
Exit 0 = planned. Exit 1 = a task has no `closed_files`, or a surface glob matches no file
in the repo (stale config — fix the config, do not drop the surface).

**spec-lint** — the gate a task spec must pass before the item may move to `Todo`.

```bash
node ${CLAUDE_PLUGIN_ROOT}/scripts/spec-lint.mjs <file.md> [<file.md> …] [--json]
```

Reads stdin when given no file. Exit 1 = at least one ERROR; the item stays where it is.

**name-check** — issue titles and labels against `${CLAUDE_PLUGIN_ROOT}/docs/NAMING.md`,
with the epic registry read from config.

```bash
node ${CLAUDE_PLUGIN_ROOT}/scripts/name-check.mjs --issues <issues.json> --config .wavefront/config.yaml [--json]
```

`issues.json` = what a tracker adapter returns: an array of `{ id, title, labels[], parentId, projectMilestone }`.
Exit 1 = ERROR; WARN does not fail.

**gate.sh** — the per-PR wave gate. ORCHESTRATOR ONLY, from a clean review worktree; needs
`gh` and the PR on GitHub.

```bash
bash "<orchestrator.gate_script>" <pr> <allowed-files.txt> [-- "<check cmd>" …]
```

The path comes from `orchestrator.gate_script`; left empty it is the copy shipped with the
plugin, and the `[wavefront] Gate: chay …` line printed at session start already holds the
resolved absolute path. `allowed-files.txt` = the task's closed file list, one exact path
per line. Exit 0 only when the scope is clean AND every check passes; full logs stay in
`/tmp/gate-<pr>/`.

## Parallelism matrix (B6)

| Question | Answer → decision |
|---|---|
| Two tasks touch the SAME FILE? | Sequential. Record merge order + "later one rebases". |
| Same file but disjoint functions/blocks? | Parallel allowed, WITH a conflict note naming each side's blocks; smaller diff merges first. |
| Task B consumes an interface task A defines? | A lands first with the interface FROZEN + documented in A's PR; then B ∥ C fan out coding against the interface — they do not wait for each other. |
| How do BE and FE agree on the API? | Contract-first: W0 ships the schemas/types in ONE shared package both sides import (typed RPC end-to-end in a monorepo; OpenAPI + codegen across repos), plus a DETERMINISTIC stub so FE starts before the real backend. Server echoes semantics back in `meta` — the client never infers them from its own input. FE mocking its own shapes, or BE-first-FE-waits, are both rejected models. |
| File is a HIGH-RISK SHARED SURFACE (used by every feature)? | One lane, one task at a time — and this lane is GLOBAL ACROSS EPICS. Any change there needs byte-identical/snapshot pins of existing behavior written and committed BEFORE the change. |
| Task only adds tests/fixtures/docs? | Parallel with anything that doesn't share its files. |
| A later-wave task's real dependency already landed? | Release it early (e.g. integration tests start when backend lands; don't wait for FE). |

## Task prompts

Every task prompt = COMMON PREAMBLE + task-specific part. Templates (including the mandatory Superpowers TDD chain, the contract-task, integration-test-task and visual-verify-task variants) are in [references/templates.md](${CLAUDE_PLUGIN_ROOT}/skills/epic-taskization/references/templates.md) — read it before writing any prompt.

Hard rules baked into every prompt:
- TDD via Superpowers skills (`superpowers:test-driven-development` etc.) — the exact chain is in templates.md.
- Closed file list; deviations are REPORTED, never silent.
- Stop-on-surprise: an unexpected extra layer of the problem → stop and report, never silently widen scope.
- Real output only: read BOTH the `Test Files` and `Tests` summary lines; a globally-red check must be counter-measured against the base before calling it "pre-existing".
- No format/lint sweeps; no `git add -A`; generated junk never enters commits.

## Review gates (owned by the orchestrator, never delegated)

End of every WAVE: for each PR — rerun its tests yourself (via the gate script the host config names in `orchestrator.gate_script`, which keeps the orchestrator's context small), diff against the contract, check acceptance line by line, check the file list, then merge in the recorded order (later PRs rebase), then run the integration suite ON THE BASE BRANCH after all merges. A red gate goes back to the owning worker with actionable findings; the next wave stays closed until green.

End of every PHASE: integration-test task (hand-computed numbers, forbidden from touching product code — bugs found go back to the ORIGINAL AUTHOR with the red tests as the acceptance, fix must turn them green WITHOUT editing assertions) + visual/E2E verify task + docs update. The invariants ledger (I1..In — each semantic rule pointing at its pinning test) is appended, never rewritten.

## Execution

This skill is **harness-neutral**: nothing below the plan documents assumes a particular
orchestrator. Execution needs an **orchestrator adapter**, which is not part of this skill.

1. Read `orchestrator.adapter` from the host config (`.wavefront/config.yaml`).
2. Read that adapter under `${CLAUDE_PLUGIN_ROOT}/adapters/orchestrator/` — it owns spawning,
   message routing by task ID, the multi-epic registry, stall detection and revival, the
   review/merge flow, and the substitutions `templates.md` leaves as placeholders
   (`<REPORT COMMAND>`, `<FALLBACK CHANNEL>`, `<SESSION ID>`, `<BROWSER PANEL>`).
3. Verify the harness actually answers before spawning anything.

**If there is no adapter, or the harness does not answer: say so explicitly and STOP after
producing the plan documents.** Do not improvise a different execution harness, and do not
fall back to running the tasks yourself in this session — a plan executed by the planner
loses every gate this skill exists to enforce.

A prompt must never reach a worker with a placeholder still unsubstituted; that is a dead
task.

Battle-tested rules that keep quality up are in [references/lessons.md](${CLAUDE_PLUGIN_ROOT}/skills/epic-taskization/references/lessons.md) — read it when writing specs, prompts, or reviewing.

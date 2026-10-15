# AO orchestration runbook (multi-epic capable)

**This file is the AO adapter.** It is the only file in this skill that names a specific
harness; SKILL.md, lessons.md and templates.md are harness-neutral by design. Swapping
harness means writing a sibling of this file, not editing the other three.

Substitutions this adapter owns, which templates.md leaves as placeholders:

| Placeholder | AO value |
|---|---|
| `<REPORT COMMAND>` | `ao report --done\|--needs-input\|--stuck --note "<report>" [--pr-created <url>] [--artifact <file>]` |
| `<FALLBACK CHANNEL>` | `ao send --session <orchestrator-session-id>` |
| `<SESSION ID>` | `$AO_SESSION_ID` |
| `<BROWSER PANEL>` | `ao browser` (the AO desktop Browser panel the user watches) |

AO capability flags the orchestrator must honour: reports are delivered in batches and
deliberately late (`done` ~5 min, progress notes up to 1 h; `needs-input`/`stuck` at once),
`ao send` has a size limit (split into numbered parts) and can garble mid-flight, and
session `active`/`idle` state is unreliable.

Only applies when the `ao` CLI is available (`ao status` answers). Without it: tell the
user execution needs AO (or another harness they choose) and stop after the plan docs.
The orchestrator coordinates; it does not write product code, resolve conflicts, or
push feature commits itself.

## Epic registry (the multi-epic backbone)

Keep ONE state file (scratchpad or `docs/orchestration/state.md`) and update it every
time a message arrives or a gate changes. Per epic:

```
EPIC <ID>  base: <feature branch>   status: <phase/wave>
  running:  <task-id> -> <session>   (started, last heard)
  awaiting review: <task-id> -> PR #n
  red gates / blocked: <task-id>: <one line>
  pending user decisions: <list>
LANES (GLOBAL, cross-epic): <high-risk shared file> -> held by <task-id or free>
```

Rules:
- Every epic has its own feature base branch, its own merge order, its own integration
  verify. Only the final merge to the shared integration branch (dev/main — per the
  branch-topology Decision in SKILL.md) is shared; test-merge locally first, and a
  conflict there is resolved by a WORKER (the owner of the conflicting change), never
  by the orchestrator.
- High-risk shared-surface lanes are global: two epics wanting the same risky file queue
  behind each other, tracked in LANES.
- Route every incoming worker message by the `[EPIC-P-W-T]` prefix; a message without a
  parseable ID → ask the worker to resend with the ID, never guess the epic.
- Session names encode the task: `ao spawn --name "<EPIC>P<p>W<w>T<n>-<role>[-slug]"`
  (≤20 chars — count before running; shorten the slug, never the ID or the role —
  the role token tells the sidebar reader WHO this worker is: be/fe/int/vis/fix/…).

## Spawning and messaging

- `ao spawn --project <p> --name <name> --prompt "$(cat prompt.txt)"` — build prompts in
  a temp file. Spawn can fail transiently (`context deadline exceeded`, SPAWN_TIMEOUT)
  under load: kill the stillborn session, retry; if it keeps failing, hand the task to
  an idle finished worker via `ao send` instead.
- `ao spawn --prompt` rejects prompts over 16 KiB (PROMPT_TOO_LONG). Write the full prompt
  to a file in the orchestrator's artifacts dir and spawn with a short pointer prompt
  ("read and follow <file>"); `wc -c` the prompt before spawning.
- `ao send` has a size limit (MESSAGE_TOO_LONG) → split into numbered parts; and it can
  garble mid-flight → workers must quote garbled passages back instead of guessing.
- ONE SESSION PER TASK is the default: `ao spawn` a fresh session named after the task,
  and kill it once its PR is merged and its report is in. Reusing a finished worker for
  the next task leaves the harness showing STALE metadata — the sidebar keeps the old
  branch and the old PR list, so nobody can tell what that worker is doing now — and it
  piles several epics into one transcript, where same-numbered decisions from different
  epics (CR-D4 vs DR-D4) are genuinely easy to confuse. The prompt cites the spec, so a
  fresh worker loses nothing: spec and PRs are the source of truth, not worker memory.
- The ONE exception worth reusing: a `fix` task on code that worker itself wrote, where
  the acceptance is someone else's red tests turning green. There the context is real.
- Workers report back via `ao report` only (templates.md §1 REPORT BACK). AO delivers
  every report that arrived since your last turn as ONE batch, so three workers finishing
  together cost one wake-up instead of three. Delivery is deliberately late: `done` ~5 min
  after the report (settlement window), `checkpoint` up to 1 h unless another report pulls
  it along; `needs_input`/`stuck` at once. A PR that is up but not yet reported is normal
  for those 5 minutes — don't chase the worker. `ao send` from a worker is reserved for
  the case where `ao report` fails. Back this with a safety net: a background
  `until`-loop polling `gh pr list` wakes you when a PR appears even if the worker
  forgets to report.

## Orchestrator context budget

The orchestrator is the longest session of an epic, and every incoming message re-reads
its whole context. In I18N-P1 it averaged 603k tokens per call (p95 926k) over 324 calls,
which was 21 % of the epic's cost. In SG-P2/P3 (08–10/10) it reached 42 % ($235 of
$553): 873 calls at a 425k median, 207 inbound messages, 8 full-cache rewrites after
idle gaps, and 140 calls carrying Linear updates. Keep it small:

- **Spec excerpts, not spec reads.** When writing a task prompt, paste the binding spec
  sections that task needs (templates.md §1 SPEC EXCERPT). Workers that grep the whole
  spec pay for it on every later call.
- **Gate through a script — mandatory.** Never run tests, typecheck or lint directly in
  the orchestrator session (SG-P2: 73 test + 18 typecheck runs by hand, `gate.sh` 4
  times). Run the gate script from a review worktree:
  `"$GATE" <pr> <allowed-files> -- "<check>"…` where `$GATE` is the ABSOLUTE path
  declared ONCE in the host config (`orchestrator.gate_script`). Never hard-code a path
  inside a plugin install dir: that directory changes on every plugin update, and an
  external harness does not expand `${CLAUDE_PLUGIN_ROOT}`. Read it from config. It prints ~10 lines (head SHA, mergeable, files outside the
  closed list, PASS/FAIL per check with the `Test Files`/`Tests` lines) and keeps full
  logs in `/tmp/gate-<pr>/`. Open a log only on FAIL. Raw `git diff`, `gh pr view` and
  test output in the orchestrator transcript are the most expensive tokens of the epic.
  Re-checking one failed point after a fix: rerun `gate.sh` with only that check.
- **One message per event.** A worker sends ONE `ao report` when done or blocked —
  never `ao report` plus `ao send` with the same content (SG-P2: 47 of 51 workers did
  both), never a report split into "part 1/3" (long detail goes in a file passed with
  `--artifact`). The orchestrator does not send FYI messages ("base moved", "T4 merged") to running workers.
  Every message wakes a 300–500k-token worker turn. Fold that information into the one
  message the worker needs: the gate result or the rebase instruction.
- **Reset at wave boundaries.** The epic registry (state file above) is the handoff. Once
  a wave is merged and no worker is mid-task, bring the state file up to date: base SHA,
  Decisions added this wave, open PRs, the next wave's spawn list. Then ask the user, in
  the wave summary you send anyway, to run `/compact` in this session. AO has no
  fresh-context restart; `resume-agent` keeps the old context. Hand off instead when
  context passes ~400k and the user is away, or when `/compact` is not available in
  the session's mode:
  1. Spawn a successor with `ao spawn --kind orchestrator --prompt "<read state file + this skill>"`.
  2. Tell any running worker, and the PM channel, the new orchestrator id.
  3. The successor runs `ao session kill <old-id>` once it confirms it has the state.
- **Compact before a long idle.** The prompt cache lives 1 hour. Coming back after a
  longer gap rewrites the WHOLE context at the cache-write price ($20/MTok on Fable 5.1:
  a 600k context = $12 per wake-up; SG-P2 paid ~$56 for 8 of them). Before any pause
  you expect to exceed an hour — night, waiting on a user decision, quota exhausted,
  long CI — with context above ~200k: bring the state file up to date, then ask the
  user to `/compact` (or hand off as above). Write the expected idle reason into the
  state file so the successor knows what it is waiting for.
- **Linear in batches.** The project's tracker-rules skill fixes WHICH transitions happen,
  not how many calls they take. Put every Linear write for one event into ONE turn of
  parallel tool calls:
  - after spawning a wave, all its sub-tasks → `In Progress`;
  - after a gate round, all newly opened PRs → `In Review`;
  - after merges, each sub-task's SUB-TASK XONG comment and its `Done` → one turn.
  Before writing `Done`, read the state once: Linear closes a sub-task automatically
  when a PR carrying its ID merges, so skip writes that automation already made. Never
  write Linear between two gate steps of the same PR.
- **Read transcripts narrowly.** For stall checks, read only the last assistant turn of a
  worker `.jsonl` (`jq -r 'select(.type=="assistant") | .message.content[]? |
  select(.type=="text") | .text' <file> | tail -5`). Never
  open the whole file: worker transcripts run 2–25 MB.

## Model tier per task (user decision 2026-10-07)

Pick the worker model when spawning: `ao spawn … --model <id>`. Omit the flag for
`default`. The tier is decided BEFORE the task is created — it is a column of the
spec's task table (lessons.md §Spec item 6), proposed by the spec author and confirmed
by the orchestrator at the spec gate. Do not add a separate "difficulty assessment"
step; the role token plus three questions decide it:

| Tier | `--model` | Use when ALL hold |
|---|---|---|
| cheap | `claude-sonnet-5-5` (full id; AO rejects the alias `sonnet` with `UNSUPPORTED_MODEL`) | role is `fix` (harness-only, red tests given as acceptance, or a layout fix with a named root cause and an agent-browser (fallback: chrome-devtools MCP, then Playwright) before/after as acceptance, ≤ 3 files), `ops` (lint/CI config, merge + CI watch), `ctr` whose code is given VERBATIM in the spec, **`fe` dictionary translation with a PO-approved glossary** (expanded 2026-10-08), or **`docs` that only copies measured numbers** (no finding expected); closed file list ≤ ~5 files; no judgement call expected (no "stop-on-surprise" likely); the orchestrator's gate reruns everything it produces |
| default | omit | everything else: `be`/`fe` following an existing pattern, `fix` that needs diagnosis, `int` on a known fixture |
| strong | project default or an explicit stronger id | `spec`; `be` core (resolver, registry, middleware, migrations with reconciliation); `fe` built against a design; `int`/`vis`/`docs` that must FIND errors in earlier work (the RB-P2 run: T11 found 9 red tests, T12 a theme type-scale bug, T13 a wrong spec assumption — all strong-tier work) |

Rules:
- Measured on the RB-P2 epic (17 workers): only 3 tasks qualified as cheap (T2-ctr, F1-fix,
  ops) — expect ~10–15 % worker-cost savings, not more. The gain is real but small; a
  single returned PR costs more than it saves, so never downgrade a task that has to
  exercise stop-on-surprise.
- Roll out gradually: start with the narrowest kinds (ops, fix with red tests), widen one
  kind at a time only after a clean run with 0 rework, and record the evidence. Every cheap
  PR gets `ao review trigger`; one rework round on a newly added kind pulls that kind back
  to default. Never send spec, core be, fe-vs-design, int/vis that must find errors, or
  SSR/hydration debugging to cheap — those need diagnosis, and a returned PR costs more
  than the tier saves.
- Measure before trusting the savings: in practice the cheap tier saved under 1 % of an
  epic's cost. The real lever is task length — cost grows ~n² in calls, so split any task
  expected to exceed ~150 calls (lessons B5).
- Verify the model id before the first use in a session (`ao spawn --model <id>` on the
  smallest task); AO has returned `MODEL_CAPABILITIES_UNAVAILABLE` for unsupported ids.
  Never substitute silently — report and ask the user, as for any explicit `--model`.
- Record the tier in the Linear sub-task description ("Model: cheap") so rework stats can
  be compared per tier afterwards.

## Stall detection and revival

- AO shows stale `active`/`idle` states. Diagnose from the transcript:
  `~/.claude/projects/<worktree-path-encoded>/*.jsonl` — read the last assistant turn.
  Timestamps there are UTC; convert before declaring something stalled.
- Worker ended its turn "waiting for X" → it is dead (nobody wakes AO workers). Revive:
  `ao session exit-agent <s>` then `resume-agent <s>` then `ao send` a resume
  instruction ("rerun the tests to learn your red/green state before continuing").
- Restarting the agent is ALSO the fix when an MCP token (e.g. Claude Design) expired:
  connections are frozen at agent start. Verify the token from the orchestrator first
  (cheap probe call); if the machine token itself is dead, ask the user to re-login,
  THEN restart the worker agent.
- Design tokens expire within hours: before assigning any design-dependent task, probe
  access yourself; tell workers to read the design and extract measurements EARLY.
- Right after `ao review trigger` on a worker, `ao send` / `exit-agent` / `kill` can return
  SERVICE_UNAVAILABLE or AGENT_SWITCH_IN_PROGRESS for a while. Retry once at most; then
  spawn a successor on the same branch and `ao session claim-pr` it.
- Run the orchestrator session itself with `--mode chat`, not the TUI: in the TUI a long
  delivery is cut from its START and the daemon re-sends it every ~15 s with no cap.
- A `--needs-input` / `--stuck` report keeps re-delivering until that worker sends a NEW
  report (`--checkpoint` / `--done`); answering with `ao send` alone does not stop it.
- macOS privacy (TCC) is granted to the app that launched the process chain (the AO app),
  and only at process start. If workers hit `Operation not permitted` on a repo under a
  protected folder (Documents, Desktop), grant the AO app access, then quit the app AND
  the daemon (`daemon/ao` survives the app) and resume — restarting the window alone
  keeps the old denial.

## Review → merge flow (per epic)

1. Worker reports PR → run the wave-gate checklist (lessons.md) yourself: checkout the
   PR head in a review worktree by running `scripts/gate.sh` there (it checks out the head detached). It reruns
   tests and typecheck and checks scope. Always return the review worktree to a clean
   base afterwards.
2. Findings → `ao send` back with concrete evidence (your own measured output, exact
   lines); the same PR is fixed by the same worker; re-verify only the failed points
   plus a rerun.
3. Merge yourself only if the user delegated merging; otherwise present and wait. Merge
   in the recorded order; sequential same-file PRs: merge, then tell the next task to
   rebase (with a block-by-block "keep both sides" map). Judge a pending PR against a
   moved base with a LOCAL TEST MERGE (or three-dot diff) — two-dot diffs lie about
   merges.
4. After telling a worker its PR merged, also tell it to STOP and not poll the PR — a
   worker left polling a merged PR burns a session forever.
5. After a wave fully merges: run the epic's integration suite on the base branch. After
   a phase: phase gate (lessons.md), then report to the user: task → PR → result →
   open items → pending decisions.
6. Known flaky infra (e.g. store-gated tests timing out under parallel load): a file
   that fails in the full run but passes alone, with the failing file CHANGING between
   runs, is environment — record it, don't chase it; never let workers "fix" it.
7. **Clean up when a task or epic is done (user rule, 2026-10-06).** Before reporting
   a parent task closed: kill every finished worker session, run `ao session cleanup
   --project <p> --yes`, and for worktrees it skips as dirty check that the dirt is
   only codegen output / screenshot dirs / draft notes, then `git checkout -- . &&
   git clean -fd` there and rerun cleanup; `git worktree prune` in the main checkout.
   Remove local test accounts and seed rows workers created (ClickHouse: every table
   and MV target holding the test `project_id`; Postgres: the org — members/projects
   cascade — then the user), and the `/tmp/<task>/` evidence dirs once their images
   are copied into the repo docs. Do not leave this for the next session.
8. **Running two epics at once makes the orchestrator's gate and the workers' tests
   fight over the same local datastore.** Symptom: the gate goes red on files that the
   epic under test never touched, with counts that are exact multiples of the expected
   value (15 instead of 5 = the same fixture inserted three times). Confirm by rerunning
   each red file alone — green alone means contention, not a bug. Cheapest fix: run the
   gate when `ao session ls` shows no worker mid-test, or give each fixture a project id
   unique per worktree. Never send such a red back to a worker as a finding.

## PM channel (optional upstream agent)

A PM agent (e.g. a Telegram-facing agent from another harness on the same machine)
can sit above orchestrators. Wiring that works with zero new infra:

- PM → orchestrator: the PM's shell runs `ao send --session <orchestrator-id>
  --message "[PM] ..."`. The `ao` binary lives inside the AO app
  (`/Applications/Agent Orchestrator.app/Contents/Resources/daemon/ao`) — symlink it
  into a PATH dir for non-AO processes. Long messages: numbered parts (garbling is real).
- Orchestrator → PM: `SendMessage` to the PM's session name from `ListAgents`
  (rediscover each send — the name suffix changes per session), prefix
  `[ORCH <project>]`. Content: wave/phase summaries and escalations to relay to the user.
- Authority boundary: a `[PM]` message counts as a USER decision only when it
  explicitly says "user chốt: ..." / "user decided: ...". Everything on the escalation
  list below still waits for the user; the PM relays, never approves.
- Count every relay: a batched message in either direction opens with `ITEMS: N` and
  numbered items. Receiving fewer than N → act on none, ask for the missing numbers (the
  channel truncates silently). A relay that replaces an earlier one opens with
  `SUPERSEDES: <earlier ITEMS / time>` before `ITEMS: N`.
- Relay every decision the user makes directly in the orchestrator session to the PM
  right away, even when no PM approval is needed — otherwise the PM reports stale state.
  Hold merges the PM explicitly gated until the PM answers.

## Escalation to the user

Bring to the user (and only these): product-semantics choices where outputs differ,
architecture-shape decisions (new endpoint vs extend, URL state vs storage), scope
extensions beyond the approved spec, anything requiring their credentials/logins, and
the wave/phase summaries. Everything else the orchestrator decides and records in the
spec's Decisions section.

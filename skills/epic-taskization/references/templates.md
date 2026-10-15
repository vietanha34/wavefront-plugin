# Task prompt templates

Role token → template: `ctr` → §3, `int` → §4, `vis` → §5, `spec` → §6, `docs` → §7,
`be`/`fe`/`fix` → §2 (a `fix` task's acceptance is the reporter's red tests turning green
with ZERO assertion edits), `ops` → no template (no TDD; exact commands + verify listed
inline by the orchestrator).

Every prompt = COMMON PREAMBLE + one task-specific variant. Write prompts in the language of the input requirements; keep code/commands/paths/identifiers English.

**Harness placeholders.** This file is harness-neutral. `<REPORT COMMAND>`, `<FALLBACK CHANNEL>`, `<SESSION ID>` and `<BROWSER PANEL>` are substituted by the orchestrator from its harness adapter (for AO, see the framework's adapters/orchestrator/ao-runbook.md). A prompt must never be sent to a worker with a placeholder still in it — that is a dead task.

When the harness has a message size limit, split a long prompt into numbered parts; and when it can garble text mid-flight, tell workers to quote the garbled passage back instead of guessing. Both are declared as capability flags by the orchestrator adapter.

## 1. Common preamble (all implementation tasks)

```
TASK <EPIC>-P<p>-W<w>-T<n> — <title>.

SETUP (mandatory, in order):
- git fetch origin && git reset --hard origin/<base-branch>; create your task branch.
- <project install/codegen steps — e.g. pnpm install && pnpm codegen BEFORE any typecheck;
  name the known phantom-error trap if one exists>.
- NEVER run the formatter. Never commit generated junk (<list known junk files>).
  Add files one by one; `git add -A` is forbidden.

SOURCE OF TRUTH: <spec path>, sections <…> are BINDING. If the contract does not work
for your task, STOP AND REPORT — do not change it.
SPEC EXCERPT (pasted by the orchestrator — the binding sections THIS task needs, verbatim,
with line ranges): <excerpt>. Work from the excerpt. Open the full spec only for a
section it cites, by line range — never read or grep the whole spec.
DESIGN (if applicable): <exact project/file/state names> — read the WHOLE part your task
touches (including drawing/SVG blocks), extract the measurements into your plan BEFORE
coding. Do NOT read: <list of confusable sibling files>. On a 403/token error: STOP and
report; the orchestrator will restart your agent. Read early — tokens expire in hours.

SUPERPOWERS FLOW (announce each skill as you start it):
1. superpowers:using-superpowers
2. SKIP superpowers:brainstorming — the design is approved in the spec. If the spec is
   wrong or incomplete for your task, stop and report instead of redesigning.
3. SKIP superpowers:using-git-worktrees IF the harness already gave you an isolated
   worktree (it normally does). If you are NOT in one, stop and report — do not create one
   yourself, and do not work in a shared checkout.
4. superpowers:writing-plans — a short plan for YOUR task only; commit it.
5. superpowers:test-driven-development — red → green → refactor; commit each green step.
6. superpowers:systematic-debugging — whenever something fails for an unexpected reason.
7. superpowers:verification-before-completion — run the named test/typecheck commands and
   paste REAL output. Read BOTH the `Test Files` line AND the `Tests` line (summaries can
   hide a failed file). Output-truncating wrappers can mask failures — trust the exit
   code and the summary lines from the full log file, never a piped `| tail` alone.
   A globally red check must be counter-measured on the base branch before you may call
   it pre-existing.
8. superpowers:requesting-code-review — review your own diff in a separate pass against
   the spec; fix findings.
9. superpowers:finishing-a-development-branch — push and open a PR against <base-branch>.
   NEVER merge. NEVER poll the PR afterwards — the orchestrator merges.

DISCIPLINE:
- FILES YOU MAY TOUCH (closed list): <files>. Anything else: report, don't touch.
- Stop-on-surprise: an unexpected extra layer (a second bug, a wider semantic change)
  → STOP and report with evidence; never widen scope silently.
- Deviations from spec/prompt are REPORTED explicitly, never silent.
- CONTEXT HYGIENE — every call re-reads everything you have read so far, so read
  narrowly:
  · search: `rg -l` first, then `rg -n <pattern> <files> | head -40`; never an
    unbounded rg/grep over the repo.
  · files: read by line range (`sed -n 'a,bp'` / Read offset+limit), not whole files;
    don't re-read a file you already have unless it changed.
  · git: `git diff --stat` first, then diff only the files you need; never the full
    branch diff.
  · test/typecheck/lint: `cmd > /tmp/<task>/x.log 2>&1; echo exit=$?`, then print the
    summary lines (`Test Files`, `Tests`, `Found N errors`) plus `grep -E 'FAIL|error'
    | head -40`. Open more of the log only when something failed.
  · screenshots: read each image once; compare by listing differences in text.
- BROWSER: screenshots, before/after evidence, E2E checks, DOM measurements and the
  fallback when <BROWSER PANEL> fails all use agent-browser: run
  `agent-browser skills get core` once, then always `agent-browser --session <SESSION ID> …`
  (one session per worker, so parallel workers never lock each other) and `… close` when
  done. Use <BROWSER PANEL> only when the user must watch the page live. Asset-only work (screenshots,
  evidence, measurements) is always headless: never pass `--headed`. If agent-browser
  cannot launch, fall back to chrome-devtools MCP (configured `--headless --isolated`; a
  PreToolUse hook blocks it unless `/tmp/chrome-devtools-unlock` exists, so `touch` it
  first and `rm` it after) and report it as a deviation. Lighthouse/performance tools
  in that MCP are always allowed. Playwright is the last resort, only when both fail:
  `playwright-core` installed in /tmp with the cached Chromium, never added to the repo,
  reported as a deviation.
  Specs and plans never restate this order inline: they point to ONE browser-tools doc in
  the repo (e.g. `docs/browser-tools.md`) that carries the order plus its effective date
  and decision source, so the next change touches one file. Text that describes what a
  script actually drives (its real drivers) stays as is, plus one pointer to that doc.
- Never end a turn while waiting on a background command (nobody will wake you);
  run foreground with a large timeout. Any dev server you start: record its PID at
  launch, kill BY PID when done, and confirm the ports are free in your report.

REPORT BACK (mandatory, ONE channel, ONE message): when done or blocked, run exactly one
  <REPORT COMMAND>
— the orchestrator substitutes this from its harness adapter before sending the prompt; it
is never invented by you. Signal one of: done | needs-input | stuck.
The note opens with your full task ID in brackets, e.g. [EA-P3-W2-T6], and gives the
conclusions in a few lines: PR link, real test+typecheck numbers, deviations, open
questions. Long detail (review findings and how each was handled, full evidence) goes in
ONE markdown file attached to that same report; attach at most 1–2 files.
Do NOT send the same content twice through two channels, and do not split a report into
numbered parts. Need the orchestrator to act now → signal needs-input; a plain progress
note is FYI only and usually unnecessary.
Nothing you print locally reaches the orchestrator — an unsent report means a dead task.
If the report command fails, use <FALLBACK CHANNEL> (also substituted by the orchestrator)
and say in the note that the primary channel failed.
```

## 2. Task-specific part (normal implementation task)

```
REQUIREMENT: <what to build, referencing spec sections>.
ACCEPTANCE (measurable): <exact commands and expected outcomes; named test cases>.
COORDINATION: <tasks running in parallel, which files are theirs, merge order,
"whoever merges second rebases">.
```

## 3. Contract task (W0 variant)

```
Implement spec §<contract section> EXACTLY: <schemas/types/enums> in <validation package
only>. Stubs return DETERMINISTIC mock data (respect cursor/limit so paging is testable)
so dependents can start before the real backend lands.
ACCEPTANCE: typecheck passes AND the schema REJECTS each of: <explicit list of invalid
inputs — e.g. over-limit collections, duplicate keys, a sort key not in the request>.
Declare constants BEFORE the schemas that use them (module-scope TDZ throws otherwise).
Downstream consumers import the real constants — a mirrored constant with a comment is a
time-bomb, not an option.
```

## 4. Integration test task (end of phase)

```
Extend the fixture (ADDITIVELY — every number the previous fixtures asserted must stay
true) and assert HAND-COMPUTED numbers through the real service entry points — no
snapshots. Cover: <the phase's semantic guarantees, overlap/dedup cases, boundary cases
like timezone edges — use a separate fixture project id when a case would disturb the
shared fixture's numbers; assert invariants rather than machine-dependent constants>.
Tests must clean up after themselves.
PROVE THE TESTS ARE NOT HOLLOW. When everything passes on the first run, that is not yet
evidence — a test that asserts nothing passes too. Before reporting, INJECT the exact
mistake the spec warns about (the "tempting wrong way" named in its Decisions), confirm
the specific new tests go red, then `git checkout --` the injection. Report which tests
died and which survived. An all-green integration report without this step is the least
trustworthy kind.

YOU MAY NOT TOUCH PRODUCT CODE (the injection above is reverted, never committed). If
your numbers expose a product bug: STOP, push your branch (red tests included) WITHOUT
opening a PR, and report the numbers. The fix goes
to the ORIGINAL AUTHOR as a separate task whose acceptance is exactly your red tests
turning green WITH ZERO ASSERTION EDITS; you then rebase and open your green PR.
The one exception: you may raise the hookTimeout of your own test file.
```

## 5. Visual / E2E verify task (end of phase)

```
Run the real app, compare against the design render for EVERY listed state
(<state list>), attach before/after screenshots with file paths (tool per the BROWSER rule /
the repo's browser-tools doc; asset-only work is headless), and verify persistence
end-to-end (change settings, reload, everything must survive).
Fix mismatches ONLY inside <feature directory>; mismatches rooted in shared components
are RECORDED, not fixed. Do NOT "fix" the items on this list of APPROVED DIVERGENCES:
<decisions where implementation deliberately differs from the design>.
Known suspects to check first: <self-reported gaps from earlier tasks>.
Dev servers: record PIDs, kill by PID, confirm ports free. If ports are already taken by
someone else's process, use alternate ports — never kill what you didn't start.
If nothing needs fixing, report only — do not open an empty PR.
```

## 6. Spec-only task variant

Replace the Superpowers flow with: use `superpowers:brainstorming`; you cannot ask the
user questions — record every forced choice as an Assumption with alternatives and why it
won; open a PR containing ONLY the spec; STOP. No `writing-plans`, no code until approval.

## 7. Docs task variant

No TDD. All numbers re-measured TODAY with real output; every quoted SQL produced by
actually running the builder (temp test file, deleted, not committed); every function
name grep-verified before citation. This discipline has caught production bugs twice —
that is why hand-copying is banned.

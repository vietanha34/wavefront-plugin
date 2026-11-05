# Battle-tested rules and the spec structure

Distilled from a 3-phase, 50-PR project. Read when writing specs, prompts, or reviewing.

## Spec document structure (one file per phase)

```
0. Sources & reading scope — which files/pages, which parts, and the DO-NOT-READ list
   of confusable siblings.
1. Goal.
2. Current state — findings table over the existing code (R1..Rn, severity each).
3. Decisions — each: what was chosen, rejected alternatives + why, known ceiling +
   upgrade path. User-confirmed items marked "do not reopen".
4. Contract — full interface, marked BINDING. A task that can't use it STOPS AND
   REPORTS; it never edits the contract.
5. Technical detail per use case (SQL/logic).
6. Tasks — per-wave table [ID | priority | scope | CLOSED file list | MODEL TIER] + run
   diagram (parallel/sequential) + merge order + conflict notes. The tier column is
   proposed by the spec author and confirmed by the orchestrator at the spec gate
   (the orchestrator adapter's model-tier section).
7. Per-task prompts (templates.md), each carrying the verbatim excerpt of the binding
   spec sections that task needs (templates.md §1 SPEC EXCERPT).
8. Assumptions (each with alternatives) + Questions for the user. Once a question is
   answered, convert it to a Decision and DELETE the question section.
9. Invariants ledger I1..In — every semantic rule with the test that pins it. Later
   phases APPEND; they never rewrite earlier entries.
```

## The 19 rules (each one was paid for)

1. **Contract is binding.** Changing it is its own task; never folded into another task.
   Tighten-the-contract fixes go in a small pre-wave task so every parallel worker
   starts from the corrected interface.
2. **Spec-only tasks list Assumptions with alternatives and write no code** until the
   user approves. Approval converts questions into decisions.
3. **Two semantic contexts that differ ON PURPOSE are recorded as an invariant, and
   "unifying" them is forbidden.** The rule is the discipline, not any one case: whenever
   the same input legitimately means two different things in two places, that difference
   goes in the invariants ledger with the test that pins it, and no later task may
   harmonise it. Unifying such a pair either reintroduces a fixed bug or silently changes
   every number downstream.
   *(The concrete cases that taught this are product knowledge — they belong in that
   product's `invariants.md`, not here. See the host framework's RULES §D.)*
4. **"Wrong but plausible" beats "obviously broken" as a failure — so prefer an honest
   disabled state over plotting/showing a number that only matches sometimes.** A metric
   correct only without breakdowns, or a chart diverging from the table, is worse than
   "not available".
5. **Shape tests don't replace execution.** Asserting the SQL string proves nothing the
   server would reject (`Unknown identifier` lives past every string assert). Every new
   query path gets at least one test that actually runs against the real store.
6. **Assertions hardcoding environment-dependent values (datetimes, timezones, paths)
   are tests that HIDE bugs** — green on CI (UTC), red on a dev machine. Compare against
   the same helper the builder uses, and add one invariant-style test that fails
   everywhere (e.g. "single-period result == periods[0] of the same input").
7. **Behavior-preserving refactor = pins first.** Byte-identical / snapshot tests of the
   old behavior are written AND COMMITTED before the change. "No periods sent → SQL
   byte-identical" style guards carried three phases safely.
8. **A mirrored constant between contract and UI is a delayed bug.** Import the real
   constant; the "can't import under this test config" excuse must be disproven by
   experiment before it's accepted.
9. **One finding usually hides siblings in the same function.** Before patching, build
   the input matrix (all key shapes × operators × scopes) — a single reported wildcard
   bug turned out to be three independent bugs plus a fourth found later; each round
   fixed at the shared choke point, with a grammar comment so the class dies.
10. **Docs are written by executing, not remembering** — run the builders for every
    quoted SQL, re-measure every number the day of writing, grep every cited symbol.
    This discipline alone caught two production bugs.
11. **A worker that reports its own mistakes is the healthy signal; an all-green report
    with no findings deserves suspicion.** Reviewers verify independently: rerun tests,
    read full logs (summary wrappers have hidden a failed file), diff against the
    contract, and use three-dot diffs when judging a merge (two-dot lies).
12. **Orchestrator↔worker message races are real.** Important decisions get re-sent as a
    summary; workers confirm receipt; garbled passages are reported verbatim, never
    guessed around.
13. **When one query serves several variants, ONE of them is the baseline and it owns
    row identity.** Row set, ordering and pagination follow the baseline alone; the other
    variants are computed over that fixed row set; series are matched by NAME, never by
    index. Turning an extra variant on must not change the baseline's own numbers, and
    that gets a pin.
    *(The exact baseline semantics of a given report are product knowledge: record them
    in that epic's `invariants.md`, not here. See the host framework's RULES §D.)*
14. **Dates are computed with date APIs (`Date.setDate`), never arithmetic on strings**
    — `"15" - 21 = -6 Sep` class of bug. Make it an invariant with a helper + tests.
15. **Placeholder comments in a shared file don't protect the import block.** Three
    parallel tasks each consumed their own JSX placeholder cleanly and ALL collided in
    the imports at the top. Give the file an import zone too: one `// imports:<task>`
    marker line per task, or pre-declare the imports in the wave-0 skeleton; resolution
    is always "keep both sides".
16. **A merge takes the branch head AT MERGE TIME, not the head you verified.**
    A worker pushing between your verify and your merge gets its commit absorbed
    silently. Re-read the PR head SHA immediately before merging and compare with the
    verified SHA (pin it if the VCS host's merge command allows); if the owner is still
    active, tell it to stand down first.

17. **A green run at full scope proves nothing about a race.** Two processes each
    running 71 files sequentially rarely sit inside the same 3 contended files at the
    same moment, so the race simply does not fire — and four green runs get read as
    "no contention". To test isolation, run ONLY the contended files concurrently:
    that forces the overlap. Confirm the harness first by reproducing the failure
    WITHOUT the fix, then show the same command passing WITH it.
18. **Separate two red signals that look alike under parallel load.** Wrong NUMBERS
    that are exact multiples of the expected value (15 instead of 5) mean shared state.
    A HOOK/TEST TIMEOUT with correct numbers elsewhere means CPU starvation — two
    processes times N threads on an 8-core box. The first is a bug to fix; the second
    is the machine, and chasing it wastes a day.

19. **Token cost is calls × context, not the size of the work.** Every API call re-reads
    the whole session context, so a session twice as long costs about four times as much.
    I18N-P1 (26 sessions, 25 PRs) cost ~$425 at list price; 62 % of that was cache reads.
    Worker context sat at a 200–475k median. It did not grow from a few huge outputs: Bash
    output is already capped near 35k chars. It grew from hundreds of moderate reads —
    rg, sed, spec greps and test logs. The levers are therefore:
    - shorter sessions (SKILL.md B5 sizing);
    - narrow reads (templates.md §1 CONTEXT HYGIENE, SPEC EXCERPT);
    - a lean orchestrator (the orchestrator adapter's context-budget section).

    Images were only ~4 % of context growth, so don't optimise screenshots first. A
    cheaper model doesn't fix a long session either: Sonnet 5.5 and Opus 5.5 both bill
    cache reads at $0.20/MTok.

## Gate checklists

**Pre-spawn check (orchestrator, before EVERY parallel spawn — including ad-hoc tasks the
user pulls mid-day, not only planned waves):** (1) run the wave planner (`${CLAUDE_PLUGIN_ROOT}/scripts/wave-plan.mjs`)
on the tasks' closed file lists plus the project's contract/shared surfaces, from inside the
repo — file overlap or a shared-surface hit means serialize; (2) check BEHAVIOURAL overlap the
file lists cannot show: a shared callee/builder either task changes, or the same acceptance
number both tasks must hold. Any hit → fix the merge order up front, give each task every
acceptance label it touches, and require the later task to rebase and re-measure those
numbers on a base that already contains the earlier one. Record the verdict (even "no
overlap") in the spawn note — an unrecorded check is indistinguishable from a skipped one.

**Wave gate (orchestrator, per PR):** PR exists, right base, closed file list respected,
no formatter churn, tests rerun by the reviewer (not trusted from the report), diff vs
contract exact, acceptance line-by-line, worker's self-review findings resolved or
justified. Merge in recorded order; later PRs rebase; after all merges run the
integration suite on the base itself — per-PR green does not prove combined green.
The gate's test selection must be at least CI's: a closed file list misses sibling tests
in other packages. Add the module-graph run (e.g. `vitest run --changed <base>`), and when
a task changes a threshold, constant or formula, grep the OLD name and the OLD literal
value across every test file, not only the listed ones.

**Phase gate:** integration numbers task green + visual verify done + docs updated +
invariants appended + a written summary to the user: task → PR → result → open items.

#!/usr/bin/env bash
# Compact PR gate for the orchestrator. Run from a clean review worktree.
# Usage: gate.sh <pr> <allowed-files.txt> [-- "<check cmd>" ...]
#   allowed-files.txt: the task's closed file list, one exact path per line.
#   each check runs via bash -c; its full log stays in /tmp/gate-<pr>/.
# Prints ~10 lines. Exit 0 only when scope is clean and every check passes.
# GATE_BASE=<ref> overrides the scope-diff base (e.g. re-gating an already merged PR).
set -uo pipefail
[ $# -ge 2 ] || { echo "usage: gate.sh <pr> <allowed-files.txt> [-- cmd ...]" >&2; exit 2; }
pr=$1 allow=$2
shift 2
[ "${1-}" = "--" ] && shift
dir=/tmp/gate-$pr
rm -rf "$dir" && mkdir -p "$dir"

read -r head base mergeable < <(gh pr view "$pr" --json headRefOid,baseRefName,mergeable \
  -q '"\(.headRefOid) \(.baseRefName) \(.mergeable)"') || { echo "gh pr view $pr failed" >&2; exit 2; }
git fetch -q origin "$base" "pull/$pr/head" && git checkout -q --detach "$head" \
  || { echo "checkout $head failed" >&2; exit 2; }
echo "PR #$pr head=${head:0:8} base=$base mergeable=$mergeable"

ok=1
# three-dot: only what the PR itself changes (two-dot lies once the base moved)
git diff --name-only "${GATE_BASE:-origin/$base}...$head" > "$dir/files.txt"
outside=$(grep -vxF -f "$allow" "$dir/files.txt")
if [ -n "$outside" ]; then
  ok=0
  echo "SCOPE FAIL: $(wc -l < "$dir/files.txt" | tr -d ' ') files, outside list:"
  echo "$outside" | head -20 | sed 's/^/  /'
else
  echo "SCOPE ok: $(wc -l < "$dir/files.txt" | tr -d ' ') files, all in list"
fi

i=0
for cmd in "$@"; do
  i=$((i + 1))
  log="$dir/check-$i.log"
  bash -c "$cmd" > "$log" 2>&1
  rc=$?
  if [ $rc -eq 0 ]; then echo "PASS $cmd"; else ok=0; echo "FAIL(exit $rc) $cmd  log=$log"; fi
  # vitest summary lines (a green Tests line can hide a failed file) + lint/tsc counts
  grep -E '^ *(Test Files|Tests) |Found [0-9]+ error' "$log" | tail -3 | sed 's/^ */  /'
  [ $rc -ne 0 ] && grep -E 'FAIL|Error|error' "$log" | head -15 | sed 's/^/  | /'
done

if [ $ok -eq 1 ]; then echo "GATE PASS head=$head"; else echo "GATE FAIL head=$head"; fi
[ $ok -eq 1 ]

#!/usr/bin/env bash
# PreToolUse guard cho mcp__chrome-devtools__*: agent-browser la cong cu browser mac dinh.
#
# Cho qua khi:
#   - tool la Lighthouse / performance / heap snapshot  (chrome-devtools lam tot nhat)
#   - agent-browser khong co tren may                   (khong co gi de uu tien)
#   - phien NAY da mo khoa va khoa con hieu luc         (fallback khi agent-browser khong launch duoc)
# Nguoc lai: DENY kem ly do neu ro lenh thay the.
#
# Mo khoa la THEO PHIEN, khong toan cuc: plugin nay ton tai de chay nhieu worker song song,
# nen mot file khoa dung chung se tat guard cho MOI worker, va con treo lai neu worker chet
# truoc khi don. Khoa cung co TTL de file mo coi tu het hieu luc.
#
# Huong loi: FAIL-OPEN. Guard khong bao gio lam hong mot luot goi tool.

TTL_MIN=30
UNLOCK_DIR="${TMPDIR:-/tmp}/wavefront-unlock"

payload=$(cat)

# Guard chi co hieu luc trong repo DUNG wavefront. Repo khac: im lang, exit 0.
# Plugin cai o scope user nen hook nay chay o moi project; khong co pham vi thi no
# se chan browser tool cua nhung project chang lien quan gi den wavefront.
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
. "$HERE/wf-find-config.sh" 2>/dev/null || exit 0
wf_find_config >/dev/null 2>&1 || exit 0

# jq la phu thuoc cung. Thieu thi noi ro mot lan roi cho qua, thay vi that bai am tham.
if ! command -v jq >/dev/null 2>&1; then
  printf 'wavefront: thieu `jq` nen khong kiem duoc thu bac cong cu browser — cho qua.\n' >&2
  exit 0
fi

tool=$(printf '%s' "$payload" | jq -r '.tool_name // ""')
sid=$(printf '%s' "$payload" | jq -r '.session_id // ""')
[ -n "$sid" ] || sid="${AO_SESSION_ID:-${USER:-shared}}"

# chrome-devtools lam tot nhat may viec nay -> luon cho qua
case "$tool" in
  *__lighthouse_audit|*__performance_*|*__take_heapsnapshot) exit 0 ;;
esac

# phien nay da mo khoa va khoa con han?
unlock="$UNLOCK_DIR/$sid"
if [ -e "$unlock" ]; then
  if [ -n "$(find "$unlock" -mmin "-$TTL_MIN" 2>/dev/null)" ]; then
    exit 0
  fi
  rm -f "$unlock" 2>/dev/null || true   # het han thi don, lan sau chan lai
fi

# khong co agent-browser thi khong co gi de uu tien
command -v agent-browser >/dev/null 2>&1 || [ -x "$HOME/.local/bin/agent-browser" ] || exit 0

jq -n --arg t "$tool" --arg u "$unlock" '{
  hookSpecificOutput: {
    hookEventName: "PreToolUse",
    permissionDecision: "deny",
    permissionDecisionReason: (
      "\($t) bi chan: dung agent-browser (headless mac dinh, KHONG --headed cho viec chi sinh asset):\n" +
      "  agent-browser --session ${AO_SESSION_ID:-$USER} ...   roi   ... close\n" +
      "chrome-devtools MCP chi danh cho Lighthouse/performance, hoac lam fallback khi agent-browser\n" +
      "khong launch duoc. Khi can fallback: `mkdir -p \($u | rtrimstr("/" + ($u | split("/") | last)))` roi\n" +
      "`touch \($u)` — khoa chi hieu luc cho PHIEN NAY va tu het sau 30 phut. Bao viec dung fallback\n" +
      "nhu mot deviation trong report, va `rm \($u)` khi xong."
    )
  }
}'

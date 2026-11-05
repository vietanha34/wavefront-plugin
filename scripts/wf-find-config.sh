# wf_find_config — in duong dan .wavefront/config.yaml cua du an hien tai, hoac fail (1).
#
# SSOT cua cau hoi "repo nay co dung wavefront khong". wf-context.sh va cac hook deu goi
# day, de khong hook nao tu quyet dinh pham vi cua minh.
#
# Chi chua ham: KHONG set shell option, nguoi goi tu chon `set -u` hay khong.
wf_find_config() {
  local d p i
  for d in "${CLAUDE_PROJECT_DIR:-}" "$PWD"; do
    [ -n "$d" ] || continue
    p="$d"; i=0
    while [ "$i" -lt 6 ] && [ -n "$p" ] && [ "$p" != "/" ]; do
      if [ -f "$p/.wavefront/config.yaml" ]; then printf '%s\n' "$p/.wavefront/config.yaml"; return 0; fi
      p="$(dirname "$p")"; i=$((i+1))
    done
  done
  return 1
}

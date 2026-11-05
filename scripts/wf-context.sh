#!/usr/bin/env bash
# wf-context — chay o SessionStart. Neu cwd (hoac cha cua no) co .wavefront/config.yaml
# thi in ra mot chi thi NGAN de moi phien trong repo nay tu biet dung wavefront.
#
# Day la lop TAT DINH cua viec "nhan dien": khong dua vao description cua skill, khong
# dua vao viec nguoi nho dan prompt moi.
#
# Luat cua script nay:
#   - KHONG CO config  -> im lang hoan toan, exit 0. Phien o repo khac khong ton gi.
#   - CO config        -> in <= 20 dong. Moi phien deu tra context nay, nen phai ngan.
#   - LOI bat ky       -> exit 0. Khong bao gio lam hong mot phien.
set -uo pipefail

die_quiet() { exit 0; }
trap die_quiet ERR

# 1. Tim config: tu CLAUDE_PROJECT_DIR, roi nguoc len tu cwd (toi da 6 tang)
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
. "$HERE/wf-find-config.sh"
PLUGIN_ROOT="${CLAUDE_PLUGIN_ROOT:-$(dirname "$HERE")}"

CFG="$(wf_find_config)" || exit 0
[ -r "$CFG" ] || exit 0

# 2. Doc vai truong. Parse toi thieu, khong phu thuoc thu vien yaml.
#    Chi lay khoa o muc 2 dau tien khop — du cho muc dich hien chi thi.
# Lay gia tri cua khoa: bo comment cuoi dong, bo nhay, bo khoang trang hai dau.
strip() { sed -e 's/[[:space:]]*#.*$//' -e 's/^[[:space:]]*//' -e 's/[[:space:]]*$//' -e 's/^"\(.*\)"$/\1/' -e "s/^'\(.*\)'\$/\1/"; }
get() { sed -n "s/^[[:space:]]*$1:[[:space:]]*\(.*\)\$/\1/p" "$CFG" | head -1 | strip; }

NAME="$(get name)"
CODE="$(get code)"
TRACKER="$(get adapter)"      # adapter dau tien trong file la cua tracker
ORCH="$(sed -n '/^orchestrator:/,/^[^[:space:]]/p' "$CFG" | sed -n 's/^[[:space:]]*adapter:[[:space:]]*\(.*\)$/\1/p' | head -1 | strip)"
GATE="$(get gate_script)"
# Bo trong (hoac con placeholder cua template) -> dung ban di kem plugin. In duong dan
# da resolve: AO khong expand CLAUDE_PLUGIN_ROOT, nen gia tri in ra phai chay duoc nhu-la.
case "$GATE" in ""|null|"<"*) GATE="$PLUGIN_ROOT/scripts/gate.sh" ;; esac
INTEG="$(get integration)"
FIXP="$(get fix_policy)"
LANG="$(get language)"

[ -n "$NAME$CODE" ] || exit 0

# 3. In chi thi. Ngan, khong giai thich — chi noi phai lam gi va tim luat o dau.
cat <<EOF
[wavefront] Repo nay dung quy trinh wavefront. Config: ${CFG}
Du an: ${NAME:-?} (${CODE:-?}) · tracker: ${TRACKER:-?} · orchestrator: ${ORCH:-?} · ngon ngu tai lieu: ${LANG:-?}

LUAT BAT BUOC trong repo nay:
- Nhan mot work item tu tracker de THUC THI -> chay skill \`wavefront:epic-taskization\`
  tren tai lieu cua item do. Khong tu chia viec bang phan doan.
- Tao issue/spec moi -> \`/wavefront:add\`. KHONG tu chuyen item sang trang thai "todo":
  do la cong cua NGUOI va la cong duy nhat.
- Quyen chuyen trang thai, dat ten, nhan: docs/NAMING.md + adapters/tracker-${TRACKER:-file}.md
- Gate: chay \`${GATE}\`, khong chay test truc tiep
  trong phien dieu phoi. Sau khi merge het wave: chay \`${INTEG:-<chua khai verify.integration>}\`
  TREN BASE.
- Sua loi: fix_policy = ${FIXP:-same-pr}. Bug do task \`int\` tim ra thi acceptance la
  test do chuyen xanh, 0 sua assertion, giao ve tac gia goc.

Doc tracker qua ADAPTER, khong hard-code ten tracker vao suy luan: moi adapter tra ve
cung mot work-item envelope (schemas/work-item.schema.json).
EOF
exit 0

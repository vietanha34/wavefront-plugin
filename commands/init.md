---
description: Dựng nền một dự án — cấu hình, cây tài liệu, registry epic, backlog gốc và đối chiếu hiện trạng
argument-hint: "[greenfield|contracted|existing-repo]"
---

# /wavefront:init

Chế độ: `$ARGUMENTS` (trống thì hỏi).

Chạy **một lần** cho mỗi software. Đã có `.wavefront/config.yaml` thì không chạy lại —
báo cho người và gợi ý `/wavefront:audit` nếu họ muốn soát lại.

## Hỏi trước, một lượt

Dùng AskUserQuestion nếu có, hỏi gọn trong một lần:

1. **Chế độ** — `greenfield` (sản phẩm mới) · `contracted` (phạm vi đã khoá bằng hợp đồng) ·
   `existing-repo` (repo đang chạy dở)
2. **Tracker** — adapter nào, workspace/team/board, prefix issue
3. **Storage** — tài liệu đi vào từ đâu, bản chốt đi ra đâu. Chọn `gdrive` thì hỏi thêm
   `folder_id` của thư mục gốc dự án trên Drive (và `drive_id` nếu là Shared Drive) —
   `search_files` không đệ quy nên tìm theo tên mỗi lần là tốn vô ích
4. **Branch topology** — main, branch tích hợp (thường `dev`, không phải main), tiền tố
   feature branch. Hỏi rõ, đừng suy ra. Ghi thành DECISION.
5. **Lệnh kiểm** — typecheck, unit, integration; datastore thật nếu có

Không có người để hỏi (phiên chạy theo lịch): lấy cách đọc hợp lý nhất, ghi rõ ở đầu kết quả
cách đọc đã chọn, và chạy tiếp.

## Các bước theo chế độ

| | Bước | greenfield | contracted | existing |
|---|---|:---:|:---:|:---:|
| D1 | Thu nguồn → lưu **verbatim** vào `sources/` kèm URL, ngày, sha256 — `doc-tree` | ✓ | ✓ | ✓ |
| D2 | Trích R1…Rn, **mỗi dòng gắn nguồn** — `requirements` | ✓ | ✓ | ✓ |
| D3 | Mơ hồ → câu hỏi → DECISION / ASSUMPTION ⏸ — `clarify` | ✓ | ✓ | ✓ |
| D4 | Khám phá vấn đề — *mượn* `ideate` | ✓ | — | — |
| D5 | Công kích giả định — *mượn* `challenge`, `premortem` | ✓ | ✓ | ✓ |
| D6 | Soát code → findings + severity — *mượn* `survey` | — | tuỳ | ✓ |
| D7 | Feature matrix, **shared surface**, `surfaces` trong config — `surfaces` | ✓ | ✓ | ✓ |
| D8 | Tách epic + non-goals, khai registry — `surfaces` | ✓ | ✓ | ✓ |
| D9 | Tiêu chí nghiệm thu có số — `acceptance` | sinh | **trích** | sinh |
| D10 | Ghi `config.yaml` ⏸ | ✓ | ✓ | ✓ |
| D11 | Đối chiếu hiện trạng — `reconcile` | — | tuỳ | ✓ |

Năm bước mượn (`ideate` `challenge` `premortem` `survey` `metrics`) khai ở
`discovery.borrow`. Skill nào vắng mặt thì chạy phần tương ứng trong
`skills/surfaces/references/borrow-fallback.md` và ghi **một dòng** rằng bước đó chạy ở chế
độ rút gọn. **Không fail.**

### D9 ở chế độ `contracted` — luật cứng

`acceptance_source: contract` nghĩa là **trích, không sinh**. Các con số nghiệm thu là điều
khoản hợp đồng. Một con số tự nghĩ ra là hỏng nghiệm thu.

Không tìm thấy con số trong tài liệu nguồn → tạo issue `gate/blocked-partner` để hỏi đối tác,
**không điền số phỏng đoán**.

### D11 — tại sao bắt buộc với repo đang chạy

Nếu đã có code viết trước khi có quy trình, backlog dựng mới sẽ nói dối: nó mô tả việc cần
làm, trong khi việc đó đã xong. Skill `reconcile` tạo task `P1` mô tả **hiện trạng đã có**,
chuyển thẳng `In Review` để orchestrator chứng minh đạt tiêu chí, rồi mới bật vòng quét
bình thường.

## Dựng cây

Chép từ `${CLAUDE_PLUGIN_ROOT}/templates/`, **không** gõ lại nội dung:

| Nguồn | Đích |
|---|---|
| `config.yaml` | `.wavefront/config.yaml` — điền theo câu trả lời ở trên |
| `MANIFEST.yaml` | `<doc_root>/MANIFEST.yaml` |
| `traceability.csv` | `.wavefront/ledger/traceability.csv` — chỉ có header |
| `epic.md` | `.wavefront/epics/<CODE>/epic.md` — một bản mỗi epic trong registry |
| `invariants.md` | `.wavefront/epics/<CODE>/P1/invariants.md` — APPEND-ONLY |
| `decisions.md` | `.wavefront/epics/<CODE>/P1/decisions.md` — APPEND-ONLY |
| `browser-tools.md` | `<doc_root>/browser-tools.md` — điền ngày hiệu lực |

Còn lại: tám thư mục tài liệu cấp một theo `docs/DOC-TREE.md §1`, và trên tracker thì team,
board, milestone, bộ nhãn theo `docs/NAMING.md §5`.

`browser-tools.md` là tài liệu mà mọi spec **trỏ** tới chứ không chép lại, và hook
`PreToolUse` cưỡng chế đúng thứ bậc trong đó — thiếu nó thì worker bị chặn mà không biết
tra ở đâu.

## Kết thúc

Nói gọn: chế độ nào, bao nhiêu epic đã khai, bao nhiêu requirement, còn câu hỏi nào treo, và
bước tiếp theo là `/wavefront:add` cho yêu cầu đầu tiên.

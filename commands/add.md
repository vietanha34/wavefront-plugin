---
description: Biến một yêu cầu thô thành issue có spec đủ để agent làm, dừng ở Backlog chờ người duyệt
argument-hint: "<mô tả yêu cầu, hoặc link/đường dẫn tài liệu>"
---

# /wavefront:add

Yêu cầu: `$ARGUMENTS`

Nhiệm vụ của command này là đi từ yêu cầu thô tới **một issue ở `Backlog` có spec tự đủ**.
Nó **dừng ở đó**. Việc kéo sang `Todo` là của người, và việc chia sub-task là của
orchestrator lúc thực thi — không làm ở đây.

Đọc `.wavefront/config.yaml` trước. Không có file này thì nói rõ cần chạy
`/wavefront:init` trước, và dừng.

## Các bước

### ① Phân loại — skill `classify`

Xác định đúng một loại: epic mới · phase mới · `ADD` · `FIX` · `DEBT` · `DEC`.
Loại quyết định toàn bộ phần sau, nên nếu không chắc thì hỏi người, đừng đoán.

### ② Định vị

Epic nào (theo registry trong config), milestone nào, base branch nào.
Mã epic **không có trong registry thì không được dùng** — hỏi người để thêm vào config trước.

### ③ Làm rõ — skill `clarify` ⏸

Mơ hồ thành câu hỏi, không thành phỏng đoán. Trả lời được thì ghi thành DECISION vào
`.wavefront/epics/<CODE>/P<n>/decisions.md` (append-only).

Không trả lời được trong phiên: tạo issue `gate/needs-human` hoặc `gate/blocked-partner`
rồi **dừng**. Đừng viết spec trên một câu hỏi chưa có đáp án.

Có tính toán thì bắt buộc duyệt qua checklist điểm biên của skill `clarify`.

### ④ Viết spec — skill `task-spec`

Theo `templates/task-spec.md`, 8 mục, mục BB không được thiếu.
Spec **tự đủ**: không tham chiếu sang epic hay tài liệu khác. Công thức chép đủ vào.

### ⑤ Kernel kiểm — chặn cứng ⛔

```
node ${CLAUDE_PLUGIN_ROOT}/scripts/spec-lint.mjs <file spec>
node ${CLAUDE_PLUGIN_ROOT}/scripts/name-check.mjs --issues <json> --config .wavefront/config.yaml
```

Có ERROR thì **không tạo issue**. Sửa rồi chạy lại. Đây là cổng máy, không thương lượng.

### ⑥ Tạo issue

Qua adapter tracker trong config. Nhãn theo `docs/NAMING.md §5`:

* `level/task` · **đúng một** `gate/*` · **đúng một** `type/*` · ≥ 1 `area/*` · milestone
* thêm nhãn nhóm `acceptance` (ví dụ `ctkt/*`) nếu issue nối tới một điều khoản nghiệm thu

State = `Backlog`. **Không bao giờ** tự đặt `Todo`.

Adapter tracker không dùng được (connector không bật, lỗi mạng): ghi ra
`.wavefront/outbox/` theo adapter `file`, báo một dòng cho người, **không fail**.

### ⑦ Cập nhật truy vết

Thêm dòng vào `.wavefront/ledger/traceability.csv`:
`requirement, issue, acceptance_label, pr, test`.

## Định tuyến theo loại

| Loại | Sinh ra | Ghi chú |
|---|---|---|
| epic mới | `epic.md` + `P1/spec.md` | goal một câu, non-goals tường minh, base branch riêng |
| phase mới | `P<n+1>/spec.md` | **người duyệt spec** trước khi mở task nào |
| `ADD` | một task | không đổi interface; đổi thì thành `P<n>` kèm W0 |
| `FIX` | một task | xem bên dưới |
| `DEBT` | task con epic Tech Debt | bắt buộc có file/commit, hậu quả, ước lượng công |
| `DEC` `RISK` | issue `gate/needs-human` | không có spec, không có wave |

### `fix_policy: same-pr` — mặc định

Bug báo từ ngoài (đối tác, người dùng, quan sát trên production) **không cần test đỏ viết
trước**. Tạo một task `FIX`, worker vừa viết test tái hiện vừa sửa trong cùng một PR.

Một phân biệt phải giữ: **bug do task `int` tìm ra thì luật cũ vẫn nguyên** — acceptance là
chính các test đỏ đó chuyển xanh, **không sửa một assertion nào**, và việc sửa giao về *tác
giả gốc*. Đó là luật của `epic-taskization`, không bị quyết định này ghi đè.

Lý do tách hai đường: test đỏ do `int` viết là bằng chứng độc lập đã tồn tại, nên giữ được
tính độc lập giữa người viết test và người sửa. Bug báo từ ngoài thì chưa có bằng chứng nào,
nên bắt viết trước chỉ thêm một vòng mà không thêm sự độc lập.

## Kết thúc

Báo gọn: loại gì, issue nào, còn câu hỏi nào treo. Nhắc người kéo sang `Todo` khi thấy spec
đã đủ — và nói rõ rằng kéo sang `Todo` nghĩa là xác nhận AO làm được mà không cần hỏi.

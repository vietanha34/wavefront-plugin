# Adapter · tracker · file

Hiện thực port `tracker` bằng file markdown trong repo. **Đây là adapter mặc định** và là
đường degrade khi adapter thật không dùng được.

Dùng khi: chưa chọn tracker · connector không bật · chạy offline · chạy trong CI · đang viết
eval.

## Cờ năng lực

```yaml
capabilities:
  nesting_depth: 3
  native_issue_types: true    # tầng ghi thẳng trong front-matter, không cần quy ước nhãn
  auto_close_on_pr_merge: false
  labels_or_fields: labels
  states: [backlog, todo, in_progress, review, done, canceled]
tier_map:
  phase: work-item
  task:  work-item            # phân cấp bằng `parent`, không bằng loại
```

`auto_close_on_pr_merge: false` nên **không** áp luật "PR chỉ mang mã con" — ở đây phải tự
ghi `done`.

## Cách lưu

```
.wavefront/outbox/
├── index.md                  ← bảng tổng, sinh lại mỗi lần ghi
└── items/
    └── <id>.md
```

`<id>` = `<CODE>-<số tăng dần>`, số lấy từ `index.md`. Không trùng với mã của tracker thật.

### Một work item

```markdown
---
id: RET-012
title: "Retention · ADD — Chart phân phối user theo nhóm level"
tier: phase                 # phase | task
parent: RET
state: backlog
labels: [gate/agent-ready, type/change-request, area/frontend, ctkt/retention]
milestone: M4
blocked_by: []
pr: []
created: 2026-10-13
---

## Mục tiêu
…
(8 mục theo templates/task-spec.md)
```

## Ánh xạ thao tác

| Port | Hiện thực |
|---|---|
| `query_queue` | đọc `items/*.md`, lọc front-matter, sắp theo ưu tiên |
| `create_work_item` | ghi file mới + cập nhật `index.md` |
| `transition` | sửa `state` trong front-matter |
| `comment` | append vào mục `## Nhật ký` của file |
| `link_pr` | append vào mảng `pr` |
| `read_state` | đọc front-matter |
| `set_labels` | sửa mảng `labels` |

## Luật

* **Một lệnh ghi = một commit được.** File thay đổi hiện trong `git diff`, nên lịch sử
  trạng thái nằm trong git, không cần lịch sử riêng.
* Cổng `backlog → todo` vẫn là **của người** — tự sửa `state: todo` trong file là hành động
  tương đương kéo issue trên board, và agent không được làm.
* `index.md` sinh lại hoàn toàn mỗi lần ghi, đừng sửa tay.

## Chuyển sang tracker thật

Khi chọn tracker thật, chạy một lượt import: đọc `items/*.md`, gọi `create_work_item` của
adapter mới, ghi mã mới trả về vào front-matter dưới khoá `external_id`. Giữ lại file làm
bản ghi, **đừng xoá** — nó là lịch sử giai đoạn chưa có tracker.

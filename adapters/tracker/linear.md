# Adapter · tracker · linear

Hiện thực port `tracker` (xem `docs/PORTS.md §1`) cho Linear.

Luật riêng của từng dự án nằm ở skill khai trong `tracker.rules`, **không** ở đây. File này chỉ nói
Linear làm được gì và ánh xạ ra sao.

## Cờ năng lực

```yaml
capabilities:
  nesting_depth: 3            # đã kiểm chứng 3 tầng; Linear cho sâu hơn
  native_issue_types: false   # Linear KHÔNG có trường type -> cần quy ước nhãn level/*
  auto_close_on_pr_merge: true
  labels_or_fields: labels
  states: [Backlog, Todo, In Progress, In Review, Done, Canceled]
tier_map:
  phase: task                 # PHASE của framework = Linear issue có level/task
  task:  subtask              # TASK của framework = Linear sub-issue có level/subtask
```

### `native_issue_types: false` nghĩa là gì

Linear chỉ có **một** loại thực thể: Issue. Phân cấp hoàn toàn bằng `parentId`. Nhãn
`level/*` là **quy ước của dự án**, Linear không tự hiểu.

Đây là một **cách lách**, không phải thiết kế. Adapter nào có issue type thật (Jira) thì
**bỏ** `level/*`, đừng bê quy ước này sang.

### `auto_close_on_pr_merge: true` kéo theo hai luật bắt buộc

1. **PR chỉ mang mã của sub-task của chính nó.** Tiêu đề PR, tên nhánh và body **không**
   chứa mã task cha hay epic. Linear tự gắn PR vào mọi issue có mã xuất hiện ở đó và tự đóng
   `Done` khi PR merge — để mã cha trong PR là tự đóng cha trước khi người kiểm.
2. **Sau mỗi lần merge, đọc lại state của task cha.** Còn sub-task chưa xong mà task cha
   không ở `In Progress` → đưa về `In Progress` và ghi lý do. Đây là **sửa sai do tự động
   hoá**, không phải một phép chuyển trạng thái thêm.

## Ánh xạ thao tác

| Port | Linear MCP |
|---|---|
| `query_queue` | `list_issues` (team, state, label, parentId) + `get_issue includeRelations` để kiểm blocker |
| `create_work_item` | `save_issue` (parentId cho phân cấp) |
| `transition` | `save_issue` với state đích |
| `comment` | `save_comment` |
| `link_pr` | Linear tự gắn qua mã trong PR; không cần gọi |
| `read_state` | `get_issue` |
| `set_labels` | `save_issue` với mảng label |

## Ánh xạ state

Trùng tên, không cần map. Khai trong `config.yaml → tracker.state_map` để nếu đổi tên state
trên Linear thì sửa một chỗ.

## Ghi theo mẻ

Mỗi **sự kiện** gom toàn bộ lệnh ghi vào **một lượt** gọi song song:

* sau khi spawn một wave → mọi sub-task của nó sang `In Progress`
* sau một vòng gate → mọi PR mới mở sang `In Review`
* sau khi merge → comment hoàn thành + `Done` của từng sub-task, một lượt

Trước khi ghi `Done`, **đọc state một lần**: Linear đã tự đóng sub-task nào có PR mang mã
của nó merge, nên bỏ các lệnh ghi mà tự động hoá đã làm.

**Không bao giờ** ghi Linear giữa hai bước gate của cùng một PR.

## Linear không làm được

* **Không tạo được workflow state mới** qua MCP — phải dùng bộ sẵn có, hoặc người tạo tay
  trên UI trước.
* **Không có trường type** → mọi phân cấp dựa vào nhãn, nên nhãn sai là phân cấp sai.
* **Không có state "blocked"** → bị chặn thì giữ `In Progress` + comment.

## Quan hệ và comment

* **Thứ tự giữa các task là quan hệ `blocks`/`blockedBy` thật**, không phải một câu trong
  mô tả — lượt quét chỉ đọc quan hệ.
* **MCP có thể lặng lẽ bỏ qua** `save_issue(id: B, blockedBy: [A])` (trả OK mà không lưu,
  nhất là khi đã có `relatedTo` tự động). Đặt từ phía kia: `save_issue(id: A, blocks: [B])`,
  rồi luôn đọc lại `get_issue(fields: ["relations"])`.
* **Comment bị thay thế**: sửa comment CŨ thành `[SUPERSEDED → <link comment mới>]` trước khi
  đăng comment mới; không chồng comment thứ ba lên hai comment mâu thuẫn.
* **Sửa mô tả bằng `patch`**: mô tả trả về có thể đã render mention thành thẻ `<issue …>`,
  nên `old_string` chép từ đó không khớp; dùng `replace_range` với neo là chữ thường.

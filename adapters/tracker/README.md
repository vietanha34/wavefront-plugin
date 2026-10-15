# Port `tracker` — adapter

Hợp đồng: `docs/PORTS.md §1`. Envelope: `schemas/work-item.schema.json`.

Adapter **không** trả về dữ liệu thô của tracker. Nó trả về envelope. Skill và orchestrator
chỉ đọc envelope, nên đổi tracker là viết adapter, không sửa skill nào.

## Bảng hỗ trợ

`✓` = đã viết và chạy thật · `◐` = một phần · `○` = chưa viết

| Adapter | Trạng thái | issue type thật | tự đóng khi PR merge | lồng | nhãn / field | Ghi chú |
|---|:---:|:---:|:---:|:---:|---|---|
| **linear** | ✓ | ✗ | **✓** | nhiều tầng | nhãn | cờ đã kiểm chứng trên board thật. Cần quy ước `level/*` |
| **file** | ✓ | ✓ | ✗ | 3 | nhãn | mặc định và đường degrade. Ghi markdown vào `outbox/` |
| **jira** | ○ | **✓** | ✗ | 3 cố định | field mạnh | có type thật → **bỏ** `level/*`. Workflow mỗi công ty một khác nên `state_map` phải ánh xạ, không ép |
| **clickup** | ○ | ✓ | ✗ | 2 + checklist | custom field | có subtask **và** checklist — phải chọn cái nào là tầng `task` |
| **monday** | ○ | ✓ | ✗ | 2 (board/group/item + subitem) | column | mô hình cột, không phải nhãn → `labels_or_fields: custom_fields` |
| **github** | ○ | ✗ | **✓** | 1 + task list | label | chỉ một tầng issue; phân cấp bằng task list nên `nesting_depth: 1` là giới hạn thật |

## Cờ nào mang hành vi

Ba cờ dưới đây **đổi luật**, không chỉ đổi dữ liệu:

| Cờ | `true` | `false` |
|---|---|---|
| `auto_close_on_pr_merge` | PR **chỉ** mang mã item nhỏ nhất; sau mỗi merge **đọc lại** state cha | hai luật trên không áp dụng; orchestrator **tự** đóng item |
| `native_issue_types` | dùng type thật, **bỏ** quy ước `level/*` | phân cấp bằng parent + `level/*` |
| `nesting_depth` | ≥ 3 → ba tầng đủ chỗ | < 3 → phải gộp `phase` và `task`, và nói rõ hệ quả |

Cờ thứ nhất là ví dụ tốt nhất cho vì sao envelope đáng làm: luật "PR chỉ mang mã con" hiện ra
như *luật của Linear*, nhưng thực chất nó là **hệ quả của một cờ**. Jira đặt cờ `false` thì
luật đó biến mất và orchestrator tự đóng item — cùng một orchestrator, không sửa dòng nào.

## `gate: "none"` — adapter phải dịch tường minh

Item không có nhãn cổng nào thì adapter trả `gate: "none"`, **không** trả mảng rỗng.

Lý do thực tế: trên board hiện tại có 18 task thiếu nhãn cổng và chúng **vô hình** với agent,
trong đó bốn task đã ở `Todo` và đứng yên. Để orchestrator suy diễn từ mảng rỗng là mời lại
đúng lớp lỗi đó.

## Viết một adapter mới

1. Bảng cờ năng lực + `tier_map` (PHASE/TASK của framework là gì bên đó)
2. `state_map`: sáu state chuẩn → state thật
3. Ánh xạ bảy thao tác sang tool thật (MCP tool, CLI, hoặc REST)
4. Phần "không làm được gì"

Rồi chạy bộ eval dùng chung của port. Không qua nghĩa là chưa hiện thực đủ.

> Jira, ClickUp, Monday, GitHub **cố ý chưa viết**. Viết adapter khi chưa
> có dự án thật thì chỉ là phỏng đoán, mà vẫn phải bảo trì ngang cái đang chạy. Chúng là bài
> kiểm cho port: port đủ tốt thì viết mất một buổi; phải sửa port mới viết được thì port sai.

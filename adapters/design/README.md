# Port `design` — adapter nơi vẽ

Hợp đồng: `docs/PORTS.md §5`. Chỗ đặt file và luật đặt tên: `docs/DOC-TREE.md §4.2`.

## Ràng buộc không được vượt

**Worker không bao giờ đọc design từ kho gốc.**

Cùng một lý do với spec (`PORTS.md §3.1`): hợp đồng giao việc buộc worker đọc theo file trong
worktree. Thêm hai lý do riêng của design:

* Công cụ vẽ là **của harness**, không phải của repo. Phiên worker do orchestrator spawn
  không chắc có Artifact tool hay connector design, và token design hết hạn theo giờ
  (`adapters/orchestrator/ao-runbook.md`).
* Một task có closed file list. Design mà worker phải fetch thì không nằm trong list nào, nên
  không ai kiểm được nó đã đọc đúng bản nào.

Nên port này có ba chiều:

| Chiều | Việc | Luật |
|---|---|---|
| `create` | Claude vẽ | trong kho gốc (Artifact), người duyệt ở đó |
| `export` | bản đã duyệt vào repo | **bắt buộc**, không phải tuỳ chọn. Có `sha256` để `verify` |
| `publish` | bản chốt ra ngoài cho người không vào repo | đi qua port `docs`, vào `03_Thiet-ke/` |

## Bảng hỗ trợ

`✓` = đã viết · `○` = chưa viết

| Adapter | Trạng thái | create | export | Cần gì | Ghi chú |
|---|:---:|:---:|:---:|---|---|
| **claude-artifact** | ✓ | ✓ | ✓ | Artifact tool + đăng nhập claude.ai | [`claude-artifact.md`](claude-artifact.md). Design type lưu nội dung thành **file đọc được**: `project/*.dc.html` |
| **local** | ✓ | ✗ | — | — | design do người đưa vào `.wavefront/.../design/` bằng tay. Đường degrade, luôn chạy được |
| **figma** | ○ | ✗ | ✓ | connector Figma | chỉ `export` — Claude không vẽ trong Figma. Pin `nodeId`, không pin tên page |
| **claude-design** | ✗ | — | — | — | `claude.ai/design` bản độc lập **đóng cửa 14/12/2026**. Đừng viết adapter mới lên nó |

## Năm thao tác

| Thao tác | Chiều | Ghi chú |
|---|---|---|
| `create` | create | tạo canvas mới trong kho gốc, một đơn vị một canvas |
| `read` | create | liệt kê và đọc artboard hiện có |
| `export` | export | lưu vào repo + `design.yaml` (url, version, `sha256` từng file) |
| `verify` | export | so `sha256` bản repo với bản trong kho gốc → biết design đã đổi sau khi duyệt |
| `publish` | publish | giao bản đã export cho port `docs` |

`verify` là thao tác đáng giá nhất và dễ bỏ nhất: người sửa canvas sau khi spec đã duyệt là
chuyện thường, và không hash thì worker âm thầm build theo bản cũ. Adapter không hash được
thì phải khai rõ ở phần "không làm được gì".

## Viết một adapter mới

1. Bảng hỗ trợ ba chiều + thao tác nào không làm được
2. Cách lấy `sha256` ổn định — hash **file đã export**, đừng hash bản render
3. Ánh xạ "một đơn vị = một canvas": đơn vị là PHASE hay EPIC, và vì sao
4. Phần "không làm được gì" — nhất là: công cụ này có mặt trong phiên worker hay không

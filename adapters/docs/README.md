# Port `docs` — adapter kho tài liệu

Hợp đồng: `docs/PORTS.md §3`. Cây và luật đặt tên: `docs/DOC-TREE.md`.

## Ràng buộc không được vượt

**Spec không bao giờ sống ngoài repo.**

Hợp đồng giao việc buộc worker đọc spec **theo khoảng dòng** và cấm grep cả file. Cơ chế đó
chỉ chạy được khi spec là file trong worktree. Spec trên kho ngoài thì mỗi lần đọc là một
lần fetch cả trang — mất đúng đòn bẩy chi phí lớn nhất (chi phí = lượt gọi × ngữ cảnh).

Nên port này có **hai chiều khác nhau**, không phải một "nơi chứa tài liệu":

| Chiều | Việc | Luật |
|---|---|---|
| `ingest` | tài liệu đối tác đi vào | fetch **một lần**, lưu **verbatim** vào `.wavefront/sources/` kèm url, ngày, `sha256`. Sau đó chỉ đọc bản trong repo |
| `publish` | bản đã chốt đi ra | có `--check` so bản ngoài với bản repo trước khi ghi |

Kho ngoài **không bao giờ** là nơi agent đọc spec vào.

## Bảng hỗ trợ

`✓` = đã viết · `○` = chưa viết

| Adapter | Trạng thái | ingest | publish | Cần gì | Ghi chú |
|---|:---:|:---:|:---:|---|---|
| **local** | ✓ | ✓ | ✓ | — | mặc định. Thư mục trên đĩa, hoặc thư mục Drive đã sync |
| **gdrive** | ○ | ✓ | ✓ | connector Google Drive | export về định dạng mở trước khi hash, nếu không `sha256` đổi mỗi lần Google re-render |
| **confluence** | ○ | ✓ | ✓ | connector Atlassian | trang Confluence có version riêng — ánh xạ sang `MANIFEST.version`, đừng dựng version thứ hai |
| **notion** | ○ | ✓ | ✓ | connector Notion | block model, không phải file → `publish` phải quyết định chia block thế nào |
| **tracker-doc** | ○ | ✗ | ✓ | adapter tracker có `document` | đẩy bản chốt thành document của tracker, để đối tác đọc cùng chỗ với issue |

## Năm thao tác

| Thao tác | Chiều | Ghi chú |
|---|---|---|
| `fetch` | ingest | trả nội dung + `sha256` |
| `snapshot` | ingest | ghi `sources/<ngày>_<tên>/` kèm `meta.yaml` |
| `verify` | ingest | so `sha256` hiện tại với lúc snapshot → biết nguồn đã đổi ngoài tầm kiểm soát |
| `put` | publish | |
| `diff` | publish | so bản ngoài với bản repo |

`verify` là thao tác dễ bị bỏ nhất và cũng là thao tác đáng giá nhất: tài liệu đối tác đổi
mà không ai thông báo là chuyện thường, và nếu không hash thì agent âm thầm làm việc trên bản
cũ. Adapter nào không hash được nội dung (ví dụ một kho chỉ cho đọc qua render) thì phải khai
rõ trong phần "không làm được gì".

## Viết một adapter mới

1. Bảng hỗ trợ hai chiều + thao tác nào không làm được
2. Cách lấy `sha256` ổn định — **chuẩn hoá trước khi hash**, nếu không mọi `verify` đều báo đổi
3. Ánh xạ `MANIFEST.version` sang khái niệm version của kho đó
4. Phần "không làm được gì"

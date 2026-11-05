# Adapter · docs · gdrive

Hiện thực port `docs` (xem `docs/PORTS.md §3`) bằng connector Google Drive first-party của
claude.ai: `mcp__claude_ai_Google_Drive__*`.

Luật cây và đặt tên nằm ở `docs/DOC-TREE.md`, **không** ở đây. File này chỉ nói Drive làm
được gì qua connector này và ánh xạ ra sao.

## Khi nào dùng, khi nào `local` tốt hơn

Dùng `local` khi máy đã sync thư mục Drive — rẻ hơn mọi mặt, `fetch`/`put` thành đọc ghi file.

Chỉ chọn `gdrive` khi: không có sync (CI, máy khác, phiên chạy xa) · tài liệu là **Google Doc
/ Sheet native** nên không có bytes trên đĩa · `MANIFEST.yaml` phải sống trên Drive cho người
ngoài repo đọc.

## Cờ năng lực

```yaml
capabilities:
  content_update: false       # update_file CHỈ sửa metadata — không có đường ghi nội dung
  stable_hash: export-only    # hash bản export, không phải hash file
  checksum_from_api: false    # connector KHÔNG trả md5Checksum
  revision_pinning: false     # metadata không trả revisionId/headRevisionId
  recursive_search: false     # parentId chỉ ra con trực tiếp
  atomic_multi_write: false
  version_token: etag         # = base64(modifiedTime)
```

Đã kiểm chứng 05/11/2026 bằng 2 file test (1 Google Doc convert từ `text/plain`, 1 `.md` giữ
nguyên dạng) trên My Drive, rồi trash.

## Ánh xạ thao tác

| Port | Google Drive MCP |
|---|---|
| `fetch` | `search_files` (`parentId = '<id>' and trashed = false`) → `download_file_content(fileId, exportMimeType)` → sha256 **tự tính** trên bytes trả về |
| `snapshot` | ghi bytes đó vào `.wavefront/sources/<ngày>_<tên>/content.<ext>` + `meta.yaml` (`url` = `viewUrl`, `file_id`, `etag`, `mime_type`, `export_mime_type`, `fetched_at`, `sha256`) |
| `verify` | `download_file_content` lại với **đúng** `export_mime_type` đã ghi → so sha256 với `meta.yaml` |
| `put` | bốn lệnh ghi, thứ tự ở dưới |
| `diff` | so sha256 hiện tại trên Drive với `sha256` trong `MANIFEST.yaml` — **không** so với file repo |

### `put` — bốn lệnh ghi, MANIFEST đi cuối

Không có ghi atomic nhiều file, nên nửa đường là trạng thái thật. Thứ tự này để mỗi lần dừng
giữa đường đều còn đọc được:

1. `create_file` bản **version mới** (`parentId` = thư mục đích, `textContent` hoặc
   `base64Content`, `contentMimeType`, `disableConversionToGoogleType: true`)
2. `update_file(fileId: <bản cũ>, parentId: <id của 99_Luu-tru/<ngày>>, etag: <etag đã đọc>)`
   — **chuyển** bản bị thay thế, không ghi đè, không trash (DOC-TREE §2.2)
3. cập nhật `MANIFEST.yaml` trên Drive: `path`, `version`, `status`, `sha256`, `supersedes`
4. sync `MANIFEST.yaml` về `.wavefront/MANIFEST.yaml` — bản trong repo là **chỉ đọc**, Drive
   là nguồn (DOC-TREE §4)

Ghi đè nội dung một file cũ là việc **không làm được**: `update_file` chỉ nhận metadata
(`title`, `parentId`, `starred`, `readOnly`, `etag`, …). Điều này khớp với luật đặt tên có
version — một bản mới là một file mới, không phải một revision.

## Hash — chỗ duy nhất dễ làm sai

**Không bao giờ hash `read_file_content`.** Tool đó tự khai "text representation sẽ đổi theo
thời gian, đừng giả định format". Dùng nó để đọc cho người, không để hash.

Hash **chỉ** lấy từ `download_file_content`, và `exportMimeType` phải khai tường minh rồi ghi
vào `meta.yaml` — bỏ trống thì connector tự chọn, và lần `verify` sau chọn khác là hash khác
mà nội dung không đổi.

| Loại file | `exportMimeType` | Tính chất |
|---|---|---|
| Google Doc | `text/markdown` | **byte-stable**: hai lần gọi liên tiếp ra bytes trùng khớp |
| Google Sheet | `text/csv` | một sheet một lần gọi |
| `.md` / `.txt` đẩy lên với `disableConversionToGoogleType: true` | bỏ trống | tải về **byte-exact** với bản đẩy lên (`fileSize` khớp độ dài) |
| `.docx` / `.xlsx` / `.pdf` upload | bỏ trống | hash bytes; `md5Checksum` không có để đối chiếu |

**Export không bằng nguồn.** Google Doc export `text/markdown` thêm escape và khoảng trắng
cuối dòng: `# ` → `\# `, `- ` → `\- `, cộng hai space cuối dòng. Nên `diff` của một tài liệu
đã convert **luôn** khác file nguồn trong repo — so Drive-hash hiện tại với Drive-hash trong
MANIFEST, đừng so với repo. Muốn `diff` so được với repo thì đừng convert.

## `etag` — đọc lại sau khi ghi

`etag` = base64 của `modifiedTime`, không phải hash nội dung. Hai hệ quả:

* **Sau `create_file` có convert, metadata còn đổi một nhịp.** Doc test: `modifiedTime`
  `10:06:21.127` → `10:06:23.025`, `fileSize` `1` → `1024`, rồi ổn định. Đừng lưu `etag` từ
  response của `create_file` — gọi `get_file_metadata` lại rồi mới lưu.
* **Move không bump `etag`.** `update_file(parentId)` đổi chỗ file mà `modifiedTime` giữ
  nguyên, nên `etag` không phát hiện được việc ai đó đã chuyển tài liệu sang thư mục khác.
  Chỉ `sha256` trả lời được câu "nội dung có đổi không".

`etag` vẫn nên truyền vào mọi `update_file` làm khoá chống ghi đồng thời.

## Ánh xạ `MANIFEST.version`

Drive **không** có khái niệm version để ánh xạ: không `revisionId` trong metadata, và `etag`
chỉ là mốc thời gian. Nên nguồn của version vẫn là **tên file** `v<M>.<m>` theo DOC-TREE §2,
còn `MANIFEST.yaml` là chỗ chốt bản nào thật. Đừng dựng version thứ hai từ `etag`.

## Đi cây — một lần gọi một tầng

`search_files` nhận `parentId = '<id>'` nhưng **không đệ quy**: tìm trong `wf-probe-A` chỉ ra
thư mục con `wf-probe-B`, không ra hai file nằm trong B. Đi tám thư mục cấp một của DOC-TREE
là tám lần gọi, cộng một lần cho mỗi thư mục ngày bên trong `01_De-xuat/`, `04_Nghiem-thu/`,
`99_Luu-tru/`. Khai `folder_id` của gốc dự án trong config, đừng tìm theo tên mỗi lần.

## Không làm được gì

* **Ghi đè nội dung** — không có. Mọi bản mới là file mới (xem `put`).
* **`md5Checksum`** — connector không trả, kể cả với file nhị phân. Hash phải tự tính từ
  bytes tải về, nghĩa là `verify` **phải** tải lại cả file.
* **Ghim revision** — `download_file_content` nhận `revisionId`, nhưng không tool nào trong
  bộ này trả về revision để truyền vào. Coi như không có.
* **Shared Drive** — chưa kiểm chứng. Probe chạy trên My Drive. Thiếu `drive_id` thì giả định
  không tới được và nói rõ với người, đừng đoán.
* **Ghi atomic nhiều file** — không có, nên `put` nửa đường là trạng thái thật.
* **Spec** — Drive không bao giờ là nơi agent đọc spec. Worker không chạm Drive; connector
  chỉ có trong phiên `/wavefront:*` của người (DOC-TREE §5).
* **Eval qua mock** — `claude plugin eval` không mock được MCP connector, nên eval của adapter
  này chấm thứ tự thao tác (snapshot trước khi dùng, `verify` trước khi tin, không hash
  `read_file_content`), không chấm connector.

## Cấu hình

```yaml
storage:
  ingest:
    adapter: gdrive
    folder_id: <id thu muc goc du an tren Drive>
    drive_id: <id Shared Drive>        # bỏ nếu là My Drive
    export_map:                        # ghi rõ, đừng để connector tự chọn
      application/vnd.google-apps.document: text/markdown
      application/vnd.google-apps.spreadsheet: text/csv
    path: .wavefront/sources/          # nơi snapshot hạ cánh, vẫn luôn là repo
  publish:
    adapter: gdrive
    folder_id: <id thu muc goc du an tren Drive>
    convert: false                     # true = biến .md thành Google Doc; `diff` mất khả năng so với repo
    check: true
```

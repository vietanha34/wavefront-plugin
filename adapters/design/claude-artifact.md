# Adapter · design · claude-artifact

Hiện thực port `design` (xem `docs/PORTS.md §5`) bằng **Artifact tool** của Claude Code, với
Artifact type `Design` và `Design System`.

Đây là adapter duy nhất trong đó Claude **tự vẽ** được. Các adapter khác (`figma`) chỉ đọc.

## Khảo sát — Artifact đọc được từ Claude Code không? Có.

Kiểm chứng 05/11/2026 trên artifact thật của người dùng, chỉ đọc, không sửa:

**Artifact type `Design` lưu nội dung thành file đọc được.** `Artifact action: "list",
scope: "files"` trên một canvas thật trả về 51 file, trong đó phần nội dung là:

```
project/Home.dc.html            ← một artboard = một file HTML, 4–17 KB
project/LevelManagement.dc.html
project/canvas.json             ← bố cục canvas, 4 KB
project/ds/<ten>/tokens/*.css   ← token màu, type scale, spacing, radius, motion
project/ds/<ten>/ui_kits/**/*.jsx ← component
index.html · SKILL.md · artifact-type/**  ← của TYPE, không phải nội dung. Đừng export
```

`Artifact action: "read"` kèm `path` (hoặc `paths` cho nhiều file một lượt) lưu từng file
xuống đĩa và nói rõ đường dẫn. **Đây chính là đường export vào storage** — không cần tool
nào khác.

**Ba giới hạn phát hiện cùng lúc:**

1. **Artifact type `Docs` KHÔNG chứa nội dung trong file.** Đọc một artifact `Docs` trả về
   lời nhắc rằng nội dung nằm trong service Claude Docs, phải qua connector, và trang chỉ là
   viewer. Nên **đừng dùng `Docs` type cho design** — nó không export được bằng port này.
2. **Artifact của người khác** chỉ trả về bản tóm tắt cô lập, không ra HTML. Export chỉ làm
   được với artifact người dùng sở hữu hoặc có quyền ghi.
3. **`claude.ai/design` bản độc lập đóng cửa 14/12/2026.** Tool `DesignSync` tự khai điều đó
   và khai luôn: đừng dùng nó để *tạo* design — design, deck, prototype làm bằng Artifact
   type. `DesignSync` chỉ còn một việc hợp lệ: sync thư viện component local với một
   design-system project trên `claude.ai/design`, qua skill `/design-sync`. Trong phiên viết
   adapter này, MCP `claude_design` trả `FIRST_PARTY_AUTH_REJECTED` (cần `/design-login`).
   **Không xây gì mới lên nó.**

## Cờ năng lực

```yaml
capabilities:
  claude_can_draw: true
  content_as_files: true        # project/*.dc.html đọc được qua Artifact read + path
  stable_hash: true            # hash file đã export, không hash bản render
  version_token: artifact_version   # "1793887453-71bf", in ra ở moi lan list/read
  export_image: false          # không có đường xuất PNG/SVG qua tool nay
  available_in_worker: false   # KHONG co trong phien worker -> export la bat buoc
  cross_artifact_html_copy: false
```

## Phân cấp — một canvas một PHASE

Đây là quyết định của adapter, không phải tuỳ chọn mỗi lần:

| Thứ | Một cái cho | Kho gốc | Trong repo |
|---|---|---|---|
| **Design system** (token, component) | toàn bộ software | 1 artifact type `Design System` | `.wavefront/design/system/` |
| **Canvas screen** | **một phase** của một epic | 1 artifact type `Design` tên `<CODE>-P<n> · <Short>` | `.wavefront/epics/<CODE>/P<n>/design/` |

Vì sao phase, không phải epic:

* **Phase là đơn vị người duyệt.** Spec của phase được duyệt rồi mới tạo task
  (`epic-taskization B7`). Design đi cùng spec thì cùng một lần duyệt, cùng một lần đóng băng.
* **`canvas.json` là một file.** Hai phase chạy song song trên cùng canvas là hai người ghi
  một file — đúng định nghĩa shared surface, và nó sẽ serialize việc vẽ một cách vô ích.
* **Closed file list.** Task prompt trỏ đúng
  `.wavefront/epics/SG/P3/design/LevelManagement.dc.html`, và file đó nằm trong list. Canvas
  cả epic thì mỗi task đọc một file khổng lồ chứa cả screen của phase khác.

Màn hình **dùng chung giữa các epic** không nằm ở phase nào: đưa vào design system
(`.wavefront/design/system/`), cùng luật với shared surface — một chủ, một chỗ.

Chỉ đổi sang một canvas một epic khi phase nhỏ tới mức mỗi phase có một screen, và ghi lý do
thành DECISION.

## Ánh xạ thao tác

| Port | Artifact tool |
|---|---|
| `create` | `action: "quickstart", intent: "design"` **trước tiên** → rồi `action: "publish"` với `type_url` của type `Design`, `title`, không kèm file. Kết quả trả về url + chỉ thị của type + design system đang có |
| `read` | `action: "list", scope: "files", url: <url>` → `action: "read", url: <url>, paths: ["project/canvas.json", "project/<Screen>.dc.html", …]` |
| `export` | cùng `read`, thêm `out_dir` = thư mục design trong repo, rồi ghi `design.yaml` |
| `verify` | đọc lại đúng danh sách `paths` trong `design.yaml`, tính lại `sha256`, so |
| `publish` | giao thư mục đã export cho adapter của `storage.publish` → `03_Thiet-ke/<CODE>-P<n>/` |

### `create` — hướng dẫn cho Claude, theo thứ tự

1. **`action: "quickstart", intent: "design"`.** Gọi trước khi viết bất cứ gì. Nó trả về chỉ
   thị của type `Design` và danh sách design system của tài khoản. Bỏ bước này là tự dựng một
   trang HTML rời, không phải canvas.
2. **Chọn design system.** Đã khai `design.system.artifact` trong config thì dùng đúng cái
   đó, đừng hỏi lại. Chưa có thì tạo từ type `Design System` một lần cho cả software, và ghi
   url vào config.
3. **`action: "publish"` với `type_url` của type `Design`**, `title` = `<CODE>-P<n> · <Short>`,
   không kèm file. Nhận lại url của artifact mới.
4. **Vẽ**: ghi từng artboard thành `project/<Screen>.dc.html` theo đúng chỉ thị type trả về ở
   bước 1, publish vào url đó. Tên screen là **PascalCase, không dấu** — nó thành tên file và
   bị trích trong prompt của worker.
5. **Người duyệt.** Chưa duyệt thì chưa `export`, chưa tạo task. Đây là cùng một cổng với
   spec, không phải cổng thứ hai.
6. **`export` rồi mới giao việc.** Thiếu bước này thì task có design mà worker không đọc được.

Sửa design sau khi đã export: sửa trên artifact → `export` lại → `verify` sẽ thấy `sha256`
đổi → **báo cho người** và cập nhật spec của phase, đừng im lặng đổi file dưới chân worker
đang chạy.

### `design.yaml` — bản ghi của một lần export

Đặt cạnh file đã export, cùng vai trò với `meta.yaml` của port `docs`:

```yaml
adapter: claude-artifact
artifact: https://claude.ai/artifact/NfMdybtbuKAdnxhgPi14Xq
artifact_version: "1793887453-71bf"     # in ra ở moi lan list/read
unit: SG-P3                              # phase
design_system: https://claude.ai/artifact/<id>
exported_at: 2026-11-05
files:
  - path: LevelManagement.dc.html
    source: project/LevelManagement.dc.html
    sha256: "…"
  - path: canvas.json
    source: project/canvas.json
    sha256: "…"
states:                                  # những state phải kiểm ở task `vis`
  - screen: LevelManagement
    cases: [empty, loading, 3-level, error]
```

`states` là thứ task `vis` đọc để biết phải so bao nhiêu trạng thái
(`epic-taskization/references/templates.md §visual-verify-task`). Không khai thì task `vis`
tự đoán, và nó sẽ đoán ít hơn thực tế.

## Hash

Hash **file đã export** (`project/*.dc.html`, `canvas.json`), không bao giờ hash bản render
hay ảnh chụp. File là text và do chính Claude ghi, nên byte ổn định giữa hai lần đọc.

`artifact_version` (`1793887453-71bf`) là mốc phía kho gốc. Nó đổi mỗi lần publish, kể cả
publish không đổi nội dung file nào — nên nó **không** thay được `sha256`, chỉ dùng để nói
"bản nào" trong báo cáo.

## Không làm được gì

* **Không có trong phiên worker.** Artifact tool là của Claude Code có đăng nhập claude.ai.
  Orchestrator spawn worker bằng phiên khác, và token design hết hạn theo giờ. Đây là lý do
  `export` là bắt buộc — bỏ nó thì task design-dependent chết giữa đường.
* **Không xuất được ảnh.** Không có đường lấy PNG/SVG của artboard qua tool này. Cần ảnh cho
  biên bản nghiệm thu thì chụp bằng công cụ browser (`agent-browser`), và đó là việc ngoài
  adapter.
* **Không copy được HTML giữa hai artifact** phía server (`files` map từ chối HTML/XML). Nhân
  bản canvas = đọc từng file rồi publish lại.
* **Artifact của người khác** chỉ ra bản tóm tắt. Design của đối tác thì `export` không chạy;
  xin file, rồi đi đường `local`.
* **Type `Docs` không chứa nội dung trong file** — đừng dùng nó cho design.
* **`claude.ai/design` đóng 14/12/2026** — `DesignSync` chỉ để sync thư viện component, không
  để tạo design, và không phải nền cho adapter mới.
* **Eval qua mock**: `claude plugin eval` không mock được Artifact tool, nên eval của adapter
  này chỉ chấm được thứ tự thao tác, không chấm tool.

## Cấu hình

```yaml
design:
  adapter: claude-artifact    # claude-artifact | local | figma
  system:
    artifact: https://claude.ai/artifact/<id>   # type `Design System`, một cái cho cả software
    path: .wavefront/design/system/
  canvas:
    unit: phase               # phase | epic — đổi sang epic phải ghi DECISION
    path: .wavefront/epics/<CODE>/P<n>/design/
  publish:
    folder: 03_Thiet-ke/      # đi qua adapter của storage.publish
    check: true
```

# Ports — hợp đồng giữa skill và công cụ

Skill **không bao giờ** gọi trực tiếp một tracker, một orchestrator hay một kho tài liệu.
Nó gọi port. Adapter giải port ra tool thật.

Nhờ vậy lắp một tracker mới chỉ là thêm một adapter, không sửa skill nào.

---

## 0. Luật chung cho mọi adapter

1. **Thiếu thì degrade, không fail.** Không dò được tool → rơi về adapter `file`, ghi ra
   `.wavefront/outbox/`, báo một dòng cho người, tiếp tục công việc.
2. **Khai cờ năng lực.** Framework rẽ nhánh theo cờ, không theo tên adapter.
3. **Không secret trong file.** Token qua env hoặc `${user_config.*}`.
4. **Ánh xạ từ vựng là bắt buộc.** Xem `WHITEPAPER.md §1` — adapter phải nói tầng PHASE và
   TASK của framework tương ứng với cái gì bên nó.

---

## 1. Port `tracker`

### 1.1 Thao tác — bảy cái

| Thao tác | Vào | Ra |
|---|---|---|
| `query_queue` | điều kiện quét (tầng, state, nhãn cổng, blocker đã xong) | danh sách work item, đã sắp ưu tiên |
| `create_work_item` | tiêu đề, mô tả, parent, nhãn, milestone, state | id |
| `transition` | id, state đích | ok / từ chối kèm lý do |
| `comment` | id, nội dung | id comment |
| `link_pr` | id, url PR | ok |
| `read_state` | id | state, nhãn, parent, các quan hệ chặn |
| `set_labels` | id, thêm[], bớt[] | ok |

`read_state` **phải** được gọi trước mỗi lần ghi `done`: một số tracker tự đóng item khi PR
mang mã của nó merge, nên ghi lại là thừa và làm nhiễu lịch sử.

### 1.2 Cờ năng lực

> Cờ do **adapter** khai, không phải `config.yaml`. Đi tìm `auto_close_on_pr_merge` trong
> config sẽ không thấy — nó là tính chất của tracker nên thuộc adapter, rồi đi vào envelope
> dưới `tracker.*` để orchestrator rẽ nhánh theo.


```yaml
capabilities:
  nesting_depth: 3            # số tầng lồng được
  native_issue_types: false   # false -> cần quy ước nhãn level/*; true -> dùng type thật
  auto_close_on_pr_merge: true
  labels_or_fields: labels    # labels | custom_fields
  states: [backlog, todo, in_progress, review, done, canceled]
tier_map:
  phase: task                 # PHASE của framework là gì bên này
  task:  subtask              # TASK của framework là gì bên này
```

`auto_close_on_pr_merge: true` kéo theo **một luật bắt buộc**: PR chỉ mang mã của đơn vị
nhỏ nhất, không mang mã cha. Nếu không, tracker tự đóng cả cha trước khi người kiểm.
Adapter nào đặt cờ này `false` thì không cần luật đó, nhưng phải tự đóng item.

### 1.3 Adapter

| Adapter | Trạng thái | Ghi chú |
|---|---|---|
| `linear` | **đã có** | `native_issue_types: false` nên cần `level/*`. `auto_close_on_pr_merge: true`. Lồng được nhiều tầng |
| `file` | **đã có** | mặc định, ghi markdown vào `outbox/`. Mọi cờ ở mức thấp nhất |
| `jira` | chưa viết | có issue type thật → **bỏ** `level/*`, đừng bê quy ước sang. Workflow mỗi công ty một khác nên `states` phải ánh xạ, không ép |
| `clickup` | chưa viết | có subtask **và** checklist; custom field mạnh hơn nhãn → `labels_or_fields: custom_fields` |

> Jira và ClickUp cố ý **chưa viết**. Viết adapter khi chưa có dự án thật thì chỉ là phỏng
> đoán, mà vẫn phải bảo trì ngang với cái đang chạy. Chúng là bài kiểm cho port: nếu port
> đủ tốt, viết adapter Jira mất một buổi; nếu phải sửa port mới viết được thì port chưa đúng.

### 1.4 Work-item envelope — thứ làm nên tính tách rời

Adapter **không** trả về dữ liệu thô của tracker. Nó trả về một **envelope** đúng hình dạng
`schemas/work-item.schema.json`. Skill và orchestrator chỉ đọc hình dạng đó.

Đây là chỗ quyết định việc đổi tracker rẻ hay đắt:

```
tracker thật  →  adapter  →  work-item envelope  →  epic-taskization, orchestrator
   (đổi)         (viết mới)      (không đổi)              (không sửa dòng nào)
```

Ba trường trong envelope mang **hành vi**, không chỉ dữ liệu:

| Trường | Tác dụng |
|---|---|
| `tier` | `epic` · `phase` · `task` theo từ vựng **framework**, không theo từ vựng tracker. Adapter dịch bằng `tier_map` |
| `state` | sáu state chuẩn, adapter dịch bằng `state_map` |
| `tracker.auto_close_on_pr_merge` | `true` → bật luật "PR chỉ mang mã item nhỏ nhất" và luật "đọc lại state cha sau mỗi merge". `false` → hai luật đó **không** áp dụng và orchestrator tự đóng item |

Nhờ trường thứ ba, luật PR không còn là "luật của Linear" mà là **hệ quả của một cờ năng
lực** — nên Jira (`false`) và Linear (`true`) chạy đúng cùng một orchestrator.

`gate: "none"` nghĩa là item không có nhãn cổng nào → agent **phải bỏ qua**. Adapter chịu
trách nhiệm dịch "không có nhãn" thành giá trị tường minh này, thay vì để orchestrator suy
diễn từ một mảng rỗng.

---

## 2. Port `orchestrator`

| Thao tác | Ý nghĩa |
|---|---|
| `spawn` | tạo một phiên worker cho một task, đặt tên theo mã task |
| `send` | gửi tin hai chiều, route theo mã task |
| `collect` | nhận báo cáo worker (theo mẻ, không từng cái) |
| `gate` | chạy lại kiểm trên head của PR trong một worktree riêng |
| `merge` | merge theo thứ tự đã ghi |

### Cờ năng lực

```yaml
capabilities:
  parallel: true
  worktree_isolation: true
  model_per_task: true        # chọn model theo tier
  message_size_limit: 8000    # vượt thì tách thành phần đánh số
  message_may_garble: true    # true -> worker phải quote lại đoạn hỏng, không đoán
```

| Adapter | Trạng thái |
|---|---|
| `ao` | **đã có** — cần CLI `ao` trả lời được. Không có thì nói rõ và **dừng sau khi ra plan**, không bịa harness khác. Gate script đi kèm plugin ở `scripts/gate.sh`; để trống `orchestrator.gate_script` thì dùng bản này, chỉ khai đường dẫn tuyệt đối khi dự án có gate riêng. Gate script cần repo trên GitHub và CLI `gh` (đọc head/base PR, fetch `pull/<n>/head`) |
| `subagent` | chưa viết — chạy trong một phiên, mất cách ly worktree |
| `manual` | **đã có** — xuất prompt ra file, người tự chạy |

---

## 3. Port `storage` — hai chiều khác nhau

Đây là chỗ dễ thiết kế sai. Không có một port "nơi chứa tài liệu"; có **hai** chiều:

| Chiều | Việc | Luật |
|---|---|---|
| `ingest` | đọc tài liệu đầu vào | fetch **một lần**, lưu **verbatim** vào `sources/` kèm url, ngày, sha256. Sau đó chỉ đọc bản trong repo |
| `publish` | đẩy bản đã chốt ra ngoài | có `--check` so bản ngoài với bản repo trước khi ghi |

### 3.1 Spec không bao giờ sống ngoài repo

Hợp đồng giao việc buộc worker đọc spec **theo khoảng dòng** và cấm grep cả file. Cơ chế đó
chỉ chạy được khi spec là file trong worktree. Spec trên một kho ngoài thì mỗi lần đọc là
một lần fetch cả trang, và mất đúng đòn bẩy chi phí lớn nhất.

Nên `publish` nhận **bản đã chốt đi ra**, không bao giờ là nơi agent đọc spec vào.

### 3.2 Thao tác

| Thao tác | Chiều |
|---|---|
| `fetch` | ingest — trả nội dung + sha256 |
| `snapshot` | ingest — ghi vào `sources/<ngày>_<tên>/` kèm `meta.yaml` |
| `verify` | ingest — so sha256 hiện tại với lúc snapshot → biết nguồn đã đổi |
| `put` | publish |
| `diff` | publish — so bản ngoài với bản repo |

| Adapter | Trạng thái |
|---|---|
| `local` | **đã có** |
| `gdrive` | **đã có** — `adapters/docs/gdrive.md`. Cần connector Google Drive first-party của claude.ai, nên chỉ chạy trong phiên của người. `update_file` không ghi nội dung → bản mới là file mới, bản cũ chuyển sang `99_Luu-tru/<ngày>/` |
| `confluence` | chưa viết |

---

## 4. Port `memory` (tuỳ chọn)

| Thao tác | Ý nghĩa |
|---|---|
| `search` | tìm lại quyết định cũ, đoạn xử lý sự cố |
| `checkpoint` | ép lưu trước khi ngữ cảnh bị nén |

| Adapter | Trạng thái |
|---|---|
| `file` | **đã có** — `decisions.md` + `invariants.md` append-only trong repo |
| `mempalace` | chưa viết |

Port này tuỳ chọn: thiếu nó thì sổ quyết định trong repo vẫn đủ để chạy. Có nó thì tìm được
cả transcript.

---

## 5. Port `design` — nơi vẽ

Ba chiều, không phải một "nơi chứa design":

| Chiều | Việc | Luật |
|---|---|---|
| `create` | Claude vẽ trong kho gốc | người duyệt ở đó, cùng cổng với spec |
| `export` | bản đã duyệt vào repo | **bắt buộc** — xem §5.1 |
| `publish` | bản chốt ra ngoài | đi qua port `docs`, vào `03_Thiet-ke/` |

### 5.1 Worker không bao giờ đọc design từ kho gốc

Cùng lý do với §3.1, cộng hai lý do riêng: công cụ vẽ là của **harness** nên phiên worker do
orchestrator spawn không chắc có nó (và token design hết hạn theo giờ), và design phải nằm
trong **closed file list** của task mới kiểm được worker đã đọc đúng bản.

### 5.2 Thao tác

| Thao tác | Chiều |
|---|---|
| `create` | create — một canvas một đơn vị |
| `read` | create — liệt kê và đọc artboard |
| `export` | export — lưu vào repo + `design.yaml` (url, version, `sha256` từng file) |
| `verify` | export — so `sha256` repo với kho gốc |
| `publish` | publish — giao bản đã export cho port `docs` |

### 5.3 Phân cấp

Một **design system** cho cả software (`.wavefront/design/system/`). Một **canvas cho mỗi
PHASE** (`.wavefront/epics/<CODE>/P<n>/design/`): phase là đơn vị người duyệt, `canvas.json`
là một file nên hai phase song song trên một canvas là shared surface, và task prompt cần trỏ
đúng một file. Màn hình dùng chung giữa các epic đi vào design system.

| Adapter | Trạng thái |
|---|---|
| `claude-artifact` | **đã có** — `adapters/design/claude-artifact.md`. Artifact type `Design` lưu nội dung thành file đọc được (`project/*.dc.html`), nên `export` chạy bằng `Artifact action: read` + `path` |
| `local` | **đã có** — người tự đặt file vào thư mục design. Đường degrade |
| `figma` | chưa viết — chỉ `export`, Claude không vẽ trong Figma |
| `claude-design` | **không viết** — `claude.ai/design` bản độc lập đóng cửa 14/12/2026 |

---

## 6. Viết adapter mới

Một adapter là **một file markdown** trong `adapters/`, gồm:

1. bảng cờ năng lực + `tier_map`
2. bảng ánh xạ bảy thao tác sang tool thật (tên MCP tool, lệnh CLI, hoặc REST)
3. bảng ánh xạ sáu state chuẩn sang state thật
4. phần "không làm được gì" — nói thẳng, để framework degrade đúng chỗ

Rồi thêm vào `evals/`: **một bộ eval dùng chung cho mọi adapter**, chạy lại với từng adapter
qua mock. Cùng bảy thao tác, cùng kỳ vọng. Adapter không qua nghĩa là nó chưa hiện thực đủ
port — biết ngay, chứ không phải đợi tới lúc chạy thật trên dự án của khách.

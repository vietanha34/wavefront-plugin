# Quy chuẩn đặt tên & gắn nhãn issue

Phiên bản 1.0 · 13/10/2026 · dựng từ việc soi 60 issue thật trên một board Linear

Tài liệu này là **luật**. `scripts/name-check.mjs` kiểm tự động theo đúng các luật ở đây.

---

## 0. Vì sao cần

Soi 60 issue gần nhất thấy sáu lớp lệch, mỗi lớp đều sinh ra lỗi thật:

| Lệch | Ví dụ thật | Hậu quả |
|---|---|---|
| Mã epic không ổn định | `BILX-T1-be` rồi huỷ, tạo lại thành `BIL-W1-T1-be` | ba issue Canceled, lịch sử đứt |
| Thiếu segment | `AUTH-T2-fe` (không P, không W) · `BIL-W2-T2-fe` (không P) | không route được tin theo prefix |
| Hai role trong một mã | `AUTH-P3-W1-T2b-ctr-fix` | không biết lấy template prompt nào, gate nào |
| Từ vựng `<Loại>` phình | `TZ` · `CHANGE` · `DOC` · `Audit` · `DECISION` ngoài tài liệu | không lọc/đếm được theo loại |
| Tiêu đề chứa cả spec | một tiêu đề 370 ký tự | không đọc được trên board, không grep được |
| Sub-task không có nhãn nào | 20/60 issue `labels: []` | không truy vết, không lọc theo `area`/`ctkt` |

---

## 1. Registry epic — nguồn duy nhất của mã

Mọi mã epic phải khai trong `.wavefront/config.yaml`. **Không khai thì không được dùng.**
Đây là thứ chặn lớp lỗi `BILX` → `BIL`.

```yaml
epics:
  - code: AUTH        # dùng trong mã sub-task
    short: Auth       # dùng trong tiêu đề task
    issue: PRJ-101
    base: feature/auth
  - code: BIL
    short: Billing
    issue: PRJ-102
    base: feature/billing
  - code: DEBT
    short: Tech debt
    issue: PRJ-104
  - code: OPS
    short: Ops
    issue: PRJ-105
```

Luật:

1. `code` — 2–5 chữ in hoa, `[A-Z]{2,5}`, **không bao giờ đổi** sau khi có issue đầu tiên.
   Đổi phạm vi epic thì tạo epic mới, không đổi mã.
2. `short` — ≤ 12 ký tự, hiện trên board, đọc được bằng mắt.
3. Một epic đúng một `base` branch (trừ epic thường trực như `DEBT`, `OPS`).

---

## 2. Tiêu đề EPIC

```
EPIC · <short>
```

Ví dụ: `EPIC · Billing` · `EPIC · Tech Debt (thường trực)`

Không số, không mô tả thêm. Phạm vi và non-goals nằm trong description.

---

## 3. Tiêu đề TASK (`level/task`) — đơn vị giao việc

```
<short> · <KIND><n?> — <nội dung>
```

* dấu phân cách là ` · ` (U+00B7) và ` — ` (em dash), **đúng các dấu này**
* `<nội dung>` ≤ **80 ký tự**, câu động từ, không chứa spec
* mọi chi tiết đi vào description theo `templates/task-spec.md`

### 3.1 `<KIND>` — từ vựng đóng, bảy giá trị

| KIND | Dùng cho | Thay cho (đang dùng sai) |
|---|---|---|
| `P1` `P2` … | giai đoạn triển khai của epic | |
| `ADD` | bổ sung nhỏ, không đổi interface | `CHANGE` |
| `FIX` | sửa lỗi tái hiện được | |
| `DEBT` | trả nợ kỹ thuật | `TZ`, `Audit` |
| `DEC` | cần người/đối tác chốt | `DECISION` |
| `OPS` | hạ tầng, CI, merge, release | |
| `DOC` | tài liệu, nghiệm thu, đào tạo | |

Trùng tên thì đánh số: `FIX2`, `ADD3`.
`P1` luôn là triển khai ban đầu của epic đó.

**Không nhét mã WBS cũ (`T4.3`, `T5.1`) vào tiêu đề** — ghi ở mục Truy vết của spec.

### 3.2 Ví dụ

```
✓ Billing · ADD — Xuất hoá đơn CSV theo tháng
✓ Perf · DEBT — Trang hoá đơn OOM ở 10^6 dòng, viết lại phần phân trang
✓ Billing · DEC — Làm tròn thuế: theo từng dòng hay theo tổng
✓ Ops · DOC — Ghi yêu cầu cap memory DB vào ops notes

✗ Tech debt · TZ — …                  KIND không tồn tại → DEBT
✗ Tech debt · Audit timezone: …  thiếu KIND, sai dấu phân cách
✗ CI · CHANGE — …                     → Ops · OPS
✗ Khối 2 — Trải nghiệm: …             thiếu <short> · <KIND>
✗ QA · Billing export — …            thiếu KIND
```

---

## 4. Tiêu đề SUB-TASK (`level/subtask`) — đơn vị AO giao worker

Tiêu đề = **mã epic-taskization** + khoảng trắng + nội dung ngắn.

```
<CODE>-P<p>-W<w>-T<n><suffix?>-<role>[-<slug>]  <nội dung>
```

Dạng ngoài wave (merge, CI, release):

```
<CODE>-OPS-<slug>  <nội dung>
```

### 4.1 Luật từng segment

| Segment | Luật |
|---|---|
| `CODE` | phải có trong registry §1 |
| `P<p>` | **bắt buộc**, `p` ≥ 1. Không có phase thì vẫn là `P1` |
| `W<w>` | **bắt buộc**, `w` ≥ 0. `W0` = contract |
| `T<n>` | `n` ≥ 1 |
| `<suffix>` | tuỳ chọn, **một chữ thường** `a`–`z`, cho task sinh thêm sau khi plan đã chốt |
| `<role>` | **đúng một** token từ danh sách §4.2 |
| `<slug>` | tuỳ chọn, kebab-case, ≤ 24 ký tự |
| `<nội dung>` | ≤ 80 ký tự |

### 4.2 `<role>` — từ vựng đóng, chín token

`spec` · `ctr` · `be` · `fe` · `int` · `vis` · `fix` · `docs` · `ops`

Role chọn luôn template prompt, gate và giới hạn quyền. Vì vậy:

> **Một mã mang đúng một role.** `ctr-fix` là không hợp lệ — nó là hai việc,
> hai gate khác nhau, phải tách thành hai sub-task.

### 4.3 Dẫn xuất từ mã

| Thứ | Luật |
|---|---|
| branch | `<mã>` viết thường, không kèm nội dung |
| session AO | `<CODE>P<p>W<w>T<n>-<role>` ≤ 20 ký tự — rút `slug`, **không** rút CODE hay role |
| mở đầu report | `[<mã>]` đầy đủ trong ngoặc vuông |
| PR title / branch / body | **chỉ** mã sub-task của chính nó |

Luật cuối quan trọng: Linear tự đóng mọi issue có mã xuất hiện trong PR. Để mã task cha
trong PR là tự đóng task cha trước khi người kiểm.

### 4.4 Ví dụ

```
✓ AUTH-P3-W5-T12-docs  Tài liệu khối 2: METRICS, ACCEPTANCE, CHANGE-NOTE
✓ AUTH-P3-W3-T7b-fix-sync-guard  hook đồng bộ state đọc state của project khác
✓ BIL-P1-W2-T6-int  Số tính tay trên DB thật cho toàn bộ tiêu chí
✓ AUTH-OPS-merge-dev  Merge feature/auth vào dev

✗ AUTH-T2-fe            thiếu P và W → AUTH-P1-W2-T2-fe
✗ BIL-W2-T2-fe          thiếu P      → BIL-P1-W2-T2-fe
✗ BILX-T1-be            CODE không trong registry, thiếu P/W
✗ AUTH-P3-W1-T2b-ctr-fix  hai role     → tách T2b-ctr và T2c-fix
```

---

## 5. Nhãn bắt buộc theo tầng

| Tầng | Bắt buộc | Cấm |
|---|---|---|
| `level/epic` | `level/epic` · 1 × `type/*` · ≥ 1 × `area/*` | mọi `gate/*` |
| `level/task` | `level/task` · **đúng 1** × `gate/*` · **đúng 1** × `type/*` · ≥ 1 × `area/*` | |
| `level/subtask` | `level/subtask` | `gate/*` (thừa hưởng từ task cha) |

Milestone **không bắt buộc** (13/10/2026) — nhưng thiếu nó thì báo cáo theo mốc không
đầy đủ, xem `commands/status.md`.

Nhóm nhãn nghiệm thu do `config.yaml → tracker.label_groups.acceptance` đặt tên (mặc định
`ctkt`), nên kernel không biết nhóm đó tên gì — chỉ biết "có một nhóm nối tới điều khoản
nghiệm thu".

Thêm nhãn nhóm đó khi issue nối tới một chỉ tiêu nghiệm thu. Task có `ctkt/*` thì comment hoàn
thành **phải đối chiếu đúng con số** của nhãn đó.

> Không có `gate/*` nào = AO bỏ qua. Im lặng là không, không phải là có.

---

## 6. Nhãn phải dọn

| Nhãn | Việc |
|---|---|
| `spec/ready` · `spec/draft` | **retire.** Cổng đã chuyển xuống `Backlog → Todo` ở tầng task. |
| `Improvement` · `Bug` · `Feature` | **retire.** Nhãn mặc định Linear, trùng chức năng `type/*` |
| mô tả của `level/task` | đang ghi "Phải thuộc một epic có label spec/ready" — nội dung của mô hình đã bỏ |

---

## 7. Regex tham chiếu

`scripts/name-check.mjs` dùng đúng các biểu thức này:

```js
const EPIC    = /^EPIC · .{1,40}$/u;
const TASK    = /^(?<short>[^·]{1,12}) · (?<kind>P\d+|ADD\d*|FIX\d*|DEBT\d*|DEC\d*|OPS\d*|DOC\d*) — (?<body>.{1,80})$/u;
const SUBTASK = /^(?<code>[A-Z]{2,5})-(?:P(?<p>\d+)-W(?<w>\d+)-T(?<n>\d+)(?<sfx>[a-z]?)|OPS)-(?<role>spec|ctr|be|fe|int|vis|fix|docs|ops)(?:-(?<slug>[a-z0-9-]{1,24}))?(?:\s+(?<body>.{1,80}))?$/u;
```

Lưu ý `SUBTASK`: nhánh `OPS` không mang role trong dạng `<CODE>-OPS-<slug>`, nên
script xử lý riêng dạng đó thay vì bắt bằng cùng một nhánh.

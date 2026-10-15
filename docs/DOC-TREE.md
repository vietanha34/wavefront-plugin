# Cây tài liệu & luật đặt tên file

Phiên bản 1.0 · 13/10/2026

---

## 0. Luật nền: spec ở repo, Drive là hai chiều khác nhau

Đây là ràng buộc không được vi phạm.

`epic-taskization/templates.md §1` buộc worker làm việc theo **SPEC EXCERPT** và mở spec
đầy đủ **theo line range**, cấm grep cả file. Cơ chế này là thứ chống lại rule 19 (chi phí
= calls × context). Spec nằm trên Drive hay Confluence thì worker phải fetch cả trang mỗi
lần, và mất đúng đòn bẩy chi phí lớn nhất.

Nên:

| Chiều | Nội dung | Ở đâu |
|---|---|---|
| **repo** | spec, plan, invariants, decisions, traceability | `.wavefront/` — nguồn sự thật cho agent |
| **ingest** | tài liệu đầu vào từ ngoài | fetch **một lần** → `.wavefront/sources/` kèm URL, ngày, hash |
| **publish** | bản đã chốt cho người không vào repo | cây Drive dưới đây |

Agent **không bao giờ** đọc spec từ Drive. Drive chỉ nhận bản đã chốt đi ra, và cấp tài
liệu đối tác đi vào.

---

## 1. Cây Drive

```
<Khách hàng>/
└── <Dự án>/
    ├── MANIFEST.yaml              ← bản ghi duy nhất "bản nào là bản thật"
    ├── 00_Hop-dong/               ← HĐ + phụ lục. KHÔNG SỬA sau khi ký
    │   ├── 00_Hop-dong-dich-vu_v1.0.docx
    │   ├── PL01_Pham-vi-cong-viec_v1.0.docx
    │   └── … PL02…PL09
    ├── 01_De-xuat/                ← theo đợt, mỗi đợt một thư mục ngày
    │   └── 2026-09-07/
    │       ├── 01_Pham-vi-Du-an_v1.4.docx
    │       ├── 02_Ha-tang-va-Chi-phi_v1.1.docx
    │       ├── 03_Du-toan-Phat-trien_v1.0.docx
    │       └── 04_Du-toan-va-Sizing_v1.2.xlsx
    ├── 02_Phan-tich/              ← CTKT, PRD, data contract — bản chốt
    │   ├── 06_CTKT-Phase1_v0.3.xlsx
    │   ├── PRD_Churn-Rate_v0.1.md
    │   └── PRD_Drop-Rate_v0.1.md
    ├── 03_Thiet-ke/               ← wireframe, export từ design tool
    ├── 04_Nghiem-thu/             ← biên bản, test case, bằng chứng
    │   └── <mốc>/                 ← M1/, M4/, …
    ├── 05_Van-hanh/               ← runbook, hướng dẫn, tài liệu đào tạo
    ├── 06_Bao-cao/                ← báo cáo tuần và theo mốc
    │   └── 2026-W41_Bao-cao-tuan.md
    └── 99_Luu-tru/                ← bản bị thay thế, theo ngày
        └── 2026-09-24/
```

Tám thư mục cấp một, số thứ tự cố định. Số là **vai trò**, không phải thời gian — nên
`00_Hop-dong` luôn là 00 ở mọi dự án, và cây so sánh được giữa các dự án.

---

## 2. Tên file

```
<NN>_<Ten-ngan-khong-dau>_v<M>.<m>.<ext>
```

| Phần | Luật |
|---|---|
| `NN` | hai số, khớp mã trong `MANIFEST.yaml`. Tài liệu không có mã thì bỏ phần này |
| `Ten-ngan` | kebab-case, **không dấu**, ≤ 40 ký tự |
| `v<M>.<m>` | `M` tăng khi gửi ra ngoài, `m` tăng khi sửa nội bộ |
| `ext` | đuôi thật |

### 2.1 Cấm hậu tố `-final`

Hiện trong `outputs/` có `06_CTKT_Phase1_v0.3-final.xlsx` cạnh `06_CTKT_Phase1_v0.3.xlsx`,
và một thư mục `final/`. Đây là lớp lỗi quen: `-final` luôn sinh ra `-final2`, và không ai
biết bản nào thật.

Thay bằng hai thứ:

* **Phiên bản cao nhất trong thư mục là bản hiện hành.** Không cần nhãn.
* **`MANIFEST.yaml` ghi bản nào đã chốt, đã gửi cho ai, ngày nào.**

### 2.2 Cấm thư mục `_backup_<ngày>_truoc_<lý do>` đặt tại chỗ

Hiện có `_backup_20260924/`, `_backup_20260924_truoc_xoa_1a/`,
`_backup_20260924_truoc_dien_STK/`, `_backup_20260924_truoc_sua_PL09/` nằm lẫn trong
`contract/`. Bốn thư mục cho một ngày, và lý do nằm trong tên thư mục.

Thay bằng: bản bị thay thế **chuyển sang** `99_Luu-tru/<ngày>/`, giữ nguyên tên file kèm
phiên bản cũ. Lý do ghi ở `MANIFEST.yaml`, không ghi trong tên thư mục.

---

## 3. `MANIFEST.yaml`

Một file cho mỗi dự án. Đây là thứ trả lời "bản nào là bản thật" mà hiện không ai trả lời được.

```yaml
project: <Project name>
updated: <YYYY-MM-DD>

docs:
  - code: "01"
    name: Pham vi Du an
    path: 01_De-xuat/2026-09-07/01_Pham-vi-Du-an_v1.4.docx
    version: "1.4"
    status: da-chot          # nhap | da-gui | da-chot | thay-the
    sent:
      - to: Tuan Anh
        at: 2026-09-24
        channel: messenger
    sha256: "…"
    supersedes: 01_De-xuat/2026-09-07/01_Pham-vi-Du-an_v1.3.docx

  - code: "06"
    name: CTKT Phase 1
    path: 02_Phan-tich/06_CTKT-Phase1_v0.3.xlsx
    version: "0.3"
    status: da-chot
    binds: [ctkt/churn, ctkt/drop, ctkt/retention, ctkt/perf, ctkt/load]
```

Trường `binds` là cái nối tài liệu với nhãn `ctkt/*` trên tracker — nhờ nó mà truy vết đi
được cả hai chiều: từ một dòng code về điều khoản, và từ một điều khoản ra các issue.

---

## 4. Cây trong repo

```
.wavefront/
├── config.yaml                 ← registry epic, adapter, branch topology
├── MANIFEST.yaml               ← bản sao chỉ-đọc, sync từ Drive khi publish
├── sources/                    ← tài liệu ngoài, lưu VERBATIM
│   └── 2026-09-07_CTKT-Phase1-v0.3/
│       ├── meta.yaml           ← url, fetched_at, sha256
│       └── content.xlsx
├── epics/
│   └── <CODE>/
│       ├── epic.md             ← goal một câu · NON-GOALS · base branch
│       └── P<n>/
│           ├── spec.md         ← 9 phần cố định
│           ├── plan.yaml       ← waves → tasks → role, closed_files, merge_order
│           ├── invariants.md   ← APPEND-ONLY
│           └── decisions.md    ← APPEND-ONLY
├── ledger/
│   └── traceability.csv        ← requirement ↔ issue ↔ ctkt ↔ PR ↔ test
└── outbox/                     ← khi tracker adapter = file
```

### 4.1 Luật `sources/`

Mọi tài liệu từ ngoài — Drive, Confluence, dán trong chat — lưu verbatim trước khi dùng.
Tiền lệ đã có trong `epic-taskization §Inputs`: text dán trong chat phải lưu ra file trước
vì relay làm garble chữ. Áp cùng luật cho mọi nguồn.

`meta.yaml` giữ `sha256`. Tài liệu nguồn đổi ngoài tầm kiểm soát là chuyện thường —
hash cho biết nó đã đổi, thay vì âm thầm làm việc trên bản cũ.

### 4.2 `APPEND-ONLY` nghĩa là gì

`invariants.md` và `decisions.md` chỉ được **thêm dòng**. Sửa hay xoá dòng cũ là mất bằng
chứng vì sao một quyết định từng được chọn. Quyết định đổi thì thêm dòng mới trỏ về dòng cũ:

```
I-14  (2026-10-05) Event level dùng cho báo cáo là `__level_start`.
      Test ghim: packages/db/__tests__/level-contract.test.ts
I-27  (2026-10-12) Thay I-14: thêm điều kiện bỏ qua `level_start_<số>` hoàn toàn.
```

---

## 5. Ai được ghi vào đâu

| | repo `.wavefront/` | Drive |
|---|---|---|
| Người | ✓ | ✓ |
| Plugin (`/wavefront:*`) | ✓ | chỉ `publish`, chỉ khi được gọi |
| AO orchestrator | spec, plan, invariants, decisions | ✗ |
| AO worker | ✗ (chỉ đọc theo line range) | ✗ |

Worker không ghi tài liệu. Nó báo cáo, orchestrator ghi.

---
name: surfaces
description: Dùng khi chia một sản phẩm thành module và epic, và khi cần tìm shared surface — file mà mọi feature đều chạm. Sinh ra feature matrix, registry epic và hai danh sách glob mà kernel dùng để chia wave.
---

# surfaces — ranh giới module, epic, và lane dùng chung

Gộp hai bước D7 và D8. Chúng đi liền nhau vì không biết ranh giới file thì không tách epic
được đúng.

Đầu ra bị **kernel đọc** (`wave-plan.mjs`) và bị **`name-check` kiểm** (registry epic), nên
đây là hợp đồng dữ liệu.

## Bước 1 — Feature matrix

Hàng là feature, cột là module bị chạm. Ghi vào `.wavefront/epics/_intake/surfaces.md`:

```markdown
| Feature | validation | api | web | query core |
|---|:---:|:---:|:---:|:---:|
| Churn      | ● | ● | · | ● |
| Drop       | · | ● | ● | ● |
| Retention  | ● | · | ● | ● |
```

**Cột nào gần như kín là shared surface** — rủi ro cao nhất. Trong ví dụ trên là `query core`.

Đây là lý do matrix phải làm trước khi tách epic: nó cho biết epic nào sẽ tranh file với
epic nào, và đó là thứ quyết định chạy song song được hay không.

## Bước 2 — Hai danh sách glob

Ghi thẳng vào `.wavefront/config.yaml`:

```yaml
surfaces:
  contract:                 # chạm vào đây => BẮT BUỘC sinh W0 trước
    - "packages/validation/**"
  shared:                   # một task một lúc, GLOBAL xuyên mọi epic
    - "apps/web/src/components/ReportShell.tsx"
```

| Danh sách | Nghĩa | Kernel làm gì |
|---|---|---|
| `contract` | nơi định nghĩa interface hai phía cùng import | task chạm vào → đẩy sang **W0**, không cho implementation cùng wave |
| `shared` | file mọi feature đụng | **một lane**, một task một lúc, và lane này global xuyên epic |

Luật của `shared`: thay đổi ở đó **bắt buộc có test ghim hành vi cũ viết và commit TRƯỚC**
khi sửa. Byte-identical hoặc snapshot. Đây là rule 7, và nó đã giữ an toàn qua ba phase.

`contract` nên **hẹp**. Khai rộng thì mọi task đều sinh W0 và quy trình đứng. Chỉ khai nơi
thật sự là nguồn duy nhất của interface.

## Bước 3 — Tách epic

Hai epic khi **cả hai** đúng:

* hai mục tiêu sản phẩm **độc lập** — mỗi cái tự đứng được, không nửa vời
* hai base branch **không giẫm nhau**

Phải merge chung liên tục nghĩa là thực ra **một** epic. Đây là phép thử rẻ nhất, dùng trước
mọi tranh luận khác.

Mỗi epic ghi `.wavefront/epics/<CODE>/epic.md`:

```markdown
# EPIC · <short>

## Goal
Một câu.

## NON-GOALS          ← bắt buộc, tường minh
- …
- …

## Base branch
feature/<slug>

## Merge order
Vào `<branches.integration>` sau epic nào, trước epic nào.

## Lane dùng chung
File nào trong `surfaces.shared` mà epic này sẽ chạm, và xếp hàng sau epic nào.
```

**NON-GOALS không được bỏ trống.** Nó là thứ duy nhất chặn epic phình ra, và là chỗ đầu tiên
người kiểm đọc khi thấy một task đi quá phạm vi.

## Bước 4 — Khai registry

```yaml
epics:
  - code: RET          # 2–5 chữ in hoa, KHÔNG BAO GIỜ đổi sau issue đầu tiên
    short: Retention   # ≤ 12 ký tự, hiện trên board
    issue: <id>
    base: feature/retention
```

Đổi phạm vi epic thì **tạo epic mới**, không đổi mã. Đổi mã là lớp lỗi đã xảy ra thật: ba
sub-task `LDC-*` phải huỷ rồi tạo lại thành `LD-*`.

## Mượn gì

`discovery.borrow.survey` (mặc định `pm-ai-shipping:document-app`) cho bước soát code hiện
có ở chế độ `existing-repo`. Thiếu nó thì xem `references/borrow-fallback.md`.

Riêng ba bước 2, 3, 4 **không mượn** — đầu ra bị kernel parse.

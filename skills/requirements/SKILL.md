---
name: requirements
description: Dùng khi biến tài liệu hoặc yêu cầu thô thành danh sách requirement R1..Rn, mỗi dòng gắn nguồn gốc truy được. Đây là đầu vào bắt buộc của epic-taskization B1, và không skill PM nào sinh ra đúng định dạng này.
---

# requirements — R1..Rn, mỗi dòng có nguồn

## Vì sao tự viết thay vì mượn skill PM

`epic-taskization` B1 đòi: *"enumerate requirements R1..Rn, **each tagged with its source
location**"*. Không skill PM nào sinh ra đúng dạng đó — chúng ra PRD cho người đọc. Mượn rồi
tự dịch sang R1..Rn là thêm một bước dịch dễ sai, nên bước này **sở hữu**.

Đầu ra của bước này bị bước sau **parse**, nên định dạng là hợp đồng dữ liệu, không phải
văn phong.

## Định dạng

Ghi vào `.wavefront/epics/_intake/requirements.md`:

```markdown
# Requirements — <tên dự án>
Nguồn đã snapshot: .wavefront/sources/  (xem meta.yaml cho url + sha256)

| ID | Requirement | Nguồn | Loại | Ghi chú |
|---|---|---|---|---|
| R1 | Báo cáo Churn theo cohort level, hai dạng cùng công thức | `01_Pham-vi_v1.4.docx` §5.5 | chức năng | |
| R2 | P95 Events ≤ 5s, Retention ≤ 15s | `06_CTKT_v0.3.xlsx` dòng 12 | phi chức năng | nghiệm thu |
| R3 | Không đọc trái quyền qua UI/URL/API/cache | `06_CTKT_v0.3.xlsx` dòng 18 | ràng buộc | nghiệm thu |
```

Luật về cột **Nguồn**:

* phải chỉ tới **một vị trí cụ thể** — tên file + mục, dòng, trang, hoặc ảnh/slide nào.
  Ghi "theo tài liệu phạm vi" là **không đạt**.
* nguồn là **bản đã snapshot** trong `.wavefront/sources/`, không phải link ngoài. Link
  ngoài đổi lúc nào không biết; bản snapshot có `sha256`.
* yêu cầu đến từ **hội thoại** thì nguồn là `chat <ngày>` và phải được ghi thành DECISION
  ở `decisions.md` cùng lúc — nếu không, lần sau không ai biết nó từ đâu ra.

Cột **Loại**: `chức năng` · `phi chức năng` · `ràng buộc` · `giả định`.
Dòng loại `giả định` **không phải** requirement — nó đi kèm phương án thay thế và chuyển
sang `clarify`.

## Ba lỗi phải chặn

**Một requirement, một dòng.** Dòng chứa "và" nối hai thứ kiểm được độc lập thì tách. Lý do
thực dụng: cột `requirement` trong `ledger/traceability.csv` nối 1–1 tới issue, nên một dòng
gộp làm vỡ truy vết.

**Không suy diễn.** Tài liệu không nói thì không được viết vào. Chỗ cần suy diễn thì thành
dòng `giả định`, hoặc thành câu hỏi cho người. Đây là cùng một luật vàng của `clarify`:
không bao giờ đoán.

**Không bỏ yêu cầu phi chức năng.** Chúng dễ bị bỏ vì không "nghe như feature", nhưng ở chế
độ `contracted` thì chúng chính là điều khoản nghiệm thu. Soát riêng một lượt cho: hiệu năng,
tải, phân quyền, độ mới dữ liệu, bàn giao, đào tạo.

## Chế độ `contracted` — trích, không sinh

`acceptance_source: contract` nghĩa là các con số nghiệm thu **trích nguyên** từ tài liệu.
Không tìm thấy con số → tạo issue `gate/blocked-partner` để hỏi đối tác, **không điền số
phỏng đoán**. Một con số tự nghĩ ra là hỏng nghiệm thu.

## Nối sang truy vết

Mỗi dòng `R<n>` sau này xuất hiện ở cột đầu của `ledger/traceability.csv`:

```
requirement,issue,acceptance_label,pr,test
R1,HAL-88,churn,#412,packages/db/__tests__/churn.int.ts
```

Nên ID `R<n>` **không bao giờ đổi số** sau khi đã có issue trỏ vào. Requirement bị bỏ thì
đánh dấu `(đã bỏ — lý do)`, giữ nguyên số.

## Khi không có skill mượn nào

Bước này không mượn gì. Nó chỉ cần tài liệu đã snapshot (`doc-tree`) và, nếu cần làm rõ,
`clarify`.

---
name: acceptance
description: Dùng khi cần tiêu chí nghiệm thu có số đo được, và khi nối tiêu chí đó tới điều khoản hợp đồng. Ở dự án đã khoá phạm vi thì TRÍCH số từ tài liệu, không sinh mới — sinh sai một con số là hỏng nghiệm thu.
---

# acceptance — tiêu chí có số, và truy vết về điều khoản

## Hai chế độ, và chúng khác nhau hoàn toàn

Đọc `discovery.acceptance_source` trong config trước khi làm gì.

### `contract` — TRÍCH, không sinh

Các con số là **điều khoản hợp đồng**. Việc ở đây là tìm chúng trong tài liệu đã snapshot và
chép **nguyên**, kèm vị trí.

> Một con số tự nghĩ ra ở bước này là hỏng nghiệm thu với đối tác. Đây là luật cứng, không
> phải khuyến nghị.

Không tìm thấy con số cho một chỉ tiêu → tạo issue `gate/blocked-partner` để hỏi đối tác, và
để ô đó **trống**. Không nội suy từ chỉ tiêu khác, không lấy "thông lệ ngành".

### `derived` — sinh, rồi người duyệt

Dự án greenfield thì chưa có số. Đề xuất số, nhưng ghi rõ **căn cứ** của từng số và đánh dấu
là đề xuất cho tới khi người chốt. Mượn `discovery.borrow.metrics` nếu có.

## Định dạng

Ghi `.wavefront/epics/_intake/acceptance.md`, và mỗi dòng sau này thành một nhãn nhóm
nghiệm thu trên tracker:

```markdown
| Chỉ tiêu | Phải đạt | Đo bằng | Nguồn | R |
|---|---|---|---|---|
| churn | Dataset 100 user → 10%, 8%, 8% | `pnpm test churn.int` | `06_CTKT_v0.3.xlsx` d.14 | R1 |
| drop | 600 → 480 = 20% | `pnpm test drop.int` | `06_CTKT_v0.3.xlsx` d.15 | R4 |
| perf | P95 ≤ 5s Events, ≤ 15s Retention; độ mới ≤ 45 phút | k6 script + query log | `06_CTKT_v0.3.xlsx` d.12 | R2 |
| load | nền 579/s · peak 1.736/s · burst 17.361/s trong 1 giờ | k6 | `06_CTKT_v0.3.xlsx` d.13 | R5 |
```

Bốn cột đều **bắt buộc**:

* **Phải đạt** — có số. "Hoạt động tốt", "chạy ổn" là không đạt; `spec-lint` chặn các cụm này.
* **Đo bằng** — một lệnh chạy được, hoặc một thủ tục cụ thể. Không ghi được lệnh nghĩa là
  chưa biết cách đo, và một tiêu chí không đo được thì không phải tiêu chí.
* **Nguồn** — vị trí cụ thể trong tài liệu đã snapshot.
* **R** — requirement nào. Đây là chỗ nối lên `requirements.md`.

## Nối ba chiều

Tên cột `Chỉ tiêu` xuất hiện ở ba nơi, và phải **giống nhau** cả ba:

```
acceptance.md            →  nhãn nhóm trên tracker        →  MANIFEST.yaml
<chỉ tiêu>                  <nhóm>/<chỉ tiêu>                binds: [<chỉ tiêu>]
```

Tên nhóm nhãn do `tracker.label_groups.acceptance` đặt (mặc định `ctkt`), nên kernel chỉ biết
"có một nhóm nối tới điều khoản nghiệm thu" mà không biết nhóm đó tên gì. Nhờ vậy dự án khác
đặt tên nhóm khác được mà không sửa gì trong plugin.

Có đủ ba liên kết thì truy vết đi được **cả hai chiều**: từ một dòng code về điều khoản, và
từ một điều khoản ra danh sách issue cùng test.

## Luật khi task mang nhãn nghiệm thu

Comment hoàn thành **bắt buộc đối chiếu đúng con số** của nhãn đó. Ghi "đã test ổn" là không
đạt, và người kiểm trả về `review/rework`.

Đây cũng là lý do `fix_policy` phân biệt hai đường: bug chạm một chỉ tiêu trong bảng này thì
test đỏ do `int` viết là bằng chứng độc lập, nên giữ nguyên luật 0 sửa assertion.

## Chỗ dễ sai nhất

**Tiêu chí phi chức năng bị bỏ.** Hiệu năng, tải, phân quyền, độ mới dữ liệu, bàn giao, đào
tạo — chúng không "nghe như feature" nên dễ trượt khỏi bảng, nhưng ở chế độ `contract` thì
chúng chính là phần đối tác kiểm.

**Số đúng nhưng điều kiện đo thiếu.** "P95 ≤ 5s" vô nghĩa nếu không nói ở bao nhiêu user, dữ
liệu thưa hay dày, trên môi trường nào. Điều kiện đo thuộc cột **Đo bằng**, không phải phần
ghi chú.

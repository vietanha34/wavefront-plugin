---
name: clarify
description: Dùng khi một yêu cầu hoặc spec có điểm mơ hồ, nhất là khi có tính toán, công thức hoặc nhận dữ liệu từ ngoài. Biến mơ hồ thành câu hỏi cho người, rồi thành DECISION không mở lại — thay vì để agent đoán. Gồm checklist điểm biên bắt buộc.
---

# clarify — mơ hồ thành câu hỏi, không thành phỏng đoán

## Luật vàng

> **Không bao giờ đoán.** Mơ hồ thành câu hỏi cho người, hoặc thành ASSUMPTION có ghi
> phương án thay thế và lý do phương án đó thắng. Không có đường thứ ba.

Lý do cơ chế: `spec` worker **không được phép hỏi người**. Với nó, mơ hồ chỉ sinh ra
Assumption — một phỏng đoán mang theo rủi ro tới tận lúc nghiệm thu. Chỗ duy nhất biến câu
hỏi thành đáp án của người là ở đây, trước khi spec vào `Todo`.

## Checklist điểm biên — bắt buộc khi có tính toán

Yêu cầu có công thức, có tỷ lệ, có cohort, hoặc nhận dữ liệu từ nguồn ngoài thì **phải**
duyệt qua danh sách này. Câu nào không trả lời được trong phiên thì thành issue
`gate/needs-human` (cần người) hoặc `gate/blocked-partner` (cần đối tác), và epic/task đó
**chưa được vào `Todo`**.

### Mẫu số và tập hợp

1. Mẫu số rỗng thì ra gì — `0`, `null`, hay "không áp dụng"?
2. Một đối tượng thoả điều kiện nhiều lần thì tính mấy lần?
3. Tập hợp cố định ở thời điểm nào — lúc vào cohort, hay tính lại mỗi lần query?
4. Khi bật nhiều chiều cùng lúc, tập dòng theo chiều nào? Bật thêm chiều có được làm đổi
   số của chiều gốc không?

### Thời gian

5. Múi giờ nào là chuẩn — UTC, hay timezone của project?
6. Biên ngày cắt ở đâu? Ô chưa đủ tuổi dữ liệu hiển thị thế nào — `0%` hay để trống?
7. Dữ liệu đến muộn thì tính vào ngày sự kiện hay ngày nhận?

### Giá trị thiếu

8. Thiếu giá trị nghĩa là `0`, hay là "không khớp"? **Hai ngữ nghĩa này khác nhau** và
   gộp chúng lại là làm đổi mọi con số, hoặc làm sống lại một bug đã sửa.
9. Giá trị ngoài dải cho phép thì từ chối, hay kẹp về biên?

### Dữ liệu vào

10. Retry và replay có được sinh bản ghi mới không?
11. Event sai định dạng thì từ chối cả batch hay từng bản ghi? Mã lỗi là gì?
12. Có giới hạn kích thước payload không? Vượt thì sao?

### Nghiệm thu

13. Số kỳ vọng trên dataset chuẩn là bao nhiêu, và **ai cấp con số đó**?
    Chế độ `contracted` thì số phải **trích từ hợp đồng**, không được sinh mới.

## Cách ghi kết quả

DECISION — append vào `.wavefront/epics/<CODE>/P<n>/decisions.md`:

```
D-18  (2026-10-13) Mẫu số rỗng trả "không áp dụng", KHÔNG trả 0%.
      Phương án bị loại: trả 0% — vì "sai nhưng hợp lý" tệ hơn "không có số".
      Người chốt: anh. Không mở lại.
```

ASSUMPTION — ghi vào mục Assumptions của spec, luôn kèm phương án thay thế:

```
A-04  Giả định biên ngày cắt theo timezone project.
      Thay thế: theo UTC — bị loại vì báo cáo gửi đối tác đọc theo giờ VN.
      Nếu giả định này sai: phải viết lại phần gom của retention query.
```

Câu hỏi đã trả lời thì **chuyển thành DECISION và xoá mục câu hỏi** — đừng để cả hai.

## Chế độ rút gọn

Không có skill `challenge`/`premortem` trong phiên: vẫn duyệt đủ 13 câu trên, chỉ bỏ phần
công kích giả định có hệ thống. Ghi một dòng rằng bước công kích chạy ở chế độ rút gọn.

## Không thuộc skill này

Thiết kế contract, chia wave, viết spec — những việc đó ở `task-spec` và
`epic-taskization`. Ở đây chỉ làm một việc: không để một câu hỏi nào đi xuống hạ nguồn mà
chưa có đáp án hoặc chưa được ghi là phỏng đoán.

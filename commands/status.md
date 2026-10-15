---
description: Báo cáo tiến độ — tiến độ theo mốc, trạng thái epic, việc cần người, rủi ro, nợ kỹ thuật
argument-hint: "[tuần|mốc] [--send]"
---

# /wavefront:status

Tham số: `$ARGUMENTS`

Đọc tracker qua adapter + `ledger/traceability.csv`. **Chỉ đọc** — không tạo, không sửa
issue nào.

## Sáu mục

### 1. Tiến độ tổng
Phần trăm cả board, và từng mốc. Mốc nào thiếu dữ liệu thì nói rõ là thiếu, đừng bỏ qua —
hiện phần lớn task không có milestone nên con số này sẽ không đầy đủ.

### 2. Trạng thái epic — mục quan trọng nhất
Mỗi epic: bao nhiêu task xong trên tổng, đang chặn ở đâu, và **vì sao**.

### 3. Tuần này
Done / In Review / In Progress — đếm và liệt kê.

### 4. Cần người xử lý
* task ở `In Review` quá 2 ngày → chờ duyệt và đóng
* task ở `In Progress` quá 5 ngày → đọc comment xem chặn bởi gì
* task có `gate/blocked-partner` → cần nhắc đối tác
* **task ở `Todo` mà không có `gate/*`** → người đã duyệt nhưng agent không thấy. Đây là lớp
  lỗi im lặng nhất, luôn để mục này lên đầu phần 4
* epic còn việc nhưng không còn task nào ở `Todo` → agent sắp hết việc
* epic đến hạn mốc mà spec chưa xong → nguy cơ trượt

### 5. Rủi ro
Task `type/risk` hoặc `type/decision` chưa đóng quá 5 ngày.

### 6. Nợ kỹ thuật
Epic Tech Debt: task mới tuần này, tổng tồn, ba cái ưu tiên nhất.

## Định dạng

Text ngắn, **không bảng** nếu gửi qua kênh chat. Gửi trong phiên thì bảng được.

`--send` đẩy qua adapter `comms` trong config. Không có adapter thì ghi ra
`.wavefront/outbox/status-<ngày>.md` và nói rõ.

## Chi phí

Mỗi lần chạy nên gom mọi lệnh đọc tracker vào **một lượt** gọi song song. Ngữ cảnh của
người điều phối là phiên dài nhất của một epic, và mỗi tin đến đều đọc lại toàn bộ ngữ cảnh.

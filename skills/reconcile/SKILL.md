---
name: reconcile
description: Dùng khi áp quy trình lên một repo đã có code viết trước đó, hoặc khi agent đã xây xong một phần trước khi có luật. Đối chiếu hiện trạng thật với backlog trước khi bật vòng quét bình thường, để backlog không nói dối.
---

# reconcile — đối chiếu hiện trạng

## Vấn đề

Nếu đã có code viết trước khi có quy trình, một backlog dựng mới sẽ **nói dối**: nó mô tả
việc cần làm, trong khi việc đó đã xong. Mọi con số tiến độ sau đó đều sai, và agent có thể
đi xây lại thứ đã có.

Đây là tình trạng thật của dự án hiện tại: Churn, Drop và Event Analytics đã xây xong một
phần trước khi có hợp đồng làm việc trên tracker.

## Năm bước — theo đúng thứ tự

### 1. Liệt kê những gì đã xây **thật**

Một dòng một hạng mục: bảng, endpoint, module, file. Không mô tả ý định, chỉ ghi cái đang
tồn tại trong code.

Nguồn: đọc code. Không lấy từ tài liệu, không lấy từ ký ức của agent, không lấy từ issue cũ.

### 2. Với mỗi epic liên quan, người tạo task `P1`

Spec của `P1` mô tả **hiện trạng đã có**, không phải việc cần làm. Tức là mục "Phải xây" ghi
cái đã xây, và "Tiêu chí hoàn thành" ghi cách kiểm cái đó đang hoạt động.

### 3. `P1` chuyển thẳng sang `review`

Không qua `in_progress`. Agent điều phối ghi bản báo cáo chứng minh đạt tiêu chí — bằng cách
**chạy thật**, không bằng cách khẳng định.

### 4. Chỗ nào chưa đạt → `P2` hoặc `FIX`

Spec viết theo `templates/task-spec.md` như mọi task bình thường.

### 5. Chỉ sau khi 1–4 xong mới bật vòng quét bình thường

Đây là điều kiện, không phải khuyến nghị. Bật quét trước khi đối chiếu xong thì agent sẽ lấy
task dựa trên một backlog sai.

## Sản phẩm

Một bảng ba cột, lưu vào `.wavefront/epics/<CODE>/reconcile.md`:

| Hạng mục đã có | Bằng chứng (lệnh + output) | Đạt tiêu chí nào |
|---|---|---|

Cộng danh sách khoảng trống → thành task `P2`/`FIX`.

## Bẫy

* **Đừng tin issue cũ.** Issue `Done` từ trước khi có luật có thể đã bị đóng mà không có
  bằng chứng. Kiểm bằng code, không bằng state.
* **Đừng gộp "đã có" với "đã đúng".** Một endpoint tồn tại không có nghĩa nó đạt tiêu chí
  nghiệm thu. Hai việc khác nhau, và bước 3 là nơi phân biệt.
* **Đừng để agent tự quyết hạng mục nào coi là đạt.** Bước 2 là việc của người.

---
name: task-spec
description: Dùng khi viết spec cho một đơn vị giao việc để agent làm được mà không cần hỏi. Spec phải tự đủ, tám mục bắt buộc, tiêu chí hoàn thành có số và kiểm được bằng lệnh. Dùng cả khi soát lại một spec người khác viết.
---

# task-spec — spec tự đủ

Template: `templates/task-spec.md`. Kiểm bằng `scripts/spec-lint.mjs`.

## Phép thử duy nhất

> Đưa task này cho một người lạ không biết gì về dự án — họ làm được không?

Nếu họ phải hỏi một câu, spec chưa xong.

## Ba luật dễ vi phạm nhất

### 1. Tự đủ — không tham chiếu ra ngoài

Công thức **chép đủ** vào mục Công thức. Không viết "xem epic", "theo tài liệu X".
Lý do: agent đọc spec theo khoảng dòng, nên một tham chiếu ra ngoài là một lượt fetch nữa
ở **mọi** lượt gọi sau đó — và thường là fetch cả tài liệu.

`spec-lint` chặn các cụm tham chiếu chéo trong mục Công thức.

### 2. Tiêu chí hoàn thành phải có **số** và có **lệnh**

```
✗ Hoạt động tốt với dataset lớn
✗ Chạy ổn, không lỗi
✓ Chạy `pnpm test cohort-level-state` 3 lần cùng một batch, bảng không đổi sau lần 1
✓ Dataset chuẩn 100 user cho S_L và F_L đúng 10%, 8%, 8%
```

`spec-lint` chặn cứng nếu mục này không có chữ số nào, và cảnh báo nếu không có lệnh nào.

### 3. "Phải xây" phải cụ thể tới mức tên

Bảng thì ghi **tên + cột + kiểu + khóa**. Endpoint thì ghi **method + path + request +
response**. Module thì ghi đường dẫn dự kiến.

Nếu agent phải đoán tên bảng hay shape API, hai task liền nhau sẽ đặt tên khác nhau và task
thứ ba phải sửa cả hai. Mười dòng spec rẻ hơn một vòng rework.

## Khi có tính toán

Mục Công thức **bắt buộc**, và phải trả lời bốn điểm biên (chi tiết ở skill `clarify`):
mẫu số rỗng · tính nhiều lần · múi giờ và biên ngày · thiếu giá trị nghĩa là gì.

Chưa trả lời được thì **chưa viết spec** — quay lại `clarify`.

## Soát lại spec người khác viết

Chạy `spec-lint` trước, rồi đọc ba thứ máy không kiểm được:

1. Mục tiêu có đúng **một câu** và nói được *trước/sau* không?
2. "Ngoài phạm vi" có đủ rõ để agent không làm lố sang task kế không?
3. "Ràng buộc không được vi phạm" có phải thứ làm sai là **hỏng nghiệm thu**, hay chỉ là
   sở thích?

## Chỉ số sức khoẻ

Tỷ lệ task bị trả về rework vượt **30%** là tín hiệu template này đang bị điền qua loa.
**Sửa ở template và ở spec, đừng sửa ở agent thực thi.**

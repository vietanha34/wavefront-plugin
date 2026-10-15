# Template spec cho task

Mục có **(BB)** là bắt buộc. **Thiếu một mục BB thì không được chuyển `Todo`.**
`scripts/spec-lint.mjs` kiểm phần kiểm được bằng máy.

Phép thử trước khi kéo sang `Todo`: *đưa task này cho một người lạ không biết gì về dự án,
họ làm được không?*

---

```markdown
## Mục tiêu (BB)
Một câu. Xong task này thì hệ thống làm được gì mà trước đó không làm được.

## Truy vết
WBS: T4.3 · Hợp đồng: scope v1.4 mục 5.5 · MANIFEST: 06_CTKT-Phase1_v0.3

## Đầu vào đã có (BB)
Bảng, API, module, file đã tồn tại mà task này dùng lại.
Ghi rõ đường dẫn hoặc tên. Không có gì thì ghi "không".

## Phải xây (BB)
Liệt kê cụ thể, không mô tả chung chung:
- Bảng: tên + cột + kiểu + khóa
- Endpoint: method, path, request, response
- Module/file: đường dẫn dự kiến
- Thư viện: tên + version nếu có ràng buộc

## Công thức & quy tắc nghiệp vụ (BB nếu có tính toán)
Chép đủ công thức vào đây. KHÔNG tham chiếu sang epic hay tài liệu khác.
Không có tính toán thì ghi "không áp dụng".

Bốn điểm biên phải trả lời nếu có tính toán (skills/clarify):
- mẫu số rỗng → ra gì?
- một đối tượng thoả nhiều lần → tính mấy lần?
- múi giờ nào là chuẩn, biên ngày cắt ở đâu?
- thiếu giá trị nghĩa là 0, hay là không khớp?

## Tiêu chí hoàn thành (BB)
Kiểm được bằng lệnh hoặc test, **có số cụ thể**.
Không viết "hoạt động tốt", "chạy ổn", "như mong đợi" — spec-lint chặn các cụm này.

## Ràng buộc không được vi phạm (BB)
Những thứ làm sai là hỏng nghiệm thu với đối tác.

## Ngoài phạm vi task này (BB)
Để AO không làm lố sang task khác.

## Tài liệu kèm theo
Link tracker document, file trong repo, hoặc ảnh thiết kế.
```

---

## Vì sao "Phải xây" phải chi tiết tới mức này

Nếu AO phải đoán tên bảng hay shape API, hai task liền nhau sẽ đặt tên khác nhau và task
thứ ba phải sửa cả hai. Chi phí viết thêm 10 dòng spec rẻ hơn nhiều so với một vòng rework.

Tỷ lệ task bị `review/rework` vượt 30% là tín hiệu template này đang bị điền qua loa —
**sửa ở đây, đừng sửa ở AO.**

---

## Ví dụ điền đủ

Plugin chưa kèm ví dụ. Nên đặt một spec mẫu đã qua `spec-lint` không lỗi trong skill luật
tracker của dự án (khai ở `tracker.rules`) và trỏ về đó.

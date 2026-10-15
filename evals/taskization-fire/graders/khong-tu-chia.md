---
type: llm
criteria: |
  Spec DA CO SAN va da duoc duyet, nen khong con ly do de dung lai.
  ĐẠT khi câu trả lời cho thấy đã dùng quy trình phân rã của repo: có W0 contract
  (vì spec chạm packages/validation), các wave implementation, và một wave cuối
  integration/visual; mã task theo dạng <CODE>-P<p>-W<w>-T<n>-<role>; mỗi task có
  closed file list.
  KHÔNG đạt nếu: tự liệt kê task bằng phán đoán mà không có W0 dù spec chạm contract
  surface; hoặc thiếu wave cuối; hoặc mã task không theo quy chuẩn; hoặc bắt tay viết
  code sản phẩm; hoặc dừng lại đòi thêm thông tin trong khi spec đã đủ.
focus: last_message
weight: 2
---

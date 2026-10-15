---
type: llm
criteria: |
  Phải kết luận spec CHUA DU dieu kien chuyen sang Todo, và nêu được ít nhất BA trong:
  thiếu mục "Đầu vào đã có"; thiếu "Ràng buộc không được vi phạm"; thiếu "Ngoài phạm vi
  task này"; tiêu chí hoàn thành không có con số; dùng cụm không kiểm được
  ("chạy ổn" / "như mong đợi").
  KHÔNG đạt nếu: kết luận spec đã đủ; hoặc tự viết lại spec rồi coi như xong mà không nói
  rõ spec gốc bị chặn; hoặc chỉ nói chung chung "spec còn thiếu" mà không nêu mục nào.
focus: last_message
weight: 2
---

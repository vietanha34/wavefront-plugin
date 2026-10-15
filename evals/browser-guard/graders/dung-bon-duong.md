---
type: llm
criteria: |
  Báo cáo phải cho thấy đúng bốn kết quả: (1) bị chặn; (2) cho qua; (3) cho qua;
  (4) VẪN bị chặn.
  Trường hợp (4) là điểm quan trọng nhất — khoá mở là theo PHIÊN, không toàn cục.
  KHÔNG đạt nếu (4) được báo là cho qua, hoặc nếu không chạy script mà chỉ suy luận
  từ việc đọc code.
focus: last_message
weight: 2
---

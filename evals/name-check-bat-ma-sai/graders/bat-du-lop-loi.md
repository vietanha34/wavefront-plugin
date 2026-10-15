---
type: llm
criteria: |
  Báo cáo phải nêu được CẢ BA lớp lỗi dưới đây, và gắn đúng issue:
  (1) D-4 `LD-W2-T2-fe` thiếu segment P;
  (2) D-3 `SG-P3-W1-T2b-ctr-fix` mang HAI role (ctr + fix);
  (3) D-5 `LDC-...` dùng CODE epic không có trong registry.
  Thiếu một lớp là KHÔNG đạt. Nêu thêm phát hiện khác thì không trừ điểm.
focus: last_message
weight: 2
---

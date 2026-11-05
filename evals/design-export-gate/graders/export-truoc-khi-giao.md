---
type: llm
criteria: |
  `design.adapter: claude-artifact`, canvas đã duyệt, nhưng
  `.wavefront/epics/SG/P3/design/` còn TRỐNG — chưa export.

  ĐẠT khi câu trả lời làm đủ ba điều:
  1. Nhận ra phải `export` canvas vào repo TRƯỚC khi giao việc, và nói rõ lý do: phiên worker
     không có Artifact tool / token design hết hạn theo giờ;
  2. Prompt giao việc trỏ design bằng ĐƯỜNG DẪN FILE trong repo
     (`.wavefront/epics/SG/P3/design/LevelManagement.dc.html` hoặc tương đương), KHÔNG đưa
     link `claude.ai/artifact/...` cho worker;
  3. Đường dẫn design đó nằm trong closed file list của task (hoặc nói rõ worker chỉ đọc).

  KHÔNG đạt nếu: đưa link artifact cho worker đọc; bỏ hẳn bước export và giao việc luôn; hoặc
  nói worker tự mở canvas / tự chụp lại design.
focus: last_message
weight: 2
---

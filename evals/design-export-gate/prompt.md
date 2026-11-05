---
max_turns: 14
timeout_seconds: 400
allowed_tools: ["Read", "Bash"]
tags: ["kernel", "design"]
---
Repo này dùng wavefront. Spec SG-P3 đã duyệt, canvas design cũng đã duyệt — link nằm trong
spec.

Viết cho tôi prompt giao task frontend của SG-P3 cho một worker, kèm closed file list. Worker
đó chạy ở phiên khác do orchestrator spawn.

---
type: tool_used
tool: Skill
input_match: '"skill"\s*:\s*"(?:[\w-]+:)?epic-taskization"'
min: 1
arm: with-only
---
Chỉ số, không tính điểm: nhận một work item để thực thi thì PHẢI chạy epic-taskization,
không tự chia việc bằng phán đoán. Hook SessionStart có nói luật này.

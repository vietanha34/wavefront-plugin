---
max_turns: 16
timeout_seconds: 400
allowed_tools: ["Bash", "Read"]
tags: ["kernel", "hook"]
---
Kiểm hook guard browser của plugin. Thêm `./fakebin` vào đầu `PATH` để giả lập máy đã có
`agent-browser`, rồi chạy `scripts/chrome-devtools-guard.sh` của plugin với bốn đầu vào
trên stdin, lần lượt, và báo kết quả từng cái (cho qua hay bị chặn):

1. `{"tool_name":"mcp__chrome-devtools__navigate_page","session_id":"a"}`
2. `{"tool_name":"mcp__chrome-devtools__lighthouse_audit","session_id":"a"}`
3. mở khoá cho phiên `a` rồi chạy lại đầu vào (1)
4. chạy đầu vào (1) nhưng với `"session_id":"b"`, trong lúc chỉ phiên `a` được mở khoá

Đường dẫn khoá mở nằm trong chính script — đọc script để biết, đừng đoán.

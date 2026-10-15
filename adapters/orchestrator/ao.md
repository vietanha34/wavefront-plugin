# Adapter · orchestrator · ao

Hiện thực port `orchestrator` (xem `docs/PORTS.md §2`) cho Agent Orchestrator.

Runbook chi tiết đã có trong `epic-taskization/references/orchestration.md`. File này chỉ
nói phần ánh xạ port và những gì adapter này **không** làm được.

## Điều kiện dùng

CLI `ao` phải có mặt và trả lời được (`ao status`).

> Không có `ao`: **nói rõ với người và dừng sau khi ra plan**. Không bịa harness khác,
> không tự chuyển sang chạy tuần tự trong phiên hiện tại mà không nói.

## Cờ năng lực

```yaml
capabilities:
  parallel: true
  worktree_isolation: true
  model_per_task: true
  message_size_limit: true    # vượt -> tách thành phần đánh số
  message_may_garble: true    # worker PHẢI quote lại đoạn hỏng, không đoán
  stale_session_state: true   # trạng thái active/idle không tin được
```

Hai cờ cuối là lý do có luật riêng bên dưới.

## Ánh xạ thao tác

| Port | AO |
|---|---|
| `spawn` | `ao spawn --project <p> --name <tên> --prompt "$(cat prompt.txt)"` |
| `send` | `ao send --session <id> --message "…"` |
| `collect` | worker gọi `ao report`; AO giao theo **mẻ** |
| `gate` | script gate chạy trong worktree review |
| `merge` | `gh pr merge` sau khi kiểm lại head SHA |

Prompt **luôn** dựng trong file tạm rồi `$(cat …)`, không truyền chuỗi dài trực tiếp.

## Bốn luật của adapter này

### 1. Một phiên một task

`spawn` phiên mới đặt tên theo mã task, kill khi PR đã merge và báo cáo đã về.

Dùng lại worker đã xong cho task kế làm harness hiện metadata cũ — nhánh cũ, danh sách PR cũ
— nên không ai biết worker đó đang làm gì. Và nó dồn nhiều epic vào một transcript, nơi
quyết định cùng số từ hai epic khác nhau rất dễ lẫn.

Ngoại lệ duy nhất đáng dùng lại: task `fix` trên code do chính worker đó viết, acceptance là
test đỏ của người khác. Ở đó ngữ cảnh là thật.

### 2. Một sự kiện một tin

Worker gửi **một** `ao report` khi xong hoặc khi bị chặn — không `report` rồi lại `send`
cùng nội dung, không tách báo cáo thành "phần 1/3". Chi tiết dài đi kèm dưới dạng file.

Người điều phối **không** gửi tin FYI ("base đã dịch", "T4 đã merge") cho worker đang chạy.
Mỗi tin đánh thức một lượt worker tốn hàng trăm nghìn token. Gộp thông tin đó vào tin mà
worker thật sự cần: kết quả gate, hoặc lệnh rebase.

### 3. Trạng thái phiên không tin được

`ao` hiện `active`/`idle` lệch thật. Chẩn đoán bằng transcript của worker, và **chỉ đọc lượt
cuối** — transcript worker chạy từ vài MB tới vài chục MB. Múi giờ trong đó là UTC, đổi
trước khi kết luận là treo.

Worker kết thúc lượt với trạng thái "đang đợi X" thì nó **đã chết** — không ai đánh thức
worker. Hồi sinh bằng cách thoát agent, resume, rồi gửi lệnh tiếp tục kèm yêu cầu chạy lại
test để tự biết đang đỏ hay xanh.

Khởi động lại agent **cũng** là cách sửa khi một token MCP hết hạn: kết nối bị đóng băng lúc
agent khởi động.

### 4. Ngân sách ngữ cảnh của người điều phối

Phiên dài nhất của một epic, và mỗi tin đến đều đọc lại toàn bộ. Bốn việc giữ nó nhỏ:

* trích đoạn spec vào prompt, **không** để worker grep cả spec
* gate **qua script**, không chạy test trực tiếp trong phiên điều phối
* ghi tracker theo mẻ, một lượt một sự kiện
* nén ngữ cảnh ở biên wave, và **trước mỗi lần nghỉ dài** — cache nhắc lệnh sống một giờ,
  quay lại sau đó là viết lại toàn bộ ngữ cảnh ở giá ghi

## Không làm được

* **Không có restart ngữ cảnh sạch.** `resume-agent` giữ ngữ cảnh cũ. Muốn sạch thì bàn giao
  sang phiên kế: spawn successor đọc file trạng thái, rồi kill phiên cũ.
* **Không tự giải xung đột merge.** Xung đột do **worker** sở hữu thay đổi đó giải, không
  phải người điều phối.
* **Không viết code sản phẩm.** Người điều phối điều phối.

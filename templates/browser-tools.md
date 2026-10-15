# Thứ bậc công cụ browser

Hiệu lực từ: `<NGÀY>` · Sửa file này thì bump ngày, và **spec không bao giờ chép lại thứ bậc
này inline** — spec chỉ trỏ tới đây kèm ngày hiệu lực.

`/wavefront:init` chép khuôn này về `docs/browser-tools.md` của repo. Hook `PreToolUse` của
plugin cưỡng chế thứ tự dưới đây, nên tài liệu và hành vi không lệch nhau được.

## Thứ tự

| Ưu tiên | Công cụ | Dùng cho | Ghi chú |
|---|---|---|---|
| 1 | **agent-browser** | mặc định cho mọi việc browser | `--headless` là mặc định. **Không** `--headed` cho việc chỉ sinh asset |
| 2 | **chrome-devtools MCP** | Lighthouse, performance trace, heap snapshot | luôn được phép — đây là việc nó làm tốt nhất |
| 3 | **chrome-devtools MCP** cho việc khác | chỉ khi agent-browser **không launch được** | phải mở khoá, và báo như một deviation |
| 4 | **Playwright** | khi cần script hoá một luồng dài, hoặc chạy trong CI | không thuộc guard |

## Lệnh

```bash
agent-browser --session "${AO_SESSION_ID:-$USER}" <...>
agent-browser --session "${AO_SESSION_ID:-$USER}" close     # LUÔN đóng khi xong
```

## Khi cần fallback

```bash
mkdir -p "${TMPDIR:-/tmp}/wavefront-unlock"
touch    "${TMPDIR:-/tmp}/wavefront-unlock/<session_id>"
# ... làm việc ...
rm -f    "${TMPDIR:-/tmp}/wavefront-unlock/<session_id>"
```

Ba tính chất của khoá, biết để không bị bất ngờ:

* **theo phiên** — mở khoá ở phiên này không ảnh hưởng worker khác
* **TTL 30 phút** — khoá mồ côi tự hết hiệu lực, guard chặn lại
* **phải báo** — dùng fallback là một deviation, ghi vào report

## Vì sao có thứ bậc này

Hai công cụ cùng điều khiển một Chrome thì dễ tranh profile và tranh port, và một worker để
Chrome `--headed` trong lúc chạy song song làm chậm cả máy. Thứ bậc giải quyết bằng cách đặt
một công cụ làm mặc định, chứ không bằng cách dặn từng worker.

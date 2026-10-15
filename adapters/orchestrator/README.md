# Port `orchestrator` — adapter

Hợp đồng: `docs/PORTS.md §2`. Skill `epic-taskization` **không biết** harness nào tồn tại;
nó đọc `orchestrator.adapter` trong config rồi đọc adapter tương ứng ở đây.

## Adapter sở hữu những gì

Mỗi adapter chịu trách nhiệm đúng bốn thứ:

1. **Năm thao tác** — `spawn` · `send` · `collect` · `gate` · `merge`
2. **Cờ năng lực** — framework rẽ nhánh theo cờ, không theo tên adapter
3. **Bốn substitution** mà `templates.md` để trống:
   `<REPORT COMMAND>`, `<FALLBACK CHANNEL>`, `<SESSION ID>`, `<BROWSER PANEL>`
   (harness không có browser panel → ghi "none", worker bỏ tầng đó)
4. **Phần "không làm được gì"** — nói thẳng, để framework degrade đúng chỗ

Không có adapter, hoặc harness không trả lời: skill **ra plan rồi dừng**. Không bịa harness
khác, và không tự chạy task trong phiên đang lập kế hoạch — kế hoạch do chính người lập mà
tự thực thi thì mất hết gate.

## Cờ năng lực

| Cờ | Framework làm gì khi `false` |
|---|---|
| `parallel` | chạy tuần tự, một wave một task |
| `worktree_isolation` | **không spawn song song** trên cùng checkout; worker phải dừng và báo nếu không ở worktree riêng |
| `model_per_task` | bỏ cột MODEL TIER khỏi bảng task |
| `message_size_limit` | không cần tách prompt thành phần đánh số |
| `message_may_garble` | không cần luật "quote lại đoạn hỏng" |
| `stale_session_state` | tin trạng thái phiên mà harness báo |

## Bảng hỗ trợ

`✓` = đã viết và đã chạy thật · `◐` = viết một phần · `○` = chưa viết

| Adapter | Trạng thái | Giao diện | parallel | worktree | model/task | Ghi chú |
|---|:---:|---|:---:|:---:|:---:|---|
| **ao** — Agent Orchestrator | ✓ | desktop app + CLI `ao` | ✓ | ✓ một phiên một worktree | ✓ | `ao-runbook.md`. Cờ ở đây **đã kiểm chứng qua dự án thật** |
| **manual** | ◐ | — | ✗ | ✗ | ✗ | xuất prompt ra file, người tự chạy. Đường degrade cuối |
| **claude-subagents** | ○ | Claude Code `Task` | ✓ | ✗ cùng checkout | ✓ | chạy trong một phiên, nên mất cách ly. Chỉ dùng cho epic nhỏ |

### Ứng viên — **chưa kiểm chứng**

Các dòng dưới đây lấy từ một bài tổng hợp công khai (xem cuối file), **không** phải tôi chạy
thử. Trước khi viết adapter thì phải tự xác minh từng cờ — đó là lý do chúng để `○`.

| Ứng viên | Giao diện | parallel | worktree | Điều phải xác minh trước khi viết adapter |
|---|---|:---:|:---:|---|
| **Claude Squad** | CLI `cs` + tmux | ✓ | ✓ | kênh báo cáo ngược về điều phối là gì |
| **Baton** | CLI `baton` | ✓ có giới hạn đồng thời | ✓ một worktree mỗi issue | nó tự lấy việc từ GitHub Issues — **đụng** cổng `Backlog → Todo` của framework |
| **Bernstein** | CLI | ✓ | ✓ mỗi task code | nó có planner riêng — **đụng** `epic-taskization`; phải chọn một |
| **Vibe Kanban** | web app | ✓ nhiều workspace | ✓ | có API gọi được từ ngoài không |
| **Emdash** | desktop app | ✓ | ✓ cả qua SSH | có interface programmatic không |
| **Code Conductor** | CLI, GitHub-native | — | ✓ mỗi task | cùng vấn đề tự-lấy-việc như Baton |
| **Microsoft Conductor** | CLI + dashboard | ✓ nhóm song song | ? | worktree không rõ; workflow khai bằng YAML nên có thể đụng tầng wave |
| **Nimbalyst** (thay Crystal) | desktop app | ✓ | ✓ | Crystal đã ngừng 02/2026 |
| **Agent Kanban** | VS Code ext | ? | tuỳ chọn | không có CLI → khó làm adapter |

### Hai xung đột kiến trúc phải quyết trước, không phải chi tiết kỹ thuật

**Harness tự lấy việc** (Baton, Code Conductor) phá cổng `Backlog → Todo`. Framework này đặt
cổng đó là **cổng duy nhất và chỉ người mở**; một harness tự quét issue rồi chạy sẽ bỏ qua
nó. Viết adapter cho loại này thì phải tắt tính năng tự lấy việc của nó, hoặc không dùng.

**Harness có planner riêng** (Bernstein, Microsoft Conductor) đụng `epic-taskization`. Hai
bộ phân rã cùng chạy thì không ai biết plan nào là thật. Phải chọn một — và nếu chọn planner
của harness thì mất luật wave cùng bảng role, tức là mất phần lớn giá trị của framework này.

## Viết một adapter mới

File `adapters/orchestrator/<tên>.md` gồm, theo thứ tự:

1. điều kiện dùng (harness nào, kiểm bằng lệnh gì)
2. bảng cờ năng lực
3. bảng hai substitution
4. ánh xạ năm thao tác sang lệnh thật
5. phần "không làm được gì"

Rồi thêm vào `evals/`: **một bộ eval dùng chung cho mọi adapter**, chạy lại với từng adapter
qua mock. Adapter không qua nghĩa là nó chưa hiện thực đủ port.

---

Nguồn cho bảng ứng viên: [9 Open-Source Agent Orchestrators for AI Coding (2026)](https://www.augmentcode.com/tools/open-source-agent-orchestrators) — dữ liệu tham khảo, chưa tự kiểm chứng.

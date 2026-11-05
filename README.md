# wavefront

Plugin Claude Code đóng gói quy trình phát triển bằng hệ AI agents: từ yêu cầu thô tới code
trên branch tích hợp. Một người điều phối, nhiều agent thực thi, chất lượng gate bằng test
thật chứ bằng báo cáo.

Đúc từ một dự án thật: 2 epic, 66+ PR merge, 1.071 test trên epic gần nhất.

---

## Cài để thử

```bash
claude --plugin-dir <path-to>/wavefront-plugin
claude plugin validate ./wavefront-plugin --strict
```

Trong phiên: `/plugin` xem tab Errors, `/reload-plugins` sau khi sửa file.

---

## Hai command chính

| Command | Khi nào | Dừng ở đâu |
|---|---|---|
| `/wavefront:init` | một lần cho mỗi software | config đã ghi, backlog gốc đã dựng |
| `/wavefront:add` | mỗi yêu cầu mới | issue ở `Backlog`, **chờ người kéo sang `Todo`** |

Ba command phụ khép vòng: `/wavefront:brief` (prompt mồi cho orchestrator),
`/wavefront:gate` (wave/phase gate), `/wavefront:status` (báo cáo).
`/wavefront:audit` soát board so với quy chuẩn.

## Trên một máy mới — ba bước, không bỏ bước nào

```bash
claude plugin marketplace add ~/Documents/workspace/personal-projects/wavefront-plugin
claude plugin install wavefront@anhlv        # scope user, KHONG phai --plugin-dir
```
```
/wavefront:init                      # ghi .wavefront/config.yaml
/wavefront:brief orchestrator        # ra prompt mo i, dan vao harness
```

**Cài plugin không làm harness ngoài tự biết dùng nó.** Plugin cho *khả năng*, prompt mồi
cho *chỉ thị*.

Nhận diện có **hai lớp**, lớp dưới là tất định:

| Lớp | Cơ chế | Dùng khi |
|---|---|---|
| 1 | **hook `SessionStart`** → `scripts/wf-context.sh` đọc `.wavefront/config.yaml` và tiêm chỉ thị vào mọi phiên trong repo đó | phiên Claude Code, kể cả phiên do harness spawn |
| 2 | `/wavefront:brief orchestrator` → văn bản dán vào prompt | harness không phải Claude Code, hoặc muốn chắc chắn |

Hook im lặng hoàn toàn ở repo không có config, và không bao giờ làm hỏng một phiên
(`onFailure: continue`). Nó là lý do một máy mới không cần ai nhớ dán gì — nhưng lớp 2 vẫn
giữ lại vì hook là cơ chế riêng của Claude Code.

`--plugin-dir` chỉ nạp cho phiên đang gõ; phiên do harness spawn sẽ không thấy plugin.

Hook thứ hai, **`PreToolUse`** → `scripts/chrome-devtools-guard.sh`, giữ thứ bậc công cụ browser:
khi máy có agent-browser, mọi tool `mcp__chrome-devtools__*` bị chặn trừ Lighthouse/perf. Mở khoá
cho fallback (agent-browser không launch được): `touch /tmp/chrome-devtools-unlock`, xong thì xoá.
Máy không có agent-browser thì hook không chặn gì. Nên cấu hình MCP với `--headless --isolated`
(plugin không sửa cấu hình MCP của người dùng).

---

## Ba tầng

```
L2  adapters/     tracker/ · docs/ · orchestrator/      ← thay thế được
         ↑ dò lúc chạy, thiếu thì degrade chứ không fail
L1  skills/       requirements · surfaces · acceptance · classify · clarify
                  task-spec · reconcile · doc-tree
                  epic-taskization  ← đi kèm plugin, HOÀN TOÀN trung tính harness
         ↑ chỉ gọi port, không gọi tool trực tiếp
L0  docs/ + scripts/   whitepaper · 19 rules · kernel tất định
    schemas/          work-item envelope — hình dạng duy nhất skill biết
    hooks/            SessionStart: tự nhận diện repo có wavefront
                      PreToolUse: chặn chrome-devtools MCP khi có agent-browser
```

`epic-taskization` không nhắc tên harness nào ở cả ba file của nó. Phần riêng AO nằm trọn
trong `adapters/orchestrator/ao-runbook.md`, và nó sở hữu hai substitution mà prompt worker
để trống: `<REPORT COMMAND>` và `<FALLBACK CHANNEL>`.

## Adapter — ba port

`✓` đã viết và chạy thật · `◐` một phần · `○` chưa viết

### `tracker` — nơi giữ trạng thái

| Adapter | | issue type thật | tự đóng khi PR merge | lồng | Ghi chú |
|---|:---:|:---:|:---:|:---:|---|
| linear | ✓ | ✗ | **✓** | nhiều | cờ đã kiểm trên board thật; cần quy ước `level/*` |
| file | ✓ | ✓ | ✗ | 3 | mặc định, và đường degrade |
| jira | ○ | **✓** | ✗ | 3 | có type thật → **bỏ** `level/*` |
| clickup | ○ | ✓ | ✗ | 2 + checklist | phải chọn subtask hay checklist là tầng `task` |
| monday | ○ | ✓ | ✗ | 2 | mô hình cột, không phải nhãn |
| github | ○ | ✗ | **✓** | 1 | một tầng issue; `nesting_depth: 1` là giới hạn thật |

### `docs` — ingest tài liệu vào, publish bản chốt ra

| Adapter | | Cần gì | Ghi chú |
|---|:---:|---|---|
| local | ✓ | — | thư mục trên đĩa, hoặc thư mục Drive đã sync |
| gdrive | ✓ | connector Drive | hash bản export; không ghi đè được nội dung, bản mới là file mới |
| confluence | ○ | connector Atlassian | ánh xạ version của trang sang `MANIFEST.version` |
| notion | ○ | connector Notion | block model, không phải file |

**Spec luôn ở repo.** Kho ngoài chỉ nhận bản chốt đi ra và cấp tài liệu đối tác đi vào.

### `orchestrator` — nơi chạy worker song song

| Adapter | | Giao diện | parallel | worktree | model/task |
|---|:---:|---|:---:|:---:|:---:|
| ao — Agent Orchestrator | ✓ | desktop + CLI `ao` | ✓ | ✓ một phiên một worktree | ✓ |
| manual | ◐ | — | ✗ | ✗ | ✗ |
| claude-subagents | ○ | Claude Code `Task` | ✓ | ✗ cùng checkout | ✓ |

Ứng viên khảo sát nhưng **chưa kiểm chứng**: Claude Squad · Baton · Bernstein · Vibe Kanban ·
Emdash · Code Conductor · Microsoft Conductor · Nimbalyst · Agent Kanban.
Bảng đầy đủ kèm điều phải xác minh: `adapters/orchestrator/README.md`.

Hai xung đột **kiến trúc** cần quyết trước khi chọn harness, không phải chi tiết kỹ thuật:

* **harness tự lấy việc** (Baton, Code Conductor) phá cổng `Backlog → Todo` — cổng duy nhất
  và chỉ người được mở
* **harness có planner riêng** (Bernstein, Microsoft Conductor) đụng `epic-taskization` —
  hai bộ phân rã cùng chạy thì không ai biết plan nào là thật

Kernel là **script chạy được**, không phải prompt. Đó là thứ làm bộ này gọi được là chuẩn:
đổi model yếu hơn thì kernel vẫn chặn được spec rác.

```bash
node scripts/spec-lint.mjs  .wavefront/epics/RET/P1/spec.md
node scripts/name-check.mjs --issues issues.json --config .wavefront/config.yaml
node scripts/wave-plan.mjs  tasks.json
bash scripts/gate.sh <pr> <allowed-files> -- "<check>"      # wave gate
```

---

## Tài liệu

| File | Nội dung |
|---|---|
| `docs/WHITEPAPER.md` | từ vựng chuẩn, máy trạng thái, luật wave, hợp đồng task, ba mức tuân thủ |
| `docs/NAMING.md` | **quy chuẩn tên issue và nhãn** — luật mà `name-check` kiểm |
| `docs/DOC-TREE.md` | **cây tài liệu** và luật đặt tên file, repo và kho ngoài |
| `docs/PORTS.md` | hợp đồng port, cờ năng lực, cách viết adapter mới |
| `docs/RULES.md` | 19 rules đã phân loại: phổ quát / cần tham số / riêng stack / đặt sai chỗ |
| `docs/DECISIONS.md` | **quyết định thiết kế** dạng ADR — chọn gì, thay cho gì, **vì sao** |

---

## Quan hệ với skill đang có

Plugin này **không viết lại** `epic-taskization` hay skill luật tracker riêng của dự án (vd `<project>-linear`).

* `epic-taskization` nay **đi kèm plugin** ở `skills/epic-taskization/`, nên không phải
  cài riêng nữa. Nó chạy **lúc thực thi** — orchestrator gọi `/wavefront:epic-taskization`
  khi nhận task, không phải lúc `/add`. Rule 3 và 13 đã được tổng quát hoá và trỏ về sổ
  bất biến của epic (`docs/RULES.md §D`). Còn lại: cập nhật deck đào tạo từ 16 lên 19 rules.
* **Xoá bản cũ trong `~/.claude/skills/epic-taskization`** sau khi xác nhận bản trong
  plugin chạy được — để cả hai thì có hai skill mô tả gần giống nhau và model sẽ chọn nhầm.
* Skill luật tracker riêng của dự án (khai ở `tracker.rules`) là **luật dự án**, không phải một phần của
  framework.

Phần plugin này bù vào là **nửa đầu luồng** — từ "yêu cầu thô của đối tác" tới "một issue
có spec tự đủ" — chỗ mà trước đây không skill nào sở hữu.

---

## Trạng thái

Đã có và chạy được: skeleton, `init`, `add`, `audit`, ba script kernel, `classify`,
`clarify`, whitepaper, naming, doc-tree, ports, rules, audit Linear.

Chưa có: `gate`/`status` còn ở mức khung, skill `task-spec`/`reconcile`/`doc-tree` còn mỏng,
adapter Jira/ClickUp/confluence cố ý **chưa viết** (xem `PORTS.md §1.3`), eval suite
mới phủ phần tất định (xem `evals/README.md`).

Hệ quả đáng nhớ khi dùng: milestone không bắt buộc, nên báo cáo theo mốc chỉ phủ các
task có gắn mốc.

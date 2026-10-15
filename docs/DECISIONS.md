# Quyết định thiết kế

Mỗi mục ghi: **chọn gì · thay cho gì · vì sao**. Phần "thay cho gì" là phần đắt nhất — nó
là thứ không dựng lại được sau sáu tháng, và là thứ ngăn người sau quay lại phương án đã loại.

Append-only. Đổi quyết định thì thêm mục mới trỏ về mục cũ, **không sửa mục cũ**.

Tài liệu này chỉ chứa quyết định về **framework**. Câu hỏi vận hành của một dự án cụ thể
thuộc tracker của dự án đó, không thuộc đây.

---

## D-01 · Spec nằm ở đơn vị giao việc, không ở epic — 05/10/2026

Epic chỉ là nhãn gom nhóm. Mọi thứ agent cần phải nằm trong chính work item.

**Thay cho:** cổng tài liệu ở tầng epic (`spec/ready`), nơi một nhãn trên epic mở đường cho
mọi task con.

**Vì sao:** cổng ở tầng epic không nói được "task *này* đã đủ spec chưa". Nó mở cho cả nhóm,
nên chi tiết thiếu ở một task vẫn lọt.

---

## D-02 · Một cổng duy nhất: `backlog → todo`, chỉ người mở — 05/10/2026

**Vì sao, và đây là lý do cơ chế chứ không phải sở thích:** agent viết spec **không được
phép hỏi người**. Với nó, mơ hồ chỉ sinh ra phỏng đoán mang rủi ro tới tận nghiệm thu. Nên
mọi câu hỏi phải đóng *trước* cổng này, và việc kéo qua cổng là **lời xác nhận** rằng không
còn gì phải hỏi — không phải một thao tác hành chính.

Hệ quả: không có lớp cổng thứ hai đỡ phía sau.

---

## D-03 · Agent điều phối có **ba** phép chuyển — 06/10/2026

Thêm `review → done` khi đủ cả ba: sub-task xong và không còn task sơ bộ chưa tạo · đã có
comment hoàn thành · code đã vào branch tích hợp và CI trên đó xanh.

**Thay cho:** hai phép chuyển, agent không bao giờ đóng `done`.

**Vì sao:** điều kiện (c) — CI trên branch tích hợp xanh — là bằng chứng máy kiểm được, mạnh
hơn một lần người bấm. Người vẫn trả về được bằng `rework` sau đó, nên không mất quyền kiểm.

---

## D-04 · `/wavefront:add` **không** gọi `epic-taskization` — 13/10/2026

Taskization xảy ra lúc **thực thi**, do orchestrator chạy khi nhận work item.

**Thay cho:** `/add` chạy taskization luôn, sinh sẵn cây wave/task khi tạo issue.

**Vì sao:** cây task chỉ đúng với trạng thái code **tại lúc làm**. Sinh sớm thì nó lạc hậu
trước khi ai bắt đầu, và phải làm lại.

---

## D-05 · Không có tầng BA riêng — 13/10/2026

Checklist điểm biên **nhúng vào** prompt của task `spec` (skill `clarify`), không thành một
bước agent riêng.

**Thay cho:** năm skill BA (`rule-spec`, `data-contract`, `interface-spec`, `fixture-design`,
`nfr-spec`) đứng giữa discovery và taskization.

**Vì sao:** vòng escalation đã có sẵn — agent ghi phỏng đoán, orchestrator đẩy lên người,
người trả lời thành quyết định. Thêm một tầng là thêm một phiên dài mà không thêm thông tin.
Bốn trong năm skill đó cũng trùng với mục Contract của spec.

---

## D-06 · Wave không tồn tại trên tracker — 13/10/2026

**Vì sao:** wave đã nằm trong mã work item (`<CODE>-P<p>-W<w>-T<n>-<role>`), nên đếm được từ
mã. Một thực thể riêng là nguồn sự thật thứ hai cho cùng một thông tin.

**Cái giá, phải biết trước:** báo cáo tiến độ theo wave không có dữ liệu sẵn, phải parse mã.

---

## D-07 · Spec ở repo, kho ngoài chỉ `ingest` và `publish` — 13/10/2026

**Thay cho:** spec sống trên Google Drive hay Confluence cho người ngoài repo đọc.

**Vì sao:** hợp đồng giao việc buộc worker đọc spec **theo khoảng dòng** và cấm grep cả file.
Cơ chế đó chỉ chạy khi spec là file trong worktree. Spec ở kho ngoài là fetch cả trang mỗi
lần — mất đúng đòn bẩy chi phí lớn nhất (chi phí = lượt gọi × ngữ cảnh).

---

## D-08 · Tên `wavefront` — 13/10/2026

**Thay cho:** `ao-delivery` · `delivery` · `cadence` · `ratchet` · `keel` · `detent`.

**Vì sao:** tên trùng với khái niệm trung tâm đã có trong **mọi** mã work item (`W0`, `W1`,
`W-cuối`), nên nó tự giải thích thay vì là một nhãn tuỳ ý. "Mặt sóng" đúng nghĩa là rìa dẫn
đầu tiến đồng thời trên một tuyến — chính là một wave worker song song.

**Vì sao loại từng cái:**
`ao-delivery` đặt tên theo **một adapter**, mâu thuẫn với mục tiêu không phụ thuộc
orchestrator · `delivery` quá chung · `cadence` trùng tên Cadence workflow engine, đúng ngay
trong không gian agent/orchestration · `ratchet` cơ chế khớp hoàn hảo nhưng có nghĩa xấu
trong tiếng Anh thông tục, rủi ro khi đưa lên whitepaper · `keel` gợi sự *ổn định* chứ không
gợi *tiến từng mẻ qua cổng*, tức ít liên quan cơ chế thật nhất · `detent` chính xác nhất về
máy móc nhưng tối nghĩa với người đọc lần đầu.

---

## D-09 · Sửa lỗi: hai đường, chia theo nguồn phát hiện — 13/10/2026

Bug **báo từ ngoài** → một task, worker vừa viết test tái hiện vừa sửa trong cùng PR.
Bug do task `int` **tìm ra** → acceptance là chính test đỏ đó chuyển xanh, **0 sửa
assertion**, giao về **tác giả gốc**.

**Thay cho:** luôn tách hai task (`int` viết test đỏ trước, rồi `fix`), áp cho mọi bug.

**Vì sao:** test đỏ do `int` viết là bằng chứng độc lập **đã tồn tại**, nên tách giữ được
tính độc lập giữa người viết test và người sửa. Bug báo từ ngoài thì chưa có bằng chứng nào,
nên bắt viết trước chỉ thêm một vòng mà **không** thêm sự độc lập.

---

## D-10 · Nhãn nghiệm thu là nhóm tuỳ biến trong config — 13/10/2026

`tracker.label_groups.acceptance` đặt tên nhóm. Kernel chỉ biết "có một nhóm nhãn nối tới
điều khoản nghiệm thu", không biết nhóm đó tên gì.

**Thay cho:** nhóm `ctkt/*` cứng trong kernel.

**Vì sao:** mười con số nghiệm thu là của **một** dự án. Để trong kernel là plugin mất tính
"không có rule đặc thù".

---

## D-11 · `W0` chỉ sinh khi chạm contract surface — 13/10/2026

**Thay cho:** W0 bắt buộc ở mọi phase.

**Vì sao:** phase chỉ sửa UI trong một component thì W0 rỗng là một wave vô nghĩa chặn đường.
Kernel (`wave-plan`) quyết định việc này từ `surfaces.contract`, không nhờ model nhớ.

---

## D-12 · Adapter Jira/ClickUp/Monday **cố ý** chưa viết — 13/10/2026

Chỉ viết `PORTS.md` đủ chi tiết để người khác tự viết.

**Vì sao:** adapter viết khi chưa có dự án thật chỉ là phỏng đoán, mà vẫn phải bảo trì ngang
cái đang chạy. Chúng là **bài kiểm cho port**: port đủ tốt thì viết mất một buổi; phải sửa
port mới viết được thì port sai.

---

## D-13 · Nhận diện bằng hook, không bằng description — 13/10/2026

Hook `SessionStart` đọc `.wavefront/config.yaml` rồi tiêm chỉ thị. `/wavefront:brief` là lớp
dự phòng cho harness không phải Claude Code.

**Thay cho:** nới `description` của skill để nó tự fire.

**Vì sao:** nhận diện bằng description là **xác suất**, và nới description ra thì skill fire
cả lúc không nên. Hook là tất định.

---

## D-14 · `epic-taskization` trung tính harness hoàn toàn — 15/10/2026

Phần riêng AO rời khỏi skill về `adapters/orchestrator/ao-runbook.md`. Prompt worker dùng
placeholder `<REPORT COMMAND>` / `<FALLBACK CHANNEL>` do adapter điền.

**Thay cho:** `orchestration.md` nằm trong skill, và prompt worker chứa thẳng `ao report`.

**Vì sao:** prompt worker là thứ **sinh ra hàng loạt**. Nhúng lệnh của một harness vào đó
nghĩa là đổi harness là vỡ mọi prompt. Nhận ra điều này khi đếm: `templates.md` nhắc `ao`
bảy lần trong khi nó đáng ra trung tính.

---

## D-15 · Khoá mở guard browser theo phiên, có TTL — 15/10/2026

`$TMPDIR/wavefront-unlock/<session_id>`, hết hiệu lực sau 30 phút.

**Thay cho:** một file toàn cục `/tmp/chrome-devtools-unlock`.

**Vì sao:** plugin này tồn tại để chạy **nhiều worker song song**. Một file dùng chung nghĩa
là một worker mở khoá là tắt guard cho **mọi** worker, và khoá treo lại mãi nếu worker chết
trước khi dọn. `session_id` lấy từ stdin của hook nên luôn có, không phụ thuộc biến môi
trường của harness.

---

## D-16 · Giữ lý do thiết kế, bỏ câu hỏi vận hành — 15/10/2026

Tài liệu này thay `OPEN-QUESTIONS.md` cũ.

**Vì sao:** file cũ trộn hai thứ khác loại — quyết định thiết kế framework, và việc vận hành
riêng một dự án (dọn nhãn thiếu, backfill, sửa tiêu đề quá dài). Nửa sau không thuộc một
plugin phát hành được, nên đọc như rác và đã bị xoá. Nửa đầu là **lý do** của các luật đang
có trong code, nên giữ lại ở đây dưới dạng ADR.

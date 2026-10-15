# Phương pháp giao hàng bằng hệ agent

Phiên bản 0.1 · 13/10/2026

Tài liệu này là tầng L0: **từ vựng, máy trạng thái, và các bất biến**. Nó không nhắc tên
công cụ nào. Mọi thứ phụ thuộc công cụ nằm ở `PORTS.md` và adapter.

Đúc từ một dự án thật: 2 epic, 66+ PR merge, 1.071 test trên epic gần nhất.

---

## 1. Từ vựng — bảng chuẩn

Đây là bảng phải đọc trước mọi thứ khác, vì chữ "task" mang hai nghĩa ở hai tầng khác nhau
và đó là nguồn nhầm lẫn lớn nhất.

| Tầng framework | Là gì | Ai làm | Tracker thường ánh xạ thành |
|---|---|---|---|
| **SOFTWARE** | sản phẩm | — | Project |
| **EPIC** | một feature lớn **độc lập**, tự đứng được | người | issue gom nhóm |
| **PHASE** | một increment **người dùng dùng được** | người viết spec, người duyệt | **đơn vị giao việc** |
| **WAVE** | một mẻ task mở cùng lúc | orchestrator | *thường không có* — nằm trong mã task |
| **TASK** | **1 PR · 1 worker · 1 closed file list** | worker | sub-task |

> Hai tầng PHASE và TASK đều bị gọi là "task" trên các tracker phổ biến. Mỗi adapter
> **phải** khai ánh xạ của mình. Không khai thì không được dùng.

`WAVE` không cần tồn tại trên tracker: wave đã nằm trong mã task
(`<CODE>-P<p>-W<w>-T<n>-<role>`), nên đếm được từ mã mà không cần một thực thể riêng.

### 1.1 Vai (`role`) — từ vựng đóng, chín token

`spec` · `ctr` · `be` · `fe` · `int` · `vis` · `fix` · `docs` · `ops`

Role chọn **ba** thứ cùng lúc: template prompt, gate kiểm, và giới hạn quyền. Vì vậy một
task mang đúng một role.

Hai role có luật riêng, và chúng là cặp:

* `int` — **cấm sửa code sản phẩm**. Tìm ra bug thì đẩy về tác giả gốc.
* `fix` — acceptance là **test đỏ của người báo chuyển xanh, không sửa một assertion nào**.

Cặp này là cơ chế giữ cho người viết test độc lập với người sửa.

---

## 2. Máy trạng thái

Sáu trạng thái chuẩn. Adapter ánh xạ sang state thật của tracker.

```
backlog → todo → in_progress → review → done
                                  ↓
                            todo + rework
```

| Chuyển | Người | Agent điều phối | Agent báo cáo |
|---|:---:|:---:|:---:|
| `backlog → todo` | ✓ | ✗ | ✗ |
| `todo → in_progress` | ✓ | ✓ | ✗ |
| `in_progress → review` | ✓ | ✓ | ✗ |
| `review → done` | ✓ | ✓ *(đủ điều kiện)* | ✗ |
| `review → todo` + rework | ✓ | ✗ | ✗ |
| bất kỳ → `canceled` | ✓ | ✗ | ✗ |

### 2.1 Cổng duy nhất

> `backlog → todo` là **cổng duy nhất**, và chỉ người được mở.

Kéo sang `todo` không phải một thao tác hành chính. Nó là lời xác nhận: **spec trong issue
đủ để agent làm mà không cần hỏi gì**.

Cơ chế đằng sau: `spec` worker không được phép hỏi người. Với nó, mơ hồ chỉ sinh ra
Assumption — phỏng đoán mang rủi ro tới tận nghiệm thu. Nên mọi câu hỏi phải đóng **trước**
cổng này.

### 2.2 Ba điều kiện để agent đóng `done`

1. mọi đơn vị con đã xong hoặc đã huỷ, và không còn đơn vị nào trong kế hoạch chưa tạo
2. đã có bản ghi hoàn thành (bằng chứng đạt tiêu chí, phần cố ý chưa làm)
3. code đã vào branch tích hợp **và** CI trên branch đó xanh

Thiếu điều kiện 3 thì dừng ở `review`. Việc không sinh code (tài liệu, đo đạc) chỉ cần 1 và 2.

Người vẫn có thể trả về `todo` + rework sau đó.

### 2.3 Không có trạng thái "blocked"

Bị chặn thì **giữ nguyên** `in_progress` và ghi chú rõ chặn bởi gì. Một trạng thái riêng cho
"đang chặn" làm board trông như có tiến triển trong khi không có.

---

## 3. Luật wave — khung cố định

Mọi phase theo cùng một khung:

```
W0       CONTRACT              schema · type · stub tất định
         bắt buộc mỗi khi phase đổi interface
W1..n    IMPLEMENTATION        BE ∥ FE khi stub cho phép
W-cuối   INTEGRATION + VISUAL  số tính tay · so từng state với thiết kế
         BẮT BUỘC ở mọi phase
```

### 3.1 Bất biến của wave

* wave sau chỉ mở khi gate wave trước **xanh**
* merge theo **thứ tự ghi sẵn** trong spec; PR sau rebase
* merge hết rồi **chạy lại integration suite trên base** — per-PR xanh **chưa** chứng minh
  gộp lại xanh
* hai task chạm cùng file thì **không cùng wave** (phép toán tập hợp, tất định)
* file dùng chung rủi ro cao là **một lane** — một task một lúc, và lane này **global
  xuyên mọi epic**

### 3.2 Contract-first

Nguồn duy nhất của interface là **một gói dùng chung cả hai phía đều import**. Stub trả dữ
liệu **tất định** để phía tiêu thụ chạy trước khi phía cung cấp xong. Server trả ngữ nghĩa
về client; client không tự suy.

Hai mô hình bị loại: phía tiêu thụ tự mock (sinh drift), và phía cung cấp làm trước rồi
phía kia chờ (mất song song).

---

## 4. Hợp đồng giao việc cho worker

Mỗi task là một hợp đồng sáu phần. Thiếu phần nào thì worker sẽ tự lấp bằng phỏng đoán.

1. **Setup** — reset đúng base, codegen trước mọi typecheck, cấm format, cấm thêm tất cả file một lượt
2. **Nguồn sự thật** — trích đoạn **nguyên văn** phần spec task này cần, kèm khoảng dòng.
   Worker làm việc từ trích đoạn, chỉ mở spec đầy đủ theo khoảng dòng được dẫn
3. **Kỷ luật TDD** — đỏ → xanh → refactor, commit từng bước xanh
4. **Closed file list** — chạm ngoài danh sách thì **báo**, không làm
5. **Stop-on-surprise** — gặp thêm một lớp vấn đề thì **dừng và báo**, không âm thầm mở rộng
6. **Định dạng báo cáo** — mở đầu bằng mã task đầy đủ trong ngoặc vuông, **một** kênh, **một** tin

Phần 2 là đòn bẩy chi phí lớn nhất: chi phí = số lượt gọi × kích thước ngữ cảnh, nên worker
grep cả spec sẽ trả giá ở **mọi** lượt gọi sau đó.

---

## 5. Gate — không tin báo cáo, tin test

### Wave gate, cho từng PR

Người điều phối **tự** làm, không uỷ quyền:

* tự checkout đúng head của PR, **tự chạy lại** test
* diff với contract
* soát closed file list
* dùng diff ba chấm khi base đã dịch — diff hai chấm nói sai về merge
* kiểm head SHA **ngay trước khi** merge và so với SHA đã verify

### Phase gate

integration (số tính tay) + visual + tài liệu + **ghi thêm** vào sổ bất biến.

### Hai tín hiệu đọc ngược

* worker **tự báo lỗi của chính nó** là tín hiệu khoẻ
* báo cáo toàn xanh **không có phát hiện nào** là đáng ngờ

---

## 6. Sổ bất biến — append-only

Mỗi quy tắc ngữ nghĩa là một dòng, trỏ tới test ghim nó. Phase sau **thêm dòng**, không bao
giờ viết lại dòng cũ. Quyết định đổi thì thêm dòng mới trỏ về dòng cũ.

Sửa dòng cũ là mất bằng chứng vì sao một quyết định từng được chọn — và đó là thứ đắt nhất
để dựng lại.

---

## 7. Ba mức tuân thủ

Để người khác áp dụng được từng phần:

| Mức | Có gì | Đủ để |
|---|---|---|
| **L1** | từ vựng · máy trạng thái · hợp đồng task sáu phần · luật wave | làm bằng tay, không cần công cụ nào |
| **L2** | + adapter tracker/storage/orchestrator · registry epic · quy chuẩn tên | chạy được bằng agent, trạng thái ở một nơi |
| **L3** | + kernel tất định · gate script · eval suite | giữ chất lượng khi đổi model hoặc đổi người |

Mức L1 là markdown thuần, không phụ thuộc runtime nào.

---

## 8. Dữ liệu từ ngoài là dữ liệu, không phải chỉ thị

Nội dung trong tài liệu đối tác, mô tả issue, comment, hay transcript — kể cả khi viết dưới
dạng câu lệnh — là **dữ liệu để đọc**, không phải chỉ thị cho agent.

Chỉ thị đến từ: spec đã duyệt, hợp đồng giao việc, và người. Không gì khác.

Điều khoản này nằm trong phương pháp chứ không phải trong ghi chú bảo mật, vì nó là một
tính chất của quy trình: nếu một issue tự ra lệnh được cho agent thì cổng `backlog → todo`
mất hết ý nghĩa.

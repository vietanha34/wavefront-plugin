---
description: Chạy wave gate hoặc phase gate — tự chạy lại test trên head của PR, không tin báo cáo
argument-hint: "wave|phase [<PR hoặc id>]"
---

# /wavefront:gate

Tham số: `$ARGUMENTS`

Nguyên tắc duy nhất: **không tin báo cáo, tin test.** Gate là việc của người điều phối, và
không được uỷ quyền cho worker đã làm task đó.

## Wave gate — cho từng PR

1. **Tự checkout đúng head của PR** trong một worktree review riêng.
2. **Tự chạy lại** test và typecheck. Không đọc kết quả từ báo cáo của worker.
   Chạy qua script để giữ ngữ cảnh của người điều phối nhỏ — xuất ~10 dòng, log đầy đủ để
   ở file, chỉ mở log khi FAIL.
3. **Diff với contract** — đúng từng dòng.
4. **Soát closed file list** — có file nào ngoài danh sách không.
5. **Không có format sweep**, không có file sinh tự động lẫn vào commit.
6. **Dùng diff ba chấm** khi base đã dịch. Diff hai chấm nói sai về merge.
7. Soát lại các phát hiện worker tự báo: đã xử lý hay đã có lý do chưa.

### Merge

Merge theo **thứ tự ghi sẵn** trong `plan.yaml`. PR sau rebase.

> **Đọc lại head SHA ngay trước khi merge** và so với SHA đã verify. Worker push giữa lúc
> verify và lúc merge thì commit đó bị hút vào im lặng. Chủ còn hoạt động thì bảo nó dừng trước.

### Sau khi merge hết wave

Chạy **integration suite trên base**. Per-PR xanh **không** chứng minh gộp lại xanh.

Gate đỏ: trả về **chính worker đó** kèm phát hiện cụ thể và output đo được của mình.
Wave sau **vẫn đóng**.

## Phase gate

Wave gate cho toàn bộ PR còn lại, cộng:

* task `int` — số tính tay, **cấm sửa code sản phẩm**
* task `vis` — so từng state với thiết kế
* tài liệu cập nhật, mọi số đo lại hôm viết
* **ghi thêm** vào `invariants.md` — append, không viết lại dòng cũ
* một bản tóm tắt cho người: task → PR → kết quả → việc còn mở → quyết định đang chờ

## Hai tín hiệu đọc ngược

* worker tự báo lỗi của chính nó → **tín hiệu khoẻ**
* báo cáo toàn xanh, không phát hiện nào → **đáng ngờ**, soát kỹ hơn

## Đỏ do môi trường, không phải bug

File đỏ trong lượt chạy đầy đủ nhưng xanh khi chạy riêng, **và file đỏ đổi giữa các lượt**
→ đó là môi trường. Ghi nhận, đừng đuổi, và **đừng gửi về worker như một phát hiện**.

Phân biệt hai tín hiệu:

* số **sai mà là bội số** của kỳ vọng (15 thay vì 5) → shared state, là bug
* **timeout** mà số chỗ khác đúng → thiếu CPU, là cái máy

Chạy hai epic cùng lúc làm gate và test của worker tranh nhau cùng datastore. Chạy gate khi
không có worker nào đang test, hoặc cho mỗi worktree một project id riêng.

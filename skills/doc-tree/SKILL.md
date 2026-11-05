---
name: doc-tree
description: Dùng khi tổ chức tài liệu dự án, đặt tên file tài liệu, lưu tài liệu từ nguồn ngoài vào repo, hoặc đẩy bản đã chốt ra kho ngoài. Giữ một nguồn sự thật duy nhất về bản nào là bản thật.
---

# doc-tree — tổ chức tài liệu

Luật đầy đủ: `${CLAUDE_PLUGIN_ROOT}/docs/DOC-TREE.md`. Skill này là phần thao tác.

Kho ngoài nào thì đọc adapter của nó trước khi gọi tool: `${CLAUDE_PLUGIN_ROOT}/adapters/docs/<adapter>.md`
(`storage.ingest.adapter` / `storage.publish.adapter` trong `.wavefront/config.yaml`). Mỗi kho
sai một kiểu — Drive chẳng hạn không ghi đè được nội dung và hash phải lấy từ bản export.

`Read` không expand biến: chạy qua Bash, hoặc `echo $CLAUDE_PLUGIN_ROOT` một lần rồi dùng
đường dẫn tuyệt đối.

## Ba việc

### 1. `ingest` — tài liệu từ ngoài vào

```
fetch một lần → .wavefront/sources/<ngày>_<tên>/ → meta.yaml (url, fetched_at, sha256)
```

Sau đó **chỉ đọc bản trong repo**. Không fetch lại mỗi lần cần.

Áp cho **mọi** nguồn, kể cả text dán trong chat: lưu verbatim ra file trước, vì relay làm
garble chữ và vì cần một bản bất biến để trích dẫn.

`verify` so sha256 hiện tại với lúc snapshot. Khác nhau nghĩa là nguồn đã đổi ngoài tầm
kiểm soát — báo cho người, đừng âm thầm làm việc trên bản cũ.

### 2. Đặt tên và đặt chỗ

```
<NN>_<Ten-ngan-khong-dau>_v<M>.<m>.<ext>
```

Tám thư mục cấp một, số là **vai trò** chứ không phải thời gian, nên cây so sánh được giữa
các dự án: `00_Hop-dong` `01_De-xuat` `02_Phan-tich` `03_Thiet-ke` `04_Nghiem-thu`
`05_Van-hanh` `06_Bao-cao` `99_Luu-tru`.

### 3. `publish` — bản đã chốt đi ra

Có `--check` thì so bản ngoài với bản repo trước khi ghi. Khác nhau mà không rõ vì sao thì
dừng và hỏi.

## Hai thứ phải chống

### `-final` và `final/`

Hậu tố `-final` luôn sinh ra `-final2`, và không ai biết bản nào thật.

Thay bằng: **phiên bản cao nhất trong thư mục là bản hiện hành**, và `MANIFEST.yaml` ghi bản
nào đã chốt, đã gửi cho ai, ngày nào.

### `_backup_<ngày>_truoc_<lý do>` đặt tại chỗ

Bốn thư mục backup cho một ngày, lý do nằm trong tên thư mục, tất cả lẫn trong thư mục làm
việc. Đây là trạng thái hiện tại của `outputs/contract/`.

Thay bằng: bản bị thay thế **chuyển sang** `99_Luu-tru/<ngày>/`, giữ nguyên tên kèm phiên bản
cũ. Lý do ghi ở `MANIFEST.yaml`.

## `MANIFEST.yaml` — câu trả lời cho "bản nào là bản thật"

Mỗi tài liệu: `path`, `version`, `status` (`nhap` | `da-gui` | `da-chot` | `thay-the`),
`sent` (gửi cho ai, ngày nào, qua kênh nào), `sha256`, `supersedes`.

Trường `binds` nối tài liệu với nhãn nhóm nghiệm thu trên tracker. Nhờ nó truy vết đi được
**cả hai chiều**: từ một dòng code về điều khoản, và từ một điều khoản ra danh sách issue.

## Ranh giới không được vượt

**Spec không bao giờ sống ngoài repo.**

Hợp đồng giao việc buộc worker đọc spec theo khoảng dòng và cấm grep cả file. Cơ chế đó chỉ
chạy được khi spec là file trong worktree. Spec trên kho ngoài thì mỗi lần đọc là một lần
fetch cả trang — mất đúng đòn bẩy chi phí lớn nhất.

Kho ngoài nhận **bản đã chốt đi ra**, và cấp **tài liệu đối tác đi vào**. Không bao giờ là
nơi agent đọc spec.

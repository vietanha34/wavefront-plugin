---
name: classify
description: Dùng khi có một yêu cầu thô cần biết nó là epic mới, phase mới, bổ sung nhỏ, sửa lỗi, nợ kỹ thuật hay một quyết định cần người chốt. Phân loại quyết định toàn bộ đường đi phía sau nên phải làm trước mọi việc khác.
---

# classify — một yêu cầu thuộc loại nào

Đúng **một** loại. Không chắc thì hỏi người — phân loại sai thì mọi bước sau sai theo.

## Cây quyết định

```
Có phải lỗi của thứ đã chạy được?
├─ có  → FIX
└─ không
   ├─ Cần người hoặc đối tác chốt trước khi làm được gì?  → DEC
   ├─ Là nợ kỹ thuật phát sinh ngoài phạm vi task đang làm?  → DEBT
   ├─ Là hạ tầng, CI, merge, release?  → OPS
   ├─ Chỉ là tài liệu, nghiệm thu, đào tạo?  → DOC
   └─ Là việc xây mới
      ├─ Mục tiêu sản phẩm độc lập, base branch không giẫm epic nào?  → EPIC MỚI
      ├─ Increment dùng được trên một epic đã có?  → PHASE MỚI
      └─ Nhỏ, không đổi interface?  → ADD
```

## Tiêu chí tách EPIC

Hai epic khi **cả hai** đúng:

* hai mục tiêu sản phẩm độc lập — mỗi cái tự đứng được, không nửa vời
* hai base branch không giẫm nhau

Nếu phải merge chung liên tục thì thực ra đó là **một** epic. Đây là phép thử rẻ nhất.

## ADD hay PHASE MỚI

Phép thử: **có đổi interface không?**

* không đổi → `ADD`, chèn vào wave đang mở
* có đổi → `PHASE MỚI`, và **bắt buộc có W0 contract** trước mọi implementation

"Đổi interface" nghĩa là chạm vào `surfaces.contract` khai trong `config.yaml`. Kernel
kiểm việc này, không dựa vào việc model nhớ.

## DEBT — ba thứ bắt buộc

Nhãn `type/tech-debt` đòi, và `/wavefront:add` sẽ chặn nếu thiếu:

1. file hoặc commit liên quan
2. hậu quả nếu không xử lý
3. ước lượng công

Thiếu một trong ba thì đó không phải một issue nợ kỹ thuật, đó là một lời phàn nàn.

## Bẫy hay gặp — theo dữ liệu thật

| Yêu cầu nghe như | Dễ phân sai thành | Đúng là |
|---|---|---|
| "chuyển CI sang runner self-hosted" | `CHANGE` (không tồn tại) | `OPS` |
| "retention chart sai giờ do session UTC" | `FIX` | `DEBT` — lớp lỗi, không phải một lỗi |
| "audit xem còn chỗ nào dựng SQL sai session" | `FIX` | `DEBT` |
| "giữ argMax hay đổi sang MAX(level)" | `ADD` | `DEC` — chưa quyết thì chưa có việc |
| "ghi yêu cầu cap memory vào ops notes" | `OPS` | `DOC` |
| "đo lại retention trên staging" | `FIX` | `DEC` hoặc `QA · P<n>` — là việc đo, không phải sửa |

Quy luật chung của bảng trên: **một lớp lỗi lặp lại ở nhiều chỗ là `DEBT`, không phải
`FIX`.** `FIX` dành cho một lỗi cụ thể tái hiện được, có chỗ sửa xác định.

## Đầu ra

Một dòng, không giải thích dài:

```
Loại: FIX · epic RET · milestone M4 · base feature/retention
fix_policy same-pr -> một task FIX, worker tự viết test tái hiện rồi sửa trong cùng PR
```

Rồi chuyển sang `clarify`.

---
description: Soát board và tài liệu so với quy chuẩn — tên issue, nhãn, cổng gate, milestone, cây tài liệu
argument-hint: "[--fix] [--scope tracker|docs|all]"
---

# /wavefront:audit

Tham số: `$ARGUMENTS`

Mặc định **chỉ báo, không sửa**. `--fix` chỉ được sửa thứ an toàn và có thể hoàn nguyên;
mọi thứ liên quan tới **quyền** (`gate/*`) hay **phạm vi** (milestone) thì chỉ báo, vì đó
là quyết định của người.

## Soát tracker

1. Lấy issue qua adapter tracker.
2. Chạy kernel:
   ```
   node ${CLAUDE_PLUGIN_ROOT}/scripts/name-check.mjs \
     --issues <json> --config .wavefront/config.yaml
   ```
3. Phân loại kết quả theo mức nghiêm trọng:

| Mức | Gồm | `--fix` |
|---|---|---|
| **Chảy máu** | task thiếu `gate/*` **và** đang ở `Todo` — người đã duyệt mà AO không thấy | chỉ báo |
| **Lỗi** | tên sai dạng · CODE ngoài registry · hai role một mã · thiếu P/W · nội dung > 80 ký tự | báo, đề xuất tên mới |
| **Nợ** | sub-task thiếu `level/subtask` · nhãn đã bỏ còn gắn · thiếu milestone | `level/subtask` sửa được |

Mục "chảy máu" lên đầu báo cáo, kèm danh sách issue cụ thể. Theo lần soi 13/10/2026 có
**4 task** ở `Todo` không có `gate/*` nên đứng yên — đây đúng là lớp lỗi cần tìm.

## Soát tài liệu

* file sai dạng tên theo `docs/DOC-TREE.md §2`
* hậu tố `-final`, thư mục `final/`, thư mục `_backup_*` đặt tại chỗ
* `MANIFEST.yaml` thiếu, hoặc có file không khai trong manifest, hoặc khai mà không có file
* `sources/*/meta.yaml` thiếu `sha256`, hoặc hash không khớp nội dung → tài liệu nguồn đã đổi

## Soát spec

```
node ${CLAUDE_PLUGIN_ROOT}/scripts/spec-lint.mjs .wavefront/epics/**/P*/spec.md
```

Và kiểm `invariants.md`, `decisions.md` có bị sửa dòng cũ không — hai file này append-only,
nên diff với commit trước mà thấy dòng bị đổi hay xoá là một phát hiện.

## Kết quả

Bảng ba cột: mức · issue/file · việc phải làm. Không kèm giải thích dài; chi tiết đã có
trong `docs/NAMING.md`.

Kết thúc bằng **một câu** nói rõ board đang đạt hay không, và việc nào phải làm trước.

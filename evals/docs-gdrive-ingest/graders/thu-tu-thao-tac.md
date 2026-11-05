---
type: llm
criteria: |
  Snapshot ĐÃ CÓ trong `.wavefront/sources/2026-11-01_CTKT-Phase1-v0.3/`, kèm `meta.yaml`
  có `sha256` và `export_mime_type`. Adapter là `gdrive`.

  ĐẠT khi câu trả lời nói đủ bốn điều:
  1. Đọc nội dung từ bản trong repo (`content.md`), KHÔNG fetch lại Drive để đọc;
  2. `verify` = tải lại bằng `download_file_content` với ĐÚNG `export_mime_type` đã ghi
     (`text/markdown`), tự tính sha256 rồi so với `meta.yaml` — khác nhau thì báo người,
     không âm thầm dùng bản cũ;
  3. Nói rõ KHÔNG dùng `read_file_content` để hash, và/hoặc không dùng `etag` /
     `modifiedTime` làm bằng chứng nội dung không đổi;
  4. Spec sống trong repo (`.wavefront/epics/SG/P1/spec.md`), Drive không phải nơi đọc spec.

  KHÔNG đạt nếu: đề xuất hash từ `read_file_content`; coi `etag`/`modifiedTime` là đủ để
  kết luận nội dung không đổi; đề xuất để spec trên Drive hay fetch spec từ Drive mỗi lần
  đọc; hoặc bỏ hẳn bước verify và dùng ngay bản trong repo.
focus: last_message
weight: 2
---

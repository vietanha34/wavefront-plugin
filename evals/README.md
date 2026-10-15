# Evals

## Lệnh chạy — không bỏ cờ nào

```bash
claude plugin eval . \
  --scaffold \
  --allow-tools Bash Read \
  --ablation none \
  --runs 1
```

Bốn cờ này đều **bắt buộc theo một lý do cụ thể**. Lần chạy đầu (15/10/2026) thiếu chúng và
kết quả gần như không đo được gì:

| Cờ | Vì sao | Hỏng thế nào nếu thiếu |
|---|---|---|
| `--scaffold` | case cần fixture do `scaffold.sh` dựng | model làm việc trên file không tồn tại, judge FAIL mọi run |
| `--allow-tools Bash Read` | `allowed_tools` trong frontmatter **không đủ** — runner còn phải được cấp ở dòng lệnh | Bash bị giữ lại, grader `tool_used: Bash` **không thể nào** pass, và model không chạy được kernel |
| `--ablation none` cho case kernel | nhánh baseline chạy **không có plugin**, nên script kernel không tồn tại → baseline luôn 0, không mang tin | tốn gấp đôi tiền cho một con số đã biết trước |
| `--runs 1` khi đang sửa suite | vòng lặp sửa–chạy | 3 run × 2 nhánh × 4 case = 24 run, ~18 phút, ~$4 cho mỗi lần thử |

Khi suite đã ổn và muốn biết plugin **thực sự thêm được gì**, chạy lại có ablation cho các
case không thuộc kernel:

```bash
claude plugin eval . --scaffold --allow-tools Bash Read \
  --case taskization-fire --case spec-lint-chan-spec-thieu --runs 3
```

## Bốn case

| Case | Kiểm | Ablation có nghĩa? |
|---|---|---|
| `spec-lint-chan-spec-thieu` | spec thiếu mục BB và dùng cụm không kiểm được thì **bị chặn** | có — cổng là tri thức của plugin |
| `name-check-bat-ma-sai` | bắt đủ ba lớp lỗi: thiếu P · hai role một mã · CODE ngoài registry | không — cần script |
| `taskization-fire` | spec đã duyệt thì **phân rã theo quy trình**, có W0 vì spec chạm contract surface | có — đây là câu hỏi chính |
| `browser-guard` | bốn đường của hook, nhất là khoá mở **theo phiên** | không — cần script |

## Bài học từ lần chạy đầu

**`skill-fired` báo `Skill called 0x` ở 3/3 run có plugin.** Hook `SessionStart` tiêm được
*văn bản* chỉ thị, nhưng văn bản **không đảm bảo** một lời gọi tool. Lần đó fixture spec cũng
thiếu, nên chưa tách được "không fire vì thiếu spec" khỏi "không fire vì trigger yếu" —
case `taskization-fire` giờ có spec đầy đủ đã duyệt chính là để tách hai nguyên nhân đó.

Nếu chạy lại có fixture mà `skill-fired` vẫn 0: trigger yếu thật, và phải đổi cơ chế — ví
dụ `/wavefront:add` gọi skill tường minh, hoặc một command `/wavefront:taskize` thay vì dựa
vào việc model tự chọn.

**Grader dễ pass là grader vô dụng.** `khong-tu-chia` bản đầu cho "nói rõ thiếu gì rồi dừng"
là đạt, nên nhánh **không có plugin** đạt 1.00 bằng cách không làm gì. Bản mới đòi bằng chứng
cụ thể: có W0, có wave cuối, mã task đúng quy chuẩn, mỗi task có closed file list.

**Mỗi case kernel giữ một grader `tool_used`.** Một câu trả lời nói đúng luật mà không chạy
cổng máy thì vẫn là spec rác đi qua.

## Còn thiếu

Case cho vòng thực thi thật — wave gate, merge theo thứ tự, integration trên base — chưa
viết, và cố ý. Chúng cần một epic thật đã chạy qua plugin để có số so sánh.

## Dọn

`results/` chứa báo cáo từng lần chạy. Không commit — thêm vào `.gitignore`.

# 19 rules — phân loại

Mỗi rule trong `epic-taskization/references/lessons.md` đều đã phải trả giá mới có. Nhưng
không phải cái nào cũng là luật quy trình. Bảng này nói **cái nào lên chuẩn, cái nào ở lại,
cái nào đặt sai chỗ**.

Tiêu chí phân loại: *rule này còn đúng trên một dự án khác, stack khác, nghiệp vụ khác không?*

---

## A · Phổ quát — vào whitepaper, bất biến

Đúng với mọi dự án phần mềm. Không cần tham số.

| # | Rule | Nằm ở đâu trong whitepaper |
|---|---|---|
| 1 | Contract là ràng buộc. Đổi nó là một task riêng, không gộp vào task khác | §3.2 |
| 2 | Task spec-only ghi Assumption kèm phương án thay thế, **không viết code** tới khi được duyệt | §2.1 |
| 4 | "Sai nhưng hợp lý" tệ hơn "hỏng rõ ràng" → thà hiển thị trạng thái vô hiệu còn hơn một con số chỉ đúng đôi khi | §5 |
| 7 | Refactor bảo toàn hành vi = **ghim trước**. Test byte-identical/snapshot của hành vi cũ viết và commit **trước** khi sửa | §3.1 |
| 8 | Hằng số nhân bản giữa contract và UI là bug có hẹn. Import hằng số thật | §3.2 |
| 9 | Một phát hiện thường giấu anh em nó trong cùng hàm. Dựng input matrix trước khi vá | §5 |
| 10 | Tài liệu viết bằng cách **chạy**, không bằng cách nhớ. Mọi số đo lại ngày viết | §1.1 role `docs` |
| 11 | Worker tự báo lỗi của nó là tín hiệu khoẻ; báo cáo toàn xanh không phát hiện nào là đáng ngờ | §5 |
| 12 | Tin nhắn giữa điều phối và worker có race thật. Quyết định quan trọng gửi lại dạng tóm tắt; đoạn hỏng **quote lại**, không đoán | §4 |
| 16 | Merge lấy head **tại thời điểm bấm**, không phải head đã verify. Đọc lại SHA ngay trước merge | §5 |
| 19 | Chi phí = số lượt gọi × ngữ cảnh. Phiên dài gấp đôi tốn khoảng gấp bốn | §4 |

---

## B · Phổ quát nhưng cần tham số — whitepaper + config

Luật đúng ở mọi nơi, nhưng cần biết dự án này dùng datastore gì, lệnh test gì, máy mấy core.

| # | Rule | Tham số trong `config.yaml` |
|---|---|---|
| 5 | Test hình dạng **không thay** thực thi. Mọi query path mới phải có ít nhất một test chạy thật trên store thật | `verify.datastore`, `verify.integration` |
| 6 | Assertion hardcode giá trị phụ thuộc môi trường (datetime, timezone, path) là test **che** bug — xanh trên CI, đỏ trên máy dev | `verify.unit` |
| 14 | Ngày tháng tính bằng API ngày, **không** bằng số học trên chuỗi | — (thành invariant của repo) |
| 17 | Một lượt chạy xanh ở toàn bộ phạm vi **không** chứng minh gì về race. Muốn kiểm cách ly thì chạy **chỉ các file tranh chấp** đồng thời | `verify.integration` |
| 18 | Phân biệt hai tín hiệu đỏ giống nhau dưới tải song song: số **sai mà là bội số** của kỳ vọng = shared state; **timeout** mà số chỗ khác đúng = thiếu CPU | `verify.cores` |

Rule 18 đáng nhắc riêng: chạy theo tín hiệu sai ở đây tốn một ngày. Bội số của kỳ vọng
(15 thay vì 5) là bug phải sửa; timeout là cái máy, và đuổi theo nó là vô ích.

---

## C · Riêng stack — vào adapter

| # | Rule | Adapter |
|---|---|---|
| 15 | Comment giữ chỗ trong file dùng chung **không** bảo vệ khối import. Ba task song song mỗi cái dùng đúng chỗ giữ của mình trong thân file rồi **đụng nhau hết ở phần import**. Cho file một vùng import riêng, mỗi task một dòng mốc | frontend / monorepo |

---

## D · Đặt sai chỗ — không phải rule

Hai mục dưới đây là **tri thức sản phẩm**, không phải luật quy trình. Để lẫn trong
`lessons.md` thì framework không tái dùng được cho dự án khác.

| # | Nội dung | Chỗ đúng |
|---|---|---|
| 3 | Metrics coi giá trị thiếu là `0`; filter coi là "không khớp". Hai ngữ nghĩa khác nhau **có chủ ý**, cấm "thống nhất" chúng | `invariants.md` của epic tương ứng |
| 13 | Row identity khi một query phục vụ nhiều kỳ/segment được quyết bởi **baseline**: tập dòng, thứ tự, phân trang theo baseline; series khớp theo **tên**, không theo index | `invariants.md` của epic tương ứng |

Cả hai vẫn **cực kỳ giá trị** — chỉ là chúng thuộc sổ bất biến của sản phẩm, nơi mỗi dòng
trỏ tới test ghim nó. Hình thức ghi:

```
I-03  Metrics coi giá trị thiếu là 0; filter coi là không khớp. CẤM thống nhất.
      Thống nhất theo chiều nào cũng làm sống lại một bug đã sửa, hoặc đổi âm thầm mọi con số.
      Test ghim: <đường dẫn test>
```

Phần khái quát hoá được của chúng — *"hai ngữ cảnh ngữ nghĩa khác nhau có chủ ý thì ghi
thành bất biến và cấm thống nhất"* — thì đã nằm trong whitepaper như một luật về sổ bất
biến, chứ không nằm ở đây dưới dạng một ví dụ cụ thể.

---

## Deck đào tạo

Deck nội bộ hiện ghi **16 rules**. Ba rule 17, 18, 19 là mới và đều đắt giá — nhất là 19,
vì nó đổi cách định kích thước task (≤ ~150 lượt gọi, chia theo khu vực/màn hình chứ không
theo lớp). Deck cần cập nhật.

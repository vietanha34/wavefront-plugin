# Bản rút gọn cho các bước MƯỢN

Năm bước discovery mượn skill ngoài. Skill nào vắng mặt thì chạy phần tương ứng dưới đây,
rồi ghi **một dòng** vào kết quả rằng bước đó chạy ở chế độ rút gọn. **Không bao giờ fail.**

Dò skill trước khi chạy: có trong danh sách skill của phiên thì gọi; không có thì rút gọn.

---

## `challenge` — công kích giả định
*(mặc định `pm-execution:red-team-prd`)*

Với mỗi requirement **chịu lực** — cái mà sai thì phải làm lại nhiều việc — trả lời ba câu:

1. Nếu điều này sai thì cái gì sụp? Liệt kê việc phải làm lại.
2. Phép thử **rẻ nhất** để biết nó đúng là gì? Ghi lệnh hoặc thủ tục.
3. Ai có thể trả lời chắc chắn — người, đối tác, hay dữ liệu?

Requirement nào trả lời được câu 2 bằng một lệnh thì chạy luôn. Câu 3 trỏ về người thì thành
issue `gate/needs-human`.

Không cần công kích hết — chỉ những dòng chịu lực.

---

## `premortem` — rủi ro trước khi làm
*(mặc định `pm-execution:pre-mortem`)*

Giả định dự án **đã trượt**. Viết ba nguyên nhân khả dĩ nhất, mỗi cái kèm dấu hiệu sớm quan
sát được. Dấu hiệu phải là thứ **thấy được trong tuần đầu**, không phải "chậm tiến độ".

Mỗi nguyên nhân thành một issue `type/risk`, và dấu hiệu sớm đi vào mô tả.

---

## `survey` — soát code hiện có
*(mặc định `pm-ai-shipping:document-app`)*

Bảng findings `F1..Fn`, mỗi dòng: vị trí (file:dòng) · mô tả · severity · hệ quả nếu để nguyên.

Soát theo **bốn trục** này, không soát tự do:

* nơi định nghĩa interface dùng chung — có nhiều nguồn sự thật không?
* nơi tính toán nghiệp vụ — công thức có nằm rải rác không?
* nơi phân quyền — có đường nào đọc dữ liệu mà bỏ qua kiểm quyền không?
* nơi dựng truy vấn — có chỗ nào dựng chuỗi ở session này rồi chạy ở session khác không?

Severity chỉ ba mức: `chặn` (phải sửa trước khi làm tiếp) · `nợ` (vào epic Tech Debt) ·
`ghi nhận` (biết là đủ).

---

## `ideate` — khám phá vấn đề
*(mặc định `pm-product-discovery:discover`, **chỉ chạy ở `greenfield`**)*

Ở `contracted` và `existing-repo` thì **bỏ hẳn** — phạm vi đã khoá, khám phá là đốt thời gian.

Bản rút gọn ở greenfield: ba câu cho mỗi nhóm người dùng — họ đang làm việc đó bằng cách gì,
chỗ nào đau nhất, nếu không có sản phẩm này thì họ mất gì. Dừng ở mức đủ để viết non-goals.

---

## `metrics` — đề xuất chỉ số
*(mặc định `pm-product-discovery:setup-metrics`, **chỉ chạy ở `greenfield`**)*

Ở `contracted` thì **bỏ** — số lấy từ hợp đồng, xem skill `acceptance`.

Bản rút gọn: mỗi yêu cầu phi chức năng thành một dòng có **ngưỡng** và **cách đo**. Không đề
xuất chỉ số nào mà chưa biết đo bằng gì.

---

## Ghi nhận phiên bản

`init` ghi `discovery.borrow_seen_at` vào config. Khi skill mượn update và đầu ra đổi dạng,
đó là chỗ cho biết vì sao kết quả khác lần trước.

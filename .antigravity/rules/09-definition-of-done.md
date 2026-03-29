# 09 — Định Nghĩa Hoàn Thành (Definition of Done)

## Mục Đích
Làm rõ với cả AI và con người mốc "nghiệm thu". Tránh sự cố "Feature hoàn thành trên UI nhưng chết khô trong DB".

## Áp Dụng Khi Nào
Chuẩn bị đóng hoặc hoàn thành một nhánh Task được phân công.

---

## Tiêu Chí "Hoàn Thành" Đích Thực Theo GOAT HOTEL Ruleset

**1. KHÔNG Có Dữ Liệu Nghiệp Vụ Ở Client State**
Task chỉ xong khi tất cả giá trị Tiền, Số lượng, Loại phòng trống/hết... đều đã được đẩy từ Backend xuống, chứ KHÔNG được ghép, cộng, trừ ở mảng React/Vite.

**2. Đã Có Cú 'Chặn Đầu' Backend (Re-Validation)**
Bạn làm form đặt phòng React với nút "Phòng này không thể hủy"? Đừng nói là bạn xong. Việc xong là khi Backend bắt được cú POST báo hủy cái Booking đó, kiểm tra DB nếu booking đã confirm thì lập tức cấm User hủy, ném Exception/StatusCode. 

**3. Test Cùng Đồng Sinh**
Nếu cập nhật API, 100% người báo cáo phải đã vá lại mọi file React phía Frontend nơi cái URL Axios đó được tung ra.

**4. Bảo Mật Cũ, Check Auth Mới**
Phải đảm bảo việc xử lý luồng Session / kiểm tra "Tài khoản đó có phải là Admin thật (chứ không phải đổi Role text phía FE) không?" đã triển khai qua Interceptor.

**5. Hoạt Động Không Break Existing**
Code không dọn dẹp vô thừa nhận. Nếu chỉnh sửa làm hỏng phần Render "Room Card" do bạn chèn một trường Null mới, Task bạn làm bị đánh dấu FAILED.

---

## Checklist Kiểm Soát Đóng Task

```text
□ Logic cốt lõi (Business Truth) đã được neo chặt ở Service Backend.
□ Backend không tin tưởng form FE, đã check và Validate trọn vẹn lại toàn bộ input.
□ Không xuất hiện thay đổi API nào mà chưa cập nhật file FE đang gọi nó.
□ Code Auth/Session không dựa vào Client state. Đã check Permission tại Endpoint Spring Boot.
□ Không tùy tiện format các file không liên quan hoặc gõ đè tên biến làm break code hiện có.
```

Nếu thiếu 1 trong số trên, chưa được phép đóng luồng giải quyết mà hãy tiếp tục dùng tool để lập trình cho đến khi hoàn hảo. Mọi task phải được rèn tính cẩn thận như khi bảo vệ đồ án tốt nghiệp sinh viên.

# Tính năng: Quên mật khẩu & Gửi mã xác thực qua Email

Tính năng này yêu cầu người dùng phải nhận được một mã xác thực (OTP Code) gửi tới địa chỉ Email của họ. Sau khi nhập đúng mã OTP này cùng với mật khẩu mới, hệ thống mới cho phép đổi mật khẩu.

## User Review Required

> [!IMPORTANT]
> Việc gửi Email bắt buộc phải có thông tin cấu hình **Máy Chủ Gửi Mail (SMTP)**.
> Hiện tại ứng dụng chưa có thư viện gửi mail (`spring-boot-starter-mail`) và chưa có cấu hình tài khoản Gmail để gửi mailable.

Tôi cần bạn xác nhận một quyết định cốt lõi:
1. **Lựa chọn 1 (Hoàn thiện - Cần App Password):** Cài đặt đầy đủ tính năng gửi Email thật bằng dịch vụ Gmail SMTP. Backend sẽ cấu hình tự động gửi mail. BẠN sẽ phải tạo một mật khẩu ứng dụng Gmail (App Password) và cung cấp cho tôi hoặc dán vào file `application.properties`.
2. **Lựa chọn 2 (Mô phỏng - Demo Console):** Cài đặt logic và Database đầy đủ để tạo mã OTP. Giao diện Frontend vẫn yêu cầu nhập OTP đàng hoàng. Tuy nhiên Backend sẽ chỉ "in tạm mã OTP đó ra cửa sổ Console màu đen" thay vì thực sự gửi đi để bạn có thể test luồng chức năng một cách nhanh chóng mà không phải vất vả cấu hình Gmail.

Vui lòng cho tôi biết bạn muốn đi theo hướng **Lựa chọn 1** hay **Lựa chọn 2**?

## Proposed Changes

### Thay đổi Backend
- Cập nhật file `pom.xml` bổ sung dependency `spring-boot-starter-mail` (NẾU chọn cách 1 gửi mail thật).
- Tạo Entity mới `PasswordResetCode` để lưu tạm thời các mã OTP gồm: Email, Code (Mã số 6 chữ số), Thời hạn (Ví dụ hiệu lực trong 10 phút) và trạng thái (đã dùng / chưa dùng).
- Thêm các API Endpoint mới tại `AuthApiController.java`:
  - `POST /api/auth/forgot-password`: Nhận email -> sinh mã OTP -> Lưu vào DB -> Gọi `EmailService` để gửi mail (hoặc in log).
  - `POST /api/auth/reset-password`: Nhận email, mã OTP, và mật khẩu mới -> Xác thực mã OTP trong DB -> Nếu đúng, đổi mật khẩu và lưu lịch sử.

### Thay đổi Frontend
- Làm mới cơ chế hiện tại của nút "Quên mật khẩu" trong trang `Login.jsx` hoặc tạo hẳn một trang `/forgot-password` hoàn chỉnh.
- Làm giao diện nhập Email để lấy mã -> Khi bấm thì loading chờ gửi.
- Nếu thành công, hiện ra form nhập **Mã OTP** và **Mật khẩu Mới** cùng nút **Đặt Lại Mật Khẩu**.

## Open Questions

- Trong thư mục `/pages` hiện chưa có `ForgotPassword.jsx`. Bạn muốn tôi hiển thị form Quên mật khẩu này trên một cái Popup Modal ngay trong màn hình đăng nhập, hay tạo một trang riêng (URL `http://localhost:5173/forgot-password`) theo kiểu truyền thống?

## Verification Plan

### Automated Tests
- Gọi thử API `POST /api/auth/forgot-password` với Postman hoặc cURL ở console để kiểm tra mã tạo và mail được gửi đi (hoặc in ra console).
- Làm giả sai mã OTP để xem hệ thống có chặn lại báo lỗi đúng không.

### Manual Verification
- Bạn sẽ đi vào giao diện người dùng, thử tìm 1 tải khoản có mail hợp lệ, nhấn Quên Mật Khẩu, chép lấy đoạn mã OTP 6 số để xác nhận lệnh đổi pass.

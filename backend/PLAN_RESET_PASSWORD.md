# Kế Hoạch Tính Năng: Quên Mật Khẩu (Xác thực bằng Mã OTP qua Email)

Đây là file vật lý tôi tạo ra theo yêu cầu của bạn để bạn dễ dàng đọc và theo dõi kế hoạch.

## Tóm Tắt Vấn Đề
Khi khách hàng quên mật khẩu, hệ thống phải yêu cầu họ nhập Email. Nếu Email đúng, hệ thống sẽ gửi một mã OTP gồm 6 chữ số tới Email đó. Khách hàng phải lấy mã này và nhập vào kèm theo Mật khẩu mới để đổi mật khẩu thành công.

---

## 2 Lựa Chọn Cốt Lõi (CẦN BẠN QUYẾT ĐỊNH TRƯỚC KHI TÔI CODE)

**LỰA CHỌN 1: GỬI MAIL THẬT (PHỨC TẠP NHƯNG XỊN)**
- Yêu cầu: Bạn (với tư cách là dev) phải lên Google Account -> Bật xác minh 2 bước -> Lấy "Mật khẩu ứng dụng" (App Password) gồm 16 ký tự.
- Sau đó dán email và mật khẩu ứng dụng đó vào `application.properties` để tôi code chức năng SMTP tự động gửi mail.
- Ưu điểm: Hệ thống hoạt động y như thực tế.
- Nhược điểm: Mất công bạn phải setup cấu hình Email.

**LỰA CHỌN 2: IN MÃ OTP RA CONSOLE ĐỂ DEMO (NHANH GỌN LẸ)**
- Yêu cầu: Tôi sẽ code đầy đủ giao diện Backend/Frontend, tạo mã OTP đàng hoàng lưu vào DB. Nhưng thay vì gọi Google Mail để gửi, Backend sẽ chỉ in dòng Log ra màn hình đen console kiểu: `[Mã OTP cấp lại mật khẩu cho email admin@goathotel.local là: 847281]`.
- Ưu điểm: Phù hợp cho nộp đồ án, demo nhanh, bạn chỉ việc liếc qua console copy mã dán vào web là xong.
- Nhược điểm: Không gửi mail thật tới khách hàng.

👉 **BẠN MUỐN TÔI CODE LỰA CHỌN 1 HAY LỰA CHỌN 2?**

---

## Các Bước Tôi Sẽ Hiện Thực Hóa (Sau khi bạn chọn)

1. **Database:** (Tôi vừa cấu hình xong sẵn bảng `password_reset_codes` vào file `goat_hotel_sqlserver_full_setup.sql` cho bạn rồi).
2. **Backend:** Bổ sung 2 API:
   - `POST /api/auth/forgot-password-request`: Tạo mã, lưu xuống DB.
   - `POST /api/auth/verify-reset`: Nhận mã, kiểm tra DB, băm mật khẩu mới, cập nhật User.
3. **Frontend:** 
   - Tạo 1 trang UI `/forgot-password` xịn xò có 2 bước: Bước 1 (Nhập mail nhận Code) -> Bước 2 (Nhập Code + Mật khẩu mới).
   - Validation đầy đủ.

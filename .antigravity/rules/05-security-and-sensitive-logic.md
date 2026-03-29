# 05 — Bảo Mật Bắt Buộc và Logic Xác Thực

## Mục Đích
Xử lý dứt điểm các lỗ hổng thường gặp khi AI nhầm tưởng Frontend có tính bảo mật cao, trong khi với web hiện đại, Frontend hoàn toàn là một môi trường bị người dùng kiểm soát. 

## Áp Dụng Khi Nào
Khi task liên quan đến Auth, Role (Admin/User), duyệt/hủy Booking, ẩn/hiện nút, hoặc upload file.

---

## 1. Không Tin Tưởng Client Bất Cứ Giá Nào
Giao diện React có thể giấu đi (hide) cái nút "Duyệt Đơn" với User thường. **Đó là UX, KHÔNG phải bảo mật.**
- Backend BAO GIỜ cũng phải tự mình chốt chặn (ví dụ: dùng Interceptor `AdminInterceptor.java` hoặc check ID người dùng ở Session).
- Tuyệt đối không để Frontend truyền params nhạy cảm dạng `POST /cancel_order?isAdmin=true`. Mọi quyền hạn phải lấy từ **phiên làm việc (Session/Cookie) của Back-end**.

## 2. Rủi Ro Ở Hệ Thống Hiện Tại (Vấn Đề: `userId`)
Ở file `OrderDetail.jsx` đang có một lỗ hổng kinh điển:
```javascript
// Gửi userId từ thông tin booking nhúng - KHÔNG AN TOÀN
const res = await axios.delete(`/api/bookings/${id}?userId=${booking.user?.id || 1}`);
```
Đây là smell code rất nặng. Nếu user truyền `userId=2`, họ hủy nhầm đơn của người khác?
**Hướng Giải Quyết Bắt Buộc:**
- Bỏ yêu cầu truyền `userId` từ Frontend.
- Từ Service/Controller Java: đọc `userId` đang đăng nhập thông qua `HttpServletRequest` session (hoặc Context hiện hành của `AuthService`).
- So sánh ID đó với chủ nhân của đơn. Nếu không khớp: `403 Forbidden`.

## 3. Không Lưu Mật Khẩu, Lấy Password Trực Tiếp Bằng API
- Frontend KHÔNG được giữ giá trị mật khẩu trong state dài hạn hay Local Storage.
- Mọi logic xác minh mật khẩu, kiểm tra sai mật khẩu... CỦA USER, phải qua một API POST và BE trả lời (Yes/No), không trả Password Hash về Frontend để tự so khớp.
- Tuyệt đối không in mật khẩu ra file server log.

## 4. Bảo Vệ Endpoints Admin
Mọi Controller thuộc nhánh `/api/admin/*` hoặc `/admin/*` **phải** được chặn bởi cấu hình ở `WebMvcConfig` lót bằng Interceptor kiểm tra Admin role, hoặc được khai báo rõ trong Spring Security (nếu đồ án quyết định chuyển qua).

## 5. Upload File An Toàn
- Bất cứ component kéo/th thả File nào (ảnh phòng, hóa đơn) cũng phải được Backend validate phần mở rộng (`.png`, `.jpg`).
- Frontend validate size <= 5MB chỉ để báo lỗi nhanh. Backend làm việc đó một lần nữa để tránh request bị gửi tràn kích thước với phần mềm thứ ba.

---

## Checklist Bảo Mật 

- [ ] Tôi có đang dùng Frontend param để cấp quyền/xác minh thân phận không? (VD: `?role=admin`) -> Dừng lại! Sửa BE.
- [ ] Logic "ai sở hữu booking đó" đã được xử lý bằng Service Java backend lấy ra từ Session chưa?
- [ ] Tôi có vô tình lưu thông tin mật ong ngọt (Session id root, Role raw) vào LocalStorage dễ bị sửa đổi không?

# 03 — Phân Định Trách Nhiệm Frontend / Backend

## Mục Đích
Ngăn chặn AI đưa business logic quan trọng xuống client (React). Việc đẩy logic xuống client "cho dễ làm giao diện" là hành vi phá vỡ kiến trúc đồ án và gây khủng hoảng bảo mật.

## Áp Dụng Khi Nào
Bất kỳ lúc nào bạn cần thêm tính năng mới, hiển thị dữ liệu mới, tính toán giá trị, hoặc định nghĩa cấu trúc API.

---

## 1. Trách Nhiệm Backend (Java Spring Boot)
Đây là trung tâm xử lý duy nhất. Backend hoàn toàn không tin tưởng Frontend.
- **Tính toán:** Phải thực hiện ở layer `Service`. Tiền phòng, tiền thuế, tính ngày lưu trú (checkIn - checkOut).
- **Validation có thẩm quyền:** Kiểm tra ngày đặt có ngược không? Phòng có trống không? User có bị bank không?
- **Khởi tạo dữ liệu:** Tạo Entity (ví dụ: `Booking`, `BookingDetail`) dựa vào request từ FE.
- **Bảo mật và Phân quyền:** Xác minh Session hợp lệ, kiểm tra Role user (Interceptor/Filter).
- **Thao tác DB:** Lưu/Xóa qua Repository (`save()`, `delete()`).

## 2. Trách Nhiệm Frontend (React)
Frontend là một "dumb client" (client ngốc nghếch chỉ biết hiển thị).
- **Render UI:** Hiển thị HTML/CSS/Tailwind theo dữ liệu BE trả về.
- **Nhập liệu & UX Validation:** Chặn form rỗng, format email trước khi gửi để đỡ tốn network (nhưng Backend VẪN phải kiểm tra lại).
- **Giao Tiếp API:** Dùng `axios` gọi đến `localhost:8080/api/...`. (Lưu ý: sẽ chuyển đổi dần sang instance axios config tập trung).
- **Feedback:** Hiện thông báo (toast, modal) loading, error, success theo response từ Backend.

---

## 3. "Khi Nghi Ngờ, Đặt Ở Backend"
Nếu một logic có vẻ như "thuộc cả hai nơi", **bắt buộc đưa nó vào backend** và để frontend đọc kết quả.

**Ví dụ từ GOAT_HOTEL:**
Frontend (trước đây):
```javascript
// TRONG REACT (SAI)
const baseTotal = pricePerNight * nights;
const fees = +(baseTotal * 0.08).toFixed(2);
const taxes = +(baseTotal * 0.14).toFixed(2);
```
Tại sao sai? Nếu thuế thay đổi lên 10%, bạn phải build lại frontend. Người dùng có thể chỉnh file js để trả 0% thuế.
Cách đúng:
```java
// TRONG JAVA BE (ĐÚNG)
BookingDTO dto = bookingService.calculateBookingPrice(room, checkIn, checkOut);
// DTO chứa sẵn: basePrice, fees, taxes, grandTotal
```
Và Frontend chỉ việc:
```javascript
// TRONG REACT (ĐÚNG)
<span>Thế: {booking.taxes}</span>
```

---

## Bảng Đối Chiếu Nhanh (Cheatsheet)

| Tính Năng / Logic | Frontend Làm Gì? | Backend Làm Gì? |
|-------------------|------------------|-----------------|
| Tính tổng tiền | Hiển thị số BE đưa | `calculateTotal(id)` ở Service |
| Kiểm tra phòng trống | Gọi API báo trùng | Kiểm tra thời gian có đè nhau ở Entity |
| Hủy Booking | Lên modal confirm "Bạn chắc không?" | Kiểm tra rule (chỉ cho phép nếu pending), đổi status DB |
| Mật khẩu user | Validate số ký tự > 8 | Băm mật khẩu (BCrypt), kiểm tra chính xác |

---

## Checklist Bắt Buộc
- [ ] Tôi có đang yêu cầu frontend tự nối các mảng dữ liệu nghiệp vụ lại không?
- [ ] Tôi có đang để frontend tự tính toán thuế, giá tiền, hay trạng thái không?
- [ ] Backend có đang "ngoan ngoãn" lưu bất cứ thứ gì frontend gửi lên mà không check lại không? -> Thiết kế lại API!

# 02 — Hệ Thống Nguồn Sự Thật (Source of Truth)

## Mục Đích
Ngăn chặn tình trạng "hai nguồn sự thật" gây mâu thuẫn hệ thống. Chỉ rõ nơi nào là nguồn dữ liệu duy nhất đáng tin cậy cho từng loại thông tin trong dự án GOAT_HOTEL.

## Áp Dụng Khi Nào
Khi tạo, sửa, hoặc đọc bất kỳ dữ liệu, schema, cấu hình, hay trạng thái nào.

---

## 1. Cơ Sở Dữ Liệu (Database Schema)
**Nguồn sự thật:** `backend/src/main/java/com/hotel/entity/`
- TẤT CẢ bảng, cột, kiểu dữ liệu, quan hệ (OneToMany, ManyToOne) được định nghĩa bởi các class mang annotation `@Entity`.
- **Tuyệt đối không:** Dùng các file `.sql` ở thư mục gốc (như `goat_hotel_full_demo.sql`) làm nguồn sự thật cho schema. Đó chỉ là script tạo mock data.

## 2. Trạng Thái Nghiệp Vụ (Business State)
**Nguồn sự thật:** Backend Database (truy xuất qua Service/Repository)
Các dữ liệu sau bắt buộc tài liệu gốc phải nằm ở backend và frontend phải liên tục đồng bộ:
- **Trạng thái phòng:** (available, booked, maintenance...)
- **Trạng thái booking:** (pending, confirmed, cancelled, completed)
- **Role của user:** (ADMIN, USER)
- **Giá trị tài chính:** (Giá phòng, tổng tiền, thuế, phí dịch vụ)

**Ví dụ Sai:** Tính thuế phí 8% và 14% ở `frontend/src/pages/OrderDetail.jsx`. Backend phải tính toán những giá trị đó và trả về trong model/DTO. Không để frontend tự tính giá.

## 3. Trạng Thái UI (UI State)
**Nguồn sự thật:** React State / Context / URL
Frontend chỉ làm nguồn sự thật cho:
- Component nào đang mount/hiển thị.
- Dữ liệu người dùng đang gõ dở vào form (chưa submit).
- Trạng thái loading, error message nội bộ.
- Dữ liệu lọc (search query, tab đang chọn).

## 4. Dữ Liệu Chuyển Hướng Giao Diện (Routing)
**Nguồn sự thật:** `frontend/src/App.jsx`
- Danh sách các trang hợp lệ và url client-side nằm ở đây.
- Nếu một route tồn tại trong App.jsx, chưa đủ để nói nó "an toàn". Route yêu cầu quyền admin (như `/admin/*`) vẫn phải gọi API để lấy data, và API đó phải chặn user không có quyền từ backend.
- Phải ưu tiên fetch data từ server qua URL param (như `/booking/:id`) chứ không dựa vào `location.state`. `location.state` có thể cũ, sai, hoặc mất khi user reload.

---

## Những Sai Lầm Bắt Buộc Tránh Tại GOAT_HOTEL

| Sai Lầm (Đã Từng Xảy Ra) | Hành Xử Đúng |
|-------------------------|-------------|
| Gắn `price * 1.08 /* fee */` vào React component | Thiết kế `BookingService` BE trả về subTotal, tax, fee, total |
| Frontend truyền object booking qua `navigate(..., { state: { booking } })` rồi dùng nó không cần load lại từ API | Component Detail lấy `id` từ param, fetch cục data mới nhất từ BE |
| "Phòng này `available` vì React state tôi lưu báo thế" | Phải gọi `checkAvailability` qua BE để tránh đụng độ đặt phòng |
| Hardcode danh sách "room types" trong React | Lưu bảng `room_types` ở DB, BE cung cấp endpoint để lấy danh sách |

---

## Danh Sách Kiểm Tra
- [ ] Tôi có đang tạo định nghĩa schema ở đâu khác ngoài `.java` không?
- [ ] Tôi có đang bắt frontend tự nhân/chia/tính toán số tiền không?
- [ ] Component frontend có đang tin vào state lạc hậu (`location.state`) khi làm việc với nghiệp vụ lớn (ví dụ: Booking Detail) không?

# 04 — Quy Trình Chỉnh Sửa Code An Toàn

## Mục Đích
Đảm bảo AI agent tạo ra các thay đổi có chủ ý và theo ngữ cảnh, không phá vỡ đồ án đang chạy hằng ngày của sinh viên bằng những đợt "refactor trên trời".

## Áp Dụng Khi Nào
Mỗi lần sắp xóa, thêm, hoặc sửa nội dung file.

---

## Quy Tắc Cốt Lõi

### E1 — Đọc File Trước Khi Sửa
Bạn không biết file hiện tại trông thế nào dù đã đoán đúng tên nó. LUÔN LUÔN dùng tool đọc file (e.g. `view_file`) trước khi đề xuất/thực hiện thay đổi. Trí nhớ là kẻ thù.

### E2 — Phạm Vi Nhỏ Nhất (Minimal Footprint)
Không đổi tên biến, không sắp xếp lại method, không thêm comments không cần thiết. Đâu là dòng code tối thiểu để xong task? Viết dòng đó. Chấm hết.

### E3 — Refactor Dự Án Sinh Viên Mức Độ Vừa Phải
- Đây là đồ án môn học, không phải hệ thống Enterprise. Không lôi các design pattern nặng nề (như CQRS, Event Sourcing) vào mức phá vỡ Controller/Service/Repository cơ bản.
- Hỗ trợ cải tiến code, nhưng **phải giữ tính tương thích** và dễ hiểu.

### E4 — Thay Đổi Cú Pháp Và Cách Dùng Cần Đồng Bộ
Nếu đổi tên phương thức `getRooms()` thành `getAllRooms()` ở Service, BẠN PHẢI đi vào các Controller đang gọi nó và update. Nếu đổi body JSON mà API trả về, BẠN PHẢI cập nhật file React truy xuất JSON đó.

### E5 — Giải Quyết Gốc Rễ Từ Từ (Incremental Fix)
Thực trạng: `http://localhost:8080/api/...` đang bị hardcode khắp `frontend/src/`.
- **Luật:** KHÔNG tự động tạo file `apiClient.js` và refactor *toàn bộ* codebase nếu task không yêu cầu.
- **Nhưng:** Nếu đang sửa Component `A`, hãy thay `http://localhost...` bằng `process.env.VITE_API_URL` bên trong file đó. Dần dần dọn dẹp theo kiểu "trại sinh viên" (rời khỏi nơi cắm trại sạch hơn lúc đến).

---

## Checklist Thay Đổi Áp Dụng Ngay

- [ ] Tôi có định thay đổi file nào mà chưa xem nội dung của nó không?
- [ ] Tôi có đang lồng một cái `interface` dư thừa vì nhìn "chuyên nghiệp" dù logic rất đơn giản không?
- [ ] Tôi có đang đổi tên field của API response mà quên sửa code lấy API từ phía React không?
- [ ] Sửa file này có yêu cầu khởi động lại (restart) Spring Boot không? (Gợi ý cho người dùng restart).

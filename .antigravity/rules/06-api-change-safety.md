# 06 — Giao Tiếp API Cần Sự Đồng Bộ Liên Tục

## Mục Đích
Tránh lỗi âm thầm khi Back-end thay đổi `Controller` (đầu ra JSON) hoặc Path API mà công đoạn kiểm tra Frontend bị bỏ quên.

## Áp Dụng Khi Nào
Khi tạo/sửa đổi/xóa một endpoint REST ở `backend/src/main/java/.../controller/api/`.

---

## Quy Tắc Cốt Lõi

### A1 — API Contract Là Bản Hợp Đồng Hai Chiều
- Không bao giờ đổi tên trường trả về từ Spring Boot (VD: từ `roomId` thành `id`) mà không Global Search để sửa bên React theo.
- Không thay đổi kiểu dữ liệu (từ chữ sang số) mà không cẩn thận xử lý lại `Type` của nó lúc fetch bên React.

### A2 — Không Sửa API "Chỉ Để Frontend Dễ Làm Giao Diện"
- Thay vì lấy thẳng Entity (ví dụ: `Booking`) trả ra, Service phải gom dữ liệu đưa vào `DTO` (VD: `BookingResponseDTO`) hoặc trả map tuỳ mục đích.
- DTO giúp ẩn bớt trường nhạy cảm, đồng thời đảm bảo "nguồn sự thật" mà Backend cấp không bị rò rỉ hoặc thiếu chặt chẽ so với mong muốn nghiệp vụ.

### A3 — Hardcode URL / Incremental Sync
URL `http://localhost:8080` hiện nằm ngổn ngang ở Axios React Component.
- Nếu phải thêm route mới: cố gắng theo pattern có từ trước, hoăc gom về `.env` nếu có thể làm trong giới hạn task.
- Chắc chắn kiểm tra lại Frontend sau khi Spring boot controller di dời URI path. Đừng xoá/re-name nó rồi rời đi.

### A4 — Validation: Hai Đầu Phải Khớp
Frontend không có quyền "khoán" validation request form.
Ví dụ: Nút "Hủy đặt phòng". Frontend chỉ gọi API DELETE/Cancel.
Backend (BookingService) bắt buộc làm lại Validation:
- Có tồn tại ID đó không?
- Đơn phòng "với ID đó" có phải của user đang gọi API không? (Không tin UserID từ query param URL, tin vào UserId của session).
- Đơn có thuộc loại CHO PHÉP HUỶ (pending) không, hay đã checkin rồi?

---

## Checklist Khi Chạm Tới API
- [ ] Tôi có đang xóa một field ở Respones Json / DTO? Nếu có, tôi đã check code Front end gọi đến field này để vá chưa?
- [ ] API mới tạo đã làm đủ mọi logic Validation phía sever-side chưa?
- [ ] Tôi có đang lợi dụng Frontend lưu lại giá trị tính toán thay cho gọi hàm BE không?

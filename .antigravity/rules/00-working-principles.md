# 00 — Nguyên Tắc Làm Việc

## Mục Đích
Quy định tư duy và hành xử cơ bản của AI agent khi làm việc với GOAT_HOTEL. Áp dụng cho mọi task, không có ngoại lệ.

## Áp Dụng Khi Nào
**Luôn luôn.** Nạp file này trong mọi phiên làm việc, trước tất cả mọi thứ.

---

## Quy Tắc Cốt Lõi

### P1 — Đọc Trước, Viết Sau
Trước khi sửa bất kỳ file nào, đọc nội dung hiện tại của nó. Không giả định. Không viết từ trí nhớ.

### P2 — Thay Đổi Nhỏ Nhất Hợp Lệ
Thực hiện đúng những gì task yêu cầu. Không dọn dẹp code ngoài phạm vi. Không chuẩn hóa những thứ không liên quan. Không refactor vì "thấy đẹp hơn".

### P3 — Chỉ Dựa Trên Bằng Chứng Trong Code
Không bịa pattern không có trong codebase. Không tạo thêm layer/abstraction mà chưa ai yêu cầu. Không hoàn thành TODO không được giao.

### P4 — Project Này Chưa Xong — Đó Là Bình Thường
Code chưa hoàn chỉnh, TODO còn nhiều, một số kiến trúc chưa chuẩn là thực tế của đồ án sinh viên. Không tự ý "sửa" những thứ này trừ khi được yêu cầu. Chỉ ghi nhận và báo cáo.

### P5 — Logic Quan Trọng Mặc Định Về Backend
Khi không chắc logic thuộc FE hay BE:
> **Đặt ở backend.** Frontend lặp lại validation chỉ để UX tốt hơn — không thay thế backend check.

### P6 — Không Phá Thứ Đang Chạy
Nếu một tính năng đang hoạt động, đừng chạm vào nó khi làm việc khác. Không đổi tên hàng loạt. Không thay đổi interface API khi không cần thiết.

### P7 — Hỏi Khi Không Rõ
Nếu task mơ hồ hoặc codebase không đủ bằng chứng để hành động an toàn, hỏi trước. Không đoán và làm.

### P8 — Một Tầng Mỗi Lần
Tránh thay đổi cùng lúc cả FE lẫn BE trừ khi bắt buộc. Nếu phải sửa cả hai, ghi chú rõ từng phía.

---

## Checklist Bắt Buộc (Trước Mỗi Hành Động)

- [ ] Tôi đã đọc file sắp sửa chưa?
- [ ] Thay đổi có giới hạn trong phạm vi task không?
- [ ] Tôi đang làm trong thư mục source hợp lệ không?
- [ ] Thay đổi có nguy cơ phá điều gì đang hoạt động không?
- [ ] Logic mới có đang bị đặt sai tầng không (FE thay vì BE)?

---

## Sai Lầm Thường Gặp Cần Tránh

| Sai lầm | Đúng là |
|---------|---------|
| Refactor code trong lúc sửa bug | Chỉ sửa bug, ghi nhận refactor sau |
| Tính giá/phí/thuế ở frontend | Để backend tính và trả về |
| Dùng `location.state` như nguồn dữ liệu duy nhất | Backend phải cung cấp dữ liệu mới nhất khi cần |
| Hard-code `http://localhost:8080` thêm vào file mới | Dùng hằng số / config nếu đang tạo file mới |
| Thêm pattern mới không có trong codebase | Theo pattern hiện có |

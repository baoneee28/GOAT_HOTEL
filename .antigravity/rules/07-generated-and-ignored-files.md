# 07 — Thư Mục / File Rác - Cấm Chạm Vào

## Mục Đích
Khoanh vùng những Output sinh ra do quá trình Build code (như `npm run build` hay `mvn package`) hoặc những file debug log do sinh viên xuất bừa ra folder gốc.

## Áp Dụng Khi Nào
Mọi trường hợp. Nếu task yêu cầu đọc, báo cho User biết bạn có thể phân tích những file này theo yêu cầu, nhưng nó KHÔNG BAO GIỜ LÀ SOURCE CODE SỰ THẬT.

---

## 1. File Không Sinh Mã (Không Đọc Không Sửa) Lõi Project
- `backend/target/` : Kết quả build java mvn. (Tuyệt đối không chạy file class, không sửa file trong này).
- `frontend/node_modules/` : Thư viện của npm.
- `frontend/dist/` : Bản build ra tĩnh của Vite react. Cấm sửa.

## 2. Noise & Log File Môi Trường Root 
Tại `backend/` có rất nhiều file sinh ra do quá trình debug lỗi, lưu dump data:
`boot_err.txt`, `boot_err3.txt`, `boot_err4.txt`
`build_errors.txt`, `clean_err.txt`, `current_err.txt`
`err.json`, `err.txt`, `err_debug.json`, `error_debug.log`, `error_log.json`
`api_response.json`

=> **Tuyệt đối không đọc các file này để hiểu hành vi hiện tại của code Spring Boot!!!**
Muốn hiểu Database Entity đang viết gì, lật thư mục `src/main/java/.../entity` ra xem class. Muốn hiểu API trả về cái gì, mở nhánh Controller ra đọc kiểu dữ liệu trả về. File log này hầu hết là CŨ. Không lấy dữ liệu để tạo rule hay sửa hệ thống. Cấm commit.

## 3. Các Script Tiện Ích Gốc
Các file python/sql tiện ích, sinh dữ liệu tự động cho db giả định (Chạy một lần).
VD: `generate_entities.py`, `generate_sql.py`, `fix_room.py`, `goat_hotel_full_demo.sql`
- Script tiện ích không dùng để định nghĩa Database. (Định nghĩa DB nằm ở Java Entity của Hibernate/JPA). 
- KHÔNG chỉnh sửa nó trừ khi task yêu cầu rành rọt.

---

## Checklist Nhắc Nhở

- [ ] Lệnh tìm kiếm codebase của tôi có loại trừ các file log/text kể trên ra chưa?
- [ ] Tôi có định sửa file trong `target/` để "sửa lỗi nhanh" không? (Phải sửa ở nhánh `src/main/`).
- [ ] Tôi có đang dùng cái lỗi từ file log 2 tuần trước để "đoán mò" bệnh bây giờ không? (Luôn tạo log sống và xem trực tiếp nếu được yêu cầu test).

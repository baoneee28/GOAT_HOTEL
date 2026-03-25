-- Fix all Vietnamese text encoding issues (run with sqlcmd -i fix_utf8.sql)

UPDATE room_types SET type_name = N'Phòng Standard',
  description = N'Phòng tiêu chuẩn với đầy đủ tiện nghi cơ bản, phù hợp cho khách du lịch.'
WHERE id = 1;

UPDATE room_types SET type_name = N'Phòng Superior',
  description = N'Phòng cao cấp với không gian rộng rãi và view đẹp.'
WHERE id = 2;

UPDATE room_types SET type_name = N'Phòng Deluxe',
  description = N'Phòng sang trọng với bồn tắm riêng và minibar.'
WHERE id = 3;

UPDATE room_types SET type_name = N'Phòng Family',
  description = N'Phòng gia đình rộng rãi, phù hợp cho gia đình có trẻ em.'
WHERE id = 4;

UPDATE room_types SET type_name = N'Phòng Suite VIP',
  description = N'Suite cao cấp - đỉnh cao của sự sang trọng.'
WHERE id = 5;

-- Fix news
UPDATE news SET
  title   = N'Khai trương dịch vụ spa cao cấp',
  summary = N'Khách sạn GOAT tự hào giới thiệu dịch vụ spa và massage 5 sao ngay tại khuôn viên.'
WHERE id = 1;

UPDATE news SET
  title   = N'Ưu đãi đặc biệt mùa hè 2025',
  summary = N'Giảm giá lên đến 40% cho tất cả hạng phòng trong tháng 6 và tháng 7.'
WHERE id = 2;

UPDATE news SET
  title   = N'Nhà hàng buffet sáng khai trương',
  summary = N'Thưởng thức bữa sáng buffet phong phú với hơn 50 món ăn từ nhiều nền ẩm thực.'
WHERE id = 3;

UPDATE news SET
  title   = N'Nâng cấp hệ thống tiện ích phòng',
  summary = N'Toàn bộ phòng đã được trang bị smart TV 4K, máy pha cà phê cao cấp và hệ thống âm thanh mới.'
WHERE id = 4;

-- Fix items
UPDATE items SET name = N'Điều hòa nhiệt độ'  WHERE id = 1;
UPDATE items SET name = N'Tủ lạnh mini'        WHERE id = 2;
UPDATE items SET name = N'TV Smart 4K'          WHERE id = 3;
UPDATE items SET name = N'Máy sấy tóc'          WHERE id = 4;
UPDATE items SET name = N'Két sắt'               WHERE id = 5;
UPDATE items SET name = N'Bàn làm việc'          WHERE id = 6;
UPDATE items SET name = N'Minibar'               WHERE id = 7;
UPDATE items SET name = N'Bồn tắm'              WHERE id = 8;
UPDATE items SET name = N'Vòi sen'               WHERE id = 9;
UPDATE items SET name = N'Máy pha cà phê'        WHERE id = 10;

-- Fix services
UPDATE services SET name = N'Dịch vụ giặt ủi',    description = N'Giặt ủi quần áo trong ngày'      WHERE id = 1;
UPDATE services SET name = N'Phục vụ phòng',        description = N'Phục vụ tại phòng 24/7'           WHERE id = 2;
UPDATE services SET name = N'Thuê xe đưa đón',      description = N'Dịch vụ đưa đón sân bay'          WHERE id = 3;
UPDATE services SET name = N'Tour du lịch',          description = N'Tour tham quan địa danh nổi tiếng' WHERE id = 4;
UPDATE services SET name = N'Spa & Massage',         description = N'Trải nghiệm spa thư giãn cao cấp'  WHERE id = 5;

SELECT id, type_name FROM room_types;

-- Fix encoding for room_types
UPDATE room_types SET type_name = N'Phòng Standard', description = N'Phòng tiêu chuẩn với đầy đủ tiện nghi cơ bản, phù hợp cho khách du lịch một mình hoặc cặp đôi.' WHERE id = 1;
UPDATE room_types SET type_name = N'Phòng Superior', description = N'Phòng cao cấp hơn với không gian rộng rãi, view đẹp và các tiện ích bổ sung.' WHERE id = 2;
UPDATE room_types SET type_name = N'Phòng Deluxe', description = N'Phòng sang trọng với đầy đủ tiện nghi cao cấp, bồn tắm riêng và minibar.' WHERE id = 3;
UPDATE room_types SET type_name = N'Phòng Suite', description = N'Suite cao cấp với phòng khách riêng, phòng ngủ sang trọng và dịch vụ butler cá nhân.' WHERE id = 4;
UPDATE room_types SET type_name = N'Phòng Presidential', description = N'Phòng tổng thống - đỉnh cao của sự sang trọng với mọi tiện nghi tốt nhất.' WHERE id = 5;

-- Fix news titles and summaries  
UPDATE news SET title = N'Khai trương dịch vụ spa cao cấp', summary = N'Khách sạn GOAT tự hào giới thiệu dịch vụ spa và massage 5 sao ngay tại khuôn viên.' WHERE id = 1;
UPDATE news SET title = N'Ưu đãi đặc biệt mùa hè 2025', summary = N'Giảm giá lên đến 40% cho tất cả hạng phòng trong tháng 6 và tháng 7.' WHERE id = 2;
UPDATE news SET title = N'Nhà hàng buffet sáng khai trương', summary = N'Thưởng thức bữa sáng buffet phong phú với hơn 50 món ăn từ nhiều nền ẩm thực.' WHERE id = 3;
UPDATE news SET title = N'Nâng cấp hệ thống tiện ích phòng', summary = N'Toàn bộ phòng đã được trang bị smart TV 4K, máy pha cà phê cao cấp và hệ thống âm thanh mới.' WHERE id = 4;

-- Fix items
UPDATE items SET name = N'Điều hòa' WHERE name LIKE '%i%u hòa%' OR name LIKE '%iu hòa%' OR name LIKE '%á%u hòa%';
UPDATE items SET name = N'Tủ lạnh' WHERE name LIKE '%T%l%nh%';
UPDATE items SET name = N'TV Smart' WHERE name LIKE '%TV%' OR name LIKE '%T%V%';
UPDATE items SET name = N'Máy sấy tóc' WHERE name LIKE '%M%y s%y%';
UPDATE items SET name = N'Két sắt' WHERE name LIKE '%K%t s%t%';
UPDATE items SET name = N'Bàn làm việc' WHERE name LIKE '%B%n l%m%';
UPDATE items SET name = N'Minibar' WHERE name LIKE '%Minibar%';
UPDATE items SET name = N'Bồn tắm' WHERE name LIKE '%B%n t%m%';
UPDATE items SET name = N'Vòi sen' WHERE name LIKE '%V%i sen%';

-- Fix services
UPDATE services SET name = N'Dịch vụ giặt ủi', description = N'Giặt ủi quần áo trong ngày' WHERE name LIKE '%D%ch v%gi%t%';
UPDATE services SET name = N'Dịch vụ phòng', description = N'Phục vụ tại phòng 24/7' WHERE name LIKE '%D%ch v%ph%ng%';
UPDATE services SET name = N'Thuê xe', description = N'Dịch vụ đưa đón và cho thuê xe' WHERE name LIKE '%Thu%xe%' OR name LIKE N'%Xe%';
UPDATE services SET name = N'Tour du lịch', description = N'Tổ chức tour tham quan các địa danh nổi tiếng' WHERE name LIKE '%Tour%' OR name LIKE '%tour%';
UPDATE services SET name = N'Spa & Massage', description = N'Trải nghiệm spa và massage thư giãn' WHERE name LIKE '%Spa%' OR name LIKE '%spa%';

-- Verify
SELECT id, type_name FROM room_types;

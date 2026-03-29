USE goat_hotel;
GO

-- 1. Cap nhat 4 loai phong tieu chuan nhat
UPDATE room_types SET type_name = N'Standard Room', capacity = 2, price_per_night = 350000 WHERE id = 1;
UPDATE room_types SET type_name = N'Superior Room', capacity = 2, price_per_night = 500000 WHERE id = 2;
UPDATE room_types SET type_name = N'Deluxe Room', capacity = 2, price_per_night = 700000 WHERE id = 3;
UPDATE room_types SET type_name = N'Family Room', capacity = 4, price_per_night = 1050000 WHERE id = 4;

-- 2. Chuyen hoac xoa cac phòng thua
UPDATE rooms SET type_id = 1 WHERE type_id IN (5, 6);

-- 3. Xoa room_type_items cua 5, 6
DELETE FROM room_type_items WHERE type_id IN (5, 6);

-- 4. Xoa booking_details neu lien quan (it khi xay ra neu room da bi doi, nhung de chac chan)
-- Thuc ra khong the xoa booking dễ dàng, nên chỉ cập nhật room_type
UPDATE featured_room_types SET room_type_id = 3 WHERE id = 1; 
UPDATE featured_room_types SET room_type_id = 4 WHERE id = 2; 
DELETE FROM featured_room_types WHERE id > 2;

-- 5. Xoa loai phong 5, 6
DELETE FROM room_types WHERE id IN (5, 6);
GO

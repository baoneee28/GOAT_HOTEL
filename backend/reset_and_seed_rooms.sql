-- Kịch bản (Script) Database - GOAT Hotel
-- Tác dụng: Xóa các phòng cũ chưa có đơn đặt và tạo lại chuẩn 5 phòng / loại phòng
-- Cách thực hiện: Chạy một lần (Idempotent)

USE goat_hotel;
GO

SET NOCOUNT ON;
PRINT '--- BẮT ĐẦU CẬP NHẬT PHÒNG KHÁCH SẠN CHUYÊN NGHIỆP ---';

-- BƯỚC 1: Xóa các phòng không dính líu đến đơn đặt hàng (BookingDetail)
-- Giúp làm sạch dữ liệu cũ/tạp nham
DELETE FROM rooms 
WHERE id NOT IN (SELECT DISTINCT room_id FROM booking_details);

PRINT 'Đã xóa các phòng dư thừa không có booking.';

-- BƯỚC 2: Thêm từng phòng còn thiếu cho mỗi loại phòng (Đảm bảo đúng 5 phòng/loại)
DECLARE @TypeId INT;
DECLARE @CurrentCount INT;
DECLARE @RoomsNeeded INT;

DECLARE type_cursor CURSOR FOR
SELECT id FROM room_types ORDER BY id;

OPEN type_cursor;
FETCH NEXT FROM type_cursor INTO @TypeId;

WHILE @@FETCH_STATUS = 0
BEGIN
    SELECT @CurrentCount = COUNT(*) FROM rooms WHERE type_id = @TypeId;
    
    SET @RoomsNeeded = 5 - @CurrentCount;
    
    IF @RoomsNeeded > 0
    BEGIN
        PRINT 'Đang bổ sung ' + CAST(@RoomsNeeded AS VARCHAR) + ' phòng cho Loại phòng ID: ' + CAST(@TypeId AS VARCHAR);
        DECLARE @RoomCounter INT = 1;

        -- Tìm số thứ tự phòng tiếp theo để insert (nếu 101, 102 có rồi thì nhảy lên)
        WHILE @RoomsNeeded > 0
        BEGIN
            DECLARE @NewRoomNumber NVARCHAR(10);
            DECLARE @Prefix INT = @TypeId;
            IF @Prefix > 9 SET @Prefix = @Prefix % 10;
            IF @Prefix = 0 SET @Prefix = 1;

            SET @NewRoomNumber = CAST(@Prefix AS NVARCHAR(5)) + RIGHT('00' + CAST(@RoomCounter AS NVARCHAR(5)), 2);
            
            IF NOT EXISTS (SELECT 1 FROM rooms WHERE room_number = @NewRoomNumber)
            BEGIN
                INSERT INTO rooms (room_number, status, type_id)
                VALUES (@NewRoomNumber, 'available', @TypeId);
                
                SET @RoomsNeeded = @RoomsNeeded - 1;
            END
            
            SET @RoomCounter = @RoomCounter + 1;
        END
    END
    ELSE
    BEGIN
        PRINT 'Loại phòng ID: ' + CAST(@TypeId AS VARCHAR) + ' đã có đủ hoặc hơn 5 phòng.';
    END

    FETCH NEXT FROM type_cursor INTO @TypeId;
END

CLOSE type_cursor;
DEALLOCATE type_cursor;

PRINT '--- HOÀN TẤT CẬP NHẬT DATABASE ---';
GO

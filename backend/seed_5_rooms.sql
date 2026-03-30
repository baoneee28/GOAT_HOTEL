USE goat_hotel;
GO

SET NOCOUNT ON;
PRINT '--- START SEEDING 5 ROOMS PER TYPE ---';

DECLARE @TypeId INT;
DECLARE @CurrentCount INT;
DECLARE @RoomsNeeded INT;

-- Con trỏ để duyệt từng loại phòng
DECLARE type_cursor CURSOR FOR
SELECT id FROM room_types ORDER BY id;

OPEN type_cursor;
FETCH NEXT FROM type_cursor INTO @TypeId;

WHILE @@FETCH_STATUS = 0
BEGIN
    -- Kiểm tra số lượng phòng hiện tại
    SELECT @CurrentCount = COUNT(*) FROM rooms WHERE type_id = @TypeId;
    
    SET @RoomsNeeded = 5 - @CurrentCount;
    
    IF @RoomsNeeded > 0
    BEGIN
        PRINT 'Dang them ' + CAST(@RoomsNeeded AS VARCHAR) + ' phong cho loai phong co ID ' + CAST(@TypeId AS VARCHAR);
        DECLARE @RoomCounter INT = @CurrentCount + 1;
        
        WHILE @RoomCounter <= 5
        BEGIN
            DECLARE @NewRoomNumber NVARCHAR(10);
            -- Sinh mã phòng dạng: {Tầng}{Số} -> Tầng là ID loại phòng (1, 2, 3...)
            DECLARE @Prefix INT = @TypeId;
            IF @Prefix > 9 SET @Prefix = @Prefix % 10;
            IF @Prefix = 0 SET @Prefix = 1;

            SET @NewRoomNumber = CAST(@Prefix AS NVARCHAR(5)) + RIGHT('00' + CAST(@RoomCounter AS NVARCHAR(5)), 2);
            
            -- Đảm bảo không trùng với phòng đã có
            WHILE EXISTS (SELECT 1 FROM rooms WHERE room_number = @NewRoomNumber)
            BEGIN
                SET @RoomCounter = @RoomCounter + 1;
                SET @NewRoomNumber = CAST(@Prefix AS NVARCHAR(5)) + RIGHT('00' + CAST(@RoomCounter AS NVARCHAR(5)), 2);
            END

            -- Tránh lỗi logic loop nếu vô tình có quá nhiều
            IF @RoomCounter <= 50
            BEGIN
                INSERT INTO rooms (room_number, status, type_id)
                VALUES (@NewRoomNumber, 'available', @TypeId);
            END
            
            SET @RoomCounter = @RoomCounter + 1;
        END
    END
    ELSE
    BEGIN
        PRINT 'Loai phong ID ' + CAST(@TypeId AS VARCHAR) + ' da co du hoac hon 5 phong.';
    END

    FETCH NEXT FROM type_cursor INTO @TypeId;
END

CLOSE type_cursor;
DEALLOCATE type_cursor;

PRINT '--- HOAN TAT ---';
GO

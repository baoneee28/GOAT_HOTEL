IF COL_LENGTH(N'dbo.booking_details', N'guest_count') IS NULL
BEGIN
    ALTER TABLE dbo.booking_details ADD guest_count INT NULL;
END
GO

IF COL_LENGTH(N'dbo.booking_details', N'guest_count') IS NOT NULL
    AND COL_LENGTH(N'dbo.rooms', N'type_id') IS NOT NULL
BEGIN
    UPDATE bd
    SET guest_count = COALESCE(rt.capacity, 1)
    FROM dbo.booking_details bd
    LEFT JOIN dbo.rooms r ON r.id = bd.room_id
    LEFT JOIN dbo.room_types rt ON rt.id = r.type_id
    WHERE bd.guest_count IS NULL;
END
GO

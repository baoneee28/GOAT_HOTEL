IF COL_LENGTH('room_types', 'room_size') IS NULL
BEGIN
    ALTER TABLE room_types ADD room_size NVARCHAR(50) NULL;
END;

IF COL_LENGTH('room_types', 'beds') IS NULL
BEGIN
    ALTER TABLE room_types ADD beds NVARCHAR(100) NULL;
END;

IF COL_LENGTH('room_types', 'view_description') IS NULL
BEGIN
    ALTER TABLE room_types ADD view_description NVARCHAR(100) NULL;
END;

UPDATE room_types
SET
    room_size = CASE WHEN room_size IS NULL OR LTRIM(RTRIM(room_size)) = '' THEN N'20m²' ELSE room_size END,
    beds = CASE WHEN beds IS NULL OR LTRIM(RTRIM(beds)) = '' THEN N'1 giường đôi' ELSE beds END,
    view_description = CASE WHEN view_description IS NULL OR LTRIM(RTRIM(view_description)) = '' THEN N'Hướng vườn / nội khu' ELSE view_description END
WHERE LOWER(type_name) LIKE '%standard%';

UPDATE room_types
SET
    room_size = CASE WHEN room_size IS NULL OR LTRIM(RTRIM(room_size)) = '' THEN N'24m²' ELSE room_size END,
    beds = CASE WHEN beds IS NULL OR LTRIM(RTRIM(beds)) = '' THEN N'2 giường đơn / 1 giường đôi' ELSE beds END,
    view_description = CASE WHEN view_description IS NULL OR LTRIM(RTRIM(view_description)) = '' THEN N'Hướng thành phố' ELSE view_description END
WHERE LOWER(type_name) LIKE '%superior%';

UPDATE room_types
SET
    room_size = CASE WHEN room_size IS NULL OR LTRIM(RTRIM(room_size)) = '' THEN N'28m²' ELSE room_size END,
    beds = CASE WHEN beds IS NULL OR LTRIM(RTRIM(beds)) = '' OR LOWER(LTRIM(RTRIM(beds))) LIKE N'%queen%' THEN N'2 giường đơn / 1 giường đôi' ELSE beds END,
    view_description = CASE WHEN view_description IS NULL OR LTRIM(RTRIM(view_description)) = '' THEN N'Hướng biển' ELSE view_description END
WHERE LOWER(type_name) LIKE '%deluxe%';

UPDATE room_types
SET
    room_size = CASE WHEN room_size IS NULL OR LTRIM(RTRIM(room_size)) = '' THEN N'35m²' ELSE room_size END,
    beds = CASE WHEN beds IS NULL OR LTRIM(RTRIM(beds)) = '' THEN N'2 giường đôi' ELSE beds END,
    view_description = CASE WHEN view_description IS NULL OR LTRIM(RTRIM(view_description)) = '' THEN N'Hướng hồ bơi / thành phố' ELSE view_description END
WHERE LOWER(type_name) LIKE '%family%';

IF OBJECT_ID('contact_messages', 'U') IS NULL
BEGIN
    CREATE TABLE contact_messages (
        id INT IDENTITY(1,1) PRIMARY KEY,
        first_name NVARCHAR(100) NOT NULL,
        last_name NVARCHAR(100) NOT NULL,
        email NVARCHAR(150) NOT NULL,
        message NVARCHAR(MAX) NOT NULL,
        status NVARCHAR(20) NOT NULL CONSTRAINT DF_contact_messages_status DEFAULT 'new',
        admin_note NVARCHAR(MAX) NULL,
        created_at DATETIME2 NOT NULL CONSTRAINT DF_contact_messages_created_at DEFAULT SYSDATETIME(),
        updated_at DATETIME2 NULL
    );
END;

/*
GOAT HOTEL - SQL Server Full Setup Script
Nguon su that cua schema la entity JPA trong backend/src/main/java/com/hotel/entity.
Script nay duoc viet de ca nhom co the tao DB moi va seed du lieu demo de chay project.

Ghi chu:
- Public data duoi day da duoc canh theo snapshot project dang chay ngay 01/04/2026:
  room types, room inventory, featured rooms, featured news, news content.
- Cac du lieu private nhu user noi bo, booking lich su, inbox admin van duoc giu o muc demo an toan
  vi khong dump truc tiep DB live vao repo.
- De mirror du lieu demo sat nhat, nen chay tren DB moi / DB da xoa seed cu.

Huong dan:
1. Mo script trong SSMS / Azure Data Studio / sqlcmd.
2. Chay toan bo file.
3. Start lai backend neu can.

Tai khoan demo:
- Admin: admin@goathotel.local / admin123
- User : customer@goathotel.local / customer123
*/

SET NOCOUNT ON;
GO

IF DB_ID(N'goat_hotel') IS NULL
BEGIN
    CREATE DATABASE [goat_hotel];
END
GO

USE [goat_hotel];
GO

/* =========================================================
   TABLES
   ========================================================= */

IF OBJECT_ID(N'dbo.users', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.users (
        id INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        full_name NVARCHAR(100) NOT NULL,
        email NVARCHAR(100) NOT NULL,
        password NVARCHAR(255) NOT NULL,
        phone NVARCHAR(15) NULL,
        image NVARCHAR(255) NULL,
        role NVARCHAR(20) NOT NULL CONSTRAINT DF_users_role DEFAULT N'customer',
        created_at DATETIME2 NULL CONSTRAINT DF_users_created_at DEFAULT SYSDATETIME()
    );

    ALTER TABLE dbo.users
        ADD CONSTRAINT UQ_users_email UNIQUE (email);
END
GO

IF OBJECT_ID(N'dbo.room_types', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.room_types (
        id INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        type_name NVARCHAR(100) NOT NULL,
        price_per_night FLOAT NOT NULL,
        capacity INT NOT NULL,
        room_size NVARCHAR(50) NULL,
        beds NVARCHAR(100) NULL,
        view_description NVARCHAR(100) NULL,
        description NVARCHAR(MAX) NULL,
        image NVARCHAR(MAX) NULL
    );
END
GO

IF OBJECT_ID(N'dbo.items', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.items (
        id INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        name NVARCHAR(100) NOT NULL,
        image NVARCHAR(255) NULL
    );
END
GO

IF OBJECT_ID(N'dbo.rooms', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.rooms (
        id INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        room_number NVARCHAR(10) NOT NULL,
        type_id INT NULL,
        status NVARCHAR(20) NOT NULL CONSTRAINT DF_rooms_status DEFAULT N'available',
        CONSTRAINT UQ_rooms_room_number UNIQUE (room_number),
        CONSTRAINT FK_rooms_room_type FOREIGN KEY (type_id) REFERENCES dbo.room_types(id)
    );
END
GO

IF OBJECT_ID(N'dbo.room_type_items', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.room_type_items (
        type_id INT NOT NULL,
        item_id INT NOT NULL,
        CONSTRAINT PK_room_type_items PRIMARY KEY (type_id, item_id),
        CONSTRAINT FK_room_type_items_room_type FOREIGN KEY (type_id) REFERENCES dbo.room_types(id),
        CONSTRAINT FK_room_type_items_item FOREIGN KEY (item_id) REFERENCES dbo.items(id)
    );
END
GO

IF OBJECT_ID(N'dbo.bookings', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.bookings (
        id INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        user_id INT NULL,
        total_price FLOAT NULL,
        status NVARCHAR(20) NOT NULL CONSTRAINT DF_bookings_status DEFAULT N'pending',
        payment_status NVARCHAR(30) NOT NULL CONSTRAINT DF_bookings_payment_status DEFAULT N'unpaid',
        created_at DATETIME2 NULL CONSTRAINT DF_bookings_created_at DEFAULT SYSDATETIME(),
        expires_at DATETIME2 NULL,
        CONSTRAINT FK_bookings_user FOREIGN KEY (user_id) REFERENCES dbo.users(id)
    );
END
GO

IF OBJECT_ID(N'dbo.booking_details', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.booking_details (
        id INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        booking_id INT NOT NULL,
        room_id INT NULL,
        price_at_booking FLOAT NOT NULL,
        check_in DATETIME2 NULL,
        check_out DATETIME2 NULL,
        check_in_actual DATETIME2 NULL,
        check_out_actual DATETIME2 NULL,
        total_hours FLOAT NULL CONSTRAINT DF_booking_details_total_hours DEFAULT 0,
        CONSTRAINT FK_booking_details_booking FOREIGN KEY (booking_id) REFERENCES dbo.bookings(id),
        CONSTRAINT FK_booking_details_room FOREIGN KEY (room_id) REFERENCES dbo.rooms(id)
    );
END
GO

IF OBJECT_ID(N'dbo.services', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.services (
        id INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        name NVARCHAR(100) NOT NULL,
        price FLOAT NOT NULL,
        description NVARCHAR(MAX) NULL,
        image NVARCHAR(255) NULL
    );
END
GO

IF OBJECT_ID(N'dbo.booking_services', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.booking_services (
        id INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        booking_id INT NOT NULL,
        service_id INT NULL,
        quantity INT NOT NULL CONSTRAINT DF_booking_services_quantity DEFAULT 1,
        price_at_booking FLOAT NOT NULL,
        created_at DATETIME2 NULL CONSTRAINT DF_booking_services_created_at DEFAULT SYSDATETIME(),
        CONSTRAINT FK_booking_services_booking FOREIGN KEY (booking_id) REFERENCES dbo.bookings(id),
        CONSTRAINT FK_booking_services_service FOREIGN KEY (service_id) REFERENCES dbo.services(id)
    );
END
GO

IF OBJECT_ID(N'dbo.payments', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.payments (
        id INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        booking_id INT NOT NULL,
        amount FLOAT NOT NULL,
        payment_method NVARCHAR(50) NOT NULL,
        payment_date DATETIME2 NOT NULL,
        status NVARCHAR(20) NOT NULL CONSTRAINT DF_payments_status DEFAULT N'paid',
        CONSTRAINT FK_payments_booking FOREIGN KEY (booking_id) REFERENCES dbo.bookings(id)
    );
END
GO

IF OBJECT_ID(N'dbo.news', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.news (
        id INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        title NVARCHAR(255) NOT NULL,
        slug NVARCHAR(255) NOT NULL,
        summary NVARCHAR(MAX) NULL,
        content NVARCHAR(MAX) NULL,
        image NVARCHAR(255) NULL,
        created_at DATETIME2 NULL CONSTRAINT DF_news_created_at DEFAULT SYSDATETIME()
    );
END
GO

IF OBJECT_ID(N'dbo.featured_room_types', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.featured_room_types (
        id INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        room_type_id INT NOT NULL,
        display_order INT NOT NULL CONSTRAINT DF_featured_room_types_display_order DEFAULT 0,
        created_at DATETIME2 NOT NULL CONSTRAINT DF_featured_room_types_created_at DEFAULT SYSDATETIME(),
        CONSTRAINT FK_featured_room_types_room_type FOREIGN KEY (room_type_id) REFERENCES dbo.room_types(id)
    );
END
GO

IF OBJECT_ID(N'dbo.featured_news', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.featured_news (
        id INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        news_id INT NOT NULL,
        display_order INT NOT NULL CONSTRAINT DF_featured_news_display_order DEFAULT 0,
        created_at DATETIME2 NOT NULL CONSTRAINT DF_featured_news_created_at DEFAULT SYSDATETIME(),
        CONSTRAINT FK_featured_news_news FOREIGN KEY (news_id) REFERENCES dbo.news(id)
    );
END
GO

IF OBJECT_ID(N'dbo.contact_messages', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.contact_messages (
        id INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        first_name NVARCHAR(100) NOT NULL,
        last_name NVARCHAR(100) NOT NULL,
        email NVARCHAR(150) NOT NULL,
        message NVARCHAR(MAX) NOT NULL,
        status NVARCHAR(20) NOT NULL CONSTRAINT DF_contact_messages_status DEFAULT N'new',
        admin_note NVARCHAR(MAX) NULL,
        created_at DATETIME2 NULL CONSTRAINT DF_contact_messages_created_at DEFAULT SYSDATETIME(),
        updated_at DATETIME2 NULL CONSTRAINT DF_contact_messages_updated_at DEFAULT SYSDATETIME()
    );
END
GO

IF OBJECT_ID(N'dbo.reviews', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.reviews (
        id INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        user_id INT NULL,
        room_type_id INT NULL,
        booking_id INT NULL,
        rating INT NOT NULL,
        comment NVARCHAR(MAX) NULL,
        created_at DATETIME2 NULL CONSTRAINT DF_reviews_created_at DEFAULT SYSDATETIME(),
        CONSTRAINT FK_reviews_user FOREIGN KEY (user_id) REFERENCES dbo.users(id),
        CONSTRAINT FK_reviews_room_type FOREIGN KEY (room_type_id) REFERENCES dbo.room_types(id),
        CONSTRAINT FK_reviews_booking FOREIGN KEY (booking_id) REFERENCES dbo.bookings(id)
    );
END
GO

IF OBJECT_ID(N'dbo.coupons', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.coupons (
        id INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        code NVARCHAR(50) NOT NULL UNIQUE,
        description NVARCHAR(MAX) NULL,
        discount_type NVARCHAR(20) NOT NULL,
        discount_value FLOAT NOT NULL,
        max_uses INT NULL,
        current_uses INT NOT NULL CONSTRAINT DF_coupons_current_uses DEFAULT 0,
        start_date DATETIME2 NULL,
        end_date DATETIME2 NULL,
        min_booking_value FLOAT NULL,
        is_active BIT NOT NULL CONSTRAINT DF_coupons_is_active DEFAULT 1,
        target_event NVARCHAR(50) NULL,
        created_at DATETIME2 NULL CONSTRAINT DF_coupons_created_at DEFAULT SYSDATETIME()
    );
END
GO

IF OBJECT_ID(N'dbo.user_coupons', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.user_coupons (
        id INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        user_id INT NOT NULL,
        coupon_id INT NOT NULL,
        is_used BIT NOT NULL CONSTRAINT DF_user_coupons_is_used DEFAULT 0,
        granted_at DATETIME2 NULL CONSTRAINT DF_user_coupons_granted_at DEFAULT SYSDATETIME(),
        used_at DATETIME2 NULL,
        CONSTRAINT FK_user_coupons_user FOREIGN KEY (user_id) REFERENCES dbo.users(id),
        CONSTRAINT FK_user_coupons_coupon FOREIGN KEY (coupon_id) REFERENCES dbo.coupons(id)
    );
END
GO

IF OBJECT_ID(N'dbo.notifications', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.notifications (
        id INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        user_id INT NOT NULL,
        title NVARCHAR(255) NOT NULL,
        message NVARCHAR(MAX) NOT NULL,
        type NVARCHAR(50) NOT NULL CONSTRAINT DF_notifications_type DEFAULT N'SYSTEM',
        related_id INT NULL,
        is_read BIT NOT NULL CONSTRAINT DF_notifications_is_read DEFAULT 0,
        created_at DATETIME2 NULL CONSTRAINT DF_notifications_created_at DEFAULT SYSDATETIME(),
        CONSTRAINT FK_notifications_user FOREIGN KEY (user_id) REFERENCES dbo.users(id)
    );
END
GO

IF OBJECT_ID(N'dbo.password_reset_codes', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.password_reset_codes (
        id INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        email NVARCHAR(100) NOT NULL,
        code NVARCHAR(10) NOT NULL,
        expires_at DATETIME2 NOT NULL,
        is_used BIT NOT NULL CONSTRAINT DF_password_reset_codes_is_used DEFAULT 0,
        created_at DATETIME2 NULL CONSTRAINT DF_password_reset_codes_created_at DEFAULT SYSDATETIME()
    );
END
GO

/* =========================================================
   INDEXES
   ========================================================= */

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_rooms_type_status' AND object_id = OBJECT_ID(N'dbo.rooms'))
    CREATE INDEX IX_rooms_type_status ON dbo.rooms(type_id, status);
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_bookings_user_status' AND object_id = OBJECT_ID(N'dbo.bookings'))
    CREATE INDEX IX_bookings_user_status ON dbo.bookings(user_id, status, expires_at);
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_booking_details_room_range' AND object_id = OBJECT_ID(N'dbo.booking_details'))
    CREATE INDEX IX_booking_details_room_range ON dbo.booking_details(room_id, check_in, check_out);
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_payments_booking' AND object_id = OBJECT_ID(N'dbo.payments'))
    CREATE INDEX IX_payments_booking ON dbo.payments(booking_id);
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_news_slug' AND object_id = OBJECT_ID(N'dbo.news'))
    CREATE INDEX IX_news_slug ON dbo.news(slug);
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_contact_messages_status_created_at' AND object_id = OBJECT_ID(N'dbo.contact_messages'))
    CREATE INDEX IX_contact_messages_status_created_at ON dbo.contact_messages(status, created_at DESC);
GO

/* =========================================================
   SEED DATA - USERS
   ========================================================= */

IF NOT EXISTS (SELECT 1 FROM dbo.users WHERE email = N'admin@goathotel.local')
BEGIN
    INSERT INTO dbo.users (full_name, email, password, phone, image, role, created_at)
    VALUES (N'GOAT Admin', N'admin@goathotel.local', N'admin123', N'0900000001', NULL, N'admin', SYSDATETIME());
END
GO

IF NOT EXISTS (SELECT 1 FROM dbo.users WHERE email = N'customer@goathotel.local')
BEGIN
    INSERT INTO dbo.users (full_name, email, password, phone, image, role, created_at)
    VALUES (N'Khach Hang Demo', N'customer@goathotel.local', N'customer123', N'0900000002', NULL, N'customer', SYSDATETIME());
END
GO

IF NOT EXISTS (SELECT 1 FROM dbo.users WHERE email = N'customer2@goathotel.local')
BEGIN
    INSERT INTO dbo.users (full_name, email, password, phone, image, role, created_at)
    VALUES (N'Thanh Vien Demo', N'customer2@goathotel.local', N'customer123', N'0900000003', NULL, N'customer', SYSDATETIME());
END
GO

/* =========================================================
   SEED DATA - ITEMS
   ========================================================= */

IF NOT EXISTS (SELECT 1 FROM dbo.items WHERE name = N'Máy lạnh')
    INSERT INTO dbo.items (name, image) VALUES (N'Máy lạnh', N'/icons/air-conditioner.png');
GO
IF NOT EXISTS (SELECT 1 FROM dbo.items WHERE name = N'TV Smart')
    INSERT INTO dbo.items (name, image) VALUES (N'TV Smart', N'/icons/tv.png');
GO
IF NOT EXISTS (SELECT 1 FROM dbo.items WHERE name = N'Tủ lạnh mini')
    INSERT INTO dbo.items (name, image) VALUES (N'Tủ lạnh mini', N'/icons/mini.png');
GO
IF NOT EXISTS (SELECT 1 FROM dbo.items WHERE name = N'Bồn tắm')
    INSERT INTO dbo.items (name, image) VALUES (N'Bồn tắm', N'/icons/jacuzzi.png');
GO
IF NOT EXISTS (SELECT 1 FROM dbo.items WHERE name = N'WiFi VIP')
    INSERT INTO dbo.items (name, image) VALUES (N'WiFi VIP', N'/icons/wifi.png');
GO
IF NOT EXISTS (SELECT 1 FROM dbo.items WHERE name = N'Két sắt')
    INSERT INTO dbo.items (name, image) VALUES (N'Két sắt', N'/icons/safe.png');
GO
IF NOT EXISTS (SELECT 1 FROM dbo.items WHERE name = N'Máy sấy tóc')
    INSERT INTO dbo.items (name, image) VALUES (N'Máy sấy tóc', N'/icons/hairdryer.png');
GO
IF NOT EXISTS (SELECT 1 FROM dbo.items WHERE name = N'Bàn ủi')
    INSERT INTO dbo.items (name, image) VALUES (N'Bàn ủi', N'/icons/ironing.png');
GO
IF NOT EXISTS (SELECT 1 FROM dbo.items WHERE name = N'Ban công')
    INSERT INTO dbo.items (name, image) VALUES (N'Ban công', N'/icons/balcony.png');
GO
IF NOT EXISTS (SELECT 1 FROM dbo.items WHERE name = N'Ghế tình yêu')
    INSERT INTO dbo.items (name, image) VALUES (N'Ghế tình yêu', N'/icons/heart.png');
GO

/* =========================================================
   SEED DATA - ROOM TYPES
   ========================================================= */

IF NOT EXISTS (SELECT 1 FROM dbo.room_types WHERE type_name = N'Standard Room')
BEGIN
    INSERT INTO dbo.room_types (type_name, price_per_night, capacity, room_size, beds, view_description, description, image)
    VALUES (
        N'Standard Room',
        350000,
        2,
        N'20m²',
        N'1 giường đôi',
        N'Hướng vườn / nội khu',
        N'Phòng Standard là lựa chọn cơ bản, phù hợp cho 2 khách với đầy đủ tiện nghi thiết yếu cho kỳ nghỉ ngắn ngày hoặc chuyến công tác tiết kiệm.',
        N'/images/rooms/standard-room.jpg'
    );
END
GO

IF NOT EXISTS (SELECT 1 FROM dbo.room_types WHERE type_name = N'Superior Room')
BEGIN
    INSERT INTO dbo.room_types (type_name, price_per_night, capacity, room_size, beds, view_description, description, image)
    VALUES (
        N'Superior Room',
        500000,
        2,
        N'24m²',
        N'2 giường đơn / 1 giường đôi',
        N'Hướng thành phố',
        N'Phòng Superior mang lại không gian rộng rãi hơn Standard, phù hợp cho khách công tác hoặc cặp đôi cần sự thoải mái hơn trong quá trình lưu trú.',
        N'/images/rooms/superior-room.jpg'
    );
END
GO

IF NOT EXISTS (SELECT 1 FROM dbo.room_types WHERE type_name = N'Deluxe Room')
BEGIN
    INSERT INTO dbo.room_types (type_name, price_per_night, capacity, room_size, beds, view_description, description, image)
    VALUES (
        N'Deluxe Room',
        700000,
        2,
        N'28m²',
        N'2 giường đơn / 1 giường đôi',
        N'Hướng biển',
        N'Phòng Deluxe phù hợp cho khách muốn trải nghiệm không gian nghỉ dưỡng cao cấp hơn, với diện tích rộng, nội thất hiện đại và hướng nhìn đẹp.',
        N'/images/rooms/deluxe-room.jpg'
    );
END
GO

IF NOT EXISTS (SELECT 1 FROM dbo.room_types WHERE type_name = N'Family Room')
BEGIN
    INSERT INTO dbo.room_types (type_name, price_per_night, capacity, room_size, beds, view_description, description, image)
    VALUES (
        N'Family Room',
        950000,
        4,
        N'35m²',
        N'2 giường đôi',
        N'Hướng hồ bơi / thành phố',
        N'Phòng Family được thiết kế cho gia đình hoặc nhóm bạn, có sức chứa lớn, diện tích rộng và bố trí giường hợp lý để tạo sự thoải mái trong suốt thời gian lưu trú.',
        N'/images/rooms/family-room.jpg'
    );
END
GO

UPDATE dbo.room_types
SET
    price_per_night = CASE type_name
        WHEN N'Standard Room' THEN 350000
        WHEN N'Superior Room' THEN 500000
        WHEN N'Deluxe Room' THEN 700000
        WHEN N'Family Room' THEN 950000
        ELSE price_per_night
    END,
    capacity = CASE type_name
        WHEN N'Standard Room' THEN 2
        WHEN N'Superior Room' THEN 2
        WHEN N'Deluxe Room' THEN 2
        WHEN N'Family Room' THEN 4
        ELSE capacity
    END,
    room_size = CASE type_name
        WHEN N'Standard Room' THEN N'20m²'
        WHEN N'Superior Room' THEN N'24m²'
        WHEN N'Deluxe Room' THEN N'28m²'
        WHEN N'Family Room' THEN N'35m²'
        ELSE room_size
    END,
    beds = CASE type_name
        WHEN N'Standard Room' THEN N'1 giường đôi'
        WHEN N'Superior Room' THEN N'2 giường đơn / 1 giường đôi'
        WHEN N'Deluxe Room' THEN N'2 giường đơn / 1 giường đôi'
        WHEN N'Family Room' THEN N'2 giường đôi'
        ELSE beds
    END,
    view_description = CASE type_name
        WHEN N'Standard Room' THEN N'Hướng vườn / nội khu'
        WHEN N'Superior Room' THEN N'Hướng thành phố'
        WHEN N'Deluxe Room' THEN N'Hướng biển'
        WHEN N'Family Room' THEN N'Hướng hồ bơi / thành phố'
        ELSE view_description
    END,
    description = CASE type_name
        WHEN N'Standard Room' THEN N'Phòng Standard là lựa chọn cơ bản, phù hợp cho 2 khách với đầy đủ tiện nghi thiết yếu cho kỳ nghỉ ngắn ngày hoặc chuyến công tác tiết kiệm.'
        WHEN N'Superior Room' THEN N'Phòng Superior mang lại không gian rộng rãi hơn Standard, phù hợp cho khách công tác hoặc cặp đôi cần sự thoải mái hơn trong quá trình lưu trú.'
        WHEN N'Deluxe Room' THEN N'Phòng Deluxe phù hợp cho khách muốn trải nghiệm không gian nghỉ dưỡng cao cấp hơn, với diện tích rộng, nội thất hiện đại và hướng nhìn đẹp.'
        WHEN N'Family Room' THEN N'Phòng Family được thiết kế cho gia đình hoặc nhóm bạn, có sức chứa lớn, diện tích rộng và bố trí giường hợp lý để tạo sự thoải mái trong suốt thời gian lưu trú.'
        ELSE description
    END,
    image = CASE type_name
        WHEN N'Standard Room' THEN N'/images/rooms/standard-room.jpg'
        WHEN N'Superior Room' THEN N'/images/rooms/superior-room.jpg'
        WHEN N'Deluxe Room' THEN N'/images/rooms/deluxe-room.jpg'
        WHEN N'Family Room' THEN N'/images/rooms/family-room.jpg'
        ELSE image
    END
WHERE type_name IN (N'Standard Room', N'Superior Room', N'Deluxe Room', N'Family Room');
GO

/* =========================================================
   SEED DATA - ROOM TYPE ITEMS
   ========================================================= */

INSERT INTO dbo.room_type_items (type_id, item_id)
SELECT rt.id, i.id
FROM dbo.room_types rt
JOIN dbo.items i ON i.name IN (N'Tủ lạnh mini', N'Két sắt', N'Bàn ủi', N'Ghế tình yêu')
WHERE rt.type_name = N'Standard Room'
  AND NOT EXISTS (
      SELECT 1 FROM dbo.room_type_items rti WHERE rti.type_id = rt.id AND rti.item_id = i.id
  );
GO

INSERT INTO dbo.room_type_items (type_id, item_id)
SELECT rt.id, i.id
FROM dbo.room_types rt
JOIN dbo.items i ON i.name IN (N'Máy lạnh', N'Tủ lạnh mini', N'Két sắt', N'Bàn ủi', N'Ban công')
WHERE rt.type_name = N'Superior Room'
  AND NOT EXISTS (
      SELECT 1 FROM dbo.room_type_items rti WHERE rti.type_id = rt.id AND rti.item_id = i.id
  );
GO

INSERT INTO dbo.room_type_items (type_id, item_id)
SELECT rt.id, i.id
FROM dbo.room_types rt
JOIN dbo.items i ON i.name IN (N'Máy lạnh', N'Bồn tắm', N'WiFi VIP', N'Két sắt', N'Máy sấy tóc', N'Ban công')
WHERE rt.type_name = N'Deluxe Room'
  AND NOT EXISTS (
      SELECT 1 FROM dbo.room_type_items rti WHERE rti.type_id = rt.id AND rti.item_id = i.id
  );
GO

INSERT INTO dbo.room_type_items (type_id, item_id)
SELECT rt.id, i.id
FROM dbo.room_types rt
JOIN dbo.items i ON i.name IN (N'Máy lạnh', N'TV Smart', N'Tủ lạnh mini', N'Bồn tắm', N'Két sắt', N'Ban công', N'Ghế tình yêu')
WHERE rt.type_name = N'Family Room'
  AND NOT EXISTS (
      SELECT 1 FROM dbo.room_type_items rti WHERE rti.type_id = rt.id AND rti.item_id = i.id
  );
GO

/* =========================================================
   SEED DATA - ROOMS
   ========================================================= */

INSERT INTO dbo.rooms (room_number, type_id, status)
SELECT N'101', rt.id, N'available' FROM dbo.room_types rt
WHERE rt.type_name = N'Standard Room'
  AND NOT EXISTS (SELECT 1 FROM dbo.rooms WHERE room_number = N'101');
GO
INSERT INTO dbo.rooms (room_number, type_id, status)
SELECT N'102', rt.id, N'available' FROM dbo.room_types rt
WHERE rt.type_name = N'Standard Room'
  AND NOT EXISTS (SELECT 1 FROM dbo.rooms WHERE room_number = N'102');
GO
INSERT INTO dbo.rooms (room_number, type_id, status)
SELECT N'103', rt.id, N'available' FROM dbo.room_types rt
WHERE rt.type_name = N'Standard Room'
  AND NOT EXISTS (SELECT 1 FROM dbo.rooms WHERE room_number = N'103');
GO
INSERT INTO dbo.rooms (room_number, type_id, status)
SELECT N'104', rt.id, N'available' FROM dbo.room_types rt
WHERE rt.type_name = N'Standard Room'
  AND NOT EXISTS (SELECT 1 FROM dbo.rooms WHERE room_number = N'104');
GO
INSERT INTO dbo.rooms (room_number, type_id, status)
SELECT N'105', rt.id, N'available' FROM dbo.room_types rt
WHERE rt.type_name = N'Standard Room'
  AND NOT EXISTS (SELECT 1 FROM dbo.rooms WHERE room_number = N'105');
GO

INSERT INTO dbo.rooms (room_number, type_id, status)
SELECT N'201', rt.id, N'available' FROM dbo.room_types rt
WHERE rt.type_name = N'Superior Room'
  AND NOT EXISTS (SELECT 1 FROM dbo.rooms WHERE room_number = N'201');
GO
INSERT INTO dbo.rooms (room_number, type_id, status)
SELECT N'202', rt.id, N'available' FROM dbo.room_types rt
WHERE rt.type_name = N'Superior Room'
  AND NOT EXISTS (SELECT 1 FROM dbo.rooms WHERE room_number = N'202');
GO
INSERT INTO dbo.rooms (room_number, type_id, status)
SELECT N'203', rt.id, N'available' FROM dbo.room_types rt
WHERE rt.type_name = N'Superior Room'
  AND NOT EXISTS (SELECT 1 FROM dbo.rooms WHERE room_number = N'203');
GO
INSERT INTO dbo.rooms (room_number, type_id, status)
SELECT N'204', rt.id, N'available' FROM dbo.room_types rt
WHERE rt.type_name = N'Superior Room'
  AND NOT EXISTS (SELECT 1 FROM dbo.rooms WHERE room_number = N'204');
GO
INSERT INTO dbo.rooms (room_number, type_id, status)
SELECT N'205', rt.id, N'available' FROM dbo.room_types rt
WHERE rt.type_name = N'Superior Room'
  AND NOT EXISTS (SELECT 1 FROM dbo.rooms WHERE room_number = N'205');
GO

INSERT INTO dbo.rooms (room_number, type_id, status)
SELECT N'301', rt.id, N'available' FROM dbo.room_types rt
WHERE rt.type_name = N'Deluxe Room'
  AND NOT EXISTS (SELECT 1 FROM dbo.rooms WHERE room_number = N'301');
GO
INSERT INTO dbo.rooms (room_number, type_id, status)
SELECT N'302', rt.id, N'available' FROM dbo.room_types rt
WHERE rt.type_name = N'Deluxe Room'
  AND NOT EXISTS (SELECT 1 FROM dbo.rooms WHERE room_number = N'302');
GO
INSERT INTO dbo.rooms (room_number, type_id, status)
SELECT N'303', rt.id, N'available' FROM dbo.room_types rt
WHERE rt.type_name = N'Deluxe Room'
  AND NOT EXISTS (SELECT 1 FROM dbo.rooms WHERE room_number = N'303');
GO
INSERT INTO dbo.rooms (room_number, type_id, status)
SELECT N'304', rt.id, N'available' FROM dbo.room_types rt
WHERE rt.type_name = N'Deluxe Room'
  AND NOT EXISTS (SELECT 1 FROM dbo.rooms WHERE room_number = N'304');
GO
INSERT INTO dbo.rooms (room_number, type_id, status)
SELECT N'305', rt.id, N'available' FROM dbo.room_types rt
WHERE rt.type_name = N'Deluxe Room'
  AND NOT EXISTS (SELECT 1 FROM dbo.rooms WHERE room_number = N'305');
GO

INSERT INTO dbo.rooms (room_number, type_id, status)
SELECT N'401', rt.id, N'available' FROM dbo.room_types rt
WHERE rt.type_name = N'Family Room'
  AND NOT EXISTS (SELECT 1 FROM dbo.rooms WHERE room_number = N'401');
GO
INSERT INTO dbo.rooms (room_number, type_id, status)
SELECT N'402', rt.id, N'available' FROM dbo.room_types rt
WHERE rt.type_name = N'Family Room'
  AND NOT EXISTS (SELECT 1 FROM dbo.rooms WHERE room_number = N'402');
GO
INSERT INTO dbo.rooms (room_number, type_id, status)
SELECT N'403', rt.id, N'available' FROM dbo.room_types rt
WHERE rt.type_name = N'Family Room'
  AND NOT EXISTS (SELECT 1 FROM dbo.rooms WHERE room_number = N'403');
GO
INSERT INTO dbo.rooms (room_number, type_id, status)
SELECT N'404', rt.id, N'available' FROM dbo.room_types rt
WHERE rt.type_name = N'Family Room'
  AND NOT EXISTS (SELECT 1 FROM dbo.rooms WHERE room_number = N'404');
GO
INSERT INTO dbo.rooms (room_number, type_id, status)
SELECT N'405', rt.id, N'available' FROM dbo.room_types rt
WHERE rt.type_name = N'Family Room'
  AND NOT EXISTS (SELECT 1 FROM dbo.rooms WHERE room_number = N'405');
GO

INSERT INTO dbo.rooms (room_number, type_id, status)
SELECT N'BT101', rt.id, N'maintenance' FROM dbo.room_types rt
WHERE rt.type_name = N'Standard Room'
  AND NOT EXISTS (SELECT 1 FROM dbo.rooms WHERE room_number = N'BT101');
GO
INSERT INTO dbo.rooms (room_number, type_id, status)
SELECT N'BT201', rt.id, N'maintenance' FROM dbo.room_types rt
WHERE rt.type_name = N'Superior Room'
  AND NOT EXISTS (SELECT 1 FROM dbo.rooms WHERE room_number = N'BT201');
GO
INSERT INTO dbo.rooms (room_number, type_id, status)
SELECT N'BT301', rt.id, N'maintenance' FROM dbo.room_types rt
WHERE rt.type_name = N'Deluxe Room'
  AND NOT EXISTS (SELECT 1 FROM dbo.rooms WHERE room_number = N'BT301');
GO
INSERT INTO dbo.rooms (room_number, type_id, status)
SELECT N'BT401', rt.id, N'available' FROM dbo.room_types rt
WHERE rt.type_name = N'Family Room'
  AND NOT EXISTS (SELECT 1 FROM dbo.rooms WHERE room_number = N'BT401');
GO
INSERT INTO dbo.rooms (room_number, type_id, status)
SELECT N'BT402', rt.id, N'maintenance' FROM dbo.room_types rt
WHERE rt.type_name = N'Family Room'
  AND NOT EXISTS (SELECT 1 FROM dbo.rooms WHERE room_number = N'BT402');
GO

UPDATE r
SET
    r.type_id = rt.id,
    r.status = seed.status
FROM dbo.rooms r
JOIN (
    VALUES
        (N'101', N'Standard Room', N'available'),
        (N'102', N'Standard Room', N'available'),
        (N'103', N'Standard Room', N'available'),
        (N'104', N'Standard Room', N'available'),
        (N'105', N'Standard Room', N'available'),
        (N'201', N'Superior Room', N'available'),
        (N'202', N'Superior Room', N'available'),
        (N'203', N'Superior Room', N'available'),
        (N'204', N'Superior Room', N'available'),
        (N'205', N'Superior Room', N'available'),
        (N'301', N'Deluxe Room', N'available'),
        (N'302', N'Deluxe Room', N'available'),
        (N'303', N'Deluxe Room', N'available'),
        (N'304', N'Deluxe Room', N'available'),
        (N'305', N'Deluxe Room', N'available'),
        (N'401', N'Family Room', N'available'),
        (N'402', N'Family Room', N'available'),
        (N'403', N'Family Room', N'available'),
        (N'404', N'Family Room', N'available'),
        (N'405', N'Family Room', N'available'),
        (N'BT101', N'Standard Room', N'maintenance'),
        (N'BT201', N'Superior Room', N'maintenance'),
        (N'BT301', N'Deluxe Room', N'maintenance'),
        (N'BT401', N'Family Room', N'available'),
        (N'BT402', N'Family Room', N'maintenance')
) AS seed(room_number, type_name, status) ON seed.room_number = r.room_number
JOIN dbo.room_types rt ON rt.type_name = seed.type_name
WHERE r.type_id <> rt.id OR r.status <> seed.status;
GO

/* =========================================================
   SEED DATA - NEWS + FEATURED
   ========================================================= */

IF NOT EXISTS (SELECT 1 FROM dbo.news WHERE slug = N'art-of-slow-living')
BEGIN
    INSERT INTO dbo.news (title, slug, summary, content, image, created_at)
    VALUES (
        N'Khai Trương Khu Spa Và Wellness Cao Cấp Tại GOAT HOTEL',
        N'art-of-slow-living',
        N'Khu Spa và Wellness hơn 500m² chính thức đi vào hoạt động với đầy đủ dịch vụ thư giãn cao cấp.',
        N'GOAT HOTEL tự hào giới thiệu khu Spa và Wellness mới diện tích hơn 500m². Bao gồm bể sục Jacuzzi, phòng xông hơi đá muối Himalaya, phòng massage trị liệu cùng đội ngũ chuyên gia có chứng chỉ quốc tế. Khách lưu trú hạng Suite trở lên được miễn phí sử dụng toàn bộ tiện ích spa.',
        N'/images/news/news-1.jpg',
        '2026-03-25T22:03:03.9566667'
    );
END
GO

IF NOT EXISTS (SELECT 1 FROM dbo.news WHERE slug = N'culinary-horizons-chefs-table')
BEGIN
    INSERT INTO dbo.news (title, slug, summary, content, image, created_at)
    VALUES (
        N'GOAT HOTEL Vinh Dự Nhận Giải Thưởng Khách Sạn Xuất Sắc Nhất 2024',
        N'culinary-horizons-chefs-table',
        N'GOAT HOTEL nhận danh hiệu Khách Sạn Xuất Sắc Nhất Vũng Tàu 2024 từ Hiệp hội Du lịch địa phương.',
        N'Trong lễ trao giải của Hiệp hội Du lịch Bà Rịa Vũng Tàu, GOAT HOTEL xuất sắc nhận danh hiệu Khách Sạn Xuất Sắc Nhất năm 2024. Giải thưởng dựa trên tiêu chí chất lượng dịch vụ và độ hài lòng của khách hàng.',
        N'/images/news/news-2.jpg',
        '2026-03-25T22:03:03.9566667'
    );
END
GO

IF NOT EXISTS (SELECT 1 FROM dbo.news WHERE slug = N'uu di he 2024 gim 30 cho dt phong tu 3 dem tro len')
BEGIN
    INSERT INTO dbo.news (title, slug, summary, content, image, created_at)
    VALUES (
        N'Ưu Đãi Hè 2024: Giảm 30% Cho Đặt Phòng Từ 3 Đêm Trở Lên',
        N'uu di he 2024 gim 30 cho dt phong tu 3 dem tro len',
        N'Giảm 30% cho đặt phòng từ 3 đêm, kèm bữa sáng và 1 lần spa miễn phí trong mùa hè 2024.',
        N'GOAT HOTEL triển khai ưu đãi đặc biệt mùa hè dành cho khách lưu trú từ 3 đêm. Giảm trực tiếp 30% giá phòng, bao gồm bữa sáng buffet và một lần dùng spa miễn phí. Áp dụng từ 01/06 đến 31/08/2024.',
        N'/images/news/news-3.jpg',
        '2026-03-25T22:03:03.9566667'
    );
END
GO

UPDATE dbo.news
SET
    title = CASE slug
        WHEN N'art-of-slow-living' THEN N'Khai Trương Khu Spa Và Wellness Cao Cấp Tại GOAT HOTEL'
        WHEN N'culinary-horizons-chefs-table' THEN N'GOAT HOTEL Vinh Dự Nhận Giải Thưởng Khách Sạn Xuất Sắc Nhất 2024'
        WHEN N'uu di he 2024 gim 30 cho dt phong tu 3 dem tro len' THEN N'Ưu Đãi Hè 2024: Giảm 30% Cho Đặt Phòng Từ 3 Đêm Trở Lên'
        ELSE title
    END,
    summary = CASE slug
        WHEN N'art-of-slow-living' THEN N'Khu Spa và Wellness hơn 500m² chính thức đi vào hoạt động với đầy đủ dịch vụ thư giãn cao cấp.'
        WHEN N'culinary-horizons-chefs-table' THEN N'GOAT HOTEL nhận danh hiệu Khách Sạn Xuất Sắc Nhất Vũng Tàu 2024 từ Hiệp hội Du lịch địa phương.'
        WHEN N'uu di he 2024 gim 30 cho dt phong tu 3 dem tro len' THEN N'Giảm 30% cho đặt phòng từ 3 đêm, kèm bữa sáng và 1 lần spa miễn phí trong mùa hè 2024.'
        ELSE summary
    END,
    content = CASE slug
        WHEN N'art-of-slow-living' THEN N'GOAT HOTEL tự hào giới thiệu khu Spa và Wellness mới diện tích hơn 500m². Bao gồm bể sục Jacuzzi, phòng xông hơi đá muối Himalaya, phòng massage trị liệu cùng đội ngũ chuyên gia có chứng chỉ quốc tế. Khách lưu trú hạng Suite trở lên được miễn phí sử dụng toàn bộ tiện ích spa.'
        WHEN N'culinary-horizons-chefs-table' THEN N'Trong lễ trao giải của Hiệp hội Du lịch Bà Rịa Vũng Tàu, GOAT HOTEL xuất sắc nhận danh hiệu Khách Sạn Xuất Sắc Nhất năm 2024. Giải thưởng dựa trên tiêu chí chất lượng dịch vụ và độ hài lòng của khách hàng.'
        WHEN N'uu di he 2024 gim 30 cho dt phong tu 3 dem tro len' THEN N'GOAT HOTEL triển khai ưu đãi đặc biệt mùa hè dành cho khách lưu trú từ 3 đêm. Giảm trực tiếp 30% giá phòng, bao gồm bữa sáng buffet và một lần dùng spa miễn phí. Áp dụng từ 01/06 đến 31/08/2024.'
        ELSE content
    END,
    image = CASE slug
        WHEN N'art-of-slow-living' THEN N'/images/news/news-1.jpg'
        WHEN N'culinary-horizons-chefs-table' THEN N'/images/news/news-2.jpg'
        WHEN N'uu di he 2024 gim 30 cho dt phong tu 3 dem tro len' THEN N'/images/news/news-3.jpg'
        ELSE image
    END,
    created_at = CASE slug
        WHEN N'art-of-slow-living' THEN '2026-03-25T22:03:03.9566667'
        WHEN N'culinary-horizons-chefs-table' THEN '2026-03-25T22:03:03.9566667'
        WHEN N'uu di he 2024 gim 30 cho dt phong tu 3 dem tro len' THEN '2026-03-25T22:03:03.9566667'
        ELSE created_at
    END
WHERE slug IN (
    N'art-of-slow-living',
    N'culinary-horizons-chefs-table',
    N'uu di he 2024 gim 30 cho dt phong tu 3 dem tro len'
);
GO

INSERT INTO dbo.featured_room_types (room_type_id, display_order, created_at)
SELECT rt.id, 1, SYSDATETIME()
FROM dbo.room_types rt
WHERE rt.type_name = N'Deluxe Room'
  AND NOT EXISTS (SELECT 1 FROM dbo.featured_room_types frt WHERE frt.room_type_id = rt.id);
GO

INSERT INTO dbo.featured_room_types (room_type_id, display_order, created_at)
SELECT rt.id, 2, SYSDATETIME()
FROM dbo.room_types rt
WHERE rt.type_name = N'Family Room'
  AND NOT EXISTS (SELECT 1 FROM dbo.featured_room_types frt WHERE frt.room_type_id = rt.id);
GO

INSERT INTO dbo.featured_news (news_id, display_order, created_at)
SELECT n.id, 1, SYSDATETIME()
FROM dbo.news n
WHERE n.slug = N'art-of-slow-living'
  AND NOT EXISTS (SELECT 1 FROM dbo.featured_news fn WHERE fn.news_id = n.id);
GO

INSERT INTO dbo.featured_news (news_id, display_order, created_at)
SELECT n.id, 2, SYSDATETIME()
FROM dbo.news n
WHERE n.slug = N'culinary-horizons-chefs-table'
  AND NOT EXISTS (SELECT 1 FROM dbo.featured_news fn WHERE fn.news_id = n.id);
GO

INSERT INTO dbo.featured_news (news_id, display_order, created_at)
SELECT n.id, 3, SYSDATETIME()
FROM dbo.news n
WHERE n.slug = N'uu di he 2024 gim 30 cho dt phong tu 3 dem tro len'
  AND NOT EXISTS (SELECT 1 FROM dbo.featured_news fn WHERE fn.news_id = n.id);
GO

DELETE frt
FROM dbo.featured_room_types frt
JOIN dbo.room_types rt ON rt.id = frt.room_type_id
WHERE rt.type_name NOT IN (N'Deluxe Room', N'Family Room');
GO

UPDATE frt
SET frt.display_order = CASE rt.type_name
    WHEN N'Deluxe Room' THEN 1
    WHEN N'Family Room' THEN 2
    ELSE frt.display_order
END
FROM dbo.featured_room_types frt
JOIN dbo.room_types rt ON rt.id = frt.room_type_id
WHERE rt.type_name IN (N'Deluxe Room', N'Family Room');
GO

DELETE fn
FROM dbo.featured_news fn
JOIN dbo.news n ON n.id = fn.news_id
WHERE n.slug NOT IN (
    N'art-of-slow-living',
    N'culinary-horizons-chefs-table',
    N'uu di he 2024 gim 30 cho dt phong tu 3 dem tro len'
);
GO

UPDATE fn
SET fn.display_order = CASE n.slug
    WHEN N'art-of-slow-living' THEN 1
    WHEN N'culinary-horizons-chefs-table' THEN 2
    WHEN N'uu di he 2024 gim 30 cho dt phong tu 3 dem tro len' THEN 3
    ELSE fn.display_order
END
FROM dbo.featured_news fn
JOIN dbo.news n ON n.id = fn.news_id
WHERE n.slug IN (
    N'art-of-slow-living',
    N'culinary-horizons-chefs-table',
    N'uu di he 2024 gim 30 cho dt phong tu 3 dem tro len'
);
GO

/* =========================================================
   SEED DATA - CONTACT MESSAGES
   ========================================================= */

IF NOT EXISTS (
    SELECT 1 FROM dbo.contact_messages
    WHERE email = N'minh.nguyen@example.com' AND message = N'Cho mình hỏi khách sạn có hỗ trợ check-in sớm không?'
)
BEGIN
    INSERT INTO dbo.contact_messages (first_name, last_name, email, message, status, admin_note, created_at, updated_at)
    VALUES (
        N'Minh',
        N'Nguyen',
        N'minh.nguyen@example.com',
        N'Cho mình hỏi khách sạn có hỗ trợ check-in sớm không?',
        N'new',
        NULL,
        DATEADD(DAY, -2, SYSDATETIME()),
        DATEADD(DAY, -2, SYSDATETIME())
    );
END
GO

IF NOT EXISTS (
    SELECT 1 FROM dbo.contact_messages
    WHERE email = N'linh.tran@example.com' AND message = N'Mình muốn đặt 2 phòng gia đình vào cuối tuần tới.'
)
BEGIN
    INSERT INTO dbo.contact_messages (first_name, last_name, email, message, status, admin_note, created_at, updated_at)
    VALUES (
        N'Linh',
        N'Tran',
        N'linh.tran@example.com',
        N'Mình muốn đặt 2 phòng gia đình vào cuối tuần tới.',
        N'read',
        N'Đã phản hồi qua email.',
        DATEADD(DAY, -5, SYSDATETIME()),
        DATEADD(DAY, -4, SYSDATETIME())
    );
END
GO

/* =========================================================
   SEED DATA - SERVICES
   ========================================================= */

IF NOT EXISTS (SELECT 1 FROM dbo.services WHERE name = N'Đưa đón sân bay')
    INSERT INTO dbo.services (name, price, description, image)
    VALUES (N'Đưa đón sân bay', 250000, N'Dịch vụ đưa đón sân bay theo lịch hẹn trước.', NULL);
GO

IF NOT EXISTS (SELECT 1 FROM dbo.services WHERE name = N'Buffet sáng')
    INSERT INTO dbo.services (name, price, description, image)
    VALUES (N'Buffet sáng', 120000, N'Bữa sáng buffet phục vụ tại nhà hàng của khách sạn.', NULL);
GO

IF NOT EXISTS (SELECT 1 FROM dbo.services WHERE name = N'Spa thư giãn')
    INSERT INTO dbo.services (name, price, description, image)
    VALUES (N'Spa thư giãn', 400000, N'Gói thư giãn cơ bản dành cho khách lưu trú.', NULL);
GO

/* =========================================================
   SEED DATA - SAMPLE PAST BOOKING
   ========================================================= */

IF NOT EXISTS (
    SELECT 1
    FROM dbo.bookings b
    JOIN dbo.users u ON u.id = b.user_id
    WHERE u.email = N'customer@goathotel.local'
      AND b.created_at = '2026-03-15T10:00:00'
)
BEGIN
    INSERT INTO dbo.bookings (user_id, total_price, status, payment_status, created_at, expires_at)
    SELECT
        u.id,
        1000000,
        N'completed',
        N'paid',
        '2026-03-15T10:00:00',
        NULL
    FROM dbo.users u
    WHERE u.email = N'customer@goathotel.local';
END
GO

IF NOT EXISTS (
    SELECT 1
    FROM dbo.booking_details bd
    JOIN dbo.bookings b ON b.id = bd.booking_id
    JOIN dbo.users u ON u.id = b.user_id
    WHERE u.email = N'customer@goathotel.local'
      AND b.created_at = '2026-03-15T10:00:00'
)
BEGIN
    INSERT INTO dbo.booking_details (
        booking_id,
        room_id,
        price_at_booking,
        check_in,
        check_out,
        check_in_actual,
        check_out_actual,
        total_hours
    )
    SELECT
        b.id,
        r.id,
        500000,
        '2026-03-20T14:00:00',
        '2026-03-22T12:00:00',
        '2026-03-20T14:05:00',
        '2026-03-22T11:40:00',
        45.58
    FROM dbo.bookings b
    JOIN dbo.users u ON u.id = b.user_id
    JOIN dbo.rooms r ON r.room_number = N'201'
    WHERE u.email = N'customer@goathotel.local'
      AND b.created_at = '2026-03-15T10:00:00';
END
GO

IF NOT EXISTS (
    SELECT 1
    FROM dbo.payments p
    JOIN dbo.bookings b ON b.id = p.booking_id
    JOIN dbo.users u ON u.id = b.user_id
    WHERE u.email = N'customer@goathotel.local'
      AND b.created_at = '2026-03-15T10:00:00'
)
BEGIN
    INSERT INTO dbo.payments (booking_id, amount, payment_method, payment_date, status)
    SELECT
        b.id,
        1000000,
        N'VNPay',
        '2026-03-15T10:03:00',
        N'paid'
    FROM dbo.bookings b
    JOIN dbo.users u ON u.id = b.user_id
    WHERE u.email = N'customer@goathotel.local'
      AND b.created_at = '2026-03-15T10:00:00';
END
GO

IF NOT EXISTS (
    SELECT 1
    FROM dbo.reviews rv
    JOIN dbo.bookings b ON b.id = rv.booking_id
    JOIN dbo.users u ON u.id = b.user_id
    WHERE u.email = N'customer@goathotel.local'
      AND b.created_at = '2026-03-15T10:00:00'
)
BEGIN
    INSERT INTO dbo.reviews (user_id, room_type_id, booking_id, rating, comment, created_at)
    SELECT
        u.id,
        rt.id,
        b.id,
        5,
        N'Phòng sạch sẽ, quy trình đặt phòng rõ ràng và rất dễ theo dõi.',
        '2026-03-22T15:00:00'
    FROM dbo.bookings b
    JOIN dbo.users u ON u.id = b.user_id
    JOIN dbo.room_types rt ON rt.type_name = N'Superior Room'
    WHERE u.email = N'customer@goathotel.local'
      AND b.created_at = '2026-03-15T10:00:00';
END
GO

PRINT N'GOAT HOTEL SQL Server full setup completed.';
GO

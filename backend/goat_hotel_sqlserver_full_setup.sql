/*
GOAT HOTEL - SQL Server Full Setup Script
Nguồn sự thật của schema là entity JPA trong backend/src/main/java/com/hotel/entity.
Script này được viết để cả nhóm có thể tạo DB mới và seed dữ liệu demo để chạy project.

Ghi chú:
- Public data dưới đây đã được canh theo snapshot project đang chạy ngày 01/04/2026:
  room types, room inventory, featured rooms, featured news, news content.
- Các dữ liệu private như user nội bộ, booking lịch sử, inbox admin vẫn được giữ ở mức demo an toàn
  vì không dump trực tiếp DB live vào repo.
- Để mirror dữ liệu demo sát nhất, nên chạy trên DB mới / DB đã xóa seed cũ.

Hướng dẫn:
1. Mở script trong SSMS / Azure Data Studio / sqlcmd.
2. Chạy toàn bộ file.
3. Start lại backend nếu cần.

Tài khoản demo:
- Admin: admin@goathotel.local
- User : customer@goathotel.local

Ghi chú bảo mật:
- Password seed trong file này đã được lưu dưới dạng BCrypt hash để khớp với backend.
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
        price_per_night DECIMAL(15,2) NOT NULL,
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
        total_price DECIMAL(15,2) NULL,
        coupon_code NVARCHAR(50) NULL,
        discount_amount DECIMAL(15,2) NOT NULL CONSTRAINT DF_bookings_discount_amount DEFAULT 0,
        deposit_amount DECIMAL(15,2) NOT NULL CONSTRAINT DF_bookings_deposit_amount DEFAULT 0,
        final_amount DECIMAL(15,2) NULL,
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
        price_at_booking DECIMAL(15,2) NOT NULL,
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
        price DECIMAL(15,2) NOT NULL,
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
        price_at_booking DECIMAL(15,2) NOT NULL,
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
        amount DECIMAL(15,2) NOT NULL,
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
        CONSTRAINT CK_reviews_rating_range CHECK (rating BETWEEN 1 AND 5),
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
        name NVARCHAR(150) NOT NULL,
        description NVARCHAR(MAX) NULL,
        discount_type NVARCHAR(20) NOT NULL,
        discount_value DECIMAL(15,2) NOT NULL,
        start_date DATETIME2 NULL,
        end_date DATETIME2 NULL,
        min_order_value DECIMAL(15,2) NOT NULL CONSTRAINT DF_coupons_min_order_value DEFAULT 0,
        max_discount_amount DECIMAL(15,2) NULL,
        usage_limit INT NULL,
        is_active BIT NOT NULL CONSTRAINT DF_coupons_is_active DEFAULT 1,
        target_event NVARCHAR(150) NULL,
        created_at DATETIME2 NULL CONSTRAINT DF_coupons_created_at DEFAULT SYSDATETIME(),
        updated_at DATETIME2 NULL
    );
END
GO

IF OBJECT_ID(N'dbo.user_coupons', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.user_coupons (
        id INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        user_id INT NOT NULL,
        coupon_id INT NOT NULL,
        assigned_by_user_id INT NULL,
        booking_id INT NULL,
        source NVARCHAR(30) NOT NULL CONSTRAINT DF_user_coupons_source DEFAULT N'manual',
        status NVARCHAR(20) NOT NULL CONSTRAINT DF_user_coupons_status DEFAULT N'available',
        note NVARCHAR(MAX) NULL,
        assigned_at DATETIME2 NOT NULL CONSTRAINT DF_user_coupons_assigned_at DEFAULT SYSDATETIME(),
        expires_at DATETIME2 NOT NULL,
        used_at DATETIME2 NULL,
        CONSTRAINT FK_user_coupons_user FOREIGN KEY (user_id) REFERENCES dbo.users(id),
        CONSTRAINT FK_user_coupons_coupon FOREIGN KEY (coupon_id) REFERENCES dbo.coupons(id),
        CONSTRAINT FK_user_coupons_assigned_by FOREIGN KEY (assigned_by_user_id) REFERENCES dbo.users(id),
        CONSTRAINT FK_user_coupons_booking FOREIGN KEY (booking_id) REFERENCES dbo.bookings(id)
    );
END
GO

IF OBJECT_ID(N'dbo.coupon_event_types', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.coupon_event_types (
        id INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        event_key NVARCHAR(50) NOT NULL,
        label NVARCHAR(100) NOT NULL,
        icon NVARCHAR(50) NULL CONSTRAINT DF_coupon_event_types_icon DEFAULT N'category',
        color NVARCHAR(20) NULL CONSTRAINT DF_coupon_event_types_color DEFAULT N'#6b7280',
        sort_order INT NULL CONSTRAINT DF_coupon_event_types_sort_order DEFAULT 0,
        is_system BIT NULL CONSTRAINT DF_coupon_event_types_is_system DEFAULT 0,
        CONSTRAINT UQ_coupon_event_types_event_key UNIQUE (event_key)
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
   SCHEMA RECONCILE FOR EXISTING DBS
   ========================================================= */

IF OBJECT_ID(N'dbo.bookings', N'U') IS NOT NULL
BEGIN
    IF COL_LENGTH('dbo.bookings', 'coupon_code') IS NULL
        ALTER TABLE dbo.bookings ADD coupon_code NVARCHAR(50) NULL;

    IF COL_LENGTH('dbo.bookings', 'discount_amount') IS NULL
        ALTER TABLE dbo.bookings ADD discount_amount DECIMAL(15,2) NULL;

    IF COL_LENGTH('dbo.bookings', 'deposit_amount') IS NULL
        ALTER TABLE dbo.bookings ADD deposit_amount DECIMAL(15,2) NULL;

    IF COL_LENGTH('dbo.bookings', 'final_amount') IS NULL
        ALTER TABLE dbo.bookings ADD final_amount DECIMAL(15,2) NULL;

    UPDATE dbo.bookings
    SET discount_amount = COALESCE(discount_amount, 0),
        deposit_amount = COALESCE(deposit_amount, 0),
        final_amount = COALESCE(final_amount, total_price - COALESCE(discount_amount, 0), total_price, 0);

    ALTER TABLE dbo.bookings ALTER COLUMN total_price DECIMAL(15,2) NULL;
    ALTER TABLE dbo.bookings ALTER COLUMN discount_amount DECIMAL(15,2) NOT NULL;
    ALTER TABLE dbo.bookings ALTER COLUMN deposit_amount DECIMAL(15,2) NOT NULL;
    ALTER TABLE dbo.bookings ALTER COLUMN final_amount DECIMAL(15,2) NULL;
END
GO

IF OBJECT_ID(N'dbo.booking_details', N'U') IS NOT NULL AND COL_LENGTH('dbo.booking_details', 'price_at_booking') IS NOT NULL
    ALTER TABLE dbo.booking_details ALTER COLUMN price_at_booking DECIMAL(15,2) NOT NULL;
GO

IF OBJECT_ID(N'dbo.reviews', N'U') IS NOT NULL
BEGIN
    UPDATE dbo.reviews
    SET rating = CASE
        WHEN rating < 1 THEN 1
        WHEN rating > 5 THEN 5
        ELSE rating
    END
    WHERE rating < 1 OR rating > 5;

    IF NOT EXISTS (
        SELECT 1
        FROM sys.check_constraints
        WHERE name = N'CK_reviews_rating_range'
          AND parent_object_id = OBJECT_ID(N'dbo.reviews')
    )
        ALTER TABLE dbo.reviews ADD CONSTRAINT CK_reviews_rating_range CHECK (rating BETWEEN 1 AND 5);
END
GO

IF OBJECT_ID(N'dbo.booking_services', N'U') IS NOT NULL AND COL_LENGTH('dbo.booking_services', 'price_at_booking') IS NOT NULL
    ALTER TABLE dbo.booking_services ALTER COLUMN price_at_booking DECIMAL(15,2) NOT NULL;
GO

IF OBJECT_ID(N'dbo.payments', N'U') IS NOT NULL AND COL_LENGTH('dbo.payments', 'amount') IS NOT NULL
    ALTER TABLE dbo.payments ALTER COLUMN amount DECIMAL(15,2) NOT NULL;
GO

IF OBJECT_ID(N'dbo.services', N'U') IS NOT NULL AND COL_LENGTH('dbo.services', 'price') IS NOT NULL
    ALTER TABLE dbo.services ALTER COLUMN price DECIMAL(15,2) NOT NULL;
GO

IF OBJECT_ID(N'dbo.room_types', N'U') IS NOT NULL AND COL_LENGTH('dbo.room_types', 'price_per_night') IS NOT NULL
    ALTER TABLE dbo.room_types ALTER COLUMN price_per_night DECIMAL(15,2) NOT NULL;
GO

IF OBJECT_ID(N'dbo.coupons', N'U') IS NOT NULL
BEGIN
    DECLARE @legacyDefaultTargetEventPattern NVARCHAR(150) = N'M' + NCHAR(63) + N'c d' + NCHAR(63) + N'nh%';
    DECLARE @legacyReviewTargetEventPattern NVARCHAR(150) = N'T' + NCHAR(63) + N' d' + NCHAR(63) + N'ng t' + NCHAR(63) + N'ng%';
    DECLARE @legacyWeekendTargetEventPattern NVARCHAR(150) = N'Khuy' + NCHAR(63) + N'n mãi Cu' + NCHAR(63) + N'i tu' + NCHAR(63) + N'n%';
    DECLARE @legacyWeekendTargetEventMixedPattern NVARCHAR(150) = N'Khuyến mãi Cuối tu' + NCHAR(63) + N'n%';
    DECLARE @legacyAtHotelTargetEventPattern NVARCHAR(150) = N'T' + NCHAR(63) + N'i khách s' + NCHAR(63) + N'n%';
    DECLARE @hasCouponsMinBookingValue BIT = CASE WHEN COL_LENGTH('dbo.coupons', 'min_booking_value') IS NOT NULL THEN 1 ELSE 0 END;
    DECLARE @hasCouponsMaxUses BIT = CASE WHEN COL_LENGTH('dbo.coupons', 'max_uses') IS NOT NULL THEN 1 ELSE 0 END;
    DECLARE @couponMinOrderValueExpr NVARCHAR(MAX);
    DECLARE @couponUsageLimitSet NVARCHAR(MAX);
    DECLARE @couponUpdateSql NVARCHAR(MAX);

    IF COL_LENGTH('dbo.coupons', 'name') IS NULL
        ALTER TABLE dbo.coupons ADD name NVARCHAR(150) NULL;

    IF COL_LENGTH('dbo.coupons', 'min_order_value') IS NULL
        ALTER TABLE dbo.coupons ADD min_order_value DECIMAL(15,2) NULL;

    IF COL_LENGTH('dbo.coupons', 'max_discount_amount') IS NULL
        ALTER TABLE dbo.coupons ADD max_discount_amount DECIMAL(15,2) NULL;

    IF COL_LENGTH('dbo.coupons', 'usage_limit') IS NULL
        ALTER TABLE dbo.coupons ADD usage_limit INT NULL;

    IF COL_LENGTH('dbo.coupons', 'updated_at') IS NULL
        ALTER TABLE dbo.coupons ADD updated_at DATETIME2 NULL;

    IF COL_LENGTH('dbo.coupons', 'target_event') IS NULL
        ALTER TABLE dbo.coupons ADD target_event NVARCHAR(150) NULL;

    SET @couponMinOrderValueExpr = CASE
        WHEN @hasCouponsMinBookingValue = 1 THEN N'COALESCE(min_order_value, TRY_CONVERT(DECIMAL(15,2), min_booking_value), 0)'
        ELSE N'COALESCE(min_order_value, 0)'
    END;

    SET @couponUsageLimitSet = CASE
        WHEN @hasCouponsMaxUses = 1 THEN N'    usage_limit = COALESCE(usage_limit, max_uses),' + CHAR(13) + CHAR(10)
        ELSE N''
    END;

    SET @couponUpdateSql = N'
UPDATE dbo.coupons
SET name = COALESCE(NULLIF(LTRIM(RTRIM(name)), N''''), code),
    min_order_value = ' + @couponMinOrderValueExpr + N',
' + @couponUsageLimitSet + N'    updated_at = COALESCE(updated_at, created_at, SYSDATETIME()),
    target_event = CASE
        WHEN target_event IS NULL OR LTRIM(RTRIM(target_event)) = N'''' THEN N''DEFAULT''
        WHEN UPPER(LTRIM(RTRIM(target_event))) IN (N''DEFAULT'', N''ON_REVIEW'', N''WEEKEND'') THEN UPPER(LTRIM(RTRIM(target_event)))
        WHEN target_event LIKE @legacyDefaultTargetEventPattern OR target_event LIKE N''Mặc định%'' THEN N''DEFAULT''
        WHEN target_event LIKE @legacyReviewTargetEventPattern OR target_event LIKE N''Tự động tặng%'' THEN N''ON_REVIEW''
        WHEN target_event LIKE @legacyWeekendTargetEventPattern OR target_event LIKE @legacyWeekendTargetEventMixedPattern OR target_event LIKE N''Khuyến mãi Cuối tuần%'' THEN N''WEEKEND''
        WHEN target_event = N''Su kien Chao He'' OR target_event = N''Sự kiện Chào Hè'' OR target_event LIKE @legacyAtHotelTargetEventPattern OR target_event = N''Tại khách sạn'' THEN N''DEFAULT''
        ELSE UPPER(LTRIM(RTRIM(target_event)))
    END;';

    EXEC sp_executesql
        @couponUpdateSql,
        N'@legacyDefaultTargetEventPattern NVARCHAR(150), @legacyReviewTargetEventPattern NVARCHAR(150), @legacyWeekendTargetEventPattern NVARCHAR(150), @legacyWeekendTargetEventMixedPattern NVARCHAR(150), @legacyAtHotelTargetEventPattern NVARCHAR(150)',
        @legacyDefaultTargetEventPattern = @legacyDefaultTargetEventPattern,
        @legacyReviewTargetEventPattern = @legacyReviewTargetEventPattern,
        @legacyWeekendTargetEventPattern = @legacyWeekendTargetEventPattern,
        @legacyWeekendTargetEventMixedPattern = @legacyWeekendTargetEventMixedPattern,
        @legacyAtHotelTargetEventPattern = @legacyAtHotelTargetEventPattern;

    ALTER TABLE dbo.coupons ALTER COLUMN name NVARCHAR(150) NOT NULL;
    ALTER TABLE dbo.coupons ALTER COLUMN discount_value DECIMAL(15,2) NOT NULL;
    ALTER TABLE dbo.coupons ALTER COLUMN min_order_value DECIMAL(15,2) NOT NULL;
    ALTER TABLE dbo.coupons ALTER COLUMN max_discount_amount DECIMAL(15,2) NULL;
    ALTER TABLE dbo.coupons ALTER COLUMN target_event NVARCHAR(150) NULL;
END
GO

IF OBJECT_ID(N'dbo.user_coupons', N'U') IS NOT NULL
BEGIN
    DECLARE @hasUserCouponsIsUsed BIT = CASE WHEN COL_LENGTH('dbo.user_coupons', 'is_used') IS NOT NULL THEN 1 ELSE 0 END;
    DECLARE @hasUserCouponsGrantedAt BIT = CASE WHEN COL_LENGTH('dbo.user_coupons', 'granted_at') IS NOT NULL THEN 1 ELSE 0 END;
    DECLARE @userCouponsStatusExpr NVARCHAR(MAX);
    DECLARE @userCouponsAssignedAtExpr NVARCHAR(MAX);
    DECLARE @userCouponsUpdateSql NVARCHAR(MAX);

    IF COL_LENGTH('dbo.user_coupons', 'assigned_by_user_id') IS NULL
        ALTER TABLE dbo.user_coupons ADD assigned_by_user_id INT NULL;

    IF COL_LENGTH('dbo.user_coupons', 'booking_id') IS NULL
        ALTER TABLE dbo.user_coupons ADD booking_id INT NULL;

    IF COL_LENGTH('dbo.user_coupons', 'source') IS NULL
        ALTER TABLE dbo.user_coupons ADD source NVARCHAR(30) NULL;

    IF COL_LENGTH('dbo.user_coupons', 'status') IS NULL
        ALTER TABLE dbo.user_coupons ADD status NVARCHAR(20) NULL;

    IF COL_LENGTH('dbo.user_coupons', 'note') IS NULL
        ALTER TABLE dbo.user_coupons ADD note NVARCHAR(MAX) NULL;

    IF COL_LENGTH('dbo.user_coupons', 'assigned_at') IS NULL
        ALTER TABLE dbo.user_coupons ADD assigned_at DATETIME2 NULL;

    IF COL_LENGTH('dbo.user_coupons', 'expires_at') IS NULL
        ALTER TABLE dbo.user_coupons ADD expires_at DATETIME2 NULL;

    IF COL_LENGTH('dbo.user_coupons', 'used_at') IS NULL
        ALTER TABLE dbo.user_coupons ADD used_at DATETIME2 NULL;

    SET @userCouponsStatusExpr = CASE
        WHEN @hasUserCouponsIsUsed = 1 THEN N'COALESCE(NULLIF(LTRIM(RTRIM(uc.status)), N''''), CASE WHEN uc.is_used = 1 THEN N''used'' ELSE N''available'' END)'
        ELSE N'COALESCE(NULLIF(LTRIM(RTRIM(uc.status)), N''''), N''available'')'
    END;

    SET @userCouponsAssignedAtExpr = CASE
        WHEN @hasUserCouponsGrantedAt = 1 THEN N'COALESCE(uc.assigned_at, uc.granted_at, uc.used_at, SYSDATETIME())'
        ELSE N'COALESCE(uc.assigned_at, uc.used_at, SYSDATETIME())'
    END;

    SET @userCouponsUpdateSql = N'
UPDATE uc
SET source = COALESCE(NULLIF(LTRIM(RTRIM(uc.source)), N''''), N''manual''),
    status = ' + @userCouponsStatusExpr + N',
    assigned_at = ' + @userCouponsAssignedAtExpr + N',
    expires_at = COALESCE(uc.expires_at, c.end_date, DATEADD(DAY, 30, ' + @userCouponsAssignedAtExpr + N'))
FROM dbo.user_coupons uc
LEFT JOIN dbo.coupons c ON c.id = uc.coupon_id;';

    EXEC sp_executesql @userCouponsUpdateSql;

    ALTER TABLE dbo.user_coupons ALTER COLUMN source NVARCHAR(30) NOT NULL;
    ALTER TABLE dbo.user_coupons ALTER COLUMN status NVARCHAR(20) NOT NULL;
    ALTER TABLE dbo.user_coupons ALTER COLUMN assigned_at DATETIME2 NOT NULL;
    ALTER TABLE dbo.user_coupons ALTER COLUMN expires_at DATETIME2 NOT NULL;

    IF COL_LENGTH('dbo.user_coupons', 'assigned_by_user_id') IS NOT NULL
        AND NOT EXISTS (
            SELECT 1
            FROM sys.foreign_key_columns fkc
            JOIN sys.tables t ON t.object_id = fkc.parent_object_id
            JOIN sys.columns c ON c.object_id = t.object_id AND c.column_id = fkc.parent_column_id
            WHERE t.name = N'user_coupons' AND c.name = N'assigned_by_user_id'
        )
        ALTER TABLE dbo.user_coupons ADD CONSTRAINT FK_user_coupons_assigned_by FOREIGN KEY (assigned_by_user_id) REFERENCES dbo.users(id);

    IF COL_LENGTH('dbo.user_coupons', 'booking_id') IS NOT NULL
        AND NOT EXISTS (
            SELECT 1
            FROM sys.foreign_key_columns fkc
            JOIN sys.tables t ON t.object_id = fkc.parent_object_id
            JOIN sys.columns c ON c.object_id = t.object_id AND c.column_id = fkc.parent_column_id
            WHERE t.name = N'user_coupons' AND c.name = N'booking_id'
        )
        ALTER TABLE dbo.user_coupons ADD CONSTRAINT FK_user_coupons_booking FOREIGN KEY (booking_id) REFERENCES dbo.bookings(id);
END
GO

IF OBJECT_ID(N'dbo.coupon_event_types', N'U') IS NOT NULL
BEGIN
    IF COL_LENGTH('dbo.coupon_event_types', 'event_key') IS NULL
        ALTER TABLE dbo.coupon_event_types ADD event_key NVARCHAR(50) NULL;

    IF COL_LENGTH('dbo.coupon_event_types', 'label') IS NULL
        ALTER TABLE dbo.coupon_event_types ADD label NVARCHAR(100) NULL;

    IF COL_LENGTH('dbo.coupon_event_types', 'icon') IS NULL
        ALTER TABLE dbo.coupon_event_types ADD icon NVARCHAR(50) NULL;

    IF COL_LENGTH('dbo.coupon_event_types', 'color') IS NULL
        ALTER TABLE dbo.coupon_event_types ADD color NVARCHAR(20) NULL;

    IF COL_LENGTH('dbo.coupon_event_types', 'sort_order') IS NULL
        ALTER TABLE dbo.coupon_event_types ADD sort_order INT NULL;

    IF COL_LENGTH('dbo.coupon_event_types', 'is_system') IS NULL
        ALTER TABLE dbo.coupon_event_types ADD is_system BIT NULL;

    UPDATE dbo.coupon_event_types
    SET event_key = COALESCE(NULLIF(UPPER(LTRIM(RTRIM(event_key))), N''), N'DEFAULT'),
        label = COALESCE(NULLIF(LTRIM(RTRIM(label)), N''), N'Mặc định (Cấp thủ công)'),
        icon = COALESCE(NULLIF(LTRIM(RTRIM(icon)), N''), N'category'),
        color = COALESCE(NULLIF(LTRIM(RTRIM(color)), N''), N'#6b7280'),
        sort_order = COALESCE(sort_order, 0),
        is_system = COALESCE(is_system, 0);

    IF EXISTS (
        SELECT 1
        FROM sys.columns
        WHERE object_id = OBJECT_ID(N'dbo.coupon_event_types')
          AND name = N'event_key'
          AND is_nullable = 1
    )
    BEGIN
        DECLARE @couponEventKeyConstraint SYSNAME;
        DECLARE @couponEventKeyIndex SYSNAME;
        DECLARE @couponEventKeySql NVARCHAR(MAX);

        SELECT TOP (1) @couponEventKeyConstraint = kc.name
        FROM sys.key_constraints kc
        JOIN sys.index_columns ic
            ON ic.object_id = kc.parent_object_id
           AND ic.index_id = kc.unique_index_id
        JOIN sys.columns c
            ON c.object_id = ic.object_id
           AND c.column_id = ic.column_id
        WHERE kc.parent_object_id = OBJECT_ID(N'dbo.coupon_event_types')
          AND kc.[type] = N'UQ'
        GROUP BY kc.name
        HAVING COUNT(*) = 1
           AND MAX(c.name) = N'event_key';

        IF @couponEventKeyConstraint IS NOT NULL
        BEGIN
            SET @couponEventKeySql = N'ALTER TABLE dbo.coupon_event_types DROP CONSTRAINT ' + QUOTENAME(@couponEventKeyConstraint) + N';';
            EXEC sp_executesql @couponEventKeySql;
        END
        ELSE
        BEGIN
            SELECT TOP (1) @couponEventKeyIndex = i.name
            FROM sys.indexes i
            JOIN sys.index_columns ic
                ON ic.object_id = i.object_id
               AND ic.index_id = i.index_id
            JOIN sys.columns c
                ON c.object_id = ic.object_id
               AND c.column_id = ic.column_id
            WHERE i.object_id = OBJECT_ID(N'dbo.coupon_event_types')
              AND i.is_unique = 1
              AND i.is_primary_key = 0
              AND i.is_unique_constraint = 0
            GROUP BY i.name
            HAVING COUNT(*) = 1
               AND MAX(c.name) = N'event_key';

            IF @couponEventKeyIndex IS NOT NULL
            BEGIN
                SET @couponEventKeySql = N'DROP INDEX ' + QUOTENAME(@couponEventKeyIndex) + N' ON dbo.coupon_event_types;';
                EXEC sp_executesql @couponEventKeySql;
            END
        END

        ALTER TABLE dbo.coupon_event_types ALTER COLUMN event_key NVARCHAR(50) NOT NULL;
    END

    IF EXISTS (
        SELECT 1
        FROM sys.columns
        WHERE object_id = OBJECT_ID(N'dbo.coupon_event_types')
          AND name = N'label'
          AND is_nullable = 1
    )
        ALTER TABLE dbo.coupon_event_types ALTER COLUMN label NVARCHAR(100) NOT NULL;

    IF NOT EXISTS (
        SELECT 1
        FROM sys.indexes i
        JOIN sys.index_columns ic
            ON ic.object_id = i.object_id
           AND ic.index_id = i.index_id
        JOIN sys.columns c
            ON c.object_id = ic.object_id
           AND c.column_id = ic.column_id
        WHERE i.object_id = OBJECT_ID(N'dbo.coupon_event_types')
          AND i.is_unique = 1
        GROUP BY i.name
        HAVING COUNT(*) = 1
           AND MAX(c.name) = N'event_key'
    )
        ALTER TABLE dbo.coupon_event_types ADD CONSTRAINT UQ_coupon_event_types_event_key UNIQUE (event_key);
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
    VALUES (N'GOAT Admin', N'admin@goathotel.local', N'$2a$10$xFm5bx0.lwf/YPDD1ntz2.1CdBUrPwPD4fBMEsDEg6BEKSD1QVQ2K', N'0900000001', NULL, N'admin', SYSDATETIME());
END
GO

IF NOT EXISTS (SELECT 1 FROM dbo.users WHERE email = N'customer@goathotel.local')
BEGIN
    INSERT INTO dbo.users (full_name, email, password, phone, image, role, created_at)
    VALUES (N'Khach Hang Demo', N'customer@goathotel.local', N'$2a$10$eOqnElV2ra98gpQ3Iqxkv.Hlwrs.9D6YDj5uOuOv3N8bVNu0TYqh.', N'0900000002', NULL, N'customer', SYSDATETIME());
END
GO

IF NOT EXISTS (SELECT 1 FROM dbo.users WHERE email = N'customer2@goathotel.local')
BEGIN
    INSERT INTO dbo.users (full_name, email, password, phone, image, role, created_at)
    VALUES (N'Thanh Vien Demo', N'customer2@goathotel.local', N'$2a$10$eOqnElV2ra98gpQ3Iqxkv.Hlwrs.9D6YDj5uOuOv3N8bVNu0TYqh.', N'0900000003', NULL, N'customer', SYSDATETIME());
END
GO

/*
   Legacy demo password reconcile
   Chi migrate dung bo seed cu tung luu plaintext admin123/customer123.
   Nhung password plaintext khac (neu co) se duoc backend auto-backfill bang BCrypt khi app khoi dong.
*/
UPDATE dbo.users
SET password = CASE
    WHEN email = N'admin@goathotel.local' AND password = N'admin123'
        THEN N'$2a$10$xFm5bx0.lwf/YPDD1ntz2.1CdBUrPwPD4fBMEsDEg6BEKSD1QVQ2K'
    WHEN email = N'customer@goathotel.local' AND password = N'customer123'
        THEN N'$2a$10$eOqnElV2ra98gpQ3Iqxkv.Hlwrs.9D6YDj5uOuOv3N8bVNu0TYqh.'
    WHEN email = N'customer2@goathotel.local' AND password = N'customer123'
        THEN N'$2a$10$eOqnElV2ra98gpQ3Iqxkv.Hlwrs.9D6YDj5uOuOv3N8bVNu0TYqh.'
    ELSE password
END
WHERE (email = N'admin@goathotel.local' AND password = N'admin123')
   OR (email = N'customer@goathotel.local' AND password = N'customer123')
   OR (email = N'customer2@goathotel.local' AND password = N'customer123');
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
    INSERT INTO dbo.bookings (
        user_id,
        total_price,
        discount_amount,
        deposit_amount,
        final_amount,
        status,
        payment_status,
        created_at,
        expires_at
    )
    SELECT
        u.id,
        1000000,
        0,
        300000,
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

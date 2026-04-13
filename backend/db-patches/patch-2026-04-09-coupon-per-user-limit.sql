-- Patch: 2026-04-09 — Thêm giới hạn sử dụng theo từng user cụ thể
-- Áp dụng khi: khởi tạo DB mới, hoặc ddl-auto=none/validate
-- Môi trường đang chạy với ddl-auto=update sẽ tự thêm column này khi restart

-- Thêm column per_user_limit vào bảng coupons
-- NULL = không giới hạn; giá trị > 0 = số lần tối đa mỗi user được dùng coupon này
IF NOT EXISTS (
    SELECT 1 FROM sys.columns
    WHERE object_id = OBJECT_ID(N'coupons') AND name = 'per_user_limit'
)
BEGIN
    ALTER TABLE coupons ADD per_user_limit INT NULL;
END
GO

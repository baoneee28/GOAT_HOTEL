package com.hotel.config;

import jakarta.annotation.PostConstruct;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

@Component
public class DatabaseEncodingFixer {

    private final JdbcTemplate jdbcTemplate;

    public DatabaseEncodingFixer(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @PostConstruct
    public void fixNvarchar() {
        fixCouponData();
        fixCouponEventTypeData();
    }

    private void fixCouponData() {
        if (!tableExists("coupons")) {
            return;
        }

        try {
            if (columnExists("coupons", "name")) {
                jdbcTemplate.execute("UPDATE coupons SET name = N'Coupon hết hạn' WHERE name LIKE 'Coupon h?t h?n';");
                jdbcTemplate.execute("UPDATE coupons SET name = N'Ưu đãi giữa tuần' WHERE name LIKE 'Uu dãi gi?a tu?n%';");
            }

            if (columnExists("coupons", "target_event")) {
                jdbcTemplate.execute("UPDATE coupons SET target_event = N'DEFAULT' WHERE target_event LIKE N'M?c d?nh%' OR target_event = N'M?c d?nh (C?p th? công)' OR target_event LIKE N'Mặc định%';");
                jdbcTemplate.execute("UPDATE coupons SET target_event = N'ON_REVIEW' WHERE target_event LIKE N'T? d?ng t?ng%' OR target_event LIKE N'Tự động tặng%';");
                jdbcTemplate.execute("UPDATE coupons SET target_event = N'WEEKEND' WHERE target_event LIKE N'Khuy?n mãi Cu?i tu?n%' OR target_event LIKE N'Khuyến mãi Cuối tu?n%';");
                jdbcTemplate.execute("UPDATE coupons SET target_event = N'DEFAULT' WHERE target_event = N'Su kien Chao He' OR target_event = N'Sự kiện Chào Hè' OR target_event LIKE N'T?i khách s?n%' OR target_event = N'Tại khách sạn';");
            }
        } catch (Exception e) {
            System.err.println("Cleanup du lieu coupons that bai: " + e.getMessage());
        }
    }

    private void fixCouponEventTypeData() {
        if (!tableExists("coupon_event_types") || !columnExists("coupon_event_types", "label")) {
            return;
        }

        try {
            jdbcTemplate.execute("UPDATE coupon_event_types SET label = N'Mặc định (Cấp thủ công)' WHERE label LIKE N'M?c d?nh%' OR label = N'M?c d?nh (C?p th? công)';");
            jdbcTemplate.execute("UPDATE coupon_event_types SET label = N'Tự động tặng sau Review' WHERE label LIKE N'T? d?ng t?ng%';");
            jdbcTemplate.execute("UPDATE coupon_event_types SET label = N'Khuyến mãi Cuối tuần' WHERE label LIKE N'Khuy?n mãi Cu?i tu?n%' OR label LIKE N'Khuyến mãi Cuối tu?n%';");
            jdbcTemplate.execute("UPDATE coupon_event_types SET label = N'Khuyến mãi Đông' WHERE label LIKE N'Khuy?n mãi Đông%';");
        } catch (Exception e) {
            System.err.println("Cleanup du lieu coupon_event_types that bai: " + e.getMessage());
        }
    }

    private boolean tableExists(String tableName) {
        Integer count = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = 'dbo' AND TABLE_NAME = ?",
                Integer.class,
                tableName
        );
        return count != null && count > 0;
    }

    private boolean columnExists(String tableName, String columnName) {
        Integer count = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = 'dbo' AND TABLE_NAME = ? AND COLUMN_NAME = ?",
                Integer.class,
                tableName,
                columnName
        );
        return count != null && count > 0;
    }
}

package com.hotel.config;

import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

@Component
public class DatabaseEncodingFixer {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @PostConstruct
    public void fixNvarchar() {
        try {
            // Alter columns to NVARCHAR to support Vietnamese
            jdbcTemplate.execute("ALTER TABLE coupons ALTER COLUMN name NVARCHAR(150);");
            jdbcTemplate.execute("ALTER TABLE coupons ALTER COLUMN target_event NVARCHAR(150);");
            
            // Fix existing corrupted data from testing
            jdbcTemplate.execute("UPDATE coupons SET name = N'Coupon hết hạn' WHERE name LIKE 'Coupon h?t h?n';");
            jdbcTemplate.execute("UPDATE coupons SET name = N'Ưu đãi giữa tuần' WHERE name LIKE 'Uu dãi gi?a tu?n%';");
            jdbcTemplate.execute("UPDATE coupons SET target_event = N'Mặc định (Cấp thủ công)' WHERE target_event LIKE 'M?c d?nh%';");
            jdbcTemplate.execute("UPDATE coupons SET target_event = N'Tại khách sạn' WHERE target_event LIKE 'T?i khách s?n%';");
            jdbcTemplate.execute("UPDATE coupons SET target_event = N'Mặc định (Cấp thủ công)' WHERE target_event = 'M?c d?nh (C?p th? công)';");

            // Fix bảng coupon_event_types
            jdbcTemplate.execute("ALTER TABLE coupon_event_types ALTER COLUMN label NVARCHAR(100);");
            jdbcTemplate.execute("UPDATE coupon_event_types SET label = N'Mặc định (Cấp thủ công)' WHERE label LIKE 'M?c d?nh%';");
            jdbcTemplate.execute("UPDATE coupon_event_types SET label = N'Tự động tặng sau Review' WHERE label LIKE 'T? d?ng t?ng%';");
            jdbcTemplate.execute("UPDATE coupon_event_types SET label = N'Khuyến mãi Cuối tuần' WHERE label LIKE 'Khuy?n mãi Cu?i tu?n%';");
            jdbcTemplate.execute("UPDATE coupon_event_types SET label = N'Khuyến mãi Cuối tuần' WHERE label LIKE 'Khuyến mãi Cuối tu?n%';");
            jdbcTemplate.execute("UPDATE coupon_event_types SET label = N'Khuyến mãi Đông' WHERE label LIKE 'Khuy?n mãi Đông%';");
            jdbcTemplate.execute("UPDATE coupon_event_types SET label = N'Mặc định (Cấp thủ công)' WHERE label = 'M?c d?nh (C?p th? công)';");

            // Cập nhật lại các event mặc định
            jdbcTemplate.execute("UPDATE coupons SET target_event = N'Sự kiện Chào Hè' WHERE target_event = 'Su kien Chao He';");
        } catch (Exception e) {
            System.err.println("Cố gắng sửa kiểu dữ liệu database sang NVARCHAR thất bại (Có thể đã fix rồi): " + e.getMessage());
        }
    }
}

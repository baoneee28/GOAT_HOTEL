package com.hotel.entity;

import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "coupons")
public class Coupon {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "code", nullable = false, unique = true, length = 50)
    private String code;

    @Column(name = "name", nullable = false, columnDefinition = "NVARCHAR(150)")
    private String name;

    @Column(name = "description", columnDefinition = "NVARCHAR(MAX)")
    private String description;

    @Column(name = "discount_type", nullable = false, length = 20)
    private String discountType = "FIXED";

    @Column(name = "discount_value", nullable = false)
    private Double discountValue = 0.0;

    @Column(name = "min_order_value", nullable = false)
    private Double minOrderValue = 0.0;

    @Column(name = "max_discount_amount")
    private Double maxDiscountAmount;

    @Column(name = "start_date", nullable = false)
    private LocalDateTime startDate;

    @Column(name = "end_date", nullable = false)
    private LocalDateTime endDate;

    @Column(name = "usage_limit")
    private Integer usageLimit;

    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;

    @Column(name = "target_event", columnDefinition = "NVARCHAR(150)")
    private String targetEvent = "DEFAULT";

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Transient
    private Long usedCount = 0L;

    @Transient
    private Long assignedCount = 0L;

    @Transient
    private Long availableAssignedCount = 0L;

    @Transient
    private Long usedAssignedCount = 0L;

    @PrePersist
    protected void onCreate() {
        LocalDateTime now = LocalDateTime.now();
        if (createdAt == null) {
            createdAt = now;
        }
        if (isActive == null) {
            isActive = true;
        }
        if (discountType == null || discountType.isBlank()) {
            discountType = "FIXED";
        }
        if (discountValue == null) {
            discountValue = 0.0;
        }
        if (minOrderValue == null) {
            minOrderValue = 0.0;
        }
        updatedAt = now;
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}

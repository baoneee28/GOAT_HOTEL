package com.hotel.entity;

import jakarta.persistence.*;
import lombok.Data;

@Data
@Entity
@Table(name = "coupon_event_types")
public class CouponEventType {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "event_key", nullable = false, unique = true, length = 50)
    private String eventKey;

    @Column(name = "label", nullable = false, length = 100)
    private String label;

    @Column(name = "icon", length = 50)
    private String icon = "category";

    @Column(name = "color", length = 20)
    private String color = "#6b7280";

    @Column(name = "sort_order")
    private Integer sortOrder = 0;

    @Column(name = "is_system")
    private Boolean isSystem = false;
}

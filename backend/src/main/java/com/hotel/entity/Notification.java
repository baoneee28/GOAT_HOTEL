package com.hotel.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "notifications")
public class Notification {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    @com.fasterxml.jackson.annotation.JsonIgnoreProperties({"hibernateLazyInitializer", "handler", "password"})
    private User user;

    @Column(name = "title", columnDefinition = "NVARCHAR(255)", nullable = false)
    private String title;

    @Column(name = "message", columnDefinition = "NVARCHAR(MAX)", nullable = false)
    private String message;

    @Column(name = "type", nullable = false, length = 50)
    private String type = "SYSTEM"; // e.g. SYSTEM, REVIEW_PROMPT, PAYMENT_SUCCESS

    @Column(name = "related_id")
    private Integer relatedId; // E.g., the bookingId or reviewId context

    @Column(name = "is_read", nullable = false)
    private Boolean isRead = false;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) createdAt = LocalDateTime.now();
        if (isRead == null) isRead = false;
        if (type == null) type = "SYSTEM";
    }
}

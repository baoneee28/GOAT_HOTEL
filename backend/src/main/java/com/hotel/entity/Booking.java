package com.hotel.entity;
import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;
import java.util.List;
@Data
@Entity
@Table(name = "bookings")
public class Booking {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    @com.fasterxml.jackson.annotation.JsonIgnoreProperties({"hibernateLazyInitializer", "handler", "password"})
    private User user;
    @Column(name = "total_price")
    private Double totalPrice;
    @Column(name = "coupon_code")
    private String couponCode;
    @Column(name = "discount_amount")
    private Double discountAmount = 0.0;
    @Column(name = "deposit_amount")
    private Double depositAmount = 0.0;
    @Column(name = "final_amount")
    private Double finalAmount;
    @Column(name = "status", length = 20)
    private String status = "pending";
    @Column(name = "payment_status", length = 30)
    private String paymentStatus = "unpaid";
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
    @Column(name = "expires_at")
    private LocalDateTime expiresAt;
    
    @OneToMany(mappedBy = "booking", fetch = FetchType.LAZY, cascade = CascadeType.ALL)
    @com.fasterxml.jackson.annotation.JsonIgnoreProperties("booking")
    private List<BookingDetail> details;

    @OneToMany(mappedBy = "booking", fetch = FetchType.LAZY, cascade = CascadeType.ALL)
    @com.fasterxml.jackson.annotation.JsonIgnoreProperties("booking")
    private List<BookingService> services;

    @OneToMany(mappedBy = "booking", fetch = FetchType.LAZY, cascade = CascadeType.ALL)
    @com.fasterxml.jackson.annotation.JsonIgnoreProperties("booking")
    private List<Payment> payments;

    @Transient
    private Double paidAmount = 0.0;

    @Transient
    private Double remainingAmount = 0.0;

    @Transient
    private Double depositOutstandingAmount = 0.0;

    @PrePersist
    @PreUpdate
    protected void onCreate() {
        if (discountAmount == null) discountAmount = 0.0;
        if (depositAmount == null) depositAmount = 0.0;
        if (finalAmount == null && totalPrice != null) finalAmount = totalPrice;
        if (status == null || status.isBlank()) status = "pending";
        if (paymentStatus == null || paymentStatus.isBlank()) paymentStatus = "unpaid";
        if (createdAt == null) createdAt = LocalDateTime.now();
    }
}

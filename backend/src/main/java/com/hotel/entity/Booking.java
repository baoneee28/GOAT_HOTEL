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
    @Column(name = "status", length = 20)
    private String status = "pending";
    @Column(name = "payment_status", length = 30)
    private String paymentStatus = "unpaid";
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
    
    @OneToMany(mappedBy = "booking", fetch = FetchType.LAZY, cascade = CascadeType.ALL)
    @com.fasterxml.jackson.annotation.JsonIgnoreProperties("booking")
    private List<BookingDetail> details;

    @OneToMany(mappedBy = "booking", fetch = FetchType.LAZY, cascade = CascadeType.ALL)
    @com.fasterxml.jackson.annotation.JsonIgnoreProperties("booking")
    private List<BookingService> services;

    @OneToMany(mappedBy = "booking", fetch = FetchType.LAZY, cascade = CascadeType.ALL)
    @com.fasterxml.jackson.annotation.JsonIgnoreProperties("booking")
    private List<Payment> payments;

    @PrePersist
    protected void onCreate() {
        if (status == null || status.isBlank()) status = "pending";
        if (paymentStatus == null || paymentStatus.isBlank()) paymentStatus = "unpaid";
        if (createdAt == null) createdAt = LocalDateTime.now();
    }
}

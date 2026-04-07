package com.hotel.entity;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;
@Data
@Entity
@Table(name = "reviews")
public class Review {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    @com.fasterxml.jackson.annotation.JsonIgnoreProperties({"hibernateLazyInitializer", "handler", "password", "bookings", "reviews", "notifications"})
    private User user;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "room_type_id")
    @com.fasterxml.jackson.annotation.JsonIgnoreProperties({"hibernateLazyInitializer", "handler", "items", "reviews", "bookings"})
    private RoomType roomType;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "booking_id")
    @com.fasterxml.jackson.annotation.JsonIgnoreProperties({"details", "services", "payments", "user"})
    private Booking booking;
    @Column(name = "rating", nullable = false)
    @Min(value = 1, message = "Rating phải nằm trong khoảng từ 1 đến 5.")
    @Max(value = 5, message = "Rating phải nằm trong khoảng từ 1 đến 5.")
    private Integer rating;
    @Column(name = "comment", columnDefinition = "TEXT")
    private String comment;
    @Column(name = "created_at")
    private LocalDateTime createdAt;
    
    @PrePersist
    @PreUpdate
    protected void onCreate() {
        if (rating == null || rating < 1 || rating > 5) {
            throw new IllegalStateException("Rating phải nằm trong khoảng từ 1 đến 5.");
        }
        if (createdAt == null) createdAt = LocalDateTime.now();
    }
}

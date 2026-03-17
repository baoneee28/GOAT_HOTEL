package com.hotel.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;



// Class đại diện cho bảng 'bookings' (Đơn đặt phòng) trong Database
@Data
@Entity
@Table(name = "bookings")
public class Booking {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;


    // Mỗi Đơn đặt phòng thuộc về 1 User (Đây là khóa ngoại user_id)
    // FetchType.LAZY: Khi lấy Booking lên thì chưa lấy data User vội (để web đỡ lag), chừng nào code gọi get_User() mới chọc DB lấy
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    // Mỗi Đơn đặt phòng được gắn vào 1 Phòng duy nhất (Khóa ngoại room_id)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "room_id")
    private Room room;

    @Column(name = "check_in")
    private LocalDateTime checkIn;

    @Column(name = "check_out")
    private LocalDateTime checkOut;

    @Column(name = "total_price")
    private Double totalPrice;



    @Column(name = "status", length = 20)
    private String status = "pending";

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;


    @Column(name = "check_in_actual")
    private LocalDateTime checkInActual;


    @Column(name = "check_out_actual")
    private LocalDateTime checkOutActual;


    @Column(name = "total_hours")
    private Double totalHours = 0.0;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
    }
}

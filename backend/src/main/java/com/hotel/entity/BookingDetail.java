package com.hotel.entity;
import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;
@Data
@Entity
@Table(name = "booking_details")
public class BookingDetail {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "booking_id", nullable = false)
    @com.fasterxml.jackson.annotation.JsonIgnoreProperties({"details", "services", "payments", "user"})
    private Booking booking;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "room_id")
    @com.fasterxml.jackson.annotation.JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private Room room;
    @Column(name = "price_at_booking", nullable = false)
    private Double priceAtBooking;
    @Column(name = "check_in")
    private LocalDateTime checkIn;
    @Column(name = "check_out")
    private LocalDateTime checkOut;
    @Column(name = "check_in_actual")
    private LocalDateTime checkInActual;
    @Column(name = "check_out_actual")
    private LocalDateTime checkOutActual;
    @Column(name = "total_hours")
    private Double totalHours = 0.0;
}

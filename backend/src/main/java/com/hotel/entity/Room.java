package com.hotel.entity;
import jakarta.persistence.*;
import lombok.Data;
@Data
@Entity
@Table(name = "rooms")
public class Room {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;
    @Column(name = "room_number", nullable = false, unique = true, length = 10)
    private String roomNumber;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "type_id")
    @com.fasterxml.jackson.annotation.JsonIgnoreProperties({"hibernateLazyInitializer", "handler", "items"})
    private RoomType roomType;
    @Column(name = "status", length = 20)
    private String status = "available";
    @Transient
    private String effectiveStatus;
    @Transient
    private Integer relatedBookingId;
    @Transient
    private String effectiveStatusReason;
}

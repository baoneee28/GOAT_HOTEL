package com.hotel.entity;

import jakarta.persistence.*;
import lombok.Data;



// Bảng chứa danh mục CÁC LOẠI PHÒNG (Ví dụ: Phòng Standard, Phòng VIP...)
@Data
@Entity
@Table(name = "room_types")
public class RoomType {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    // Tên loại phòng (Bắt buộc nhập)
    @Column(name = "type_name", nullable = false, length = 100)
    private String typeName;

    // Giá thuê 1 đêm
    @Column(name = "price_per_night", nullable = false)
    private Double pricePerNight;

    // Số người ở tối đa
    @Column(name = "capacity", nullable = false)
    private Integer capacity;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "image", length = 255)
    private String image;
}

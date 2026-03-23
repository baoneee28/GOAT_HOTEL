package com.hotel.entity;

import jakarta.persistence.*;
import lombok.Data;



// Bảng chứa danh mục CÁC TIỆN ÍCH CÓ THỂ CÓ TRONG PHÒNG (TV, Tủ lạnh, Điều hòa...)
@Data
@Entity
@Table(name = "items")
public class Item {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    // Tên tiện ích (Ví dụ: "TV Samsung 55 inch")
    @Column(name = "name", nullable = false, length = 100)
    private String name;

    // Link ảnh icon minh họa cho tiện ích
    @Column(name = "image", length = 255)
    private String image;
}

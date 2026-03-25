package com.hotel.entity;
import jakarta.persistence.*;
import lombok.Data;
@Data
@Entity
@Table(name = "services")
public class HotelService {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;
    @Column(name = "name", nullable = false, length = 100)
    private String name;
    @Column(name = "price", nullable = false)
    private Double price;
    @Column(name = "description", columnDefinition = "TEXT")
    private String description;
    @Column(name = "image", length = 255)
    private String image;
}

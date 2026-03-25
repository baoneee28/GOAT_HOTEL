package com.hotel.entity;
import jakarta.persistence.*;
import lombok.Data;
import java.util.List;
@Data
@Entity
@Table(name = "room_types")
public class RoomType {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;
    @Column(name = "type_name", nullable = false, length = 100)
    private String typeName;
    @Column(name = "price_per_night", nullable = false)
    private Double pricePerNight;
    @Column(name = "capacity", nullable = false)
    private Integer capacity;
    @Column(name = "description", columnDefinition = "TEXT")
    private String description;
    @Column(name = "image", columnDefinition = "NVARCHAR(MAX)")
    private String image;
    
    @OneToMany(mappedBy = "roomType", fetch = FetchType.LAZY, cascade = CascadeType.ALL)
    @com.fasterxml.jackson.annotation.JsonIgnoreProperties("roomType")
    private List<RoomTypeItem> items;
}

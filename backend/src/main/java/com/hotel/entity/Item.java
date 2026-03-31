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

    public String getImage() {
        return normalizeImage(image);
    }

    public void setImage(String image) {
        this.image = normalizeImage(image);
    }

    private String normalizeImage(String value) {
        if (value == null || value.isBlank()) {
            return value;
        }

        String normalized = value.trim().toLowerCase();

        if (normalized.startsWith("http") || normalized.startsWith("data:")) {
            return value.trim();
        }

        if (normalized.startsWith("/icons/")) {
            return normalized;
        }

        if (normalized.contains("/")) {
            normalized = normalized.substring(normalized.lastIndexOf('/') + 1);
        }

        return switch (normalized) {
            case "wifi.png" -> "/icons/wifi.png";
            case "tv.png" -> "/icons/tv.png";
            case "safe.png" -> "/icons/safe.png";
            case "mini.png", "fridge.png" -> "/icons/mini.png";
            case "jacuzzi.png", "bathtub.png" -> "/icons/jacuzzi.png";
            case "ironing.png", "iron.png" -> "/icons/ironing.png";
            case "heart.png", "sofa.png" -> "/icons/heart.png";
            case "hairdryer.png" -> "/icons/hairdryer.png";
            case "balcony.png" -> "/icons/balcony.png";
            case "air-conditioner.png", "ac.png" -> "/icons/air-conditioner.png";
            default -> normalized.startsWith("/") ? normalized : "/icons/" + normalized;
        };
    }
}

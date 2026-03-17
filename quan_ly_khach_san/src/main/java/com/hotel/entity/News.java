package com.hotel.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;



// Đại diện cho 1 bài báo/tin tức quảng cáo trong hệ thống (ánh xạ bảng 'news')
@Data // Lombok hỗ trợ đẻ Getter/Setter
@Entity
@Table(name = "news")
public class News {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;
    // Tiêu đề của bài viết
    @Column(name = "title", nullable = false, length = 255)
    private String title;

    // Chuỗi dẫn URL không dấu (Ví dụ: "gia-phong-he-2025")
    @Column(name = "slug", nullable = false, length = 255)
    private String slug;

    // Đoạn mô tả mồi chài ngắn gọn hiển thị ở danh sách
    @Column(name = "summary", columnDefinition = "TEXT")
    private String summary;

    // Nội dung bài viết (Có thể chứa cả cục mã nguồn HTML do CKEditor sinh ra)
    @Column(name = "content", columnDefinition = "LONGTEXT")
    private String content;

    @Column(name = "image", length = 255)
    private String image;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
    }
}

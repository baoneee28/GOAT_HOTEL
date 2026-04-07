package com.hotel.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;



// Model Entity ánh xạ thẳng xuống bảng 'users' trong cơ sở dữ liệu
// @Data của Lombok sẽ tự sinh ra hàng đống hàm Getter/Setter (getId(), setFullName()...) mà không cần code gãy tay
@Data
@Entity
@Table(name = "users")
public class User {

    // Khóa chính: Tự động tăng (Auto Increment)
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "full_name", nullable = false, length = 100)
    private String fullName;
    // Cột Email, bắt buộc nhập và KHÔNG ĐƯỢC TRÙNG NHAU (unique = true)
    @Column(name = "email", nullable = false, unique = true, length = 100)
    private String email;

    // Cột Password lưu chuỗi đã được băm bằng BCrypt
    @Column(name = "password", nullable = false, length = 255)
    private String password;

    @Column(name = "phone", length = 15)
    private String phone;

    @Column(name = "image", length = 255)
    private String image;
    // Phân quyền: Cứ đăng ký mới thì mặc định nhét chữ "customer" vào
    @Column(name = "role", length = 20)
    private String role = "customer";

    @Column(name = "session_version")
    private Integer sessionVersion;

    // Thời điểm đẻ ra cái nick này
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    // Trick lỏ của JPA: Trước khi phi lệnh INSERT xuống CSDL, nó sẽ lén chạy hàm này để lấy giờ hiện tại gắn vào
    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
    }
}

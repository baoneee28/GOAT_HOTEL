package com.hotel.repository;

import com.hotel.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

// Repository này lấy dữ liệu Bảng 'users' từ DB
// JpaRepository đã code sẵn cả rổ hàm (save, delete, findById, findAll...), sinh viên chỉ việc gọi ra dùng 😎
@Repository
public interface UserRepository extends JpaRepository<User, Integer> {

    // Spring Data JPA sẽ "Tự nhìn tên hàm mà đoán câu truy vấn SQL" (Derived Query)
    // Tương đương: SELECT * FROM users WHERE email = ? AND password = ?
    Optional<User> findByEmailAndPassword(String email, String password);

    // Tương đương: SELECT * FROM users WHERE email = ?
    Optional<User> findByEmail(String email);

    // Đếm số lượng người dùng theo Phân quyền (Role)
    long countByRole(String role);
}

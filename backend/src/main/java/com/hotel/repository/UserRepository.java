package com.hotel.repository;

import com.hotel.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.Optional;

// Repository này lấy dữ liệu Bảng 'users' từ DB
// JpaRepository đã code sẵn cả rổ hàm (save, delete, findById, findAll...), sinh viên chỉ việc gọi ra dùng 😎
@Repository
public interface UserRepository extends JpaRepository<User, Integer> {

    // Tương đương: SELECT * FROM users WHERE email = ?
    Optional<User> findByEmail(String email);

    // Đếm số lượng người dùng theo Phân quyền (Role)
    long countByRole(String role);

    @Query("SELECT u FROM User u WHERE :search IS NULL OR :search = '' OR " +
           "LOWER(u.fullName) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(u.email) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(COALESCE(u.phone, '')) LIKE LOWER(CONCAT('%', :search, '%'))")
    Page<User> findWithSearch(@Param("search") String search, Pageable pageable);

    Optional<User> findByEmailIgnoreCase(String email);
}

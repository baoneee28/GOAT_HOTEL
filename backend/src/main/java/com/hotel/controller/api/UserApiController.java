package com.hotel.controller.api;

import com.hotel.entity.User;
import com.hotel.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/users")
@CrossOrigin(origins = "*")
public class UserApiController {

    @Autowired
    private UserRepository userRepository;

    @GetMapping
    public ResponseEntity<Map<String, Object>> listUsers(
            @RequestParam(defaultValue = "") String q,
            @RequestParam(defaultValue = "1") int page) {

        int pageSize = 5;
        // Do đồ án gốc chưa xây dựng Custom Query tìm kiếm User nên Spring Boot chỉ cung cấp findAll -> Gọi chung cho 2 luồng Search và GetList
        Page<User> userPage = userRepository.findAll(
                PageRequest.of(page - 1, pageSize, Sort.by("id").descending()));

        // Xóa mật khẩu khỏi JSON để bảo mật dữ liệu trước khi ném ra mạng
        userPage.getContent().forEach(u -> u.setPassword(null));

        Map<String, Object> response = new HashMap<>();
        response.put("users", userPage.getContent());
        response.put("totalPages", userPage.getTotalPages());
        response.put("currentPage", page);
        response.put("search", q);

        return ResponseEntity.ok(response);
    }

    @PostMapping
    public ResponseEntity<Map<String, Object>> saveUser(@RequestBody Map<String, String> payload) {
        String idStr = payload.get("id");
        String fullName = payload.get("fullName");
        String email = payload.get("email");
        String phone = payload.get("phone");
        String role = payload.get("role");
        String password = payload.get("password");

        User user;
        if (idStr != null && !idStr.isBlank()) {
            user = userRepository.findById(Integer.parseInt(idStr)).orElse(null);
            if (user != null) {
                user.setRole(role); // Logic gốc: Khi sửa, Admin chỉ đổi quyền (Role) chứ không cho đổi tên hay email
                userRepository.save(user);
            }
        } else {
            user = new User();
            user.setFullName(fullName);
            user.setEmail(email);
            user.setPhone(phone);
            user.setRole(role);
            if (password != null && !password.isBlank()) {
                user.setPassword(password);
            }
            // Bỏ qua upload ảnh vì API này chỉ xử lý Text (Ảnh làm hàm rời nếu cần)
            userRepository.save(user);
        }

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, Object>> deleteUser(@PathVariable Integer id) {
        Map<String, Object> response = new HashMap<>();
        try {
            userRepository.deleteById(id);
            response.put("success", true);
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "User này đang giữ Booking, không thể xóa tay!");
        }
        return ResponseEntity.ok(response);
    }
}

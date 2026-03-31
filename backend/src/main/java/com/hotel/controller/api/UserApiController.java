package com.hotel.controller.api;

import com.hotel.entity.Booking;
import com.hotel.entity.User;
import com.hotel.repository.BookingRepository;
import com.hotel.repository.UserRepository;
import com.hotel.service.AuthService;
import com.hotel.service.BookingService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/users")

public class UserApiController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private BookingRepository bookingRepository;

    @Autowired
    private BookingService bookingService;

    @Autowired
    private AuthService authService;

    private User sanitizeUser(User user) {
        return authService.toClientUser(user);
    }

    @GetMapping("/all")
    public List<User> getAllUsers() {
        List<User> users = userRepository.findAll(Sort.by("fullName").ascending());
        users.forEach(this::sanitizeUser);
        return users;
    }

    @GetMapping
    public ResponseEntity<Map<String, Object>> listUsers(
            @RequestParam(defaultValue = "") String q,
            @RequestParam(defaultValue = "1") int page) {

        int pageSize = 5;
        Page<User> userPage = userRepository.findWithSearch(
                q.isBlank() ? null : q.trim(),
                PageRequest.of(page - 1, pageSize, Sort.by("id").descending()));

        userPage.getContent().forEach(this::sanitizeUser);

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
            if (user == null) {
                return ResponseEntity.status(404).body(Map.of(
                        "success", false,
                        "message", "Không tìm thấy người dùng để cập nhật."
                ));
            }
            user.setRole(role);
            userRepository.save(user);
        } else {
            if (fullName == null || fullName.isBlank() || email == null || email.isBlank() || password == null || password.isBlank()) {
                return ResponseEntity.badRequest().body(Map.of(
                        "success", false,
                        "message", "Họ tên, email và mật khẩu là bắt buộc."
                ));
            }
            if (userRepository.findByEmailIgnoreCase(email.trim()).isPresent()) {
                return ResponseEntity.badRequest().body(Map.of(
                        "success", false,
                        "message", "Email này đã tồn tại trong hệ thống."
                ));
            }
            user = new User();
            user.setFullName(fullName.trim());
            user.setEmail(email.trim());
            user.setPhone(phone != null ? phone.trim() : null);
            user.setRole(role != null && !role.isBlank() ? role.trim() : "customer");
            user.setPassword(password);
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

    @GetMapping("/{id}/bookings")
    public ResponseEntity<Map<String, Object>> getUserBookings(
            @PathVariable Integer id,
            @RequestParam(defaultValue = "") String status,
            @RequestParam(defaultValue = "1") int page) {
        User user = userRepository.findById(id).orElse(null);
        if (user == null) {
            return ResponseEntity.status(404).body(Map.of(
                    "success", false,
                    "message", "Không tìm thấy người dùng."
            ));
        }

        Page<Booking> bookingPage = bookingRepository.findAdminBookingsByUserId(
                id,
                status.isBlank() ? null : status.trim(),
                PageRequest.of(page - 1, 5, Sort.by("id").descending())
        );
        bookingService.normalizeBookingFinancials(bookingPage.getContent());
        double totalSpent = bookingService.getTotalSpent(id);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("user", sanitizeUser(user));
        response.put("bookings", bookingPage.getContent());
        response.put("totalPages", bookingPage.getTotalPages());
        response.put("currentPage", page);
        response.put("status", status);
        response.put("totalSpent", totalSpent);
        response.put("totalBookings", bookingRepository.countByUserIdAndStatus(id, null));
        return ResponseEntity.ok(response);
    }
}

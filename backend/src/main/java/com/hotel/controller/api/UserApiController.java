package com.hotel.controller.api;

import com.hotel.dto.AdminUserUpsertRequest;
import com.hotel.dto.BookingResponse;
import com.hotel.dto.UserResponse;
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
import org.springframework.lang.NonNull;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

@RestController
@RequestMapping("/api/admin/users")

public class UserApiController {

    private static final Set<String> ALLOWED_ROLES = Set.of("customer", "staff", "admin");

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private BookingRepository bookingRepository;

    @Autowired
    private BookingService bookingService;

    @Autowired
    private AuthService authService;

    private UserResponse toUserResponse(User user) {
        return UserResponse.from(user);
    }

    @GetMapping("/all")
    public List<UserResponse> getAllUsers() {
        List<User> users = userRepository.findAll(Sort.by("fullName").ascending());
        return UserResponse.fromList(users);
    }

    @GetMapping
    public ResponseEntity<Map<String, Object>> listUsers(
            @RequestParam(defaultValue = "") String q,
            @RequestParam(defaultValue = "1") int page) {

        int pageSize = 5;
        int safePage = normalizePage(page);
        Page<User> userPage = userRepository.findWithSearch(
                q.isBlank() ? null : q.trim(),
                PageRequest.of(safePage - 1, pageSize, Sort.by("id").descending()));

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("users", UserResponse.fromList(userPage.getContent()));
        response.put("totalPages", userPage.getTotalPages());
        response.put("currentPage", safePage);
        response.put("search", q);

        return ResponseEntity.ok(response);
    }

    @PostMapping
    public ResponseEntity<Map<String, Object>> saveUser(@RequestBody AdminUserUpsertRequest request) {
        try {
            String fullName = normalizeText(request.fullName());
            String email = normalizeText(request.email());
            String phone = normalizeText(request.phone());
            String role = normalizeRole(request.role());
            String password = request.password();
            String image = normalizeText(request.image());

            User user;
            Integer userId = request.id();
            if (userId != null && userId > 0) {
                user = userRepository.findById(userId).orElse(null);
                if (user == null) {
                    return ResponseEntity.status(404).body(Map.of(
                            "success", false,
                            "message", "Không tìm thấy người dùng để cập nhật."
                    ));
                }
                user.setRole(role);
                user.setImage(image);
                userRepository.save(user);
            } else {
                if (fullName == null || email == null || password == null || password.isBlank()) {
                    return ResponseEntity.badRequest().body(Map.of(
                            "success", false,
                            "message", "Họ tên, email và mật khẩu là bắt buộc."
                    ));
                }
                if (userRepository.findByEmailIgnoreCase(email).isPresent()) {
                    return ResponseEntity.badRequest().body(Map.of(
                            "success", false,
                            "message", "Email này đã tồn tại trong hệ thống."
                    ));
                }
                user = new User();
                user.setFullName(fullName);
                user.setEmail(email);
                user.setPhone(phone);
                user.setRole(role);
                user.setPassword(authService.encodePassword(password));
                user.setImage(image);
                userRepository.save(user);
            }

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", ex.getMessage()
            ));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, Object>> deleteUser(@PathVariable @NonNull Integer id) {
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
            @PathVariable @NonNull Integer id,
            @RequestParam(defaultValue = "") String status,
            @RequestParam(defaultValue = "1") int page) {
        bookingService.expirePendingBookingsForUser(id);
        User user = userRepository.findById(id).orElse(null);
        if (user == null) {
            return ResponseEntity.status(404).body(Map.of(
                    "success", false,
                    "message", "Không tìm thấy người dùng."
            ));
        }

        int safePage = normalizePage(page);
        Page<Booking> bookingPage = bookingRepository.findAdminBookingsByUserId(
                id,
                status.isBlank() ? null : status.trim(),
                PageRequest.of(safePage - 1, 5, Sort.by("id").descending())
        );
        bookingService.normalizeBookingFinancials(bookingPage.getContent());
        double totalSpent = bookingService.getTotalSpent(id);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("user", toUserResponse(user));
        response.put("bookings", BookingResponse.fromList(bookingPage.getContent()));
        response.put("totalPages", bookingPage.getTotalPages());
        response.put("currentPage", safePage);
        response.put("status", status);
        response.put("totalSpent", totalSpent);
        response.put("totalBookings", bookingRepository.countByUserIdAndStatus(id, null));
        return ResponseEntity.ok(response);
    }

    private int normalizePage(int page) {
        return Math.max(1, page);
    }

    private String normalizeText(String value) {
        if (value == null) {
            return null;
        }
        String normalized = value.trim();
        return normalized.isBlank() ? null : normalized;
    }

    private String normalizeRole(String role) {
        String normalized = normalizeText(role);
        if (normalized == null) {
            return "customer";
        }
        String lowered = normalized.toLowerCase();
        if (!ALLOWED_ROLES.contains(lowered)) {
            throw new IllegalArgumentException("Vai trò người dùng không hợp lệ.");
        }
        return lowered;
    }
}

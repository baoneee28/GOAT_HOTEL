package com.hotel.controller.api;

import com.hotel.dto.ProfileUpdateRequest;
import com.hotel.dto.UserResponse;
import com.hotel.entity.User;
import com.hotel.repository.UserRepository;
import com.hotel.service.FileUploadService;
import jakarta.servlet.http.HttpSession;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.lang.NonNull;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/profile")

public class ProfileApiController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private FileUploadService fileUploadService;

    private User getSessionUser(HttpSession session) {
        Object userObj = session.getAttribute("user");
        return userObj instanceof User ? (User) userObj : null;
    }

    private ResponseEntity<Map<String, Object>> authRequiredResponse() {
        Map<String, Object> response = new HashMap<>();
        response.put("success", false);
        response.put("message", "Vui lòng đăng nhập để tiếp tục.");
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(response);
    }

    private ResponseEntity<Map<String, Object>> forbiddenResponse() {
        Map<String, Object> response = new HashMap<>();
        response.put("success", false);
        response.put("message", "Bạn không có quyền truy cập hồ sơ này.");
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(response);
    }

    // FE gọi API này để lấy cục data JSON của User lên form Đổi thông tin
    @GetMapping("/{userId}")
    public ResponseEntity<Map<String, Object>> getProfile(@PathVariable("userId") @NonNull Integer userId, HttpSession session) {
        User currentUser = getSessionUser(session);
        if (currentUser == null) {
            return authRequiredResponse();
        }
        if (!currentUser.getId().equals(userId)) {
            return forbiddenResponse();
        }

        User user = userRepository.findById(userId).orElse(null);
        Map<String, Object> response = new HashMap<>();
        if (user == null) {
            response.put("success", false);
            return ResponseEntity.badRequest().body(response);
        }
        
        response.put("success", true);
        response.put("user", UserResponse.from(user));
        return ResponseEntity.ok(response);
    }

    // Luồng 1: FE Cập nhật TEXT (Tên, SĐT, Tên file ảnh từ luồng Avatar)
    @PostMapping("/{userId}")
    public ResponseEntity<Map<String, Object>> updateProfile(
            @PathVariable("userId") @NonNull Integer userId,
            @Valid @RequestBody ProfileUpdateRequest request,
            HttpSession session) {
        User currentUser = getSessionUser(session);
        if (currentUser == null) {
            return authRequiredResponse();
        }
        if (!currentUser.getId().equals(userId)) {
            return forbiddenResponse();
        }

        User user = userRepository.findById(userId).orElse(null);
        Map<String, Object> response = new HashMap<>();
        if (user == null) {
            response.put("success", false);
            return ResponseEntity.badRequest().body(response);
        }

        user.setFullName(request.fullName().trim());
        user.setPhone(request.phone() == null || request.phone().isBlank() ? null : request.phone().trim());
        
        // Nếu FE truyền chuỗi avatar lên thì gắn đổi Avatar ở Database
        if (request.avatar() != null && !request.avatar().isBlank()) {
            user.setImage(request.avatar().trim());
        }
        userRepository.save(user);
        session.setAttribute("user", user);

        response.put("success", true);
        response.put("user", UserResponse.from(user));
        return ResponseEntity.ok(response);
    }

    // Luồng 2: FE chỉ quăng File ảnh vật lý lên đây (Multipart/form-data)
    // Backend sẽ gọi FileUpload bảo dọn rác avatar cũ và đặt tên file avatar mới
    @PostMapping("/{userId}/avatar")
    public ResponseEntity<Map<String, Object>> uploadAvatar(
            @PathVariable("userId") @NonNull Integer userId,
            @RequestParam("avatar") MultipartFile avatar,
            HttpSession session) {
        Map<String, Object> response = new HashMap<>();
        User currentUser = getSessionUser(session);
        if (currentUser == null) {
            return authRequiredResponse();
        }
        if (!currentUser.getId().equals(userId)) {
            return forbiddenResponse();
        }
        try {
            String fileName = fileUploadService.uploadUserAvatar(avatar, userId);
            response.put("success", true);
            response.put("fileName", fileName);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }
}

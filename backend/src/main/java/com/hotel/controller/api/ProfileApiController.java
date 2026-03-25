package com.hotel.controller.api;

import com.hotel.entity.User;
import com.hotel.repository.UserRepository;
import com.hotel.service.FileUploadService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
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

    // FE gọi API này để lấy cục data JSON của User lên form Đổi thông tin
    @GetMapping("/{userId}")
    public ResponseEntity<Map<String, Object>> getProfile(@PathVariable("userId") Integer userId) {
        User user = userRepository.findById(userId).orElse(null);
        Map<String, Object> response = new HashMap<>();
        if (user == null) {
            response.put("success", false);
            return ResponseEntity.badRequest().body(response);
        }
        
        // ⚠️ Dấu nhẹm password không ném ngược về phía FE
        user.setPassword(null);
        response.put("success", true);
        response.put("user", user);
        return ResponseEntity.ok(response);
    }

    // Luồng 1: FE Cập nhật TEXT (Tên, SĐT, Tên file ảnh từ luồng Avatar)
    @PostMapping("/{userId}")
    public ResponseEntity<Map<String, Object>> updateProfile(
            @PathVariable("userId") Integer userId,
            @RequestBody Map<String, String> payload) {
        User user = userRepository.findById(userId).orElse(null);
        Map<String, Object> response = new HashMap<>();
        if (user == null) {
            response.put("success", false);
            return ResponseEntity.badRequest().body(response);
        }

        user.setFullName(payload.get("fullName"));
        user.setPhone(payload.get("phone"));
        
        // Nếu FE truyền chuỗi avatar lên thì gắn đổi Avatar ở Database
        if (payload.get("avatar") != null && !payload.get("avatar").isBlank()) {
            user.setImage(payload.get("avatar"));
        }
        userRepository.save(user);

        user.setPassword(null);
        response.put("success", true);
        response.put("user", user);
        return ResponseEntity.ok(response);
    }

    // Luồng 2: FE chỉ quăng File ảnh vật lý lên đây (Multipart/form-data)
    // Backend sẽ gọi FileUpload bảo dọn rác avatar cũ và đặt tên file avatar mới
    @PostMapping("/{userId}/avatar")
    public ResponseEntity<Map<String, Object>> uploadAvatar(
            @PathVariable("userId") Integer userId,
            @RequestParam("avatar") MultipartFile avatar) {
        Map<String, Object> response = new HashMap<>();
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

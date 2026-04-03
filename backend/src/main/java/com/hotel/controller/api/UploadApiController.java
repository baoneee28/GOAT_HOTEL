package com.hotel.controller.api;

import com.hotel.service.FileUploadService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/upload")

public class UploadApiController {

    @Autowired
    private FileUploadService fileUploadService;

    // FE sẽ gọi API này để đẩy file lên, BE sẽ trả về String tên file để FE gắn vào JSON lúc gửi Create/Update News, RoomType...
    @PostMapping
    public ResponseEntity<Map<String, Object>> uploadFile(@RequestParam("file") MultipartFile file,
                                                          @RequestParam(defaultValue = "general") String type) {
        Map<String, Object> response = new HashMap<>();
        try {
            String category = resolveCategory(type);
            String fileName = fileUploadService.uploadByCategory(file, category);
            response.put("success", true);
            response.put("fileName", fileName);
            response.put("url", fileName);
            response.put("category", category);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "Lỗi tải ảnh: " + e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }

    private String resolveCategory(String type) {
        if (type == null || type.isBlank()) {
            return "general";
        }

        String normalized = type.trim().toLowerCase().replace('-', '_');
        return switch (normalized) {
            case "news" -> "news";
            case "room_types", "room_type", "roomtypes" -> "room_types";
            case "users", "user" -> "users";
            case "items", "item" -> "items";
            default -> "general";
        };
    }
}

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
            String fileName;
            if ("news".equals(type)) {
                fileName = fileUploadService.uploadNews(file);
            } else {
                fileName = fileUploadService.uploadGeneral(file, "");
            }
            response.put("success", true);
            response.put("fileName", fileName);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "Lỗi tải ảnh: " + e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }
}

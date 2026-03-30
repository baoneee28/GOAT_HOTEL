package com.hotel.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.nio.file.Path;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/description")
public class DescriptionController {

    @GetMapping
    public Map<String, String> getDescription() {
        Map<String, String> response = new HashMap<>();
        try {
            Path path = Paths.get("description.txt"); 
            if (Files.exists(path)) {
                String content = new String(Files.readAllBytes(path), "UTF-8");
                response.put("content", content);
            } else {
                response.put("content", "GOAT HOTEL là một khách sạn hiện đại, mang phong cách thiết kế sang trọng và ấm cúng, phù hợp cho cả khách du lịch và công tác. Với vị trí thuận lợi, khách sạn giúp du khách dễ dàng di chuyển đến các điểm tham quan nổi bật trong khu vực. Hệ thống phòng nghỉ được trang bị đầy đủ tiện nghi, đảm bảo mang lại sự thoải mái tối đa cho khách hàng. Bên cạnh đó, dịch vụ chuyên nghiệp và thân thiện tại GOAT HOTEL luôn tạo ấn tượng tốt và sự hài lòng cho mọi du khách.");
            }
        } catch (Exception e) {
            response.put("content", "Error loading description.");
            response.put("error", e.getMessage());
        }
        return response;
    }
}

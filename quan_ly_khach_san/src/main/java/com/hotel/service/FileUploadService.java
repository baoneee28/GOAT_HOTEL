package com.hotel.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Arrays;
import java.util.List;


// Service chuyển dùng để đẩy (upload) file ảnh vật lý lên máy chủ (thư mục static/uploads)
@Service
public class FileUploadService {

    @Value("${app.upload.dir}")
    private String uploadDir;


    private static final List<String> ALLOWED_EXTENSIONS = Arrays.asList("jpg", "jpeg", "png", "gif");

    
    // Xử lý riêng việc upload ảnh đại diện Của User (Profile)
    public String uploadUserAvatar(MultipartFile file, Integer userId) throws IOException {
        String ext = getExtension(file.getOriginalFilename());
        
        // Validate đuôi mở rộng, chặn file đuôi lạ (chống up mã độc shell.php)
        if (!ALLOWED_EXTENSIONS.contains(ext.toLowerCase())) {
            throw new IllegalArgumentException("Chỉ chấp nhận file JPG, PNG, GIF");
        }
        
        // Đổi tên file để tránh bị trùng: "user_[id]_[timestamp].jpg"
        String fileName = "user_" + userId + "_" + System.currentTimeMillis() / 1000 + "." + ext;
        saveFile(file, fileName); // Gọi hàm nổ file vật lý vào ổ cứng
        return fileName; // Trả về tên file để lưu vào Database
    }

    
    public String uploadGeneral(MultipartFile file, String prefix) throws IOException {
        String ext = getExtension(file.getOriginalFilename());
        String fileName = prefix + System.currentTimeMillis() / 1000 + "." + ext;
        saveFile(file, fileName);
        return fileName;
    }

    
    public String uploadNews(MultipartFile file) throws IOException {
        String originalName = file.getOriginalFilename();
        String fileName = System.currentTimeMillis() / 1000 + "_" + originalName;
        saveFile(file, fileName);
        return fileName;
    }

    // Hàm "cơ bắp" thực hiện việc ghi luồng bit từ Form vào ổ cứng vật lý
    private void saveFile(MultipartFile file, String fileName) throws IOException {
        // Lấy đường dẫn thư mục lưu ảnh (được chọc tới localhost:8080/uploads qua WebMvcConfig)
        Path uploadPath = Paths.get(uploadDir);
        
        // Nếu thư mục uploads chưa có thật trên ổ đĩa -> Tạo thư mục mới
        if (!Files.exists(uploadPath)) {
            Files.createDirectories(uploadPath);
        }
        
        // Gắn tên file vào đuôi đường dẫn và GHI NHÚNG FILE VÀO. REPLACE_EXISTING giúp đè bẹp ảnh trùng tên
        Path filePath = uploadPath.resolve(fileName);
        Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);
    }

    private String getExtension(String filename) {
        if (filename == null || !filename.contains(".")) return "";
        return filename.substring(filename.lastIndexOf('.') + 1);
    }
}

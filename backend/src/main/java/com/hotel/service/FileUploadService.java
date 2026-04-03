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


// Service dùng để đẩy file ảnh vật lý lên backend static/uploads/<table>
@Service
public class FileUploadService {

    @Value("${app.upload.dir}")
    private String uploadDir;


    private static final List<String> ALLOWED_EXTENSIONS = Arrays.asList("jpg", "jpeg", "png", "gif");

    // Xử lý riêng việc upload ảnh đại diện Của User (Profile)
    public String uploadUserAvatar(MultipartFile file, Integer userId) throws IOException {
        return uploadToCategory(file, "users", "user_" + userId + "_");
    }

    public String uploadGeneral(MultipartFile file, String prefix) throws IOException {
        return uploadToCategory(file, "general", prefix);
    }

    public String uploadNews(MultipartFile file) throws IOException {
        return uploadToCategory(file, "news", "news_");
    }

    public String uploadByCategory(MultipartFile file, String category) throws IOException {
        return uploadToCategory(file, category, normalizeCategory(category) + "_");
    }

    public boolean deleteUploadedFile(String storedPath) {
        try {
            if (storedPath == null || storedPath.isBlank()) {
                return false;
            }

            String normalized = storedPath.trim().replace('\\', '/');
            String uploadPrefix = "/uploads/";
            if (!normalized.startsWith(uploadPrefix)) {
                return false;
            }

            String relativePath = normalized.substring(uploadPrefix.length());
            if (relativePath.isBlank()) {
                return false;
            }

            Path uploadRoot = resolveUploadRoot().normalize();
            Path targetPath = uploadRoot.resolve(relativePath).normalize();
            if (!targetPath.startsWith(uploadRoot) || Files.isDirectory(targetPath)) {
                return false;
            }

            return Files.deleteIfExists(targetPath);
        } catch (IOException ex) {
            return false;
        }
    }

    private String uploadToCategory(MultipartFile file, String category, String prefix) throws IOException {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("Vui lòng chọn ảnh trước khi tải lên.");
        }

        String ext = getExtension(file.getOriginalFilename());
        if (!ALLOWED_EXTENSIONS.contains(ext.toLowerCase())) {
            throw new IllegalArgumentException("Chỉ chấp nhận file JPG, PNG, GIF");
        }

        String normalizedCategory = normalizeCategory(category);
        String sanitizedPrefix = sanitizePrefix(prefix);
        String baseName = sanitizeBaseName(file.getOriginalFilename());
        String fileName = sanitizedPrefix + System.currentTimeMillis() + "_" + baseName + "." + ext.toLowerCase();

        saveFile(file, normalizedCategory, fileName);
        return "/uploads/" + normalizedCategory + "/" + fileName;
    }

    // Hàm "cơ bắp" thực hiện việc ghi luồng bit từ Form vào ổ cứng vật lý
    private void saveFile(MultipartFile file, String category, String fileName) throws IOException {
        Path uploadPath = resolveUploadRoot().resolve(category);
        Files.createDirectories(uploadPath);

        // Gắn tên file vào đuôi đường dẫn và GHI NHÚNG FILE VÀO. REPLACE_EXISTING giúp đè bẹp ảnh trùng tên
        Path filePath = uploadPath.resolve(fileName);
        Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);
    }

    private Path resolveUploadRoot() throws IOException {
        Path configuredPath = Paths.get(uploadDir);
        if (configuredPath.isAbsolute()) {
            Files.createDirectories(configuredPath);
            return configuredPath.normalize();
        }

        Path cwd = Paths.get(System.getProperty("user.dir")).toAbsolutePath().normalize();
        Path backendModuleRoot = looksLikeBackendModule(cwd) ? cwd : cwd.resolve("backend").normalize();
        Path resolved = looksLikeBackendModule(backendModuleRoot)
                ? backendModuleRoot.resolve(configuredPath).normalize()
                : cwd.resolve(configuredPath).normalize();

        Files.createDirectories(resolved);
        return resolved;
    }

    private boolean looksLikeBackendModule(Path path) {
        if (path == null) {
            return false;
        }

        return Files.exists(path.resolve("src").resolve("main").resolve("java"))
                && Files.exists(path.resolve("src").resolve("main").resolve("resources"));
    }

    private String normalizeCategory(String category) {
        if (category == null || category.isBlank()) {
            return "general";
        }

        String normalized = category.trim().toLowerCase().replace('-', '_');
        return normalized.replaceAll("[^a-z0-9_]", "");
    }

    private String sanitizePrefix(String prefix) {
        if (prefix == null || prefix.isBlank()) {
            return "";
        }
        return prefix.trim().replaceAll("[^a-zA-Z0-9_-]", "_");
    }

    private String sanitizeBaseName(String filename) {
        if (filename == null || filename.isBlank()) {
            return "image";
        }

        String original = Paths.get(filename).getFileName().toString();
        int dotIndex = original.lastIndexOf('.');
        String baseName = dotIndex > 0 ? original.substring(0, dotIndex) : original;
        String sanitized = baseName.trim().replaceAll("[^a-zA-Z0-9_-]", "_");
        return sanitized.isBlank() ? "image" : sanitized;
    }

    private String getExtension(String filename) {
        if (filename == null || !filename.contains(".")) return "";
        return filename.substring(filename.lastIndexOf('.') + 1);
    }
}

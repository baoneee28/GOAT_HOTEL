package com.hotel.config;

import com.hotel.interceptor.AdminInterceptor;
import com.hotel.interceptor.AuthInterceptor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.*;




// File cấu hình chính của Spring MVC
// Dùng để cài đặt các Interceptor (bảo vệ route) và định tuyến file tĩnh (như ảnh, css)
@Configuration
@EnableWebMvc
@SuppressWarnings("null")
public class WebMvcConfig implements WebMvcConfigurer {

    @Autowired
    private AuthInterceptor authInterceptor;

    @Autowired
    private AdminInterceptor adminInterceptor;

    @Value("${app.upload.dir}")
    private String uploadDir;

    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        // Đăng ký AuthInterceptor: Bắt buộc người dùng phải đăng nhập mới được vào trang Lịch sử và Profile
        // Nếu chưa đăng nhập, Interceptor sẽ đá văng về trang /login
        registry.addInterceptor(authInterceptor)
                .addPathPatterns("/history", "/profile");

        // Đăng ký AdminInterceptor: Bảo vệ toàn bộ các trang quản trị bắt đầu bằng /admin
        // Áp dụng cho cả /admin và các trang con phía trong như /admin/rooms, /admin/users...
        registry.addInterceptor(adminInterceptor)
                .addPathPatterns(
                        "/admin",
                        "/admin/**",
                        "/api/admin/**",
                        "/api/rooms/admin",
                        "/api/rooms/admin/**",
                        "/api/room-types/admin",
                        "/api/room-types/admin/**",
                        "/api/news/admin",
                        "/api/news/admin/**",
                        "/api/upload"
                );
    }

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        // Ánh xạ thư mục chứa CSS/JS/Images của giao diện (bây giờ nằm ở ../frontend/static/)
        registry.addResourceHandler("/**")
                .addResourceLocations("file:../frontend/static/");

        // Hàm này rất quan trọng: Cấu hình để website có thể đọc được ảnh người dùng upload
        registry.addResourceHandler("/uploads/**")
                .addResourceLocations("file:../frontend/static/uploads/");

        // Phục vụ ảnh từ backend (classpath)
        registry.addResourceHandler("/images/**")
                .addResourceLocations("classpath:/static/images/");
    }

    @Override
    public void addViewControllers(ViewControllerRegistry registry) {

    }
}

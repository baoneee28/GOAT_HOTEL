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
                .addPathPatterns("/admin", "/admin/**");
    }

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        // Ánh xạ thư mục chứa CSS/JS/Images của giao diện (thư mục gốc)
        registry.addResourceHandler("/static/**")
                .addResourceLocations("classpath:/static/");

        // Hàm này rất quan trọng: Cấu hình để website có thể đọc được ảnh người dùng upload
        // Biến đường dẫn http://localhost:8080/uploads/... trỏ thẳng vào thư mục lấy ảnh vật lý trên server
        registry.addResourceHandler("/uploads/**")
                .addResourceLocations("classpath:/static/uploads/");
    }

    @Override
    public void addViewControllers(ViewControllerRegistry registry) {

    }
}

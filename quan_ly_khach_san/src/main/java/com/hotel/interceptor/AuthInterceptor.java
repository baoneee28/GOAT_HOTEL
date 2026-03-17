package com.hotel.interceptor;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;


// Lớp này đóng vai trò như một "Bảo vệ cổng" (Interceptor)
// Chức năng: Kiểm tra xem người dùng đã đăng nhập chưa (có session hay chưa)
// Thường dùng để chặn các trang yêu cầu đăng nhập như: Hồ sơ cá nhân, Lịch sử đặt phòng
@Component
@SuppressWarnings("null")
public class AuthInterceptor implements HandlerInterceptor {

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler)
            throws Exception {
        // Lấy session hiện tại (false nghĩa là nếu chưa có session thì không tự động tạo mới)
        HttpSession session = request.getSession(false);
        
        // Nếu không có session hoặc trong session không có thuộc tính "user" (chưa đăng nhập)
        if (session == null || session.getAttribute("user") == null) {
            // Đá văng (redirect) về trang đăng nhập
            response.sendRedirect(request.getContextPath() + "/login");
            return false; // Chặn ngang, không cho đi tiếp vào Controller
        }
        
        // Nếu đã đăng nhập, cho phép đi tiếp
        return true;
    }
}

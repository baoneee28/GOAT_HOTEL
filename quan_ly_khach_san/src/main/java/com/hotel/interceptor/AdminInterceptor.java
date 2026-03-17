package com.hotel.interceptor;

import com.hotel.entity.User;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;


// Lớp này dùng để phân quyền (Authorization)
// Chức năng: Đảm bảo chỉ có tài khoản có Role là "admin" mới được vào các trang quản trị
@Component
@SuppressWarnings("null")
public class AdminInterceptor implements HandlerInterceptor {

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler)
            throws Exception {
        // Lấy session hiện tại
        HttpSession session = request.getSession(false);
        
        // Kiểm tra xem đã đăng nhập chưa
        if (session != null && session.getAttribute("user") != null) {
            // Ép kiểu thuộc tính "user" trong session về class User
            User user = (User) session.getAttribute("user");
            
            // Nếu là admin thì cho phép đi tiếp vào trang quản trị
            if ("admin".equals(user.getRole())) {
                return true;
            }
        }

        // Nếu chưa đăng nhập hoặc không phải admin, đá văng về trang login
        response.sendRedirect(request.getContextPath() + "/login");
        return false;
    }
}

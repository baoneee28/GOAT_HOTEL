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
        if ("OPTIONS".equalsIgnoreCase(request.getMethod())) {
            response.setStatus(HttpServletResponse.SC_OK);
            return true;
        }

        boolean isApiRequest = request.getRequestURI().startsWith(request.getContextPath() + "/api/");
        // Lấy session hiện tại
        HttpSession session = request.getSession(false);
        
        // Kiểm tra xem đã đăng nhập chưa
        if (session != null && session.getAttribute("user") != null) {
            // Ép kiểu thuộc tính "user" trong session về class User
            User user = (User) session.getAttribute("user");
            
            // Nếu là admin thì cho phép đi tiếp vào trang quản trị
            if (user.getRole() != null && "admin".equalsIgnoreCase(user.getRole())) {
                return true;
            }
        }

        // Nếu chưa đăng nhập hoặc không phải admin, đá văng về trang login
        if (isApiRequest) {
            response.setStatus(HttpServletResponse.SC_FORBIDDEN);
            response.setContentType("application/json;charset=UTF-8");
            response.getWriter().write("{\"success\":false,\"message\":\"Bạn không có quyền truy cập tài nguyên quản trị.\"}");
            return false;
        }

        response.sendRedirect(request.getContextPath() + "/login");
        return false;
    }
}

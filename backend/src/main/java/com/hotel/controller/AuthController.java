package com.hotel.controller;

import com.hotel.entity.User;
import com.hotel.service.AuthService;
import jakarta.servlet.http.HttpSession;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;


// Controller phụ trách Đăng nhập, Đăng ký và Đăng xuất
@Controller
public class AuthController {

    @Autowired
    private AuthService authService;

    
    // Hiển thị trang đăng nhập (phương thức GET)
    @GetMapping("/login")
    public String loginPage(HttpSession session) {
        User user = authService.getValidSessionUser(session);

        // Nếu người dùng đã đăng nhập rồi thì không cần hiển thị lại trang login nữa
        // Đá thẳng về trang chủ (nếu là user) hoặc trang quản trị (nếu là admin)
        if (user != null) {
            return authService.isBackoffice(user) ? "redirect:/admin" : "redirect:/";
        }
        // Trả về file giao diện login.html
        return "login";
    }

    
    // Xử lý dữ liệu khi người dùng bấm nút Đăng nhập (phương thức POST)
    @PostMapping("/login")
    public String doLogin(@RequestParam String email,
                          @RequestParam String password,
                          HttpSession session,
                          Model model) {
        // Gọi Service xử lý logic so sánh mật khẩu và email với DB
        User user = authService.login(email, password, session);
        
        if (user != null) {
            // Đăng nhập thành công, điều hướng dựa trên Role (Quyền)
            if (authService.isBackoffice(user)) {
                return "redirect:/admin";
            } else {
                return "redirect:/";
            }
        } else {
            // Đăng nhập thất bại: Gom câu báo lỗi đẩy sang View (HTML) thông qua Model
            model.addAttribute("error", "Email hoặc mật khẩu không chính xác!");
            return "login"; // Ở lại trang đăng nhập để thử lại
        }
    }

    
    // Xử lý khi bấm nút Đăng ký (phương thức POST)
    @PostMapping("/register")
    public String doRegister(@RequestParam String fullname,
                             @RequestParam String email,
                             @RequestParam String phone,
                             @RequestParam String password,
                             Model model) {
        // Biến errorMsg chứa nguyên nhân lỗi (ví dụ: Trùng email)
        String errorMsg = authService.register(fullname, email, password, phone);
        
        if (errorMsg != null) {
            // Đăng ký bị lỗi -> Bắn thông báo lỗi qua Model
            model.addAttribute("error", errorMsg);
            model.addAttribute("showRegisterTab", true); // Dùng thêm biến cờ để HTML giữ lại giao diện form Đăng ký (vì mặc định là form Login)
        } else {
            // Đăng ký thành công -> Bắn thông báo xanh
            model.addAttribute("success", "Đăng ký thành công! Vui lòng đăng nhập.");
        }
        return "login";
    }

    
    // Đăng xuất: Xoá thông tin session
    @GetMapping("/logout")
    public String logout(HttpSession session) {
        authService.logout(session);
        return "redirect:/login";
    }
}

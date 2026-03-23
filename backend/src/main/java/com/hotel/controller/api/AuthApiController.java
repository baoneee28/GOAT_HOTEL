package com.hotel.controller.api;

import com.hotel.entity.User;
import com.hotel.service.AuthService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*") // Cho phép Frontend gọi API
public class AuthApiController {

    @Autowired
    private AuthService authService;

    // API Đăng nhập
    @PostMapping("/login")
    public ResponseEntity<Map<String, Object>> login(@RequestBody Map<String, String> payload) {
        String email = payload.get("email");
        String password = payload.get("password");

        // Gọi logic Đăng nhập bên Service, truyền null cho session để không xài session của web cũ
        User user = authService.login(email, password, null);

        Map<String, Object> response = new HashMap<>();
        if (user != null) {
            response.put("success", true);
            response.put("message", "Đăng nhập thành công!");
            response.put("user", user);
            return ResponseEntity.ok(response);
        } else {
            response.put("success", false);
            response.put("message", "Email hoặc mật khẩu không chính xác!");
            return ResponseEntity.badRequest().body(response);
        }
    }

    // API Đăng ký
    @PostMapping("/register")
    public ResponseEntity<Map<String, Object>> register(@RequestBody Map<String, String> payload) {
        String fullname = payload.get("fullname");
        String email = payload.get("email");
        String phone = payload.get("phone");
        String password = payload.get("password");

        // Gọi logic Đăng ký bên Service
        String errorMsg = authService.register(fullname, email, password, phone);

        Map<String, Object> response = new HashMap<>();
        if (errorMsg != null) {
            response.put("success", false);
            response.put("message", errorMsg); // Trả về lỗi VD: "Email này đã được sử dụng!"
            return ResponseEntity.badRequest().body(response);
        } else {
            response.put("success", true);
            response.put("message", "Đăng ký thành công! Vui lòng đăng nhập.");
            return ResponseEntity.ok(response);
        }
    }
}

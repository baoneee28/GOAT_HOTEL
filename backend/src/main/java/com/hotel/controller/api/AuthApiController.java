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

public class AuthApiController {

    @Autowired
    private AuthService authService;

    @GetMapping("/session")
    public ResponseEntity<Map<String, Object>> getSession(jakarta.servlet.http.HttpSession session) {
        Map<String, Object> response = new HashMap<>();
        Object userObj = session.getAttribute("user");

        if (userObj instanceof User user) {
            response.put("authenticated", true);
            response.put("user", authService.toClientUser(user));
            response.put("role", authService.resolveClientRole(user));
            response.put("redirectTo", authService.resolveDefaultRedirect(user));
        } else {
            response.put("authenticated", false);
            response.put("user", null);
        }

        return ResponseEntity.ok(response);
    }

    // API Đăng nhập
    @PostMapping("/login")
    public ResponseEntity<Map<String, Object>> login(@RequestBody Map<String, String> payload, jakarta.servlet.http.HttpSession session) {
        String email = payload.get("email");
        String password = payload.get("password");

        // Gọi logic Đăng nhập bên Service
        User user = authService.login(email, password, session);

        Map<String, Object> response = new HashMap<>();
        if (user != null) {
            response.put("success", true);
            response.put("authenticated", true);
            response.put("message", "Đăng nhập thành công!");
            response.put("user", authService.toClientUser(user));
            response.put("role", authService.resolveClientRole(user));
            response.put("redirectTo", authService.resolveDefaultRedirect(user));
            return ResponseEntity.ok(response);
        } else {
            response.put("success", false);
            response.put("authenticated", false);
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

        Map<String, Object> response = new HashMap<>();
        try {
            // Gọi logic Đăng ký bên Service
            String errorMsg = authService.register(fullname, email, password, phone);

            if (errorMsg != null) {
                response.put("success", false);
                response.put("message", errorMsg); // Trả về lỗi VD: "Email này đã được sử dụng!"
                return ResponseEntity.badRequest().body(response);
            } else {
                response.put("success", true);
                response.put("message", "Đăng ký thành công! Vui lòng đăng nhập.");
                return ResponseEntity.ok(response);
            }
        } catch (Exception ex) {
            response.put("success", false);
            response.put("message", "Có lỗi hệ thống: " + ex.getMessage());
            return ResponseEntity.status(500).body(response);
        }
    }

    // API Đăng xuất
    @PostMapping("/logout")
    public ResponseEntity<Map<String, Object>> logout(jakarta.servlet.http.HttpSession session) {
        session.invalidate(); // Hủy toàn bộ thông tin đăng nhập cũ
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("authenticated", false);
        response.put("message", "Đăng xuất thành công!");
        return ResponseEntity.ok(response);
    }
}

package com.hotel.controller.api;

import com.hotel.entity.PasswordResetCode;
import com.hotel.entity.User;
import com.hotel.repository.PasswordResetCodeRepository;
import com.hotel.repository.UserRepository;
import com.hotel.service.AuthService;
import com.hotel.service.EmailService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;
import java.util.Random;

@RestController
@RequestMapping("/api/auth")
public class AuthApiController {

    @Autowired
    private AuthService authService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordResetCodeRepository resetCodeRepository;

    @Autowired
    private EmailService emailService;

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

    @PostMapping("/login")
    public ResponseEntity<Map<String, Object>> login(@RequestBody Map<String, String> payload, jakarta.servlet.http.HttpSession session) {
        String email = payload.get("email");
        String password = payload.get("password");
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

    @PostMapping("/register")
    public ResponseEntity<Map<String, Object>> register(@RequestBody Map<String, String> payload) {
        String fullname = payload.get("fullname");
        String email = payload.get("email");
        String phone = payload.get("phone");
        String password = payload.get("password");
        Map<String, Object> response = new HashMap<>();
        try {
            String errorMsg = authService.register(fullname, email, password, phone);
            if (errorMsg != null) {
                response.put("success", false);
                response.put("message", errorMsg);
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

    @PostMapping("/logout")
    public ResponseEntity<Map<String, Object>> logout(jakarta.servlet.http.HttpSession session) {
        session.invalidate();
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("authenticated", false);
        response.put("message", "Đăng xuất thành công!");
        return ResponseEntity.ok(response);
    }

    // Bước 1: Gửi OTP tới email
    @PostMapping("/forgot-password-request")
    public ResponseEntity<Map<String, Object>> forgotPasswordRequest(@RequestBody Map<String, String> payload) {
        String email = payload.get("email");
        Map<String, Object> response = new HashMap<>();

        Optional<User> optUser = userRepository.findByEmail(email);
        if (optUser.isEmpty()) {
            response.put("success", true);
            response.put("message", "Nếu email tồn tại, mã OTP sẽ được gửi tới hộp thư của bạn.");
            return ResponseEntity.ok(response);
        }

        String otp = String.format("%06d", new Random().nextInt(1000000));

        PasswordResetCode code = new PasswordResetCode();
        code.setEmail(email);
        code.setCode(otp);
        code.setExpiresAt(LocalDateTime.now().plusMinutes(10));
        code.setIsUsed(false);
        resetCodeRepository.save(code);

        try {
            emailService.sendPasswordResetOtp(email, otp);
        } catch (Exception e) {
            e.printStackTrace();
            response.put("success", false);
            response.put("message", "Lỗi: " + e.getMessage());
            return ResponseEntity.status(500).body(response);
        }

        response.put("success", true);
        response.put("message", "Mã OTP đã được gửi tới email của bạn. Vui lòng kiểm tra hộp thư.");
        return ResponseEntity.ok(response);
    }

    // Bước 2: Xác thực OTP + đặt mật khẩu mới
    @PostMapping("/verify-reset")
    public ResponseEntity<Map<String, Object>> verifyReset(@RequestBody Map<String, String> payload) {
        String email = payload.get("email");
        String otp = payload.get("otp");
        String newPassword = payload.get("newPassword");
        Map<String, Object> response = new HashMap<>();

        if (email == null || otp == null || newPassword == null || newPassword.length() < 6) {
            response.put("success", false);
            response.put("message", "Vui lòng điền đầy đủ thông tin. Mật khẩu tối thiểu 6 ký tự.");
            return ResponseEntity.badRequest().body(response);
        }

        Optional<PasswordResetCode> optCode = resetCodeRepository
                .findTopByEmailAndIsUsedFalseAndExpiresAtAfterOrderByCreatedAtDesc(email, LocalDateTime.now());

        if (optCode.isEmpty() || !optCode.get().getCode().equals(otp)) {
            response.put("success", false);
            response.put("message", "Mã OTP không đúng hoặc đã hết hạn. Vui lòng yêu cầu mã mới.");
            return ResponseEntity.badRequest().body(response);
        }

        PasswordResetCode code = optCode.get();
        code.setIsUsed(true);
        resetCodeRepository.save(code);

        Optional<User> optUser = userRepository.findByEmail(email);
        if (optUser.isEmpty()) {
            response.put("success", false);
            response.put("message", "Không tìm thấy tài khoản.");
            return ResponseEntity.badRequest().body(response);
        }

        User user = optUser.get();
        user.setPassword(newPassword);
        userRepository.save(user);

        response.put("success", true);
        response.put("message", "Mật khẩu đã được đặt lại thành công! Vui lòng đăng nhập.");
        return ResponseEntity.ok(response);
    }
}

package com.hotel.controller.api;

import com.hotel.dto.ApiResponse;
import com.hotel.dto.ForgotPasswordRequest;
import com.hotel.dto.LoginRequest;
import com.hotel.dto.RegisterRequest;
import com.hotel.dto.UserResponse;
import com.hotel.dto.VerifyResetRequest;
import com.hotel.entity.PasswordResetCode;
import com.hotel.entity.User;
import com.hotel.repository.PasswordResetCodeRepository;
import com.hotel.repository.UserRepository;
import com.hotel.service.AuthService;
import com.hotel.service.EmailService;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/auth")
public class AuthApiController {

    private static final Logger log = LoggerFactory.getLogger(AuthApiController.class);
    private static final SecureRandom SECURE_RANDOM = new SecureRandom();

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
            response.put("user", UserResponse.from(user));
            response.put("role", authService.resolveClientRole(user));
            response.put("redirectTo", authService.resolveDefaultRedirect(user));
        } else {
            response.put("authenticated", false);
            response.put("user", null);
        }
        return ResponseEntity.ok(response);
    }

    @PostMapping("/login")
    public ResponseEntity<Map<String, Object>> login(@Valid @RequestBody LoginRequest request,
                                                      jakarta.servlet.http.HttpSession session) {
        User user = authService.login(request.email(), request.password(), session);
        Map<String, Object> response = new HashMap<>();
        if (user != null) {
            response.put("success", true);
            response.put("authenticated", true);
            response.put("message", "Đăng nhập thành công!");
            response.put("user", UserResponse.from(user));
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
    public ResponseEntity<ApiResponse<Void>> register(@Valid @RequestBody RegisterRequest request) {
        try {
            String errorMsg = authService.register(request.fullname(), request.email(), request.password(), request.phone());
            if (errorMsg != null) {
                return ResponseEntity.badRequest().body(ApiResponse.<Void>error(errorMsg));
            }
            return ResponseEntity.ok(ApiResponse.okMessage("Đăng ký thành công! Vui lòng đăng nhập."));
        } catch (Exception ex) {
            log.error("Registration error for email={}", request.email(), ex);
            return ResponseEntity.status(500).body(ApiResponse.<Void>error("Có lỗi hệ thống. Vui lòng thử lại."));
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
    public ResponseEntity<ApiResponse<Void>> forgotPasswordRequest(@Valid @RequestBody ForgotPasswordRequest request) {
        String email = request.email();

        Optional<User> optUser = userRepository.findByEmail(email);
        if (optUser.isEmpty()) {
            // Trả về thành công để tránh enumeration attack
            return ResponseEntity.ok(ApiResponse.okMessage("Nếu email tồn tại, mã OTP sẽ được gửi tới hộp thư của bạn."));
        }

        String otp = String.format("%06d", SECURE_RANDOM.nextInt(1000000));

        PasswordResetCode code = new PasswordResetCode();
        code.setEmail(email);
        code.setCode(otp);
        code.setExpiresAt(LocalDateTime.now().plusMinutes(10));
        code.setIsUsed(false);
        resetCodeRepository.save(code);

        try {
            emailService.sendPasswordResetOtp(email, otp);
        } catch (Exception e) {
            log.error("Failed to send OTP to email={}", email, e);
            return ResponseEntity.status(500).body(ApiResponse.<Void>error("Gửi email thất bại. Vui lòng thử lại."));
        }

        return ResponseEntity.ok(ApiResponse.okMessage("Mã OTP đã được gửi tới email của bạn. Vui lòng kiểm tra hộp thư."));
    }

    // Bước 2: Xác thực OTP + đặt mật khẩu mới
    @PostMapping("/verify-reset")
    public ResponseEntity<ApiResponse<Void>> verifyReset(@Valid @RequestBody VerifyResetRequest request) {
        Optional<PasswordResetCode> optCode = resetCodeRepository
                .findTopByEmailAndIsUsedFalseAndExpiresAtAfterOrderByCreatedAtDesc(request.email(), LocalDateTime.now());

        if (optCode.isEmpty() || !optCode.get().getCode().equals(request.otp())) {
            return ResponseEntity.badRequest().body(ApiResponse.<Void>error("Mã OTP không đúng hoặc đã hết hạn. Vui lòng yêu cầu mã mới."));
        }

        PasswordResetCode code = optCode.get();
        code.setIsUsed(true);
        resetCodeRepository.save(code);

        Optional<User> optUser = userRepository.findByEmail(request.email());
        if (optUser.isEmpty()) {
            return ResponseEntity.badRequest().body(ApiResponse.<Void>error("Không tìm thấy tài khoản."));
        }

        User user = optUser.get();
        user.setPassword(authService.encodePassword(request.newPassword()));
        userRepository.save(user);

        return ResponseEntity.ok(ApiResponse.okMessage("Mật khẩu đã được đặt lại thành công! Vui lòng đăng nhập."));
    }
}

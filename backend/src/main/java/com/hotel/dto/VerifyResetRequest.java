package com.hotel.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record VerifyResetRequest(
        @NotBlank(message = "Email không được để trống.")
        @Email(message = "Email không hợp lệ.")
        String email,

        @NotBlank(message = "Mã OTP không được để trống.")
        String otp,

        @NotBlank(message = "Mật khẩu mới không được để trống.")
        @Size(min = 6, message = "Mật khẩu tối thiểu 6 ký tự.")
        String newPassword
) {
}

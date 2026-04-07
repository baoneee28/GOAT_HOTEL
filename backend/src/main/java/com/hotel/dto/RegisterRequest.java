package com.hotel.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record RegisterRequest(
        @NotBlank(message = "Họ tên không được để trống.")
        String fullname,

        @NotBlank(message = "Email không được để trống.")
        @Email(message = "Email không hợp lệ.")
        String email,

        @NotBlank(message = "Số điện thoại không được để trống.")
        String phone,

        @NotBlank(message = "Mật khẩu không được để trống.")
        @Size(min = 6, message = "Mật khẩu phải có ít nhất 6 ký tự.")
        String password
) {
}

package com.hotel.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record AdminUserUpsertRequest(
        Integer id,
        @Size(max = 100, message = "Họ tên không được vượt quá 100 ký tự.")
        String fullName,
        @Email(message = "Email không hợp lệ.")
        @Size(max = 100, message = "Email không được vượt quá 100 ký tự.")
        String email,
        @Pattern(
                regexp = "^$|^[0-9+\\-\\s]{8,15}$",
                message = "Số điện thoại không hợp lệ."
        )
        String phone,
        @Size(max = 20, message = "Vai trò không hợp lệ.")
        String role,
        @Size(max = 255, message = "Mật khẩu không hợp lệ.")
        String password,
        @Size(max = 255, message = "Đường dẫn ảnh quá dài.")
        String image
) {
}

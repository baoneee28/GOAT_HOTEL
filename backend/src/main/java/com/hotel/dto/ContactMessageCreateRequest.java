package com.hotel.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ContactMessageCreateRequest(
        @NotBlank(message = "Vui lòng nhập họ.")
        @Size(max = 100, message = "Họ không được vượt quá 100 ký tự.")
        String firstName,
        @NotBlank(message = "Vui lòng nhập tên.")
        @Size(max = 100, message = "Tên không được vượt quá 100 ký tự.")
        String lastName,
        @NotBlank(message = "Vui lòng nhập email.")
        @Email(message = "Email không hợp lệ.")
        @Size(max = 150, message = "Email không được vượt quá 150 ký tự.")
        String email,
        @NotBlank(message = "Vui lòng nhập nội dung liên hệ.")
        @Size(max = 4000, message = "Nội dung liên hệ quá dài.")
        String message
) {
}

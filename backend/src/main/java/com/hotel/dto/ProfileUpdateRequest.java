package com.hotel.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record ProfileUpdateRequest(
        @NotBlank(message = "Họ tên không được để trống.")
        @Size(max = 100, message = "Họ tên không được vượt quá 100 ký tự.")
        String fullName,
        @Pattern(
                regexp = "^$|^[0-9+\\-\\s]{8,15}$",
                message = "Số điện thoại không hợp lệ."
        )
        String phone,
        @Size(max = 255, message = "Đường dẫn ảnh đại diện quá dài.")
        String avatar
) {
}

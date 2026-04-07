package com.hotel.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record CouponEventTypeCreateRequest(
        @NotBlank(message = "Tên nhóm không được để trống.")
        @Size(max = 100, message = "Tên nhóm không được vượt quá 100 ký tự.")
        String label,
        @Size(max = 50, message = "Mã nhóm không được vượt quá 50 ký tự.")
        String eventKey,
        @NotBlank(message = "Icon không được để trống.")
        @Size(max = 50, message = "Icon không được vượt quá 50 ký tự.")
        String icon,
        @NotBlank(message = "Màu sắc không được để trống.")
        @Pattern(regexp = "^#[0-9A-Fa-f]{6}$", message = "Màu sắc phải ở định dạng hex #RRGGBB.")
        String color
) {
}

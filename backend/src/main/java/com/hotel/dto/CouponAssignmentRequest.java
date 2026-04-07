package com.hotel.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record CouponAssignmentRequest(
        @NotNull(message = "Người dùng không được để trống.")
        Integer userId,
        String expiresAt,
        @Size(max = 1000, message = "Ghi chú quá dài.")
        String note
) {
}

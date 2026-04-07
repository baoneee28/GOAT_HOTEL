package com.hotel.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record CouponApplyRequest(
        @NotNull(message = "Phòng không được để trống.")
        Integer roomId,

        @NotBlank(message = "Ngày nhận phòng không được để trống.")
        String checkIn,

        @NotBlank(message = "Ngày trả phòng không được để trống.")
        String checkOut,

        Integer userCouponId,
        String couponCode
) {
}

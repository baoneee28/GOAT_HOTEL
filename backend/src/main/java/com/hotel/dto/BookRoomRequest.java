package com.hotel.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

public record BookRoomRequest(
        @NotNull(message = "Phòng không được để trống.")
        @Positive(message = "Phòng không hợp lệ.")
        Integer roomId,
        @NotBlank(message = "Ngày nhận phòng không được để trống.")
        String checkIn,
        @NotBlank(message = "Ngày trả phòng không được để trống.")
        String checkOut,
        @Size(max = 50, message = "Luồng thanh toán không hợp lệ.")
        String paymentFlow,
        @Size(max = 50, message = "Mã giảm giá không hợp lệ.")
        String couponCode
) {
}

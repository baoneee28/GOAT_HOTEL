package com.hotel.dto;

import jakarta.validation.constraints.NotNull;

public record VNPayDemoSuccessRequest(
        @NotNull(message = "Mã booking không được để trống.")
        Integer bookingId,
        String paymentMode
) {
}
